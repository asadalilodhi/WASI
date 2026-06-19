// ============================================================
//  WASI — SUPERVISOR AGENT (Performance-Optimized)
//
//  Changes from original:
//  - Removed intent classification LLM call — replaced with
//    keyword-based detection (saves 1-3s per ORDERING message)
//  - smartTranslate skips for ROMAN-URDU (agents already reply
//    in detected language via prompt instructions)
//  - Parallel API calls where possible
// ============================================================

const { callLLM }               = require('../llm');
const { processMessage,
        translateReply }         = require('./languageAgent');
const { handleMenuQuery }        = require('./menuAgent');
const { handleOrderMessage,
        addItemsToCart,
        removeItemFromCart,
        getCartSummary,
        submitOrder,
        getOrder }               = require('./orderAgent');
const { formatOrderSummary }     = require('./orderUtils');
const { handleDeliveryMessage }  = require('./deliveryAgent');
const { handlePaymentMessage }   = require('./paymentAgent');
const { handleProfileMessage }   = require('./profileAgent');
const { composeTemplate,
        composeAIMessage,
        sendMessage }            = require('./notificationAgent');
const { generateOTP,
        validateOTP,
        hasPendingOTP }          = require('./otpAgent');
const { createSession,
        getSession,
        getSessionByPhone,
        updateState,
        touchSession,
        saveCartSnapshot,
        addToHistory,
        getHistory }       = require('./sessionManager');

const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────
//  HELPER: smart translate
//  Skips API call for ENGLISH. ROMAN-URDU must be translated
//  from hardcoded English system messages.
// ─────────────────────────────────────────────────────────────
async function smartTranslate(text, toLanguage) {
  if (!text) return '';
  if (toLanguage === 'ENGLISH') return text;
  return await translateReply(text, toLanguage);
}

// ─────────────────────────────────────────────────────────────
//  KEYWORD-BASED INTENT DETECTION
//  Replaces LLM call for "ORDERING vs DELIVERY" classification
//  Saves 1-3 seconds per message in ORDERING state
// ─────────────────────────────────────────────────────────────
const MENU_KEYWORDS = /\b(burger|zinger|broast|fries|chips|coke|drink|pepsi|sprite|menu|add|remove|hata|hatao|daal|nikal)\b/i;

function classifyIntent(message) {
  if (MENU_KEYWORDS.test(message)) return 'ORDERING';
  return 'OTHER';
}

// ─────────────────────────────────────────────────────────────
//  CHANGE INTENT DETECTION (Used at Step F)
// ─────────────────────────────────────────────────────────────
async function classifyChangeIntent(message) {
  const prompt = `Classify what the user wants to change in their order based on their message.
Message: "${message}"
Options:
- menu (adding, removing, or changing food items/drinks)
- address (changing delivery location)
- payment (changing payment method)
- name (changing their name)
- phone (changing their phone number)
- none (just saying no, wait, or unclear)

Output ONLY the exact option name in lowercase, nothing else.`;
  try {
    const raw = await callLLM(prompt, [], 20, false);
    return raw.trim().toLowerCase();
  } catch (e) {
    return 'none';
  }
}

// ─────────────────────────────────────────────────────────────
//  RETURNING CUSTOMER CHECK
// ─────────────────────────────────────────────────────────────
async function checkReturningCustomer(phoneNumber) {
  return { isReturning: false, customerName: null, lastOrderId: null };
}

// ─────────────────────────────────────────────────────────────
//  MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────
async function handleIncomingMessage(phoneNumber, rawMessage, tenantId = 'default') {
  const restaurantName = 'WASI Restaurant';
  const turnStart = Date.now();

  // ── Step 1: Find or create session ──────────────────────────
  let session = getSessionByPhone(phoneNumber);
  let sessionId;

  if (!session) {
    sessionId = crypto.randomUUID();
    session   = createSession(sessionId, phoneNumber, tenantId);
  } else {
    sessionId = session.sessionId;
  }

  // ── Step 2: Touch session ────────────────────────────────────
  touchSession(sessionId, async (expiredSession) => {
    const msg = composeTemplate('SESSION_EXPIRED');
    const expiredOrder = getOrder(expiredSession.sessionId);
    sendMessage(expiredOrder?.phoneNumber || expiredSession.phoneNumber, msg);
  });

  // ── Step 3: Detect language ──────────────────────────────────
  // We pass session.language so that languageAgent skips detection if already locked in.
  const { englishMessage, detectedLanguage } = await processMessage(rawMessage, session.language);
  
  // Lock in the language if it's the first real message
  if (!session.language) {
    if (!/^[\d\s]+$/.test(rawMessage.trim())) {
      session.language = detectedLanguage;
    } else {
      session.language = 'ROMAN-URDU'; // Fallback if they start with a number
    }
  }
  const currentLanguage = session.language;


  // ── STATE: INITIATED — send OTP ─────────────────────────────
  if (session.state === 'INITIATED') {
    updateState(sessionId, 'OTP_PENDING');

    const [{ isReturning, customerName }] = await Promise.all([
      checkReturningCustomer(phoneNumber),
    ]);
    const otp = generateOTP(phoneNumber);

    const otpMsg     = composeTemplate('OTP_SEND', { otp });
    const welcomeMsg = composeTemplate(
      isReturning ? 'WELCOME_BACK' : 'WELCOME_NEW',
      { customerName, restaurantName }
    );
    const targetPhone = (getOrder(sessionId) || {}).phoneNumber || phoneNumber;
    sendMessage(targetPhone, otpMsg);

    const reply = await smartTranslate(
      `${welcomeMsg}\n\nPlease enter the OTP sent to your WhatsApp to verify your number.`,
      currentLanguage
    );
    console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
    return { reply, sessionId, orderSubmitted: false, order: null };
  }


  // ── STATE: OTP_PENDING — validate OTP ───────────────────────
  if (session.state === 'OTP_PENDING') {
    const result = validateOTP(phoneNumber, englishMessage);

    if (result.valid) {
      updateState(sessionId, 'ACTIVE');
      const msg = `✅ Identity verified! Welcome to ${restaurantName}. What would you like to order today?`;
      console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
      return { reply: await smartTranslate(msg, currentLanguage), sessionId, orderSubmitted: false, order: null };
    }

    if (result.reason === 'EXPIRED') {
      updateState(sessionId, 'INITIATED');
      console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
      return { reply: await smartTranslate(composeTemplate('OTP_EXPIRED'), currentLanguage), sessionId, orderSubmitted: false, order: null };
    }

    if (result.reason === 'MAX_ATTEMPTS') {
      updateState(sessionId, 'CANCELLED');
      const msg = `Too many incorrect attempts. Please type *hi* to start again.`;
      console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
      return { reply: await smartTranslate(msg, currentLanguage), sessionId, orderSubmitted: false, order: null };
    }

    console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
    return {
      reply: await smartTranslate(composeTemplate('OTP_INVALID', { attempts: result.attemptsLeft }), currentLanguage),
      sessionId, orderSubmitted: false, order: null
    };
  }


  // ── STATE: ACTIVE / ORDERING ─────────────────────────────────
  if (['ACTIVE', 'ORDERING'].includes(session.state)) {
    updateState(sessionId, 'ORDERING');
    addToHistory(sessionId, 'user', englishMessage);
    
    const order = getOrder(sessionId);
    const history = getHistory(sessionId);

    // ── HELPER: process menu result and update order ──
    const processMenuResult = (menuResult) => {
      if (menuResult.selectedItems && menuResult.selectedItems.length > 0) {
        addItemsToCart(sessionId, menuResult.selectedItems);
      }
      // Save pending clarifications to order for persistence across turns
      order.pendingClarifications = menuResult.pendingClarifications || [];
      saveCartSnapshot(sessionId, getOrder(sessionId));
      addToHistory(sessionId, 'assistant', menuResult.reply);
    };

    // STEP A.0: Pending clarifications → ALWAYS route back to Menu Agent
    if (order.pendingClarifications && order.pendingClarifications.length > 0) {
      const currentCart = order.items || [];
      const menuResult = await handleMenuQuery(history, currentCart, currentLanguage, order.pendingClarifications, order.receptionistNotes);
      processMenuResult(menuResult);
      console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
      return { reply: menuResult.reply, sessionId, orderSubmitted: false, order: getOrder(sessionId) };
    }

    // STEP A: Cart empty → Menu Agent
    if (order.items.length === 0) {
      const currentCart = order.items || [];
      const menuResult = await handleMenuQuery(history, currentCart, currentLanguage, [], order.receptionistNotes);
      processMenuResult(menuResult);
      console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
      return { reply: menuResult.reply, sessionId, orderSubmitted: false, order: getOrder(sessionId) };
    }

    // STEP B: No address → keyword intent check + Delivery Agent
    if (!order.deliveryAddress) {
      // OPTIMIZATION: Replaced LLM intent classification with keyword matching
      const intent = classifyIntent(englishMessage);

      if (intent === 'ORDERING') {
        const currentCart = getOrder(sessionId).items || [];
        const menuResult = await handleMenuQuery(history, currentCart, currentLanguage, [], order.receptionistNotes);
        processMenuResult(menuResult);
        console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
        return { reply: menuResult.reply, sessionId, orderSubmitted: false, order: getOrder(sessionId) };
      }

      // Pass the accumulated address so the Brain can append fragments
      const deliveryResult = await handleDeliveryMessage(history, currentLanguage, order._accumulatedAddress || null);
      if (deliveryResult.outOfZone) {
        order.deliveryAddress = null; // Stay in Step B
        order.deliveryFee = 0;
        order._accumulatedAddress = null;
      } else if (deliveryResult.rawAddress) {
        // rawAddress is only non-null when the address is fully confirmed
        order.deliveryAddress = deliveryResult.rawAddress;
        order.deliveryFee     = deliveryResult.deliveryFee;
        order.eta             = deliveryResult.eta;
        order.orderType       = deliveryResult.orderType || 'DELIVERY';
        order._accumulatedAddress = null; // Clear accumulator
        saveCartSnapshot(sessionId, order);
        console.log(`  ✅ [Supervisor] Address saved: ${order.deliveryAddress}`);
      } else {
        // Address not yet confirmed — track the partial address for next turn
        if (deliveryResult.partialAddress) {
          order._accumulatedAddress = deliveryResult.partialAddress;
        }
      }
      if (deliveryResult.orderType) {
        order.orderType = deliveryResult.orderType;
      }
      // If neither outOfZone nor confirmed, stay in Step B (agent is still collecting details)
      addToHistory(sessionId, 'assistant', deliveryResult.reply);
      console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
      return { reply: deliveryResult.reply, sessionId, orderSubmitted: false, order };
    }

    // STEP C: No payment → Payment Agent (inject canonical summary and notes)
    if (!order.paymentMethod) {
      // OPTIMIZATION: Check if user wants to change cart items instead of paying
      const intent = classifyIntent(englishMessage);
      if (intent === 'ORDERING') {
        const currentCart = getOrder(sessionId).items || [];
        const menuResult = await handleMenuQuery(history, currentCart, currentLanguage, [], order.receptionistNotes);
        processMenuResult(menuResult);
        console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
        return { reply: menuResult.reply, sessionId, orderSubmitted: false, order: getOrder(sessionId) };
      }

      const notesStr = (order.receptionistNotes && order.receptionistNotes.length > 0) 
        ? `\nCRITICAL CONSTRAINTS FROM RECEPTIONIST:\n${order.receptionistNotes.map(n => `- ${n}`).join('\n')}\nIf the user requests a method that is forbidden by these constraints, YOU MUST DENY IT.` 
        : '';
      const summaryNote = `CURRENT ORDER STATE (use these numbers exactly):\n${formatOrderSummary(order)}${notesStr}`;
      
      const paymentResult = await handlePaymentMessage(history, order.totalPrice + (order.deliveryFee || 0), currentLanguage, summaryNote);
      if (paymentResult.paymentMethod) {
        order.paymentMethod = paymentResult.paymentMethod;
        order.paymentStatus = paymentResult.paymentStatus;
        saveCartSnapshot(sessionId, order);
        console.log(`  💳 [Supervisor] Payment saved: ${order.paymentMethod}`);
      }
      addToHistory(sessionId, 'assistant', paymentResult.reply);
      console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
      return { reply: paymentResult.reply, sessionId, orderSubmitted: false, order };
    }

    // ────────────────────────────────────────────────────────
    // STEPS D-E: Generative flow for Profile collection
    // ────────────────────────────────────────────────────────

    // STEP D: No customer name → Profile Agent
    if (!order.customerName) {
      // Pass 'name' as the missing field
      const profileResult = await handleProfileMessage(history, 'name', currentLanguage);
      
      if (profileResult.customerName) {
        order.customerName = profileResult.customerName;
        console.log(`  👤 [Supervisor] Name captured: ${order.customerName}`);
        saveCartSnapshot(sessionId, order);
        
        // Silently transition to Step E if successful, without breaking turn
        const phonePrompt = await smartTranslate(`Shukriya ${order.customerName}! 👍\n\nAb aapka **phone number** batao (jaise: 03XX-XXXXXXX):`, currentLanguage);
        addToHistory(sessionId, 'assistant', phonePrompt + '\n[WAITING_FOR_PHONE]');
        console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
        return { reply: phonePrompt, sessionId, orderSubmitted: false, order };
      } else {
        // Fallback: If no name extracted (e.g. conversational question), Mouth handles reply
        const reply = profileResult.reply || await smartTranslate(`Ab sirf **aapka naam** batao:`, currentLanguage);
        addToHistory(sessionId, 'assistant', reply + '\n[WAITING_FOR_NAME]');
        console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
        return { reply, sessionId, orderSubmitted: false, order };
      }
    }

    // STEP E: No phone number → Profile Agent
    if (!order.phoneNumber) {
      // Pass 'phone' as the missing field
      const profileResult = await handleProfileMessage(history, 'phone', currentLanguage);
      
      if (profileResult.phoneNumber) {
        order.phoneNumber = profileResult.phoneNumber;
        console.log(`  📱 [Supervisor] Phone captured: ${order.phoneNumber}`);
        saveCartSnapshot(sessionId, order);
        // Fall through to Step F automatically
      } else {
        // Fallback: If no phone extracted, Mouth handles reply
        const reply = profileResult.reply || await smartTranslate(`Aapka **phone number** batao (jaise: 03XX-XXXXXXX):`, currentLanguage);
        addToHistory(sessionId, 'assistant', reply + '\n[WAITING_FOR_PHONE]');
        console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
        return { reply, sessionId, orderSubmitted: false, order };
      }
    }

    // STEP F: All collected, not yet confirmed → show CODE-GENERATED summary
    if (order.status !== 'REVIEWING' && order.status !== 'SUBMITTED') {
      const lastAssistantMsg = history.filter(h => h.role === 'assistant').pop();
      const isRespondingToConfirm = lastAssistantMsg && lastAssistantMsg.content.includes('[WAITING_FOR_CONFIRM]');
      const isRespondingToChange = lastAssistantMsg && lastAssistantMsg.content.includes('Kya change karna hai');
      
      if (isRespondingToConfirm || isRespondingToChange) {
        const lower = rawMessage.toLowerCase().trim();
        // A "Yes" must be positive and explicitly NOT contain change keywords
        const isYes = isRespondingToConfirm && /^(h[aā]n|yes|ok|confirm|thea?k|bilkul|ji|sure|done|bas|sahi|ready|proceed|y)/.test(lower) && !/(nahi|no|change|add|aur|remove|hata|kardo|coke|burger|fries|broast)/.test(lower);
        
        if (isYes) {
          // CONFIRMED — submit order
          order.status = 'REVIEWING';
          console.log('🛎️ RECEPTIONIST_REVIEW:', JSON.stringify(order, null, 2));
          
          const finalOrder = submitOrder(sessionId);
          updateState(sessionId, 'SUBMITTED');

          const confirmMsg = composeTemplate('ORDER_CONFIRMED', { customerName: order.customerName });
          const translatedConfirm = await smartTranslate(confirmMsg, currentLanguage);
          sendMessage(order.phoneNumber || phoneNumber, translatedConfirm);

          const confirmReply = `✅ **Aapka order restaurant ko bhej diya gaya hai confirmation ke liye!**\n\n📱 ${order.customerName}, aapko jaldi call aayegi ${order.phoneNumber} par.\n\nShukriya WASI se order karne ke liye! 🙏`;
          addToHistory(sessionId, 'assistant', confirmReply);
          console.log('\n🖥️  [Supervisor] Order ready for dashboard push:', finalOrder.sessionId);
          console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
          return { reply: confirmReply, sessionId, orderSubmitted: true, order: finalOrder };
        } else {
          // Not confirmed — process change intent
          const changeType = await classifyChangeIntent(englishMessage);
          
          if (changeType === 'menu') {
            const currentCart = getOrder(sessionId).items || [];
            const menuResult = await handleMenuQuery(history, currentCart, currentLanguage, [], order.receptionistNotes);
            
            // Apply the menu changes (add/remove items) to the cart immediately
            if (menuResult.selectedItems) {
              addItemsToCart(sessionId, menuResult.selectedItems);
            }
            // Save pending clarifications
            order.pendingClarifications = menuResult.pendingClarifications || [];
            saveCartSnapshot(sessionId, getOrder(sessionId));
            addToHistory(sessionId, 'assistant', menuResult.reply);
            console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
            return { reply: menuResult.reply, sessionId, orderSubmitted: false, order: getOrder(sessionId) };
          } else if (changeType === 'address') {
            order.deliveryAddress = null;
            saveCartSnapshot(sessionId, order);
            const reply = await smartTranslate("Thik hai, apna naya delivery address bataiye:", currentLanguage);
            addToHistory(sessionId, 'assistant', reply);
            return { reply, sessionId, orderSubmitted: false, order };
          } else if (changeType === 'payment') {
            order.paymentMethod = null;
            saveCartSnapshot(sessionId, order);
            const reply = await smartTranslate("Thik hai, apna naya payment method bataiye (Cash ya Card):", currentLanguage);
            addToHistory(sessionId, 'assistant', reply);
            return { reply, sessionId, orderSubmitted: false, order };
          } else if (changeType === 'name') {
            order.customerName = null;
            saveCartSnapshot(sessionId, order);
            const reply = await smartTranslate("Thik hai, apna naya naam bataiye:", currentLanguage);
            addToHistory(sessionId, 'assistant', reply);
            return { reply, sessionId, orderSubmitted: false, order };
          } else if (changeType === 'phone') {
            order.phoneNumber = null;
            saveCartSnapshot(sessionId, order);
            const reply = await smartTranslate("Thik hai, apna naya phone number bataiye:", currentLanguage);
            addToHistory(sessionId, 'assistant', reply);
            return { reply, sessionId, orderSubmitted: false, order };
          } else {
            // If they just said "no" or it's unclear, ask what to change
            const changePrompt = `Kya change karna hai? Batao aur main update kar dunga.`;
            addToHistory(sessionId, 'assistant', changePrompt);
            console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
            return { reply: changePrompt, sessionId, orderSubmitted: false, order };
          }
        }
      }

      // First time reaching Step F → show the summary from CODE
      const summary = formatOrderSummary(order);
      const summaryReply = `📋 **FINAL ORDER SUMMARY:**\n\n${summary}\n\n**Confirm karna chahte ho?** (Han/Nahi)`;
      addToHistory(sessionId, 'assistant', summaryReply + '\n[WAITING_FOR_CONFIRM]');
      console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
      return { reply: summaryReply, sessionId, orderSubmitted: false, order };
    }

    // STEP G: Already submitted/reviewing — static response
    const statusReply = order.status === 'SUBMITTED'
      ? '✅ Aapka order submit ho chuka hai! Jaldi process hoga. Shukriya!'
      : '🚧 Aapka order receptionist ke paas review ho raha hai. Please wait...';
    console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
    return { reply: statusReply, sessionId, orderSubmitted: order.status === 'SUBMITTED', order };
  }


  // ── SESSION CLOSED ───────────────────────────────────────────
  const closedMsg = `Your session is already completed. Please type *hi* to start a new order.`;
  console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
  return { reply: await smartTranslate(closedMsg, currentLanguage), sessionId, orderSubmitted: false, order: null };
}


// ─────────────────────────────────────────────────────────────
//  REJECTION HANDLER
// ─────────────────────────────────────────────────────────────
async function handleRejection(sessionId, rejectionReason) {
  const session = getSession(sessionId);
  if (!session) return;

  updateState(sessionId, 'REJECTED');
  const currentLanguage = session.language || 'ROMAN-URDU';
  const order = getOrder(sessionId) || {};
  const targetPhone = order.phoneNumber || session.phoneNumber;

  switch (rejectionReason) {
    case 'ITEM_OUT_OF_STOCK':
      updateState(sessionId, 'ORDERING');
      sendMessage(targetPhone,
        await smartTranslate(composeTemplate('OUT_OF_STOCK', { itemName: 'the requested item' }), currentLanguage)
      );
      break;
    case 'ADDRESS_UNDELIVERABLE':
      updateState(sessionId, 'ORDERING');
      sendMessage(targetPhone,
        await smartTranslate(composeTemplate('ADDRESS_ISSUE'), currentLanguage)
      );
      break;
    default:
      sendMessage(targetPhone,
        await smartTranslate(composeTemplate('ORDER_REJECTED', { reason: rejectionReason }), currentLanguage)
      );
      break;
  }
}

// ─────────────────────────────────────────────────────────────
//  RECEPTIONIST FEEDBACK HANDLER
//  Uses LLM to smartly alter the order state based on feedback
// ─────────────────────────────────────────────────────────────
async function handleReceptionistFeedback(sessionId, feedback) {
  const session = getSession(sessionId);
  if (!session) return;
  const order = getOrder(sessionId);

  const brainPrompt = `You are WASI's internal state manager.
The receptionist rejected this order with the following feedback: "${feedback}"

CURRENT ORDER ITEMS: ${JSON.stringify(order.items)}
CURRENT ADDRESS: ${order.deliveryAddress || 'None'}
CURRENT PAYMENT: ${order.paymentMethod || 'None'}
CURRENT NAME: ${order.customerName || 'None'}
CURRENT PHONE: ${order.phoneNumber || 'None'}
CURRENT DELIVERY FEE: ${order.deliveryFee || 0}
CURRENT ETA: ${order.eta || 'None'}

Determine what data needs to be cleared so the customer can correct it, OR what fields the receptionist explicitly wants to update/override.
Output ONLY a valid JSON object matching this schema:
{
  "removeItems": ["item_id_1", "item_id_2"], // IDs of items that are out of stock or need removal
  "clearAddress": true, // true if the address is incomplete, invalid, or needs changing
  "clearPayment": true, // true if the payment method is rejected
  "clearName": true,    // true if the customer name is invalid or needs to be changed
  "clearPhone": true,   // true if the phone number is invalid or needs to be changed
  "overrides": {        // Any explicit value changes requested by the receptionist (e.g. deliveryFee, eta). Match the exact keys of the order object.
     "deliveryFee": 200
  }
}
If nothing needs to be removed/cleared/overridden, use empty arrays/false/empty object.`;

  let modifications = { removeItems: [], clearAddress: false, clearPayment: false, clearName: false, clearPhone: false, overrides: {} };
  try {
    const jsonReply = await callLLM(brainPrompt, '', 200, true);
    modifications = JSON.parse(jsonReply);
    console.log(`  🧠 [Feedback Brain] Extracted modifications: ${JSON.stringify(modifications)}`);
  } catch (e) {
    console.log(`  ⚠️ [Feedback Brain] JSON extraction failed: ${e.message}`);
  }

  // Apply overrides first so clears can override them if both are set
  if (modifications.overrides && Object.keys(modifications.overrides).length > 0) {
    Object.assign(order, modifications.overrides);
  }

  // Apply modifications
  if (modifications.removeItems && modifications.removeItems.length > 0) {
    modifications.removeItems.forEach(itemId => {
      removeItemFromCart(sessionId, itemId);
    });
  }

  if (modifications.clearAddress) {
    order.deliveryAddress = null;
    order.deliveryFee = 0;
    order.eta = null;
    order.orderType = null;
  }

  if (modifications.clearPayment) {
    order.paymentMethod = null;
    order.paymentStatus = 'pending';
  }

  if (modifications.clearName) {
    order.customerName = null;
  }

  if (modifications.clearPhone) {
    order.phoneNumber = null;
  }

  // Reset status so it routes properly
  order.status = 'BUILDING';
  updateState(sessionId, 'ORDERING');
  
  // Track receptionist constraints
  order.receptionistNotes = order.receptionistNotes || [];
  order.receptionistNotes.push(feedback);

  // Notify customer
  let feedbackMsg = `The restaurant has a note about your order: "${feedback}". I have updated your order accordingly. Please provide the updated information.`;
  
  // Add hidden tags so the deterministic Steps D & E know the user is answering this
  let hiddenTags = '';
  if (modifications.clearName) hiddenTags += '\n[WAITING_FOR_NAME]';
  if (modifications.clearPhone) hiddenTags += '\n[WAITING_FOR_PHONE]';

  addToHistory(sessionId, 'assistant', feedbackMsg + hiddenTags);
  return feedbackMsg;
}

module.exports = { handleIncomingMessage, handleRejection, handleReceptionistFeedback };
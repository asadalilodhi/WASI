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
        getCartSummary,
        submitOrder,
        getOrder }               = require('./orderAgent');
const { formatOrderSummary }     = require('./orderUtils');
const { handleDeliveryMessage }  = require('./deliveryAgent');
const { handlePaymentMessage }   = require('./paymentAgent');
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
const MENU_KEYWORDS = /\b(burger|zinger|broast|fries|chips|coke|drink|menu|add|aur|chahiye|pepsi|sprite|piece|pieces|wala|kardo|karden|de|do|\d)\b/i;

function classifyIntent(message) {
  if (MENU_KEYWORDS.test(message)) return 'ORDERING';
  return 'DELIVERY';
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
    sendMessage(expiredSession.phoneNumber, msg);
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
    sendMessage(phoneNumber, otpMsg);

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
      const menuResult = await handleMenuQuery(history, currentCart, currentLanguage, order.pendingClarifications);
      processMenuResult(menuResult);
      console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
      return { reply: menuResult.reply, sessionId, orderSubmitted: false, order: getOrder(sessionId) };
    }

    // STEP A: Cart empty → Menu Agent
    if (order.items.length === 0) {
      const currentCart = order.items || [];
      const menuResult = await handleMenuQuery(history, currentCart, currentLanguage);
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
        const menuResult = await handleMenuQuery(history, currentCart, currentLanguage);
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

    // STEP C: No payment → Payment Agent (inject canonical summary)
    if (!order.paymentMethod) {
      // Inject the canonical order summary so the payment agent shows correct total
      const summaryNote = { role: 'system', content: `CURRENT ORDER STATE (use these numbers exactly):\n${formatOrderSummary(order)}` };
      const paymentHistory = [...history, summaryNote];
      const paymentResult = await handlePaymentMessage(paymentHistory, order.totalPrice, currentLanguage);
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
    // STEPS D-G: Deterministic flow — NO LLM calls.
    // Name, phone, summary display, and confirmation are all
    // handled by code. This eliminates hallucination entirely.
    // ────────────────────────────────────────────────────────

    // STEP D: No customer name → ask for it (template message)
    if (!order.customerName) {
      // If user just sent a message, it IS the name (previous turn asked for it)
      const lastAssistantMsg = history.filter(h => h.role === 'assistant').pop();
      if (lastAssistantMsg && lastAssistantMsg.content.includes('[WAITING_FOR_NAME]')) {
        // This message IS the name
        order.customerName = rawMessage.trim();
        console.log(`  👤 [Supervisor] Name captured: ${order.customerName}`);
        saveCartSnapshot(sessionId, order);
        // Now ask for phone
        const phonePrompt = `Shukriya ${order.customerName}! 👍\n\nAb aapka **phone number** batao (jaise: 03XX-XXXXXXX):`;
        addToHistory(sessionId, 'assistant', phonePrompt + '\n[WAITING_FOR_PHONE]');
        console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
        return { reply: phonePrompt, sessionId, orderSubmitted: false, order };
      }
      // First time reaching this step → ask for name
      const namePrompt = `Ab sirf **aapka naam** batao:`;
      addToHistory(sessionId, 'assistant', namePrompt + '\n[WAITING_FOR_NAME]');
      console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
      return { reply: namePrompt, sessionId, orderSubmitted: false, order };
    }

    // STEP E: No phone number → ask for it (template message)
    if (!order.phoneNumber) {
      const lastAssistantMsg = history.filter(h => h.role === 'assistant').pop();
      if (lastAssistantMsg && lastAssistantMsg.content.includes('[WAITING_FOR_PHONE]')) {
        // This message IS the phone number
        const phoneRaw = rawMessage.trim().replace(/[^0-9+]/g, '');
        if (phoneRaw.length >= 10) {
          order.phoneNumber = phoneRaw;
          console.log(`  📱 [Supervisor] Phone captured: ${order.phoneNumber}`);
          saveCartSnapshot(sessionId, order);
        } else {
          const retryPrompt = `Yeh valid phone number nahi laga. Please 03XX-XXXXXXX format mein batao:`;
          addToHistory(sessionId, 'assistant', retryPrompt + '\n[WAITING_FOR_PHONE]');
          console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
          return { reply: retryPrompt, sessionId, orderSubmitted: false, order };
        }
      } else {
        // First time reaching this step → ask for phone
        const phonePrompt = `Aapka **phone number** batao (jaise: 03XX-XXXXXXX):`;
        addToHistory(sessionId, 'assistant', phonePrompt + '\n[WAITING_FOR_PHONE]');
        console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
        return { reply: phonePrompt, sessionId, orderSubmitted: false, order };
      }
    }

    // STEP F: All collected, not yet confirmed → show CODE-GENERATED summary
    if (order.status !== 'REVIEWING' && order.status !== 'SUBMITTED') {
      const lastAssistantMsg = history.filter(h => h.role === 'assistant').pop();
      if (lastAssistantMsg && lastAssistantMsg.content.includes('[WAITING_FOR_CONFIRM]')) {
        // User is responding to the confirmation prompt
        const lower = rawMessage.toLowerCase().trim();
        const isYes = /^(h[aā]n|yes|ok|confirm|thea?k|bilkul|ji|sure|done|bas|sahi|ready|proceed|y)/.test(lower);
        
        if (isYes) {
          // CONFIRMED — submit order
          order.status = 'REVIEWING';
          console.log('🛎️ RECEPTIONIST_REVIEW:', JSON.stringify(order, null, 2));
          
          const finalOrder = submitOrder(sessionId);
          updateState(sessionId, 'SUBMITTED');

          const confirmMsg = composeTemplate('ORDER_CONFIRMED', { customerName: order.customerName });
          const translatedConfirm = await smartTranslate(confirmMsg, currentLanguage);
          sendMessage(phoneNumber, translatedConfirm);

          const confirmReply = `✅ **Aapka order restaurant ko bhej diya gaya hai confirmation ke liye!**\n\n📱 ${order.customerName}, aapko jaldi call aayegi ${order.phoneNumber} par.\n\nShukriya WASI se order karne ke liye! 🙏`;
          addToHistory(sessionId, 'assistant', confirmReply);
          console.log('\n🖥️  [Supervisor] Order ready for dashboard push:', finalOrder.sessionId);
          console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
          return { reply: confirmReply, sessionId, orderSubmitted: true, order: finalOrder };
        } else {
          // Not confirmed — ask what they want to change
          const changePrompt = `Kya change karna hai? Batao aur main update kar dunga.`;
          addToHistory(sessionId, 'assistant', changePrompt);
          console.log(`  ⏱️  [Supervisor] Turn completed in ${Date.now() - turnStart}ms`);
          return { reply: changePrompt, sessionId, orderSubmitted: false, order };
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

  switch (rejectionReason) {
    case 'ITEM_OUT_OF_STOCK':
      updateState(sessionId, 'ORDERING');
      sendMessage(session.phoneNumber,
        await smartTranslate(composeTemplate('OUT_OF_STOCK', { itemName: 'the requested item' }), currentLanguage)
      );
      break;
    case 'ADDRESS_UNDELIVERABLE':
      updateState(sessionId, 'ORDERING');
      sendMessage(session.phoneNumber,
        await smartTranslate(composeTemplate('ADDRESS_ISSUE'), currentLanguage)
      );
      break;
    default:
      sendMessage(session.phoneNumber,
        await smartTranslate(composeTemplate('ORDER_REJECTED', { reason: rejectionReason }), currentLanguage)
      );
      break;
  }
}

module.exports = { handleIncomingMessage, handleRejection };
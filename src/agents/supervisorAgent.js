// ============================================================
//  WASI — SUPERVISOR AGENT
//  SRS Ref: Section 3.2, Section 3.3, Section 3.5
//
//  Responsibilities:
//  - Orchestrates the full order pipeline
//  - Routes every incoming customer message to the correct agent
//  - Builds and validates the final Order JSON (SRS 6.2)
//  - Detects returning customers via last_order_id (SRS 3.5)
//  - Pushes completed order to dashboard
//  - Handles rejection re-engagement logic (SRS 8.1)
//
//  This is the ONLY agent the WhatsApp Gateway talks to directly.
//  All sub-agents are called from here.
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
        saveCartSnapshot }       = require('./sessionManager');

const crypto = require('crypto');


// ─────────────────────────────────────────────────────────────
//  RETURNING CUSTOMER CHECK (SRS 3.5)
//  Stub: later query the database for last_order_id
// ─────────────────────────────────────────────────────────────
async function checkReturningCustomer(phoneNumber) {
  // TODO Phase 6: query DB → SELECT last_order_id FROM customers WHERE phone = phoneNumber
  // For now: everyone is treated as new
  return { isReturning: false, customerName: null, lastOrderId: null };
}


// ─────────────────────────────────────────────────────────────
//  MAIN ENTRY POINT
//  Called by WhatsApp Gateway for every inbound message
//  Returns: { reply, sessionId, orderSubmitted, order }
// ─────────────────────────────────────────────────────────────
async function handleIncomingMessage(phoneNumber, rawMessage, tenantId = 'default') {
  const restaurantName = 'WASI Restaurant'; // later: pull from tenant config

  // ── Step 1: Find or create session ──────────────────────────
  let session = getSessionByPhone(phoneNumber);
  let sessionId;

  if (!session) {
    sessionId = crypto.randomUUID();
    session   = createSession(sessionId, phoneNumber, tenantId);
  } else {
    sessionId = session.sessionId;
  }

  // ── Step 2: Touch session (reset inactivity timer) ──────────
  touchSession(sessionId, async (expiredSession) => {
    // Callback when session expires from inactivity
    const msg = composeTemplate('SESSION_EXPIRED');
    sendMessage(expiredSession.phoneNumber, msg);
  });

  // ── Step 3: Detect language ─────────────────────────────────
  const { englishMessage, detectedLanguage } = await processMessage(rawMessage);

  // Update session language
  session.language = detectedLanguage;


  // ── Step 4: Route based on session state ────────────────────

  // ── STATE: INITIATED — send OTP ─────────────────────────────
  if (session.state === 'INITIATED') {
    updateState(sessionId, 'OTP_PENDING');

    const { isReturning, customerName } = await checkReturningCustomer(phoneNumber);
    const otp = generateOTP(phoneNumber);

    // Send OTP message
    const otpMsg = composeTemplate('OTP_SEND', { otp });
    sendMessage(phoneNumber, otpMsg);

    const welcomeContext = isReturning
      ? `Greet ${customerName} back warmly and tell them their OTP has been sent.`
      : `Welcome a new customer warmly to ${restaurantName} and tell them their OTP has been sent.`;

    const welcomeMsg = await composeAIMessage(welcomeContext, detectedLanguage);
    const translatedWelcome = await translateReply(welcomeMsg, detectedLanguage);

    return { reply: translatedWelcome, sessionId, orderSubmitted: false, order: null };
  }


  // ── STATE: OTP_PENDING — validate OTP ───────────────────────
  if (session.state === 'OTP_PENDING') {
    const result = validateOTP(phoneNumber, englishMessage);

    if (result.valid) {
      updateState(sessionId, 'ACTIVE');
      const msg = await composeAIMessage(
        `Tell the customer their identity is verified and ask what they would like to order from ${restaurantName}.`,
        detectedLanguage
      );
      return { reply: await translateReply(msg, detectedLanguage), sessionId, orderSubmitted: false, order: null };
    }

    // Invalid OTP
    if (result.reason === 'EXPIRED') {
      updateState(sessionId, 'INITIATED'); // reset so they get a new OTP on next message
      const msg = composeTemplate('OTP_EXPIRED');
      return { reply: await translateReply(msg, detectedLanguage), sessionId, orderSubmitted: false, order: null };
    }

    if (result.reason === 'MAX_ATTEMPTS') {
      updateState(sessionId, 'CANCELLED');
      const msg = await composeAIMessage(
        'Tell the customer they have exceeded OTP attempts and should type hi to try again.',
        detectedLanguage
      );
      return { reply: await translateReply(msg, detectedLanguage), sessionId, orderSubmitted: false, order: null };
    }

    const msg = composeTemplate('OTP_INVALID', { attempts: result.attemptsLeft });
    return { reply: await translateReply(msg, detectedLanguage), sessionId, orderSubmitted: false, order: null };
  }


  // ── STATE: ACTIVE / ORDERING — main order pipeline ──────────
  if (['ACTIVE', 'ORDERING'].includes(session.state)) {
    updateState(sessionId, 'ORDERING');
    const order = getOrder(sessionId);

    // STEP A: If cart is empty → Menu Agent
    if (order.items.length === 0) {
      const menuResult = await handleMenuQuery(englishMessage, detectedLanguage);
      if (menuResult.selectedItems && menuResult.selectedItems.length > 0) {
        addItemsToCart(sessionId, menuResult.selectedItems);
        saveCartSnapshot(sessionId, getOrder(sessionId));
      }
      const translatedReply = await translateReply(menuResult.reply, detectedLanguage);
      return { reply: translatedReply, sessionId, orderSubmitted: false, order: getOrder(sessionId) };
    }

    // STEP B: If no delivery address → Delivery Agent
    if (!order.deliveryAddress) {
      // Check if customer is adding more items vs confirming address
      const intent = await callLLM(
        'Classify customer intent as exactly one word: ORDERING (adding more food) or DELIVERY (ready to proceed with address/delivery info).',
        englishMessage
      );

      if (intent.trim().toUpperCase().includes('ORDERING')) {
        const menuResult = await handleMenuQuery(englishMessage, detectedLanguage);
        if (menuResult.selectedItems) {
          addItemsToCart(sessionId, menuResult.selectedItems);
          saveCartSnapshot(sessionId, getOrder(sessionId));
        }
        const translatedReply = await translateReply(menuResult.reply, detectedLanguage);
        return { reply: translatedReply, sessionId, orderSubmitted: false, order: getOrder(sessionId) };
      }

      const deliveryResult = await handleDeliveryMessage(englishMessage, detectedLanguage);
      if (deliveryResult.rawAddress) {
        order.deliveryAddress = deliveryResult.rawAddress;
        order.deliveryFee     = deliveryResult.deliveryFee;
        order.eta             = deliveryResult.eta;
        order.orderType       = deliveryResult.orderType;
        saveCartSnapshot(sessionId, order);
      }
      const translatedReply = await translateReply(deliveryResult.reply, detectedLanguage);
      return { reply: translatedReply, sessionId, orderSubmitted: false, order };
    }

    // STEP C: If no payment method → Payment Agent
    if (!order.paymentMethod) {
      const paymentResult = await handlePaymentMessage(englishMessage, order.totalPrice, detectedLanguage);
      if (paymentResult.paymentMethod) {
        order.paymentMethod = paymentResult.paymentMethod;
        order.paymentStatus = paymentResult.paymentStatus;
        saveCartSnapshot(sessionId, order);
      }
      const translatedReply = await translateReply(paymentResult.reply, detectedLanguage);
      return { reply: translatedReply, sessionId, orderSubmitted: false, order };
    }

    // STEP D: All collected → Order Agent for final confirmation
    const orderResult = await handleOrderMessage(sessionId, englishMessage, detectedLanguage);

    if (orderResult.isConfirmed) {
      // ── ORDER COMPLETE ─────────────────────────────────────
      const finalOrder = submitOrder(sessionId);
      updateState(sessionId, 'SUBMITTED');

      // Send confirmation message to customer
      const confirmMsg = composeTemplate('ORDER_CONFIRMED', { customerName: null });
      sendMessage(phoneNumber, await translateReply(confirmMsg, detectedLanguage));

      // TODO Phase 4: push finalOrder to receptionist dashboard via WebSocket
      console.log('\n🖥️  [Supervisor] Order ready for dashboard push:', finalOrder.sessionId);

      return {
        reply: await translateReply(orderResult.reply, detectedLanguage),
        sessionId,
        orderSubmitted: true,
        order: finalOrder,
      };
    }

    const translatedReply = await translateReply(orderResult.reply, detectedLanguage);
    return { reply: translatedReply, sessionId, orderSubmitted: false, order: orderResult.order };
  }


  // ── STATE: SUBMITTED / CONFIRMED / REJECTED / etc. ──────────
  // Session is closed — instruct to restart
  const msg = await composeAIMessage(
    'Tell the customer their session is already completed or closed. Ask them to type hi to start a new order.',
    detectedLanguage
  );
  return { reply: await translateReply(msg, detectedLanguage), sessionId, orderSubmitted: false, order: null };
}


// ─────────────────────────────────────────────────────────────
//  HANDLE REJECTION RE-ENGAGEMENT (SRS 8.1)
//  Called by dashboard when receptionist rejects an order
// ─────────────────────────────────────────────────────────────
async function handleRejection(sessionId, rejectionReason) {
  const session = getSession(sessionId);
  if (!session) return;

  updateState(sessionId, 'REJECTED');
  const detectedLanguage = session.language || 'ROMAN-URDU';

  switch (rejectionReason) {
    case 'ITEM_OUT_OF_STOCK':
      // Re-enter ORDERING — Menu Agent will handle
      updateState(sessionId, 'ORDERING');
      sendMessage(session.phoneNumber,
        await translateReply(
          composeTemplate('OUT_OF_STOCK', { itemName: 'the requested item' }),
          detectedLanguage
        )
      );
      break;

    case 'ADDRESS_UNDELIVERABLE':
      // Re-enter ORDERING — Delivery Agent will handle
      updateState(sessionId, 'ORDERING');
      sendMessage(session.phoneNumber,
        await translateReply(composeTemplate('ADDRESS_ISSUE'), detectedLanguage)
      );
      break;

    case 'DUPLICATE_ORDER':
    case 'NO_RESPONSE':
    default:
      sendMessage(session.phoneNumber,
        await translateReply(composeTemplate('ORDER_REJECTED', { reason: rejectionReason }), detectedLanguage)
      );
      break;
  }
}


module.exports = { handleIncomingMessage, handleRejection };
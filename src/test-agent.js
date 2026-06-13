// ============================================================
//  test-agents.js — Full WASI agent pipeline test
//  Tests all agents: OTP, Language, Menu, Order,
//                    Delivery, Payment, Notification, Supervisor
//
//  Run with: node test-agents.js
//
//  NOTE: Each TEST GROUP is independent.
//  Comment out groups you don't want to run.
// ============================================================

require('dotenv').config();
const readline = require('readline');

const { getLastThinking } = require('./llm');
const { handleMenuQuery }                        = require('./agents/menuAgent');
const { processMessage, translateReply }         = require('./agents/languageAgent');
const { handleOrderMessage, addItemsToCart,
        getCartSummary, submitOrder, getOrder }  = require('./agents/orderAgent');
const { handleDeliveryMessage }                  = require('./agents/deliveryAgent');
const { handlePaymentMessage }                   = require('./agents/paymentAgent');
const { composeTemplate, composeAIMessage,
        sendMessage }                            = require('./agents/notificationAgent');
const { generateOTP, validateOTP }               = require('./agents/otpAgent');
const { createSession, updateState,
        touchSession, getSession }               = require('./agents/sessionManager');
const { handleIncomingMessage }                  = require('./agents/supervisorAgent');


async function humanInput(prompt, defaultValue = null, agentThinking = null) {
  if (!HUMAN_INPUT_MODE) return defaultValue;

  // Show what the agent was assuming before you respond
  if (agentThinking) {
    console.log('\n─────────────────────────────────────────');
    console.log('🧠 Agent is assuming:');
    console.log(agentThinking);
    console.log('─────────────────────────────────────────');
    console.log('💬 You can now correct these assumptions or confirm them.');
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`\n👤 YOU [${prompt}]: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}


function section(title) {
  console.log(`\n${'═'.repeat(55)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(55));
}

function divider() { console.log('─'.repeat(55)); }

async function runTests() {
  console.log('\n🚀 WASI — Full Agent Test Suite\n');


  // ──────────────────────────────────────────────────────────
  //  GROUP 1: OTP / AUTH AGENT
  // ──────────────────────────────────────────────────────────
  section('GROUP 1: OTP / Auth Agent');

  const phone = '+923001234567';
  const otp   = generateOTP(phone);
  console.log(`Generated OTP: ${otp}`);

  const wrongResult = validateOTP(phone, '000000');
  console.log('Wrong OTP result:', wrongResult);  // invalid, 2 attempts left

  const correctResult = validateOTP(phone, otp);
  console.log('Correct OTP result:', correctResult); // valid: true


  // ──────────────────────────────────────────────────────────
  //  GROUP 2: SESSION MANAGER
  // ──────────────────────────────────────────────────────────
  section('GROUP 2: Session Manager');

  const sessionId = 'test-session-001';
  const session   = createSession(sessionId, phone, 'tenant-001');
  console.log('Session created:', session.state);  // INITIATED

  updateState(sessionId, 'ORDERING');
  console.log('State after update:', getSession(sessionId).state); // ORDERING

  // Test grace period timer (fires after 4 min — we just verify it sets)
  touchSession(sessionId, (s) => console.log('Expiry callback fired for:', s.sessionId));
  console.log('Touch session: timer set ✅');


  // ──────────────────────────────────────────────────────────
  //  GROUP 3: LANGUAGE AGENT
  // ──────────────────────────────────────────────────────────
  section('GROUP 3: Language Agent');

  const urdu1 = await processMessage('Mujhe Khana order karna hai');
  console.log(`ROMAN-URDU → Detected: ${urdu1.detectedLanguage}, Translated: ${urdu1.englishMessage}`);

  const urdu2 = await processMessage('Ap ke pas khane ma kia hai?');
  console.log(`ROMAN-URDU → Detected: ${urdu2.detectedLanguage}, Translated: ${urdu2.englishMessage}`);


  // ──────────────────────────────────────────────────────────
  //  GROUP 4: MENU AGENT
  // ──────────────────────────────────────────────────────────
  section('GROUP 4: Menu Agent');

  const m1lang = await processMessage('Ap ke pas kya hai?');
  const m1 = await handleMenuQuery(m1lang.englishMessage, m1lang.detectedLanguage);
  console.log('Browse reply:', m1.reply.slice(0, 120) + '...');
  console.log('Items selected (browsing):', m1.selectedItems); // null

  divider();

  const m2lang = await processMessage('Mujhe 2 Zinger Burger aur 1 bada Coke chahiye');
  const m2 = await handleMenuQuery(m2lang.englishMessage, m2lang.detectedLanguage);
  console.log('Order reply:', m2.reply.slice(0, 120) + '...');
  console.log('Parsed items:', m2.selectedItems); // should be an array


  // ──────────────────────────────────────────────────────────
  //  GROUP 5: ORDER AGENT
  // ──────────────────────────────────────────────────────────
  section('GROUP 5: Order Agent — Cart Building');

  const orderSession = 'order-test-001';
  if (m2.selectedItems) {
    addItemsToCart(orderSession, m2.selectedItems);
    console.log('Cart summary after adding items:');
    console.log(getCartSummary(orderSession));
  } else {
    // Fallback: add items manually for testing
    addItemsToCart(orderSession, [
      { id: '1', name: 'Zinger Burger', qty: 2, price: 350 },
      { id: '7', name: 'Coke (Large)',  qty: 1, price: 120 },
    ]);
    console.log('Cart summary (manual fallback):');
    console.log(getCartSummary(orderSession));
  }


  // ──────────────────────────────────────────────────────────
  //  GROUP 6: DELIVERY AGENT
  // ──────────────────────────────────────────────────────────
  section('GROUP 6: Delivery Agent');

  const d1lang = await processMessage('Mujhe deliver karna hai');
  const d1 = await handleDeliveryMessage(d1lang.englishMessage, d1lang.detectedLanguage);
  console.log('Asking order type → Bot:', d1.reply.slice(0, 120) + '...');
  console.log('Order type:', d1.orderType);

  divider();

  const d2lang = await processMessage('House 5, Gulshan Block 13, Karachi pe deliver kar do');
  const d2 = await handleDeliveryMessage(d2lang.englishMessage, d2lang.detectedLanguage);
  console.log('Address given → Bot:', d2.reply.slice(0, 120) + '...');
  console.log('Address captured:', d2.rawAddress);
  console.log('Zone detected:', d2.zone?.zone || 'No zone match');
  console.log('Delivery fee:', d2.deliveryFee, '| ETA:', d2.eta);


  // ──────────────────────────────────────────────────────────
  //  GROUP 7: PAYMENT AGENT
  // ──────────────────────────────────────────────────────────
  section('GROUP 7: Payment Agent');

  const p1lang = await processMessage('Payment ke kya options hain?');
  const p1 = await handlePaymentMessage(p1lang.englishMessage, 820, p1lang.detectedLanguage);
  console.log('Bot:', p1.reply.slice(0, 120) + '...');

  divider();

  const p2lang = await processMessage('Cash on delivery kar do');
  const p2 = await handlePaymentMessage(p2lang.englishMessage, 820, p2lang.detectedLanguage);
  console.log('Bot:', p2.reply.slice(0, 120) + '...');
  console.log('Payment method:', p2.paymentMethod);
  console.log('Payment status:', p2.paymentStatus);


  // ──────────────────────────────────────────────────────────
  //  GROUP 8: NOTIFICATION AGENT
  // ──────────────────────────────────────────────────────────
  section('GROUP 8: Notification Agent');

  console.log('OTP template:',        composeTemplate('OTP_SEND',        { otp: '847291' }));
  console.log('Welcome new:',         composeTemplate('WELCOME_NEW',     { restaurantName: 'Karachi Bites' }));
  console.log('Welcome back:',        composeTemplate('WELCOME_BACK',    { customerName: 'Ali', restaurantName: 'Karachi Bites' }));
  console.log('Order confirmed:',     composeTemplate('ORDER_CONFIRMED', { customerName: 'Sara' }));
  console.log('Order rejected:',      composeTemplate('ORDER_REJECTED',  { reason: 'Item out of stock' }));
  console.log('Session expired:',     composeTemplate('SESSION_EXPIRED'));

  divider();
  const aiMsg = await composeAIMessage('Tell the customer their Zinger Burger order is confirmed and they will receive a call shortly.');
  console.log('AI-composed message:', aiMsg);

  sendMessage(phone, 'Test notification message ✅');


  // ──────────────────────────────────────────────────────────
  //  GROUP 9: SUPERVISOR — FULL END-TO-END FLOW
  //  Simulates a complete customer conversation from first message
  //  through OTP verification to order submission
  // ──────────────────────────────────────────────────────────
  section('GROUP 9: Supervisor — Full End-to-End Flow');

  const customerPhone = '+923009999999';

  // 9a:
  const r1 = await handleIncomingMessage(customerPhone, 'Haan bhai, mujhe order karna hai');
  console.log('[WASI]:', r1.reply);
  const msg2 = await humanInput('Your response (or press Enter to continue)', '000000', getLastThinking());
  const r1_1 = await handleIncomingMessage(customerPhone, msg2);
  console.log('[WASI]:', r1_1.reply);

  divider();

  // 9b: Wrong OTP
  console.log('[Customer]: 000000 (wrong OTP)');
  const r2 = await handleIncomingMessage(customerPhone, '000000');
  console.log('[WASI]:', r2.reply);

  divider();

  // 9c: Get the generated OTP from store directly for testing
  //     In real use, customer receives it on WhatsApp
  const testOTP = generateOTP(customerPhone); // regenerate for test
  console.log(`[TEST HELPER] Injecting OTP: ${testOTP}`);
  console.log(`[Customer]: ${testOTP}`);
  const r3 = await handleIncomingMessage(customerPhone, testOTP);
  console.log('[WASI]:', r3.reply);

  divider();

  // 9d: Order items
  console.log('\n[Customer]: Ek Zinger Burger aur ek Coke dena');
  const msg4 = await humanInput('What do you want to order?', 'Ek Zinger Burger aur ek Coke dena');
  const r4 = await handleIncomingMessage(customerPhone, msg4);
  console.log('[WASI]:', r4.reply);

  divider();

  // 9e: Give address
  console.log('\n[Customer]: Ghar pe bhejo, House 12, Block 5, Gulshan-e-Iqbal, Karachi');
  const msg5 = await humanInput('Give your address', 'Ghar pe bhejo, House 12, Block 5, Gulshan');
  const r5 = await handleIncomingMessage(customerPhone, msg5);
  console.log('[WASI]:', r5.reply);

  divider();

  // 9f: Choose payment
  console.log('\n[Customer]: Cash on delivery kar do bhai');
  const msg6 = await humanInput('Choose payment method', 'Cash on delivery kar do bhai');
  const r6 = await handleIncomingMessage(customerPhone, msg6);
  console.log('[WASI]:', r6.reply);

  divider();

  // 9g: Confirm order
  console.log('\n[Customer]: Haan bhai confirm kar do');
  const msg7 = await humanInput('Confirm or cancel?', 'Haan bhai confirm kar do');
  const r7 = await handleIncomingMessage(customerPhone, msg7);
  console.log('[WASI]:', r7.reply);
  console.log('\nOrder submitted:', r7.orderSubmitted);
  if (r7.order) {
    console.log('Final order ID:', r7.order.sessionId);
    console.log('Status:', r7.order.status);
    console.log('Items:', JSON.stringify(r7.order.items, null, 2));
    console.log('Address:', r7.order.deliveryAddress);
    console.log('Payment:', r7.order.paymentMethod);
    console.log('Total: Rs.', r7.order.totalPrice);
  }


  console.log('\n\n✅ All tests complete!');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err.message);
  console.error(err.stack);
});

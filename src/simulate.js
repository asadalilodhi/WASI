// ============================================================
//  simulate.js — WASI Live Interactive Simulation
//
//  Run with: node src/simulate.js
//
//  YOU play two roles:
//  1. CUSTOMER  → text like a WhatsApp customer (Roman Urdu/English)
//  2. RECEPTIONIST → review the order and approve/request changes
//
//  The full agent pipeline runs in between:
//  Customer msg → Language Agent → Supervisor → Sub-agents → Reply
//  Once order is submitted → Receptionist reviews → Agents notify customer
// ============================================================

require('dotenv').config();
const readline = require('readline');
const { handleIncomingMessage, handleRejection } = require('./agents/supervisorAgent');
const { generateOTP }                            = require('./agents/otpAgent');
const { getLastThinking }                        = require('./llm');


// ─────────────────────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────────────────────
const CUSTOMER_PHONE    = '+923009999999';
const RESTAURANT_NAME   = 'WASI Restaurant';
const SHOW_THINKING     = process.env.SHOW_THINKING === 'true';


// ─────────────────────────────────────────────────────────────
//  TERMINAL HELPERS
// ─────────────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer.trim()));
  });
}

function print(msg) { console.log(msg); }

function banner(text, char = '═') {
  const line = char.repeat(55);
  print(`\n${line}\n  ${text}\n${line}`);
}

function divider() { print('─'.repeat(55)); }

function customerBubble(msg) {
  print(`\n  📱 CUSTOMER: ${msg}`);
}

function wasiBubble(msg) {
  print(`\n  🤖 WASI: ${msg}\n`);
}

function receptionistPanel(order) {
  banner('📋 RECEPTIONIST DASHBOARD — NEW ORDER', '█');
  print(`  Customer Phone : ${order.sessionId ? CUSTOMER_PHONE : 'N/A'}`);
  print(`  Order Type     : ${order.orderType || 'Not specified'}`);
  print(`  Address        : ${order.deliveryAddress || 'N/A'}`);
  print(`  Payment        : ${order.paymentMethod || 'N/A'}`);
  print(`  Delivery Fee   : Rs. ${order.deliveryFee || 0}`);
  print(`  ETA            : ${order.eta || 'N/A'}`);
  print('\n  ITEMS:');
  if (order.items && order.items.length > 0) {
    order.items.forEach(i => {
      print(`    • ${i.name} ×${i.qty}  →  Rs. ${i.subtotal}`);
    });
  } else {
    print('    (no items captured)');
  }
  print(`\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  print(`  TOTAL          : Rs. ${order.totalPrice || 0}`);
  print(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

function thinkingBlock() {
  const thinking = getLastThinking();
  if (SHOW_THINKING && thinking) {
    print('\n  ┌─ 🧠 Agent Thinking ─────────────────────');
    thinking.split('\n').forEach(line => print(`  │  ${line}`));
    print('  └─────────────────────────────────────────\n');
  }
}


// ─────────────────────────────────────────────────────────────
//  PHASE 1: CUSTOMER CONVERSATION LOOP
//  Runs until order is submitted (orderSubmitted === true)
// ─────────────────────────────────────────────────────────────
async function runCustomerPhase() {
  banner('PHASE 1 — CUSTOMER CONVERSATION', '═');
  print('  You are the CUSTOMER. Type your messages as you would on WhatsApp.');
  print('  Roman Urdu, English, or Urdu script — all work.');
  print('  The WASI agents will handle everything automatically.\n');

  // Step 1: Inject OTP automatically for simulation
  // In real app, customer sends first message unprompted
  print('  [SIM] Injecting first customer message to start session...\n');
  divider();

  let sessionId      = null;
  let orderSubmitted = false;
  let finalOrder     = null;
  let otpInjected    = false;
  let messageCount   = 0;

  while (!orderSubmitted) {
    messageCount++;

    // Get customer input
    const customerMsg = await ask('📱 YOU (Customer): ');
    if (!customerMsg) continue;

    customerBubble(customerMsg);
    print('  ⏳ WASI agents processing...');

    try {
      const result = await handleIncomingMessage(CUSTOMER_PHONE, customerMsg);
      sessionId      = result.sessionId;
      orderSubmitted = result.orderSubmitted;
      finalOrder     = result.order;

      thinkingBlock();
      wasiBubble(result.reply);

      // Auto-inject OTP after first message (simulate OTP delivery)
      if (!otpInjected && messageCount === 1) {
        const otp = generateOTP(CUSTOMER_PHONE);
        print(`\n  [SIM] OTP sent to customer's phone: ${otp}`);
        print(`  [SIM] (In production this goes via WhatsApp — enter it below)\n`);
        otpInjected = true;
      }

      if (orderSubmitted) {
        print('\n  ✅ Order submitted by customer! Moving to receptionist...');
        divider();
      }

    } catch (err) {
      print(`\n  ❌ Agent error: ${err.message}`);
      print('  (Try rephrasing your message)\n');
    }
  }

  return { sessionId, finalOrder };
}


// ─────────────────────────────────────────────────────────────
//  PHASE 2: RECEPTIONIST REVIEW LOOP
//  Receptionist sees order, can confirm or request changes
//  If changes requested → agents go back to customer
// ─────────────────────────────────────────────────────────────
async function runReceptionistPhase(sessionId, finalOrder) {
  banner('PHASE 2 — RECEPTIONIST REVIEW', '═');
  print('  You are now the RECEPTIONIST. Review the order below.\n');

  let orderResolved = false;

  while (!orderResolved) {

    // Show order panel
    receptionistPanel(finalOrder);

    // Receptionist decision
    print('  What do you want to do?');
    print('  [1] Confirm order — customer gets confirmation message');
    print('  [2] Item out of stock — ask customer to choose alternative');
    print('  [3] Address issue — ask customer to re-enter address');
    print('  [4] Duplicate order — close session');
    print('  [5] Custom message — type your own instruction to send back\n');

    const choice = await ask('🖥️  RECEPTIONIST (choose 1-5): ');

    switch (choice) {

      case '1':
        // ── CONFIRM ────────────────────────────────────────
        banner('✅ ORDER CONFIRMED', '─');
        print('  WhatsApp confirmation sent to customer.');
        print('  Message: "Thank you! Your order has been received.');
        print('  Our team will call you shortly to confirm."\n');
        orderResolved = true;
        break;

      case '2':
        // ── ITEM OUT OF STOCK ──────────────────────────────
        banner('⚠️  ITEM OUT OF STOCK', '─');
        const outOfStockItem = await ask('  Which item is out of stock? ');
        print(`\n  Sending message to customer about "${outOfStockItem}"...`);

        // Re-enter customer conversation for alternative
        print('\n  [Switching back to customer conversation for re-ordering]\n');
        divider();

        let reorderDone = false;
        while (!reorderDone) {
          print(`  🤖 WASI → Customer: Sorry, "${outOfStockItem}" is currently unavailable.`);
          print('  🤖 WASI → Customer: Would you like to choose an alternative item?\n');

          const customerReply = await ask('📱 YOU (Customer — choose alternative): ');
          customerBubble(customerReply);
          print('  ⏳ Processing...');

          try {
            const result = await handleIncomingMessage(CUSTOMER_PHONE, customerReply);
            thinkingBlock();
            wasiBubble(result.reply);

            if (result.order && result.order.items.length > 0) {
              finalOrder   = result.order;
              reorderDone  = true;
              print('\n  ✅ Customer updated their order. Returning to receptionist...\n');
            }
          } catch (err) {
            print(`\n  ❌ Agent error: ${err.message}\n`);
          }
        }
        break;

      case '3':
        // ── ADDRESS ISSUE ──────────────────────────────────
        banner('📍 ADDRESS ISSUE', '─');
        print('  Sending address correction request to customer...\n');
        print('  🤖 WASI → Customer: We couldn\'t deliver to your address.');
        print('  🤖 WASI → Customer: Could you please provide a different address?\n');

        const newAddress = await ask('📱 YOU (Customer — new address): ');
        customerBubble(newAddress);
        print('  ⏳ Processing...');

        try {
          const result = await handleIncomingMessage(CUSTOMER_PHONE, newAddress);
          thinkingBlock();
          wasiBubble(result.reply);
          if (result.order) finalOrder = result.order;
          print('  ✅ Address updated. Returning to receptionist...\n');
        } catch (err) {
          print(`\n  ❌ Agent error: ${err.message}\n`);
        }
        break;

      case '4':
        // ── DUPLICATE ORDER ────────────────────────────────
        banner('🚫 DUPLICATE ORDER — SESSION CLOSED', '─');
        print('  Customer notified: "It looks like this is a duplicate order.');
        print('  Your previous order is already being processed."\n');
        orderResolved = true;
        break;

      case '5':
        // ── CUSTOM RECEPTIONIST MESSAGE ────────────────────
        banner('💬 CUSTOM MESSAGE', '─');
        const customInstruction = await ask('🖥️  RECEPTIONIST — Type your instruction to send to customer: ');
        print('\n  ⏳ Sending to customer via WASI agents...\n');

        // Send receptionist's instruction as a message back through supervisor
        try {
          const result = await handleIncomingMessage(CUSTOMER_PHONE, `[Receptionist note]: ${customInstruction}`);
          thinkingBlock();
          wasiBubble(result.reply);
          if (result.order) finalOrder = result.order;
          if (result.orderSubmitted) orderResolved = true;
        } catch (err) {
          print(`\n  ❌ Agent error: ${err.message}\n`);
        }
        break;

      default:
        print('  Please enter a number between 1 and 5.\n');
    }
  }
}


// ─────────────────────────────────────────────────────────────
//  PHASE 3: SIMULATION SUMMARY
// ─────────────────────────────────────────────────────────────
function showSummary(finalOrder) {
  banner('SIMULATION COMPLETE ✅', '█');
  if (!finalOrder) {
    print('  No order data captured.\n');
    return;
  }
  print('  FINAL ORDER SNAPSHOT:');
  print(`  Session ID   : ${finalOrder.sessionId || 'N/A'}`);
  print(`  Status       : ${finalOrder.status    || 'N/A'}`);
  print(`  Items        : ${(finalOrder.items || []).map(i => `${i.name} ×${i.qty}`).join(', ')}`);
  print(`  Address      : ${finalOrder.deliveryAddress || 'N/A'}`);
  print(`  Payment      : ${finalOrder.paymentMethod   || 'N/A'}`);
  print(`  Total        : Rs. ${finalOrder.totalPrice  || 0}`);
  print(`  Submitted At : ${finalOrder.submittedAt     || 'N/A'}`);
  print('');
}


// ─────────────────────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────────────────────
async function main() {
  banner('WASI — LIVE AGENT SIMULATION', '█');
  print(`  Restaurant : ${RESTAURANT_NAME}`);
  print(`  Customer # : ${CUSTOMER_PHONE}`);
  print(`  Thinking   : ${SHOW_THINKING ? 'VISIBLE (SHOW_THINKING=true)' : 'HIDDEN (set SHOW_THINKING=true in .env to see)'}`);
  print('\n  This simulation has 2 phases:');
  print('  Phase 1 → You chat as the CUSTOMER until order is placed');
  print('  Phase 2 → You act as the RECEPTIONIST and handle the order\n');

  try {
    // Phase 1: customer conversation
    const { sessionId, finalOrder } = await runCustomerPhase();

    // Phase 2: receptionist review
    await runReceptionistPhase(sessionId, finalOrder);

    // Summary
    showSummary(finalOrder);

  } catch (err) {
    print(`\n❌ Simulation crashed: ${err.message}`);
    print(err.stack);
  } finally {
    rl.close();
  }
}

main();
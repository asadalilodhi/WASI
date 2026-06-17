// ============================================================
//  simulate.js — WASI Realistic End-to-End Simulation
//
//  Run with:  node src/simulate.js
//
//  Simulates the full WhatsApp ordering experience:
//
//    YOU (Customer) ↔ WASI Agents ↔ YOU (Receptionist)
//
//  Flow:
//    1. You chat as the customer — place your order naturally
//    2. Once all info is collected, WASI submits to receptionist
//    3. You switch hats — review the order as the receptionist
//    4. You can approve OR send feedback (e.g. "need better address")
//    5. If feedback → customer gets notified, you reply, loop continues
//    6. When receptionist confirms → customer gets final notification
//
//  The simulation ends when the receptionist confirms the order.
// ============================================================

require('dotenv').config();
const readline = require('readline');
const { handleIncomingMessage, handleRejection } = require('./agents/supervisorAgent');
const { generateOTP }                            = require('./agents/otpAgent');
const { getLastThinking }                        = require('./llm');

// ─────────────────────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────────────────────
const CUSTOMER_PHONE  = '+923009999999';
const RESTAURANT_NAME = 'WASI Restaurant';
const SHOW_THINKING   = process.env.SHOW_THINKING === 'true';

// ─────────────────────────────────────────────────────────────
//  TERMINAL UI
// ─────────────────────────────────────────────────────────────
const rl = readline.createInterface({
  input:  process.stdin,
  output: process.stdout,
});

function ask(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, answer => resolve(answer.trim()));
  });
}

const CLR = {
  reset:   '\x1b[0m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',
  cyan:    '\x1b[36m',
  yellow:  '\x1b[33m',
  magenta: '\x1b[35m',
  red:     '\x1b[31m',
  bold:    '\x1b[1m',
  white:   '\x1b[37m',
  bg:      '\x1b[44m',
};

function print(msg = '') { console.log(msg); }

function header(text) {
  const line = '━'.repeat(58);
  print(`\n${CLR.cyan}${line}${CLR.reset}`);
  print(`${CLR.bold}  ${text}${CLR.reset}`);
  print(`${CLR.cyan}${line}${CLR.reset}\n`);
}

function subheader(text) {
  print(`\n${CLR.dim}  ── ${text} ${'─'.repeat(Math.max(0, 45 - text.length))}${CLR.reset}\n`);
}

function customerMsg(msg)     { print(`  ${CLR.green}📱 Customer:${CLR.reset}  ${msg}`); }
function wasiMsg(msg)         { print(`  ${CLR.cyan}🤖 WASI:${CLR.reset}      ${msg}\n`); }
function receptionistMsg(msg) { print(`  ${CLR.magenta}🖥️  Receptionist:${CLR.reset} ${msg}`); }
function systemNote(msg)      { print(`  ${CLR.dim}${msg}${CLR.reset}`); }

function showThinking() {
  const thinking = getLastThinking();
  if (SHOW_THINKING && thinking) {
    print(`${CLR.dim}  ┌─ 🧠 Agent Thinking ─────────────────────────`);
    thinking.split('\n').forEach(line => print(`  │  ${line}`));
    print(`  └────────────────────────────────────────────${CLR.reset}\n`);
  }
}

function orderCard(order) {
  const line = '━'.repeat(50);
  print(`\n  ${CLR.yellow}${line}${CLR.reset}`);
  print(`  ${CLR.bold}${CLR.yellow}  📋  ORDER RECEIVED${CLR.reset}`);
  print(`  ${CLR.yellow}${line}${CLR.reset}`);
  print(`  ${CLR.dim}Phone:${CLR.reset}     ${CUSTOMER_PHONE}`);
  print(`  ${CLR.dim}Type:${CLR.reset}      ${order.orderType || 'Delivery'}`);
  print(`  ${CLR.dim}Address:${CLR.reset}   ${order.deliveryAddress || '—'}`);
  print(`  ${CLR.dim}Payment:${CLR.reset}   ${order.paymentMethod || '—'}`);
  print(`  ${CLR.dim}Del. Fee:${CLR.reset}  Rs. ${order.deliveryFee || 0}`);
  print(`  ${CLR.dim}ETA:${CLR.reset}       ${order.eta || '—'}`);
  print();
  print(`  ${CLR.bold}  Items:${CLR.reset}`);
  if (order.items && order.items.length > 0) {
    order.items.forEach(i => {
      print(`    • ${i.name}  ×${i.qty}  →  Rs. ${i.subtotal}`);
    });
  } else {
    print(`    ${CLR.dim}(no items)${CLR.reset}`);
  }
  print(`  ${'─'.repeat(40)}`);
  print(`  ${CLR.bold}  TOTAL: Rs. ${order.totalPrice || 0}${CLR.reset}`);
  print(`  ${CLR.yellow}${line}${CLR.reset}\n`);
}


// ─────────────────────────────────────────────────────────────
//  PHASE 1: CUSTOMER CONVERSATION
//  You chat as the customer until the order is fully submitted.
//  The OTP is auto-injected (printed so you can enter it).
// ─────────────────────────────────────────────────────────────
async function customerPhase() {
  header('PHASE 1 — You are the CUSTOMER');
  print('  Chat naturally, like you would on WhatsApp.');
  print('  Roman Urdu, English, or Urdu — all work.');
  print('  Type your messages below. The agents handle the rest.\n');

  let sessionId      = null;
  let orderSubmitted = false;
  let finalOrder     = null;
  let otpShown       = false;
  let turnCount      = 0;

  while (!orderSubmitted) {
    const input = await ask(`  ${CLR.green}📱 You:${CLR.reset} `);
    if (!input) continue;

    turnCount++;
    customerMsg(input);
    systemNote('  ⏳ Agents processing...');

    try {
      const result = await handleIncomingMessage(CUSTOMER_PHONE, input);
      sessionId      = result.sessionId;
      orderSubmitted = result.orderSubmitted;
      finalOrder     = result.order;

      showThinking();
      wasiMsg(result.reply);

      // Show OTP after first message so user can enter it
      if (!otpShown && turnCount === 1) {
        const otp = generateOTP(CUSTOMER_PHONE);
        print(`  ${CLR.yellow}💡 [SIM] Your OTP is: ${CLR.bold}${otp}${CLR.reset}`);
        print(`  ${CLR.dim}     (In production this arrives via WhatsApp)${CLR.reset}\n`);
        otpShown = true;
      }

    } catch (err) {
      print(`  ${CLR.red}❌ Error: ${err.message}${CLR.reset}`);
      print(`  ${CLR.dim}  Try rephrasing.${CLR.reset}\n`);
    }
  }

  return { sessionId, finalOrder };
}


// ─────────────────────────────────────────────────────────────
//  PHASE 2: RECEPTIONIST REVIEW
//  You switch hats — you're now the restaurant receptionist.
//  You can confirm the order, or send feedback back to the
//  customer (which re-enters the customer conversation loop).
// ─────────────────────────────────────────────────────────────
async function receptionistPhase(sessionId, order) {
  header('PHASE 2 — You are the RECEPTIONIST');
  print('  A new order just came in. Review it below.\n');

  let confirmed = false;

  while (!confirmed) {
    orderCard(order);

    print('  What would you like to do?\n');
    print(`    ${CLR.bold}1${CLR.reset}  ✅  Confirm — looks good, I'll call to confirm`);
    print(`    ${CLR.bold}2${CLR.reset}  💬  Send feedback to customer (e.g. "need more address detail")`);
    print(`    ${CLR.bold}3${CLR.reset}  🚫  Reject order\n`);

    const choice = await ask(`  ${CLR.magenta}🖥️  You:${CLR.reset} `);

    switch (choice) {

      // ── CONFIRM ──────────────────────────────────────────
      case '1': {
        confirmed = true;

        subheader('ORDER CONFIRMED');
        receptionistMsg(`Order confirmed. I'll call the customer to verify.`);

        // Notify customer
        print();
        systemNote('  📤 Sending confirmation to customer via WhatsApp...\n');
        wasiMsg(
          `✅ Great news! ${RESTAURANT_NAME} has received your order. ` +
          `A team member will call you shortly at ${CUSTOMER_PHONE} to confirm. ` +
          `Thank you for ordering with WASI! 🎉`
        );
        break;
      }

      // ── SEND FEEDBACK → back to customer ─────────────────
      case '2': {
        const feedback = await ask(`\n  ${CLR.magenta}🖥️  Your feedback to customer:${CLR.reset} `);
        if (!feedback) break;

        receptionistMsg(feedback);
        systemNote('\n  📤 Sending feedback to customer via WASI agents...\n');

        // Route feedback through the agent pipeline as if WASI is relaying it
        subheader('CUSTOMER CONVERSATION (feedback loop)');
        print(`  ${CLR.dim}The customer received your message. They're replying...${CLR.reset}\n`);

        // Show what the customer sees (the receptionist's feedback phrased by WASI)
        const feedbackMsg = `The restaurant has a note about your order: "${feedback}". Could you please provide the updated information?`;
        wasiMsg(feedbackMsg);

        // Inject this context into the session history so agents know what's going on
        const { updateState, addToHistory } = require('./agents/sessionManager');
        updateState(sessionId, 'ORDERING');
        addToHistory(sessionId, 'assistant', feedbackMsg);
        
        // Also reset the order status so orderAgent doesn't block it
        order.status = 'CONFIRMING';

        // Customer replies
        let resolved = false;
        while (!resolved) {
          const customerReply = await ask(`  ${CLR.green}📱 You (Customer):${CLR.reset} `);
          if (!customerReply) continue;

          customerMsg(customerReply);
          systemNote('  ⏳ Agents processing...');

          try {
            const result = await handleIncomingMessage(CUSTOMER_PHONE, customerReply);
            showThinking();
            wasiMsg(result.reply);

            // Update order if agents captured new info
            if (result.order) {
              // Merge updated fields back
              if (result.order.deliveryAddress) order.deliveryAddress = result.order.deliveryAddress;
              if (result.order.deliveryFee)     order.deliveryFee     = result.order.deliveryFee;
              if (result.order.eta)             order.eta             = result.order.eta;
              if (result.order.orderType)       order.orderType       = result.order.orderType;
              if (result.order.paymentMethod)   order.paymentMethod   = result.order.paymentMethod;
              if (result.order.items && result.order.items.length > 0) {
                order.items      = result.order.items;
                order.totalPrice = result.order.totalPrice;
              }
            }

            resolved = true;
            print();
            systemNote('  📤 Updated info sent back to receptionist.\n');

          } catch (err) {
            print(`  ${CLR.red}❌ Error: ${err.message}${CLR.reset}\n`);
          }
        }

        subheader('Back to RECEPTIONIST');
        print('  The customer responded. Updated order below:\n');
        break;
      }

      // ── REJECT ───────────────────────────────────────────
      case '3': {
        const reason = await ask(`\n  ${CLR.magenta}🖥️  Rejection reason:${CLR.reset} `);
        confirmed = true;

        subheader('ORDER REJECTED');
        receptionistMsg(`Order rejected: ${reason || 'No reason given'}`);

        systemNote('\n  📤 Notifying customer...\n');
        wasiMsg(
          `We're sorry, ${RESTAURANT_NAME} was unable to process your order` +
          `${reason ? ': ' + reason : ''}. ` +
          `Please type *hi* to start a new order.`
        );
        break;
      }

      default:
        print(`  ${CLR.dim}Please enter 1, 2, or 3.${CLR.reset}\n`);
    }
  }
}


// ─────────────────────────────────────────────────────────────
//  SUMMARY
// ─────────────────────────────────────────────────────────────
function showSummary(order) {
  header('SIMULATION COMPLETE ✅');
  if (!order) {
    print('  No order data captured.\n');
    return;
  }
  print(`  ${CLR.dim}Session:${CLR.reset}    ${order.sessionId || '—'}`);
  print(`  ${CLR.dim}Status:${CLR.reset}     ${order.status || '—'}`);
  print(`  ${CLR.dim}Items:${CLR.reset}      ${(order.items || []).map(i => `${i.name} ×${i.qty}`).join(', ') || '—'}`);
  print(`  ${CLR.dim}Address:${CLR.reset}    ${order.deliveryAddress || '—'}`);
  print(`  ${CLR.dim}Payment:${CLR.reset}    ${order.paymentMethod || '—'}`);
  print(`  ${CLR.dim}Total:${CLR.reset}      Rs. ${order.totalPrice || 0}`);
  print(`  ${CLR.dim}Submitted:${CLR.reset}  ${order.submittedAt || '—'}`);
  print();
}


// ─────────────────────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────────────────────
async function main() {
  print();
  header(`WASI — Live Simulation`);
  print(`  ${CLR.dim}Restaurant:${CLR.reset}  ${RESTAURANT_NAME}`);
  print(`  ${CLR.dim}Customer #:${CLR.reset}  ${CUSTOMER_PHONE}`);
  print(`  ${CLR.dim}Thinking:${CLR.reset}    ${SHOW_THINKING ? 'Visible' : 'Hidden'}`);
  print();
  print('  This simulation has two phases:');
  print(`    ${CLR.bold}Phase 1${CLR.reset} — You chat as the ${CLR.green}CUSTOMER${CLR.reset} and place an order`);
  print(`    ${CLR.bold}Phase 2${CLR.reset} — You review as the ${CLR.magenta}RECEPTIONIST${CLR.reset} and confirm/send feedback`);
  print();
  print(`  ${CLR.dim}The back-and-forth continues until the receptionist confirms.${CLR.reset}`);

  try {
    const { sessionId, finalOrder } = await customerPhase();
    await receptionistPhase(sessionId, finalOrder);
    showSummary(finalOrder);
  } catch (err) {
    print(`\n  ${CLR.red}❌ Simulation crashed: ${err.message}${CLR.reset}`);
    print(err.stack);
  } finally {
    rl.close();
  }
}

main();
// ============================================================
//  WASI — PAYMENT AGENT
//  SRS Ref: Section 3.2, FR-C08, Section 7.4
//
//  Responsibilities:
//  - Collect payment method preference from customer
//  - Handle COD confirmation (default)
//  - Initiate online payment flow (JazzCash / Easypaisa / card)
//  - Return payment method and status to Supervisor
//
//  Note: Actual JazzCash/Easypaisa API integration is Phase 2.
//  For now, we collect preference and set status to 'pending'.
//
//  No provider switching needed here.
//  Always calls callLLM() from llm.js — switching happens there.
// ============================================================

const { callLLMChat } = require('../llm');

// ─────────────────────────────────────────────────────────────
//  PAYMENT METHODS
//  Later: enabled methods pulled from tenant config (Section 6.4)
// ─────────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'COD',       label: 'Cash on Delivery',  enabled: true  },
  { id: 'JazzCash',  label: 'JazzCash',           enabled: true  },
  { id: 'Easypaisa', label: 'Easypaisa',          enabled: true  },
  { id: 'card',      label: 'Credit/Debit Card',  enabled: false }, // disabled by default
];

function getEnabledMethods() {
  return PAYMENT_METHODS.filter(m => m.enabled);
}


// ─────────────────────────────────────────────────────────────
//  MAIN: HANDLE PAYMENT MESSAGE
// ─────────────────────────────────────────────────────────────
async function handlePaymentMessage(customerMessage, orderTotal, detectedLanguage = 'ROMAN-URDU') {
  const enabledMethods = getEnabledMethods();

  const systemPrompt = `
    You are the Payment Agent for WASI, a WhatsApp food ordering assistant.

    Order total: Rs.${orderTotal}

    Available payment methods:
    ${enabledMethods.map((m, i) => `${i + 1}. ${m.label}`).join('\n')}

    Your job:
    1. Present the available payment methods clearly
    2. Ask the customer to choose one
    3. For Cash on Delivery: confirm it will be collected at doorstep
    4. For JazzCash / Easypaisa: inform them the restaurant will send a
       payment request to their mobile number after order confirmation
       (actual payment link integration coming in Phase 2)
    5. For card: inform them this option is currently unavailable

    Always reply in ${detectedLanguage}.

    When customer selects a method, end your reply with:
    PAYMENT_METHOD: <COD | JazzCash | Easypaisa | card>
    PAYMENT_STATUS: <pending | initiated>
  `;

  const reply = await callLLMChat(systemPrompt, customerMessage);

  // Parse signals
  const methodMatch = reply.match(/PAYMENT_METHOD:\s*(COD|JazzCash|Easypaisa|card)/);
  const statusMatch = reply.match(/PAYMENT_STATUS:\s*(pending|initiated)/);

  const paymentMethod = methodMatch ? methodMatch[1].trim() : null;
  const paymentStatus = statusMatch ? statusMatch[1].trim() : 'pending';

  // Clean reply
  const cleanReply = reply
    .replace(/PAYMENT_METHOD:.*$/m, '')
    .replace(/PAYMENT_STATUS:.*$/m, '')
    .trim();

  return {
    reply: cleanReply,
    paymentMethod,      // 'COD' | 'JazzCash' | 'Easypaisa' | 'card' | null
    paymentStatus,      // 'pending' | 'initiated'
    enabledMethods,
  };
}

module.exports = { handlePaymentMessage, getEnabledMethods };
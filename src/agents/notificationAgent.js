// ============================================================
//  WASI — NOTIFICATION AGENT
//  SRS Ref: Section 3.2, FR-C12, Section 8.4
//
//  Responsibilities:
//  - Compose and send ALL outbound WhatsApp messages to customer
//  - Manage OTP delivery messages
//  - Send order confirmations, rejections, session expiry notices
//  - Respect WhatsApp 24-hour session window (SRS 8.4)
//
//  NOTE: Actual WhatsApp sending is handled by Gateway Agent.
//  This agent COMPOSES the message text — Gateway sends it.
//  For now, messages are returned as strings for testing.
//  Phase 5 wires this to the actual WhatsApp webhook.
// ============================================================

const { callLLM } = require('../llm');

// ─────────────────────────────────────────────────────────────
//  MESSAGE TEMPLATES
//  SRS 5.6: All customer messages must be templated, not hardcoded
//  Later: pull these from tenant config in database (Section 6.4)
// ─────────────────────────────────────────────────────────────
const TEMPLATES = {
  OTP_SEND:         (otp) => `Your WASI verification code is: *${otp}*\nThis code expires in 5 minutes.`,
  OTP_INVALID:      () => `That code doesn't match. Please try again. You have {attempts} attempts remaining.`,
  OTP_EXPIRED:      () => `Your verification code has expired. Type *hi* to start again.`,
  SESSION_EXPIRED:  () => `Your session timed out due to inactivity. Type *hi* to start a new order.`,
  ORDER_CONFIRMED:  (name) => `Thank you${name ? ', ' + name : ''}! 🎉 Your order has been received.\nOur team will call you shortly to confirm. Please keep your phone nearby.`,
  ORDER_REJECTED:   (reason) => `We're sorry, we couldn't process your order.\nReason: ${reason}\nType *hi* to try again.`,
  WELCOME_NEW:      (restaurantName) => `👋 Welcome to *${restaurantName}*!\nI'm WASI, your AI ordering assistant. Let's get your order started!`,
  WELCOME_BACK:     (name, restaurantName) => `👋 Welcome back${name ? ', ' + name : ''}! Great to see you at *${restaurantName}* again.\nWould you like to repeat your last order, or start fresh?`,
  OUT_OF_STOCK:     (item) => `Sorry, *${item}* is currently unavailable. Please choose a different item.`,
  ADDRESS_ISSUE:    () => `We couldn't deliver to that address. Please provide a different address or choose Takeaway.`,
};


// ─────────────────────────────────────────────────────────────
//  COMPOSE TEMPLATE MESSAGE
//  For predefined situations — uses templates above
// ─────────────────────────────────────────────────────────────
function composeTemplate(type, params = {}) {
  switch (type) {
    case 'OTP_SEND':        return TEMPLATES.OTP_SEND(params.otp);
    case 'OTP_INVALID':     return TEMPLATES.OTP_INVALID().replace('{attempts}', params.attempts || '?');
    case 'OTP_EXPIRED':     return TEMPLATES.OTP_EXPIRED();
    case 'SESSION_EXPIRED': return TEMPLATES.SESSION_EXPIRED();
    case 'ORDER_CONFIRMED': return TEMPLATES.ORDER_CONFIRMED(params.customerName);
    case 'ORDER_REJECTED':  return TEMPLATES.ORDER_REJECTED(params.reason || 'Unknown reason');
    case 'WELCOME_NEW':     return TEMPLATES.WELCOME_NEW(params.restaurantName || 'our restaurant');
    case 'WELCOME_BACK':    return TEMPLATES.WELCOME_BACK(params.customerName, params.restaurantName || 'our restaurant');
    case 'OUT_OF_STOCK':    return TEMPLATES.OUT_OF_STOCK(params.itemName);
    case 'ADDRESS_ISSUE':   return TEMPLATES.ADDRESS_ISSUE();
    default:                return 'Something went wrong. Please type *hi* to restart.';
  }
}


// ─────────────────────────────────────────────────────────────
//  COMPOSE AI MESSAGE
//  For context-aware messages the LLM generates dynamically
// ─────────────────────────────────────────────────────────────
async function composeAIMessage(context, detectedLanguage = 'ROMAN-URDU') {
  const systemPrompt = `
    You are the Notification Agent for WASI, a WhatsApp food ordering assistant.
    Compose a clear, friendly WhatsApp message based on the context provided.
    Keep it concise — WhatsApp messages should be short and easy to read.
    Use *bold* for emphasis where needed (WhatsApp markdown).
    Always write in ${detectedLanguage}.
    Return ONLY the message text. No explanation, no quotes.
  `;

  return await callLLM(systemPrompt, context);
}


let customSender = null;

function setWhatsAppSender(fn) {
  customSender = fn;
}

// ─────────────────────────────────────────────────────────────
//  SEND MESSAGE (stub — wired to Gateway in Phase 5)
//  For now: logs the message and returns it
// ─────────────────────────────────────────────────────────────
async function sendMessage(phoneNumber, message) {
  console.log(`\n📤 [NotificationAgent] To: ${phoneNumber}`);
  console.log(`   Message: ${message}`);
  
  if (customSender) {
    try {
      await customSender(phoneNumber, message);
    } catch (e) {
      console.error('Failed to send via WhatsApp:', e);
    }
  }
  
  return { delivered: true, message, to: phoneNumber };
}


module.exports = { composeTemplate, composeAIMessage, sendMessage, TEMPLATES, setWhatsAppSender };
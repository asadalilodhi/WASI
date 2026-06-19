// ============================================================
//  WASI — PAYMENT AGENT (Performance-Optimized)
//
//  Changes: Compressed prompt, uses callLLM, max_tokens cap
// ============================================================

const { callLLM } = require('../llm');

// ─────────────────────────────────────────────────────────────
//  PAYMENT METHODS
// ─────────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'COD',       label: 'Cash on Delivery',  enabled: true  },
  { id: 'JazzCash',  label: 'JazzCash',           enabled: true  },
  { id: 'Easypaisa', label: 'Easypaisa',          enabled: true  },
  { id: 'card',      label: 'Credit/Debit Card',  enabled: false },
];

function getEnabledMethods() {
  return PAYMENT_METHODS.filter(m => m.enabled);
}

// Pre-build methods string once
const METHODS_STRING = getEnabledMethods().map((m, i) => `${i + 1}. ${m.label}`).join('\n');


// ─────────────────────────────────────────────────────────────
//  MAIN: HANDLE PAYMENT MESSAGE
// ─────────────────────────────────────────────────────────────
async function handlePaymentMessage(conversationHistory, orderTotal, detectedLanguage = 'ROMAN-URDU', systemNotes = '') {
  // --- STEP 1: THE BRAIN (Data Extraction) ---
  const brainPrompt = `You are a strict data-extraction parser for WASI food delivery.
Your ONLY job is to read the user's latest message and extract the payment method they chose.

PAYMENT OPTIONS:
${METHODS_STRING}

INSTRUCTIONS:
Extract the payment method the user explicitly requested.
Valid methods: "COD", "JazzCash", "Easypaisa", "card".
- Users might refer to a method by its index number (e.g. "1 karden", "option 2") or by its name. You MUST map these to the correct valid method ID.
- If the user asks a conversational question (e.g., "what is easypaisa?", "is card available?"), or if their message is unclear or just "ok", set it to null so the conversational agent can respond.

You MUST output ONLY a valid JSON object matching this schema:
{
  "paymentMethod": "COD",
  "paymentStatus": "initiated"
}
If a value is not yet known, OR if the requested method violates a CRITICAL CONSTRAINT from the receptionist, set it to null.

${systemNotes}`;

  // Give the Brain the last assistant message + last user message for context
  const lastAssistant = conversationHistory.filter(msg => msg.role === 'assistant').pop();
  const lastUser = conversationHistory.filter(msg => msg.role === 'user').pop();
  const brainMessages = [lastAssistant, lastUser].filter(Boolean);

  let extracted = { paymentMethod: null, paymentStatus: 'pending' };
  
  try {
    const brainReply = await callLLM(brainPrompt, brainMessages, 150, true);
    const parsed = JSON.parse(brainReply);
    if (parsed) {
      extracted = { ...extracted, ...parsed };
      console.log(`  🧠 [Payment Brain] Extracted: ${JSON.stringify(extracted)}`);
    }
  } catch (e) {
    console.log(`  ⚠️ [Payment Brain] Failed to extract JSON. Error: ${e.message}`);
  }

  // --- STEP 2: THE MOUTH (Conversation Generation) ---
  const mouthPrompt = `You are WASI's payment agent for WhatsApp food ordering.

CURRENT EXTRACTED STATE:
Payment Method: ${extracted.paymentMethod || 'Not Chosen'}
Order total: Rs.${orderTotal}

PAYMENT OPTIONS:
${METHODS_STRING}

RULES:
- If a method isn't chosen, present options and ask customer to choose.
- COD: collected at doorstep.
- JazzCash/Easypaisa: restaurant sends payment request after confirmation.
- Card: currently unavailable.
- CRITICAL: NEVER summarize the user's order cart or total price in a formatted list. Another system handles that. Only talk about payment details.
- If they chose a method, confirm it politely.

${systemNotes}

Reply in ${detectedLanguage}.`;

  const cleanReply = await callLLM(mouthPrompt, conversationHistory, 200, false);

  return {
    reply: cleanReply,
    paymentMethod: extracted.paymentMethod,
    paymentStatus: extracted.paymentStatus,
    enabledMethods: getEnabledMethods(),
  };
}

module.exports = { handlePaymentMessage, getEnabledMethods };
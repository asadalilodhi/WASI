// ============================================================
//  WASI — LANGUAGE AGENT
//  This is the ONE file with its own provider switching.
//
//  WHY: languageAgent uses Featherless (open-source multilingual
//  models) instead of AI/ML API — they serve different purposes.
//
//  CURRENT STATE: Both detection and translation use Groq (llm.js)
//  since we don't have Featherless key yet.
//
//  SWITCHING GUIDE (after kickoff stream):
//  Step 1 → Get Featherless API key + promo code
//  Step 2 → Add to .env: FEATHERLESS_API_KEY=your_key_here
//  Step 3 → In llm.js: uncomment callFeatherless() + its export
//  Step 4 → In THIS file: follow the two swap comments below
//            (one in the require line, one in detectLanguage fn)
//  Step 5 → Translation stays on Groq/AI/ML — no change needed
// ============================================================

// ─── ACTIVE: using callLLM from llm.js (Groq right now) ─────
const { callLLM } = require('../llm');

// ─── PAUSED: swap above line to this after kickoff stream ────
// const { callLLM, callFeatherless } = require('../llm');


// ─────────────────────────────────────────────────────────────
//  STEP 1: DETECT LANGUAGE
//  Figures out if customer is writing in English, Urdu, or Sindhi
// ─────────────────────────────────────────────────────────────
async function detectLanguage(message) {
  const systemPrompt = `
    You are a language detection expert.
    Detect the language of the given message.
    Reply with ONLY one word: ENGLISH, ROMAN-URDU.
    Nothing else. No explanation.
  `;

  // ─── ACTIVE: Groq via callLLM ────────────────────────────
  const detected = await callLLM(systemPrompt, message);

  // ─── PAUSED: swap above line to this after kickoff stream ─
  // const detected = await callFeatherless(systemPrompt, message);
  // (Featherless open-source models handle Urdu/Sindhi better)

  const lang = detected.trim().toUpperCase();

  // Fallback to ENGLISH if model returns something unexpected
  if (!['ENGLISH', 'ROMAN-URDU'].includes(lang)) return 'ENGLISH';
  return lang;
}


// ─────────────────────────────────────────────────────────────
//  STEP 2: TRANSLATE TO ENGLISH (for internal agent processing)
//  Agents internally work in English — translate inbound messages
// ─────────────────────────────────────────────────────────────
async function translateToEnglish(message, fromLanguage) {
  if (fromLanguage === 'ENGLISH') return message; // no translation needed

  const systemPrompt = `
    You are a translator.
    Translate the following ${fromLanguage} message to English.
    Return ONLY the translated text. No explanation.
  `;

  // Always uses callLLM — no provider switch needed here
  return await callLLM(systemPrompt, message);
}


// ─────────────────────────────────────────────────────────────
//  STEP 3: TRANSLATE REPLY BACK TO CUSTOMER LANGUAGE
//  After agent generates English reply, translate it back
// ─────────────────────────────────────────────────────────────
async function translateReply(englishReply, toLanguage) {
  if (toLanguage === 'ENGLISH') return englishReply; // no translation needed

  const systemPrompt = `
    You are a translator for a food ordering chatbot in Pakistan.
    Translate the following English message to ${toLanguage}.
    Keep it natural and conversational.
    Return ONLY the translated text. No explanation.
  `;

  // Always uses callLLM — no provider switch needed here
  return await callLLM(systemPrompt, englishReply);
}


// ─────────────────────────────────────────────────────────────
//  MAIN EXPORT: processMessage
//  Supervisor calls this on EVERY incoming customer message.
//  Returns: { originalMessage, englishMessage, detectedLanguage }
// ─────────────────────────────────────────────────────────────
async function processMessage(customerMessage) {
  const detectedLanguage = await detectLanguage(customerMessage);
  const englishMessage = await translateToEnglish(customerMessage, detectedLanguage);

  return {
    originalMessage: customerMessage,
    englishMessage,           // pass this to other agents internally
    detectedLanguage,         // pass this so reply is in same language
  };
}

module.exports = { processMessage, translateReply, detectLanguage };
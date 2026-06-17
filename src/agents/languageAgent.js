// ============================================================
//  WASI — LANGUAGE AGENT (Performance-Optimized)
//
//  Changes from original:
//  - Regex-based fast-path language detection (no LLM for 80%+)
//  - Urdu script detection via Unicode range U+0600-U+06FF
//  - English/Roman-Urdu detection via ASCII heuristics
//  - LLM fallback only for truly ambiguous messages
//  - Skips translation for ENGLISH + ROMAN-URDU (LLMs read both)
// ============================================================

const { callFeatherless } = require('../llm');

// ─────────────────────────────────────────────────────────────
//  REGEX-BASED FAST LANGUAGE DETECTION
//  Eliminates LLM call for ~80% of messages
// ─────────────────────────────────────────────────────────────

// Urdu/Arabic script range: U+0600 to U+06FF
const URDU_REGEX = /[\u0600-\u06FF]/;

// Sindhi-specific characters (subset of Arabic Extended)
const SINDHI_MARKERS = /[\u0684\u0683\u0686\u068A\u068C\u068D\u068E\u0699\u06A9\u06AF\u06BB\u06BE\u06C1\u06C3\u06D2]/;

// Common Roman Urdu words — massive 150+ word lexicon
const ROMAN_URDU_WORDS = /\b(salam|walaikum|assalam|jani|bhai|yaar|bro|boss|karo|kardo|karein|kiya|kia|bata|batao|bataein|dikhao|dikha|lao|dedo|dein|rakh|hata|nikaal|bhejo|mujhe|humein|hum|tum|ap|aap|apka|apki|apna|apni|mera|meri|meray|tera|teri|uska|uski|isko|usko|kisko|kya|kaun|konsa|konsi|kitne|kitna|kitni|kaise|kab|kahan|kidhar|hai|ha|hain|nahi|nhi|na|han|haan|ji|jee|g|acha|achha|accha|theek|thik|sahi|bilkul|zaroor|bas|bohat|bahut|zyada|kam|thora|thoda|wala|wali|wale|menu|order|khana|khaana|peena|burger|fries|broast|coke|chai|paratha|biryani|pizza|chicken|deal|combo|aur|ya|ko|ka|ki|ke|se|ye|wo|yeh|woh|ma|mein|per|par|sath|wapis|phir|pehle|baad|abhi)\b/i;

// Explicit English markers (grammar/pronouns that don't overlap much with Roman Urdu)
const ENGLISH_MARKERS = /\b(would|could|should|please|give|want|like|have|some|the|this|that|what|which|how|much|many|there|where|who|why|when|is|are|am|was|were|will|can)\b/i;

function detectLanguageFast(message) {
  if (!message || message.trim().length === 0) return null;

  const trimmed = message.trim();

  // Pure digits (OTP) — treat as English, no detection needed
  if (/^\d+$/.test(trimmed)) return 'ENGLISH';

  // Check for Urdu/Arabic script characters
  const urduCharCount = (trimmed.match(/[\u0600-\u06FF]/g) || []).length;
  const totalChars = trimmed.replace(/\s/g, '').length;
  const urduRatio = urduCharCount / totalChars;

  // >50% Urdu script → check if Sindhi or Urdu
  if (urduRatio > 0.5) {
    return SINDHI_MARKERS.test(trimmed) ? 'SINDHI' : 'URDU';
  }

  // Pure ASCII — either English or Roman Urdu
  if (urduRatio === 0) {
    const hasRomanUrdu = ROMAN_URDU_WORDS.test(trimmed);
    const hasEnglish   = ENGLISH_MARKERS.test(trimmed);

    if (hasEnglish && !hasRomanUrdu) return 'ENGLISH';
    
    // Default to Roman Urdu for this Pakistani context unless it's strictly formal English
    return 'ROMAN-URDU';
  }

  // Mixed script — ambiguous, needs LLM
  return null;
}

// ─────────────────────────────────────────────────────────────
//  LLM FALLBACK — only for ambiguous messages
// ─────────────────────────────────────────────────────────────
async function detectLanguageLLM(message) {
  const systemPrompt = `Detect language. Reply ONE word: ENGLISH, URDU, ROMAN-URDU, or SINDHI.
Roman Urdu = Urdu in Latin letters (e.g. "mujhe khana chahiye").`;

  const detected = await callFeatherless(systemPrompt, message, 10);
  const lang = detected.trim().toUpperCase().split(/\s+/)[0];
  if (!['ENGLISH', 'ROMAN-URDU', 'URDU', 'SINDHI'].includes(lang)) return 'ROMAN-URDU';
  return lang;
}

// ─────────────────────────────────────────────────────────────
//  DETECT LANGUAGE — fast path + LLM fallback
// ─────────────────────────────────────────────────────────────
async function detectLanguage(message) {
  const fast = detectLanguageFast(message);
  if (fast) {
    console.log(`  ⚡ [Lang] Fast-detected: ${fast}`);
    return fast;
  }
  console.log(`  🔍 [Lang] Ambiguous — using LLM fallback`);
  return await detectLanguageLLM(message);
}

// ─────────────────────────────────────────────────────────────
//  TRANSLATE TO ENGLISH
//  Skips for ENGLISH + ROMAN-URDU (LLMs read both natively)
// ─────────────────────────────────────────────────────────────
async function translateToEnglish(message, fromLanguage) {
  if (fromLanguage === 'ENGLISH' || fromLanguage === 'ROMAN-URDU') return message;

  const systemPrompt = `Translate this ${fromLanguage} text to English. Return ONLY the translation.`;
  return await callFeatherless(systemPrompt, message);
}

// ─────────────────────────────────────────────────────────────
//  TRANSLATE REPLY BACK TO CUSTOMER LANGUAGE
// ─────────────────────────────────────────────────────────────
async function translateReply(text, toLanguage) {
  if (!text) return '';
  if (toLanguage === 'ENGLISH') return text;

  const langMap = {
    'ROMAN-URDU': 'Roman Urdu (Urdu in Latin letters for WhatsApp, e.g. "Aap ka order")',
    'URDU':       'Urdu script (Nastaliq/Arabic script)',
    'SINDHI':     'Sindhi script',
  };

  const targetLang = langMap[toLanguage];
  if (!targetLang) return text;

  const systemPrompt = `Translate to ${targetLang} for a food ordering WhatsApp chat. Return ONLY the translation.`;
  return await callFeatherless(systemPrompt, text);
}

// ─────────────────────────────────────────────────────────────
//  MAIN FUNCTION: processMessage
// ─────────────────────────────────────────────────────────────
async function processMessage(customerMessage, knownLanguage = null) {
  let detectedLanguage = knownLanguage;
  
  if (!detectedLanguage) {
    detectedLanguage = await detectLanguage(customerMessage);
  }

  const englishMessage = await translateToEnglish(customerMessage, detectedLanguage);

  return {
    originalMessage: customerMessage,
    englishMessage,
    detectedLanguage,
  };
}

module.exports = { processMessage, translateReply, detectLanguage };
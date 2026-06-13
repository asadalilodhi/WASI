const axios = require('axios');

// Stores the last thinking block — readable by simulation file
let lastThinking = null;
function getLastThinking() { return lastThinking; }

// ============================================================
//  WASI — LLM GATEWAY
//
//  HOW TO SWITCH BACK TO GROQ (if needed):
//  1. Comment out the AI/ML API callLLM + callLLMChat functions
//  2. Uncomment the GROQ SECTION
//  3. Change exports back to { callLLM, callLLMChat: callLLM, callFeatherless, getLastThinking }
// ============================================================


// ─────────────────────────────────────────────────────────────
//  GROQ SECTION (commented — kept for emergency fallback)
//  Uses: GROQ_API_KEY from .env
// ─────────────────────────────────────────────────────────────
// const Groq = require('groq-sdk');
// async function callLLM(systemPrompt, userMessage) {
//   const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
//   const response = await groq.chat.completions.create({
//     model: 'llama-3.1-8b-instant',
//     messages: [
//       { role: 'system', content: systemPrompt },
//       { role: 'user',   content: userMessage  }
//     ]
//   });
//   return response.choices[0].message.content;
// }


// ─────────────────────────────────────────────────────────────
//  ACTIVE: AI/ML API SECTION
// ─────────────────────────────────────────────────────────────

// ─── Helper: parse thinking + answer from DeepSeek response ──
function parseDeepSeekResponse(raw) {
  const thinkMatch = raw.match(/<think>([\s\S]*?)<\/think>/);
  const thinking   = thinkMatch ? thinkMatch[1].trim() : null;
  const answer     = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  if (thinking && process.env.SHOW_THINKING === 'true') {
    console.log('\n🧠 [DeepSeek Thinking]:\n' + thinking + '\n');
  }
  lastThinking = thinking;
  return answer;
}

// ─── callLLM: Supervisor + Notification Agent ────────────────
// Model: deepseek-v4-flash — fast reasoning
async function callLLM(systemPrompt, userMessage) {
  // FIXED — 3 arguments, timeout works:
  const response = await axios.post(
    'https://api.aimlapi.com/v1/chat/completions',
    { model: 'claude-haiku-4-5-20251001',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage  }
      ] },
    {
      headers: {
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );
  return parseDeepSeekResponse(response.data.choices[0].message.content);
}


// ─── callLLMChat: Menu + Order + Delivery + Payment Agents ───
// Model: deepseek-chat-v3.1 — conversational, cost efficient
async function callLLMChat(systemPrompt, userMessage) {
  // FIXED — 3 arguments, timeout works:
  const response = await axios.post(
    'https://api.aimlapi.com/v1/chat/completions',
    { model: 'claude-haiku-4-5-20251001',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage  }
      ] },
    {
      headers: {
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );
  return parseDeepSeekResponse(response.data.choices[0].message.content);
}


// ─────────────────────────────────────────────────────────────
//  FEATHERLESS — LANGUAGE AGENT ONLY
//  Model: Qwen3.5-9B — multilingual, warm, high usage
// ─────────────────────────────────────────────────────────────
async function callFeatherless(systemPrompt, userMessage) {
  const response = await axios.post(
    'https://api.featherless.ai/v1/chat/completions',
    {
      model: 'Qwen/Qwen3.5-9B',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage  }
      ]
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.FEATHERLESS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );
  return response.data.choices[0].message.content;
}


module.exports = { callLLM, callLLMChat, callFeatherless, getLastThinking };
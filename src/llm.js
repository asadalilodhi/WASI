const axios = require('axios');

// ============================================================
//  WASI — LLM GATEWAY
//  Currently active: Groq (free, fast, no billing needed)
//
//  HOW TO SWITCH TO AI/ML API AFTER KICKOFF STREAM (June 12):
//  1. Get your AI/ML API key from the kickoff stream promo
//  2. Add to .env → AIML_API_KEY=your_key_here
//  3. Comment out the entire "ACTIVE: GROQ SECTION" below
//  4. Uncomment the "AI/ML API SECTION" below
//  5. callLLM() stays the same everywhere else — no other file changes
// ============================================================


// ─────────────────────────────────────────────────────────────
//  ACTIVE: GROQ SECTION
//  Uses: GROQ_API_KEY from .env
//  Install: npm install groq-sdk
//  Free tier: ~14,400 requests/day on llama3-8b
// ─────────────────────────────────────────────────────────────
const Groq = require('groq-sdk');

async function callLLM(systemPrompt, userMessage) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',       // free, fast — good for dev/testing
    // model: 'llama3-70b-8192',   // switch to this for smarter replies if needed
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage  }
    ]
  });

  return response.choices[0].message.content;
}


// ─────────────────────────────────────────────────────────────
//  PAUSED: AI/ML API SECTION  ← SWITCH TO THIS AFTER KICKOFF
//  Uses: AIML_API_KEY from .env
//  No extra install needed (uses axios already in project)
//
//  TO ACTIVATE:
//    1. Comment out the entire GROQ SECTION above
//       (comment out the require line AND the async function)
//    2. Remove the /* and */ around this section
// ─────────────────────────────────────────────────────────────


// async function callLLM(systemPrompt, userMessage) {
//   const response = await axios.post(
//     'https://api.aimlapi.com/v1/chat/completions',
//     {
//       model: 'gpt-4o',
//       messages: [
//         { role: 'system', content: systemPrompt },
//         { role: 'user',   content: userMessage  }
//       ]
//     },
//     {
//       headers: {
//         'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
//         'Content-Type': 'application/json'
//       }
//     }
//   );
//   return response.data.choices[0].message.content;
// }



// ─────────────────────────────────────────────────────────────
//  PAUSED: FEATHERLESS AI SECTION  ← FOR LANGUAGE AGENT ONLY
//  Uses: FEATHERLESS_API_KEY from .env
//  Best for: Urdu/Sindhi detection via open-source models
//
//  TO ACTIVATE: import callFeatherless in languageAgent.js only
// ─────────────────────────────────────────────────────────────


// async function callFeatherless(systemPrompt, userMessage) {
//   const response = await axios.post(
//     'https://api.featherless.ai/v1/chat/completions',
//     {
//       model: 'mistralai/Mistral-7B-Instruct-v0.3',
//       messages: [
//         { role: 'system', content: systemPrompt },
//         { role: 'user',   content: userMessage  }
//       ]
//     },
//     {
//       headers: {
//         'Authorization': `Bearer ${process.env.FEATHERLESS_API_KEY}`,
//         'Content-Type': 'application/json'
//       }
//     }
//   );
//   return response.data.choices[0].message.content;
// }



module.exports = { callLLM };
// After kickoff, if you activate Featherless too, update to:
// module.exports = { callLLM, callFeatherless };
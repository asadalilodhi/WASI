// ============================================================
//  WASI — PROFILE AGENT
//
//  Extracts customer name and phone number using LLM Brain
//  and generates conversational responses using LLM Mouth.
// ============================================================

const { callLLM } = require('../llm');

// ─────────────────────────────────────────────────────────────
//  MAIN: HANDLE PROFILE MESSAGE
// ─────────────────────────────────────────────────────────────
async function handleProfileMessage(conversationHistory, missingField, detectedLanguage = 'ROMAN-URDU') {
  // --- STEP 1: THE BRAIN (Data Extraction) ---
  const fieldDescription = missingField === 'name' ? 'customer name' : 'phone number';
  
  const brainPrompt = `You are a strict data-extraction parser for WASI food delivery.
Your ONLY job is to read the user's latest message and extract their ${fieldDescription}.

INSTRUCTIONS:
- If extracting name: Look for explicit statements like "my name is X", "X here", or just the name itself if it logically answers the previous question.
- If extracting phone: Look for phone numbers (e.g. "03001234567", "+923001234567"). Remove any non-numeric characters except leading '+'.
- If the user asks a conversational question (e.g. "why do you need my name?", "is my number safe?"), or if their message doesn't contain the requested info, set the value to null.

You MUST output ONLY a valid JSON object matching this schema:
{
  "customerName": "John Doe",  // Set to null if missing or extracting phone
  "phoneNumber": "03001234567" // Set to null if missing or extracting name
}`;

  const lastAssistant = conversationHistory.filter(msg => msg.role === 'assistant').pop();
  const lastUser = conversationHistory.filter(msg => msg.role === 'user').pop();
  const brainMessages = [lastAssistant, lastUser].filter(Boolean);

  let extracted = { customerName: null, phoneNumber: null };
  
  try {
    const brainReply = await callLLM(brainPrompt, brainMessages, 150, true);
    extracted = JSON.parse(brainReply);
    console.log(`  🧠 [Profile Brain] Extracted: ${JSON.stringify(extracted)}`);
  } catch (e) {
    console.log(`  ⚠️ [Profile Brain] JSON extraction failed: ${e.message}`);
  }

  // --- STEP 2: THE MOUTH (Conversational Response) ---
  const capturedValue = missingField === 'name' ? extracted.customerName : extracted.phoneNumber;

  let mouthPrompt;
  if (capturedValue) {
    // If successfully captured, we don't need the mouth to talk. The supervisor will just move to the next step.
    return { 
      reply: null, 
      customerName: extracted.customerName, 
      phoneNumber: extracted.phoneNumber 
    };
  } else {
    // If NOT captured, generate a conversational response or re-prompt.
    mouthPrompt = `You are WASI, a friendly Pakistani food delivery assistant.
The system needs the user's ${fieldDescription} to proceed, but their last message didn't contain it or they asked a question.

INSTRUCTIONS:
1. If the user asked a question (e.g. "why do you need it?"), politely answer it (e.g. "We need it for the delivery rider").
2. Politely ask them to provide their ${fieldDescription}.
3. Keep it brief and friendly. Reply in ${detectedLanguage}.`;
  }

  const generatedReply = await callLLM(mouthPrompt, conversationHistory, 250, false);
  return { 
    reply: generatedReply, 
    customerName: null, 
    phoneNumber: null 
  };
}

module.exports = { handleProfileMessage };

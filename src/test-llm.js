// ============================================================
//  test-llm.js — Quick test for the LLM gateway
//
//  Run with: node test-llm.js
//
//  Before running, make sure:
//    1. Your .env file has GEMINI_API_KEY=your_key_here
//    2. You've installed the package:
//       npm install @google/generative-ai
// ============================================================

require('dotenv').config();
const { callLLM } = require('./llm');

async function test() {
  console.log('Testing LLM connection...\n');

  // Test 1: Basic greeting
  const reply1 = await callLLM(
    'You are WASI, a WhatsApp food ordering assistant for a restaurant in Pakistan.',
    'Hi, I want to order some food'
  );
  console.log('Test 1 — Basic greeting:');
  console.log('Bot:', reply1);
  console.log('---');

  // Test 2: Menu question
  const reply2 = await callLLM(
    'You are WASI, a WhatsApp food ordering assistant. Menu: Zinger Burger Rs.350, Broast Rs.450, Coke Rs.80.',
    'What burgers do you have and how much do they cost?'
  );
  console.log('Test 2 — Menu query:');
  console.log('Bot:', reply2);
  console.log('---');

  // Test 3: Urdu message (to check multilingual support)
  const reply3 = await callLLM(
    'You are WASI, a food ordering assistant. Reply in the same language as the customer.',
    'مجھے کھانا آرڈر کرنا ہے'   // "I want to order food" in Urdu
  );
  console.log('Test 3 — Urdu message:');
  console.log('Bot:', reply3);
  console.log('---');

  console.log('All tests passed! LLM gateway is working.');
}

test().catch((err) => {
  console.error('LLM test failed:', err.message);
  console.error('Check: Is GROQ_API_KEY set correctly in .env?');
});
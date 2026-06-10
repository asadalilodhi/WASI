// ============================================================
//  test-agents.js — Test menuAgent + languageAgent together
//  Run with: node test-agents.js
// ============================================================

require('dotenv').config();
const { handleMenuQuery } = require('./agents/menuAgent');
const { processMessage, translateReply } = require('./agents/languageAgent');

async function test() {
  console.log('=== Testing Menu Agent + Language Agent ===\n');

  // ── Test 1: English menu question ──────────────────────────
  console.log('TEST 1: English menu question');
  const t1 = await processMessage('What is the name of the president of pakistan?');
  const r1 = await handleMenuQuery(t1.englishMessage, t1.detectedLanguage);
  console.log('Detected language:', t1.detectedLanguage);
  console.log('Bot reply:', r1.reply);
  console.log('---\n');

  // ── Test 2: Urdu message ───────────────────────────────────
  console.log('TEST 2: Roman-Urdu message');
  const t2 = await processMessage('Mujhe 2 Zinger Burgers chahiyen');  // "I want 2 Zinger Burgers"
  console.log('Detected language:', t2.detectedLanguage);
  console.log('Translated to English:', t2.englishMessage);
  const r2 = await handleMenuQuery(t2.englishMessage, t2.detectedLanguage);
  const roman_urduReply = await translateReply(r2.reply, t2.detectedLanguage);
  console.log('Bot reply (in Roman-Urdu):', roman_urduReply);
  if (r2.selectedItems) console.log('Items selected:', r2.selectedItems);
  console.log('---\n');

  // ── Test 3: Order with item selection ──────────────────────
  console.log('TEST 3: Order detection');
  const t3 = await processMessage('I want 1 Zinger Burger and a coke');
  const r3 = await handleMenuQuery(t3.englishMessage, t3.detectedLanguage);
  console.log('Bot reply:', r3.reply);
  console.log('Parsed items:', r3.selectedItems);
  console.log('---\n');

  console.log('All agent tests done!');
}

test().catch((err) => {
  console.error('Test failed:', err.message);
});
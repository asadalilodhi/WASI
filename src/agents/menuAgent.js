// ============================================================
//  WASI — MENU AGENT (Thin LLM Architecture)
//
//  Three layers:
//  1. LLM Intent Extractor — understands messy user input
//  2. Deterministic Resolver — maps intents to menu items,
//     handles disambiguation rules in pure code
//  3. LLM Mouth — wraps code decisions in warm conversation
//
//  The LLM never touches cart state or disambiguation rules.
// ============================================================

const { callLLM } = require('../llm');

// ─────────────────────────────────────────────────────────────
//  MENU DATA
// ─────────────────────────────────────────────────────────────
const MENU = [
  { id: '1', name: 'Zinger Burger',     price: 350, category: 'burgers'   },
  { id: '2', name: 'Broast (4 pieces)', price: 450, category: 'broast'    },
  { id: '3', name: 'Broast (8 pieces)', price: 800, category: 'broast'    },
  { id: '4', name: 'Fries (Regular)',   price: 120, category: 'sides'     },
  { id: '5', name: 'Fries (Large)',     price: 180, category: 'sides'     },
  { id: '6', name: 'Coke (Regular)',    price: 80,  category: 'drinks'    },
  { id: '7', name: 'Coke (Large)',      price: 120, category: 'drinks'    },
];

// Pre-build menu string once
const MENU_STRING = MENU.map(i => `${i.id}. ${i.name} Rs.${i.price}`).join('\n');

// ─────────────────────────────────────────────────────────────
//  CLARIFICATION TEMPLATES (deterministic — never LLM-generated)
// ─────────────────────────────────────────────────────────────
const CLARIFICATION_TEMPLATES = {
  fries_size:  'Fries ke liye: Regular (Rs.120) ya Large (Rs.180)?',
  broast_size: 'Broast ke liye: 4 pieces (Rs.450) ya 8 pieces (Rs.800)?',
  coke_size:   'Coke ke liye: Regular (Rs.80) ya Large (Rs.120)?',
};


// ─────────────────────────────────────────────────────────────
//  LAYER 2: DETERMINISTIC RESOLVER
//  Pure code. No LLM. Maps raw intents → menu item IDs.
//  If disambiguation is needed, pushes to pendingClarifications.
// ─────────────────────────────────────────────────────────────
function resolveIntents(intents, pendingClarifications = []) {
  const resolved = [];       // Items ready to add: [{ id, qty }]
  const newPending = [];     // Items that need clarification

  for (const intent of intents) {
    const kw = (intent.keyword || '').toLowerCase();
    const size = (intent.size || '').toLowerCase();
    const qty = intent.qty || 1;

    // ── BURGER ──
    if (kw.match(/burger|zinger/)) {
      resolved.push({ id: '1', qty });

    // ── BROAST ──
    } else if (kw.match(/broast/)) {
      if (size.match(/8|eight|bari|large|bara/) || kw.includes('8')) {
        resolved.push({ id: '3', qty });
      } else if (size.match(/4|four|choti|regular|small/) || kw.includes('4')) {
        resolved.push({ id: '2', qty });
      } else {
        newPending.push({ type: 'broast_size', qty });
      }

    // ── FRIES ──
    } else if (kw.match(/fries|chips|french/)) {
      if (size.match(/large|bari|bara|180/)) {
        resolved.push({ id: '5', qty });
      } else if (size.match(/regular|choti|normal|small|120/)) {
        resolved.push({ id: '4', qty });
      } else {
        newPending.push({ type: 'fries_size', qty });
      }

    // ── COKE / DRINK ──
    } else if (kw.match(/coke|cola|pepsi|drink|sprite/)) {
      if (size.match(/large|bari|bara|120/)) {
        resolved.push({ id: '7', qty });
      } else if (size.match(/regular|choti|normal|small|80/)) {
        resolved.push({ id: '6', qty });
      } else {
        newPending.push({ type: 'coke_size', qty });
      }
    }
    // Unknown items are silently ignored — the Mouth will say "unavailable"
  }

  return { resolved, newPending };
}


// ─────────────────────────────────────────────────────────────
//  RESOLVE PENDING CLARIFICATION
//  When the user answers a disambiguation question (e.g., "Regular"),
//  this maps their answer back to a menu item.
// ─────────────────────────────────────────────────────────────
function resolveClarification(clarification, userAnswer) {
  const answer = userAnswer.toLowerCase();

  switch (clarification.type) {
    case 'fries_size':
      if (answer.match(/large|bari|bara|180/)) return { id: '5', qty: clarification.qty };
      if (answer.match(/regular|choti|normal|small|120/)) return { id: '4', qty: clarification.qty };
      return null; // Still ambiguous

    case 'broast_size':
      if (answer.match(/8|eight|bari|large|bara|800/)) return { id: '3', qty: clarification.qty };
      if (answer.match(/4|four|choti|regular|small|450/)) return { id: '2', qty: clarification.qty };
      return null;

    case 'coke_size':
      if (answer.match(/large|bari|bara|120/)) return { id: '7', qty: clarification.qty };
      if (answer.match(/regular|choti|normal|small|80/)) return { id: '6', qty: clarification.qty };
      return null;

    default:
      return null;
  }
}


// ─────────────────────────────────────────────────────────────
//  LAYER 1: LLM INTENT EXTRACTOR
//  The LLM's ONLY job: understand messy input → structured intent.
//  No menu IDs, no prices, no cart management.
// ─────────────────────────────────────────────────────────────
async function extractIntent(lastAssistantMsg, lastUserMsg) {
  const brainPrompt = `You are a strict intent-extraction parser for a food delivery chatbot.
Your ONLY job is to read the user's message and output a structured JSON describing what they want.

You MUST output ONLY a valid JSON object matching this schema:
{
  "action": "add",
  "intents": [
    { "keyword": "burger", "qty": 2, "size": null },
    { "keyword": "fries", "qty": 3, "size": "regular" }
  ]
}

RULES:
- "action" must be one of: "add", "remove", "done", "question", "greeting", "confirm", "other"
  - "add" = user wants to add/order items
  - "remove" = user wants to remove items from the cart
  - "done" = user says they're done ordering (e.g., "bas", "that's all", "hogaya", "kafi")
  - "question" = user is asking about the menu or prices
  - "greeting" = user just said hi/hello
  - "confirm" = user is confirming something (e.g., "haan", "yes", "ok", "thik hai")
  - "other" = anything else
- "keyword" should be the food item name in English (e.g., "burger", "fries", "broast", "coke")
- "qty" should be the quantity. Default to 1 if not specified.
- "size" should capture any size/variant info (e.g., "regular", "large", "4 piece", "8 piece"). Set to null if the user does not EXPLICITLY specify it. DO NOT guess or assume sizes.
- If the user isn't ordering anything, output: { "action": "question", "intents": [] }
- Extract from the LATEST user message only. Do NOT repeat old items.`;

  const messages = [];
  if (lastAssistantMsg) messages.push(lastAssistantMsg);
  if (lastUserMsg) messages.push(lastUserMsg);

  try {
    const raw = await callLLM(brainPrompt, messages, 300, true);
    const parsed = JSON.parse(raw);
    console.log(`  🧠 [Menu Intent] ${JSON.stringify(parsed)}`);
    return parsed;
  } catch (e) {
    console.log(`  ⚠️ [Menu Intent] Parse failed: ${e.message}`);
    return { action: 'other', intents: [] };
  }
}


// ─────────────────────────────────────────────────────────────
//  LAYER 3: LLM MOUTH
//  Takes a deterministic instruction string and wraps it in
//  warm, natural conversation. The LLM makes ZERO decisions.
// ─────────────────────────────────────────────────────────────
async function generateReply(instruction, conversationHistory, detectedLanguage) {
  const mouthPrompt = `You are WASI's friendly WhatsApp food ordering assistant.

YOUR INSTRUCTION (Convey this exact information to the user in a natural, conversational way):
${instruction}

RULES:
- Reply in ${detectedLanguage}.
- Be warm, friendly, use emojis sparingly.
- Do NOT add items, prices, or details that aren't in YOUR INSTRUCTION.
- Do NOT output robotic lists like "Confirm: Added X to cart". Rephrase it naturally! (e.g., "Maine 2 Zinger add kar diye hain.")
- Do NOT say "order confirmed" or mention delivery/preparation unless the instruction tells you to.
- Keep it concise — this is WhatsApp, not an email.`;

  return await callLLM(mouthPrompt, conversationHistory, 300, false);
}


// ─────────────────────────────────────────────────────────────
//  MAIN: handleMenuQuery
//  Orchestrates: Intent Extraction → Resolver → Mouth
// ─────────────────────────────────────────────────────────────
async function handleMenuQuery(conversationHistory, currentCart = [], detectedLanguage = 'ROMAN-URDU', pendingClarifications = []) {

  // Get the last assistant + user messages for the Brain
  const lastAssistantMsg = conversationHistory.filter(msg => msg.role === 'assistant').pop();
  const lastUserMsg = conversationHistory.filter(msg => msg.role === 'user').pop();

  // ── CASE 1: We have pending clarifications → try to resolve them ──
  if (pendingClarifications.length > 0) {
    const userText = lastUserMsg?.content || '';
    const resolvedFromClarification = [];
    const stillPending = [];

    for (const clarification of pendingClarifications) {
      const result = resolveClarification(clarification, userText);
      if (result) {
        resolvedFromClarification.push(result);
      } else {
        stillPending.push(clarification);
      }
    }

    if (resolvedFromClarification.length > 0) {
      console.log(`  ✅ [Menu Resolver] Clarifications resolved: ${JSON.stringify(resolvedFromClarification)}`);
    }

    // Build the Mouth instruction
    const parts = [];

    // Describe what was resolved
    for (const item of resolvedFromClarification) {
      const menuItem = MENU.find(m => m.id === item.id);
      if (menuItem) parts.push(`Confirm to the user: Added ${item.qty}x ${menuItem.name} (Rs.${menuItem.price} each) to their cart.`);
    }

    // If there are still unresolved clarifications, ask again
    for (const p of stillPending) {
      parts.push(`Ask the user: ${CLARIFICATION_TEMPLATES[p.type]} (quantity: ${p.qty})`);
    }

    if (parts.length === 0) {
      parts.push('Tell the user their items have been added. Ask if they want anything else.');
    }

    const instruction = parts.join('\n');
    const reply = await generateReply(instruction, conversationHistory, detectedLanguage);

    return {
      reply,
      selectedItems: resolvedFromClarification,
      pendingClarifications: stillPending,
      menu: MENU,
    };
  }


  // ── CASE 2: No pending clarifications → extract new intent ──
  const intent = await extractIntent(lastAssistantMsg, lastUserMsg);

  // Handle non-ordering actions
  if (intent.action === 'done') {
    // Build cart summary from code
    const cartLines = currentCart.map(i => {
      const menuItem = MENU.find(m => String(m.id) === String(i.id));
      return menuItem ? `• ${menuItem.name} ×${i.qty} = Rs.${i.qty * menuItem.price}` : null;
    }).filter(Boolean);
    const cartTotal = currentCart.reduce((sum, i) => {
      const menuItem = MENU.find(m => String(m.id) === String(i.id));
      return sum + (menuItem ? i.qty * menuItem.price : 0);
    }, 0);

    const instruction = currentCart.length > 0
      ? `Show the user their complete cart:\n${cartLines.join('\n')}\nTotal: Rs.${cartTotal}\n\nTell them we will now collect their delivery details.`
      : 'The cart is empty. Ask what they would like to order.';

    const reply = await generateReply(instruction, conversationHistory, detectedLanguage);
    return { reply, selectedItems: null, pendingClarifications: [], menu: MENU, isDone: true };
  }

  if (intent.action === 'greeting' || intent.action === 'question') {
    const instruction = intent.action === 'greeting'
      ? `Greet the user and show them the menu:\n${MENU_STRING}\n\nAsk what they would like to order.`
      : `The user has a question. Answer based on our menu:\n${MENU_STRING}`;

    const reply = await generateReply(instruction, conversationHistory, detectedLanguage);
    return { reply, selectedItems: null, pendingClarifications: [], menu: MENU };
  }

  if (intent.action === 'other' || intent.action === 'confirm') {
    const instruction = currentCart.length > 0
      ? `The user said something general. Show their current cart and ask if they want to add more or are done:\nCurrent cart: ${currentCart.map(i => { const m = MENU.find(x => String(x.id) === String(i.id)); return m ? `${m.name} ×${i.qty}` : ''; }).filter(Boolean).join(', ')}`
      : `The user said something general. Show the menu and ask what they want to order:\n${MENU_STRING}`;

    const reply = await generateReply(instruction, conversationHistory, detectedLanguage);
    return { reply, selectedItems: null, pendingClarifications: [], menu: MENU };
  }

  // ── ACTION: "add" or "remove" → run through the Deterministic Resolver ──
  if (intent.action === 'remove') {
    // Find matching items to remove
    const toRemove = [];
    for (const item of intent.intents) {
      const kw = (item.keyword || '').toLowerCase();
      const match = currentCart.find(i => {
        const menuItem = MENU.find(m => String(m.id) === String(i.id));
        return menuItem && menuItem.name.toLowerCase().includes(kw);
      });
      if (match) toRemove.push({ id: match.id, qty: 0 });
    }

    const instruction = toRemove.length > 0
      ? `Tell the user you removed: ${toRemove.map(i => MENU.find(m => m.id === i.id)?.name).join(', ')} from their cart.`
      : `Tell the user you couldn't find that item in their cart.`;

    const reply = await generateReply(instruction, conversationHistory, detectedLanguage);
    return { reply, selectedItems: toRemove, pendingClarifications: [], menu: MENU };
  }

  // ── ACTION: "add" ──
  const { resolved, newPending } = resolveIntents(intent.intents, pendingClarifications);

  // Check for unknown items (items in intents that weren't resolved or pended)
  const handledKeywords = intent.intents.filter(i => {
    const kw = (i.keyword || '').toLowerCase();
    return kw.match(/burger|zinger|broast|fries|chips|french|coke|cola|pepsi|drink|sprite/);
  });
  const unknownItems = intent.intents.filter(i => !handledKeywords.includes(i));

  // Build the Mouth instruction
  const parts = [];

  // Describe resolved items
  for (const item of resolved) {
    const menuItem = MENU.find(m => m.id === item.id);
    if (menuItem) parts.push(`Confirm: Added ${item.qty}x ${menuItem.name} (Rs.${menuItem.price} each) to the cart.`);
  }

  // Describe unknown items
  for (const item of unknownItems) {
    parts.push(`Tell the user: "${item.keyword}" is not available on our menu.`);
  }

  // Ask pending clarifications
  for (const p of newPending) {
    parts.push(`Ask the user: ${CLARIFICATION_TEMPLATES[p.type]} (they want ${p.qty})`);
  }

  // If nothing happened, ask what they want
  if (parts.length === 0) {
    parts.push(`Show the menu and ask what they want to order:\n${MENU_STRING}`);
  }

  if (resolved.length > 0) {
    console.log(`  ✅ [Menu Resolver] Resolved: ${JSON.stringify(resolved)}`);
  }
  if (newPending.length > 0) {
    console.log(`  ⏳ [Menu Resolver] Pending clarifications: ${JSON.stringify(newPending)}`);
  }

  const instruction = parts.join('\n');
  const reply = await generateReply(instruction, conversationHistory, detectedLanguage);

  return {
    reply,
    selectedItems: resolved.length > 0 ? resolved : null,
    pendingClarifications: newPending,
    menu: MENU,
  };
}

module.exports = { handleMenuQuery, MENU };
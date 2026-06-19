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
function resolveIntents(intents, currentPending = []) {
  const resolved = [];       // Items ready to add: [{ id, qty }]
  const newPending = [];     // Items that need clarification
  const addressedTypes = new Set();

  for (const intent of intents) {
    const kw = (intent.keyword || '').toLowerCase();
    const size = (intent.size || '').toLowerCase();
    const qty = intent.qty || 1;

    // ── BURGER ──
    if (kw.match(/burger|zinger/)) {
      resolved.push({ id: '1', qty, action: intent.action });

    // ── BROAST ──
    } else if (kw.match(/broast/)) {
      addressedTypes.add('broast_size');
      if (size.match(/8|eight|bari|large|bara/) || kw.includes('8')) {
        resolved.push({ id: '3', qty, action: intent.action });
      } else if (size.match(/4|four|choti|regular|small/) || kw.includes('4')) {
        resolved.push({ id: '2', qty, action: intent.action });
      } else {
        newPending.push({ type: 'broast_size', qty, action: intent.action });
      }

    // ── FRIES ──
    } else if (kw.match(/fries|chips|french/)) {
      addressedTypes.add('fries_size');
      if (size.match(/large|bari|bara|180/)) {
        resolved.push({ id: '5', qty, action: intent.action });
      } else if (size.match(/regular|choti|normal|small|120/)) {
        resolved.push({ id: '4', qty, action: intent.action });
      } else {
        newPending.push({ type: 'fries_size', qty, action: intent.action });
      }

    // ── COKE / DRINK ──
    } else if (kw.match(/coke|cola|pepsi|drink|sprite/)) {
      addressedTypes.add('coke_size');
      if (size.match(/large|bari|bara|120/)) {
        resolved.push({ id: '7', qty, action: intent.action });
      } else if (size.match(/regular|choti|normal|small|80/)) {
        resolved.push({ id: '6', qty, action: intent.action });
      } else {
        newPending.push({ type: 'coke_size', qty, action: intent.action });
      }
    }
    // Unknown items are silently ignored — the Mouth will say "unavailable"
  }

  // Keep any pending items that were NOT addressed by the user's intents
  for (const p of currentPending) {
    if (!addressedTypes.has(p.type)) {
      newPending.push(p);
    }
  }

  return { resolved, newPending };
}


// ─────────────────────────────────────────────────────────────
//  LAYER 1: LLM INTENT EXTRACTOR
//  The LLM's ONLY job: understand messy input → structured intent.
//  No menu IDs, no prices, no cart management.
// ─────────────────────────────────────────────────────────────
async function extractIntent(lastAssistantMsg, lastUserMsg, pendingClarifications = [], receptionistNotes = []) {
  const clarificationContext = pendingClarifications.length > 0 
    ? `\nCONTEXT: We just asked the user to clarify these items: ${JSON.stringify(pendingClarifications)}. Their reply likely answers this.` 
    : '';

  const notesStr = (receptionistNotes && receptionistNotes.length > 0)
    ? `\nCRITICAL CONSTRAINTS FROM RECEPTIONIST: ${receptionistNotes.join(' | ')}. If the user asks for a forbidden item, DO NOT add it (return action: "add" but it will be rejected later, or just ignore it).`
    : '';

  const brainPrompt = `You are a strict intent-extraction parser for a food delivery chatbot.
Your ONLY job is to read the user's message and output a structured JSON describing what they want.
${clarificationContext}
${notesStr}
You MUST output ONLY a valid JSON object matching this schema:
{
  "message_type": "ordering",
  "intents": [
    { "action": "add", "keyword": "burger", "qty": 2, "size": null },
    { "action": "remove", "keyword": "fries", "qty": 1, "size": "regular" },
    { "action": "set", "keyword": "broast", "qty": 1, "size": "8 piece" }
  ]
}

RULES:
- "message_type" must be one of: "ordering", "done", "question", "greeting", "confirm", "other"
  - "ordering" = user is ordering (adding/removing/modifying items)
  - "done" = user says they're done ordering (e.g., "bas", "that's all", "hogaya", "kafi")
  - "question" = user is asking about the menu or prices
  - "greeting" = user just said hi/hello
  - "confirm" = user is confirming something (e.g., "haan", "yes", "ok", "thik hai")
  - "other" = anything else
- For each item in "intents", "action" must be one of:
  - "add" = increment quantity (e.g. "ek aur burger", "aur daal do")
  - "remove" = decrement/remove quantity (e.g. "hata den", "nikal do")
  - "set" = exactly this quantity (e.g. "make it 3 burgers", "just 1 coke")
  - If it's unclear if it's add or set (e.g., "give me 2 burgers"), use "add".
- "keyword" should be the food item name in English (e.g., "burger", "fries", "broast", "coke")
- "qty" should be the quantity. Default to 1 if not specified.
- "size" should capture any size/variant info (e.g., "regular", "large", "4 piece", "8 piece"). Set to null if the user does not EXPLICITLY specify it. DO NOT guess or assume sizes.
- If the user isn't ordering anything, output: { "message_type": "question", "intents": [] }
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
    return { message_type: 'other', intents: [] };
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
async function handleMenuQuery(conversationHistory, currentCart = [], detectedLanguage = 'ROMAN-URDU', pendingClarifications = [], receptionistNotes = []) {

  // Get the last assistant + user messages for the Brain
  const lastAssistantMsg = conversationHistory.filter(msg => msg.role === 'assistant').pop();
  const lastUserMsg = conversationHistory.filter(msg => msg.role === 'user').pop();

  // Extract intent through the Brain (injecting pending clarifications as context)
  const intent = await extractIntent(lastAssistantMsg, lastUserMsg, pendingClarifications, receptionistNotes);

  // Handle non-ordering actions
  if (intent.message_type === 'done') {
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

  if (intent.message_type === 'greeting' || intent.message_type === 'question') {
    const cartText = currentCart.length > 0 
      ? `\n\n(For your reference, the user's current cart has: ${currentCart.map(i => { const m = MENU.find(x => String(x.id) === String(i.id)); return m ? `${m.name} ×${i.qty}` : ''; }).filter(Boolean).join(', ')})`
      : '\n\n(The cart is currently empty.)';

    const instruction = intent.message_type === 'greeting'
      ? `Greet the user and show them the menu:\n${MENU_STRING}\n\nAsk what they would like to order.${cartText}`
      : `The user has a question. Answer based on our menu and their cart state:\nMENU:\n${MENU_STRING}${cartText}`;

    const reply = await generateReply(instruction, conversationHistory, detectedLanguage);
    return { reply, selectedItems: null, pendingClarifications: [], menu: MENU };
  }

  if (intent.message_type === 'other' || intent.message_type === 'confirm') {
    const instruction = currentCart.length > 0
      ? `The user said something general. Show their current cart and ask if they want to add more or are done:\nCurrent cart: ${currentCart.map(i => { const m = MENU.find(x => String(x.id) === String(i.id)); return m ? `${m.name} ×${i.qty}` : ''; }).filter(Boolean).join(', ')}`
      : `The user said something general. Show the menu and ask what they want to order:\n${MENU_STRING}`;

    const reply = await generateReply(instruction, conversationHistory, detectedLanguage);
    return { reply, selectedItems: null, pendingClarifications: [], menu: MENU };
  }

  // ── ACTION: "ordering" (Mixed intents: add, remove, set) ──
  const removeIntents = (intent.intents || []).filter(i => i.action === 'remove');
  const addOrSetIntents = (intent.intents || []).filter(i => i.action === 'add' || i.action === 'set');

  // Track the absolute new quantities for items that are modified
  const finalCartDeltas = {}; 
  
  // Initialize with current cart quantities
  currentCart.forEach(i => { finalCartDeltas[i.id] = i.qty; });

  const parts = []; // Instructions for the LLM Mouth

  // Process Removals
  const removedNames = [];
  let stillPending = pendingClarifications;
  
  for (const item of removeIntents) {
    const kw = (item.keyword || '').toLowerCase();
    const size = (item.size || '').toLowerCase();
    
    const matches = currentCart.filter(i => {
      const menuItem = MENU.find(m => String(m.id) === String(i.id));
      if (!menuItem) return false;
      const name = menuItem.name.toLowerCase();
      // If size is provided, it must match
      if (size && !name.includes(size)) return false;
      return name.includes(kw);
    });
    
    if (matches.length > 1) {
      // Need clarification
      const options = matches.map(m => MENU.find(x => x.id === m.id).name).join(' or ');
      parts.push(`Ask the user which size they want to remove: ${options}?`);
    } else if (matches.length === 1) {
      const match = matches[0];
      const removeQty = item.qty || 1;
      finalCartDeltas[match.id] = Math.max(0, finalCartDeltas[match.id] - removeQty);
      
      const menuItem = MENU.find(m => m.id === match.id);
      if (menuItem) removedNames.push(`${removeQty}x ${menuItem.name}`);
      
      // Clear pending clarifications for removed items
      stillPending = stillPending.filter(p => !p.type.includes(kw));
    } else {
      // Not found, handled below in unknown items if it's completely unknown, 
      // but if it's a known keyword just missing from cart:
      parts.push(`Tell the user: You couldn't find "${item.keyword}" in their cart to remove.`);
    }
  }

  if (removedNames.length > 0) {
    parts.push(`Confirm you removed from cart: ${removedNames.join(', ')}.`);
  }

  // Process Additions & Sets
  const { resolved, newPending } = resolveIntents(addOrSetIntents, stillPending);

  for (const res of resolved) {
    const id = res.id;
    if (res.action === 'set') {
      finalCartDeltas[id] = res.qty;
    } else { // 'add' or unknown (defaults to add)
      finalCartDeltas[id] = (finalCartDeltas[id] || 0) + res.qty;
    }
    
    const menuItem = MENU.find(m => m.id === id);
    if (menuItem) {
      if (res.action === 'set') {
        parts.push(`Confirm: Updated ${menuItem.name} quantity to ${res.qty}.`);
      } else {
        parts.push(`Confirm: Added ${res.qty}x ${menuItem.name} to the cart.`);
      }
    }
  }

  // Identify unknown items
  const handledKeywords = (intent.intents || []).filter(i => {
    const kw = (i.keyword || '').toLowerCase();
    return kw.match(/burger|zinger|broast|fries|chips|french|coke|cola|pepsi|drink|sprite/);
  });
  const unknownItems = (intent.intents || []).filter(i => !handledKeywords.includes(i));
  
  for (const item of unknownItems) {
    if (item.action === 'add' || item.action === 'set') {
      parts.push(`Tell the user: "${item.keyword}" is not available on our menu.`);
    } else if (item.action === 'remove') {
      parts.push(`Tell the user: You couldn't find "${item.keyword}" in their cart to remove.`);
    }
  }

  // Format pending clarifications
  for (const p of newPending) {
    parts.push(`CRITICAL: Do NOT say you added the item. Just ask the user: ${CLARIFICATION_TEMPLATES[p.type] || 'Which size do you want?'} (they want ${p.qty})`);
  }

  // If nothing happened, ask what else they want
  if (parts.length === 0) {
    parts.push(`Ask what else they want to order. If cart is empty, show menu:\n${MENU_STRING}`);
  }

  // Convert the finalCartDeltas back into the selectedItems array format expected by orderAgent
  // We only send items that were ACTUALLY modified (resolved additions or successful removals)
  const modifiedItemIds = new Set([
    ...removedNames.length > 0 ? removeIntents.map(i => currentCart.find(c => MENU.find(m => m.id === c.id)?.name.toLowerCase().includes((i.keyword || '').toLowerCase()))?.id).filter(Boolean) : [],
    ...resolved.map(r => r.id)
  ]);

  const selectedItems = Array.from(modifiedItemIds).map(id => ({
    id: id,
    qty: finalCartDeltas[id] || 0
  }));

  if (selectedItems.length > 0) {
    console.log(`  ✅ [Menu Resolver] Pushing absolute quantities: ${JSON.stringify(selectedItems)}`);
  }
  if (newPending.length > 0) {
    console.log(`  ⏳ [Menu Resolver] Pending clarifications: ${JSON.stringify(newPending)}`);
  }

  const notesStr = (receptionistNotes && receptionistNotes.length > 0) ? `\nCRITICAL CONSTRAINTS FROM RECEPTIONIST:\n${receptionistNotes.map(n => `- ${n}`).join('\n')}\nIf the user explicitly requests an item forbidden by these constraints, YOU MUST TELL THEM it is unavailable.` : '';
  const instruction = parts.join('\n') + notesStr;
  const reply = await generateReply(instruction, conversationHistory, detectedLanguage);

  return {
    reply,
    selectedItems: selectedItems.length > 0 ? selectedItems : null,
    pendingClarifications: newPending,
    menu: MENU,
  };
}

module.exports = { handleMenuQuery, MENU };
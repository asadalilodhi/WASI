// ============================================================
//  WASI — ORDER AGENT (Rebuilt for Consistency)
//
//  This agent ONLY handles: name, phone, final summary,
//  and order confirmation. Menu/Delivery/Payment are handled
//  by their dedicated agents via the Supervisor.
//
//  All summaries come from formatOrderSummary() — the LLM
//  is forbidden from generating its own item lists or totals.
// ============================================================

const { callLLM } = require('../llm');
const { MENU } = require('./menuAgent');
const { formatOrderSummary } = require('./orderUtils');

// ─────────────────────────────────────────────────────────────
//  ORDER STATE
// ─────────────────────────────────────────────────────────────
const orders = {};

function getOrder(sessionId) {
  if (!orders[sessionId]) {
    orders[sessionId] = {
      sessionId,
      items: [],          // [{ id, name, qty, price, subtotal }]
      totalPrice: 0,
      deliveryAddress: null,
      paymentMethod: null,
      customerName: null,
      phoneNumber: null,
      status: 'BUILDING', // BUILDING → CONFIRMING → CONFIRMED → REVIEWING → SUBMITTED
      createdAt: new Date().toISOString(),
      deliveryFee: 0,
      eta: null,
      orderType: null,
      paymentStatus: 'pending',
      pendingClarifications: [],  // [{ type: 'fries_size', qty: 3 }]
    };
  }
  return orders[sessionId];
}


// ─────────────────────────────────────────────────────────────
//  ADD ITEMS TO CART
//  IMPORTANT: This REPLACES qty for existing items, it does
//  NOT accumulate. The LLM's ITEMS_SELECTED is the intended
//  state for those items, not a delta.
// ─────────────────────────────────────────────────────────────
function addItemsToCart(sessionId, selectedItems) {
  const order = getOrder(sessionId);

  selectedItems.forEach((incoming) => {
    const menuItem = MENU.find(m => String(m.id) === String(incoming.id));
    if (!menuItem) {
      console.log(`  ⚠️  [Cart] Skipped unknown item id=${incoming.id}`);
      return;
    }

    const existing = order.items.find(i => String(i.id) === String(incoming.id));
    if (existing) {
      // REPLACE quantity, not add
      existing.qty = incoming.qty;
      existing.subtotal = existing.qty * existing.price;
    } else if (incoming.qty > 0) {
      order.items.push({
        id:       menuItem.id,
        name:     menuItem.name,
        qty:      incoming.qty,
        price:    menuItem.price,
        subtotal: incoming.qty * menuItem.price,
      });
    }
  });

  // Cleanup any items with 0 quantity
  order.items = order.items.filter(i => i.qty > 0);

  order.totalPrice = order.items.reduce((sum, i) => sum + i.subtotal, 0);

  // Debug: always log cart state after modification
  console.log(`  🛒 [Cart] Updated: ${order.items.map(i => `${i.name} ×${i.qty}`).join(', ')} | Total: Rs.${order.totalPrice}`);

  return order;
}


// ─────────────────────────────────────────────────────────────
//  REMOVE ITEM FROM CART
// ─────────────────────────────────────────────────────────────
function removeItemFromCart(sessionId, itemId) {
  const order = getOrder(sessionId);
  order.items = order.items.filter(i => String(i.id) !== String(itemId));
  order.totalPrice = order.items.reduce((sum, i) => sum + i.subtotal, 0);
  return order;
}


// ─────────────────────────────────────────────────────────────
//  CART SUMMARY (human readable — from CODE, not LLM)
// ─────────────────────────────────────────────────────────────
function getCartSummary(sessionId) {
  const order = getOrder(sessionId);
  return formatOrderSummary(order);
}


// ─────────────────────────────────────────────────────────────
//  HANDLE ORDER CONVERSATION
//  This agent is ONLY called when items + address + payment
//  are all collected. It handles: name, phone, confirmation.
// ─────────────────────────────────────────────────────────────
async function handleOrderMessage(sessionId, conversationHistory, detectedLanguage = 'ROMAN-URDU') {
  const order = getOrder(sessionId);
  const canonicalSummary = formatOrderSummary(order);

  // If the order is already under review or submitted, avoid looping
  if (order.status === 'REVIEWING') {
    return { reply: '🚧 Aapka order receptionist ke paas review ho raha hai. Please wait...', order, isConfirmed: false, cartSummary: canonicalSummary };
  }
  if (order.status === 'SUBMITTED') {
    return { reply: '✅ Aapka order submit ho chuka hai! Jaldi process hoga. Shukriya!', order, isConfirmed: true, cartSummary: canonicalSummary };
  }

  const systemPrompt = `You are WASI's order finalization agent for WhatsApp food ordering.

CURRENT ORDER STATE (THIS IS THE TRUTH — do NOT invent different items, quantities, or prices):
${canonicalSummary}

Customer Name: ${order.customerName || 'NOT COLLECTED'}
Phone: ${order.phoneNumber || 'NOT COLLECTED'}

YOUR JOB (in order):
1. If name is NOT COLLECTED → ask for customer's name. Nothing else.
2. If phone is NOT COLLECTED → ask for customer's phone number. Nothing else.
3. If both collected → show the EXACT order summary above (copy it verbatim), then ask: "Confirm karna chahte ho?"
4. If customer says yes/confirm/ok → emit ORDER_CONFIRMED signal.

CRITICAL RULES:
- NEVER generate your own item list, quantities, or prices. Use ONLY what is shown in CURRENT ORDER STATE above.
- NEVER mention delivery preparation, ETAs, or driver information.
- When showing the final summary, copy the items and total from CURRENT ORDER STATE exactly.
- After confirmation, say "Aapka order restaurant ko bhej diya gaya hai confirmation ke liye!" in ${detectedLanguage}. Do NOT say "order confirmed" or "order complete".

Reply in ${detectedLanguage}.

SIGNALS (append on new line when applicable):
- ORDER_CONFIRMED (when customer explicitly confirms the final order)
- NAME_CAPTURED: <name> (when customer gives their name)
- PHONE_CAPTURED: <phone> (when customer gives their phone number)`;

  const reply = await callLLM(systemPrompt, conversationHistory, 300);

  // ── Parse signals from LLM reply ──────────────────────────
  const nameMatch = reply.match(/NAME_CAPTURED:\s*(.+)/);
  if (nameMatch) {
    order.customerName = nameMatch[1].trim();
    console.log(`  👤 [Order] Name captured: ${order.customerName}`);
  }

  const phoneMatch = reply.match(/PHONE_CAPTURED:\s*(.+)/);
  if (phoneMatch) {
    order.phoneNumber = phoneMatch[1].trim();
    console.log(`  📱 [Order] Phone captured: ${order.phoneNumber}`);
  }

  const isConfirmed = reply.includes('ORDER_CONFIRMED');
  if (isConfirmed) {
    order.status = 'REVIEWING';
    console.log('🛎️ RECEPTIONIST_REVIEW:', JSON.stringify(order, null, 2));
  }

  // Clean reply — remove signal lines before sending to customer
  const cleanReply = reply
    .replace(/ORDER_CONFIRMED/g, '')
    .replace(/NAME_CAPTURED:.*$/m, '')
    .replace(/PHONE_CAPTURED:.*$/m, '')
    .trim();

  return {
    reply: cleanReply,
    order,
    isConfirmed,
    cartSummary: canonicalSummary,
  };
}


// ─────────────────────────────────────────────────────────────
//  SUBMIT ORDER
// ─────────────────────────────────────────────────────────────
function submitOrder(sessionId) {
  const order = getOrder(sessionId);
  order.status = 'SUBMITTED';
  order.submittedAt = new Date().toISOString();
  console.log('\n📦 NEW ORDER SUBMITTED:', JSON.stringify(order, null, 2));
  return order;
}


module.exports = {
  handleOrderMessage,
  addItemsToCart,
  removeItemFromCart,
  getCartSummary,
  submitOrder,
  getOrder,
};
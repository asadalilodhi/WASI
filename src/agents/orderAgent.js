// ============================================================
//  WASI — ORDER AGENT
//  Handles: building the cart, calculating totals, collecting
//  delivery address, confirming the final order before submit.
//
//  No provider switching needed here.
//  Always calls callLLM() from llm.js — switching happens there.
// ============================================================

const { callLLMChat } = require('../llm');
const { MENU } = require('./menuAgent');

// ─────────────────────────────────────────────────────────────
//  ORDER STATE
//  One order object per session — supervisor passes sessionId
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
      status: 'BUILDING', // BUILDING → CONFIRMING → CONFIRMED → SUBMITTED
      createdAt: new Date().toISOString(),
    };
  }
  return orders[sessionId];
}


// ─────────────────────────────────────────────────────────────
//  ADD ITEMS TO CART
//  Called by supervisor when menuAgent returns selectedItems
// ─────────────────────────────────────────────────────────────
function addItemsToCart(sessionId, selectedItems) {
  const order = getOrder(sessionId);

  selectedItems.forEach((incoming) => {
    const menuItem = MENU.find(m => m.id === incoming.id);
    if (!menuItem) return; // skip unknown items

    // If item already in cart, increase quantity
    const existing = order.items.find(i => i.id === incoming.id);
    if (existing) {
      existing.qty += incoming.qty;
      existing.subtotal = existing.qty * existing.price;
    } else {
      order.items.push({
        id:       menuItem.id,
        name:     menuItem.name,
        qty:      incoming.qty,
        price:    menuItem.price,
        subtotal: incoming.qty * menuItem.price,
      });
    }
  });

  // Recalculate total
  order.totalPrice = order.items.reduce((sum, i) => sum + i.subtotal, 0);
  return order;
}


// ─────────────────────────────────────────────────────────────
//  REMOVE ITEM FROM CART
//  Customer says "remove the coke" or "cancel fries"
// ─────────────────────────────────────────────────────────────
function removeItemFromCart(sessionId, itemId) {
  const order = getOrder(sessionId);
  order.items = order.items.filter(i => i.id !== itemId);
  order.totalPrice = order.items.reduce((sum, i) => sum + i.subtotal, 0);
  return order;
}


// ─────────────────────────────────────────────────────────────
//  CART SUMMARY (human readable)
//  Used to show customer what's in their order
// ─────────────────────────────────────────────────────────────
function getCartSummary(sessionId) {
  const order = getOrder(sessionId);

  if (order.items.length === 0) return 'Your cart is empty.';

  const lines = order.items.map(
    i => `• ${i.name} x${i.qty} = Rs.${i.subtotal}`
  );
  lines.push(`\nTotal: Rs.${order.totalPrice}`);
  return lines.join('\n');
}


// ─────────────────────────────────────────────────────────────
//  HANDLE ORDER CONVERSATION
//  Manages the flow: cart → address → payment → confirmation
//  detectedLanguage passed in so LLM replies in correct language
// ─────────────────────────────────────────────────────────────
async function handleOrderMessage(sessionId, customerMessage, detectedLanguage = 'ROMAN-URDU') {
  const order = getOrder(sessionId);
  const cartSummary = getCartSummary(sessionId);

  const systemPrompt = `
    You are the Order Agent for WASI, a WhatsApp food ordering assistant.

    Current order state:
    - Items in cart: ${JSON.stringify(order.items)}
    - Cart summary: ${cartSummary}
    - Delivery address: ${order.deliveryAddress || 'NOT PROVIDED YET'}
    - Payment method: ${order.paymentMethod || 'NOT CHOSEN YET'}
    - Order status: ${order.status}

    Your job — guide customer through these steps IN ORDER:
    1. If cart is empty → ask them to choose items first
    2. If cart has items but NO address → ask for delivery address
    3. If address collected but NO payment → ask payment method (Cash on Delivery or Online Transfer)
    4. If all collected → show full order summary and ask for confirmation

    Payment options available: Cash on Delivery, Online Transfer (Easypaisa/JazzCash)

    Always reply in ${detectedLanguage}.

    When customer confirms the order, end your reply with:
    ORDER_CONFIRMED

    When customer provides their address, end your reply with:
    ADDRESS_CAPTURED: <the address they gave>

    When customer chooses payment, end your reply with:
    PAYMENT_CAPTURED: <Cash on Delivery or Online Transfer>
  `;

  const reply = await callLLMChat(systemPrompt, customerMessage);

  // ── Parse signals from LLM reply ──────────────────────────

  // Capture address
  const addressMatch = reply.match(/ADDRESS_CAPTURED:\s*(.+)/);
  if (addressMatch) {
    order.deliveryAddress = addressMatch[1].trim();
    order.status = 'CONFIRMING';
  }

  // Capture payment method
  const paymentMatch = reply.match(/PAYMENT_CAPTURED:\s*(.+)/);
  if (paymentMatch) {
    order.paymentMethod = paymentMatch[1].trim();
  }

  // Order confirmed
  const isConfirmed = reply.includes('ORDER_CONFIRMED');
  if (isConfirmed) {
    order.status = 'CONFIRMED';
  }

  // Clean reply — remove signal lines before sending to customer
  const cleanReply = reply
    .replace(/ORDER_CONFIRMED/g, '')
    .replace(/ADDRESS_CAPTURED:.*$/m, '')
    .replace(/PAYMENT_CAPTURED:.*$/m, '')
    .trim();

  return {
    reply: cleanReply,
    order,                  // full order object for supervisor/dashboard
    isConfirmed,            // true when customer says yes to final summary
    cartSummary,
  };
}


// ─────────────────────────────────────────────────────────────
//  SUBMIT ORDER
//  Called by supervisor after ORDER_CONFIRMED
//  Marks order as SUBMITTED — dashboard picks it up from here
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
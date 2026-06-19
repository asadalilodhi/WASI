// ============================================================
//  WASI — ORDER UTILITIES
//
//  Shared utility for generating canonical order summaries.
//  Every agent imports this instead of generating its own.
//  This is the SINGLE SOURCE OF TRUTH for order display.
// ============================================================

/**
 * Generate a canonical, human-readable order summary from the order object.
 * This is what gets injected into every agent prompt so the LLM never
 * needs to "remember" what the customer ordered.
 *
 * @param {Object} order - The order object from orderAgent.getOrder()
 * @returns {string} - Formatted summary string
 */
function formatOrderSummary(order) {
  if (!order || !order.items || order.items.length === 0) {
    return 'Cart is empty.';
  }

  const lines = [];
  lines.push('--- ORDER SUMMARY (from system, do NOT modify) ---');

  order.items.forEach(item => {
    lines.push(`• ${item.name} ×${item.qty} = Rs.${item.subtotal}`);
  });

  lines.push(`Subtotal: Rs.${order.totalPrice}`);

  if (order.deliveryFee) {
    lines.push(`Delivery Fee: Rs.${order.deliveryFee}`);
    lines.push(`Grand Total: Rs.${order.totalPrice + order.deliveryFee}`);
  } else {
    lines.push(`Total: Rs.${order.totalPrice}`);
  }

  if (order.deliveryAddress) {
    lines.push(`Address: ${order.deliveryAddress}`);
  }
  if (order.orderType) {
    lines.push(`Type: ${order.orderType}`);
  }
  if (order.paymentMethod) {
    lines.push(`Payment: ${order.paymentMethod}`);
  }
  if (order.customerName) {
    lines.push(`Name: ${order.customerName}`);
  }
  if (order.phoneNumber) {
    lines.push(`Phone: ${order.phoneNumber}`);
  }

  lines.push('--- END ORDER SUMMARY ---');
  return lines.join('\n');
}

module.exports = { formatOrderSummary };

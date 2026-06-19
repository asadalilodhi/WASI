// ============================================================
//  WASI — BAND AI LOCAL TOOL LOGIC
//
//  This file demonstrates the logic for the tool defined in
//  your agent_config.yaml file.
// ============================================================

// In your real setup, you will import your Socket.io instance and Database
// from server.js so you can push the update directly to the Receptionist.
// Example: const { io, ordersDb } = require('./server');

/**
 * Tool: submit_order_to_restaurant
 * Description: Called by the Band AI Agent when the user confirms their order.
 * 
 * @param {string} sessionId - The customer's phone number
 * @param {object} orderData - The JSON payload containing items, total, etc.
 */
async function executeSubmitOrderTool(sessionId, orderData) {
  console.log(`\n🤖 [Band AI Local Agent] Executing tool: submit_order_to_restaurant`);
  console.log(`🛎️ Received order for session: ${sessionId}`);
  console.log(JSON.stringify(orderData, null, 2));

  try {
    // 1. Save the order to your local database
    // ordersDb[sessionId] = orderData;

    // 2. Blast the order directly to your Receptionist Web Portal via WebSockets!
    // io.emit('NEW_ORDER', { sessionId, order: orderData });

    // 3. Return a success message back to the LLM so it knows the tool worked
    return "SUCCESS: The order has been submitted to the kitchen. Please tell the customer that their order is pending receptionist review.";
  } catch (error) {
    console.error(`⚠️ Failed to submit order:`, error);
    return "ERROR: Failed to submit order to kitchen. Please apologize to the customer.";
  }
}

module.exports = { executeSubmitOrderTool };

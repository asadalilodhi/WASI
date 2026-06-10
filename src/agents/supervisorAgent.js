const { callLLM } = require('../llm');

// This holds the order being built — one per session
const sessions = {};

async function handleMessage(sessionId, customerMessage) {
  // Get or create session
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      state: 'ACTIVE',
      cart: [],
      customerName: null,
      address: null,
      paymentMethod: null
    };
  }

  const session = sessions[sessionId];

  // Build the system prompt from current session state
  const systemPrompt = `
    You are WASI, a WhatsApp food ordering assistant.
    Current order state: ${JSON.stringify(session)}
    Your job: guide the customer step by step to complete their order.
    Steps: 1) Take their order items 2) Get delivery address 3) Confirm payment method
    When all 3 are done, say ORDER_COMPLETE.
    Respond in the customer's language (English/Roman-Urdu).
  `;

  const reply = await callLLM(systemPrompt, customerMessage);

  // Check if order is complete
  if (reply.includes('ORDER_COMPLETE')) {
    session.state = 'SUBMITTED';
    console.log('Order ready for dashboard:', session);
  }

  return reply;
}

module.exports = { handleMessage, sessions };
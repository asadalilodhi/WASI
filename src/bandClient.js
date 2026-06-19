// ============================================================
//  WASI — BAND AI CLIENT
//
//  Forwards WhatsApp messages and Receptionist System Messages
//  to the Band AI Project endpoint.
// ============================================================

const axios = require('axios');
require('dotenv').config();

/**
 * Sends a message to Band AI on behalf of a specific session/phone number.
 * @param {string} sessionId - The phone number acting as the session ID
 * @param {string} message - The message content
 * @param {string} role - 'user' for customer messages, 'system' for receptionist feedback
 * @returns {Promise<object>} - The full payload containing reply, orderSubmitted, etc.
 */
async function callBandAI(sessionId, message, role = 'user') {
  const url = `http://localhost:3001/chat`;

  const payload = {
    sender: sessionId,
    message: message,
    role: role
  };

  try {
    const response = await axios.post(url, payload);
    return response.data;
  } catch (error) {
    console.error(`⚠️ [BandClient] Error calling local Band Agent:`, error.message);
    return { reply: "Sorry, the restaurant's AI system is currently down. Please try again later." };
  }
}

/**
 * Injects Receptionist feedback into the Band AI session (Usually for rejections/revisions).
 */
async function sendReceptionistFeedbackToBand(sessionId, feedback) {
  const systemMessage = `[SYSTEM MESSAGE FROM RECEPTIONIST]: The receptionist rejected the order or requested changes. Feedback: "${feedback}". Please clear the rejected field and ask the customer to provide it again.`;
  return await callBandAI(sessionId, systemMessage, 'system');
}

/**
 * Injects Receptionist Note or Quick Reply into the Band AI session.
 */
async function sendReceptionistNoteToBand(sessionId, note) {
  const systemMessage = `[SYSTEM MESSAGE FROM RECEPTIONIST]: "${note}". Please relay this message or address this constraint with the customer directly.`;
  return await callBandAI(sessionId, systemMessage, 'system');
}

module.exports = { callBandAI, sendReceptionistFeedbackToBand, sendReceptionistNoteToBand };

// ============================================================
//  WASI — BAND AI CLIENT
//
//  Forwards WhatsApp messages and Receptionist System Messages
//  to the Band AI Project endpoint.
// ============================================================

const { exec } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

function getJidFromUuid(uuid) {
  try {
    const sessionsPath = path.join(__dirname, '..', 'sessions.json');
    if (fs.existsSync(sessionsPath)) {
      const sessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf8'));
      // Find the JID (key) that has this UUID (value)
      for (const [jid, roomId] of Object.entries(sessions)) {
        if (roomId === uuid) return jid;
      }
    }
  } catch (e) {
    console.error("Error reading sessions.json:", e);
  }
  return uuid;
}

const axios = require('axios');

function injectEvent(chatId, message, role = "system", orderStatus = null) {
  return new Promise((resolve, reject) => {
    const payload = {
      sessionId: chatId,
      text: message,
      role: role
    };
    if (orderStatus) {
      payload.order_status = orderStatus;
    }
    axios.post('http://127.0.0.1:8000/band_webhook', payload).then(response => {
      console.log(`[BandClient] Event Injected via Local Server: ${message.substring(0, 30)}...`);
      resolve();
    }).catch(error => {
      console.error(`⚠️ [BandClient] Error injecting event via Local Server: ${error.message}`);
      reject(error);
    });
  });
}

/**
 * Injects Receptionist feedback into the Band AI session.
 */
async function sendReceptionistFeedbackToBand(sessionId, feedback) {
  const systemMessage = `[SYSTEM MESSAGE FROM RECEPTIONIST]: The receptionist rejected the order or requested changes. Feedback: "${feedback}". Please clear the rejected field and ask the customer to provide it again.`;
  await injectEvent(sessionId, systemMessage, "system", "REVISION_NEEDED");
}

/**
 * Injects Receptionist Note or Quick Reply into the Band AI session.
 */
async function sendReceptionistNoteToBand(sessionId, note) {
  const systemMessage = `[SYSTEM MESSAGE FROM RECEPTIONIST]: "${note}". Please relay this message or address this constraint with the customer directly.`;
  await injectEvent(sessionId, systemMessage, "system", "REVISION_NEEDED");
}

/**
 * Forwards user messages from WhatsApp to Band AI.
 * We pass 'user' as the role.
 */
async function callBandAI(chatId, message) {
  await injectEvent(chatId, message, "user");
  return {};
}

module.exports = { sendReceptionistFeedbackToBand, sendReceptionistNoteToBand, callBandAI, getJidFromUuid };

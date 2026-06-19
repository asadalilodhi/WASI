// ============================================================
//  WASI — WHATSAPP CLIENT (Baileys)
//
//  Handles connecting to WhatsApp Web using a personal number.
//  Routes incoming messages to Band AI server and sends responses.
// ============================================================

const qrcode = require('qrcode-terminal');
const { callBandAI } = require('./bandClient');
const { setWhatsAppSender } = require('./agents/notificationAgent');

let sock;
let makeWASocket, useMultiFileAuthState, DisconnectReason;
let onOrderSubmittedCallback = null;

function setOrderSubmittedCallback(callback) {
  onOrderSubmittedCallback = callback;
}

async function connectToWhatsApp(onReady) {
  if (!makeWASocket) {
    const baileys = await import('@whiskeysockets/baileys');
    makeWASocket = baileys.default;
    useMultiFileAuthState = baileys.useMultiFileAuthState;
    DisconnectReason = baileys.DisconnectReason;
  }
  // Save credentials in a local folder so you don't have to scan QR every time
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

  sock = makeWASocket({
    auth: state,
  });
  
  // Wire up the notification agent to send messages using this sock
  setWhatsAppSender(sendMessage);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('📱 Scan the QR code below to connect WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
      // reconnect if not logged out
      if (shouldReconnect) {
        connectToWhatsApp(onReady);
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp connection opened successfully!');
      if (onReady) onReady(sock);
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    
    // Ignore messages sent by the bot itself or system messages
    if (!msg.message || msg.key.fromMe) return;
    
    // Extract text from standard message or extended text message
    const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!messageContent) return;

    const senderNumber = msg.key.remoteJid; // e.g., '1234567890@s.whatsapp.net'
    
    // Ignore group messages and broadcasts!
    if (senderNumber.endsWith('@g.us') || senderNumber.endsWith('@broadcast')) {
        console.log(`[WhatsApp] Ignored group message from ${senderNumber}`);
        return;
    }
    console.log(`\n💬 [WhatsApp] Received from ${senderNumber}: ${messageContent}`);

    try {
      // Send a realistic "Typing..." indicator immediately to mask AI latency
      await sock.sendPresenceUpdate('composing', senderNumber);

      // Forward message to Band AI Server
      const result = await callBandAI(senderNumber, messageContent);
      
      // Stop "Typing..." and send the response back
      await sock.sendPresenceUpdate('paused', senderNumber);
      if (result && result.reply) {
         await sendMessage(senderNumber, result.reply);
      }

      // If order is submitted, notify the server dashboard
      if (result && result.orderSubmitted && onOrderSubmittedCallback) {
         onOrderSubmittedCallback(result.sessionId, result.order);
      }
    } catch (error) {
      console.error('⚠️ [WhatsApp] Error processing message:', error);
      await sendMessage(senderNumber, "Sorry, I'm having trouble connecting to the restaurant's brain right now.");
    }
  });
}

/**
 * Sends a message to a specific WhatsApp number
 * @param {string} remoteJid - The WhatsApp ID (e.g., '1234567890@s.whatsapp.net')
 * @param {string} text - The message to send
 */
async function sendMessage(remoteJid, text) {
  if (!sock) {
    console.error('⚠️ [WhatsApp] Socket not initialized.');
    return;
  }
  await sock.sendMessage(remoteJid, { text: text });
  console.log(`📤 [WhatsApp] Sent to ${remoteJid}: ${text}\n`);
}

module.exports = { connectToWhatsApp, sendMessage, setOrderSubmittedCallback };

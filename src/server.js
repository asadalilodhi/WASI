// ============================================================
//  WASI — EXPRESS SERVER & WEBSOCKETS (Production Entry Point)
//
//  Serves APIs for the Receptionist Web Portal and connects
//  to WhatsApp via Baileys.
// ============================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { connectToWhatsApp, setOrderSubmittedCallback, sendMessage } = require('./whatsappClient');
const { sendReceptionistFeedbackToBand } = require('./bandClient');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // Update in production to match your frontend URL
});

app.use(cors());
app.use(express.json());

// In-Memory Database for active orders
// In a real app, use MongoDB or PostgreSQL
const ordersDb = {}; 

// ─────────────────────────────────────────────────────────────
//  WEBSOCKETS: Receptionist Dashboard Connection
// ─────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 [WebSockets] Receptionist connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 [WebSockets] Receptionist disconnected: ${socket.id}`);
  });
});

// ─────────────────────────────────────────────────────────────
//  API ENDPOINTS: Receptionist Web Portal
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all active orders for the dashboard
 */
app.get('/api/orders', (req, res) => {
  res.json(ordersDb);
});

/**
 * Receptionist rejects/updates the order.
 * We inject this feedback back into the local Supervisor Agent session.
 */
app.post('/api/orders/:id/feedback', async (req, res) => {
  const sessionId = req.params.id;
  const { feedback } = req.body;

  if (!ordersDb[sessionId]) {
    return res.status(404).json({ error: 'Order not found' });
  }

  console.log(`\n👨‍💼 [Receptionist] Feedback for ${sessionId}: "${feedback}"`);

  // Inject system message to Band AI so it alerts the customer
  const bandReply = await sendReceptionistFeedbackToBand(sessionId, feedback);
  const replyMsg = bandReply ? bandReply.reply : null;
  
  // Send the feedback reply directly to the customer's WhatsApp
  const targetPhone = sessionId;
  if (replyMsg) {
      await sendMessage(targetPhone, replyMsg);
  }

  // Update order status in DB
  ordersDb[sessionId].status = 'REVISION_NEEDED';
  io.emit('ORDER_UPDATED', { sessionId, order: ordersDb[sessionId] });

  res.json({ status: 'Feedback sent to customer via Band AI', ai_response: replyMsg });
});

/**
 * Receptionist sends a Note or Quick Reply (does NOT reject order).
 */
app.post('/api/orders/:id/note', async (req, res) => {
  const sessionId = req.params.id;
  const { note } = req.body;

  if (!ordersDb[sessionId]) {
    return res.status(404).json({ error: 'Order not found' });
  }

  console.log(`\n👨‍💼 [Receptionist] Note for ${sessionId}: "${note}"`);

  // Inject system message to Band AI so it addresses the note with the customer
  const { sendReceptionistNoteToBand } = require('./bandClient');
  const bandReply = await sendReceptionistNoteToBand(sessionId, note);
  const replyMsg = bandReply ? bandReply.reply : null;
  
  // Send the reply directly to the customer's WhatsApp
  const targetPhone = sessionId;
  if (replyMsg) {
      await sendMessage(targetPhone, replyMsg);
  }

  // We do NOT change order status to 'REVISION_NEEDED' here since it's just a note.
  res.json({ status: 'Note sent to customer via Band AI', ai_response: replyMsg });
});

/**
 * Receptionist confirms the order.
 */
app.post('/api/orders/:id/confirm', (req, res) => {
  const sessionId = req.params.id;

  if (!ordersDb[sessionId]) {
    return res.status(404).json({ error: 'Order not found' });
  }

  ordersDb[sessionId].status = 'CONFIRMED';
  console.log(`\n✅ [Receptionist] Order ${sessionId} confirmed! Sending to kitchen.`);
  
  // Update dashboard
  io.emit('ORDER_UPDATED', { sessionId, order: ordersDb[sessionId] });

  res.json({ status: 'Order confirmed' });
});

/**
 * Band AI calls this endpoint when an order is finalized (Webhook Tool Call)
 */
app.post('/api/webhook/tool', (req, res) => {
  const { sessionId, orderData } = req.body;
  if (!sessionId || !orderData) {
    return res.status(400).json({ error: 'Missing sessionId or orderData' });
  }

  ordersDb[sessionId] = orderData;
  console.log(`\n🛎️ [Server] Received order from Band AI for session: ${sessionId}`);
  io.emit('NEW_ORDER', { sessionId, order: orderData });

  res.status(200).json({ status: 'Order successfully sent to restaurant portal.' });
});

// ─────────────────────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log(`\n🚀 WASI Production Server running on port ${PORT}`);
  
  // Initialize WhatsApp connection
  console.log(`📱 Initializing WhatsApp Baileys Client...`);
  
  setOrderSubmittedCallback((sessionId, order) => {
    // Already handled by webhook now, but we'll leave this in case
    ordersDb[sessionId] = order;
    console.log(`\n🛎️ [Server] Received order from Band AI via callback: ${sessionId}`);
    io.emit('NEW_ORDER', { sessionId, order });
  });

  connectToWhatsApp();
});

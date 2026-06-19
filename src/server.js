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
const { sendReceptionistFeedbackToBand, sendReceptionistNoteToBand } = require('./bandClient');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // Update in production to match your frontend URL
});

app.use(cors());
app.use(express.json());

// Prevent Node from crashing on unhandled errors (e.g. Baileys decryption errors on stale group sessions)
process.on('uncaughtException', (err) => {
  console.error('🔥 [CRITICAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 [CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const processedFeedback = new Set();

setInterval(async () => {
  try {
    const { data: orders, error } = await supabase.from('orders').select('*');
    if (error || !orders) return;

    for (const o of orders) {
      if (o.notes && o.status === 'REVISION_NEEDED') {
        const key = o.id + '_feedback_' + o.notes;
        if (!processedFeedback.has(key)) {
          processedFeedback.add(key);
          console.log(`\n👨‍💼 [Receptionist] Feedback for ${o.id}: "${o.notes}"`);
          const bandReply = await sendReceptionistFeedbackToBand(o.id, o.notes);
          if (bandReply && bandReply.reply) {
            await sendMessage(o.id, bandReply.reply);
          }
        }
      } else if (o.notes && o.status !== 'REVISION_NEEDED') {
        const key = o.id + '_note_' + o.notes;
        if (!processedFeedback.has(key)) {
          processedFeedback.add(key);
          console.log(`\n👨‍💼 [Receptionist] Note for ${o.id}: "${o.notes}"`);
          const bandReply = await sendReceptionistNoteToBand(o.id, o.notes);
          if (bandReply && bandReply.reply) {
            await sendMessage(o.id, bandReply.reply);
          }
        }
      }
    }
  } catch (err) {
    // ignore polling errors
  }
}, 3000);

/**
 * Band AI calls this endpoint when an order is finalized (Webhook Tool Call)
 */
app.post('/api/webhook/tool', async (req, res) => {
  const { sessionId, orderData } = req.body;
  if (!sessionId || !orderData) {
    return res.status(400).json({ error: 'Missing sessionId or orderData' });
  }

  console.log(`\n🛎️ [Server] Received order from Band AI for session: ${sessionId}`);
  
  await supabase.from('orders').upsert({
      id: sessionId,
      customer: orderData.customerName || 'Unknown',
      phone: orderData.phoneNumber || sessionId,
      address: orderData.deliveryAddress,
      type: orderData.orderType || 'DELIVERY',
      payment: orderData.paymentMethod || 'COD',
      items: orderData.items || [],
      deliveryFee: orderData.orderType === 'DELIVERY' ? 100 : 0,
      arrivedMinutesAgo: 0,
      status: 'pending',
      notes: ''
  });

  res.status(200).json({ status: 'Order successfully sent to restaurant portal.' });
});

/**
 * Band AI LangGraph Python Agent calls this endpoint for Assistant replies.
 */
app.post('/api/webhook/whatsapp', async (req, res) => {
  const { sessionId, text } = req.body;
  if (!sessionId || !text) {
    return res.status(400).json({ error: 'Missing sessionId or text' });
  }

  const { getJidFromUuid } = require('./bandClient');
  const jid = getJidFromUuid(sessionId);

  console.log(`\n[Webhook] Routing message from Band AI to WhatsApp: ${jid}`);
  await sendMessage(jid, text);

  res.status(200).json({ status: 'Message forwarded to WhatsApp.' });
});

/**
 * Generates an AI Business Insights Report
 */
app.get('/api/analytics', (req, res) => {
  const { exec } = require('child_process');
  const path = require('path');
  const scriptPath = path.join(__dirname, '..', 'analytics_agent.py');
  
  exec(`uv run python "${scriptPath}"`, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Analytics Error: ${error.message}`);
      return res.status(500).json({ error: 'Failed to generate report' });
    }
    res.json({ report: stdout });
  });
});

// ─────────────────────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log(`\n🚀 WASI Production Server running on port ${PORT}`);
  
  // Initialize WhatsApp connection
  console.log(`📱 Initializing WhatsApp Baileys Client...`);
  
  setOrderSubmittedCallback(async (sessionId, order) => {
    console.log(`\n🛎️ [Server] Received order from Band AI via callback: ${sessionId}`);
    await supabase.from('orders').upsert({
      id: sessionId,
      customer: order.customerName || 'Unknown',
      phone: order.phoneNumber || sessionId,
      address: order.deliveryAddress,
      type: order.orderType || 'DELIVERY',
      payment: order.paymentMethod || 'COD',
      items: order.items || [],
      deliveryFee: order.orderType === 'DELIVERY' ? 100 : 0,
      arrivedMinutesAgo: 0,
      status: 'pending',
      notes: ''
    });
  });

  connectToWhatsApp();
});

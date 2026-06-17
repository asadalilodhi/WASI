// ============================================================
//  WASI — SESSION MANAGER AGENT
//  SRS Ref: Section 3.2, Section 3.4, FR-C10
//
//  Responsibilities:
//  - Track session state per customer (one session per phone number)
//  - Enforce grace period (3-5 min inactivity → EXPIRED)
//  - Trigger expiry notification via Notification Agent
//  - Resume session if customer returns within grace period
//
//  Session states (SRS 3.4):
//  INITIATED → OTP_PENDING → ACTIVE → ORDERING →
//  SUBMITTED → CONFIRMED → REJECTED → EXPIRED → CANCELLED
// ============================================================

const GRACE_PERIOD_MS = 4 * 60 * 1000; // 4 minutes default (SRS: 3-5 min, default 4)

// ─────────────────────────────────────────────────────────────
//  SESSION STORE (in-memory)
//  Later: move to Redis for persistence (SRS stack Section 10)
// ─────────────────────────────────────────────────────────────
const sessions = {};


// ─────────────────────────────────────────────────────────────
//  CREATE SESSION
//  Called when a customer sends their first message
// ─────────────────────────────────────────────────────────────
function createSession(sessionId, phoneNumber, tenantId = 'default') {
  sessions[sessionId] = {
    sessionId,
    phoneNumber,
    tenantId,
    state:          'INITIATED',
    language:       null, // Set to null initially so we detect on first message
    conversationHistory: [], // Array of {role: 'user'|'assistant', content: string}
    cartSnapshot:   null,
    createdAt:      new Date().toISOString(),
    lastActiveAt:   new Date().toISOString(),
    closedAt:       null,
    expiryTimer:    null,   // holds the setTimeout reference
  };
  return sessions[sessionId];
}


// ─────────────────────────────────────────────────────────────
//  GET SESSION
// ─────────────────────────────────────────────────────────────
function getSession(sessionId) {
  return sessions[sessionId] || null;
}


// ─────────────────────────────────────────────────────────────
//  GET SESSION BY PHONE NUMBER
//  Used to detect returning customers mid-session
// ─────────────────────────────────────────────────────────────
function getSessionByPhone(phoneNumber) {
  return Object.values(sessions).find(
    s => s.phoneNumber === phoneNumber &&
         !['CONFIRMED', 'REJECTED', 'EXPIRED', 'CANCELLED'].includes(s.state)
  ) || null;
}


// ─────────────────────────────────────────────────────────────
//  UPDATE SESSION STATE
// ─────────────────────────────────────────────────────────────
function updateState(sessionId, newState) {
  const session = sessions[sessionId];
  if (!session) return null;
  session.state = newState;
  session.lastActiveAt = new Date().toISOString();
  if (['CONFIRMED', 'REJECTED', 'EXPIRED', 'CANCELLED'].includes(newState)) {
    session.closedAt = new Date().toISOString();
  }
  return session;
}


// ─────────────────────────────────────────────────────────────
//  TOUCH SESSION (reset inactivity timer)
//  Called every time a customer sends a message
// ─────────────────────────────────────────────────────────────
function touchSession(sessionId, onExpiry) {
  const session = sessions[sessionId];
  if (!session) return;

  session.lastActiveAt = new Date().toISOString();

  // Clear existing timer
  if (session.expiryTimer) {
    clearTimeout(session.expiryTimer);
  }

  // Only set timer if session is in an expirable state
  if (['ACTIVE', 'ORDERING'].includes(session.state)) {
    session.expiryTimer = setTimeout(() => {
      if (['ACTIVE', 'ORDERING'].includes(session.state)) {
        session.state    = 'EXPIRED';
        session.closedAt = new Date().toISOString();
        console.log(`[SessionManager] Session ${sessionId} expired due to inactivity.`);
        if (onExpiry) onExpiry(session); // Supervisor handles notification
      }
    }, GRACE_PERIOD_MS);
  }
}


// ─────────────────────────────────────────────────────────────
//  SAVE CART SNAPSHOT
//  Preserves cart if customer disconnects mid-order (SRS 8.3)
// ─────────────────────────────────────────────────────────────
function saveCartSnapshot(sessionId, cartData) {
  const session = sessions[sessionId];
  if (session) session.cartSnapshot = cartData;
}


// ─────────────────────────────────────────────────────────────
//  CANCEL SESSION
// ─────────────────────────────────────────────────────────────
function cancelSession(sessionId) {
  const session = sessions[sessionId];
  if (!session) return;
  if (session.expiryTimer) clearTimeout(session.expiryTimer);
  session.state    = 'CANCELLED';
  session.closedAt = new Date().toISOString();
}


// ─────────────────────────────────────────────────────────────
//  CONVERSATION HISTORY HELPERS
// ─────────────────────────────────────────────────────────────
function addToHistory(sessionId, role, content) {
  const session = sessions[sessionId];
  if (!session) return;
  session.conversationHistory.push({ role, content });
  // Keep last 30 messages (15 turns) to prevent context window overflow
  if (session.conversationHistory.length > 30) {
    session.conversationHistory = session.conversationHistory.slice(-30);
  }
}

function getHistory(sessionId) {
  const session = sessions[sessionId];
  return session ? session.conversationHistory : [];
}

module.exports = {
  createSession,
  getSession,
  getSessionByPhone,
  updateState,
  touchSession,
  saveCartSnapshot,
  cancelSession,
  addToHistory,
  getHistory,
  GRACE_PERIOD_MS,
};
// ============================================================
//  WASI — DELIVERY AGENT
//  SRS Ref: Section 3.2, FR-C07
//
//  Responsibilities:
//  - Collect and validate delivery address from customer
//  - Determine order type (delivery or takeaway)
//  - Estimate delivery time based on tenant zone config
//
//  No provider switching needed here.
//  Always calls callLLM() from llm.js — switching happens there.
// ============================================================

const { callLLMChat } = require('../llm');

// ─────────────────────────────────────────────────────────────
//  DELIVERY ZONES CONFIG
//  Later: pull this from tenant config in database (Section 6.4)
// ─────────────────────────────────────────────────────────────
const DELIVERY_ZONES = [
  { zone: 'Zone A', areas: ['Gulshan', 'Clifton', 'DHA'],        fee: 100, eta: '20-30 mins' },
  { zone: 'Zone B', areas: ['Nazimabad', 'North Karachi', 'FB Area'], fee: 150, eta: '30-45 mins' },
  { zone: 'Zone C', areas: ['Korangi', 'Landhi', 'Malir'],       fee: 200, eta: '45-60 mins' },
];

// ─────────────────────────────────────────────────────────────
//  DETECT ZONE FROM ADDRESS
//  Simple keyword match — later can be upgraded to geo-API
// ─────────────────────────────────────────────────────────────
function detectZone(address) {
  const lower = address.toLowerCase();
  for (const zone of DELIVERY_ZONES) {
    if (zone.areas.some(area => lower.includes(area.toLowerCase()))) {
      return zone;
    }
  }
  return null; // address not in a known zone
}


// ─────────────────────────────────────────────────────────────
//  MAIN: HANDLE DELIVERY MESSAGE
//  Collects order type, address, validates zone, gives ETA
// ─────────────────────────────────────────────────────────────
async function handleDeliveryMessage(customerMessage, detectedLanguage = 'ROMAN-URDU') {
  const systemPrompt = `
    You are the Delivery Agent for WASI, a WhatsApp food ordering assistant.

    Your job — collect the following information step by step:
    1. Is this a DELIVERY or TAKEAWAY order? Ask if not clear.
    2. If DELIVERY: ask for the full delivery address (street, area, city).
    3. Once address is given: confirm it back to the customer.

    Available delivery zones and fees:
    ${DELIVERY_ZONES.map(z => `- ${z.zone} (${z.areas.join(', ')}): Rs.${z.fee} fee, ETA: ${z.eta}`).join('\n')}

    Always reply in ${detectedLanguage}.

    When order type is determined, end your reply with:
    ORDER_TYPE: DELIVERY or ORDER_TYPE: TAKEAWAY

    When address is confirmed, end your reply with:
    ADDRESS_CAPTURED: <exact address the customer gave>

    If the address is outside all delivery zones, inform the customer and ask
    them to switch to takeaway or provide a different address.
    End with: ADDRESS_OUT_OF_ZONE
  `;

  const reply = await callLLMChat(systemPrompt, customerMessage);

  // Parse signals
  const orderTypeMatch = reply.match(/ORDER_TYPE:\s*(DELIVERY|TAKEAWAY)/);
  const addressMatch   = reply.match(/ADDRESS_CAPTURED:\s*(.+)/);
  const outOfZone      = reply.includes('ADDRESS_OUT_OF_ZONE');

  const orderType = orderTypeMatch ? orderTypeMatch[1].trim() : null;
  const rawAddress = addressMatch ? addressMatch[1].trim() : null;
  const zone = rawAddress ? detectZone(rawAddress) : null;

  // Clean reply
  const cleanReply = reply
    .replace(/ORDER_TYPE:.*$/m, '')
    .replace(/ADDRESS_CAPTURED:.*$/m, '')
    .replace(/ADDRESS_OUT_OF_ZONE/g, '')
    .trim();

  return {
    reply: cleanReply,
    orderType,                    // 'DELIVERY' | 'TAKEAWAY' | null
    rawAddress,                   // raw string from customer
    zone,                         // matched zone object or null
    deliveryFee: zone?.fee || 0,
    eta: zone?.eta || null,
    outOfZone,
  };
}

module.exports = { handleDeliveryMessage, detectZone, DELIVERY_ZONES };
// ============================================================
//  WASI — DELIVERY AGENT (Rebuilt for Consistency)
//
//  Two-phase address collection:
//  1. ADDRESS_CAPTURED = customer mentioned an address (DON'T save yet)
//  2. ADDRESS_CONFIRMED = customer confirmed full details (SAVE now)
//
//  The agent MUST ask for full details before confirming.
// ============================================================

const { callLLM } = require('../llm');

// ─────────────────────────────────────────────────────────────
//  DELIVERY ZONES CONFIG
// ─────────────────────────────────────────────────────────────
const DELIVERY_ZONES = [
  { zone: 'Zone A', areas: ['Gulshan', 'Clifton', 'DHA', 'Gulistan-e-Johar', 'Johar'],        fee: 100, eta: '20-30 mins' },
  { zone: 'Zone B', areas: ['Nazimabad', 'North Karachi', 'FB Area'], fee: 150, eta: '30-45 mins' },
  { zone: 'Zone C', areas: ['Korangi', 'Landhi', 'Malir'],       fee: 200, eta: '45-60 mins' },
];

// Pre-build zone string once
const ZONES_STRING = DELIVERY_ZONES.map(z =>
  `${z.zone}: ${z.areas.join(', ')} — Rs.${z.fee}, ETA ${z.eta}`
).join('\n');

// ─────────────────────────────────────────────────────────────
//  DETECT ZONE FROM ADDRESS
// ─────────────────────────────────────────────────────────────
function detectZone(address) {
  const lower = address.toLowerCase();
  for (const zone of DELIVERY_ZONES) {
    if (zone.areas.some(area => lower.includes(area.toLowerCase()))) {
      return zone;
    }
  }
  return null;
}


// ─────────────────────────────────────────────────────────────
//  MAIN: HANDLE DELIVERY MESSAGE
// ─────────────────────────────────────────────────────────────
async function handleDeliveryMessage(conversationHistory, detectedLanguage = 'ROMAN-URDU', accumulatedAddress = null) {
  // --- STEP 1: THE BRAIN (Data Extraction) ---
  const brainPrompt = `You are a strict data-extraction parser for WASI food delivery.
Your ONLY job is to read the conversation and extract delivery details.

ADDRESS COLLECTED SO FAR: ${accumulatedAddress || 'None yet'}
(If the user provides new address info, APPEND it to the existing address. Do NOT replace it.)

DELIVERY ZONES:
${ZONES_STRING}

INSTRUCTIONS:
Extract the following information:
- orderType: "DELIVERY" or "TAKEAWAY"
- rawAddress: The FULL accumulated address including any new details the user just provided. Combine old + new.
- isConfirmed: true ONLY if the assistant asked the user to confirm a full address and the user explicitly said yes/haan/ji/ok.
- isOutOfZone: true if the address is provided but falls entirely outside all delivery zones.

You MUST output ONLY a valid JSON object matching this schema:
{
  "orderType": "DELIVERY",
  "rawAddress": "Habib University, Gate 2, Gulistan-e-Johar",
  "isConfirmed": true,
  "isOutOfZone": false
}
If a value is not yet known, set it to null.`;

  // Give the Brain the last assistant message + last user message for context
  const lastAssistant = conversationHistory.filter(msg => msg.role === 'assistant').pop();
  const lastUser = conversationHistory.filter(msg => msg.role === 'user').pop();
  const brainMessages = [lastAssistant, lastUser].filter(Boolean);

  let extracted = { orderType: null, rawAddress: null, isConfirmed: false, isOutOfZone: false };
  
  try {
    const brainReply = await callLLM(brainPrompt, brainMessages, 200, true);
    const parsed = JSON.parse(brainReply);
    if (parsed) {
      extracted = { ...extracted, ...parsed };
      console.log(`  🧠 [Delivery Brain] Extracted: ${JSON.stringify(extracted)}`);
    }
  } catch (e) {
    console.log(`  ⚠️ [Delivery Brain] Failed to extract JSON. Error: ${e.message}`);
  }

  // --- STEP 2: THE MOUTH (Conversation Generation) ---
  const mouthPrompt = `You are WASI's delivery agent. Your job is to collect the delivery address.

CURRENT EXTRACTED STATE:
Order Type: ${extracted.orderType || 'Unknown'}
Address: ${extracted.rawAddress || 'Unknown'}
Confirmed: ${extracted.isConfirmed}

DELIVERY ZONES:
${ZONES_STRING}

COLLECT (step by step — follow this EXACTLY):
1. First ask: DELIVERY ya TAKEAWAY?
2. If DELIVERY: ask for FULL address — area, block/sector, street, house/building, landmark.
3. KEEP ASKING until you have at minimum: area name + specific location (street/house/gate/building).
   - "Gulistan-e-Johar" alone is NOT enough. Ask: "Gulistan-e-Johar mein kahan? Block, street, house number batao."
   - "Habib University" alone is NOT enough. Ask: "Konsa gate? Koi landmark?"
4. Once you have enough detail, confirm the FULL address back to the customer.

RULES:
- Be polite and concise.
- If address is outside ALL zones, politely suggest Takeaway or a different area.
- CRITICAL: DO NOT ask for name, phone number, or payment. Your ONLY job is the delivery address.
- CRITICAL: NEVER summarize the user's order cart or total price. Another system handles that.

Reply in ${detectedLanguage}.`;

  const cleanReply = await callLLM(mouthPrompt, conversationHistory, 250, false);

  const zone = extracted.rawAddress ? detectZone(extracted.rawAddress) : null;
  const isAddressConfirmed = extracted.isConfirmed && extracted.rawAddress;

  if (isAddressConfirmed) {
    console.log(`  📍 [Delivery] Address confirmed: ${extracted.rawAddress} | Zone: ${zone?.zone || 'NONE'}`);
  }

  return {
    reply: cleanReply,
    outOfZone: extracted.isOutOfZone,
    zone: zone,
    rawAddress: isAddressConfirmed ? extracted.rawAddress : null,
    partialAddress: extracted.rawAddress || null,  // Always return what the Brain extracted, even if unconfirmed
    orderType: extracted.orderType,
    deliveryFee: zone?.fee || 0,
    eta: zone?.eta || null
  };
}

module.exports = { handleDeliveryMessage, detectZone, DELIVERY_ZONES };
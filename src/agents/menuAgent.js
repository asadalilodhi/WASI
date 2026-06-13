// ============================================================
//  WASI — MENU AGENT
//  No provider switching needed here.
//  This file always just calls callLLM() from llm.js.
//  To switch providers: only change llm.js — nothing here.
// ============================================================

const { callLLMChat } = require('../llm');

// ─────────────────────────────────────────────────────────────
//  MENU DATA
//  Later: replace this with a database call or JSON file
// ─────────────────────────────────────────────────────────────
const MENU = [
  { id: '1', name: 'Zinger Burger',     price: 350, category: 'burgers'   },
  { id: '2', name: 'Broast (4 pieces)', price: 450, category: 'broast'    },
  { id: '3', name: 'Broast (8 pieces)', price: 800, category: 'broast'    },
  { id: '4', name: 'Fries (Regular)',   price: 120, category: 'sides'     },
  { id: '5', name: 'Fries (Large)',     price: 180, category: 'sides'     },
  { id: '6', name: 'Coke (Regular)',    price: 80,  category: 'drinks'    },
  { id: '7', name: 'Coke (Large)',      price: 120, category: 'drinks'    },
];

// ─────────────────────────────────────────────────────────────
//  MENU AGENT — Main Function
//  Input:  customer's message (any language)
//  Output: reply string + parsed items if order detected
// ─────────────────────────────────────────────────────────────
async function handleMenuQuery(customerMessage, detectedLanguage = 'ROMAN-URDU') {
  const systemPrompt = `
    You are the Menu Agent for WASI, a WhatsApp food ordering system.
    
    Available menu items:
    ${MENU.map(item => `- ${item.name}: Rs.${item.price} (ID: ${item.id})`).join('\n')}
    
    Your job:
    1. Answer questions about the menu clearly
    2. When a customer selects items, confirm their selection with quantities and total price
    3. Always reply in ${detectedLanguage} language
    4. If customer asks for something not on the menu, politely say it is not available
    
    When items are selected, end your reply with this exact format on a new line:
    ITEMS_SELECTED: [{"id":"1","name":"Zinger Burger","qty":2,"price":350}]
    
    If no items were selected yet, do NOT include the ITEMS_SELECTED line.
  `;

  const reply = await callLLMChat(systemPrompt, customerMessage);

  // Parse selected items out of the reply if present
  const itemsMatch = reply.match(/ITEMS_SELECTED:\s*(\[.*\])/);
  const selectedItems = itemsMatch ? JSON.parse(itemsMatch[1]) : null;

  // Clean reply shown to customer (remove the ITEMS_SELECTED line)
  const cleanReply = reply.replace(/ITEMS_SELECTED:.*$/m, '').trim();

  return {
    reply: cleanReply,
    selectedItems,  // null if customer is still browsing, array if items chosen
    menu: MENU      // always expose menu for other agents to reference
  };
}

module.exports = { handleMenuQuery, MENU };
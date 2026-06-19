# pyrefly: ignore [missing-import]
from python_agents.state import State
# pyrefly: ignore [missing-import]
from python_agents.utils import call_llm, get_menu

def menu_node(state: State) -> dict:
    """
    Parses user input for food items and handles clarifications (sizes, quantities).
    """
    messages = state.get("messages", [])
    cart_items = state.get("cart_items", [])
    in_progress = state.get("in_progress_items", [])
    receptionist_notes = state.get("receptionist_notes", [])
    pending = state.get("pending_clarifications", [])
    
    system_prompt = f"""You are WASI Restaurant's Menu Agent.
Your job is to manage the customer's cart, handle modifications, and identify what the user wants to order from their NEWEST message.

Here is the EXACT Live Menu:
{get_menu()}

Current Confirmed Cart: {cart_items}
In-Progress Items (Missing Details): {in_progress}
Currently Pending Clarifications: {pending}
Receptionist Notes: {receptionist_notes}

Respond ONLY with a valid JSON object:
{{
    "updated_cart_items": [{{"name": "Item Name", "qty": 1, "price": 100, "variant": "Large", "subtotal": 100}}],
    "updated_in_progress_items": [{{"name": "Incomplete Item", "qty": 1, "known_details": "Medium", "missing_details": "Size (Regular/Large)"}}],
    "updated_pending_clarifications": ["Ask the user for missing details"],
    "is_ordering_complete": false,
    "reply_to_user": "Your conversational response in Roman Urdu"
}}

CRITICAL RULES:
1. "updated_cart_items" MUST contain the FULL final list of confirmed items. If the user adds or completes something, APPEND it to this list. If the user modifies something, update it. DO NOT drop previously confirmed items.
2. If the user asks for an item NOT on the menu, DO NOT substitute it! Add a message to "reply_to_user" politely telling them what IS available.
3. CRITICAL CONSTRAINT: You MUST strictly obey the Receptionist Notes. If a note explicitly says an item is out of stock, you MUST NOT allow the user to add it.
4. DO NOT guess sizes or flavors in JSON AND DO NOT GUESS IN THE TEXT REPLY. If an item has multiple variants/sizes and the user doesn't specify or provides an invalid size (like "Medium" for Fries which only has Regular/Large), you MUST add it to "updated_in_progress_items".
5. CRITICAL: If an item is in "updated_in_progress_items", your "reply_to_user" MUST explicitly ask the user for the missing details. DO NOT confirm the item in the text reply! DO NOT default the size for them!
6. If the user answers a question (e.g., "fajita"), look at "In-Progress Items". Combine their answer with the in-progress item. If it is now fully specified, you MUST add it to "updated_cart_items" and REMOVE it from "updated_in_progress_items".
7. "updated_pending_clarifications" MUST carry over unresolved questions for any items still in "updated_in_progress_items".
8. If the user sends a casual greeting, humor them in the first line, then gently ask what they want to order. DO NOT set `is_ordering_complete` to true.
9. If the user explicitly says they are done ordering, set "is_ordering_complete" to true. AND in your "reply_to_user", you MUST explicitly ask them if they want "Delivery" or "Takeaway".
10. If the user asks for the menu, output the EXACT full menu. Do NOT summarize it.
11. CRITICAL: "reply_to_user" MUST NEVER BE EMPTY or null. ALWAYS write a helpful conversational response in Roman Urdu.
12. CRITICAL: If the user simply says "yes", "ok", "done", or confirms their order, DO NOT add duplicate items to the cart. Only append NEW items to updated_cart_items if they explicitly ask for them!
"""

    recent_messages = messages[-5:] if len(messages) >= 5 else messages
    result = call_llm(system_prompt, recent_messages, force_json=True)
    
    updated_cart = result.get("updated_cart_items", cart_items)
    
    reply = result.get("reply_to_user") or "Maaf kijiye, system mein abhi thora masla hai. Kya aap apna message dobara bhej sakte hain?"
    
    if updated_cart:
        cart_str = "\n".join([f"• {i.get('qty')}x {i.get('name')} {i.get('variant') or ''} (Rs. {i.get('subtotal') or (i.get('price',0)*i.get('qty',1))})" for i in updated_cart])
        total = sum([int(i.get('subtotal') or (i.get("price", 0) * i.get("qty", 1))) for i in updated_cart])
        reply += f"\n\n🛒 *Aapka Cart:*\n{cart_str}\n*Subtotal: Rs. {total}*"
    else:
        reply += f"\n\n🛒 *Aapka Cart:*\nKhali hai"
    
    return {
        "cart_items": updated_cart,
        "in_progress_items": result.get("updated_in_progress_items") or [],
        "pending_clarifications": result.get("updated_pending_clarifications") or [],
        "is_ordering_complete": result.get("is_ordering_complete", False),
        "messages": [{"role": "assistant", "content": reply}]
    }

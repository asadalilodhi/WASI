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
    "updated_cart_items": [{{"name": "Zinger Burger", "qty": 1, "price": 350, "variant": null, "subtotal": 350}}],
    "updated_in_progress_items": [{{"name": "Pizza", "qty": 1, "known_details": "Large", "missing_details": "Flavor (Fajita/Tikka)"}}],
    "updated_pending_clarifications": ["Ask the user if they want Chicken Fajita or Chicken Tikka for their Large Pizza"],
    "is_ordering_complete": false,
    "reply_to_user": "Your conversational response in Roman Urdu"
}}

CRITICAL RULES:
1. "updated_cart_items" should contain the FULL final list of confirmed items. If the user adds something, append it. If the user modifies something (e.g. changing Coca Cola to Sprite, or 4-piece to 8-piece), update the item in the list. If they remove something, remove it from the list.
2. If the user asks for an item NOT on the menu (e.g., Pepsi), DO NOT substitute it! Add a message to "reply_to_user" politely telling them what IS available.
3. CRITICAL CONSTRAINT: You MUST strictly obey the Receptionist Notes. If a note explicitly says an item is out of stock or forbidden, you MUST NOT allow the user to add it back to the cart. Apologize and ask them to pick something else.
4. DO NOT guess or default sizes or flavors for ANY item. If a menu item has multiple variants/sizes (e.g., Fries, Pizza, Drinks, Broast) and the user doesn't specify which one they want, you MUST add it to "updated_in_progress_items" and explicitly ask them for the missing detail.
5. When asking the user to specify a missing detail (flavor, size, drink type), you MUST explicitly list the available options from the menu in parenthesis so they know what to choose from.
6. If the user answers a question (e.g., "fajita"), look at "In-Progress Items". Combine their answer with the in-progress item. If it's now fully specified, move it to "updated_cart_items" and REMOVE it from "updated_in_progress_items".
7. "updated_pending_clarifications" MUST carry over unresolved questions for any items still in "updated_in_progress_items".
8. If the user sends a casual greeting (e.g., 'hi', 'salam') or trolls/asks unrelated questions, humor them in the first line (max 10-12 words), then gently ask them what they want to order or if they want to see the menu. DO NOT set `is_ordering_complete` to true.
9. If the user explicitly says they are done ordering (e.g., "bus", "ji nahi", "done", "that's it"), set "is_ordering_complete" to true. AND in your "reply_to_user", you MUST explicitly ask them if they want "Delivery" or "Takeaway".
10. If the user asks for the menu, you MUST output the EXACT full menu exactly as shown in the Live Menu above. Do NOT summarize it or hide any prices/sizes.
"""

    recent_messages = messages[-5:] if len(messages) >= 5 else messages
    result = call_llm(system_prompt, recent_messages, force_json=True)
    
    updated_cart = result.get("updated_cart_items", cart_items)
    
    reply = result.get("reply_to_user") or "Samajh nahi aya, kya aap menu se kuch order karna chahte hain?"
    
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

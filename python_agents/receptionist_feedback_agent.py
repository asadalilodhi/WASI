# pyrefly: ignore [missing-import]
from python_agents.state import State
# pyrefly: ignore [missing-import]
from python_agents.utils import call_llm

def receptionist_feedback_node(state: State) -> dict:
    """
    Handles cases where the receptionist rejected the order and provided feedback.
    The LLM analyzes the feedback, mutates the state, sets rules, and prints a new summary.
    """
    messages = state.get("messages", [])
    cart_items = state.get("cart_items", [])
    receptionist_notes = state.get("receptionist_notes", [])
    
    # Get the system message that caused this node to trigger
    receptionist_msg = messages[-1]["content"] if messages and messages[-1]["role"] == "system" else "Order rejected by receptionist."

    system_prompt = f"""You are WASI Restaurant's Feedback Agent. 
The receptionist has just REJECTED the customer's order and provided the following feedback: "{receptionist_msg}"

Your job is to read their feedback and alter the customer's order state.

Current Order State:
- cart_items: {cart_items}
- customer_name: {state.get("customer_name")}
- phone_number: {state.get("phone_number")}
- order_type: {state.get("order_type")}
- delivery_address: {state.get("delivery_address")}
- payment_method: {state.get("payment_method")}

Respond ONLY with a valid JSON object:
{{
    "updated_cart_items": [{{"name": "Zinger Burger", "qty": 1, "price": 350, "variant": null, "subtotal": 350}}],
    "fields_to_clear": ["delivery_address", "payment_method"],
    "new_receptionist_constraint": "Write a strict rule to prevent the customer from adding the exact same thing again. E.g. 'Do not allow the address X' or '4-piece broast is out of stock, do not allow it'.",
    "reply_to_user": "A conversational message in Roman Urdu apologizing, explaining the issue, and asking the user to provide the missing detail or pick a different item. Keep it polite."
}}

CRITICAL RULES:
1. "updated_cart_items": If the feedback says an item is out of stock or wrong, REMOVE IT completely from the cart_items array. If no items need removing, return the original cart_items list intact.
2. "fields_to_clear": If the feedback is about an invalid address, payment, name, or order type, add that field name to the list (e.g. "delivery_address"). The system will delete it so the user is forced to re-enter it.
3. "new_receptionist_constraint": You MUST write a strict rule so other AI agents remember this rejection.
4. "reply_to_user": Explain what was removed/changed based on the receptionist's feedback, and prompt them to fix it.
"""

    result = call_llm(system_prompt, [], force_json=True)
    
    updated_cart = result.get("updated_cart_items", cart_items)
    fields_to_clear = result.get("fields_to_clear", [])
    constraint = result.get("new_receptionist_constraint")
    reply = result.get("reply_to_user", "Maf kijiye, order mein ek masla aaya hai. Please check karein.")
    
    # 1. Update Cart
    cart_str = "\n".join([f"• {i.get('qty')}x {i.get('name')} {i.get('variant') or ''} (Rs. {i.get('subtotal') or (i.get('price',0)*i.get('qty',1))})" for i in updated_cart]) if updated_cart else "Khali hai"
    total = sum([int(i.get('subtotal') or (i.get("price", 0) * i.get("qty", 1))) for i in updated_cart])
    
    # 2. Build the Altered Summary
    summary = f"""⚠️ *RECEPTIONIST FEEDBACK*
{receptionist_msg}

📋 *ALTERED ORDER SUMMARY*

🛒 *Cart:*
{cart_str}
*Subtotal: Rs. {total}*

👤 *Customer Details:*
• Name: {state.get("customer_name") if "customer_name" not in fields_to_clear else "❌ Missing (Please Provide)"}
• Contact: {state.get("phone_number")}

🚚 *Delivery Details:*
• Type: {state.get("order_type") if "order_type" not in fields_to_clear else "❌ Missing"}
• Address: {state.get("delivery_address") if "delivery_address" not in fields_to_clear else "❌ Removed due to feedback"}
• Payment: {state.get("payment_method") if "payment_method" not in fields_to_clear else "❌ Missing"}

{reply}"""

    # 3. Apply state mutations
    updates = {
        "cart_items": updated_cart,
        "order_status": "ORDERING",
        "is_ordering_complete": False, # Force them back into the loop
        "messages": [{"role": "assistant", "content": summary}]
    }
    
    if constraint:
        new_notes = receptionist_notes.copy()
        new_notes.append(constraint)
        updates["receptionist_notes"] = new_notes
        
    if "delivery_address" in fields_to_clear:
        updates["delivery_address"] = None
    if "payment_method" in fields_to_clear:
        updates["payment_method"] = None
    if "customer_name" in fields_to_clear:
        updates["customer_name"] = None
    if "order_type" in fields_to_clear:
        updates["order_type"] = None
        
    return updates

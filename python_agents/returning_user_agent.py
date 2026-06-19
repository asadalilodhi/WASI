from typing import Dict, Any
# pyrefly: ignore [missing-import]
from python_agents.state import State
# pyrefly: ignore [missing-import]
from python_agents.utils import call_llm
import json

def returning_user_node(state: State) -> dict:
    """
    Handles greeting returning users and offering to repeat their last order.
    """
    messages = state.get("messages", [])
    last_order = state.get("last_order") or {}
    
    # Check if they have already made a decision about their last order
    # Or if the cart is not empty, they are already ordering.
    if state.get("cart_items") or len(messages) > 5:
        # Should not be routed here, but if so, just pass through
        return {}
        
    last_items = last_order.get("items", [])
    if not last_items:
        return {}
        
    cart_str = "\n".join([f"• {i.get('qty')}x {i.get('name')} {i.get('variant') or ''}" for i in last_items])

    system_prompt = f"""You are WASI Restaurant's Welcome Agent.
The customer is a returning user: {state.get("customer_name")}.
Their last order was:
{cart_str}

If this is the start of the conversation (they just said hi), greet them by name, show them their last order, and ask if they want to repeat it.
If they just replied to your greeting:
1. If they said YES, output intent "REPEAT".
2. If they said NO or want something else, output intent "NEW_ORDER".
3. Otherwise output "UNKNOWN".

Respond ONLY with JSON:
{{
    "intent": "REPEAT" | "NEW_ORDER" | "UNKNOWN" | "GREET",
    "reply_to_user": "Your conversational reply in Roman Urdu"
}}
"""
    recent_messages = messages[-3:] if len(messages) >= 3 else messages
    result = call_llm(system_prompt, recent_messages, force_json=True)
    
    intent = result.get("intent", "GREET")
    
    if intent == "REPEAT":
        # Load the last order into their cart and transition to confirmation
        return {
            "cart_items": last_items,
            "order_type": last_order.get("orderType"),
            "delivery_address": last_order.get("deliveryAddress"),
            "payment_method": last_order.get("paymentMethod"),
            # Reset order status so it goes to confirmation
            "messages": [{"role": "assistant", "content": "Zabardast! Maine aapka pichla order load kar liya hai."}]
        }
    elif intent == "NEW_ORDER":
        # They want something else, just transition to menu by not doing anything
        return {
            "messages": [{"role": "assistant", "content": "Theek hai, aap menu se naya order kar sakte hain."}]
        }
    else:
        # GREET or UNKNOWN
        reply = result.get("reply_to_user") or f"Welcome back {state.get('customer_name')}! Kya aap apna pichla order repeat karna chahenge?"
        return {
            "messages": [{"role": "assistant", "content": reply}]
        }

# pyrefly: ignore [missing-import]
from python_agents.state import State
# pyrefly: ignore [missing-import]
from python_agents.utils import call_llm

def delivery_node(state: State) -> dict:
    """
    Asks the user for Delivery vs Takeaway, their address, and their delivery number.
    """
    messages = state.get("messages", [])
    
    receptionist_notes = state.get("receptionist_notes", [])
    phone_num = state.get('phone_number')
    delivery_question = f'Ask them: "Aapka messaging number {phone_num} hai. Kya delivery ke waqt is pe call karein ya koi doosra number use karein?"' if phone_num else 'Ask them: "Delivery ke waqt kis number par call karein?"'

    system_prompt = f"""You are WASI's Delivery Agent.
The customer has finished selecting items. You need to collect:
1. Order Type: "Delivery" or "Takeaway"?
2. Delivery Address (only if Delivery).
3. Delivery Number (only if Delivery). {delivery_question}

Receptionist Notes / Constraints: {receptionist_notes}
CRITICAL: You MUST strictly obey any constraints listed in the Receptionist Notes. If the notes say an address is invalid, you MUST reject that address if the user provides it again, and ask them for a different one.

Review the conversation and extract what you can.
If anything is missing, ask the user.

Respond ONLY with JSON:
{{
    "order_type": "Delivery" | "Takeaway" | null,
    "delivery_address": "123 Street..." | null,
    "delivery_number": "03001234567" | null,
    "reply_to_user": "Your conversational reply in Roman Urdu asking for the missing info. Leave this empty if you found type, address, and delivery number!"
}}
"""
    recent_messages = messages[-10:] if len(messages) >= 10 else messages
    result = call_llm(system_prompt, recent_messages, force_json=True)
    
    updates = {}
    
    if result.get("order_type"):
        updates["order_type"] = result["order_type"]
        
    order_type = updates.get("order_type") or state.get("order_type")
    
    if order_type and str(order_type).lower() == "takeaway":
        updates["delivery_address"] = "Takeaway"
        updates["delivery_number"] = state.get("phone_number")
    else:
        if result.get("delivery_address"):
            updates["delivery_address"] = result["delivery_address"]
        if result.get("delivery_number"):
            updates["delivery_number"] = result["delivery_number"]
        
    # If we are missing address or delivery number (and it's not takeaway), send reply
    if order_type and str(order_type).lower() != "takeaway":
        if (not updates.get("delivery_address") and not state.get("delivery_address")) or \
           (not updates.get("delivery_number") and not state.get("delivery_number")):
            if result.get("reply_to_user"):
                updates["messages"] = [{"role": "assistant", "content": result["reply_to_user"]}]
    elif not order_type and result.get("reply_to_user"):
        updates["messages"] = [{"role": "assistant", "content": result["reply_to_user"]}]
        
    return updates

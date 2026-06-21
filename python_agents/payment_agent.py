# pyrefly: ignore [missing-import]
from python_agents.state import State
# pyrefly: ignore [missing-import]
from python_agents.utils import call_llm

def payment_node(state: State) -> dict:
    """
    Asks the user for their payment method (Cash or Card).
    """
    messages = state.get("messages", [])
    receptionist_notes = state.get("receptionist_notes", [])
    
    system_prompt = f"""You are WASI's Payment Agent.
You need to ask the customer if they will pay via Cash or Card.

Receptionist Notes / Constraints: {receptionist_notes}
CRITICAL: You MUST strictly obey any constraints listed in the Receptionist Notes. If the notes say a payment method is invalid (e.g. Card machine broken), you MUST reject that payment method if the user provides it, and ask them for a different one.

If the user is trying to add, remove, or change food items (e.g., "suggest something for 2000", "add a burger", "remove the fries"), set "wants_to_change_order" to true.

Review the conversation to see if they already specified.
Respond ONLY with JSON:
{{
    "wants_to_change_order": true | false,
    "payment_method": "Cash" | "Card" | null,
    "reply_to_user": "Your conversational reply in Roman Urdu asking for payment method if not provided. Leave this empty if you found the payment method or if wants_to_change_order is true!"
}}
"""
    recent_messages = messages[-10:] if len(messages) >= 10 else messages
    result = call_llm(system_prompt, recent_messages, force_json=True)
    
    if result.get("wants_to_change_order"):
        return {"is_ordering_complete": False}
        
    updates = {}
    
    if result.get("payment_method"):
        updates["payment_method"] = result["payment_method"]
        
    if not updates.get("payment_method") and result.get("reply_to_user"):
        updates["messages"] = [{"role": "assistant", "content": result["reply_to_user"]}]
        
    return updates

# pyrefly: ignore [missing-import]
from python_agents.state import State
# pyrefly: ignore [missing-import]
from python_agents.utils import call_llm

def profile_node(state: State) -> dict:
    """
    Asks the user for their name and phone number.
    """
    messages = state.get("messages", [])
    
    system_prompt = """You are WASI's Profile Agent.
You need to ask the customer for their full name AND their contact number.

Review the conversation to see if they already gave their name and contact number.
Respond ONLY with JSON:
{
    "customer_name": "John Doe" | null,
    "phone_number": "03001234567" | null,
    "reply_to_user": "Your conversational reply in Roman Urdu asking for their name and/or contact number if not provided. Leave this empty if you found BOTH!"
}
"""
    recent_messages = messages[-10:] if len(messages) >= 10 else messages
    result = call_llm(system_prompt, recent_messages, force_json=True)
    
    updates = {}
    
    if result.get("customer_name"):
        updates["customer_name"] = result["customer_name"]
    if result.get("phone_number"):
        updates["phone_number"] = result["phone_number"]
        
    if (not updates.get("customer_name") and not state.get("customer_name")) or \
       (not updates.get("phone_number") and not state.get("phone_number")):
        if result.get("reply_to_user"):
            updates["messages"] = [{"role": "assistant", "content": result["reply_to_user"]}]
        
    return updates

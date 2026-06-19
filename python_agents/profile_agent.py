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
You need to ask the customer for their full name.

Review the conversation to see if they already gave their name.
Respond ONLY with JSON:
{
    "customer_name": "John Doe" | null,
    "reply_to_user": "Your conversational reply in Roman Urdu asking for their name if not provided. Leave this empty if you found their name!"
}
"""
    recent_messages = messages[-10:] if len(messages) >= 10 else messages
    result = call_llm(system_prompt, recent_messages, force_json=True)
    
    updates = {}
    
    if result.get("customer_name"):
        updates["customer_name"] = result["customer_name"]
        
    if not updates.get("customer_name") and result.get("reply_to_user"):
        updates["messages"] = [{"role": "assistant", "content": result["reply_to_user"]}]
        
    return updates

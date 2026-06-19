import operator
from typing import Annotated, Sequence, TypedDict
from langgraph.graph import StateGraph, START, END

# pyrefly: ignore [missing-import]
from python_agents.state import State
# pyrefly: ignore [missing-import]
from python_agents.menu_agent import menu_node
# pyrefly: ignore [missing-import]
from python_agents.delivery_agent import delivery_node
# pyrefly: ignore [missing-import]
from python_agents.payment_agent import payment_node
# pyrefly: ignore [missing-import]
from python_agents.profile_agent import profile_node
# pyrefly: ignore [missing-import]
from python_agents.returning_user_agent import returning_user_node
# pyrefly: ignore [missing-import]
from python_agents.utils import call_llm
# pyrefly: ignore [missing-import]
from python_agents.receptionist_feedback_agent import receptionist_feedback_node

from langchain_core.runnables import RunnableConfig

def init_state_node(state: State, config: RunnableConfig) -> dict:
    thread_id = config.get("configurable", {}).get("thread_id")
    
    if state.get("is_returning_user") is not None:
        return {} 
        
    updates = {
        "session_id": thread_id,
        "order_status": "ORDERING",
        "is_returning_user": False,
        "is_ordering_complete": False,
        "receptionist_notes": [],
        "pending_clarifications": [],
        "language": "ROMAN-URDU",
        "cart_items": [],
        "in_progress_items": [],
    }
    
    import psycopg2
    import os
    db_url = os.environ.get("DATABASE_API")
    if db_url and thread_id:
        try:
            conn = psycopg2.connect(db_url)
            cursor = conn.cursor()
            cursor.execute("SELECT phone_id, name, delivery_number, address, last_order FROM customers WHERE band_chat_id = %s OR phone_id = %s", (thread_id, thread_id))
            row = cursor.fetchone()
            if row:
                updates["is_returning_user"] = True
                updates["phone_number"] = row[0]
                updates["customer_name"] = row[1]
                updates["delivery_number"] = row[2]
                updates["delivery_address"] = row[3]
                updates["last_order"] = row[4]
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"DB Error fetching customer: {e}")
            
            
    return updates

def reset_node(state: State) -> dict:
    return {
        "order_status": "ORDERING",
        "is_returning_user": None,
        "is_ordering_complete": False,
        "receptionist_notes": [],
        "pending_clarifications": [],
        "cart_items": [],
        "in_progress_items": [],
        "order_type": None,
        "delivery_address": None,
        "payment_method": None,
        "customer_name": None,
        "delivery_number": None,
        "last_order": None,
        "messages": [{"role": "assistant", "content": "Aapka session reset kar diya gaya hai. Naya order shuru karne ke liye kuch bhi likhein!"}]
    }

def supervisor_router(state: State) -> str:
    """
    Checks missing fields in the state and routes to the correct node.
    """
    # Check for reset
    messages = state.get("messages", [])
    if messages and messages[-1]["role"] == "user":
        content = str(messages[-1].get("content", "")).lower().strip()
        if content in ["reset", "restart"]:
            return "reset_node"

    if state.get("is_returning_user") is None:
        return "init_state_node"
        
    if state.get("order_status") == "REVISION_NEEDED":
        return "receptionist_feedback_node"
        
    if state.get("order_status") == "SUBMITTED":
        return "status_node"
        
    # Check for returning user first
    if state.get("is_returning_user") and state.get("last_order") and not state.get("cart_items"):
        # We need a way to know if we've already resolved the returning user question.
        # If the last message was assistant confirming "load kar liya" or "naya order", we shouldn't route back here.
        messages = state.get("messages", [])
        if len(messages) <= 3: # Early in the chat
            last_content = messages[-1]["content"].lower() if messages else ""
            if "naya order" not in last_content and "load kar liya" not in last_content:
                return "returning_user_node"
        
    if not state.get("is_ordering_complete"):
        return "menu_node"
        
    if not state.get("delivery_address") or (str(state.get("order_type")).lower() != "takeaway" and not state.get("delivery_number")):
        return "delivery_node"
        
    if not state.get("payment_method"):
        return "payment_node"
        
    if not state.get("customer_name") or not state.get("phone_number"):
        return "profile_node"
        
    return "confirmation_node"

def status_node(state: State) -> dict:
    return {"messages": [{"role": "assistant", "content": "Aapka order already submit ho chuka hai, kitchen usko review kar raha hai."}]}

def confirmation_node(state: State) -> dict:
    messages = state.get("messages", [])
    cart_items = state.get("cart_items") or []
    
    # Check if the assistant has previously sent the FINAL ORDER SUMMARY in the chat history
    # We look backwards to find the last assistant message.
    last_assistant_msg = next((m["content"] for m in reversed(messages) if m["role"] == "assistant"), "")
    summary_already_sent = "FINAL ORDER SUMMARY" in last_assistant_msg
    
    last_msg = messages[-1] if messages else None
    
    # If the user just replied, AND we had already sent them the summary, THEN we evaluate their reply!
    if last_msg and last_msg["role"] == "user" and summary_already_sent:
        recent_messages = messages[-3:] if len(messages) >= 3 else messages
        
        system_prompt = """You are evaluating the customer's response to an order confirmation summary.
Analyze their message and classify their intent into one of three categories:
1. "CONFIRM": The user agrees to the summary and wants to place the order (e.g. "yes", "han", "ok", "done", "theek hai").
2. "MODIFY": The user wants to change something, cancel something, or says no (e.g. "no remove burger", "address galat hai", "sirf 1 coke kardo", "nahi", "no").
3. "UNKNOWN": The user asked an unrelated question or the intent is completely unclear.

Respond ONLY with a JSON object:
{
  "intent": "CONFIRM" | "MODIFY" | "UNKNOWN",
  "modification_instruction": "If MODIFY, write a clear instruction for the menu agent. Else empty string.",
  "reply": "If UNKNOWN, ask them to clarify if they want to confirm or modify. Else empty string."
}"""
        
        result = call_llm(system_prompt, recent_messages, force_json=True)
        intent = result.get("intent", "UNKNOWN")
        
        if intent == "CONFIRM":
            # Submit the order
            import requests
            order_data = {
                "items": state.get("cart_items"),
                "orderType": state.get("order_type"),
                "deliveryAddress": state.get("delivery_address"),
                "paymentMethod": state.get("payment_method"),
                "customerName": state.get("customer_name"),
                "phoneNumber": state.get("phone_number"),
                "deliveryNumber": state.get("delivery_number") or state.get("phone_number"),
                "totalPrice": sum([int(i.get("subtotal") or (i.get("price", 0) * i.get("qty", 1))) for i in cart_items])
            }
            
            # --- UPSERT CUSTOMER TO SUPABASE ---
            try:
                import psycopg2
                import os
                import json
                db_url = os.environ.get("DATABASE_API")
                if db_url:
                    conn = psycopg2.connect(db_url)
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO customers (phone_id, name, delivery_number, address, last_order, band_chat_id)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (phone_id) 
                        DO UPDATE SET name=EXCLUDED.name, delivery_number=EXCLUDED.delivery_number, address=EXCLUDED.address, last_order=EXCLUDED.last_order, band_chat_id=EXCLUDED.band_chat_id
                    """, (
                        state.get("phone_number") or state.get("session_id"), 
                        state.get("customer_name"), 
                        state.get("delivery_number") or state.get("phone_number"), 
                        state.get("delivery_address"),
                        json.dumps(order_data),
                        state.get("session_id") # This is the band_chat_id from config
                    ))
                    conn.commit()
                    cursor.close()
                    conn.close()
            except Exception as e:
                print(f"Error upserting customer: {e}")
            
            # --- SEND TO WEBHOOK ---
            try:
                requests.post(
                    "http://127.0.0.1:3000/api/webhook/tool",
                    json={"sessionId": state["session_id"], "orderData": order_data}
                )
            except Exception:
                pass
                
            return {
                "order_status": "SUBMITTED",
                "messages": [{"role": "assistant", "content": "✅ Aapka order restaurant ko bhej diya gaya hai confirmation ke liye! Shukriya!"}]
            }
            
        elif intent == "MODIFY":
            mod_instruction = result.get("modification_instruction", "Customer wants to modify the order.")
            return {
                "order_status": "ORDERING",
                "is_ordering_complete": False,
                "pending_clarifications": [f"Order modification requested: {mod_instruction}"],
                "messages": [{"role": "assistant", "content": "Theek hai, main order update kar raha hoon. Aapko menu mein kya tabdeeli karni hai?"}]
            }
            
        elif intent == "UNKNOWN" and result.get("reply"):
            return {"messages": [{"role": "assistant", "content": result.get("reply")}]}
    
    cart_str = "\n".join([f"• {i.get('qty')}x {i.get('name')} {i.get('variant') or ''} (Rs. {i.get('subtotal') or (i.get('price',0)*i.get('qty',1))})" for i in cart_items])
    total = sum([int(i.get('subtotal') or (i.get("price", 0) * i.get("qty", 1))) for i in cart_items])
    
    summary = f"""📋 **FINAL ORDER SUMMARY**

🛒 *Cart:*
{cart_str}
*Subtotal: Rs. {total}*

👤 *Customer Details:*
• Name: {state.get("customer_name")}
• Contact: {state.get("phone_number")}
• Delivery Number: {state.get("delivery_number") or state.get("phone_number")}

🚚 *Delivery Details:*
• Type: {state.get("order_type")}
• Address: {state.get("delivery_address")}
• Payment: {state.get("payment_method")}

**Kya aap order confirm karna chahte hain?** (Han/Nahi/Change)"""

    return {"messages": [{"role": "assistant", "content": summary}]}

def emit_message_node(state: State) -> dict:
    messages = state.get("messages", [])
    if messages:
        last_msg = messages[-1]
        if last_msg["role"] == "assistant":
            try:
                import requests
                with open("error_log.txt", "a", encoding="utf-8") as f:
                    f.write(f"EMITTING TO {state.get('session_id')}: {last_msg['content'][:50]}\n")
                r = requests.post("http://127.0.0.1:3000/api/webhook/whatsapp", json={
                    "sessionId": state.get("session_id"),
                    "text": last_msg["content"]
                }, timeout=3)
                with open("error_log.txt", "a", encoding="utf-8") as f:
                    f.write(f"WEBHOOK STATUS: {r.status_code}\n")
            except Exception as e:
                with open("error_log.txt", "a", encoding="utf-8") as f:
                    f.write(f"WEBHOOK ERROR: {e}\n")
    return {}

builder = StateGraph(State)

builder.add_node("init_state_node", init_state_node)
builder.add_node("returning_user_node", returning_user_node)
builder.add_node("menu_node", menu_node)
builder.add_node("delivery_node", delivery_node)
builder.add_node("payment_node", payment_node)
builder.add_node("profile_node", profile_node)
builder.add_node("confirmation_node", confirmation_node)
builder.add_node("status_node", status_node)
builder.add_node("receptionist_feedback_node", receptionist_feedback_node)
builder.add_node("reset_node", reset_node)
builder.add_node("emit_message_node", emit_message_node)

builder.add_conditional_edges(START, supervisor_router)

def smart_router(state: State) -> str:
    if state.get("messages") and state["messages"][-1]["role"] == "assistant":
        return "emit_message_node"
    return supervisor_router(state)

builder.add_conditional_edges("init_state_node", smart_router)
builder.add_conditional_edges("returning_user_node", smart_router)
builder.add_conditional_edges("menu_node", smart_router)
builder.add_conditional_edges("delivery_node", smart_router)
builder.add_conditional_edges("payment_node", smart_router)
builder.add_conditional_edges("profile_node", smart_router)
builder.add_conditional_edges("receptionist_feedback_node", smart_router)
builder.add_edge("confirmation_node", "emit_message_node")
builder.add_edge("status_node", "emit_message_node")
builder.add_edge("reset_node", "emit_message_node")
builder.add_edge("emit_message_node", END)

graph = builder.compile()

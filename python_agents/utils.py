import os
import json
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

# Fetch menu dynamically from Supabase
def get_menu():
    from dotenv import load_dotenv
    load_dotenv()
    db_url = os.environ.get("DATABASE_API")
    if not db_url:
        return "Menu is currently unavailable (DB Error)."
        
    try:
        import psycopg2
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        cursor.execute("SELECT category, name, base_price, variants FROM menu_items ORDER BY category, name")
        rows = cursor.fetchall()
        
        from collections import defaultdict
        grouped = defaultdict(list)
        for category, name, base_price, variants in rows:
            grouped[category].append((name, base_price, variants))
            
        menu_lines = ["\nWASI RESTAURANT MENU\n"]
        
        for cat, items in grouped.items():
            menu_lines.append(f"**{cat.upper()}**")
            for name, base_price, variants in items:
                if variants:
                    var_strs = [f"{k}: Rs. {v}" for k, v in variants.items()]
                    menu_lines.append(f"- {name}\n   ({', '.join(var_strs)})")
                else:
                    menu_lines.append(f"- {name} - Rs. {base_price}")
            menu_lines.append("")
                
        cursor.close()
        conn.close()
        return "\n".join(menu_lines)
    except Exception as e:
        print(f"Error fetching menu: {e}")
        return "Menu is currently unavailable."

# Helper to call LLM via AIML API (matching JS)
def call_llm(system_prompt: str, messages: list, model="gpt-4o", max_tokens=1000, force_json=False):
    llm = ChatOpenAI(
        model=model,
        openai_api_key=os.environ.get("AIML_API_KEY", "dummy"),
        openai_api_base="https://api.aimlapi.com/v1",
        max_tokens=max_tokens,
        model_kwargs={"response_format": {"type": "json_object"}} if force_json else {}
    )
    
    # Construct Langchain messages
    lc_messages = [SystemMessage(content=system_prompt)]
    for msg in messages:
        if msg["role"] == "user":
            lc_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            lc_messages.append(AIMessage(content=msg["content"]))
            
    try:
        response = llm.invoke(lc_messages)
        if force_json:
            try:
                return json.loads(response.content)
            except Exception:
                return {}
        return response.content
    except Exception as e:
        print(f"LLM API Error: {e}")
        return {} if force_json else "Sorry, mujhe samajh nahi aya. Kya aap dobara bata sakte hain?"

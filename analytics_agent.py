import os
import json
import psycopg2
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

def generate_report():
    db_url = os.environ.get("DATABASE_API")
    if not db_url:
        print("Database not connected.")
        return

    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Get all recent orders
        cursor.execute("SELECT last_order FROM customers WHERE last_order IS NOT NULL")
        rows = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        all_orders = []
        for row in rows:
            try:
                order_data = json.loads(row[0]) if isinstance(row[0], str) else row[0]
                all_orders.append(order_data)
            except Exception:
                pass
                
        if not all_orders:
            print("No order data available yet.")
            return
            
        # Format for LLM
        data_str = json.dumps(all_orders, indent=2)
        
        llm = ChatOpenAI(
            model="gpt-4o", 
            temperature=0,
            openai_api_key=os.environ.get("AIML_API_KEY", "dummy"),
            openai_api_base="https://api.aimlapi.com/v1"
        )
        
        prompt = f"""You are an expert Restaurant Business Analyst.
Analyze the following JSON array of recent orders and generate a beautiful, concise Markdown report for the restaurant owner.

Include:
1. Total Revenue
2. Most Popular Items
3. Delivery vs Takeaway split
4. Brief insights on customer behavior

Orders Data:
{data_str}

Format the output strictly as Markdown, using emojis and clean headers.
"""
        response = llm.invoke(prompt)
        import sys
        sys.stdout.reconfigure(encoding='utf-8')
        print(response.content)
        
    except Exception as e:
        print(f"Error generating report: {e}")

if __name__ == "__main__":
    generate_report()

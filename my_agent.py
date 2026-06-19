import asyncio
import logging
import os
import json
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from dotenv import load_dotenv
import requests

from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langchain.agents import create_agent

# Band AI Imports
from band import Agent
from band.adapters import LangGraphAdapter
from band.config import load_agent_config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =====================================================================
# SYSTEM PROMPT (Menu and instructions)
# =====================================================================
SYSTEM_PROMPT = """You are WASI Restaurant's Food Ordering Assistant, a helpful AI chatting with customers on WhatsApp.

Here is the Menu:
1. Zinger Burger - Rs. 350
2. Broast (4 pieces) - Rs. 450
3. Broast (8 pieces) - Rs. 800
4. Fries (Regular) - Rs. 120
5. Fries (Large) - Rs. 180
6. Coke (Regular) - Rs. 80
7. Coke (Large) - Rs. 120

Guidelines:
- Guide the customer politely through their order in Roman Urdu or Urdu (or English if they prefer).
- If they order an item with multiple sizes (Broast, Fries, Coke) without specifying the size, ask them to clarify (e.g., "Regular or Large?").
- BEFORE finalizing the order, you MUST collect the following information step-by-step:
  1. The food items they want to order.
  2. Order Type: Delivery or Takeaway?
  3. If Delivery, ask for their complete delivery address.
  4. Payment Method: Cash or Card?
  5. Their full name.
- Keep track of their cart. Once you have collected ALL the above information, summarize the entire order (items, total price, order type, address, payment method, name) to them.
- Ask them to confirm if the summary is correct.
- Once they have fully confirmed they want to place the order, you MUST call the `submit_order_to_restaurant` tool with their session_id (which is their phone number/session ID) and the order_data.
- The `order_data` parameter must be a JSON string representing the order details. It MUST match this structure:
  {
    "items": [{"name": "Zinger Burger", "qty": 1, "price": 350, "subtotal": 350}],
    "totalPrice": 350,
    "orderType": "Delivery",
    "deliveryAddress": "123 Main St",
    "paymentMethod": "Cash",
    "customerName": "John Doe",
    "phoneNumber": "<use the session_id here>"
  }
- After calling the tool, let them know their order is submitted and pending receptionist review.
"""

compiled_graph = None

# =====================================================================
# CUSTOM TOOL: Send Order to Node.js Express Server
# =====================================================================
@tool
def submit_order_to_restaurant(session_id: str, order_data: str) -> str:
    """Call this tool ONLY when the customer has fully confirmed their final order summary. This sends the order to the restaurant's kitchen."""
    logger.info(f"Submitting order for session: {session_id}")
    
    try:
        # Convert string to dict if LLM passed a string
        if isinstance(order_data, str):
            order_data = json.loads(order_data)
            
        # Hit the localhost Express server running on Node.js
        response = requests.post(
            "http://localhost:3000/api/webhook/tool",
            json={"sessionId": session_id, "orderData": order_data}
        )
        
        if response.status_code == 200:
            return "SUCCESS: The order has been submitted to the kitchen. Please tell the customer that their order is pending receptionist review."
        else:
            return f"ERROR: Failed to submit order. Status Code: {response.status_code}"
    except Exception as e:
        return f"ERROR: Could not connect to restaurant server. Details: {str(e)}"

# =====================================================================
# LOCAL HTTP SERVER (For WhatsApp Gateway)
# =====================================================================
class LocalAgentHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress request logging to keep console clean
        pass

    def _send_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_POST(self):
        if self.path == '/chat':
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body)
                sender = data.get('sender')
                message = data.get('message')
                role = data.get('role', 'user')
                
                global compiled_graph
                if not compiled_graph:
                    self._send_response(503, {"error": "Agent is starting up..."})
                    return
                
                # Run LangGraph with the thread_id
                config = {"configurable": {"thread_id": sender}}
                inputs = {"messages": [("user" if role == "user" else "system", message)]}
                
                logger.info(f"💬 [Local HTTP Agent] Processing message from {sender}")
                result = compiled_graph.invoke(inputs, config=config)
                
                # Get the last message content
                reply = result["messages"][-1].content
                self._send_response(200, {"reply": reply})
            except Exception as e:
                logger.error(f"⚠️ Error in HTTP handler: {e}")
                self._send_response(500, {"error": str(e)})
        else:
            self._send_response(404, {"error": "Not Found"})

def run_http_server():
    server = HTTPServer(('localhost', 3001), LocalAgentHandler)
    logger.info("🚀 Local HTTP Agent Server running on http://localhost:3001")
    server.serve_forever()

# =====================================================================
# AGENT SETUP
# =====================================================================
async def main():
    load_dotenv()
    
    # Load agent credentials from agent_config.yaml
    agent_id, api_key = load_agent_config("my_agent")
    
    checkpointer = MemorySaver()
    
    # Compile the graph for local/WhatsApp use
    global compiled_graph
    llm_instance = ChatOpenAI(
        model="gpt-4o",
        openai_api_key=os.environ.get("AIML_API_KEY"),
        openai_api_base="https://api.aimlapi.com/v1"
    )
    compiled_graph = create_agent(
        model=llm_instance,
        tools=[submit_order_to_restaurant],
        system_prompt=SYSTEM_PROMPT,
        checkpointer=checkpointer,
    )
    
    # Start local HTTP server thread for WhatsApp gateway
    threading.Thread(target=run_http_server, daemon=True).start()
    
    # Create adapter with LLM, checkpointer, and our custom Node.js bridge tool
    adapter = LangGraphAdapter(
        llm=llm_instance,
        checkpointer=checkpointer,
        custom_section=SYSTEM_PROMPT,
        additional_tools=[submit_order_to_restaurant],
    )
    
    # Create and run the agent using Band SDK
    agent = Agent.create(
        adapter=adapter,
        agent_id=agent_id,
        api_key=api_key
    )
    
    logger.info("Agent is running! Connecting to Band AI...")
    await agent.run()

if __name__ == "__main__":
    asyncio.run(main())

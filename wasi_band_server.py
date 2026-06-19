import asyncio
import logging
import os
import json
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from dotenv import load_dotenv

from langgraph.checkpoint.memory import MemorySaver

# Band AI Imports
from band import Agent
from band.adapters import LangGraphAdapter
from band.config import load_agent_config

# pyrefly: ignore [missing-import]
from python_agents.supervisor_agent import graph
# pyrefly: ignore [missing-import]
from python_agents.state import State

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory session state storage for the HTTP gateway
session_states = {}

class LocalAgentHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
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
                
                # Check for session reset
                if message and message.strip().lower() in ['hi', 'hello', 'reset', 'restart']:
                    if sender in session_states:
                        logger.info(f"🔄 Resetting session for {sender}")
                        del session_states[sender]
                
                # Initialize state if not exists
                if sender not in session_states:
                    import psycopg2
                    db_url = os.environ.get("DATABASE_API")
                    customer_data = None
                    if db_url:
                        try:
                            conn = psycopg2.connect(db_url)
                            cursor = conn.cursor()
                            cursor.execute("SELECT name, delivery_number, address, last_order FROM customers WHERE phone_id = %s", (sender,))
                            row = cursor.fetchone()
                            if row:
                                customer_data = row
                            cursor.close()
                            conn.close()
                        except Exception as e:
                            logger.error(f"DB Error fetching customer: {e}")
                    
                    is_returning = False
                    c_name = None
                    c_del_num = None
                    c_addr = None
                    c_last_order = None
                    
                    if customer_data:
                        is_returning = True
                        c_name, c_del_num, c_addr, c_last_order = customer_data
                    
                    session_states[sender] = {
                        "session_id": sender,
                        "phone_number": sender,
                        "delivery_number": c_del_num,
                        "is_returning_user": is_returning,
                        "last_order": c_last_order,
                        "cart_items": [],
                        "in_progress_items": [],
                        "order_type": None,
                        "delivery_address": c_addr,
                        "payment_method": None,
                        "customer_name": c_name,
                        "order_status": "ORDERING",
                        "is_ordering_complete": False,
                        "receptionist_notes": [],
                        "pending_clarifications": [],
                        "messages": [],
                        "language": "ROMAN-URDU"
                    }
                
                state = session_states[sender]
                
                if role == "system":
                    # This is receptionist feedback
                    state["order_status"] = "REVISION_NEEDED"
                    state["messages"].append({"role": "system", "content": message})
                    
                else:
                    state["messages"].append({"role": "user", "content": message})
                
                logger.info(f"💬 [Local HTTP Agent] Processing message from {sender}")
                
                # Invoke Graph (Without memory saver checkpointer, to prevent exponential message growth)
                result = graph.invoke(state, config={"configurable": {"thread_id": sender}})
                
                # Update our session state with the result from the graph
                session_states[sender] = result
                
                # Get the last assistant message
                reply = "Something went wrong."
                if result.get("messages") and result["messages"][-1]["role"] == "assistant":
                    reply = result["messages"][-1]["content"]
                    
                self._send_response(200, {
                    "reply": reply, 
                    "sessionId": sender, 
                    "orderSubmitted": result.get("order_status") == "SUBMITTED",
                    "order": {
                        "items": result.get("cart_items"),
                        "totalPrice": sum([i.get("price", 0) * i.get("qty", 1) for i in result.get("cart_items", [])]),
                        "orderType": result.get("order_type"),
                        "deliveryAddress": result.get("delivery_address"),
                        "paymentMethod": result.get("payment_method"),
                        "customerName": result.get("customer_name"),
                        "phoneNumber": result.get("phone_number")
                    }
                })
            except Exception as e:
                logger.error(f"⚠️ Error in HTTP handler: {e}")
                self._send_response(500, {"error": str(e)})
        else:
            self._send_response(404, {"error": "Not Found"})

def run_http_server():
    server = HTTPServer(('localhost', 3001), LocalAgentHandler)
    logger.info("🚀 Local HTTP Agent Server running on http://localhost:3001")
    server.serve_forever()

async def main():
    load_dotenv()
    
    agent_id, api_key = load_agent_config("my_agent")
    checkpointer = MemorySaver()
    
    # Start local HTTP server thread for WhatsApp gateway
    threading.Thread(target=run_http_server, daemon=True).start()
    
    # Create adapter with LangGraph graph
    # adapter = LangGraphAdapter(
    #     graph=graph,
    #     checkpointer=checkpointer,
    # )
    
    # Create and run the agent using Band SDK
    # agent = Agent.create(
    #     adapter=adapter,
    #     agent_id=agent_id,
    #     api_key=api_key
    # )
    
    # logger.info("Band AI Multi-Agent is running!")
    # await agent.run()
    
    logger.info("Running strictly as Local HTTP Gateway. Band AI Cloud Agent disabled to prevent double-replies.")
    # Keep the main thread alive since we removed the blocking await agent.run()
    while True:
        await asyncio.sleep(3600)

if __name__ == "__main__":
    asyncio.run(main())

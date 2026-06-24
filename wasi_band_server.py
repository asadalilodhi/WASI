import asyncio
import logging
from fastapi import FastAPI, Request
import uvicorn

# Import the LangGraph builder
# pyrefly: ignore [missing-import]
from python_agents.supervisor_agent import builder
from langgraph.checkpoint.memory import MemorySaver

# Enable logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Create a single global memory checkpointer for all sessions
memory = MemorySaver()
graph = builder.compile(checkpointer=memory)

# Dictionary to hold locks per session to prevent race conditions
session_locks = {}

@app.post("/band_webhook")
async def band_webhook(request: Request):
    data = await request.json()
    session_id = data.get("sessionId")
    text = data.get("text")
    role = data.get("role", "user")

    if not session_id or not text:
        return {"error": "Missing sessionId or text"}

    logger.info(f"Received message for session {session_id} (Role: {role}): {text}")

    input_data = {"messages": [{"role": role, "content": text}]}
    
    order_status = data.get("order_status")
    if order_status:
        input_data["order_status"] = order_status
        
    config = {"configurable": {"thread_id": session_id}}

    if session_id not in session_locks:
        session_locks[session_id] = asyncio.Lock()

    async def run_graph():
        try:
            async with session_locks[session_id]:
                # pyrefly: ignore [missing-import]
                import inject_event
                # Inject user message to Band AI Cloud for telemetry
                try:
                    await inject_event.inject(session_id, text, role)
                except Exception as e:
                    logger.error(f"Error injecting user telemetry: {e}")
                
                # LangGraph handles merging the new dict into state["messages"]
                async for event in graph.astream_events(input_data, config, version="v2"):
                    # Intercept the agent's reply to push it to Band AI Cloud for telemetry too
                    if event.get("event") == "on_chat_model_stream":
                        pass
                
                # Get the final state to find the assistant's last message
                state = graph.get_state(config).values
                messages = state.get("messages", [])
                if messages and messages[-1].get("role") == "assistant":
                    # Inject assistant reply to Band AI Cloud
                    try:
                        await inject_event.inject(session_id, messages[-1].get("content"), "system")
                    except Exception as e:
                        logger.error(f"Error injecting assistant telemetry: {e}")

        except Exception as e:
            logger.error(f"Error running graph: {e}")
            import traceback
            traceback.print_exc()

    # Run the graph asynchronously so we don't block the HTTP response
    asyncio.create_task(run_graph())
    
    return {"status": "processing"}

@app.get("/api/analytics")
async def get_analytics():
    import subprocess
    import os
    script_path = os.path.join(os.path.dirname(__file__), "analytics_agent.py")
    try:
        result = subprocess.run(
            ["uv", "run", "python", script_path],
            capture_output=True,
            text=True,
            check=True
        )
        return {"report": result.stdout}
    except subprocess.CalledProcessError as e:
        logger.error(f"Analytics Error: {e.stderr}")
        return {"error": "Failed to generate report"}

if __name__ == "__main__":
    logger.info("Starting Local FastAPI Server for WASI Agent on port 8000...")
    uvicorn.run(app, host="127.0.0.1", port=8000)

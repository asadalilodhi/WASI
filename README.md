To run WASI locally, you'll need to run three components simultaneously to bring the multi-agent mesh to life. First, clone the repository and set up your Python environment by running uv pip install -r requirements.txt, then start the Band AI backend orchestrator by running uv run python wasi_band_server.py in the root directory (ensure your .env contains your AIML_API_KEY and Supabase credentials). Second, open a new terminal, navigate to the src directory, and run npm install followed by npm start to boot up the WhatsApp client adapter, which will display a QR code in the terminal for you to scan and connect your WhatsApp account to the AI. Finally, open a third terminal, navigate to the frontend folder, and run npm install followed by npm run dev to launch the live React Receptionist Dashboard on localhost:5173, allowing you to monitor orders, intervene in AI conversations, and track real-time telemetry while chatting with the bot on WhatsApp!
### 📱 Connecting to WhatsApp (QR Code Setup)

To allow the AI to read and reply to messages, you need to link it to a WhatsApp account using our Baileys adapter.

**1. Generate the QR Code**
Open a terminal, navigate to the WhatsApp client folder, and start the service:
\`\`\`bash
cd src
npm install
npm start
\`\`\`
*After a few seconds, a large QR code will render directly inside your terminal window.*

**2. Scan with your Phone**
- Open WhatsApp on your mobile phone.
- Go to **Settings** > **Linked Devices**.
- Tap **"Link a Device"**.
- Point your phone's camera at your computer screen to scan the terminal QR code.

**3. What happens next?**
Once scanned successfully:
- The terminal will indicate that the session has connected and authenticated.
- A local folder called `baileys_auth_info` will be created to securely save your session (so you don't have to scan the QR code every time you restart).
- **The AI is now live!** Whenever someone sends a message to your WhatsApp number, the adapter will intercept it, forward it to the Python LangGraph backend (Band AI Orchestrator), and automatically reply. You can now track these conversations live on the React Dashboard!

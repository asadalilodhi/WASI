// test-supervisor.js
require('dotenv').config();
const { handleIncomingMessage } = require('./agents/supervisorAgent');

async function test() {
  const sessionId = 'test-session-1';
  
  let reply = await handleIncomingMessage(sessionId, 'Hi, I want to order food');
  console.log('Bot:', reply);
  
  reply = await handleIncomingMessage(sessionId, 'I want 2 burgers and a coke');
  console.log('Bot:', reply);
}

test();
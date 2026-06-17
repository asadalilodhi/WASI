// ============================================================
//  WASI — LLM GATEWAY (Performance-Optimized)
//
//  Changes from original:
//  - Timeout: 3s → 30s (LLMs routinely take 3-8s)
//  - Added axios-retry with exponential backoff (3 retries)
//  - HTTP keepAlive connection pooling (reuse TCP sockets)
//  - Merged callLLM + callLLMChat into single callLLM()
//  - Removed thinking_budget (not supported by Haiku 4.5)
//  - Added max_tokens cap to prevent runaway generation
//  - Added per-call timing instrumentation
// ============================================================

const axios = require('axios');
const https = require('https');
const axiosRetry = require('axios-retry').default;

// ─────────────────────────────────────────────────────────────
//  CONNECTION POOL — reuse TCP/TLS sockets across calls
//  Saves ~200-500ms per request (no repeated handshakes)
// ─────────────────────────────────────────────────────────────
const keepAliveAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 10,
  maxFreeSockets: 5,
});

// ─────────────────────────────────────────────────────────────
//  AIML API CLIENT — for Supervisor, Menu, Order, Delivery,
//  Payment, Notification agents
// ─────────────────────────────────────────────────────────────
const aimlClient = axios.create({
  baseURL: 'https://api.aimlapi.com/v1',
  httpsAgent: keepAliveAgent,
  timeout: 60000,  // 60s — some calls take longer with larger prompts
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosRetry(aimlClient, {
  retries: 2,
  retryDelay: (retryCount) => retryCount * 2000, // 2s, 4s
  retryCondition: (error) => {
    // Only retry on network errors or 5xx — NOT on 429 (rate limit) since that wastes time
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           error.response?.status >= 500;
  },
  onRetry: (count, error) => {
    console.log(`  ⟳ [LLM] AIML retry #${count}: ${error.message} (status: ${error.response?.status || 'N/A'})`);
  },
});

// ─────────────────────────────────────────────────────────────
//  FEATHERLESS CLIENT — for Language Agent only
// ─────────────────────────────────────────────────────────────
const featherlessClient = axios.create({
  baseURL: 'https://api.featherless.ai/v1',
  httpsAgent: keepAliveAgent,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosRetry(featherlessClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           error.response?.status === 429 ||
           error.response?.status >= 500;
  },
  onRetry: (count, error) => {
    console.log(`  ⟳ [LLM] Featherless retry #${count}: ${error.message}`);
  },
});

// ─────────────────────────────────────────────────────────────
//  THINKING PARSER
// ─────────────────────────────────────────────────────────────
let lastThinking = null;
function getLastThinking() { return lastThinking; }

function parseResponse(raw) {
  if (!raw) return '';
  const thinkMatch = raw.match(/<think>([\s\S]*?)<\/think>/);
  const thinking = thinkMatch ? thinkMatch[1].trim() : null;
  const answer = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim() || raw.trim();
  if (thinking && process.env.SHOW_THINKING === 'true') {
    console.log('\n🧠 [Model Thinking]:\n' + thinking + '\n');
  }
  lastThinking = thinking;
  return answer;
}

// ─────────────────────────────────────────────────────────────
//  callLLM — Single unified function for AIML API
//  Used by: Supervisor, Menu, Order, Delivery, Payment,
//           Notification agents
// ─────────────────────────────────────────────────────────────
async function callLLM(systemPrompt, userMessageOrHistory, maxTokens = 300, forceJson = false) {
  const start = Date.now();
  
  // Format messages array: if string, wrap in single user turn; if array, append to system prompt
  const messages = [{ role: 'system', content: systemPrompt }];
  if (Array.isArray(userMessageOrHistory)) {
    messages.push(...userMessageOrHistory);
  } else {
    messages.push({ role: 'user', content: userMessageOrHistory });
  }

  const payload = {
    model: 'gpt-4o',
    max_tokens: maxTokens,
    messages: messages,
  };

  if (forceJson) {
    payload.response_format = { type: 'json_object' };
  }

  try {
    const response = await aimlClient.post('/chat/completions', payload, {
      headers: {
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
      },
    });
    const ms = Date.now() - start;
    const modelName = forceJson ? 'gpt-4o [JSON]' : 'gpt-4o';
    console.log(`  ⚡ [LLM] AIML ${modelName} → ${ms}ms`);
    return parseResponse(response.data.choices[0].message.content);
  } catch (error) {
    const ms = Date.now() - start;
    const status = error.response?.status || 'N/A';
    const detail = error.response?.data?.error?.message || error.message;
    console.log(`  ❌ [LLM] AIML FAILED after ${ms}ms — status: ${status}, detail: ${detail}`);
    console.log(`  📊 [LLM] Prompt size: system=${systemPrompt.length} chars, messages=${messages.length} turns, max_tokens=${maxTokens}`);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
//  callFeatherless — Language Agent only
//  Uses Qwen 3.5-9B for translation/detection
// ─────────────────────────────────────────────────────────────
async function callFeatherless(systemPrompt, userMessage, maxTokens = 200) {
  const start = Date.now();
  const response = await featherlessClient.post('/chat/completions', {
    model: 'Qwen/Qwen3.5-9B',
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.FEATHERLESS_API_KEY}`,
    },
  });
  const ms = Date.now() - start;
  console.log(`  ⚡ [LLM] Featherless qwen → ${ms}ms`);
  return parseResponse(response.data.choices[0].message.content);
}

module.exports = { callLLM, callFeatherless, getLastThinking };
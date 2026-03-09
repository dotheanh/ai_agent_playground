const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3010;
const clients = new Map();
const messages = [];

// Persistent history (JSONL)
const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'messages.jsonl');
const HISTORY_MAX_MESSAGES = parseInt(process.env.HISTORY_MAX_MESSAGES || '1000', 10);

// Mention/dispatch settings
// Tag format: @alex (case-insensitive). Minimal parsing to avoid LLM usage.
const MENTION_NAME = (process.env.MENTION_NAME || 'alex').trim();
const MENTION_REGEX = new RegExp(`(^|\\s)@${MENTION_NAME}(\\b|$)`, 'i');

// Bot state management
const botStates = new Map(); // botId -> { enabled: boolean, connected: boolean, lastPing: number }
const BOT_STATES_FILE = '/tmp/bot_states.json';

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function appendHistory(message) {
  try {
    ensureDataDir();
    fs.appendFileSync(HISTORY_FILE, JSON.stringify(message) + '\n');
  } catch (e) {
    console.error('Failed to append history:', e.message);
  }
}

function loadHistoryIntoMemory() {
  try {
    ensureDataDir();
    if (!fs.existsSync(HISTORY_FILE)) return;

    const data = fs.readFileSync(HISTORY_FILE, 'utf8');
    if (!data.trim()) return;

    const lines = data.trim().split(/\n+/);
    const start = Math.max(0, lines.length - HISTORY_MAX_MESSAGES);
    for (let i = start; i < lines.length; i++) {
      try {
        const msg = JSON.parse(lines[i]);
        messages.push(msg);
      } catch {
        // ignore bad line
      }
    }

    console.log(`\ud83d\udccb Loaded message history: ${messages.length} messages`);
  } catch (e) {
    console.error('Failed to load history:', e.message);
  }
}

// Load or initialize bot states
function loadBotStates() {
  try {
    if (fs.existsSync(BOT_STATES_FILE)) {
      const data = JSON.parse(fs.readFileSync(BOT_STATES_FILE, 'utf8'));
      Object.entries(data).forEach(([botId, state]) => {
        botStates.set(botId, { ...state, connected: false });
      });
      console.log('📋 Loaded bot states:', Array.from(botStates.keys()));
    }
  } catch (e) {
    console.log('No existing bot states');
  }
}

function saveBotStates() {
  const data = {};
  botStates.forEach((state, botId) => {
    data[botId] = { enabled: state.enabled };
  });
  fs.writeFileSync(BOT_STATES_FILE, JSON.stringify(data, null, 2));
}

// Initialize default bots
function initBot(botId, enabled = true) {
  if (!botStates.has(botId)) {
    botStates.set(botId, { enabled, connected: false, lastPing: Date.now() });
    saveBotStates();
  }
}

// Get all bot statuses
function getBotStatuses() {
  const statuses = {};
  botStates.forEach((state, botId) => {
    const ws = findBotConnection(botId);
    statuses[botId] = {
      enabled: state.enabled,
      connected: !!ws,
      online: clients.size
    };
  });
  return statuses;
}

function findBotConnection(botId) {
  for (const [ws, info] of clients) {
    if (info.id === botId && info.type === 'bot') {
      return ws;
    }
  }
  return null;
}

// HTTP server with API endpoints
const httpServer = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // API: Get bot statuses
  if (url.pathname === '/api/bots') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getBotStatuses()));
    return;
  }
  
  // API: Toggle bot enabled/disabled
  if (url.pathname === '/api/bots/toggle' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { botId } = JSON.parse(body);
        if (botStates.has(botId)) {
          const state = botStates.get(botId);
          state.enabled = !state.enabled;
          saveBotStates();
          
          // Notify bot if connected
          const ws = findBotConnection(botId);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'control',
              action: state.enabled ? 'enabled' : 'disabled'
            }));
          }
          
          // Broadcast to all clients
          broadcast({
            type: 'system',
            content: `🤖 ${botId} is now ${state.enabled ? 'ENABLED ✓' : 'DISABLED ✗'}`,
            online: clients.size,
            timestamp: new Date().toISOString()
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, botId, enabled: state.enabled }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Bot not found' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // API: Register new bot
  if (url.pathname === '/api/bots/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { botId, enabled = true } = JSON.parse(body);
        initBot(botId, enabled);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, botId, enabled }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // API: Get chat history
  // Example: GET /api/history?limit=200&beforeId=123
  if (url.pathname === '/api/history' && req.method === 'GET') {
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 1000));
    const beforeId = url.searchParams.get('beforeId');

    let list = messages.slice();
    if (beforeId) {
      const beforeNum = Number(beforeId);
      if (!Number.isNaN(beforeNum)) {
        list = list.filter(m => Number(m.id) < beforeNum);
      }
    }

    const sliced = list.slice(-limit);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ messages: sliced }));
    return;
  }
  
  // Serve static files
  if (url.pathname === '/' || url.pathname === '/index.html') {
    const filePath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }
  
  res.writeHead(404);
  res.end('Not found');
});

const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const clientId = url.searchParams.get('id') || `user-${Date.now()}`;
  const clientType = url.searchParams.get('type') || 'human';
  
  clients.set(ws, { id: clientId, type: clientType });
  
  // Update bot state if it's a bot
  if (clientType === 'bot') {
    initBot(clientId, true); // Default enabled when connecting
    const state = botStates.get(clientId);
    state.connected = true;
    state.lastPing = Date.now();
    console.log(`[🤖 BOT CONNECTED] ${clientId} (enabled: ${state.enabled})`);
  } else {
    console.log(`[${new Date().toISOString()}] ${clientType} connected: ${clientId}`);
  }
  
  ws.send(JSON.stringify({
    type: 'system',
    content: `Welcome ${clientId}! Type: ${clientType}`,
    online: clients.size,
    clientId: clientId,
    botStates: clientType === 'bot' ? getBotStatuses() : undefined
  }));
  
  // Send message history to new client
  if (messages.length > 0) {
    ws.send(JSON.stringify({
      type: 'history',
      messages: messages
    }));
  }
  
  broadcast({
    type: 'join',
    clientId: clientId,
    clientType: clientType,
    online: clients.size,
    timestamp: new Date().toISOString()
  });
  
  // If bot is disabled, notify it immediately
  if (clientType === 'bot') {
    const state = botStates.get(clientId);
    if (state && !state.enabled) {
      setTimeout(() => {
        ws.send(JSON.stringify({
          type: 'control',
          action: 'disabled'
        }));
      }, 100);
    }
  }
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      const client = clients.get(ws);
      
      if (msg.type === 'chat') {
        // If sender is bot and disabled, reject message
        if (client.type === 'bot') {
          const state = botStates.get(client.id);
          if (state && !state.enabled) {
            ws.send(JSON.stringify({
              type: 'error',
              content: 'You are currently disabled. Enable to send messages.'
            }));
            return;
          }
        }

        const message = {
          type: 'chat',
          from: client.id,
          fromType: client.type,
          content: msg.content,
          timestamp: new Date().toISOString(),
          id: Date.now()
        };

        messages.push(message);
        if (messages.length > HISTORY_MAX_MESSAGES) messages.shift();

        appendHistory(message);
        broadcast(message);
        console.log(`[CHAT] ${client.id}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);

        // Mention dispatch (token-free)
        // If a human (or other bot) tags @alex, notify alex bot (if connected & enabled)
        if (MENTION_REGEX.test(msg.content) && client.id.toLowerCase() !== MENTION_NAME.toLowerCase()) {
          const alexState = botStates.get(MENTION_NAME);
          const alexWs = findBotConnection(MENTION_NAME);
          if (alexState?.enabled && alexWs && alexWs.readyState === WebSocket.OPEN) {
            alexWs.send(JSON.stringify({
              type: 'mention',
              mention: `@${MENTION_NAME}`,
              triggerMessageId: message.id,
              from: message.from,
              content: message.content,
              timestamp: message.timestamp
            }));
          }
        }
      }
      
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        if (client.type === 'bot') {
          const state = botStates.get(client.id);
          if (state) state.lastPing = Date.now();
        }
      }
    } catch (e) {
      console.error('Invalid message:', data);
    }
  });
  
  ws.on('close', () => {
    const client = clients.get(ws);
    clients.delete(ws);
    
    if (client?.type === 'bot') {
      const state = botStates.get(client.id);
      if (state) state.connected = false;
      console.log(`[🤖 BOT DISCONNECTED] ${client.id}`);
    }
    
    broadcast({
      type: 'leave',
      clientId: client?.id,
      clientType: client?.type,
      online: clients.size,
      timestamp: new Date().toISOString()
    });
    
    console.log(`[${new Date().toISOString()}] ${client?.type || 'unknown'} disconnected: ${client?.id}`);
  });
});

function broadcast(msg) {
  const data = JSON.stringify(msg);
  clients.forEach((info, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

// Cleanup disconnected bots periodically
setInterval(() => {
  const now = Date.now();
  botStates.forEach((state, botId) => {
    if (state.connected && now - state.lastPing > 60000) {
      const ws = findBotConnection(botId);
      if (ws) {
        ws.close();
      }
      state.connected = false;
    }
  });
}, 30000);

loadBotStates();
loadHistoryIntoMemory();

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Multi-Bot Chat Server running at http://localhost:${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}?id=YOUR_ID&type=bot|human`);
  console.log(`🔧 API: http://localhost:${PORT}/api/bots`);
  console.log('');
});

module.exports = { botStates, getBotStatuses };

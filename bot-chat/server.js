const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3010;
const clients = new Map();
const messages = [];

const httpServer = http.createServer((req, res) => {
  if (req.url === '/') {
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
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const clientId = url.searchParams.get('id') || `user-${Date.now()}`;
  const clientType = url.searchParams.get('type') || 'human';
  
  clients.set(ws, { id: clientId, type: clientType });
  console.log(`[${new Date().toISOString()}] ${clientType} connected: ${clientId}`);
  
  ws.send(JSON.stringify({
    type: 'system',
    content: `Welcome ${clientId}! Type: ${clientType}`,
    online: clients.size,
    clientId: clientId
  }));
  
  broadcast({
    type: 'join',
    clientId: clientId,
    clientType: clientType,
    online: clients.size,
    timestamp: new Date().toISOString()
  });
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      const client = clients.get(ws);
      
      if (msg.type === 'chat') {
        const message = {
          type: 'chat',
          from: client.id,
          fromType: client.type,
          content: msg.content,
          timestamp: new Date().toISOString(),
          id: Date.now()
        };
        messages.push(message);
        
        if (messages.length > 100) messages.shift();
        
        broadcast(message);
        console.log(`[CHAT] ${client.id}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
      }
    } catch (e) {
      console.error('Invalid message:', data);
    }
  });
  
  ws.on('close', () => {
    const client = clients.get(ws);
    clients.delete(ws);
    
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

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Bot Chat Server running at http://localhost:${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}?id=YOUR_ID&type=bot|human`);
  console.log('');
});

# 🤖 Bot Chat Room

A real-time WebSocket chat room designed for human-to-AI-bot communication.

---

## 📋 Overview

Bot Chat Room is a lightweight WebSocket-based chat application that allows humans to interact with AI bots in real-time. Built with Node.js and pure WebSocket, it features a dark-themed modern UI and supports multiple concurrent connections.

**Created:** March 7, 2026  
**Location:** `/var/www/tools/bot-chat/`  
**Port:** 3010

---

## 🏗️ Architecture

```
┌─────────────────┐      WebSocket      ┌──────────────────┐
│   Web Browser   │ ◄─────────────────► │   Node Server    │
│  (Human User)   │                     │   (port 3010)    │
└─────────────────┘                     └────────┬─────────┘
                                                 │
                          WebSocket              │
                          ws://localhost:3010    │
                                                 │
┌─────────────────┐      ?id=zps_alex          │
│    AI Bot       │ ◄───────────────────────────┘
│  (External AI)  │      type=bot
└─────────────────┘
```

---

## 📁 Project Structure

```
bot-chat/
├── README.md           # This file
├── package.json        # Node.js dependencies
├── server.js           # WebSocket server implementation
├── node_modules/       # Installed dependencies
└── public/
    └── index.html      # Chat UI (Dark Theme)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 14+ installed
- Port 3010 available

### Installation

```bash
cd /var/www/tools/bot-chat
npm install
```

### Running the Server

```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

The server will start on port 3010.

---

## 💬 How to Use

### For Humans (Web Interface)

1. Open browser and navigate to:
   ```
   http://nhoxtheanh.duckdns.org:3010
   ```

2. Enter your name in the "Your name" field

3. Select "👤 Human" from the dropdown

4. Click "Connect"

5. Start chatting!

### For Bots (WebSocket Connection)

Bots can connect directly via WebSocket:

**Connection URL:**
```
ws://localhost:3010?id=zps_alex&type=bot
```

**Parameters:**
- `id` (required): Unique identifier for the bot (e.g., `zps_alex`)
- `type` (required): Must be `bot` to identify as AI bot

**Message Format:**
```json
{
  "type": "chat",
  "content": "Hello human!"
}
```

---

## 🎨 Features

### UI Features
- ✅ Dark theme with gradient background
- ✅ Real-time message display
- ✅ Online user count
- ✅ Join/leave notifications
- ✅ Message timestamps
- ✅ User type badges (👤 Human / 🤖 Bot)
- ✅ Auto-scroll to latest message
- ✅ Mobile responsive design

### Server Features
- ✅ WebSocket real-time communication
- ✅ Message history (last 100 messages)
- ✅ Multi-client support
- ✅ Client type identification
- ✅ Broadcast messaging
- ✅ Auto-generated user IDs

---

## 🔧 API Reference

### WebSocket Events

#### Incoming Messages (Server → Client)

**System Message:**
```json
{
  "type": "system",
  "content": "Welcome zps_alex! Type: bot",
  "online": 2,
  "clientId": "zps_alex"
}
```

**Join Event:**
```json
{
  "type": "join",
  "clientId": "zps_alex",
  "clientType": "bot",
  "online": 2,
  "timestamp": "2026-03-07T10:30:00.000Z"
}
```

**Chat Message:**
```json
{
  "type": "chat",
  "from": "zps_alex",
  "fromType": "bot",
  "content": "Hello!",
  "timestamp": "2026-03-07T10:30:00.000Z",
  "id": 1234567890
}
```

**Leave Event:**
```json
{
  "type": "leave",
  "clientId": "zps_alex",
  "clientType": "bot",
  "online": 1,
  "timestamp": "2026-03-07T10:35:00.000Z"
}
```

#### Outgoing Messages (Client → Server)

**Send Chat:**
```json
{
  "type": "chat",
  "content": "Your message here"
}
```

---

## 🛠️ Configuration

### Server Configuration

Edit `server.js` to change:

```javascript
const PORT = 3010;  // Change port here
```

### Caddy Reverse Proxy (Optional)

To expose via HTTPS, add to Caddyfile:

```caddyfile
chat.yourdomain.com {
    reverse_proxy localhost:3010
}
```

---

## 📊 Message Storage

- **In-memory only** - Messages are not persisted to disk
- **History limit:** 100 most recent messages
- **Auto-cleanup:** Old messages automatically removed when limit reached

---

## 🔒 Security Notes

- No authentication required (open chat)
- No message encryption in transit (use HTTPS reverse proxy for production)
- No rate limiting implemented
- Suitable for local/trusted network use

---

## 📝 Maintenance

### Check Server Status
```bash
ps aux | grep "node server.js"
netstat -tlnp | grep 3010
```

### Restart Server
```bash
# Find PID and kill
pkill -f "node server.js"

# Start again
npm start
```

### View Logs
```bash
# If running with PM2
pm2 logs bot-chat

# Manual logs (add logging to server.js)
tail -f /var/log/bot-chat.log
```

---

## 🔮 Future Improvements

- [ ] Add message persistence (database)
- [ ] Add authentication system
- [ ] Add private messaging
- [ ] Add file/image sharing
- [ ] Add emoji reactions
- [ ] Add typing indicators
- [ ] Add rooms/channels support

---

## 👨‍💻 Created By

Project created for OpenClaw AI assistant integration with AI Agent Playground.

---

## 📄 License

MIT License - Feel free to modify and distribute.

# 🤖 Multi-Bot Chat Room

A real-time WebSocket chat room for humans and multiple AI bots with toggle control.

---

## 📋 Overview

Multi-Bot Chat Room is an enhanced WebSocket chat application that supports:
- **Multiple AI bots** in the same chat room
- **Toggle control** - Enable/disable each bot individually
- **Bot-to-bot conversation** - Bots can chat with each other
- **Manual reply mode** - No auto-reply, bot owner decides when to respond

**Created:** March 7, 2026  
**Version:** 2.0  
**Location:** `/var/www/tools/bot-chat/`  
**Port:** 3010  
**URL:** https://nhoxtheanh.duckdns.org/boman

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Browser (Human)                       │
│              ┌───────────────────────────┐                  │
│              │  Bot Control Panel (UI)   │                  │
│              │  - Toggle on/off buttons  │                  │
│              │  - Bot status display     │                  │
│              └───────────────────────────┘                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼ WebSocket
┌─────────────────────────────────────────────────────────────┐
│              Multi-Bot Server (port 3010)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Bot State  │  │   Message    │  │  REST API    │      │
│  │   Manager    │  │   Router     │  │  /api/bots   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────┬────────┬─────────────────┬───────────────────────────┘
       │        │                 │
   ┌───┘   ┌────┘            ┌────┘
   │       │                 │
┌──▼───┐ ┌─▼────┐       ┌────▼────┐
│ Bot 1│ │ Bot 2│       │ Human   │
│Alex  │ │Bot_B │       │ User    │
└──┬───┘ └──┬───┘       └────┬────┘
   │        │                │
   └──┬─────┘                │
      │                      │
      ▼                      ▼
  ┌────────────────────────────────────┐
  │    File-based Communication        │
  │  /tmp/bot_messages_<bot>.jsonl    │
  │  /tmp/bot_reply_<bot>.txt         │
  │  /tmp/bot_control_<bot>.txt       │
  └────────────────────────────────────┘
```

---

## 📁 Project Structure

```
bot-chat/
├── README.md                 # This file
├── package.json              # Dependencies & scripts
├── multi-bot-server.js       # Multi-bot WebSocket server ⭐
├── server.js                 # Legacy server (v1.0)
├── generic-bot-bridge.js     # Generic bot connector ⭐
├── alex-bridge.js            # Alex's bridge
├── bot-connector.js          # Interactive bot CLI
├── start-alex.sh             # Quick start script for Alex
├── public/
│   └── index.html            # Chat UI with Bot Control Panel
├── BRIDGE_MECHANISM.md       # How bridge works
└── node_modules/
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

### Start the Server

```bash
# Start multi-bot server
npm start

# Or explicitly
node multi-bot-server.js
```

Server logs: `server.log`

---

## 💬 Quick Start Guide

### 1. Start Server
```bash
cd /var/www/tools/bot-chat
npm start
```

### 2. Connect as Human
Open browser: https://nhoxtheanh.duckdns.org/boman

Click **Connect** as Human.

### 3. Start a Bot (Terminal)

**Start Alex (`alex`) - manual bridge (no LLM):**
```bash
cd /var/www/tools/bot-chat
node generic-bot-bridge.js --id=alex
```

**Start Alex (`alex`) - auto connector (responds only when tagged, token-safe by default):**
```bash
cd /var/www/tools/bot-chat
npm run alex:auto

# Default: NO_LLM=1 (won't call any model)
# To allow LLM calls (you will configure the code path yourself):
# NO_LLM=0 npm run alex:auto
```

**Start Another Bot:**
```bash
node generic-bot-bridge.js --id=bot_friend
```

### 4. Control Bots

In the web UI, you'll see the **Bot Control Panel** with:
- 🟢 **Green toggle** = Bot enabled (can send messages)
- 🔴 **Red toggle** = Bot disabled (cannot send messages)

Click any toggle to enable/disable that bot.

---

## 🎨 Features

### Chat Features
- ✅ Real-time WebSocket messaging
- ✅ Dark theme UI
- ✅ Multi-bot support
- ✅ Bot-to-bot conversation
- ✅ Message history (100 messages)
- ✅ Online user counter
- ✅ Join/leave notifications
- ✅ Quick reply buttons
- ✅ Mobile responsive

### Bot Control Features
- ✅ **Toggle on/off** each bot individually
- ✅ **Bot status display** (enabled/disabled/online/offline)
- ✅ **Manual reply mode** - bot owner controls responses
- ✅ **File-based communication** for easy integration
- ✅ **Auto-reconnect** when connection drops

---

## 🔧 Bot Bridge Usage

### Generic Bot Bridge

The `generic-bot-bridge.js` script can start any bot:

```bash
# Start with default ID
node generic-bot-bridge.js

# Start with custom ID
node generic-bot-bridge.js --id=my_bot_name

# Start with initial disabled state
node generic-bot-bridge.js --id=my_bot_name --enabled=false
```

### File Communication

Each bot gets 3 files in `/tmp/`:

| File | Purpose | Format |
|------|---------|--------|
| `bot_messages_<bot>.jsonl` | Incoming messages | JSON Lines |
| `bot_reply_<bot>.txt` | Send reply (write here) | Plain text |
| `bot_control_<bot>.txt` | Enable/disable bot | `enable` or `disable` |
| `bot_state_<bot>.json` | Bot state persistence | JSON |

### Send a Reply as Bot

```bash
# Echo message to reply file
echo "Hello from bot!" > /tmp/bot_reply_zps_alex.txt
```

### Enable/Disable Bot Locally

```bash
# Disable bot
echo "disable" > /tmp/bot_control_zps_alex.txt

# Enable bot
echo "enable" > /tmp/bot_control_zps_alex.txt
```

---

## 📡 API Reference

### REST API

**Get All Bot Statuses:**
```bash
GET /api/bots
```

**Register a new bot (so it appears in UI + quick tag buttons):**
```bash
POST /api/bots/register
Content-Type: application/json

{ "botId": "bot_friend", "enabled": true }
```

**Optional: Map a mention alias to a botId:**
By default, tagging `@botId` routes to that botId (once connected).
This endpoint lets you route `@name` to a different botId.
```bash
POST /api/bots/alias
Content-Type: application/json

{ "mention": "bob", "botId": "bot_friend" }
```
Response:
```json
{
  "zps_alex": {
    "enabled": true,
    "connected": true,
    "online": 3
  },
  "bot_friend": {
    "enabled": false,
    "connected": true,
    "online": 3
  }
}
```

**Toggle Bot:**
```bash
POST /api/bots/toggle
Content-Type: application/json

{ "botId": "zps_alex" }
```

**Register New Bot:**
```bash
POST /api/bots/register
Content-Type: application/json

{ "botId": "new_bot", "enabled": true }
```

### WebSocket Events

**Connection URL:**
```
ws://localhost:3010?id=YOUR_ID&type=bot|human
```

**Control Message (server → bot):**
```json
{
  "type": "control",
  "action": "enabled"    // or "disabled"
}
```

**Mention Dispatch (server → bot, token-free):**
When a human types `@alex ...`, the server sends only one small event to the `alex` bot.
```json
{
  "type": "mention",
  "mention": "@alex",
  "triggerMessageId": 123,
  "from": "some_human",
  "content": "@alex help me",
  "timestamp": "2026-03-09T07:00:00.000Z"
}
```

---

## 🎯 Use Cases

### 1. Human + Single Bot Chat
Human connects via browser, bot connects via bridge → they chat.

### 2. Multiple Bots Conversation
Start multiple bot bridges, enable them all → bots can chat with each other.

### 3. Toggle Bot Participation
Disable a bot to "mute" it temporarily, enable later to resume.

### 4. Manual Reply Mode
Bot owner reads `/tmp/bot_messages_*.jsonl` and decides when/how to reply.

---

## 📝 Maintenance

### Check Server Status
```bash
ps aux | grep "multi-bot-server"
lsof -i :3010
```

### View Server Logs
```bash
tail -f /var/www/tools/bot-chat/server.log
```

### Restart Server
```bash
# Kill existing process
pkill -f "multi-bot-server"

# Start fresh
cd /var/www/tools/bot-chat && npm start
```

### View Bot Messages
```bash
# Alex's messages
tail -f /tmp/bot_messages_zps_alex.jsonl

# All bots' messages
tail -f /tmp/bot_messages_*.jsonl
```

---

## 🔮 Architecture Details

### Bot State Management
- States stored in memory (`botStates` Map)
- Persisted to `/tmp/bot_states.json`
- Reloaded on server restart

### Message Flow
1. **Bot disabled:** Receives messages, cannot send (error returned)
2. **Bot enabled:** Can both receive and send messages
3. **Toggle:** Server broadcasts system message to all clients

### File Watching
- Bridge watches reply file → sends when non-empty
- Bridge watches control file → enables/disables locally
- Server watches nothing (event-driven via WebSocket)

---

## 👨‍💻 Created By

Project created for OpenClaw AI assistant integration.
Multi-bot features added March 7, 2026.

---

## 📄 License

MIT License - Feel free to modify and distribute.

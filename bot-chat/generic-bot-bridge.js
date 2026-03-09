#!/usr/bin/env node
/**
 * Generic Bot Bridge for Multi-Bot Chat System
 * 
 * Usage: node generic-bot-bridge.js --id=bot_name [--enabled=true|false]
 * 
 * Features:
 * - Connects to WebSocket chat server
 * - Reads messages from file (for manual reply)
 * - Respects enabled/disabled state from server
 * - Can be toggled via API or control file
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const BOT_ID = args.find(a => a.startsWith('--id='))?.split('=')[1] || 'generic_bot';
const WS_URL = `ws://localhost:3010?id=${BOT_ID}&type=bot`;

// File paths
const MSG_DIR = '/tmp';
const MSG_FILE = path.join(MSG_DIR, `bot_messages_${BOT_ID}.jsonl`);
const REPLY_FILE = path.join(MSG_DIR, `bot_reply_${BOT_ID}.txt`);
const CONTROL_FILE = path.join(MSG_DIR, `bot_control_${BOT_ID}.txt`);
const STATE_FILE = path.join(MSG_DIR, `bot_state_${BOT_ID}.json`);

// Bot state
let botState = {
  enabled: true,
  connected: false,
  messageCount: 0,
  lastReply: null
};

// Load saved state
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      botState = { ...botState, ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) };
    }
  } catch (e) {
    console.log('No saved state, using defaults');
  }
}

function saveState() {
  fs.writeFileSync(STATE_FILE, JSON.stringify(botState, null, 2));
}

// Initialize files
function initFiles() {
  if (!fs.existsSync(MSG_FILE)) fs.writeFileSync(MSG_FILE, '');
  if (!fs.existsSync(REPLY_FILE)) fs.writeFileSync(REPLY_FILE, '');
  if (!fs.existsSync(CONTROL_FILE)) fs.writeFileSync(CONTROL_FILE, 'enabled');
}

console.log(`🤖 Bot Bridge: ${BOT_ID}`);
console.log('═══════════════════════════════════════');

loadState();
initFiles();

let ws = null;
let reconnectTimer = null;
let replyWatcher = null;
let controlWatcher = null;

function connect() {
  console.log(`\n🔗 Connecting to ${WS_URL}...`);
  
  ws = new WebSocket(WS_URL);
  
  ws.on('open', () => {
    botState.connected = true;
    console.log('✅ Connected to chat server');
    console.log(`📥 Messages → ${MSG_FILE}`);
    console.log(`💬 Reply → echo "msg" > ${REPLY_FILE}`);
    console.log(`🎛️  Control → echo enable|disable > ${CONTROL_FILE}`);
    console.log(`📊 State → ${STATE_FILE}`);
    console.log(`\nStatus: ${botState.enabled ? '🟢 ENABLED' : '🔴 DISABLED'}`);
    console.log('───────────────────────────────────────\n');
    
    // Send greeting if enabled
    if (botState.enabled) {
      ws.send(JSON.stringify({
        type: 'chat',
        content: `Hello! I'm ${BOT_ID}. Type in my reply file to chat with me.`
      }));
    }
    
    startWatching();
  });
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleMessage(msg);
    } catch (e) {
      console.log('⚠️ Invalid message:', data.toString());
    }
  });
  
  ws.on('close', () => {
    botState.connected = false;
    console.log('\n❌ Disconnected from server');
    stopWatching();
    // Auto reconnect after 5s
    reconnectTimer = setTimeout(connect, 5000);
  });
  
  ws.on('error', (err) => {
    console.error('\n💥 Error:', err.message);
  });
}

function handleMessage(msg) {
  const timestamp = new Date().toISOString();
  
  switch (msg.type) {
    case 'chat':
      // Only log messages from others
      if (msg.from !== BOT_ID) {
        const logEntry = {
          timestamp,
          from: msg.from,
          fromType: msg.fromType,
          content: msg.content,
          id: msg.id
        };
        fs.appendFileSync(MSG_FILE, JSON.stringify(logEntry) + '\n');
        botState.messageCount++;
        
        // Check for @mention (default: @alex)
        // NOTE: The server will also send a dedicated {type:"mention"} event.
        const mentionPattern = new RegExp(`(^|\\s)@alex(\\b|$)`, 'i');
        const isMentioned = mentionPattern.test(msg.content);
        
        // Format for console
        const typeIcon = msg.fromType === 'bot' ? '🤖' : '👤';
        const mentionIcon = isMentioned ? '🔔🔔🔔 ' : '';
        console.log(`${mentionIcon}${typeIcon} [${msg.from}]: ${msg.content.substring(0, 60)}${msg.content.length > 60 ? '...' : ''}`);
        
        // Special notification for mention
        if (isMentioned) {
          console.log('\n╔════════════════════════════════════════╗');
          console.log('║  📢 BẠN ĐƯỢC TAG! AUTO REPLYING... 📢║');
          console.log('╚════════════════════════════════════════╝\n');
          
          // Also write to mention file for persistence
          const mentionLog = `[${timestamp}] ${msg.from}: ${msg.content}\n`;
          fs.appendFileSync('/tmp/bot_mentions.txt', mentionLog);
          
          // No auto-reply here.
          // To save LLM tokens, the bridge only logs mentions and waits for an explicit reply
          // via the reply file, or a dedicated server-side dispatch event.
        }
      }
      break;
      
    case 'system':
      console.log(`ℹ️  [System]: ${msg.content}`);
      if (msg.content.includes('ENABLED')) {
        botState.enabled = true;
        saveState();
        console.log('🟢 You are now ENABLED');
      } else if (msg.content.includes('DISABLED')) {
        botState.enabled = false;
        saveState();
        console.log('🔴 You are now DISABLED');
      }
      break;
      
    case 'control':
      if (msg.action === 'enabled') {
        botState.enabled = true;
        saveState();
        console.log('🟢 Enabled by admin');
      } else if (msg.action === 'disabled') {
        botState.enabled = false;
        saveState();
        console.log('🔴 Disabled by admin');
      }
      break;

    case 'mention':
      // Server-side dispatch: you were tagged as @alex
      try {
        const logEntry = {
          timestamp,
          type: 'mention',
          mention: msg.mention,
          triggerMessageId: msg.triggerMessageId,
          from: msg.from,
          content: msg.content
        };
        fs.appendFileSync(MSG_FILE, JSON.stringify(logEntry) + '\n');
      } catch {}
      console.log(`🔔 MENTION EVENT: ${msg.from}: ${msg.content}`);
      break;
      
    case 'error':
      console.log(`⚠️  [Error]: ${msg.content}`);
      break;
      
    case 'join':
      console.log(`➡️  ${msg.clientId} (${msg.clientType}) joined`);
      break;
      
    case 'leave':
      console.log(`⬅️  ${msg.clientId} (${msg.clientType}) left`);
      break;
  }
}

function startWatching() {
  // Watch reply file for new messages to send
  replyWatcher = fs.watchFile(REPLY_FILE, (curr, prev) => {
    if (!botState.enabled) {
      console.log('🔴 Cannot send: bot is disabled');
      return;
    }
    
    if (fs.existsSync(REPLY_FILE)) {
      const reply = fs.readFileSync(REPLY_FILE, 'utf8').trim();
      if (reply && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'chat',
          content: reply
        }));
        botState.lastReply = new Date().toISOString();
        saveState();
        console.log(`📤 You: ${reply.substring(0, 60)}${reply.length > 60 ? '...' : ''}`);
        fs.writeFileSync(REPLY_FILE, ''); // Clear after sending
      }
    }
  });
  
  // Watch control file for enable/disable commands
  controlWatcher = fs.watchFile(CONTROL_FILE, (curr, prev) => {
    if (fs.existsSync(CONTROL_FILE)) {
      const command = fs.readFileSync(CONTROL_FILE, 'utf8').trim().toLowerCase();
      
      if (command === 'enable' || command === 'enabled') {
        if (!botState.enabled) {
          botState.enabled = true;
          saveState();
          console.log('🟢 Enabled via control file');
          // Also notify server if connected
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'chat',
              content: '🟢 Bot is now enabled'
            }));
          }
        }
      } else if (command === 'disable' || command === 'disabled') {
        if (botState.enabled) {
          botState.enabled = false;
          saveState();
          console.log('🔴 Disabled via control file');
        }
      }
    }
  });
}

function stopWatching() {
  if (replyWatcher) {
    fs.unwatchFile(REPLY_FILE);
    replyWatcher = null;
  }
  if (controlWatcher) {
    fs.unwatchFile(CONTROL_FILE);
    controlWatcher = null;
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  saveState();
  stopWatching();
  if (ws) ws.close();
  if (reconnectTimer) clearTimeout(reconnectTimer);
  process.exit(0);
});

// Show help
console.log('\n📖 Quick Commands:');
console.log(`   Send message:  echo "Hello" > ${REPLY_FILE}`);
console.log(`   Disable bot:   echo "disable" > ${CONTROL_FILE}`);
console.log(`   Enable bot:    echo "enable" > ${CONTROL_FILE}`);
console.log(`   View messages: tail -f ${MSG_FILE}`);
console.log('   Exit:          Ctrl+C\n');

// Start
connect();

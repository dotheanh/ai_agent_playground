#!/usr/bin/env node
/**
 * agent-alex-auto.js
 * 
 * Minimal always-on connector for bot-chat.
 * Goal: save LLM tokens by ONLY responding when server dispatches a mention event.
 *
 * How it works:
 * - Connect as bot id "alex" to the WS server
 * - When receiving {type:"mention"}, fetch recent context from /api/history
 * - Call an LLM provider (optional; can be replaced with your own agent runtime)
 * - Send a reply back to the room
 *
 * NOTE: This file includes a "NO_LLM" mode (default) to avoid accidental token usage.
 */

const WebSocket = require('ws');

const BOT_ID = process.env.BOT_ID || 'alex';
const WS_BASE = process.env.BOTCHAT_WS || 'ws://localhost:3010';
const HTTP_BASE = process.env.BOTCHAT_HTTP || 'http://localhost:3010';

// Safety: default no-LLM. Set NO_LLM=0 to enable LLM call.
const NO_LLM = (process.env.NO_LLM || '1') !== '0';

function wsUrl() {
  const u = new URL(WS_BASE);
  u.searchParams.set('id', BOT_ID);
  u.searchParams.set('type', 'bot');
  return u.toString();
}

async function fetchHistory(limit = 30, beforeId) {
  const url = new URL('/api/history', HTTP_BASE);
  url.searchParams.set('limit', String(limit));
  if (beforeId) url.searchParams.set('beforeId', String(beforeId));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`history http ${res.status}`);
  return (await res.json()).messages || [];
}

async function llmReply({ mentionEvent, context }) {
  if (NO_LLM) {
    return `Mình đã nhận được tag @${BOT_ID}. (NO_LLM=1 nên mình chưa gọi AI model). Bạn nói rõ bạn cần gì nhé.`;
  }

  // TODO: integrate your agent/LLM here.
  // Keep it minimal: only include last few relevant messages to reduce tokens.
  return `Mình đã nhận được tag @${BOT_ID}. (LLM integration chưa được cấu hình trong file agent-alex-auto.js)`;
}

function sendChat(ws, content) {
  ws.send(JSON.stringify({ type: 'chat', content }));
}

function start() {
  console.log(`🤖 Auto agent connector starting: id=${BOT_ID}`);
  console.log(`WS:   ${wsUrl()}`);
  console.log(`HTTP: ${HTTP_BASE}`);
  console.log(`NO_LLM=${NO_LLM ? '1' : '0'}`);

  const ws = new WebSocket(wsUrl());

  ws.on('open', () => {
    console.log('✅ connected');
    // keepalive
    setInterval(() => {
      try { ws.send(JSON.stringify({ type: 'ping' })); } catch {}
    }, 25000).unref?.();
  });

  ws.on('message', async (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    if (msg.type === 'mention') {
      try {
        const context = await fetchHistory(30);
        const reply = await llmReply({ mentionEvent: msg, context });
        sendChat(ws, reply);
      } catch (e) {
        sendChat(ws, `@${BOT_ID} gặp lỗi khi xử lý mention: ${e.message}`);
      }
    }
  });

  ws.on('close', () => {
    console.log('❌ disconnected. Reconnecting in 3s...');
    setTimeout(start, 3000);
  });

  ws.on('error', (e) => {
    console.error('WS error:', e.message);
  });
}

start();

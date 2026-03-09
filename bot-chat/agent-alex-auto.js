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

// LLM config (kept independent from OpenClaw)
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'local';
const LLM_BASE_URL = process.env.LLM_BASE_URL || '';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_API = process.env.LLM_API || 'openai-chat-completions';
const LLM_MODEL_ID = process.env.LLM_MODEL_ID || 'local-model';
const LLM_TEMPERATURE = Number(process.env.LLM_TEMPERATURE || '0.7');
const LLM_MAX_TOKENS = Number(process.env.LLM_MAX_TOKENS || '400');

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

function pickContext(messages, limitChars = 6000) {
  // Keep last messages, trim aggressively to save tokens.
  const last = messages.slice(-25);
  const lines = [];
  for (const m of last) {
    const who = m.fromType === 'bot' ? `bot:${m.from}` : `human:${m.from}`;
    const text = String(m.content || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    lines.push(`${who}: ${text}`);
  }
  let joined = lines.join('\n');
  if (joined.length > limitChars) joined = joined.slice(-limitChars);
  return joined;
}

async function callLocalChatCompletions({ userText, contextText }) {
  if (!LLM_BASE_URL) throw new Error('LLM_BASE_URL is missing');
  if (!LLM_API_KEY) throw new Error('LLM_API_KEY is missing');

  // Because your API is self-hosted and may not exactly match OpenAI,
  // we implement a best-effort OpenAI-compatible chat-completions call.
  // You can adjust path via LLM_BASE_URL to include /v1 if needed.
  const url = new URL(LLM_BASE_URL.replace(/\/$/, '') + '/chat/completions');

  const payload = {
    model: LLM_MODEL_ID,
    temperature: LLM_TEMPERATURE,
    max_tokens: LLM_MAX_TOKENS,
    messages: [
      {
        role: 'system',
        content:
          'Bạn là Alex. Chỉ trả lời khi người dùng tag @alex. Trả lời tự nhiên, rõ ràng, không dài dòng. Nếu thiếu thông tin thì hỏi 1-2 câu ngắn.'
      },
      {
        role: 'system',
        content: `Ngữ cảnh chat gần đây:\n${contextText}`
      },
      { role: 'user', content: userText }
    ]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LLM_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${text.slice(0, 300)}`);

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('LLM returned non-JSON response');
  }

  // Try OpenAI-like shape
  const content = json?.choices?.[0]?.message?.content || json?.choices?.[0]?.text;
  if (!content) throw new Error('LLM response missing choices[0].message.content');
  return String(content).trim();
}

async function llmReply({ mentionEvent, context }) {
  if (NO_LLM) {
    return `Mình đã nhận được tag @${BOT_ID}. (NO_LLM=1 nên mình chưa gọi AI model). Bạn nói rõ bạn cần gì nhé.`;
  }

  if (LLM_PROVIDER !== 'local') {
    return `@${BOT_ID} hiện chỉ được cấu hình provider=local (LLM_PROVIDER=${LLM_PROVIDER}).`;
  }

  if (LLM_API !== 'openai-chat-completions') {
    return `@${BOT_ID} chưa hỗ trợ LLM_API=${LLM_API} trong agent-alex-auto.js`;
  }

  const contextText = pickContext(context);
  const userText = mentionEvent.content;
  return await callLocalChatCompletions({ userText, contextText });
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

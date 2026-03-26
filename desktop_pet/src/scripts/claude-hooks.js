#!/usr/bin/env node
/**
 * Claude Code Hook Script for Desktop Pet
 *
 * Receives hook payload via stdin JSON and forwards normalized events to Desktop Pet.
 * Works with Claude Code hook payload shape (hook_event_name, tool_name, message, etc).
 */

const http = require('http');
const crypto = require('crypto');

const PET_HOST = 'localhost';
const PET_PORT = 49152;

// ─── requestId ─────────────────────────────────────────────────────────────────

function deriveRequestId(payload) {
  if (payload.request_id) return String(payload.request_id);

  const fingerprint = JSON.stringify({
    event: payload.hook_event_name,
    tool: payload.tool_name || payload.tool,
    input: payload.tool_input,
    prompt: payload.permission_prompt || payload.message || '',
  });
  return 'req_' + crypto.createHash('sha1').update(fingerprint).digest('hex').slice(0, 12);
}

// ─── HTTP client ───────────────────────────────────────────────────────────────

function httpPost(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);

    const options = {
      hostname: PET_HOST,
      port: PET_PORT,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        console.log(`[Hook] ${path} -> ${res.statusCode}`);
        resolve(body);
      });
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log(`[Hook] Pet not running, skipping.`);
        resolve();
      } else {
        console.error(`[Hook] Error: ${err.message}`);
        reject(err);
      }
    });

    req.write(data);
    req.end();
  });
}

// ─── Normalization helpers ────────────────────────────────────────────────────

function normalizeEventType(payload) {
  const raw = String(payload.hook_event_name || payload.event || '').trim();
  const tool = String(payload.tool_name || payload.tool || '').trim();

  if (raw === 'PermissionRequest') return tool === 'AskUserQuestion' ? 'ask_question' : 'permission_request';
  if (raw === 'PostToolUse')      return 'post_tool_use';
  if (raw === 'Notification')     return 'notification';
  if (raw === 'SessionStart')     return 'session_start';
  if (raw === 'SessionEnd')       return 'session_end';
  if (raw === 'TaskCompleted')    return 'notification';
  return 'notification';
}

function summarizeToolInput(toolInput) {
  if (!toolInput || typeof toolInput !== 'object') return '';
  if (typeof toolInput.command === 'string' && toolInput.command.trim())
    return 'Run: ' + toolInput.command.trim();
  if (typeof toolInput.file_path === 'string' && toolInput.file_path.trim())
    return 'File: ' + toolInput.file_path.trim();
  if (typeof toolInput.pattern === 'string' && toolInput.pattern.trim())
    return 'Pattern: ' + toolInput.pattern.trim();
  return 'Input: ' + JSON.stringify(toolInput);
}

function pickMessage(payload) {
  const eventType = String(payload.hook_event_name || payload.event || '').trim();

  // TaskCompleted: use task_subject or create generic message
  if (eventType === 'TaskCompleted') {
    if (payload.task_subject && payload.task_subject.trim()) {
      return 'Task completed: ' + payload.task_subject.trim();
    }
    return 'Claude has completed a task';
  }

  const candidates = [
    payload.message,
    payload.reasoning,
    payload.reason,
    payload.question,
    payload.permission_prompt,
    payload.permission_message,
    summarizeToolInput(payload.tool_input),
    payload.tool_name ? 'Tool: ' + payload.tool_name : '',
    payload.tool ? 'Tool: ' + payload.tool : '',
  ];
  for (const text of candidates) {
    if (typeof text === 'string' && text.trim()) return text.trim();
  }
  return 'Claude Code event';
}

function extractOptions(payload) {
  if (Array.isArray(payload.permission_suggestions) && payload.permission_suggestions.length > 0)
    return payload.permission_suggestions.map(i => typeof i === 'string' ? i : (i && (i.label || i.title || i.value)) || '').filter(Boolean);
  if (Array.isArray(payload.options) && payload.options.length > 0)
    return payload.options.map(i => typeof i === 'string' ? i : (i && (i.label || i.title || i.value)) || '').filter(Boolean);
  if (String(payload.hook_event_name || '').trim() === 'PermissionRequest')
    return ['Yes', 'Yes, allow for all projects', 'No'];
  return [];
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

async function main() {
  let input = '';
  for await (const chunk of process.stdin) { input += chunk; }

  let rawPayload;
  try {
    rawPayload = input.trim() ? JSON.parse(input) : {};
  } catch (e) {
    console.error('[Hook] Failed to parse stdin:', e.message);
    process.exit(2);
  }

  const eventType = normalizeEventType(rawPayload);
  const requestId = deriveRequestId(rawPayload);

  if (eventType === 'permission_request' || eventType === 'ask_question') {
    const brokerPayload = {
      requestId,
      type: eventType,
      message: pickMessage(rawPayload),
      toolName: rawPayload.tool_name || rawPayload.tool || 'Unknown',
      options: extractOptions(rawPayload),
    };
    try { await httpPost('/hook/permission-request', brokerPayload); }
    catch { process.exit(2); }
  } else if (eventType === 'post_tool_use') {
    // User approved in terminal → tool executed → hide active bubble
    // requestId is derived from same fingerprint → matches enqueued request
    try {
      await httpPost('/hook/permission-resolved', {
        requestId,
        toolName: rawPayload.tool_name || rawPayload.tool || '',
        toolUseId: rawPayload.tool_use_id || '',
      });
    } catch { /* non-critical */ }
  } else if (eventType === 'notification') {
    // Check if Claude is waiting for user input → show session_end bubble
    const notifType = rawPayload.notification_type || '';
    if (notifType === 'idle_prompt' || notifType === 'permission_prompt') {
      const brokerPayload = {
        type: notifType === 'idle_prompt' ? 'session_end' : eventType,
        message: pickMessage(rawPayload),
        options: [],
      };
      try { await httpPost('/hook/event', brokerPayload); }
      catch { /* non-critical */ }
    }
  } else {
    // Other events: show bubble directly
    try {
      await httpPost('/hook/event', {
        type: eventType,
        message: pickMessage(rawPayload),
        options: [],
      });
    } catch { /* non-critical */ }
  }

  process.exit(0);
}

main();

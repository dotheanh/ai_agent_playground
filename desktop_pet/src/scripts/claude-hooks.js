#!/usr/bin/env node
/**
 * Claude Code Hook Script for Desktop Pet
 *
 * Receives hook payload via stdin JSON and forwards normalized events to Desktop Pet.
 * Works with Claude Code hook payload shape (hook_event_name, tool_name, message, etc).
 */

const http = require('http');

const PET_HOST = 'localhost';
const PET_PORT = 49152;

function sendToPet(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);

    const options = {
      hostname: PET_HOST,
      port: PET_PORT,
      path: '/',
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
        console.log(`[Hook] Sent ${payload.type} - Response: ${res.statusCode}`);
        resolve(body);
      });
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log(`[Hook] Pet not running, skipping ${payload.type}`);
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

function normalizeEventType(payload) {
  const raw = String(payload.hook_event_name || payload.event || '').trim();
  const toolName = String(payload.tool_name || payload.tool || '').trim();

  if (raw === 'PermissionRequest') {
    if (toolName === 'AskUserQuestion') return 'ask_question';
    return 'permission_request';
  }

  if (raw === 'SessionStart') return 'session_start';
  if (raw === 'SessionEnd') return 'session_end';
  if (raw === 'Notification') return 'notification';
  if (raw === 'TaskCompleted') return 'notification';

  return 'notification';
}

function summarizeToolInput(toolInput) {
  if (!toolInput || typeof toolInput !== 'object') return '';

  if (typeof toolInput.command === 'string' && toolInput.command.trim()) {
    return `Run: ${toolInput.command.trim()}`;
  }

  if (typeof toolInput.file_path === 'string' && toolInput.file_path.trim()) {
    return `File: ${toolInput.file_path.trim()}`;
  }

  if (typeof toolInput.pattern === 'string' && toolInput.pattern.trim()) {
    return `Pattern: ${toolInput.pattern.trim()}`;
  }

  return `Input: ${JSON.stringify(toolInput)}`;
}

function pickMessage(payload) {
  const candidates = [
    payload.message,
    payload.reasoning,
    payload.reason,
    payload.question,
    payload.task_subject,
    payload.permission_prompt,
    payload.permission_message,
    summarizeToolInput(payload.tool_input),
    payload.tool_name ? `Tool: ${payload.tool_name}` : '',
    payload.tool ? `Tool: ${payload.tool}` : '',
  ];

  for (const text of candidates) {
    if (typeof text === 'string' && text.trim()) return text.trim();
  }

  return 'Claude Code event';
}

function extractOptions(payload) {
  if (Array.isArray(payload.permission_suggestions) && payload.permission_suggestions.length > 0) {
    return payload.permission_suggestions
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return item.label || item.title || item.value || '';
        return '';
      })
      .filter(Boolean);
  }

  if (Array.isArray(payload.options) && payload.options.length > 0) {
    return payload.options
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return item.label || item.title || item.value || '';
        return '';
      })
      .filter(Boolean);
  }

  // Fallback defaults for PermissionRequest when Claude payload does not expose suggestions.
  if (String(payload.hook_event_name || '').trim() === 'PermissionRequest') {
    return ['Yes', 'Yes, allow for all projects', 'No'];
  }

  return [];
}

async function main() {
  let input = '';

  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let rawPayload;
  try {
    rawPayload = input.trim() ? JSON.parse(input) : {};
  } catch (e) {
    console.error('[Hook] Failed to parse stdin:', e.message);
    process.exit(2); // defer to Claude default prompt flow
  }

  const normalized = {
    type: normalizeEventType(rawPayload),
    message: pickMessage(rawPayload),
    options: extractOptions(rawPayload),
    timestamp: new Date().toISOString(),
    metadata: {
      hook_event_name: rawPayload.hook_event_name,
      tool_name: rawPayload.tool_name,
      tool: rawPayload.tool,
      danger_level: rawPayload.danger_level,
      requested_permissions: rawPayload.requested_permissions,
    },
  };

  try {
    await sendToPet(normalized);
  } catch {
    process.exit(2); // defer on transport error
  }

  process.exit(0);
}

main();

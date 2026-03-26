#!/usr/bin/env node
/**
 * Quick test to send a fake Claude Code event to Desktop Pet
 * Usage: node test-bubble.js [type] [message]
 *
 * Interactive types go via /hook/permission-request (broker → interactive bubble).
 * Non-interactive types go via /hook/event (direct bubble).
 */
const http = require('http');

const INTERACTIVE = { permission_request: 1, ask_question: 1 };

const type    = process.argv[2] || 'notification';
const message = process.argv.slice(3).join(' ') ||
                ({ permission_request: 'Run: echo test',
                   ask_question:       'Which approach should I use?',
                   session_start:     'Claude Code session started',
                   session_end:       'Claude Code session ended',
                   notification:      'Background task completed' }[type] || 'Test event');

const isInteractive = !!INTERACTIVE[type];

const payload = isInteractive
  ? { requestId: 'req_test_' + Date.now(), type, message, toolName: 'Bash', options: ['Yes', 'Yes, allow for all projects', 'No'] }
  : { type, message };

const path = isInteractive ? '/hook/permission-request' : '/hook/event';
const body = JSON.stringify(payload);

const req = http.request(
  { hostname: 'localhost', port: 49152, path, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
  (res) => {
    let data = '';
    res.on('data', (c) => { data += c; });
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`\u2705 [${type}] -> ${path}  (${res.statusCode})`);
        console.log(isInteractive ? '🔘 Interactive bubble should appear with clickable options!' : '🔔 Bubble should appear above Desktop Pet!');
      } else {
        console.log(`\u274c  Error: ${res.statusCode} - ${data}`);
        console.log('💡 Make sure Desktop Pet is running first (npm run dev)!');
      }
    });
  }
);
req.on('error', (e) => { console.error('\u274c  Error:', e.message); console.log('💡 Make sure Desktop Pet is running first!'); });
req.write(body);
req.end();

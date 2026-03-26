#!/usr/bin/env node
/**
 * Quick test to send a fake Claude Code event to Desktop Pet
 * Usage: node test-bubble.js [event_type]
 *
 * Event types: permission_request, ask_question, session_start, session_end, notification
 */

const http = require('http');

const events = {
  permission_request: 'Can I read the package.json file?',
  ask_question: 'Which approach should I use?',
  session_start: 'Claude Code session started',
  session_end: 'Claude Code session ended',
  notification: 'Background task completed successfully',
};

const type = process.argv[2] || 'notification';
const message = events[type] || process.argv.slice(2).join(' ') || 'Test notification';

const data = JSON.stringify({
  type,
  message,
  timestamp: new Date().toISOString(),
});

const options = {
  hostname: 'localhost',
  port: 49152,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log(`✅ Sent "${type}" - Response: ${res.statusCode}`);
      console.log('🎉 Bubble should appear above Desktop Pet!');
    } else {
      console.log(`❌ Error: ${res.statusCode} - ${body}`);
      console.log('💡 Make sure Desktop Pet is running first!');
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Error:', err.message);
  console.log('💡 Make sure Desktop Pet is running first!');
});

req.write(data);
req.end();

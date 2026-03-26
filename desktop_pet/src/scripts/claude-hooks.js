#!/usr/bin/env node
/**
 * Claude Code Hook Script for Desktop Pet
 *
 * This script receives events from Claude Code hooks and forwards them
 * to the Desktop Pet app via HTTP.
 *
 * Usage:
 *   node claude-hooks.js <event_type> [payload]
 *
 * Event types:
 *   - permission_request: When Claude asks for permission
 *   - ask_question: When Claude asks user a question
 *   - session_start: When a new session starts
 *   - session_end: When a session ends
 *   - notification: General notification
 */

const http = require('http');

const PET_HOST = 'localhost';
const PET_PORT = 49152;

function sendToPet(eventType, message, metadata = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      type: eventType,
      message: message,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    const options = {
      hostname: PET_HOST,
      port: PET_PORT,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`[Hook] Sent ${eventType} - Response: ${res.statusCode}`);
        resolve(body);
      });
    });

    req.on('error', (err) => {
      // Silently fail if pet is not running
      if (err.code === 'ECONNREFUSED') {
        console.log(`[Hook] Pet not running, skipping ${eventType}`);
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

// Main entry point
async function main() {
  const args = process.argv.slice(2);
  const eventType = args[0] || 'unknown';
  const message = args[1] || '';

  let metadata = {};

  // Parse additional arguments
  if (args.length > 2) {
    try {
      metadata = JSON.parse(args[2]);
    } catch (e) {
      // Not JSON, treat as additional metadata
      metadata = { detail: args.slice(2).join(' ') };
    }
  }

  try {
    await sendToPet(eventType, message, metadata);
  } catch (err) {
    // Exit with error code for Claude Code
    process.exit(1);
  }
}

main();

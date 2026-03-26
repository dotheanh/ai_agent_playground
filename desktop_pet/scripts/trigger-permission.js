#!/usr/bin/env node
/**
 * Trigger a real Claude Code permission request for testing the Desktop Pet bubble.
 * Usage: node scripts/trigger-permission.js
 *
 * Runs: claude --print "powershell -Command \"Get-Date\""
 * This forces Claude Code to ask for Bash permission -> fires PermissionRequest hook -> pet shows bubble.
 */
const { spawn } = require('child_process');

const proc = spawn('claude', [
  '--print',
  '--model', 'claude-haiku-4-5-20251001',
  'powershell Get-Date'
], {
  stdio: ['pipe', 'pipe', 'inherit'],
  shell: true,
  env: { ...process.env }
});

proc.stdout.on('data', (data) => {
  process.stdout.write(data);
});

proc.on('close', (code) => {
  process.exit(code || 0);
});

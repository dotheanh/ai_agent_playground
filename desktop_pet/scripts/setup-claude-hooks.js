#!/usr/bin/env node
/**
 * Claude Code Hooks Setup Script
 *
 * Installs Claude Code hooks to forward permission requests and questions
 * to the Desktop Pet app via HTTP.
 *
 * Usage:
 *   node setup-claude-hooks.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Detect Claude settings path
function getClaudeSettingsPath() {
  if (process.platform === 'win32') {
    return path.join(os.homedir(), '.claude', 'settings.json');
  }
  return path.join(os.homedir(), '.claude', 'settings.json');
}

function getHookScriptPath() {
  // Absolute path to the hook script
  const scriptDir = path.resolve(__dirname, '..', 'src', 'scripts');
  return path.join(scriptDir, 'claude-hooks.js').replace(/\\/g, '/');
}

function setupHooks() {
  const settingsPath = getClaudeSettingsPath();
  const hookScriptPath = getHookScriptPath();

  console.log('Claude settings path:', settingsPath);
  console.log('Hook script path:', hookScriptPath);

  // Ensure .claude directory exists
  const claudeDir = path.dirname(settingsPath);
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
    console.log('Created .claude directory');
  }

  // Read existing settings or create new
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      console.log('Loaded existing settings');
    } catch (e) {
      console.log('Could not parse existing settings, creating new');
      settings = {};
    }
  }

  // Ensure hooks object exists
  if (!settings.hooks) {
    settings.hooks = {};
  }

  // Hook script path as string for Node.js exec
  const hookCmd = `node "${hookScriptPath}"`;

  // Build hook entries for each event type
  const hookEvents = [
    'permission_request',
    'ask_question',
    'session_start',
    'session_end',
    'notification',
  ];

  // Convert to post hook format (post hooks run after each turn)
  settings.hooks.post = hookEvents.map(event => ({
    event: event,
    hook: hookCmd,
    prompt: `Send ${event} event to Desktop Pet`,
  }));

  // Write settings
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log('✓ Claude Code hooks installed successfully!');
  console.log('');
  console.log('Events hooked:');
  hookEvents.forEach(e => console.log(`  - ${e}`));
  console.log('');
  console.log('Start Desktop Pet to receive events!');
}

setupHooks();

#!/usr/bin/env node
/**
 * Claude Code Hooks Setup Script
 *
 * Install Desktop Pet hooks into ~/.claude/settings.json:
 * - hooks.PermissionRequest  -> show bubble + queue decision
 * - hooks.PostToolUse        -> hide bubble when user resolves in terminal
 * - hooks.Notification        -> show session_end bubble when Claude waits for input
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function getClaudeSettingsPath() {
  return path.join(os.homedir(), '.claude', 'settings.json');
}

function getHookScriptPath() {
  const scriptDir = path.resolve(__dirname, '..', 'src', 'scripts');
  return path.join(scriptDir, 'claude-hooks.js').replace(/\\/g, '/');
}

function isDesktopPetHook(entry, hookScriptPath) {
  if (!entry || !Array.isArray(entry.hooks)) return false;
  return entry.hooks.some((h) => {
    if (!h || typeof h.command !== 'string') return false;
    return h.command.includes(hookScriptPath) || h.command.includes('desktop_pet/src/scripts/claude-hooks.js');
  });
}

function setupHooks() {
  const settingsPath = getClaudeSettingsPath();
  const hookScriptPath = getHookScriptPath();

  console.log('Claude settings path:', settingsPath);
  console.log('Hook script path:', hookScriptPath);

  if (!fs.existsSync(settingsPath)) {
    console.error('settings.json not found! Please run Claude Code first.');
    process.exit(1);
  }

  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  } catch (e) {
    console.error('Could not parse settings.json:', e.message);
    process.exit(1);
  }

  if (!settings.hooks || typeof settings.hooks !== 'object') {
    settings.hooks = {};
  }

  if (!Array.isArray(settings.hooks.PermissionRequest)) {
    settings.hooks.PermissionRequest = [];
  }

  // Remove previous desktop_pet hook entries only (preserve others)
  settings.hooks.PermissionRequest = settings.hooks.PermissionRequest.filter(
    (entry) => !isDesktopPetHook(entry, hookScriptPath)
  );

  // Add valid PermissionRequest hook entry
  settings.hooks.PermissionRequest.push({
    matcher: '',
    hooks: [
      {
        type: 'command',
        command: `node "${hookScriptPath}"`,
      },
    ],
  });

  // Add PostToolUse hook (fires when tool executes after user approve in terminal)
  if (!Array.isArray(settings.hooks.PostToolUse)) {
    settings.hooks.PostToolUse = [];
  }
  settings.hooks.PostToolUse = settings.hooks.PostToolUse.filter(
    (entry) => !isDesktopPetHook(entry, hookScriptPath)
  );
  settings.hooks.PostToolUse.push({
    matcher: '',
    hooks: [
      {
        type: 'command',
        command: `node "${hookScriptPath}"`,
      },
    ],
  });

  // Add Notification hook (fires for idle_prompt = Claude waiting for user input)
  if (!Array.isArray(settings.hooks.Notification)) {
    settings.hooks.Notification = [];
  }
  settings.hooks.Notification = settings.hooks.Notification.filter(
    (entry) => !isDesktopPetHook(entry, hookScriptPath)
  );
  settings.hooks.Notification.push({
    matcher: '',
    hooks: [
      {
        type: 'command',
        command: `node "${hookScriptPath}"`,
      },
    ],
  });

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

  console.log('✓ Claude Code hooks installed successfully!');
  console.log('Added hooks:');
  console.log('  - hooks.PermissionRequest -> node claude-hooks.js  (show permission bubble)');
  console.log('  - hooks.PostToolUse       -> node claude-hooks.js  (hide bubble on terminal resolve)');
  console.log('  - hooks.Notification       -> node claude-hooks.js  (session_end idle bubble)');
  console.log('Restart Claude Code terminal to apply changes.');
}

setupHooks();

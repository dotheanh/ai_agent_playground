#!/usr/bin/env node
/**
 * Claude Code Hooks Setup Script
 *
 * Install Desktop Pet hook into ~/.claude/settings.json using valid hook key:
 * hooks.PermissionRequest
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

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

  console.log('✓ Claude Code hooks installed successfully!');
  console.log('Added hooks:');
  console.log('  - hooks.PermissionRequest[matcher=""] -> node claude-hooks.js');
  console.log('Restart Claude Code terminal to apply changes.');
}

setupHooks();

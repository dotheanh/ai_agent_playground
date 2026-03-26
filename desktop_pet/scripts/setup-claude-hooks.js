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

function getClaudeSettingsPath() {
  if (process.platform === 'win32') {
    return path.join(os.homedir(), '.claude', 'settings.json');
  }
  return path.join(os.homedir(), '.claude', 'settings.json');
}

function getHookScriptPath() {
  const scriptDir = path.resolve(__dirname, '..', 'src', 'scripts');
  return path.join(scriptDir, 'claude-hooks.js').replace(/\\/g, '/');
}

function setupHooks() {
  const settingsPath = getClaudeSettingsPath();
  const hookScriptPath = getHookScriptPath();
  console.log('Claude settings path:', settingsPath);
  console.log('Hook script path:', hookScriptPath);

  const claudeDir = path.dirname(settingsPath);
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  // Read existing settings - PRESERVE all existing content
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      const content = fs.readFileSync(settingsPath, 'utf-8');
      settings = JSON.parse(content);
      console.log('Loaded existing settings (will merge hooks)');
    } catch (e) {
      console.error('Could not parse settings.json:', e.message);
      process.exit(1);
    }
  } else {
    console.error('settings.json not found! Please run Claude Code first.');
    process.exit(1);
  }

  // Ensure hooks object exists
  if (!settings.hooks) {
    settings.hooks = {};
  }

  // Check if Post hook section already exists
  if (settings.hooks.Post) {
    // Merge - don't remove existing Post hooks
    console.log('Existing Post hooks found, will merge');
  } else {
    settings.hooks.Post = [];
  }

  // Remove any existing desktop-pet hooks (clean slate)
  settings.hooks.Post = settings.hooks.Post.filter(
    h => !h.matcher?.includes('permission_request') &&
         !h.matcher?.includes('ask_question')
  );

  // Build new hook entries with correct format
  const newHooks = [
    {
      matcher: 'permission_request',
      hooks: [
        {
          type: 'command',
          command: `node "${hookScriptPath}" "permission_request" "{prompt}"`
        }
      ]
    },
    {
      matcher: 'ask_question',
      hooks: [
        {
          type: 'command',
          command: `node "${hookScriptPath}" "ask_question" "{prompt}"`
        }
      ]
    }
  ];

  // Append new hooks
  settings.hooks.Post.push(...newHooks);

  // Write settings back - preserve everything
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log('✓ Claude Code hooks installed successfully!');
  console.log('');
  console.log('Added hooks:');
  newHooks.forEach(h => console.log(`  - Post [${h.matcher}]`));
  console.log('');
  console.log('Restart Claude Code terminal to apply changes!');
}

setupHooks();

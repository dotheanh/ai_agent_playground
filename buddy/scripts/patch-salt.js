#!/usr/bin/env bun
/**
 * Patch Salt for OAuth Buddy
 *
 * Patch or restore Claude Code binary with salt.
 *
 * Usage:
 *   bun patch-salt.js --salt "friend-2026-042"   # Patch binary
 *   bun patch-salt.js --restore                   # Restore original
 *   bun patch-salt.js --current                  # Show current info
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from "fs";

const CLAUDE_BIN = `${process.env.HOME || process.env.USERPROFILE}/.local/bin/claude`;
const CLAUDE_BAK = `${CLAUDE_BIN}.bak`;
const CONFIG_FILE = `${process.env.HOME || process.env.USERPROFILE}/.claude/.config.json`;

const args = process.argv.slice(2);
function flag(name) { return args.includes(`--${name}`); }
function opt(name) { const i = args.indexOf(`--${name}`); return i !== -1 ? args[i + 1] : undefined; }

const CURRENT_SALT = "friend-2026-401";

// Detect current salt in binary
function detectCurrentSalt() {
  if (!existsSync(CLAUDE_BIN)) {
    console.error("Claude binary not found at:", CLAUDE_BIN);
    process.exit(1);
  }
  const bin = readFileSync(CLAUDE_BIN, "utf-8");
  const match = bin.match(/friend-\d{4}-\w{3}/);
  return match ? match[0] : CURRENT_SALT;
}

// Patch binary with new salt
function patchSalt(newSalt) {
  if (newSalt.length !== 15) {
    console.error("Salt must be 15 characters");
    process.exit(1);
  }

  const currentSalt = detectCurrentSalt();
  console.log("Current salt:", currentSalt);

  // Backup if not exists
  if (!existsSync(CLAUDE_BAK)) {
    console.log("Creating backup...");
    copyFileSync(CLAUDE_BIN, CLAUDE_BAK);
  }

  const bin = readFileSync(CLAUDE_BIN);
  const oldBytes = Buffer.from(currentSalt, "utf-8");
  const newBytes = Buffer.from(newSalt, "utf-8");

  let count = 0, offset = 0;
  while (true) {
    const idx = bin.indexOf(oldBytes, offset);
    if (idx === -1) break;
    newBytes.copy(bin, idx);
    offset = idx + newBytes.length;
    count++;
  }

  if (count === 0) {
    console.error("Salt not found in binary. Is it already patched?");
    process.exit(1);
  }

  writeFileSync(CLAUDE_BIN, bin);
  console.log(`Patched ${count} occurrence(s): ${currentSalt} -> ${newSalt}`);

  // Clear companion state
  try {
    if (existsSync(CONFIG_FILE)) {
      const config = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
      if (config.companion) {
        delete config.companion;
        writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        console.log("Cleared companion state from config.");
      }
    }
  } catch (e) { /* ignore */ }

  console.log("Done! Run /buddy in Claude Code to see new buddy.");
}

// Restore original binary
function restore() {
  if (!existsSync(CLAUDE_BAK)) {
    console.error("No backup found at:", CLAUDE_BAK);
    process.exit(1);
  }
  copyFileSync(CLAUDE_BAK, CLAUDE_BIN);
  console.log("Restored from backup.");
  console.log("Done!");
}

// Show current info
function showCurrent() {
  const salt = detectCurrentSalt();
  console.log("Current salt:", salt);
  console.log("Claude binary:", CLAUDE_BIN);
  console.log("Backup exists:", existsSync(CLAUDE_BAK));
}

// Main
if (flag("restore")) {
  restore();
} else if (flag("current")) {
  showCurrent();
} else {
  const salt = opt("salt");
  if (!salt) {
    console.log("Usage:");
    console.log("  bun patch-salt.js --salt \"friend-2026-042\"  # Patch");
    console.log("  bun patch-salt.js --restore                  # Restore");
    console.log("  bun patch-salt.js --current                  # Show info");
    process.exit(1);
  }
  patchSalt(salt);
}
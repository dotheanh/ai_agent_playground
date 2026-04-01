#!/usr/bin/env bun
/**
 * Claude Code Buddy Reroller
 *
 * Bruteforces the buddy salt to find a desired rarity, then patches the binary.
 *
 * Usage:
 *   bun ~/cache/buddy-reroll.ts                # interactive: search + pick + patch
 *   bun ~/cache/buddy-reroll.ts --search       # search only, no patch
 *   bun ~/cache/buddy-reroll.ts --restore      # restore original binary from backup
 *   bun ~/cache/buddy-reroll.ts --current      # show current buddy info
 *   bun ~/cache/buddy-reroll.ts --rarity epic  # filter by rarity (common/uncommon/rare/epic/legendary)
 *   bun ~/cache/buddy-reroll.ts --shiny        # only show shiny results
 *   bun ~/cache/buddy-reroll.ts --species cat  # filter by species
 *   bun ~/cache/buddy-reroll.ts --limit 20     # max results to show (default 15)
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { createInterface } from "readline";

// ─── Constants ───────────────────────────────────────────────────────────────

const CLAUDE_BIN = `${process.env.HOME}/.local/bin/claude`;
const CLAUDE_BAK = `${CLAUDE_BIN}.bak`;
const CREDS_FILE = `${process.env.HOME}/.claude/.credentials.json`;
const CONFIG_FILE = `${process.env.HOME}/.claude/.config.json`;
const SALT_LENGTH = 15;

const WE8: Record<string, number> = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 };
const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];
const SPECIES = [
  "duck", "goose", "blob", "cat", "dragon", "octopus", "owl", "penguin",
  "turtle", "snail", "ghost", "axolotl", "capybara", "cactus", "robot",
  "rabbit", "mushroom", "chonk",
];
const EYES = ["·", "✦", "×", "◉", "@", "°"];
const HATS = ["none", "crown", "tophat", "propeller", "halo", "wizard", "beanie", "tinyduck"];

const RARITY_EMOJI: Record<string, string> = {
  common: "⬜", uncommon: "🟩", rare: "🟦", epic: "🟪", legendary: "🟨",
};
const HAT_EMOJI: Record<string, string> = {
  none: "", crown: "👑", tophat: "🎩", propeller: "🧢", halo: "😇",
  wizard: "🧙", beanie: "🧶", tinyduck: "🐤",
};

// ─── Algorithm (exact replica from Claude Code binary) ───────────────────────

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 1831565813) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str: string): number {
  return Number(BigInt(Bun.hash(str)) & 0xffffffffn);
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

interface Buddy {
  rarity: string;
  species: string;
  eye: string;
  hat: string;
  shiny: boolean;
}

function rollBuddy(rng: () => number): Buddy {
  const total = Object.values(WE8).reduce((a, b) => a + b, 0);
  let q = rng() * total;
  let rarity = "common";
  for (const k of RARITIES) {
    q -= WE8[k];
    if (q < 0) { rarity = k; break; }
  }
  const species = pick(rng, SPECIES);
  const eye = pick(rng, EYES);
  const hat = rarity === "common" ? "none" : pick(rng, HATS);
  const shiny = rng() < 0.01;
  return { rarity, species, eye, hat, shiny };
}

function generate(uuid: string, salt: string): Buddy {
  return rollBuddy(mulberry32(hash(uuid + salt)));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAccountUuid(): string {
  try {
    const creds = JSON.parse(readFileSync(CREDS_FILE, "utf-8"));
    const token = creds.claudeAiOauth?.accessToken;
    if (!token) throw new Error("No OAuth token");
    const resp = execSync(
      `curl -s "https://api.anthropic.com/api/oauth/profile" -H "Authorization: Bearer ${token}"`,
      { encoding: "utf-8" },
    );
    const profile = JSON.parse(resp);
    return profile.account.uuid;
  } catch (e) {
    console.error("Failed to get account UUID. Check ~/.claude/.credentials.json");
    process.exit(1);
  }
}

function getCurrentSalt(): string | null {
  try {
    const bin = readFileSync(CLAUDE_BIN, "utf-8");
    const match = bin.match(/friend-\d{4}-\w{3}/);
    return match?.[0] ?? null;
  } catch {
    return null;
  }
}

function detectSalt(): string {
  try {
    const bin = readFileSync(CLAUDE_BIN);
    // Search for the pattern: the salt is right before a known marker
    // Look for any 15-char string matching the salt pattern near "gE4="
    const str = bin.toString("utf-8");
    const idx = str.indexOf('gE4="');
    if (idx !== -1) {
      const saltStart = idx + 5;
      const saltEnd = str.indexOf('"', saltStart);
      if (saltEnd !== -1) return str.slice(saltStart, saltEnd);
    }
  } catch {}
  // Fallback: grep for any friend- pattern
  return getCurrentSalt() ?? "friend-2026-401";
}

function formatBuddy(b: Buddy, salt?: string): string {
  const shinyTag = b.shiny ? " ✨SHINY" : "";
  const hatTag = HAT_EMOJI[b.hat] ? ` ${HAT_EMOJI[b.hat]}` : "";
  const rarityTag = `${RARITY_EMOJI[b.rarity]} ${b.rarity.toUpperCase()}`;
  const saltTag = salt ? ` [salt: ${salt}]` : "";
  return `${rarityTag}${shinyTag} ${b.species} (eye:${b.eye} hat:${b.hat}${hatTag})${saltTag}`;
}

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

// ─── Core logic ──────────────────────────────────────────────────────────────

interface SearchResult { salt: string; buddy: Buddy }

function search(uuid: string, opts: {
  rarity?: string;
  shiny?: boolean;
  species?: string;
  limit: number;
}): SearchResult[] {
  const results: SearchResult[] = [];
  const SEARCH_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789-_";
  const MAX_ITER = 20_000_000;

  // Phase 1: try friend-2026-XXX patterns
  for (let i = 0; i < 1_000_000 && results.length < opts.limit; i++) {
    const salt = `friend-2026-${String(i).padStart(3, "0")}`.slice(0, SALT_LENGTH);
    const buddy = generate(uuid, salt);
    if (matches(buddy, opts)) results.push({ salt, buddy });
  }

  // Phase 2: systematic enumeration if we need more
  for (let i = 0; i < MAX_ITER && results.length < opts.limit; i++) {
    let salt = "";
    let n = i;
    for (let j = 0; j < SALT_LENGTH; j++) {
      salt += SEARCH_CHARS[n % SEARCH_CHARS.length];
      n = Math.floor(n / SEARCH_CHARS.length);
    }
    const buddy = generate(uuid, salt);
    if (matches(buddy, opts)) results.push({ salt, buddy });
  }

  return results;
}

function matches(b: Buddy, opts: { rarity?: string; shiny?: boolean; species?: string }): boolean {
  if (opts.rarity && b.rarity !== opts.rarity) return false;
  if (opts.shiny && !b.shiny) return false;
  if (opts.species && b.species !== opts.species) return false;
  return true;
}

function patchBinary(currentSalt: string, newSalt: string): boolean {
  if (currentSalt.length !== newSalt.length) {
    console.error(`Salt length mismatch: "${currentSalt}" (${currentSalt.length}) vs "${newSalt}" (${newSalt.length})`);
    return false;
  }

  // Backup if not already backed up
  if (!existsSync(CLAUDE_BAK)) {
    console.log(`Backing up ${CLAUDE_BIN} → ${CLAUDE_BAK}`);
    copyFileSync(CLAUDE_BIN, CLAUDE_BAK);
  }

  const bin = readFileSync(CLAUDE_BIN);
  const oldBytes = Buffer.from(currentSalt, "utf-8");
  const newBytes = Buffer.from(newSalt, "utf-8");

  let count = 0;
  let offset = 0;
  while (true) {
    const idx = bin.indexOf(oldBytes, offset);
    if (idx === -1) break;
    newBytes.copy(bin, idx);
    offset = idx + newBytes.length;
    count++;
  }

  if (count === 0) {
    console.error(`Salt "${currentSalt}" not found in binary. Already patched or binary updated?`);
    return false;
  }

  writeFileSync(CLAUDE_BIN, bin);
  console.log(`Patched ${count} occurrence(s): "${currentSalt}" → "${newSalt}"`);
  return true;
}

function clearCompanionState() {
  if (!existsSync(CONFIG_FILE)) return;
  try {
    const config = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    if (config.companion) {
      delete config.companion;
      writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
      console.log("Cleared existing companion state from .config.json");
    }
  } catch {}
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function flag(name: string): boolean { return args.includes(`--${name}`); }
function opt(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

async function main() {
  const uuid = getAccountUuid();
  const currentSalt = detectSalt();
  console.log(`Account: ${uuid}`);
  console.log(`Current salt: "${currentSalt}"\n`);

  // --restore
  if (flag("restore")) {
    if (!existsSync(CLAUDE_BAK)) {
      console.error("No backup found at", CLAUDE_BAK);
      process.exit(1);
    }
    copyFileSync(CLAUDE_BAK, CLAUDE_BIN);
    clearCompanionState();
    console.log("Restored original binary from backup.");
    return;
  }

  // Show current buddy
  const currentBuddy = generate(uuid, currentSalt);
  console.log(`Current buddy: ${formatBuddy(currentBuddy)}`);

  // --current
  if (flag("current")) return;

  // Search
  const rarity = opt("rarity") ?? (flag("shiny") ? undefined : "legendary");
  const species = opt("species");
  const shiny = flag("shiny") || undefined;
  const limit = parseInt(opt("limit") ?? "15");

  const filterDesc = [
    rarity && `rarity=${rarity}`,
    shiny && "shiny=true",
    species && `species=${species}`,
  ].filter(Boolean).join(", ");

  console.log(`\nSearching (${filterDesc || "legendary"}, limit=${limit})...\n`);
  const results = search(uuid, { rarity, shiny, species, limit });

  if (results.length === 0) {
    console.log("No results found. Try relaxing filters.");
    return;
  }

  // Display results
  console.log(`Found ${results.length} result(s):\n`);
  results.forEach((r, i) => {
    console.log(`  [${i + 1}] ${formatBuddy(r.buddy, r.salt)}`);
  });

  // --search: stop here
  if (flag("search")) return;

  // Interactive selection
  console.log();
  const choice = await prompt(`Pick a buddy [1-${results.length}] (or "q" to quit): `);
  if (choice === "q" || choice === "") {
    console.log("Cancelled.");
    return;
  }

  const idx = parseInt(choice) - 1;
  if (isNaN(idx) || idx < 0 || idx >= results.length) {
    console.error("Invalid choice.");
    return;
  }

  const selected = results[idx];
  console.log(`\nSelected: ${formatBuddy(selected.buddy)}`);

  // Patch
  if (patchBinary(currentSalt, selected.salt)) {
    clearCompanionState();
    // Verify
    const verify = execSync(`${CLAUDE_BIN} --version`, { encoding: "utf-8" }).trim();
    console.log(`\nBinary verified: ${verify}`);
    console.log("\nDone! Open a new Claude Code session and run /buddy to hatch your new companion.");
    console.log("Note: Claude Code updates will overwrite this patch. Re-run this script to patch again.");
  }
}

main().catch(console.error);

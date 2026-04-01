#!/usr/bin/env bun
/**
 * OAuth Buddy Search - Bun.hash version
 *
 * This script brute-forces the buddy salt for Claude OAuth account users.
 *
 * Usage:
 *   bun bun-hash-search.ts
 *   bun bun-hash-search.ts --rarity legendary --species dragon
 *   bun bun-hash-search.ts --shiny --limit 50
 *
 * Run interactively to search and pick a buddy, or use --search for search only.
 */

import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { createInterface } from "readline";

// ─── Constants ───────────────────────────────────────────────────────────────

const SALT_LENGTH = 15;
const MAX_ITER = 50_000_000;

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

function generate(accountUUID: string, salt: string): Buddy {
  return rollBuddy(mulberry32(hash(accountUUID + salt)));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

function formatBuddy(b: Buddy, salt?: string): string {
  const shinyTag = b.shiny ? " ✨SHINY" : "";
  const hatTag = HAT_EMOJI[b.hat] ? ` ${HAT_EMOJI[b.hat]}` : "";
  const rarityTag = `${RARITY_EMOJI[b.rarity]} ${b.rarity.toUpperCase()}`;
  const saltTag = salt ? ` [salt: ${salt}]` : "";
  return `${rarityTag}${shinyTag} ${b.species} (eye:${b.eye} hat:${b.hat}${hatTag})${saltTag}`;
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

  // Phase 1: try friend-2026-XXX patterns
  console.log("Phase 1: Searching friend-2026-XXX patterns...");
  for (let i = 0; i < 1_000_000 && results.length < opts.limit; i++) {
    const salt = `friend-2026-${String(i).padStart(3, "0")}`.slice(0, SALT_LENGTH);
    const buddy = generate(uuid, salt);
    if (matches(buddy, opts)) results.push({ salt, buddy });
  }

  // Phase 2: systematic enumeration if we need more
  if (results.length < opts.limit) {
    console.log("Phase 2: Searching random 15-char salts...");
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
  }

  return results;
}

function matches(b: Buddy, opts: { rarity?: string; shiny?: boolean; species?: string }): boolean {
  if (opts.rarity && b.rarity !== opts.rarity) return false;
  if (opts.shiny && !b.shiny) return false;
  if (opts.species && b.species !== opts.species) return false;
  return true;
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function flag(name: string): boolean { return args.includes(`--${name}`); }
function opt(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

async function main() {
  console.log("🔐 OAuth Buddy Search - Bun.hash version");
  console.log("========================================\n");

  // Get account UUID
  let accountUUID = opt("uuid");
  if (!accountUUID) {
    accountUUID = await prompt("Enter account UUID (from ~/.claude/.credentials.json): ");
  }
  console.log(`Account: ${accountUUID}\n`);

  // Search parameters
  const rarity = opt("rarity") ?? (flag("shiny") ? undefined : "legendary");
  const species = opt("species");
  const shiny = flag("shiny") || undefined;
  const limit = parseInt(opt("limit") ?? "15");

  const filterDesc = [
    rarity && `rarity=${rarity}`,
    shiny && "shiny=true",
    species && `species=${species}`,
  ].filter(Boolean).join(", ");

  console.log(`Searching (${filterDesc || "legendary"}, limit=${limit})...\n`);
  const results = search(accountUUID, { rarity, shiny, species, limit });

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
  console.log(`\n🎯 Use this salt: ${selected.salt}`);
  console.log("\nTo patch your binary:");
  console.log("1. Clone: https://github.com/RoggeOhta/claude-buddy-reroll");
  console.log("2. Run: bun buddy-reroll.ts");
  console.log("3. Enter your salt when prompted");
}

main().catch(console.error);

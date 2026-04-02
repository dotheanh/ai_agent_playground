#!/usr/bin/env bun
/**
 * Search Salt for OAuth Buddy
 *
 * Bruteforce salt to find desired buddy traits.
 *
 * Usage:
 *   bun search-salt.js --uuid "account-uuid" --rarity legendary --limit 50000000 --count 1
 */

const WE8 = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 };
const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];
const SPECIES = ["duck", "goose", "blob", "cat", "dragon", "octopus", "owl", "penguin", "turtle", "snail", "ghost", "axolotl", "capybara", "cactus", "robot", "rabbit", "mushroom", "chonk"];
const EYES = ["·", "✦", "×", "◉", "@", "°"];
const HATS = ["none", "crown", "tophat", "propeller", "halo", "wizard", "beanie", "tinyduck"];

function hash(str) { return Number(BigInt(Bun.hash(str)) & 0xffffffffn); }

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 1831565813) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

function rollBuddy(rng) {
  const total = Object.values(WE8).reduce((a, b) => a + b, 0);
  let q = rng() * total, rarity = "common";
  for (const k of RARITIES) { q -= WE8[k]; if (q < 0) { rarity = k; break; } }
  return {
    rarity,
    species: pick(rng, SPECIES),
    eye: pick(rng, EYES),
    hat: rarity === "common" ? "none" : pick(rng, HATS),
    shiny: rng() < 0.01
  };
}

function matches(buddy, opts) {
  if (opts.rarity && buddy.rarity !== opts.rarity) return false;
  if (opts.species && buddy.species !== opts.species) return false;
  if (opts.eye && buddy.eye !== opts.eye) return false;
  if (opts.hat && buddy.hat !== opts.hat) return false;
  if (opts.shiny && !buddy.shiny) return false;
  return true;
}

const args = process.argv.slice(2);
function opt(name) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? args[i + 1] : undefined;
}
function flag(name) { return args.includes(`--${name}`); }

const uuid = opt("uuid");
const rarity = opt("rarity") ?? (flag("shiny") ? undefined : "legendary");
const species = opt("species");
const eye = opt("eye");
const hat = opt("hat");
const shiny = flag("shiny") || undefined;
const limit = parseInt(opt("limit") ?? "50000000");
const count = parseInt(opt("count") ?? "1");

if (!uuid) { console.error("Missing --uuid"); process.exit(1); }

const SEARCH_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789-_";
const SALT_LENGTH = 15;
const results = [];

console.log(`Searching for ${rarity || "any"} buddy...`);

for (let i = 0; i < limit && results.length < count; i++) {
  let salt;
  if (i < 1000000) {
    salt = `friend-2026-${String(i).padStart(3, "0")}`;
  } else {
    salt = ""; let n = i - 1000000;
    for (let j = 0; j < SALT_LENGTH; j++) { salt += SEARCH_CHARS[n % SEARCH_CHARS.length]; n = Math.floor(n / SEARCH_CHARS.length); }
  }

  const buddy = rollBuddy(mulberry32(hash(uuid + salt)));
  if (matches(buddy, { rarity, species, eye, hat, shiny })) {
    results.push({ salt, buddy });
    console.log(`Found: ${salt} => ${buddy.rarity} ${buddy.species} ${buddy.eye} ${buddy.hat}`);
  }
}

if (results.length === 0) {
  console.log("No results found.");
} else {
  console.log("\n=== RESULTS ===");
  results.forEach((r, i) => console.log(`${i + 1}. ${r.salt}`));
}
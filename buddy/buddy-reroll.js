#!/usr/bin/env bun
// Buddy reroll script — uses Bun.hash (matches Claude Code)

const crypto = require('crypto')

// --- Constants (must match Claude Code source) ---
const SALT = 'friend-2026-401'
const SPECIES = ['duck', 'goose', 'blob', 'cat', 'dragon', 'octopus', 'owl', 'penguin', 'turtle', 'snail', 'ghost', 'axolotl', 'capybara', 'cactus', 'robot', 'rabbit', 'mushroom', 'chonk']
const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary']
const RARITY_WEIGHTS = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 }
const RARITY_RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 }
const EYES = ['·', '✦', '×', '◉', '@', '°']
const HATS = ['none', 'crown', 'tophat', 'propeller', 'halo', 'wizard', 'beanie', 'tinyduck']
const STAT_NAMES = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK']
const RARITY_FLOOR = { common: 5, uncommon: 15, rare: 25, epic: 35, legendary: 50 }

// --- Hash function (Bun.hash) ---
function hashBun(s) {
  return Number(BigInt(Bun.hash(s)) & 0xffffffffn)
}

// --- PRNG (Mulberry32 — same as Claude Code) ---
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

function rollRarity(rng) {
  let roll = rng() * 100
  for (const r of RARITIES) {
    roll -= RARITY_WEIGHTS[r]
    if (roll < 0) return r
  }
  return 'common'
}

function rollStats(rng, rarity) {
  const floor = RARITY_FLOOR[rarity]
  const peak = pick(rng, STAT_NAMES)
  let dump = pick(rng, STAT_NAMES)
  while (dump === peak) dump = pick(rng, STAT_NAMES)
  const stats = {}
  for (const name of STAT_NAMES) {
    if (name === peak) stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30))
    else if (name === dump) stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15))
    else stats[name] = floor + Math.floor(rng() * 40)
  }
  return stats
}

function rollFull(uid) {
  const rng = mulberry32(hashBun(uid + SALT))
  const rarity = rollRarity(rng)
  const species = pick(rng, SPECIES)
  const eye = pick(rng, EYES)
  const hat = rarity === 'common' ? 'none' : pick(rng, HATS)
  const shiny = rng() < 0.01
  const stats = rollStats(rng, rarity)
  return { rarity, species, eye, hat, shiny, stats }
}

// --- Target specs ---
const TARGET = {
  species: 'cat',
  rarity: 'legendary',
  eye: '✦',
  hat: 'crown',
  shiny: true
}

const RARITY_STARS = { common: '★', uncommon: '★★', rare: '★★★', epic: '★★★★', legendary: '★★★★★' }

console.log('🎯 Target: cat + legendary + eye ✦ + hat crown + shiny')
console.log('🔍 Searching...\n')

let found = 0
let iterations = 0
const startTime = Date.now()
const reportEvery = 1000000 // Report every 1M iterations

while (true) {
  const uid = crypto.randomBytes(32).toString('hex')
  const r = rollFull(uid)

  iterations++

  if (iterations % reportEvery === 0) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`   Progress: ${iterations.toLocaleString()} iterations (${elapsed}s) - still searching...`)
  }

  // Check filters
  if (r.species !== TARGET.species) continue
  if (r.rarity !== TARGET.rarity) continue
  if (r.eye !== TARGET.eye) continue
  if (r.hat !== TARGET.hat) continue
  if (r.shiny !== TARGET.shiny) continue

  // FOUND!
  found++
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log('\n🎉 FOUND! 🎉\n')
  console.log(`  Species : ${r.species}`)
  console.log(`  Rarity  : ${r.rarity} ${RARITY_STARS[r.rarity]}`)
  console.log(`  Eye     : ${r.eye}`)
  console.log(`  Hat     : ${r.hat}`)
  console.log(`  Shiny   : ${r.shiny}`)
  console.log(`  Stats   :`)
  for (const name of STAT_NAMES) {
    const val = r.stats[name]
    const bar = '█'.repeat(Math.floor(val / 5)) + '░'.repeat(20 - Math.floor(val / 5))
    console.log(`    ${name.padEnd(10)} ${bar} ${val}`)
  }
  console.log(`\n  UID     : ${uid}`)
  console.log(`\n  Iterations: ${iterations.toLocaleString()}`)
  console.log(`  Time: ${elapsed}s`)

  // Save to file for later use
  require('fs').writeFileSync('found-uid.txt', uid)
  console.log('\n✅ UID saved to found-uid.txt')

  break
}
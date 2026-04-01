#!/usr/bin/env bun

import { randomBytes } from 'node:crypto'

const SALT = 'friend-2026-401'

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary']
const RARITY_WEIGHTS = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1,
}

const SPECIES = [
  'duck',
  'goose',
  'blob',
  'cat',
  'dragon',
  'octopus',
  'owl',
  'penguin',
  'turtle',
  'snail',
  'ghost',
  'axolotl',
  'capybara',
  'cactus',
  'robot',
  'rabbit',
  'mushroom',
  'chonk',
]

const EYES = ['·', '✦', '×', '◉', '@', '°']
const HATS = ['none', 'crown', 'tophat', 'propeller', 'halo', 'wizard', 'beanie', 'tinyduck']
const STAT_NAMES = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK']

const RARITY_FLOOR = {
  common: 5,
  uncommon: 15,
  rare: 25,
  epic: 35,
  legendary: 50,
}

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

function hashString(s) {
  if (typeof Bun !== 'undefined') {
    return Number(BigInt(Bun.hash(s)) & 0xffffffffn)
  }

  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

function rollRarity(rng) {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0)
  let roll = rng() * total
  for (const rarity of RARITIES) {
    roll -= RARITY_WEIGHTS[rarity]
    if (roll < 0) return rarity
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
    if (name === peak) {
      stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30))
    } else if (name === dump) {
      stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15))
    } else {
      stats[name] = floor + Math.floor(rng() * 40)
    }
  }
  return stats
}

function rollFrom(rng) {
  const rarity = rollRarity(rng)
  const bones = {
    rarity,
    species: pick(rng, SPECIES),
    eye: pick(rng, EYES),
    hat: rarity === 'common' ? 'none' : pick(rng, HATS),
    shiny: rng() < 0.01,
    stats: rollStats(rng, rarity),
  }
  return { bones, inspirationSeed: Math.floor(rng() * 1e9) }
}

function rollUserId(userId) {
  return rollFrom(mulberry32(hashString(userId + SALT)))
}

function parseArgs(argv) {
  const options = {
    limit: 5_000_000,
    count: 1,
    mode: 'random',
    bytes: 32,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue

    const [flag, inlineValue] = arg.split('=', 2)
    const nextValue = inlineValue ?? argv[i + 1]
    const consumeNext = inlineValue == null

    switch (flag) {
      case '--species':
        options.species = nextValue
        if (consumeNext) i++
        break
      case '--rarity':
        options.rarity = nextValue
        if (consumeNext) i++
        break
      case '--eye':
        options.eye = nextValue
        if (consumeNext) i++
        break
      case '--hat':
        options.hat = nextValue
        if (consumeNext) i++
        break
      case '--shiny':
        options.shiny = true
        break
      case '--not-shiny':
        options.shiny = false
        break
      case '--mode':
        options.mode = nextValue
        if (consumeNext) i++
        break
      case '--bytes':
        options.bytes = Number(nextValue)
        if (consumeNext) i++
        break
      case '--prefix':
        options.prefix = nextValue
        if (consumeNext) i++
        break
      case '--start':
        options.start = Number(nextValue)
        if (consumeNext) i++
        break
      case '--limit':
        options.limit = Number(nextValue)
        if (consumeNext) i++
        break
      case '--count':
        options.count = Number(nextValue)
        if (consumeNext) i++
        break
      case '--help':
        options.help = true
        break
      default:
        throw new Error(`Unknown argument: ${flag}`)
    }
  }

  return options
}

function validateOptions(options) {
  if (options.help) return

  if (!options.species && !options.rarity && !options.eye && !options.hat && options.shiny == null) {
    throw new Error('At least one filter is required. Use --species/--rarity/--eye/--hat/--shiny.')
  }

  if (options.species && !SPECIES.includes(options.species)) {
    throw new Error(`Invalid --species: ${options.species}`)
  }
  if (options.rarity && !RARITIES.includes(options.rarity)) {
    throw new Error(`Invalid --rarity: ${options.rarity}`)
  }
  if (options.eye && !EYES.includes(options.eye)) {
    throw new Error(`Invalid --eye: ${options.eye}`)
  }
  if (options.hat && !HATS.includes(options.hat)) {
    throw new Error(`Invalid --hat: ${options.hat}`)
  }
  if (!['random', 'sequential'].includes(options.mode)) {
    throw new Error('--mode must be random or sequential')
  }
  if (options.mode === 'sequential') {
    if (!Number.isInteger(options.start) || options.start < 0) {
      throw new Error('--start must be a non-negative integer')
    }
    if (typeof options.prefix !== 'string' || options.prefix.length === 0) {
      throw new Error('--prefix is required in sequential mode')
    }
  }
  if (!Number.isInteger(options.bytes) || options.bytes <= 0) {
    throw new Error('--bytes must be a positive integer')
  }
  if (!Number.isInteger(options.limit) || options.limit <= 0) {
    throw new Error('--limit must be a positive integer')
  }
  if (!Number.isInteger(options.count) || options.count <= 0) {
    throw new Error('--count must be a positive integer')
  }
}

function matches(bones, options) {
  if (options.species && bones.species !== options.species) return false
  if (options.rarity && bones.rarity !== options.rarity) return false
  if (options.eye && bones.eye !== options.eye) return false
  if (options.hat && bones.hat !== options.hat) return false
  if (options.shiny != null && bones.shiny !== options.shiny) return false
  return true
}

function printHelp() {
  console.log(`Find a userId that rolls a desired buddy.

Usage:
  bun scripts/find-buddy-user-id.mjs --species ghost --rarity legendary --shiny
  bun scripts/find-buddy-user-id.mjs --species cat --rarity legendary --count 3
  bun scripts/find-buddy-user-id.mjs --species robot --hat wizard --mode sequential --prefix user-

Options:
  --species <value>     One of: ${SPECIES.join(', ')}
  --rarity <value>      One of: ${RARITIES.join(', ')}
  --eye <value>         One of: ${EYES.join(' ')}
  --hat <value>         One of: ${HATS.join(', ')}
  --shiny               Require shiny=true
  --not-shiny           Require shiny=false
  --mode <value>        random (default) or sequential
  --bytes <number>      Random userId byte length, default: 32
  --prefix <value>      Sequential mode userId prefix
  --start <number>      Sequential mode start index, default: 0
  --limit <number>      Max attempts, default: 5000000
  --count <number>      Number of matches to return, default: 1
  --help                Show this help
`)
}

function createUserId(options, index) {
  if (options.mode === 'sequential') {
    return `${options.prefix}${options.start + index}`
  }
  return randomBytes(options.bytes).toString('hex')
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  validateOptions(options)

  if (options.help) {
    printHelp()
    return
  }

  const found = []

  for (let i = 0; i < options.limit; i++) {
    const userId = createUserId(options, i)
    const { bones, inspirationSeed } = rollUserId(userId)
    if (!matches(bones, options)) continue

    found.push({ userId, bones, inspirationSeed, attempts: i + 1 })
    if (found.length >= options.count) break
  }

  if (found.length === 0) {
    console.error(`No match found after ${options.limit} attempts.`)
    process.exitCode = 1
    return
  }

  for (const match of found) {
    console.log(JSON.stringify(match, null, 2))
  }
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
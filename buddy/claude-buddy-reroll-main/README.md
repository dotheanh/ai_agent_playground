<div align="center">

# Claude Buddy Reroll

### Pick the Claude Code Buddy You Actually Want

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Runtime-Bun-f9f1e1?logo=bun&logoColor=000)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Companion-d4a574?logo=anthropic&logoColor=fff)](https://docs.anthropic.com/en/docs/claude-code)
[![Platform: Linux](https://img.shields.io/badge/Platform-Linux%20%7C%20macOS-lightgrey?logo=linux&logoColor=fff)](https://github.com/RoggeOhta/claude-buddy-reroll)
[![GitHub stars](https://img.shields.io/github/stars/RoggeOhta/claude-buddy-reroll?style=social)](https://github.com/RoggeOhta/claude-buddy-reroll)

<br>

**Don't settle for a random buddy. Choose your own.**

Bruteforce the companion salt to find the exact rarity, species, and traits you want, then patch it into Claude Code with one command.

<br>

🟨 Legendary · 🟪 Epic · 🟦 Rare · 🟩 Uncommon · ⬜ Common · ✨ Shiny

</div>

---

## How It Works

Claude Code generates your buddy like this:

```
hash(account_uuid + salt) → seed → mulberry32 PRNG → rarity / species / eyes / hat / shiny
```

This tool:
1. Reads your account UUID from `~/.claude/.credentials.json`
2. Detects the current salt from the Claude Code binary
3. Brute-forces millions of alternate salts, filtering for your criteria
4. Patches the binary to swap in the salt you pick

## Buddy Traits

| Trait | Values |
|-------|--------|
| **Rarity** | ⬜ Common (60%) · 🟩 Uncommon (25%) · 🟦 Rare (10%) · 🟪 Epic (4%) · 🟨 Legendary (1%) |
| **Species** | duck, goose, blob, cat, dragon, octopus, owl, penguin, turtle, snail, ghost, axolotl, capybara, cactus, robot, rabbit, mushroom, chonk |
| **Eyes** | `·` `✦` `×` `◉` `@` `°` |
| **Hats** | none, crown 👑, tophat 🎩, propeller 🧢, halo 😇, wizard 🧙, beanie 🧶, tinyduck 🐤 |
| **Shiny** | 1% chance ✨ |

> Common buddies never have hats. Hats are only rolled for Uncommon and above.

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- Claude Code CLI installed at `~/.local/bin/claude`
- Logged in (valid `~/.claude/.credentials.json`)

## Installation

```bash
git clone https://github.com/RoggeOhta/claude-buddy-reroll.git
cd claude-buddy-reroll
```

No `npm install` needed — the script uses only Bun built-ins and Node standard library.

## Usage

### Interactive mode (search + pick + patch)

```bash
bun buddy-reroll.ts
```

Searches for legendary buddies by default, shows results, and lets you pick one to apply:

```
Account: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Current salt: "friend-2026-401"

Current buddy: ⬜ COMMON duck (eye:· hat:none)

Searching (rarity=legendary, limit=15)...

Found 3 result(s):

  [1] 🟨 LEGENDARY dragon (eye:✦ hat:wizard 🧙) [salt: friend-2026-001]
  [2] 🟨 LEGENDARY ghost (eye:◉ hat:crown 👑) [salt: friend-2026-042]
  [3] 🟨 LEGENDARY cat (eye:× hat:halo 😇) [salt: 9a3k...]

Pick a buddy [1-3] (or "q" to quit):
```

### Search only (no patching)

```bash
bun buddy-reroll.ts --search
```

### Show current buddy

```bash
bun buddy-reroll.ts --current
```

### Filter by rarity

```bash
bun buddy-reroll.ts --rarity epic
bun buddy-reroll.ts --rarity rare
bun buddy-reroll.ts --rarity legendary   # (default)
```

### Filter by species

```bash
bun buddy-reroll.ts --species dragon
bun buddy-reroll.ts --species cat --rarity epic
```

### Shiny only

```bash
bun buddy-reroll.ts --shiny
```

> When `--shiny` is used without `--rarity`, all rarities are searched.

### Limit results

```bash
bun buddy-reroll.ts --limit 50
```

Default is 15.

### Combine filters

```bash
# Find shiny legendary dragons
bun buddy-reroll.ts --rarity legendary --species dragon --shiny --limit 5
```

### Restore original binary

```bash
bun buddy-reroll.ts --restore
```

Restores from the backup created on first patch (`~/.local/bin/claude.bak`).

## Quick Reference

| Command | Description |
|---------|-------------|
| `bun buddy-reroll.ts` | Interactive: search legendaries + pick + patch |
| `bun buddy-reroll.ts --search` | Search only, don't patch |
| `bun buddy-reroll.ts --current` | Show current buddy info |
| `bun buddy-reroll.ts --restore` | Restore original binary |
| `bun buddy-reroll.ts --rarity <r>` | Filter: common / uncommon / rare / epic / legendary |
| `bun buddy-reroll.ts --species <s>` | Filter by species name |
| `bun buddy-reroll.ts --shiny` | Only show shiny results |
| `bun buddy-reroll.ts --limit <n>` | Max results (default 15) |

## Risk Disclaimer

> **This tool modifies the Claude Code binary. Use it at your own risk.**

This tool performs the following operations that may violate [Anthropic's Terms of Service](https://www.anthropic.com/policies/terms-of-service):

| Operation | Detail |
|-----------|--------|
| **Reverse engineering** | Replicates Claude Code's internal buddy generation algorithm (mulberry32 PRNG, hash chain) |
| **Binary patching** | Directly modifies the `claude` executable at `~/.local/bin/claude` |
| **Credential access** | Reads your OAuth token from `~/.claude/.credentials.json` |
| **Undocumented API** | Calls `api.anthropic.com/api/oauth/profile` to retrieve your account UUID |
| **Config mutation** | Clears the `companion` field from `~/.claude/.config.json` |

### Potential consequences

- **Account suspension or ban** — Anthropic may consider binary modification a ToS violation regardless of intent.
- **Detectable by Anthropic** — The `buddy_react` API sends your companion's species, rarity, and stats to Anthropic's servers on every session. A mismatch between the server-expected buddy (derived from your real UUID + official salt) and the one you report could flag your account.
- **Binary integrity checks** — Future Claude Code versions may verify their own checksum at startup. A patched binary could refuse to run or trigger a report.
- **No "safe" alternative exists** — The buddy's visual traits (rarity, species, eyes, hat, shiny) are deterministically derived from `hash(account_uuid + salt)` at runtime, where the salt is hardcoded in the binary. For OAuth users, there is no config-level workaround; the binary is the only attack surface.

### If things go wrong

```bash
bun buddy-reroll.ts --restore   # restore from ~/.local/bin/claude.bak
```

Or reinstall Claude Code:

```bash
curl -fsSL https://claude.ai/install.sh | sh
```

## Notes

- **Backup**: A backup is automatically created at `~/.local/bin/claude.bak` on the first patch. Use `--restore` to revert.
- **Updates**: Claude Code updates will overwrite the patch. Re-run this script after updates.
- **Companion cache**: The script clears `companion` state from `~/.claude/.config.json` after patching so the new buddy is re-hatched on next session.
- **Cosmetic only**: The script only replaces the salt string in the binary (same length, same encoding). No code is modified. This changes the companion's appearance but does not affect Claude Code's functionality.

## License

[MIT](LICENSE)

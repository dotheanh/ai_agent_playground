# Claude Buddy Reroll - Technical Specification

## Mục lục
1. [Tổng quan](#1-tổng-quan)
2. [Architecture](#2-architecture)
3. [Buddy Algorithm](#3-buddy-algorithm)
4. [UI Layout](#4-ui-layout)
5. [Mode System](#5-mode-system)
6. [Components](#6-components)
7. [State Management](#7-state-management)
8. [Brute-force Logic](#8-brute-force-logic)
9. [Animation System](#9-animation-system)
10. [File Structure](#10-file-structure)
11. [Implementation Details](#11-implementation-details)

---

## 1. Tổng quan

**File:** `index.html` — Single-file web application (HTML + CSS + JS)

**Mục đích:** Tìm userID hoặc salt tạo ra Buddy pet mong muốn trong Claude Code bằng brute-force.

**Target users:**
- API Key users — tự do đặt `userID` trong `~/.claude.json`
- OAuth/Team/Pro users — 2 sub-mode:
  - `delete-uuid` — xóa `accountUuid` để fallback sang `userID`
  - `patch-salt` — brute-force salt rồi patch binary

**Default mode:** `oauth-account` (line 2057: `DEFAULT_MODE = 'oauth-account'`)

---

## 2. Architecture

### 2.1 Single File Structure

```
index.html
├── <style>        (~1590 lines) — CSS styles
├── <body>        (~1380 lines) — HTML markup
└── <script>     (~1108 lines) — JavaScript logic
```

### 2.2 Design System

**CSS Variables:**
```css
--bg-primary:   #0a0a0f   /* Main background */
--bg-secondary: #12121a   /* Cards, panels */
--bg-card:      #1a1a24   /* Elevated surfaces */
--bg-hover:     #22222e   /* Hover state */
--border:       #2a2a3a   /* Default borders */
--border-light: #3a3a4a   /* Highlighted borders */
--text-primary: #f0f0f5   /* Main text */
--text-secondary:#8888a0   /* Secondary text */
--text-muted:   #555566    /* Muted text */
--accent:       #7c5cff    /* Primary accent */
--accent-glow:  rgba(124,92,255,0.4) /* Glow effect */
--accent-hover: #9b7fff    /* Accent hover state */
--success:      #4ade80    /* Success state */
--error:        #f87171    /* Error state */
--common:       #6b7280    /* Rarity colors */
--uncommon:     #22c55e
--rare:         #3b82f6
--epic:         #a855f7
--legendary:    #f59e0b
```

**Fonts:**
- Body: `Outfit` (Google Fonts) — weights 400-800
- Code/Monospace: `Fira Code` (Google Fonts) — weights 400-600

**Layout:** Responsive grid
- Max width: 1400px
- Breakpoint 1100px: 2-col → 1-col
- Breakpoint 900px: combined-card 2-col → 1-col

---

## 3. Buddy Algorithm

### 3.1 Constants

```javascript
const SALT = 'friend-2026-401';           // Hardcoded salt
const SPECIES = 18 items;                // duck → chonk
const RARITIES = ['common','uncommon','rare','epic','legendary'];
const RARITY_WEIGHTS = { common:60, uncommon:25, rare:10, epic:4, legendary:1 };
const RARITY_STARS = { common:'★', uncommon:'★★', ... };
const RARITY_FLOOR = { common:5, uncommon:15, rare:25, epic:35, legendary:50 };
const EYES = ['·','✦','×','◉','@','°'];
const HATS = ['none','crown','tophat','propeller','halo','wizard','beanie','tinyduck'];
const STAT_NAMES = ['DEBUGGING','PATIENCE','CHAOS','WISDOM','SNARK'];
```

### 3.2 Hash Functions

**FNV-1a (default, for Node.js / Claude Code 2.1.68+):**
```javascript
function hashFNV(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
```

**Bun.hash (legacy):**
```javascript
function hashBun(s) {
  return Number(BigInt(Bun.hash(s)) & 0xffffffffn);
}
```

### 3.3 PRNG: Mulberry32

```javascript
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

### 3.4 Roll Order

```
hash(userID + SALT) → seed → Mulberry32 PRNG
                                    │
        ┌──────────┬───────────┬───┴───┬──────┐
        ▼          ▼           ▼       ▼      ▼
    rarity    species      eye      hat    shiny  → stats
  (weighted)  (uniform)  (uniform) (skip  (1%)   (5 calls)
                       common=none)
```

**rollBuddy(userId):**
1. `rng = mulberry32(hash(userID + SALT))`
2. `rarity = rollRarity(rng)` — weighted pick
3. `species = pick(rng, SPECIES)` — uniform
4. `eye = pick(rng, EYES)` — uniform
5. `hat = rarity === 'common' ? 'none' : pick(rng, HATS)`
6. `shiny = rng() < 0.01`
7. `stats = rollStats(rng, rarity)`

**rollStats(rng, rarity):**
- `peak` = random stat (50-80 for legendary)
- `dump` = random different stat (40-55 for legendary)
- Other 3 stats = random (50-90 for legendary)
- Floor enforced by `RARITY_FLOOR[rarity]`

### 3.5 Identity Resolution

```javascript
oauthAccount?.accountUuid  ??  userID  ??  "anon"
```

- `??` (nullish coalescing) — only null/undefined triggers fallback
- `accountUuid: ""` does NOT trigger fallback (unlike `||`)

---

## 4. UI Layout

### 4.1 Page Structure

```
┌─────────────────────────────────────────────────┐
│  HEADER: title, mode selector (API Key / OAuth) │
├─────────────────────────────────────────────────┤
│  ┌─────────────────┬─────────────────────────┐   │
│  │  PREVIEW PANEL  │   ATTRIBUTES PANEL     │   │
│  │  - Buddy display│   - Species (grid)      │   │
│  │  - Pet button   │   - Rarity (pills)      │   │
│  │  - ASCII sprite│   - Eye (icon buttons)   │   │
│  │                 │   - Hat (grid)          │   │
│  │                 │   - Shiny (toggle)      │   │
│  └─────────────────┴─────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  OAuth Sub-mode: [🗑️ Xóa accountUuid] [🔧 Patch binary] │
├────────────────────┬────────────────────────────┤
│  SETTINGS PANEL    │  INSTRUCTIONS PANEL         │
│  - Hash algo       │  - Step-by-step guide       │
│  - UUID input (OAuth)  - Risk banner            │
│  - Limit / Count  │  - Salt input (patch mode)  │
│  - Run button     │  - Patch/restore commands    │
│  - Output area    │                             │
│  - Search command (OAuth)                        │
└────────────────────┴────────────────────────────┘
```

### 4.2 Modals

| Modal | Trigger | Content |
|-------|---------|---------|
| `riskModal` | Switch to patch-salt | Warning, ToS risks, confirm/cancel |
| `historyModal` | Click history button | Last 10 results, ASCII preview |
| `aboutModal` | Click About Buddy | Full explanation, tables, sprites, references |

**About Modal Style Boxes:**
- `.about-cheat` — green success box: "✓ Cách cheat" (API Key mode guide)
- `.about-cheat-safe` — yellow/amber box: "✓ Cách cheat an toàn" (safe OAuth deletion method)
- `.about-warn` — red warning box: "⚠️ Cách cheat (có rủi ro)" (binary patching risk)

### 4.3 Header Buttons

```html
<button class="about-btn" id="aboutBtn">ℹ️ About Buddy</button>
<button class="history-btn" id="historyBtn">📜 Lịch sử <span class="badge">N</span></button>
```

Badge shows count of history items, hidden when 0.

**Style:** Both buttons use accent-colored gradient background, purple border with subtle glow, and scale up on hover with stronger glow effect.

---

## 5. Mode System

### 5.1 Mode Types

| Mode | Sub-mode | Default | Hash | Target |
|------|----------|---------|------|--------|
| `api-key` | — | No | FNV/Bun | `userID` (random hex) |
| `oauth-account` | `delete-uuid` | ✅ | FNV only | `userID` (random hex) |
| `oauth-account` | `patch-salt` | No | FNV/Bun | `salt` (friend-XXX) |

### 5.2 State Object

```javascript
const state = {
  modeType: 'oauth-account',      // 'api-key' | 'oauth-account'
  oauthSubMode: 'delete-uuid',    // 'delete-uuid' | 'patch-salt'
  species: null,                  // string | null
  rarity: 'legendary',            // string
  eye: null,                      // string | null
  hat: null,                       // string | null
  shiny: 'any',                   // 'any' | 'true' | 'false'
  algo: 'fnv',                    // 'fnv' | 'bun'
  mode: 'random'                  // 'random' | 'sequential'
};
```

### 5.3 Mode Switching Functions

| Function | Triggers |
|----------|----------|
| `switchToApiKey()` | Select API Key mode |
| `activateOAuthMode()` | Select OAuth mode (default delete-uuid), also creates Shell Alias section |
| `switchToDeleteUuid()` | Select delete-uuid sub-mode, disables Bun.hash selector, injects Shell Alias section, shows apply-buddy.bat instructions |
| `switchToPatchSalt()` | Select patch-salt sub-mode (via risk modal), shows patch/restore commands, hides Shell Alias section |
| `openRiskModal()` | Show ToS warning before patch-salt |
| `closeRiskModal()` | Dismiss modal (used by "Quay lại" in risk modal — stays in OAuth mode) |
| `confirmRisk()` | Confirm risk modal → calls `switchToDeleteUuid()` |

### 5.4 Conditional UI Visibility

| Element | api-key | delete-uuid | patch-salt |
|---------|---------|-------------|------------|
| `oauthSubModeToggle` | hidden | visible | visible |
| `oauthSection` (UUID input) | hidden | hidden | visible |
| `searchCommandSection` | hidden | hidden | visible |
| `oauthInstructions` | hidden | hidden | visible |
| `shellAliasSection` | hidden | visible | hidden |
| Bun.hash selector | disabled (gray) | disabled (gray) | enabled |

---

## 6. Components

### 6.1 Species Grid

- 18 buttons, auto-fill grid (min 90px each)
- Each button shows ASCII sprite from first frame of BODIES
- Selected state: purple accent background
- Toggle: click to select, click again to deselect

### 6.2 Rarity Pills

- 5 buttons, horizontal flex-wrap
- Each has rarity-specific border/text color
- Selected: filled background with rarity color
- Default selected: `legendary`

### 6.3 Eye Icon Buttons

- 6 buttons, 48x48px each
- Fira Code monospace font for eye symbols
- Selected: purple accent

### 6.4 Hat Grid

- 8 buttons, auto-fill (min 65px each)
- Each shows emoji + label
- Common rarity: hats shown but not selected (no effect on result)

### 6.5 Shiny Toggle

- 3 buttons: `Any` / `Yes ✨` / `No`
- Default: `Any`

### 6.6 Hash Algorithm Selector

```html
<div class="algo-selector" id="algoSelector">
  <button data-algo="fnv">FNV-1a <small>Claude Code 2.1.68+</small></button>
  <button data-algo="bun">Bun.hash <small>Legacy / Bun</small></button>
</div>
```
- Disabled in api-key mode (opacity 0.4, pointer-events none)
- Bun.hash only available in patch-salt mode

### 6.7 Run Button

```javascript
<button class="run-btn" id="runBtn" onclick="runSearch()">
  <span>🚀</span> <span>Bắt đầu tìm kiếm</span>
</button>
```
States: default / disabled (during search) / spinner

### 6.8 Output Area

- Monospace font, Fira Code
- Scrollable, max-height 300px
- Line types: `output-success` (green), `output-error` (red), `output-info` (purple)

### 6.9 Apply Button (delete-uuid only)

Injected per result in output area when `oauthSubMode === 'delete-uuid'`:

```javascript
`<button class="apply-btn" onclick="applyDeleteUuid('${match.userId}')">✅ Apply</button>`
```

- Escapes single quotes: `safeUserId = userId.replace(/'/g, "\\'")`
- Downloads `apply-buddy.bat` (not `.cmd` or Node script)
- Output area shows script content + copy button with "Đã copy!" feedback

---

## 7. State Management

### 7.1 Search State

```javascript
// runSearch() reads from DOM:
const uuid = document.getElementById('uuidInput').value.trim();  // OAuth patch-salt
const limit = parseInt(document.getElementById('limitInput').value) || 50000000;
const count = parseInt(document.getElementById('countInput').value) || 1;
const prefix = document.getElementById('prefixInput')?.value || 'user-';
```

### 7.2 History

```javascript
const MAX_HISTORY = 10;
localStorage key: 'buddyHistory'
// Stored as JSON array of { id, userId, buddy, timestamp }
```

### 7.3 Animation State

```javascript
let animationFrame = 0;
let animationInterval = null;
// Managed by startAnimation() / clearInterval
```

---

## 8. Brute-force Logic

### 8.1 ID Generation

| Mode | ID Type | Generation |
|------|---------|------------|
| `api-key` + `random` | 64-char hex | `crypto.randomBytes(32).toString('hex')` |
| `api-key` + `sequential` | incremental | `${prefix}${i}` |
| `oauth-account` + `delete-uuid` | 64-char hex | `generateRandomId(32)` |
| `oauth-account` + `patch-salt` | salt string | `generateOAuthSalt(i)` |

### 8.2 generateOAuthSalt(i)

```javascript
function generateOAuthSalt(index) {
  if (index < 1000000) {
    return `friend-2026-${String(index).padStart(3, '0')}`; // friend-2026-000 → friend-2026-999
  }
  // Systematic enumeration for i >= 1,000,000
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789-_';
  let salt = '';
  let n = index - 1000000;
  for (let j = 0; j < 15; j++) {
    salt += chars[n % chars.length];
    n = Math.floor(n / chars.length);
  }
  return salt;
}
```

### 8.3 matches(buddy)

```javascript
function matches(buddy) {
  if (state.species != null && buddy.species !== state.species) return false;
  if (state.rarity != null && buddy.rarity !== state.rarity) return false;
  if (state.eye != null && buddy.eye !== state.eye) return false;
  if (state.hat != null && buddy.hat !== state.hat) return false;
  if (state.shiny !== 'any' && buddy.shiny !== (state.shiny === 'true')) return false;
  return true;
}
```

All filters are AND-ed. Null/undefined = no filter for that attribute.

### 8.4 Search Loop

```javascript
for (let i = 0; i < limit; i++) {
  // Generate ID based on mode
  const buddy = rollBuddy(searchValue);
  if (!matches(buddy)) continue;
  found.push({ [idKey]: searchValue, buddy, attempts: i + 1 });
  if (found.length >= count) break;
  if (i % 100000 === 0) {
    // Update progress every 100k iterations
    outputArea.innerHTML = `<div class="output-line">🔍 Đã thử ${i.toLocaleString()} lần...</div>`;
  }
}
```

Search runs synchronously in `setTimeout(..., 50)` to allow UI updates.

---

## 9. Animation System

### 9.1 Idle Animation

```javascript
const IDLE_SEQUENCE = [0, 0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 2, 0, 0, 0];
// 0 = rest frame, 1 = fidget, 2 = special, -1 = blink
const FRAME_INTERVAL = 500; // ms

// On blink (-1): replace eye char with '-' in sprite
```

### 9.2 Pet Animation

```javascript
const PET_BURST_MS = 4000;
const PET_HEARTS = [5 lines of ASCII hearts];
// 8 hearts spawned at 200ms intervals
// Each floats up and fades over 700ms
// Sprite cycles through all frames at 1000ms interval
// After 4s: resumes idle animation
```

### 9.3 Preview Stats (Random)

Stats in preview are **randomly generated** for display only (not used in matching):

```javascript
const stats = {
  DEBUGGING: Math.min(100, floor + 30 + Math.floor(Math.random() * 40)),
  PATIENCE: Math.min(100, floor + 20 + Math.floor(Math.random() * 50)),
  CHAOS: Math.min(100, floor + 25 + Math.floor(Math.random() * 45)),
  WISDOM: Math.min(100, floor + 35 + Math.floor(Math.random() * 35)),
  SNARK: Math.min(100, floor + 28 + Math.floor(Math.random() * 42))
};
```

**Actual stats** are deterministic from PRNG — preview is just for visualization.

### 9.4 Shiny Effect

CSS-only animation using `::after` pseudo-element:
```css
.buddy-avatar.shiny::after {
  background: linear-gradient(gradient rotating);
  animation: shiny-rotate 3s linear infinite;
}
```

Sparkles: 6 positioned `::after` spans with staggered delays.

---

## 10. File Structure

```
buddy/
├── index.html                  # Main application (this spec)
├── docs/
│   ├── buddy-reroll-guide.md  # User guide
│   ├── claude-buddy-reroll-analysis.md  # Analysis of external repo
│   ├── oauth-buddy-reroll-comparison.md # 2 approaches comparison
│   └── spec.md                # This file
└── [external repos referenced]
    ├── grayashh/buddy-reroll     # CLI + React UI
    ├── ithiria894/claude-code-buddy-reroll  # FNV-only + verify.js + shiny_hunt.js
    ├── RoggeOhta/claude-buddy-reroll  # Reference source
    └── linux.do/t/topic/1871870  # Discussion thread
```

---

## 11. Implementation Details

### 11.1 Hash Selection

```javascript
function hashString(s) {
  return state.algo === 'fnv' ? hashFNV(s) : hashBun(s);
}
```

Bun.hash hidden in api-key mode via CSS:
```css
.api-key-mode .algo-btn[data-algo="bun"] { display: none; }
```

### 11.2 Patch Salt: External Script URLs

Search command:
```javascript
let cmd = `bun run https://raw.githubusercontent.com/dotheanh/ai_agent_playground/main/buddy/scripts/search-salt.js --uuid "${uuid}" --rarity ${rarity} --limit ${limit} --count ${count}`;
```

Patch command:
```javascript
`bun run https://raw.githubusercontent.com/dotheanh/ai_agent_playground/main/buddy/scripts/patch-salt.js --salt "${salt}"`
```

Restore command:
```javascript
`bun run https://raw.githubusercontent.com/dotheanh/ai_agent_playground/main/buddy/scripts/patch-salt.js --restore`
```

### 11.3 applyDeleteUuid(userId)

Downloads a Windows `.bat` file (not Node.js inline) for maximum Windows compatibility:

```batch
@echo off
echo Applying buddy config...
node -e "const p=require('path');const f=require('path').join(process.env.USERPROFILE||process.env.HOME,'.claude.json');const c=JSON.parse(require('fs').readFileSync(f,'utf8'));if(c.oauthAccount)delete c.oauthAccount.accountUuid;delete c.companion;c.userID='${userId}';require('fs').writeFileSync(f,JSON.stringify(c,null,2));console.log('Done! Restart Claude Code and type /buddy');"
pause
```

Steps executed:
1. Delete `oauthAccount.accountUuid` (preserves rest of `oauthAccount`)
2. Delete `companion` (forces fresh hatch)
3. Set `userID` to found value
4. Write updated config with 2-space indentation

After download, output area displays the script content with a copy button.

### 11.3b Shell Alias Section (switchToDeleteUuid)

Dynamically injected into `.instructions` panel when switching to delete-uuid sub-mode. The section is created once on first switch, then toggled via `display: block/none`:

```javascript
let shellAliasSection = document.getElementById('shellAliasSection');
if (!shellAliasSection) {
  shellAliasSection = document.createElement('div');
  shellAliasSection.id = 'shellAliasSection';
  shellAliasSection.style.cssText = '...green theme...';
  instructionsPanel.appendChild(shellAliasSection);
}
shellAliasSection.style.display = 'block';
shellAliasSection.innerHTML = '...shell alias HTML...';
```

**Shell alias content:**
```bash
alias claude='node -e "const f=require(\"os\").homedir()+\"\\\\.claude.json\";try{const c=JSON.parse(require(\"fs\").readFileSync(f));if(c.oauthAccount?.accountUuid){delete c.oauthAccount.accountUuid;require(\"fs\").writeFileSync(f,JSON.stringify(c,null,2));console.log(\"[buddy-fix] accountUuid removed\");}}catch{}" && command claude'
```

Key difference from apply script: **does NOT delete companion** — only removes `accountUuid` so Claude falls back to existing `userID`. Survives Claude Code updates and re-logins permanently.

### 11.4 initUI() — Dynamic DOM Building

Species, rarity, eye, hat buttons are all created **programmatically** by `initUI()`:

```javascript
// Species: 18 buttons from BODIES ascii art
SPECIES.forEach(s => {
  const asciiLines = BODIES[s][0].map(l => l.replace('{E}', '·')).join('\n');
  btn.innerHTML = `<pre>${asciiLines}</pre>${s}`;
});

// Rarity: 5 pills, legendary pre-selected
RARITIES.forEach(r => {
  pill.dataset.rarity = r;
  pill.textContent = r.charAt(0).toUpperCase() + r.slice(1);
  if (r === 'legendary') pill.classList.add('selected');
});

// Eye: 6 icon buttons
EYES.forEach(e => { btn.dataset.eye = e; btn.textContent = e; });

// Hat: 8 buttons with emoji
HATS.forEach(h => { btn.dataset.hat = h; btn.innerHTML = `<span>${HAT_EMOJI[h]}</span>${h}`; });
```

### 11.5 ASCII Sprites

18 species × 3 frames each = 54 sprite arrays. Each line uses `{E}` placeholder for eye rendering.

Hat overlays: `HAT_LINES` dict maps hat type to ASCII string, prepended to frame 0 if empty.

### 11.6 Keyboard & Accessibility

- `Escape` key closes all modals
- Click outside modal closes it (event delegation on `.modal-overlay`)
- Buttons have `cursor: pointer`
- Focus states via default browser styles

### 11.7 Default Mode Initialization

```javascript
// Line 2902-2919
if (DEFAULT_MODE === 'oauth-account') {
  activateOAuthMode();  // Show delete-uuid by default
} else {
  // API Key mode - hide OAuth elements
}
if (DEFAULT_MODE === 'api-key') {
  document.body.classList.add('api-key-mode');  // Hide Bun.hash
}
```

---

## Revision History

| Date | Description |
|------|-------------|
| 2026-04-02 | Initial spec from full code review |
| 2026-04-02 | Added `.about-cheat-safe` yellow warning box style in About modal |
| 2026-04-02 | Enhanced header buttons (About/History) with gradient, accent border, glow |
| 2026-04-02 | Added "Nguồn tham khảo" (References) section in About modal |
| 2026-04-02 | Fixed risk modal "Quay lại" → calls `closeRiskModal()` instead of `switchToApiKey()` |

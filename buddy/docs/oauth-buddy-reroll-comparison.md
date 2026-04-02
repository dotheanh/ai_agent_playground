# OAuth Buddy Reroll: So sánh 2 Hướng tiếp cận

## Tổng quan

Khi dùng Claude Code với **OAuth / Claude Account** (Team/Pro plan), Buddy được sinh từ:

```
hash(accountUuid + SALT) → Mulberry32 PRNG → Buddy attributes
```

Trong đó:
- `accountUuid` → do server cung cấp, **không edit được**, ghi vào `~/.claude.json` mỗi lần login
- `SALT` → hardcoded string trong binary, hiện tại là `"friend-2026-401"`

Claude Code resolve identity theo thứ tự:

```javascript
oauthAccount?.accountUuid  ??  userID  ??  "anon"
```

| Toán tử | Khi nào fallback? |
|---------|-------------------|
| `\|\|` | `falsy` (null, undefined, 0, "", false) |
| `??` | Chỉ `null` hoặc `undefined` |

→ **Key insight:** `accountUuid: undefined` → `??` vẫn fallback sang `userID` được.

---

## Hướng tiếp cận 1: Binary Patching (Đổi SALT)

### Nguyên lý

Thay đổi `SALT` trong binary Claude Code. `accountUuid` giữ nguyên, nhưng `SALT` mới tạo ra buddy đẹp hơn.

```
accountUuid (server-provided, không đổi)
        ↓
hash(accountUuid + SALT_moi) → Mulberry32 → Buddy mới ✓
```

### Các bước thực hiện

#### Bước 1: Lấy accountUuid

```bash
# Đọc credentials.json
cat ~/.claude/.credentials.json

# Hoặc gọi API để lấy UUID
curl -s "https://api.anthropic.com/api/oauth/profile" \
  -H "Authorization: Bearer <token>"
```

#### Bước 2: Brute-force tìm salt mới

```javascript
// generateOAuthSalt.js
// Brute-force tìm salt tạo buddy mong muốn

const SALT_LENGTH = 15;
const SEARCH_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789-_";
const SPECIES = ["duck","goose","blob","cat","dragon","octopus","owl","penguin","turtle","snail","ghost","axolotl","capybara","cactus","robot","rabbit","mushroom","chonk"];
const RARITIES = ["common","uncommon","rare","epic","legendary"];
const RARITY_WEIGHTS = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 };
const EYES = ["·","✦","×","◉","@","°"];
const HATS = ["none","crown","tophat","propeller","halo","wizard","beanie","tinyduck"];

// FNV-1a hash
function hashFNV(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Bun.hash (nếu Claude dùng Bun)
function hashBun(s) {
  return Number(BigInt(Bun.hash(s)) & 0xffffffffn);
}

// Mulberry32 PRNG
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

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

function rollBuddy(rng) {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  let rarity = "common";
  for (const r of RARITIES) {
    roll -= RARITY_WEIGHTS[r];
    if (roll < 0) { rarity = r; break; }
  }
  return {
    rarity,
    species: pick(rng, SPECIES),
    eye: pick(rng, EYES),
    hat: rarity === "common" ? "none" : pick(rng, HATS),
    shiny: rng() < 0.01,
  };
}

function matches(buddy, opts) {
  if (opts.rarity && buddy.rarity !== opts.rarity) return false;
  if (opts.species && buddy.species !== opts.species) return false;
  if (opts.shiny && !buddy.shiny) return false;
  return true;
}

// Account UUID của user
const accountUuid = "YOUR-ACCOUNT-UUID-HERE";
const opts = { rarity: "legendary", species: "cat", shiny: false };

const results = [];

// Phase 1: friend-2026-XXX patterns
for (let i = 0; i < 1_000_000 && results.length < 10; i++) {
  const salt = `friend-2026-${String(i).padStart(3, "0")}`;
  const rng = mulberry32(hashFNV(accountUuid + salt));
  const buddy = rollBuddy(rng);
  if (matches(buddy, opts)) {
    results.push({ salt, buddy });
    console.log(`Found: ${buddy.rarity} ${buddy.species} -> salt: ${salt}`);
  }
}

// Phase 2: systematic enumeration
if (results.length < 10) {
  for (let i = 0; i < 20_000_000 && results.length < 10; i++) {
    let salt = "";
    let n = i;
    for (let j = 0; j < SALT_LENGTH; j++) {
      salt += SEARCH_CHARS[n % SEARCH_CHARS.length];
      n = Math.floor(n / SEARCH_CHARS.length);
    }
    const rng = mulberry32(hashFNV(accountUuid + salt));
    const buddy = rollBuddy(rng);
    if (matches(buddy, opts)) {
      results.push({ salt, buddy });
      console.log(`Found: ${buddy.rarity} ${buddy.species} -> salt: ${salt}`);
    }
  }
}

console.log(`\nTotal found: ${results.length}`);
results.forEach((r, i) => {
  console.log(`#${i+1} salt="${r.salt}" -> ${r.buddy.rarity} ${r.buddy.species}`);
});
```

#### Bước 3: Backup binary

```bash
# Linux/macOS
cp ~/.local/bin/claude ~/.local/bin/claude.bak

# macOS (có thể khác đường dẫn)
cp /usr/local/bin/claude /usr/local/bin/claude.bak
```

#### Bước 4: Patch binary

```javascript
// patch-salt.js
const fs = require("fs");

const CLAUDE_BIN = "/home/user/.local/bin/claude"; // đổi theo OS
const OLD_SALT = "friend-2026-401";
const NEW_SALT = "friend-2026-042"; // kết quả từ bước 2

if (OLD_SALT.length !== NEW_SALT.length) {
  console.error("Salt length mismatch!");
  process.exit(1);
}

const bin = fs.readFileSync(CLAUDE_BIN);
const oldBytes = Buffer.from(OLD_SALT, "utf-8");
const newBytes = Buffer.from(NEW_SALT, "utf-8");

let count = 0;
let offset = 0;
while (true) {
  const idx = bin.indexOf(oldBytes, offset);
  if (idx === -1) break;
  newBytes.copy(bin, idx);
  offset = idx + newBytes.length;
  count++;
}

fs.writeFileSync(CLAUDE_BIN, bin);
console.log(`Patched ${count} occurrence(s): "${OLD_SALT}" → "${NEW_SALT}"`);
```

```bash
node patch-salt.js
```

#### Bước 5: Xóa companion state

```bash
# ~/.claude.json - xóa field companion
node -e "
const c = JSON.parse(require('fs').readFileSync(require('os').homedir() + '/.claude.json'));
delete c.companion;
require('fs').writeFileSync(require('os').homedir() + '/.claude.json', JSON.stringify(c, null, 2));
console.log('Companion state cleared');
"
```

#### Bước 6: Restart Claude Code

```bash
# Quit Claude Code hoàn toàn, sau đó mở lại
# Gõ /buddy để nhận Buddy mới
```

#### Khôi phục

```bash
# Nếu cần restore
cp ~/.local/bin/claude.bak ~/.local/bin/claude
```

### Rủi ro

| Rủi ro | Mức độ |
|--------|---------|
| Binary corruption | Cao nếu patch sai |
| Claude update ghi đè | Cao (cần patch lại sau mỗi update) |
| ToS violation | Cao |
| Server phát hiện | Trung bình (buddy info gửi về server) |

### Khi nào dùng

- Khi không muốn can thiệp vào `~/.claude.json`
- Khi đã quen với binary patching
- Khi cần **exact match** với salt cố định

---

## Hướng tiếp cận 2: Xóa accountUuid (ithiria894)

### Nguyên lý

Xóa field `accountUuid` khỏi `~/.claude.json` để Claude Code fallback sang `userID` (anh tự đặt được).

```
accountUuid → undefined (xóa khỏi config)
        ↓
oauthAccount?.accountUuid  ??  userID  (fallback)
        ↓
hash(userID + SALT) → Mulberry32 → Buddy mới ✓
```

### Key insight

Claude Code dùng `??` (nullish coalescing), **không phải** `||`:
- `accountUuid: undefined` → `??` fallback sang `userID`
- `accountUuid: ""` → `??` **KHÔNG** fallback (vì "" không phải null/undefined)

→ **Chỉ cần xóa field**, không cần xóa cả `oauthAccount`.

### Các bước thực hiện

#### Bước 1: Brute-force tìm userID mới

```javascript
// reroll.js - tìm userID tạo buddy mong muốn

const crypto = require("crypto");

const SALT = "friend-2026-401";
const SPECIES = ["duck","goose","blob","cat","dragon","octopus","owl","penguin","turtle","snail","ghost","axolotl","capybara","cactus","robot","rabbit","mushroom","chonk"];
const RARITIES = ["common","uncommon","rare","epic","legendary"];
const RARITY_WEIGHTS = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 };
const RARITY_RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };

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

function hashFNV(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

function rollRarity(rng) {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (const r of RARITIES) {
    roll -= RARITY_WEIGHTS[r];
    if (roll < 0) return r;
  }
  return "common";
}

const target = process.argv[2] || "cat";
const max = parseInt(process.argv[3]) || 500000;

console.log(`Searching for legendary ${target} (max: ${max.toLocaleString()})...\n`);

let best = { rarity: "common", id: "" };

for (let i = 0; i < max; i++) {
  // Random 32-byte hex string
  const id = crypto.randomBytes(32).toString("hex");
  const rng = mulberry32(hashFNV(id + SALT));
  const rarity = rollRarity(rng);
  const species = pick(rng, SPECIES);

  if (species === target && RARITY_RANK[rarity] > RARITY_RANK[best.rarity]) {
    best = { rarity, id };
    console.log(`  found: ${rarity} ${species} -> ${id}`);
    if (rarity === "legendary") break;
  }
}

console.log(`\nBest: ${best.rarity} ${target} -> ${best.id}`);
```

```bash
node reroll.js cat
# Output: Best: legendary cat -> da55a6e264a84bb4ab5e68f09dd9f6b096f1394a758d1d3ad603f706cab71bcf
```

#### Bước 2: Áp dụng vào config

```bash
# Xóa accountUuid + companion, set userID
node -e "
const path = require('path');
const fs = require('fs');
const f = path.join(process.env.HOME || process.env.USERPROFILE, '.claude.json');

const c = JSON.parse(fs.readFileSync(f, 'utf8'));

// Xóa accountUuid (không xóa cả oauthAccount)
if (c.oauthAccount) delete c.oauthAccount.accountUuid;

// Xóa companion (bắt buộc để nhận buddy mới)
delete c.companion;

// Set userID mới
c.userID = 'YOUR-BEST-ID-HERE';

fs.writeFileSync(f, JSON.stringify(c, null, 2));
console.log('Config updated. accountUuid removed, userID set, companion cleared.');
"
```

#### Bước 3: Restart Claude Code

```bash
# Quit Claude Code hoàn toàn, sau đó mở lại
# Gõ /buddy để nhận Buddy mới
```

### Recovery sau khi bị re-login

Mỗi lần Claude Code bị forced re-login, server ghi lại `accountUuid` vào config → Buddy revert.

#### Cách 1: fix.sh (chạy thủ công)

```bash
#!/bin/bash
# fix.sh - Recovery sau khi bị re-login

CONFIG="$HOME/.claude.json"

echo "Before:"
node -e "
  const c = JSON.parse(require('fs').readFileSync('$CONFIG'));
  console.log('  accountUuid:', c.oauthAccount?.accountUuid ?? '(none)');
  console.log('  companion:', c.companion?.name ?? '(none)');
"

node -e "
  const f = '$CONFIG';
  const c = JSON.parse(require('fs').readFileSync(f));
  if (c.oauthAccount?.accountUuid) delete c.oauthAccount.accountUuid;
  if (c.companion) delete c.companion;
  require('fs').writeFileSync(f, JSON.stringify(c, null, 2));
"

echo ""
echo "After:"
node -e "
  const c = JSON.parse(require('fs').readFileSync('$CONFIG'));
  console.log('  accountUuid:', c.oauthAccount?.accountUuid ?? '(none)');
  console.log('  companion:', c.companion?.name ?? '(none)');
"

echo ""
echo "Done. Restart Claude Code and /buddy."
```

```bash
bash fix.sh
```

#### Cách 2: Shell alias (Tự động vĩnh viễn) ⭐

Thêm vào `~/.bashrc` hoặc `~/.zshrc` (Linux/macOS/Git Bash/WSL):

```bash
# ~/.bashrc hoặc ~/.zshrc
alias claude='node -e "
const f=require(\"os\").homedir()+\"/.claude.json\";
try{
  const c=JSON.parse(require(\"fs\").readFileSync(f));
  if(c.oauthAccount?.accountUuid){
    delete c.oauthAccount.accountUuid;
    delete c.companion;
    require(\"fs\").writeFileSync(f,JSON.stringify(c,null,2));
    console.log(\"[buddy-fix] accountUuid removed\");
  }
}catch{}" && command claude'
```

```bash
# Áp dụng
source ~/.bashrc  # hoặc ~/.zshrc nếu dùng zsh
```

**Cách hoạt động:**
1. Mỗi lần gõ `claude` → shell alias chạy trước
2. Node inline xóa `accountUuid` khỏi config
3. `command claude` → chạy Claude Code thật
4. Claude đọc config → `accountUuid: undefined` → fallback sang `userID`

**Ưu điểm:**
- ✅ One-time setup → hiệu quả vĩnh viễn
- ✅ Tự động mỗi lần gọi `claude`
- ✅ Survive Claude Code update
- ✅ Survive re-login
- ✅ Không ảnh hưởng auth, Team/Pro access
- ✅ Không sửa binary → không ToS violation

#### Cách 3: OAuth Token Env Var (Nuclear)

Ngăn không cho `accountUuid` bao giờ được ghi vào config:

```bash
# 1. Extract token
claude setup-token
# Copy token output

# 2. Xóa config
rm ~/.claude.json

# 3. Tạo minimal config
echo '{"hasCompletedOnboarding":true,"theme":"dark"}' > ~/.claude.json

# 4. Set env var (thêm vào ~/.bashrc)
export CLAUDE_CODE_OAUTH_TOKEN="your-token-here"
```

**Nhược điểm:** Nuke toàn bộ config, cần giữ env var vĩnh viễn.

#### So sánh 3 cách recovery

| | Shell Alias ⭐ | fix.sh | OAuth Token Env |
|---|---|---|---|
| **Setup** | 1 dòng trong .bashrc | Copy file | Extract token + set env |
| **Tự động** | ✅ Mỗi lần gõ `claude` | ❌ Chạy tay | ✅ Vĩnh viễn |
| **Preserve config** | ✅ | ✅ | ❌ (nuke) |
| **Re-login safe** | ✅ | ❌ (cần chạy lại) | ✅ |
| **Platform** | bash/zsh | bash/sh | All |

### verify.js - Kiểm tra buddy

```javascript
// verify.js - Kiểm tra buddy từ bất kỳ ID nào

const fs = require("fs");
const path = require("path");

const SALT = "friend-2026-401";
const SPECIES = ["duck","goose","blob","cat","dragon","octopus","owl","penguin","turtle","snail","ghost","axolotl","capybara","cactus","robot","rabbit","mushroom","chonk"];
const RARITIES = ["common","uncommon","rare","epic","legendary"];
const RARITY_WEIGHTS = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 };
const EYES = ["·","✦","×","◉","@","°"];
const HATS = ["none","crown","tophat","propeller","halo","wizard","beanie","tinyduck"];
const STAT_NAMES = ["DEBUGGING","PATIENCE","CHAOS","WISDOM","SNARK"];
const RARITY_FLOOR = { common: 5, uncommon: 15, rare: 25, epic: 35, legendary: 50 };

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

function hashFNV(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

function rollRarity(rng) {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (const r of RARITIES) {
    roll -= RARITY_WEIGHTS[r];
    if (roll < 0) return r;
  }
  return "common";
}

function rollStats(rng, rarity) {
  const floor = RARITY_FLOOR[rarity];
  const peak = pick(rng, STAT_NAMES);
  let dump = pick(rng, STAT_NAMES);
  while (dump === peak) dump = pick(rng, STAT_NAMES);
  const stats = {};
  for (const name of STAT_NAMES) {
    if (name === peak) stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30));
    else if (name === dump) stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15));
    else stats[name] = floor + Math.floor(rng() * 40);
  }
  return stats;
}

function fullRoll(id) {
  const rng = mulberry32(hashFNV(id + SALT));
  const rarity = rollRarity(rng);
  const species = pick(rng, SPECIES);
  const eye = pick(rng, EYES);
  const hat = rarity === "common" ? "none" : pick(rng, HATS);
  const shiny = rng() < 0.01;
  const stats = rollStats(rng, rarity);
  return { rarity, species, eye, hat, shiny, stats };
}

// Auto-read config
let id = process.argv[2];
if (!id || id === "auto") {
  const configPath = path.join(process.env.HOME || "~", ".claude.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const accountUuid = config.oauthAccount?.accountUuid;
  const userID = config.userID;

  console.log("=== ~/.claude.json ===");
  console.log(`  accountUuid: ${accountUuid ?? "(not set)"}`);
  console.log(`  userID:      ${userID ?? "(not set)"}`);
  console.log(`  companion:   ${config.companion ? config.companion.name : "(none)"}`);

  // Nếu cả 2 đều tồn tại → show cả 2 rolls
  if (accountUuid && userID && accountUuid !== userID) {
    console.log("\n=== accountUuid roll ===");
    const r1 = fullRoll(accountUuid);
    console.log(`  ${r1.rarity} ${r1.species} eye:${r1.eye} hat:${r1.hat} shiny:${r1.shiny}`);
    console.log(`  stats: ${STAT_NAMES.map(s => `${s}:${r1.stats[s]}`).join(" ")}`);

    console.log("\n=== userID roll ===");
    const r2 = fullRoll(userID);
    console.log(`  ${r2.rarity} ${r2.species} eye:${r2.eye} hat:${r2.hat} shiny:${r2.shiny}`);
    console.log(`  stats: ${STAT_NAMES.map(s => `${s}:${r2.stats[s]}`).join(" ")}`);
  } else {
    const result = fullRoll(accountUuid ?? userID ?? "anon");
    console.log("\n=== Active roll ===");
    console.log(`  ${result.rarity} ${result.species} eye:${result.eye} hat:${result.hat} shiny:${result.shiny}`);
    console.log(`  stats: ${STAT_NAMES.map(s => `${s}:${result.stats[s]}`).join(" ")}`);
  }
} else {
  // Check bất kỳ ID nào
  const result = fullRoll(id);
  console.log(`ID:     ${id}`);
  console.log(`Result: ${result.rarity} ${result.species}`);
  console.log(`Eye:    ${result.eye}`);
  console.log(`Hat:    ${result.hat}`);
  console.log(`Shiny:  ${result.shiny}`);
  console.log(`Stats:  ${STAT_NAMES.map(s => `${s}:${result.stats[s]}`).join(" ")}`);
}
```

```bash
node verify.js auto                    # Check config hiện tại
node verify.js da55a6e2...            # Check bất kỳ ID nào
```

### shiny_hunt.js - Deep cosmetic search

```javascript
// shiny_hunt.js - Tìm buddy với eye + hat + shiny + stats cụ thể

const crypto = require("crypto");

const SALT = "friend-2026-401";
const SPECIES = ["duck","goose","blob","cat","dragon","octopus","owl","penguin","turtle","snail","ghost","axolotl","capybara","cactus","robot","rabbit","mushroom","chonk"];
const RARITIES = ["common","uncommon","rare","epic","legendary"];
const RARITY_WEIGHTS = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 };
const EYES = ["·","✦","×","◉","@","°"];
const HATS = ["none","crown","tophat","propeller","halo","wizard","beanie","tinyduck"];
const STAT_NAMES = ["DEBUGGING","PATIENCE","CHAOS","WISDOM","SNARK"];
const RARITY_FLOOR = { common: 5, uncommon: 15, rare: 25, epic: 35, legendary: 50 };

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

function hashFNV(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

function rollRarity(rng) {
  let roll = rng() * 100;
  for (const x of RARITIES) { roll -= RARITY_WEIGHTS[x]; if (roll < 0) return x; }
  return "common";
}

function rollStats(rng, rarity) {
  const floor = RARITY_FLOOR[rarity];
  const peak = pick(rng, STAT_NAMES);
  let dump = pick(rng, STAT_NAMES);
  while (dump === peak) dump = pick(rng, STAT_NAMES);
  const stats = {};
  for (const name of STAT_NAMES) {
    if (name === peak) stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30));
    else if (name === dump) stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15));
    else stats[name] = floor + Math.floor(rng() * 40);
  }
  return stats;
}

const target = process.argv[2] || "cat";
const max = parseInt(process.argv[3]) || 5000000;

console.log(`Hunting legendary ${target} (${max.toLocaleString()} attempts)...\n`);

const results = [];

for (let i = 0; i < max; i++) {
  const uid = crypto.randomBytes(32).toString("hex");
  const rng = mulberry32(hashFNV(uid + SALT));
  const rarity = rollRarity(rng);
  if (rarity !== "legendary") continue;
  const species = pick(rng, SPECIES);
  if (species !== target) continue;
  const eye = pick(rng, EYES);
  const hat = pick(rng, HATS);
  const shiny = rng() < 0.01;
  const stats = rollStats(rng, rarity);

  results.push({ eye, hat, shiny, stats, uid });
  const tag = shiny ? " ✨ SHINY!" : "";
  console.log(`  found: eye=${eye} hat=${hat}${tag} -> ${uid}`);
}

// Summary
console.log(`\n=== Summary: ${results.length} legendary ${target}s ===`);

const byEye = {};
for (const r of results) byEye[r.eye] = (byEye[r.eye] || 0) + 1;
console.log("Eyes:");
for (const [e, c] of Object.entries(byEye)) console.log(`  ${e}  x${c}`);

const byHat = {};
for (const r of results) byHat[r.hat] = (byHat[r.hat] || 0) + 1;
console.log("\nHats:");
for (const [h, c] of Object.entries(byHat)) console.log(`  ${h}  x${c}`);

const shinyCount = results.filter(r => r.shiny).length;
console.log(`\nShiny: ${shinyCount}/${results.length}`);

if (shinyCount > 0) {
  console.log("\n=== SHINY RESULTS ===");
  for (const r of results.filter(r => r.shiny)) {
    const s = STAT_NAMES.map(n => `${n}:${r.stats[n]}`).join(" ");
    console.log(`  eye=${r.eye} hat=${r.hat} [${s}] -> ${r.uid}`);
  }
}
```

```bash
node shiny_hunt.js cat 20000000   # Tìm 20M attempts cho cat
node shiny_hunt.js dragon 20000000
```

---

## So sánh 2 hướng tiếp cận

| Tiêu chí | Binary Patching | Xóa accountUuid |
|---------|----------------|-----------------|
| **Mục tiêu sửa** | SALT trong binary | Field `accountUuid` trong config |
| **Cái gì thay đổi** | Hardcoded binary string | JSON field |
| **Độ khó** | Cao (sửa binary) | Thấp (xóa JSON) |
| **Rủi ro ToS** | 🔴 Cao | 🟢 Thấp |
| **Claude update** | Mỗi update ghi đè patch | Không bị ảnh hưởng |
| **Re-login** | Salt không bị ghi đè | Cần alias/fix.sh |
| **Platform** | All (sửa binary path) | Linux/macOS/WSL/Git Bash (alias) |
| **Restore** | Copy backup binary | Xóa alias hoặc chạy fix.sh |
| **Thời gian brute-force** | Salt 15 chars → triệu combinations | userID 64 hex chars → vô hạn |

## Khuyến nghị

1. **Người dùng Free / API Key** → Dùng `buddy-reroll-web.html` (index.html), không cần OAuth approach
2. **Người dùng Team/Pro (Linux/macOS/WSL)** → Dùng **xóa accountUuid + shell alias** ⭐
3. **Người dùng Team/Pro (Windows, không WSL)** → Dùng binary patching hoặc chạy `fix.sh` thủ công sau mỗi re-login
4. **Muốn deep cosmetic search** → Dùng `shiny_hunt.js`
5. **Verify trước khi apply** → Dùng `verify.js auto`

---

## Lưu ý quan trọng

- Buddy system được gated bởi `feature('BUDDY')` — Anthropic có thể disable bất cứ lúc nào
- Teaser notification chỉ hiện 1-7 April 2026
- Bones (rarity, species, eye, hat, shiny, stats) **KHÔNG** được lưu trong config — luôn regenerate từ hash
- Chỉ `name`, `personality`, `hatchedAt` được lưu trong `companion` field
- `personality` field **editable**, không cần restart (đọc live), giới hạn 200 chars

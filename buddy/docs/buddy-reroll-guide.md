# Buddy Reroll Guide

Hướng dẫn cách reset và customize pet Buddy trong Claude Code.

## Tổng quan

Claude Code có tính năng `/buddy` cho phép người dùng nuôi một pet ảo. Pet được sinh ra từ `hash(userID + SALT)`, nên cùng userID sẽ cho ra cùng pet.

**Vấn đề:** Không có nút reset chính thức, người dùng phải tự sửa config để reroll.

---

## Hệ thống Buddy

### Bones (Skeleton)

Tất cả thuộc tính visible được sinh từ hash, không lưu trữ:

- **Species** - 18 loại
- **Rarity** - 5 cấp độ
- **Eye** - 6 kiểu mắt
- **Hat** - 8 kiểu mũ
- **Shiny** - 1% probability
- **Stats** - 5 thuộc tính

### Soul

- **Name** - do AI sinh ra
- **Personality** - do AI sinh ra
- Lưu trong `~/.claude.json` field `companion`

---

## Thuộc tính chi tiết

### Species (18 loại)

| Species | Emoji |
|---------|-------|
| duck | :duck: |
| goose | :goose: |
| blob | :bubbles: |
| cat | :cat_face: |
| dragon | :dragon: |
| octopus | :octopus: |
| owl | :owl: |
| penguin | :penguin: |
| turtle | :turtle: |
| snail | :snail: |
| ghost | :ghost: |
| axolotl | :lizard: |
| capybara | :beaver: |
| cactus | :cactus: |
| robot | :robot: |
| rabbit | :rabbit_face: |
| mushroom | :mushroom: |
| chonk | :cat: |

### Rarity (5 cấp)

| Rarity | Weight | Probability |
|--------|--------|-------------|
| common | 60 | 60% |
| uncommon | 25 | 25% |
| rare | 10 | 10% |
| epic | 4 | 4% |
| legendary | 1 | 1% |

### Eye (6 kiểu)

`· ✦ × ◉ @ °`

### Hat (8 kiểu)

`none, crown, tophat, propeller, halo, wizard, beanie, tinyduck`

**Lưu ý:** Chỉ non-common mới có hat (trừ none)

### Stats (5 thuộc tính)

`DEBUGGING, PATIENCE, CHAOS, WISDOM, SNARK`

Base floor theo rarity:
- common: 5
- uncommon: 15
- rare: 25
- epic: 35
- legendary: 50

### Shiny

1% probability cho tất cả rarity

---

## Công thức hash

```typescript
const SALT = 'friend-2026-401'

function hashString(s: string): number {
  if (typeof Bun !== 'undefined') {
    return Number(BigInt(Bun.hash(s)) & 0xffffffffn)
  }
  // FNV-1a fallback for Node.js
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
```

**Quan trọng:** Claude Code binary dùng Bun nên phải dùng `Bun.hash()`, không phải FNV-1a!

### PRNG

```javascript
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
```

---

## Cách reset Buddy

### Bước 1: Xóa config cũ

Sửa file `~/.claude.json`, xóa 2 field:
```json
// Xóa
"userID": "ab54093b...",
"companion": {
  "name": "...",
  "personality": "...",
  "hatchedAt": 1775006380441
}
```

### Bước 2: Restart Claude Code

Sẽ tự tạo userID mới → pet mới random

---

## Tool: buddy-reroll.js

Script brute force để tìm userID sinh ra pet theo yêu cầu.

### Sử dụng

```bash
bun buddy-reroll.js
```

Script sẽ tìm pet:
- Species: cat
- Rarity: legendary
- Eye: ✦
- Hat: crown
- Shiny: true

### Custom options

Sửa file `buddy-reroll.js`, thay đổi biến `TARGET`:

```javascript
const TARGET = {
  species: 'cat',      // hoặc 'duck', 'dragon', etc.
  rarity: 'legendary', // common/uncommon/rare/epic/legendary
  eye: '✦',           // · ✦ × ◉ @ °
  hat: 'crown',       // none, crown, tophat, propeller, halo, wizard, beanie, tinyduck
  shiny: true         // true/false
}
```

### Output

Khi tìm thấy, script sẽ in:
- Species, Rarity, Eye, Hat, Shiny
- Stats của pet
- UID tìm được

UID được lưu vào `found-uid.txt`

### Áp dụng UID tìm được

1. Mở `~/.claude.json`
2. Xóa field `companion` (nếu có)
3. Thay `userID` bằng UID mới:
```json
"userID": "13fcf96ae34dd01d1a850859b16683a9d893f287d1da32f1de622399bfa37800"
```
4. Restart Claude Code
5. Gõ `/buddy` để nhận pet mới

---

## Kết quả đã test

### Test 2026-04-01

**Target:** cat + legendary + eye ✦ + hat crown + shiny

**Kết quả:**
```
Species : cat
Rarity  : legendary ★★★★★
Eye     : ✦
Hat     : crown
Shiny   : true
Stats   :
  DEBUGGING  78
  PATIENCE   46
  CHAOS      74
  WISDOM     100
  SNARK      62
UID     : 13fcf96ae34dd01d1a850859b16683a9d893f287d1da32f1de622399bfa37800
Iterations: 10,690,885
Time: 31.7s
```

---

## Files

- `buddy-reroll.js` - Script reroll chính
- `found-uid.txt` - UID đã tìm thấy
- `docs/buddy-reroll-guide.md` - Document này

---

## Lưu ý

- Dùng **Bun** không phải Node.js (kết quả sẽ khác!)
- Xác suất cực thấp với nhiều điều kiện (1/8.8 triệu cho full combo)
- Có thể giảm điều kiện để tìm nhanh hơn
- SALT và algorithm có thể thay đổi theo phiên bản Claude Code
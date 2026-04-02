# Buddy Reroll Guide

Hướng dẫn cách customize Buddy pet trong Claude Code.

## Tổng quan

Claude Code có tính năng `/buddy` — pet ảo bên cạnh input box. Pet được sinh từ `hash(userID + SALT)`, nên cùng userID sẽ cho ra cùng pet.

**Vấn đề:** Không có nút reset chính thức. Dùng tool bên dưới để tìm UID sinh ra pet mong muốn.

---

## Tool có sẵn

| Tool | Mô tả |
|------|-------|
| [index.html](index.html) | **Web UI** — Chạy trực tiếp trên trình duyệt, giao diện đẹp |
| [buddy-reroll.js](buddy-reroll.js) | **CLI** — Script Bun/Node cho batch processing |

### Ưu tiên sử dụng (khuyến nghị)

**OAuth Account users:** Dùng mode `delete-uuid` — xóa `accountUuid` để fallback sang `userID` trong `~/.claude.json`. An toàn, không cần binary patching.

**API Key users:** Dùng mode `API Key` — tự do đặt `userID` trong `~/.claude.json`.

### Dùng Web UI (khuyến nghị)

Mở file `buddy-reroll-web.html` trên trình duyệt, chọn thuộc tính mong muốn và bấm tìm kiếm.

### Dùng CLI

```bash
bun buddy-reroll.js
```

---

## Hệ thống Buddy

### Bones (từ hash)

- **Species** — 18 loài: duck, goose, blob, cat, dragon, octopus, owl, penguin, turtle, snail, ghost, axolotl, capybara, cactus, robot, rabbit, mushroom, chonk
- **Rarity** — 5 cấp: common (60%), uncommon (25%), rare (10%), epic (4%), legendary (1%)
- **Eye** — 6 kiểu: `· ✦ × ◉ @ °`
- **Hat** — 8 kiểu: none, crown, tophat, propeller, halo, wizard, beanie, tinyduck
- **Shiny** — 1% probability
- **Stats** — 5 thuộc tính: DEBUGGING, PATIENCE, CHAOS, WISDOM, SNARK

### Soul (từ AI)

- **Name** — do AI sinh ra khi gọi `/buddy`
- **Personality** — do AI sinh ra
- Lưu trong `~/.claude.json` field `companion`

**Quan trọng:** Khi đã có `companion` trong config, Claude Code sẽ dùng pet đó thay vì tính từ hash.

---

## Thuật toán

### Hash Function

| Algorithm | Mô tả | Dùng khi |
|-----------|-------|----------|
| **FNV-1a** | Pure JavaScript, cross-platform | Claude Code 2.1.68+ (khuyến nghị) |
| **Bun.hash** | Native Bun runtime | Legacy / một số install method |

```javascript
const SALT = 'friend-2026-401'

// FNV-1a (recommended)
function hashFNV(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Bun.hash (legacy)
function hashBun(s) {
  return Number(BigInt(Bun.hash(s)) & 0xffffffffn)
}
```

### PRNG (Mulberry32)

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

## Cách áp dụng UID

### API Key mode
1. Mở `~/.claude.json` (Windows: `C:\Users\[Tên]\.claude.json`)
2. **Xóa** field `companion` (nếu có) — đây là pet cũ đang được lưu
3. **Thay** `userID` bằng UID mới tìm được
4. Restart Claude Code
5. Gõ `/buddy` để nhận Buddy mới!

### OAuth Account mode (delete-uuid)
1. Tìm UID mong muốn trong tool
2. Áp dụng bằng nút `✅ Apply` → tải script `apply-buddy.bat`
3. Hoặc dùng Shell Alias để xóa `accountUuid` trước mỗi lần khởi động Claude

---

## Files

```
buddy/
├── index.html              # Web UI chính (khuyến nghị)
├── buddy-reroll.js         # CLI script
├── found-uid.txt          # UID đã tìm thấy
└── docs/
    ├── buddy-reroll-guide.md
    ├── spec.md             # Technical specification
    ├── claude-buddy-reroll-analysis.md
    └── oauth-buddy-reroll-comparison.md
```

---

## Lưu ý

- Xác suất cực thấp với nhiều điều kiện (1/8.8 triệu cho full combo)
- Giảm điều kiện để tìm nhanh hơn (ví dụ: chỉ chọn species + rarity)
- **Phải xóa `companion`** trong config thì pet mới mới hiện
- SALT và algorithm có thể thay đổi theo phiên bản Claude Code mới

## Nguồn tham khảo

- [linux.do - Buddy Reroll Discussion](https://linux.do/t/topic/1871870)
- [GitHub - ithiria894/claude-code-buddy-reroll](https://github.com/ithiria894/claude-code-buddy-reroll)
- [GitHub - RoggeOhta/claude-buddy-reroll](https://github.com/RoggeOhta/claude-buddy-reroll)
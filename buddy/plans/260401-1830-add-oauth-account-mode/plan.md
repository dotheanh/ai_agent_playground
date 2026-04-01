# OAuth Account Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add OAuth Account mode to buddy-reroll-web.html for Claude account users with hash algorithm options (FNV-1a for browser, Bun.hash for standalone script)

**Architecture:** Split the application into two modes (API Key and OAuth Account) with different search algorithms, risk warnings, and instructions. OAuth mode includes hash algorithm selector and standalone Bun.hash script.

**Tech Stack:** HTML5, CSS3, JavaScript (ES6+), FNV-1a hash algorithm, Bun.hash (via standalone script)

---

## File Structure

**Files to Modify:**
- `buddy-reroll-web.html` - Main application (add mode selector, risk modal, hash selector, OAuth logic)

**Files to Create:**
- `bun-hash-search.ts` - Standalone Bun script for exact hash matching
- `plans/260401-1830-add-oauth-account-mode/plan.md` - This plan document

---

## Task Overview

1. **Task 1:** Add mode selector UI (API Key / OAuth Account) with tooltips
2. **Task 2:** Create risk modal for OAuth Account selection
3. **Task 3:** Add hash algorithm selector (FNV-1a / Bun.hash) for OAuth mode
4. **Task 4:** Implement OAuth brute-force search logic in browser
5. **Task 5:** Create Bun.hash standalone script
6. **Task 6:** Update instructions and warnings for both modes

---

## ⚠️ Risk Modal (OAuth Account)

Khi chọn OAuth Account → show modal ngay:

```
┌─────────────────────────────────────────┐
│  ⚠️ Rủi ro pháp lý                      │
├─────────────────────────────────────────┤
│  Play at your own risk!                 │
│                                         │
│  Các rủi ro:                            │
│  • Binary patching có thể vi phạm ToS   │
│  • Account có thể bị suspend/ban        │
│  • Buddy info được gửi về Anthropic    │
│  • Có thể bị phát hiện qua API         │
│                                         │
│  [ I understand - Continue ]            │
└─────────────────────────────────────────┘
```

---

## 🔧 Logic thay đổi theo mode

### State mới

```javascript
const state = {
  modeType: 'api-key',  // 'api-key' hoặc 'oauth-account'
  species: null,
  rarity: 'legendary',
  eye: null,
  hat: null,
  shiny: 'any',
  algo: 'fnv',
  mode: 'random'
};
```

### Thuật toán

| Mode | Hash | Input | Salt |
|------|------|-------|------|
| **API Key** | FNV-1a | userId tự gen + SALT | `friend-2026-401` (cố định) |
| **OAuth Account** | FNV-1a | accountUUID + salt thử | Brute-force: `friend-2026-001` → `friend-2026-999` + random 15-char |

### Brute-force pattern (OAuth)

1. **Phase 1:** `friend-2026-XXX` (000 → 999)
2. **Phase 2:** Random 15-char string (a-z, 0-9, -, _)

**Limit:** 50,000,000 iterations (như hiện tại)

---

## 📝 Instructions thay đổi

### API Key (giữ nguyên + bổ sung)

```
📋 Hướng dẫn sử dụng sau khi tìm thấy UID

1. Mở file ~/.claude.json (hoặc C:\Users\[Tên]\.claude.json)
2. Xóa field companion (nếu có)
3. Thay thế userID bằng UID mới tìm được
4. Restart Claude Code
5. Gõ lệnh /buddy để nhận Buddy mới!

💡 Lưu ý: Thao tác này an toàn, không vi phạm Terms of Service
```

### OAuth Account (mới)

```
📋 Hướng dẫn sử dụng sau khi tìm thấy SALT

1. Backup binary: Script tự động tạo backup tại ~/.local/bin/claude.bak
2. Patch binary với salt tìm được (dùng claude-buddy-reroll):
   bun buddy-reroll.ts --restore  # Khôi phục nếu cần
3. Xóa companion state:
   Xóa field "companion" trong ~/.claude/.config.json
4. Restart Claude Code
5. Gõ lệnh /buddy để nhận Buddy mới!

⚠️ CẢNH BÁO RỦI RO:
   • Binary modification có thể vi phạm ToS
   • Account có thể bị terminate
   • Buddy info được gửi về server Anthropic
   • Play at your own risk!
```

---

## 🎨 UI/UX Changes

### CSS mới

```css
/* Mode Selector */
.mode-selector {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  justify-content: center;
}

.mode-btn {
  padding: 0.8rem 1.2rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.mode-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.mode-btn.selected {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
  box-shadow: 0 0 15px var(--accent-glow);
}

/* Risk Banner (OAuth) */
.risk-banner {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  color: #92400e;
  font-size: 0.85rem;
}
```

---

## 📋 Implementation Checklist

- [ ] **1. HTML Structure** (10 min)
  - [ ] Thêm mode selector container ở header
  - [ ] Thêm risk modal
  - [ ] Thêm risk banner container

- [ ] **2. CSS Styling** (10 min)
  - [ ] Mode selector styles
  - [ ] Tooltips/hover effects
  - [ ] Risk modal styles
  - [ ] Risk banner styles

- [ ] **3. JavaScript Logic** (25 min)
  - [ ] Add `state.modeType`
  - [ ] Mode switch handler
  - [ ] Risk modal handler
  - [ ] FNV-1a hash for OAuth (same as API but different input)
  - [ ] OAuth search logic (brute-force salt)
  - [ ] Update `runSearch()` to handle both modes

- [ ] **4. Instructions Update** (10 min)
  - [ ] Update API Key instructions
  - [ ] Add OAuth Account instructions
  - [ ] Add risk warnings

- [ ] **5. Testing** (15 min)
  - [ ] Test mode switching
  - [ ] Test risk modal
  - [ ] Test API Key search
  - [ ] Test OAuth search
  - [ ] Test instructions display

**Total: ~70 minutes**

---

## 📁 Files Changed

**DUY NHẤT:** `buddy-reroll-web.html`

---

## ⚡ Next Step

Sau khi anh approve plan này, em sẽ:
1. Invoke `writing-plans` skill để tạo implementation plan chi tiết
2. Bắt đầu implement

---

## ❓ Questions

- [ ] Tên mode: `🔑 API Key` / `👤 OAuth Account` - OK?
- [ ] Tooltips text - OK?
- [ ] Risk modal content - OK?
- [ ] Limit 50M iterations - OK?
- [ ] Hash function FNV-1a cho OAuth - OK?

---

**Spec written and committed. Please review it and let me know if you want to make any changes before we start writing out the implementation plan.**

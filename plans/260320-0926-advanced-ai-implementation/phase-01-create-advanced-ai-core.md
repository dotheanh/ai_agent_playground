# Phase 01: Create Advanced AI Core

**Context Links**
- [game-engine.js](../../card_game/president/game-engine.js) — KHÔNG SỬA, chỉ đọc để hiểu combo detection
- [helpers.js](../../card_game/president/helpers.js) — KHÔNG SỬA, utilities có sẵn
- [ai-player.js](../../card_game/president/ai-player.js) — thay thế hoàn toàn

---

## Overview
- **Priority**: HIGH — nền tảng cho tất cả phase sau
- **Status**: Chưa bắt đầu
- **Mô tả**: Tạo `advanced-ai.js` với basic combo logic (port từ ai-player.js) + Easy mode. Không thay đổi behavior so với bot cũ, chỉ đặt nền móng cho các phase sau.

---

## Key Insights
- `game-engine.js` exports: `SUITS`, `RANKS`, `RANK_VALUES`, `SUIT_VALUES`, `COMBO`, `cardValue()`, `detectCombo()`, `canBeat()`
- `helpers.js` exports: `groupByRank()`, `findStraights()`, `sortHand()`, `detectComboGroups()`
- Bot cũ rất ngu: chỉ đánh lá bài nhỏ nhất hoặc weakest valid combo
- Entry point phải là `window.AI.selectCards(hand, lastCombo, isNewRound)` để backward compatible

---

## Architecture

### advanced-ai.js structure
```js
// ===== ADVANCED AI - Self-contained module =====
// Reads game state directly (no coupling with game-controller.js)
// Dependencies: game-engine.js, helpers.js

(function() {
  const AI = {
    difficulty: 'medium', // 'easy' | 'medium' | 'hard'
    selectCards: advancedAiSelectCards
  };
  window.AI = AI;
})();
```

### Key functions
| Function | Description |
|----------|-------------|
| `advancedAiSelectCards(hand, lastCombo, isNewRound)` | Entry point chính |
| `findBeatingCombos(hand, lastCombo)` | Tìm tất cả combo có thể chặn |
| `selectWeakestValidCombo(hand, lastCombo)` | Chọn combo weakest (Easy logic) |
| `selectBestStartingHand(hand)` | Chọn lá bài tốt nhất để mở vòng |

---

## Related Code Files
- **Tạo**: `card_game/president/advanced-ai.js`
- **Phụ thuộc**: `game-engine.js`, `helpers.js` (read-only)

---

## Implementation Steps

1. **Tạo file `advanced-ai.js`** với IIFE wrapper
2. **Import dependencies** từ global scope (`COMBO`, `cardValue`, `detectCombo`, `canBeat`, `groupByRank`, `findStraights`, `sortHand`)
3. **Implement `advancedAiSelectCards`**:
   - Nếu `isNewRound` → gọi `selectBestStartingHand`
   - Nếu `!lastCombo` → gọi `selectBestStartingHand`
   - Ngược lại → gọi `selectWeakestValidCombo`
4. **Implement `selectBestStartingHand`**:
   - Sort hand
   - Return `[sorted[0]]` (đánh lá nhỏ nhất)
5. **Implement `findBeatingCombos`** — port exact từ `ai-player.js`:
   - Single: loop tìm lá > lastCombo.high
   - Pair: groupByRank, check cards.length >= 2
   - Triple: groupByRank, check cards.length >= 3
   - Straight: gọi `findStraights(hand, len)`
   - Four: groupByRank, check cards.length >= 4
   - Tứ quý chặt đôi 2
6. **Implement `selectWeakestValidCombo`**:
   - Gọi `findBeatingCombos`
   - Sort theo `high` tăng dần
   - Return `candidates[0].cards`

---

## Todo List
- [ ] Tạo advanced-ai.js với IIFE wrapper
- [ ] Implement advancedAiSelectCards entry point
- [ ] Port findBeatingCombos từ ai-player.js
- [ ] Implement selectBestStartingHand
- [ ] Implement selectWeakestValidCombo (Easy logic)
- [ ] Export `window.AI = { selectCards, difficulty }`

---

## Success Criteria
- Behavior giống hệt ai-player.js cũ (đánh lá nhỏ nhất hoặc weakest valid)
- Console không có lỗi khi load
- Tất cả combo types được handle đúng
- Phase 2+ có thể extend mà không cần sửa logic cơ bản

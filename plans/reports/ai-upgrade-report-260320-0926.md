# AI Upgrade Report - Tiến Lên Advanced Bot

**Date:** 20/03/2026
**Project:** card_game/president
**Status:** ✅ Completed

---

## Summary

Nâng cấp bot AI từ logic đơn giản "đánh yếu nhất" → **3 mức độ thông minh** (Easy/Medium/Hard), tách riêng khỏi game-core.

---

## Changes Made

### 1. New File: `advanced-ai.js` (~380 lines)

Self-contained AI module với:

| Function | Description |
|----------|-------------|
| `classifyHand()` | Phân loại bài: isolated, pairs, triples, fours, straights |
| `scoreCombo()` | Chấm điểm combo (thấp = nên đánh trước) |
| `shouldPass()` | Quyết định có nên bỏ lượt không |
| `selectSmartCombo()` | Chọn combo tối ưu dựa trên scoring |
| `buildAIContext()` | Track game state (played cards, hand sizes, danger) |
| `updateContext()` | Cập nhật context từ game-controller |
| `setDifficulty()` / `getDifficulty()` | API cho difficulty selector |

### 2. Modified: `game-engine.js`

Export thêm lên window:
- `COMBO`, `cardValue`, `detectCombo`, `canBeat`
- `createDeck`, `shuffle`

### 3. Modified: `helpers.js`

Export thêm lên window:
- `groupByRank`, `findStraights`, `sortHand`, `detectComboGroups`

### 4. Modified: `game-controller.js`

- `aiPlay()`: gọi `window.AI.selectCards()` thay vì `aiSelectCards()`
- Thêm `updateAIContext()` để track played cards + hand sizes
- `startGame()`: reset AI context khi bắt đầu ván mới
- Thêm `setDifficulty()` và `updateDifficultyUI()` helpers

### 5. Modified: `index.html`

- Thay `ai-player.js` → `advanced-ai.js`
- Thêm CSS cho difficulty selector (3 nút: Easy/Medium/Hard)
- Thêm difficulty selector vào menu overlay

---

## AI Difficulty Levels

### Easy (Bot cũ)
- Đánh lá bài yếu nhất khi bắt đầu vòng
- Chặn bằng combo yếu nhất có thể
- Không có chiến thuật

### Medium (Default) ⭐
- **Hand classification**: Ưu tiên đánh isolated cards trước
- **Combo scoring**: Tránh tiêu tốn bài mạnh (2, tứ quý)
- **Smart selection**: Chọn combo có score thấp nhất

### Hard
- Tất cả Medium features
- **Card counting**: Track bài đã đánh
- **Danger assessment**: Đối thủ ≤ 3 bài → phải chặn bằng được
- **Resource management**: Biết khi nào nên tiết kiệm bài mạnh

---

## Algorithm Details

### Combo Scoring Formula
```
score = baseValue(high)
      + 200 nếu dùng 2
      + 300 nếu dùng tứ quý
      - 50 × số isolated cards được xóa
      - (10 - len) × 30 nếu là sảnh ngắn
      - 100 nếu đối thủ nguy hiểm (Hard mode)
```

### Should Pass Logic
```
PASS nếu:
  - Đối thủ ≥ 8 bài (không nguy hiểm)
  - Combo yếu nhất có score > 150
  - Không phải chế độ danger

KHÔNG PASS nếu:
  - Đối thủ ≤ 3 bài (MUST block)
  - Đối thủ ≤ 5 bài (Medium danger)
```

---

## Files Summary

| File | Action | Lines |
|------|--------|-------|
| `advanced-ai.js` | Created | ~380 |
| `game-engine.js` | Modified | +9 exports |
| `helpers.js` | Modified | +4 exports |
| `game-controller.js` | Modified | +40 |
| `index.html` | Modified | +35 CSS + HTML |
| `ai-player.js` | Kept (backup) | 0 |

---

## Test Results

```
✓ COMBO.SINGLE, COMBO.PAIR exports work
✓ AI.selectCards() function exists
✓ Difficulty switching works
✓ New round plays lowest card
✓ Medium mode prioritizes isolated cards
✓ Beat detection works correctly
✓ Card value calculations correct
✓ AI context updates properly
```

---

## Unresolved Questions

1. **Bot có thể bị "quá thông minh"**: Hard mode có thể quá khó cho người chơi casual → Cần balance constants sau
2. **UI feedback**: Chưa hiển thị độ khó hiện tại trong game (chỉ trong menu)
3. **Testing thực tế**: Cần test trên trình duyệt với người chơi thật

---

## Next Steps (Optional)

1. Tune scoring constants (Phase 5 trong plan)
2. Thêm visual feedback khi bot "suy nghĩ"
3. Performance test với nhiều ván liên tục
4. Balance test: so sánh win rate giữa các difficulty levels

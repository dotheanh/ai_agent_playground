# Phase 04: Integrate with Game Controller

**Context Links**
- [phase-03-add-difficulty-levels.md](./phase-03-add-difficulty-levels.md)
- [game-controller.js](../../card_game/president/game-controller.js) — file cần sửa
- [index.html](../../card_game/president/index.html) — cần thêm script tag

---

## Overview
- **Priority**: HIGH
- **Status**: Chưa bắt đầu
- **Mô tả**: Thay thế `aiSelectCards()` bằng `window.AI.selectCards()` trong `game-controller.js`. Wire `GameContext` để Hard mode nhận đúng state. Thêm difficulty selector vào UI.

---

## Key Insights
- `game-controller.js` hiện gọi `aiSelectCards(hand, state.lastCombo, state.newRound)` tại line 470
- Cần thêm `<script src="advanced-ai.js">` vào `index.html` **sau** `game-engine.js` và `helpers.js`, **trước** `game-controller.js`
- `GameContext.onCardsPlayed` cần được gọi trong `aiPlay()` và `onPlay()` của game-controller.js
- Difficulty selector: dropdown đơn giản trong UI, set `window.AI.difficulty`

---

## Architecture

### Script load order trong index.html
```html
<script src="game-engine.js"></script>
<script src="helpers.js"></script>
<script src="advanced-ai.js"></script>   <!-- THÊM MỚI -->
<script src="ui-renderer.js"></script>
<script src="game-controller.js"></script>
```

### Changes trong game-controller.js

**1. Thay aiSelectCards → window.AI.selectCards**
```js
// Cũ (line ~470):
const selected = aiSelectCards(hand, state.lastCombo, state.newRound);

// Mới:
const selected = window.AI.selectCards(hand, state.lastCombo, state.newRound);
```

**2. Wire GameContext trong aiPlay()**
```js
function aiPlay() {
  // ... existing code ...
  const selected = window.AI.selectCards(hand, state.lastCombo, state.newRound);

  if (selected) {
    // Notify GameContext sau khi AI đánh
    if (window.AI.context) {
      window.AI.context.onCardsPlayed(aiIdx, selected);
    }
  }
}
```

**3. Wire GameContext trong onPlay() (player đánh)**
```js
function onPlay() {
  // ... existing validation ...
  // Notify GameContext sau khi player đánh
  if (window.AI.context) {
    window.AI.context.onCardsPlayed(0, selected);
  }
}
```

**4. Reset GameContext khi ván mới**
```js
function startGame() {
  // ... existing code ...
  if (window.AI.context) window.AI.context.reset();
}
```

### Difficulty Selector UI
- Thêm dropdown vào menu overlay trong `init()` hoặc trong game header
- `<select onchange="window.AI.difficulty = this.value">`
- Options: Easy / Medium / Hard, default = Medium

---

## Related Code Files
- **Modify**: `card_game/president/game-controller.js`
- **Modify**: `card_game/president/index.html` (thêm script tag + difficulty selector)
- **Phụ thuộc**: `advanced-ai.js` từ Phase 01-03

---

## Implementation Steps

1. **Cập nhật `index.html`**:
   - Thêm `<script src="advanced-ai.js">` đúng thứ tự
   - Thêm difficulty selector vào menu overlay (trước nút "Chơi Ngay")

2. **Cập nhật `game-controller.js` — thay aiSelectCards**:
   - Tìm dòng `aiSelectCards(hand, state.lastCombo, state.newRound)`
   - Thay bằng `window.AI.selectCards(hand, state.lastCombo, state.newRound)`

3. **Wire GameContext trong `aiPlay()`**:
   - Sau khi `selected` được xác định và hợp lệ
   - Gọi `window.AI.context?.onCardsPlayed(aiIdx, selected)`

4. **Wire GameContext trong `onPlay()`**:
   - Sau khi bài được remove khỏi hand
   - Gọi `window.AI.context?.onCardsPlayed(0, selected)`

5. **Reset GameContext trong `startGame()`**:
   - Gọi `window.AI.context?.reset()` trước khi deal bài

6. **Export `GameContext` từ advanced-ai.js**:
   - `window.AI.context = GameContext`

---

## Todo List
- [ ] Thêm script tag advanced-ai.js vào index.html
- [ ] Thêm difficulty selector UI vào menu
- [ ] Thay aiSelectCards → window.AI.selectCards trong game-controller.js
- [ ] Wire GameContext.onCardsPlayed trong aiPlay()
- [ ] Wire GameContext.onCardsPlayed trong onPlay()
- [ ] Wire GameContext.reset trong startGame()
- [ ] Export window.AI.context từ advanced-ai.js

---

## Success Criteria
- Game load không có lỗi console
- Difficulty selector hoạt động, thay đổi behavior của bot
- GameContext.handSizes đúng sau mỗi lượt
- ai-player.js có thể xóa hoặc giữ lại (không ảnh hưởng)

---

## Security Considerations
- Không expose game state nhạy cảm qua window.AI
- GameContext chỉ track public info (số bài, bài đã ra)

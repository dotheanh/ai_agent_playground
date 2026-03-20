# Phase 03: Add Difficulty Levels (Hard Mode)

**Context Links**
- [phase-02-add-hand-classification.md](./phase-02-add-hand-classification.md)
- [game-controller.js](../../card_game/president/game-controller.js) — đọc để hiểu state structure

---

## Overview
- **Priority**: MEDIUM
- **Status**: Chưa bắt đầu
- **Mô tả**: Thêm **card counting** + **danger assessment** để hoàn thiện Hard difficulty. Bot Hard biết đối thủ còn bao nhiêu bài và đánh theo tình huống.

---

## Key Insights
- Hard mode cần track game state: `playedCards`, `handSizes`
- `unknownCards = fullDeck - playedCards - currentHand` → ước tính bài đối thủ
- **Danger assessment**: đối thủ ≤ 5 bài → nguy hiểm → chặn mạnh hơn
- **shouldPass logic** cho Hard:
  - Đối thủ ≤ 3 bài → **không bao giờ pass**
  - Đối thủ ≥ 8 bài → pass nếu combo chặn "đắt"
  - Mình đang kiểm soát vòng → ít khi pass

---

## Architecture

### GameContext (state tracker trong advanced-ai.js)
```js
const GameContext = {
  playedCards: [],        // tất cả bài đã ra (flat array)
  handSizes: [13,13,13,13], // số bài mỗi player
  playerIndex: -1,        // index của bot này (1, 2, hoặc 3)

  // Called by game-controller.js khi có bài được đánh
  onCardsPlayed(playerIdx, cards) { ... },
  // Called khi player pass
  onPlayerPass(playerIdx) { ... },
  // Called khi ván mới bắt đầu
  reset() { ... },

  // Computed
  getUnknownCards(myHand) { ... },
  isDangerousOpponent(playerIdx) { ... }, // handSize <= 5
  getMostDangerousOpponent() { ... }
};
```

### Hard Mode Combo Selection
```
1. classifyHand → classification
2. getMostDangerousOpponent → dangerLevel
3. findBeatingCombos → candidates
4. scoreCombo với dangerLevel bonus:
   - Nếu đối thủ nguy hiểm: -20 bonus cho mọi combo (đánh mạnh hơn)
5. shouldPassHard → quyết định pass hay không
6. Return best combo
```

### shouldPassHard(hand, lastCombo, handSizes)
```js
// Không bao giờ pass nếu đối thủ nguy hiểm (≤ 3 bài)
// Pass nếu đối thủ nhiều bài (≥ 8) và combo chặn đắt
// Không pass nếu mình đang lead (isLeading)
```

---

## Related Code Files
- **Modify**: `card_game/president/advanced-ai.js` (add GameContext + Hard logic)

---

## Implementation Steps

1. **Implement `GameContext` object**:
   - `playedCards: []` — flat array tất cả bài đã ra
   - `handSizes: [13,13,13,13]` — cập nhật khi có bài đánh/pass
   - `onCardsPlayed(playerIdx, cards)`: push vào playedCards, giảm handSizes[playerIdx]
   - `reset()`: clear playedCards, reset handSizes về 13
   - `getUnknownCards(myHand)`: tính deck - playedCards - myHand
   - `isDangerousOpponent(idx)`: return handSizes[idx] <= 5
   - `getMostDangerousOpponent(myIdx)`: tìm opponent có handSize nhỏ nhất

2. **Implement `scoreComboHard(combo, classification, dangerLevel)`**:
   - Extend scoreCombo từ Phase 02
   - Thêm `dangerBonus`: nếu `dangerLevel === 'critical'` (≤ 3 bài) → `-25`
   - Thêm `dangerBonus`: nếu `dangerLevel === 'warning'` (≤ 5 bài) → `-15`

3. **Implement `shouldPassHard(hand, lastCombo, myIdx)`**:
   - Lấy `handSizes` từ `GameContext`
   - Nếu bất kỳ opponent nào có handSize ≤ 3 → return false (không bao giờ pass)
   - Nếu tất cả opponent có handSize ≥ 8 → check combo cost
   - Nếu combo chặn dùng 2 hoặc tứ quý → return true (pass)
   - Ngược lại → return false

4. **Implement `selectHardCombo(hand, lastCombo, myIdx)`**:
   - Gọi `classifyHand`, `findBeatingCombos`
   - Lấy `dangerLevel` từ `GameContext.getMostDangerousOpponent`
   - Score mỗi combo với `scoreComboHard`
   - Kiểm tra `shouldPassHard` trước khi return

5. **Update `advancedAiSelectCards`**:
   - Thêm nhánh `difficulty === 'hard'` → gọi `selectHardCombo`

---

## Todo List
- [ ] Implement GameContext object
- [ ] Implement GameContext.onCardsPlayed
- [ ] Implement GameContext.reset
- [ ] Implement GameContext.getMostDangerousOpponent
- [ ] Implement scoreComboHard với danger bonus
- [ ] Implement shouldPassHard
- [ ] Implement selectHardCombo
- [ ] Update advancedAiSelectCards cho Hard difficulty

---

## Success Criteria
- Hard bot không bao giờ pass khi đối thủ ≤ 3 bài
- Hard bot pass khi đối thủ nhiều bài và combo chặn dùng 2
- handSizes được cập nhật đúng sau mỗi lượt đánh
- Không break Easy/Medium behavior

---

## Risk Assessment
- GameContext cần được sync với game-controller.js → xem Phase 04
- handSizes có thể bị lệch nếu game-controller không gọi onCardsPlayed đúng lúc
- Mitigation: Phase 04 sẽ wire GameContext vào aiPlay() trong game-controller.js

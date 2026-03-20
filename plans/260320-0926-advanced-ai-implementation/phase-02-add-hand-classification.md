# Phase 02: Add Hand Classification

**Context Links**
- [phase-01-create-advanced-ai-core.md](./phase-01-create-advanced-ai-core.md)
- [game-engine.js](../../card_game/president/game-engine.js)
- [helpers.js](../../card_game/president/helpers.js)

---

## Overview
- **Priority**: HIGH
- **Status**: Chưa bắt đầu
- **Mô tả**: Thêm `classifyHand()` để phân loại bài trên tay, `scoreCombo()` để tính điểm combo, và upgrade lên **Medium difficulty**.

---

## Key Insights
- **Hand classification** giúp bot hiểu structure của bài: isolated, pairs, triples, straights, twos, fours
- **Isolated cards** (bài không thuộc combo nào) → ưu tiên đánh trước
- **Combo scoring** (score thấp = đánh trước):
  ```
  score = baseValue
        + penalty nếu dùng 2
        + penalty nếu dùng tứ quý
        + penalty nếu phá sảnh
        - bonus nếu xóa bài lẻ
  ```
- Medium difficulty: dùng classification để quyết định đánh gì + shouldPass logic

---

## Architecture

### classifyHand(hand)
```js
// Returns breakdown of hand composition
classifyHand(hand) → {
  isolated: Card[],      // cards not part of any combo
  pairs: Card[][],        // array of pairs
  triples: Card[][],      // array of triples
  straights: Card[][],    // array of straights (len >= 3)
  twos: Card[],           // individual 2s (high value)
  fours: Card[][]         // four-of-a-kind
}
```

### scoreCombo(combo, classification)
```js
// Returns numeric score (lower = play first)
// Penalize: using 2s, breaking straights, using quads
// Bonus: removing isolated cards
```

### shouldPass(hand, lastCombo, classification, isLeading)
```js
// Returns true if AI should pass
// Easy: never pass (always try to beat)
// Medium: smart pass decisions
// Hard: card counting + danger assessment
```

### Best Combo Selection for Medium
```
1. Find all beating combos
2. For each combo → calculate scoreCombo
3. Sort by score (lower = better to play)
4. Return lowest-scored combo
```

---

## Related Code Files
- **Modify**: `card_game/president/advanced-ai.js` (add new functions)
- **Phụ thuộc**: Phase 01 functions

---

## Implementation Steps

1. **Implement `classifyHand(hand)`**:
   - Dùng `groupByRank()` để tìm pairs, triples, fours
   - Dùng `findStraights()` để tìm straights
   - Extract isolated cards = hand - cards trong combos
   - Extract twos = cards có rank '2'

2. **Implement `scoreCombo(combo, classification)`**:
   - Base score = cardValue(highest card in combo)
   - Penalty: `+20` nếu combo dùng 2
   - Penalty: `+15` nếu combo là tứ quý
   - Penalty: `+10` nếu phá sảnh (dùng lá trong straight)
   - Bonus: `-15` nếu combo xóa isolated card
   - Bonus: `-10` nếu combo xóa pair

3. **Implement `selectMediumCombo(hand, lastCombo)`**:
   - `findBeatingCombos` → candidates
   - `classifyHand(hand)` → classification
   - Map mỗi candidate → scoreCombo
   - Sort theo score → return lowest

4. **Implement `shouldPassMedium(hand, lastCombo)`**:
   - Nếu `!lastCombo` → false (đang lead)
   - Nếu mình đang kiểm soát vòng → false (ít khi pass)
   - Nếu combo chặn "đắt" (dùng 2, tứ quý) → true với xác suất cao
   - Ngược lại → false

5. **Update `advancedAiSelectCards`**:
   - Nếu difficulty === 'easy' → dùng Phase 01 logic
   - Nếu difficulty === 'medium' → dùng Medium logic mới
   - Nếu difficulty === 'hard' → chờ Phase 03

---

## Todo List
- [ ] Implement classifyHand(hand)
- [ ] Implement scoreCombo(combo, classification)
- [ ] Implement selectMediumCombo(hand, lastCombo)
- [ ] Implement shouldPassMedium(hand, lastCombo)
- [ ] Update advancedAiSelectCards cho Medium difficulty
- [ ] Test: Medium bot đánh isolated cards trước

---

## Success Criteria
- Medium bot đánh isolated cards trước pairs/straights cùng value
- Medium bot tránh dùng 2 khi không cần thiết
- Medium bot pass khi combo chặn "đắt" mà đối thủ còn nhiều bài
- Không break Easy mode behavior

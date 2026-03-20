# Planner Report — Advanced AI Implementation

**Date**: 260320-0926
**Slug**: advanced-ai-implementation

---

## Summary
Tạo implementation plan chi tiết cho nâng cấp AI bot game bài Tiến Lên từ logic rất ngu → 3 mức độ (Easy/Medium/Hard).

---

## Research Done
- Đọc `game-engine.js`: combo detection (SINGLE/PAIR/TRIPLE/STRAIGHT/FOUR), `cardValue`, `canBeat`, `detectCombo`
- Đọc `helpers.js`: `groupByRank`, `findStraights`, `sortHand`, `detectComboGroups`
- Đọc `ai-player.js` (bot cũ): chỉ đánh lá nhỏ nhất hoặc weakest valid combo
- Đọc `game-controller.js`: game state structure, `aiPlay()` flow, `onPlay()` flow

---

## Design Decisions (from user requirements)
1. `advanced-ai.js` là **self-contained** — tự đọc game state
2. Entry point: `window.AI = { selectCards, difficulty }`
3. Tất cả bot cùng logic, không có personality riêng
4. 3 difficulty levels: Easy (logic cũ) → Medium (classification) → Hard (+ card counting)

---

## Output Plan Structure
```
plans/260320-0926-advanced-ai-implementation/
├── plan.md                              # Overview access point
├── phase-01-create-advanced-ai-core.md
├── phase-02-add-hand-classification.md
├── phase-03-add-difficulty-levels.md
├── phase-04-integrate-with-controller.md
└── phase-05-test-and-balance.md
```

---

## Phase Breakdown

| Phase | Core Deliverable | Key Functions |
|-------|-----------------|--------------|
| 1 | advanced-ai.js skeleton | `findBeatingCombos`, `selectWeakestValidCombo` |
| 2 | Hand classification + scoring | `classifyHand`, `scoreCombo`, `shouldPassMedium` |
| 3 | GameContext + Hard mode | `GameContext`, `scoreComboHard`, `shouldPassHard` |
| 4 | Controller integration | Wire GameContext, difficulty selector UI |
| 5 | Manual test + balance | Test cases, balance constants |

---

## Architecture Highlights

### advanced-ai.js (final structure)
```js
window.AI = {
  difficulty: 'medium', // 'easy' | 'medium' | 'hard'
  selectCards(hand, lastCombo, isNewRound) { ... },
  context: GameContext // for Hard mode
}
```

### GameContext (for Hard mode)
```js
const GameContext = {
  playedCards: [],
  handSizes: [13, 13, 13, 13],
  onCardsPlayed(playerIdx, cards) { ... },
  reset() { ... },
  getMostDangerousOpponent(myIdx) { ... }
}
```

---

## Score Combo Formula
```
score = baseValue
      + 20 if using 2
      + 15 if using quad
      + 10 if breaking straight
      - 15 if clearing isolated card
      - 10 if clearing pair
      - 25 if opponent has ≤3 cards (Hard only)
      - 15 if opponent has ≤5 cards (Hard only)
```

---

## Files to Create/Modify

| File | Action | Phase |
|------|--------|-------|
| `card_game/president/advanced-ai.js` | Create | 1 |
| `card_game/president/game-controller.js` | Modify | 4 |
| `card_game/president/index.html` | Modify | 4 |
| `card_game/president/ai-player.js` | Delete (optional) | 4 |

---

## Risks
1. **GameContext sync**: handSizes có thể lệch nếu game-controller không call đúng lúc → Phase 04 cẩn thận
2. **Balance constants**: penalty/bonus values cần iterative tuning → Phase 05
3. **Backward compatibility**: UI không bị break khi thay ai-player.js → Phase 04 verify

---

## Unresolved Questions
1. **UI difficulty selector placement?** (menu overlay hay game header?) — đã chọn menu overlay trong plan
2. **ai-player.js có xóa không?** — plan để optional
3. **Demo mode** (watch bot đấu nhau)? — future scope, không trong plan này

---

## Next Steps
- User approve plan → bắt đầu Phase 1 (tạo advanced-ai.js core)
- Hoặc user muốn điều chỉnh gì trước khi implement

# Phase 05: Test and Balance

**Context Links**
- [phase-04-integrate-with-controller.md](./phase-04-integrate-with-controller.md)
- [advanced-ai.js](../../card_game/president/advanced-ai.js) — file cần test

---

## Overview
- **Priority**: MEDIUM
- **Status**: Chưa bắt đầu
- **Mô tả**: Test từng difficulty level, balance penalty/bonus values, đảm bảo bot không bị stuck hoặc crash.

---

## Key Insights
- Không có test framework — test thủ công bằng browser console
- Cần test các edge cases: tay bài chỉ có 2s, tứ quý, sảnh dài
- Balance là iterative: chạy nhiều ván, điều chỉnh penalty/bonus constants
- Hard bot không được "quá thông minh" đến mức không thể thắng

---

## Test Cases

### Easy Mode
| Scenario | Expected |
|----------|----------|
| isNewRound = true | Đánh lá nhỏ nhất |
| Có thể chặn | Đánh weakest valid combo |
| Không thể chặn | Return null (pass) |
| Chỉ còn 2s, không thể chặn | Pass |

### Medium Mode
| Scenario | Expected |
|----------|----------|
| Có isolated card + pair cùng value | Đánh isolated trước |
| Chỉ có thể chặn bằng 2 | Pass (nếu đối thủ nhiều bài) |
| Đối thủ đánh đôi, mình có đôi nhỏ hơn | Pass |
| isNewRound, có isolated | Đánh isolated nhỏ nhất |

### Hard Mode
| Scenario | Expected |
|----------|----------|
| Đối thủ còn 3 bài | Không bao giờ pass |
| Đối thủ còn 10 bài, chỉ chặn được bằng 2 | Pass |
| handSizes sau 5 lượt | Đúng với số bài thực tế |
| GameContext.reset() | handSizes = [13,13,13,13] |

### Integration
| Scenario | Expected |
|----------|----------|
| Đổi difficulty mid-game | Bot thay đổi behavior ngay lập tức |
| startGame() | GameContext reset đúng |
| Player đánh bài | GameContext.handSizes[0] giảm |

---

## Balance Constants (Starting Values)

```js
// Trong advanced-ai.js — điều chỉnh sau khi test
const SCORE_PENALTY_USE_TWO = 20;       // Phạt khi dùng 2
const SCORE_PENALTY_USE_QUAD = 15;      // Phạt khi dùng tứ quý
const SCORE_PENALTY_BREAK_STRAIGHT = 10; // Phạt khi phá sảnh
const SCORE_BONUS_CLEAR_ISOLATED = 15;  // Thưởng khi xóa bài lẻ
const SCORE_BONUS_CLEAR_PAIR = 10;      // Thưởng khi xóa đôi
const DANGER_BONUS_CRITICAL = 25;       // Đối thủ ≤ 3 bài
const DANGER_BONUS_WARNING = 15;        // Đối thủ ≤ 5 bài
```

---

## Related Code Files
- **Test**: `card_game/president/advanced-ai.js`
- **Verify**: `card_game/president/game-controller.js` (GameContext wiring)

---

## Implementation Steps

1. **Manual test Easy mode**:
   - Set `window.AI.difficulty = 'easy'`
   - Chơi vài ván, quan sát bot đánh weakest valid
   - Verify không có console errors

2. **Manual test Medium mode**:
   - Set `window.AI.difficulty = 'medium'`
   - Quan sát bot tránh dùng 2 khi không cần
   - Verify isolated cards được đánh trước pairs

3. **Manual test Hard mode**:
   - Set `window.AI.difficulty = 'hard'`
   - Quan sát bot không pass khi đối thủ ít bài
   - Verify `window.AI.context.handSizes` đúng qua console

4. **Balance adjustments**:
   - Nếu Medium bot pass quá nhiều → giảm `SCORE_PENALTY_USE_TWO`
   - Nếu Hard bot quá mạnh → giảm `DANGER_BONUS_CRITICAL`
   - Nếu bot bị stuck (không đánh được) → kiểm tra findBeatingCombos

5. **Edge case testing**:
   - Tay bài chỉ có 2s → bot pass đúng
   - Tay bài 1 lá → bot đánh đúng
   - Tứ quý chặt đôi 2 → bot dùng đúng lúc

6. **Verify difficulty selector**:
   - Đổi difficulty trong menu → bot thay đổi ngay
   - Default là 'medium'

---

## Todo List
- [ ] Test Easy mode — verify behavior giống ai-player.js cũ
- [ ] Test Medium mode — verify isolated cards ưu tiên
- [ ] Test Hard mode — verify không pass khi đối thủ nguy hiểm
- [ ] Verify GameContext.handSizes sync đúng
- [ ] Balance penalty/bonus constants
- [ ] Test edge cases (chỉ có 2s, 1 lá, tứ quý)
- [ ] Test difficulty selector mid-game

---

## Success Criteria
- Easy: behavior giống hệt bot cũ
- Medium: rõ ràng thông minh hơn Easy (ít dùng 2 hơn, đánh isolated trước)
- Hard: rõ ràng thông minh hơn Medium (không pass khi đối thủ nguy hiểm)
- Không có console errors trong bất kỳ scenario nào
- Difficulty selector hoạt động đúng

---

## Unresolved
- Chưa có automated test — nếu cần, có thể viết test script chạy trong console
- Balance values cần nhiều ván test để tinh chỉnh

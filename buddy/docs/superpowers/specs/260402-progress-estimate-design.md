# Progress Estimate Design

## Overview
Add probability-based progress estimation to Buddy Reroll search.

## Calculations

### Expected Attempts Formula
```javascript
function calcExpectedAttempts(state) {
  const RARITY_PROBS = { common: 0.6, uncommon: 0.25, rare: 0.10, epic: 0.04, legendary: 0.01 };
  const SPECIES_COUNT = 18;
  const EYE_COUNT = 6;
  const HAT_COUNT = 8; // exclude "none"
  const SHINY_PROB = 0.01;

  let p = RARITY_PROBS[state.rarity] || 0.01;
  if (state.species) p *= 1/SPECIES_COUNT;
  if (state.eye) p *= 1/EYE_COUNT;
  if (state.hat && state.hat !== 'none') p *= 1/HAT_COUNT;
  if (state.shiny === 'true') p *= SHINY_PROB;
  if (state.shiny === 'false') p *= (1 - SHINY_PROB);

  return Math.round(1 / p);
}
```

## UI Display

### Before Search (in outputArea)
When options change or on page load:
```
🎯 Trung bình cần ~X lần để ra kết quả
📊 Xác suất: 1/X
```

### During Search (update every 0.5s)
```
🔍 Đã thử: X / Y lần (Z%) | ⚡ N lần/giây
```

### After Search (result found)
- Clear progress display
- Show results normally

## Update Triggers
1. `toggleSelection()` - when user changes species/rarity/eye/hat/shiny
2. `updatePreview()` - when preview updates
3. Every 0.5s during search loop
4. `calcExpectedAttempts()` called on mode/submode changes

## Files Modified
- `buddy/index.html` - add `calcExpectedAttempts()` function and update `runSearch()`

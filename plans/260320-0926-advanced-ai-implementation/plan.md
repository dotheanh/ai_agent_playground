# Advanced AI Implementation Plan - Tiến Lên Card Game

## Overview
Nâng cấp AI bot từ logic rất ngu (`ai-player.js`) → `advanced-ai.js` với 3 mức độ: **Easy / Medium / Hard**.

## Key Design Decisions
- `advanced-ai.js` là **self-contained** — tự đọc game state mà không phụ thuộc game-controller.js
- Entry point: `window.AI = { selectCards, difficulty }`
- Tất cả bot cùng logic, không có personality riêng
- Không sửa `game-engine.js`

## Phases

| Phase | File | Status | Description |
|-------|------|--------|-------------|
| 1 | `phase-01-create-advanced-ai-core.md` | ⏳ | Basic combo logic + Easy mode (port từ ai-player.js) |
| 2 | `phase-02-add-hand-classification.md` | ⏳ | classifyHand() + combo scoring + Medium difficulty |
| 3 | `phase-03-add-difficulty-levels.md` | ⏳ | Card counting + danger assessment → Hard difficulty |
| 4 | `phase-04-integrate-with-controller.md` | ⏳ | game-controller.js gọi advanced-ai.js thay ai-player.js |
| 5 | `phase-05-test-and-balance.md` | ⏳ | Test từng difficulty + balance adjustments |

## Dependencies
```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
           ↓
       Tích hợp
```

## Output Files
- `card_game/president/advanced-ai.js` — core AI file (thay thế ai-player.js)
- `card_game/president/game-controller.js` — update gọi advanced-ai.js

## Risks
- Hard mode card counting cần state tracking chính xác
- Integration cần backward compatibility cho UI không bị break

## Unresolved
- UI difficulty selector? (chưa rõ user muốn selector trong game hay config)
- Demo mode: cho phép watch bot đấu nhau? (future scope)

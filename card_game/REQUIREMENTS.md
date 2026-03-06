# Card Game - Tiến Lên Miền Nam

## Overview

Game bài Tiến Lên Miền Nam (Vietnamese card game) chơi trên web, tối ưu cho màn hình dọc (mobile-first). Người chơi đấu với 3 bot AI. Giao diện dark theme hiện đại.

## Goals

1. Game Tiến Lên 4 người (1 player + 3 AI bots)
2. Giao diện mobile-first, portrait orientation, dark theme
3. Đầy đủ luật chơi cơ bản: đơn, đôi, ba, sảnh, tứ quý
4. AI bot có khả năng đánh bài hợp lý

## Technical Stack

- **Runtime**: Vanilla HTML/CSS/JS (no framework, no build step)
- **Layout**: Mobile-first, max-width 480px
- **Theme**: Dark (#0a0e1a) + cyan/purple accents

## Project Structure

```
card_game/president/
├── index.html            # Entry point + CSS styles
├── game-engine.js        # Core: deck, cards, combos, shuffle
├── helpers.js            # Utility: groupByRank, findStraights, sortHand
├── ai-player.js          # AI logic: chọn bài, tìm combo chặn được
├── ui-renderer.js        # Render giao diện: bàn chơi, tay bài, đối thủ
└── game-controller.js    # Game state, lượt chơi, event handlers
```

## Game Rules (Tiến Lên)

### Bộ bài
- 52 lá, chia đều 13 lá/người
- Thứ tự rank: 3 < 4 < 5 < ... < K < A < 2
- Thứ tự suit: ♠ < ♣ < ♦ < ♥

### Combo hợp lệ
| Combo | Mô tả |
|-------|--------|
| Đơn | 1 lá bất kỳ |
| Đôi | 2 lá cùng rank |
| Ba | 3 lá cùng rank |
| Sảnh | 3+ lá liên tiếp (không chứa 2) |
| Tứ quý | 4 lá cùng rank (chặt được đôi 2) |

### Luật chơi
- Người có 3♠ đánh trước
- Đánh theo vòng: phải chặn combo cùng loại, cùng số lá, giá trị cao hơn
- Bỏ lượt nếu không chặn được
- Khi 3 người bỏ lượt → vòng mới, người đánh cuối được đánh trước
- Ai hết bài trước thắng

## UI/UX

- **Theme**: Dark mode (#0a0e1a) + cyan (#00d4ff) / purple (#7c3aed) accents
- **Font**: Segoe UI / system-ui
- **Layout**: Top bar → Opponents → Table center → Controls → Player hand
- **Cards**: White cards, real card style (rank+suit ở góc trên-trái & góc dưới-phải, suit lớn ở giữa), fan layout cho tay bài
- **Animations**: Card play animation, pulse ring cho active player
- **Menu**: Overlay start screen, win screen

## Running

Mở `card_game/president/index.html` trực tiếp trong trình duyệt. Không cần server hay build step.

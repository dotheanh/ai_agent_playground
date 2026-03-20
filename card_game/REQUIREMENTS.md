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
├── game-engine.js        # Core: deck, cards, combos, shuffle (read-only exports)
├── helpers.js            # Utility: groupByRank, findStraights, sortHand, detectComboGroups, handCanBeat
├── advanced-ai.js       # Advanced AI module: 3 difficulty levels, hand classification, hint system
├── ui-renderer.js        # Render giao diện: bàn chơi, tay bài, đối thủ
└── game-controller.js    # Game state, lượt chơi, event handlers, auto-select combo logic
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
- Người có 3♠ đánh trước (hoặc combo chứa 3♠: đôi ba tứ quý có 3♠, sảnh bắt đầu bằng 3)
- Đánh theo vòng: phải chặn combo cùng loại, cùng số lá, giá trị cao hơn
- Bỏ lượt nếu không chặn được
- Khi 3 người bỏ lượt → vòng mới, người đánh cuối được đánh trước
- Ai hết bài trước thắng

## UI/UX

- **Theme**: Dark mode (#0a0e1a) + cyan (#00d4ff) / purple (#7c3aed) accents
- **Font**: Segoe UI / system-ui
- **Layout**: Top bar → Opponents → Table center → Timer → Controls → Player hand
- **Cards**: White cards, real card style (rank+suit ở góc trên-trái & góc dưới-phải x1.8, suit lớn ở giữa), fan layout cho tay bài
- **Combo Groups**: Tự động tô màu các lá bài có thể ghép thành bộ (đôi/ba/tứ quý/sảnh)
  - Vàng (a): đôi, ba, tứ quý
  - Xanh dương (b): sảnh
  - Xanh lá (c), Hồng (d), Tím (e): các nhóm tiếp theo
- **Auto-Select Combo**: Khi chọn 1 lá thuộc group (cùng màu), tự động chọn combo phù hợp để beat đối thủ
  - Đôi / Ba / Tứ quý: chọn tất cả lá cùng rank trong tay → auto chọn nếu hợp lệ
  - Sảnh: tìm sảnh yếu nhất đủ đánh được (ưu tiên sảnh ngắn)
  - Không áp dụng nếu combo không thể beat (ví dụ: đối thủ đánh lẻ thì không tự chọn đôi)
  - Disabled Play button khi tay không có combo nào beat được
- **Drag & Drop**: Kéo thả để sắp xếp lại vị trí bài trên tay
- **Timer**: Đếm ngược 15 giây mỗi lượt
  - Vòng mới: tự đánh combo nhỏ nhất (ưu tiên đánh nguyên bộ nếu lá nhỏ nhất thuộc combo)
  - Lượt thường: tự động bỏ lượt
- **Controls**:
  - Sắp xếp: sắp xếp bài theo rank
  - Gợi ý: dùng AI để chọn bài phù hợp (highlight + chọn bài AI đề xuất)
  - Bỏ lượt: nút đỏ nhấp nháy khi có thể bỏ lượt (không phải vòng mới)
  - Đánh: chơi bài đã chọn
- **Difficulty Selector**: Menu overlay chọn Easy / Medium / Hard trước khi chơi
- **Animations**: Card fly animation từ đúng vị trí lá bài trên tay → bàn (player + bot), pulse ring cho active player
- **Menu**: Overlay start screen, win screen với nút "Ván Mới"

## AI System

### Difficulty Levels

| Level | Description |
|-------|-------------|
| **Easy** | Bot cũ - đánh lá yếu nhất, không có chiến thuật |
| **Medium** (default) | Hand classification, ưu tiên đánh bài lẻ, giữ bài mạnh |
| **Hard** | Card counting + danger assessment, đối thủ ≤3 bài → phải chặn |

### AI Features
- **Hand Classification**: Tự động phân loại bài lẻ, đôi, ba, tứ quý, sảnh
- **Combo Scoring**: Chấm điểm combo để chọn nước đi tối ưu
- **Card Counting**: Track bài đã đánh để ước lượng bài đối thủ
- **Danger Assessment**: Đối thủ gần hết bài → buộc phải chặn
- **Hint System**: Gợi ý dùng chính AI để chọn bài cho player
- **First Move Rule**: Lượt đầu tiên của ván phải đánh 3♠ hoặc combo chứa 3♠

### AI Module API
```js
window.AI.selectCards(hand, lastCombo, isNewRound, state) → Array | null
window.AI.setDifficulty('easy' | 'medium' | 'hard')
window.AI.getDifficulty() → string
window.AI.updateContext({ playedCards, handSizes, currentPlayer })
window.AI.reset()
```

## Running

Mở `card_game/president/index.html` trực tiếp trong trình duyệt. Không cần server hay build step.

# Smart Auto Click - Windows Auto Clicker

## Overview

Chương trình auto click thông minh chạy trên Windows với khả năng record và replay script click. Hỗ trợ 2 chế độ: click liên tục tại vị trí hiện tại và replay script đã record.

## Goals

1. Auto click liên tục tại vị trí chuột hiện tại
2. Record và replay script click với 2 chế độ: position-only và timeline-based
3. Hotkey F1 để bắt đầu/dừng
4. Script có thể edit trực tiếp qua file text
5. GUI đơn giản, dễ sử dụng

## Technical Stack

- **Runtime**: Python 3.10+
- **GUI**: Tkinter (built-in)
- **Mouse Control**: `pynput` hoặc `pyautogui`
- **Hotkey**: `keyboard` library
- **Script Format**: JSON (dễ đọc, dễ edit)

## Features

### 1. Continuous Click Mode
- Click liên tục tại vị trí chuột hiện tại
- Configurable click interval (ms)
- Left/Right/Middle click support
- Single/Double click support

### 2. Script Recording Mode

#### Position-Only Mode
- Record vị trí click (x, y) và loại click (left/right/middle)
- Không record thời gian
- Khi replay: click tuần tự các điểm với interval cố định (configurable)
- Use case: click lặp lại các vị trí cố định

#### Timeline Mode
- Record vị trí + timestamp chính xác
- Replay đúng timing như khi record
- Use case: automation script phức tạp cần timing chính xác

### 3. Script Management
- Save/Load script từ file JSON
- Edit script trực tiếp trong text editor
- Clone/Duplicate actions
- Adjust positions/timing manually

### 4. Hotkeys
- **F1**: Start/Stop clicking
- **F2**: Start/Stop recording
- **F3**: Replay script
- **ESC**: Emergency stop (global)

### 5. GUI Features
- Mode selector: Continuous / Position-Only / Timeline
- Click interval slider (10ms - 5000ms)
- Click type selector: Left / Right / Middle
- Click count selector: Single / Double
- Recording status indicator
- Script preview panel
- Start/Stop buttons
- Load/Save script buttons
- Edit script button (open in default text editor)

## Script Format

### Position-Only Script
```json
{
  "version": "1.0",
  "mode": "position",
  "interval": 500,
  "actions": [
    {"x": 100, "y": 200, "button": "left", "clicks": 1},
    {"x": 300, "y": 400, "button": "left", "clicks": 2},
    {"x": 500, "y": 600, "button": "right", "clicks": 1}
  ]
}
```

### Timeline Script
```json
{
  "version": "1.0",
  "mode": "timeline",
  "actions": [
    {"time": 0.0, "x": 100, "y": 200, "button": "left", "clicks": 1},
    {"time": 1.5, "x": 300, "y": 400, "button": "left", "clicks": 2},
    {"time": 3.2, "x": 500, "y": 600, "button": "right", "clicks": 1}
  ]
}
```

## Project Structure

```
smart_auto_click/
├── REQUIREMENTS.md
├── main.py              # Entry point + GUI
├── clicker.py           # Click execution logic
├── recorder.py          # Recording logic
├── script_manager.py    # Load/Save/Edit scripts
├── hotkey_handler.py    # Global hotkey listener
├── config.py            # Configuration constants
├── scripts/             # Saved scripts directory
│   ├── example_position.json
│   └── example_timeline.json
└── requirements.txt     # Python dependencies
```

## Dependencies

```
pynput>=1.7.6
keyboard>=0.13.5
```

## Usage Flow

### Continuous Click
1. Mở app
2. Chọn "Continuous Click" mode
3. Di chuyển chuột đến vị trí cần click
4. Nhấn F1 để bắt đầu
5. Nhấn F1 hoặc ESC để dừng

### Position-Only Recording
1. Chọn "Position-Only" mode
2. Set interval (ví dụ: 500ms)
3. Nhấn F2 để bắt đầu record
4. Click vào các vị trí cần record
5. Nhấn F2 để dừng record
6. Save script
7. Nhấn F3 để replay

### Timeline Recording
1. Chọn "Timeline" mode
2. Nhấn F2 để bắt đầu record
3. Click vào các vị trí theo đúng timing mong muốn
4. Nhấn F2 để dừng record
5. Save script
6. Nhấn F3 để replay

### Edit Script
1. Load script
2. Click "Edit Script" button → mở file JSON trong notepad/VSCode
3. Chỉnh sửa positions/timing/actions
4. Save file
5. Reload script trong app
6. Replay để test

## Safety Features

- Emergency stop (ESC) hoạt động mọi lúc
- Confirmation dialog trước khi replay script dài
- Script validation trước khi load
- Click rate limiter (tối đa 100 clicks/second)

## Future Enhancements (Optional)

- Keyboard input recording
- Conditional logic (if-else)
- Loop count configuration
- Random delay between clicks
- Image recognition để click vào UI element
- Multi-monitor support
- Macro variables (dynamic positions)

## Running

```bash
pip install -r requirements.txt
python main.py
```

## Notes

- Cần chạy với quyền admin để global hotkey hoạt động
- Script files lưu ở `scripts/` directory
- Backup scripts trước khi edit để tránh mất data

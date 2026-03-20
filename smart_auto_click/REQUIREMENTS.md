# Smart Auto Click - Windows Auto Clicker

## Overview

Chương trình auto click thông minh chạy trên Windows với khả năng record và replay script click. Hỗ trợ 3 chế độ: click liên tục, replay position, replay timeline.

## Features

### 1. Continuous Click Mode
- Click liên tục tại vị trí chuột hiện tại (lock position)
- Configurable click interval (10ms - 5000ms)
- Left/Right/Middle click support
- Single/Double click support

### 2. Script Recording Mode

#### Position-Only Mode
- Record vị trí click (x, y) và loại click
- Khi replay: click tuần tự các điểm với interval cố định
- Use case: click lặp lại các vị trí cố định

#### Timeline Mode
- Record vị trí + timestamp chính xác
- Replay đúng timing như khi record
- Use case: automation script phức tạp cần timing chính xác

### 3. Loop Script
- Chỉ hiển thị khi ở mode script
- Checkbox để bật/tắt loop
- Nhập số lần loop (0 = vô hạn)
- Script tự động lặp lại sau khi chạy xong

### 4. Script Management
- Save/Load script từ file JSON
- Edit script trực tiếp trong text editor (JSON)
- Reload script sau khi edit
- Clone/Duplicate actions

### 5. Hotkeys
- **F1**: Start/Stop - tự detect mode hiện tại để click hoặc stop tương ứng
- **F2**: Record - chỉ hoạt động ở mode script; nếu đang ở continuous mode sẽ hiện cảnh báo
- **ESC**: Emergency stop - stop tất cả (clicking, recording, replaying)

### 6. GUI Features
- Mode selector: Continuous / Position-Only / Timeline
- Click interval slider (10ms - 5000ms)
- Click type selector: Left / Right / Middle
- Click count selector: Single / Double
- Loop checkbox + count input (script modes only)
- Hotkey bar hiển thị các phím tắt
- Recording status indicator
- Script preview panel
- Position display (current mouse position)
- Load/Save/Edit/Reload/Clear script buttons

## Script Format

### Position-Only Script
```json
{
  "version": "1.0",
  "mode": "position",
  "interval": 500,
  "actions": [
    {"x": 100, "y": 200, "button": "left", "clicks": 1},
    {"x": 300, "y": 400, "button": "left", "clicks": 2}
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
    {"time": 1.5, "x": 300, "y": 400, "button": "left", "clicks": 2}
  ]
}
```

## Project Structure

```
smart_auto_click/
├── main.py              # Entry point + GUI
├── clicker.py          # Click execution logic + ScriptPlayer
├── recorder.py         # Recording logic
├── script_manager.py   # Load/Save/Edit scripts
├── hotkey_handler.py    # Global hotkey listener
├── config.py            # Configuration constants
├── build-exe.py         # PyInstaller build script
├── Smart Auto Click.bat # Launcher
├── scripts/             # Saved scripts directory
└── requirements.txt     # Python dependencies
```

## Dependencies

```
pynput>=1.7.6
pyautogui>=0.9.54
keyboard>=0.13.5
```

## Usage Flow

### Continuous Click
1. Mở app → chọn "Continuous Click" mode
2. Di chuyển chuột đến vị trí cần click
3. Nhấn F1 để bắt đầu (sẽ lock vị trí và click liên tục)
4. Nhấn F1 hoặc ESC để dừng

### Recording Position-Only
1. Chọn "Position-Only" mode
2. Set interval (vd: 500ms)
3. Nhấn F2 để bắt đầu record
4. Click vào các vị trí cần record
5. Nhấn F2 để dừng record
6. Save script
7. Tick "Loop Script" nếu muốn lặp lại
8. Nhấn F1 để replay

### Recording Timeline
1. Chọn "Timeline" mode
2. Nhấn F2 để bắt đầu record
3. Click vào các vị trí theo đúng timing mong muốn
4. Nhấn F2 để dừng record
5. Save script
6. Tick "Loop Script" nếu muốn lặp lại
7. Nhấn F1 để replay

### Edit Script
1. Load script
2. Click "Edit" → mở file JSON trong notepad/VSCode
3. Chỉnh sửa positions/timing/actions
4. Save file
5. Click "Reload" trong app
6. Replay để test

## Safety Features

- Emergency stop (ESC) hoạt động mọi lúc
- Script validation trước khi load
- Click rate limiter (tối đa 100 clicks/second)

## Running

```bash
pip install -r requirements.txt
python main.py
```

Hoặc double-click `Smart Auto Click.bat`

### Build Executable
```bash
python build-exe.py
```
Output: `dist/SmartAutoClick.exe` + `dist/scripts/`

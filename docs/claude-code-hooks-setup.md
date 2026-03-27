# Claude Code Hooks Setup Guide

## Tổng quan

Hướng dẫn thiết lập Claude Code hooks để nhận thông báo từ Desktop Pet khi Claude thực hiện các action.

**Lưu ý quan trọng:** Hooks **HOẠT ĐỘNG** với cả VS Code Extension VÀ CLI standalone!

## Vấn đề đã gặp

### 1. SessionStart event không show bubble

**Triệu chứng:**
- Hook `SessionStart` được trigger
- Bubble không hiển thị

**Nguyên nhân:**
- Lỗi typo trong [`claude-hooks.js:185`](d:\Anh\IT\Projects\AlexPlayground\desktop_pet\src\scripts\claude-hooks.js#L185)
- Dùng hàm `payloadMessage()` không tồn tại thay vì `pickMessage()`

**Giải pháp:**
```javascript
// Sai
message: payloadMessage(rawPayload)

// Đúng
message: pickMessage(rawPayload)
```

### 2. PostToolUse event không show bubble

**Triệu chứng:**
- Hook `SessionStart` được trigger
- Bubble không hiển thị

**Nguyên nhân:**
- Lỗi typo trong [`claude-hooks.js:185`](d:\Anh\IT\Projects\AlexPlayground\desktop_pet\src\scripts\claude-hooks.js#L185)
- Dùng hàm `payloadMessage()` không tồn tại thay vì `pickMessage()`

**Giải pháp:**
```javascript
// Sai
message: payloadMessage(rawPayload)

// Đúng
message: pickMessage(rawPayload)
```

### 3. PostToolUse event không show bubble

**Triệu chứng:**
- Hook `PostToolUse` được trigger
- Chỉ hide bubble (qua `/hook/permission-resolved`)
- Không show notification bubble

**Nguyên nhân:**
- Logic chỉ gửi `/hook/permission-resolved` để hide bubble
- Không có code để show notification bubble sau khi tool hoàn thành

**Giải pháp:**
```javascript
// Thêm code để show notification
const brokerPayload = {
  type: 'notification',
  message: `${toolName} completed: ${summarizeToolInput(toolInput)}`,
  options: [],
};
await httpPost('/hook/event', brokerPayload);
```

---

## Điều Kiện Để Hooks Hoạt Động

### 1. Dùng VS Code Extension HOẶC CLI Standalone

Hooks **HOẠT ĐỘNG** với cả:
- ✅ **VS Code Extension** (Claude Code extension trong VS Code)
- ✅ **CLI Standalone** (chạy `claude` command trong terminal)

**Lưu ý:** Khi dùng VS Code extension, hooks vẫn hoạt động bình thường như CLI!

### 2. Settings.json Configuration

File: `~/.claude/settings.json`

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "node \"D:/Anh/IT/Projects/AlexPlayground/desktop_pet/src/scripts/claude-hooks.js\""
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash|Read|Edit|Write|Glob|Grep|MultiEdit|NotebookEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"D:/Anh/IT/Projects/AlexPlayground/desktop_pet/src/scripts/claude-hooks.js\""
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash|Read|Edit|Write|Glob|Grep|MultiEdit|NotebookEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"D:/Anh/IT/Projects/AlexPlayground/desktop_pet/src/scripts/claude-hooks.js\""
          }
        ]
      }
    ],
    "PermissionRequest": [
      {
        "matcher": "Bash|Read|Edit|Write|Glob|Grep|MultiEdit|NotebookEdit|AskUserQuestion",
        "hooks": [
          {
            "type": "command",
            "command": "node \"D:/Anh/IT/Projects/AlexPlayground/desktop_pet/src/scripts/claude-hooks.js\""
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "idle_prompt|permission_prompt|session_end",
        "hooks": [
          {
            "type": "command",
            "command": "node \"D:/Anh/IT/Projects/AlexPlayground/desktop_pet/src/scripts/claude-hooks.js\""
          }
        ]
      }
    ],
    "TaskCompleted": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"D:/Anh/IT/Projects/AlexPlayground/desktop_pet/src/scripts/claude-hooks.js\""
          }
        ]
      }
    ]
  }
}
```

### 2. Event Types và Matcher

| Event | Matcher | Mục đích |
|-------|---------|----------|
| `SessionStart` | `startup|resume|clear|compact` | Khi session bắt đầu/resume |
| `PreToolUse` | Tool names | Trước khi tool chạy |
| `PostToolUse` | Tool names | Sau khi tool hoàn thành |
| `PermissionRequest` | Tool names + `AskUserQuestion` | Khi cần permission |
| `Notification` | `idle_prompt|permission_prompt|session_end` | Khi Claude idle/waiting |
| `TaskCompleted` | (omit - always fire) | Khi task hoàn thành |

### 3. Desktop Pet Setup

**Bước 1: Start desktop_pet**
```bash
cd d:\Anh\IT\Projects\AlexPlayground\desktop_pet
npm start
```

**Bước 2: Verify HTTP server listening**
```bash
netstat -ano | findstr ":49152"
```

**Bước 3: Start Claude CLI**
```bash
cd d:\Anh\IT\Projects\AlexPlayground
claude
```

---

## Checklist Để Hooks Hoạt Động

- [ ] Desktop_pet đang chạy trên port 49152
- [ ] Hooks config trong `~/.claude/settings.json`
- [ ] Restart Claude CLI sau khi config hooks
- [ ] Script path đúng absolute path
- [ ] Matcher đúng tool names (`Bash|Read|Edit|Write|...`)
- [ ] SessionStart hook có `matcher: "startup|resume|clear|compact"`
- [ ] Notification hook có `matcher: "idle_prompt|permission_prompt|session_end"`
- [ ] TaskCompleted hook omit matcher (luôn fire)

---

## Debug Hooks

### 1. Kiểm tra script có được gọi không

Tạo debug script:
```javascript
// ~/.claude/hooks/debug-hook.js
const fs = require('fs');
const LOG_FILE = 'C:/Users/NITRO/.claude/hooks/debug.log';

function log(...args) {
  const message = `[${new Date().toISOString()}] ${args.join(' ')}`;
  console.error(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

log('=== HOOK SCRIPT STARTED ===');
```

### 2. Xem log file
```bash
type C:\Users\NITRO\.claude\hooks\debug.log
```

### 3. Kiểm tra desktop_pet log
```
[HTTP Server] === /hook/event ===
[HTTP Server] Event type: ...
[Bubble] === showBubble ===
```

---

## Files Liên Quan

- [`claude-hooks.js`](d:\Anh\IT\Projects\AlexPlayground\desktop_pet\src\scripts\claude-hooks.js) - Hook script nhận stdin JSON, gửi HTTP POST
- [`http-server.js`](d:\Anh\IT\Projects\AlexPlayground\desktop_pet\src\main\http-server.js) - HTTP server listen port 49152
- [`bubble-window.js`](d:\Anh\IT\Projects\AlexPlayground\desktop_pet\src\main\bubble-window.js) - Hiển thị bubble notification
- [`~/.claude/settings.json`](C:\Users\NITRO\.claude\settings.json) - Claude Code hooks configuration

---

## Troubleshooting

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| Bubble không hiện | SessionStart typo | Fix `payloadMessage()` → `pickMessage()` |
| Không có log | Desktop_pet không chạy | Start desktop_pet trước |
| Hook không trigger | Matcher sai | Dùng tool names cụ thể |
| Config không load | Không restart Claude | Restart session sau khi config |

---

## Cập Nhật

- **2026-03-27**: Fix `SessionStart` bubble display (typo `payloadMessage` → `pickMessage`)
- **2026-03-27**: Add `PostToolUse` notification bubble
- **2026-03-27**: Xác nhận hooks hoạt động với cả VS Code Extension VÀ CLI standalone
- **2026-03-27**: Add `PreToolUse` notification bubble
- **2026-03-27**: Add `UserPromptSubmit` notification bubble
- **2026-03-27**: Add priority system (High/Low) with auto-hide, sound, focus button
- **2026-03-27**: High Priority interrupts Low Priority, Low Priority queues when High Priority active

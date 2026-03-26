# Hybrid Permission Sync + Session End Notification — Design Spec

## Mục tiêu

Cho phép Desktop Pet bubble interactive đồng bộ với Claude Code permission prompt ở cả 2 chiều:

1. **Terminal → Bubble:** User approve/deny trong terminal → bubble tự ẩn
2. **Bubble → Terminal:** Click bubble → ghi quyết định vào decision queue → auto-resolve request **tiếp theo** cùng loại
3. **Session idle notification:** Khi Claude trả lời xong, chờ user ra lệnh tiếp → show bubble thông báo pet đang chờ

---

## ⚠️ Ràng buộc quan trọng (Claude Code Hook Architecture)

Claude Code **KHÔNG có event riêng** cho "permission resolved". Các event xung quanh:

| Event | Fire khi nào |
|---|---|
| `PermissionRequest` | Dialog permission hiện ra |
| `PostToolUse` | Tool thực thi **thành công** (user đã approve trong terminal) |
| `PostToolUseFailure` | Tool thực thi **thất bại** (user deny hoặc lỗi) |
| `Notification` | Notification được gửi, kể cả khi Claude **đợi user input** |

**Hệ quả:** Không có cách nào để bubble click immediate-resolve request hiện tại — hook cần trả stdout **TRƯỚC KHI** prompt hiện lên, nên luồng thực tế là:

> **Bubble click → ghi vào decision queue → request tiếp theo cùng fingerprint được auto-resolve**

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Claude Code Runtime                                      │
│                                                          │
│  ① PermissionRequest ──→ hook.js                          │
│     [chờ stdout]      ├── POST /hook/permission-request   │
│                        │   broker.enqueue(req)            │
│                        ├── kiểm tra decision queue        │
│                        └── echo {hookSpecificOutput:"pass"}│
│                                                          │
│  ② Terminal prompt: [Yes] [No]                           │
│     User clicks ───→ tool executes                       │
│                        ↓                                  │
│     PostToolUse ───────→ hook.js                         │
│                        ├── POST /hook/permission-resolved │
│                        └── broker.resolveByClaudeUi()     │
│                            → onHide() → bubble ẩn ✅      │
│                                                          │
│  ③ Notification "Claude is waiting..."                    │
│     ──→ hook.js → POST /hook/event → showBubble(session_end)│
└─────────────────────────────────────────────────────────┘
                                    ▲
                                    │
              ┌─────────────────────┐│
              │  Broker (Electron)  ││
              │  decisionQueue.json  ││
              │  enqueueRequest()   ││
              │  resolveByDecision()││
              │  resolveByClaudeUi()││
              │  onShow → showBubble││
              │  onHide → hideBubble││
              └─────────────────────┘│
                                    │
              ┌─────────────────────┴┐
              │  Bubble Window (UI)   │
              │  [Yes] [Yes, all] [No]│
              │  onclick → /bubble/   │
              │  decision + write     │
              │  decisionQueue.json   │
              └──────────────────────┘
```

---

## Components

### 1. `claude-hooks.js` (mở rộng)

**Input:** JSON từ stdin (hook payload)
**Output:** JSON stdout (`hookSpecificOutput`)

| Hook event | Hành động |
|---|---|
| `PermissionRequest` | Gửi broker → kiểm tra queue → `pass` (để terminal prompt) |
| `PostToolUse` | Gửi broker `/hook/permission-resolved` để ẩn bubble |
| `Notification` | Gửi broker `/hook/event` với `session_end` nếu Claude đợi input |

**Session idle detection:** Check `notification.notification_type === 'idle_prompt'` → show session_end bubble.

### 2. `setup-claude-hooks.js` (mở rộng)

Thêm `PostToolUse` và `Notification` hooks:

```js
settings.hooks.PostToolUse = [{
  matcher: '',
  hooks: [{ type: 'command', command: `node "${hookScript}"` }]
}];
settings.hooks.Notification = [{
  matcher: '',
  hooks: [{ type: 'command', command: `node "${hookScript}"` }]
}];
```

### 3. Decision Queue File

**Path:** `%APPDATA%/desktop-pet-rayquaza/decision-queue.json`

```json
[]
```

**Entry khi user click bubble:**

```json
{
  "id": "sha1-fingerprint",
  "toolName": "Bash",
  "inputFingerprint": "sha1(JSON.stringify({command:'...'}))",
  "decision": "approve_once|approve_always|deny",
  "source": "bubble_click",
  "createdAt": 1743033600000
}
```

**Expire:** Entries expire sau `timeoutMs` (default 60s).

### 4. Broker changes

Thêm method đọc/ghi decision queue:

- `readDecisionQueue()` — đọc file JSON
- `writeDecisionQueue(entries)` — ghi file JSON
- `checkDecisionMatch(request)` — kiểm tra xem request có match entry nào không
- `enqueueRequest()` — kiểm tra queue trước, nếu match → return `auto_resolved`

### 5. Bubble UI changes

- Interactive buttons với `fetch` POST `/bubble/decision`
- Sau khi click → ghi vào `decisionQueue.json` trước khi gửi broker
- Visual feedback: `Sending...` → `Sent!` → auto-hide

---

## Hook Event Flow Chi Tiết

### Flow 1: Terminal approve

```
User click Yes/No trong terminal
    ↓
Claude Code unblocks tool execution
    ↓
Tool executes
    ↓
PostToolUse fires
    ↓
hook.js nhận payload
    ↓
POST /hook/permission-resolved { requestId }
    ↓
broker.resolveByClaudeUi({ requestId })
    ↓
onHide() → hideBubble()
    ↓
Bubble ẩn ✅
```

### Flow 2: Bubble click cho request TIẾP THEO

```
User click option trên bubble
    ↓
Bubble UI ghi vào decisionQueue.json
    ↓
POST /bubble/decision { requestId, decision }
    ↓
broker.resolveByDecision() → request ẩn (nếu active)
    ↓

[Lần sau] PermissionRequest fire cho request mới
    ↓
hook.js kiểm tra decisionQueue.json
    ↓
Match với entry → echo {hookSpecificOutput:{decision}}
    ↓
Claude Code auto-resolve ✅
    ↓
PostToolUse fire → hook gửi broker → ẩn bubble
```

### Flow 3: Session end / idle notification

```
Claude trả lời xong, chờ user input
    ↓
Notification hook fire (notification_type: "idle_prompt")
    ↓
hook.js POST /hook/event { type: "session_end" }
    ↓
broker → showBubble({ type: "session_end", message: "Claude đang chờ lệnh..." })
    ↓
Bubble hiện ✅
```

---

## File Changes

### Modify
- `desktop_pet/src/main/permission-broker.js` — thêm decision queue read/write/match
- `desktop_pet/src/main/bubble-window.js` — interactive buttons + write queue
- `desktop_pet/src/main/http-server.js` — thêm route `/hook/event` + `/hook/permission-resolved`
- `desktop_pet/src/scripts/claude-hooks.js` — thêm PostToolUse + Notification handling
- `desktop_pet/scripts/setup-claude-hooks.js` — thêm PostToolUse + Notification hooks
- `desktop_pet/src/main/main.js` — đảm bảo broker wired đúng

### Create
- `desktop_pet/scripts/decision-queue-persistence.js` — đọc/ghi decision queue file

---

## Limitation Notes

1. **Bubble click không immediate-resolve request hiện tại.** Claude Code hook yêu cầu response ngay lập tức — không thể đợi user click bubble trước khi prompt hiện lên. Giải pháp: ghi vào queue → auto-resolve request **tiếp theo** cùng loại.
2. **Fingerprint matching không hoàn hảo.** Dùng SHA1 của tool_name + tool_input để match, có thể sai nếu Claude format khác.
3. **Decision queue có expire.** Entries expire sau 60s để tránh stale decisions.

---

## Testing Checklist

- [ ] Terminal approve → bubble ẩn (PostToolUse flow)
- [ ] Terminal deny → bubble ẩn (PostToolUseFailure flow)
- [ ] Bubble click → ghi vào queue → request tiếp theo auto-resolved
- [ ] Session end notification hiện bubble khi Claude idle
- [ ] Queue entries expire sau 60s
- [ ] Không crash khi decision queue file không tồn tại

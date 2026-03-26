# AI Integration Plan: Claude Code + Speech Bubbles

## Context

**Goal:** Tích hợp Claude Code hooks với desktop pet để hiện speech bubble notifications khi có permission requests hoặc questions.

**Reference:** [Masko Code](https://github.com/RousselPaul/masko-code) - macOS app tương tự

---

## Architecture Overview

```
Claude Code (terminal)
    ↓ hooks → settings.json events
    ↓ HTTP POST → local server (port 49152)
Desktop Pet (Electron)
    ↓ process
Speech Bubble UI
```

---

## Key Components

### 1. HTTP Server (Main Process)
- Listen on `http://localhost:49152`
- Handle POST requests from Claude Code hooks
- Parse event payload
- Send to renderer via IPC

### 2. Claude Code Hooks Setup
- Create `~/.claude/settings.json` (Windows: `%USERPROFILE%\.claude\settings.json`)
- Add hooks section:
```json
{
  "hooks": {
    "post": [
      {
        "event": "permission_request",
        "promptFile": "path/to/prompt.txt"
      }
    ]
  }
}
```

### 3. Speech Bubble UI (Renderer)
- Position: above the mascot
- Auto-adjust position to avoid crop
- Two types:
  - **Interactive**: requires user click to dismiss
  - **Notification**: auto-hide after configurable seconds (default 5s)
- Configurable appearance (theme, timeout)

---

## Implementation Phases

### Phase 1: HTTP Server & Hook Setup
1. Add `express` or native `http` for local server
2. Create HTTP endpoint handler
3. Create Claude Code hook script (Node.js)
4. Add settings.json modification on first run

### Phase 2: Speech Bubble Component
1. Create speech bubble HTML/CSS component
2. Position logic (ensure not cropped)
3. Interactive vs notification modes
4. Auto-hide timer

### Phase 3: Integration
1. Connect HTTP events to bubble display
2. IPC bridge between main and renderer
3. Queue management for multiple notifications

---

## Files to Modify/Create

### New Files
- `src/main/http-server.js` - Local HTTP server
- `src/scripts/claude-hooks.js` - Claude Code hook script
- `src/renderer/speech-bubble.js` - Bubble component
- `src/renderer/speech-bubble.css` - Bubble styles

### Modify
- `src/main/main.js` - Add HTTP server startup
- `src/renderer/main.js` - Add bubble display logic
- `package.json` - Add `express` dependency

---

## Open Questions

1. **Windows path**: Verify `~/.claude/settings.json` exists on Windows
2. **Hook format**: Confirm Claude Code uses same hook format on Windows
3. **Bubble sizing**: How to handle variable content sizes?
4. **Port conflict**: What if port 49152 is in use?

---

## Dependencies

- `express` - Lightweight HTTP server (or native `http`)
- Or: Use Electron's `net` module for server

---

## Success Criteria

- [ ] HTTP server starts with app
- [ ] Hooks installed to Claude settings
- [ ] Permission requests show bubble
- [ ] Interactive bubbles require click
- [ ] Notification bubbles auto-hide
- [ ] Bubble position adjusts to avoid crop

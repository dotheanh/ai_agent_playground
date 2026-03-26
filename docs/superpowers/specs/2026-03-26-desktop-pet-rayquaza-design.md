# Desktop Pet Rayquaza - Design Spec

## 1. Project Overview

**Project name:** Desktop Pet Rayquaza
**Type:** Desktop overlay widget (Electron + Three.js)
**Core functionality:** 3D animated Mega Rayquaza model displayed as a draggable desktop pet with always-on-top behavior
**Target users:** Windows users who want a decorative animated mascot on their desktop

---

## 1b. Quick Start (Dev + Hooks)

### First-time setup
```bash
cd desktop_pet
npm install
npm run setup-hooks
```

### Start app (dev mode)
```bash
cd desktop_pet
npm run dev
```

### Important notes
- After `npm run setup-hooks`, **restart Claude Code terminal** to reload hook config.
- Hook key in `~/.claude/settings.json` must be `hooks.PermissionRequest`.
- If bubble not showing, verify pet app is running and port `49152` is listening.

### Quick bubble test
```bash
cd desktop_pet
npm run test-bubble
# or
node scripts/test-bubble.js permission_request "Can I read package.json?"
```

### Build Windows executable
```bash
cd desktop_pet
npm run build:win
```

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Desktop framework | Electron | Frameless transparent window, system integration |
| 3D rendering | Three.js | Load & render GLB model with WebGL |
| UI framework | Vanilla JS / HTML | Lightweight, no heavy framework overhead |
| Build tool | Vite | Fast dev server & bundling |
| Packaging | electron-builder | Build .exe installer |

---

## 3. Window Configuration

### Window Properties
- **Size:** 400x250px
- **Frame:** Frameless (no title bar, no native controls)
- **Background:** Fully transparent (transparent: true)
- **Always on top:** true (default)
- **Resizable:** false (fixed size)
- **Initial position:** Bottom-right corner of primary screen (420px from right, 250px from bottom)
- **Skip taskbar:** true (no taskbar icon)
- **Focusable:** true

---

## 4. Visual Design

### Color Palette
- Context menu background: `#0d0d0d` (black)
- Context menu text: `#e0e0e0`
- Context menu hover: `#cc0000` (red)
- Context menu border: `#cc0000` (red)
- Ruler overlay: `#ff3333` (red) - visible only in Move Window mode

### Typography
- Font: Segoe UI (system font)
- Menu item: 13px

---

## 5. Functionality Specification

### 5.1 3D Model Rendering
- Load `MegaRayquazaNLA.glb` via Three.js GLTFLoader
- Loop the NLA animation continuously
- Render on transparent WebGL canvas
- Camera zoom: 0.5x - 3x (via scroll wheel)

### 5.2 Interaction Modes

**Orbit Mode (default)**
- Left-click drag → rotate model (X and Y axes, 0.01 rad/pixel)
- Scroll wheel → zoom in/out at cursor position (0.5x - 3x)
- Auto-rotate when enabled (0.5 rad/s on Y-axis)

**Move Mode (one-shot)**
- Right-click → context menu → "Move Window"
- While dragging: mousemove updates window position via IPC
- Ruler overlay shows pixel guides (50px increments, red)
- Mouseup → auto-return to Orbit Mode, ruler hidden

### 5.3 Context Menu (Right-Click)
```
┌─────────────────────────────┐
│ Move Window                 │  ← One-shot drag, shows ruler
│ ✓ Auto-Rotate              │  ← Toggle (✓ when active)
│ ──────────────────────     │
│ ✓ Always on Top            │  ← Toggle (✓ when active)
│ ──────────────────────     │
│ Exit                       │  ← Quit application
└─────────────────────────────┘
```

### 5.4 System Tray
- Tray icon: transparent placeholder (16x16)
- Tray tooltip: "Mega Rayquaza Pet"
- Double-click → show pet
- Tray menu: Always on Top, Show Pet, Hide Pet, Exit

---

## 6. File Structure

```
desktop_pet/
├── package.json
├── vite.config.js
├── electron-builder.json
├── scripts/
│   ├── copy-assets.js                # Copy GLB to dist
│   ├── setup-claude-hooks.js         # Install Claude Code hooks
│   └── test-bubble.js                # Test bubble notifications
├── src/
│   ├── main/
│   │   ├── main.js                   # Electron main process, IPC + broker wiring
│   │   ├── http-server.js            # Route-based HTTP server (4 endpoints)
│   │   ├── bubble-window.js          # Separate bubble notification window
│   │   ├── bubble-html-template.js   # Bubble HTML/CSS/JS (interactive buttons)
│   │   └── permission-broker.js      # In-memory permission queue + resolve
│   ├── preload/
│   │   └── preload.js                # IPC bridge
│   ├── renderer/
│   │   ├── index.html
│   │   ├── main.js                   # Three.js setup, interaction logic
│   │   ├── style.css
│   │   └── assets/
│   │       └── MegaRayquazaNLA.glb
│   └── scripts/
│       └── claude-hooks.js           # Claude Code hook script + requestId
├── test/
│   └── permission-broker.test.js    # 13 unit + HTTP route tests
└── build/
    └── icon.ico
```

---

## 7. IPC Channels

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `set-window-position` | renderer → main | Update window position (x, y) |
| `toggle-always-on-top` | renderer → main | Toggle always-on-top flag |
| `get-always-on-top` | renderer → main (invoke) | Get current always-on-top state |
| `always-on-top-changed` | main → renderer | Notify state change |
| `exit-app` | renderer → main | Quit application |
| `hide-window` | renderer → main | Hide window |
| `show-window` | renderer → main | Show and focus window |
| `claude-event` | main → renderer | Forward Claude Code hook events |

---

## 7b. Claude Code Integration (AI Integration)

### Architecture
```
Claude Code (terminal)
    ↓ hooks.PermissionRequest → stdin JSON
    ↓ HTTP POST → http://localhost:49152
Desktop Pet (Electron)
    ↓ Permission Broker (requestId-based queue + FIFO)
    ↓ showBubble(payload)
Bubble Window (separate, transparent, always-on-top)
    - Interactive (clickable): permission_request, ask_question
    - Passive (auto-hide): session_start, session_end, notification
```

### Bubble Window Strategy
- **Separate window:** 360x160px transparent window for bubble UI (taller for buttons)
- **Position:** Overlapping middle of main pet window (centered vertically, shifted up 100px)
- **Z-order:** `moveTop()` called after show to ensure bubble is always on top
- **Click-through:** `setIgnoreMouseEvents(true)` by default; enabled only for interactive types
- **Mouse events:** enabled (`setIgnoreMouseEvents(false)`) only for `permission_request` and `ask_question` — so buttons are clickable
- **Sync:** Bubble repositions when main window moves (`moved` event)
- **Race-safe render:** queue payload until bubble HTML `did-finish-load`, then run `showBubble()`
- **Auto-hide:** Notification types auto-hide after timeout (session_start: 5s, session_end: 3s, notification: 5s)
- **Interactive:** `permission_request` & `ask_question` — buttons POST `/bubble/decision`, no auto-hide
- **Options UI:** up to 3 styled buttons; fallback defaults for PermissionRequest: `["Yes", "Yes, allow for all projects", "No"]`

### HTTP Server Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/hook/permission-request` | POST | Enqueue permission request via broker → show interactive bubble |
| `/hook/permission-resolved` | POST | Notify broker that user resolved in Claude UI → hide bubble |
| `/bubble/decision` | POST | Bubble button click → resolve via broker |
| `/hook/event` | POST | Non-permission events → show passive bubble directly |
| **Port:** 49152 | | |

### Decision Mapping
| Button text | decision enum |
|-------------|---------------|
| contains "allow for all" | `approve_always` |
| contains "no" or "deny" | `deny` |
| contains "yes" or "approve" | `approve_once` |
| unknown / fallback | `approve_once` |

### Permission Broker (in-memory, Electron main process)
- **requestId:** SHA-1 hash of event+fingerprint (or `payload.request_id` if present)
- **FIFO queue:** only 1 bubble shown at a time; pending requests queue up
- **Idempotent resolve:** second resolve returns `already_resolved`
- **Timeout:** 60s → expire + hide bubble + activate next
- **States:** `pending` → `resolved` | `expired` | `already_resolved`

### Claude Code Hook Script
- **Location:** `src/scripts/claude-hooks.js`
- **Setup:** Run `npm run setup-hooks` to install hooks to `~/.claude/settings.json`
- **Hook key:** `hooks.PermissionRequest` (valid Claude Code hook field)
- **Payload handling:** normalize `hook_event_name/tool_name/tool_input` into UI events and readable messages (e.g., `Run: powershell -Command "Get-Date"`)
- **Options handling:** use payload `permission_suggestions/options` when present; otherwise fallback
- **Setup script:** `scripts/setup-claude-hooks.js` - updates only Desktop Pet hook entries, preserves all other settings.

---

## 8. Key Implementation Details

### Drag & Move Logic
```
toggle-move (context menu):
  isDragging = true
  showRulerOverlay()
  isDragging = false  // (after mouseup)

mousedown:
  if (isDragging):
    record start position

mousemove (while isDragging):
  deltaX = clientX - dragStartX
  deltaY = clientY - dragStartY
  newX = window.screenX + deltaX
  newY = window.screenY + deltaY
  setWindowPosition(newX, newY)

mouseup:
  isDragging = false
  hideRulerOverlay()
  → returns to orbit mode
```

### Zoom Logic
```
wheel event:
  if (isDragging) return  // no zoom in move mode
  delta = (deltaY > 0) ? -0.1 : 0.1
  newZoom = camera.zoom + delta
  if (0.5 <= newZoom <= 3):
    camera.zoom = newZoom
```

---

## 9. Success Criteria

- [x] App launches without errors
- [x] Transparent frameless window appears at bottom-right
- [x] Rayquaza model renders and animates (loop)
- [x] Move Window mode with pixel ruler overlay
- [x] Orbit mode with model rotation
- [x] Scroll wheel zoom (0.5x - 3x)
- [x] Right-click shows custom context menu
- [x] Always on top toggle with checkmark
- [x] Auto-Rotate toggle with checkmark
- [x] System tray icon present
- [x] Exit via menu closes app cleanly
- [x] HTTP server starts with app (port 49152)
- [x] Claude Code hooks script created
- [x] Claude Code hook setup script (`npm run setup-hooks`)
- [x] Speech bubble notifications for Claude events
- [x] Interactive bubbles require click to dismiss
- [x] Notification bubbles auto-hide after timeout

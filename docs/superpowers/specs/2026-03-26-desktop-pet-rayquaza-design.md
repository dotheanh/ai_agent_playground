# Desktop Pet Rayquaza - Design Spec

## 1. Project Overview

**Project name:** Desktop Pet Rayquaza
**Type:** Desktop overlay widget (Electron + Three.js)
**Core functionality:** 3D animated Mega Rayquaza model displayed as a draggable desktop pet with always-on-top behavior
**Target users:** Windows users who want a decorative animated mascot on their desktop

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
│   └── copy-assets.js      # Copy GLB to dist
├── src/
│   ├── main/
│   │   └── main.js         # Electron main process, IPC handlers
│   ├── preload/
│   │   └── preload.js      # IPC bridge (setWindowPosition, toggleAlwaysOnTop, etc.)
│   └── renderer/
│       ├── index.html
│       ├── main.js         # Three.js setup, interaction logic
│       ├── style.css
│       └── assets/
│           └── MegaRayquazaNLA.glb
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

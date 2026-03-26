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

```
┌─────────────────────────────────────┐
│ Frameless, transparent, rounded     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │      Three.js Canvas            │ │
│ │      (MegaRayquazaNLA.glb)     │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│        200x200px, resizable        │
└─────────────────────────────────────┘
```

### Window Properties
- **Size:** 400x450px (default)
- **Frame:** Frameless (no title bar, no native controls)
- **Background:** Fully transparent (transparent: true)
- **Always on top:** true (via `setAlwaysOnTop`)
- **Resizable:** false (fixed size)
- **Initial position:** Bottom-right corner of primary screen (20px margin)
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
- Auto-rotate slowly when idle (Y-axis, ~0.002 rad/frame)
- Render on transparent WebGL canvas

### 5.2 Drag & Drop
- Mouse down → detect drag intent (no immediate rotation)
- Mouse move while down → drag window using Electron `win.dragMove()`
- Implement drag threshold: 5px movement before triggering drag
- If threshold not met → treat as potential rotation start

### 5.3 3D Rotation (Custom Orbit)
- Left-click drag on model → rotate model directly (custom orbit, not camera)
- Rotate X and Y axes based on mouse delta
- Rotation speed: 0.01 rad per pixel
- In Move Window mode: rotation is disabled (one-shot drag takes priority)

### 5.4 Context Menu (Right-Click)
```
┌─────────────────────────────┐
│ ✓ Move Window                │  ← One-shot drag mode, shows ruler
│ ✓ Auto-Rotate               │  ← Toggle auto-rotation (tick when on)
│ ─────────────────────────   │
│ ✓ Always on Top             │  ← Toggle always-on-top (tick when on)
│ ─────────────────────────   │
│ Exit                         │  ← Quit application
└─────────────────────────────┘
```
- **Move Window**: One-shot drag - after drag completes, auto-returns to orbit mode
- **Auto-Rotate**: Rotates model automatically on Y-axis at ~0.5 rad/s
- **Always on Top**: Toggles window z-index priority
- **Ruler overlay**: Red pixel ruler (50px increments) appears when Move Window is active

### 5.5 System Tray
- Minimize to system tray instead of closing
- Tray icon: Rayquaza emoji or small icon
- Tray tooltip: "Mega Rayquaza Pet"
- Double-click tray → show pet
- Right-click tray → same context menu

---

## 6. File Structure

```
desktop_pet/
├── package.json
├── vite.config.js
├── electron-builder.json
├── src/
│   ├── main/
│   │   ├── main.js           # Electron main process
│   │   └── tray.js           # System tray handling
│   ├── preload/
│   │   └── preload.js        # IPC bridge (drag, context menu)
│   └── renderer/
│       ├── index.html
│       ├── main.js           # Three.js setup & render loop
│       ├── style.css
│       └── assets/
│           └── MegaRayquazaNLA.glb
└── build/
    └── icon.ico
```

---

## 7. Key Implementation Details

### IPC Channels
| Channel | Direction | Purpose |
|---------|-----------|---------|
| `drag-start` | renderer → main | Notify drag started |
| `drag-end` | renderer → main | Notify drag ended |
| `show-context-menu` | renderer → main | Trigger context menu |
| `toggle-always-on-top` | renderer → main | Toggle window flag |

### Drag Detection Logic
```
mousedown:
  record startX, startY, startTime

mousemove (while down):
  distance = sqrt((x - startX)² + (y - startY)²)
  elapsed = now - startTime

  if (distance > 5px AND elapsed > 150ms):
    → trigger drag (window.dragMove())
    → disable orbit controls
    → clear drag state
  else if (distance <= 5px AND elapsed > 300ms):
    → enable orbit controls for rotation
```

---

## 8. Context Menu Behavior

| Action | Behavior |
|--------|----------|
| Click "Always on Top" | Toggle checkmark + `win.setAlwaysOnTop(!current)` |
| Click "Show Pet" | `win.show()`, `win.focus()` |
| Click "Hide Pet" | `win.hide()` |
| Click "Exit" | `app.quit()` |
| Click outside menu | Dismiss menu |

---

## 9. Error Handling

| Scenario | Handling |
|----------|----------|
| GLB file not found | Show error overlay, disable 3D render |
| WebGL not supported | Show fallback message |
| Window off-screen on startup | Reset to bottom-right corner |

---

## 10. Out of Scope (v1)

- Animation blending between multiple animations
- Loading `MegaRayquazaExport.glb` with 4 animations
- Resizable window
- Background click-through mode
- Persistent position storage
- Custom window opacity
- Sound effects

---

## 11. Success Criteria

- [ ] App launches without errors
- [ ] Transparent frameless window appears at bottom-right
- [ ] Rayquaza model renders and animates (loop)
- [ ] Drag window by clicking anywhere
- [ ] Rotate camera by click+drag on model
- [ ] Right-click shows context menu
- [ ] Always on top toggle works
- [ ] Hide/show pet via menu
- [ ] System tray icon present
- [ ] Exit via menu closes app cleanly

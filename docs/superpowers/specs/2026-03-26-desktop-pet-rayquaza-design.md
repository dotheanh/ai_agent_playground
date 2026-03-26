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
- **Size:** 200x200px (default)
- **Frame:** Frameless (no title bar, no native controls)
- **Background:** Fully transparent (transparent: true)
- **Always on top:** true (via `setAlwaysOnTop`)
- **Resizable:** false (fixed size)
- **Initial position:** Bottom-right corner of primary screen
- **Skip taskbar:** true (no taskbar icon)
- **Focusable:** false (click-through when not interacting)

---

## 4. Visual Design

### Color Palette
- Context menu background: `#1a1a2e` (dark blue)
- Context menu text: `#eaeaea`
- Context menu hover: `#16213e`
- Context menu accent: `#e94560`

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

### 5.3 3D Rotation (Orbit Controls)
- After drag threshold not met + mouse moves → enable orbit controls
- Left-click drag on model → rotate camera around model
- Orbit controls with:
  - `enableZoom: false`
  - `enablePan: false`
  - `rotateSpeed: 0.5`
  - `minPolarAngle: 0.5`
  - `maxPolarAngle: Math.PI - 0.5`

### 5.4 Context Menu (Right-Click)
```
┌────────────────────────┐
│ ☑ Always on Top        │  ← Toggle always-on-top
│ ─────────────────────  │
│ Show Pet               │  ← Show window (if hidden)
│ Hide Pet               │  ← Hide window (minimize to tray)
│ ─────────────────────  │
│ Exit                   │  ← Quit application
└────────────────────────┘
```

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

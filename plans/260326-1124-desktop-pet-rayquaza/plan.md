# Desktop Pet Rayquaza - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a desktop overlay widget displaying an animated 3D Mega Rayquaza model.

**Spec:** `docs/superpowers/specs/2026-03-26-desktop-pet-rayquaza-design.md`

---

## Phases

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1 | Task 1 | Initialize project structure |
| Phase 2 | Task 2-3 | Electron main process + preload |
| Phase 3 | Task 4-5 | Renderer (HTML/CSS/Three.js) |
| Phase 4 | Task 6-7 | Drag + rotation + context menu |
| Phase 5 | Task 8-9 | Build & package |
| Phase 6 | Task 10 | Testing & verification |

---

## Quick Start

```bash
cd desktop_pet
npm install
npm run dev
```

## Build

```bash
npm run build:win
```

Output: `dist/Desktop Pet Rayquaza.exe`

---

## File Structure

```
desktop_pet/
├── package.json
├── vite.config.js
├── electron-builder.json
├── src/
│   ├── main/main.js
│   ├── preload/preload.js
│   └── renderer/
│       ├── index.html
│       ├── main.js
│       ├── style.css
│       └── assets/MegaRayquazaNLA.glb
└── build/
```

---

## Success Criteria

- [ ] App launches without errors
- [ ] Transparent frameless window at bottom-right
- [ ] Rayquaza model renders + loops animation
- [ ] Drag window anywhere
- [ ] Rotate camera by click-drag
- [ ] Right-click context menu
- [ ] Always on top toggle
- [ ] System tray icon
- [ ] Exit via menu

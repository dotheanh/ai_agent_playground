# Desktop Pet Rayquaza - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a desktop overlay widget displaying an animated 3D Mega Rayquaza model with drag, rotate, context menu, and system tray functionality.

**Architecture:** Electron frameless transparent window hosting Three.js WebGL canvas. IPC bridge via preload script for drag operations and context menu. Main process handles window management, tray, and system integration.

**Tech Stack:** Electron, Three.js, Vite, electron-builder

---

## File Structure

```
desktop_pet/
├── package.json
├── vite.config.js
├── electron-builder.json
├── src/
│   ├── main/
│   │   ├── main.js           # Electron main process, window config
│   │   └── tray.js           # System tray handling
│   ├── preload/
│   │   └── preload.js       # IPC bridge
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

## Task 1: Initialize Project Structure

**Files:**
- Create: `desktop_pet/package.json`
- Create: `desktop_pet/vite.config.js`
- Create: `desktop_pet/electron-builder.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "desktop-pet-rayquaza",
  "version": "1.0.0",
  "description": "Desktop Pet Rayquaza - 3D animated mascot",
  "main": "src/main/main.js",
  "scripts": {
    "dev": "concurrently \"npm run dev:vite\" \"npm run dev:electron\"",
    "dev:vite": "vite",
    "dev:electron": "wait-on http://localhost:5173 && electron .",
    "build": "vite build && electron-builder",
    "build:win": "vite build && electron-builder --win"
  },
  "devDependencies": {
    "concurrently": "^8.2.0",
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0",
    "vite": "^5.0.0",
    "wait-on": "^7.2.0"
  },
  "dependencies": {
    "three": "^0.160.0"
  },
  "build": {
    "appId": "com.desktoppet.rayquaza",
    "productName": "Desktop Pet Rayquaza",
    "directories": {
      "output": "dist"
    },
    "files": [
      "src/**/*",
      "dist-renderer/**/*"
    ],
    "win": {
      "target": "portable",
      "icon": "build/icon.ico"
    }
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```javascript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src/renderer',
  base: './',
  build: {
    outDir: '../../dist-renderer',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
    },
  },
});
```

- [ ] **Step 3: Create electron-builder.json**

```json
{
  "appId": "com.desktoppet.rayquaza",
  "productName": "Desktop Pet Rayquaza",
  "directories": {
    "output": "dist"
  },
  "files": [
    "src/**/*",
    "dist-renderer/**/*"
  ],
  "win": {
    "target": "portable",
    "icon": "build/icon.ico"
  }
}
```

- [ ] **Step 4: Install dependencies**

Run: `cd desktop_pet && npm install`
Expected: Dependencies installed successfully

- [ ] **Step 5: Create directory structure**

Run: `mkdir -p desktop_pet/src/main desktop_pet/src/preload desktop_pet/src/renderer/assets desktop_pet/build`

---

## Task 2: Electron Main Process

**Files:**
- Create: `desktop_pet/src/main/main.js`
- Modify: `desktop_pet/src/main/tray.js`

- [ ] **Step 1: Create main.js**

```javascript
const { app, BrowserWindow, screen, Menu, Tray, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let isAlwaysOnTop = true;

const isDev = !app.isPackaged;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: 200,
    height: 200,
    x: width - 220,
    y: height - 220,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: isAlwaysOnTop,
    skipTaskbar: true,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173/');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist-renderer/index.html'));
  }

  // Optional: show devtools in dev mode
  // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

function createTray() {
  // Create a simple 16x16 icon (blue square as placeholder)
  const icon = nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip('Mega Rayquaza Pet');

  updateTrayMenu();

  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Always on Top',
      type: 'checkbox',
      checked: isAlwaysOnTop,
      click: () => toggleAlwaysOnTop(),
    },
    { type: 'separator' },
    {
      label: 'Show Pet',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    {
      label: 'Hide Pet',
      click: () => {
        mainWindow.hide();
      },
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function toggleAlwaysOnTop() {
  isAlwaysOnTop = !isAlwaysOnTop;
  mainWindow.setAlwaysOnTop(isAlwaysOnTop);
  updateTrayMenu();

  // Notify renderer of state change
  mainWindow.webContents.send('always-on-top-changed', isAlwaysOnTop);
}

function showContextMenu() {
  const template = [
    {
      label: 'Always on Top',
      type: 'checkbox',
      checked: isAlwaysOnTop,
      click: () => toggleAlwaysOnTop(),
    },
    { type: 'separator' },
    {
      label: 'Show Pet',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    {
      label: 'Hide Pet',
      click: () => {
        mainWindow.hide();
      },
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        app.quit();
      },
    },
  ];

  const contextMenu = Menu.buildFromTemplate(template);
  contextMenu.popup({ window: mainWindow });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // Don't quit on window close, keep in tray
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  // Actually quit when app is closed
});

// IPC handlers
const { ipcMain } = require('electron');

ipcMain.on('show-context-menu', () => {
  showContextMenu();
});

ipcMain.on('toggle-always-on-top', () => {
  toggleAlwaysOnTop();
});

ipcMain.on('drag-start', () => {
  // Handled by drag move
});

ipcMain.on('show-window', () => {
  mainWindow.show();
  mainWindow.focus();
});

ipcMain.on('hide-window', () => {
  mainWindow.hide();
});

ipcMain.handle('get-always-on-top', () => {
  return isAlwaysOnTop;
});
```

- [ ] **Step 2: Create empty tray.js placeholder**

```javascript
// System tray is handled in main.js
// This file is kept for future expansion
```

- [ ] **Step 3: Test main process**

Run: `cd desktop_pet && npm run dev:electron` (in separate terminal after vite started)
Expected: Electron window opens at bottom-right corner

---

## Task 3: Preload Script (IPC Bridge)

**Files:**
- Create: `desktop_pet/src/preload/preload.js`

- [ ] **Step 1: Create preload.js**

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Context menu
  showContextMenu: () => ipcRenderer.send('show-context-menu'),

  // Always on top
  toggleAlwaysOnTop: () => ipcRenderer.send('toggle-always-on-top'),
  getAlwaysOnTop: () => ipcRenderer.invoke('get-always-on-top'),
  onAlwaysOnTopChanged: (callback) => {
    ipcRenderer.on('always-on-top-changed', (event, value) => callback(value));
  },

  // Window visibility
  showWindow: () => ipcRenderer.send('show-window'),
  hideWindow: () => ipcRenderer.send('hide-window'),

  // Drag detection
  onDragStart: (callback) => {
    ipcRenderer.on('drag-start', callback);
  },
});
```

---

## Task 4: Renderer - HTML & CSS

**Files:**
- Create: `desktop_pet/src/renderer/index.html`
- Create: `desktop_pet/src/renderer/style.css`

- [ ] **Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Desktop Pet Rayquaza</title>
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  <div id="app">
    <div id="canvas-container"></div>
    <div id="error-overlay" class="hidden">
      <span>WebGL not supported</span>
    </div>
  </div>
  <script type="module" src="./main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create style.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
  -webkit-app-region: no-drag;
}

#app {
  width: 200px;
  height: 200px;
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: transparent;
}

#canvas-container {
  width: 100%;
  height: 100%;
  -webkit-app-region: drag;
}

#canvas-container canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}

#error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  color: #e94560;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Segoe UI', sans-serif;
  font-size: 13px;
  border-radius: 20px;
}

#error-overlay.hidden {
  display: none;
}

/* Drag cursor */
#canvas-container.dragging {
  cursor: grabbing;
}

#canvas-container.rotating {
  cursor: grab;
}
```

---

## Task 5: Renderer - Three.js Setup

**Files:**
- Create: `desktop_pet/src/renderer/main.js`
- Copy: `desktop_pet/assets/MegaRayquazaNLA.glb` → `desktop_pet/src/renderer/assets/`

- [ ] **Step 1: Create main.js - Three.js setup**

```javascript
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.set(0, 1, 5);

// Renderer with transparency
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(200, 200);
renderer.setClearColor(0x000000, 0);
container.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.rotateSpeed = 0.5;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = Math.PI - 0.5;
controls.enabled = false;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Load model
const loader = new GLTFLoader();
let mixer = null;

loader.load(
  './assets/MegaRayquazaNLA.glb',
  (gltf) => {
    const model = gltf.scene;

    // Center and scale model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    model.scale.setScalar(scale);

    model.position.x = -center.x * scale;
    model.position.y = -center.y * scale;
    model.position.z = -center.z * scale;

    scene.add(model);

    // Setup animation
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.play();
        action.setLoop(THREE.LoopRepeat, Infinity);
      });
    }
  },
  (progress) => {
    console.log('Loading:', (progress.loaded / progress.total * 100).toFixed(1) + '%');
  },
  (error) => {
    console.error('Error loading model:', error);
    showError('Failed to load model');
  }
);

// Show error overlay
function showError(message) {
  const overlay = document.getElementById('error-overlay');
  overlay.classList.remove('hidden');
  overlay.querySelector('span').textContent = message;
}

// Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // Update animation mixer
  if (mixer) {
    mixer.update(delta);
  }

  // Auto-rotate when not interacting
  if (!controls.enabled) {
    scene.rotation.y += 0.002;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

// Handle resize
function onResize() {
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = 1;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

window.addEventListener('resize', onResize);
```

- [ ] **Step 2: Copy GLB file**

Run: `cp desktop_pet/MegaRayquazaNLA.glb desktop_pet/src/renderer/assets/`

---

## Task 6: Drag & Rotation Logic

**Files:**
- Modify: `desktop_pet/src/renderer/main.js`

- [ ] **Step 1: Add drag detection and orbit controls toggle**

Add this code to `main.js` after the `animate()` function call:

```javascript
// Drag detection
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartTime = 0;
let hasMoved = false;

const canvas = renderer.domElement;

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return; // Only left click

  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragStartTime = Date.now();
  hasMoved = false;

  canvas.classList.add('dragging');
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const distance = Math.sqrt(
    Math.pow(e.clientX - dragStartX, 2) +
    Math.pow(e.clientY - dragStartY, 2)
  );
  const elapsed = Date.now() - dragStartTime;

  // Drag threshold: 5px and 150ms
  if (distance > 5 && elapsed > 150 && !hasMoved) {
    hasMoved = true;
    canvas.classList.remove('dragging');

    // Electron drag move
    if (window.electronAPI) {
      // Use webContents to execute drag
      const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };
      // Fallback: use native drag if available
      canvas.style.webkitAppRegion = 'drag';
    }
  }

  // After 300ms without drag, enable rotation
  if (!hasMoved && elapsed > 300) {
    controls.enabled = true;
    canvas.classList.remove('dragging');
    canvas.classList.add('rotating');
  }
});

document.addEventListener('mouseup', () => {
  if (!isDragging) return;

  isDragging = false;
  canvas.classList.remove('dragging', 'rotating');

  if (!hasMoved) {
    // It was a click, not a drag
    controls.enabled = true;
  } else {
    controls.enabled = false;
  }

  canvas.style.webkitAppRegion = 'no-drag';
});

// Right-click context menu
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (window.electronAPI) {
    window.electronAPI.showContextMenu();
  }
});
```

---

## Task 7: Context Menu Integration

**Files:**
- Modify: `desktop_pet/src/renderer/main.js`
- Modify: `desktop_pet/src/renderer/style.css`

- [ ] **Step 1: Add always-on-top state listener**

Add to `main.js` after the event listeners:

```javascript
// Listen for always-on-top changes from main process
if (window.electronAPI) {
  window.electronAPI.onAlwaysOnTopChanged((value) => {
    console.log('Always on top:', value);
  });
}
```

- [ ] **Step 2: Test context menu**

Run: `cd desktop_pet && npm run dev`
Expected: Right-click shows context menu with options

---

## Task 8: Create Icon (Placeholder)

**Files:**
- Create: `desktop_pet/build/icon.ico`

- [ ] **Step 1: Create placeholder icon**

Since we need an icon for the build, create a simple placeholder.
For now, we can skip this step and configure electron-builder to not require icon, or use a default.

Modify `package.json` to add:
```json
"build": {
  "win": {
    "target": "portable"
  }
}
```

Or create a simple 256x256 PNG and convert to ICO using online tools.

---

## Task 9: Build & Package

**Files:**
- Modify: `desktop_pet/package.json`

- [ ] **Step 1: Final build**

Run: `cd desktop_pet && npm run build:win`
Expected: Creates `dist/Desktop Pet Rayquaza.exe`

---

## Task 10: Testing & Verification

**Files:**
- Test: `dist/Desktop Pet Rayquaza.exe`

- [ ] **Step 1: Run exe and verify**

Manual testing checklist:
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

---

## Spec Coverage Check

| Spec Section | Task(s) |
|--------------|---------|
| 3.1 3D Model Rendering | Task 5 |
| 3.2 Drag & Drop | Task 6 |
| 3.3 3D Rotation | Task 6 |
| 3.4 Context Menu | Task 7 |
| 3.5 System Tray | Task 2 |
| Window Config | Task 2 |
| IPC Channels | Task 3 |

---

## Potential Issues & Fixes

1. **Drag not working on transparent window**: Use `-webkit-app-region: drag` CSS + Electron's native drag
2. **WebGL context lost**: Handle `webglcontextlost` event
3. **Model too large/small**: Adjust scale calculation in Task 5
4. **Orbit controls conflict with drag**: Strict drag threshold logic prevents conflict

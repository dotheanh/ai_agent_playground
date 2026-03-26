import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================
// ALWAYS ON TOP STATE LISTENER
// ============================================

if (window.electronAPI) {
  window.electronAPI.onAlwaysOnTopChanged((value) => {
    console.log('Always on top:', value);
    isAlwaysOnTop = value; // Sync local state
  });
}

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
renderer.setSize(400, 450);
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

    // Center and scale model to 60% of viewport
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 0.6 / maxDim;
    model.scale.setScalar(scale);

    model.position.x = -center.x * scale;
    model.position.y = -center.y * scale;
    model.position.z = -center.z * scale;

    scene.add(model);

    // Setup animation loop
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

// ============================================
// INTERACTION: ORBIT + MOVE (ONE-SHOT) + AUTO-ROTATE
// ============================================

const canvas = renderer.domElement;
let isDragging = false; // For move mode
let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
let autoRotate = false; // Auto-rotate toggle
let isAlwaysOnTop = true; // Local state for always-on-top
let dragStartX = 0, dragStartY = 0; // For manual window drag
const clock = new THREE.Clock();

// Auto-rotate: rotate model slowly in animation loop
function updateAutoRotate(delta) {
  if (autoRotate && !isMouseDown) {
    scene.rotation.y += delta * 0.5; // Slow rotation
  }
}

// Update cursor
function updateCursor() {
  canvas.style.cursor = isDragging ? 'move' : 'grab';
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // Update animation mixer
  if (mixer) {
    mixer.update(delta);
  }

  // Auto-rotate if enabled
  updateAutoRotate(delta);

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

updateCursor();

// ============================================
// RULER OVERLAY FOR MOVE MODE
// ============================================
function showRulerOverlay() {
  const existing = document.getElementById('ruler-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'ruler-overlay';
  const W = 400, H = 450;

  // Build ruler marks HTML
  let rulerHTML = '';
  for (let i = 0; i <= W; i += 50) {
    rulerHTML += `<div class="ruler-mark" style="left:${i}px"><span>${i}</span></div>`;
  }
  for (let i = 0; i <= H; i += 50) {
    rulerHTML += `<div class="ruler-mark-v" style="top:${i}px"><span>${i}</span></div>`;
  }

  overlay.innerHTML = `
    <div class="ruler-corner tl"></div>
    <div class="ruler-corner tr"></div>
    <div class="ruler-corner bl"></div>
    <div class="ruler-corner br"></div>
    ${rulerHTML}
  `;
  overlay.style.cssText = `
    position: absolute;
    top: 0; left: 0; width: ${W}px; height: ${H}px;
    pointer-events: none;
    -webkit-app-region: no-drag;
    z-index: 0;
    box-sizing: border-box;
  `;

  const style = document.createElement('style');
  style.textContent = `
    .ruler-corner {
      position: absolute;
      width: 12px; height: 12px;
      border-color: #ff3333;
      border-style: solid;
    }
    .ruler-corner.tl { top: 0; left: 0; border-width: 3px 0 0 3px; }
    .ruler-corner.tr { top: 0; right: 0; border-width: 3px 3px 0 0; }
    .ruler-corner.bl { bottom: 0; left: 0; border-width: 0 0 3px 3px; }
    .ruler-corner.br { bottom: 0; right: 0; border-width: 0 3px 3px 0; }
    .ruler-mark {
      position: absolute; top: 0;
      width: 1px; height: 8px;
      background: rgba(255,50,50,0.6);
    }
    .ruler-mark span {
      position: absolute; top: 10px; left: 2px;
      font-size: 9px; color: #ff3333;
      font-family: 'Courier New', monospace;
      white-space: nowrap;
    }
    .ruler-mark-v {
      position: absolute; left: 0;
      height: 1px; width: 8px;
      background: rgba(255,50,50,0.6);
    }
    .ruler-mark-v span {
      position: absolute; left: 10px; top: -5px;
      font-size: 9px; color: #ff3333;
      font-family: 'Courier New', monospace;
      white-space: nowrap;
    }
  `;
  overlay.appendChild(style);
  document.body.appendChild(overlay);
}

function hideRulerOverlay() {
  const existing = document.getElementById('ruler-overlay');
  if (existing) existing.remove();
}

// Left-click: orbit rotation OR one-shot move
canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;

  isMouseDown = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mousemove', (e) => {
  if (!isMouseDown) return;

  if (isDragging) {
    // Move window by updating position via IPC
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    const newX = window.screenX + deltaX;
    const newY = window.screenY + deltaY;
    if (window.electronAPI) {
      window.electronAPI.setWindowPosition(newX, newY);
    }
    return;
  }

  // Rotate model
  const deltaX = e.clientX - lastMouseX;
  const deltaY = e.clientY - lastMouseY;
  scene.rotation.y += deltaX * 0.01;
  scene.rotation.x += deltaY * 0.01;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

canvas.addEventListener('mouseup', () => {
  if (!isMouseDown) return;
  isMouseDown = false;

  if (isDragging) {
    // One-shot: reset to orbit mode after move
    isDragging = false;
    hideRulerOverlay();
    updateCursor();
  }

  canvas.style.cursor = 'grab';
});

canvas.addEventListener('mouseleave', () => {
  isMouseDown = false;
});

// Right-click = custom context menu
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  showCustomContextMenu(e.clientX, e.clientY);
});

// Hide context menu on click outside
document.addEventListener('click', (e) => {
  const menu = document.getElementById('custom-context-menu');
  if (menu && !menu.contains(e.target)) {
    menu.remove();
  }
});

// Custom context menu
function showCustomContextMenu(x, y) {
  const existingMenu = document.getElementById('custom-context-menu');
  if (existingMenu) existingMenu.remove();

  const menu = document.createElement('div');
  menu.id = 'custom-context-menu';
  menu.innerHTML = `
    <div class="menu-item" data-action="toggle-move">${isDragging ? 'Orbit Camera' : 'Move Window'}</div>
    <div class="menu-item" data-action="toggle-auto">${autoRotate ? '✓ Auto-Rotate' : 'Auto-Rotate'}</div>
    <div class="menu-separator"></div>
    <div class="menu-item" data-action="always-on-top">${isAlwaysOnTop ? '✓ Always on Top' : 'Always on Top'}</div>
    <div class="menu-separator"></div>
    <div class="menu-item" data-action="exit">Exit</div>
  `;
  menu.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    background: #0d0d0d;
    border: 1px solid #cc0000;
    border-radius: 8px;
    padding: 4px 0;
    min-width: 160px;
    z-index: 9999;
    box-shadow: 0 4px 16px rgba(200,0,0,0.3);
    font-family: 'Segoe UI', sans-serif;
    font-size: 13px;
    color: #e0e0e0;
  `;

  const style = document.createElement('style');
  style.textContent = `
    .menu-item { padding: 8px 16px; cursor: pointer; transition: background 0.15s; }
    .menu-item:hover { background: #cc0000; color: #fff; }
    .menu-separator { height: 1px; background: #cc0000; margin: 4px 8px; opacity: 0.4; }
  `;
  menu.appendChild(style);

  menu.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action || !window.electronAPI) return;

    switch (action) {
      case 'toggle-move':
        isDragging = !isDragging;
        updateCursor();
        // Toggle ruler with move mode
        if (isDragging) showRulerOverlay(); else hideRulerOverlay();
        break;
      case 'toggle-auto':
        autoRotate = !autoRotate;
        break;
      case 'always-on-top':
        window.electronAPI.toggleAlwaysOnTop();
        break;
      case 'exit':
        window.electronAPI.exitApp();
        break;
    }
    menu.remove();
  });

  document.body.appendChild(menu);

  // Adjust position if off screen
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) menu.style.left = (x - rect.width) + 'px';
  if (rect.bottom > window.innerHeight) menu.style.top = (y - rect.height) + 'px';
}

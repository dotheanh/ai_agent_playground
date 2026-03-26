import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================
// ALWAYS ON TOP STATE LISTENER
// ============================================

if (window.electronAPI) {
  window.electronAPI.onAlwaysOnTopChanged((value) => {
    console.log('Always on top:', value);
  });

  // Listen for drag trigger from menu - Windows will handle the drag
  window.electronAPI.onTriggerDrag(() => {
    // Enable drag on canvas, then let Windows native drag take over
    canvas.style.webkitAppRegion = 'drag';
    // Trigger a mousedown at center to start native drag
    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: window.innerWidth / 2,
      clientY: window.innerHeight / 2
    });
    canvas.dispatchEvent(event);
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

// Left-click: orbit rotation OR one-shot move
canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;

  isMouseDown = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  canvas.style.cursor = 'grabbing';

  if (isDragging) {
    // Enable drag for one-shot move
    canvas.style.webkitAppRegion = 'drag';
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!isMouseDown) return;

  // Always rotate model
  const deltaX = e.clientX - lastMouseX;
  const deltaY = e.clientY - lastMouseY;
  scene.rotation.y += deltaX * 0.01;
  scene.rotation.x += deltaY * 0.01;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

canvas.addEventListener('mouseup', () => {
  isMouseDown = false;
  canvas.style.cursor = isDragging ? 'move' : 'grab';

  if (isDragging) {
    // One-shot: disable drag after move
    canvas.style.webkitAppRegion = 'no-drag';
  }
});

canvas.addEventListener('mouseleave', () => {
  isMouseDown = false;
  if (isDragging) {
    canvas.style.webkitAppRegion = 'no-drag';
  }
  updateCursor();
});

// Right-click = custom context menu
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  canvas.style.webkitAppRegion = 'no-drag';
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
    <div class="menu-item" data-action="toggle-auto">${autoRotate ? 'Stop Auto-Rotate' : 'Auto-Rotate'}</div>
    <div class="menu-separator"></div>
    <div class="menu-item" data-action="always-on-top">Always on Top</div>
    <div class="menu-separator"></div>
    <div class="menu-item" data-action="exit">Exit</div>
  `;
  menu.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    background: #1a1a2e;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 4px 0;
    min-width: 160px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    font-family: 'Segoe UI', sans-serif;
    font-size: 13px;
    color: #eaeaea;
  `;

  const style = document.createElement('style');
  style.textContent = `
    .menu-item { padding: 8px 16px; cursor: pointer; transition: background 0.15s; }
    .menu-item:hover { background: #16213e; color: #fff; }
    .menu-separator { height: 1px; background: #333; margin: 4px 8px; }
  `;
  menu.appendChild(style);

  menu.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action || !window.electronAPI) return;

    switch (action) {
      case 'toggle-move':
        isDragging = !isDragging;
        updateCursor();
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

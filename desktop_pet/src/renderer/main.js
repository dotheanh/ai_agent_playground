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

// ============================================
// DRAG DETECTION & ORBIT CONTROLS TOGGLE
// ============================================

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

    // Trigger window drag using -webkit-app-region
    canvas.style.webkitAppRegion = 'drag';
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
    // It was a click - enable rotation mode
    controls.enabled = true;
  } else {
    // Was a drag - disable controls, restore auto-rotate
    controls.enabled = false;
  }

  // Reset drag region
  canvas.style.webkitAppRegion = 'no-drag';
});

// Right-click context menu
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (window.electronAPI) {
    window.electronAPI.showContextMenu();
  }
});

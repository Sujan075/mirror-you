import * as THREE from 'three';
import './style.css';
import { Room } from './world/Room.ts';
import { PlayerController } from './player/PlayerController.ts';

const appElement = document.querySelector<HTMLDivElement>('#app');

if (!appElement) {
  throw new Error('Root #app container not found');
}

// Populate UI overlays
appElement.innerHTML = `
  <div id="crosshair"></div>
  <div id="instructions">
    <div class="instructions-card">
      <h1>MIRROR // YOU</h1>
      <p class="prompt">Click anywhere to enter</p>
      <div class="controls-hint">
        <span><strong>WASD</strong> Move</span>
        <span><strong>Mouse</strong> Look</span>
        <span><strong>ESC</strong> Pause</span>
      </div>
    </div>
  </div>
`;

const instructionsElement = document.querySelector<HTMLDivElement>('#instructions')!;

// 1. Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x282c34);

// 2. Perspective Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

// 3. WebGL Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
appElement.appendChild(renderer.domElement);

// 4. Room & Lighting
const room = new Room();
scene.add(room.group);

// 5. Player Controller (First-person mouse-look + WASD)
const player = new PlayerController(camera, renderer.domElement);

// Manage pointer lock overlay
instructionsElement.addEventListener('click', () => {
  player.lock();
});

player.onLockStateChange((isLocked) => {
  if (isLocked) {
    instructionsElement.classList.add('hidden');
  } else {
    instructionsElement.classList.remove('hidden');
  }
});

// 6. Responsive resizing
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 7. Animation / Tick loop
let lastTime = performance.now();

function animate(): void {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  player.update(delta, room.bounds);

  renderer.render(scene, camera);
}

animate();

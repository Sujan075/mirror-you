import * as THREE from 'three';
import './style.css';
import { Room } from './world/Room.ts';
import { PlayerController } from './player/PlayerController.ts';
import { InteractionManager } from './interaction/InteractionManager.ts';
import { TestPedestal } from './interaction/TestPedestal.ts';

const appElement = document.querySelector<HTMLDivElement>('#app');

if (!appElement) {
  throw new Error('Root #app container not found');
}

// Populate UI overlays
appElement.innerHTML = `
  <div id="crosshair"></div>
  <div id="interaction-prompt" class="hidden"></div>
  <div id="interaction-message" class="hidden"></div>
  <div id="instructions">
    <div class="instructions-card">
      <h1>MIRROR // YOU</h1>
      <p class="prompt">Click anywhere to enter</p>
      <div class="controls-hint">
        <span><strong>WASD</strong> Move</span>
        <span><strong>Mouse</strong> Look</span>
        <span><strong>E</strong> Interact</span>
        <span><strong>ESC</strong> Pause</span>
      </div>
    </div>
  </div>
`;

const instructionsElement = document.querySelector<HTMLDivElement>('#instructions')!;
const interactionPromptElement = document.querySelector<HTMLDivElement>('#interaction-prompt')!;
const interactionMessageElement = document.querySelector<HTMLDivElement>('#interaction-message')!;

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

// 6. Interaction System
const interactionManager = new InteractionManager(camera, () => player.isLocked);

let messageTimeout: number | undefined;

function showInteractionMessage(text: string, durationMs: number = 3000): void {
  interactionMessageElement.textContent = text;
  interactionMessageElement.classList.remove('hidden');

  if (messageTimeout !== undefined) {
    window.clearTimeout(messageTimeout);
  }

  messageTimeout = window.setTimeout(() => {
    interactionMessageElement.classList.add('hidden');
    messageTimeout = undefined;
  }, durationMs);
}

// Create test interactable (pedestal in the room)
const testPedestal = new TestPedestal(() => {
  showInteractionMessage('The room is silent.');
});
scene.add(testPedestal.object);
interactionManager.register(testPedestal);

// Wire focus changes to HUD prompt
interactionManager.onFocusChange((focused) => {
  if (focused && player.isLocked) {
    interactionPromptElement.textContent = focused.prompt;
    interactionPromptElement.classList.remove('hidden');
  } else {
    interactionPromptElement.classList.add('hidden');
  }
});

// Manage pointer lock overlay
instructionsElement.addEventListener('click', () => {
  player.lock();
});

player.onLockStateChange((isLocked) => {
  if (isLocked) {
    instructionsElement.classList.add('hidden');
    const focused = interactionManager.getFocused();
    if (focused) {
      interactionPromptElement.textContent = focused.prompt;
      interactionPromptElement.classList.remove('hidden');
    }
  } else {
    instructionsElement.classList.remove('hidden');
    interactionPromptElement.classList.add('hidden');
  }
});

// 7. Responsive resizing
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 8. Animation / Tick loop
let lastTime = performance.now();

function animate(): void {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  player.update(delta, room.bounds);
  interactionManager.update();

  renderer.render(scene, camera);
}

animate();

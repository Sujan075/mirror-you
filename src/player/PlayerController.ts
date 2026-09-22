import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import type { RoomBounds } from '../world/Room.ts';

export const MOVE_SPEED = 4.0; // Units per second
export const PLAYER_EYE_HEIGHT = 1.6; // Eye level in meters
export const PLAYER_RADIUS = 0.4; // Distance margin from walls

export class PlayerController {
  public readonly controls: PointerLockControls;
  public readonly camera: THREE.PerspectiveCamera;

  private readonly keys: Record<string, boolean> = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,
  };

  private readonly onKeyDownBound: (event: KeyboardEvent) => void;
  private readonly onKeyUpBound: (event: KeyboardEvent) => void;
  private readonly lockCallbacks: Array<(isLocked: boolean) => void> = [];

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.camera.position.set(0, PLAYER_EYE_HEIGHT, 2);

    const lockTarget = domElement.ownerDocument?.body ?? domElement;
    this.controls = new PointerLockControls(this.camera, lockTarget);

    this.onKeyDownBound = this.onKeyDown.bind(this);
    this.onKeyUpBound = this.onKeyUp.bind(this);

    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);

    this.controls.addEventListener('lock', () => {
      this.notifyLockChange(true);
    });

    this.controls.addEventListener('unlock', () => {
      // Clear movement keys when pointer lock is lost
      for (const key of Object.keys(this.keys)) {
        this.keys[key] = false;
      }
      this.notifyLockChange(false);
    });
  }

  public onLockStateChange(callback: (isLocked: boolean) => void): void {
    this.lockCallbacks.push(callback);
  }

  private notifyLockChange(isLocked: boolean): void {
    for (const callback of this.lockCallbacks) {
      callback(isLocked);
    }
  }

  public lock(): void {
    this.controls.lock();
  }

  public unlock(): void {
    this.controls.unlock();
  }

  public get isLocked(): boolean {
    return this.controls.isLocked;
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.code in this.keys) {
      this.keys[event.code] = true;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    if (event.code in this.keys) {
      this.keys[event.code] = false;
    }
  }

  public update(delta: number, bounds: RoomBounds): void {
    if (!this.controls.isLocked) return;

    let forward = 0;
    let right = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) forward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) forward -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) right += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) right -= 1;

    if (forward !== 0 || right !== 0) {
      // Normalize diagonal input vector so diagonal speed is consistent
      const length = Math.hypot(forward, right);
      const normalizedForward = forward / length;
      const normalizedRight = right / length;

      const distance = MOVE_SPEED * delta;
      this.controls.moveForward(normalizedForward * distance);
      this.controls.moveRight(normalizedRight * distance);
    }

    // Maintain fixed eye height
    this.camera.position.y = PLAYER_EYE_HEIGHT;

    // Constrain within room boundaries
    const minX = bounds.minX + PLAYER_RADIUS;
    const maxX = bounds.maxX - PLAYER_RADIUS;
    const minZ = bounds.minZ + PLAYER_RADIUS;
    const maxZ = bounds.maxZ - PLAYER_RADIUS;

    this.camera.position.x = Math.max(minX, Math.min(maxX, this.camera.position.x));
    this.camera.position.z = Math.max(minZ, Math.min(maxZ, this.camera.position.z));
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    this.controls.dispose();
  }
}

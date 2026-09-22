import * as THREE from 'three';
import type { Interactable } from './Interactable.ts';

export class InteractionManager {
  public maxDistance: number = 2.5;

  private readonly camera: THREE.PerspectiveCamera;
  private readonly raycaster: THREE.Raycaster = new THREE.Raycaster();
  private readonly screenCenter: THREE.Vector2 = new THREE.Vector2(0, 0);

  private readonly interactables: Interactable[] = [];
  private focusedInteractable: Interactable | null = null;
  private readonly focusCallbacks: Array<(focused: Interactable | null) => void> = [];

  private readonly isLockedCallback?: () => boolean;
  private readonly onKeyDownBound: (event: KeyboardEvent) => void;

  constructor(camera: THREE.PerspectiveCamera, isLocked?: () => boolean) {
    this.camera = camera;
    this.isLockedCallback = isLocked;
    this.onKeyDownBound = this.onKeyDown.bind(this);
    window.addEventListener('keydown', this.onKeyDownBound);
  }

  public register(interactable: Interactable): void {
    if (!this.interactables.includes(interactable)) {
      this.interactables.push(interactable);
    }
  }

  public unregister(interactable: Interactable): void {
    const index = this.interactables.indexOf(interactable);
    if (index !== -1) {
      this.interactables.splice(index, 1);
      if (this.focusedInteractable === interactable) {
        this.setFocused(null);
      }
    }
  }

  public getFocused(): Interactable | null {
    return this.focusedInteractable;
  }

  public onFocusChange(callback: (focused: Interactable | null) => void): void {
    this.focusCallbacks.push(callback);
  }

  private setFocused(next: Interactable | null): void {
    if (this.focusedInteractable !== next) {
      this.focusedInteractable = next;
      for (const callback of this.focusCallbacks) {
        callback(next);
      }
    }
  }

  public update(): void {
    if (this.interactables.length === 0) {
      this.setFocused(null);
      return;
    }

    this.raycaster.setFromCamera(this.screenCenter, this.camera);
    this.raycaster.far = this.maxDistance;

    const targetObjects = this.interactables.map((i) => i.object);
    const hits = this.raycaster.intersectObjects(targetObjects, true);

    let nextFocused: Interactable | null = null;

    for (const hit of hits) {
      if (hit.distance > this.maxDistance) continue;

      // Find which registered interactable owns the hit object
      const matched = this.findInteractableForObject(hit.object);
      if (matched) {
        nextFocused = matched;
        break;
      }
    }

    this.setFocused(nextFocused);
  }

  private findInteractableForObject(hitObject: THREE.Object3D): Interactable | null {
    for (const interactable of this.interactables) {
      if (interactable.object === hitObject) {
        return interactable;
      }
      // Walk up the hierarchy in case hitObject is a child mesh of a group
      let current: THREE.Object3D | null = hitObject.parent;
      while (current) {
        if (current === interactable.object) {
          return interactable;
        }
        current = current.parent;
      }
    }
    return null;
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.code === 'KeyE' && !event.repeat) {
      const isLocked = this.isLockedCallback
        ? this.isLockedCallback()
        : document.pointerLockElement !== null;

      // Only interact when pointer lock is active and an interactable is focused
      if (isLocked && this.focusedInteractable !== null) {
        this.focusedInteractable.interact();
      }
    }
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.onKeyDownBound);
    this.interactables.length = 0;
    this.focusCallbacks.length = 0;
    this.focusedInteractable = null;
  }
}

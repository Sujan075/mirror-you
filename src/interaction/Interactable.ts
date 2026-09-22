import type * as THREE from 'three';

export interface Interactable {
  /** The 3D object or hierarchy that can be targeted by raycasting */
  readonly object: THREE.Object3D;

  /** The prompt text displayed to the player, e.g. "Press E to examine" */
  readonly prompt: string;

  /** Action invoked when player presses the interaction key while targeting this object */
  interact(): void;
}

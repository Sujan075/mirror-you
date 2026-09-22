import * as THREE from 'three';
import type { Interactable } from './Interactable.ts';

export class TestPedestal implements Interactable {
  public readonly object: THREE.Group;
  public readonly prompt: string = 'Press E to examine';

  private readonly onInteractCallback: () => void;

  constructor(onInteract: () => void) {
    this.onInteractCallback = onInteract;
    this.object = new THREE.Group();

    // 1. Pedestal pillar
    const pillarGeo = new THREE.BoxGeometry(0.7, 0.9, 0.7);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x3d444e,
      roughness: 0.7,
      metalness: 0.1,
    });
    const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
    pillarMesh.position.y = 0.45; // Base rests on the floor (Y = 0)
    this.object.add(pillarMesh);

    // 2. Object resting on the pedestal
    const plaqueGeo = new THREE.BoxGeometry(0.28, 0.1, 0.28);
    const plaqueMat = new THREE.MeshStandardMaterial({
      color: 0x8591a0,
      roughness: 0.4,
      metalness: 0.3,
    });
    const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaqueMesh.position.y = 0.95;
    this.object.add(plaqueMesh);

    // Place the pedestal in front of player spawn point (spawn is at Z = 2)
    this.object.position.set(0, 0, -1.5);
  }

  public interact(): void {
    this.onInteractCallback();
  }
}

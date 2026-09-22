import * as THREE from 'three';
import type { Room } from '../world/Room.ts';
import { ReflectionAvatar } from './ReflectionAvatar.ts';

/** Mirror plane world Z coordinate */
export const MIRROR_Z = -5.0;

/**
 * Transforms a real-world position to its mirrored counterpart across the Z = -5.0 plane.
 * Z_twin = 2 * Z_mirror - Z_real = -10.0 - Z_real.
 */
export function mirrorPosition(pos: THREE.Vector3 | [number, number, number]): THREE.Vector3 {
  const x = Array.isArray(pos) ? pos[0] : pos.x;
  const y = Array.isArray(pos) ? pos[1] : pos.y;
  const z = Array.isArray(pos) ? pos[2] : pos.z;
  return new THREE.Vector3(x, y, 2 * MIRROR_Z - z);
}

/**
 * Transforms an Euler rotation to its mirrored counterpart across the Z = -5.0 plane.
 * Under reflection across a plane perpendicular to Z:
 * Rotation around X inverts (-rx), rotation around Y inverts (-ry), rotation around Z is preserved (rz).
 */
export function mirrorRotation(rot: THREE.Euler | [number, number, number]): THREE.Euler {
  const rx = Array.isArray(rot) ? rot[0] : rot.x;
  const ry = Array.isArray(rot) ? rot[1] : rot.y;
  const rz = Array.isArray(rot) ? rot[2] : rot.z;
  return new THREE.Euler(-rx, -ry, rz);
}

/**
 * Creates a procedural 1m x 1m slate tile texture matching the real room floor.
 * Gracefully returns null in non-browser / headless test environments.
 */
function createFloorTileTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#56606d';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#3e4551';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, 512, 512);

  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 2;
  ctx.strokeRect(5, 5, 246, 246);
  ctx.strokeRect(261, 5, 246, 246);
  ctx.strokeRect(5, 261, 246, 246);
  ctx.strokeRect(261, 261, 246, 246);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 5);
  return texture;
}

/**
 * Constructs the separate 3D mirrored environment behind the mirror (Z in [-15, -5]).
 * Props are systematically derived from the real room's geometry via mirrorPosition / mirrorRotation.
 */
export class ReflectionRoom {
  public readonly group: THREE.Group;
  public readonly avatar: ReflectionAvatar;

  constructor(room?: Room, pedestalObject?: THREE.Object3D) {
    this.group = new THREE.Group();

    // Twin room dimensions matching the real room: width 8, height 3.2, depth 10
    // Spans Z from -5.0 to -15.0 (centered at Z = -10.0)
    const width = 8;
    const height = 3.2;
    const depth = 10;
    const centerZ = -10.0;

    this.createEnclosure(width, height, depth, centerZ);
    this.createTrims(width, height, depth, centerZ);
    this.createReflectedProps(room, pedestalObject);
    this.createReflectedLighting(height);

    // Humanoid avatar visible inside the twin room
    this.avatar = new ReflectionAvatar();
    this.group.add(this.avatar.root);
  }

  /** Twin floor, ceiling, and walls extending into Z in [-15, -5] */
  private createEnclosure(width: number, height: number, depth: number, centerZ: number): void {
    const floorTexture = createFloorTileTexture();

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x58626f,
      map: floorTexture,
      roughness: 0.65,
      metalness: 0.05,
    });

    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0xc4cbd4,
      roughness: 0.85,
    });

    const sideWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x76808c,
      roughness: 0.8,
    });

    const farWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x808a96, // Corresponds to real front wall
      roughness: 0.8,
    });

    // 1. Twin Floor (Y = 0, Z in [-15, -5])
    const floorGeo = new THREE.PlaneGeometry(width, depth);
    const floorMesh = new THREE.Mesh(floorGeo, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, centerZ);
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // 2. Twin Ceiling (Y = height, Z in [-15, -5])
    const ceilingGeo = new THREE.PlaneGeometry(width, depth);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMaterial);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(0, height, centerZ);
    this.group.add(ceilingMesh);

    // 3. Twin Far Wall (corresponds to real front wall at Z = 5.0, reflected to Z = -15.0)
    const farWallGeo = new THREE.PlaneGeometry(width, height);
    const farWallMesh = new THREE.Mesh(farWallGeo, farWallMaterial);
    farWallMesh.position.copy(mirrorPosition(new THREE.Vector3(0, height / 2, 5.0)));
    farWallMesh.receiveShadow = true;
    this.group.add(farWallMesh);

    // 4. Twin Left Wall (X = -width/2, Z in [-15, -5])
    const leftWallGeo = new THREE.PlaneGeometry(depth, height);
    const leftWallMesh = new THREE.Mesh(leftWallGeo, sideWallMaterial);
    leftWallMesh.rotation.y = Math.PI / 2;
    leftWallMesh.position.set(-width / 2, height / 2, centerZ);
    leftWallMesh.receiveShadow = true;
    this.group.add(leftWallMesh);

    // 5. Twin Right Wall (X = width/2, Z in [-15, -5])
    const rightWallGeo = new THREE.PlaneGeometry(depth, height);
    const rightWallMesh = new THREE.Mesh(rightWallGeo, sideWallMaterial);
    rightWallMesh.rotation.y = -Math.PI / 2;
    rightWallMesh.position.set(width / 2, height / 2, centerZ);
    rightWallMesh.receiveShadow = true;
    this.group.add(rightWallMesh);
  }

  /** Reflected baseboards, crown moldings, and dado chair-rail */
  private createTrims(width: number, height: number, depth: number, centerZ: number): void {
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x242830,
      roughness: 0.65,
    });

    const baseHeight = 0.15;
    const baseDepth = 0.04;

    // Far Wall Baseboard (mirrored from frontBase at Z = 5.0 - baseDepth/2 = 4.98)
    const farBaseGeo = new THREE.BoxGeometry(width, baseHeight, baseDepth);
    const farBase = new THREE.Mesh(farBaseGeo, trimMaterial);
    farBase.position.copy(mirrorPosition(new THREE.Vector3(0, baseHeight / 2, 5.0 - baseDepth / 2)));
    farBase.receiveShadow = true;
    this.group.add(farBase);

    // Left & Right Baseboards along twin room length (depth = 10, Z in [-15, -5])
    const sideBaseGeo = new THREE.BoxGeometry(baseDepth, baseHeight, depth);
    const leftBase = new THREE.Mesh(sideBaseGeo, trimMaterial);
    leftBase.position.set(-width / 2 + baseDepth / 2, baseHeight / 2, centerZ);
    leftBase.receiveShadow = true;
    this.group.add(leftBase);

    const rightBase = new THREE.Mesh(sideBaseGeo, trimMaterial);
    rightBase.position.set(width / 2 - baseDepth / 2, baseHeight / 2, centerZ);
    rightBase.receiveShadow = true;
    this.group.add(rightBase);

    // Far Wall Crown Molding (mirrored from frontCrown at Z = 5.0 - crownDepth/2 = 4.98)
    const crownHeight = 0.1;
    const crownDepth = 0.04;
    const farCrownGeo = new THREE.BoxGeometry(width, crownHeight, crownDepth);
    const farCrown = new THREE.Mesh(farCrownGeo, trimMaterial);
    farCrown.position.copy(mirrorPosition(new THREE.Vector3(0, height - crownHeight / 2, 5.0 - crownDepth / 2)));
    this.group.add(farCrown);

    // Left & Right Crown Moldings
    const sideCrownGeo = new THREE.BoxGeometry(crownDepth, crownHeight, depth);
    const leftCrown = new THREE.Mesh(sideCrownGeo, trimMaterial);
    leftCrown.position.set(-width / 2 + crownDepth / 2, height - crownHeight / 2, centerZ);
    this.group.add(leftCrown);

    const rightCrown = new THREE.Mesh(sideCrownGeo, trimMaterial);
    rightCrown.position.set(width / 2 - crownDepth / 2, height - crownHeight / 2, centerZ);
    this.group.add(rightCrown);

    // Far Wall Chair Rail (mirrored from frontRail at Z = 5.0 - railDepth/2 = 4.9875)
    const railHeight = 0.05;
    const railDepth = 0.025;
    const farRailGeo = new THREE.BoxGeometry(width, railHeight, railDepth);
    const farRail = new THREE.Mesh(farRailGeo, trimMaterial);
    farRail.position.copy(mirrorPosition(new THREE.Vector3(0, 1.0, 5.0 - railDepth / 2)));
    this.group.add(farRail);

    // Left & Right Chair Rails
    const sideRailGeo = new THREE.BoxGeometry(railDepth, railHeight, depth);
    const leftRail = new THREE.Mesh(sideRailGeo, trimMaterial);
    leftRail.position.set(-width / 2 + railDepth / 2, 1.0, centerZ);
    this.group.add(leftRail);

    const rightRail = new THREE.Mesh(sideRailGeo, trimMaterial);
    rightRail.position.set(width / 2 - railDepth / 2, 1.0, centerZ);
    this.group.add(rightRail);
  }

  /**
   * Systematically clones and mirrors a real-room prop group using
   * the exact reflection transformation:
   *   position' = mirrorPosition(position)
   *   rotation' = mirrorRotation(rotation)
   *   scale' = (1, 1, -1)
   */
  private mirrorProp(sourceGroup: THREE.Object3D): THREE.Object3D {
    const clone = sourceGroup.clone(true);
    clone.position.copy(mirrorPosition(sourceGroup.position));
    clone.rotation.copy(mirrorRotation(sourceGroup.rotation));
    clone.scale.set(1, 1, -1);
    this.group.add(clone);
    return clone;
  }

  /**
   * Derives all reflected props directly from the real room's geometry.
   */
  private createReflectedProps(room?: Room, pedestalObject?: THREE.Object3D): void {
    if (room) {
      if (room.table) this.mirrorProp(room.table);
      if (room.chair) this.mirrorProp(room.chair);
      if (room.exitDoor) this.mirrorProp(room.exitDoor);
      if (room.clock) this.mirrorProp(room.clock);
      if (room.framedPicture) this.mirrorProp(room.framedPicture);
      if (room.airVent) this.mirrorProp(room.airVent);
      if (room.ceilingFixture) this.mirrorProp(room.ceilingFixture);
    }

    if (pedestalObject) {
      this.mirrorProp(pedestalObject);
    }
  }

  /** Reflected ceiling fixture lighting casting contact shadows in the twin room */
  private createReflectedLighting(height: number): void {
    // Twin Room Ceiling Point Light (mirrored from real ceiling light at (0, height - 0.6, 0))
    const twinCeilingLight = new THREE.PointLight(0xfff2dc, 2.2, 14, 1.2);
    twinCeilingLight.position.copy(mirrorPosition(new THREE.Vector3(0, height - 0.6, 0)));
    twinCeilingLight.castShadow = true;
    twinCeilingLight.shadow.mapSize.width = 1024;
    twinCeilingLight.shadow.mapSize.height = 1024;
    twinCeilingLight.shadow.bias = -0.001;
    this.group.add(twinCeilingLight);
  }
}

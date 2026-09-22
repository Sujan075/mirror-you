import * as THREE from 'three';

export interface RoomBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export class Room {
  public readonly group: THREE.Group;
  public readonly bounds: RoomBounds;

  constructor() {
    this.group = new THREE.Group();

    // Dimensions: 8m wide (X), 3.2m high (Y), 10m deep (Z)
    const width = 8;
    const height = 3.2;
    const depth = 10;

    this.bounds = {
      minX: -width / 2,
      maxX: width / 2,
      minZ: -depth / 2,
      maxZ: depth / 2,
    };

    this.createGeometry(width, height, depth);
    this.createLighting(height);
  }

  private createGeometry(width: number, height: number, depth: number): void {
    // Clear, brightened materials for high visual readability
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x6e7886, // Clearly visible slate floor
      roughness: 0.65,
      metalness: 0.05,
    });

    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8ced6, // Light plaster/concrete ceiling
      roughness: 0.8,
    });

    const backWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x939da8, // Back wall (bright neutral tone)
      roughness: 0.75,
    });

    const frontWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x86909c, // Front wall
      roughness: 0.75,
    });

    const sideWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x7c8692, // Side walls
      roughness: 0.75,
    });

    // Dark contrasting trims delineate room boundaries sharply
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x22262d,
      roughness: 0.6,
    });

    // 1. Floor (Y = 0)
    const floorGeo = new THREE.PlaneGeometry(width, depth);
    const floorMesh = new THREE.Mesh(floorGeo, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    this.group.add(floorMesh);

    // 2. Ceiling (Y = height)
    const ceilingGeo = new THREE.PlaneGeometry(width, depth);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMaterial);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.y = height;
    this.group.add(ceilingMesh);

    // 3. Back Wall (Z = -depth/2)
    const backWallGeo = new THREE.PlaneGeometry(width, height);
    const backWallMesh = new THREE.Mesh(backWallGeo, backWallMaterial);
    backWallMesh.position.set(0, height / 2, -depth / 2);
    this.group.add(backWallMesh);

    // 4. Front Wall (Z = depth/2)
    const frontWallGeo = new THREE.PlaneGeometry(width, height);
    const frontWallMesh = new THREE.Mesh(frontWallGeo, frontWallMaterial);
    frontWallMesh.rotation.y = Math.PI;
    frontWallMesh.position.set(0, height / 2, depth / 2);
    this.group.add(frontWallMesh);

    // 5. Left Wall (X = -width/2)
    const leftWallGeo = new THREE.PlaneGeometry(depth, height);
    const leftWallMesh = new THREE.Mesh(leftWallGeo, sideWallMaterial);
    leftWallMesh.rotation.y = Math.PI / 2;
    leftWallMesh.position.set(-width / 2, height / 2, 0);
    this.group.add(leftWallMesh);

    // 6. Right Wall (X = width/2)
    const rightWallGeo = new THREE.PlaneGeometry(depth, height);
    const rightWallMesh = new THREE.Mesh(rightWallGeo, sideWallMaterial);
    rightWallMesh.rotation.y = -Math.PI / 2;
    rightWallMesh.position.set(width / 2, height / 2, 0);
    this.group.add(rightWallMesh);

    // --- Baseboards (Floor boundary trims) ---
    const trimHeight = 0.15;
    const trimDepth = 0.04;

    const zBaseGeo = new THREE.BoxGeometry(width, trimHeight, trimDepth);
    const backBase = new THREE.Mesh(zBaseGeo, trimMaterial);
    backBase.position.set(0, trimHeight / 2, -depth / 2 + trimDepth / 2);
    this.group.add(backBase);

    const frontBase = new THREE.Mesh(zBaseGeo, trimMaterial);
    frontBase.position.set(0, trimHeight / 2, depth / 2 - trimDepth / 2);
    this.group.add(frontBase);

    const xBaseGeo = new THREE.BoxGeometry(trimDepth, trimHeight, depth);
    const leftBase = new THREE.Mesh(xBaseGeo, trimMaterial);
    leftBase.position.set(-width / 2 + trimDepth / 2, trimHeight / 2, 0);
    this.group.add(leftBase);

    const rightBase = new THREE.Mesh(xBaseGeo, trimMaterial);
    rightBase.position.set(width / 2 - trimDepth / 2, trimHeight / 2, 0);
    this.group.add(rightBase);

    // --- Crown Molding (Ceiling boundary trims) ---
    const crownHeight = 0.1;
    const crownDepth = 0.04;

    const zCrownGeo = new THREE.BoxGeometry(width, crownHeight, crownDepth);
    const backCrown = new THREE.Mesh(zCrownGeo, trimMaterial);
    backCrown.position.set(0, height - crownHeight / 2, -depth / 2 + crownDepth / 2);
    this.group.add(backCrown);

    const frontCrown = new THREE.Mesh(zCrownGeo, trimMaterial);
    frontCrown.position.set(0, height - crownHeight / 2, depth / 2 - crownDepth / 2);
    this.group.add(frontCrown);

    const xCrownGeo = new THREE.BoxGeometry(crownDepth, crownHeight, depth);
    const leftCrown = new THREE.Mesh(xCrownGeo, trimMaterial);
    leftCrown.position.set(-width / 2 + crownDepth / 2, height - crownHeight / 2, 0);
    this.group.add(leftCrown);

    const rightCrown = new THREE.Mesh(xCrownGeo, trimMaterial);
    rightCrown.position.set(width / 2 - crownDepth / 2, height - crownHeight / 2, 0);
    this.group.add(rightCrown);

    // Exit door frame outline on front wall for clear orientation
    const doorFrameMat = new THREE.MeshStandardMaterial({
      color: 0x48515e,
      roughness: 0.65,
    });
    const doorFrameGeo = new THREE.BoxGeometry(1.6, 2.4, 0.06);
    const doorFrameMesh = new THREE.Mesh(doorFrameGeo, doorFrameMat);
    doorFrameMesh.position.set(0, 1.2, depth / 2 - 0.03);
    this.group.add(doorFrameMesh);

    // Ceiling light fixture mesh
    const fixtureGeo = new THREE.BoxGeometry(1.4, 0.06, 0.5);
    const fixtureMat = new THREE.MeshBasicMaterial({ color: 0xfffcf0 });
    const fixtureMesh = new THREE.Mesh(fixtureGeo, fixtureMat);
    fixtureMesh.position.set(0, height - 0.03, 0);
    this.group.add(fixtureMesh);
  }

  private createLighting(height: number): void {
    // 1. Ambient light ensures clear baseline visibility for all surfaces
    const ambientLight = new THREE.AmbientLight(0xdde5f0, 1.1);
    this.group.add(ambientLight);

    // 2. Hemisphere light provides directional sky/ground contrast
    const hemiLight = new THREE.HemisphereLight(0xcfdbe8, 0x8a94a2, 0.6);
    this.group.add(hemiLight);

    // 3. Primary ceiling point light for warm focal illumination
    const ceilingLight = new THREE.PointLight(0xfff5e6, 2.0, 16, 1.0);
    ceilingLight.position.set(0, height - 0.7, 0);
    this.group.add(ceilingLight);

    // 4. Directional light creates subtle wall shading/shadow depth (non-flat)
    const dirLight = new THREE.DirectionalLight(0xabc0d6, 0.45);
    dirLight.position.set(2.5, height - 0.5, 2.5);
    dirLight.target.position.set(0, 0, 0);
    this.group.add(dirLight);
    this.group.add(dirLight.target);
  }
}

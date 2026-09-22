import * as THREE from 'three';

export interface RoomBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Creates a procedural 1m x 1m slate tile texture with subtle bevel seams.
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

  // Base slate tone
  ctx.fillStyle = '#56606d';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle tile grid divisions (2x2 tiles per texture repeat)
  ctx.strokeStyle = '#3e4551';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, 512, 512);

  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.stroke();

  // Subtle interior tile edge highlights for depth
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 2;
  ctx.strokeRect(5, 5, 246, 246);
  ctx.strokeRect(261, 5, 246, 246);
  ctx.strokeRect(5, 261, 246, 246);
  ctx.strokeRect(261, 261, 246, 246);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // 8m width / 2 tiles = 4 repeats; 10m depth / 2 tiles = 5 repeats -> 1m x 1m tiles
  texture.repeat.set(4, 5);
  return texture;
}

export class Room {
  public readonly group: THREE.Group;
  public readonly bounds: RoomBounds;

  constructor() {
    this.group = new THREE.Group();

    // Enclosed room: 8m wide (X), 3.2m high (Y), 10m deep (Z)
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
    this.createLighting(height, depth);
  }

  private createGeometry(width: number, height: number, depth: number): void {
    this.createEnclosure(width, height, depth);
    this.createTrims(width, height, depth);
    this.createExitDoor(depth);
    this.createMirrorReservation(height, depth);
    this.createFurniture();
    this.createDecorations();
    this.createCeilingFixture(height);
  }

  /** Floor with 1m tile texture, visible ceiling, and aged wall tones */
  private createEnclosure(width: number, height: number, depth: number): void {
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

    const backWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a94a0,
      roughness: 0.8,
    });

    const frontWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x808a96,
      roughness: 0.8,
    });

    const sideWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x76808c,
      roughness: 0.8,
    });

    // 1. Floor (Y = 0)
    const floorGeo = new THREE.PlaneGeometry(width, depth);
    const floorMesh = new THREE.Mesh(floorGeo, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // 2. Ceiling (Y = height)
    const ceilingGeo = new THREE.PlaneGeometry(width, depth);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMaterial);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.y = height;
    this.group.add(ceilingMesh);

    // 3. Back Wall (Z = -depth/2) - focal wall for the mirror
    const backWallGeo = new THREE.PlaneGeometry(width, height);
    const backWallMesh = new THREE.Mesh(backWallGeo, backWallMaterial);
    backWallMesh.position.set(0, height / 2, -depth / 2);
    backWallMesh.receiveShadow = true;
    this.group.add(backWallMesh);

    // 4. Front Wall (Z = depth/2)
    const frontWallGeo = new THREE.PlaneGeometry(width, height);
    const frontWallMesh = new THREE.Mesh(frontWallGeo, frontWallMaterial);
    frontWallMesh.rotation.y = Math.PI;
    frontWallMesh.position.set(0, height / 2, depth / 2);
    frontWallMesh.receiveShadow = true;
    this.group.add(frontWallMesh);

    // 5. Left Wall (X = -width/2)
    const leftWallGeo = new THREE.PlaneGeometry(depth, height);
    const leftWallMesh = new THREE.Mesh(leftWallGeo, sideWallMaterial);
    leftWallMesh.rotation.y = Math.PI / 2;
    leftWallMesh.position.set(-width / 2, height / 2, 0);
    leftWallMesh.receiveShadow = true;
    this.group.add(leftWallMesh);

    // 6. Right Wall (X = width/2)
    const rightWallGeo = new THREE.PlaneGeometry(depth, height);
    const rightWallMesh = new THREE.Mesh(rightWallGeo, sideWallMaterial);
    rightWallMesh.rotation.y = -Math.PI / 2;
    rightWallMesh.position.set(width / 2, height / 2, 0);
    rightWallMesh.receiveShadow = true;
    this.group.add(rightWallMesh);
  }

  /** Baseboards, crown moldings, and chair-rail (dado molding) for depth */
  private createTrims(width: number, height: number, depth: number): void {
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x242830,
      roughness: 0.65,
    });

    const baseHeight = 0.15;
    const baseDepth = 0.04;

    // --- Floor Baseboards ---
    const zBaseGeo = new THREE.BoxGeometry(width, baseHeight, baseDepth);
    const backBase = new THREE.Mesh(zBaseGeo, trimMaterial);
    backBase.position.set(0, baseHeight / 2, -depth / 2 + baseDepth / 2);
    this.group.add(backBase);

    const frontBase = new THREE.Mesh(zBaseGeo, trimMaterial);
    frontBase.position.set(0, baseHeight / 2, depth / 2 - baseDepth / 2);
    this.group.add(frontBase);

    const xBaseGeo = new THREE.BoxGeometry(baseDepth, baseHeight, depth);
    const leftBase = new THREE.Mesh(xBaseGeo, trimMaterial);
    leftBase.position.set(-width / 2 + baseDepth / 2, baseHeight / 2, 0);
    this.group.add(leftBase);

    const rightBase = new THREE.Mesh(xBaseGeo, trimMaterial);
    rightBase.position.set(width / 2 - baseDepth / 2, baseHeight / 2, 0);
    this.group.add(rightBase);

    // --- Chair Rail / Dado Molding at Y = 1.0m (institutional psychological feel) ---
    const railHeight = 0.05;
    const railDepth = 0.025;

    const zRailGeo = new THREE.BoxGeometry(width, railHeight, railDepth);
    const backRail = new THREE.Mesh(zRailGeo, trimMaterial);
    backRail.position.set(0, 1.0, -depth / 2 + railDepth / 2);
    this.group.add(backRail);

    const frontRail = new THREE.Mesh(zRailGeo, trimMaterial);
    frontRail.position.set(0, 1.0, depth / 2 - railDepth / 2);
    this.group.add(frontRail);

    const xRailGeo = new THREE.BoxGeometry(railDepth, railHeight, depth);
    const leftRail = new THREE.Mesh(xRailGeo, trimMaterial);
    leftRail.position.set(-width / 2 + railDepth / 2, 1.0, 0);
    this.group.add(leftRail);

    const rightRail = new THREE.Mesh(xRailGeo, trimMaterial);
    rightRail.position.set(width / 2 - railDepth / 2, 1.0, 0);
    this.group.add(rightRail);

    // --- Ceiling Crown Moldings ---
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
  }

  /** Detailed visual exit door assembly on the front wall */
  private createExitDoor(depth: number): void {
    const doorGroup = new THREE.Group();
    const frontZ = depth / 2;

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x22262d,
      roughness: 0.6,
    });
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x363d47,
      roughness: 0.7,
    });
    const hardwareMat = new THREE.MeshStandardMaterial({
      color: 0xb5a686, // Aged brass latch
      roughness: 0.35,
      metalness: 0.75,
    });

    // Outer door frame
    const frameGeo = new THREE.BoxGeometry(1.5, 2.45, 0.1);
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(0, 1.225, frontZ - 0.05);
    frameMesh.castShadow = true;
    frameMesh.receiveShadow = true;
    doorGroup.add(frameMesh);

    // Recessed door panel
    const doorPanelGeo = new THREE.BoxGeometry(1.28, 2.35, 0.05);
    const doorPanelMesh = new THREE.Mesh(doorPanelGeo, panelMat);
    doorPanelMesh.position.set(0, 1.225, frontZ - 0.06);
    doorPanelMesh.receiveShadow = true;
    doorGroup.add(doorPanelMesh);

    // Recessed upper and lower architectural panels on door
    const insetMat = new THREE.MeshStandardMaterial({
      color: 0x2e343e,
      roughness: 0.75,
    });
    const topInsetGeo = new THREE.BoxGeometry(0.96, 0.95, 0.02);
    const topInset = new THREE.Mesh(topInsetGeo, insetMat);
    topInset.position.set(0, 1.65, frontZ - 0.09);
    doorGroup.add(topInset);

    const btmInsetGeo = new THREE.BoxGeometry(0.96, 0.75, 0.02);
    const btmInset = new THREE.Mesh(btmInsetGeo, insetMat);
    btmInset.position.set(0, 0.65, frontZ - 0.09);
    doorGroup.add(btmInset);

    // Door Hardware: escutcheon backplate, handle latch, and deadbolt keyhole
    const plateGeo = new THREE.BoxGeometry(0.06, 0.24, 0.015);
    const plateMesh = new THREE.Mesh(plateGeo, hardwareMat);
    plateMesh.position.set(0.48, 1.05, frontZ - 0.095);
    plateMesh.castShadow = true;
    doorGroup.add(plateMesh);

    const handleGeo = new THREE.BoxGeometry(0.14, 0.03, 0.04);
    const handleMesh = new THREE.Mesh(handleGeo, hardwareMat);
    handleMesh.position.set(0.43, 1.05, frontZ - 0.115);
    handleMesh.castShadow = true;
    doorGroup.add(handleMesh);

    const deadboltGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12);
    const deadboltMesh = new THREE.Mesh(deadboltGeo, hardwareMat);
    deadboltMesh.rotation.x = Math.PI / 2;
    deadboltMesh.position.set(0.48, 1.2, frontZ - 0.095);
    doorGroup.add(deadboltMesh);

    // Transom / Room exit plaque above door
    const signMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.5,
    });
    const signGeo = new THREE.BoxGeometry(0.6, 0.12, 0.02);
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 2.6, frontZ - 0.06);
    doorGroup.add(signMesh);

    this.group.add(doorGroup);
  }

  /** Clean central space on back wall framed to lead the eye toward the future mirror */
  private createMirrorReservation(height: number, depth: number): void {
    const pilasterMat = new THREE.MeshStandardMaterial({
      color: 0x242830,
      roughness: 0.65,
    });

    const backZ = -depth / 2;
    const pilasterWidth = 0.1;
    const pilasterDepth = 0.035;

    // Two vertical pilasters framing the central 2.8m mirror area
    const pilasterGeo = new THREE.BoxGeometry(pilasterWidth, height, pilasterDepth);

    const leftPilaster = new THREE.Mesh(pilasterGeo, pilasterMat);
    leftPilaster.position.set(-1.6, height / 2, backZ + pilasterDepth / 2);
    leftPilaster.castShadow = true;
    this.group.add(leftPilaster);

    const rightPilaster = new THREE.Mesh(pilasterGeo, pilasterMat);
    rightPilaster.position.set(1.6, height / 2, backZ + pilasterDepth / 2);
    rightPilaster.castShadow = true;
    this.group.add(rightPilaster);

    // Top cornice strip framing the mirror span
    const corniceGeo = new THREE.BoxGeometry(3.2 + pilasterWidth, 0.06, 0.05);
    const corniceMesh = new THREE.Mesh(corniceGeo, pilasterMat);
    corniceMesh.position.set(0, 2.7, backZ + 0.025);
    corniceMesh.castShadow = true;
    this.group.add(corniceMesh);

    // Subtle wall-mounted picture light / sconce above the mirror space
    const sconceMat = new THREE.MeshStandardMaterial({
      color: 0x1c1f24,
      roughness: 0.5,
      metalness: 0.4,
    });
    const sconceArmGeo = new THREE.BoxGeometry(0.04, 0.04, 0.2);
    const sconceArm = new THREE.Mesh(sconceArmGeo, sconceMat);
    sconceArm.position.set(0, 2.85, backZ + 0.1);
    this.group.add(sconceArm);

    const sconceHeadGeo = new THREE.BoxGeometry(0.45, 0.04, 0.08);
    const sconceHead = new THREE.Mesh(sconceHeadGeo, sconceMat);
    sconceHead.position.set(0, 2.85, backZ + 0.2);
    this.group.add(sconceHead);
  }

  /** Small table and chair with grounded contact shadows */
  private createFurniture(): void {
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x362f28, // Dark aged wood
      roughness: 0.75,
    });

    const metalLegMat = new THREE.MeshStandardMaterial({
      color: 0x282c32, // Dark metal framing
      roughness: 0.6,
      metalness: 0.2,
    });

    // --- Table (against left wall at X = -3.45, Z = 0.6) ---
    const tableGroup = new THREE.Group();
    const tableWidth = 0.75;
    const tableLength = 1.4;
    const tableHeight = 0.74;
    const topThickness = 0.04;

    // Table top
    const topGeo = new THREE.BoxGeometry(tableWidth, topThickness, tableLength);
    const topMesh = new THREE.Mesh(topGeo, woodMat);
    topMesh.position.y = tableHeight - topThickness / 2;
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    tableGroup.add(topMesh);

    // Table 4 legs
    const legWidth = 0.045;
    const legHeight = tableHeight - topThickness;
    const legGeo = new THREE.BoxGeometry(legWidth, legHeight, legWidth);

    const xOffset = tableWidth / 2 - legWidth;
    const zOffset = tableLength / 2 - legWidth;

    const legPositions = [
      [-xOffset, legHeight / 2, -zOffset],
      [xOffset, legHeight / 2, -zOffset],
      [-xOffset, legHeight / 2, zOffset],
      [xOffset, legHeight / 2, zOffset],
    ];

    for (const [lx, ly, lz] of legPositions) {
      const legMesh = new THREE.Mesh(legGeo, metalLegMat);
      legMesh.position.set(lx, ly, lz);
      legMesh.castShadow = true;
      tableGroup.add(legMesh);
    }

    // Small stationery folder on table
    const bookMat = new THREE.MeshStandardMaterial({
      color: 0x4a505b,
      roughness: 0.8,
    });
    const bookGeo = new THREE.BoxGeometry(0.24, 0.025, 0.32);
    const bookMesh = new THREE.Mesh(bookGeo, bookMat);
    bookMesh.position.set(0.05, tableHeight + 0.0125, -0.15);
    bookMesh.rotation.y = 0.15;
    bookMesh.castShadow = true;
    tableGroup.add(bookMesh);

    tableGroup.position.set(-3.45, 0, 0.6);
    this.group.add(tableGroup);

    // --- Chair (tucked by the table at X = -2.7, Z = 0.6) ---
    const chairGroup = new THREE.Group();
    const seatWidth = 0.42;
    const seatDepth = 0.42;
    const seatHeight = 0.44;

    // Chair seat
    const seatGeo = new THREE.BoxGeometry(seatWidth, 0.035, seatDepth);
    const seatMesh = new THREE.Mesh(seatGeo, woodMat);
    seatMesh.position.y = seatHeight;
    seatMesh.castShadow = true;
    seatMesh.receiveShadow = true;
    chairGroup.add(seatMesh);

    // Chair 4 legs
    const chairLegGeo = new THREE.BoxGeometry(0.035, seatHeight, 0.035);
    const cxOff = seatWidth / 2 - 0.03;
    const czOff = seatDepth / 2 - 0.03;

    const chairLegs = [
      [-cxOff, seatHeight / 2, -czOff],
      [cxOff, seatHeight / 2, -czOff],
      [-cxOff, seatHeight / 2, czOff],
      [cxOff, seatHeight / 2, czOff],
    ];

    for (const [clx, cly, clz] of chairLegs) {
      const leg = new THREE.Mesh(chairLegGeo, metalLegMat);
      leg.position.set(clx, cly, clz);
      leg.castShadow = true;
      chairGroup.add(leg);
    }

    // Chair backrest posts & horizontal support
    const postHeight = 0.38;
    const postGeo = new THREE.BoxGeometry(0.03, postHeight, 0.03);

    const leftPost = new THREE.Mesh(postGeo, metalLegMat);
    leftPost.position.set(cxOff, seatHeight + postHeight / 2, -czOff);
    leftPost.castShadow = true;
    chairGroup.add(leftPost);

    const rightPost = new THREE.Mesh(postGeo, metalLegMat);
    rightPost.position.set(cxOff, seatHeight + postHeight / 2, czOff);
    rightPost.castShadow = true;
    chairGroup.add(rightPost);

    const backrestGeo = new THREE.BoxGeometry(0.03, 0.12, seatDepth);
    const backrestMesh = new THREE.Mesh(backrestGeo, woodMat);
    backrestMesh.position.set(cxOff, seatHeight + postHeight - 0.06, 0);
    backrestMesh.castShadow = true;
    chairGroup.add(backrestMesh);

    chairGroup.rotation.y = -Math.PI / 2 + 0.12;
    chairGroup.position.set(-2.7, 0, 0.6);
    this.group.add(chairGroup);
  }

  /** Wall decorations: analog clock, framed diagram, and air vent grille */
  private createDecorations(): void {
    // 1. Stopped analog clock on Right Wall (X = 4, Z = -0.5, Y = 2.1)
    const clockGroup = new THREE.Group();

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x22262d,
      roughness: 0.6,
    });
    const faceMat = new THREE.MeshStandardMaterial({
      color: 0xdde0d8,
      roughness: 0.5,
    });
    const handMat = new THREE.MeshBasicMaterial({ color: 0x121418 });

    const clockRimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.04, 24);
    const clockRimMesh = new THREE.Mesh(clockRimGeo, rimMat);
    clockRimMesh.rotation.z = Math.PI / 2;
    clockGroup.add(clockRimMesh);

    const clockFaceGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.042, 24);
    const clockFaceMesh = new THREE.Mesh(clockFaceGeo, faceMat);
    clockFaceMesh.rotation.z = Math.PI / 2;
    clockGroup.add(clockFaceMesh);

    // Hour hand (pointing toward 3)
    const hourHandGeo = new THREE.BoxGeometry(0.015, 0.1, 0.008);
    const hourHandMesh = new THREE.Mesh(hourHandGeo, handMat);
    hourHandMesh.rotation.x = Math.PI / 2;
    hourHandMesh.position.set(-0.022, 0, 0.04);
    clockGroup.add(hourHandMesh);

    // Minute hand (pointing toward 12)
    const minHandGeo = new THREE.BoxGeometry(0.012, 0.15, 0.008);
    const minHandMesh = new THREE.Mesh(minHandGeo, handMat);
    minHandMesh.position.set(-0.022, 0.06, 0);
    clockGroup.add(minHandMesh);

    clockGroup.position.set(3.97, 2.1, -0.5);
    this.group.add(clockGroup);

    // 2. Framed minimalist diagram on Left Wall (X = -4, Z = -2.0, Y = 1.85)
    const frameGroup = new THREE.Group();

    const frameOuterMat = new THREE.MeshStandardMaterial({
      color: 0x20242b,
      roughness: 0.7,
    });
    const artCanvasMat = new THREE.MeshStandardMaterial({
      color: 0x48505c,
      roughness: 0.85,
    });

    const outerGeo = new THREE.BoxGeometry(0.03, 0.9, 0.7);
    const outerMesh = new THREE.Mesh(outerGeo, frameOuterMat);
    outerMesh.castShadow = true;
    frameGroup.add(outerMesh);

    const canvasGeo = new THREE.BoxGeometry(0.035, 0.8, 0.6);
    const canvasMesh = new THREE.Mesh(canvasGeo, artCanvasMat);
    frameGroup.add(canvasMesh);

    frameGroup.position.set(-3.97, 1.85, -2.0);
    this.group.add(frameGroup);

    // 3. Wall ventilation grille on Right Wall near floor (X = 4, Z = 2.5, Y = 0.4)
    const ventGroup = new THREE.Group();
    const ventFrameMat = new THREE.MeshStandardMaterial({
      color: 0x282d36,
      roughness: 0.7,
    });
    const ventSlatMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.8,
    });

    const ventFrameGeo = new THREE.BoxGeometry(0.02, 0.35, 0.5);
    const ventFrame = new THREE.Mesh(ventFrameGeo, ventFrameMat);
    ventGroup.add(ventFrame);

    const slatGeo = new THREE.BoxGeometry(0.025, 0.02, 0.44);
    for (let i = -0.12; i <= 0.12; i += 0.05) {
      const slat = new THREE.Mesh(slatGeo, ventSlatMat);
      slat.position.y = i;
      ventGroup.add(slat);
    }

    ventGroup.position.set(3.97, 0.4, 2.5);
    this.group.add(ventGroup);
  }

  /** Physical ceiling lighting fixture */
  private createCeilingFixture(height: number): void {
    const fixtureGroup = new THREE.Group();

    const housingMat = new THREE.MeshStandardMaterial({
      color: 0x1e2228,
      roughness: 0.6,
      metalness: 0.3,
    });
    const diffuserMat = new THREE.MeshBasicMaterial({
      color: 0xfffaea,
    });

    const housingGeo = new THREE.BoxGeometry(1.5, 0.08, 0.6);
    const housingMesh = new THREE.Mesh(housingGeo, housingMat);
    housingMesh.position.set(0, height - 0.04, 0);
    fixtureGroup.add(housingMesh);

    const diffuserGeo = new THREE.BoxGeometry(1.35, 0.02, 0.48);
    const diffuserMesh = new THREE.Mesh(diffuserGeo, diffuserMat);
    diffuserMesh.position.set(0, height - 0.085, 0);
    fixtureGroup.add(diffuserMesh);

    this.group.add(fixtureGroup);
  }

  /** Atmosphere-enhanced lighting: soft shadows, directional depth, and mirror wall focus */
  private createLighting(height: number, depth: number): void {
    // 1. Ambient baseline ensures no black void
    const ambientLight = new THREE.AmbientLight(0xd9e3ee, 0.7);
    this.group.add(ambientLight);

    // 2. Hemisphere bounce provides natural sky/ground contrast
    const hemiLight = new THREE.HemisphereLight(0xcbd6e4, 0x6e7784, 0.45);
    this.group.add(hemiLight);

    // 3. Primary ceiling point light casting soft contact shadows
    const ceilingLight = new THREE.PointLight(0xfff2dc, 2.2, 14, 1.2);
    ceilingLight.position.set(0, height - 0.6, 0);
    ceilingLight.castShadow = true;
    ceilingLight.shadow.mapSize.width = 1024;
    ceilingLight.shadow.mapSize.height = 1024;
    ceilingLight.shadow.bias = -0.002;
    this.group.add(ceilingLight);

    // 4. Subtle directional fill for wall relief and depth
    const dirLight = new THREE.DirectionalLight(0x9cb0c8, 0.35);
    dirLight.position.set(2.5, height - 0.5, 2.5);
    dirLight.target.position.set(0, 0, 0);
    this.group.add(dirLight);
    this.group.add(dirLight.target);

    // 5. Dedicated mirror focal spotlight gently illuminating the back wall
    const mirrorSpot = new THREE.SpotLight(0xdbe6f5, 1.2, 8, Math.PI / 4, 0.5, 1.2);
    mirrorSpot.position.set(0, height - 0.3, -depth / 2 + 1.8);
    mirrorSpot.target.position.set(0, 1.6, -depth / 2);
    this.group.add(mirrorSpot);
    this.group.add(mirrorSpot.target);
  }
}

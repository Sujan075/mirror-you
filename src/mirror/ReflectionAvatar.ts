import * as THREE from 'three';

/**
 * Refined humanoid reflection avatar representing the player inside the twin room.
 * Built using stylized Three.js primitives (curved cylinders, capsules, and spheres)
 * to achieve believable human proportions, relaxed posture, and atmospheric coherence.
 */
export class ReflectionAvatar {
  /** Root object containing the complete avatar hierarchy */
  public readonly root: THREE.Group;

  // Hierarchical part groups for future animation
  public readonly hipsGroup: THREE.Group;
  public readonly torsoGroup: THREE.Group;
  public readonly headGroup: THREE.Group;
  public readonly leftArmGroup: THREE.Group;
  public readonly rightArmGroup: THREE.Group;
  public readonly leftForearmGroup: THREE.Group;
  public readonly rightForearmGroup: THREE.Group;
  public readonly leftLegGroup: THREE.Group;
  public readonly rightLegGroup: THREE.Group;

  constructor() {
    this.root = new THREE.Group();
    this.root.name = 'ReflectionAvatar';

    // --- Curated Materials: Atmospheric Psychological Mystery Palette ---
    const suitMaterial = new THREE.MeshStandardMaterial({
      color: 0x1d2128, // Dark charcoal tailored wool
      roughness: 0.78,
      metalness: 0.08,
    });

    const lapelMaterial = new THREE.MeshStandardMaterial({
      color: 0x15181f, // Slightly deeper tone for jacket lapels and trim
      roughness: 0.85,
    });

    const shirtMaterial = new THREE.MeshStandardMaterial({
      color: 0x7e8692, // Muted cool grey inner collared shirt
      roughness: 0.75,
    });

    const tieMaterial = new THREE.MeshStandardMaterial({
      color: 0x111317, // Deep dark necktie
      roughness: 0.65,
    });

    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xc2c8d2, // Pale porcelain / mannequin skin tone
      roughness: 0.6,
      metalness: 0.02,
    });

    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x17191f, // Dark silhouette hair
      roughness: 0.82,
    });

    const shoeMaterial = new THREE.MeshStandardMaterial({
      color: 0x121418, // Matte black leather shoes
      roughness: 0.45,
      metalness: 0.1,
    });

    const soleMaterial = new THREE.MeshStandardMaterial({
      color: 0x22262e, // Dense rubber welt/sole
      roughness: 0.85,
    });

    const eyeMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a1c22, // Understated dark recessed eye sockets
    });

    // --- 1. Hips & Pelvis ---
    // Positioned so shoes rest precisely on the twin floor (Y = 0.00)
    this.hipsGroup = new THREE.Group();
    this.hipsGroup.name = 'Hips';
    this.hipsGroup.position.set(0, 0.9276, 0);
    this.root.add(this.hipsGroup);

    // Rounded pelvis block
    const pelvisGeo = new THREE.CylinderGeometry(0.155, 0.145, 0.12, 16);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, suitMaterial);
    pelvisMesh.scale.set(1.0, 1.0, 0.65);
    pelvisMesh.castShadow = true;
    pelvisMesh.receiveShadow = true;
    this.hipsGroup.add(pelvisMesh);

    // Belt and subtle buckle accent at waist
    const beltGeo = new THREE.CylinderGeometry(0.156, 0.156, 0.028, 16);
    const beltMesh = new THREE.Mesh(beltGeo, tieMaterial);
    beltMesh.scale.set(1.01, 1.0, 0.66);
    beltMesh.position.set(0, 0.05, 0);
    this.hipsGroup.add(beltMesh);

    const buckleGeo = new THREE.BoxGeometry(0.038, 0.022, 0.01);
    const buckleMat = new THREE.MeshStandardMaterial({ color: 0x6e7682, roughness: 0.4, metalness: 0.5 });
    const buckleMesh = new THREE.Mesh(buckleGeo, buckleMat);
    buckleMesh.position.set(0, 0.05, 0.106);
    this.hipsGroup.add(buckleMesh);

    // --- 2. Torso (Waist & Chest) ---
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.name = 'Torso';
    this.torsoGroup.position.set(0, 0.06, 0);
    this.hipsGroup.add(this.torsoGroup);

    // Lower torso (waist/abdomen) - smooth taper
    const waistGeo = new THREE.CylinderGeometry(0.15, 0.155, 0.20, 16);
    const waistMesh = new THREE.Mesh(waistGeo, suitMaterial);
    waistMesh.scale.set(1.05, 1.0, 0.62);
    waistMesh.position.set(0, 0.10, 0);
    waistMesh.castShadow = true;
    waistMesh.receiveShadow = true;
    this.torsoGroup.add(waistMesh);

    // Upper torso (chest & athletic shoulder breadth)
    const chestGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.26, 16);
    const chestMesh = new THREE.Mesh(chestGeo, suitMaterial);
    chestMesh.scale.set(1.15, 1.0, 0.65);
    chestMesh.position.set(0, 0.33, 0);
    chestMesh.castShadow = true;
    chestMesh.receiveShadow = true;
    this.torsoGroup.add(chestMesh);

    // Inner shirt triangle visible at V-opening
    const shirtGeo = new THREE.BufferGeometry();
    // Triangular polygon for collared shirt
    const shirtVertices = new Float32Array([
      -0.05, 0.45, 0.125,
       0.05, 0.45, 0.125,
       0.00, 0.24, 0.122,
    ]);
    shirtGeo.setAttribute('position', new THREE.BufferAttribute(shirtVertices, 3));
    shirtGeo.computeVertexNormals();
    const shirtMesh = new THREE.Mesh(shirtGeo, shirtMaterial);
    this.torsoGroup.add(shirtMesh);

    // Necktie down the chest center
    const tieGeo = new THREE.BoxGeometry(0.024, 0.18, 0.01);
    const tieMesh = new THREE.Mesh(tieGeo, tieMaterial);
    tieMesh.position.set(0, 0.33, 0.125);
    this.torsoGroup.add(tieMesh);

    // Left & Right jacket lapels framing the V-neck
    const lapelGeo = new THREE.BoxGeometry(0.04, 0.24, 0.015);
    const leftLapel = new THREE.Mesh(lapelGeo, lapelMaterial);
    leftLapel.rotation.z = 0.24;
    leftLapel.position.set(-0.065, 0.34, 0.126);
    leftLapel.castShadow = true;
    this.torsoGroup.add(leftLapel);

    const rightLapel = new THREE.Mesh(lapelGeo, lapelMaterial);
    rightLapel.rotation.z = -0.24;
    rightLapel.position.set(0.065, 0.34, 0.126);
    rightLapel.castShadow = true;
    this.torsoGroup.add(rightLapel);

    // --- 3. Neck & Head ---
    const neckGeo = new THREE.CylinderGeometry(0.044, 0.050, 0.075, 16);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.set(0, 0.495, 0);
    neckMesh.castShadow = true;
    neckMesh.receiveShadow = true;
    this.torsoGroup.add(neckMesh);

    this.headGroup = new THREE.Group();
    this.headGroup.name = 'Head';
    this.headGroup.position.set(0, 0.62, 0); // World eye height sits right at ~1.61m
    this.torsoGroup.add(this.headGroup);

    // Upper cranium dome
    const craniumGeo = new THREE.SphereGeometry(0.095, 20, 16);
    const craniumMesh = new THREE.Mesh(craniumGeo, skinMaterial);
    craniumMesh.scale.set(1.0, 1.10, 1.05);
    craniumMesh.position.set(0, 0.05, 0);
    craniumMesh.castShadow = true;
    craniumMesh.receiveShadow = true;
    this.headGroup.add(craniumMesh);

    // Tapered jawline and smooth chin
    const jawGeo = new THREE.CylinderGeometry(0.088, 0.048, 0.10, 16);
    const jawMesh = new THREE.Mesh(jawGeo, skinMaterial);
    jawMesh.scale.set(0.96, 1.0, 0.88);
    jawMesh.position.set(0, -0.015, 0.012);
    jawMesh.castShadow = true;
    jawMesh.receiveShadow = true;
    this.headGroup.add(jawMesh);

    // Sculpted dark hair silhouette framing forehead and crown
    const hairGeo = new THREE.SphereGeometry(0.10, 20, 14, 0, Math.PI * 2, 0, Math.PI / 1.9);
    const hairMesh = new THREE.Mesh(hairGeo, hairMaterial);
    hairMesh.scale.set(1.03, 1.10, 1.06);
    hairMesh.position.set(0, 0.065, -0.01);
    hairMesh.castShadow = true;
    this.headGroup.add(hairMesh);

    // Subtle side hairburns/contour
    const sideHairGeo = new THREE.BoxGeometry(0.015, 0.08, 0.05);
    const leftSideHair = new THREE.Mesh(sideHairGeo, hairMaterial);
    leftSideHair.position.set(-0.098, 0.04, 0.005);
    this.headGroup.add(leftSideHair);

    const rightSideHair = new THREE.Mesh(sideHairGeo, hairMaterial);
    rightSideHair.position.set(0.098, 0.04, 0.005);
    this.headGroup.add(rightSideHair);

    // Minimal understated eye sockets (recessed, mysterious, non-cartoonish)
    const eyeGeo = new THREE.BoxGeometry(0.024, 0.007, 0.01);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    leftEye.rotation.z = -0.05;
    leftEye.position.set(-0.035, 0.038, 0.096);
    this.headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    rightEye.rotation.z = 0.05;
    rightEye.position.set(0.035, 0.038, 0.096);
    this.headGroup.add(rightEye);

    // Streamlined nose bridge giving clean profile
    const noseGeo = new THREE.BoxGeometry(0.012, 0.032, 0.014);
    const noseMesh = new THREE.Mesh(noseGeo, skinMaterial);
    noseMesh.position.set(0, 0.018, 0.10);
    this.headGroup.add(noseMesh);

    // --- 4. Arms (Relaxed Human Standing Posture) ---
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.name = 'LeftArm';
    this.leftArmGroup.position.set(-0.205, 0.38, 0);
    // Subtle natural outward drape and gentle forward relaxation
    this.leftArmGroup.rotation.z = 0.045;
    this.leftArmGroup.rotation.x = 0.04;
    this.torsoGroup.add(this.leftArmGroup);

    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.name = 'RightArm';
    this.rightArmGroup.position.set(0.205, 0.38, 0);
    this.rightArmGroup.rotation.z = -0.045;
    this.rightArmGroup.rotation.x = 0.04;
    this.torsoGroup.add(this.rightArmGroup);

    // Setup left & right limbs identically with mirrored angles
    this.leftForearmGroup = this.createArmChain(this.leftArmGroup, suitMaterial, skinMaterial, true);
    this.rightForearmGroup = this.createArmChain(this.rightArmGroup, suitMaterial, skinMaterial, false);

    // --- 5. Legs & Grounded Feet (Subtle Relaxed Stance) ---
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.name = 'LeftLeg';
    this.leftLegGroup.position.set(-0.105, -0.06, 0);
    // Subtle outward natural stance
    this.leftLegGroup.rotation.z = 0.015;
    this.leftLegGroup.rotation.y = -0.06;
    this.hipsGroup.add(this.leftLegGroup);

    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.name = 'RightLeg';
    this.rightLegGroup.position.set(0.105, -0.06, 0);
    this.rightLegGroup.rotation.z = -0.015;
    this.rightLegGroup.rotation.y = 0.06;
    this.hipsGroup.add(this.rightLegGroup);

    this.createLegChain(this.leftLegGroup, suitMaterial, shoeMaterial, soleMaterial);
    this.createLegChain(this.rightLegGroup, suitMaterial, shoeMaterial, soleMaterial);

    // Default initial placement:
    // Standing in the twin room at X=0, Y=0 (feet on floor), Z=-7.0 (2m behind the mirror),
    // facing +Z directly toward the mirror aperture and player.
    this.root.position.set(0, 0, -7.0);
    this.root.rotation.set(0, 0, 0);
  }

  /** Builds an articulated arm with tapered shoulder, elbow, forearm, and sculpted hand */
  private createArmChain(
    armRoot: THREE.Group,
    suitMat: THREE.Material,
    skinMat: THREE.Material,
    isLeft: boolean
  ): THREE.Group {
    // Shoulder cap creates a smooth suit shoulder silhouette
    const shoulderCapGeo = new THREE.SphereGeometry(0.052, 14, 12);
    const shoulderCap = new THREE.Mesh(shoulderCapGeo, suitMat);
    shoulderCap.castShadow = true;
    shoulderCap.receiveShadow = true;
    armRoot.add(shoulderCap);

    // Upper arm: smoothly tapered cylinder
    const upperArmGeo = new THREE.CylinderGeometry(0.044, 0.036, 0.27, 14);
    const upperArmMesh = new THREE.Mesh(upperArmGeo, suitMat);
    upperArmMesh.position.set(0, -0.135, 0);
    upperArmMesh.castShadow = true;
    upperArmMesh.receiveShadow = true;
    armRoot.add(upperArmMesh);

    // Forearm group pivoted at the elbow
    const forearmGroup = new THREE.Group();
    forearmGroup.name = isLeft ? 'LeftForearm' : 'RightForearm';
    forearmGroup.position.set(0, -0.27, 0);
    // Subtle natural bend and inward forearm rotation
    forearmGroup.rotation.x = 0.05;
    forearmGroup.rotation.y = isLeft ? 0.06 : -0.06;
    armRoot.add(forearmGroup);

    // Elbow joint sphere
    const elbowGeo = new THREE.SphereGeometry(0.036, 10, 10);
    const elbowMesh = new THREE.Mesh(elbowGeo, suitMat);
    forearmGroup.add(elbowMesh);

    // Forearm: tapered cylinder
    const forearmGeo = new THREE.CylinderGeometry(0.035, 0.028, 0.25, 14);
    const forearmMesh = new THREE.Mesh(forearmGeo, suitMat);
    forearmMesh.position.set(0, -0.125, 0);
    forearmMesh.castShadow = true;
    forearmMesh.receiveShadow = true;
    forearmGroup.add(forearmMesh);

    // Natural cupped hand (smooth rounded palm & relaxed thumb)
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.28, 0);

    const palmGeo = new THREE.BoxGeometry(0.038, 0.075, 0.022);
    const palmMesh = new THREE.Mesh(palmGeo, skinMat);
    palmMesh.position.set(0, -0.0375, 0);
    palmMesh.castShadow = true;
    palmMesh.receiveShadow = true;
    handGroup.add(palmMesh);

    const thumbGeo = new THREE.BoxGeometry(0.012, 0.032, 0.014);
    const thumbMesh = new THREE.Mesh(thumbGeo, skinMat);
    thumbMesh.position.set(isLeft ? 0.016 : -0.016, -0.025, 0.008);
    thumbMesh.rotation.z = isLeft ? -0.2 : 0.2;
    handGroup.add(thumbMesh);

    forearmGroup.add(handGroup);
    return forearmGroup;
  }

  /** Builds an articulated leg with tapered thigh, rounded knee, shin, and structured shoes */
  private createLegChain(
    legRoot: THREE.Group,
    suitMat: THREE.Material,
    shoeMat: THREE.Material,
    soleMat: THREE.Material
  ): void {
    // Upper leg / thigh: tapered cylinder
    const thighGeo = new THREE.CylinderGeometry(0.060, 0.048, 0.42, 16);
    const thighMesh = new THREE.Mesh(thighGeo, suitMat);
    thighMesh.position.set(0, -0.21, 0);
    thighMesh.castShadow = true;
    thighMesh.receiveShadow = true;
    legRoot.add(thighMesh);

    // Knee joint cap
    const kneeGeo = new THREE.SphereGeometry(0.048, 12, 12);
    const kneeMesh = new THREE.Mesh(kneeGeo, suitMat);
    kneeMesh.position.set(0, -0.42, 0);
    legRoot.add(kneeMesh);

    // Lower leg / shin: tapered cylinder
    const shinGeo = new THREE.CylinderGeometry(0.047, 0.038, 0.42, 16);
    const shinMesh = new THREE.Mesh(shinGeo, suitMat);
    shinMesh.position.set(0, -0.63, 0);
    shinMesh.castShadow = true;
    shinMesh.receiveShadow = true;
    legRoot.add(shinMesh);

    // Structured dress shoes with rounded toe box, subtle heel, and welt sole
    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.84, 0.03);

    // Upper shoe body
    const upperShoeGeo = new THREE.CapsuleGeometry(0.042, 0.13, 8, 12);
    const upperShoeMesh = new THREE.Mesh(upperShoeGeo, shoeMat);
    upperShoeMesh.rotation.x = Math.PI / 2;
    upperShoeMesh.scale.set(1.0, 1.1, 0.82);
    upperShoeMesh.position.set(0, 0.015, 0);
    upperShoeMesh.castShadow = true;
    upperShoeMesh.receiveShadow = true;
    shoeGroup.add(upperShoeMesh);

    // Sole & heel welt flush with the floor
    const soleGeo = new THREE.BoxGeometry(0.088, 0.018, 0.22);
    const soleMesh = new THREE.Mesh(soleGeo, soleMat);
    soleMesh.position.set(0, -0.018, 0.01);
    soleMesh.castShadow = true;
    soleMesh.receiveShadow = true;
    shoeGroup.add(soleMesh);

    legRoot.add(shoeGroup);
  }

  /** Position the avatar root in 3D world space */
  public setPosition(x: number, y: number, z: number): void {
    this.root.position.set(x, y, z);
  }

  /** Set rotation around the vertical Y axis */
  public setRotationY(angleRad: number): void {
    this.root.rotation.y = angleRad;
  }
}

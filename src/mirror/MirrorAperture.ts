import * as THREE from 'three';

export class MirrorAperture {
  public readonly group: THREE.Group;
  public readonly glassMesh: THREE.Mesh;
  public readonly frameGroup: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.frameGroup = new THREE.Group();

    // Mirror opening dimensions: 2.8m wide, 2.2m high, centered at (0, 1.5, -5.0)
    const openingWidth = 2.8;
    const openingHeight = 2.2;
    const centerY = 1.5;
    const backZ = -5.0;

    // Frame specifications: width ~0.12m, depth ~0.06m
    const frameBorder = 0.12;
    const frameDepth = 0.06;

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1d22,
      roughness: 0.55,
      metalness: 0.25,
    });

    const outerWidth = openingWidth + frameBorder * 2; // 3.04m

    // 1. Top frame bar
    const topGeo = new THREE.BoxGeometry(outerWidth, frameBorder, frameDepth);
    const topBar = new THREE.Mesh(topGeo, frameMaterial);
    topBar.position.set(0, centerY + openingHeight / 2 + frameBorder / 2, backZ + frameDepth / 2);
    topBar.castShadow = true;
    topBar.receiveShadow = true;
    this.frameGroup.add(topBar);

    // 2. Bottom frame bar
    const btmGeo = new THREE.BoxGeometry(outerWidth, frameBorder, frameDepth);
    const btmBar = new THREE.Mesh(btmGeo, frameMaterial);
    btmBar.position.set(0, centerY - openingHeight / 2 - frameBorder / 2, backZ + frameDepth / 2);
    btmBar.castShadow = true;
    btmBar.receiveShadow = true;
    this.frameGroup.add(btmBar);

    // 3. Left frame bar
    const sideGeo = new THREE.BoxGeometry(frameBorder, openingHeight, frameDepth);
    const leftBar = new THREE.Mesh(sideGeo, frameMaterial);
    leftBar.position.set(-openingWidth / 2 - frameBorder / 2, centerY, backZ + frameDepth / 2);
    leftBar.castShadow = true;
    leftBar.receiveShadow = true;
    this.frameGroup.add(leftBar);

    // 4. Right frame bar
    const rightBar = new THREE.Mesh(sideGeo, frameMaterial);
    rightBar.position.set(openingWidth / 2 + frameBorder / 2, centerY, backZ + frameDepth / 2);
    rightBar.castShadow = true;
    rightBar.receiveShadow = true;
    this.frameGroup.add(rightBar);

    this.group.add(this.frameGroup);

    // 5. Tinted transparent glass pane at Z = -5.01
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a9aa8,
      transparent: true,
      opacity: 0.22,
      roughness: 0.08,
      metalness: 0.85,
      depthWrite: false,
    });

    const glassGeo = new THREE.PlaneGeometry(openingWidth, openingHeight);
    this.glassMesh = new THREE.Mesh(glassGeo, glassMaterial);
    this.glassMesh.position.set(0, centerY, backZ - 0.01);
    this.glassMesh.renderOrder = 1;
    this.group.add(this.glassMesh);
  }
}

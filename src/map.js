(() => {
  const { TEST_PLATFORM } = window.ZR.config;
  const { state } = window.ZR.gameState;
  const { getThree } = window.ZR.utils;
  const THREE = getThree();

  function buildMap(scene) {
    addWall(scene, 0, 1, -25, 50, 2, 1);
    addWall(scene, 0, 1, 25, 50, 2, 1);
    addWall(scene, -25, 1, 0, 1, 2, 50);
    addWall(scene, 25, 1, 0, 1, 2, 50);

    addObstacle(scene, -14, 1, -13, 2.5, 2, 8);
    addObstacle(scene, -9, 1, 8, 10, 2, 2.5);
    addObstacle(scene, 12, 1, -11, 2.5, 2, 12);
    addObstacleBounds(scene, 6, 14.5, 11, 13.5);
    addObstacleBounds(scene, 12, 14.5, 4, 13.5);

    addTestPlatform(scene);
  }

  function addWall(scene, x, y, z, width, height, depth) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color: 0x5a6157, roughness: 0.85 }),
    );
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    state.obstacles.push({ x, z, halfX: width / 2, halfZ: depth / 2 });
  }

  function addObstacle(scene, x, y, z, width, height, depth) {
    const obstacle = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color: 0x697163, roughness: 0.85 }),
    );
    obstacle.position.set(x, y, z);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    scene.add(obstacle);
    state.obstacles.push({ x, z, halfX: width / 2, halfZ: depth / 2 });
  }

  function addObstacleBounds(scene, minX, maxX, minZ, maxZ) {
    const x = (minX + maxX) / 2;
    const z = (minZ + maxZ) / 2;
    const width = maxX - minX;
    const depth = maxZ - minZ;
    addObstacle(scene, x, 1, z, width, 2, depth);
  }

  function addTestPlatform(scene) {
    const {
      depth,
      height,
      rampLength,
      rampWidth,
      width,
      x,
      z,
    } = TEST_PLATFORM;

    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color: 0x56606a, roughness: 0.9 }),
    );

    platform.position.set(x, height / 2, z);
    platform.receiveShadow = true;
    scene.add(platform);

    // Primera prueba de superficies elevadas. La navegacion vertical zombie queda pendiente.
    state.platforms.push({
      type: "flat",
      x,
      z,
      minX: x - width / 2,
      maxX: x + width / 2,
      minZ: z - depth / 2,
      maxZ: z + depth / 2,
      height,
    });

    addPlatformSideBlockers(scene, x, z, width, depth, height, rampWidth);
    addRamp(scene, {
      x,
      z: z - depth / 2 - rampLength / 2,
      width: rampWidth,
      depth: rampLength,
      startZ: z - depth / 2 - rampLength,
      endZ: z - depth / 2,
      startHeight: 0,
      endHeight: height,
      rotationX: -Math.atan(height / rampLength),
    });
    addRamp(scene, {
      x,
      z: z + depth / 2 + rampLength / 2,
      width: rampWidth,
      depth: rampLength,
      startZ: z + depth / 2,
      endZ: z + depth / 2 + rampLength,
      startHeight: height,
      endHeight: 0,
      rotationX: Math.atan(height / rampLength),
    });
  }

  function addRamp(scene, ramp) {
    const rampMesh = new THREE.Mesh(
      new THREE.BoxGeometry(ramp.width, 0.24, ramp.depth),
      new THREE.MeshStandardMaterial({ color: 0x4d5961, roughness: 0.9 }),
    );

    rampMesh.position.set(ramp.x, Math.max(ramp.startHeight, ramp.endHeight) / 2, ramp.z);
    rampMesh.rotation.x = ramp.rotationX;
    rampMesh.receiveShadow = true;
    scene.add(rampMesh);

    state.platforms.push({
      type: "ramp",
      x: ramp.x,
      minX: ramp.x - ramp.width / 2,
      maxX: ramp.x + ramp.width / 2,
      minZ: Math.min(ramp.startZ, ramp.endZ),
      maxZ: Math.max(ramp.startZ, ramp.endZ),
      startZ: ramp.startZ,
      endZ: ramp.endZ,
      startHeight: ramp.startHeight,
      endHeight: ramp.endHeight,
    });

  }

  function addPlatformSideBlockers(scene, x, z, width, depth, height, rampWidth) {
    const wallThickness = 0.45;
    const capWidth = (width - rampWidth) / 2;
    const leftX = x - width / 2 - wallThickness / 2;
    const rightX = x + width / 2 + wallThickness / 2;
    const frontZ = z - depth / 2 - wallThickness / 2;
    const backZ = z + depth / 2 + wallThickness / 2;
    const capLeftX = x - rampWidth / 2 - capWidth / 2;
    const capRightX = x + rampWidth / 2 + capWidth / 2;

    addObstacle(scene, leftX, height / 2, z, wallThickness, height, depth + wallThickness);
    addObstacle(scene, rightX, height / 2, z, wallThickness, height, depth + wallThickness);

    if (capWidth > 0.2) {
      addObstacle(scene, capLeftX, height / 2, frontZ, capWidth, height, wallThickness);
      addObstacle(scene, capRightX, height / 2, frontZ, capWidth, height, wallThickness);
      addObstacle(scene, capLeftX, height / 2, backZ, capWidth, height, wallThickness);
      addObstacle(scene, capRightX, height / 2, backZ, capWidth, height, wallThickness);
    }
  }

  window.ZR.map = {
    addObstacle,
    addObstacleBounds,
    addRamp,
    addTestPlatform,
    addWall,
    buildMap,
  };
})();

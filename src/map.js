(() => {
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

  window.ZR.map = {
    addObstacle,
    addObstacleBounds,
    addWall,
    buildMap,
  };
})();

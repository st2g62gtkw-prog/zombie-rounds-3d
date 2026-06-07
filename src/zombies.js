(() => {
  const {
    ENEMY_ATTACK_COOLDOWN,
    ENEMY_ATTACK_RANGE,
    ENEMY_TYPES,
    NAV_BLOCKED_RECALC_TIME,
    NAV_DEBUG,
    NAV_DEBUG_LINE_INTERVAL,
    NAV_PATH_PADDING,
    NAV_RECALC_TIME,
    NAV_WAYPOINT_REACH,
    PLAYER_RADIUS,
    ROUND_BASE_ENEMIES,
    ROUND_ENEMY_GROWTH,
    ROUND_SPEED_BONUS,
    SPAWN_OBSTACLE_CLEARANCE,
  } = window.ZR.config;
  const { canOccupy } = window.ZR.collision;
  const { state } = window.ZR.gameState;
  const {
    cellKey,
    findNearestWalkableCell,
    findPath,
    formatCell,
    gridToWorld,
    isDirectPathClear,
    worldToGrid,
  } = window.ZR.pathfinding;
  const { scene } = window.ZR.scene;
  const {
    getHorizontalDistance,
    getThree,
    randomBetween,
    shuffleArray,
  } = window.ZR.utils;
  const THREE = getThree();

  function spawnRound(roundNumber) {
    const amount = ROUND_BASE_ENEMIES + (roundNumber - 1) * ROUND_ENEMY_GROWTH;
    const enemyTypes = buildRoundEnemyTypes(roundNumber, amount);

    for (const typeKey of enemyTypes) {
      const type = ENEMY_TYPES[typeKey];
      const spawn = findSpawnPoint(type.radius);
      const mesh = createEnemyMesh(type);
      mesh.position.set(spawn.x, type.spawnY, spawn.z);
      scene.add(mesh);

      state.enemies.push({
        id: state.nextEnemyId,
        mesh,
        type: type.key,
        radius: type.radius,
        health: type.health,
        points: type.points,
        speed: type.speed + roundNumber * ROUND_SPEED_BONUS,
        lastAttack: 0,
        path: [],
        pathIndex: 0,
        pathTimer: 0,
        blockedTime: 0,
        lastDirectClear: null,
        lastLineDebugAt: 0,
        lastTargetCellKey: "",
      });
      state.nextEnemyId += 1;
    }
  }

  function updateEnemies(delta) {
    if (state.paused || state.gameOver) return;

    for (const enemy of state.enemies) {
      ensureEnemyNavigationState(enemy);
      enemy.pathTimer = Math.max(0, enemy.pathTimer - delta);

      const distance = getHorizontalDistance(enemy.mesh.position, state.playerPosition);
      const stopRange = PLAYER_RADIUS + enemy.radius + 0.15;

      enemy.mesh.lookAt(state.playerPosition.x, enemy.mesh.position.y, state.playerPosition.z);

      if (distance <= stopRange) {
        enemy.path = [];
        enemy.pathIndex = 0;
        enemy.blockedTime = 0;
        continue;
      }

      const directClear = isDirectPathClear(enemy.mesh.position, state.playerPosition, enemy.radius);
      debugEnemyLineState(enemy, directClear);

      const targetPosition = directClear
        ? state.playerPosition
        : getEnemyPathTarget(enemy, directClear);

      if (!targetPosition) continue;

      const maxStep = directClear
        ? Math.min(enemy.speed * delta, distance - stopRange)
        : enemy.speed * delta;
      const movedDistance = moveEnemyTowardTarget(enemy, targetPosition, maxStep);

      updateEnemyBlockedState(enemy, movedDistance, delta, directClear);
    }
  }

  function checkEnemyAttacks(damagePlayer) {
    if (state.paused || state.gameOver) return;

    const now = performance.now();

    for (const enemy of state.enemies) {
      const currentDistance = getHorizontalDistance(enemy.mesh.position, state.playerPosition);

      if (currentDistance <= ENEMY_ATTACK_RANGE && now - enemy.lastAttack > ENEMY_ATTACK_COOLDOWN) {
        enemy.lastAttack = now;
        damagePlayer(10);
      }
    }
  }

  function clearEnemies() {
    for (const enemy of state.enemies) {
      scene.remove(enemy.mesh);
    }

    state.enemies.length = 0;
  }

  function createEnemyMesh(type) {
    const enemy = new THREE.Group();
    enemy.scale.setScalar(type.scale);

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 1.1, 8),
      new THREE.MeshStandardMaterial({ color: type.bodyColor, roughness: 0.8 }),
    );
    body.position.y = 0.45;
    enemy.add(body);

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.45, 0.5),
      new THREE.MeshStandardMaterial({ color: type.headColor, roughness: 0.75 }),
    );
    head.position.y = 1.25;
    enemy.add(head);

    // El grupo completo recibe el raycast gracias a esta caja invisible simple.
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.8, 0.9),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hitBox.position.y = 0.75;
    enemy.add(hitBox);
    enemy.userData.hitBox = hitBox;

    return enemy;
  }

  function buildRoundEnemyTypes(roundNumber, amount) {
    let fastCount = 0;
    let heavyCount = 0;

    if (roundNumber >= 3) {
      fastCount = Math.max(1, Math.floor(amount * 0.25));
    }

    if (roundNumber >= 5) {
      heavyCount = Math.max(1, Math.floor(amount * 0.18));
      fastCount = Math.max(1, Math.floor(amount * 0.3));
    }

    const normalCount = Math.max(0, amount - fastCount - heavyCount);
    const types = [
      ...Array(normalCount).fill("normal"),
      ...Array(fastCount).fill("fast"),
      ...Array(heavyCount).fill("heavy"),
    ];

    return shuffleArray(types);
  }

  function findSpawnPoint(radius) {
    const spawnRadius = radius + SPAWN_OBSTACLE_CLEARANCE;

    for (let attempt = 0; attempt < 100; attempt += 1) {
      const edge = Math.floor(Math.random() * 4);
      const offset = randomBetween(-19, 19);
      const point = new THREE.Vector3();

      if (edge === 0) point.set(offset, 0, -20);
      if (edge === 1) point.set(offset, 0, 20);
      if (edge === 2) point.set(-20, 0, offset);
      if (edge === 3) point.set(20, 0, offset);

      const farEnough = point.distanceTo(new THREE.Vector3(
        state.playerPosition.x,
        0,
        state.playerPosition.z,
      )) > 12;

      if (farEnough && canOccupy(point, spawnRadius)) {
        return point;
      }
    }

    return new THREE.Vector3(18, 0, -18);
  }

  function ensureEnemyNavigationState(enemy) {
    if (!Array.isArray(enemy.path)) enemy.path = [];
    if (!Number.isFinite(enemy.pathIndex)) enemy.pathIndex = 0;
    if (!Number.isFinite(enemy.pathTimer)) enemy.pathTimer = 0;
    if (!Number.isFinite(enemy.blockedTime)) enemy.blockedTime = 0;
    if (!Number.isFinite(enemy.lastLineDebugAt)) enemy.lastLineDebugAt = 0;
    if (enemy.lastDirectClear === undefined) enemy.lastDirectClear = null;
    if (!enemy.lastTargetCellKey) enemy.lastTargetCellKey = "";
    if (!Number.isFinite(enemy.id)) {
      enemy.id = state.nextEnemyId;
      state.nextEnemyId += 1;
    }
  }

  function getEnemyPathTarget(enemy, directClear) {
    const navRadius = getEnemyNavigationRadius(enemy);
    const targetCell = findNearestWalkableCell(worldToGrid(state.playerPosition), navRadius);
    const targetCellKey = targetCell ? cellKey(targetCell) : "";
    const needsPath = enemy.pathTimer <= 0 ||
      enemy.path.length === 0 ||
      enemy.pathIndex >= enemy.path.length ||
      targetCellKey !== enemy.lastTargetCellKey;

    if (needsPath) {
      recalculateEnemyPath(enemy, "intervalo", directClear);
    }

    return getEnemyCurrentWaypoint(enemy);
  }

  function recalculateEnemyPath(enemy, reason, directClear) {
    const navRadius = getEnemyNavigationRadius(enemy);
    const zombieCell = worldToGrid(enemy.mesh.position);
    const playerCell = worldToGrid(state.playerPosition);
    const startCell = findNearestWalkableCell(zombieCell, navRadius);
    const targetCell = findNearestWalkableCell(playerCell, navRadius);
    const path = startCell && targetCell ? findPath(startCell, targetCell, navRadius) : [];

    enemy.path = path;
    enemy.pathIndex = path.length > 1 ? 1 : 0;
    enemy.pathTimer = NAV_RECALC_TIME;
    enemy.lastTargetCellKey = targetCell ? cellKey(targetCell) : "";

    debugEnemyPath(enemy, reason, directClear, zombieCell, playerCell, path);
  }

  function getEnemyNavigationRadius(enemy) {
    return enemy.radius + NAV_PATH_PADDING;
  }

  function getEnemyCurrentWaypoint(enemy) {
    while (enemy.pathIndex < enemy.path.length) {
      const waypoint = gridToWorld(enemy.path[enemy.pathIndex].row, enemy.path[enemy.pathIndex].col);

      if (getHorizontalDistance(enemy.mesh.position, waypoint) > NAV_WAYPOINT_REACH) {
        return waypoint;
      }

      enemy.pathIndex += 1;
    }

    return null;
  }

  function moveEnemyTowardTarget(enemy, targetPosition, maxStep) {
    const toTarget = new THREE.Vector3(
      targetPosition.x - enemy.mesh.position.x,
      0,
      targetPosition.z - enemy.mesh.position.z,
    );
    const targetDistance = toTarget.length();

    if (targetDistance <= 0.01 || maxStep <= 0) return 0;

    const step = Math.min(maxStep, targetDistance);
    const direction = toTarget.normalize();
    const nextPosition = enemy.mesh.position.clone();
    nextPosition.x += direction.x * step;
    nextPosition.z += direction.z * step;

    if (!canOccupy(nextPosition, enemy.radius)) return 0;

    enemy.mesh.position.x = nextPosition.x;
    enemy.mesh.position.z = nextPosition.z;
    return step;
  }

  function updateEnemyBlockedState(enemy, movedDistance, delta, directClear) {
    if (movedDistance > 0.01) {
      enemy.blockedTime = 0;
      return;
    }

    enemy.blockedTime += delta;

    if (enemy.blockedTime < NAV_BLOCKED_RECALC_TIME) return;

    enemy.blockedTime = 0;

    if (!directClear) {
      recalculateEnemyPath(enemy, "bloqueado", directClear);
    }
  }

  function debugEnemyLineState(enemy, directClear) {
    if (!NAV_DEBUG) return;

    const now = performance.now();
    const shouldLog = enemy.lastDirectClear !== directClear ||
      now - enemy.lastLineDebugAt >= NAV_DEBUG_LINE_INTERVAL;

    if (!shouldLog) return;

    enemy.lastDirectClear = directClear;
    enemy.lastLineDebugAt = now;

    console.log("[ZombieNav] linea directa", {
      zombieId: enemy.id,
      zombieCell: formatCell(worldToGrid(enemy.mesh.position)),
      playerCell: formatCell(worldToGrid(state.playerPosition)),
      directClear,
    });
  }

  function debugEnemyPath(enemy, reason, directClear, zombieCell, playerCell, path) {
    if (!NAV_DEBUG) return;

    console.log("[ZombieNav] ruta calculada", {
      zombieId: enemy.id,
      reason,
      zombieCell: formatCell(zombieCell),
      playerCell: formatCell(playerCell),
      directClear,
      route: path.map(formatCell),
      nextWaypoint: formatCell(path[enemy.pathIndex]),
    });
  }

  window.ZR.zombies = {
    checkEnemyAttacks,
    clearEnemies,
    createEnemyMesh,
    spawnRound,
    updateEnemies,
  };
})();

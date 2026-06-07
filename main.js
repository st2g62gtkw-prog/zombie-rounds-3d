const THREE = window.THREE;

if (!THREE) {
  throw new Error("Three.js no se cargo correctamente.");
}

const canvas = document.querySelector("#gameCanvas");
const healthValue = document.querySelector("#healthValue");
const roundValue = document.querySelector("#roundValue");
const enemyValue = document.querySelector("#enemyValue");
const scoreValue = document.querySelector("#scoreValue");
const bestScoreValue = document.querySelector("#bestScoreValue");
const ammoValue = document.querySelector("#ammoValue");
const maxAmmoValue = document.querySelector("#maxAmmoValue");
const reloadStatus = document.querySelector("#reloadStatus");
const damageBoostValue = document.querySelector("#damageBoostValue");
const damageFlash = document.querySelector("#damageFlash");
const scorePopups = document.querySelector("#scorePopups");
const startMessage = document.querySelector("#startMessage");
const gameOverMessage = document.querySelector("#gameOverMessage");
const pauseMessage = document.querySelector("#pauseMessage");
const roundMessage = document.querySelector("#roundMessage");
const roundMessageText = document.querySelector("#roundMessageText");
const playButton = document.querySelector("#playButton");
const restartButton = document.querySelector("#restartButton");
const finalRoundValue = document.querySelector("#finalRoundValue");
const finalScoreValue = document.querySelector("#finalScoreValue");
const finalBestScoreValue = document.querySelector("#finalBestScoreValue");

const MAX_HEALTH = 100;
const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.45;
const ARENA_LIMIT = 23;
const BEST_SCORE_KEY = "zombieRounds3D.bestScore";
const MAX_AMMO = 8;
const RELOAD_TIME = 1200;
const ROUND_MESSAGE_TIME = 1000;
const POWER_UP_CHANCE = 0.65;
const MAX_POWER_UPS = 2;
const POWER_UP_DURATION = 14000;
const POWER_UP_PICKUP_RANGE = 1.2;
const DAMAGE_BOOST_TIME = 8000;
const ENEMY_ATTACK_COOLDOWN = 850;
const ENEMY_ATTACK_RANGE = 1.7;
const SPAWN_OBSTACLE_CLEARANCE = 1.2;
const NAV_CELL_SIZE = 1;
const NAV_MIN_X = -ARENA_LIMIT;
const NAV_MIN_Z = -ARENA_LIMIT;
const NAV_COLUMNS = Math.floor((ARENA_LIMIT * 2) / NAV_CELL_SIZE) + 1;
const NAV_ROWS = NAV_COLUMNS;
const NAV_RECALC_TIME = 0.35;
const NAV_BLOCKED_RECALC_TIME = 0.55;
const NAV_WAYPOINT_REACH = 0.3;
const NAV_PATH_PADDING = 0.22;
const NAV_DEBUG = true;
const NAV_DEBUG_LINE_INTERVAL = 1500;

const ENEMY_TYPES = {
  normal: {
    key: "normal",
    bodyColor: 0x5eb55a,
    headColor: 0x7fd06e,
    scale: 1,
    radius: 0.42,
    spawnY: 0.8,
    speed: 1.35,
    health: 1,
    points: 100,
  },
  fast: {
    key: "fast",
    bodyColor: 0x8fd14f,
    headColor: 0xd4f06c,
    scale: 0.74,
    radius: 0.32,
    spawnY: 0.62,
    speed: 2.05,
    health: 1,
    points: 150,
  },
  heavy: {
    key: "heavy",
    bodyColor: 0x7a5b35,
    headColor: 0xb08a45,
    scale: 1.35,
    radius: 0.58,
    spawnY: 1,
    speed: 0.85,
    health: 3,
    points: 250,
  },
};

const POWER_UP_TYPES = {
  heal: {
    key: "heal",
    color: 0x5de08a,
    kind: "sphere",
  },
  ammo: {
    key: "ammo",
    color: 0x5aa8ff,
    kind: "box",
  },
  damage: {
    key: "damage",
    color: 0xff6b4a,
    kind: "diamond",
  },
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x151a20);
scene.fog = new THREE.Fog(0x151a20, 20, 58);

const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const raycaster = new THREE.Raycaster();
raycaster.far = 60;

const keys = new Set();
const clock = new THREE.Clock();
const playerPosition = new THREE.Vector3(0, PLAYER_HEIGHT, 7);
const obstacles = [];
const enemies = [];
const powerUps = [];

let yaw = 0;
let pitch = 0;
let health = 100;
let round = 1;
let score = 0;
let bestScore = loadBestScore();
let gameStarted = false;
let gameOver = false;
let roundChanging = false;
let paused = false;
let ammo = MAX_AMMO;
let reloading = false;
let reloadTimer = null;
let roundTimer = null;
let lastPauseChange = 0;
let damageBoostActive = false;
let damageBoostTimer = null;
let damageFlashTimer = null;
let nextEnemyId = 1;

initScene();
resetGame();
animate();

function initScene() {
  const ambient = new THREE.HemisphereLight(0xdcecff, 0x28301f, 1.35);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 1.45);
  sun.position.set(9, 16, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(52, 52),
    new THREE.MeshStandardMaterial({ color: 0x3a4037, roughness: 0.9 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  addWall(0, 1, -25, 50, 2, 1);
  addWall(0, 1, 25, 50, 2, 1);
  addWall(-25, 1, 0, 1, 2, 50);
  addWall(25, 1, 0, 1, 2, 50);

  addObstacle(-14, 1, -13, 2.5, 2, 8);
  addObstacle(-9, 1, 8, 10, 2, 2.5);
  addObstacle(12, 1, -11, 2.5, 2, 12);
  addObstacleBounds(6, 14.5, 11, 13.5);
  addObstacleBounds(12, 14.5, 4, 13.5);
}

function addWall(x, y, z, width, height, depth) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color: 0x5a6157, roughness: 0.85 }),
  );
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);
  obstacles.push({ x, z, halfX: width / 2, halfZ: depth / 2 });
}

function addObstacle(x, y, z, width, height, depth) {
  const obstacle = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color: 0x697163, roughness: 0.85 }),
  );
  obstacle.position.set(x, y, z);
  obstacle.castShadow = true;
  obstacle.receiveShadow = true;
  scene.add(obstacle);
  obstacles.push({ x, z, halfX: width / 2, halfZ: depth / 2 });
}

function addObstacleBounds(minX, maxX, minZ, maxZ) {
  const x = (minX + maxX) / 2;
  const z = (minZ + maxZ) / 2;
  const width = maxX - minX;
  const depth = maxZ - minZ;
  addObstacle(x, 1, z, width, 2, depth);
}

function loadBestScore() {
  try {
    const savedScore = Number(localStorage.getItem(BEST_SCORE_KEY));
    return Number.isFinite(savedScore) ? savedScore : 0;
  } catch {
    return 0;
  }
}

function saveBestScore() {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
  } catch {
    // El juego sigue funcionando aunque el navegador bloquee localStorage.
  }
}

function updateBestScore() {
  if (score <= bestScore) return;
  bestScore = score;
  saveBestScore();
}

function clearReloadTimer() {
  if (!reloadTimer) return;
  window.clearTimeout(reloadTimer);
  reloadTimer = null;
}

function clearRoundTimer() {
  if (!roundTimer) return;
  window.clearTimeout(roundTimer);
  roundTimer = null;
}

function clearDamageBoostTimer() {
  if (!damageBoostTimer) return;
  window.clearTimeout(damageBoostTimer);
  damageBoostTimer = null;
}

function clearDamageFlashTimer() {
  if (damageFlashTimer) {
    window.clearTimeout(damageFlashTimer);
    damageFlashTimer = null;
  }

  damageFlash.classList.remove("active");
}

function showDamageFlash() {
  damageFlash.classList.add("active");

  if (damageFlashTimer) {
    window.clearTimeout(damageFlashTimer);
  }

  damageFlashTimer = window.setTimeout(() => {
    damageFlash.classList.remove("active");
    damageFlashTimer = null;
  }, 180);
}

function reloadAmmo() {
  if (!gameStarted || gameOver || paused || reloading || ammo === MAX_AMMO) return;

  reloading = true;
  updateHud();

  reloadTimer = window.setTimeout(() => {
    ammo = MAX_AMMO;
    reloading = false;
    reloadTimer = null;
    updateHud();
  }, RELOAD_TIME);
}

function pauseGame() {
  if (!gameStarted || gameOver || paused) return;

  paused = true;
  lastPauseChange = performance.now();
  keys.clear();
  pauseMessage.classList.remove("hidden");

  if (document.pointerLockElement === canvas) {
    document.exitPointerLock();
  }
}

function resumeGame() {
  if (!gameStarted || gameOver || !paused) return;

  paused = false;
  lastPauseChange = performance.now();
  pauseMessage.classList.add("hidden");
  canvas.requestPointerLock();
}

function startGame() {
  resetGame(true);
  canvas.requestPointerLock();
}

function resetGame(startNow = false) {
  clearEnemies();
  clearPowerUps();
  clearReloadTimer();
  clearRoundTimer();
  clearDamageBoostTimer();
  clearDamageFlashTimer();
  keys.clear();
  playerPosition.set(0, PLAYER_HEIGHT, 7);
  yaw = 0;
  pitch = 0;
  health = MAX_HEALTH;
  round = 1;
  score = 0;
  ammo = MAX_AMMO;
  reloading = false;
  damageBoostActive = false;
  gameStarted = startNow;
  gameOver = false;
  roundChanging = false;
  paused = false;
  pauseMessage.classList.add("hidden");
  roundMessage.classList.add("hidden");
  roundMessageText.textContent = "Ronda 1";
  gameOverMessage.classList.add("hidden");
  startMessage.classList.toggle("hidden", startNow);
  if (startNow) spawnRound(round);
  updateHud();
  updateCamera();
}

function spawnRound(roundNumber) {
  const amount = 3 + (roundNumber - 1) * 2;
  const enemyTypes = buildRoundEnemyTypes(roundNumber, amount);

  for (const typeKey of enemyTypes) {
    const type = ENEMY_TYPES[typeKey];
    const spawn = findSpawnPoint(type.radius);
    const mesh = createEnemyMesh(type);
    mesh.position.set(spawn.x, type.spawnY, spawn.z);
    scene.add(mesh);

    enemies.push({
      id: nextEnemyId,
      mesh,
      type: type.key,
      radius: type.radius,
      health: type.health,
      points: type.points,
      speed: type.speed + roundNumber * 0.09,
      lastAttack: 0,
      path: [],
      pathIndex: 0,
      pathTimer: 0,
      blockedTime: 0,
      lastDirectClear: null,
      lastLineDebugAt: 0,
      lastTargetCellKey: "",
    });
    nextEnemyId += 1;
  }

  updateHud();
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

function shuffleArray(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[otherIndex]] = [shuffled[otherIndex], shuffled[index]];
  }

  return shuffled;
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

    const farEnough = point.distanceTo(new THREE.Vector3(playerPosition.x, 0, playerPosition.z)) > 12;

    if (farEnough && canOccupy(point, spawnRadius)) {
      return point;
    }
  }

  return new THREE.Vector3(18, 0, -18);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function updateCamera() {
  camera.position.copy(playerPosition);
  camera.rotation.set(pitch, yaw, 0);
}

function updateHud() {
  healthValue.textContent = Math.max(0, Math.ceil(health));
  roundValue.textContent = round;
  enemyValue.textContent = enemies.length;
  scoreValue.textContent = score;
  bestScoreValue.textContent = bestScore;
  ammoValue.textContent = ammo;
  maxAmmoValue.textContent = MAX_AMMO;
  reloadStatus.textContent = reloading ? " (recargando)" : "";
  damageBoostValue.textContent = damageBoostActive ? "x2" : "Normal";
}

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  if (gameStarted && !gameOver && !paused) {
    updatePlayer(delta);
    updatePowerUps();
    updateEnemies(delta);
    checkEnemyAttacks();
    checkRoundState();
    updateCamera();
  }

  renderer.render(scene, camera);
}

function updatePlayer(delta) {
  const input = new THREE.Vector3();

  if (keys.has("KeyW")) input.z -= 1;
  if (keys.has("KeyS")) input.z += 1;
  if (keys.has("KeyA")) input.x -= 1;
  if (keys.has("KeyD")) input.x += 1;

  if (input.lengthSq() === 0) return;

  input.normalize();

  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const movement = new THREE.Vector3()
    .addScaledVector(forward, -input.z)
    .addScaledVector(right, input.x)
    .multiplyScalar(6 * delta);

  const nextX = playerPosition.clone();
  nextX.x += movement.x;
  if (canOccupy(nextX, PLAYER_RADIUS)) playerPosition.x = nextX.x;

  const nextZ = playerPosition.clone();
  nextZ.z += movement.z;
  if (canOccupy(nextZ, PLAYER_RADIUS)) playerPosition.z = nextZ.z;
}

function updateEnemies(delta) {
  if (paused || gameOver) return;

  for (const enemy of enemies) {
    ensureEnemyNavigationState(enemy);
    enemy.pathTimer = Math.max(0, enemy.pathTimer - delta);

    const distance = getHorizontalDistance(enemy.mesh.position, playerPosition);
    const stopRange = PLAYER_RADIUS + enemy.radius + 0.15;

    enemy.mesh.lookAt(playerPosition.x, enemy.mesh.position.y, playerPosition.z);

    if (distance <= stopRange) {
      enemy.path = [];
      enemy.pathIndex = 0;
      enemy.blockedTime = 0;
      continue;
    }

    const directClear = isDirectPathClear(enemy.mesh.position, playerPosition, enemy.radius);
    debugEnemyLineState(enemy, directClear);

    const targetPosition = directClear
      ? playerPosition
      : getEnemyPathTarget(enemy, directClear);

    if (!targetPosition) continue;

    const maxStep = directClear
      ? Math.min(enemy.speed * delta, distance - stopRange)
      : enemy.speed * delta;
    const movedDistance = moveEnemyTowardTarget(enemy, targetPosition, maxStep);

    updateEnemyBlockedState(enemy, movedDistance, delta, directClear);
  }
}

function checkEnemyAttacks() {
  if (paused || gameOver) return;

  const now = performance.now();

  for (const enemy of enemies) {
    const currentDistance = getHorizontalDistance(enemy.mesh.position, playerPosition);

    if (currentDistance <= ENEMY_ATTACK_RANGE && now - enemy.lastAttack > ENEMY_ATTACK_COOLDOWN) {
      enemy.lastAttack = now;
      damagePlayer(10);
    }
  }
}

function ensureEnemyNavigationState(enemy) {
  if (!Array.isArray(enemy.path)) enemy.path = [];
  if (!Number.isFinite(enemy.pathIndex)) enemy.pathIndex = 0;
  if (!Number.isFinite(enemy.pathTimer)) enemy.pathTimer = 0;
  if (!Number.isFinite(enemy.blockedTime)) enemy.blockedTime = 0;
  if (!Number.isFinite(enemy.lastLineDebugAt)) enemy.lastLineDebugAt = 0;
  if (enemy.lastDirectClear === undefined) enemy.lastDirectClear = null;
  if (!enemy.lastTargetCellKey) enemy.lastTargetCellKey = "";
}

function getEnemyPathTarget(enemy, directClear) {
  const navRadius = getEnemyNavigationRadius(enemy);
  const targetCell = findNearestWalkableCell(worldToGrid(playerPosition), navRadius);
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
  const playerCell = worldToGrid(playerPosition);
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

function isDirectPathClear(startPosition, targetPosition, radius) {
  return obstacles.every((obstacle) => !lineIntersectsExpandedObstacle(
    startPosition,
    targetPosition,
    obstacle,
    radius,
  ));
}

function lineIntersectsExpandedObstacle(startPosition, targetPosition, obstacle, radius) {
  const minX = obstacle.x - obstacle.halfX - radius;
  const maxX = obstacle.x + obstacle.halfX + radius;
  const minZ = obstacle.z - obstacle.halfZ - radius;
  const maxZ = obstacle.z + obstacle.halfZ + radius;

  return lineIntersectsRect(
    startPosition.x,
    startPosition.z,
    targetPosition.x,
    targetPosition.z,
    minX,
    maxX,
    minZ,
    maxZ,
  );
}

function lineIntersectsRect(x1, z1, x2, z2, minX, maxX, minZ, maxZ) {
  const directionX = x2 - x1;
  const directionZ = z2 - z1;
  const range = { min: 0, max: 1 };

  return clipLineAxis(-directionX, x1 - minX, range) &&
    clipLineAxis(directionX, maxX - x1, range) &&
    clipLineAxis(-directionZ, z1 - minZ, range) &&
    clipLineAxis(directionZ, maxZ - z1, range) &&
    range.max >= range.min;
}

function clipLineAxis(direction, distanceToEdge, range) {
  if (direction === 0) return distanceToEdge >= 0;

  const ratio = distanceToEdge / direction;

  if (direction < 0) {
    if (ratio > range.max) return false;
    if (ratio > range.min) range.min = ratio;
  } else {
    if (ratio < range.min) return false;
    if (ratio < range.max) range.max = ratio;
  }

  return true;
}

function worldToGrid(position) {
  return {
    row: clampGridIndex(Math.round((position.z - NAV_MIN_Z) / NAV_CELL_SIZE), NAV_ROWS),
    col: clampGridIndex(Math.round((position.x - NAV_MIN_X) / NAV_CELL_SIZE), NAV_COLUMNS),
  };
}

function gridToWorld(row, col) {
  return new THREE.Vector3(
    NAV_MIN_X + col * NAV_CELL_SIZE,
    0,
    NAV_MIN_Z + row * NAV_CELL_SIZE,
  );
}

function isWalkable(row, col, radius = 0.5) {
  if (!isInsideGrid(row, col)) return false;
  return canOccupy(gridToWorld(row, col), radius);
}

function findPath(startCell, targetCell, radius = 0.5) {
  const start = isWalkable(startCell.row, startCell.col, radius)
    ? startCell
    : findNearestWalkableCell(startCell, radius);
  const target = isWalkable(targetCell.row, targetCell.col, radius)
    ? targetCell
    : findNearestWalkableCell(targetCell, radius);

  if (!start || !target) return [];

  const open = [{
    cell: start,
    gScore: 0,
    fScore: getGridHeuristic(start, target),
  }];
  const cameFrom = new Map();
  const gScores = new Map([[cellKey(start), 0]]);
  const closed = new Set();

  while (open.length > 0) {
    open.sort((first, second) => first.fScore - second.fScore);
    const current = open.shift().cell;
    const currentKey = cellKey(current);

    if (sameCell(current, target)) {
      return reconstructPath(cameFrom, current);
    }

    if (closed.has(currentKey)) continue;
    closed.add(currentKey);

    for (const neighbor of getWalkableNeighbors(current, radius)) {
      const neighborKey = cellKey(neighbor);
      if (closed.has(neighborKey)) continue;

      const tentativeGScore = gScores.get(currentKey) + getMoveCost(current, neighbor);
      const knownGScore = gScores.get(neighborKey);

      if (knownGScore !== undefined && tentativeGScore >= knownGScore) continue;

      cameFrom.set(neighborKey, current);
      gScores.set(neighborKey, tentativeGScore);
      open.push({
        cell: neighbor,
        gScore: tentativeGScore,
        fScore: tentativeGScore + getGridHeuristic(neighbor, target),
      });
    }
  }

  return [];
}

function findNearestWalkableCell(cell, radius = 0.5) {
  if (!cell) return null;

  const start = {
    row: clampGridIndex(cell.row, NAV_ROWS),
    col: clampGridIndex(cell.col, NAV_COLUMNS),
  };
  const queue = [start];
  const visited = new Set([cellKey(start)]);

  while (queue.length > 0) {
    const current = queue.shift();

    if (isWalkable(current.row, current.col, radius)) return current;

    for (const neighbor of getGridNeighbors(current)) {
      const key = cellKey(neighbor);
      if (visited.has(key)) continue;

      visited.add(key);
      queue.push(neighbor);
    }
  }

  return null;
}

function getWalkableNeighbors(cell, radius) {
  return getGridNeighbors(cell).filter((neighbor) => {
    if (!isWalkable(neighbor.row, neighbor.col, radius)) return false;

    const rowDelta = neighbor.row - cell.row;
    const colDelta = neighbor.col - cell.col;

    if (rowDelta !== 0 && colDelta !== 0) {
      return isWalkable(cell.row, cell.col + colDelta, radius) &&
        isWalkable(cell.row + rowDelta, cell.col, radius);
    }

    return true;
  });
}

function getGridNeighbors(cell) {
  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
    { row: -1, col: -1 },
    { row: -1, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 1 },
  ];

  return directions
    .map((direction) => ({
      row: cell.row + direction.row,
      col: cell.col + direction.col,
    }))
    .filter((neighbor) => isInsideGrid(neighbor.row, neighbor.col));
}

function getMoveCost(first, second) {
  const diagonal = first.row !== second.row && first.col !== second.col;
  return diagonal ? Math.SQRT2 : 1;
}

function getGridHeuristic(first, second) {
  const rowDistance = Math.abs(first.row - second.row);
  const colDistance = Math.abs(first.col - second.col);
  const straight = Math.abs(rowDistance - colDistance);
  const diagonal = Math.min(rowDistance, colDistance);
  return straight + diagonal * Math.SQRT2;
}

function reconstructPath(cameFrom, currentCell) {
  const path = [currentCell];
  let currentKey = cellKey(currentCell);

  while (cameFrom.has(currentKey)) {
    const previous = cameFrom.get(currentKey);
    path.unshift(previous);
    currentKey = cellKey(previous);
  }

  return path;
}

function isInsideGrid(row, col) {
  return row >= 0 && row < NAV_ROWS && col >= 0 && col < NAV_COLUMNS;
}

function clampGridIndex(value, size) {
  return Math.max(0, Math.min(size - 1, value));
}

function sameCell(first, second) {
  return first.row === second.row && first.col === second.col;
}

function cellKey(cell) {
  return `${cell.row},${cell.col}`;
}

function formatCell(cell) {
  return cell ? { row: cell.row, col: cell.col } : null;
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
    playerCell: formatCell(worldToGrid(playerPosition)),
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

function damagePlayer(amount) {
  health = Math.max(0, health - amount);
  showDamageFlash();
  updateHud();

  if (health <= 0) {
    endGame();
  }
}

function getHorizontalDistance(first, second) {
  const deltaX = first.x - second.x;
  const deltaZ = first.z - second.z;
  return Math.hypot(deltaX, deltaZ);
}

function canOccupy(position, radius) {
  if (
    position.x < -ARENA_LIMIT + radius ||
    position.x > ARENA_LIMIT - radius ||
    position.z < -ARENA_LIMIT + radius ||
    position.z > ARENA_LIMIT - radius
  ) {
    return false;
  }

  return obstacles.every((obstacle) => {
    const insideX = Math.abs(position.x - obstacle.x) < obstacle.halfX + radius;
    const insideZ = Math.abs(position.z - obstacle.z) < obstacle.halfZ + radius;
    return !(insideX && insideZ);
  });
}

function shoot() {
  if (
    !gameStarted ||
    gameOver ||
    paused ||
    reloading ||
    roundChanging ||
    ammo <= 0 ||
    document.pointerLockElement !== canvas
  ) {
    return;
  }

  ammo -= 1;
  updateHud();

  raycaster.setFromCamera({ x: 0, y: 0 }, camera);

  const hitBoxes = enemies.map((enemy) => enemy.mesh.userData.hitBox);
  const hits = raycaster.intersectObjects(hitBoxes, false);
  const targetPoint = hits[0]?.point ?? raycaster.ray.at(raycaster.far, new THREE.Vector3());

  drawShot(targetPoint);

  if (!hits.length) return;

  const enemyGroup = hits[0].object.parent;
  const enemyIndex = enemies.findIndex((enemy) => enemy.mesh === enemyGroup);

  if (enemyIndex !== -1) {
    const enemy = enemies[enemyIndex];
    enemy.health -= damageBoostActive ? 2 : 1;

    if (enemy.health <= 0) {
      scene.remove(enemyGroup);
      enemies.splice(enemyIndex, 1);
      score += enemy.points;
      showScorePopup(enemy.points);
      updateBestScore();
    }

    updateHud();
  }
}

function drawShot(targetPoint) {
  const origin = camera.position.clone();
  const geometry = new THREE.BufferGeometry().setFromPoints([origin, targetPoint]);
  const material = new THREE.LineBasicMaterial({ color: 0xffdf64 });
  const line = new THREE.Line(geometry, material);

  scene.add(line);
  window.setTimeout(() => {
    scene.remove(line);
    geometry.dispose();
    material.dispose();
  }, 70);
}

function showScorePopup(points) {
  const popup = document.createElement("div");
  popup.className = "scorePopup";
  popup.textContent = `+${points}`;
  popup.style.left = `${50 + randomBetween(-7, 7)}%`;
  popup.style.top = `${45 + randomBetween(-5, 5)}%`;
  scorePopups.appendChild(popup);

  window.setTimeout(() => {
    popup.remove();
  }, 850);
}

function maybeSpawnPowerUp() {
  if (powerUps.length >= MAX_POWER_UPS || Math.random() > POWER_UP_CHANCE) return;

  const typeKeys = Object.keys(POWER_UP_TYPES);
  const type = POWER_UP_TYPES[typeKeys[Math.floor(Math.random() * typeKeys.length)]];
  const position = findPowerUpPoint();
  const mesh = createPowerUpMesh(type);
  mesh.position.set(position.x, 0.45, position.z);
  scene.add(mesh);

  powerUps.push({
    mesh,
    type: type.key,
    expiresAt: performance.now() + POWER_UP_DURATION,
  });
}

function createPowerUpMesh(type) {
  let geometry;

  if (type.kind === "sphere") {
    geometry = new THREE.SphereGeometry(0.38, 12, 8);
  } else if (type.kind === "box") {
    geometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
  } else {
    geometry = new THREE.OctahedronGeometry(0.48, 0);
  }

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: type.color,
      emissive: type.color,
      emissiveIntensity: 0.18,
      roughness: 0.55,
    }),
  );
  mesh.userData.powerUpType = type.key;

  return mesh;
}

function findPowerUpPoint() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const point = new THREE.Vector3(randomBetween(-18, 18), 0, randomBetween(-18, 18));
    const farEnough = point.distanceTo(new THREE.Vector3(playerPosition.x, 0, playerPosition.z)) > 5;

    if (farEnough && canOccupy(point, 0.5)) {
      return point;
    }
  }

  return new THREE.Vector3(0, 0, -8);
}

function updatePowerUps() {
  const now = performance.now();
  const playerFlat = new THREE.Vector3(playerPosition.x, 0, playerPosition.z);

  for (let index = powerUps.length - 1; index >= 0; index -= 1) {
    const powerUp = powerUps[index];
    const powerUpFlat = new THREE.Vector3(powerUp.mesh.position.x, 0, powerUp.mesh.position.z);

    powerUp.mesh.rotation.y += 0.04;
    powerUp.mesh.position.y = 0.45 + Math.sin(now * 0.006 + index) * 0.08;

    if (now > powerUp.expiresAt) {
      removePowerUp(index);
      continue;
    }

    if (powerUpFlat.distanceTo(playerFlat) <= POWER_UP_PICKUP_RANGE) {
      applyPowerUp(powerUp.type);
      removePowerUp(index);
    }
  }
}

function applyPowerUp(type) {
  if (type === "heal") {
    health = Math.min(MAX_HEALTH, health + 25);
  }

  if (type === "ammo") {
    ammo = MAX_AMMO;
    reloading = false;
    clearReloadTimer();
  }

  if (type === "damage") {
    activateDamageBoost();
  }

  updateHud();
}

function activateDamageBoost() {
  damageBoostActive = true;
  clearDamageBoostTimer();

  damageBoostTimer = window.setTimeout(() => {
    damageBoostActive = false;
    damageBoostTimer = null;
    updateHud();
  }, DAMAGE_BOOST_TIME);
}

function removePowerUp(index) {
  const [powerUp] = powerUps.splice(index, 1);
  scene.remove(powerUp.mesh);
  powerUp.mesh.geometry.dispose();
  powerUp.mesh.material.dispose();
}

function checkRoundState() {
  if (roundChanging || enemies.length > 0 || gameOver) return;

  roundChanging = true;
  maybeSpawnPowerUp();
  round += 1;
  roundMessageText.textContent = `Ronda ${round}`;
  roundMessage.classList.remove("hidden");
  updateHud();

  roundTimer = window.setTimeout(() => {
    if (gameOver || !gameStarted) return;
    spawnRound(round);
    roundMessage.classList.add("hidden");
    roundChanging = false;
    roundTimer = null;
  }, ROUND_MESSAGE_TIME);
}

function clearEnemies() {
  for (const enemy of enemies) {
    scene.remove(enemy.mesh);
  }
  enemies.length = 0;
}

function clearPowerUps() {
  while (powerUps.length > 0) {
    removePowerUp(powerUps.length - 1);
  }
}

function endGame() {
  gameOver = true;
  gameStarted = false;
  health = 0;
  clearReloadTimer();
  clearDamageBoostTimer();
  clearDamageFlashTimer();
  reloading = false;
  damageBoostActive = false;
  updateBestScore();
  updateHud();
  finalRoundValue.textContent = round;
  finalScoreValue.textContent = score;
  finalBestScoreValue.textContent = bestScore;
  gameOverMessage.classList.remove("hidden");

  if (document.pointerLockElement === canvas) {
    document.exitPointerLock();
  }
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Escape") {
    if (!gameStarted || gameOver) return;
    event.preventDefault();

    if (paused) {
      if (performance.now() - lastPauseChange < 180) return;
      resumeGame();
    } else {
      pauseGame();
    }

    return;
  }

  if (event.code === "KeyR" && gameOver) {
    startGame();
    return;
  }

  if (event.code === "KeyR") {
    reloadAmmo();
    return;
  }

  if (paused) return;

  keys.add(event.code);
});

document.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

document.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement !== canvas || gameOver || paused) return;

  yaw -= event.movementX * 0.0024;
  pitch -= event.movementY * 0.0024;
  pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, pitch));
});

document.addEventListener("pointerlockchange", () => {
  startMessage.classList.toggle("hidden", gameStarted || gameOver);

  if (gameStarted && !gameOver && !paused && document.pointerLockElement !== canvas) {
    pauseGame();
  }
});

document.addEventListener("click", (event) => {
  if (event.target === playButton) return;
  if (event.target === restartButton) return;
  if (gameOver || !gameStarted || paused) return;

  if (document.pointerLockElement !== canvas) {
    canvas.requestPointerLock();
    return;
  }

  shoot();
});

playButton.addEventListener("click", (event) => {
  event.stopPropagation();
  startGame();
});

restartButton.addEventListener("click", (event) => {
  event.stopPropagation();
  startGame();
});

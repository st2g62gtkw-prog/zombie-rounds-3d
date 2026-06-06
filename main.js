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

const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.45;
const ARENA_LIMIT = 23;
const BEST_SCORE_KEY = "zombieRounds3D.bestScore";
const MAX_AMMO = 8;
const RELOAD_TIME = 1200;
const ROUND_MESSAGE_TIME = 1000;

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

const raycaster = new THREE.Raycaster();
raycaster.far = 60;

const keys = new Set();
const clock = new THREE.Clock();
const playerPosition = new THREE.Vector3(0, PLAYER_HEIGHT, 7);
const obstacles = [];
const enemies = [];

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

initScene();
resetGame();
animate();

function initScene() {
  const ambient = new THREE.HemisphereLight(0xdcecff, 0x28301f, 1.7);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(8, 14, 5);
  scene.add(sun);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(52, 52),
    new THREE.MeshStandardMaterial({ color: 0x3a4037, roughness: 0.9 }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  addWall(0, 1, -25, 50, 2, 1);
  addWall(0, 1, 25, 50, 2, 1);
  addWall(-25, 1, 0, 1, 2, 50);
  addWall(25, 1, 0, 1, 2, 50);

  addObstacle(-7, 1, -4, 4, 2, 2);
  addObstacle(6, 1, -8, 3, 2, 5);
  addObstacle(8, 1, 6, 5, 2, 2);
  addObstacle(-9, 1, 9, 3, 2, 4);

  scene.add(new THREE.GridHelper(50, 50, 0x67705e, 0x30362f));
}

function addWall(x, y, z, width, height, depth) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color: 0x5a6157, roughness: 0.85 }),
  );
  wall.position.set(x, y, z);
  scene.add(wall);
  obstacles.push({ x, z, halfX: width / 2, halfZ: depth / 2 });
}

function addObstacle(x, y, z, width, height, depth) {
  const obstacle = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color: 0x697163, roughness: 0.85 }),
  );
  obstacle.position.set(x, y, z);
  scene.add(obstacle);
  obstacles.push({ x, z, halfX: width / 2, halfZ: depth / 2 });
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
  clearReloadTimer();
  clearRoundTimer();
  keys.clear();
  playerPosition.set(0, PLAYER_HEIGHT, 7);
  yaw = 0;
  pitch = 0;
  health = 100;
  round = 1;
  score = 0;
  ammo = MAX_AMMO;
  reloading = false;
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
      mesh,
      type: type.key,
      radius: type.radius,
      health: type.health,
      points: type.points,
      speed: type.speed + roundNumber * 0.09,
      lastAttack: 0,
    });
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
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const edge = Math.floor(Math.random() * 4);
    const offset = randomBetween(-19, 19);
    const point = new THREE.Vector3();

    if (edge === 0) point.set(offset, 0, -20);
    if (edge === 1) point.set(offset, 0, 20);
    if (edge === 2) point.set(-20, 0, offset);
    if (edge === 3) point.set(20, 0, offset);

    const farEnough = point.distanceTo(new THREE.Vector3(playerPosition.x, 0, playerPosition.z)) > 12;

    if (farEnough && canOccupy(point, radius)) {
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
}

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  if (gameStarted && !gameOver && !paused) {
    updatePlayer(delta);
    updateEnemies(delta);
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
  const now = performance.now();
  const playerFlat = new THREE.Vector3(playerPosition.x, 0, playerPosition.z);

  for (const enemy of enemies) {
    const enemyFlat = new THREE.Vector3(enemy.mesh.position.x, 0, enemy.mesh.position.z);
    const toPlayer = playerFlat.clone().sub(enemyFlat);
    const distance = toPlayer.length();
    const attackRange = PLAYER_RADIUS + enemy.radius + 0.2;

    enemy.mesh.lookAt(playerPosition.x, enemy.mesh.position.y, playerPosition.z);

    if (distance > attackRange) {
      const step = Math.min(enemy.speed * delta, distance - attackRange);
      const direction = toPlayer.normalize();
      const nextX = enemy.mesh.position.clone();
      const nextZ = enemy.mesh.position.clone();
      nextX.x += direction.x * step;
      nextZ.z += direction.z * step;

      // Mover por ejes separados permite deslizar contra obstaculos sin pathfinding.
      if (canOccupy(nextX, enemy.radius)) enemy.mesh.position.x = nextX.x;
      if (canOccupy(nextZ, enemy.radius)) enemy.mesh.position.z = nextZ.z;
    } else if (now - enemy.lastAttack > 850) {
      enemy.lastAttack = now;
      health -= 10;
      updateHud();

      if (health <= 0) {
        endGame();
      }
    }
  }
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
    enemy.health -= 1;

    if (enemy.health <= 0) {
      scene.remove(enemyGroup);
      enemies.splice(enemyIndex, 1);
      score += enemy.points;
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

function checkRoundState() {
  if (roundChanging || enemies.length > 0 || gameOver) return;

  roundChanging = true;
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

function endGame() {
  gameOver = true;
  gameStarted = false;
  health = 0;
  clearReloadTimer();
  reloading = false;
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

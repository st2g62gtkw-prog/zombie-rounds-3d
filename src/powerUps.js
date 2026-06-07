(() => {
  const {
    DAMAGE_BOOST_TIME,
    MAX_HEALTH,
    MAX_POWER_UPS,
    POWER_UP_CHANCE,
    POWER_UP_DURATION,
    POWER_UP_PICKUP_RANGE,
    POWER_UP_TYPES,
  } = window.ZR.config;
  const { canOccupy } = window.ZR.collision;
  const {
    clearDamageBoostTimer,
    state,
  } = window.ZR.gameState;
  const { scene } = window.ZR.scene;
  const { updateHud } = window.ZR.ui;
  const {
    getThree,
    randomBetween,
  } = window.ZR.utils;
  const { refillAmmo } = window.ZR.weapons;
  const THREE = getThree();

  function maybeSpawnPowerUp() {
    if (state.powerUps.length >= MAX_POWER_UPS || Math.random() > POWER_UP_CHANCE) return;

    const typeKeys = Object.keys(POWER_UP_TYPES);
    const type = POWER_UP_TYPES[typeKeys[Math.floor(Math.random() * typeKeys.length)]];
    const position = findPowerUpPoint();
    const mesh = createPowerUpMesh(type);
    mesh.position.set(position.x, 0.45, position.z);
    scene.add(mesh);

    state.powerUps.push({
      mesh,
      type: type.key,
      expiresAt: performance.now() + POWER_UP_DURATION,
    });
  }

  function updatePowerUps() {
    const now = performance.now();
    const playerFlat = new THREE.Vector3(state.playerPosition.x, 0, state.playerPosition.z);

    for (let index = state.powerUps.length - 1; index >= 0; index -= 1) {
      const powerUp = state.powerUps[index];
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

  function clearPowerUps() {
    while (state.powerUps.length > 0) {
      removePowerUp(state.powerUps.length - 1);
    }
  }

  function activateDamageBoost() {
    state.damageBoostActive = true;
    clearDamageBoostTimer();

    state.damageBoostTimer = window.setTimeout(() => {
      state.damageBoostActive = false;
      state.damageBoostTimer = null;
      updateHud();
    }, DAMAGE_BOOST_TIME);
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
      const playerFlat = new THREE.Vector3(state.playerPosition.x, 0, state.playerPosition.z);
      const farEnough = point.distanceTo(playerFlat) > 5;

      if (farEnough && canOccupy(point, 0.5)) {
        return point;
      }
    }

    return new THREE.Vector3(0, 0, -8);
  }

  function applyPowerUp(type) {
    if (type === "heal") {
      state.health = Math.min(MAX_HEALTH, state.health + 25);
      state.players[state.localPlayerId].health = state.health;
    }

    if (type === "ammo") {
      refillAmmo();
    }

    if (type === "damage") {
      activateDamageBoost();
    }

    updateHud();
  }

  function removePowerUp(index) {
    const [powerUp] = state.powerUps.splice(index, 1);
    scene.remove(powerUp.mesh);
    powerUp.mesh.geometry.dispose();
    powerUp.mesh.material.dispose();
  }

  window.ZR.powerUps = {
    activateDamageBoost,
    clearPowerUps,
    maybeSpawnPowerUp,
    updatePowerUps,
  };
})();

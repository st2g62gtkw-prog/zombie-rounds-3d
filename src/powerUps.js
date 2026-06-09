(() => {
  const {
    DAMAGE_BOOST_TIME,
    MAX_HEALTH,
    MAX_POWER_UPS,
    POWER_UP_DROP_CHANCE,
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
  } = window.ZR.utils;
  const { refillAmmo } = window.ZR.weapons;
  const THREE = getThree();

  function maybeDropPowerUp(sourcePosition) {
    if (state.powerUps.length >= MAX_POWER_UPS || Math.random() >= POWER_UP_DROP_CHANCE) return false;

    const position = findDropPoint(sourcePosition);
    if (!position) return false;

    spawnRandomPowerUp(position);
    return true;
  }

  function updatePowerUps() {
    const now = performance.now();
    const playerFlat = new THREE.Vector3(state.playerPosition.x, 0, state.playerPosition.z);

    for (let index = state.powerUps.length - 1; index >= 0; index -= 1) {
      const powerUp = state.powerUps[index];
      const powerUpFlat = new THREE.Vector3(powerUp.mesh.position.x, 0, powerUp.mesh.position.z);

      powerUp.mesh.rotation.y += 0.055;
      powerUp.mesh.position.y = 0.52 + Math.sin(now * 0.006 + index) * 0.1;

      if (powerUp.mesh.scale?.setScalar) {
        powerUp.mesh.scale.setScalar(1 + Math.sin(now * 0.008 + index) * 0.08);
      }

      if (now > powerUp.expiresAt) {
        removePowerUp(index);
        continue;
      }

      if (powerUpFlat.distanceTo(playerFlat) <= POWER_UP_PICKUP_RANGE) {
        applyPowerUp(powerUp.type);
        window.ZR.ui.showStatusMessage("Boost activado");
        window.ZR.audio?.play("boost");
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
        emissiveIntensity: 0.55,
        roughness: 0.55,
      }),
    );
    mesh.userData.powerUpType = type.key;

    return mesh;
  }

  function spawnRandomPowerUp(position) {
    const typeKeys = Object.keys(POWER_UP_TYPES);
    const type = POWER_UP_TYPES[typeKeys[Math.floor(Math.random() * typeKeys.length)]];
    const mesh = createPowerUpMesh(type);
    mesh.position.set(position.x, 0.45, position.z);
    scene.add(mesh);

    state.powerUps.push({
      mesh,
      type: type.key,
      expiresAt: performance.now() + POWER_UP_DURATION,
    });

    window.ZR.ui.showStatusMessage("Boost aparecio");
  }

  function findDropPoint(sourcePosition) {
    const origin = new THREE.Vector3(sourcePosition.x, 0, sourcePosition.z);
    const candidates = [
      origin,
      ...Array.from({ length: 10 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 10;
        const distance = index < 5 ? 0.75 : 1.35;
        return new THREE.Vector3(
          origin.x + Math.cos(angle) * distance,
          0,
          origin.z + Math.sin(angle) * distance,
        );
      }),
    ];

    return candidates.find((candidate) => canOccupy(candidate, 0.5)) || null;
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
    maybeDropPowerUp,
    updatePowerUps,
  };
})();

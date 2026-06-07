(() => {
  const { WEAPONS } = window.ZR.config;
  const {
    clearReloadTimer,
    state,
  } = window.ZR.gameState;
  const {
    camera,
    raycaster,
    scene,
  } = window.ZR.scene;
  const {
    elements,
    showStatusMessage,
    updateHud,
  } = window.ZR.ui;
  const { getThree } = window.ZR.utils;
  const THREE = getThree();

  function resetWeapons(playerId = state.localPlayerId) {
    const player = getPlayer(playerId);
    player.weapons = {
      pistol: createWeaponState("pistol"),
    };
    player.weaponSlots = ["pistol", null];
    player.activeWeaponId = "pistol";
    state.activeWeaponId = "pistol";
    cancelReload();
    syncLegacyAmmoState(player);
  }

  function createWeaponState(weaponId) {
    const definition = WEAPONS[weaponId];
    if (!definition) return null;

    return {
      id: definition.id,
      name: definition.name,
      damage: definition.damage,
      fireRate: definition.fireRate,
      magazineSize: definition.magazineSize,
      ammoInMagazine: definition.magazineSize,
      reserveAmmo: definition.reserveAmmo,
      maxReserveAmmo: definition.maxReserveAmmo,
      reloadTime: definition.reloadTime,
      cost: definition.cost,
      lastShotAt: -Infinity,
    };
  }

  function getActiveWeapon(playerId = state.localPlayerId) {
    const player = getPlayer(playerId);
    return player.weapons[player.activeWeaponId] || null;
  }

  function getWeapon(weaponId, playerId = state.localPlayerId) {
    return getPlayer(playerId).weapons[weaponId] || null;
  }

  function playerHasWeapon(weaponId, playerId = state.localPlayerId) {
    return Boolean(getWeapon(weaponId, playerId));
  }

  function addWeapon(weaponId, playerId = state.localPlayerId) {
    const player = getPlayer(playerId);
    if (player.weapons[weaponId]) return player.weapons[weaponId];

    const weapon = createWeaponState(weaponId);
    if (!weapon) return null;

    player.weapons[weaponId] = weapon;
    const emptySlotIndex = player.weaponSlots.findIndex((slot) => !slot);
    if (emptySlotIndex === -1) {
      player.weaponSlots.push(weaponId);
    } else {
      player.weaponSlots[emptySlotIndex] = weaponId;
    }

    setActiveWeapon(weaponId, playerId);
    return weapon;
  }

  function setActiveWeapon(weaponId, playerId = state.localPlayerId) {
    const player = getPlayer(playerId);
    if (!player.weapons[weaponId]) return false;

    cancelReload();
    player.activeWeaponId = weaponId;
    state.activeWeaponId = weaponId;
    syncLegacyAmmoState(player);
    updateHud();
    return true;
  }

  function switchWeapon(slotNumberOrId, playerId = state.localPlayerId) {
    const player = getPlayer(playerId);
    const weaponId = Number.isFinite(slotNumberOrId)
      ? player.weaponSlots[slotNumberOrId - 1]
      : slotNumberOrId;

    if (!weaponId || weaponId === player.activeWeaponId) return false;
    return setActiveWeapon(weaponId, playerId);
  }

  function reloadAmmo(playerId = state.localPlayerId) {
    const weapon = getActiveWeapon(playerId);

    if (
      !weapon ||
      !state.gameStarted ||
      state.gameOver ||
      state.paused ||
      state.reloading ||
      weapon.ammoInMagazine >= weapon.magazineSize ||
      weapon.reserveAmmo <= 0
    ) {
      return false;
    }

    const reloadWeaponId = weapon.id;
    state.reloading = true;
    updateHud();

    state.reloadTimer = window.setTimeout(() => {
      const currentWeapon = getActiveWeapon(playerId);
      if (!currentWeapon || currentWeapon.id !== reloadWeaponId) {
        cancelReload();
        updateHud();
        return;
      }

      const neededAmmo = currentWeapon.magazineSize - currentWeapon.ammoInMagazine;
      const loadedAmmo = Math.min(neededAmmo, currentWeapon.reserveAmmo);
      currentWeapon.ammoInMagazine += loadedAmmo;
      currentWeapon.reserveAmmo -= loadedAmmo;
      state.reloading = false;
      state.reloadTimer = null;
      syncLegacyAmmoState(getPlayer(playerId));
      updateHud();
    }, weapon.reloadTime * 1000);

    return true;
  }

  function shoot({ playerId = state.localPlayerId } = {}) {
    const weapon = getActiveWeapon(playerId);
    const now = performance.now();

    if (
      !weapon ||
      !state.gameStarted ||
      state.gameOver ||
      state.paused ||
      state.reloading ||
      state.roundChanging ||
      document.pointerLockElement !== elements.canvas
    ) {
      return false;
    }

    if (weapon.ammoInMagazine <= 0) {
      showStatusMessage(weapon.reserveAmmo > 0 ? "Cargador vacio: presiona R" : "Sin municion");
      return false;
    }

    if (now - weapon.lastShotAt < 1000 / weapon.fireRate) return false;

    weapon.lastShotAt = now;
    weapon.ammoInMagazine -= 1;
    syncLegacyAmmoState(getPlayer(playerId));
    updateHud();

    raycaster.setFromCamera({ x: 0, y: 0 }, camera);

    const hitBoxes = state.enemies.map((enemy) => enemy.mesh.userData.hitBox);
    const hits = raycaster.intersectObjects(hitBoxes, false);
    const targetPoint = hits[0]?.point ?? raycaster.ray.at(raycaster.far, new THREE.Vector3());

    drawShot(targetPoint);

    if (!hits.length) return true;

    const enemyGroup = hits[0].object.parent;
    const enemyIndex = state.enemies.findIndex((enemy) => enemy.mesh === enemyGroup);
    if (enemyIndex === -1) return true;

    const enemy = state.enemies[enemyIndex];
    const damage = state.damageBoostActive ? weapon.damage * 2 : weapon.damage;

    if (window.ZR.actions?.damageZombie) {
      window.ZR.actions.damageZombie(enemy, damage, playerId);
      return true;
    }

    enemy.health -= damage;
    if (enemy.health <= 0) {
      scene.remove(enemyGroup);
      state.enemies.splice(enemyIndex, 1);
      state.score += enemy.points;
    }

    updateHud();
    return true;
  }

  function buyWeaponAmmo(playerId = state.localPlayerId) {
    const weapon = getActiveWeapon(playerId);
    if (!weapon) return false;

    weapon.reserveAmmo = weapon.maxReserveAmmo;

    if (weapon.ammoInMagazine < weapon.magazineSize) {
      const neededAmmo = weapon.magazineSize - weapon.ammoInMagazine;
      const loadedAmmo = Math.min(neededAmmo, weapon.reserveAmmo);
      weapon.ammoInMagazine += loadedAmmo;
      weapon.reserveAmmo -= loadedAmmo;
    }

    syncLegacyAmmoState(getPlayer(playerId));
    updateHud();
    return true;
  }

  function refillAmmo(playerId = state.localPlayerId) {
    return buyWeaponAmmo(playerId);
  }

  function cancelReload() {
    clearReloadTimer();
    state.reloading = false;
  }

  function syncLegacyAmmoState(player = getPlayer()) {
    const weapon = player.weapons[player.activeWeaponId];
    state.activeWeaponId = player.activeWeaponId;
    state.ammo = weapon?.ammoInMagazine ?? 0;
    state.ammoReserve = weapon?.reserveAmmo ?? 0;
  }

  function getPlayer(playerId = state.localPlayerId) {
    return window.ZR.economy.getPlayer(playerId);
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

  window.ZR.weapons = {
    addWeapon,
    buyWeaponAmmo,
    cancelReload,
    getActiveWeapon,
    getWeapon,
    playerHasWeapon,
    refillAmmo,
    reloadAmmo,
    resetWeapons,
    setActiveWeapon,
    shoot,
    switchWeapon,
  };
})();

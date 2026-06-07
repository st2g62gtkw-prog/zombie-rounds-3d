(() => {
  const {
    ENABLE_WEAPON_VIEWMODEL,
    HEADSHOT_MULTIPLIER,
    WEAPONS,
  } = window.ZR.config;
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
  const viewModel = {
    group: null,
  };

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
    updateWeaponViewModel(player.activeWeaponId);
  }

  function createWeaponState(weaponId) {
    const definition = WEAPONS[weaponId];
    if (!definition) return null;

    return {
      id: definition.id,
      name: definition.name,
      damage: definition.damage,
      fireRate: definition.fireRate,
      automatic: Boolean(definition.automatic),
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
    updateWeaponViewModel(weaponId);
    updateHud();
    return true;
  }

  function updateAutomaticFire(playerId = state.localPlayerId) {
    const weapon = getActiveWeapon(playerId);

    if (!state.isFireHeld || !weapon?.automatic) return false;
    return shoot({ playerId });
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

    const hitBoxes = state.enemies.flatMap((enemy) => [
      enemy.mesh.userData.headHitBox,
      enemy.mesh.userData.hitBox,
    ].filter(Boolean));
    const hits = raycaster.intersectObjects(hitBoxes, false);
    const targetPoint = hits[0]?.point ?? raycaster.ray.at(raycaster.far, new THREE.Vector3());

    drawShot(targetPoint);

    if (!hits.length) return true;

    const hitObject = hits[0].object;
    const enemyGroup = hitObject.userData.enemyGroup || hitObject.parent;
    const enemyIndex = state.enemies.findIndex((enemy) => enemy.mesh === enemyGroup);
    if (enemyIndex === -1) return true;

    const enemy = state.enemies[enemyIndex];
    const isHeadshot = hitObject.userData.hitZone === "head" ||
      isHeadshotByHeight(enemy, hits[0].point);
    const boostedDamage = state.damageBoostActive ? weapon.damage * 2 : weapon.damage;
    const damage = isHeadshot ? boostedDamage * HEADSHOT_MULTIPLIER : boostedDamage;

    if (window.ZR.actions?.damageZombie) {
      window.ZR.actions.damageZombie(enemy, damage, playerId, { isHeadshot });
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
    weapon.ammoInMagazine = weapon.magazineSize;

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

  function isHeadshotByHeight(enemy, hitPoint) {
    if (!enemy?.mesh || !hitPoint) return false;

    const type = window.ZR.config.ENEMY_TYPES[enemy.type];
    const scale = type?.scale || 1;
    const localHeight = (hitPoint.y - enemy.mesh.position.y) / scale;

    return localHeight >= 1.08;
  }

  function updateWeaponViewModel(weaponId = state.activeWeaponId) {
    if (!ENABLE_WEAPON_VIEWMODEL || !THREE) return;

    if (!camera.parent) scene.add(camera);

    if (viewModel.group) {
      camera.remove(viewModel.group);
      disposeObject(viewModel.group);
      viewModel.group = null;
    }

    const group = weaponId === "rifle" ? createRifleViewModel() : createPistolViewModel();
    group.position.set(0.42, -0.36, -0.82);
    group.rotation.set(-0.05, -0.08, 0);
    camera.add(group);
    viewModel.group = group;
  }

  function createPistolViewModel() {
    const group = new THREE.Group();
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x252c31 });
    const metalMaterial = new THREE.MeshBasicMaterial({ color: 0x4d5960 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.42), bodyMaterial);
    body.position.set(0, 0, 0);
    group.add(body);

    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.3), metalMaterial);
    barrel.position.set(0, 0.04, -0.28);
    group.add(barrel);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.3, 0.16), bodyMaterial.clone());
    grip.position.set(0.02, -0.18, 0.14);
    grip.rotation.x = -0.28;
    group.add(grip);

    return group;
  }

  function createRifleViewModel() {
    const group = new THREE.Group();
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x263139 });
    const accentMaterial = new THREE.MeshBasicMaterial({ color: 0x59666d });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.15, 0.82), bodyMaterial);
    body.position.set(0, 0, -0.14);
    group.add(body);

    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.5), accentMaterial);
    barrel.position.set(0, 0.03, -0.78);
    group.add(barrel);

    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.13, 0.34), bodyMaterial.clone());
    stock.position.set(0, -0.02, 0.42);
    group.add(stock);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.16), accentMaterial.clone());
    grip.position.set(0, -0.21, 0.08);
    grip.rotation.x = -0.22;
    group.add(grip);

    return group;
  }

  function disposeObject(object) {
    object.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
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
    updateAutomaticFire,
    updateWeaponViewModel,
  };
})();

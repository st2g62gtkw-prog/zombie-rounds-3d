(() => {
  const {
    MAX_AMMO,
    RELOAD_TIME,
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
    updateHud,
  } = window.ZR.ui;
  const { getThree } = window.ZR.utils;
  const THREE = getThree();

  function reloadAmmo() {
    if (
      !state.gameStarted ||
      state.gameOver ||
      state.paused ||
      state.reloading ||
      state.ammo === MAX_AMMO
    ) {
      return;
    }

    state.reloading = true;
    updateHud();

    state.reloadTimer = window.setTimeout(() => {
      state.ammo = MAX_AMMO;
      state.reloading = false;
      state.reloadTimer = null;
      updateHud();
    }, RELOAD_TIME);
  }

  function shoot({ playerId = state.localPlayerId } = {}) {
    if (
      !state.gameStarted ||
      state.gameOver ||
      state.paused ||
      state.reloading ||
      state.roundChanging ||
      state.ammo <= 0 ||
      document.pointerLockElement !== elements.canvas
    ) {
      return;
    }

    state.ammo -= 1;
    updateHud();

    raycaster.setFromCamera({ x: 0, y: 0 }, camera);

    const hitBoxes = state.enemies.map((enemy) => enemy.mesh.userData.hitBox);
    const hits = raycaster.intersectObjects(hitBoxes, false);
    const targetPoint = hits[0]?.point ?? raycaster.ray.at(raycaster.far, new THREE.Vector3());

    drawShot(targetPoint);

    if (!hits.length) return;

    const enemyGroup = hits[0].object.parent;
    const enemyIndex = state.enemies.findIndex((enemy) => enemy.mesh === enemyGroup);

    if (enemyIndex === -1) return;

    const enemy = state.enemies[enemyIndex];
    const damage = state.damageBoostActive ? 2 : 1;

    if (window.ZR.actions?.damageZombie) {
      window.ZR.actions.damageZombie(enemy, damage, playerId);
      return;
    }

    enemy.health -= damage;
    if (enemy.health <= 0) {
      scene.remove(enemyGroup);
      state.enemies.splice(enemyIndex, 1);
      state.score += enemy.points;
    }

    updateHud();
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

  function refillAmmo() {
    state.ammo = MAX_AMMO;
    state.reloading = false;
    clearReloadTimer();
  }

  window.ZR.weapons = {
    refillAmmo,
    reloadAmmo,
    shoot,
  };
})();

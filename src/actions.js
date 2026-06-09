(() => {
  const { POINTS_PER_HIT } = window.ZR.config;
  const { EVENTS } = window.ZR.protocol;
  const { state } = window.ZR.gameState;

  function handleAction(action) {
    const normalizedAction = {
      playerId: state.localPlayerId,
      ...action,
    };

    if (normalizedAction.type === EVENTS.SHOOT) {
      return playerShoot(normalizedAction.playerId);
    }

    if (normalizedAction.type === EVENTS.INTERACT) {
      return playerInteract(normalizedAction.playerId);
    }

    if (normalizedAction.type === EVENTS.BUY_DOOR) {
      return buyDoor(normalizedAction.playerId, normalizedAction.targetId);
    }

    if (normalizedAction.type === EVENTS.BUY_WEAPON) {
      return buyWeapon(normalizedAction.playerId, normalizedAction.targetId);
    }

    if (normalizedAction.type === EVENTS.BUY_AMMO) {
      return buyAmmo(normalizedAction.playerId, normalizedAction.targetId);
    }

    if (normalizedAction.type === EVENTS.SWITCH_WEAPON) {
      return switchWeapon(normalizedAction.playerId, normalizedAction.slot ?? normalizedAction.weaponId);
    }

    return false;
  }

  function playerShoot(playerId = state.localPlayerId) {
    return window.ZR.weapons.shoot({ playerId });
  }

  function playerInteract(playerId = state.localPlayerId) {
    const interactable = window.ZR.interactables.getCurrentInteractable();
    if (!interactable) return false;

    if (interactable.type === "door") {
      return buyDoor(playerId, interactable.id);
    }

    if (interactable.actionType === EVENTS.BUY_AMMO || interactable.type === "ammo") {
      return buyAmmo(playerId, interactable.id);
    }

    if (interactable.actionType === EVENTS.BUY_WEAPON || interactable.type === "weapon") {
      return buyWeapon(playerId, interactable.id);
    }

    return false;
  }

  function buyDoor(playerId, targetId) {
    const door = window.ZR.interactables.findInteractable(targetId);
    if (!door || door.type !== "door" || door.opened) return false;
    if (!window.ZR.economy.spendPoints(door.cost, playerId)) return false;

    return window.ZR.interactables.openDoor(targetId);
  }

  function buyWeapon(playerId, targetId) {
    const station = window.ZR.interactables.findInteractable(targetId);
    if (!station || station.type !== "weapon" || !station.weaponId) return false;

    if (window.ZR.weapons.playerHasWeapon(station.weaponId, playerId)) {
      window.ZR.ui.showStatusMessage(`Ya tienes ${window.ZR.config.WEAPONS[station.weaponId].name}`);
      return false;
    }

    if (!window.ZR.economy.spendPoints(station.cost, playerId)) {
      window.ZR.ui.showStatusMessage("Puntos insuficientes");
      return false;
    }

    const weapon = window.ZR.weapons.addWeapon(station.weaponId, playerId);
    window.ZR.ui.showStatusMessage(`${weapon.name} comprado`);
    window.ZR.ui.updateHud();
    return true;
  }

  function buyAmmo(playerId, targetId) {
    const station = window.ZR.interactables.findInteractable(targetId);
    if (!station || station.type !== "ammo") return false;

    const weapon = window.ZR.weapons.getActiveWeapon(playerId);
    const ammoIsFull = weapon &&
      weapon.ammoInMagazine >= weapon.magazineSize &&
      weapon.reserveAmmo >= weapon.maxReserveAmmo;

    if (ammoIsFull) {
      window.ZR.ui.showStatusMessage("Municion llena");
      return false;
    }

    if (!window.ZR.economy.spendPoints(station.cost, playerId)) {
      window.ZR.ui.showStatusMessage("Puntos insuficientes");
      return false;
    }

    window.ZR.weapons.buyWeaponAmmo(playerId);
    window.ZR.ui.showStatusMessage("Municion comprada");
    window.ZR.ui.updateHud();
    return true;
  }

  function switchWeapon(playerId, slotOrWeaponId) {
    return window.ZR.weapons.switchWeapon(slotOrWeaponId, playerId);
  }

  function damageZombie(enemy, amount, playerId = state.localPlayerId, options = {}) {
    if (!enemy || amount <= 0) return false;

    window.ZR.economy.addHitPoints(playerId);
    enemy.health -= amount;
    window.ZR.ui.showHitmarker(Boolean(options.isHeadshot));

    if (options.isHeadshot) {
      window.ZR.ui.showStatusMessage("HEADSHOT", 900);
      window.ZR.audio?.play("headshot");
    } else {
      window.ZR.audio?.play("hit");
    }

    if (enemy.health <= 0) {
      killZombie(enemy, playerId);
    } else {
      window.ZR.ui.showScorePopup(POINTS_PER_HIT);
    }

    window.ZR.ui.updateHud();
    return true;
  }

  function killZombie(enemy, playerId = state.localPlayerId) {
    const enemyIndex = state.enemies.indexOf(enemy);
    if (enemyIndex === -1) return false;

    const dropPosition = enemy.mesh.position.clone();
    window.ZR.scene.scene.remove(enemy.mesh);
    state.enemies.splice(enemyIndex, 1);
    window.ZR.powerUps.maybeDropPowerUp(dropPosition);
    window.ZR.economy.addKillPoints(enemy.points, playerId);
    window.ZR.ui.showScorePopup(enemy.points);
    window.ZR.ui.updateHud();
    return true;
  }

  function startRound(roundNumber) {
    window.ZR.gameMode.startRound(roundNumber);
  }

  function endRound() {
    window.ZR.gameMode.endRound();
  }

  window.ZR.actions = {
    buyDoor,
    buyAmmo,
    buyWeapon,
    damageZombie,
    endRound,
    handleAction,
    killZombie,
    playerInteract,
    playerShoot,
    startRound,
    switchWeapon,
  };
})();

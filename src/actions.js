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

    if (interactable.type === "buyWeapon") {
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
    if (!station || station.type !== "buyWeapon") return false;
    if (state.ammo >= window.ZR.config.MAX_AMMO) return false;
    if (!window.ZR.economy.spendPoints(station.cost, playerId)) return false;

    window.ZR.weapons.refillAmmo();
    window.ZR.ui.updateHud();
    return true;
  }

  function damageZombie(enemy, amount, playerId = state.localPlayerId) {
    if (!enemy || amount <= 0) return false;

    window.ZR.economy.addHitPoints(playerId);
    enemy.health -= amount;

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

    window.ZR.scene.scene.remove(enemy.mesh);
    state.enemies.splice(enemyIndex, 1);
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
    buyWeapon,
    damageZombie,
    endRound,
    handleAction,
    killZombie,
    playerInteract,
    playerShoot,
    startRound,
  };
})();

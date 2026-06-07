(() => {
  const {
    LOCAL_PLAYER_ID,
    POINTS_PER_HIT,
  } = window.ZR.config;
  const {
    state,
    updateBestScore,
  } = window.ZR.gameState;

  function getPlayer(playerId = state.localPlayerId || LOCAL_PLAYER_ID) {
    if (!state.players[playerId]) {
      state.players[playerId] = {
        id: playerId,
        health: state.health,
        points: 0,
      };
    }

    return state.players[playerId];
  }

  function resetEconomy() {
    const player = getPlayer();
    player.points = 0;
    syncLocalPoints(player);
  }

  function addPoints(amount, playerId) {
    if (!Number.isFinite(amount) || amount <= 0) return 0;

    const player = getPlayer(playerId);
    player.points += amount;
    syncLocalPoints(player);
    updateBestScore();
    window.ZR.ui?.updateHud();

    return player.points;
  }

  function addHitPoints(playerId) {
    return addPoints(POINTS_PER_HIT, playerId);
  }

  function addKillPoints(points, playerId) {
    return addPoints(points, playerId);
  }

  function canAfford(cost, playerId) {
    return getPlayer(playerId).points >= cost;
  }

  function spendPoints(cost, playerId) {
    if (!canAfford(cost, playerId)) return false;

    const player = getPlayer(playerId);
    player.points -= cost;
    syncLocalPoints(player);
    window.ZR.ui?.updateHud();

    return true;
  }

  function syncLocalPoints(player) {
    state.points = player.points;
    state.score = player.points;
  }

  window.ZR.economy = {
    addHitPoints,
    addKillPoints,
    addPoints,
    canAfford,
    getPlayer,
    resetEconomy,
    spendPoints,
  };
})();

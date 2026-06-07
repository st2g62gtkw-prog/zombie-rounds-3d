(() => {
  const {
    BEST_SCORE_KEY,
    GAME_STATUS,
    LOCAL_PLAYER_ID,
    MAX_AMMO,
    MAX_HEALTH,
    PLAYER_HEIGHT,
  } = window.ZR.config;
  const { getThree } = window.ZR.utils;
  const THREE = getThree();

  const state = {
    keys: new Set(),
    clock: new THREE.Clock(),
    playerPosition: new THREE.Vector3(0, PLAYER_HEIGHT, 7),
    obstacles: [],
    enemies: [],
    powerUps: [],
    doors: [],
    buyStations: [],
    interactables: [],
    currentInteractableId: null,
    localPlayerId: LOCAL_PLAYER_ID,
    players: {
      [LOCAL_PLAYER_ID]: {
        id: LOCAL_PLAYER_ID,
        health: MAX_HEALTH,
        points: 0,
      },
    },
    yaw: 0,
    pitch: 0,
    health: MAX_HEALTH,
    round: 1,
    points: 0,
    score: 0,
    bestScore: loadBestScore(),
    status: GAME_STATUS.MENU,
    gameStarted: false,
    gameOver: false,
    roundChanging: false,
    paused: false,
    ammo: MAX_AMMO,
    reloading: false,
    reloadTimer: null,
    roundTimer: null,
    pendingRoundStart: false,
    lastPauseChange: 0,
    damageBoostActive: false,
    damageBoostTimer: null,
    damageFlashTimer: null,
    nextEnemyId: 1,
  };

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
      localStorage.setItem(BEST_SCORE_KEY, String(state.bestScore));
    } catch {
      // El juego sigue funcionando aunque el navegador bloquee localStorage.
    }
  }

  function updateBestScore() {
    if (state.score <= state.bestScore) return;
    state.bestScore = state.score;
    saveBestScore();
  }

  function clearReloadTimer() {
    if (!state.reloadTimer) return;
    window.clearTimeout(state.reloadTimer);
    state.reloadTimer = null;
  }

  function clearRoundTimer() {
    if (!state.roundTimer) return;
    window.clearTimeout(state.roundTimer);
    state.roundTimer = null;
  }

  function clearDamageBoostTimer() {
    if (!state.damageBoostTimer) return;
    window.clearTimeout(state.damageBoostTimer);
    state.damageBoostTimer = null;
  }

  function clearDamageFlashTimer() {
    if (state.damageFlashTimer) {
      window.clearTimeout(state.damageFlashTimer);
      state.damageFlashTimer = null;
    }
  }

  window.ZR.gameState = {
    clearDamageBoostTimer,
    clearDamageFlashTimer,
    clearReloadTimer,
    clearRoundTimer,
    state,
    updateBestScore,
  };
})();

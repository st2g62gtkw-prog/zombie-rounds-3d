(() => {
  const {
    GAME_STATUS,
    ROUND_BASE_ENEMIES,
    ROUND_ENEMY_GROWTH,
    ROUND_MESSAGE_TIME,
  } = window.ZR.config;
  const {
    clearRoundTimer,
    state,
  } = window.ZR.gameState;
  const {
    setRoundMessageText,
    setRoundMessageVisible,
    showRoundNotice,
    updateHud,
  } = window.ZR.ui;

  function resetGameMode(startNow = false) {
    clearRoundTimer();
    state.round = 1;
    state.roundChanging = false;
    state.pendingRoundStart = false;
    setRoundMessageText("RONDA 1");
    setRoundMessageVisible(false);
    setStatus(startNow ? GAME_STATUS.PLAYING : GAME_STATUS.MENU);
  }

  function startRound(roundNumber = state.round) {
    clearRoundTimer();
    state.round = roundNumber;
    state.roundChanging = false;
    showRoundNotice(`RONDA ${roundNumber}`, 850);
    window.ZR.zombies.spawnRound(roundNumber, getZombieCountForRound(roundNumber));
    window.ZR.audio?.play("round");
    setStatus(GAME_STATUS.PLAYING);
    updateHud();
  }

  function updateRoundState() {
    if (
      !state.gameStarted ||
      state.gameOver ||
      state.roundChanging ||
      state.enemies.length > 0
    ) {
      return;
    }

    endRound();
  }

  function endRound() {
    if (state.roundChanging || state.gameOver) return false;

    state.roundChanging = true;
    setStatus(GAME_STATUS.ROUND_TRANSITION);
    state.round += 1;
    showRoundNotice(`RONDA COMPLETADA\nRONDA ${state.round}`, ROUND_MESSAGE_TIME);
    updateHud();

    state.roundTimer = window.setTimeout(() => {
      state.roundTimer = null;
      if (state.gameOver || !state.gameStarted) return;
      if (state.paused) {
        state.pendingRoundStart = true;
        return;
      }

      startRound(state.round);
    }, ROUND_MESSAGE_TIME);

    return true;
  }

  function pause() {
    if (!state.gameStarted || state.gameOver || state.paused) return false;

    state.lastPauseChange = performance.now();
    state.keys.clear();
    state.isFireHeld = false;
    setStatus(GAME_STATUS.PAUSED);
    return true;
  }

  function resume() {
    if (!state.gameStarted || state.gameOver || !state.paused) return false;

    state.lastPauseChange = performance.now();
    if (state.pendingRoundStart) {
      state.pendingRoundStart = false;
      startRound(state.round);
      return true;
    }

    setStatus(state.roundChanging ? GAME_STATUS.ROUND_TRANSITION : GAME_STATUS.PLAYING);
    return true;
  }

  function setGameOver() {
    clearRoundTimer();
    state.pendingRoundStart = false;
    setStatus(GAME_STATUS.GAME_OVER);
  }

  function setStatus(status) {
    state.status = status;

    if (status === GAME_STATUS.MENU) {
      state.gameStarted = false;
      state.gameOver = false;
      state.paused = false;
      state.roundChanging = false;
      return;
    }

    if (status === GAME_STATUS.PLAYING) {
      state.gameStarted = true;
      state.gameOver = false;
      state.paused = false;
      state.roundChanging = false;
      return;
    }

    if (status === GAME_STATUS.ROUND_TRANSITION) {
      state.gameStarted = true;
      state.gameOver = false;
      state.paused = false;
      state.roundChanging = true;
      return;
    }

    if (status === GAME_STATUS.PAUSED) {
      state.gameStarted = true;
      state.gameOver = false;
      state.paused = true;
      return;
    }

    if (status === GAME_STATUS.GAME_OVER) {
      state.gameStarted = false;
      state.gameOver = true;
      state.paused = false;
      state.roundChanging = false;
    }
  }

  function getZombieCountForRound(roundNumber) {
    return ROUND_BASE_ENEMIES + (roundNumber - 1) * ROUND_ENEMY_GROWTH;
  }

  function getZombiesRemaining() {
    return state.enemies.length;
  }

  window.ZR.gameMode = {
    endRound,
    getZombieCountForRound,
    getZombiesRemaining,
    pause,
    resetGameMode,
    resume,
    setGameOver,
    setStatus,
    startRound,
    updateRoundState,
  };
})();

(() => {
  const {
    MAX_AMMO,
    MAX_HEALTH,
    PLAYER_HEIGHT,
    ROUND_MESSAGE_TIME,
  } = window.ZR.config;
  const {
    clearDamageBoostTimer,
    clearReloadTimer,
    clearRoundTimer,
    state,
    updateBestScore,
  } = window.ZR.gameState;
  const { setupInput } = window.ZR.input;
  const { updatePlayer } = window.ZR.player;
  const {
    clearPowerUps,
    maybeSpawnPowerUp,
    updatePowerUps,
  } = window.ZR.powerUps;
  const {
    camera,
    initScene,
    renderer,
    resizeRenderer,
    scene,
    updateCamera,
  } = window.ZR.scene;
  const {
    elements,
    hideDamageFlash,
    setGameOverVisible,
    setPauseVisible,
    setRoundMessageText,
    setRoundMessageVisible,
    setStartVisible,
    showDamageFlash,
    showGameOverStats,
    updateHud,
  } = window.ZR.ui;
  const {
    reloadAmmo,
    shoot,
  } = window.ZR.weapons;
  const {
    checkEnemyAttacks,
    clearEnemies,
    spawnRound,
    updateEnemies,
  } = window.ZR.zombies;

  initScene();
  resetGame();
  setupInput({
    pauseGame,
    reloadAmmo,
    resetGame,
    resumeGame,
    shoot,
    startGame,
  });
  window.addEventListener("resize", resizeRenderer);
  animate();

  function startGame() {
    resetGame(true);
    elements.canvas.requestPointerLock();
  }

  function resetGame(startNow = false) {
    clearEnemies();
    clearPowerUps();
    clearReloadTimer();
    clearRoundTimer();
    clearDamageBoostTimer();
    hideDamageFlash();
    state.keys.clear();
    state.playerPosition.set(0, PLAYER_HEIGHT, 7);
    state.yaw = 0;
    state.pitch = 0;
    state.health = MAX_HEALTH;
    state.round = 1;
    state.score = 0;
    state.ammo = MAX_AMMO;
    state.reloading = false;
    state.damageBoostActive = false;
    state.gameStarted = startNow;
    state.gameOver = false;
    state.roundChanging = false;
    state.paused = false;
    state.nextEnemyId = 1;
    setPauseVisible(false);
    setRoundMessageVisible(false);
    setRoundMessageText("Ronda 1");
    setGameOverVisible(false);
    setStartVisible(!startNow);

    if (startNow) spawnRound(state.round);

    updateHud();
    updateCamera();
  }

  function pauseGame() {
    if (!state.gameStarted || state.gameOver || state.paused) return;

    state.paused = true;
    state.lastPauseChange = performance.now();
    state.keys.clear();
    setPauseVisible(true);

    if (document.pointerLockElement === elements.canvas) {
      document.exitPointerLock();
    }
  }

  function resumeGame() {
    if (!state.gameStarted || state.gameOver || !state.paused) return;

    state.paused = false;
    state.lastPauseChange = performance.now();
    setPauseVisible(false);
    elements.canvas.requestPointerLock();
  }

  function damagePlayer(amount) {
    state.health = Math.max(0, state.health - amount);
    showDamageFlash();
    updateHud();

    if (state.health <= 0) {
      endGame();
    }
  }

  function endGame() {
    state.gameOver = true;
    state.gameStarted = false;
    state.health = 0;
    clearReloadTimer();
    clearDamageBoostTimer();
    hideDamageFlash();
    state.reloading = false;
    state.damageBoostActive = false;
    updateBestScore();
    updateHud();
    showGameOverStats();

    if (document.pointerLockElement === elements.canvas) {
      document.exitPointerLock();
    }
  }

  function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(state.clock.getDelta(), 0.05);

    // Loop principal: cada sistema actualiza solo si la partida esta activa.
    if (state.gameStarted && !state.gameOver && !state.paused) {
      updatePlayer(delta);
      updatePowerUps();
      updateEnemies(delta);
      checkEnemyAttacks(damagePlayer);
      checkRoundState();
      updateCamera();
    }

    renderer.render(scene, camera);
  }

  function checkRoundState() {
    if (state.roundChanging || state.enemies.length > 0 || state.gameOver) return;

    state.roundChanging = true;
    maybeSpawnPowerUp();
    state.round += 1;
    setRoundMessageText(`Ronda ${state.round}`);
    setRoundMessageVisible(true);
    updateHud();

    state.roundTimer = window.setTimeout(() => {
      if (state.gameOver || !state.gameStarted) return;
      spawnRound(state.round);
      setRoundMessageVisible(false);
      state.roundChanging = false;
      state.roundTimer = null;
      updateHud();
    }, ROUND_MESSAGE_TIME);
  }

  window.ZR.main = {
    damagePlayer,
    endGame,
    pauseGame,
    resetGame,
    resumeGame,
    startGame,
  };
})();

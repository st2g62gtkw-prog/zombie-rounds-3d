(() => {
  const {
    MAX_HEALTH,
    PLAYER_HEIGHT,
  } = window.ZR.config;
  const {
    clearDamageBoostTimer,
    clearReloadTimer,
    state,
    updateBestScore,
  } = window.ZR.gameState;
  const { resetEconomy } = window.ZR.economy;
  const {
    pause,
    resetGameMode,
    resume,
    setGameOver,
    startRound,
    updateRoundState,
  } = window.ZR.gameMode;
  const { setupInput } = window.ZR.input;
  const { performAction } = window.ZR.localSession;
  const { updatePlayer } = window.ZR.player;
  const {
    clearPowerUps,
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
    requestCanvasPointerLock,
    setGameOverVisible,
    setInteractionPrompt,
    setPauseVisible,
    setRoundMessageVisible,
    setStartVisible,
    showDamageFlash,
    showGameOverStats,
    updateHud,
  } = window.ZR.ui;
  const { EVENTS } = window.ZR.protocol;
  const {
    reloadAmmo,
    resetWeapons,
    updateAutomaticFire,
  } = window.ZR.weapons;
  const {
    resetInteractables,
    updateInteractablePrompt,
  } = window.ZR.interactables;
  const {
    checkEnemyAttacks,
    clearEnemies,
    updateEnemies,
  } = window.ZR.zombies;

  initScene();
  resetGame();
  setupInput({
    interact: () => performAction({ type: EVENTS.INTERACT }),
    pauseGame,
    reloadAmmo,
    resetGame,
    resumeGame,
    shoot: () => performAction({ type: EVENTS.SHOOT }),
    startGame,
    switchWeapon: (slot) => performAction({ type: EVENTS.SWITCH_WEAPON, slot }),
  });
  window.addEventListener("resize", resizeRenderer);
  animate();

  function startGame() {
    resetGame(true);
    requestCanvasPointerLock();
  }

  function resetGame(startNow = false) {
    clearEnemies();
    clearPowerUps();
    clearReloadTimer();
    clearDamageBoostTimer();
    hideDamageFlash();
    resetEconomy();
    resetWeapons();
    resetInteractables();
    state.keys.clear();
    state.isFireHeld = false;
    state.baseHeight = PLAYER_HEIGHT;
    state.playerPosition.set(0, state.baseHeight, 7);
    state.verticalVelocity = 0;
    state.isGrounded = true;
    state.jumpQueued = false;
    state.yaw = 0;
    state.pitch = 0;
    state.health = MAX_HEALTH;
    state.players[state.localPlayerId].health = MAX_HEALTH;
    state.reloading = false;
    state.damageBoostActive = false;
    state.nextEnemyId = 1;
    resetGameMode(startNow);
    setPauseVisible(false);
    setGameOverVisible(false);
    setInteractionPrompt("");
    setStartVisible(!startNow);
    window.ZR.ui.showStatusMessage("");

    if (startNow) startRound(state.round);

    updateHud();
    updateCamera();
  }

  function pauseGame() {
    if (!pause()) return;

    setInteractionPrompt("");
    setPauseVisible(true);

    if (document.pointerLockElement === elements.canvas) {
      document.exitPointerLock();
    }
  }

  function resumeGame() {
    if (!resume()) return;

    setPauseVisible(false);
    requestCanvasPointerLock();
  }

  function damagePlayer(amount) {
    state.health = Math.max(0, state.health - amount);
    state.players[state.localPlayerId].health = state.health;
    showDamageFlash();
    updateHud();

    if (state.health <= 0) {
      endGame();
    }
  }

  function endGame() {
    state.gameOver = true;
    state.gameStarted = false;
    state.paused = false;
    state.roundChanging = false;
    state.health = 0;
    state.players[state.localPlayerId].health = 0;
    clearReloadTimer();
    clearDamageBoostTimer();
    hideDamageFlash();
    state.reloading = false;
    state.damageBoostActive = false;
    state.isFireHeld = false;
    setGameOver();
    setPauseVisible(false);
    setRoundMessageVisible(false);
    setInteractionPrompt("");
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
      updateAutomaticFire();
      updatePowerUps();
      updateEnemies(delta);
      checkEnemyAttacks(damagePlayer);
      updateRoundState();
      updateInteractablePrompt();
      updateCamera();
    }

    renderer.render(scene, camera);
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

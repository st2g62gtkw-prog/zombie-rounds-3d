(() => {
  const { state } = window.ZR.gameState;
  const {
    elements,
    requestCanvasPointerLock,
    setStartVisible,
  } = window.ZR.ui;

  function setupInput({
    pauseGame,
    interact,
    reloadAmmo,
    resetGame,
    resumeGame,
    shoot,
    startGame,
    switchWeapon,
  }) {
    document.addEventListener("keydown", (event) => {
      if (event.code === "Escape" || event.code === "KeyP") {
        if (!state.gameStarted || state.gameOver) return;
        event.preventDefault();

        if (state.paused) {
          if (performance.now() - state.lastPauseChange < 180) return;
          resumeGame();
        } else {
          pauseGame();
        }

        return;
      }

      if (event.code === "KeyR" && state.gameOver) {
        startGame();
        return;
      }

      if (event.code === "KeyR") {
        reloadAmmo();
        return;
      }

      if (event.code === "KeyE") {
        if (!state.gameStarted || state.gameOver || state.paused) return;
        interact();
        return;
      }

      if (event.code === "Digit1") {
        switchWeapon(1);
        return;
      }

      if (event.code === "Digit2") {
        switchWeapon(2);
        return;
      }

      if (state.paused) return;

      state.keys.add(event.code);
    });

    document.addEventListener("keyup", (event) => {
      state.keys.delete(event.code);
    });

    document.addEventListener("mousemove", (event) => {
      if (document.pointerLockElement !== elements.canvas || state.gameOver || state.paused) return;

      state.yaw -= event.movementX * 0.0024;
      state.pitch -= event.movementY * 0.0024;
      state.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, state.pitch));
    });

    document.addEventListener("pointerlockchange", () => {
      setStartVisible(!state.gameStarted && !state.gameOver);

      if (state.gameStarted && !state.gameOver && !state.paused && document.pointerLockElement !== elements.canvas) {
        pauseGame();
      }
    });

    document.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      if (event.target === elements.playButton) return;
      if (event.target === elements.restartButton) return;
      if (state.gameOver || !state.gameStarted || state.paused) return;

      if (document.pointerLockElement !== elements.canvas) {
        requestCanvasPointerLock();
        return;
      }

      shoot();
    });

    elements.playButton.addEventListener("click", (event) => {
      event.stopPropagation();
      startGame();
    });

    elements.restartButton.addEventListener("click", (event) => {
      event.stopPropagation();
      resetGame(true);
      requestCanvasPointerLock();
    });

    elements.resumeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      resumeGame();
    });

    elements.pauseRestartButton.addEventListener("click", (event) => {
      event.stopPropagation();
      resetGame(true);
      requestCanvasPointerLock();
    });

    elements.mainMenuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      resetGame(false);
    });
  }

  window.ZR.input = { setupInput };
})();

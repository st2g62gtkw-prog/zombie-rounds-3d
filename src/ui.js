(() => {
  const { MAX_AMMO } = window.ZR.config;
  const {
    clearDamageFlashTimer,
    state,
  } = window.ZR.gameState;
  const { randomBetween } = window.ZR.utils;

  const elements = {
    canvas: document.querySelector("#gameCanvas"),
    healthValue: document.querySelector("#healthValue"),
    roundValue: document.querySelector("#roundValue"),
    enemyValue: document.querySelector("#enemyValue"),
    scoreValue: document.querySelector("#scoreValue"),
    bestScoreValue: document.querySelector("#bestScoreValue"),
    ammoValue: document.querySelector("#ammoValue"),
    maxAmmoValue: document.querySelector("#maxAmmoValue"),
    reloadStatus: document.querySelector("#reloadStatus"),
    damageBoostValue: document.querySelector("#damageBoostValue"),
    damageFlash: document.querySelector("#damageFlash"),
    scorePopups: document.querySelector("#scorePopups"),
    startMessage: document.querySelector("#startMessage"),
    gameOverMessage: document.querySelector("#gameOverMessage"),
    pauseMessage: document.querySelector("#pauseMessage"),
    roundMessage: document.querySelector("#roundMessage"),
    roundMessageText: document.querySelector("#roundMessageText"),
    playButton: document.querySelector("#playButton"),
    restartButton: document.querySelector("#restartButton"),
    finalRoundValue: document.querySelector("#finalRoundValue"),
    finalScoreValue: document.querySelector("#finalScoreValue"),
    finalBestScoreValue: document.querySelector("#finalBestScoreValue"),
  };

  function updateHud() {
    elements.healthValue.textContent = Math.max(0, Math.ceil(state.health));
    elements.roundValue.textContent = state.round;
    elements.enemyValue.textContent = state.enemies.length;
    elements.scoreValue.textContent = state.score;
    elements.bestScoreValue.textContent = state.bestScore;
    elements.ammoValue.textContent = state.ammo;
    elements.maxAmmoValue.textContent = MAX_AMMO;
    elements.reloadStatus.textContent = state.reloading ? " (recargando)" : "";
    elements.damageBoostValue.textContent = state.damageBoostActive ? "x2" : "Normal";
  }

  function showDamageFlash() {
    elements.damageFlash.classList.add("active");

    if (state.damageFlashTimer) {
      window.clearTimeout(state.damageFlashTimer);
    }

    state.damageFlashTimer = window.setTimeout(() => {
      elements.damageFlash.classList.remove("active");
      state.damageFlashTimer = null;
    }, 180);
  }

  function hideDamageFlash() {
    clearDamageFlashTimer();
    elements.damageFlash.classList.remove("active");
  }

  function showScorePopup(points) {
    const popup = document.createElement("div");
    popup.className = "scorePopup";
    popup.textContent = `+${points}`;
    popup.style.left = `${50 + randomBetween(-7, 7)}%`;
    popup.style.top = `${45 + randomBetween(-5, 5)}%`;
    elements.scorePopups.appendChild(popup);

    window.setTimeout(() => {
      popup.remove();
    }, 850);
  }

  function setPauseVisible(visible) {
    elements.pauseMessage.classList.toggle("hidden", !visible);
  }

  function setRoundMessageVisible(visible) {
    elements.roundMessage.classList.toggle("hidden", !visible);
  }

  function setRoundMessageText(text) {
    elements.roundMessageText.textContent = text;
  }

  function setStartVisible(visible) {
    elements.startMessage.classList.toggle("hidden", !visible);
  }

  function setGameOverVisible(visible) {
    elements.gameOverMessage.classList.toggle("hidden", !visible);
  }

  function requestCanvasPointerLock() {
    try {
      const lockRequest = elements.canvas.requestPointerLock();
      if (lockRequest?.catch) lockRequest.catch(() => {});
    } catch {
      // Algunos navegadores de prueba bloquean pointer lock aunque el juego sea jugable.
    }
  }

  function showGameOverStats() {
    elements.finalRoundValue.textContent = state.round;
    elements.finalScoreValue.textContent = state.score;
    elements.finalBestScoreValue.textContent = state.bestScore;
    setGameOverVisible(true);
  }

  window.ZR.ui = {
    elements,
    hideDamageFlash,
    requestCanvasPointerLock,
    setGameOverVisible,
    setPauseVisible,
    setRoundMessageText,
    setRoundMessageVisible,
    setStartVisible,
    showDamageFlash,
    showGameOverStats,
    showScorePopup,
    updateHud,
  };
})();

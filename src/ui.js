(() => {
  const { WEAPONS } = window.ZR.config;
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
    ammoReserveValue: document.querySelector("#maxAmmoValue"),
    reloadStatus: document.querySelector("#reloadStatus"),
    damageBoostValue: document.querySelector("#damageBoostValue"),
    healthBar: document.querySelector("#healthBar"),
    waveValue: document.querySelector("#waveValue"),
    weaponNameValue: document.querySelector("#weaponNameValue"),
    slot1: document.querySelector("#slot1"),
    slot2: document.querySelector("#slot2"),
    slot1Name: document.querySelector("#slot1Name"),
    slot2Name: document.querySelector("#slot2Name"),
    damageFlash: document.querySelector("#damageFlash"),
    scorePopups: document.querySelector("#scorePopups"),
    interactionPrompt: document.querySelector("#interactionPrompt"),
    statusMessage: document.querySelector("#statusMessage"),
    startMessage: document.querySelector("#startMessage"),
    gameOverMessage: document.querySelector("#gameOverMessage"),
    pauseMessage: document.querySelector("#pauseMessage"),
    resumeButton: document.querySelector("#resumeButton"),
    pauseRestartButton: document.querySelector("#pauseRestartButton"),
    mainMenuButton: document.querySelector("#mainMenuButton"),
    roundMessage: document.querySelector("#roundMessage"),
    roundMessageText: document.querySelector("#roundMessageText"),
    playButton: document.querySelector("#playButton"),
    restartButton: document.querySelector("#restartButton"),
    finalRoundValue: document.querySelector("#finalRoundValue"),
    finalScoreValue: document.querySelector("#finalScoreValue"),
    finalBestScoreValue: document.querySelector("#finalBestScoreValue"),
  };

  function updateHud() {
    const player = state.players[state.localPlayerId];
    const weapon = player?.weapons?.[player.activeWeaponId] || null;

    elements.healthValue.textContent = Math.max(0, Math.ceil(state.health));
    elements.healthBar.style.width = `${Math.max(0, Math.min(100, state.health))}%`;
    elements.roundValue.textContent = state.round;
    elements.waveValue.textContent = state.round;
    elements.enemyValue.textContent = state.enemies.length;
    elements.scoreValue.textContent = state.score;
    elements.bestScoreValue.textContent = state.bestScore;
    elements.weaponNameValue.textContent = weapon?.name || "Sin arma";
    elements.ammoValue.textContent = weapon?.ammoInMagazine ?? 0;
    elements.ammoReserveValue.textContent = weapon?.reserveAmmo ?? 0;
    elements.reloadStatus.textContent = state.reloading ? "Recargando... " : "";
    elements.damageBoostValue.textContent = state.damageBoostActive ? "Dano x2" : "Dano normal";
    updateWeaponSlots(player);
  }

  function setInteractionPrompt(text) {
    elements.interactionPrompt.textContent = text;
    elements.interactionPrompt.classList.toggle("hidden", !text);
  }

  function showStatusMessage(text, duration = 1400) {
    elements.statusMessage.textContent = text;
    elements.statusMessage.classList.toggle("hidden", !text);

    if (state.statusMessageTimer) {
      window.clearTimeout(state.statusMessageTimer);
    }

    if (!text) {
      state.statusMessageTimer = null;
      return;
    }

    state.statusMessageTimer = window.setTimeout(() => {
      elements.statusMessage.classList.add("hidden");
      state.statusMessageTimer = null;
    }, duration);
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

  function updateWeaponSlots(player) {
    updateSlot(elements.slot1, elements.slot1Name, player, 0);
    updateSlot(elements.slot2, elements.slot2Name, player, 1);
  }

  function updateSlot(slotElement, nameElement, player, slotIndex) {
    const weaponId = player?.weaponSlots?.[slotIndex] || null;
    const weapon = weaponId ? player.weapons[weaponId] : null;

    slotElement.classList.toggle("active", Boolean(weapon && player.activeWeaponId === weapon.id));
    nameElement.textContent = weapon?.name || "Vacio";
  }

  window.ZR.ui = {
    elements,
    hideDamageFlash,
    requestCanvasPointerLock,
    setGameOverVisible,
    setInteractionPrompt,
    setPauseVisible,
    setRoundMessageText,
    setRoundMessageVisible,
    setStartVisible,
    showDamageFlash,
    showGameOverStats,
    showScorePopup,
    showStatusMessage,
    updateHud,
  };
})();

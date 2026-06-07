(() => {
  window.ZR.multiplayer = window.ZR.multiplayer || {};

  const { state } = window.ZR.gameState;

  function performAction(action) {
    return window.ZR.actions.handleAction({
      playerId: state.localPlayerId,
      ...action,
    });
  }

  function getLocalPlayerId() {
    return state.localPlayerId;
  }

  window.ZR.localSession = {
    getLocalPlayerId,
    performAction,
  };
  window.ZR.multiplayer.localSession = window.ZR.localSession;
})();

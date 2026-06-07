(() => {
  window.ZR = window.ZR || {};
  window.ZR.multiplayer = window.ZR.multiplayer || {};

  const EVENTS = {
    PLAYER_INPUT: "PLAYER_INPUT",
    SHOOT: "SHOOT",
    INTERACT: "INTERACT",
    BUY_DOOR: "BUY_DOOR",
    BUY_AMMO: "BUY_AMMO",
    BUY_WEAPON: "BUY_WEAPON",
    SWITCH_WEAPON: "SWITCH_WEAPON",
    STATE_SNAPSHOT: "STATE_SNAPSHOT",
    ROUND_STARTED: "ROUND_STARTED",
    ROUND_ENDED: "ROUND_ENDED",
    GAME_OVER: "GAME_OVER",
  };

  window.ZR.protocol = { EVENTS };
  window.ZR.multiplayer.protocol = window.ZR.protocol;
})();

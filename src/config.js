(() => {
  window.ZR = window.ZR || {};

  const config = {
    MAX_HEALTH: 100,
    PLAYER_HEIGHT: 1.7,
    PLAYER_RADIUS: 0.45,
    PLAYER_SPEED: 6,
    ARENA_LIMIT: 23,
    BEST_SCORE_KEY: "zombieRounds3D.bestScore",
    MAX_AMMO: 8,
    RELOAD_TIME: 1200,
    ROUND_MESSAGE_TIME: 1000,
    GAME_STATUS: {
      MENU: "menu",
      PLAYING: "playing",
      PAUSED: "paused",
      GAME_OVER: "gameOver",
      ROUND_COMPLETE: "roundComplete",
    },
    ROUND_BASE_ENEMIES: 3,
    ROUND_ENEMY_GROWTH: 2,
    ROUND_SPEED_BONUS: 0.09,
    POWER_UP_CHANCE: 0.65,
    MAX_POWER_UPS: 2,
    POWER_UP_DURATION: 14000,
    POWER_UP_PICKUP_RANGE: 1.2,
    DAMAGE_BOOST_TIME: 8000,
    ENEMY_ATTACK_COOLDOWN: 850,
    ENEMY_ATTACK_RANGE: 1.7,
    SPAWN_OBSTACLE_CLEARANCE: 1.2,
    NAV_CELL_SIZE: 1,
    NAV_RECALC_TIME: 0.35,
    NAV_BLOCKED_RECALC_TIME: 0.55,
    NAV_WAYPOINT_REACH: 0.3,
    NAV_PATH_PADDING: 0.22,
    NAV_DEBUG: false,
    NAV_DEBUG_LINE_INTERVAL: 1500,
  };

  config.NAV_MIN_X = -config.ARENA_LIMIT;
  config.NAV_MIN_Z = -config.ARENA_LIMIT;
  config.NAV_COLUMNS = Math.floor((config.ARENA_LIMIT * 2) / config.NAV_CELL_SIZE) + 1;
  config.NAV_ROWS = config.NAV_COLUMNS;

  config.ENEMY_TYPES = {
    normal: {
      key: "normal",
      bodyColor: 0x5eb55a,
      headColor: 0x7fd06e,
      scale: 1,
      radius: 0.42,
      spawnY: 0.8,
      speed: 1.35,
      health: 1,
      points: 100,
    },
    fast: {
      key: "fast",
      bodyColor: 0x8fd14f,
      headColor: 0xd4f06c,
      scale: 0.74,
      radius: 0.32,
      spawnY: 0.62,
      speed: 2.05,
      health: 1,
      points: 150,
    },
    heavy: {
      key: "heavy",
      bodyColor: 0x7a5b35,
      headColor: 0xb08a45,
      scale: 1.35,
      radius: 0.58,
      spawnY: 1,
      speed: 0.85,
      health: 3,
      points: 250,
    },
  };

  config.POWER_UP_TYPES = {
    heal: {
      key: "heal",
      color: 0x5de08a,
      kind: "sphere",
    },
    ammo: {
      key: "ammo",
      color: 0x5aa8ff,
      kind: "box",
    },
    damage: {
      key: "damage",
      color: 0xff6b4a,
      kind: "diamond",
    },
  };

  window.ZR.config = config;
})();

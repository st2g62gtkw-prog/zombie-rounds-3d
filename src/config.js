(() => {
  window.ZR = window.ZR || {};

  const config = {
    MAX_HEALTH: 100,
    PLAYER_HEIGHT: 1.7,
    PLAYER_RADIUS: 0.45,
    PLAYER_SPEED: 6,
    ARENA_LIMIT: 23,
    BEST_SCORE_KEY: "zombieRounds3D.bestScore",
    MAX_AMMO: 12,
    RELOAD_TIME: 1200,
    ROUND_MESSAGE_TIME: 1000,
    GAME_STATUS: {
      MENU: "menu",
      PLAYING: "playing",
      PAUSED: "paused",
      GAME_OVER: "gameOver",
      ROUND_TRANSITION: "roundTransition",
      ROUND_COMPLETE: "roundTransition",
    },
    LOCAL_PLAYER_ID: "player-1",
    ROUND_BASE_ENEMIES: 3,
    ROUND_ENEMY_GROWTH: 2,
    ROUND_SPEED_BONUS: 0.09,
    POINTS_PER_HIT: 10,
    DOOR_COST: 500,
    AMMO_STATION_COST: 250,
    WEAPON_STATION_COST: 750,
    INTERACT_RANGE: 2.4,
    POWER_UP_DROP_CHANCE: 0.05,
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
    ENABLE_WEAPON_VIEWMODEL: true,
    ENABLE_JUMP: true,
    GRAVITY: 18,
    JUMP_VELOCITY: 6.8,
    HEADSHOT_MULTIPLIER: 2,
    MAX_STEP_UP_HEIGHT: 0.35,
    MAX_STEP_DOWN_HEIGHT: 0.35,
    TEST_PLATFORM: {
      x: -18,
      z: 16,
      width: 5,
      height: 1.1,
      depth: 4,
      rampLength: 4,
      rampWidth: 3.4,
    },
  };

  config.NAV_MIN_X = -config.ARENA_LIMIT;
  config.NAV_MIN_Z = -config.ARENA_LIMIT;
  config.NAV_COLUMNS = Math.floor((config.ARENA_LIMIT * 2) / config.NAV_CELL_SIZE) + 1;
  config.NAV_ROWS = config.NAV_COLUMNS;

  config.WEAPONS = {
    pistol: {
      id: "pistol",
      name: "Pistola",
      damage: 0.5,
      fireRate: 3.5,
      automatic: false,
      magazineSize: 12,
      reserveAmmo: 36,
      maxReserveAmmo: 72,
      reloadTime: 1.2,
      cost: 0,
    },
    rifle: {
      id: "rifle",
      name: "Rifle",
      damage: 0.25,
      fireRate: 10.4,
      automatic: true,
      magazineSize: 60,
      reserveAmmo: 240,
      maxReserveAmmo: 240,
      reloadTime: 1.8,
      cost: 750,
    },
  };

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
      attackDamage: 10,
      points: 100,
    },
    fast: {
      key: "fast",
      bodyColor: 0x8fd14f,
      headColor: 0xd4f06c,
      scale: 0.74,
      radius: 0.32,
      spawnY: 0.62,
      speed: 3.075,
      health: 0.5,
      attackDamage: 10,
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
      attackDamage: 20,
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

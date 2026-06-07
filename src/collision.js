(() => {
  const { ARENA_LIMIT } = window.ZR.config;
  const { state } = window.ZR.gameState;

  function canOccupy(position, radius) {
    if (
      position.x < -ARENA_LIMIT + radius ||
      position.x > ARENA_LIMIT - radius ||
      position.z < -ARENA_LIMIT + radius ||
      position.z > ARENA_LIMIT - radius
    ) {
      return false;
    }

    return state.obstacles.every((obstacle) => {
      const insideX = Math.abs(position.x - obstacle.x) < obstacle.halfX + radius;
      const insideZ = Math.abs(position.z - obstacle.z) < obstacle.halfZ + radius;
      return !(insideX && insideZ);
    });
  }

  window.ZR.collision = { canOccupy };
})();

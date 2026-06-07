(() => {
  const { ARENA_LIMIT } = window.ZR.config;
  const { state } = window.ZR.gameState;

  function canOccupy(position, radius, actor = "zombie") {
    // Colision horizontal simple. Las rampas/plataformas ya separan actor player/zombie.
    if (
      position.x < -ARENA_LIMIT + radius ||
      position.x > ARENA_LIMIT - radius ||
      position.z < -ARENA_LIMIT + radius ||
      position.z > ARENA_LIMIT - radius
    ) {
      return false;
    }

    return state.obstacles.every((obstacle) => {
      if (!blocksActor(obstacle, actor)) return true;

      const insideX = Math.abs(position.x - obstacle.x) < obstacle.halfX + radius;
      const insideZ = Math.abs(position.z - obstacle.z) < obstacle.halfZ + radius;
      return !(insideX && insideZ);
    });
  }

  function getGroundHeightAt(positionOrX, zValue) {
    const x = typeof positionOrX === "number" ? positionOrX : positionOrX.x;
    const z = typeof positionOrX === "number" ? zValue : positionOrX.z;
    let height = 0;

    for (const surface of state.platforms) {
      if (!isInsideSurface(x, z, surface)) continue;

      if (surface.type === "flat") {
        height = Math.max(height, surface.height);
      }

      if (surface.type === "ramp") {
        height = Math.max(height, getRampHeight(z, surface));
      }
    }

    return height;
  }

  function blocksActor(obstacle, actor) {
    if (actor === "player") return obstacle.blocksPlayer !== false;
    if (actor === "zombie") return obstacle.blocksZombies !== false;
    return true;
  }

  function isInsideSurface(x, z, surface) {
    return x >= surface.minX &&
      x <= surface.maxX &&
      z >= surface.minZ &&
      z <= surface.maxZ;
  }

  function getRampHeight(z, ramp) {
    const t = Math.max(0, Math.min(1, (z - ramp.startZ) / (ramp.endZ - ramp.startZ)));
    return ramp.startHeight + (ramp.endHeight - ramp.startHeight) * t;
  }

  window.ZR.collision = {
    canOccupy,
    getGroundHeightAt,
  };
})();

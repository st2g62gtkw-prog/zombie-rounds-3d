(() => {
  const {
    NAV_CELL_SIZE,
    NAV_COLUMNS,
    NAV_MIN_X,
    NAV_MIN_Z,
    NAV_ROWS,
  } = window.ZR.config;
  const { canOccupy } = window.ZR.collision;
  const { state } = window.ZR.gameState;
  const { getThree } = window.ZR.utils;
  const THREE = getThree();

  // Conversion central: el mundo usa X/Z y la grilla usa col/fila.
  function worldToGrid(position) {
    return {
      row: clampGridIndex(Math.round((position.z - NAV_MIN_Z) / NAV_CELL_SIZE), NAV_ROWS),
      col: clampGridIndex(Math.round((position.x - NAV_MIN_X) / NAV_CELL_SIZE), NAV_COLUMNS),
    };
  }

  function gridToWorld(row, col) {
    return new THREE.Vector3(
      NAV_MIN_X + col * NAV_CELL_SIZE,
      0,
      NAV_MIN_Z + row * NAV_CELL_SIZE,
    );
  }

  function isWalkable(row, col, radius = 0.5) {
    if (!isInsideGrid(row, col)) return false;
    return canOccupy(gridToWorld(row, col), radius);
  }

  // A* simple en grilla. Evita cortar esquinas para que la ruta sea transitable.
  function findPath(startCell, targetCell, radius = 0.5) {
    const start = isWalkable(startCell.row, startCell.col, radius)
      ? startCell
      : findNearestWalkableCell(startCell, radius);
    const target = isWalkable(targetCell.row, targetCell.col, radius)
      ? targetCell
      : findNearestWalkableCell(targetCell, radius);

    if (!start || !target) return [];

    const open = [{
      cell: start,
      gScore: 0,
      fScore: getGridHeuristic(start, target),
    }];
    const cameFrom = new Map();
    const gScores = new Map([[cellKey(start), 0]]);
    const closed = new Set();

    while (open.length > 0) {
      open.sort((first, second) => first.fScore - second.fScore);
      const current = open.shift().cell;
      const currentKey = cellKey(current);

      if (sameCell(current, target)) {
        return reconstructPath(cameFrom, current);
      }

      if (closed.has(currentKey)) continue;
      closed.add(currentKey);

      for (const neighbor of getWalkableNeighbors(current, radius)) {
        const neighborKey = cellKey(neighbor);
        if (closed.has(neighborKey)) continue;

        const tentativeGScore = gScores.get(currentKey) + getMoveCost(current, neighbor);
        const knownGScore = gScores.get(neighborKey);

        if (knownGScore !== undefined && tentativeGScore >= knownGScore) continue;

        cameFrom.set(neighborKey, current);
        gScores.set(neighborKey, tentativeGScore);
        open.push({
          cell: neighbor,
          gScore: tentativeGScore,
          fScore: tentativeGScore + getGridHeuristic(neighbor, target),
        });
      }
    }

    return [];
  }

  function findNearestWalkableCell(cell, radius = 0.5) {
    if (!cell) return null;

    const start = {
      row: clampGridIndex(cell.row, NAV_ROWS),
      col: clampGridIndex(cell.col, NAV_COLUMNS),
    };
    const queue = [start];
    const visited = new Set([cellKey(start)]);

    while (queue.length > 0) {
      const current = queue.shift();

      if (isWalkable(current.row, current.col, radius)) return current;

      for (const neighbor of getGridNeighbors(current)) {
        const key = cellKey(neighbor);
        if (visited.has(key)) continue;

        visited.add(key);
        queue.push(neighbor);
      }
    }

    return null;
  }

  function isDirectPathClear(startPosition, targetPosition, radius) {
    return state.obstacles.every((obstacle) => !lineIntersectsExpandedObstacle(
      startPosition,
      targetPosition,
      obstacle,
      radius,
    ));
  }

  function formatCell(cell) {
    return cell ? { row: cell.row, col: cell.col } : null;
  }

  function cellKey(cell) {
    return `${cell.row},${cell.col}`;
  }

  function lineIntersectsExpandedObstacle(startPosition, targetPosition, obstacle, radius) {
    const minX = obstacle.x - obstacle.halfX - radius;
    const maxX = obstacle.x + obstacle.halfX + radius;
    const minZ = obstacle.z - obstacle.halfZ - radius;
    const maxZ = obstacle.z + obstacle.halfZ + radius;

    return lineIntersectsRect(
      startPosition.x,
      startPosition.z,
      targetPosition.x,
      targetPosition.z,
      minX,
      maxX,
      minZ,
      maxZ,
    );
  }

  function lineIntersectsRect(x1, z1, x2, z2, minX, maxX, minZ, maxZ) {
    const directionX = x2 - x1;
    const directionZ = z2 - z1;
    const range = { min: 0, max: 1 };

    return clipLineAxis(-directionX, x1 - minX, range) &&
      clipLineAxis(directionX, maxX - x1, range) &&
      clipLineAxis(-directionZ, z1 - minZ, range) &&
      clipLineAxis(directionZ, maxZ - z1, range) &&
      range.max >= range.min;
  }

  function clipLineAxis(direction, distanceToEdge, range) {
    if (direction === 0) return distanceToEdge >= 0;

    const ratio = distanceToEdge / direction;

    if (direction < 0) {
      if (ratio > range.max) return false;
      if (ratio > range.min) range.min = ratio;
    } else {
      if (ratio < range.min) return false;
      if (ratio < range.max) range.max = ratio;
    }

    return true;
  }

  function getWalkableNeighbors(cell, radius) {
    return getGridNeighbors(cell).filter((neighbor) => {
      if (!isWalkable(neighbor.row, neighbor.col, radius)) return false;

      const rowDelta = neighbor.row - cell.row;
      const colDelta = neighbor.col - cell.col;

      if (rowDelta !== 0 && colDelta !== 0) {
        return isWalkable(cell.row, cell.col + colDelta, radius) &&
          isWalkable(cell.row + rowDelta, cell.col, radius);
      }

      return true;
    });
  }

  function getGridNeighbors(cell) {
    const directions = [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
      { row: -1, col: -1 },
      { row: -1, col: 1 },
      { row: 1, col: -1 },
      { row: 1, col: 1 },
    ];

    return directions
      .map((direction) => ({
        row: cell.row + direction.row,
        col: cell.col + direction.col,
      }))
      .filter((neighbor) => isInsideGrid(neighbor.row, neighbor.col));
  }

  function getMoveCost(first, second) {
    const diagonal = first.row !== second.row && first.col !== second.col;
    return diagonal ? Math.SQRT2 : 1;
  }

  function getGridHeuristic(first, second) {
    const rowDistance = Math.abs(first.row - second.row);
    const colDistance = Math.abs(first.col - second.col);
    const straight = Math.abs(rowDistance - colDistance);
    const diagonal = Math.min(rowDistance, colDistance);
    return straight + diagonal * Math.SQRT2;
  }

  function reconstructPath(cameFrom, currentCell) {
    const path = [currentCell];
    let currentKey = cellKey(currentCell);

    while (cameFrom.has(currentKey)) {
      const previous = cameFrom.get(currentKey);
      path.unshift(previous);
      currentKey = cellKey(previous);
    }

    return path;
  }

  function isInsideGrid(row, col) {
    return row >= 0 && row < NAV_ROWS && col >= 0 && col < NAV_COLUMNS;
  }

  function clampGridIndex(value, size) {
    return Math.max(0, Math.min(size - 1, value));
  }

  function sameCell(first, second) {
    return first.row === second.row && first.col === second.col;
  }

  window.ZR.pathfinding = {
    cellKey,
    findNearestWalkableCell,
    findPath,
    formatCell,
    gridToWorld,
    isDirectPathClear,
    isWalkable,
    worldToGrid,
  };
})();

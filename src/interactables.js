(() => {
  const {
    AMMO_STATION_COST,
    DOOR_COST,
    INTERACT_RANGE,
  } = window.ZR.config;
  const { state } = window.ZR.gameState;
  const { scene } = window.ZR.scene;
  const {
    getHorizontalDistance,
    getThree,
  } = window.ZR.utils;
  const THREE = getThree();

  function initInteractables() {
    clearInteractables();
    createDoor({
      id: "door-yard-west",
      x: -4,
      z: 2.5,
      width: 4,
      depth: 0.8,
      cost: DOOR_COST,
    });
    createBuyStation({
      id: "ammo-station-start",
      x: 3.5,
      z: 7,
      cost: AMMO_STATION_COST,
    });
  }

  function updateInteractablePrompt() {
    if (!state.gameStarted || state.gameOver || state.paused) {
      setCurrentInteractable(null);
      return;
    }

    const interactable = findNearestInteractable();
    setCurrentInteractable(interactable);
  }

  function getCurrentInteractable() {
    if (!state.currentInteractableId) return null;
    return state.interactables.find((item) => item.id === state.currentInteractableId) || null;
  }

  function findInteractable(targetId) {
    return state.interactables.find((item) => item.id === targetId) || null;
  }

  function openDoor(doorId) {
    const door = findInteractable(doorId);
    if (!door || door.type !== "door" || door.opened) return false;

    door.opened = true;
    removeCollision(door.collision);
    scene.remove(door.mesh);
    door.mesh.geometry.dispose();
    door.mesh.material.dispose();
    door.mesh = null;
    door.collision = null;
    setCurrentInteractable(null);
    window.ZR.ui.updateHud();

    return true;
  }

  function resetInteractables() {
    initInteractables();
    window.ZR.ui.setInteractionPrompt("");
  }

  function clearInteractables() {
    for (const item of state.interactables) {
      if (item.collision) removeCollision(item.collision);
      if (item.mesh) {
        scene.remove(item.mesh);
        item.mesh.geometry.dispose();
        item.mesh.material.dispose();
      }
    }

    state.doors.length = 0;
    state.buyStations.length = 0;
    state.interactables.length = 0;
    state.currentInteractableId = null;
  }

  function createDoor({ id, x, z, width, depth, cost }) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, 2, depth),
      new THREE.MeshStandardMaterial({ color: 0x7c8f9c, roughness: 0.82 }),
    );
    mesh.position.set(x, 1, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const collision = {
      x,
      z,
      halfX: width / 2,
      halfZ: depth / 2,
    };
    state.obstacles.push(collision);

    const door = {
      id,
      type: "door",
      label: "comprar/abrir",
      cost,
      mesh,
      collision,
      opened: false,
    };
    state.doors.push(door);
    state.interactables.push(door);
    return door;
  }

  function createBuyStation({ id, x, z, cost }) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.1, 1.2),
      new THREE.MeshStandardMaterial({
        color: 0x4d8ed8,
        emissive: 0x16395d,
        emissiveIntensity: 0.2,
        roughness: 0.62,
      }),
    );
    mesh.position.set(x, 0.55, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const station = {
      id,
      type: "buyWeapon",
      label: "comprar municion",
      cost,
      mesh,
      opened: true,
    };
    state.buyStations.push(station);
    state.interactables.push(station);
    return station;
  }

  function findNearestInteractable() {
    let nearest = null;
    let nearestDistance = Infinity;

    for (const item of state.interactables) {
      if (item.type === "door" && item.opened) continue;

      const distance = getHorizontalDistance(item.mesh.position, state.playerPosition);
      if (distance > INTERACT_RANGE || distance >= nearestDistance) continue;

      nearest = item;
      nearestDistance = distance;
    }

    return nearest;
  }

  function setCurrentInteractable(interactable) {
    state.currentInteractableId = interactable?.id || null;

    if (!interactable) {
      window.ZR.ui.setInteractionPrompt("");
      return;
    }

    window.ZR.ui.setInteractionPrompt(`Presiona E para ${interactable.label} - costo: ${interactable.cost}`);
  }

  function removeCollision(collision) {
    const index = state.obstacles.indexOf(collision);
    if (index !== -1) state.obstacles.splice(index, 1);
  }

  window.ZR.interactables = {
    clearInteractables,
    findInteractable,
    getCurrentInteractable,
    initInteractables,
    openDoor,
    resetInteractables,
    updateInteractablePrompt,
  };
})();

(() => {
  const {
    AMMO_STATION_COST,
    DOOR_COST,
    INTERACT_RANGE,
    WEAPON_STATION_COST,
  } = window.ZR.config;
  const { EVENTS } = window.ZR.protocol;
  const { state } = window.ZR.gameState;
  const { scene } = window.ZR.scene;
  const {
    getHorizontalDistance,
    getThree,
  } = window.ZR.utils;
  const THREE = getThree();

  function initInteractables() {
    clearInteractables();
    createAmmoStation({
      id: "ammo-station-start",
      x: 3.5,
      z: 7,
      cost: AMMO_STATION_COST,
    });
    createWeaponStation({
      id: "rifle-station-start",
      x: -4,
      z: 2.5,
      width: 2,
      depth: 1.4,
      cost: WEAPON_STATION_COST,
      weaponId: "rifle",
    });
  }

  function updateInteractablePrompt() {
    if (!state.gameStarted || state.gameOver || state.paused) {
      setCurrentInteractable(null);
      return;
    }

    setCurrentInteractable(findNearestInteractable());
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
    door.enabled = false;
    removeInteractableCollision(door);
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
      removeInteractableCollision(item);
      removeMesh(item);
    }

    state.doors.length = 0;
    state.buyStations.length = 0;
    state.interactables.length = 0;
    state.currentInteractableId = null;
  }

  function createDoor({ id, x, z, width, depth, cost = DOOR_COST }) {
    const mesh = createBoxMesh(width, 2, depth, 0x7c8f9c, 0x000000);
    mesh.position.set(x, 1, z);
    scene.add(mesh);

    const collision = addCollision(x, z, width, depth);
    const door = {
      id,
      type: "door",
      label: "abrir puerta",
      cost,
      mesh,
      collision,
      position: { x, z },
      radius: INTERACT_RANGE,
      enabled: true,
      actionType: EVENTS.BUY_DOOR,
      opened: false,
    };

    state.doors.push(door);
    state.interactables.push(door);
    return door;
  }

  function createAmmoStation({ id, x, z, cost }) {
    const mesh = createBoxMesh(1.1, 0.9, 1.1, 0x4d8ed8, 0x16395d);
    mesh.position.set(x, 0.45, z);
    scene.add(mesh);

    const station = {
      id,
      type: "ammo",
      label: "comprar municion",
      cost,
      mesh,
      collision: null,
      position: { x, z },
      radius: INTERACT_RANGE,
      enabled: true,
      actionType: EVENTS.BUY_AMMO,
    };

    state.buyStations.push(station);
    state.interactables.push(station);
    return station;
  }

  function createWeaponStation({ id, x, z, width, depth, cost, weaponId }) {
    const weapon = window.ZR.config.WEAPONS[weaponId];
    const mesh = createBoxMesh(width, 1.3, depth, 0x5aa8ff, 0x17365c);
    mesh.position.set(x, 0.65, z);
    scene.add(mesh);

    const collision = addCollision(x, z, width, depth);
    const station = {
      id,
      type: "weapon",
      label: `comprar ${weapon.name}`,
      cost,
      weaponId,
      mesh,
      collision,
      position: { x, z },
      radius: INTERACT_RANGE,
      enabled: true,
      actionType: EVENTS.BUY_WEAPON,
    };

    state.buyStations.push(station);
    state.interactables.push(station);
    return station;
  }

  function findNearestInteractable() {
    let nearest = null;
    let nearestDistance = Infinity;

    for (const item of state.interactables) {
      if (!item.enabled || !item.mesh) continue;
      if (item.type === "door" && item.opened) continue;

      const distance = getHorizontalDistance(item.mesh.position, state.playerPosition);
      const range = item.radius ?? INTERACT_RANGE;

      if (distance > range || distance >= nearestDistance) continue;

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

    window.ZR.ui.setInteractionPrompt(`Presiona E para ${interactable.label} - ${interactable.cost} puntos`);
  }

  function createBoxMesh(width, height, depth, color, emissive) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: emissive ? 0.18 : 0,
        roughness: 0.66,
      }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function addCollision(x, z, width, depth) {
    const collision = {
      x,
      z,
      halfX: width / 2,
      halfZ: depth / 2,
    };
    state.obstacles.push(collision);
    return collision;
  }

  function removeInteractableCollision(item) {
    if (!item.collision) return;

    const index = state.obstacles.indexOf(item.collision);
    if (index !== -1) state.obstacles.splice(index, 1);
    item.collision = null;
  }

  function removeMesh(item) {
    if (!item.mesh) return;

    scene.remove(item.mesh);
    item.mesh.geometry.dispose();
    item.mesh.material.dispose();
    item.mesh = null;
  }

  window.ZR.interactables = {
    clearInteractables,
    createDoor,
    findInteractable,
    getCurrentInteractable,
    initInteractables,
    openDoor,
    resetInteractables,
    updateInteractablePrompt,
  };
})();

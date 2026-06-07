(() => {
  const {
    PLAYER_RADIUS,
    PLAYER_SPEED,
  } = window.ZR.config;
  const { canOccupy } = window.ZR.collision;
  const { state } = window.ZR.gameState;
  const { getThree } = window.ZR.utils;
  const THREE = getThree();

  function updatePlayer(delta) {
    const input = new THREE.Vector3();

    if (state.keys.has("KeyW")) input.z -= 1;
    if (state.keys.has("KeyS")) input.z += 1;
    if (state.keys.has("KeyA")) input.x -= 1;
    if (state.keys.has("KeyD")) input.x += 1;

    if (input.lengthSq() === 0) return;

    input.normalize();

    const forward = new THREE.Vector3(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
    const right = new THREE.Vector3(Math.cos(state.yaw), 0, -Math.sin(state.yaw));
    const movement = new THREE.Vector3()
      .addScaledVector(forward, -input.z)
      .addScaledVector(right, input.x)
      .multiplyScalar(PLAYER_SPEED * delta);

    const nextX = state.playerPosition.clone();
    nextX.x += movement.x;
    if (canOccupy(nextX, PLAYER_RADIUS)) state.playerPosition.x = nextX.x;

    const nextZ = state.playerPosition.clone();
    nextZ.z += movement.z;
    if (canOccupy(nextZ, PLAYER_RADIUS)) state.playerPosition.z = nextZ.z;
  }

  window.ZR.player = { updatePlayer };
})();

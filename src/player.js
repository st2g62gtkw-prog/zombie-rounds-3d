(() => {
  const {
    ENABLE_JUMP,
    GRAVITY,
    JUMP_VELOCITY,
    MAX_STEP_DOWN_HEIGHT,
    MAX_STEP_UP_HEIGHT,
    PLAYER_RADIUS,
    PLAYER_SPEED,
  } = window.ZR.config;
  const {
    canOccupy,
    getGroundHeightAt: getSharedGroundHeightAt,
  } = window.ZR.collision;
  const { state } = window.ZR.gameState;
  const { getThree } = window.ZR.utils;
  const THREE = getThree();

  function updatePlayer(delta) {
    updateHorizontalMovement(delta);
    updateVerticalMovement(delta);
  }

  function updateHorizontalMovement(delta) {
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
    if (canOccupy(nextX, PLAYER_RADIUS, "player") && canStepTo(nextX)) {
      state.playerPosition.x = nextX.x;
    }

    const nextZ = state.playerPosition.clone();
    nextZ.z += movement.z;
    if (canOccupy(nextZ, PLAYER_RADIUS, "player") && canStepTo(nextZ)) {
      state.playerPosition.z = nextZ.z;
    }
  }

  function updateVerticalMovement(delta) {
    if (!ENABLE_JUMP) {
      resetVerticalPosition();
      return;
    }

    const groundY = getSharedGroundHeightAt(state.playerPosition);
    const cameraGroundY = state.baseHeight + groundY;
    const groundDrop = state.playerPosition.y - cameraGroundY;

    state.lastGroundHeight = groundY;

    if (state.isGrounded && groundDrop > MAX_STEP_DOWN_HEIGHT) {
      state.isGrounded = false;
    }

    if (state.jumpQueued && state.isGrounded) {
      state.verticalVelocity = JUMP_VELOCITY;
      state.isGrounded = false;
    }

    state.jumpQueued = false;

    if (state.isGrounded) {
      state.playerPosition.y = cameraGroundY;
      state.verticalVelocity = 0;
      return;
    }

    if (!state.isGrounded) {
      state.verticalVelocity -= GRAVITY * delta;
      state.playerPosition.y += state.verticalVelocity * delta;
    }

    if (state.playerPosition.y <= cameraGroundY) {
      state.playerPosition.y = cameraGroundY;
      state.verticalVelocity = 0;
      state.isGrounded = true;
      return;
    }

  }

  function resetVerticalPosition() {
    state.playerPosition.y = state.baseHeight;
    state.verticalVelocity = 0;
    state.isGrounded = true;
    state.jumpQueued = false;
  }

  function canStepTo(nextPosition) {
    if (!ENABLE_JUMP || !state.isGrounded) return true;

    const currentGround = getSharedGroundHeightAt(state.playerPosition);
    const nextGround = getSharedGroundHeightAt(nextPosition);

    return nextGround - currentGround <= MAX_STEP_UP_HEIGHT;
  }

  window.ZR.player = {
    getGroundHeightAt: getSharedGroundHeightAt,
    updatePlayer,
  };
})();

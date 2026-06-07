(() => {
  const { state } = window.ZR.gameState;
  const { buildMap } = window.ZR.map;
  const { elements } = window.ZR.ui;
  const { getThree } = window.ZR.utils;
  const THREE = getThree();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x151a20);
  scene.fog = new THREE.Fog(0x151a20, 20, 58);

  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
  camera.rotation.order = "YXZ";

  const renderer = new THREE.WebGLRenderer({
    canvas: elements.canvas,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const raycaster = new THREE.Raycaster();
  raycaster.far = 60;

  function initScene() {
    const ambient = new THREE.HemisphereLight(0xdcecff, 0x28301f, 1.35);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.45);
    sun.position.set(9, 16, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(52, 52),
      new THREE.MeshStandardMaterial({ color: 0x3a4037, roughness: 0.9 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    buildMap(scene);
  }

  function updateCamera() {
    camera.position.copy(state.playerPosition);
    camera.rotation.set(state.pitch, state.yaw, 0);
  }

  function resizeRenderer() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.ZR.scene = {
    camera,
    initScene,
    raycaster,
    renderer,
    resizeRenderer,
    scene,
    updateCamera,
  };
})();

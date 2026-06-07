const scripts = [
  "./src/config.js",
  "./src/multiplayer/protocol.js",
  "./src/utils.js",
  "./src/gameState.js",
  "./src/ui.js",
  "./src/collision.js",
  "./src/map.js",
  "./src/scene.js",
  "./src/pathfinding.js",
  "./src/player.js",
  "./src/zombies.js",
  "./src/economy.js",
  "./src/weapons.js",
  "./src/powerUps.js",
  "./src/interactables.js",
  "./src/gameMode.js",
  "./src/actions.js",
  "./src/multiplayer/localSession.js",
  "./src/multiplayer/socketClient.js",
  "./src/input.js",
  "./src/main.js",
];

function loadNextScript(index = 0) {
  if (index >= scripts.length) return;

  const script = document.createElement("script");
  script.src = scripts[index];
  script.onload = () => loadNextScript(index + 1);
  document.head.appendChild(script);
}

loadNextScript();

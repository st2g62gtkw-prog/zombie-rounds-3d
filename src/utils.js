(() => {
  window.ZR = window.ZR || {};

  function getThree() {
    const THREE = window.THREE;

    if (!THREE) {
      throw new Error("Three.js no se cargo correctamente.");
    }

    return THREE;
  }

  function getHorizontalDistance(first, second) {
    const deltaX = first.x - second.x;
    const deltaZ = first.z - second.z;
    return Math.hypot(deltaX, deltaZ);
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function shuffleArray(items) {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const otherIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[otherIndex]] = [shuffled[otherIndex], shuffled[index]];
    }

    return shuffled;
  }

  window.ZR.utils = {
    getHorizontalDistance,
    getThree,
    randomBetween,
    shuffleArray,
  };
})();

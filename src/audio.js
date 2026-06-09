(() => {
  window.ZR = window.ZR || {};

  let audioContext = null;
  let lastPlayedAt = {};

  const sounds = {
    shoot: { frequency: 150, duration: 0.035, type: "square", volume: 0.025 },
    hit: { frequency: 520, duration: 0.045, type: "triangle", volume: 0.035 },
    headshot: { frequency: 820, duration: 0.07, type: "triangle", volume: 0.045 },
    boost: { frequency: 680, duration: 0.12, type: "sine", volume: 0.045 },
    damage: { frequency: 110, duration: 0.08, type: "sawtooth", volume: 0.035 },
    reload: { frequency: 260, duration: 0.055, type: "sine", volume: 0.025 },
    round: { frequency: 420, duration: 0.13, type: "triangle", volume: 0.035 },
  };

  function play(name) {
    const settings = sounds[name];
    if (!settings) return;

    const now = performance.now();
    if (now - (lastPlayedAt[name] || 0) < 35) return;
    lastPlayedAt[name] = now;

    const context = getAudioContext();
    if (!context) return;

    try {
      if (context.state === "suspended") {
        context.resume?.().catch(() => {});
      }

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime;

      oscillator.type = settings.type;
      oscillator.frequency.setValueAtTime(settings.frequency, start);
      gain.gain.setValueAtTime(settings.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + settings.duration);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + settings.duration);
    } catch {
      // El juego debe seguir aunque el navegador bloquee audio.
    }
  }

  function getAudioContext() {
    if (audioContext) return audioContext;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    try {
      audioContext = new AudioContextClass();
      return audioContext;
    } catch {
      return null;
    }
  }

  function resetAudioThrottle() {
    lastPlayedAt = {};
  }

  window.ZR.audio = {
    play,
    resetAudioThrottle,
  };
})();

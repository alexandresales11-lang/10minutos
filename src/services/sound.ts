// Pure Web Audio API synthesized resonant focus chimes and tactile feedback
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const SoundService = {
  // Resonant singing-bowl/bell focus chime for completion
  playCompletionChime() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Fundamental harmonic frequencies for a clear, deep, dignified gong/chime
      const freqs = [528, 1056, 1584]; // 528 Hz transformation frequency + harmonics
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const initialGain = idx === 0 ? 0.4 : 0.15 / (idx + 1);
        gain.gain.setValueAtTime(initialGain, now);
        // Long decay
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 3.2);
      });

      // Tactile vibration on mobile devices
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([150, 80, 250, 80, 400]);
        } catch {
          // ignore
        }
      }
    } catch (e) {
      console.warn('Audio not allowed yet or not supported:', e);
    }
  },

  // Subtle click when starting or pausing
  playSoftClick() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore
    }
  }
};

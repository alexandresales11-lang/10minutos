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
  },

  // Celebratory fanfare chime when a 15-minute leisure ticket is earned!
  playTicketEarned() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Uplifting arpeggio sequence: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.5)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const noteTime = now + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.25, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.9);
      });

      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([100, 50, 100, 50, 200]);
        } catch {}
      }
    } catch (e) {
      console.warn('Audio error:', e);
    }
  },

  // Soft warning chime when 1 minute remains in leisure time
  playTimerWarning() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      [880, 784].forEach((freq, idx) => {
        const time = now + idx * 0.2;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.35);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  },

  // Firm notification when the 15 minutes of leisure expire
  playFreeTimeOverAlert() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Double descending chime to signal discipline
      [660, 440, 330].forEach((freq, idx) => {
        const time = now + idx * 0.25;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.5);
      });

      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([300, 100, 300, 100, 500]);
        } catch {}
      }
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }
};

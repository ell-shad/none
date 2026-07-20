// Web Audio API Synthesizer for typewriter sound effects.
// All sounds are synthesized on-the-fly to guarantee offline support and fast loading.

let audioCtx: AudioContext | null = null;
let isMuted = false;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleMute() {
  isMuted = !isMuted;
  return isMuted;
}

export function getMuted() {
  return isMuted;
}

/**
 * Play a vintage typewriter key "clack" sound.
 * Consists of a transient high-frequency snap and a lower resonance decay.
 */
export function playClack(pitchShift = 1.0) {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Extremely soft high-pitched tick
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1400 * pitchShift, now);
    osc1.frequency.exponentialRampToValueAtTime(1000 * pitchShift, now + 0.012);

    // Very quiet gain
    gain1.gain.setValueAtTime(0.025, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.015);
  } catch (err) {
    console.debug('Audio playback blocked or unsupported', err);
  }
}

/**
 * Play a high-pitched metallic mechanical bell "ding".
 * Simulates the typewriter carriage reaching the right margin.
 */
export function playBell() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Bell sound uses two high sine waves (fundamental + overtone)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    // High clear bell frequency
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1800, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    // Overtone
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2850, now);
    gain2.gain.setValueAtTime(0.1, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    // Filter to sweeten
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    osc1.connect(gain1);
    gain1.connect(filter);

    osc2.connect(gain2);
    gain2.connect(filter);

    filter.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.5);

    osc2.start(now);
    osc2.stop(now + 0.3);
  } catch (err) {
    console.debug('Audio playBell error', err);
  }
}

/**
 * Play a typewriter mechanical carriage slide / ratchet slide sound.
 * For dropping or moving pieces.
 */
export function playCarriageReturn() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Zip rattle sound: short bursts of filtered square waves
    for (let i = 0; i < 4; i++) {
      const t = now + i * 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250 - i * 30, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.04);
    }
  } catch (err) {
    console.debug('Audio carriage slide error', err);
  }
}

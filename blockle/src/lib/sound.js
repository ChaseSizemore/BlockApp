// Sound effects via the Web Audio API. No external assets — tones are generated
// synthetically so the bundle stays tiny and there's no network round-trip.
//
// iOS Safari blocks AudioContext until a user gesture; getCtx() lazily creates
// (and resumes) on first call from inside a gesture handler.

let ctx = null;
let enabled = readEnabled();

function readEnabled() {
  try {
    // Default ON. "0" means user explicitly muted.
    return localStorage.getItem('cobble:v1:sound') !== '0';
  } catch {
    return true;
  }
}

function getCtx() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function isSoundEnabled() {
  return enabled;
}

export function setSoundEnabled(value) {
  enabled = !!value;
  try {
    localStorage.setItem('cobble:v1:sound', value ? '1' : '0');
  } catch {}
}

// Wooden "clack" when a piece commits to a board cell.
// Built from a short noise burst (the impact transient) through a narrow
// bandpass filter centered around the resonant frequency of small wood.
// ~50ms total — quiet, percussive, no synthetic pitch sweep.
export function playClick() {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const duration = 0.05;
  const sampleCount = Math.floor(c.sampleRate * duration);

  // Build a single-channel noise buffer with a fast cubic decay envelope
  // baked into the samples themselves — gives a sharp attack and quick fade.
  const buffer = c.createBuffer(1, sampleCount, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) {
    const decay = Math.pow(1 - i / sampleCount, 3);
    data[i] = (Math.random() * 2 - 1) * decay;
  }

  const source = c.createBufferSource();
  source.buffer = buffer;

  // Bandpass filter: high Q (narrow) centered around a "small wood" frequency.
  // ~480Hz gives a satisfying knock; higher would sound like plastic, lower like a kick drum.
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 480;
  filter.Q.value = 9;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.75, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  source.start(t);
}

// Soft 4-note arpeggio (C5 → E5 → G5 → C6, major triad + octave).
// Triangle wave so it reads as "celebratory" rather than "alarm."
export function playWin() {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const t0 = c.currentTime;
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const t = t0 + i * 0.11;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.36);
  });
}

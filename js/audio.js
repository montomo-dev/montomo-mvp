const MUTE_KEY = "montomo-audio-muted";
const hasDom = typeof window !== "undefined" && typeof localStorage !== "undefined";

let ctx = null;
let muted = hasDom && localStorage.getItem(MUTE_KEY) === "1";

function getContext() {
  if (!hasDom) return null;
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// ブラウザの自動再生制限に対応: 最初のユーザー操作でAudioContextを起こす
if (hasDom) {
  window.addEventListener("pointerdown", () => getContext(), { once: true });
  window.addEventListener("keydown", () => getContext(), { once: true });
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (hasDom) localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  return muted;
}

function tone({ freq, duration = 0.12, type = "square", gain = 0.18, delay = 0, slideTo = null }) {
  if (muted || !hasDom) return;
  const audioCtx = getContext();
  const start = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  amp.gain.setValueAtTime(0, start);
  amp.gain.linearRampToValueAtTime(gain, start + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp);
  amp.connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function sequence(notes) {
  notes.forEach((note) => tone(note));
}

export function sfxSelect() {
  tone({ freq: 520, duration: 0.05, type: "square", gain: 0.1 });
}

export function sfxConfirm() {
  tone({ freq: 660, duration: 0.08, type: "square", gain: 0.15 });
  tone({ freq: 880, duration: 0.1, type: "square", gain: 0.15, delay: 0.05 });
}

export function sfxCancel() {
  tone({ freq: 440, duration: 0.1, type: "triangle", gain: 0.14, slideTo: 220 });
}

export function sfxHit() {
  tone({ freq: 180, duration: 0.09, type: "sawtooth", gain: 0.2, slideTo: 60 });
}

export function sfxFaint() {
  tone({ freq: 300, duration: 0.35, type: "sawtooth", gain: 0.16, slideTo: 40 });
}

export function sfxLevelUp() {
  sequence([
    { freq: 523, duration: 0.1, type: "square", gain: 0.16 },
    { freq: 659, duration: 0.1, type: "square", gain: 0.16, delay: 0.09 },
    { freq: 784, duration: 0.16, type: "square", gain: 0.18, delay: 0.18 },
  ]);
}

export function sfxEvolve() {
  sequence([
    { freq: 392, duration: 0.12, type: "triangle", gain: 0.16 },
    { freq: 523, duration: 0.12, type: "triangle", gain: 0.17, delay: 0.11 },
    { freq: 659, duration: 0.12, type: "triangle", gain: 0.18, delay: 0.22 },
    { freq: 880, duration: 0.22, type: "triangle", gain: 0.2, delay: 0.33 },
  ]);
}

export function sfxCatchSuccess() {
  sequence([
    { freq: 660, duration: 0.09, type: "square", gain: 0.16 },
    { freq: 880, duration: 0.09, type: "square", gain: 0.16, delay: 0.08 },
    { freq: 1100, duration: 0.18, type: "square", gain: 0.18, delay: 0.16 },
  ]);
}

export function sfxCatchFail() {
  tone({ freq: 220, duration: 0.2, type: "triangle", gain: 0.15, slideTo: 140 });
}

export function sfxItemGet() {
  tone({ freq: 784, duration: 0.06, type: "square", gain: 0.14 });
  tone({ freq: 1046, duration: 0.1, type: "square", gain: 0.16, delay: 0.06 });
}

export function sfxSave() {
  tone({ freq: 440, duration: 0.06, type: "sine", gain: 0.12 });
  tone({ freq: 660, duration: 0.12, type: "sine", gain: 0.14, delay: 0.07 });
}

export function sfxBreed() {
  sequence([
    { freq: 440, duration: 0.1, type: "sine", gain: 0.14 },
    { freq: 550, duration: 0.1, type: "sine", gain: 0.14, delay: 0.09 },
    { freq: 660, duration: 0.1, type: "sine", gain: 0.14, delay: 0.18 },
    { freq: 880, duration: 0.2, type: "sine", gain: 0.16, delay: 0.27 },
  ]);
}

const WAVEFORMS = ["square", "triangle", "sawtooth"];

// 種族IDから決定論的に音の高さ・波形を作る「鳴き声」。同じ種族なら毎回同じ音になる
export function sfxCry(speciesId) {
  let hash = 0;
  for (let i = 0; i < speciesId.length; i++) {
    hash = (hash * 31 + speciesId.charCodeAt(i)) >>> 0;
  }
  const base = 260 + (hash % 420);
  const type = WAVEFORMS[hash % WAVEFORMS.length];
  const rising = (hash >> 3) % 2 === 0;
  tone({
    freq: base,
    duration: 0.14,
    type,
    gain: 0.15,
    slideTo: rising ? base * 1.4 : base * 0.7,
  });
}

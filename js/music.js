import { isMuted } from "./audio.js";

const hasAudio = typeof Audio !== "undefined";
const BGM_VOLUME = 0.45;

// SUNOで作った曲をここに追加していく。まだ用意していないキーはファイルが無いため
// 自動的に鳴らないだけで、エラーにはならない(playBgmのエラー処理で握りつぶす)。
const TRACKS = {
  title: "assets/bgm/title.mp3",
  battle: "assets/bgm/battle.mp3",
  boss: "assets/bgm/boss.mp3",
  victory: "assets/bgm/victory.mp3",
  ending: "assets/bgm/ending.mp3",
  field_forest: "assets/bgm/field_forest.mp3",
  field_reverse: "assets/bgm/field_reverse.mp3",
  field_sea: "assets/bgm/field_sea.mp3",
  field_snow: "assets/bgm/field_snow.mp3",
  field_desert: "assets/bgm/field_desert.mp3",
  field_factory: "assets/bgm/field_factory.mp3",
  field_castle: "assets/bgm/field_castle.mp3",
};

// 曲がまだ無いキーが再生されたとき、代わりに鳴らす曲(なければ無音のまま)
const FALLBACK = {
  boss: "battle",
  field_reverse: "field_forest",
  field_sea: "field_forest",
  field_snow: "field_forest",
  field_desert: "field_forest",
  field_factory: "field_forest",
  field_castle: "field_forest",
};

let current = null; // { key, audio }

function tryPlay(key, loop, resolvedKey = key) {
  const src = TRACKS[resolvedKey];
  if (!src) return;
  const audio = new Audio(src);
  audio.loop = loop;
  audio.volume = isMuted() ? 0 : BGM_VOLUME;
  audio.addEventListener("error", () => {
    if (current && current.audio === audio) current = null;
    const fallbackKey = FALLBACK[resolvedKey];
    if (fallbackKey && fallbackKey !== resolvedKey) tryPlay(key, loop, fallbackKey);
  });
  audio.play().catch(() => {});
  current = { key, audio };
}

// keyが既に再生中なら何もしない(進化演出などの毎フレームdraw()から呼んでも再スタートしない)
export function playBgm(key, { loop = true } = {}) {
  if (!hasAudio) return;
  if (current && current.key === key) return;
  stopBgm();
  tryPlay(key, loop);
}

export function stopBgm() {
  if (current) {
    current.audio.pause();
    current = null;
  }
}

export function setBgmMuted(muted) {
  if (current) current.audio.volume = muted ? 0 : BGM_VOLUME;
}

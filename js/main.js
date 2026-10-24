import { Input } from "./input.js";
import { createMonster, SPECIES, ensureUidAbove } from "./data/monsters.js";
import { START_STAGE_ID, STAGES } from "./data/stages.js";
import { FieldScene } from "./scenes/field.js";
import { TitleScene } from "./scenes/title.js";
import { saveGame, migrateMonster } from "./systems/save.js";
import { markCaught } from "./systems/dex.js";
import { toggleMute, isMuted } from "./audio.js";
import { clearStatus } from "./systems/status.js";
import { getStoredLang, setStoredLang } from "./i18n.js";
import { setBgmMuted } from "./music.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function setupTouchControls(input) {
  document.querySelectorAll("#touch-controls [data-action]").forEach((btn) => {
    const action = btn.dataset.action;
    const start = (e) => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      btn.classList.add("is-held");
      input.press(action, `pointer-${e.pointerId}`);
    };
    const end = (e) => {
      e.preventDefault();
      btn.classList.remove("is-held");
      input.release(action, `pointer-${e.pointerId}`);
    };
    btn.addEventListener("pointerdown", start);
    btn.addEventListener("pointerup", end);
    btn.addEventListener("pointercancel", end);
    btn.addEventListener("lostpointercapture", end);
  });
  document.querySelectorAll("#quick-actions [data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      input.press(btn.dataset.action);
      input.release(btn.dataset.action);
    });
  });
}

const sceneLabel = document.getElementById("scene-label");
const saveStatus = document.getElementById("save-status");
const motionButton = document.getElementById("motion-button");
const soundButton = document.getElementById("sound-button");
const fullscreenButton = document.getElementById("fullscreen-button");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let storedMotion = null;
try { storedMotion = localStorage.getItem("montomo-reduce-motion"); } catch {}

function updateSoundButton() {
  soundButton.textContent = isMuted() ? "♪ おと OFF" : "♪ おと ON";
  soundButton.setAttribute("aria-pressed", String(isMuted()));
}

function updateSceneChrome(scene) {
  const field = scene === game.field;
  sceneLabel.textContent = scene instanceof TitleScene ? "ぼうけんの はじまり" : field ? "なかまと ぼうけん中" : "ぼうけんの 手帳";
  document.querySelectorAll("#quick-actions [data-action]").forEach((btn) => {
    if (btn.dataset.action === "rename") {
      btn.hidden = !["PartyScene", "PokedexScene", "ShopScene"].includes(scene.constructor.name);
      btn.disabled = btn.hidden;
      return;
    }
    btn.disabled = btn.dataset.action !== "lang" && !field;
  });
}

// 状態異常(やけど・まひ・こおり)は戦闘限定の仕組みで治療手段がないため、
// 戦闘中にタブを閉じてセーブされた場合に備えて読み込み時に必ず解除する。
// あわせて旧セーブの不足フィールド(MP・装備)をmigrateMonsterで補う
function restoreMonster(monster) {
  clearStatus(monster);
  return migrateMonster(monster);
}

function buildParty(save) {
  if (save && Array.isArray(save.party)) {
    const restored = save.party.filter((m) => m && SPECIES[m.speciesId]).map(restoreMonster);
    if (restored.length > 0) return restored;
  }
  return [createMonster("mofuri", 3)];
}

function buildRanch(save) {
  if (save && Array.isArray(save.ranch)) {
    return save.ranch.filter((m) => m && SPECIES[m.speciesId]).map(restoreMonster);
  }
  return [];
}

function buildDex(save) {
  if (save && save.dex && Array.isArray(save.dex.seen) && Array.isArray(save.dex.caught)) {
    return { seen: [...save.dex.seen], caught: [...save.dex.caught] };
  }
  return { seen: [], caught: [] };
}

function buildItems(save) {
  if (save && save.items && typeof save.items === "object") {
    return { ...save.items };
  }
  return {};
}

function buildMoney(save) {
  return save && Number.isInteger(save.money) && save.money >= 0 ? save.money : 100;
}

const game = {
  canvas,
  ctx,
  input: new Input(),
  party: [],
  ranch: [],
  items: {},
  money: 0,
  scene: null,
  field: null,
  reduceMotion: storedMotion === null ? motionPreference.matches : storedMotion === "true",
  lang: getStoredLang(),
  toggleLang() {
    this.lang = setStoredLang(this.lang === "en" ? "ja" : "en");
    document.documentElement.lang = this.lang;
  },
  changeScene(scene) {
    this.input.reset();
    this.scene = scene;
    updateSceneChrome(scene);
  },
  save() {
    if (!this.field) return false;
    const ok = saveGame(this, this.currentSlot);
    saveStatus.textContent = ok ? "✓ ぼうけんを 記録しました" : "記録できませんでした。Sでもう一度";
    return ok;
  },
  startAdventure(save, slot = 0, playerName = "") {
    this.currentSlot = slot;
    this.playerName = playerName || (save && save.playerName) || "";
    this.flags = {
      bossDefeated: !!(save && save.flags && save.flags.bossDefeated),
      stageClearedFlags: (save && save.flags && save.flags.stageClearedFlags) || {},
      legendClaimed: !!(save && save.flags && save.flags.legendClaimed),
      warpPointsKnown: (save && save.flags && save.flags.warpPointsKnown) || {},
    };
    this.party = buildParty(save);
    this.ranch = buildRanch(save);
    this.dex = buildDex(save);
    this.items = buildItems(save);
    this.money = buildMoney(save);
    this.treasureState = (save && save.treasureState) || {};
    this.groundItemState = (save && save.groundItemState) || {};
    let maxUid = 0;
    for (const m of [...this.party, ...this.ranch]) {
      if (typeof m.uid === "number" && m.uid > maxUid) maxUid = m.uid;
      markCaught(this, m.speciesId);
    }
    ensureUidAbove(maxUid);
    const stageId =
      save && save.field && typeof save.field.stageId === "string" && STAGES[save.field.stageId]
        ? save.field.stageId
        : START_STAGE_ID;
    this.field = new FieldScene(this, stageId);
    if (save && save.field) {
      if (Number.isInteger(save.field.x) && Number.isInteger(save.field.y)) {
        this.field.player = { x: save.field.x, y: save.field.y };
      }
      if (typeof save.field.facing === "string") this.field.facing = save.field.facing;
    }
    this.changeScene(this.field);
    this.save();
  },
};

game.changeScene(new TitleScene(game));
window.__game = game;
setupTouchControls(game.input);
motionButton.setAttribute("aria-pressed", String(game.reduceMotion));
motionButton.addEventListener("click", () => {
  game.reduceMotion = !game.reduceMotion;
  storedMotion = String(game.reduceMotion);
  motionButton.setAttribute("aria-pressed", String(game.reduceMotion));
  try { localStorage.setItem("montomo-reduce-motion", String(game.reduceMotion)); } catch {}
});
motionPreference.addEventListener("change", (event) => {
  if (storedMotion !== null) return;
  game.reduceMotion = event.matches;
  motionButton.setAttribute("aria-pressed", String(game.reduceMotion));
});
soundButton.addEventListener("click", () => {
  setBgmMuted(toggleMute());
  updateSoundButton();
});
updateSoundButton();
fullscreenButton.hidden = !document.querySelector(".play-column").requestFullscreen;
fullscreenButton.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.querySelector(".play-column").requestFullscreen();
  } catch {
    saveStatus.textContent = "このブラウザでは全画面表示を使えません";
  }
});
canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  game.scene.handlePointer?.((event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.scene === game.field) game.save();
});

// フィールドに出ている間だけ、ページを閉じる直前に保存
window.addEventListener("beforeunload", () => {
  if (game.scene === game.field) game.save();
});

let last = 0;
function loop(t) {
  const dt = Math.min((t - last) / 1000, 0.05);
  last = t;
  if (game.input.wasPressed("mute")) { setBgmMuted(toggleMute()); updateSoundButton(); }
  if (game.input.wasPressed("lang")) game.toggleLang();
  game.scene.update(dt);
  game.scene.draw(ctx);
  game.input.endFrame();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

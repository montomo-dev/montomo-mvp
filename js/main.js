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
    const start = (e) => { e.preventDefault(); input.press(action); };
    const end = (e) => { e.preventDefault(); input.release(action); };
    btn.addEventListener("pointerdown", start);
    btn.addEventListener("pointerup", end);
    btn.addEventListener("pointercancel", end);
    btn.addEventListener("pointerleave", end);
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
  lang: getStoredLang(),
  toggleLang() {
    this.lang = setStoredLang(this.lang === "en" ? "ja" : "en");
  },
  changeScene(scene) {
    this.scene = scene;
  },
  save() {
    if (!this.field) return false;
    return saveGame(this, this.currentSlot);
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

// フィールドに出ている間だけ、ページを閉じる直前に保存
window.addEventListener("beforeunload", () => game.save());

let last = 0;
function loop(t) {
  const dt = Math.min((t - last) / 1000, 0.05);
  last = t;
  if (game.input.wasPressed("mute")) setBgmMuted(toggleMute());
  if (game.input.wasPressed("lang")) game.toggleLang();
  game.scene.update(dt);
  game.scene.draw(ctx);
  if (isMuted()) {
    ctx.fillStyle = "#f0ead8";
    ctx.font = '13px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.textAlign = "right";
    ctx.fillText(game.lang === "en" ? "♪ Muted (M)" : "♪ ミュート中 (M)", 630, 20);
    ctx.textAlign = "left";
  }
  ctx.fillStyle = "#f0ead8";
  ctx.font = '13px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
  ctx.textAlign = "right";
  ctx.fillText(game.lang === "en" ? "EN (L)" : "日本語 (L)", 630, 476);
  ctx.textAlign = "left";
  game.input.endFrame();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

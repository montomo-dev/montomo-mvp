import { Input } from "./input.js";
import { createMonster, SPECIES, ensureUidAbove } from "./data/monsters.js";
import { START_STAGE_ID, STAGES } from "./data/stages.js";
import { FieldScene } from "./scenes/field.js";
import { TitleScene } from "./scenes/title.js";
import { saveGame } from "./systems/save.js";
import { markCaught } from "./systems/dex.js";

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

function buildParty(save) {
  if (save && Array.isArray(save.party)) {
    const restored = save.party.filter((m) => m && SPECIES[m.speciesId]);
    if (restored.length > 0) return restored;
  }
  return [createMonster("mofuri", 3)];
}

function buildRanch(save) {
  if (save && Array.isArray(save.ranch)) {
    return save.ranch.filter((m) => m && SPECIES[m.speciesId]);
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
  changeScene(scene) {
    this.scene = scene;
  },
  save() {
    if (!this.field) return false;
    return saveGame(this);
  },
  startAdventure(save) {
    this.flags = { bossDefeated: !!(save && save.flags && save.flags.bossDefeated) };
    this.party = buildParty(save);
    this.ranch = buildRanch(save);
    this.dex = buildDex(save);
    this.items = buildItems(save);
    this.money = buildMoney(save);
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
  game.scene.update(dt);
  game.scene.draw(ctx);
  game.input.endFrame();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

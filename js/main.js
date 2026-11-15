import { Input, bindTouchControls } from "./input.js";
import { createRuntime } from "./runtime.js";
import { createMonster, SPECIES, ensureUidAbove } from "./data/monsters.js";
import { START_STAGE_ID, STAGES } from "./data/stages.js";
import { FieldScene } from "./scenes/field.js";
import { TitleScene } from "./scenes/title.js";
import { BattleScene } from "./scenes/battle.js";
import { saveGame, migrateMonster } from "./systems/save.js";
import { markCaught } from "./systems/dex.js";
import { toggleMute, isMuted } from "./audio.js";
import { clearStatus } from "./systems/status.js";
import { getStoredLang, setStoredLang } from "./i18n.js";
import { setBgmMuted, setBgmSuspended } from "./music.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const runtimeStatus = document.getElementById("runtime-status");
const motionPreference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
ctx.imageSmoothingEnabled = false;
const DEV = new URLSearchParams(window.location.search).get("dev") === "1";

function setupTouchControls(input) {
  bindTouchControls(document.getElementById("touch-controls"), input);
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
  reducedMotion: Boolean(motionPreference?.matches),
  sceneFade: 0,
  toggleLang() {
    this.lang = setStoredLang(this.lang === "en" ? "ja" : "en");
  },
  changeScene(scene) {
    this.scene = scene;
    this.sceneFade = this.reducedMotion ? 0 : 0.2;
  },
  save() {
    if (!this.field) return false;
    if (this.currentSlot == null) return true;
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
    this.stats = {
      wins: 0, catches: 0, breeds: 0, steps: 0,
      shinyCatches: 0, questClears: 0,
      ...((save && save.stats) || {}),
    };
    this.achievements = { ...((save && save.achievements) || {}) };
    this.daily = (save && save.daily) || null;
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
motionPreference?.addEventListener?.("change", (event) => {
  game.reducedMotion = event.matches;
  if (event.matches) game.sceneFade = 0;
});

game.changeScene(new TitleScene(game));
window.__game = game;
setupTouchControls(game.input);

function debugSnapshot() {
  const scene = game.scene;
  const snapshot = {
    scene: scene?.constructor?.name || "Unknown",
    lang: game.lang,
    muted: isMuted(),
    persisted: game.currentSlot != null,
    partyCount: game.party.length,
  };
  if (game.field) {
    snapshot.field = {
      stageId: game.field.stageId,
      x: game.field.player?.x,
      y: game.field.player?.y,
      facing: game.field.facing,
      firstBushSeen: !!game.field.firstBushSeen,
    };
  }
  if (scene?.enemy && scene?.ally) {
    snapshot.battle = {
      phase: scene.phase,
      cursor: scene.cursor,
      allyHp: scene.ally.hp,
      enemyHp: scene.enemy.hp,
      enemyMaxHp: scene.enemy.maxHp,
      recruitChance: Math.round(scene.previewRecruitChance() * 100),
    };
  }
  return snapshot;
}

if (DEV) {
  window.__dbg = debugSnapshot;
  window.__cheat = {
    // 保存スロットを使わない検証用の冒険。ユーザーのセーブは上書きしない。
    startFresh() {
      game.startAdventure(null, null, game.lang === "en" ? "Tester" : "テスター");
      return debugSnapshot();
    },
    placeNearBush() {
      if (!game.field) return debugSnapshot();
      const bush = game.field.nearestBushTile();
      if (!bush) return debugSnapshot();
      const candidates = [
        { x: bush.x - 1, y: bush.y }, { x: bush.x + 1, y: bush.y },
        { x: bush.x, y: bush.y - 1 }, { x: bush.x, y: bush.y + 1 },
      ];
      const spot = candidates.find((p) => game.field.tileAt(p.x, p.y) === 0) || candidates[0];
      game.field.player = spot;
      game.changeScene(game.field);
      return { ...debugSnapshot(), bush };
    },
    startBattle(speciesId = "dogura", stageId = null) {
      if (!game.field) this.startFresh();
      if (stageId) game.field.setStage(stageId, "start", false);
      const enemy = createMonster(SPECIES[speciesId] ? speciesId : "dogura", 3);
      game.changeScene(new BattleScene(game, enemy, { stageId: game.field.stageId }));
      return debugSnapshot();
    },
    command() {
      if (game.scene instanceof BattleScene) {
        game.scene.queue = [];
        game.scene.after = "command";
        game.scene.enterNext();
      }
      return debugSnapshot();
    },
    weakenEnemy() {
      if (game.scene instanceof BattleScene) {
        const hp = Math.max(1, Math.floor(game.scene.enemy.maxHp * 0.18));
        game.scene.totalDamageDealt = Math.max(0, game.scene.enemy.maxHp - hp);
        game.scene.enemy.hp = hp;
        game.scene.shownHp.enemy = hp;
        game.scene.cursor = 2;
      }
      return debugSnapshot();
    },
    returnField() {
      if (game.field) game.changeScene(game.field);
      return debugSnapshot();
    },
    title() {
      game.changeScene(new TitleScene(game));
      return debugSnapshot();
    },
  };
  const devTools = document.getElementById("dev-tools");
  if (devTools) {
    devTools.hidden = false;
    devTools.querySelectorAll("[data-dev-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.devAction;
        window.__cheat[action]?.();
      });
    });
  }
}

// フィールドに出ている間だけ、ページを閉じる直前に保存
window.addEventListener("beforeunload", () => game.save());

const fpsState = { value: 0, frames: 0, sampledAt: performance.now() };


function drawDevOverlay() {
  const sceneName = game.scene?.constructor?.name?.replace("Scene", "") || "?";
  ctx.save();
  ctx.fillStyle = "rgba(23, 26, 49, 0.78)";
  ctx.beginPath();
  ctx.roundRect(8, 446, 146, 26, 8);
  ctx.fill();
  ctx.fillStyle = "#fff9e8";
  ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = "left";
  ctx.fillText(`DEV · ${sceneName} · ${fpsState.value}fps`, 16, 463);
  ctx.restore();
}

function advanceFrame(dt) {
  if (game.input.wasPressed("mute")) setBgmMuted(toggleMute());
  if (game.input.wasPressed("lang")) game.toggleLang();
  game.scene.update(dt);
  game.sceneFade = Math.max(0, game.sceneFade - dt);
  game.input.endFrame();
}

function drawFrame(now, paused) {
  ctx.imageSmoothingEnabled = false;
  game.scene.draw(ctx);
  if (game.sceneFade > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(22, 57, 47, ${game.sceneFade * 1.8})`;
    ctx.fillRect(0, 0, 640, 480);
    ctx.restore();
  }
  if (isMuted()) {
    ctx.fillStyle = "#f0ead8";
    ctx.font = '13px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.textAlign = "right";
    ctx.fillText(game.lang === "en" ? "♪ Muted (M)" : "♪ ミュート中 (M)", 630, 20);
    ctx.textAlign = "left";
  }
  if (!(game.scene instanceof BattleScene)) {
    ctx.fillStyle = "#f0ead8";
    ctx.font = '13px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.textAlign = "right";
    ctx.fillText(game.lang === "en" ? "EN (L)" : "日本語 (L)", 630, 476);
    ctx.textAlign = "left";
  }
  if (runtimeStatus) {
    const text = game.lang === "en"
      ? `English · ${isMuted() ? "Muted" : "Sound on"}`
      : `日本語・${isMuted() ? "音なし" : "音あり"}`;
    if (runtimeStatus.textContent !== text) runtimeStatus.textContent = text;
  }
  if (DEV) {
    const snapshotText = JSON.stringify(debugSnapshot());
    document.documentElement.dataset.devSnapshot = snapshotText;
    const devState = document.getElementById("dev-state");
    if (devState && devState.textContent !== snapshotText) devState.textContent = snapshotText;
    fpsState.frames += 1;
    if (now - fpsState.sampledAt >= 500) {
      fpsState.value = Math.round((fpsState.frames * 1000) / (now - fpsState.sampledAt));
      fpsState.frames = 0;
      fpsState.sampledAt = now;
    }
    drawDevOverlay();
  }
  if (paused) {
    ctx.fillStyle = "rgba(22, 57, 47, 0.6)";
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = "#f7f6dc";
    ctx.textAlign = "center";
    ctx.font = 'bold 26px "Hiragino Maru Gothic ProN", sans-serif';
    ctx.fillText(game.lang === "en" ? "Paused" : "一時停止", 320, 234);
    ctx.font = '15px "Hiragino Maru Gothic ProN", sans-serif';
    ctx.fillText(game.lang === "en" ? "Return to this window or press Resume." : "画面へ戻るか、再開ボタンを押してください。", 320, 267);
    ctx.textAlign = "left";
  }
}

const runtime = createRuntime({
  update: advanceFrame,
  draw: drawFrame,
  onPause(paused) {
    game.input.clear();
    setBgmSuspended(paused);
  },
});
const pauseButton = document.getElementById("pause-game");
pauseButton?.addEventListener("click", () => {
  const paused = pauseButton.getAttribute("aria-pressed") !== "true";
  pauseButton.setAttribute("aria-pressed", String(paused));
  pauseButton.textContent = paused ? "冒険を再開" : "一時停止";
  runtime.setPaused(paused);
});
canvas.addEventListener("pointerup", (event) => {
  if (!(game.scene instanceof TitleScene) || game.scene.phase !== "slots" || game.scene.renamingSlot !== null) return;
  const box = canvas.getBoundingClientRect();
  const x = (event.clientX - box.left) * 640 / box.width;
  const y = (event.clientY - box.top) * 480 / box.height;
  if (x < 76 || x > 564) return;
  const slot = Math.floor((y - 292) / 53);
  if (slot < 0 || slot >= 3 || (y - 292) % 53 > 44) return;
  game.scene.cursor = slot;
  game.scene.chooseSlot();
});

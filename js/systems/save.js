import { maxMpFor } from "./growth.js";

export const SAVE_SLOT_COUNT = 3;

// MP・装備の導入前に作られた旧セーブのなかまへ不足フィールドを補う。
// mpが無いままだと「MPが たりない！」が常に出てスキルが永久に使えなくなる
export function migrateMonster(monster) {
  if (typeof monster.maxMp !== "number") monster.maxMp = maxMpFor(monster.level);
  if (typeof monster.mp !== "number") monster.mp = monster.maxMp;
  if (monster.equipped === undefined) monster.equipped = null;
  return monster;
}

// スロット制になる前の旧セーブキー。スロット0にのみ、一度だけ自動移行する
const LEGACY_SAVE_KEY = "montomo-save-v1";

function saveKey(slot) {
  return `montomo-save-v1-slot${slot}`;
}

// スロット0を最初に読み書きする際、旧キーにデータが残っていれば
// スロット0として引き継ぐ(そうしないと更新後にセーブが消えたように見えてしまう)
function migrateLegacySaveIfNeeded() {
  try {
    const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
    if (!legacy) return;
    if (localStorage.getItem(saveKey(0)) === null) {
      localStorage.setItem(saveKey(0), legacy);
    }
    localStorage.removeItem(LEGACY_SAVE_KEY);
  } catch (e) {
    console.warn("旧セーブデータの移行に失敗しました", e);
  }
}

export function saveGame(game, slot = 0) {
  try {
    const data = {
      v: 1,
      savedAt: Date.now(),
      playerName: game.playerName || "",
      party: game.party,
      ranch: game.ranch || [],
      dex: game.dex || { seen: [], caught: [] },
      items: game.items || {},
      money: Number.isInteger(game.money) ? game.money : 0,
      field: game.field
        ? {
            stageId: game.field.stageId,
            x: game.field.player.x,
            y: game.field.player.y,
            facing: game.field.facing,
          }
        : null,
      flags: game.flags || {},
      treasureState: game.treasureState || {},
      groundItemState: game.groundItemState || {},
    };
    localStorage.setItem(saveKey(slot), JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn("セーブに失敗しました", e);
    return false;
  }
}

export function loadSave(slot = 0) {
  try {
    if (slot === 0) migrateLegacySaveIfNeeded();
    const raw = localStorage.getItem(saveKey(slot));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("セーブデータの読み込みに失敗しました", e);
    return null;
  }
}

export function hasSave(slot = 0) {
  try {
    if (slot === 0) migrateLegacySaveIfNeeded();
    return localStorage.getItem(saveKey(slot)) !== null;
  } catch (e) {
    return false;
  }
}

export function clearSave(slot = 0) {
  try {
    localStorage.removeItem(saveKey(slot));
    return true;
  } catch (e) {
    return false;
  }
}

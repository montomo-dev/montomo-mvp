export const SAVE_SLOT_COUNT = 3;

function saveKey(slot) {
  return `montomo-save-v1-slot${slot}`;
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

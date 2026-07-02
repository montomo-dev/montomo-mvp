const SAVE_KEY = "montomo-save-v1";

export function saveGame(game) {
  try {
    const data = {
      v: 1,
      savedAt: Date.now(),
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
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn("セーブに失敗しました", e);
    return false;
  }
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("セーブデータの読み込みに失敗しました", e);
    return null;
  }
}

export function hasSave() {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch (e) {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch (e) {
    return false;
  }
}

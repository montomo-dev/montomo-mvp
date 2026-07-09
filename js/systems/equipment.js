import { ITEMS } from "../data/items.js";

export function effectiveDef(monster) {
  const item = monster.equipped ? ITEMS[monster.equipped] : null;
  return monster.def + (item?.defBonus || 0);
}

export function equipItem(game, monster, itemId) {
  if ((game.items[itemId] || 0) <= 0) return false;
  unequipItem(game, monster);
  game.items[itemId] -= 1;
  monster.equipped = itemId;
  return true;
}

export function unequipItem(game, monster) {
  if (!monster.equipped) return;
  game.items[monster.equipped] = (game.items[monster.equipped] || 0) + 1;
  monster.equipped = null;
}

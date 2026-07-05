import { addToParty } from "./party.js";
import { markCaught } from "./dex.js";

export const LEGEND_REQUIREMENT = ["mofuri", "dogura", "hibachi", "fuwarisu", "pyokotan", "pachikoro"];
export const LEGEND_REWARD_ID = "kazaribi";

export function legendProgress(game) {
  const caught = new Set(game.dex?.caught || []);
  return LEGEND_REQUIREMENT.filter((id) => caught.has(id)).length;
}

export function hasLegendReward(game) {
  return !!game.flags?.legendClaimed;
}

export function canClaimLegend(game) {
  return !hasLegendReward(game) && legendProgress(game) >= LEGEND_REQUIREMENT.length;
}

export function grantLegendReward(game, createMonster) {
  if (!canClaimLegend(game)) return null;
  const monster = createMonster(LEGEND_REWARD_ID, 1);
  monster.legend = true;
  const added = addToParty(game.party, monster);
  if (!added) {
    game.ranch = game.ranch || [];
    game.ranch.push(monster);
  }
  markCaught(game, LEGEND_REWARD_ID);
  game.flags = { ...(game.flags || {}), legendClaimed: true };
  if (game.save) game.save();
  return monster;
}

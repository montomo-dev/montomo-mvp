import { STAGES, WORLD_TRANSITIONS, TILE_TYPES, parseTileChar } from "../data/stages.js";

// Hints are derived from existing progress, so older saves need no new quest state.
export function journeyGoal(game, stage) {
  const en = game.lang === "en";
  const goal = (id, ja, english, detailJa, detailEn) => ({
    id, title: en ? english : ja, detail: en ? detailEn : detailJa,
  });
  const party = game.party || [];
  const cleared = game.flags?.stageClearedFlags || {};
  const hasTile = (type) => stage.layout.some((row) => [...row].some((c) => parseTileChar(c) === type));
  const tired = party.some((m) => m.maxHp > 0 && m.hp / m.maxHp <= 0.3);
  if (tired && (hasTile(TILE_TYPES.SPRING) || hasTile(TILE_TYPES.INN) || stage.townStage)) {
    return goal("rest", "まずは、なかまを回復しよう", "Give your friends a rest",
      hasTile(TILE_TYPES.INN) ? "やどやに入ると HP・MP が全回復。" : "いずみや街のやどやで HP・MP を回復。",
      hasTile(TILE_TYPES.INN) ? "Enter the inn to restore HP and MP." : "Recover HP and MP at a spring or a town inn.");
  }
  if (stage.townExitStage) {
    return goal("town", "街で、次の冒険のしたく", "Prepare for the next adventure",
      "やどや・どうぐや・まきばへ。道しるべから外に戻れるよ。",
      "Rest, shop, or visit the ranch. The sign leads back outside.");
  }
  if (stage.id === "stage1" && party.length + (game.ranch || []).length < 2) {
    return goal("first-friend", "くさむらで、新しいなかまに出会おう", "Meet a new friend in the grass",
      "バトルで HP を減らしたら「なかまにする」を試そう。",
      "Lower a wild monster's HP, then try Recruit.");
  }
  if (hasTile(TILE_TYPES.BOSS) && !cleared[stage.id]) {
    return goal("guardian", "このエリアのヌシに会いにいこう", "Meet this area's guardian",
      `赤い門が目印。ヌシは Lv.${stage.bossLevel || 12}。回復して挑もう。`,
      `Look for the red gate. Guardian Lv.${stage.bossLevel || 12}; heal first.`);
  }
  const nextId = stage.nextStage || (cleared[stage.id] && WORLD_TRANSITIONS[stage.id]);
  if (nextId && STAGES[nextId]) {
    const nextName = en ? STAGES[nextId].nameEn : STAGES[nextId].name;
    return goal("explore", `つぎは、${nextName}へ`, `Next stop: ${nextName}`,
      "道しるべをたどろう。寄り道や育成も、きみのペースで。",
      "Follow the signposts. Explore and train at your own pace.");
  }
  return goal("explore", "なかまと、まだ見ぬ出会いを探そう", "Keep exploring with your friends",
    "図鑑を集めたり、街のまきばでなかまを育てよう。",
    "Discover more monsters and raise your friends at the ranch.");
}

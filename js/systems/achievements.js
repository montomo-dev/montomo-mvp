import { tr } from "../i18n.js";

export const ACHIEVEMENTS = [
  { id: "catch10", ja: "ずかんの なかまを 10しゅ あつめる", en: "Catch 10 species", reward: 200, check: (g) => (g.dex?.caught || []).length >= 10 },
  { id: "catch30", ja: "ずかんの なかまを 30しゅ あつめる", en: "Catch 30 species", reward: 500, check: (g) => (g.dex?.caught || []).length >= 30 },
  { id: "catch60", ja: "ずかんの なかまを 60しゅ あつめる", en: "Catch 60 species", reward: 1000, check: (g) => (g.dex?.caught || []).length >= 60 },
  { id: "seen60", ja: "モンスターを 60しゅ みつける", en: "See 60 species", reward: 300, check: (g) => (g.dex?.seen || []).length >= 60 },
  { id: "wins30", ja: "バトルで 30かい かつ", en: "Win 30 battles", reward: 300, check: (g) => (g.stats?.wins || 0) >= 30 },
  { id: "wins100", ja: "バトルで 100かい かつ", en: "Win 100 battles", reward: 800, check: (g) => (g.stats?.wins || 0) >= 100 },
  { id: "breeds5", ja: "はいごうを 5かい する", en: "Breed 5 times", reward: 400, check: (g) => (g.stats?.breeds || 0) >= 5 },
  { id: "steps1000", ja: "1000ほ あるく", en: "Walk 1000 steps", reward: 300, check: (g) => (g.stats?.steps || 0) >= 1000 },
  { id: "money5000", ja: "おかねを 5000えん もつ", en: "Hold 5000 money", reward: 500, check: (g) => (g.money || 0) >= 5000 },
  { id: "level50", ja: "なかまを Lv.50 に そだてる", en: "Raise a friend to Lv.50", reward: 500, check: (g) => [...(g.party || []), ...(g.ranch || [])].some((m) => m.level >= 50) },
  { id: "shiny1", ja: "いろちがいを なかまにする", en: "Recruit a shiny monster", reward: 800, check: (g) => (g.stats?.shinyCatches || 0) >= 1 },
  { id: "legend", ja: "レジェンドほうしゅうを うけとる", en: "Claim the Legend reward", reward: 500, check: (g) => !!g.flags?.legendClaimed },
  { id: "quest10", ja: "クエストを 10かい たっせいする", en: "Clear 10 daily quests", reward: 400, check: (g) => (g.stats?.questClears || 0) >= 10 },
];

export function achievementName(game, a) {
  return tr(game, a.ja, a.en);
}

export function achievedCount(game) {
  const flags = game.achievements || {};
  return ACHIEVEMENTS.filter((a) => flags[a.id]).length;
}

export function checkAchievements(game) {
  if (!game.achievements) game.achievements = {};
  const unlocked = [];
  for (const a of ACHIEVEMENTS) {
    if (game.achievements[a.id] || !a.check(game)) continue;
    game.achievements[a.id] = true;
    game.money = (game.money || 0) + a.reward;
    unlocked.push(a);
  }
  return unlocked;
}

export function achievementMessages(game, unlocked) {
  return unlocked.map((a) =>
    tr(game, `じっせき かいきん！「${a.ja}」 ほうび ${a.reward}えん！`, `Achievement unlocked! "${a.en}" Reward: ${a.reward} money!`)
  );
}

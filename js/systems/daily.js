import { ITEMS } from "../data/items.js";
import { tr } from "../i18n.js";

export const QUEST_POOL = [
  { id: "win3", type: "win", target: 3, ja: "バトルで 3かい かつ", en: "Win 3 battles", reward: 150 },
  { id: "win5", type: "win", target: 5, ja: "バトルで 5かい かつ", en: "Win 5 battles", reward: 250 },
  { id: "catch1", type: "catch", target: 1, ja: "モンスターを 1たい なかまにする", en: "Recruit 1 monster", reward: 200 },
  { id: "walk80", type: "walk", target: 80, ja: "80ほ あるく", en: "Walk 80 steps", reward: 120 },
  { id: "item2", type: "item", target: 2, ja: "バトルで どうぐを 2かい つかう", en: "Use items 2 times in battle", reward: 150 },
  { id: "breed1", type: "breed", target: 1, ja: "はいごうを 1かい する", en: "Breed once", reward: 250 },
];

export const ALL_DONE_BONUS = { money: 300, itemId: "premiumBait" };

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayKey() {
  return dateKey(new Date());
}

// 同じ日に何度開いても同じクエストになるよう、日付文字列から決定論的に選ぶ
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rollQuests(day) {
  let h = hashString(day);
  const pool = [...QUEST_POOL];
  const picked = [];
  while (picked.length < 3 && pool.length > 0) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    picked.push(pool.splice(h % pool.length, 1)[0].id);
  }
  return picked;
}

export function questById(id) {
  return QUEST_POOL.find((q) => q.id === id);
}

export function ensureDaily(game) {
  const today = todayKey();
  if (game.daily && game.daily.date === today) return false;
  game.daily = {
    date: today,
    quests: rollQuests(today),
    progress: {},
    done: {},
    allDoneRewarded: false,
  };
  return true;
}

export function addQuestProgress(game, type, amount = 1) {
  if (!game.daily) return [];
  const completed = [];
  for (const id of game.daily.quests) {
    const quest = questById(id);
    if (!quest || quest.type !== type || game.daily.done[id]) continue;
    const next = Math.min(quest.target, (game.daily.progress[id] || 0) + amount);
    game.daily.progress[id] = next;
    if (next >= quest.target) {
      game.daily.done[id] = true;
      game.money = (game.money || 0) + quest.reward;
      if (game.stats) game.stats.questClears = (game.stats.questClears || 0) + 1;
      completed.push(quest);
    }
  }
  if (
    completed.length > 0 &&
    !game.daily.allDoneRewarded &&
    game.daily.quests.every((id) => game.daily.done[id])
  ) {
    game.daily.allDoneRewarded = true;
    game.money += ALL_DONE_BONUS.money;
    game.items[ALL_DONE_BONUS.itemId] = (game.items[ALL_DONE_BONUS.itemId] || 0) + 1;
    completed.push({ allDone: true, ...ALL_DONE_BONUS });
  }
  return completed;
}

export function questClearMessages(game, completed) {
  return completed.map((q) =>
    q.allDone
      ? tr(
          game,
          `きょうの クエスト ぜんぶ たっせい！ ボーナスで ${q.money}えんと ${ITEMS[q.itemId].name}を もらった！`,
          `All daily quests complete! Bonus: ${q.money} money and ${ITEMS[q.itemId].nameEn}!`
        )
      : tr(game, `クエストたっせい！「${q.ja}」 ほうび ${q.reward}えん！`, `Quest complete! "${q.en}" Reward: ${q.reward} money!`)
  );
}

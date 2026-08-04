import { COURSES } from "../data/routine.js";

// 朝のしたくの記録は、セーブスロットごとではなく端末にひとつだけ持つ。
// (ミュート設定や言語と同じ扱い)
// スロットを分けて遊んでいても「その日の朝のしたくは1回」にしたいため。
const ROUTINE_KEY = "montomo-routine-v1";

const hasStorage = typeof localStorage !== "undefined";

// 日付の変わり目を午前4時にする。
// 深夜2〜3時に起きている日でも「まだ前の日」として扱われ、
// 日付をまたいだだけで連続日数が途切れる、という理不尽が起きないようにする。
export const DAY_BOUNDARY_HOUR = 4;

export function routineDayKey(date = new Date()) {
  const shifted = new Date(date.getTime());
  shifted.setHours(shifted.getHours() - DAY_BOUNDARY_HOUR);
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, "0");
  const d = String(shifted.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function previousDayKey(dayKey) {
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  const py = date.getFullYear();
  const pm = String(date.getMonth() + 1).padStart(2, "0");
  const pd = String(date.getDate()).padStart(2, "0");
  return `${py}-${pm}-${pd}`;
}

// 連続日数の更新。途切れたときは0ではなく1から数え直す
// (「0日目」を見せると失敗の記録になってしまうため)
export function nextStreak(lastDoneDay, todayKey, prevStreak = 0) {
  if (lastDoneDay === todayKey) return Math.max(1, prevStreak);
  if (lastDoneDay && lastDoneDay === previousDayKey(todayKey)) return prevStreak + 1;
  return 1;
}

export const COURSE_REWARD = { min: 30, full: 60 };
export const BONUS_REWARD = 10;
export const STREAK_BONUS_PER_DAY = 10;
export const STREAK_BONUS_CAP_DAYS = 10;

// 連続日数の節目でだけ、道具が届く。
// 毎日配ると「もらえて当たり前」になり、たまにだと続ける理由になりやすい
export const STREAK_ITEMS = {
  3: "potionM",
  7: "premiumBait",
  14: "magicWaterEx",
  30: "mysticArmor",
};

export function calcReward({ courseId = "min", bonusCount = 0, streak = 1 } = {}) {
  const base = COURSE_REWARD[courseId] ?? COURSE_REWARD.min;
  const bonus = bonusCount * BONUS_REWARD;
  const streakBonus = Math.min(streak, STREAK_BONUS_CAP_DAYS) * STREAK_BONUS_PER_DAY;
  const items = {};
  const milestoneItem = STREAK_ITEMS[streak];
  if (milestoneItem) items[milestoneItem] = 1;
  return { base, bonus, streakBonus, money: base + bonus + streakBonus, items };
}

function emptyState() {
  return {
    v: 1,
    lastDoneDay: null,
    streak: 0,
    bestStreak: 0,
    totalDays: 0,
    today: null, // { day, courseId, checked: [stepId] }
    pending: { money: 0, items: {} }, // まだ冒険に持ち込んでいないごほうび
  };
}

function normalizeState(raw) {
  const state = emptyState();
  if (!raw || typeof raw !== "object") return state;
  if (typeof raw.lastDoneDay === "string") state.lastDoneDay = raw.lastDoneDay;
  if (Number.isInteger(raw.streak) && raw.streak >= 0) state.streak = raw.streak;
  if (Number.isInteger(raw.bestStreak) && raw.bestStreak >= 0) state.bestStreak = raw.bestStreak;
  if (Number.isInteger(raw.totalDays) && raw.totalDays >= 0) state.totalDays = raw.totalDays;
  if (raw.today && typeof raw.today.day === "string" && COURSES[raw.today.courseId]) {
    state.today = {
      day: raw.today.day,
      courseId: raw.today.courseId,
      checked: Array.isArray(raw.today.checked) ? raw.today.checked.filter((id) => typeof id === "string") : [],
    };
  }
  if (raw.pending && typeof raw.pending === "object") {
    const money = Number.isInteger(raw.pending.money) && raw.pending.money > 0 ? raw.pending.money : 0;
    const items = {};
    if (raw.pending.items && typeof raw.pending.items === "object") {
      for (const [id, n] of Object.entries(raw.pending.items)) {
        if (Number.isInteger(n) && n > 0) items[id] = n;
      }
    }
    state.pending = { money, items };
  }
  return state;
}

export function loadRoutineState() {
  if (!hasStorage) return emptyState();
  try {
    return normalizeState(JSON.parse(localStorage.getItem(ROUTINE_KEY)));
  } catch (e) {
    console.warn("朝のしたくの記録を読み込めませんでした", e);
    return emptyState();
  }
}

export function saveRoutineState(state) {
  if (!hasStorage) return false;
  try {
    localStorage.setItem(ROUTINE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn("朝のしたくの記録を保存できませんでした", e);
    return false;
  }
}

export function isDoneToday(state = loadRoutineState(), todayKey = routineDayKey()) {
  return state.lastDoneDay === todayKey;
}

// 今日の途中経過。別の日の記録が残っていたら無かったことにする
export function todayProgress(state = loadRoutineState(), todayKey = routineDayKey()) {
  if (!state.today || state.today.day !== todayKey) return null;
  if (state.today.checked.length === 0) return null;
  return state.today;
}

// 1項目ごとに呼ぶ。途中で閉じても続きから戻れるようにするための保存
export function recordProgress(courseId, checkedIds, todayKey = routineDayKey()) {
  const state = loadRoutineState();
  state.today = { day: todayKey, courseId, checked: [...checkedIds] };
  saveRoutineState(state);
  return state;
}

export function clearProgress() {
  const state = loadRoutineState();
  state.today = null;
  saveRoutineState(state);
  return state;
}

// 完走したときに1回だけ呼ぶ。
// 同じ日に2回目を完走してもごほうびは増えない(積み増しのために繰り返す動機を作らない)
export function completeRoutine({ courseId, bonusCount = 0, now = new Date() } = {}) {
  const todayKey = routineDayKey(now);
  const state = loadRoutineState();
  const alreadyDone = state.lastDoneDay === todayKey;
  const streak = nextStreak(state.lastDoneDay, todayKey, state.streak);
  const reward = alreadyDone ? { base: 0, bonus: 0, streakBonus: 0, money: 0, items: {} } : calcReward({ courseId, bonusCount, streak });

  state.streak = streak;
  state.bestStreak = Math.max(state.bestStreak, streak);
  if (!alreadyDone) {
    state.totalDays += 1;
    state.lastDoneDay = todayKey;
    state.pending.money += reward.money;
    for (const [id, n] of Object.entries(reward.items)) {
      state.pending.items[id] = (state.pending.items[id] || 0) + n;
    }
  }
  state.today = null;
  saveRoutineState(state);

  return { state, reward, streak, alreadyDone, firstEver: state.totalDays === 1 && !alreadyDone };
}

// 冒険を始めるときに受け取る。受け取ったぶんは記録から消える
export function claimPendingReward() {
  const state = loadRoutineState();
  const { money, items } = state.pending;
  if (money <= 0 && Object.keys(items).length === 0) return null;
  state.pending = { money: 0, items: {} };
  saveRoutineState(state);
  return { money, items };
}

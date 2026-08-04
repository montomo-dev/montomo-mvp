// 朝のしたくの項目定義。
// 項目を足す・減らす・並べ替えるときは、このファイルだけを直せばよい。
//
// 「無意識に繰り返せる」ことを狙っているので、順番は固定にしてある。
// 毎朝おなじ順で出てくることそのものが、思い出す手間を減らす仕掛け。

export const STEPS = {
  glasses: { icon: "👓", ja: "メガネを つける", en: "Put on your glasses" },
  light: { icon: "💡", ja: "でんきを つける", en: "Turn on the light" },
  curtain: { icon: "🌅", ja: "カーテンを あけて 光を あびる", en: "Open the curtains, take in the light" },
  water: { icon: "💧", ja: "水を のむ", en: "Drink some water" },
  face: { icon: "🚿", ja: "かおを あらう", en: "Wash your face" },
  gargle: { icon: "💦", ja: "うがいを する", en: "Gargle" },
  teeth: { icon: "🪥", ja: "はみがきを する", en: "Brush your teeth" },
  skin: { icon: "🧴", ja: "けしょう水・ニキビクリーム", en: "Toner and acne cream" },
  contact: { icon: "👁", ja: "コンタクトを つける", en: "Put in your contacts" },
  hair: { icon: "💈", ja: "かみを ととのえる", en: "Fix your hair" },
  clothes: { icon: "👕", ja: "きがえる", en: "Get dressed" },
  toilet: { icon: "🚽", ja: "トイレ", en: "Bathroom" },
  outside: { icon: "🚪", ja: "いっしゅん そとに でる", en: "Step outside for a moment" },
  meal: { icon: "🍚", ja: "ごはんを たべる", en: "Eat breakfast" },
  bento: { icon: "🍱", ja: "べんとうを もつ", en: "Pack your lunch" },
  bottle: { icon: "🍵", ja: "すいとうを もつ", en: "Take your water bottle" },
  downstairs: { icon: "🪜", ja: "下に いく / でる じゅんび", en: "Head down / get ready to go" },
};

// コースは「その日のコンディションで選ぶ」もの。
// 調子が出ない日に標準版しか無いと、まるごと飛ばす日が生まれてしまうので最小版を必ず残す。
export const COURSES = {
  min: {
    id: "min",
    ja: "さいしょうげん",
    en: "Minimum",
    descJa: "これだけ できれば 今日は 合格",
    descEn: "Just this much counts as a win today",
    steps: [
      "glasses", "light", "curtain", "water", "face",
      "gargle", "teeth", "clothes", "toilet", "downstairs",
    ],
  },
  full: {
    id: "full",
    ja: "ひょうじゅん",
    en: "Standard",
    descJa: "いつもの ながれを ぜんぶ",
    descEn: "The whole usual flow",
    steps: [
      "glasses", "light", "curtain", "water", "face",
      "gargle", "teeth", "skin", "contact", "hair",
      "clothes", "toilet", "outside", "meal", "bento",
      "bottle", "downstairs",
    ],
  },
};

export const COURSE_IDS = ["min", "full"];

// 「余裕があるときにやる」枠。やらなくても完了は成立し、やったぶんだけ上乗せになる。
// 必須にしないのは、できなかった日に失敗の記憶を残さないため。
export const BONUS_STEPS = [
  { id: "walk", icon: "🚶", ja: "3〜10分の さんぽ", en: "A 3-10 minute walk" },
  { id: "run", icon: "🏃", ja: "かるい ランニング", en: "A light run" },
  { id: "bed", icon: "🛏", ja: "ベッドメイキング", en: "Make the bed" },
  { id: "sit", icon: "⏳", ja: "トイレに 3分 すわる", en: "Sit on the toilet for 3 minutes" },
  { id: "protein", icon: "🥤", ja: "プロテイン", en: "Protein" },
  { id: "oneThing", icon: "📝", ja: "今日 やることを ひとことだけ きめる", en: "Decide one thing to do today" },
];

export function stepsOf(courseId) {
  const course = COURSES[courseId] || COURSES.min;
  return course.steps.map((id) => ({ id, ...STEPS[id] }));
}

export function bonusStepById(id) {
  return BONUS_STEPS.find((s) => s.id === id) || null;
}

export const ITEMS = {
  potionS: {
    id: "potionS",
    name: "ポーションS",
    description: "HPを 20 かいふくする",
    price: 15,
    kind: "heal",
    value: 20,
  },
  potionM: {
    id: "potionM",
    name: "ポーションM",
    description: "HPを 50 かいふくする",
    price: 45,
    kind: "heal",
    value: 50,
  },
  potionL: {
    id: "potionL",
    name: "ポーションL",
    description: "HPを 200 かいふくする",
    price: 90,
    kind: "heal",
    value: 200,
  },
  potionLL: {
    id: "potionLL",
    name: "ポーションLL",
    description: "HPを ぜんかいふくする",
    price: 250,
    kind: "heal",
    value: Infinity,
  },
  potionX: {
    id: "potionX",
    name: "ポーションX",
    description: "HPを ぜんかいふくし、じょうたいいじょうも なおす",
    price: 300,
    kind: "heal",
    value: Infinity,
    cureStatus: true,
  },
  bait: {
    id: "bait",
    name: "なかよしエサ",
    description: "つぎに さそう せいこうりつが 1.3ばいに なる",
    price: 40,
    kind: "bait",
    value: 0.3,
  },
  atkSeed: {
    id: "atkSeed",
    name: "つよさのタネ",
    description: "こうげきを 1 えいきゅう あげる",
    price: 200,
    kind: "stat_boost",
    stat: "atk",
    value: 1,
  },
  defSeed: {
    id: "defSeed",
    name: "まもりのタネ",
    description: "ぼうぎょを 1 えいきゅう あげる",
    price: 200,
    kind: "stat_boost",
    stat: "def",
    value: 1,
  },
  premiumBait: {
    id: "premiumBait",
    name: "とくべつなエサ",
    description: "つぎに さそう せいこうりつが 1.5ばいに なる",
    price: 120,
    kind: "bait",
    value: 0.5,
  },
};

// 各街の「どうぐや」は進行度に応じて品揃えが増えていく(累積解禁)。
// 街ではない序盤のフィールド(stage1のショップ等)は最初の街と同じ基本品揃えにする
const SHOP_TOWN_ORDER = [
  "town1",
  "sea_town1",
  "snow_town1",
  "desert_town1",
  "factory_town1",
  "castle_town1",
];

const SHOP_NEW_ITEMS_BY_TOWN = {
  town1: ["potionS", "potionM", "bait", "atkSeed", "defSeed"],
  sea_town1: ["potionL"],
  snow_town1: ["premiumBait"],
  desert_town1: ["potionLL"],
  factory_town1: [],
  castle_town1: ["potionX"],
};

export function shopInventoryFor(stageId) {
  const townIndex = SHOP_TOWN_ORDER.indexOf(stageId);
  const unlockedThrough = townIndex === -1 ? 0 : townIndex;
  const ids = [];
  for (let i = 0; i <= unlockedThrough; i++) {
    ids.push(...SHOP_NEW_ITEMS_BY_TOWN[SHOP_TOWN_ORDER[i]]);
  }
  return ids;
}

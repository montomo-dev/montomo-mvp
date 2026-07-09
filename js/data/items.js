export const ITEMS = {
  potionS: {
    id: "potionS",
    name: "ポーションS",
    nameEn: "Potion S",
    description: "HPを 20 かいふくする",
    descriptionEn: "Restores 20 HP",
    price: 45,
    kind: "heal",
    value: 20,
  },
  potionM: {
    id: "potionM",
    name: "ポーションM",
    nameEn: "Potion M",
    description: "HPを 50 かいふくする",
    descriptionEn: "Restores 50 HP",
    price: 135,
    kind: "heal",
    value: 50,
  },
  potionL: {
    id: "potionL",
    name: "ポーションL",
    nameEn: "Potion L",
    description: "HPを 200 かいふくする",
    descriptionEn: "Restores 200 HP",
    price: 270,
    kind: "heal",
    value: 200,
  },
  potionLL: {
    id: "potionLL",
    name: "ポーションLL",
    nameEn: "Potion LL",
    description: "HPを ぜんかいふくする",
    descriptionEn: "Fully restores HP",
    price: 750,
    kind: "heal",
    value: Infinity,
  },
  potionX: {
    id: "potionX",
    name: "ポーションX",
    nameEn: "Potion X",
    description: "HPを ぜんかいふくし、じょうたいいじょうも なおす",
    descriptionEn: "Fully restores HP and cures status ailments",
    price: 900,
    kind: "heal",
    value: Infinity,
    cureStatus: true,
  },
  bait: {
    id: "bait",
    name: "なかよしエサ",
    nameEn: "Friendship Bait",
    description: "つぎに さそう せいこうりつが 1.3ばいに なる",
    descriptionEn: "Multiplies your next scout success rate by 1.3x",
    price: 120,
    kind: "bait",
    value: 0.3,
  },
  atkSeed: {
    id: "atkSeed",
    name: "つよさのタネ",
    nameEn: "Power Seed",
    description: "こうげきを 1 えいきゅう あげる",
    descriptionEn: "Permanently raises Attack by 1",
    price: 600,
    kind: "stat_boost",
    stat: "atk",
    value: 1,
  },
  defSeed: {
    id: "defSeed",
    name: "まもりのタネ",
    nameEn: "Guard Seed",
    description: "ぼうぎょを 1 えいきゅう あげる",
    descriptionEn: "Permanently raises Defense by 1",
    price: 600,
    kind: "stat_boost",
    stat: "def",
    value: 1,
  },
  premiumBait: {
    id: "premiumBait",
    name: "とくべつなエサ",
    nameEn: "Premium Bait",
    description: "つぎに さそう せいこうりつが 1.5ばいに なる",
    descriptionEn: "Multiplies your next scout success rate by 1.5x",
    price: 360,
    kind: "bait",
    value: 0.5,
  },
  leatherArmor: {
    id: "leatherArmor",
    name: "レザーアーマー",
    nameEn: "Leather Armor",
    description: "そうびすると ぼうぎょが 3 あがる",
    descriptionEn: "Equip to raise Defense by 3",
    price: 150,
    kind: "armor",
    defBonus: 3,
  },
  ironArmor: {
    id: "ironArmor",
    name: "アイアンアーマー",
    nameEn: "Iron Armor",
    description: "そうびすると ぼうぎょが 6 あがる",
    descriptionEn: "Equip to raise Defense by 6",
    price: 380,
    kind: "armor",
    defBonus: 6,
  },
  mysticArmor: {
    id: "mysticArmor",
    name: "ミスティックアーマー",
    nameEn: "Mystic Armor",
    description: "そうびすると ぼうぎょが 10 あがる",
    descriptionEn: "Equip to raise Defense by 10",
    price: 700,
    kind: "armor",
    defBonus: 10,
  },
  dragonArmor: {
    id: "dragonArmor",
    name: "ドラゴンアーマー",
    nameEn: "Dragon Armor",
    description: "そうびすると ぼうぎょが 16 あがる",
    descriptionEn: "Equip to raise Defense by 16",
    price: 1300,
    kind: "armor",
    defBonus: 16,
  },
};

export function sellPriceOf(item) {
  return Math.max(1, Math.floor(item.price / 3));
}

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
  town1: ["potionS", "potionM", "bait", "atkSeed", "defSeed", "leatherArmor"],
  sea_town1: ["potionL", "ironArmor"],
  snow_town1: ["premiumBait", "mysticArmor"],
  desert_town1: ["potionLL"],
  factory_town1: [],
  castle_town1: ["potionX", "dragonArmor"],
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

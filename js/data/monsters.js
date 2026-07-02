import { statsFor } from "../systems/growth.js";

export const SPECIES = {
  mofuri: {
    id: "mofuri",
    name: "モフリ",
    genus: "くさねこ",
    color: "#6bbf3f",
    base: { hp: 26, atk: 8, def: 6, spd: 7 },
    growth: { hp: 5, atk: 2.2, def: 1.6, spd: 1.8 },
    exp: 10,
    recruitEase: 0.1,
    evolvesAt: 10,
    evolvesTo: "mofurif",
    learnset: [
      { level: 3, skill: "happashusshu" },
      { level: 6, skill: "konohaguruma" },
    ],
  },
  dogura: {
    id: "dogura",
    name: "ドグラ",
    genus: "つちもぐら",
    color: "#8a6244",
    base: { hp: 30, atk: 7, def: 8, spd: 4 },
    growth: { hp: 6, atk: 1.8, def: 2.2, spd: 1.2 },
    exp: 9,
    recruitEase: 0.3,
    evolvesAt: 10,
    evolvesTo: "borudogura",
    learnset: [
      { level: 3, skill: "moguradrill" },
      { level: 6, skill: "jinarashipress" },
    ],
  },
  hibachi: {
    id: "hibachi",
    name: "ヒバチ",
    genus: "ひのことかげ",
    color: "#e6392b",
    pigment: "red",
    base: { hp: 22, atk: 10, def: 5, spd: 6 },
    growth: { hp: 4.5, atk: 2.6, def: 1.4, spd: 1.7 },
    exp: 12,
    recruitEase: 0.16,
    evolvesAt: 10,
    evolvesTo: "bakuhibachi",
    learnset: [
      { level: 3, skill: "hinokodance" },
      { level: 6, skill: "moemoehead" },
    ],
  },
  fuwarisu: {
    id: "fuwarisu",
    name: "フワリス",
    genus: "そらことり",
    color: "#3468d1",
    pigment: "blue",
    base: { hp: 20, atk: 8, def: 4, spd: 10 },
    growth: { hp: 4, atk: 2, def: 1.2, spd: 2.4 },
    exp: 10,
    recruitEase: 0.22,
    evolvesAt: 10,
    evolvesTo: "tenfuwarisu",
    learnset: [
      { level: 3, skill: "soyokazecutter" },
      { level: 6, skill: "tatsumakifeather" },
    ],
  },
  mofurif: {
    id: "mofurif",
    name: "モフリーフ",
    genus: "みのりくさねこ",
    color: "#5e9c3e",
    base: { hp: 42, atk: 13, def: 12, spd: 11 },
    growth: { hp: 7.2, atk: 2.8, def: 2.4, spd: 2.2 },
    exp: 20,
    recruitEase: 0.05,
    learnset: [{ level: 12, skill: "seiryokuha" }],
  },
  borudogura: {
    id: "borudogura",
    name: "ボルドグラ",
    genus: "がんせきもぐら",
    color: "#8a6244",
    base: { hp: 48, atk: 12, def: 16, spd: 8 },
    growth: { hp: 8, atk: 2.6, def: 3.0, spd: 1.6 },
    exp: 18,
    recruitEase: 0.14,
    learnset: [{ level: 12, skill: "gantekiotoshi" }],
  },
  bakuhibachi: {
    id: "bakuhibachi",
    name: "バクヒバチ",
    genus: "ばくえんとかげ",
    color: "#c94a24",
    pigment: "red",
    base: { hp: 36, atk: 18, def: 10, spd: 12 },
    growth: { hp: 6.5, atk: 3.6, def: 2.0, spd: 2.4 },
    exp: 24,
    recruitEase: 0.07,
    learnset: [{ level: 12, skill: "daibakuhatsu" }],
  },
  tenfuwarisu: {
    id: "tenfuwarisu",
    name: "テンフワリス",
    genus: "てんくうことり",
    color: "#4a86a8",
    pigment: "blue",
    base: { hp: 32, atk: 13, def: 8, spd: 18 },
    growth: { hp: 6, atk: 2.6, def: 1.6, spd: 3.2 },
    exp: 20,
    recruitEase: 0.1,
    learnset: [{ level: 12, skill: "senpugeki" }],
  },
  pyokotan: {
    id: "pyokotan",
    name: "ピョコタン",
    genus: "みずたまがえる",
    color: "#2fb6a8",
    base: { hp: 24, atk: 7, def: 7, spd: 6 },
    growth: { hp: 5, atk: 1.8, def: 2.0, spd: 1.4 },
    exp: 9,
    recruitEase: 0.28,
    learnset: [
      { level: 3, skill: "bubblesplash" },
      { level: 6, skill: "shibukikick" },
    ],
  },
  pachikoro: {
    id: "pachikoro",
    name: "パチコロ",
    genus: "でんこうむし",
    color: "#f0c419",
    pigment: "yellow",
    base: { hp: 20, atk: 9, def: 5, spd: 9 },
    growth: { hp: 4.2, atk: 2.2, def: 1.3, spd: 2.0 },
    exp: 11,
    recruitEase: 0.18,
    learnset: [
      { level: 3, skill: "biribiritouch" },
      { level: 6, skill: "raimeidan" },
    ],
  },
  tsukinone: {
    id: "tsukinone",
    name: "ツキノネ",
    genus: "ほしみみうさぎ",
    color: "#8b5fd1",
    base: { hp: 25, atk: 10, def: 7, spd: 11 },
    growth: { hp: 5.2, atk: 2.5, def: 1.8, spd: 2.6 },
    exp: 18,
    recruitEase: 0.08,
    rare: true,
    learnset: [
      { level: 1, skill: "hoshikake" },
      { level: 6, skill: "tsukinooto" },
    ],
  },
  honbori: {
    id: "honbori",
    name: "ホンボリ",
    genus: "あんどんふくろう",
    color: "#f2a444",
    pigment: "yellow",
    base: { hp: 21, atk: 8, def: 6, spd: 8 },
    growth: { hp: 4.4, atk: 2.1, def: 1.5, spd: 1.9 },
    exp: 10,
    recruitEase: 0.24,
    learnset: [
      { level: 3, skill: "hotarubi" },
      { level: 6, skill: "andonflash" },
    ],
  },
  tsubogame: {
    id: "tsubogame",
    name: "ツボガメ",
    genus: "やきものがめ",
    color: "#5a8f7a",
    base: { hp: 28, atk: 6, def: 9, spd: 3 },
    growth: { hp: 5.8, atk: 1.6, def: 2.3, spd: 1.0 },
    exp: 10,
    recruitEase: 0.26,
    learnset: [
      { level: 3, skill: "kouratackle" },
      { level: 6, skill: "hibiwareGeki" },
    ],
  },
  sandango: {
    id: "sandango",
    name: "サンダンゴ",
    genus: "みたらしことり",
    color: "#e8927a",
    base: { hp: 19, atk: 7, def: 5, spd: 9 },
    growth: { hp: 3.8, atk: 1.9, def: 1.3, spd: 2.1 },
    exp: 9,
    recruitEase: 0.27,
    learnset: [
      { level: 3, skill: "mitarashihane" },
      { level: 6, skill: "dangospin" },
    ],
  },
  nushi: {
    id: "nushi",
    name: "モリノヌシ",
    genus: "もりのぬし",
    base: { hp: 150, atk: 24, def: 18, spd: 10 },
    growth: { hp: 0, atk: 0, def: 0, spd: 0 },
    exp: 30,
    recruitEase: 0,
    boss: true,
    learnset: [
      { level: 1, skill: "seiryokuha" },
      { level: 1, skill: "gantekiotoshi" },
    ],
  },
};

export const WILD_SPECIES = ["dogura", "hibachi", "fuwarisu", "pyokotan", "pachikoro", "honbori", "tsubogame", "sandango"];
export const RARE_SPECIES = "tsukinone";
export const RARE_ENCOUNTER_RATE = 0.05;

export function rollWildSpecies(pool = WILD_SPECIES, random = Math.random) {
  if (random() < RARE_ENCOUNTER_RATE) return RARE_SPECIES;
  return pool[Math.floor(random() * pool.length)];
}

let uidCounter = 1;

export function peekUidCounter() {
  return uidCounter;
}

export function ensureUidAbove(maxUid) {
  if (maxUid + 1 > uidCounter) uidCounter = maxUid + 1;
}

export function createMonster(speciesId, level) {
  const species = SPECIES[speciesId];
  const stats = statsFor(species, level);
  return {
    uid: uidCounter++,
    speciesId,
    name: species.name,
    level,
    exp: 0,
    maxHp: stats.maxHp,
    hp: stats.maxHp,
    atk: stats.atk,
    def: stats.def,
    spd: stats.spd,
    skills: species.learnset.filter((e) => e.level <= level).map((e) => e.skill),
  };
}

import { statsFor } from "../systems/growth.js";

export const SPECIES = {
  mofuri: {
    id: "mofuri",
    name: "モフリ",
    genus: "くさねこ",
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

export const WILD_SPECIES = ["dogura", "hibachi", "fuwarisu", "pyokotan", "pachikoro"];
export const RARE_SPECIES = "tsukinone";
export const RARE_ENCOUNTER_RATE = 0.05;

export function rollWildSpecies(random = Math.random) {
  if (random() < RARE_ENCOUNTER_RATE) return RARE_SPECIES;
  return WILD_SPECIES[Math.floor(random() * WILD_SPECIES.length)];
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

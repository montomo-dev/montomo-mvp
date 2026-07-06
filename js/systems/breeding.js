import { createMonster, SPECIES } from "../data/monsters.js";
import { applyCombos } from "./skillCombo.js";

export const BASE_SPECIES = {
  mofurif: "mofuri",
  borudogura: "dogura",
  bakuhibachi: "hibachi",
  tenfuwarisu: "fuwarisu",
};

export const SPECIAL_RESULTS = {
  "mofuri+pyokotan": "obako",
  "hibachi+pachikoro": "kurista",
  "dogura+fuwarisu": "hagumon",
  "obako+tsukinone": "obagale",
  "kaigaran+kurista": "kuricrown",
  "hagumon+hagurumaru": "hagutitan",
  "mofuri+sakuraneko": "mofurigarden",
  "dogura+ishimaru": "borudrill",
  "hibachi+sandango": "bakuphoenix",
  "fuwarisu+torimugi": "tenstorm",
  "awairuka+sazanami": "oonamiwhale",
  "hikariebi+sumiremo": "hoshizora",
  "karakuribat+nejiko": "omegazenmaiya",
  "tsukinone+yukibouzu": "reiseiou",

  // ここから下は「特殊配合」を増やすために追加したレシピ。
  // 新しいモンスターは作らず、既存の野生種同士の組み合わせで
  // 別の既存種が生まれるようにして、配合表の手応えを増やしている
  "hibachi+sunasasori": "rakudan", // 炎+砂漠のさそり → 砂漠のふたこぶ
  "kaigaran+pyokotan": "awairuka", // 水系どうしがとけあい → あわ吹きいるか
  "fuwarisu+kazeneko": "sorane", // 空+風 → そらうさぎ
  "hagurumaru+pachikoro": "karakuribat", // 歯車+でんき → からくりこうもり
  "fuyudama+yukimaro": "kooritsumu", // 雪玉+雪うさぎ → つららの結晶
  "akumakko+kageuri": "kokushou", // 小悪魔+かげのうり → やみのよろい
  "sunamiira+yuureiking": "tsukihane", // いにしえの布+さまようゆうれい → つきかげの獣
  "mizukusa+noroigumo": "sumiremo", // 水草の虫+のろいのくも → よるちょう(羽化のイメージ)

  // ここから下は「進化後の姿」そのものを親に指定したときだけ成立するレシピ。
  // baseSpeciesIdによる基礎形への丸め込みより先に判定されるため、
  // 進化前(例: モフリ)で配合した場合とは別の結果になる
  "kotohana+mofurif": "hanamaro", // モフリーフ+ハナコトリ → ハナマロ
  "harune+mofurif": "sakuraneko", // モフリーフ+ハルネ → サクラネコ
  "borudogura+sunasasori": "sunaboko", // ボルドグラ+スナサソリ → スナボコ
  "borudogura+sunamaru": "sunamiira", // ボルドグラ+スナマル → スナミイラ
  "bakuhibachi+moriame": "tsuyuhika", // バクヒバチ+モリアメ → ツユヒカ
  "bakuhibachi+hikariame": "shizukuya", // バクヒバチ+ヒカリアメ → シズクヤ
  "sorane+tenfuwarisu": "kazepeko", // テンフワリス+ソラネ → カゼペコ
  "kazeneko+tenfuwarisu": "torimugi", // テンフワリス+カゼネコ → トリムギ
};

const PRIMARY_BLENDS = {
  "blue+red": { color: "#8e44ad", name: "むらさき" },
  "red+yellow": { color: "#e8842e", name: "オレンジ" },
  "blue+yellow": { color: "#4caf3f", name: "みどり" },
};

function baseSpeciesId(monster) {
  return BASE_SPECIES[monster.speciesId] || monster.speciesId;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHue({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  if (d === 0) return 0;
  let h;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

function averageColor(hexA, hexB) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex({ r: (a.r + b.r) / 2, g: (a.g + b.g) / 2, b: (a.b + b.b) / 2 });
}

function mixColors(speciesA, speciesB) {
  if (!speciesA.color || !speciesB.color) return null;
  if (speciesA.color === speciesB.color) return null;
  if (speciesA.pigment && speciesB.pigment && speciesA.pigment !== speciesB.pigment) {
    const key = [speciesA.pigment, speciesB.pigment].sort().join("+");
    const known = PRIMARY_BLENDS[key];
    if (known) return known;
  }
  return { color: averageColor(speciesA.color, speciesB.color), name: null };
}

// ステータス引き継ぎ(1/4ルール): 親のステータスの合計を4で割った値(端数切り捨て)が子の初期値になる。
// 親をレベルアップさせてから配合するほど、子は強い初期値で生まれる
function inheritStat(a, b) {
  return Math.max(1, Math.floor((a + b) / 4));
}

// seedを基にした決定論的シャッフル。連続インデックスの切り出しだと配列内で隣接しない
// 要素の組を絶対に選べない(=特定の技の組み合わせが永久に揃わない)ため、全体をシャッフルしてから選ぶ
function seededShuffle(array, seed) {
  const arr = [...array];
  let s = seed % 2147483647 || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 48271) % 2147483647;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function breedMonsters(parentA, parentB) {
  const seed = parentA.uid + parentB.uid + parentA.level + parentB.level;

  // 進化後の姿そのものを指定したレシピ(例: モフリーフ+コトハナ)がもしあれば、
  // 種族値を基礎形に丸める前にそちらを優先する。丸めた後のキーでヒットしなければ、
  // 従来通り基礎形(baseSpeciesId)同士の組み合わせで判定する
  const rawKey = [parentA.speciesId, parentB.speciesId].sort().join("+");
  let idA, idB, speciesId;
  if (SPECIAL_RESULTS[rawKey]) {
    idA = parentA.speciesId;
    idB = parentB.speciesId;
    speciesId = SPECIAL_RESULTS[rawKey];
  } else {
    idA = baseSpeciesId(parentA);
    idB = baseSpeciesId(parentB);
    const pairKey = [idA, idB].sort().join("+");
    speciesId = SPECIAL_RESULTS[pairKey] || [idA, idB].sort()[seed % 2];
  }
  const child = createMonster(speciesId, 1);

  child.maxHp = inheritStat(parentA.maxHp, parentB.maxHp);
  child.hp = child.maxHp;
  child.atk = inheritStat(parentA.atk, parentB.atk);
  child.def = inheritStat(parentA.def, parentB.def);
  child.spd = inheritStat(parentA.spd, parentB.spd);

  const mixed = mixColors(SPECIES[idA], SPECIES[idB]);
  if (mixed) {
    child.tintColor = mixed.color;
    child.tintHue = rgbToHue(hexToRgb(mixed.color)) - rgbToHue(hexToRgb(SPECIES[speciesId].color));
    child.tintName = mixed.name;
  }

  // スキル引き継ぎ(半分ルール): 親が持つ技のうち子がまだ知らないものの、およそ半分を引き継ぐ
  const candidateSkills = [...new Set([...parentA.skills, ...parentB.skills])]
    .filter((skillId) => !child.skills.includes(skillId));
  const inheritCount = candidateSkills.length > 0
    ? Math.max(1, Math.ceil(candidateSkills.length / 2))
    : 0;
  const inheritedSkills = seededShuffle(candidateSkills, seed).slice(0, inheritCount);
  child.skills.push(...inheritedSkills);

  // 組み合わせ技: 引き継いだ技同士が揃っていれば、上位の組み合わせ技も習得する
  const comboSkills = applyCombos(child);

  child.parents = [parentA.uid, parentB.uid];
  return { child, inheritedSkills, comboSkills };
}

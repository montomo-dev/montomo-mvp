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
  // 以前は既存の野生種がそのまま生まれる組み合わせが多く、
  // 「配合しても野生で会える姿しか手に入らない」と不評だったため、
  // すべて野生では出会えない専用の姿(進化後の姿、または配合限定の姿)に変更している
  "hibachi+sunasasori": "rakudaking", // 炎+砂漠のさそり → ラクダキング(配合限定)
  "kaigaran+pyokotan": "awarukaqueen", // 水系どうしがとけあい → アワイルカクイーン(配合限定)
  "fuwarisu+kazeneko": "amakumousagi", // 空+風 → 進化後のそらうさぎ
  "hagurumaru+pachikoro": "karakuriking", // 歯車+でんき → カラクリキング(配合限定)
  "fuyudama+yukimaro": "kooritsumuking", // 雪玉+雪うさぎ → コオリツムオウ(配合限定)
  "akumakko+kageuri": "kokushouking", // 小悪魔+かげのうり → コクショウオウ(配合限定)
  "sunamiira+yuureiking": "tsukihanehime", // いにしえの布+さまようゆうれい → ツキハネヒメ(配合限定)
  "mizukusa+noroigumo": "sumiremoking", // 水草の虫+のろいのくも → スミレモオウ(配合限定)

  // ここから下は「進化後の姿」そのものを親に指定したときだけ成立するレシピ。
  // baseSpeciesIdによる基礎形への丸め込みより先に判定されるため、
  // 進化前(例: モフリ)で配合した場合とは別の結果になる
  "kotohana+mofurif": "hanaguruma", // モフリーフ+ハナコトリ → 進化後のハナマロ
  "harune+mofurif": "sakuraouneko", // モフリーフ+ハルネ → 進化後のサクラネコ
  "borudogura+sunasasori": "sunabokoking", // ボルドグラ+スナサソリ → スナボコオウ(配合限定)
  "borudogura+sunamaru": "sunamiirasou", // ボルドグラ+スナマル → スナミイラソウ(配合限定)
  "bakuhibachi+moriame": "tsuyuhikaking", // バクヒバチ+モリアメ → ツユヒカオウ(配合限定)
  "bakuhibachi+hikariame": "shizukuyaseirei", // バクヒバチ+ヒカリアメ → シズクヤセイレイ(配合限定)
  "sorane+tenfuwarisu": "hayatenoko", // テンフワリス+ソラネ → 進化後のカゼペコ
  "kazeneko+tenfuwarisu": "oomugiwatari", // テンフワリス+カゼネコ → 進化後のトリムギ

  // ここから下は配合表のパターンを大幅に増やすために追加したレシピ。
  // これまで一度も配合レシピに登場していなかった種族を中心に、
  // 「野生では出会えない専用の姿」が生まれるようにしている
  "fuwarisu+orihiko": "tenfuwarisu", // 折り紙飛行機+空ことり→進化後の空ことり
  "orihiko+sorane": "hayatenoko", // 紙飛行機+空うさぎ→進化後のかぜのこ
  "kiboko+sabotenko": "hounenkibi", // 木彫り+さぼてん→進化後のやまきび
  "kiboko+tsuboco": "dosugame", // 木彫り+つぼ→進化後のやきものがめ
  "kaigaran+tsuboco": "haribuneking", // つぼ+やどかり→ハリブネオウ(配合限定)
  "honbori+yuureiking": "shizumeganeseirei", // あんどん+ゆうれい王→シズメガネセイレイ(配合限定)
  "akumakko+honbori": "takarabox", // あんどん+こあくま→ばけばこ
  "sunamaru+tsubogame": "hoshimoguking", // やきものがめ+すなまる→ホシモグオウ(配合限定)
  "kuroguri+takarabox": "yuureiteiou", // ばけばこ+くろちいさま→ユウレイテイオウ(配合限定)
  "awairuka+pukurin": "sazanamiking", // みずぶくろくらげ+いるか→サザナミオウ(配合限定)
  "mizutama+pukurin": "mizugomaking", // みずぶくろくらげ+みずだまがい→ミズゴマオウ(配合限定)
  "hoshimogu+sunasasori": "sunamaruking", // ほしずなもぐら+さそり→スナマルオウ(配合限定)
  "hoshimogu+sunamiira": "hoshizora", // ほしずなもぐら+いにしえの布→ほしぞらむし
  "shizumegane+yamiankou": "shizukuyaseirei", // やみひかりうお+しずめめだま→シズクヤセイレイ(配合限定)
  "kuroguri+yamiankou": "noroigumoking", // やみひかりうお+くろちいさま→ノロイグモオウ(配合限定)
  "pengiri+yukigamo": "yukimaroking", // ペンギン+しらかも→ユキマロオウ(配合限定)
  "fuyudama+pengiri": "kooritsumuking", // ペンギン+ゆきむすびだま→コオリツムオウ(配合限定)
  "rakudan+sabotenko": "sunasasoriking", // さぼてん+らくだ→スナサソリオウ(配合限定)
  "momijiri+sabotenko": "hanafubukiusagi", // さぼてん+もみじぎつね→進化後のはるうさぎ
  "nejiko+sparkun": "hagurumaruking", // でんきスパーク+ぜんまいねこ→ハグルマルオウ(配合限定)
  "pachikoro+sparkun": "paiponking", // でんきスパーク+でんこうむし→パイポンオウ(配合限定)
  "hagurumaru+paipon": "nejikoking", // はいかんロボ+がんじょうはぐるま→ネジコオウ(配合限定)
  "karakuribat+paipon": "hagurumaruking", // はいかんロボ+からくりこうもり→ハグルマルオウ(配合限定)
  "mizuhane+torimugi": "oodangou", // みずとり+むぎわたりどり→進化後のみたらしことり
  "kotohana+mizuhane": "mizutamaking", // みずとり+はなことり→ミズタマオウ(配合限定)
  "momijiri+sakuraneko": "hanaguruma", // もみじぎつね+はなねこ→進化後のはなこいぬ
  "harune+momijiri": "kazagurumaneko", // もみじぎつね+はるうさぎ→進化後のかぜねこ
  "haribune+mizugoma": "mizutamaking", // みずごま+はりぶね→ミズタマオウ(配合限定)
  "sunaboko+sunobori": "sunamaruking", // すなのり+すなころがし→スナマルオウ(配合限定)
  "sunamaru+sunobori": "sunasasoriking", // すなのり+すなまる→スナサソリオウ(配合限定)
  "kaigaran+mizutama": "dosugame", // みずだまがい+やどかり→進化後のやきものがめ
  "hanamaro+yamakibi": "sakuraouneko", // やまきび+はなこいぬ→進化後のはなねこ
  "kiboko+yamakibi": "sabotenkoking", // きぼりこけし+やまきび→サボテンコオウ(配合限定)
  "shizumegane+tsukihane": "sunamiirasou", // しずめめだま+つきけもり→スナミイラソウ(配合限定)
  "haribune+mizutama": "mizuhaneking", // はりぶね+みずだまがい→ミズハネオウ(配合限定)
  "kageuri+kuroguri": "akumakkoking", // くろちいさま+かげひそみうり→アクマッコオウ(配合限定)
  "kuroguri+noroigumo": "kageurilord", // くろちいさま+のろいのくも→カゲウリロード(配合限定)
  "kooritsumu+yukimaro": "yukibouzuking", // つららけっしょう+ゆきごろもうさぎ→ユキボウズオウ(配合限定)
  "fuyudama+yukigamo": "pengiriking", // しらかも+ゆきむすびだま→ペンギリオウ(配合限定)
  "haribune+kaigaran": "pukurinseirei", // はりぶね+やどかり→プクリンセイレイ(配合限定)
  "mizutama+sazanami": "yamiankouking", // みずだまがい+さざなみまんぼう→ヤミアンコウオウ(配合限定)
  "shizukuya+tsuyuhika": "hikariameseirei", // しずくやどり+つゆひかり→ヒカリアメセイレイ(配合限定)
  "moriame+shizukuya": "mizugomaking", // しずくやどり+もりあめ→ミズゴマオウ(配合限定)
  "kazepeko+sorane": "orifalcon", // かぜのこ+そらうさぎ→進化後のおりがみひこうき
  "kazeneko+torimugi": "honborido", // かぜねこ+むぎわたりどり→進化後のあんどんふくろう
  "ishimaru+sunaboko": "koganetsubo", // すなころがし+ころころいし→進化後のせとものつぼ
  "rakudan+sunamaru": "hoshimoguking", // すなまる+らくだ→ホシモグオウ(配合限定)
  "reiseiou+yukibouzu": "yukigamohime", // ふぶきのようせい+れいしょうおう→ユキガモヒメ(配合限定)
  "sabotenko+sunamaru": "sunoboriking", // さぼてん+すなまる→スノボリオウ(配合限定)
  "kotohana+momijiri": "sakuraouneko", // もみじぎつね+はなことり→進化後のはなねこ
  "mizukusa+sumiremo": "noroigumoking", // みずくさむし+よるちょう→ノロイグモオウ(配合限定)
  "hoshizora+sumiremo": "sunamiirasou", // ほしぞらむし+よるちょう→スナミイラソウ(配合限定)
  "sunamiira+takarabox": "kokushouking", // ばけばこ+いにしえの布→コクショウオウ(配合限定)
  "kokushou+kuroguri": "akumakkoking", // やみのよろい+くろちいさま→アクマッコオウ(配合限定)
  "paipon+sparkun": "pachiking", // はいかんロボ+でんきスパーク→進化後のでんこうむし
  "haribune+mizuhane": "sazanamiking", // みずとり+はりぶね→サザナミオウ(配合限定)
  "ishimaru+tsubogame": "kurista", // やきものがめ+ころころいし→かけらせいれい
  "sunamaru+yamakibi": "rakudaking", // やまきび+すなまる→ラクダキング(配合限定)
  "honbori+shizumegane": "yamiankouking", // あんどんふくろう+しずめめだま→ヤミアンコウオウ(配合限定)
  "kokushou+takarabox": "sunamiirasou", // ばけばこ+やみのよろい→スナミイラソウ(配合限定)
};

const PRIMARY_BLENDS = {
  "blue+red": { color: "#8e44ad", name: "むらさき" },
  "red+yellow": { color: "#e8842e", name: "オレンジ" },
  "blue+yellow": { color: "#4caf3f", name: "みどり" },
};

function baseSpeciesId(monster) {
  return BASE_SPECIES[monster.speciesId] || monster.speciesId;
}

function tribeOf(speciesId) {
  return SPECIES[speciesId]?.tribe;
}

// 同種族どうしの配合はステータスの伸びが良く(純血ボーナス)、
// 異種族どうしの配合は技を多く受け継ぐ(雑種強勢)、という差をつける
const SAME_TRIBE_STAT_BONUS = 1.15;

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

  const sameTribe = !!tribeOf(idA) && tribeOf(idA) === tribeOf(idB);
  const statMultiplier = sameTribe ? SAME_TRIBE_STAT_BONUS : 1;

  child.maxHp = Math.max(1, Math.round(inheritStat(parentA.maxHp, parentB.maxHp) * statMultiplier));
  child.hp = child.maxHp;
  child.atk = Math.max(1, Math.round(inheritStat(parentA.atk, parentB.atk) * statMultiplier));
  child.def = Math.max(1, Math.round(inheritStat(parentA.def, parentB.def) * statMultiplier));
  child.spd = Math.max(1, Math.round(inheritStat(parentA.spd, parentB.spd) * statMultiplier));

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
    ? Math.min(candidateSkills.length, Math.max(1, Math.ceil(candidateSkills.length / 2) + (sameTribe ? 0 : 1)))
    : 0;
  const inheritedSkills = seededShuffle(candidateSkills, seed).slice(0, inheritCount);
  child.skills.push(...inheritedSkills);

  // 組み合わせ技: 引き継いだ技同士が揃っていれば、上位の組み合わせ技も習得する
  const comboSkills = applyCombos(child);

  child.parents = [parentA.uid, parentB.uid];
  return { child, inheritedSkills, comboSkills, sameTribe };
}

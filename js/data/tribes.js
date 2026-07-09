export const TRIBE_LIST = [
  "kemono", "dragon", "bird", "bug", "plant", "aqua",
  "rock", "ghost", "devil", "machine", "material", "boss",
];

const TRIBE_NAME = {
  kemono: "けもの",
  dragon: "ドラゴン",
  bird: "とり",
  bug: "むし",
  plant: "しょくぶつ",
  aqua: "すいせい",
  rock: "こうぶつ",
  ghost: "ゆうれい",
  devil: "あくま",
  machine: "きかい",
  material: "ぶっしつ",
  boss: "ぬし",
};

const TRIBE_NAME_EN = {
  kemono: "Beast",
  dragon: "Dragon",
  bird: "Bird",
  bug: "Bug",
  plant: "Plant",
  aqua: "Aqua",
  rock: "Mineral",
  ghost: "Ghost",
  devil: "Devil",
  machine: "Machine",
  material: "Material",
  boss: "Nushi",
};

export function tribeOf(speciesId, speciesTable) {
  return speciesTable[speciesId]?.tribe;
}

export function tribeName(tribe) {
  return TRIBE_NAME[tribe] || tribe;
}

export function tribeNameEn(tribe) {
  return TRIBE_NAME_EN[tribe] || tribe;
}

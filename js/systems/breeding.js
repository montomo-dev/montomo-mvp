import { createMonster, SPECIES } from "../data/monsters.js";

const BASE_SPECIES = {
  mofurif: "mofuri",
  borudogura: "dogura",
  bakuhibachi: "hibachi",
  tenfuwarisu: "fuwarisu",
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

export function breedMonsters(parentA, parentB) {
  const idA = baseSpeciesId(parentA);
  const idB = baseSpeciesId(parentB);
  const candidates = [idA, idB].sort();
  const seed = parentA.uid + parentB.uid + parentA.level + parentB.level;
  const speciesId = candidates[seed % candidates.length];
  const child = createMonster(speciesId, 1);

  const mixed = mixColors(SPECIES[idA], SPECIES[idB]);
  if (mixed) {
    child.tintColor = mixed.color;
    child.tintHue = rgbToHue(hexToRgb(mixed.color)) - rgbToHue(hexToRgb(SPECIES[speciesId].color));
    child.tintName = mixed.name;
  }

  const inheritedSkills = [...new Set([...parentA.skills, ...parentB.skills])]
    .filter((skillId) => !child.skills.includes(skillId));
  if (inheritedSkills.length > 0) {
    child.skills.push(inheritedSkills[seed % inheritedSkills.length]);
  }

  child.parents = [parentA.uid, parentB.uid];
  return {
    child,
    inheritedSkill: child.skills.find(
      (skillId) => !SPECIES[speciesId].learnset.some((entry) => entry.level <= 1 && entry.skill === skillId)
    ) || null,
  };
}

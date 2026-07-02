import { createMonster, SPECIES } from "../data/monsters.js";

const BASE_SPECIES = {
  mofurif: "mofuri",
  borudogura: "dogura",
  bakuhibachi: "hibachi",
  tenfuwarisu: "fuwarisu",
};

function baseSpeciesId(monster) {
  return BASE_SPECIES[monster.speciesId] || monster.speciesId;
}

export function breedMonsters(parentA, parentB) {
  const candidates = [baseSpeciesId(parentA), baseSpeciesId(parentB)].sort();
  const seed = parentA.uid + parentB.uid + parentA.level + parentB.level;
  const speciesId = candidates[seed % candidates.length];
  const child = createMonster(speciesId, 1);

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

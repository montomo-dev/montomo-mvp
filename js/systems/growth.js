export function expToNext(level) {
  return level * 20;
}

export function statsFor(species, level) {
  const b = species.base;
  const g = species.growth;
  const n = level - 1;
  return {
    maxHp: Math.round(b.hp + g.hp * n),
    atk: Math.round(b.atk + g.atk * n),
    def: Math.round(b.def + g.def * n),
    spd: Math.round(b.spd + g.spd * n),
  };
}

export function gainExp(monster, speciesTable, amount) {
  const events = [];
  let species = speciesTable[monster.speciesId];
  monster.exp += amount;
  while (monster.exp >= expToNext(monster.level)) {
    monster.exp -= expToNext(monster.level);
    monster.level += 1;
    const before = { maxHp: monster.maxHp, atk: monster.atk, def: monster.def, spd: monster.spd };
    const after = statsFor(species, monster.level);
    monster.maxHp = after.maxHp;
    monster.atk = after.atk;
    monster.def = after.def;
    monster.spd = after.spd;
    monster.hp = Math.min(monster.maxHp, monster.hp + (after.maxHp - before.maxHp));
    const learned = [];
    for (const entry of species.learnset) {
      if (entry.level === monster.level && !monster.skills.includes(entry.skill)) {
        monster.skills.push(entry.skill);
        learned.push(entry.skill);
      }
    }
    events.push({
      type: "levelup",
      level: monster.level,
      name: monster.name,
      gains: {
        maxHp: after.maxHp - before.maxHp,
        atk: after.atk - before.atk,
        def: after.def - before.def,
        spd: after.spd - before.spd,
      },
      learned,
    });

    if (species.evolvesAt && monster.level >= species.evolvesAt) {
      const fromName = monster.name;
      const evolved = speciesTable[species.evolvesTo];
      const evoBefore = { maxHp: monster.maxHp, atk: monster.atk, def: monster.def, spd: monster.spd };
      const evoAfter = statsFor(evolved, monster.level);
      monster.speciesId = evolved.id;
      monster.name = evolved.name;
      monster.maxHp = evoAfter.maxHp;
      monster.atk = evoAfter.atk;
      monster.def = evoAfter.def;
      monster.spd = evoAfter.spd;
      monster.hp = Math.min(monster.maxHp, monster.hp + (evoAfter.maxHp - evoBefore.maxHp));
      species = evolved;
      events.push({ type: "evolve", level: monster.level, from: fromName, to: evolved.name });
    }
  }
  return events;
}

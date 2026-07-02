import test from "node:test";
import assert from "node:assert/strict";

import { createMonster, rollWildSpecies } from "../js/data/monsters.js";
import { breedMonsters } from "../js/systems/breeding.js";

test("レア枠は乱数5%未満でツキノネになる", () => {
  assert.equal(rollWildSpecies(() => 0.049), "tsukinone");
});

test("5%以上では通常モンスターになる", () => {
  const values = [0.05, 0];
  assert.equal(rollWildSpecies(() => values.shift()), "dogura");
});

test("配合で親を残したままLv.1の子と継承技が生まれる", () => {
  const parentA = createMonster("mofuri", 3);
  const parentB = createMonster("hibachi", 3);
  const { child, inheritedSkill } = breedMonsters(parentA, parentB);

  assert.equal(child.level, 1);
  assert.deepEqual(child.parents, [parentA.uid, parentB.uid]);
  assert.ok(inheritedSkill);
  assert.ok(child.skills.includes(inheritedSkill));
  assert.equal(parentA.level, 3);
  assert.equal(parentB.level, 3);
});

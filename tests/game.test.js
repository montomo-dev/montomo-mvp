import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createMonster, rollWildSpecies, SPECIES } from "../js/data/monsters.js";
import { getStage, STAGES } from "../js/data/stages.js";
import { breedMonsters } from "../js/systems/breeding.js";
import { depositToRanch } from "../js/systems/party.js";
import { ITEMS } from "../js/data/items.js";

test("レア枠は乱数5%未満でツキノネになる", () => {
  assert.equal(rollWildSpecies(undefined, () => 0.049), "tsukinone");
});

test("5%以上では通常モンスターになる", () => {
  const values = [0.05, 0];
  assert.equal(rollWildSpecies(undefined, () => values.shift()), "dogura");
});

test("新しい野生モンスターが出現表に入っている", () => {
  assert.equal(rollWildSpecies(undefined, () => 0.999), "tsuboco");
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

test("追加した3体も個体生成できる", () => {
  const paper = createMonster("orihiko", 2);
  const wood = createMonster("kiboko", 2);
  const pot = createMonster("tsuboco", 2);

  assert.equal(paper.name, "オリヒコ");
  assert.equal(wood.name, "キボコ");
  assert.equal(pot.name, "ツボコ");
  assert.ok(paper.maxHp > 0);
  assert.ok(wood.maxHp > 0);
  assert.ok(pot.maxHp > 0);
});

test("配合専用キャラは特定の組み合わせからだけ生まれる", () => {
  const a = createMonster("mofuri", 4);
  const b = createMonster("pyokotan", 4);
  const c = createMonster("hibachi", 4);
  const d = createMonster("pachikoro", 4);
  const e = createMonster("dogura", 4);
  const f = createMonster("fuwarisu", 4);

  assert.equal(breedMonsters(a, b).child.speciesId, "obako");
  assert.equal(breedMonsters(c, d).child.speciesId, "kurista");
  assert.equal(breedMonsters(e, f).child.speciesId, "hagumon");
});

test("stage3 は cave の先にあり、ボス地形を持つ", () => {
  const stage2 = getStage("stage2");
  const cave = getStage(stage2.nextStage);
  const stage3 = getStage(cave.nextStage);

  assert.equal(stage3.id, "stage3");
  assert.equal(cave.id, "cave");
  assert.equal(stage3.prevStage, "cave");
  assert.ok(stage3.layout.some((row) => row.includes("4")));
});

test("最後の1体も牧場に預けられる", () => {
  const party = [createMonster("mofuri", 2)];
  const ranch = [];

  assert.equal(depositToRanch(party, ranch, 0), true);
  assert.equal(party.length, 0);
  assert.equal(ranch.length, 1);
});

test("新アイテム3種類が items.js に存在する", () => {
  assert.ok(ITEMS.atkSeed);
  assert.equal(ITEMS.atkSeed.kind, "stat_boost");
  assert.equal(ITEMS.atkSeed.stat, "atk");
  assert.ok(ITEMS.defSeed);
  assert.equal(ITEMS.defSeed.stat, "def");
  assert.ok(ITEMS.premiumBait);
  assert.equal(ITEMS.premiumBait.kind, "bait");
  assert.ok(ITEMS.premiumBait.value > ITEMS.bait.value);
});

test("落ちものは全ステージで有効なアイテムを指している", () => {
  for (const [id, stage] of Object.entries(STAGES)) {
    for (const item of stage.groundItems || []) {
      assert.ok(ITEMS[item.itemId], `${id} の ${item.id} の itemId '${item.itemId}' が items.js に存在しない`);
    }
  }
});

test("落ちものは種類が2種類以上に多様化されている", () => {
  const kinds = new Set();
  for (const stage of Object.values(STAGES)) {
    for (const item of stage.groundItems || []) {
      kinds.add(item.itemId);
    }
  }
  assert.ok(kinds.size >= 2, `アイテム種類=${kinds.size}種 期待2種以上`);
});

test("全モンスターに専用の描画関数(PAINTERS)が登録されている", async () => {
  const src = await readFile(new URL("../js/sprites.js", import.meta.url), "utf8");
  const painterKeys = [...src.matchAll(/^\s*(\w+):\s*paint\w+,/gm)].map((m) => m[1]);
  for (const id of Object.keys(SPECIES)) {
    assert.ok(
      painterKeys.includes(id),
      `${id} 用の描画関数が PAINTERS に登録されていない（他モンスターの見た目にフォールバックしてしまう）`
    );
  }
});

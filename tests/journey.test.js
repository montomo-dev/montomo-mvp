import test from "node:test";
import assert from "node:assert/strict";
import { journeyGoal } from "../js/systems/journey.js";
import { STAGES } from "../js/data/stages.js";
import { createMonster } from "../js/data/monsters.js";

function gameState() {
  return {
    lang: "ja", party: [createMonster("mofuri", 3)], ranch: [],
    flags: { stageClearedFlags: {} }, dex: { seen: [], caught: [] },
    input: { isHeld: () => false, wasPressed: () => false },
    save: () => true, items: {}, money: 100,
  };
}

test("the first meadow teaches recruitment without adding quest state to an old save", () => {
  const game = gameState();
  const before = JSON.stringify(game);
  assert.equal(journeyGoal(game, STAGES.stage1).id, "first-friend");
  assert.equal(JSON.stringify(game), before);
  game.ranch.push(createMonster("hibachi", 1));
  assert.equal(journeyGoal(game, STAGES.stage1).id, "explore");
});

test("low HP takes priority where recovery is available; towns point to actual facilities", () => {
  const game = gameState();
  game.party[0].hp = 1;
  assert.equal(journeyGoal(game, STAGES.stage1).id, "rest");
  game.party[0].hp = game.party[0].maxHp;
  assert.equal(journeyGoal(game, STAGES.town1).id, "town");
});

test("guardian guidance uses the current area's clear flag, not an earlier forest victory", () => {
  const game = gameState();
  game.flags.bossDefeated = true;
  game.flags.stageClearedFlags.stage3 = true;
  assert.equal(journeyGoal(game, STAGES.sea_stage3).id, "guardian");
  game.flags.stageClearedFlags.sea_stage3 = true;
  game.lang = "en";
  const goal = journeyGoal(game, STAGES.sea_stage3);
  assert.equal(goal.id, "explore");
  assert.equal(goal.title, `Next stop: ${STAGES.snow_stage1.nameEn}`);
});

globalThis.document ??= {
  getElementById: () => ({ style: {}, classList: { add() {}, remove() {} }, addEventListener() {}, removeEventListener() {} }),
};
const { FieldScene } = await import("../js/scenes/field.js");

test("walking interpolates only the drawing, while collisions retain integer tile coordinates", () => {
  const game = gameState();
  const field = new FieldScene(game, "stage1");
  game.input.isHeld = (action) => action === "right";
  field.update(0.016);
  assert.deepEqual(field.player, { x: 3, y: 10 });
  assert.deepEqual(field.visualPlayerPosition(), { x: 2, y: 10 });
  game.input.isHeld = () => false;
  field.update(0.06);
  assert.deepEqual(field.visualPlayerPosition(), { x: 2.5, y: 10 });
  field.update(0.06);
  assert.deepEqual(field.visualPlayerPosition(), field.player);
  game.input.isHeld = (action) => action === "down";
  field.update(0.1);
  assert.deepEqual(field.player, { x: 3, y: 10 }, "the wall below the player must block movement");
});

test("warp, restored coordinates and reduced motion never interpolate from a stale tile", () => {
  const game = gameState();
  const field = new FieldScene(game, "stage1");
  game.input.isHeld = (action) => action === "right";
  field.update(0.016);
  game.reduceMotion = true;
  assert.deepEqual(field.visualPlayerPosition(), field.player);
  game.reduceMotion = false;
  field.player = { x: 5, y: 8 };
  assert.deepEqual(field.visualPlayerPosition(), field.player);
  field.setStage("sea_town1");
  assert.equal(field.stepVisual, null);
  assert.deepEqual(field.visualPlayerPosition(), STAGES.sea_town1.spawns.start);
});

test("a short tap released between frames still moves exactly one tile", () => {
  const game = gameState();
  const field = new FieldScene(game, "stage1");
  game.input.wasPressed = (action) => action === "right";
  field.update(0.016);
  assert.deepEqual(field.player, { x: 3, y: 10 });
  game.input.wasPressed = () => false;
  field.update(0.2);
  assert.deepEqual(field.player, { x: 3, y: 10 });
});

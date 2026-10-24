import test from "node:test";
import assert from "node:assert/strict";
import { BattleFeedback } from "../js/systems/battleFeedback.js";
import { createMonster } from "../js/data/monsters.js";

test("feedback follows the exact damage message, then expires without firing again", () => {
  const feedback = new BattleFeedback();
  const monster = { hp: 20 };
  // Identical text in one turn must still refer to the correct target and index.
  const other = { hp: 20 };
  const turn = ["Attack!", "8 damage"];
  feedback.record(turn, { monster, amount: 8 });
  turn.push("Next attack!", "8 damage");
  feedback.record(turn, { monster: other, amount: 8, strong: true });
  feedback.begin(turn);
  assert.equal(feedback.visualFor(monster), null);
  feedback.advance();
  assert.equal(feedback.visualFor(monster).amount, 8);
  assert.equal(feedback.visualFor(other), null);
  feedback.update(1);
  assert.equal(feedback.visualFor(monster), null);
  feedback.update(1);
  assert.equal(feedback.visualFor(monster), null);
  feedback.advance();
  feedback.advance();
  assert.equal(feedback.visualFor(other).strong, true);
  assert.equal(monster.hp, 20, "presentation never mutates HP");
});

test("reduced motion retains damage text but removes shake, flash, and number travel", () => {
  const feedback = new BattleFeedback();
  const monster = {};
  const messages = ["Damage"];
  feedback.record(messages, { monster, amount: 15, strong: true });
  feedback.begin(messages);
  feedback.update(0.08);
  const full = feedback.visualFor(monster);
  const reduced = feedback.visualFor(monster, true);
  assert.notEqual(full.offsetX, 0);
  assert.ok(full.glow > 0);
  assert.ok(full.rise > 0);
  assert.equal(reduced.offsetX, 0);
  assert.equal(reduced.glow, 0);
  assert.equal(reduced.rise, 0);
  assert.equal(reduced.amount, 15);
  assert.equal(feedback.visualFor({}), null, "a replacement ally must not inherit its predecessor's damage cue");
});

test("zero damage produces no impact cue, and a new queue clears stale feedback", () => {
  const feedback = new BattleFeedback();
  const monster = {};
  const immune = ["No effect"];
  feedback.record(immune, { monster, amount: 0 });
  feedback.begin(immune);
  assert.equal(feedback.visualFor(monster), null);
  const hit = ["Hit"];
  feedback.record(hit, { monster, amount: 4 });
  feedback.begin(hit);
  assert.ok(feedback.visualFor(monster));
  feedback.begin(["New turn"]);
  assert.equal(feedback.visualFor(monster), null);
});

test("combat HP resolves synchronously while visual impact waits for its message", async () => {
  globalThis.document ??= { getElementById: () => ({ style: {}, classList: { add() {}, remove() {} } }) };
  const { BattleScene } = await import("../js/scenes/battle.js");
  const game = {
    party: [createMonster("mofuri", 5)], ranch: [], items: {}, dex: { seen: [], caught: [] },
    flags: {}, lang: "ja", save: () => true, input: { wasPressed: () => false },
  };
  const battle = new BattleScene(game, createMonster("dogura", 5));
  const before = battle.enemy.hp;
  const messages = [];
  battle.performAction(battle.ally, battle.enemy, { type: "attack" }, messages);
  assert.ok(battle.enemy.hp < before, "the simulation still completes before returning");
  battle.say(messages, "command");
  assert.equal(battle.feedback.visualFor(battle.enemy), null);
  game.input.wasPressed = (key) => key === "ok";
  battle.update(0.016);
  assert.ok(battle.feedback.visualFor(battle.enemy));
  assert.ok(battle.queue[0].includes("ダメージ"));
  game.input.wasPressed = () => false;
  battle.update(1);
  assert.equal(battle.feedback.visualFor(battle.enemy), null);
  battle.update(0.016);
  assert.equal(battle.feedback.visualFor(battle.enemy), null, "waiting on a message never restarts the effect");
});

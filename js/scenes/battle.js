import { SKILLS } from "../data/skills.js";
import { SPECIES } from "../data/monsters.js";
import { ITEMS } from "../data/items.js";
import { gainExp, expToNext } from "../systems/growth.js";
import { MAX_PARTY, moveToFront, depositToRanch } from "../systems/party.js";
import { markSeen, markCaught } from "../systems/dex.js";
import { drawMonster } from "../sprites.js";
import { EndingScene } from "./ending.js";
import { ChoiceScene } from "./choice.js";
import { panel, hpBar, FONT, FONT_BOLD } from "../ui.js";
import { getRank } from "../systems/rank.js";
import { sfxHit, sfxFaint, sfxLevelUp, sfxEvolve, sfxCatchSuccess, sfxCatchFail, sfxConfirm, sfxCancel, sfxCry } from "../audio.js";
import { typeOf, typeEffectiveness } from "../data/types.js";
import { STATUS_LABEL, maybeInflictStatus, canAct, applyEndOfTurnStatus, clearStatus } from "../systems/status.js";

function effectivenessMessage(eff) {
  if (eff === 0) return "こうかが ないようだ…";
  if (eff > 1) return "こうかは ばつぐんだ！";
  if (eff < 1) return "こうかは いまひとつの ようだ…";
  return null;
}

const COMMANDS = ["こうげき", "スキル", "なかまにさそう", "どうぐ", "こうかん", "にげる", "ぼうぎょ"];
const COMMAND_COLS = [[0, 2, 4, 6], [1, 3, 5]];
const COMMAND_POS = [
  [70, 398], [330, 398],
  [70, 418], [330, 418],
  [70, 438], [330, 438],
  [70, 458],
];
const GUARD_DAMAGE_RATIO = 0.4;

export class BattleScene {
  constructor(game, enemy, opts = {}) {
    this.game = game;
    this.ally = game.party[0];
    if (!this.ally) throw new Error("BattleScene requires at least one party monster");
    this.enemy = enemy;
    this.isBoss = !!opts.isBoss;
    this.stageId = opts.stageId;
    this.bossAI = this.isBoss ? SPECIES[enemy.speciesId].bossAI || null : null;
    this.bossState = { phase: 0, turn: 0, charging: false, chargeDamage: 0 };
    this.allyGuarding = false;
    markSeen(game, enemy.speciesId);
    sfxCry(enemy.speciesId);
    this.time = 0;
    this.cursor = 0;
    this.skillCursor = 0;
    this.switchCursor = 0;
    this.shownHp = { ally: this.ally.hp, enemy: enemy.hp };
    this.phase = "message";
    this.after = "command";
    this.recruitedMonster = null;
    this.rosterChoice = null;
    this.queue = [
      this.isBoss
        ? `もりの ${enemy.name} が たちはだかった！`
        : `やせいの ${enemy.name} が とびだしてきた！`,
    ];
  }

  say(messages, after) {
    this.queue = messages;
    this.after = after;
    this.phase = "message";
  }

  enterNext() {
    if (this.after === "command") {
      this.phase = "command";
      return;
    }
    if (this.after === "chooseRoster") {
      this.phase = "chooseRoster";
      this.rosterChoice = null;
      return;
    }
    if (this.after === "ending") {
      if (this.stageId === "stage3") {
        this.game.changeScene(new ChoiceScene(this.game));
      } else if (this.stageId === "reverse_stage3") {
        this.game.changeScene(new EndingScene(this.game, {
          nextStageId: "sea_stage1",
          subtitle: "ウラノヌシを のりこえ、きみと なかまは さらに つよく なった。",
        }));
      } else if (this.stageId === "sea_stage3") {
        this.game.changeScene(new EndingScene(this.game, {
          nextStageId: "snow_stage1",
          subtitle: "シンカイヌシを のりこえ、きみと なかまは でんせつに なった。",
        }));
      } else if (this.stageId === "snow_stage3") {
        this.game.changeScene(new EndingScene(this.game, {
          nextStageId: "desert_stage1",
          subtitle: "ヒョウガヌシを のりこえ、きみと なかまは でんせつに なった。",
        }));
      } else if (this.stageId === "desert_stage3") {
        this.game.changeScene(new EndingScene(this.game, {
          nextStageId: "factory_stage1",
          subtitle: "スナヌシを のりこえ、きみと なかまは でんせつに なった。",
        }));
      } else if (this.stageId === "factory_stage3") {
        this.game.changeScene(new EndingScene(this.game, {
          nextStageId: "castle_stage1",
          subtitle: "コウジョウヌシを のりこえ、きみと なかまは でんせつに なった。",
        }));
      } else if (this.stageId === "castle_stage3") {
        this.game.changeScene(new EndingScene(this.game, {
          subtitle: "マオウを のりこえ、ぼうけんは ついに おわりを むかえた…！",
        }));
      } else {
        this.game.changeScene(new EndingScene(this.game));
      }
      return;
    }
    if (this.after === "gameover") {
      for (const m of this.game.party) m.hp = m.maxHp;
      this.game.field.resetPosition();
      this.game.field.showToast("いえまで はこばれて かいふくした…");
    }
    for (const m of this.game.party) clearStatus(m);
    this.game.save();
    this.game.changeScene(this.game.field);
  }

  update(dt) {
    this.time += dt;
    const follow = Math.min(1, dt * 8);
    this.shownHp.ally += (this.ally.hp - this.shownHp.ally) * follow;
    this.shownHp.enemy += (this.enemy.hp - this.shownHp.enemy) * follow;

    const input = this.game.input;
    if (this.phase === "message") {
      if (input.wasPressed("ok")) {
        this.queue.shift();
        if (this.queue.length === 0) this.enterNext();
      }
    } else if (this.phase === "command") {
      const col = COMMAND_COLS[0].includes(this.cursor) ? 0 : 1;
      const colList = COMMAND_COLS[col];
      const idx = colList.indexOf(this.cursor);
      if (input.wasPressed("up")) this.cursor = colList[(idx + colList.length - 1) % colList.length];
      if (input.wasPressed("down")) this.cursor = colList[(idx + 1) % colList.length];
      if (input.wasPressed("left") || input.wasPressed("right")) {
        const otherList = COMMAND_COLS[1 - col];
        this.cursor = otherList[Math.min(idx, otherList.length - 1)];
      }
      if (input.wasPressed("ok")) this.chooseCommand(this.cursor);
    } else if (this.phase === "skill") {
      const skills = this.ally.skills;
      if (input.wasPressed("up")) this.skillCursor = (this.skillCursor + skills.length - 1) % skills.length;
      if (input.wasPressed("down")) this.skillCursor = (this.skillCursor + 1) % skills.length;
      if (input.wasPressed("cancel")) { sfxCancel(); this.phase = "command"; }
      else if (input.wasPressed("ok")) {
        this.resolveTurn({ type: "skill", skillId: skills[this.skillCursor] });
      }
    } else if (this.phase === "item") {
      const owned = this.ownedItemIds();
      if (input.wasPressed("cancel")) { sfxCancel(); this.phase = "command"; return; }
      if (owned.length === 0) return;
      if (input.wasPressed("up")) this.itemCursor = (this.itemCursor + owned.length - 1) % owned.length;
      if (input.wasPressed("down")) this.itemCursor = (this.itemCursor + 1) % owned.length;
      if (input.wasPressed("ok")) this.useItem(owned[this.itemCursor]);
    } else if (this.phase === "chooseRoster") {
      if (input.wasPressed("ok") || input.wasPressed("left")) {
        this.rosterChoice = "party";
        this.confirmRosterChoice();
      } else if (input.wasPressed("cancel") || input.wasPressed("right")) {
        this.rosterChoice = "ranch";
        this.confirmRosterChoice();
      }
    } else if (this.phase === "switch") {
      const entries = this.switchableEntries();
      if (input.wasPressed("cancel")) { sfxCancel(); this.phase = "command"; return; }
      if (entries.length === 0) return;
      if (input.wasPressed("up")) this.switchCursor = (this.switchCursor + entries.length - 1) % entries.length;
      if (input.wasPressed("down")) this.switchCursor = (this.switchCursor + 1) % entries.length;
      if (input.wasPressed("ok")) this.resolveTurn({ type: "switch", index: entries[this.switchCursor].i });
    }
  }

  switchableEntries() {
    const activeIndex = this.game.party.indexOf(this.ally);
    return this.game.party
      .map((m, i) => ({ m, i }))
      .filter(({ m, i }) => i !== activeIndex && m.hp > 0);
  }

  confirmRosterChoice() {
    const name = this.recruitedMonster.name;
    if (this.rosterChoice === "party") {
      this.game.party.push(this.recruitedMonster);
      this.say([`${name} が なかまに くわわった！`], "end");
    } else {
      this.game.ranch.push(this.recruitedMonster);
      this.say([`${name} を まきばに おくった。`], "end");
    }
    this.recruitedMonster = null;
    this.game.save();
  }

  ownedItemIds() {
    return Object.keys(this.game.items || {}).filter((id) => this.game.items[id] > 0);
  }

  chooseCommand(index) {
    sfxConfirm();
    if (index === 0) {
      this.resolveTurn({ type: "attack" });
    } else if (index === 1) {
      if (this.ally.skills.length === 0) {
        this.say(["まだ スキルを おぼえていない！"], "command");
      } else {
        this.phase = "skill";
        this.skillCursor = 0;
      }
    } else if (index === 2) {
      this.tryRecruit();
    } else if (index === 3) {
      if (this.ownedItemIds().length === 0) {
        this.say(["どうぐを もっていない！"], "command");
      } else {
        this.phase = "item";
        this.itemCursor = 0;
      }
    } else if (index === 4) {
      if (this.switchableEntries().length === 0) {
        this.say(["ほかに たたかえる なかまが いない！"], "command");
      } else {
        this.phase = "switch";
        this.switchCursor = 0;
      }
    } else if (index === 5) {
      this.tryFlee();
    } else {
      this.resolveTurn({ type: "guard" });
    }
  }

  useItem(itemId) {
    const item = ITEMS[itemId];
    this.game.items[itemId]--;
    if (item.kind === "heal") {
      const before = this.ally.hp;
      this.ally.hp = Math.min(this.ally.maxHp, this.ally.hp + item.value);
      const healed = this.ally.hp - before;
      const messages = [`${this.ally.name} に ${item.name}を つかった！`, `HPが ${healed} かいふくした！`];
      this.enemyAct(messages);
      this.finishTurn(messages);
    } else if (item.kind === "bait") {
      this.pendingBaitBonus = item.value;
      const messages = [`${item.name}を なげた！`, `${this.enemy.name}が きょうみを しめしている…`];
      this.enemyAct(messages);
      this.finishTurn(messages);
    } else if (item.kind === "stat_boost") {
      this.ally[item.stat] += item.value;
      const label = item.stat === "atk" ? "こうげき" : item.stat === "def" ? "ぼうぎょ" : item.stat === "spd" ? "すばやさ" : item.stat;
      const messages = [`${this.ally.name} に ${item.name}を つかった！`, `${label}が ${item.value} あがった！`];
      this.enemyAct(messages);
      this.finishTurn(messages);
    }
  }

  performAction(actor, target, action, messages) {
    const skill = action.type === "skill" ? SKILLS[action.skillId] : null;
    messages.push(skill ? `${actor.name} の ${skill.name}！` : `${actor.name} の こうげき！`);
    const accuracy = skill ? skill.accuracy : 100;
    if (Math.random() * 100 >= accuracy) {
      messages.push("しかし はずれてしまった！");
      return;
    }
    const power = skill ? skill.power : 1.0;
    const atkType = skill ? skill.type : typeOf(actor.speciesId);
    const eff = typeEffectiveness(atkType, typeOf(target.speciesId));
    let damage = Math.max(1, Math.round(actor.atk * power - target.def / 2 + (Math.random() * 4 - 2)));
    if (actor.status === "burn") damage = Math.round(damage * 0.5);
    damage = eff === 0 ? 0 : Math.max(1, Math.round(damage * eff));
    if (target === this.ally && this.allyGuarding) {
      damage = Math.max(eff === 0 ? 0 : 1, Math.round(damage * GUARD_DAMAGE_RATIO));
      messages.push(`${target.name} は ぼうぎょで こうげきを うけながした！`);
    }
    target.hp = Math.max(0, target.hp - damage);
    if (target === this.enemy && this.bossState.charging) {
      this.bossState.chargeDamage += damage;
    }
    messages.push(`${target.name} に ${damage} の ダメージ！`);
    const effMsg = effectivenessMessage(eff);
    if (effMsg) messages.push(effMsg);
    if (target.hp <= 0) sfxFaint();
    else sfxHit();
    if (eff > 0) maybeInflictStatus(atkType, target, messages);
  }

  enemyAct(messages) {
    if (this.bossAI) {
      this.bossEnemyAct(messages);
      return;
    }
    const useSkill = this.enemy.skills.length > 0 && Math.random() < 0.5;
    const action = useSkill
      ? { type: "skill", skillId: this.enemy.skills[Math.floor(Math.random() * this.enemy.skills.length)] }
      : { type: "attack" };
    this.performAction(this.enemy, this.ally, action, messages);
  }

  bossEnemyAct(messages) {
    const state = this.bossState;
    const charge = this.bossAI.charge;
    if (state.charging) {
      const breakLine = Math.round(this.enemy.maxHp * charge.breakRatio);
      state.charging = false;
      if (state.chargeDamage >= breakLine) {
        state.chargeDamage = 0;
        messages.push(`${this.enemy.name} は ひるんで ためた ちからが きえてしまった！`);
        return;
      }
      state.chargeDamage = 0;
      this.releaseChargedAttack(messages);
      return;
    }
    state.turn += 1;
    if (charge && state.turn % charge.interval === 0) {
      state.charging = true;
      state.chargeDamage = 0;
      messages.push(`${this.enemy.name} は ちからを ためはじめた…！`);
      if (state.turn === charge.interval) {
        messages.push("「ぼうぎょ」で みをまもるか、こうげきを あてて ひるませろ！");
      }
      return;
    }
    const enraged = state.phase > 0;
    const skills = this.enemy.skills;
    let action = { type: "attack" };
    if (skills.length > 0 && Math.random() < (enraged ? 0.75 : 0.5)) {
      const skillId = enraged && Math.random() < 0.7
        ? skills.reduce((a, b) => (SKILLS[a].power >= SKILLS[b].power ? a : b))
        : skills[Math.floor(Math.random() * skills.length)];
      action = { type: "skill", skillId };
    }
    this.performAction(this.enemy, this.ally, action, messages);
  }

  releaseChargedAttack(messages) {
    const charge = this.bossAI.charge;
    messages.push(`${this.enemy.name} の ${charge.name}！`);
    const eff = typeEffectiveness(typeOf(this.enemy.speciesId), typeOf(this.ally.speciesId));
    let damage = Math.max(1, Math.round(this.enemy.atk * charge.power - this.ally.def / 2 + (Math.random() * 4 - 2)));
    damage = eff === 0 ? 0 : Math.max(1, Math.round(damage * eff));
    if (this.allyGuarding) {
      damage = Math.max(eff === 0 ? 0 : 1, Math.round(damage * GUARD_DAMAGE_RATIO));
      messages.push(`${this.ally.name} は ぼうぎょで なんとか こらえた！`);
    }
    this.ally.hp = Math.max(0, this.ally.hp - damage);
    messages.push(`${this.ally.name} に ${damage} の ダメージ！`);
    const effMsg = effectivenessMessage(eff);
    if (effMsg) messages.push(effMsg);
    if (this.ally.hp <= 0) sfxFaint();
    else sfxHit();
  }

  checkBossPhase(messages) {
    if (!this.bossAI?.phases || this.enemy.hp <= 0) return;
    while (this.bossState.phase < this.bossAI.phases.length) {
      const next = this.bossAI.phases[this.bossState.phase];
      if (this.enemy.hp / this.enemy.maxHp > next.below) break;
      this.bossState.phase += 1;
      this.enemy.atk = Math.round(this.enemy.atk * next.atkMul);
      this.enemy.spd = Math.round(this.enemy.spd * next.spdMul);
      messages.push(next.message);
    }
  }

  resolveTurn(playerAction) {
    const messages = [];
    this.allyGuarding = playerAction.type === "guard";
    if (playerAction.type === "switch") {
      moveToFront(this.game.party, playerAction.index);
      this.ally = this.game.party[0];
      this.shownHp.ally = this.ally.hp;
      messages.push(`${this.ally.name} に こうたいした！`);
    } else if (this.allyGuarding) {
      messages.push(`${this.ally.name} は みを まもっている！`);
    }
    const allyFirst =
      this.ally.spd > this.enemy.spd ||
      (this.ally.spd === this.enemy.spd && Math.random() < 0.5);
    const order = allyFirst ? ["ally", "enemy"] : ["enemy", "ally"];
    for (const side of order) {
      if (this.ally.hp <= 0 || this.enemy.hp <= 0) break;
      if (side === "ally") {
        if (playerAction.type === "guard" || playerAction.type === "switch") continue;
        if (!canAct(this.ally, messages)) continue;
        this.performAction(this.ally, this.enemy, playerAction, messages);
        this.checkBossPhase(messages);
      } else {
        if (!canAct(this.enemy, messages)) continue;
        this.enemyAct(messages);
      }
    }
    this.allyGuarding = false;
    if (this.ally.hp > 0) applyEndOfTurnStatus(this.ally, messages);
    if (this.enemy.hp > 0) applyEndOfTurnStatus(this.enemy, messages);
    this.finishTurn(messages);
  }

  finishTurn(messages) {
    if (this.enemy.hp <= 0) {
      this.victory(messages);
      return;
    }
    if (this.ally.hp <= 0) {
      messages.push(`${this.ally.name} は たおれてしまった…`);
      const nextIndex = this.game.party.findIndex((m) => m.hp > 0);
      if (nextIndex !== -1) {
        moveToFront(this.game.party, nextIndex);
        this.ally = this.game.party[0];
        this.shownHp.ally = this.ally.hp;
        messages.push(`${this.ally.name}、たのんだよ！`);
        this.say(messages, "command");
        return;
      }
      messages.push("めのまえが まっくらに なった…");
      this.say(messages, "gameover");
      return;
    }
    this.say(messages, "command");
  }

  victory(messages) {
    const enemySpecies = SPECIES[this.enemy.speciesId];
    const exp = enemySpecies.exp * this.enemy.level;
    const money = Math.max(3, Math.round(enemySpecies.exp * this.enemy.level * 0.4));
    this.game.money = (this.game.money || 0) + money;
    messages.push(
      `${this.enemy.name} を たおした！`,
      `${this.ally.name} は けいけんち ${exp} を てにいれた！`,
      `${money} えんを ひろった！`
    );
    for (const event of gainExp(this.ally, SPECIES, exp)) {
      if (event.type === "evolve") {
        messages.push(`${event.from} は ${event.to} に しんかした！`);
        markCaught(this.game, event.speciesId);
        sfxEvolve();
        continue;
      }
      messages.push(`${event.name} は レベル ${event.level} に あがった！`);
      sfxLevelUp();
      const g = event.gains;
      messages.push(`HP+${g.maxHp}  こうげき+${g.atk}  ぼうぎょ+${g.def}  すばやさ+${g.spd}`);
      for (const skillId of event.learned) {
        messages.push(`あたらしい スキル「${SKILLS[skillId].name}」を おぼえた！`);
      }
    }

    // 控え(パーティの他のメンバー)は50%、牧場は10%のけいけんちを分けあう
    const reserveExp = Math.round(exp * 0.5);
    const reserveEvolutions = [];
    for (const member of this.game.party) {
      if (member === this.ally) continue;
      for (const event of gainExp(member, SPECIES, reserveExp)) {
        if (event.type === "evolve") {
          reserveEvolutions.push(event);
          markCaught(this.game, event.speciesId);
        }
      }
    }
    for (const event of reserveEvolutions) {
      messages.push(`ひかえの ${event.from} は ${event.to} に しんかした！`);
    }
    if (reserveEvolutions.length === 0 && this.game.party.length > 1) {
      messages.push("ひかえの なかまも けいけんちを わけあった。");
    }

    const ranchExp = Math.round(exp * 0.1);
    for (const member of this.game.ranch || []) {
      for (const event of gainExp(member, SPECIES, ranchExp)) {
        if (event.type === "evolve") markCaught(this.game, event.speciesId);
      }
    }

    if (this.isBoss) {
      if (!this.game.flags.stageClearedFlags) {
        this.game.flags.stageClearedFlags = {};
      }
      this.game.flags.stageClearedFlags[this.stageId] = true;
      this.game.flags.bossDefeated = true;
      this.game.save();
      messages.push(`${this.enemy.name} を のりこえた…！`);
      this.say(messages, "ending");
    } else {
      this.say(messages, "end");
    }
  }

  tryRecruit() {
    if (this.isBoss) {
      this.say(["ヌシは なかまに なる きは なさそうだ！"], "command");
      return;
    }
    if (this.game.party.length >= MAX_PARTY) {
      this.say(["これいじょう なかまは つれて いけない！"], "command");
      return;
    }
    const species = SPECIES[this.enemy.speciesId];
    const hpBonus = (1 - this.enemy.hp / this.enemy.maxHp) * 0.55;
    const baitBonus = this.pendingBaitBonus || 0;
    this.pendingBaitBonus = 0;
    const chance = Math.min(0.9, species.recruitEase + hpBonus + baitBonus);
    const percentage = Math.round(chance * 100);
    const messages = [
      `${this.ally.name} は ${this.enemy.name} を なかまに さそった！`,
      `せいこうりつ ${percentage}%`,
    ];
    if (Math.random() < chance) {
      this.enemy.hp = this.enemy.maxHp;
      clearStatus(this.enemy);
      markCaught(this.game, this.enemy.speciesId);
      messages.push(
        `${this.enemy.name} は うれしそうに ちかづいてきた！`,
        `${this.enemy.name} が なかまに くわわった！`
      );
      this.recruitedMonster = this.enemy;
      sfxCatchSuccess();
      this.say(messages, "chooseRoster");
    } else {
      messages.push(`${this.enemy.name} は そっぽを むいてしまった…`);
      sfxCatchFail();
      this.enemyAct(messages);
      this.finishTurn(messages);
    }
  }

  tryFlee() {
    const chance = Math.max(0.25, Math.min(0.9, 0.55 + (this.ally.spd - this.enemy.spd) * 0.04));
    if (Math.random() < chance) {
      this.say([`${this.ally.name} は うまく にげだした！`], "end");
    } else {
      const messages = ["にげられなかった！"];
      this.enemyAct(messages);
      this.finishTurn(messages);
    }
  }

  draw(ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, 480);
    bg.addColorStop(0, "#cdeefc");
    bg.addColorStop(1, "#e9f8d8");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = "#d4eeb0";
    ctx.beginPath();
    ctx.ellipse(470, 208, 115, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(170, 348, 100, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.enemy.hp > 0 || this.shownHp.enemy > 0.5) {
      drawMonster(ctx, this.enemy.speciesId, 470, 150, 1.6, this.time);
    }
    drawMonster(ctx, this.ally.speciesId, 170, 305, 1.3, this.time + 1.7, this.ally.tintHue || 0);

    panel(ctx, 16, 14, 250, 64);
    ctx.fillStyle = "#3a3a52";
    ctx.font = FONT_BOLD;
    ctx.textAlign = "left";
    const rareLabel = SPECIES[this.enemy.speciesId].rare ? "  ★レア" : "";
    const rank = getRank(SPECIES[this.enemy.speciesId]);
    const enemyType = typeOf(this.enemy.speciesId);
    const enemyStatus = this.enemy.status ? `  [${STATUS_LABEL[this.enemy.status]}]` : "";
    ctx.fillText(`${this.enemy.name}  Lv.${this.enemy.level}  [${rank}] ${enemyType}${rareLabel}${enemyStatus}`, 30, 40);
    hpBar(ctx, 30, 52, 220, 12, this.shownHp.enemy / this.enemy.maxHp);

    panel(ctx, 372, 234, 252, 108);
    ctx.fillStyle = "#3a3a52";
    ctx.font = FONT_BOLD;
    const allyStatus = this.ally.status ? `  [${STATUS_LABEL[this.ally.status]}]` : "";
    ctx.fillText(`${this.ally.name}  Lv.${this.ally.level}  ${typeOf(this.ally.speciesId)}${allyStatus}`, 388, 262);
    hpBar(ctx, 388, 274, 220, 14, this.shownHp.ally / this.ally.maxHp);
    ctx.font = FONT;
    ctx.fillText(`HP ${Math.max(0, Math.round(this.shownHp.ally))} / ${this.ally.maxHp}`, 388, 310);
    ctx.fillText(`つぎのレベルまで あと ${expToNext(this.ally.level) - this.ally.exp}`, 388, 332);

    panel(ctx, 12, 344, 616, 128);
    ctx.fillStyle = "#3a3a52";
    if (this.phase === "message") {
      ctx.font = FONT_BOLD;
      const text = this.queue[0] || "";
      this.drawWrapped(ctx, text, 36, 384, 34);
      if (Math.sin(this.time * 6) > 0) {
        ctx.fillText("▼", 596, 452);
      }
    } else if (this.phase === "command") {
      ctx.font = FONT;
      ctx.fillText(`${this.ally.name} は どうする？`, 36, 374);
      ctx.font = FONT_BOLD;
      COMMANDS.forEach((command, i) => {
        ctx.fillText(command, COMMAND_POS[i][0], COMMAND_POS[i][1]);
        if (this.cursor === i) ctx.fillText("▶", COMMAND_POS[i][0] - 26, COMMAND_POS[i][1]);
      });
    } else if (this.phase === "skill") {
      ctx.font = FONT;
      ctx.fillText("どの スキルを つかう？（X: もどる）", 36, 374);
      ctx.font = FONT_BOLD;
      this.ally.skills.forEach((skillId, i) => {
        const y = 402 + i * 26;
        ctx.fillText(`${SKILLS[skillId].name}（${SKILLS[skillId].type}）`, 70, y);
        if (this.skillCursor === i) ctx.fillText("▶", 44, y);
      });
    } else if (this.phase === "item") {
      ctx.font = FONT;
      ctx.fillText("どの どうぐを つかう？（X: もどる）", 36, 374);
      ctx.font = FONT_BOLD;
      const owned = this.ownedItemIds();
      owned.forEach((itemId, i) => {
        const y = 402 + i * 26;
        const item = ITEMS[itemId];
        ctx.fillText(`${item.name} × ${this.game.items[itemId]}`, 70, y);
        if (this.itemCursor === i) ctx.fillText("▶", 44, y);
      });
    } else if (this.phase === "chooseRoster") {
      ctx.font = FONT;
      ctx.fillText("どこに いれますか？", 36, 374);
      ctx.font = FONT_BOLD;
      const choices = [
        { label: "てもちに いれる", y: 402, key: "Z" },
        { label: "まきばに おくる", y: 428, key: "X" },
      ];
      choices.forEach(({ label, y, key }) => {
        ctx.fillText(label, 70, y);
        ctx.fillText(`(${key})`, 240, y);
      });
    } else if (this.phase === "switch") {
      ctx.font = FONT;
      ctx.fillText("だれと こうたいする？（X: もどる）", 36, 374);
      ctx.font = FONT_BOLD;
      this.switchableEntries().forEach(({ m }, i) => {
        const y = 400 + i * 24;
        const statusLabel = m.status ? `［${STATUS_LABEL[m.status]}］` : "";
        ctx.fillText(`${m.name}  Lv.${m.level}  HP ${m.hp}/${m.maxHp} ${statusLabel}`, 70, y);
        if (this.switchCursor === i) ctx.fillText("▶", 44, y);
      });
    }
  }

  drawWrapped(ctx, text, x, y, maxChars) {
    for (let i = 0, line = 0; i < text.length; i += maxChars, line++) {
      ctx.fillText(text.slice(i, i + maxChars), x, y + line * 28);
    }
  }
}

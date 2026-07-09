import { SKILLS } from "../data/skills.js";
import { SPECIES, monsterName, createMonster } from "../data/monsters.js";
import { ITEMS } from "../data/items.js";
import { gainExp, expToNext, MAX_LEVEL } from "../systems/growth.js";
import { MAX_PARTY, moveToFront } from "../systems/party.js";
import { markSeen, markCaught } from "../systems/dex.js";
import { drawMonster } from "../sprites.js";
import { EndingScene } from "./ending.js";
import { ChoiceScene } from "./choice.js";
import { panel, hpBar, FONT, FONT_BOLD } from "../ui.js";
import { getRank } from "../systems/rank.js";
import { sfxHit, sfxFaint, sfxLevelUp, sfxEvolve, sfxCatchSuccess, sfxCatchFail, sfxConfirm, sfxCancel, sfxCry } from "../audio.js";
import { typeOf, typeEffectiveness, typeNameEn } from "../data/types.js";
import { STATUS_LABEL, STATUS_LABEL_EN, maybeInflictStatus, canAct, applyEndOfTurnStatus, clearStatus } from "../systems/status.js";
import { effectiveDef } from "../systems/equipment.js";
import { SHINY_HUE } from "../systems/shiny.js";
import { bossIntroText, bossVictoryLines } from "../data/story.js";
import { tr } from "../i18n.js";
import { playBgm } from "../music.js";

function effectivenessMessage(game, eff) {
  if (eff === 0) return tr(game, "こうかが ないようだ…", "It doesn't seem to be effective...");
  if (eff > 1) return tr(game, "こうかは ばつぐんだ！", "It's super effective!");
  if (eff < 1) return tr(game, "こうかは いまひとつの ようだ…", "It's not very effective...");
  return null;
}

function skillName(game, id) {
  return tr(game, SKILLS[id].name, SKILLS[id].nameEn);
}
function itemName(game, item) {
  return tr(game, item.name, item.nameEn);
}
function statusLabel(game, status) {
  return tr(game, STATUS_LABEL[status], STATUS_LABEL_EN[status]);
}

const COMMANDS_JA = ["こうげき", "スキル", "なかまにさそう", "どうぐ", "こうかん", "にげる", "ぼうぎょ"];
const COMMANDS_EN = ["Attack", "Skill", "Scout", "Item", "Switch", "Flee", "Guard"];
const COMMAND_COLS = [[0, 2, 4, 6], [1, 3, 5]];
const COMMAND_POS = [
  [70, 398], [330, 398],
  [70, 418], [330, 418],
  [70, 438], [330, 438],
  [70, 458],
];
const GUARD_DAMAGE_RATIO = 0.4;
const REFERENCE_RECRUIT_EASE = 0.15;

// 全滅時に失う「重要でない」回復アイテム。安価なポーションから優先して失う
const UNIMPORTANT_HEAL_ITEMS = ["potionS", "potionM"];

function loseUnimportantItems(game, count) {
  let remaining = count;
  let lostTotal = 0;
  for (const itemId of UNIMPORTANT_HEAL_ITEMS) {
    if (remaining <= 0) break;
    const have = game.items[itemId] || 0;
    const lose = Math.min(have, remaining);
    game.items[itemId] = have - lose;
    remaining -= lose;
    lostTotal += lose;
  }
  return lostTotal;
}

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
    this.totalDamageDealt = 0;
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
    const enemyName = monsterName(enemy, game.lang);
    this.queue = [
      this.isBoss
        ? bossIntroText(enemy.speciesId, enemyName, game.lang)
        : tr(game, `やせいの ${enemyName} が とびだしてきた！`, `A wild ${enemyName} jumped out!`),
    ];
    playBgm(this.isBoss ? "boss" : "battle");
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
      if (this.recruitedMonster) {
        if (this.game.party.length < MAX_PARTY) this.game.party.push(this.recruitedMonster);
        else (this.game.ranch = this.game.ranch || []).push(this.recruitedMonster);
        this.recruitedMonster = null;
      }
      if (this.stageId === "stage3") {
        this.game.changeScene(new ChoiceScene(this.game));
      } else if (this.stageId === "reverse_stage3") {
        this.game.changeScene(new EndingScene(this.game, {
          nextStageId: "sea_stage1",
          subtitle: "ウラノヌシを のりこえ、きみと なかまは さらに つよく なった。",
          subtitleEn: "You overcame Reverse Nushi, and you and your friends grew even stronger.",
        }));
      } else if (this.stageId === "sea_stage3") {
        this.game.changeScene(new EndingScene(this.game, {
          nextStageId: "snow_stage1",
          subtitle: "シンカイヌシを のりこえ、きみと なかまは でんせつに なった。",
          subtitleEn: "You overcame Sea Nushi, and you and your friends became legendary.",
        }));
      } else if (this.stageId === "snow_stage3") {
        this.game.changeScene(new EndingScene(this.game, {
          nextStageId: "desert_stage1",
          subtitle: "ヒョウガヌシを のりこえ、きみと なかまは でんせつに なった。",
          subtitleEn: "You overcame Hyouga Nushi, and you and your friends became legendary.",
        }));
      } else if (this.stageId === "desert_stage3") {
        this.game.changeScene(new EndingScene(this.game, {
          nextStageId: "factory_stage1",
          subtitle: "スナヌシを のりこえ、きみと なかまは でんせつに なった。",
          subtitleEn: "You overcame Suna Nushi, and you and your friends became legendary.",
        }));
      } else if (this.stageId === "factory_stage3") {
        this.game.changeScene(new EndingScene(this.game, {
          nextStageId: "castle_stage1",
          subtitle: "コウジョウヌシを のりこえ、きみと なかまは でんせつに なった。",
          subtitleEn: "You overcame Koujou Nushi, and you and your friends became legendary.",
        }));
      } else if (this.stageId === "castle_stage3") {
        this.game.changeScene(new EndingScene(this.game, {
          subtitle: "マオウを のりこえ、ぼうけんは ついに おわりを むかえた…！",
          subtitleEn: "You overcame the Demon Lord, and the adventure has finally come to an end...!",
        }));
      } else {
        this.game.changeScene(new EndingScene(this.game));
      }
      return;
    }
    if (this.after === "gameover") {
      for (const m of this.game.party) { m.hp = m.maxHp; m.mp = m.maxMp; }
      this.game.field.resetPosition();

      const moneyBefore = this.game.money || 0;
      this.game.money = Math.floor(moneyBefore / 2);
      const lostMoney = moneyBefore - this.game.money;
      const lostItems = loseUnimportantItems(this.game, 3);

      let message = tr(this.game, "いえまで はこばれて かいふくした…", "You were carried home and healed up...");
      if (lostMoney > 0) message += tr(this.game, ` おかねを ${lostMoney}えん おとした…`, ` You dropped ${lostMoney} money...`);
      if (lostItems > 0) message += tr(this.game, ` どうぐを ${lostItems}こ なくした…`, ` You lost ${lostItems} item(s)...`);
      this.game.field.showToast(message);
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
        const skillId = skills[this.skillCursor];
        if ((this.ally.mp || 0) < SKILLS[skillId].mpCost) {
          sfxCancel();
          this.say([tr(this.game, "MPが たりない！", "Not enough MP!")], "command");
        } else {
          this.resolveTurn({ type: "skill", skillId });
        }
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
    const name = monsterName(this.recruitedMonster, this.game.lang);
    if (this.rosterChoice === "party" && this.game.party.length < MAX_PARTY) {
      this.game.party.push(this.recruitedMonster);
      this.say([tr(this.game, `${name} が なかまに くわわった！`, `${name} joined your team!`)], "end");
    } else {
      this.game.ranch.push(this.recruitedMonster);
      const message = this.rosterChoice === "party"
        ? tr(this.game, `てもちが いっぱいなので、${name} を まきばに おくった。`, `Your party is full, so ${name} was sent to the ranch.`)
        : tr(this.game, `${name} を まきばに おくった。`, `Sent ${name} to the ranch.`);
      this.say([message], "end");
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
        this.say([tr(this.game, "まだ スキルを おぼえていない！", "No skills learned yet!")], "command");
      } else {
        this.phase = "skill";
        this.skillCursor = 0;
      }
    } else if (index === 2) {
      this.tryRecruit();
    } else if (index === 3) {
      if (this.ownedItemIds().length === 0) {
        this.say([tr(this.game, "どうぐを もっていない！", "You don't have any items!")], "command");
      } else {
        this.phase = "item";
        this.itemCursor = 0;
      }
    } else if (index === 4) {
      if (this.switchableEntries().length === 0) {
        this.say([tr(this.game, "ほかに たたかえる なかまが いない！", "No other party members can fight!")], "command");
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
    const allyName = monsterName(this.ally, this.game.lang);
    const iName = itemName(this.game, item);
    if (item.kind === "heal") {
      const before = this.ally.hp;
      this.ally.hp = Math.min(this.ally.maxHp, this.ally.hp + item.value);
      const healed = this.ally.hp - before;
      const messages = [
        tr(this.game, `${allyName} に ${iName}を つかった！`, `Used ${iName} on ${allyName}!`),
        tr(this.game, `HPが ${healed} かいふくした！`, `Restored ${healed} HP!`),
      ];
      if (item.cureStatus && this.ally.status) {
        messages.push(tr(this.game, `${allyName} の じょうたいいじょうが なおった！`, `${allyName}'s status ailment was cured!`));
        clearStatus(this.ally);
      }
      this.enemyAct(messages);
      this.finishTurn(messages);
    } else if (item.kind === "bait") {
      this.pendingBaitBonus = 1 + item.value;
      const enemyName = monsterName(this.enemy, this.game.lang);
      const messages = [
        tr(this.game, `${iName}を なげた！`, `Threw ${iName}!`),
        tr(this.game, `${enemyName}が きょうみを しめしている…`, `${enemyName} looks interested...`),
      ];
      this.enemyAct(messages);
      this.finishTurn(messages);
    } else if (item.kind === "stat_boost") {
      this.ally[item.stat] += item.value;
      const label = tr(
        this.game,
        item.stat === "atk" ? "こうげき" : item.stat === "def" ? "ぼうぎょ" : item.stat === "spd" ? "すばやさ" : item.stat,
        item.stat === "atk" ? "Attack" : item.stat === "def" ? "Defense" : item.stat === "spd" ? "Speed" : item.stat
      );
      const messages = [
        tr(this.game, `${allyName} に ${iName}を つかった！`, `Used ${iName} on ${allyName}!`),
        tr(this.game, `${label}が ${item.value} あがった！`, `${label} rose by ${item.value}!`),
      ];
      this.enemyAct(messages);
      this.finishTurn(messages);
    }
  }

  performAction(actor, target, action, messages) {
    const skill = action.type === "skill" ? SKILLS[action.skillId] : null;
    const actorName = monsterName(actor, this.game.lang);
    const targetName = monsterName(target, this.game.lang);
    if (skill) actor.mp = Math.max(0, (actor.mp || 0) - skill.mpCost);
    messages.push(
      skill
        ? tr(this.game, `${actorName} の ${skillName(this.game, action.skillId)}！`, `${actorName} used ${skillName(this.game, action.skillId)}!`)
        : tr(this.game, `${actorName} の こうげき！`, `${actorName} attacked!`)
    );
    const accuracy = skill ? skill.accuracy : 100;
    if (Math.random() * 100 >= accuracy) {
      messages.push(tr(this.game, "しかし はずれてしまった！", "But it missed!"));
      return;
    }
    const power = skill ? skill.power : 1.0;
    const atkType = skill ? skill.type : typeOf(actor.speciesId);
    const eff = typeEffectiveness(atkType, typeOf(target.speciesId));
    let damage = Math.max(1, Math.round(actor.atk * power - effectiveDef(target) / 2 + (Math.random() * 4 - 2)));
    if (actor.status === "burn") damage = Math.round(damage * 0.5);
    damage = eff === 0 ? 0 : Math.max(1, Math.round(damage * eff));
    if (target === this.ally && this.allyGuarding) {
      damage = Math.max(eff === 0 ? 0 : 1, Math.round(damage * GUARD_DAMAGE_RATIO));
      messages.push(tr(this.game, `${targetName} は ぼうぎょで こうげきを うけながした！`, `${targetName} guarded and softened the blow!`));
    }
    target.hp = Math.max(0, target.hp - damage);
    if (target === this.enemy) {
      this.totalDamageDealt += damage;
      if (this.bossState.charging) this.bossState.chargeDamage += damage;
    }
    messages.push(tr(this.game, `${targetName} に ${damage} の ダメージ！`, `${damage} damage to ${targetName}!`));
    const effMsg = effectivenessMessage(this.game, eff);
    if (effMsg) messages.push(effMsg);
    if (target.hp <= 0) sfxFaint();
    else sfxHit();
    if (eff > 0) maybeInflictStatus(atkType, target, messages, this.game);
  }

  affordableSkills(monster) {
    return monster.skills.filter((id) => (monster.mp || 0) >= SKILLS[id].mpCost);
  }

  enemyAct(messages) {
    if (this.bossAI) {
      this.bossEnemyAct(messages);
      return;
    }
    const usable = this.affordableSkills(this.enemy);
    const useSkill = usable.length > 0 && Math.random() < 0.5;
    const action = useSkill
      ? { type: "skill", skillId: usable[Math.floor(Math.random() * usable.length)] }
      : { type: "attack" };
    this.performAction(this.enemy, this.ally, action, messages);
  }

  bossEnemyAct(messages) {
    const state = this.bossState;
    const charge = this.bossAI.charge;
    const enemyName = monsterName(this.enemy, this.game.lang);
    if (state.charging) {
      const breakLine = Math.round(this.enemy.maxHp * charge.breakRatio);
      state.charging = false;
      if (state.chargeDamage >= breakLine) {
        state.chargeDamage = 0;
        messages.push(tr(this.game, `${enemyName} は ひるんで ためた ちからが きえてしまった！`, `${enemyName} flinched and lost its stored power!`));
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
      messages.push(tr(this.game, `${enemyName} は ちからを ためはじめた…！`, `${enemyName} began gathering power...!`));
      if (state.turn === charge.interval) {
        messages.push(tr(this.game, "「ぼうぎょ」で みをまもるか、こうげきを あてて ひるませろ！", "Guard to protect yourself, or land a hit to make it flinch!"));
      }
      return;
    }
    const enraged = state.phase > 0;
    const skills = this.affordableSkills(this.enemy);
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
    const enemyName = monsterName(this.enemy, this.game.lang);
    const allyName = monsterName(this.ally, this.game.lang);
    const chargeName = tr(this.game, charge.name, charge.nameEn || charge.name);
    messages.push(tr(this.game, `${enemyName} の ${chargeName}！`, `${enemyName} used ${chargeName}!`));
    const eff = typeEffectiveness(typeOf(this.enemy.speciesId), typeOf(this.ally.speciesId));
    let damage = Math.max(1, Math.round(this.enemy.atk * charge.power - effectiveDef(this.ally) / 2 + (Math.random() * 4 - 2)));
    damage = eff === 0 ? 0 : Math.max(1, Math.round(damage * eff));
    if (this.allyGuarding) {
      damage = Math.max(eff === 0 ? 0 : 1, Math.round(damage * GUARD_DAMAGE_RATIO));
      messages.push(tr(this.game, `${allyName} は ぼうぎょで なんとか こらえた！`, `${allyName} managed to endure it by guarding!`));
    }
    this.ally.hp = Math.max(0, this.ally.hp - damage);
    messages.push(tr(this.game, `${allyName} に ${damage} の ダメージ！`, `${damage} damage to ${allyName}!`));
    const effMsg = effectivenessMessage(this.game, eff);
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
      messages.push(tr(this.game, next.message, next.messageEn || next.message));
    }
  }

  resolveTurn(playerAction) {
    const messages = [];
    this.allyGuarding = playerAction.type === "guard";
    if (playerAction.type === "switch") {
      moveToFront(this.game.party, playerAction.index);
      this.ally = this.game.party[0];
      this.shownHp.ally = this.ally.hp;
      messages.push(tr(this.game, `${monsterName(this.ally, this.game.lang)} に こうたいした！`, `Switched to ${monsterName(this.ally, this.game.lang)}!`));
    } else if (this.allyGuarding) {
      messages.push(tr(this.game, `${monsterName(this.ally, this.game.lang)} は みを まもっている！`, `${monsterName(this.ally, this.game.lang)} is guarding!`));
    }
    const allyFirst =
      this.ally.spd > this.enemy.spd ||
      (this.ally.spd === this.enemy.spd && Math.random() < 0.5);
    const order = allyFirst ? ["ally", "enemy"] : ["enemy", "ally"];
    for (const side of order) {
      if (this.ally.hp <= 0 || this.enemy.hp <= 0) break;
      if (side === "ally") {
        if (playerAction.type === "guard" || playerAction.type === "switch") continue;
        if (!canAct(this.ally, messages, this.game)) continue;
        this.performAction(this.ally, this.enemy, playerAction, messages);
        this.checkBossPhase(messages);
      } else {
        if (!canAct(this.enemy, messages, this.game)) continue;
        this.enemyAct(messages);
      }
    }
    this.allyGuarding = false;
    if (this.ally.hp > 0) applyEndOfTurnStatus(this.ally, messages, this.game);
    if (this.enemy.hp > 0) applyEndOfTurnStatus(this.enemy, messages, this.game);
    this.finishTurn(messages);
  }

  finishTurn(messages) {
    if (this.enemy.hp <= 0) {
      this.victory(messages);
      return;
    }
    if (this.ally.hp <= 0) {
      const allyName = monsterName(this.ally, this.game.lang);
      messages.push(tr(this.game, `${allyName} は たおれてしまった…`, `${allyName} fainted...`));
      const nextIndex = this.game.party.findIndex((m) => m.hp > 0);
      if (nextIndex !== -1) {
        moveToFront(this.game.party, nextIndex);
        this.ally = this.game.party[0];
        this.shownHp.ally = this.ally.hp;
        messages.push(tr(this.game, `${monsterName(this.ally, this.game.lang)}、たのんだよ！`, `Go, ${monsterName(this.ally, this.game.lang)}!`));
        this.say(messages, "command");
        return;
      }
      messages.push(tr(this.game, "めのまえが まっくらに なった…", "Everything went dark before your eyes..."));
      this.say(messages, "gameover");
      return;
    }
    this.say(messages, "command");
  }

  victory(messages) {
    playBgm("victory", { loop: false });
    const enemySpecies = SPECIES[this.enemy.speciesId];
    const exp = enemySpecies.exp * this.enemy.level;
    const money = Math.max(3, Math.round(enemySpecies.exp * this.enemy.level * 0.4));
    this.game.money = (this.game.money || 0) + money;
    const enemyName = monsterName(this.enemy, this.game.lang);
    const allyName = monsterName(this.ally, this.game.lang);
    messages.push(
      tr(this.game, `${enemyName} を たおした！`, `Defeated ${enemyName}!`),
      tr(this.game, `${allyName} は けいけんち ${exp} を てにいれた！`, `${allyName} gained ${exp} EXP!`),
      tr(this.game, `${money} えんを ひろった！`, `Found ${money} money!`)
    );
    for (const event of gainExp(this.ally, SPECIES, exp)) {
      if (event.type === "evolve") {
        const fromName = tr(this.game, event.from, SPECIES[event.fromSpeciesId]?.nameEn || event.from);
        const toName = tr(this.game, event.to, SPECIES[event.speciesId]?.nameEn || event.to);
        messages.push(tr(this.game, `${fromName} は ${toName} に しんかした！`, `${fromName} evolved into ${toName}!`));
        markCaught(this.game, event.speciesId);
        sfxEvolve();
        continue;
      }
      const levelupName = tr(this.game, event.name, SPECIES[event.speciesId]?.nameEn || event.name);
      messages.push(tr(this.game, `${levelupName} は レベル ${event.level} に あがった！`, `${levelupName} reached level ${event.level}!`));
      sfxLevelUp();
      const g = event.gains;
      messages.push(
        tr(
          this.game,
          `HP+${g.maxHp}  こうげき+${g.atk}  ぼうぎょ+${g.def}  すばやさ+${g.spd}`,
          `HP+${g.maxHp}  ATK+${g.atk}  DEF+${g.def}  SPD+${g.spd}`
        )
      );
      for (const skillId of event.learned) {
        messages.push(tr(this.game, `あたらしい スキル「${skillName(this.game, skillId)}」を おぼえた！`, `Learned the new skill "${skillName(this.game, skillId)}"!`));
      }
    }

    // 控え(パーティの他のメンバー)は50%、牧場は10%のけいけんちを分けあう
    const reserveExp = Math.round(exp * 0.5);
    const reserveEvolutions = [];
    for (const member of this.game.party) {
      if (member === this.ally || member.hp <= 0) continue;
      for (const event of gainExp(member, SPECIES, reserveExp)) {
        if (event.type === "evolve") {
          reserveEvolutions.push(event);
          markCaught(this.game, event.speciesId);
        }
      }
    }
    for (const event of reserveEvolutions) {
      const fromName = tr(this.game, event.from, SPECIES[event.fromSpeciesId]?.nameEn || event.from);
      const toName = tr(this.game, event.to, SPECIES[event.speciesId]?.nameEn || event.to);
      messages.push(tr(this.game, `ひかえの ${fromName} は ${toName} に しんかした！`, `Your reserve ${fromName} evolved into ${toName}!`));
    }
    if (reserveEvolutions.length === 0 && this.game.party.length > 1) {
      messages.push(tr(this.game, "ひかえの なかまも けいけんちを わけあった。", "Your reserve party members also shared in the EXP."));
    }

    const ranchExp = Math.round(exp * 0.1);
    for (const member of this.game.ranch || []) {
      if (member.hp <= 0) continue;
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
      messages.push(...bossVictoryLines(this.enemy.speciesId, enemyName, this.game.lang));
      this.say(messages, "ending");
    } else {
      this.say(messages, "end");
    }
  }

  tryRecruit() {
    if (this.isBoss) {
      this.tryRecruitBoss();
      return;
    }
    const species = SPECIES[this.enemy.speciesId];
    const baitMultiplier = this.pendingBaitBonus || 1;
    this.pendingBaitBonus = 0;
    // なかまにさそう率(%) = { (こうげき力比率 × 50) + (累計ダメージ ÷ 敵の最大HP × 50) } × 肉ボーナス × レア度倍率 ÷ (所持数+1)
    // こうげき力比率が基礎値になる(一撃も与えていなくても、自分の実力に応じてチャンスがある)。
    // そこに、実際に与えたダメージの分だけ上乗せがつく。少しでもダメージを与えるほど成功率が上がる。
    // レア度倍率は recruitEase を基準値(0.15)で正規化したもの。
    // 同じ種族を既に持っているほど成功率が下がり、図鑑コンプリートへの意欲を保つ
    const rarityMultiplier = species.recruitEase / REFERENCE_RECRUIT_EASE;
    const ownedCount = [...this.game.party, ...(this.game.ranch || [])]
      .filter((m) => m.speciesId === this.enemy.speciesId).length;
    const powerRate = (this.ally.atk / this.enemy.atk) * 50;
    const damageRate = (this.totalDamageDealt / this.enemy.maxHp) * 50;
    const chance = Math.max(0, Math.min(1,
      ((powerRate + damageRate) * baitMultiplier * rarityMultiplier) / 100 / (ownedCount + 1)
    ));
    const percentage = Math.round(chance * 100);
    const allyName = monsterName(this.ally, this.game.lang);
    const enemyName = monsterName(this.enemy, this.game.lang);
    const messages = [
      tr(this.game, `${allyName} は ${enemyName} を なかまに さそった！`, `${allyName} tried to scout ${enemyName}!`),
      tr(this.game, `せいこうりつ ${percentage}%`, `Success rate ${percentage}%`),
    ];
    if (Math.random() < chance) {
      this.enemy.hp = this.enemy.maxHp;
      clearStatus(this.enemy);
      markCaught(this.game, this.enemy.speciesId);
      messages.push(
        tr(this.game, `${enemyName} は うれしそうに ちかづいてきた！`, `${enemyName} approached happily!`),
        tr(this.game, `${enemyName} が なかまに くわわった！`, `${enemyName} joined your team!`)
      );
      this.recruitedMonster = this.enemy;
      sfxCatchSuccess();
      this.say(messages, "chooseRoster");
    } else {
      messages.push(tr(this.game, `${enemyName} は そっぽを むいてしまった…`, `${enemyName} turned away...`));
      sfxCatchFail();
      this.enemyAct(messages);
      this.finishTurn(messages);
    }
  }

  // ヌシは通常の仲間化とは別に、低確率で「なかまに くわわる」ことがある。
  // 成功時もヌシを撃破したのと同じ扱い(ステージクリア・エンディングへ進む)にし、
  // さらに手持ち/牧場にヌシ自身が加わる(進行が飛ばせてしまわないようにするため)
  tryRecruitBoss() {
    const damageRatio = Math.min(1, this.totalDamageDealt / this.enemy.maxHp);
    const chance = Math.min(0.2, 0.03 + damageRatio * 0.17);
    const percentage = Math.round(chance * 100);
    const allyName = monsterName(this.ally, this.game.lang);
    const enemyName = monsterName(this.enemy, this.game.lang);
    const messages = [
      tr(this.game, `${allyName} は ${enemyName} に なかまに なるよう よびかけた！`, `${allyName} called out for ${enemyName} to join!`),
      tr(this.game, `せいこうりつ ${percentage}%`, `Success rate ${percentage}%`),
    ];
    if (Math.random() < chance) {
      this.recruitedMonster = createMonster(this.enemy.speciesId, this.enemy.level);
      this.recruitedMonster.legend = true;
      this.legendCapture = true;
      markCaught(this.game, this.enemy.speciesId);
      messages.push(
        tr(this.game, `${enemyName} は ちからを みとめ、なかまに なった！`, `${enemyName} acknowledged your strength and joined you!`)
      );
      sfxCatchSuccess();
      this.enemy.hp = 0;
      this.victory(messages);
    } else {
      messages.push(tr(this.game, `${enemyName} は なかまに なる きは なさそうだ…`, `${enemyName} shows no sign of wanting to join...`));
      sfxCatchFail();
      this.enemyAct(messages);
      this.finishTurn(messages);
    }
  }

  tryFlee() {
    const chance = Math.max(0.25, Math.min(0.9, 0.55 + (this.ally.spd - this.enemy.spd) * 0.04));
    if (Math.random() < chance) {
      this.say([tr(this.game, `${monsterName(this.ally, this.game.lang)} は うまく にげだした！`, `${monsterName(this.ally, this.game.lang)} got away safely!`)], "end");
    } else {
      const messages = [tr(this.game, "にげられなかった！", "Couldn't get away!")];
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
      drawMonster(ctx, this.enemy.speciesId, 470, 150, 1.6, this.time, this.enemy.shiny ? SHINY_HUE : 0);
    }
    drawMonster(ctx, this.ally.speciesId, 170, 305, 1.3, this.time + 1.7, this.ally.shiny ? SHINY_HUE : (this.ally.tintHue || 0));
    if (this.phase === "message" && ((this.queue[0] || "").includes("しんかした") || (this.queue[0] || "").includes("evolved into"))) {
      this.drawEvolveSparkle(ctx, 170, 305);
    }
    if (this.legendCapture && this.phase === "message" && ((this.queue[0] || "").includes("なかまに なった") || (this.queue[0] || "").includes("joined you"))) {
      this.drawLegendSparkle(ctx, 470, 150);
    }

    panel(ctx, 16, 14, 250, 64);
    ctx.fillStyle = "#3a3a52";
    ctx.font = FONT_BOLD;
    ctx.textAlign = "left";
    const rareLabel = SPECIES[this.enemy.speciesId].rare ? tr(this.game, "  ★レア", "  ★Rare") : "";
    const rank = getRank(SPECIES[this.enemy.speciesId]);
    const enemyType = tr(this.game, typeOf(this.enemy.speciesId), typeNameEn(typeOf(this.enemy.speciesId)));
    const enemyStatus = this.enemy.status ? `  [${statusLabel(this.game, this.enemy.status)}]` : "";
    const ownedLabel = (this.game.dex?.caught || []).includes(this.enemy.speciesId) ? tr(this.game, "  ✓なかまずみ", "  ✓Caught") : "";
    const shinyLabel = this.enemy.shiny ? "✨" : "";
    ctx.fillText(`${shinyLabel}${monsterName(this.enemy, this.game.lang)}  Lv.${this.enemy.level}  [${rank}] ${enemyType}${rareLabel}${enemyStatus}${ownedLabel}`, 30, 40);
    hpBar(ctx, 30, 52, 220, 12, this.shownHp.enemy / this.enemy.maxHp);

    panel(ctx, 372, 234, 252, 108);
    ctx.fillStyle = "#3a3a52";
    ctx.font = FONT_BOLD;
    const allyStatus = this.ally.status ? `  [${statusLabel(this.game, this.ally.status)}]` : "";
    const allyType = tr(this.game, typeOf(this.ally.speciesId), typeNameEn(typeOf(this.ally.speciesId)));
    ctx.fillText(`${monsterName(this.ally, this.game.lang)}  Lv.${this.ally.level}  ${allyType}${allyStatus}`, 388, 262);
    hpBar(ctx, 388, 274, 220, 14, this.shownHp.ally / this.ally.maxHp);
    ctx.font = FONT;
    ctx.fillText(`HP ${Math.max(0, Math.round(this.shownHp.ally))}/${this.ally.maxHp}  MP ${this.ally.mp || 0}/${this.ally.maxMp || 0}`, 388, 310);
    ctx.fillText(
      this.ally.level >= MAX_LEVEL
        ? tr(this.game, "レベル MAX", "Level MAX")
        : tr(this.game, `つぎのレベルまで あと ${expToNext(this.ally.level) - this.ally.exp}`, `${expToNext(this.ally.level) - this.ally.exp} EXP to next level`),
      388, 332
    );

    panel(ctx, 12, 344, 616, 128);
    ctx.fillStyle = "#3a3a52";
    if (this.phase === "message") {
      ctx.font = FONT_BOLD;
      const text = this.queue[0] || "";
      this.drawWrapped(ctx, text, 36, 384, this.game.lang === "en" ? 50 : 34);
      if (Math.sin(this.time * 6) > 0) {
        ctx.fillText("▼", 596, 452);
      }
    } else if (this.phase === "command") {
      ctx.font = FONT;
      ctx.fillText(tr(this.game, `${monsterName(this.ally, this.game.lang)} は どうする？`, `What will ${monsterName(this.ally, this.game.lang)} do?`), 36, 374);
      ctx.font = FONT_BOLD;
      const commands = tr(this.game, COMMANDS_JA, COMMANDS_EN);
      commands.forEach((command, i) => {
        ctx.fillText(command, COMMAND_POS[i][0], COMMAND_POS[i][1]);
        if (this.cursor === i) ctx.fillText("▶", COMMAND_POS[i][0] - 26, COMMAND_POS[i][1]);
      });
    } else if (this.phase === "skill") {
      ctx.font = FONT;
      ctx.fillText(tr(this.game, "どの スキルを つかう？（X: もどる）", "Which skill? (X: Back)"), 36, 374);
      ctx.font = FONT_BOLD;
      this.drawScrollList(ctx, this.ally.skills, this.skillCursor, (skillId, x, y) => {
        const s = SKILLS[skillId];
        const typeLabel = tr(this.game, s.type, typeNameEn(s.type));
        ctx.fillStyle = (this.ally.mp || 0) < s.mpCost ? "#b0455a" : "#3a3a52";
        ctx.fillText(
          tr(this.game, `${skillName(this.game, skillId)}（${typeLabel}）MP${s.mpCost} 命中${s.accuracy}%`, `${skillName(this.game, skillId)} (${typeLabel}) MP${s.mpCost} Acc${s.accuracy}%`),
          x, y
        );
        ctx.fillStyle = "#3a3a52";
      });
    } else if (this.phase === "item") {
      ctx.font = FONT;
      ctx.fillText(tr(this.game, "どの どうぐを つかう？（X: もどる）", "Which item? (X: Back)"), 36, 374);
      ctx.font = FONT_BOLD;
      const owned = this.ownedItemIds();
      this.drawScrollList(ctx, owned, this.itemCursor, (itemId, x, y) => {
        const item = ITEMS[itemId];
        ctx.fillText(`${itemName(this.game, item)} × ${this.game.items[itemId]}`, x, y);
      });
    } else if (this.phase === "chooseRoster") {
      ctx.font = FONT;
      ctx.fillText(tr(this.game, "どこに いれますか？", "Where should it go?"), 36, 374);
      ctx.font = FONT_BOLD;
      const choices = [
        { label: tr(this.game, "てもちに いれる", "Add to party"), y: 402, key: "Z" },
        { label: tr(this.game, "まきばに おくる", "Send to ranch"), y: 428, key: "X" },
      ];
      choices.forEach(({ label, y, key }) => {
        ctx.fillText(label, 70, y);
        ctx.fillText(`(${key})`, 240, y);
      });
    } else if (this.phase === "switch") {
      ctx.font = FONT;
      ctx.fillText(tr(this.game, "だれと こうたいする？（X: もどる）", "Switch to whom? (X: Back)"), 36, 374);
      ctx.font = FONT_BOLD;
      this.switchableEntries().forEach(({ m }, i) => {
        const y = 400 + i * 24;
        const label = m.status ? `［${statusLabel(this.game, m.status)}］` : "";
        ctx.fillText(`${monsterName(m, this.game.lang)}  Lv.${m.level}  HP ${m.hp}/${m.maxHp} ${label}`, 70, y);
        if (this.switchCursor === i) ctx.fillText("▶", 44, y);
      });
    }
  }

  drawWrapped(ctx, text, x, y, maxChars) {
    for (let i = 0, line = 0; i < text.length; i += maxChars, line++) {
      ctx.fillText(text.slice(i, i + maxChars), x, y + line * 28);
    }
  }

  // コマンド欄(y:402〜472)に収まる件数だけ表示し、カーソルに追従してスクロールする
  drawScrollList(ctx, list, cursor, drawRow) {
    const visibleRows = 3;
    const maxScroll = Math.max(0, list.length - visibleRows);
    const scroll = Math.min(maxScroll, Math.max(0, cursor - (visibleRows - 1)));
    list.slice(scroll, scroll + visibleRows).forEach((entry, i) => {
      const y = 402 + i * 26;
      drawRow(entry, 70, y);
      if (cursor === scroll + i) ctx.fillText("▶", 44, y);
    });
    if (scroll > 0) ctx.fillText("▲", 340, 400);
    if (scroll + visibleRows < list.length) ctx.fillText("▼", 340, 460);
  }

  // ヌシがなかまになった瞬間、金色のオーラで演出する
  drawLegendSparkle(ctx, x, y) {
    const t = this.time;
    ctx.save();
    const glow = ctx.createRadialGradient(x, y, 6, x, y, 130);
    glow.addColorStop(0, "rgba(255,224,120,0.6)");
    glow.addColorStop(1, "rgba(255,224,120,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 130, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 12; i++) {
      const angle = t * 1.2 + (i / 12) * Math.PI * 2;
      const r = 80 + Math.sin(t * 4 + i) * 10;
      const sx = x + Math.cos(angle) * r;
      const sy = y + Math.sin(angle) * r * 0.6;
      ctx.fillStyle = i % 2 === 0 ? "#ffd75e" : "#fff7d6";
      ctx.beginPath();
      ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 進化メッセージの表示中、モンスターの周りにきらめきを演出する
  drawEvolveSparkle(ctx, x, y) {
    const t = this.time;
    ctx.save();
    const glow = ctx.createRadialGradient(x, y, 4, x, y, 74);
    glow.addColorStop(0, "rgba(255,250,210,0.55)");
    glow.addColorStop(1, "rgba(255,250,210,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 74, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 7; i++) {
      const angle = t * 1.6 + (i / 7) * Math.PI * 2;
      const r = 48 + Math.sin(t * 3 + i) * 6;
      const sx = x + Math.cos(angle) * r;
      const sy = y + Math.sin(angle) * r * 0.55;
      ctx.fillStyle = "#fff3a0";
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

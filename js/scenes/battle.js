import { SKILLS } from "../data/skills.js";
import { SPECIES } from "../data/monsters.js";
import { ITEMS } from "../data/items.js";
import { gainExp, expToNext } from "../systems/growth.js";
import { MAX_PARTY, moveToFront } from "../systems/party.js";
import { markSeen, markCaught } from "../systems/dex.js";
import { drawMonster } from "../sprites.js";
import { EndingScene } from "./ending.js";
import { ChoiceScene } from "./choice.js";
import { panel, hpBar, FONT, FONT_BOLD } from "../ui.js";

const COMMANDS = ["こうげき", "スキル", "なかまにさそう", "どうぐ", "にげる"];
const COMMAND_COLS = [[0, 2, 4], [1, 3]];
const COMMAND_POS = [[70, 402], [330, 402], [70, 424], [330, 424], [70, 446]];

export class BattleScene {
  constructor(game, enemy, opts = {}) {
    this.game = game;
    this.ally = game.party[0];
    if (!this.ally) throw new Error("BattleScene requires at least one party monster");
    this.enemy = enemy;
    this.isBoss = !!opts.isBoss;
    this.stageId = opts.stageId;
    markSeen(game, enemy.speciesId);
    this.time = 0;
    this.cursor = 0;
    this.skillCursor = 0;
    this.shownHp = { ally: this.ally.hp, enemy: enemy.hp };
    this.phase = "message";
    this.after = "command";
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
      if (input.wasPressed("cancel")) this.phase = "command";
      else if (input.wasPressed("ok")) {
        this.resolveTurn({ type: "skill", skillId: skills[this.skillCursor] });
      }
    } else if (this.phase === "item") {
      const owned = this.ownedItemIds();
      if (input.wasPressed("cancel")) { this.phase = "command"; return; }
      if (owned.length === 0) return;
      if (input.wasPressed("up")) this.itemCursor = (this.itemCursor + owned.length - 1) % owned.length;
      if (input.wasPressed("down")) this.itemCursor = (this.itemCursor + 1) % owned.length;
      if (input.wasPressed("ok")) this.useItem(owned[this.itemCursor]);
    }
  }

  ownedItemIds() {
    return Object.keys(this.game.items || {}).filter((id) => this.game.items[id] > 0);
  }

  chooseCommand(index) {
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
    } else {
      this.tryFlee();
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
    const damage = Math.max(1, Math.round(actor.atk * power - target.def / 2 + (Math.random() * 4 - 2)));
    target.hp = Math.max(0, target.hp - damage);
    messages.push(`${target.name} に ${damage} の ダメージ！`);
  }

  enemyAct(messages) {
    const useSkill = this.enemy.skills.length > 0 && Math.random() < 0.5;
    const action = useSkill
      ? { type: "skill", skillId: this.enemy.skills[Math.floor(Math.random() * this.enemy.skills.length)] }
      : { type: "attack" };
    this.performAction(this.enemy, this.ally, action, messages);
  }

  resolveTurn(playerAction) {
    const messages = [];
    const allyFirst =
      this.ally.spd > this.enemy.spd ||
      (this.ally.spd === this.enemy.spd && Math.random() < 0.5);
    const order = allyFirst ? ["ally", "enemy"] : ["enemy", "ally"];
    for (const side of order) {
      if (this.ally.hp <= 0 || this.enemy.hp <= 0) break;
      if (side === "ally") this.performAction(this.ally, this.enemy, playerAction, messages);
      else this.enemyAct(messages);
    }
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
        continue;
      }
      messages.push(`${event.name} は レベル ${event.level} に あがった！`);
      const g = event.gains;
      messages.push(`HP+${g.maxHp}  こうげき+${g.atk}  ぼうぎょ+${g.def}  すばやさ+${g.spd}`);
      for (const skillId of event.learned) {
        messages.push(`あたらしい スキル「${SKILLS[skillId].name}」を おぼえた！`);
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
      this.game.party.push(this.enemy);
      markCaught(this.game, this.enemy.speciesId);
      messages.push(
        `${this.enemy.name} は うれしそうに ちかづいてきた！`,
        `${this.enemy.name} が なかまに くわわった！`
      );
      this.say(messages, "end");
    } else {
      messages.push(`${this.enemy.name} は そっぽを むいてしまった…`);
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
    ctx.fillText(`${this.enemy.name}  Lv.${this.enemy.level}${rareLabel}`, 30, 40);
    hpBar(ctx, 30, 52, 220, 12, this.shownHp.enemy / this.enemy.maxHp);

    panel(ctx, 372, 234, 252, 108);
    ctx.fillStyle = "#3a3a52";
    ctx.font = FONT_BOLD;
    ctx.fillText(`${this.ally.name}  Lv.${this.ally.level}`, 388, 262);
    hpBar(ctx, 388, 274, 220, 14, this.shownHp.ally / this.ally.maxHp);
    ctx.font = FONT;
    ctx.fillText(`HP ${Math.max(0, Math.round(this.shownHp.ally))} / ${this.ally.maxHp}`, 388, 310);
    ctx.fillText(`つぎのレベルまで あと ${expToNext(this.ally.level) - this.ally.exp}`, 388, 332);

    panel(ctx, 12, 344, 616, 124);
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
        ctx.fillText(SKILLS[skillId].name, 70, y);
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
    }
  }

  drawWrapped(ctx, text, x, y, maxChars) {
    for (let i = 0, line = 0; i < text.length; i += maxChars, line++) {
      ctx.fillText(text.slice(i, i + maxChars), x, y + line * 28);
    }
  }
}

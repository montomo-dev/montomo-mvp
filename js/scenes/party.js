import { SPECIES } from "../data/monsters.js";
import { MAX_PARTY, moveToFront } from "../systems/party.js";
import { breedMonsters } from "../systems/breeding.js";
import { SKILLS } from "../data/skills.js";
import { expToNext } from "../systems/growth.js";
import { drawMonster } from "../sprites.js";
import { panel, hpBar, FONT, FONT_BOLD } from "../ui.js";

export class PartyScene {
  constructor(game, prevScene) {
    this.game = game;
    this.prev = prevScene;
    this.cursor = 0;
    this.time = 0;
    this.mode = "list";
    this.firstParent = null;
    this.message = null;
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    const count = this.game.party.length;
    if (this.message) {
      if (input.wasPressed("ok") || input.wasPressed("cancel")) this.message = null;
      return;
    }
    if (input.wasPressed("cancel")) {
      if (this.mode === "breed") {
        this.mode = "list";
        this.firstParent = null;
        return;
      }
      this.game.save();
      this.game.changeScene(this.prev);
      return;
    }
    if (input.wasPressed("up")) this.cursor = (this.cursor + count - 1) % count;
    if (input.wasPressed("down")) this.cursor = (this.cursor + 1) % count;
    if (this.mode === "list") {
      if (input.wasPressed("right")) this.startBreeding();
      if (input.wasPressed("ok") && this.cursor > 0) {
        moveToFront(this.game.party, this.cursor);
        this.cursor = 0;
        this.game.save();
      }
    } else if (input.wasPressed("ok")) {
      this.chooseParent(this.cursor);
    }
  }

  startBreeding() {
    if (this.game.party.length < 2) {
      this.message = "配合には なかまが 2体 ひつようだよ。";
      return;
    }
    if (this.game.party.length >= MAX_PARTY) {
      this.message = "子どもを むかえる あきが ないよ。";
      return;
    }
    this.mode = "breed";
    this.firstParent = null;
    this.cursor = 0;
  }

  chooseParent(index) {
    const selected = this.game.party[index];
    if (!this.firstParent) {
      this.firstParent = selected;
      return;
    }
    if (selected.uid === this.firstParent.uid) {
      this.message = "ちがう なかまを えらんでね。";
      return;
    }

    const { child, inheritedSkill } = breedMonsters(this.firstParent, selected);
    this.game.party.push(child);
    const skillMessage = inheritedSkill ? ` ${SKILLS[inheritedSkill].name}を うけついだ！` : "";
    this.message = `${child.name}が うまれた！${skillMessage}`;
    this.mode = "list";
    this.firstParent = null;
    this.cursor = this.game.party.length - 1;
    this.game.save();
  }

  draw(ctx) {
    ctx.fillStyle = "#2e3350";
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = "#f0ead8";
    ctx.font = 'bold 24px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("パーティ", 30, 44);

    this.game.party.forEach((monster, i) => {
      const y = 64 + i * 92;
      panel(ctx, 20, y, 600, 84);
      if (this.cursor === i) {
        ctx.beginPath();
        ctx.roundRect(20, y, 600, 84, 10);
        ctx.strokeStyle = "#ffd75e";
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      if (this.mode === "breed" && this.firstParent?.uid === monster.uid) {
        ctx.fillStyle = "#b85c93";
        ctx.beginPath();
        ctx.roundRect(500, y + 48, 100, 24, 12);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = FONT_BOLD;
        ctx.fillText("おや 1", 524, y + 66);
      }
      drawMonster(ctx, monster.speciesId, 70, y + 42, 0.7, this.time + i);
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.fillText(`${monster.name}  Lv.${monster.level}`, 130, y + 32);
      ctx.font = FONT;
      ctx.fillText(SPECIES[monster.speciesId].genus, 300, y + 32);
      hpBar(ctx, 130, y + 46, 190, 12, monster.hp / monster.maxHp);
      ctx.fillText(`${monster.hp} / ${monster.maxHp}`, 335, y + 58);
      ctx.fillText(`つぎのレベルまで あと ${expToNext(monster.level) - monster.exp}`, 130, y + 76);
      if (i === 0) {
        ctx.fillStyle = "#e8842e";
        ctx.beginPath();
        ctx.roundRect(520, y + 14, 80, 28, 14);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = FONT_BOLD;
        ctx.fillText("せんとう", 528, y + 34);
      }
    });

    ctx.fillStyle = "#f0ead8";
    ctx.font = FONT;
    const hint = this.mode === "breed"
      ? this.firstParent
        ? "↑↓: もう1体のおやをえらぶ ／ Z: けってい ／ X: やめる"
        : "↑↓: 1体目のおやをえらぶ ／ Z: けってい ／ X: やめる"
      : "↑↓: えらぶ ／ Z: せんとう ／ →: 配合 ／ X: もどる";
    ctx.fillText(hint, 30, 462);

    if (this.message) {
      panel(ctx, 70, 184, 500, 100);
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.textAlign = "center";
      ctx.fillText(this.message, 320, 232);
      ctx.font = FONT;
      ctx.fillText("Z または X で とじる", 320, 264);
      ctx.textAlign = "left";
    }
  }
}

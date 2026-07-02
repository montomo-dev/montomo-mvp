import { drawMonster } from "../sprites.js";
import { panel, FONT, FONT_BOLD } from "../ui.js";
import { MAX_PARTY, RANCH_CAPACITY, depositToRanch, withdrawFromRanch } from "../systems/party.js";

const ROW_H = 40;
const ROW_GAP = 4;

export class RanchScene {
  constructor(game, prevScene) {
    this.game = game;
    this.prev = prevScene;
    this.cursor = 0;
    this.time = 0;
    this.message = null;
  }

  entries() {
    const party = this.game.party.map((m, i) => ({ m, loc: "party", i }));
    const ranch = this.game.ranch.map((m, i) => ({ m, loc: "ranch", i }));
    return [...party, ...ranch];
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (this.message) {
      if (input.wasPressed("ok") || input.wasPressed("cancel")) this.message = null;
      return;
    }
    if (input.wasPressed("cancel")) {
      this.game.save();
      this.game.changeScene(this.prev);
      return;
    }
    const list = this.entries();
    if (list.length === 0) return;
    if (input.wasPressed("up")) this.cursor = (this.cursor + list.length - 1) % list.length;
    if (input.wasPressed("down")) this.cursor = (this.cursor + 1) % list.length;
    if (input.wasPressed("ok")) this.toggle(list[this.cursor]);
  }

  toggle(entry) {
    if (entry.loc === "party") {
      if (this.game.party.length <= 1) {
        this.message = "さいごの なかまは あずけられないよ。";
        return;
      }
      if (this.game.ranch.length >= RANCH_CAPACITY) {
        this.message = "牧場は もう いっぱいだよ。";
        return;
      }
      const name = entry.m.name;
      depositToRanch(this.game.party, this.game.ranch, entry.i);
      this.message = `${name}を 牧場に あずけた。`;
    } else {
      if (this.game.party.length >= MAX_PARTY) {
        this.message = "パーティが いっぱいだよ。";
        return;
      }
      const name = entry.m.name;
      withdrawFromRanch(this.game.party, this.game.ranch, entry.i);
      this.message = `${name}を むかえいれた！`;
    }
    this.cursor = 0;
    this.game.save();
  }

  drawRow(ctx, monster, x, y, w, highlighted) {
    panel(ctx, x, y, w, ROW_H);
    if (highlighted) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, ROW_H, 8);
      ctx.strokeStyle = "#ffd75e";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    drawMonster(ctx, monster.speciesId, x + 22, y + 26, 0.36, this.time, monster.tintHue || 0);
    ctx.fillStyle = "#3a3a52";
    ctx.font = FONT;
    ctx.textAlign = "left";
    ctx.fillText(`${monster.name} Lv.${monster.level}`, x + 46, y + 17);
    ctx.fillText(`HP ${monster.hp}/${monster.maxHp}`, x + 46, y + 33);
  }

  draw(ctx) {
    ctx.fillStyle = "#2e3350";
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = "#f0ead8";
    ctx.font = 'bold 24px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("牧場", 30, 44);

    let idx = 0;
    ctx.font = FONT_BOLD;
    ctx.fillText(`つれている なかま（${this.game.party.length}/${MAX_PARTY}）`, 30, 70);
    this.game.party.forEach((m, i) => {
      this.drawRow(ctx, m, 30, 78 + i * (ROW_H + ROW_GAP), 580, idx === this.cursor);
      idx++;
    });

    const ranchLabelY = 78 + MAX_PARTY * (ROW_H + ROW_GAP) + 24;
    ctx.font = FONT_BOLD;
    ctx.fillText(`あずけている なかま（${this.game.ranch.length}/${RANCH_CAPACITY}）`, 30, ranchLabelY);
    if (this.game.ranch.length === 0) {
      ctx.font = FONT;
      ctx.fillStyle = "#a8a8c0";
      ctx.fillText("だれも いない", 40, ranchLabelY + 26);
    } else {
      this.game.ranch.forEach((m, i) => {
        this.drawRow(ctx, m, 30, ranchLabelY + 8 + i * (ROW_H + ROW_GAP), 580, idx === this.cursor);
        idx++;
      });
    }

    ctx.fillStyle = "#f0ead8";
    ctx.font = FONT;
    ctx.fillText("↑↓: えらぶ ／ Z: あずける・むかえいれる ／ X: もどる", 30, 462);

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

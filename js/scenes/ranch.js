import { drawMonster } from "../sprites.js";
import { panel, FONT, FONT_BOLD } from "../ui.js";
import { MAX_PARTY, depositToRanch, withdrawFromRanch } from "../systems/party.js";
import { sfxCancel, sfxSelect, sfxConfirm } from "../audio.js";

const ICON_SIZE = 36;
const ICON_GAP = 14;
const ICON_COLS = 6;

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
      sfxCancel();
      this.game.save();
      this.game.changeScene(this.prev);
      return;
    }
    const list = this.entries();
    if (list.length === 0) return;
    if (input.wasPressed("up")) { this.cursor = (this.cursor + list.length - 1) % list.length; sfxSelect(); }
    if (input.wasPressed("down")) { this.cursor = (this.cursor + 1) % list.length; sfxSelect(); }
    if (input.wasPressed("ok")) this.toggle(list[this.cursor]);
  }

  toggle(entry) {
    if (entry.loc === "party") {
      const name = entry.m.name;
      depositToRanch(this.game.party, this.game.ranch, entry.i);
      this.message = `${name}を 牧場に あずけた。`;
      sfxConfirm();
    } else {
      if (this.game.party.length >= MAX_PARTY) {
        this.message = "パーティが いっぱいだよ。";
        sfxCancel();
        return;
      }
      const name = entry.m.name;
      withdrawFromRanch(this.game.party, this.game.ranch, entry.i);
      this.message = `${name}を むかえいれた！`;
      sfxConfirm();
    }
    this.cursor = 0;
    this.game.save();
  }

  drawIcon(ctx, monster, x, y, highlighted) {
    panel(ctx, x, y, ICON_SIZE, ICON_SIZE);
    if (highlighted) {
      ctx.beginPath();
      ctx.roundRect(x, y, ICON_SIZE, ICON_SIZE, 8);
      ctx.strokeStyle = "#ffd75e";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    drawMonster(ctx, monster.speciesId, x + ICON_SIZE / 2, y + ICON_SIZE / 2 + 2, 0.28, this.time, monster.tintHue || 0);
  }

  drawGrid(ctx, list, startX, startY, highlightedIndex, emptyText) {
    if (list.length === 0) {
      ctx.font = FONT;
      ctx.fillStyle = "#a8a8c0";
      ctx.fillText(emptyText, startX + 4, startY + 24);
      return;
    }
    list.forEach((monster, i) => {
      const col = i % ICON_COLS;
      const row = Math.floor(i / ICON_COLS);
      const x = startX + col * (ICON_SIZE + ICON_GAP);
      const y = startY + row * (ICON_SIZE + ICON_GAP);
      this.drawIcon(ctx, monster, x, y, highlightedIndex === i);
    });
  }

  draw(ctx) {
    ctx.fillStyle = "#2e3350";
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = "#f0ead8";
    ctx.font = 'bold 24px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("牧場", 30, 44);

    ctx.font = FONT_BOLD;
    ctx.fillText(`つれている なかま（${this.game.party.length}/${MAX_PARTY}）`, 30, 70);
    this.drawGrid(ctx, this.game.party, 30, 86, this.cursor, "なかまはいない");

    const partyRows = Math.max(1, Math.ceil(this.game.party.length / ICON_COLS));
    const ranchLabelY = 86 + partyRows * (ICON_SIZE + ICON_GAP) + 28;
    ctx.font = FONT_BOLD;
    ctx.fillText(`あずけている なかま（${this.game.ranch.length}）`, 30, ranchLabelY);
    this.drawGrid(ctx, this.game.ranch, 30, ranchLabelY + 14, this.cursor - this.game.party.length, "だれも いない");

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

import { SPECIES } from "../data/monsters.js";
import { drawMonster } from "../sprites.js";
import { panel, FONT, FONT_BOLD } from "../ui.js";

const COLS = 3;
const CELL_W = 186;
const CELL_H = 80;
const GAP = 10;
const ORIGIN_X = 30;
const ORIGIN_Y = 80;

function dexEntries() {
  return Object.values(SPECIES).filter((s) => !s.boss);
}

export class PokedexScene {
  constructor(game, prevScene) {
    this.game = game;
    this.prev = prevScene;
    this.cursor = 0;
    this.time = 0;
    this.entries = dexEntries();
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    const n = this.entries.length;
    if (input.wasPressed("cancel") || input.wasPressed("dex")) {
      this.game.changeScene(this.prev);
      return;
    }
    if (input.wasPressed("right")) this.cursor = (this.cursor + 1) % n;
    if (input.wasPressed("left")) this.cursor = (this.cursor + n - 1) % n;
    if (input.wasPressed("down") && this.cursor + COLS < n) this.cursor += COLS;
    if (input.wasPressed("up") && this.cursor - COLS >= 0) this.cursor -= COLS;
  }

  draw(ctx) {
    ctx.fillStyle = "#2e3350";
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = "#f0ead8";
    ctx.font = 'bold 24px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("図鑑", 30, 44);

    const seen = this.game.dex?.seen || [];
    const caught = this.game.dex?.caught || [];
    ctx.font = FONT;
    ctx.fillText(
      `みつけた ${seen.length}/${this.entries.length}　なかまにした ${caught.length}/${this.entries.length}`,
      210, 44
    );

    this.entries.forEach((species, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = ORIGIN_X + col * (CELL_W + GAP);
      const y = ORIGIN_Y + row * (CELL_H + GAP);
      panel(ctx, x, y, CELL_W, CELL_H);
      if (this.cursor === i) {
        ctx.beginPath();
        ctx.roundRect(x, y, CELL_W, CELL_H, 10);
        ctx.strokeStyle = "#ffd75e";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      const isSeen = seen.includes(species.id);
      const isCaught = caught.includes(species.id);

      if (!isSeen) {
        ctx.fillStyle = "#3a3a52";
        ctx.beginPath();
        ctx.arc(x + 34, y + 46, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f0ead8";
        ctx.font = FONT_BOLD;
        ctx.textAlign = "center";
        ctx.fillText("？", x + 34, y + 54);
        ctx.textAlign = "left";
        ctx.fillStyle = "#8a8aa0";
        ctx.font = FONT;
        ctx.fillText("？？？？？", x + 64, y + 34);
        ctx.fillText("みはっけん", x + 64, y + 56);
        return;
      }

      if (!isCaught) ctx.filter = "grayscale(0.85) brightness(0.9)";
      drawMonster(ctx, species.id, x + 34, y + 50, 0.34, this.time, 0);
      ctx.filter = "none";

      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.fillText(species.name, x + 64, y + 26);
      ctx.font = FONT;
      ctx.fillText(species.genus, x + 64, y + 44);
      if (!isCaught) {
        ctx.fillStyle = "#a8a8c0";
        ctx.fillText("みつけただけ", x + 64, y + 64);
      } else {
        ctx.fillStyle = "#4a8f4a";
        ctx.fillText("なかまにした！", x + 64, y + 64);
      }
    });

    ctx.fillStyle = "#f0ead8";
    ctx.font = FONT;
    ctx.fillText("↑↓←→: えらぶ ／ X: もどる", 30, 462);
  }
}

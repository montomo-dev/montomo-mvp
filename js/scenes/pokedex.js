import { SPECIES } from "../data/monsters.js";
import { drawMonster } from "../sprites.js";
import { panel, FONT, FONT_BOLD } from "../ui.js";

const COLS = 4;
const ROWS = 4;
const PAGE_SIZE = COLS * ROWS;
const CELL_W = 136;
const CELL_H = 78;
const GAP = 8;
const ORIGIN_X = 30;
const ORIGIN_Y = 78;

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

  get totalPages() {
    return Math.max(1, Math.ceil(this.entries.length / PAGE_SIZE));
  }

  get page() {
    return Math.floor(this.cursor / PAGE_SIZE);
  }

  pageEntries() {
    const start = this.page * PAGE_SIZE;
    return this.entries.slice(start, start + PAGE_SIZE);
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
    if (this.totalPages > 1) {
      ctx.textAlign = "right";
      ctx.fillText(`${this.page + 1} / ${this.totalPages} ページ`, 610, 44);
      ctx.textAlign = "left";
    }

    this.pageEntries().forEach((species, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = ORIGIN_X + col * (CELL_W + GAP);
      const y = ORIGIN_Y + row * (CELL_H + GAP);
      const globalIndex = this.page * PAGE_SIZE + i;
      panel(ctx, x, y, CELL_W, CELL_H);
      if (this.cursor === globalIndex) {
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
        ctx.arc(x + 26, y + 40, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f0ead8";
        ctx.font = FONT_BOLD;
        ctx.textAlign = "center";
        ctx.fillText("？", x + 26, y + 47);
        ctx.textAlign = "left";
        ctx.fillStyle = "#8a8aa0";
        ctx.font = '13px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
        ctx.fillText("？？？？", x + 50, y + 30);
        ctx.fillText("みはっけん", x + 50, y + 50);
        return;
      }

      if (!isCaught) ctx.filter = "grayscale(0.85) brightness(0.9)";
      drawMonster(ctx, species.id, x + 26, y + 42, 0.28, this.time, 0);
      ctx.filter = "none";

      ctx.fillStyle = "#3a3a52";
      ctx.font = '13px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      ctx.fillText(species.name, x + 50, y + 20);
      ctx.font = '11px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      ctx.fillText(species.genus, x + 50, y + 36);
      if (!isCaught) {
        ctx.fillStyle = "#a8a8c0";
        ctx.fillText("みつけただけ", x + 50, y + 54);
      } else {
        ctx.fillStyle = "#4a8f4a";
        ctx.fillText("なかまにした！", x + 50, y + 54);
      }
    });

    ctx.fillStyle = "#f0ead8";
    ctx.font = FONT;
    ctx.fillText("↑↓←→: えらぶ・ページ送り ／ X: もどる", 30, 462);
  }
}

import { SPECIES } from "../data/monsters.js";
import { SPECIAL_RESULTS } from "../systems/breeding.js";
import { drawMonster } from "../sprites.js";
import { panel, FONT, FONT_BOLD } from "../ui.js";
import { sfxSelect, sfxCancel } from "../audio.js";

const ROW_H = 46;
const PAGE_SIZE = 8;

function recipeList() {
  return Object.entries(SPECIAL_RESULTS).map(([pairKey, childId]) => {
    const [a, b] = pairKey.split("+");
    return { parentA: a, parentB: b, child: childId };
  });
}

export class BreedingChartScene {
  constructor(game, prevScene) {
    this.game = game;
    this.prev = prevScene;
    this.cursor = 0;
    this.time = 0;
    this.recipes = recipeList();
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.recipes.length / PAGE_SIZE));
  }

  get page() {
    return Math.floor(this.cursor / PAGE_SIZE);
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    const n = this.recipes.length;
    if (input.wasPressed("cancel") || input.wasPressed("dex")) {
      sfxCancel();
      this.game.changeScene(this.prev);
      return;
    }
    if (input.wasPressed("down") && this.cursor + 1 < n) { this.cursor += 1; sfxSelect(); }
    if (input.wasPressed("up") && this.cursor - 1 >= 0) { this.cursor -= 1; sfxSelect(); }
  }

  drawSlot(ctx, speciesId, x, y, seen) {
    const species = SPECIES[speciesId];
    if (!seen) {
      ctx.fillStyle = "#3a3a52";
      ctx.beginPath();
      ctx.arc(x + 20, y + 20, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f0ead8";
      ctx.font = FONT_BOLD;
      ctx.textAlign = "center";
      ctx.fillText("？", x + 20, y + 26);
      ctx.font = '12px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      ctx.fillText("？？？", x + 20, y + 46);
      ctx.textAlign = "left";
      return;
    }
    drawMonster(ctx, speciesId, x + 20, y + 20, 0.22, this.time, 0);
    ctx.fillStyle = "#3a3a52";
    ctx.font = '12px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(species.name, x + 20, y + 46);
    ctx.textAlign = "left";
  }

  draw(ctx) {
    ctx.fillStyle = "#2e3350";
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = "#f0ead8";
    ctx.font = 'bold 24px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("配合表", 30, 44);
    ctx.font = FONT;
    if (this.totalPages > 1) {
      ctx.textAlign = "right";
      ctx.fillText(`${this.page + 1} / ${this.totalPages} ページ`, 610, 44);
      ctx.textAlign = "left";
    }

    const seen = this.game.dex?.seen || [];
    const start = this.page * PAGE_SIZE;
    const pageRecipes = this.recipes.slice(start, start + PAGE_SIZE);

    pageRecipes.forEach((recipe, i) => {
      const globalIndex = start + i;
      const y = 66 + i * ROW_H;
      panel(ctx, 20, y, 600, ROW_H - 6);
      if (this.cursor === globalIndex) {
        ctx.beginPath();
        ctx.roundRect(20, y, 600, ROW_H - 6, 8);
        ctx.strokeStyle = "#ffd75e";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      const seenA = seen.includes(recipe.parentA);
      const seenB = seen.includes(recipe.parentB);
      const seenChild = seen.includes(recipe.child);

      this.drawSlot(ctx, recipe.parentA, 36, y + 2, seenA);
      ctx.fillStyle = "#f0ead8";
      ctx.font = FONT_BOLD;
      ctx.fillText("+", 108, y + 26);
      this.drawSlot(ctx, recipe.parentB, 130, y + 2, seenB);
      ctx.fillText("=", 202, y + 26);
      this.drawSlot(ctx, recipe.child, 224, y + 2, seenChild);

      if (seenA && seenB && !seenChild) {
        ctx.fillStyle = "#e8842e";
        ctx.font = '12px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
        ctx.fillText("この組み合わせ、ためしてみる？", 300, y + 26);
      }
    });

    ctx.fillStyle = "#f0ead8";
    ctx.font = FONT;
    ctx.fillText(
      "↑↓: えらぶ ／ X または D: もどる",
      30, 440
    );
    ctx.font = '13px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillStyle = "#a8a8c0";
    ctx.fillText(
      "上記以外の組み合わせでは、親のどちらかの姿が子に受け継がれます。",
      30, 462
    );
  }
}

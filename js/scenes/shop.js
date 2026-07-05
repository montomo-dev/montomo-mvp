import { ITEMS, shopInventoryFor } from "../data/items.js";
import { panel, FONT, FONT_BOLD } from "../ui.js";
import { sfxCancel, sfxSelect, sfxItemGet } from "../audio.js";

const ROW_H = 56;
const ROW_GAP = 8;

export class ShopScene {
  constructor(game, prevScene) {
    this.game = game;
    this.prev = prevScene;
    this.cursor = 0;
    this.time = 0;
    this.message = null;
    this.itemIds = shopInventoryFor(prevScene?.stageId);
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
    if (input.wasPressed("up")) { this.cursor = (this.cursor + this.itemIds.length - 1) % this.itemIds.length; sfxSelect(); }
    if (input.wasPressed("down")) { this.cursor = (this.cursor + 1) % this.itemIds.length; sfxSelect(); }
    if (input.wasPressed("ok")) this.buy(this.itemIds[this.cursor]);
  }

  buy(itemId) {
    const item = ITEMS[itemId];
    if ((this.game.money || 0) < item.price) {
      this.message = "おかねが たりないよ。";
      sfxCancel();
      return;
    }
    this.game.money -= item.price;
    this.game.items[itemId] = (this.game.items[itemId] || 0) + 1;
    this.message = `${item.name}を かった！`;
    sfxItemGet();
    this.game.save();
  }

  draw(ctx) {
    ctx.fillStyle = "#2e3350";
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = "#f0ead8";
    ctx.font = 'bold 24px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("どうぐや", 30, 44);
    ctx.textAlign = "right";
    ctx.font = FONT_BOLD;
    ctx.fillText(`しょじきん ${this.game.money || 0}円`, 610, 44);
    ctx.textAlign = "left";

    this.itemIds.forEach((itemId, i) => {
      const item = ITEMS[itemId];
      const y = 66 + i * (ROW_H + ROW_GAP);
      panel(ctx, 30, y, 580, ROW_H);
      if (this.cursor === i) {
        ctx.beginPath();
        ctx.roundRect(30, y, 580, ROW_H, 10);
        ctx.strokeStyle = "#ffd75e";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.fillText(item.name, 48, y + 22);
      ctx.font = FONT;
      ctx.fillText(item.description, 48, y + 42);
      ctx.textAlign = "right";
      ctx.font = FONT_BOLD;
      ctx.fillStyle = "#a8621f";
      ctx.fillText(`${item.price}円`, 592, y + 22);
      ctx.fillStyle = "#5a5a70";
      ctx.font = FONT;
      ctx.fillText(`もちすう ${this.game.items[itemId] || 0}`, 592, y + 42);
      ctx.textAlign = "left";
    });

    ctx.fillStyle = "#f0ead8";
    ctx.font = FONT;
    ctx.fillText("↑↓: えらぶ ／ Z: かう ／ X: もどる", 30, 462);

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

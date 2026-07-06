import { ITEMS, shopInventoryFor } from "../data/items.js";
import { panel, FONT, FONT_BOLD } from "../ui.js";
import { sfxCancel, sfxSelect, sfxItemGet } from "../audio.js";

const ROW_H = 56;
const ROW_GAP = 8;
const MAX_BUY_QTY = 99;
const PAGE_SIZE = 6;

export class ShopScene {
  constructor(game, prevScene) {
    this.game = game;
    this.prev = prevScene;
    this.cursor = 0;
    this.time = 0;
    this.message = null;
    this.itemIds = shopInventoryFor(prevScene?.stageId);
    this.phase = "list";
    this.buyQty = 1;
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.itemIds.length / PAGE_SIZE));
  }

  get page() {
    return Math.floor(this.cursor / PAGE_SIZE);
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (this.message) {
      if (input.wasPressed("ok") || input.wasPressed("cancel")) this.message = null;
      return;
    }
    if (this.phase === "quantity") {
      if (input.wasPressed("cancel")) { sfxCancel(); this.phase = "list"; return; }
      if (input.wasPressed("left")) { this.buyQty = Math.max(1, this.buyQty - 1); sfxSelect(); }
      if (input.wasPressed("right")) { this.buyQty = Math.min(MAX_BUY_QTY, this.buyQty + 1); sfxSelect(); }
      if (input.wasPressed("up")) { this.buyQty = Math.min(MAX_BUY_QTY, this.buyQty + 10); sfxSelect(); }
      if (input.wasPressed("down")) { this.buyQty = Math.max(1, this.buyQty - 10); sfxSelect(); }
      if (input.wasPressed("ok")) this.buy(this.itemIds[this.cursor], this.buyQty);
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
    if (input.wasPressed("ok")) {
      sfxSelect();
      this.phase = "quantity";
      this.buyQty = 1;
    }
  }

  buy(itemId, qty = 1) {
    const item = ITEMS[itemId];
    const totalPrice = item.price * qty;
    if ((this.game.money || 0) < totalPrice) {
      this.message = "おかねが たりないよ。";
      sfxCancel();
      this.phase = "list";
      return;
    }
    this.game.money -= totalPrice;
    this.game.items[itemId] = (this.game.items[itemId] || 0) + qty;
    this.message = qty > 1 ? `${item.name}を ${qty}こ かった！` : `${item.name}を かった！`;
    sfxItemGet();
    this.phase = "list";
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
    if (this.totalPages > 1) {
      ctx.textAlign = "right";
      ctx.font = FONT;
      ctx.fillText(`${this.page + 1} / ${this.totalPages} ページ`, 610, 66);
      ctx.textAlign = "left";
    }

    const pageStart = this.page * PAGE_SIZE;
    const pageItemIds = this.itemIds.slice(pageStart, pageStart + PAGE_SIZE);
    pageItemIds.forEach((itemId, i) => {
      const item = ITEMS[itemId];
      const y = 78 + i * (ROW_H + ROW_GAP);
      panel(ctx, 30, y, 580, ROW_H);
      if (this.cursor === pageStart + i) {
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
    ctx.fillText("↑↓: えらぶ ／ Z: かう ／ X: もどる", 30, 470);

    if (this.phase === "quantity") {
      const item = ITEMS[this.itemIds[this.cursor]];
      const total = item.price * this.buyQty;
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, 640, 480);
      panel(ctx, 120, 170, 400, 150);
      ctx.textAlign = "center";
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.fillText(`${item.name} を なんこ かう？`, 320, 202);
      ctx.font = 'bold 32px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      ctx.fillText(`× ${this.buyQty}`, 320, 250);
      ctx.font = FONT;
      ctx.fillStyle = "#a8621f";
      ctx.fillText(`ごうけい ${total}円`, 320, 280);
      ctx.fillStyle = "#5a5a70";
      ctx.fillText("←→: 1こ ／ ↑↓: 10こ ／ Z: こうにゅう ／ X: やめる", 320, 306);
      ctx.textAlign = "left";
    }

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

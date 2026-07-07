import { ITEMS, shopInventoryFor } from "../data/items.js";
import { panel, FONT, FONT_BOLD } from "../ui.js";
import { sfxCancel, sfxSelect, sfxItemGet } from "../audio.js";
import { tr } from "../i18n.js";

function itemName(game, item) {
  return tr(game, item.name, item.nameEn);
}
function itemDescription(game, item) {
  return tr(game, item.description, item.descriptionEn);
}

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
      this.message = tr(this.game, "おかねが たりないよ。", "You don't have enough money.");
      sfxCancel();
      this.phase = "list";
      return;
    }
    this.game.money -= totalPrice;
    this.game.items[itemId] = (this.game.items[itemId] || 0) + qty;
    const name = itemName(this.game, item);
    this.message = qty > 1
      ? tr(this.game, `${name}を ${qty}こ かった！`, `Bought ${qty}x ${name}!`)
      : tr(this.game, `${name}を かった！`, `Bought ${name}!`);
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
    ctx.fillText(tr(this.game, "どうぐや", "Item Shop"), 30, 44);
    ctx.textAlign = "right";
    ctx.font = FONT_BOLD;
    ctx.fillText(tr(this.game, `しょじきん ${this.game.money || 0}円`, `Money: ${this.game.money || 0}`), 610, 44);
    ctx.textAlign = "left";
    if (this.totalPages > 1) {
      ctx.textAlign = "right";
      ctx.font = FONT;
      ctx.fillText(tr(this.game, `${this.page + 1} / ${this.totalPages} ページ`, `Page ${this.page + 1} / ${this.totalPages}`), 610, 66);
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
      ctx.fillText(itemName(this.game, item), 48, y + 22);
      ctx.font = FONT;
      ctx.fillText(itemDescription(this.game, item), 48, y + 42);
      ctx.textAlign = "right";
      ctx.font = FONT_BOLD;
      ctx.fillStyle = "#a8621f";
      ctx.fillText(tr(this.game, `${item.price}円`, `${item.price}g`), 592, y + 22);
      ctx.fillStyle = "#5a5a70";
      ctx.font = FONT;
      ctx.fillText(tr(this.game, `もちすう ${this.game.items[itemId] || 0}`, `Owned: ${this.game.items[itemId] || 0}`), 592, y + 42);
      ctx.textAlign = "left";
    });

    ctx.fillStyle = "#f0ead8";
    ctx.font = FONT;
    ctx.fillText(tr(this.game, "↑↓: えらぶ ／ Z: かう ／ X: もどる", "Up/Down: Choose / Z: Buy / X: Back"), 30, 470);

    if (this.phase === "quantity") {
      const item = ITEMS[this.itemIds[this.cursor]];
      const total = item.price * this.buyQty;
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, 640, 480);
      panel(ctx, 120, 170, 400, 150);
      ctx.textAlign = "center";
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.fillText(tr(this.game, `${itemName(this.game, item)} を なんこ かう？`, `How many ${itemName(this.game, item)}?`), 320, 202);
      ctx.font = 'bold 32px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      ctx.fillText(`× ${this.buyQty}`, 320, 250);
      ctx.font = FONT;
      ctx.fillStyle = "#a8621f";
      ctx.fillText(tr(this.game, `ごうけい ${total}円`, `Total: ${total}g`), 320, 280);
      ctx.fillStyle = "#5a5a70";
      ctx.fillText(
        tr(this.game, "←→: 1こ ／ ↑↓: 10こ ／ Z: こうにゅう ／ X: やめる", "Left/Right: ±1 / Up/Down: ±10 / Z: Buy / X: Cancel"),
        320, 306
      );
      ctx.textAlign = "left";
    }

    if (this.message) {
      panel(ctx, 70, 184, 500, 100);
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.textAlign = "center";
      ctx.fillText(this.message, 320, 232);
      ctx.font = FONT;
      ctx.fillText(tr(this.game, "Z または X で とじる", "Z or X to close"), 320, 264);
      ctx.textAlign = "left";
    }
  }
}

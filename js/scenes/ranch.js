import { drawMonster } from "../sprites.js";
import { panel, FONT, FONT_BOLD } from "../ui.js";
import { MAX_PARTY, depositToRanch, withdrawFromRanch } from "../systems/party.js";
import { sfxCancel, sfxSelect, sfxConfirm } from "../audio.js";
import { monsterName } from "../data/monsters.js";
import { tr } from "../i18n.js";

const ICON_SIZE = 36;
const ICON_GAP = 14;
const ICON_COLS = 6;
const ROW_HEIGHT = ICON_SIZE + ICON_GAP;
const RANCH_VIEW_BOTTOM = 452;

export class RanchScene {
  constructor(game, prevScene) {
    this.game = game;
    this.prev = prevScene;
    this.cursor = 0;
    this.time = 0;
    this.message = null;
    this.ranchScrollRow = 0;
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
    this.updateRanchScroll();
  }

  // カーソルが牧場エリアにあるとき、表示範囲(ranchViewRows)に収まるようスクロール位置を追従させる
  updateRanchScroll() {
    const ranchIndex = this.cursor - this.game.party.length;
    if (ranchIndex < 0) return;
    const row = Math.floor(ranchIndex / ICON_COLS);
    const visibleRows = this.ranchViewRows();
    if (row < this.ranchScrollRow) this.ranchScrollRow = row;
    if (row >= this.ranchScrollRow + visibleRows) this.ranchScrollRow = row - visibleRows + 1;
  }

  ranchViewRows(viewTop = this.ranchLabelY() + 14) {
    return Math.max(1, Math.floor((RANCH_VIEW_BOTTOM - viewTop) / ROW_HEIGHT));
  }

  ranchLabelY() {
    const partyRows = Math.max(1, Math.ceil(this.game.party.length / ICON_COLS));
    return 86 + partyRows * (ICON_SIZE + ICON_GAP) + 28;
  }

  toggle(entry) {
    if (entry.loc === "party") {
      const name = monsterName(entry.m, this.game.lang);
      depositToRanch(this.game.party, this.game.ranch, entry.i);
      this.message = tr(this.game, `${name}を 牧場に あずけた。`, `Sent ${name} to the ranch.`);
      sfxConfirm();
    } else {
      if (this.game.party.length >= MAX_PARTY) {
        this.message = tr(this.game, "パーティが いっぱいだよ。", "Your party is full.");
        sfxCancel();
        return;
      }
      const name = monsterName(entry.m, this.game.lang);
      withdrawFromRanch(this.game.party, this.game.ranch, entry.i);
      this.message = tr(this.game, `${name}を むかえいれた！`, `Welcomed ${name} back!`);
      sfxConfirm();
    }
    this.cursor = 0;
    this.ranchScrollRow = 0;
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

  drawGrid(ctx, list, startX, startY, highlightedIndex, emptyText, scrollRow = 0) {
    if (list.length === 0) {
      ctx.font = FONT;
      ctx.fillStyle = "#a8a8c0";
      ctx.fillText(emptyText, startX + 4, startY + 24);
      return;
    }
    list.forEach((monster, i) => {
      const col = i % ICON_COLS;
      const row = Math.floor(i / ICON_COLS) - scrollRow;
      const x = startX + col * (ICON_SIZE + ICON_GAP);
      const y = startY + row * (ICON_SIZE + ICON_GAP);
      if (y + ICON_SIZE < startY || y > RANCH_VIEW_BOTTOM) return;
      this.drawIcon(ctx, monster, x, y, highlightedIndex === i);
    });
  }

  draw(ctx) {
    ctx.fillStyle = "#2e3350";
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = "#f0ead8";
    ctx.font = 'bold 24px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(tr(this.game, "牧場", "Ranch"), 30, 44);

    ctx.font = FONT_BOLD;
    ctx.fillText(tr(this.game, `つれている なかま（${this.game.party.length}/${MAX_PARTY}）`, `Party (${this.game.party.length}/${MAX_PARTY})`), 30, 70);
    this.drawGrid(ctx, this.game.party, 30, 86, this.cursor, tr(this.game, "なかまはいない", "No monsters"));

    const ranchLabelY = this.ranchLabelY();
    const ranchViewTop = ranchLabelY + 14;
    ctx.font = FONT_BOLD;
    ctx.fillStyle = "#f0ead8";
    ctx.fillText(tr(this.game, `あずけている なかま（${this.game.ranch.length}）`, `Ranch (${this.game.ranch.length})`), 30, ranchLabelY);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, ranchViewTop - 4, 640, RANCH_VIEW_BOTTOM - ranchViewTop + 8);
    ctx.clip();
    this.drawGrid(
      ctx, this.game.ranch, 30, ranchViewTop,
      this.cursor - this.game.party.length, tr(this.game, "だれも いない", "No one here"),
      this.ranchScrollRow
    );
    ctx.restore();

    const ranchRows = Math.ceil(this.game.ranch.length / ICON_COLS);
    const visibleRows = this.ranchViewRows(ranchViewTop);
    if (ranchRows > visibleRows) {
      ctx.fillStyle = "#f0ead8";
      ctx.font = FONT;
      ctx.textAlign = "right";
      if (this.ranchScrollRow > 0) ctx.fillText("▲", 610, ranchViewTop + 10);
      if (this.ranchScrollRow + visibleRows < ranchRows) ctx.fillText("▼", 610, RANCH_VIEW_BOTTOM - 4);
      ctx.textAlign = "left";
    }

    ctx.fillStyle = "#f0ead8";
    ctx.font = FONT;
    ctx.fillText(tr(this.game, "↑↓: えらぶ ／ Z: あずける・むかえいれる ／ X: もどる", "Up/Down: Choose / Z: Deposit/Withdraw / X: Back"), 30, 462);

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

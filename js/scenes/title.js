import { hasSave, loadSave, clearSave } from "../systems/save.js";
import { drawMonster } from "../sprites.js";
import { panel, FONT, FONT_BOLD } from "../ui.js";
import { sfxSelect, sfxConfirm, sfxCancel } from "../audio.js";

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.cursor = 0;
    this.confirm = null; // null | { action, yes, text }
    this.notice = null;
    this.noticeTimer = 0;
    this.refreshMenu();
  }

  refreshMenu() {
    this.saveExists = hasSave();
    this.options = this.saveExists
      ? ["つづきから", "はじめから", "セーブを けす"]
      : ["はじめる"];
    if (this.cursor >= this.options.length) this.cursor = 0;
  }

  setNotice(text) {
    this.notice = text;
    this.noticeTimer = 2.2;
  }

  update(dt) {
    this.time += dt;
    if (this.noticeTimer > 0 && (this.noticeTimer -= dt) <= 0) this.notice = null;
    const input = this.game.input;

    if (this.confirm) {
      if (input.wasPressed("left") || input.wasPressed("right")) {
        this.confirm.yes = !this.confirm.yes;
      }
      if (input.wasPressed("cancel")) {
        sfxCancel();
        this.confirm = null;
        return;
      }
      if (input.wasPressed("ok")) {
        sfxConfirm();
        const { action, yes } = this.confirm;
        this.confirm = null;
        if (!yes) return;
        if (action === "new") {
          clearSave();
          this.game.startAdventure(null);
        } else if (action === "delete") {
          clearSave();
          this.cursor = 0;
          this.refreshMenu();
          this.setNotice("セーブデータを けしたよ");
        }
      }
      return;
    }

    if (input.wasPressed("up")) {
      this.cursor = (this.cursor + this.options.length - 1) % this.options.length;
      sfxSelect();
    }
    if (input.wasPressed("down")) {
      this.cursor = (this.cursor + 1) % this.options.length;
      sfxSelect();
    }
    if (input.wasPressed("ok")) this.select();
  }

  select() {
    sfxConfirm();
    const opt = this.options[this.cursor];
    if (opt === "つづきから") {
      this.game.startAdventure(loadSave());
    } else if (opt === "はじめる") {
      this.game.startAdventure(null);
    } else if (opt === "はじめから") {
      this.confirm = { action: "new", yes: false, text: "いまの ぼうけんは きえます。はじめから する？" };
    } else if (opt === "セーブを けす") {
      this.confirm = { action: "delete", yes: false, text: "セーブデータを けします。よろしい？" };
    }
  }

  draw(ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, 480);
    bg.addColorStop(0, "#bfe8ff");
    bg.addColorStop(1, "#e9f8d8");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 640, 480);

    drawMonster(ctx, "mofuri", 214, 146, 1.55, this.time);
    drawMonster(ctx, "hibachi", 320, 132, 1.75, this.time + 1.3);
    drawMonster(ctx, "fuwarisu", 430, 148, 1.5, this.time + 2.2);

    ctx.textAlign = "center";
    ctx.fillStyle = "#3a3a52";
    ctx.font = 'bold 46px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText("モンとも", 320, 236);
    ctx.font = FONT;
    ctx.fillText("〜 なかまと そだてる ぼうけん 〜", 320, 270);
    ctx.font = FONT_BOLD;
    ctx.fillStyle = "#4f7c39";
    ctx.fillText("であう → たたかう → さそう → そだてる", 320, 302);
    ctx.fillStyle = "#5c7d58";
    ctx.font = FONT;
    ctx.fillText("世界を守る「ヌシ」たちに、歪みの影が しのびよる…", 320, 322);

    if (this.notice) {
      ctx.fillStyle = "#2e7d32";
      ctx.font = FONT_BOLD;
      ctx.fillText(this.notice, 320, 344);
    }

    this.options.forEach((opt, i) => {
      const y = 364 + i * 38;
      ctx.font = FONT_BOLD;
      ctx.fillStyle = this.cursor === i ? "#e8842e" : "#3a3a52";
      ctx.fillText(opt, 320, y);
      if (this.cursor === i) {
        ctx.fillText("▶", 320 - 96, y);
        ctx.fillText("◀", 320 + 96, y);
      }
    });

    ctx.font = FONT;
    ctx.fillStyle = "#5a5a70";
    ctx.fillText("↑↓: えらぶ ／ Z: けってい", 320, 454);
    ctx.fillText("くさむらで モンスターと であい、HPを へらして さそおう", 320, 478);

    if (this.confirm) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, 640, 480);
      panel(ctx, 80, 176, 480, 138);
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.textAlign = "center";
      ctx.fillText(this.confirm.text, 320, 222);
      const y = 272;
      ctx.fillStyle = this.confirm.yes ? "#e8842e" : "#3a3a52";
      ctx.fillText("はい", 250, y);
      ctx.fillStyle = !this.confirm.yes ? "#e8842e" : "#3a3a52";
      ctx.fillText("いいえ", 396, y);
      ctx.font = FONT;
      ctx.fillStyle = "#5a5a70";
      ctx.fillText("←→: えらぶ ／ Z: けってい ／ X: やめる", 320, 300);
    }

    ctx.textAlign = "left";
  }
}

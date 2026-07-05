import { hasSave, loadSave, clearSave, SAVE_SLOT_COUNT } from "../systems/save.js";
import { drawMonster } from "../sprites.js";
import { panel, FONT, FONT_BOLD } from "../ui.js";
import { sfxSelect, sfxConfirm, sfxCancel } from "../audio.js";

const nameInput = document.getElementById("name-input");

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.cursor = 0;
    this.confirm = null; // null | { action, yes, text, slot }
    this.notice = null;
    this.noticeTimer = 0;
    this.phase = "slots"; // slots | menu | confirm
    this.menuSlot = null;
    this.menuCursor = 0;
    this.refreshSlots();
  }

  refreshSlots() {
    this.slots = [];
    for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
      if (hasSave(i)) {
        const save = loadSave(i);
        const leader = save?.party?.[0];
        this.slots.push({
          slot: i,
          empty: false,
          playerName: save?.playerName || "",
          leaderName: leader?.name || "?",
          leaderLevel: leader?.level || 1,
        });
      } else {
        this.slots.push({ slot: i, empty: true });
      }
    }
    if (this.cursor >= this.slots.length) this.cursor = 0;
  }

  setNotice(text) {
    this.notice = text;
    this.noticeTimer = 2.2;
  }

  update(dt) {
    this.time += dt;
    if (this.noticeTimer > 0 && (this.noticeTimer -= dt) <= 0) this.notice = null;
    if (this.renamingSlot) return;
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
        const { action, yes, slot } = this.confirm;
        this.confirm = null;
        if (!yes) return;
        if (action === "new") {
          clearSave(slot);
          this.promptNameAndStart(slot);
        } else if (action === "delete") {
          clearSave(slot);
          this.phase = "slots";
          this.refreshSlots();
          this.setNotice("セーブデータを けしたよ");
        }
      }
      return;
    }

    if (this.phase === "slots") {
      if (input.wasPressed("up")) { this.cursor = (this.cursor + this.slots.length - 1) % this.slots.length; sfxSelect(); }
      if (input.wasPressed("down")) { this.cursor = (this.cursor + 1) % this.slots.length; sfxSelect(); }
      if (input.wasPressed("ok")) this.chooseSlot();
      return;
    }

    if (this.phase === "menu") {
      const options = ["つづきから", "はじめから", "セーブを けす"];
      if (input.wasPressed("up")) { this.menuCursor = (this.menuCursor + options.length - 1) % options.length; sfxSelect(); }
      if (input.wasPressed("down")) { this.menuCursor = (this.menuCursor + 1) % options.length; sfxSelect(); }
      if (input.wasPressed("cancel")) { sfxCancel(); this.phase = "slots"; return; }
      if (input.wasPressed("ok")) this.chooseMenuOption(options[this.menuCursor]);
    }
  }

  chooseSlot() {
    sfxConfirm();
    const entry = this.slots[this.cursor];
    if (entry.empty) {
      this.promptNameAndStart(entry.slot);
    } else {
      this.phase = "menu";
      this.menuSlot = entry.slot;
      this.menuCursor = 0;
    }
  }

  chooseMenuOption(opt) {
    sfxConfirm();
    if (opt === "つづきから") {
      this.game.startAdventure(loadSave(this.menuSlot), this.menuSlot);
    } else if (opt === "はじめから") {
      this.confirm = { action: "new", yes: false, slot: this.menuSlot, text: "いまの ぼうけんは きえます。はじめから する？" };
    } else if (opt === "セーブを けす") {
      this.confirm = { action: "delete", yes: false, slot: this.menuSlot, text: "セーブデータを けします。よろしい？" };
    }
  }

  promptNameAndStart(slot) {
    this.renamingSlot = slot;
    const canvas = this.game.canvas;
    const scale = canvas.getBoundingClientRect().width / canvas.width;
    nameInput.style.left = `${220 * scale}px`;
    nameInput.style.top = `${(230) * scale}px`;
    nameInput.style.width = `${200 * scale}px`;
    nameInput.value = "";
    nameInput.classList.add("visible");
    nameInput.focus?.();

    const finish = (commit) => {
      nameInput.removeEventListener("keydown", onKeyDown);
      nameInput.removeEventListener("blur", onBlur);
      nameInput.classList.remove("visible");
      const trimmed = nameInput.value.trim();
      this.renamingSlot = null;
      if (commit) {
        this.game.startAdventure(null, slot, trimmed.length > 0 ? trimmed : "ぼうけんしゃ");
      } else {
        this.phase = "slots";
      }
    };
    const onKeyDown = (e) => {
      if (e.code === "Enter") { e.preventDefault(); finish(true); }
      else if (e.code === "Escape") { e.preventDefault(); finish(false); }
    };
    const onBlur = () => finish(true);
    nameInput.addEventListener("keydown", onKeyDown);
    nameInput.addEventListener("blur", onBlur);
  }

  draw(ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, 480);
    bg.addColorStop(0, "#bfe8ff");
    bg.addColorStop(1, "#e9f8d8");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 640, 480);

    drawMonster(ctx, "mofuri", 214, 106, 1.2, this.time);
    drawMonster(ctx, "hibachi", 320, 96, 1.35, this.time + 1.3);
    drawMonster(ctx, "fuwarisu", 430, 108, 1.15, this.time + 2.2);

    ctx.textAlign = "center";
    ctx.fillStyle = "#3a3a52";
    ctx.font = 'bold 40px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText("モンとも", 320, 186);
    ctx.font = FONT;
    ctx.fillText("〜 なかまと そだてる ぼうけん 〜", 320, 214);
    ctx.fillStyle = "#5c7d58";
    ctx.fillText("世界を守る「ヌシ」たちに、歪みの影が しのびよる…", 320, 234);

    if (this.notice) {
      ctx.fillStyle = "#2e7d32";
      ctx.font = FONT_BOLD;
      ctx.fillText(this.notice, 320, 254);
    }

    if (this.renamingSlot != null) {
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.fillText("ぼうけんしゃの なまえを にゅうりょくしてください", 320, 214);
      ctx.fillStyle = "#a33";
      ctx.font = FONT;
      ctx.fillText("※ ほんみょうなど、こじんが とくていできる なまえは つけないでください", 320, 260);
    }

    this.slots.forEach((entry, i) => {
      const y = 288 + i * 56;
      panel(ctx, 90, y, 460, 46);
      if (this.phase === "slots" && this.cursor === i) {
        ctx.beginPath();
        ctx.roundRect(90, y, 460, 46, 10);
        ctx.strokeStyle = "#ffd75e";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.textAlign = "left";
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      if (entry.empty) {
        ctx.fillText(`スロット${entry.slot + 1}: からっぽ`, 110, y + 28);
      } else {
        ctx.fillText(
          `スロット${entry.slot + 1}: ${entry.playerName || "ぼうけんしゃ"}(${entry.leaderName} Lv.${entry.leaderLevel})`,
          110, y + 28
        );
      }
    });
    ctx.textAlign = "center";

    ctx.font = FONT;
    ctx.fillStyle = "#5a5a70";
    if (this.phase === "slots") {
      ctx.fillText("↑↓: スロットを えらぶ ／ Z: けってい", 320, 462);
    } else if (this.phase === "menu") {
      ctx.fillText("↑↓: えらぶ ／ Z: けってい ／ X: もどる", 320, 462);
    }

    if (this.phase === "menu") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, 640, 480);
      const options = ["つづきから", "はじめから", "セーブを けす"];
      panel(ctx, 190, 170, 260, 40 + options.length * 38);
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.fillText(`スロット${this.menuSlot + 1}`, 320, 196);
      options.forEach((opt, i) => {
        const y = 230 + i * 38;
        ctx.fillStyle = this.menuCursor === i ? "#e8842e" : "#3a3a52";
        ctx.fillText(opt, 320, y);
      });
    }

    if (this.confirm) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, 640, 480);
      panel(ctx, 80, 176, 480, 138);
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
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

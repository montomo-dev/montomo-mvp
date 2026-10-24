import { hasSave, loadSave, clearSave, SAVE_SLOT_COUNT } from "../systems/save.js";
import { drawMonster } from "../sprites.js";
import { FONT, FONT_BOLD } from "../ui.js";
import { STAGES } from "../data/stages.js";
import { sfxSelect, sfxConfirm, sfxCancel } from "../audio.js";
import { tr } from "../i18n.js";
import { playBgm } from "../music.js";

const nameInput = document.getElementById("name-input");
const MENU_OPTIONS = ["continue", "new", "delete"];
const PAPER = "#fff9e9";
const INK = "#244b3b";
const MUTED = "#687564";
const SLOT_X = 62;
const SLOT_Y = 264;
const SLOT_W = 516;
const SLOT_H = 50;
const SLOT_GAP = 58;

function card(ctx, x, y, width, height, fill = PAPER, stroke = "#d8d7bd", radius = 12) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function contains(x, y, left, top, width, height) {
  return x >= left && x <= left + width && y >= top && y <= top + height;
}

function fitText(ctx, text, x, y, maxWidth) {
  let label = String(text);
  if (ctx.measureText(label).width > maxWidth) {
    while (label.length > 0 && ctx.measureText(`${label}…`).width > maxWidth) label = label.slice(0, -1);
    label += "…";
  }
  ctx.fillText(label, x, y);
}
function menuOptionLabel(game, key) {
  return tr(
    game,
    { continue: "つづきから", new: "はじめから", delete: "セーブを けす" }[key],
    { continue: "Continue", new: "New Game", delete: "Delete Save" }[key]
  );
}

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
    this.renamingSlot = null;
    this.finishName = null;
    this.refreshSlots();
    playBgm("title");
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
          stage: STAGES[save?.field?.stageId],
          savedAt: save?.savedAt,
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
    if (this.renamingSlot != null) {
      if (this.game.input.wasPressed("ok")) this.finishName?.(true);
      else if (this.game.input.wasPressed("cancel")) this.finishName?.(false);
      return;
    }
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
        this.confirmChoice();
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
      const options = MENU_OPTIONS;
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
    if (opt === "continue") {
      this.game.startAdventure(loadSave(this.menuSlot), this.menuSlot);
    } else if (opt === "new") {
      this.confirm = {
        action: "new", yes: false, slot: this.menuSlot,
        text: tr(this.game, "いまの ぼうけんは きえます。はじめから する？", "Progress will be lost. Start over?"),
      };
    } else if (opt === "delete") {
      this.confirm = {
        action: "delete", yes: false, slot: this.menuSlot,
        text: tr(this.game, "セーブデータを けします。よろしい？", "Delete this save data?"),
      };
    }
  }

  confirmChoice() {
    if (!this.confirm) return;
    sfxConfirm();
    const { action, yes, slot } = this.confirm;
    this.confirm = null;
    if (!yes) return;
    if (action === "new") {
      // The old save remains intact until the new adventure is actually started.
      this.promptNameAndStart(slot);
    } else if (action === "delete") {
      const deleted = clearSave(slot);
      this.phase = "slots";
      this.refreshSlots();
      this.setNotice(deleted
        ? tr(this.game, "セーブデータを けしたよ", "Save data deleted.")
        : tr(this.game, "セーブを けせなかったよ", "Could not delete this save."));
    }
  }

  handlePointer(x, y) {
    if (this.game.scene !== this) return;
    if (this.renamingSlot != null) {
      if (contains(x, y, 332, 292, 178, 44)) this.finishName?.(true);
      else if (contains(x, y, 130, 292, 178, 44)) this.finishName?.(false);
      return;
    }
    if (this.confirm) {
      if (contains(x, y, 150, 260, 156, 44)) {
        this.confirm.yes = true;
        this.confirmChoice();
      } else if (contains(x, y, 334, 260, 156, 44)) {
        this.confirm.yes = false;
        this.confirmChoice();
      }
      return;
    }
    if (this.phase === "menu") {
      for (let i = 0; i < MENU_OPTIONS.length; i++) {
        if (contains(x, y, 190, 184 + i * 48, 260, 42)) {
          this.menuCursor = i;
          this.chooseMenuOption(MENU_OPTIONS[i]);
          return;
        }
      }
      if (contains(x, y, 190, 338, 260, 32)) {
        sfxCancel();
        this.phase = "slots";
      }
      return;
    }
    for (let i = 0; i < this.slots.length; i++) {
      if (contains(x, y, SLOT_X, SLOT_Y + i * SLOT_GAP, SLOT_W, SLOT_H)) {
        this.cursor = i;
        this.chooseSlot();
        return;
      }
    }
  }

  promptNameAndStart(slot) {
    this.renamingSlot = slot;
    nameInput.style.left = `${170 / 640 * 100}%`;
    nameInput.style.top = `${230 / 480 * 100}%`;
    nameInput.style.width = `${300 / 640 * 100}%`;
    nameInput.value = "";
    nameInput.setAttribute?.("aria-label", tr(this.game, "ぼうけんしゃの なまえ", "Adventurer name"));
    nameInput.setAttribute?.("placeholder", tr(this.game, "なまえ（8もじまで）", "Name (up to 8 characters)"));
    nameInput.classList.add("visible");

    let finished = false;
    const finish = (commit) => {
      if (finished) return;
      finished = true;
      nameInput.removeEventListener("keydown", onKeyDown);
      nameInput.classList.remove("visible");
      const trimmed = nameInput.value.trim();
      this.renamingSlot = null;
      this.finishName = null;
      if (commit) {
        this.game.startAdventure(null, slot, trimmed.length > 0 ? trimmed : tr(this.game, "ぼうけんしゃ", "Adventurer"));
      } else {
        this.phase = "slots";
      }
    };
    const onKeyDown = (e) => {
      // IME conversion Enter confirms the character, not the adventure.
      if (e.isComposing) return;
      if (e.code === "Enter") { e.preventDefault(); finish(true); }
      else if (e.code === "Escape") { e.preventDefault(); finish(false); }
    };
    this.finishName = finish;
    nameInput.addEventListener("keydown", onKeyDown);
    nameInput.focus?.();
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = "#173c30";
    ctx.fillRect(0, 0, 640, 480);
    card(ctx, 16, 12, 608, 452, "#f8f3df", "#a5bda0", 22);

    // A paper journal surrounds the original monster artwork.
    ctx.strokeStyle = "rgba(116,132,91,0.08)";
    ctx.lineWidth = 1;
    for (let y = 26; y < 456; y += 7) {
      ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(612, y); ctx.stroke();
    }
    ctx.textAlign = "center";
    ctx.fillStyle = MUTED;
    ctx.font = 'bold 11px "Yu Gothic", sans-serif';
    ctx.fillText("M O N T O M O  /  A D V E N T U R E  J O U R N A L", 320, 39);
    ctx.fillStyle = INK;
    ctx.font = 'bold 46px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText(tr(this.game, "モンとも", "Montomo"), 320, 89);
    ctx.fillStyle = MUTED;
    ctx.font = '15px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText(tr(this.game, "出会って、育てて。きみだけの なかまと。", "Meet. Raise. Explore. Together with your friends."), 320, 116);

    const artTime = this.game.reduceMotion ? 0 : this.time;
    ctx.fillStyle = "#e2e8c5";
    ctx.beginPath(); ctx.ellipse(320, 205, 200, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#d1dbb1";
    ctx.beginPath(); ctx.ellipse(320, 212, 168, 13, 0, 0, Math.PI * 2); ctx.fill();
    drawMonster(ctx, "mofuri", 210, 176, 1.02, artTime);
    // Leave room above the flame even at the highest point of the idle bob.
    drawMonster(ctx, "hibachi", 320, 184, 1.0, artTime + 1.3);
    drawMonster(ctx, "fuwarisu", 430, 176, 0.98, artTime + 2.2);

    ctx.fillStyle = MUTED;
    ctx.font = '13px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText(tr(this.game, "7つの世界で、まだ見ぬ ともだちが 待っている。", "Across seven worlds, new friends are waiting."), 320, 244);

    this.slots.forEach((entry, i) => {
      const y = SLOT_Y + i * SLOT_GAP;
      const selected = this.phase === "slots" && this.cursor === i;
      card(ctx, SLOT_X, y, SLOT_W, SLOT_H, selected ? "#eef0d7" : "#fffaf0", selected ? "#35634b" : "#d8d7bd");
      if (selected) {
        ctx.fillStyle = "#35634b";
        ctx.beginPath(); ctx.roundRect(SLOT_X, y + 10, 4, SLOT_H - 20, 2); ctx.fill();
      }
      ctx.textAlign = "center";
      ctx.fillStyle = selected ? INK : "#a0aa8d";
      ctx.font = 'bold 20px "Yu Gothic", sans-serif';
      ctx.fillText(`0${i + 1}`, 91, y + 33);
      ctx.textAlign = "left";
      ctx.fillStyle = INK;
      ctx.font = FONT_BOLD;
      fitText(ctx, entry.empty
        ? tr(this.game, "あたらしい ぼうけん", "A new adventure")
        : entry.playerName || tr(this.game, "ぼうけんしゃ", "Adventurer"), 122, y + 22, 390);
      ctx.fillStyle = MUTED;
      ctx.font = '12px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      if (entry.empty) {
        ctx.fillText(tr(this.game, "ここから、ものがたりを はじめよう。", "Your story starts here."), 122, y + 40);
      } else {
        const stage = entry.stage ? tr(this.game, entry.stage.name, entry.stage.nameEn) : "";
        const saved = new Date(entry.savedAt);
        const date = Number.isFinite(saved.getTime()) ? `  ·  ${saved.getMonth() + 1}/${saved.getDate()}` : "";
        fitText(ctx, `${entry.leaderName}  Lv.${entry.leaderLevel}${stage ? `  ·  ${stage}` : ""}${date}`, 122, y + 40, 396);
      }
      ctx.textAlign = "center";
      ctx.fillStyle = selected ? "#c38b38" : "#b7bba1";
      ctx.font = 'bold 23px "Yu Gothic", sans-serif';
      ctx.fillText("›", 551, y + 33);
    });
    ctx.textAlign = "center";
    ctx.fillStyle = this.notice ? INK : MUTED;
    ctx.font = '12px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText(this.notice || tr(this.game, "タップ / ↑↓ で えらぶ　　Z・Enter で けってい", "Tap or ↑↓ to choose  ·  Z / Enter to confirm"), 320, 450);

    if (this.phase === "menu" || this.confirm || this.renamingSlot != null) {
      ctx.fillStyle = "rgba(19,44,33,0.68)";
      ctx.fillRect(0, 0, 640, 480);
    }
    if (this.renamingSlot != null) this.drawNamePrompt(ctx);
    else if (this.confirm) this.drawConfirmation(ctx);
    else if (this.phase === "menu") this.drawMenu(ctx);
    ctx.restore();
  }

  drawMenu(ctx) {
    card(ctx, 164, 128, 312, 254, PAPER, "#a5bda0", 18);
    ctx.textAlign = "center";
    ctx.fillStyle = INK;
    ctx.font = FONT_BOLD;
    ctx.fillText(tr(this.game, `ぼうけんの記録 0${this.menuSlot + 1}`, `Adventure journal 0${this.menuSlot + 1}`), 320, 163);
    MENU_OPTIONS.forEach((opt, i) => {
      const y = 184 + i * 48;
      const selected = this.menuCursor === i;
      card(ctx, 190, y, 260, 42, selected ? "#35634b" : "#f6f1df", selected ? "#35634b" : "#dfdeca", 9);
      ctx.fillStyle = selected ? PAPER : opt === "delete" ? "#9a5144" : INK;
      ctx.font = FONT_BOLD;
      ctx.fillText(menuOptionLabel(this.game, opt), 320, y + 27);
    });
    ctx.fillStyle = MUTED;
    ctx.font = '13px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText(tr(this.game, "もどる / X・Esc", "Back / X · Esc"), 320, 359);
  }

  drawConfirmation(ctx) {
    card(ctx, 102, 158, 436, 182, PAPER, "#a5bda0", 18);
    ctx.textAlign = "center";
    ctx.fillStyle = INK;
    ctx.font = FONT_BOLD;
    ctx.fillText(tr(this.game, "記録を 変更します", "Change this journal?"), 320, 194);
    ctx.font = '14px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText(this.confirm.text, 320, 228, 404);
    this.drawButton(ctx, 150, 260, 156, tr(this.game, "はい", "Yes"), this.confirm.yes, true);
    this.drawButton(ctx, 334, 260, 156, tr(this.game, "いいえ", "No"), !this.confirm.yes);
    ctx.fillStyle = MUTED;
    ctx.font = '12px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText(tr(this.game, "←→ で えらぶ / Z で けってい / X で もどる", "←→ to choose / Z to confirm / X to go back"), 320, 325);
  }

  drawNamePrompt(ctx) {
    card(ctx, 100, 140, 440, 218, PAPER, "#a5bda0", 18);
    ctx.textAlign = "center";
    ctx.fillStyle = INK;
    ctx.font = FONT_BOLD;
    ctx.fillText(tr(this.game, "きみの なまえを おしえて。", "What shall we call you?"), 320, 181);
    ctx.fillStyle = MUTED;
    ctx.font = '13px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText(tr(this.game, "ニックネームで、ぼうけんを はじめよう。", "Choose a nickname for your adventure."), 320, 207);
    this.drawButton(ctx, 130, 292, 178, tr(this.game, "もどる", "Back"), false);
    this.drawButton(ctx, 332, 292, 178, tr(this.game, "ぼうけんへ！", "Let's explore!"), true);
  }

  drawButton(ctx, x, y, width, label, selected, danger = false) {
    card(ctx, x, y, width, 44, selected ? danger ? "#9a5144" : "#35634b" : "#f6f1df", selected ? "#35634b" : "#d8d7bd", 9);
    ctx.fillStyle = selected ? PAPER : INK;
    ctx.font = FONT_BOLD;
    ctx.textAlign = "center";
    ctx.fillText(label, x + width / 2, y + 28);
  }
}

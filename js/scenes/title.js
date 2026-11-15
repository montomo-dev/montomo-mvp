import { hasSave, loadSave, clearSave, SAVE_SLOT_COUNT } from "../systems/save.js";
import { drawMonster } from "../sprites.js";
import { panel, fitText, FONT, FONT_BOLD } from "../ui.js";
import { sfxSelect, sfxConfirm, sfxCancel } from "../audio.js";
import { tr } from "../i18n.js";
import { playBgm } from "../music.js";
import { drawTitleBackground } from "../backgrounds.js";

const nameInput = document.getElementById("name-input");
const MENU_OPTIONS = ["continue", "new", "delete"];
function menuOptionLabel(game, key) {
  return tr(
    game,
    { continue: "つづきから", new: "はじめから", delete: "セーブを けす" }[key],
    { continue: "Continue", new: "New Game", delete: "Delete Save" }[key]
  );
}

function drawSaveCard(ctx, x, y, w, h, selected) {
  ctx.save();
  ctx.shadowColor = selected ? "rgba(22, 57, 47, 0.28)" : "rgba(22, 57, 47, 0.14)";
  ctx.shadowBlur = selected ? 14 : 7;
  ctx.shadowOffsetY = selected ? 7 : 3;
  ctx.beginPath();
  ctx.roundRect(x, y - (selected ? 2 : 0), w, h, 14);
  ctx.fillStyle = selected ? "#f7f6dc" : "rgba(247, 246, 220, 0.9)";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = selected ? "#efbe65" : "rgba(22, 57, 47, 0.48)";
  ctx.lineWidth = selected ? 4 : 2;
  ctx.stroke();
  if (selected) {
    ctx.fillStyle = "#efbe65";
    ctx.beginPath();
    ctx.moveTo(x - 12, y + h / 2);
    ctx.lineTo(x - 2, y + h / 2 - 9);
    ctx.lineTo(x - 2, y + h / 2 + 9);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.cursor = 0;
    this.renamingSlot = null;
    this.confirm = null; // null | { action, yes, text, slot }
    this.notice = null;
    this.noticeTimer = 0;
    this.phase = "slots"; // slots | menu | confirm
    this.menuSlot = null;
    this.menuCursor = 0;
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
    if (this.renamingSlot !== null) return;
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
          this.setNotice(tr(this.game, "セーブデータを けしたよ", "Save data deleted."));
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

  promptNameAndStart(slot) {
    this.renamingSlot = slot;
    const canvas = this.game.canvas;
    const scale = canvas.getBoundingClientRect().width / canvas.width;
    nameInput.style.left = `${220 * scale}px`;
    nameInput.style.top = `${206 * scale}px`;
    nameInput.style.width = `${200 * scale}px`;
    nameInput.value = "";
    nameInput.classList.add("visible");
    nameInput.focus?.();

    const finish = (commit) => {
      nameInput.removeEventListener("keydown", onKeyDown);
      nameInput.removeEventListener("blur", onBlur);
      nameInput.classList.remove("visible");
      // display:none による暗黙のblurはレンダリング更新まで遅れる。
      // その間 input.js が activeElement===INPUT を見て全キーを捨てるので、明示的に外す。
      nameInput.blur();
      const trimmed = nameInput.value.trim();
      this.renamingSlot = null;
      if (commit) {
        this.game.startAdventure(null, slot, trimmed.length > 0 ? trimmed : tr(this.game, "ぼうけんしゃ", "Adventurer"));
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
    if (!drawTitleBackground(ctx, this.time, Boolean(this.game.reducedMotion))) {
      ctx.fillStyle = "#e8f2db";
      ctx.fillRect(0, 0, 640, 480);
    }

    const motionTime = this.game.reducedMotion ? 0 : this.time;
    drawMonster(ctx, "mofuri", 210, 230, 1.18, motionTime);
    drawMonster(ctx, "hibachi", 320, 232, 1.34, motionTime + 1.3);
    drawMonster(ctx, "fuwarisu", 430, 230, 1.14, motionTime + 2.2);

    ctx.textAlign = "center";
    ctx.fillStyle = "#16392f";
    ctx.font = 'bold 56px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#16392f";
    ctx.fillStyle = "#f7f6dc";
    ctx.strokeText(tr(this.game, "モンとも", "Montomo"), 320, 86);
    ctx.fillText(tr(this.game, "モンとも", "Montomo"), 320, 86);
    ctx.font = FONT_BOLD;
    ctx.fillStyle = "#22664c";
    ctx.fillText(tr(this.game, "なかまと見つける、まだ知らない世界。", "Find an unknown world together."), 320, 116);

    if (this.notice && this.renamingSlot == null) {
      ctx.fillStyle = "#f7f6dc";
      ctx.font = 'bold 12px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      ctx.fillRect(178, 266, 284, 22);
      ctx.fillStyle = "#f7f6dc";
      ctx.strokeStyle = "rgba(22, 57, 47, 0.45)";
      ctx.lineWidth = 1;
      ctx.strokeRect(178, 266, 284, 22);
      ctx.fillStyle = "#16392f";
      ctx.fillText(this.notice, 320, 276);
    }

    this.slots.forEach((entry, i) => {
      const y = 292 + i * 53;
      const selected = this.phase === "slots" && this.cursor === i;
      drawSaveCard(ctx, 76, y, 488, 44, selected);
      ctx.textAlign = "left";
      ctx.fillStyle = "#16392f";
      ctx.font = FONT_BOLD;
      if (entry.empty) {
        ctx.fillText(tr(this.game, "新しい冒険", "New adventure"), 98, y + 20);
        ctx.fillStyle = "#416b55";
        ctx.font = '12px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
        ctx.fillText(tr(this.game, `スロット${entry.slot + 1}・まだ見ぬ仲間を探しに行こう`, `Slot ${entry.slot + 1} · Meet a new companion`), 98, y + 36);
      } else {
        const playerLabel = entry.playerName || tr(this.game, "ぼうけんしゃ", "Adventurer");
        ctx.fillText(playerLabel, 98, y + 20);
        ctx.fillStyle = "#416b55";
        ctx.font = '12px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
        ctx.fillText(`${tr(this.game, `スロット${entry.slot + 1}`, `Slot ${entry.slot + 1}`)}・${entry.leaderName} Lv.${entry.leaderLevel}`, 98, y + 36);
      }
      if (selected) {
        const action = entry.empty ? tr(this.game, "はじめる", "Start") : tr(this.game, "つづける", "Continue");
        ctx.fillStyle = "#22664c";
        ctx.beginPath();
        ctx.roundRect(466, y + 8, 78, 27, 14);
        ctx.fill();
        ctx.fillStyle = "#f7f6dc";
        ctx.font = 'bold 12px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(action, 505, y + 27);
      }
    });
    ctx.textAlign = "center";

    ctx.font = '13px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillStyle = "#16392f";
    if (this.phase === "slots") {
      ctx.fillText(tr(this.game, "↑↓ 選ぶ　Z / Enter 決定", "Up/Down choose · Z / Enter confirm"), 320, 464);
    } else if (this.phase === "menu") {
      ctx.fillText(tr(this.game, "↑↓ 選ぶ　Z 決定　X 戻る", "Up/Down choose · Z confirm · X back"), 320, 464);
    }

    if (this.phase === "menu") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, 640, 480);
      const options = MENU_OPTIONS;
      panel(ctx, 190, 170, 260, 40 + options.length * 38);
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.fillText(tr(this.game, `スロット${this.menuSlot + 1}`, `Slot ${this.menuSlot + 1}`), 320, 196);
      options.forEach((opt, i) => {
        const y = 230 + i * 38;
        ctx.fillStyle = this.menuCursor === i ? "#e8842e" : "#3a3a52";
        ctx.fillText(menuOptionLabel(this.game, opt), 320, y);
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
      ctx.fillText(tr(this.game, "はい", "Yes"), 250, y);
      ctx.fillStyle = !this.confirm.yes ? "#e8842e" : "#3a3a52";
      ctx.fillText(tr(this.game, "いいえ", "No"), 396, y);
      ctx.font = FONT;
      ctx.fillStyle = "#5a5a70";
      ctx.fillText(tr(this.game, "←→: えらぶ ／ Z: けってい ／ X: やめる", "Left/Right: Choose / Z: Confirm / X: Cancel"), 320, 300);
    }

    // 名前入力の HTML 欄は canvas 座標 (220,212)-(420,246) に重なるので、
    // その帯を空けたレイアウトで描く。
    if (this.renamingSlot != null) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, 640, 480);
      panel(ctx, 80, 156, 480, 168);
      ctx.textAlign = "center";
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      fitText(ctx, tr(this.game, "ぼうけんしゃの なまえを にゅうりょくしてください", "Enter your adventurer's name"), 320, 190, 440);
      ctx.fillStyle = "#5a5a70";
      ctx.font = '14px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      fitText(ctx, tr(this.game, "Enter: けってい ／ Esc: やめる", "Enter: Confirm / Esc: Cancel"), 320, 264, 440);
      ctx.fillStyle = "#a33";
      fitText(ctx, tr(this.game, "※ ほんみょうなど、こじんが とくていできる", "* Do not use your real name or"), 320, 290, 440);
      fitText(ctx, tr(this.game, "なまえは つけないでください", "other identifying info"), 320, 310, 440);
    }

    ctx.textAlign = "left";
  }
}

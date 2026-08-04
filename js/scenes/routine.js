import { COURSES, COURSE_IDS, BONUS_STEPS, stepsOf } from "../data/routine.js";
import {
  loadRoutineState,
  routineDayKey,
  isDoneToday,
  todayProgress,
  recordProgress,
  completeRoutine,
} from "../systems/routine.js";
import { ITEMS } from "../data/items.js";
import { drawMonster } from "../sprites.js";
import { panel, FONT, FONT_BOLD } from "../ui.js";
import { sfxSelect, sfxConfirm, sfxCancel, sfxRoutineStep, sfxRoutineUndo, sfxRoutineComplete } from "../audio.js";
import { tr } from "../i18n.js";

const EMOJI_FONT = (size) => `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
const CONFETTI_COLORS = ["#ffd75e", "#8fd6ff", "#ffa8c5", "#a6e3a1", "#e8842e"];

// 進捗バーの左端と幅。歩くモンスターの位置もこれに合わせる
const BAR_X = 100;
const BAR_W = 440;
const BAR_Y = 76;

export class RoutineScene {
  constructor(game, onExit) {
    this.game = game;
    this.onExit = onExit;
    this.time = 0;
    this.state = loadRoutineState();
    this.today = routineDayKey();
    this.phase = "course"; // course | run | bonus | result
    this.cursor = 0;
    this.courseId = "min";
    this.steps = [];
    this.index = 0;
    this.bonusSelected = new Set();
    this.confetti = [];
    this.result = null;
    this.resume = todayProgress(this.state, this.today);
    this.doneToday = isDoneToday(this.state, this.today);
  }

  // ── 進行 ──────────────────────────────────────────────

  startCourse(courseId) {
    this.courseId = courseId;
    this.steps = stepsOf(courseId);
    // 同じコースの途中経過が残っていれば、そこから続ける。
    // 朝は中断が起きやすいので、開き直したときに最初からやり直さないことを優先する
    if (this.resume && this.resume.courseId === courseId) {
      const done = new Set(this.resume.checked);
      const firstUnchecked = this.steps.findIndex((s) => !done.has(s.id));
      this.index = firstUnchecked === -1 ? this.steps.length - 1 : firstUnchecked;
    } else {
      this.index = 0;
    }
    this.phase = "run";
  }

  checkedIds() {
    return this.steps.slice(0, this.index).map((s) => s.id);
  }

  advance() {
    sfxRoutineStep(this.index, this.steps.length);
    this.index += 1;
    if (this.index >= this.steps.length) {
      recordProgress(this.courseId, this.steps.map((s) => s.id), this.today);
      this.phase = "bonus";
      this.cursor = 0;
      return;
    }
    recordProgress(this.courseId, this.checkedIds(), this.today);
  }

  stepBack() {
    if (this.index === 0) {
      sfxCancel();
      this.phase = "course";
      this.cursor = COURSE_IDS.indexOf(this.courseId);
      return;
    }
    sfxRoutineUndo();
    this.index -= 1;
    recordProgress(this.courseId, this.checkedIds(), this.today);
  }

  // 今すぐできない項目を後ろへ回す。ここで詰まって朝ごと止まるのを防ぐための逃げ道
  postpone() {
    if (this.index >= this.steps.length - 1) return;
    sfxSelect();
    const [step] = this.steps.splice(this.index, 1);
    this.steps.push(step);
  }

  finish() {
    const outcome = completeRoutine({
      courseId: this.courseId,
      bonusCount: this.bonusSelected.size,
      now: new Date(),
    });
    this.result = outcome;
    this.state = outcome.state;
    this.phase = "result";
    this.spawnConfetti();
    sfxRoutineComplete();
  }

  spawnConfetti() {
    for (let i = 0; i < 90; i++) {
      this.confetti.push({
        x: Math.random() * 640,
        y: -Math.random() * 480,
        vx: (Math.random() - 0.5) * 40,
        vy: 70 + Math.random() * 110,
        size: 4 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      });
    }
  }

  exit() {
    this.onExit();
  }

  // ── 入力 ──────────────────────────────────────────────

  update(dt) {
    this.time += dt;
    for (const p of this.confetti) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
    }
    const input = this.game.input;

    if (this.phase === "course") {
      const count = COURSE_IDS.length;
      if (input.wasPressed("up")) { this.cursor = (this.cursor + count - 1) % count; sfxSelect(); }
      if (input.wasPressed("down")) { this.cursor = (this.cursor + 1) % count; sfxSelect(); }
      if (input.wasPressed("cancel")) { sfxCancel(); this.exit(); return; }
      if (input.wasPressed("ok")) { sfxConfirm(); this.startCourse(COURSE_IDS[this.cursor]); }
      return;
    }

    if (this.phase === "run") {
      if (input.wasPressed("ok")) this.advance();
      else if (input.wasPressed("cancel")) this.stepBack();
      else if (input.wasPressed("down")) this.postpone();
      return;
    }

    if (this.phase === "bonus") {
      const count = BONUS_STEPS.length + 1; // 末尾は「これで おわる」
      if (input.wasPressed("up")) { this.cursor = (this.cursor + count - 1) % count; sfxSelect(); }
      if (input.wasPressed("down")) { this.cursor = (this.cursor + 1) % count; sfxSelect(); }
      if (input.wasPressed("cancel")) { sfxCancel(); this.finish(); return; }
      if (input.wasPressed("ok")) {
        if (this.cursor === BONUS_STEPS.length) { sfxConfirm(); this.finish(); return; }
        const id = BONUS_STEPS[this.cursor].id;
        if (this.bonusSelected.has(id)) { this.bonusSelected.delete(id); sfxRoutineUndo(); }
        else { this.bonusSelected.add(id); sfxRoutineStep(this.bonusSelected.size - 1, BONUS_STEPS.length); }
      }
      return;
    }

    if (this.phase === "result") {
      if (input.wasPressed("ok") || input.wasPressed("cancel")) { sfxConfirm(); this.exit(); }
    }
  }

  // ── 描画 ──────────────────────────────────────────────

  drawBackground(ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, 480);
    bg.addColorStop(0, "#ffe6b8");
    bg.addColorStop(0.5, "#cfeaff");
    bg.addColorStop(1, "#eaf8dc");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 640, 480);
    // 朝日。時間で少しだけ揺れる
    ctx.beginPath();
    ctx.arc(596, 46 + Math.sin(this.time * 0.8) * 3, 30, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 214, 120, 0.65)";
    ctx.fill();
  }

  draw(ctx) {
    this.drawBackground(ctx);
    ctx.textAlign = "center";
    if (this.phase === "course") this.drawCourse(ctx);
    else if (this.phase === "run") this.drawRun(ctx);
    else if (this.phase === "bonus") this.drawBonus(ctx);
    else if (this.phase === "result") this.drawResult(ctx);
    ctx.textAlign = "left";
  }

  drawHint(ctx, text) {
    ctx.font = FONT;
    ctx.fillStyle = "#5a5a70";
    ctx.fillText(text, 320, 458);
  }

  drawCourse(ctx) {
    ctx.fillStyle = "#3a3a52";
    ctx.font = 'bold 32px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText(tr(this.game, "あさの したく", "Morning Routine"), 320, 72);

    ctx.font = FONT_BOLD;
    const { streak, bestStreak, totalDays } = this.state;
    if (this.doneToday) {
      ctx.fillStyle = "#2e7d32";
      ctx.fillText(
        tr(this.game, `きょうは もう かんりょう！ ${streak}日 れんぞく`, `Already done today! ${streak}-day streak`),
        320, 104
      );
    } else if (streak > 0) {
      ctx.fillStyle = "#3a3a52";
      ctx.fillText(
        tr(this.game, `いまの れんぞく: ${streak}日 ／ さいこう: ${bestStreak}日`, `Streak: ${streak} days / Best: ${bestStreak}`),
        320, 104
      );
    } else {
      ctx.fillStyle = "#3a3a52";
      ctx.fillText(tr(this.game, "きょうから はじめよう", "Let's start today"), 320, 104);
    }

    COURSE_IDS.forEach((id, i) => {
      const course = COURSES[id];
      const y = 136 + i * 92;
      panel(ctx, 100, y, 440, 78);
      if (this.cursor === i) {
        ctx.beginPath();
        ctx.roundRect(100, y, 440, 78, 10);
        ctx.strokeStyle = "#ffd75e";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.textAlign = "left";
      ctx.fillStyle = "#3a3a52";
      ctx.font = 'bold 22px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      ctx.fillText(
        `${tr(this.game, course.ja, course.en)}(${course.steps.length}${tr(this.game, "こ", "")})`,
        124, y + 32
      );
      ctx.font = FONT;
      ctx.fillStyle = "#5c7d58";
      ctx.fillText(tr(this.game, course.descJa, course.descEn), 124, y + 58);
      if (this.resume && this.resume.courseId === id) {
        ctx.textAlign = "right";
        ctx.fillStyle = "#e8842e";
        ctx.font = FONT_BOLD;
        ctx.fillText(
          tr(this.game, `とちゅうから (${this.resume.checked.length})`, `Resume (${this.resume.checked.length})`),
          516, y + 32
        );
      }
      ctx.textAlign = "center";
    });

    if (totalDays > 0) {
      ctx.font = FONT;
      ctx.fillStyle = "#5a5a70";
      ctx.fillText(tr(this.game, `これまで ${totalDays}日 ぶん`, `${totalDays} days so far`), 320, 344);
    }

    drawMonster(ctx, "mofuri", 320, 396, 0.9, this.time);
    this.drawHint(ctx, tr(this.game, "↑↓: えらぶ ／ Z: はじめる ／ X: もどる", "Up/Down: Choose / Z: Start / X: Back"));
  }

  drawRun(ctx) {
    const total = this.steps.length;
    const step = this.steps[this.index];
    const progress = this.index / total;

    // 進捗バー
    ctx.beginPath();
    ctx.roundRect(BAR_X, BAR_Y, BAR_W, 14, 7);
    ctx.fillStyle = "#ffffffcc";
    ctx.fill();
    if (progress > 0) {
      ctx.beginPath();
      ctx.roundRect(BAR_X, BAR_Y, Math.max(14, BAR_W * progress), 14, 7);
      ctx.fillStyle = "#58c25a";
      ctx.fill();
    }
    ctx.beginPath();
    ctx.roundRect(BAR_X, BAR_Y, BAR_W, 14, 7);
    ctx.strokeStyle = "#3a3a52";
    ctx.lineWidth = 2;
    ctx.stroke();

    // ゴールに向かって歩くモンスター。残りがひと目で分かる
    drawMonster(ctx, "mofuri", BAR_X + BAR_W * progress, BAR_Y - 28, 0.5, this.time * 2);
    ctx.font = EMOJI_FONT(20);
    ctx.fillText("🚩", BAR_X + BAR_W + 18, BAR_Y + 14);

    // カウンタはバーの下。バーの上は歩くモンスターの通り道なので空けておく
    ctx.font = FONT_BOLD;
    ctx.fillStyle = "#3a3a52";
    ctx.fillText(`${this.index + 1} / ${total}`, 320, 114);

    // いま やる ひとつだけを大きく出す。
    // ここに複数並べると「どれから？」の判断が挟まってしまう
    panel(ctx, 70, 132, 500, 186);
    ctx.font = EMOJI_FONT(58);
    ctx.fillText(step.icon, 320, 212);
    ctx.fillStyle = "#3a3a52";
    ctx.font = 'bold 26px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText(tr(this.game, step.ja, step.en), 320, 278);

    const next = this.steps[this.index + 1];
    ctx.font = FONT;
    ctx.fillStyle = "#5a5a70";
    if (next) {
      ctx.fillText(`${tr(this.game, "つぎ", "Next")}: ${next.icon} ${tr(this.game, next.ja, next.en)}`, 320, 348);
    } else {
      ctx.fillStyle = "#e8842e";
      ctx.font = FONT_BOLD;
      ctx.fillText(tr(this.game, "これで さいご！", "Last one!"), 320, 348);
    }

    // 済んだぶんの点。増えていくのが見えるようにする
    const dotSpan = Math.min(18, 400 / total);
    const startX = 320 - (dotSpan * (total - 1)) / 2;
    for (let i = 0; i < total; i++) {
      ctx.beginPath();
      ctx.arc(startX + dotSpan * i, 388, 5, 0, Math.PI * 2);
      ctx.fillStyle = i < this.index ? "#58c25a" : i === this.index ? "#ffd75e" : "#ffffffcc";
      ctx.fill();
      ctx.strokeStyle = "#3a3a52";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    this.drawHint(
      ctx,
      tr(this.game, "Z: できた ／ ↓: あとに まわす ／ X: ひとつ もどる", "Z: Done / Down: Do later / X: Back one")
    );
  }

  drawBonus(ctx) {
    ctx.fillStyle = "#3a3a52";
    ctx.font = 'bold 26px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText(tr(this.game, "よゆうが あれば やったもの", "Anything extra you did?"), 320, 62);
    ctx.font = FONT;
    ctx.fillStyle = "#5a5a70";
    ctx.fillText(tr(this.game, "やってなくても だいじょうぶ", "It's fine if you didn't"), 320, 86);

    const rows = [...BONUS_STEPS, null];
    rows.forEach((item, i) => {
      const y = 108 + i * 42;
      const selected = this.cursor === i;
      panel(ctx, 130, y, 380, 36);
      if (selected) {
        ctx.beginPath();
        ctx.roundRect(130, y, 380, 36, 10);
        ctx.strokeStyle = "#ffd75e";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.textAlign = "left";
      if (item === null) {
        ctx.fillStyle = "#e8842e";
        ctx.font = FONT_BOLD;
        ctx.fillText(tr(this.game, "▶ これで おわる", "▶ Finish"), 152, y + 24);
      } else {
        const on = this.bonusSelected.has(item.id);
        ctx.font = EMOJI_FONT(17);
        ctx.fillText(on ? "✅" : "⬜", 148, y + 24);
        ctx.font = EMOJI_FONT(16);
        ctx.fillText(item.icon, 176, y + 24);
        ctx.font = on ? FONT_BOLD : FONT;
        ctx.fillStyle = on ? "#2e7d32" : "#3a3a52";
        ctx.fillText(tr(this.game, item.ja, item.en), 202, y + 24);
      }
      ctx.textAlign = "center";
    });

    this.drawHint(ctx, tr(this.game, "↑↓: えらぶ ／ Z: チェック ／ X: そのまま おわる", "Up/Down: Move / Z: Toggle / X: Finish"));
  }

  drawResult(ctx) {
    for (const p of this.confetti) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    const { reward, streak, alreadyDone, firstEver } = this.result;
    const pop = 1 + Math.max(0, 0.25 - this.time * 0.05) * Math.sin(this.time * 12);

    ctx.save();
    ctx.translate(320, 104);
    ctx.scale(pop, pop);
    ctx.fillStyle = "#2e7d32";
    ctx.font = 'bold 38px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText(tr(this.game, "できた！", "Done!"), 0, 0);
    ctx.restore();

    ctx.font = 'bold 24px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillStyle = "#3a3a52";
    ctx.fillText(tr(this.game, `${streak}日 れんぞく`, `${streak}-day streak`), 320, 152);

    // 途切れた翌日でも責めない。「また 1日目」と、続きであることだけを伝える
    ctx.font = FONT;
    ctx.fillStyle = "#5c7d58";
    if (firstEver) {
      ctx.fillText(tr(this.game, "はじめの 1日。ここが スタート", "Day one. This is the start."), 320, 180);
    } else if (streak === 1) {
      ctx.fillText(tr(this.game, "ひさしぶりでも、また ここから", "Been a while — starting again from here."), 320, 180);
    } else {
      ctx.fillText(tr(this.game, "きのうの じぶんに つながった", "Connected to yesterday's you."), 320, 180);
    }

    panel(ctx, 130, 204, 380, 108);
    if (alreadyDone) {
      ctx.fillStyle = "#5a5a70";
      ctx.font = FONT;
      ctx.fillText(tr(this.game, "きょうの ごほうびは うけとりずみ", "Today's reward was already claimed"), 320, 262);
    } else {
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.fillText(tr(this.game, `ごほうび ${reward.money} G`, `Reward: ${reward.money} G`), 320, 236);
      ctx.font = FONT;
      ctx.fillStyle = "#5a5a70";
      ctx.fillText(
        tr(
          this.game,
          `したく ${reward.base} ＋ おまけ ${reward.bonus} ＋ れんぞく ${reward.streakBonus}`,
          `Routine ${reward.base} + Extra ${reward.bonus} + Streak ${reward.streakBonus}`
        ),
        320, 262
      );
      const itemIds = Object.keys(reward.items);
      if (itemIds.length > 0) {
        const names = itemIds.map((id) => tr(this.game, ITEMS[id]?.name || id, ITEMS[id]?.nameEn || id)).join("、");
        ctx.fillStyle = "#e8842e";
        ctx.font = FONT_BOLD;
        ctx.fillText(tr(this.game, `${names} が とどいた！`, `${names} arrived!`), 320, 292);
      } else {
        ctx.fillStyle = "#5a5a70";
        ctx.fillText(tr(this.game, "ぼうけんを はじめると うけとれる", "Claim it when you start your adventure"), 320, 292);
      }
    }

    drawMonster(ctx, "mofuri", 240, 372, 0.85, this.time * 2);
    drawMonster(ctx, "hibachi", 320, 366, 0.95, this.time * 2 + 1.1);
    drawMonster(ctx, "fuwarisu", 400, 372, 0.85, this.time * 2 + 2.1);

    this.drawHint(ctx, tr(this.game, "Z: タイトルへ もどる", "Z: Back to title"));
  }
}

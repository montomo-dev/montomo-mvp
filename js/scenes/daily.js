import { panel, FONT, FONT_BOLD } from "../ui.js";
import { tr } from "../i18n.js";
import { questById, ALL_DONE_BONUS } from "../systems/daily.js";
import { ACHIEVEMENTS, achievementName } from "../systems/achievements.js";
import { ITEMS } from "../data/items.js";
import { sfxCancel, sfxSelect } from "../audio.js";

const VISIBLE_ACHIEVEMENTS = 7;

export class DailyScene {
  constructor(game, fieldScene) {
    this.game = game;
    this.fieldScene = fieldScene;
    this.tab = 0;
    this.scroll = 0;
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed("cancel") || input.wasPressed("quest")) {
      sfxCancel();
      this.game.changeScene(this.fieldScene);
      return;
    }
    if (input.wasPressed("left") || input.wasPressed("right")) {
      this.tab = 1 - this.tab;
      this.scroll = 0;
      sfxSelect();
    }
    if (this.tab === 1) {
      const maxScroll = Math.max(0, ACHIEVEMENTS.length - VISIBLE_ACHIEVEMENTS);
      if (input.wasPressed("up")) this.scroll = Math.max(0, this.scroll - 1);
      if (input.wasPressed("down")) this.scroll = Math.min(maxScroll, this.scroll + 1);
    }
  }

  draw(ctx) {
    ctx.fillStyle = "#2e3350";
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = "#f0ead8";
    ctx.font = 'bold 24px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(
      this.tab === 0 ? tr(this.game, "きょうの もくひょう", "Daily Goals") : tr(this.game, "じっせき", "Achievements"),
      30, 44
    );
    ctx.font = FONT;
    ctx.textAlign = "right";
    ctx.fillText(tr(this.game, "←→: きりかえ ／ X: もどる", "←→: Switch / X: Back"), 610, 44);
    ctx.textAlign = "left";

    if (this.tab === 0) this.drawDaily(ctx);
    else this.drawAchievements(ctx);
  }

  drawDaily(ctx) {
    const daily = this.game.daily;
    if (!daily) return;

    daily.quests.forEach((id, i) => {
      const quest = questById(id);
      if (!quest) return;
      const y = 76 + i * 100;
      const done = !!daily.done[id];
      const progress = Math.min(quest.target, daily.progress[id] || 0);
      panel(ctx, 20, y, 600, 72);
      ctx.fillStyle = done ? "#4a8f4a" : "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.fillText(`${done ? "✓ " : ""}${tr(this.game, quest.ja, quest.en)}`, 40, y + 28);
      ctx.textAlign = "right";
      ctx.fillText(tr(this.game, `ほうび ${quest.reward}えん`, `Reward: ${quest.reward}`), 600, y + 28);
      ctx.textAlign = "left";

      const barX = 40;
      const barY = y + 42;
      const barW = 440;
      const barH = 14;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, barH / 2);
      ctx.fillStyle = "#dcd7c9";
      ctx.fill();
      const ratio = progress / quest.target;
      if (ratio > 0) {
        ctx.beginPath();
        ctx.roundRect(barX, barY, Math.max(barH, barW * ratio), barH, barH / 2);
        ctx.fillStyle = done ? "#58c25a" : "#e8b23d";
        ctx.fill();
      }
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, barH / 2);
      ctx.strokeStyle = "#3a3a52";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT;
      ctx.fillText(`${progress} / ${quest.target}`, barX + barW + 16, barY + 13);
    });

    panel(ctx, 20, 396, 600, 56);
    ctx.font = FONT_BOLD;
    const allDone = daily.quests.every((id) => daily.done[id]);
    const bonusItem = tr(this.game, ITEMS[ALL_DONE_BONUS.itemId].name, ITEMS[ALL_DONE_BONUS.itemId].nameEn);
    ctx.fillStyle = allDone ? "#4a8f4a" : "#3a3a52";
    ctx.fillText(
      allDone
        ? tr(this.game, "✓ ぜんぶ たっせい！ ボーナス うけとりずみ", "✓ All complete! Bonus claimed")
        : tr(this.game, `ぜんぶ たっせいで ボーナス: ${ALL_DONE_BONUS.money}えん + ${bonusItem}`, `Complete all for a bonus: ${ALL_DONE_BONUS.money} money + ${bonusItem}`),
      40, 430
    );
  }

  drawAchievements(ctx) {
    const flags = this.game.achievements || {};
    const total = ACHIEVEMENTS.length;
    const achieved = ACHIEVEMENTS.filter((a) => flags[a.id]).length;
    ctx.fillStyle = "#f0ead8";
    ctx.font = FONT_BOLD;
    ctx.fillText(tr(this.game, `たっせい ${achieved} / ${total}`, `Achieved ${achieved} / ${total}`), 30, 78);

    ACHIEVEMENTS.slice(this.scroll, this.scroll + VISIBLE_ACHIEVEMENTS).forEach((a, i) => {
      const y = 92 + i * 50;
      const done = !!flags[a.id];
      panel(ctx, 20, y, 600, 42);
      ctx.fillStyle = done ? "#4a8f4a" : "#8a8aa0";
      ctx.font = FONT_BOLD;
      ctx.fillText(done ? "✓" : "・", 36, y + 28);
      ctx.fillStyle = done ? "#3a3a52" : "#8a8aa0";
      ctx.fillText(achievementName(this.game, a), 62, y + 28);
      ctx.textAlign = "right";
      ctx.font = FONT;
      ctx.fillText(tr(this.game, `${a.reward}えん`, `${a.reward}`), 600, y + 28);
      ctx.textAlign = "left";
    });

    ctx.fillStyle = "#f0ead8";
    if (this.scroll > 0) ctx.fillText("▲", 314, 86);
    if (this.scroll + VISIBLE_ACHIEVEMENTS < total) ctx.fillText("▼", 314, 462);
  }
}

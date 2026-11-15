import { drawMonster } from "../sprites.js";
import { wrapText, FONT, FONT_BOLD } from "../ui.js";
import { TitleScene } from "./title.js";
import { monsterName } from "../data/monsters.js";
import { tr } from "../i18n.js";
import { playBgm } from "../music.js";
import { WorldArrivalScene } from "./cinematic.js";

export class EndingScene {
  constructor(game, opts = {}) {
    this.game = game;
    this.time = 0;
    this.canReturn = false;
    this.nextStageId = opts.nextStageId || null;
    this.subtitle = opts.subtitle
      || tr(game, "もりの ヌシを のりこえ、きみと なかまは でんせつに なった。", "You overcame the Forest Nushi, and you and your friends became legendary.");
    this.subtitleEn = opts.subtitleEn || null;
    playBgm("ending", { loop: false });
  }

  update(dt) {
    this.time += dt;
    if (this.time > 1.2) this.canReturn = true;
    const input = this.game.input;
    if (this.canReturn && (input.wasPressed("ok") || input.wasPressed("cancel"))) {
      if (this.nextStageId) {
        this.game.changeScene(new WorldArrivalScene(this.game, this.nextStageId));
      } else {
        this.game.changeScene(new TitleScene(this.game));
      }
    }
  }

  draw(ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, 480);
    bg.addColorStop(0, "#2a2350");
    bg.addColorStop(1, "#4a3a6a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 640, 480);

    const reveal = Math.min(1, this.time / 1.2);
    const flash = Math.max(0, 1 - this.time * 1.5);
    if (flash > 0) {
      ctx.fillStyle = `rgba(255, 245, 190, ${flash * 0.35})`;
      ctx.fillRect(0, 0, 640, 480);
    }

    for (let i = 0; i < 40; i++) {
      const x = (i * 97 + Math.sin(this.time + i) * 12 + 640) % 640;
      const y = (i * 53) % 300;
      const a = 0.35 + 0.55 * Math.abs(Math.sin(this.time * 2 + i));
      ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
      ctx.fillRect(x, y, 2, 2);
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffe89a";
    ctx.font = 'bold 44px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText(tr(this.game, "クリア！", "Cleared!"), 320, 84);

    ctx.fillStyle = "#f0ead8";
    ctx.font = FONT_BOLD;
    // 英語だと1行に収まらないボスがいるので折り返す
    wrapText(ctx, tr(this.game, this.subtitle, this.subtitleEn || this.subtitle), 560)
      .forEach((line, i) => ctx.fillText(line, 320, 124 + i * 24));

    const party = this.game.party.slice(0, 4);
    const startX = 320 - (party.length - 1) * 55;
    party.forEach((m, i) => {
      const x = startX + i * 110;
      drawMonster(ctx, m.speciesId, x, 250, 0.72 + reveal * 0.28, this.time + i, m.tintHue || 0);
      ctx.fillStyle = "#f0ead8";
      ctx.font = FONT;
      ctx.fillText(monsterName(m, this.game.lang), x, 322);
      ctx.fillText(`Lv.${m.level}`, x, 344);
    });

    ctx.save();
    ctx.globalAlpha = 0.2 + reveal * 0.2;
    ctx.strokeStyle = "#ffe89a";
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const angle = this.time * 0.5 + i * Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(320 + Math.cos(angle) * 110, 250 + Math.sin(angle) * 50);
      ctx.lineTo(320 + Math.cos(angle) * (145 + reveal * 25), 250 + Math.sin(angle) * (70 + reveal * 15));
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = "#ffd75e";
    ctx.font = FONT_BOLD;
    ctx.fillText(
      tr(this.game, "〜 モンとも 〜  あそんでくれて ありがとう！", "~ Montomo ~  Thanks for playing!"),
      320, 402
    );

    if (this.canReturn && Math.sin(this.time * 4) > 0) {
      ctx.fillStyle = "#f0ead8";
      ctx.font = FONT;
      const hint = this.nextStageId
        ? tr(this.game, "Z: つづきの ぼうけんへ", "Z: Continue your adventure")
        : tr(this.game, "Z: タイトルへ もどる", "Z: Return to title");
      ctx.fillText(hint, 320, 448);
    }
    ctx.textAlign = "left";
  }
}

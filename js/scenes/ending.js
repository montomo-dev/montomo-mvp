import { drawMonster } from "../sprites.js";
import { FONT, FONT_BOLD } from "../ui.js";
import { TitleScene } from "./title.js";
import { FieldScene } from "./field.js";

export class EndingScene {
  constructor(game, opts = {}) {
    this.game = game;
    this.time = 0;
    this.canReturn = false;
    this.nextStageId = opts.nextStageId || null;
  }

  update(dt) {
    this.time += dt;
    if (this.time > 1.2) this.canReturn = true;
    const input = this.game.input;
    if (this.canReturn && (input.wasPressed("ok") || input.wasPressed("cancel"))) {
      if (this.nextStageId) {
        const field = new FieldScene(this.game, this.nextStageId);
        this.game.field = field;
        this.game.save();
        this.game.changeScene(field);
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
    ctx.fillText("クリア！", 320, 84);

    ctx.fillStyle = "#f0ead8";
    ctx.font = FONT_BOLD;
    ctx.fillText("もりの ヌシを のりこえ、きみと なかまは でんせつに なった。", 320, 124);

    const party = this.game.party.slice(0, 4);
    const startX = 320 - (party.length - 1) * 55;
    party.forEach((m, i) => {
      const x = startX + i * 110;
      drawMonster(ctx, m.speciesId, x, 250, 1.0, this.time + i, m.tintHue || 0);
      ctx.fillStyle = "#f0ead8";
      ctx.font = FONT;
      ctx.fillText(m.name, x, 322);
      ctx.fillText(`Lv.${m.level}`, x, 344);
    });

    ctx.fillStyle = "#ffd75e";
    ctx.font = FONT_BOLD;
    ctx.fillText("〜 モンとも 〜  あそんでくれて ありがとう！", 320, 402);

    if (this.canReturn && Math.sin(this.time * 4) > 0) {
      ctx.fillStyle = "#f0ead8";
      ctx.font = FONT;
      const hint = this.nextStageId ? "Z: つづきの ぼうけんへ" : "Z: タイトルへ もどる";
      ctx.fillText(hint, 320, 448);
    }
    ctx.textAlign = "left";
  }
}

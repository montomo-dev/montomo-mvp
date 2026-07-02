import { EndingScene } from "./ending.js";
import { FieldScene } from "./field.js";
import { FONT, FONT_BOLD } from "../ui.js";

export class ChoiceScene {
  constructor(game) {
    this.game = game;
    this.cursor = 0;
    this.canSelect = false;
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
    if (this.time > 0.8) this.canSelect = true;

    const input = this.game.input;
    if (!this.canSelect) return;

    if (input.wasPressed("up")) {
      this.cursor = Math.max(0, this.cursor - 1);
    } else if (input.wasPressed("down")) {
      this.cursor = Math.min(1, this.cursor + 1);
    } else if (input.wasPressed("ok")) {
      if (this.cursor === 0) {
        this.game.changeScene(new EndingScene(this.game));
      } else {
        this.game.changeScene(new FieldScene(this.game, "reverse_stage1"));
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
    ctx.fillText("もりの ヌシを のりこえた…", 320, 140);

    ctx.fillStyle = "#ffd75e";
    ctx.font = FONT_BOLD;
    ctx.fillText("つぎは どうしますか？", 320, 200);

    const options = ["エンディングをみる", "ウラの世界へ進む"];
    options.forEach((text, i) => {
      const y = 270 + i * 50;
      const isSelected = i === this.cursor;
      ctx.fillStyle = isSelected ? "#ffff00" : "#f0ead8";
      ctx.font = isSelected ? FONT_BOLD : "20px sans-serif";
      ctx.fillText(isSelected ? "► " + text : "  " + text, 320, y);
    });

    if (this.canSelect && Math.sin(this.time * 4) > 0) {
      ctx.fillStyle = "#f0ead8";
      ctx.font = "16px sans-serif";
      ctx.fillText("↑↓: えらぶ  /  Z: けってい", 320, 448);
    }
    ctx.textAlign = "left";
  }
}

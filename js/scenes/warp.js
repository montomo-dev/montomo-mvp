import { panel, FONT, FONT_BOLD } from "../ui.js";
import { sfxSelect, sfxConfirm, sfxCancel } from "../audio.js";

const DESTINATIONS = [
  { town: "town1", label: "森の街", requires: null },
  { town: "sea_town1", label: "海の街", requires: "reverse_stage3" },
  { town: "snow_town1", label: "雪原の街", requires: "sea_stage3" },
  { town: "desert_town1", label: "砂漠の街", requires: "snow_stage3" },
  { town: "factory_town1", label: "工場の街", requires: "desert_stage3" },
  { town: "castle_town1", label: "魔王城下の街", requires: "factory_stage3" },
];

function isUnlocked(dest, flags) {
  if (!dest.requires) return true;
  return !!flags?.stageClearedFlags?.[dest.requires];
}

export class WarpScene {
  constructor(game, prevScene) {
    this.game = game;
    this.prev = prevScene;
    this.cursor = 0;
    this.time = 0;
  }

  unlockedDestinations() {
    return DESTINATIONS.filter((d) => isUnlocked(d, this.game.flags));
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    const list = this.unlockedDestinations();
    if (input.wasPressed("cancel") || input.wasPressed("warp")) {
      sfxCancel();
      this.game.changeScene(this.prev);
      return;
    }
    if (list.length === 0) return;
    if (input.wasPressed("up")) { this.cursor = (this.cursor + list.length - 1) % list.length; sfxSelect(); }
    if (input.wasPressed("down")) { this.cursor = (this.cursor + 1) % list.length; sfxSelect(); }
    if (input.wasPressed("ok")) this.warpTo(list[this.cursor]);
  }

  warpTo(dest) {
    sfxConfirm();
    this.prev.setStage(dest.town, "start");
    this.game.save();
    this.game.changeScene(this.prev);
  }

  draw(ctx) {
    ctx.fillStyle = "#2e3350";
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = "#f0ead8";
    ctx.font = 'bold 24px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("ワープ", 30, 44);

    const list = this.unlockedDestinations();
    list.forEach((dest, i) => {
      const y = 78 + i * 56;
      panel(ctx, 30, y, 580, 46);
      if (this.cursor === i) {
        ctx.beginPath();
        ctx.roundRect(30, y, 580, 46, 10);
        ctx.strokeStyle = "#ffd75e";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.fillText(dest.label, 48, y + 30);
    });

    ctx.fillStyle = "#f0ead8";
    ctx.font = FONT;
    ctx.fillText("↑↓: えらぶ ／ Z: ワープ ／ X または W: もどる", 30, 462);
  }
}

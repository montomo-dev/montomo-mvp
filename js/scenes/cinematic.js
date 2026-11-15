import { drawMonster } from "../sprites.js";
import { monsterName } from "../data/monsters.js";
import { FONT, FONT_BOLD } from "../ui.js";
import { sfxConfirm } from "../audio.js";
import { playBgm } from "../music.js";
import { tr } from "../i18n.js";
import { BattleScene } from "./battle.js";
import { FieldScene } from "./field.js";

const WORLD_COLORS = {
  forest: ["#102b2d", "#7cbf72", "#f7d776"],
  reverse: ["#27152f", "#c04bb3", "#d9ff9c"],
  sea: ["#102947", "#63b9d7", "#d4f5ff"],
  snow: ["#27344d", "#9bd7ed", "#ffffff"],
  desert: ["#4b2f23", "#e0a65d", "#fff0b0"],
  factory: ["#1f252c", "#e18b55", "#ffe19b"],
  castle: ["#1d1830", "#9b68cf", "#e4c8ff"],
};

function palette(world) {
  return WORLD_COLORS[world] || WORLD_COLORS.forest;
}

function drawBackdrop(ctx, time, colors, intensity = 1) {
  const bg = ctx.createLinearGradient(0, 0, 0, 480);
  bg.addColorStop(0, colors[0]);
  bg.addColorStop(1, "#090b15");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 640, 480);

  const pulse = 0.12 + Math.max(0, Math.sin(time * 3.2)) * 0.12 * intensity;
  const glow = ctx.createRadialGradient(450, 230, 10, 450, 230, 260);
  glow.addColorStop(0, `rgba(255,255,255,${pulse})`);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(140, 0, 500, 480);

  for (let i = 0; i < 28; i++) {
    const x = (i * 89 + Math.sin(time * 0.8 + i) * 18 + 640) % 640;
    const y = (i * 47 + time * (8 + i % 3) * intensity) % 430;
    const size = i % 5 === 0 ? 3 : 1.5;
    ctx.fillStyle = i % 3 === 0 ? colors[2] : colors[1];
    ctx.globalAlpha = 0.2 + (i % 4) * 0.12;
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1;
}

function drawBurst(ctx, x, y, radius, color, time, count = 12) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.45;
  for (let i = 0; i < count; i++) {
    const angle = time * 1.4 + i * Math.PI * 2 / count;
    const inner = radius * 0.4;
    const outer = radius + Math.sin(time * 3 + i) * 10;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
    ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

export class BossIntroScene {
  constructor(game, fieldScene, enemy, stageId) {
    this.game = game;
    this.fieldScene = fieldScene;
    this.enemy = enemy;
    this.stageId = stageId;
    this.time = 0;
    this.finished = false;
    this.world = fieldScene.world;
    this.colors = palette(this.world);
    playBgm("boss", { loop: true });
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.game.changeScene(new BattleScene(this.game, this.enemy, { isBoss: true, stageId: this.stageId }));
  }

  update(dt) {
    this.time += dt;
    if (this.time > 0.55 && this.game.input.wasPressed("ok")) {
      sfxConfirm();
      this.finish();
      return;
    }
    if (this.time >= 2.8) this.finish();
  }

  draw(ctx) {
    const t = this.time;
    const reveal = Math.max(0, Math.min(1, (t - 0.65) / 1.15));
    drawBackdrop(ctx, t, this.colors, 1.3);

    ctx.save();
    ctx.globalAlpha = 0.35 + reveal * 0.65;
    ctx.fillStyle = this.colors[1];
    ctx.beginPath();
    ctx.ellipse(468, 354, 120 + reveal * 34, 22 + reveal * 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawBurst(ctx, 468, 238, 98 + reveal * 28, this.colors[2], t, 16);
    ctx.save();
    ctx.translate(468, 235 + (1 - reveal) * 18);
    ctx.scale(0.7 + reveal * 0.95, 0.7 + reveal * 0.95);
    ctx.globalAlpha = 0.4 + reveal * 0.6;
    if (reveal < 0.7) ctx.filter = "brightness(0)";
    drawMonster(ctx, this.enemy.speciesId, 0, 0, 1.35, t, this.enemy.shiny ? 0 : 0);
    ctx.filter = "none";
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = this.colors[2];
    ctx.font = FONT_BOLD;
    ctx.globalAlpha = Math.max(0, Math.min(1, (t - 1.05) * 2));
    ctx.fillText(tr(this.game, "その先に、ヌシがいる…", "Beyond this path, the Nushi awaits..."), 320, 92);
    ctx.font = 'bold 30px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText(monsterName(this.enemy, this.game.lang), 468, 416);
    ctx.globalAlpha = 1;
    if (t > 1.1 && t < 2.7 && Math.sin(t * 6) > 0) {
      ctx.font = FONT;
      ctx.fillStyle = "#f5edcf";
      ctx.fillText(tr(this.game, "Z: すすむ", "Z: Continue"), 320, 455);
    }
    ctx.textAlign = "left";
  }
}

export class WorldArrivalScene {
  constructor(game, nextStageId) {
    this.game = game;
    this.nextStageId = nextStageId;
    this.time = 0;
    this.finished = false;
    this.field = new FieldScene(game, nextStageId);
    this.colors = palette(this.field.world);
    playBgm(`field_${this.field.world}`);
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.game.field = this.field;
    this.game.save();
    this.game.changeScene(this.field);
  }

  update(dt) {
    this.time += dt;
    if (this.time > 0.65 && this.game.input.wasPressed("ok")) {
      sfxConfirm();
      this.finish();
      return;
    }
    if (this.time >= 2.35) this.finish();
  }

  draw(ctx) {
    drawBackdrop(ctx, this.time, this.colors, 0.8);
    const p = Math.min(1, this.time / 1.2);
    ctx.save();
    ctx.globalAlpha = 0.35 + p * 0.65;
    ctx.fillStyle = this.colors[1];
    ctx.beginPath();
    ctx.arc(320, 228, 84 + p * 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawBurst(ctx, 320, 228, 92 + p * 46, this.colors[2], this.time, 18);

    ctx.textAlign = "center";
    ctx.fillStyle = "#fff4cb";
    ctx.font = 'bold 36px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.globalAlpha = Math.min(1, Math.max(0, (this.time - 0.35) * 2));
    ctx.fillText(tr(this.game, "新しい世界へ", "A New World"), 320, 110);
    ctx.fillStyle = this.colors[2];
    ctx.font = FONT_BOLD;
    ctx.fillText(tr(this.game, "見たことのない景色が、きみを待っている。", "An unknown horizon is waiting for you."), 320, 374);
    if (this.time > 0.9 && this.time < 2.25 && Math.sin(this.time * 6) > 0) {
      ctx.fillStyle = "#f5edcf";
      ctx.font = FONT;
      ctx.fillText(tr(this.game, "Z: ぼうけんを つづける", "Z: Continue adventure"), 320, 440);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }
}

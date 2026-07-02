import { BattleScene } from "./battle.js";
import { PartyScene } from "./party.js";
import { createMonster, rollWildSpecies } from "../data/monsters.js";
import { drawPlayer } from "../sprites.js";
import { panel, FONT_BOLD } from "../ui.js";

const TILE = 40;
const ENCOUNTER_RATE = 0.12;
const START = { x: 8, y: 10 };

const T_BUSH = 1;
const T_TREE = 2;
const T_SPRING = 3;
const T_BOSS = 4;

const LAYOUT = [
  "2222222222222222",
  "2400000000000302",
  "2001110000011002",
  "2001110000011002",
  "2000000000011002",
  "2002200000000002",
  "2002200111000002",
  "2000000111000002",
  "2001100000000022",
  "2001100000220002",
  "2000000000220002",
  "2222222222222222",
];

export class FieldScene {
  constructor(game) {
    this.game = game;
    this.map = LAYOUT.map((row) => [...row].map(Number));
    this.player = { ...START };
    this.facing = "down";
    this.moveCooldown = 0;
    this.time = 0;
    this.toast = null;
    this.flash = 0;
    this.pendingEnemy = null;
    this.pendingBoss = false;
  }

  resetPosition() {
    this.player = { ...START };
    this.facing = "down";
  }

  showToast(text) {
    this.toast = { text, timer: 2.4 };
  }

  tileAt(x, y) {
    return this.map[y] && this.map[y][x] !== undefined ? this.map[y][x] : T_TREE;
  }

  update(dt) {
    this.time += dt;
    if (this.toast && (this.toast.timer -= dt) <= 0) this.toast = null;
    if (this.flash > 0) {
      this.flash -= dt;
      if (this.flash <= 0) {
        this.game.changeScene(new BattleScene(this.game, this.pendingEnemy, { isBoss: this.pendingBoss }));
        this.pendingEnemy = null;
        this.pendingBoss = false;
      }
      return;
    }

    const input = this.game.input;
    if (input.wasPressed("save")) {
      const ok = this.game.save();
      this.showToast(ok ? "ぼうけんを セーブしたよ！" : "セーブに しっぱいした…");
      return;
    }
    if (input.wasPressed("cancel")) {
      this.game.changeScene(new PartyScene(this.game, this));
      return;
    }

    this.moveCooldown -= dt;
    if (this.moveCooldown > 0) return;
    let dx = 0;
    let dy = 0;
    if (input.isHeld("up")) { dy = -1; this.facing = "up"; }
    else if (input.isHeld("down")) { dy = 1; this.facing = "down"; }
    else if (input.isHeld("left")) { dx = -1; this.facing = "left"; }
    else if (input.isHeld("right")) { dx = 1; this.facing = "right"; }
    if (dx === 0 && dy === 0) return;

    const nx = this.player.x + dx;
    const ny = this.player.y + dy;
    if (this.tileAt(nx, ny) === T_TREE) return;
    this.player.x = nx;
    this.player.y = ny;
    this.moveCooldown = 0.14;
    this.onStep(this.tileAt(nx, ny));
  }

  onStep(tile) {
    if (tile === T_SPRING) {
      for (const m of this.game.party) m.hp = m.maxHp;
      this.showToast("いずみの ちからで みんな げんきに なった！");
      return;
    }
    if (tile === T_BOSS) {
      if (this.game.flags && this.game.flags.bossDefeated) {
        this.showToast("しずかな けはいが ただよっている…");
        return;
      }
      this.pendingEnemy = createMonster("nushi", 12);
      this.pendingBoss = true;
      this.flash = 0.6;
      return;
    }
    if (tile === T_BUSH && Math.random() < ENCOUNTER_RATE) {
      const speciesId = rollWildSpecies();
      const level = 1 + Math.floor(Math.random() * 3);
      this.pendingEnemy = createMonster(speciesId, level);
      this.flash = 0.45;
    }
  }

  draw(ctx) {
    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        const px = x * TILE;
        const py = y * TILE;
        ctx.fillStyle = "#a9d977";
        ctx.fillRect(px, py, TILE, TILE);
        if ((x * 7 + y * 13) % 5 === 0) {
          ctx.fillStyle = "#98cc66";
          ctx.fillRect(px + 8, py + 26, 4, 4);
          ctx.fillRect(px + 26, py + 10, 4, 4);
        }
        const tile = this.map[y][x];
        if (tile === T_BUSH) {
          ctx.fillStyle = "#7bbb4d";
          ctx.beginPath();
          ctx.roundRect(px + 3, py + 3, TILE - 6, TILE - 6, 8);
          ctx.fill();
          ctx.strokeStyle = "#5fa03e";
          ctx.lineWidth = 2.5;
          ctx.lineCap = "round";
          for (const ox of [10, 20, 30]) {
            ctx.beginPath();
            ctx.moveTo(px + ox, py + 30);
            ctx.quadraticCurveTo(px + ox - 3, py + 18, px + ox - 6, py + 12);
            ctx.moveTo(px + ox, py + 30);
            ctx.quadraticCurveTo(px + ox + 3, py + 18, px + ox + 6, py + 12);
            ctx.stroke();
          }
        } else if (tile === T_TREE) {
          ctx.fillStyle = "#8a5a35";
          ctx.fillRect(px + 15, py + 20, 10, 14);
          ctx.fillStyle = "#4e8f43";
          ctx.beginPath();
          ctx.arc(px + 20, py + 14, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#66a858";
          ctx.beginPath();
          ctx.arc(px + 15, py + 10, 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === T_SPRING) {
          ctx.fillStyle = "#6db8e8";
          ctx.beginPath();
          ctx.roundRect(px + 4, py + 4, TILE - 8, TILE - 8, 14);
          ctx.fill();
          ctx.strokeStyle = "#4a92c4";
          ctx.lineWidth = 2;
          ctx.stroke();
          const sparkle = 2 + Math.sin(this.time * 4 + x) * 1.5;
          ctx.fillStyle = "#e8f7ff";
          ctx.beginPath();
          ctx.arc(px + 20, py + 18, sparkle, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === T_BOSS) {
          const defeated = this.game.flags && this.game.flags.bossDefeated;
          ctx.fillStyle = defeated ? "#9a9a9a" : "#d64545";
          ctx.fillRect(px + 8, py + 8, 5, 28);
          ctx.fillRect(px + 27, py + 8, 5, 28);
          ctx.fillRect(px + 4, py + 6, 32, 6);
          ctx.fillRect(px + 7, py + 15, 26, 4);
        }
      }
    }

    drawPlayer(ctx, this.player.x * TILE + 20, this.player.y * TILE + 20, this.facing, this.time);

    if (this.toast) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.toast.timer);
      panel(ctx, 90, 16, 460, 44);
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.textAlign = "center";
      ctx.fillText(this.toast.text, 320, 44);
      ctx.restore();
      ctx.textAlign = "left";
    }

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin((this.flash / 0.45) * Math.PI)})`;
      ctx.fillRect(0, 0, 640, 480);
    }
  }
}

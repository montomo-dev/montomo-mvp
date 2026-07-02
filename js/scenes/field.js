import { BattleScene } from "./battle.js";
import { PartyScene } from "./party.js";
import { RanchScene } from "./ranch.js";
import { PokedexScene } from "./pokedex.js";
import { createMonster, rollWildSpecies } from "../data/monsters.js";
import { AREAS } from "../data/areas.js";
import { drawCompanion, drawPlayer } from "../sprites.js";
import { panel, FONT_BOLD } from "../ui.js";

const TILE = 40;
const ENCOUNTER_RATE = 0.12;

const T_BUSH = 1;
const T_TREE = 2;
const T_SPRING = 3;
const T_BOSS = 4;
const T_RANCH = 5;
const T_EXIT = 6;

export class FieldScene {
  constructor(game, areaId = "forest", entryPos = null) {
    this.game = game;
    this.area = AREAS[areaId];
    this.map = this.area.layout.map((row) => [...row].map(Number));
    this.player = { ...(entryPos || this.area.start) };
    this.facing = "down";
    this.moveCooldown = 0;
    this.time = 0;
    this.toast = null;
    this.flash = 0;
    this.pendingEnemy = null;
    this.pendingBoss = false;
  }

  resetPosition() {
    this.player = { ...this.area.start };
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
    if (input.wasPressed("dex")) {
      this.game.changeScene(new PokedexScene(this.game, this));
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
    if (tile === T_RANCH) {
      this.game.changeScene(new RanchScene(this.game, this));
      return;
    }
    if (tile === T_EXIT) {
      const exit = this.area.exits[`${this.player.x},${this.player.y}`];
      if (!exit) return;
      const next = new FieldScene(this.game, exit.to, exit.entry);
      next.showToast(`${AREAS[exit.to].name} に はいった`);
      this.game.field = next;
      this.game.changeScene(next);
      this.game.save();
      return;
    }
    if (tile === T_BUSH && Math.random() < ENCOUNTER_RATE) {
      const [lo, hi] = this.area.levelRange;
      const speciesId = rollWildSpecies(this.area.wildSpecies);
      const level = lo + Math.floor(Math.random() * (hi - lo + 1));
      this.pendingEnemy = createMonster(speciesId, level);
      this.flash = 0.45;
    }
  }

  draw(ctx) {
    const theme = this.area.theme;
    const bg = theme === "cave" ? "#4a4658" : "#a9d977";
    const bgDot = theme === "cave" ? "#5c5870" : "#98cc66";

    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        const px = x * TILE;
        const py = y * TILE;
        ctx.fillStyle = bg;
        ctx.fillRect(px, py, TILE, TILE);
        if ((x * 7 + y * 13) % 5 === 0) {
          ctx.fillStyle = bgDot;
          ctx.fillRect(px + 8, py + 26, 4, 4);
          ctx.fillRect(px + 26, py + 10, 4, 4);
        }
        const tile = this.map[y][x];
        if (tile === T_BUSH) {
          if (theme === "cave") {
            ctx.fillStyle = "#38344a";
            ctx.beginPath();
            ctx.roundRect(px + 3, py + 3, TILE - 6, TILE - 6, 8);
            ctx.fill();
            const glow = 0.5 + Math.sin(this.time * 3 + x + y) * 0.3;
            for (const [ox, oy] of [[12, 27], [20, 21], [28, 27]]) {
              ctx.fillStyle = `rgba(150, 220, 255, ${glow})`;
              ctx.beginPath();
              ctx.ellipse(px + ox, py + oy, 5, 6.5, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = "#7a7492";
              ctx.fillRect(px + ox - 1, py + oy + 4, 2, 6);
            }
          } else {
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
          }
        } else if (tile === T_TREE) {
          if (theme === "cave") {
            ctx.fillStyle = "#6b6478";
            ctx.beginPath();
            ctx.moveTo(px + 7, py + 37);
            ctx.lineTo(px + 13, py + 6);
            ctx.lineTo(px + 20, py + 20);
            ctx.lineTo(px + 27, py + 3);
            ctx.lineTo(px + 33, py + 37);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#3f3b4d";
            ctx.lineWidth = 2;
            ctx.stroke();
          } else {
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
          }
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
        } else if (tile === T_RANCH) {
          ctx.fillStyle = "#c9a35a";
          ctx.beginPath();
          ctx.roundRect(px + 4, py + 16, TILE - 8, TILE - 20, 4);
          ctx.fill();
          ctx.strokeStyle = "#6b4e2e";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px + 5, py + 22); ctx.lineTo(px + TILE - 5, py + 22);
          ctx.moveTo(px + 5, py + 30); ctx.lineTo(px + TILE - 5, py + 30);
          ctx.stroke();
          ctx.fillStyle = "#6b4e2e";
          ctx.fillRect(px + 6, py + 14, 4, 22);
          ctx.fillRect(px + TILE - 10, py + 14, 4, 22);
        } else if (tile === T_BOSS) {
          const defeated = this.game.flags && this.game.flags.bossDefeated;
          ctx.fillStyle = defeated ? "#9a9a9a" : "#d64545";
          ctx.fillRect(px + 8, py + 8, 5, 28);
          ctx.fillRect(px + 27, py + 8, 5, 28);
          ctx.fillRect(px + 4, py + 6, 32, 6);
          ctx.fillRect(px + 7, py + 15, 26, 4);
        } else if (tile === T_EXIT) {
          ctx.fillStyle = "#2b2838";
          ctx.beginPath();
          ctx.ellipse(px + 20, py + 24, 14, 16, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#8a7a5a";
          ctx.lineWidth = 3;
          ctx.stroke();
          const glow = 0.4 + Math.sin(this.time * 2) * 0.2;
          ctx.fillStyle = `rgba(255, 230, 150, ${glow})`;
          ctx.beginPath();
          ctx.ellipse(px + 20, py + 24, 7, 9, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const playerPx = this.player.x * TILE + 20;
    const playerPy = this.player.y * TILE + 20;
    drawCompanion(ctx, this.game.party[0], playerPx, playerPy, this.facing, this.time);
    drawPlayer(ctx, playerPx, playerPy, this.facing, this.time);

    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(0, 456, 160, 24);
    ctx.fillStyle = "#f0ead8";
    ctx.font = FONT_BOLD;
    ctx.textAlign = "left";
    ctx.fillText(this.area.name, 8, 473);

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

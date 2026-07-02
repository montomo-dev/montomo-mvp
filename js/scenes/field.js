import { BattleScene } from "./battle.js";
import { PartyScene } from "./party.js";
import { RanchScene } from "./ranch.js";
import { PokedexScene } from "./pokedex.js";
import { ShopScene } from "./shop.js";
import { createMonster, rollWildSpecies } from "../data/monsters.js";
import { getStage, START_STAGE_ID, TILE_TYPES } from "../data/stages.js";
import { drawCompanion, drawPlayer } from "../sprites.js";
import { panel, hpBar, FONT_BOLD } from "../ui.js";

const TILE = 40;
const T_BUSH = TILE_TYPES.BUSH;
const T_TREE = TILE_TYPES.TREE;
const T_SPRING = TILE_TYPES.SPRING;
const T_BOSS = TILE_TYPES.BOSS;
const T_RANCH = TILE_TYPES.RANCH;
const T_NEXT = TILE_TYPES.NEXT;
const T_PREV = TILE_TYPES.PREV;
const T_SHOP = TILE_TYPES.SHOP;

export class FieldScene {
  constructor(game, stageId = START_STAGE_ID) {
    this.game = game;
    this.facing = "down";
    this.moveCooldown = 0;
    this.time = 0;
    this.toast = null;
    this.flash = 0;
    this.pendingEnemy = null;
    this.pendingBoss = false;
    this.setStage(stageId, "start", false);
  }

  resetPosition() {
    this.setStage(START_STAGE_ID, "start", false);
    this.facing = "down";
  }

  showToast(text) {
    this.toast = { text, timer: 2.4 };
  }

  setStage(stageId, spawnKey = "start", keepFacing = true) {
    this.stage = getStage(stageId);
    this.stageId = this.stage.id;
    this.map = this.stage.layout.map((row) => [...row].map(Number));
    const spawn = this.stage.spawns[spawnKey] || this.stage.spawns.start;
    this.player = { ...spawn };
    if (!keepFacing) this.facing = "down";
  }

  moveStage(stageId, spawnKey, message) {
    this.setStage(stageId, spawnKey);
    this.showToast(message);
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
        this.game.changeScene(new BattleScene(this.game, this.pendingEnemy, { isBoss: this.pendingBoss, stageId: this.stageId }));
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
      const bossId = this.stage.bossId || "nushi";
      const bossLevel = this.stage.bossLevel || 12;
      const stageClearedFlags = this.game.flags?.stageClearedFlags || {};

      if (stageClearedFlags[this.stageId]) {
        this.showToast("しずかな けはいが ただよっている…");
        return;
      }
      this.pendingEnemy = createMonster(bossId, bossLevel);
      this.pendingBoss = true;
      this.flash = 0.6;
      return;
    }
    if (tile === T_RANCH) {
      this.game.changeScene(new RanchScene(this.game, this));
      return;
    }
    if (tile === T_SHOP) {
      this.game.changeScene(new ShopScene(this.game, this));
      return;
    }
    if (tile === T_NEXT && this.stage.nextStage) {
      const nextStage = getStage(this.stage.nextStage);
      this.moveStage(nextStage.id, "fromPrev", `${nextStage.shortName} に すすんだ！`);
      return;
    }
    if (tile === T_PREV && this.stage.prevStage) {
      const prevStage = getStage(this.stage.prevStage);
      this.moveStage(prevStage.id, "fromNext", `${prevStage.shortName} に もどった`);
      return;
    }
    if (tile === T_BUSH && this.game.party.length > 0) {
      if (Math.random() < this.stage.encounterRate) {
        const speciesId = rollWildSpecies();
        const [minLevel, maxLevel] = this.stage.wildLevels;
        const level = minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1));
        this.pendingEnemy = createMonster(speciesId, level);
        this.flash = 0.45;
      } else if (this.stage.rareSpecies && Math.random() < 0.005) {
        const rareData = this.stage.rareSpecies[Math.floor(Math.random() * this.stage.rareSpecies.length)];
        this.pendingEnemy = createMonster(rareData.speciesId, rareData.level);
        this.flash = 0.45;
      }
    }

    this.checkTreasureAt(this.player.x, this.player.y);
    this.checkGroundItemAt(this.player.x, this.player.y);
  }

  checkTreasureAt(x, y) {
    if (!this.stage.treasures) return;
    for (const treasure of this.stage.treasures) {
      if (treasure.x === x && treasure.y === y) {
        const treasureKey = `${this.stageId}:${treasure.id}`;
        if (!this.game.treasureState[treasureKey]) {
          this.game.treasureState[treasureKey] = true;
          if (treasure.trap && this.game.party.length > 0) {
            const speciesId = rollWildSpecies();
            const [minLevel, maxLevel] = this.stage.wildLevels;
            const level = minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1));
            this.pendingEnemy = createMonster(speciesId, level);
            this.showToast("わな！ モンスターが とびだした！");
            this.flash = 0.45;
          } else {
            this.game.money += treasure.money;
            this.showToast(`お金を ${treasure.money} えた！`);
          }
          this.game.save();
        }
        return;
      }
    }
  }

  checkGroundItemAt(x, y) {
    if (!this.stage.groundItems) return;
    for (const item of this.stage.groundItems) {
      if (item.x === x && item.y === y) {
        const itemKey = `${this.stageId}:${item.id}`;
        if (!this.game.groundItemState[itemKey]) {
          this.game.groundItemState[itemKey] = true;
          this.game.items[item.itemId] = (this.game.items[item.itemId] || 0) + 1;
          this.showToast(`${item.itemId} を てにいれた！`);
          this.game.save();
        }
        return;
      }
    }
  }

  currentTileMessage() {
    const tile = this.tileAt(this.player.x, this.player.y);
    if (tile === T_BUSH) return "くさむら: であいに ちゅうい";
    if (tile === T_SPRING) return "いずみ: HP ぜんかいふく";
    if (tile === T_RANCH) return "まきば: なかまの いれかえ";
    if (tile === T_SHOP) return "どうぐや: アイテムを かえる";
    if (tile === T_NEXT && this.stage.nextStage) return `${getStage(this.stage.nextStage).shortName}: つぎへ すすむ`;
    if (tile === T_PREV && this.stage.prevStage) return `${getStage(this.stage.prevStage).shortName}: ひとつ もどる`;
    if (tile === T_BOSS) {
      return this.game.flags && this.game.flags.bossDefeated
        ? "おくのもり: しずかな きはい"
        : "おくのもり: ヌシが いる";
    }
    return `${this.stage.name}: なかまを そだてよう`;
  }

  draw(ctx) {
    const palette = this.stage.palette;
    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        const px = x * TILE;
        const py = y * TILE;
        ctx.fillStyle = palette.ground;
        ctx.fillRect(px, py, TILE, TILE);
        if ((x * 7 + y * 13) % 5 === 0) {
          ctx.fillStyle = palette.accent;
          ctx.fillRect(px + 8, py + 26, 4, 4);
          ctx.fillRect(px + 26, py + 10, 4, 4);
        }
        const tile = this.map[y][x];
        if (tile === T_BUSH) {
          ctx.fillStyle = palette.bushFill;
          ctx.beginPath();
          ctx.roundRect(px + 3, py + 3, TILE - 6, TILE - 6, 8);
          ctx.fill();
          ctx.strokeStyle = palette.bushStroke;
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
          ctx.fillStyle = palette.treeLeaf;
          ctx.beginPath();
          ctx.arc(px + 20, py + 14, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = palette.treeFruit;
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
        } else if (tile === T_NEXT || tile === T_PREV) {
          const gateColor = tile === T_NEXT ? "#5d8ce3" : "#c9814d";
          const clothColor = tile === T_NEXT ? "#dce9ff" : "#ffe0c4";
          ctx.fillStyle = "#86603b";
          ctx.fillRect(px + 8, py + 10, 5, 24);
          ctx.fillRect(px + 27, py + 10, 5, 24);
          ctx.fillStyle = gateColor;
          ctx.fillRect(px + 8, py + 8, 24, 5);
          ctx.fillStyle = clothColor;
          ctx.beginPath();
          if (tile === T_NEXT) {
            ctx.moveTo(px + 15, py + 17);
            ctx.lineTo(px + 27, py + 20);
            ctx.lineTo(px + 15, py + 23);
          } else {
            ctx.moveTo(px + 25, py + 17);
            ctx.lineTo(px + 13, py + 20);
            ctx.lineTo(px + 25, py + 23);
          }
          ctx.closePath();
          ctx.fill();
        } else if (tile === T_SHOP) {
          ctx.fillStyle = "#e8563f";
          ctx.beginPath();
          ctx.moveTo(px + 4, py + 16);
          ctx.lineTo(px + 20, py + 6);
          ctx.lineTo(px + 36, py + 16);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#fff6d9";
          ctx.lineWidth = 2;
          for (const sx of [px + 9, px + 20, px + 31]) {
            ctx.beginPath();
            ctx.moveTo(sx - 3, py + 12);
            ctx.lineTo(sx + 3, py + 12);
            ctx.stroke();
          }
          ctx.fillStyle = "#c9a35a";
          ctx.fillRect(px + 8, py + 16, 24, 20);
          ctx.fillStyle = "#6b4e2e";
          ctx.fillRect(px + 16, py + 22, 8, 14);
          ctx.strokeStyle = "#6b4e2e";
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 8, py + 16, 24, 20);
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

    this.drawTreasures(ctx);
    this.drawGroundItems(ctx);

    const playerPx = this.player.x * TILE + 20;
    const playerPy = this.player.y * TILE + 20;
    drawCompanion(ctx, this.game.party[0], playerPx, playerPy, this.facing, this.time);
    drawPlayer(ctx, playerPx, playerPy, this.facing, this.time);

    const leader = this.game.party[0];
    if (leader) {
      panel(ctx, 12, 12, 224, 74);
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.textAlign = "left";
      ctx.fillText(`${this.stage.shortName}  ${leader.name} Lv.${leader.level}`, 26, 38);
      hpBar(ctx, 26, 48, 136, 12, leader.hp / leader.maxHp);
      ctx.font = '15px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      ctx.fillText(`HP ${leader.hp}/${leader.maxHp}`, 26, 74);
      ctx.fillText(`なかま ${this.game.party.length}たい`, 174, 56);
    }

    panel(ctx, 396, 12, 232, 74);
    ctx.fillStyle = "#3a3a52";
    ctx.font = FONT_BOLD;
    ctx.textAlign = "left";
    ctx.fillText(this.stage.name, 412, 38);
    ctx.textAlign = "right";
    ctx.fillText(`${this.game.money || 0}円`, 612, 38);
    ctx.textAlign = "left";
    ctx.font = '15px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText(`みつけた ${this.game.dex.seen.length} / なかま ${this.game.dex.caught.length}`, 412, 58);
    ctx.fillText(this.currentTileMessage(), 412, 78);

    if (this.toast) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.toast.timer);
      panel(ctx, 90, 96, 460, 44);
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.textAlign = "center";
      ctx.fillText(this.toast.text, 320, 124);
      ctx.restore();
      ctx.textAlign = "left";
    }

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin((this.flash / 0.45) * Math.PI)})`;
      ctx.fillRect(0, 0, 640, 480);
    }
  }

  drawTreasures(ctx) {
    if (!this.stage.treasures) return;
    for (const treasure of this.stage.treasures) {
      const treasureKey = `${this.stageId}:${treasure.id}`;
      if (this.game.treasureState[treasureKey]) continue;

      const px = treasure.x * TILE + 20;
      const py = treasure.y * TILE + 20;
      ctx.fillStyle = "#ffd700";
      ctx.font = 'bold 28px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("宝", px, py);
    }
  }

  drawGroundItems(ctx) {
    if (!this.stage.groundItems) return;
    for (const item of this.stage.groundItems) {
      const itemKey = `${this.stageId}:${item.id}`;
      if (this.game.groundItemState[itemKey]) continue;

      const px = item.x * TILE + 20;
      const py = item.y * TILE + 20;
      ctx.fillStyle = "#88dd88";
      ctx.font = 'bold 24px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("落", px, py);
    }
  }
}

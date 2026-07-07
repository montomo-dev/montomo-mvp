import { BattleScene } from "./battle.js";
import { PartyScene } from "./party.js";
import { RanchScene } from "./ranch.js";
import { PokedexScene } from "./pokedex.js";
import { ShopScene } from "./shop.js";
import { ChoiceScene } from "./choice.js";
import { WarpScene } from "./warp.js";
import { createMonster, rollWildSpecies, monsterName } from "../data/monsters.js";
import { getStage, START_STAGE_ID, TILE_TYPES, WORLD_TRANSITIONS, parseTileChar } from "../data/stages.js";
import { drawCompanion, drawPlayer } from "../sprites.js";
import { panel, hpBar, FONT_BOLD } from "../ui.js";
import { sfxSave, sfxItemGet } from "../audio.js";
import { canClaimLegend, grantLegendReward } from "../systems/legend.js";
import { ITEMS } from "../data/items.js";
import { tr } from "../i18n.js";

function stageLabel(game, stage) {
  return tr(game, stage.shortName, stage.nameEn);
}

const TILE = 40;
const T_BUSH = TILE_TYPES.BUSH;
const T_TREE = TILE_TYPES.TREE;
const T_SPRING = TILE_TYPES.SPRING;
const T_BOSS = TILE_TYPES.BOSS;
const T_RANCH = TILE_TYPES.RANCH;
const T_NEXT = TILE_TYPES.NEXT;
const T_PREV = TILE_TYPES.PREV;
const T_SHOP = TILE_TYPES.SHOP;
const T_HOUSE = TILE_TYPES.HOUSE;
const T_NPC = TILE_TYPES.NPC;
const T_INN = TILE_TYPES.INN;
const T_TOWN_ENTER = TILE_TYPES.TOWN_ENTER;
const T_TOWN_EXIT = TILE_TYPES.TOWN_EXIT;

const WORLD_PREFIXES = [
  ["reverse_", "reverse"],
  ["sea_", "sea"],
  ["snow_", "snow"],
  ["desert_", "desert"],
  ["factory_", "factory"],
  ["castle_", "castle"],
];

// タイル座標から0〜1の決定論的な疑似乱数を作る(毎フレーム変わらず、
// マス目ごとに固定のバリエーションを持たせるため)
function tileRandom(gx, gy, salt = 0) {
  let h = (gx * 374761393 + gy * 668265263 + salt * 2654435761) >>> 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967295;
}

function worldOf(stageId) {
  for (const [prefix, world] of WORLD_PREFIXES) {
    if (stageId.startsWith(prefix)) return world;
  }
  return "forest";
}

const PARTICLE_STYLE = {
  forest:  { color: "rgba(255, 245, 180, 0.8)",  size: 2.2, speed: 6,  drift: 14, rise: -4, count: 18 },
  reverse: { color: "rgba(160, 255, 140, 0.85)", size: 2.6, speed: 5,  drift: 10, rise: -6, count: 16, blink: true },
  sea:     { color: "rgba(210, 245, 255, 0.85)", size: 2.4, speed: 12, drift: 8,  rise: -22, count: 22 },
  snow:    { color: "rgba(255, 255, 255, 0.9)",  size: 2.6, speed: 8,  drift: 12, rise: 18,  count: 26 },
  desert:  { color: "rgba(230, 200, 140, 0.6)",  size: 2.0, speed: 4,  drift: 22, rise: 0,   count: 20 },
  factory: { color: "rgba(255, 180, 90, 0.85)",  size: 2.0, speed: 10, drift: 6,  rise: -18, count: 18, blink: true },
  castle:  { color: "rgba(200, 150, 255, 0.7)",  size: 3.0, speed: 5,  drift: 16, rise: -8,  count: 14, blink: true },
};

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
    this.map = this.stage.layout.map((row) => [...row].map(parseTileChar));
    const spawn = this.stage.spawns[spawnKey] || this.stage.spawns.start;
    this.player = { ...spawn };
    if (!keepFacing) this.facing = "down";
    this.world = worldOf(this.stageId);
    this.initParticles();
  }

  initParticles() {
    const style = PARTICLE_STYLE[this.world] || PARTICLE_STYLE.forest;
    this.particles = [];
    for (let i = 0; i < style.count; i++) {
      this.particles.push({
        x: Math.random() * 640,
        y: Math.random() * 480,
        vx: (Math.random() - 0.5) * style.drift,
        vy: style.rise + (Math.random() - 0.5) * style.speed,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  updateParticles(dt) {
    if (!this.particles) return;
    const style = PARTICLE_STYLE[this.world] || PARTICLE_STYLE.forest;
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.phase += dt * 3;
      if (p.y < -8) { p.y = 488; p.x = Math.random() * 640; }
      if (p.y > 488) { p.y = -8; p.x = Math.random() * 640; }
      if (p.x < -8) p.x = 648;
      if (p.x > 648) p.x = -8;
    }
    this._particleStyle = style;
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
    this.updateParticles(dt);
    if (canClaimLegend(this.game)) {
      const gained = grantLegendReward(this.game, createMonster);
      if (gained) {
        const name = monsterName(gained, this.game.lang);
        this.showToast(tr(this.game, `レジェンド解放！ ${name} を てにいれた！`, `Legend unlocked! You got ${name}!`));
      }
    }
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
      if (ok) sfxSave();
      this.showToast(ok ? tr(this.game, "ぼうけんを セーブしたよ！", "Adventure saved!") : tr(this.game, "セーブに しっぱいした…", "Save failed..."));
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
    if (input.wasPressed("warp")) {
      this.game.changeScene(new WarpScene(this.game, this));
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
    const targetTile = this.tileAt(nx, ny);
    if (targetTile === T_TREE || targetTile === T_HOUSE) return;
    if (targetTile === T_NPC) {
      this.moveCooldown = 0.14;
      this.talkToNpc(nx, ny);
      return;
    }
    this.player.x = nx;
    this.player.y = ny;
    this.moveCooldown = 0.14;
    this.onStep(targetTile);
  }

  onStep(tile) {
    if (tile === T_SPRING) {
      for (const m of this.game.party) m.hp = m.maxHp;
      this.showToast(tr(this.game, "いずみの ちからで みんな げんきに なった！", "The spring's power restored everyone!"));
      return;
    }
    if (tile === T_BOSS) {
      const bossId = this.stage.bossId || "nushi";
      const bossLevel = this.stage.bossLevel || 12;
      const stageClearedFlags = this.game.flags?.stageClearedFlags || {};

      if (stageClearedFlags[this.stageId]) {
        if (this.stage.nextStage) {
          this.game.changeScene(new ChoiceScene(this.game));
        } else if (WORLD_TRANSITIONS[this.stageId]) {
          const nextStage = getStage(WORLD_TRANSITIONS[this.stageId]);
          this.moveStage(nextStage.id, "start", tr(this.game, `${stageLabel(this.game, nextStage)} に すすんだ！`, `Advanced to ${stageLabel(this.game, nextStage)}!`));
        } else {
          this.showToast(tr(this.game, "しずかな けはいが ただよっている…", "A quiet presence lingers here..."));
        }
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
    if (tile === T_INN) {
      for (const m of this.game.party) m.hp = m.maxHp;
      this.game.save();
      this.showToast(tr(this.game, "やどやで ぐっすり やすみ、げんきを とりもどした！", "You rested well at the inn and recovered!"));
      return;
    }
    if (tile === T_TOWN_ENTER && this.stage.townStage) {
      this.moveStage(this.stage.townStage, "fromField", tr(this.game, "まちに はいった！", "Entered the town!"));
      return;
    }
    if (tile === T_TOWN_EXIT && this.stage.townExitStage) {
      const exitStage = getStage(this.stage.townExitStage);
      this.moveStage(exitStage.id, "fromTown", tr(this.game, `${stageLabel(this.game, exitStage)} に もどった`, `Returned to ${stageLabel(this.game, exitStage)}`));
      return;
    }
    if (tile === T_NEXT && this.stage.nextStage) {
      const nextStage = getStage(this.stage.nextStage);
      this.moveStage(nextStage.id, "fromPrev", tr(this.game, `${stageLabel(this.game, nextStage)} に すすんだ！`, `Advanced to ${stageLabel(this.game, nextStage)}!`));
      return;
    }
    if (tile === T_PREV && this.stage.prevStage) {
      const prevStage = getStage(this.stage.prevStage);
      this.moveStage(prevStage.id, "fromNext", tr(this.game, `${stageLabel(this.game, prevStage)} に もどった`, `Returned to ${stageLabel(this.game, prevStage)}`));
      return;
    }
    if (tile === T_BUSH && this.game.party.length > 0) {
      if (Math.random() < this.stage.encounterRate) {
        const speciesId = rollWildSpecies(this.stage.wildSpecies);
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

  talkToNpc(x, y) {
    const npc = (this.stage.npcs || []).find((n) => n.x === x && n.y === y);
    const line = npc ? tr(this.game, npc.line, npc.lineEn || npc.line) : "……";
    this.showToast(line);
  }

  checkTreasureAt(x, y) {
    if (!this.stage.treasures) return;
    for (const treasure of this.stage.treasures) {
      if (treasure.x === x && treasure.y === y) {
        const treasureKey = `${this.stageId}:${treasure.id}`;
        if (!this.game.treasureState[treasureKey]) {
          this.game.treasureState[treasureKey] = true;
          if (treasure.trap && this.game.party.length > 0) {
            const [minLevel, maxLevel] = this.stage.wildLevels;
            const level = minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1));
            this.pendingEnemy = createMonster("takarabox", level);
            this.showToast(tr(this.game, "たからばこは タカラボックスだった！", "The treasure chest was a Takarabox!"));
            this.flash = 0.45;
          } else {
            this.game.money += treasure.money;
            this.showToast(tr(this.game, `お金を ${treasure.money} えた！`, `Found ${treasure.money} money!`));
            sfxItemGet();
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
          const gotItemName = tr(this.game, ITEMS[item.itemId].name, ITEMS[item.itemId].nameEn);
          this.showToast(tr(this.game, `${gotItemName} を てにいれた！`, `Got ${gotItemName}!`));
          sfxItemGet();
          this.game.save();
        }
        return;
      }
    }
  }

  currentTileMessage() {
    const tile = this.tileAt(this.player.x, this.player.y);
    if (tile === T_BUSH) return tr(this.game, "くさむら: であいに ちゅうい", "Tall grass: watch for encounters");
    if (tile === T_SPRING) return tr(this.game, "いずみ: HP ぜんかいふく", "Spring: fully restores HP");
    if (tile === T_RANCH) return tr(this.game, "まきば: なかまの いれかえ", "Ranch: swap party members");
    if (tile === T_SHOP) return tr(this.game, "どうぐや: アイテムを かえる", "Shop: buy items");
    if (tile === T_INN) return tr(this.game, "やどや: HP ぜんかいふく + セーブ", "Inn: fully restores HP + saves");
    if (tile === T_TOWN_ENTER) return tr(this.game, "まちの いりぐち", "Town entrance");
    if (tile === T_TOWN_EXIT) return tr(this.game, "まちの でぐち", "Town exit");
    if (tile === T_NEXT && this.stage.nextStage) {
      return tr(this.game, `${stageLabel(this.game, getStage(this.stage.nextStage))}: つぎへ すすむ`, `${stageLabel(this.game, getStage(this.stage.nextStage))}: Move forward`);
    }
    if (tile === T_PREV && this.stage.prevStage) {
      return tr(this.game, `${stageLabel(this.game, getStage(this.stage.prevStage))}: ひとつ もどる`, `${stageLabel(this.game, getStage(this.stage.prevStage))}: Go back`);
    }
    if (tile === T_BOSS) {
      return this.game.flags && this.game.flags.bossDefeated
        ? tr(this.game, "おくのもり: しずかな きはい", "Deep forest: a quiet presence")
        : tr(this.game, "おくのもり: ヌシが いる", "Deep forest: a Nushi is here");
    }
    return tr(this.game, `${this.stage.name}: なかまを そだてよう`, `${stageLabel(this.game, this.stage)}: Raise your friends`);
  }

  draw(ctx) {
    const palette = this.stage.palette;
    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        const px = x * TILE;
        const py = y * TILE;
        ctx.fillStyle = palette.ground;
        ctx.fillRect(px, py, TILE, TILE);
        this.drawGroundTexture(ctx, px, py, palette, x, y);
        const tile = this.map[y][x];
        if (tile === T_BUSH) {
          this.drawBush(ctx, px, py, palette, x, y);
        } else if (tile === T_TREE) {
          this.drawTree(ctx, px, py, palette, x, y);
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
        } else if (tile === T_NEXT || tile === T_PREV || tile === T_TOWN_ENTER || tile === T_TOWN_EXIT) {
          const forward = tile === T_NEXT || tile === T_TOWN_ENTER;
          const gateColor = forward ? "#5d8ce3" : "#c9814d";
          const clothColor = forward ? "#dce9ff" : "#ffe0c4";
          ctx.fillStyle = "#86603b";
          ctx.fillRect(px + 8, py + 10, 5, 24);
          ctx.fillRect(px + 27, py + 10, 5, 24);
          ctx.fillStyle = gateColor;
          ctx.fillRect(px + 8, py + 8, 24, 5);
          ctx.fillStyle = clothColor;
          ctx.beginPath();
          if (forward) {
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
        } else if (tile === T_HOUSE) {
          ctx.fillStyle = "#d97a4a";
          ctx.beginPath();
          ctx.moveTo(px + 3, py + 18);
          ctx.lineTo(px + 20, py + 4);
          ctx.lineTo(px + 37, py + 18);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#f0cf9a";
          ctx.fillRect(px + 7, py + 18, 26, 18);
          ctx.fillStyle = "#8a5a35";
          ctx.fillRect(px + 17, py + 24, 6, 12);
          ctx.fillStyle = "#bfe0f0";
          ctx.fillRect(px + 9, py + 22, 5, 5);
          ctx.fillRect(px + 26, py + 22, 5, 5);
          ctx.strokeStyle = "#8a5a35";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px + 7, py + 18, 26, 18);
        } else if (tile === T_NPC) {
          const bob = Math.sin(this.time * 3 + px) * 1.5;
          ctx.fillStyle = "#5d8ce3";
          ctx.beginPath();
          ctx.roundRect(px + 12, py + 16 + bob, 16, 18, 6);
          ctx.fill();
          ctx.fillStyle = "#f4c89a";
          ctx.beginPath();
          ctx.arc(px + 20, py + 12 + bob, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#3a3a52";
          ctx.beginPath(); ctx.arc(px + 17, py + 11 + bob, 1.3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(px + 23, py + 11 + bob, 1.3, 0, Math.PI * 2); ctx.fill();
        } else if (tile === T_INN) {
          ctx.fillStyle = "#8a5a2a";
          ctx.beginPath();
          ctx.moveTo(px + 4, py + 16);
          ctx.lineTo(px + 20, py + 5);
          ctx.lineTo(px + 36, py + 16);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#f7e2b8";
          ctx.fillRect(px + 8, py + 16, 24, 20);
          ctx.strokeStyle = "#8a5a2a";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px + 8, py + 16, 24, 20);
          const glow = 0.5 + 0.5 * Math.sin(this.time * 3);
          ctx.fillStyle = `rgba(255, 200, 90, ${0.6 + glow * 0.4})`;
          ctx.beginPath();
          ctx.moveTo(px + 20, py + 20);
          ctx.lineTo(px + 24, py + 27);
          ctx.lineTo(px + 20, py + 32);
          ctx.lineTo(px + 16, py + 27);
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
    this.drawParticles(ctx);

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
      ctx.fillText(`${stageLabel(this.game, this.stage)}  ${monsterName(leader, this.game.lang)} Lv.${leader.level}`, 26, 38);
      hpBar(ctx, 26, 48, 136, 12, leader.hp / leader.maxHp);
      ctx.font = '15px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      ctx.fillText(`HP ${leader.hp}/${leader.maxHp}`, 26, 74);
      ctx.fillText(tr(this.game, `なかま ${this.game.party.length}たい`, `Party ${this.game.party.length}`), 174, 56);
    }

    panel(ctx, 396, 12, 232, 74);
    ctx.fillStyle = "#3a3a52";
    ctx.font = FONT_BOLD;
    ctx.textAlign = "left";
    ctx.fillText(stageLabel(this.game, this.stage), 412, 38);
    ctx.textAlign = "right";
    ctx.fillText(tr(this.game, `${this.game.money || 0}円`, `${this.game.money || 0}g`), 612, 38);
    ctx.textAlign = "left";
    ctx.font = '15px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText(
      tr(this.game, `みつけた ${this.game.dex.seen.length} / なかま ${this.game.dex.caught.length}`, `Seen ${this.game.dex.seen.length} / Caught ${this.game.dex.caught.length}`),
      412, 58
    );
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

      const px = treasure.x * TILE;
      const py = treasure.y * TILE;
      const bob = Math.sin(this.time * 2 + treasure.x) * 1;
      const y = py + bob;

      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(px + 20, py + 34, 12, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#8a5a2a";
      ctx.fillRect(px + 8, y + 18, 24, 14);
      ctx.fillStyle = "#6b4520";
      ctx.fillRect(px + 8, y + 30, 24, 2);

      ctx.fillStyle = "#a86e30";
      ctx.beginPath();
      ctx.moveTo(px + 8, y + 18);
      ctx.quadraticCurveTo(px + 20, y + 8, px + 32, y + 18);
      ctx.lineTo(px + 32, y + 22);
      ctx.lineTo(px + 8, y + 22);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#f0c040";
      ctx.fillRect(px + 8, y + 21, 24, 1.5);
      ctx.fillRect(px + 19, y + 12, 2, 6);

      ctx.fillStyle = "#fff0a0";
      ctx.fillRect(px + 19.5, y + 13, 1, 2);
    }
  }

  drawGroundItems(ctx) {
    if (!this.stage.groundItems) return;
    for (const item of this.stage.groundItems) {
      const itemKey = `${this.stageId}:${item.id}`;
      if (this.game.groundItemState[itemKey]) continue;

      const px = item.x * TILE;
      const py = item.y * TILE;
      const bob = Math.sin(this.time * 3 + item.x * 0.5) * 1.5;
      const y = py + bob;

      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(px + 20, py + 32, 8, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#c9c9d6";
      ctx.fillRect(px + 17, y + 12, 6, 3);

      ctx.fillStyle = "#e04a4a";
      ctx.beginPath();
      ctx.moveTo(px + 15, y + 15);
      ctx.lineTo(px + 25, y + 15);
      ctx.lineTo(px + 25, y + 22);
      ctx.quadraticCurveTo(px + 25, y + 30, px + 20, y + 30);
      ctx.quadraticCurveTo(px + 15, y + 30, px + 15, y + 22);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ff8080";
      ctx.fillRect(px + 17, y + 18, 2, 5);

      const sparkle = 0.5 + 0.5 * Math.sin(this.time * 4 + item.y);
      ctx.fillStyle = `rgba(255,255,255,${sparkle})`;
      ctx.beginPath();
      ctx.arc(px + 28, y + 14, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawParticles(ctx) {
    if (!this.particles) return;
    const style = this._particleStyle || PARTICLE_STYLE[this.world] || PARTICLE_STYLE.forest;
    ctx.save();
    for (const p of this.particles) {
      const alpha = style.blink ? 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(p.phase)) : 1;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = style.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, style.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawGroundTexture(ctx, px, py, palette, gx, gy) {
    const w = this.world;
    const h = (gx * 7 + gy * 13) % 8;
    if (w === "sea") {
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px + 4, py + 12 + h); ctx.quadraticCurveTo(px + 20, py + 8 + h, px + 36, py + 12 + h);
      ctx.moveTo(px + 4, py + 26 + h); ctx.quadraticCurveTo(px + 20, py + 22 + h, px + 36, py + 26 + h);
      ctx.stroke();
      return;
    }
    if (w === "snow") {
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath(); ctx.ellipse(px + 10 + h, py + 22, 6, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px + 28, py + 8 + h, 5, 1.6, 0, 0, Math.PI * 2); ctx.fill();
      if (h < 3) {
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillRect(px + 18, py + 14, 2, 2);
      }
      return;
    }
    if (w === "desert") {
      ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py + 10 + h); ctx.quadraticCurveTo(px + 20, py + 6 + h, px + 40, py + 10 + h);
      ctx.moveTo(px, py + 26 + h); ctx.quadraticCurveTo(px + 20, py + 22 + h, px + 40, py + 26 + h);
      ctx.stroke();
      if (h < 2) {
        ctx.fillStyle = "rgba(120,80,40,0.5)";
        ctx.fillRect(px + 30, py + 30, 2, 2);
      }
      return;
    }
    if (w === "factory") {
      ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + TILE, py); ctx.lineTo(px + TILE, py + TILE);
      ctx.moveTo(px, py + TILE); ctx.lineTo(px + TILE, py + TILE);
      ctx.stroke();
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      for (const [dx, dy] of [[6, 6], [34, 6], [6, 34], [34, 34]]) {
        ctx.beginPath(); ctx.arc(px + dx, py + dy, 1.2, 0, Math.PI * 2); ctx.fill();
      }
      return;
    }
    if (w === "castle") {
      ctx.strokeStyle = "rgba(0,0,0,0.28)"; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py); ctx.lineTo(px + TILE, py);
      ctx.moveTo(px, py); ctx.lineTo(px, py + TILE);
      ctx.stroke();
      if (h < 3) {
        ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(px + 10, py + 8); ctx.lineTo(px + 18, py + 20); ctx.lineTo(px + 14, py + 28);
        ctx.stroke();
      }
      return;
    }
    if (w === "reverse") {
      ctx.fillStyle = "rgba(180, 120, 200, 0.35)";
      ctx.fillRect(px + 6 + h, py + 8, 3, 3);
      ctx.fillRect(px + 24, py + 22 + h, 3, 3);
      if (h < 2) {
        ctx.fillStyle = "rgba(255, 240, 180, 0.5)";
        ctx.fillRect(px + 18, py + 30, 2, 2);
      }
      return;
    }
    ctx.fillStyle = palette.accent;
    ctx.beginPath(); ctx.ellipse(px + 10, py + 28, 3, 1.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + 28, py + 12, 3, 1.4, 0, 0, Math.PI * 2); ctx.fill();
    if (h < 3) {
      ctx.strokeStyle = palette.accent; ctx.lineWidth = 1.2; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(px + 20, py + 22); ctx.lineTo(px + 20, py + 16);
      ctx.moveTo(px + 18, py + 18); ctx.lineTo(px + 22, py + 18);
      ctx.stroke();
    }
  }

  drawBush(ctx, px, py, palette, gx, gy) {
    const w = this.world;
    if (w === "sea") {
      ctx.fillStyle = "#e8628a";
      for (const [cx, cy, r] of [[12, 30, 6], [22, 32, 5], [30, 28, 6], [18, 24, 5]]) {
        ctx.beginPath(); ctx.arc(px + cx, py + cy, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = "#c9425f"; ctx.lineWidth = 2; ctx.lineCap = "round";
      for (const [x1, y1, x2, y2] of [[12, 30, 12, 20], [22, 32, 22, 18], [30, 28, 30, 20]]) {
        ctx.beginPath(); ctx.moveTo(px + x1, py + y1); ctx.lineTo(px + x2, py + y2); ctx.stroke();
      }
      return;
    }
    if (w === "snow") {
      ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#b8cbdc"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px + 20, py + 26, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(px + 20, py + 15, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#3a3a52";
      ctx.beginPath(); ctx.arc(px + 18, py + 14, 1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 22, py + 14, 1, 0, Math.PI * 2); ctx.fill();
      return;
    }
    if (w === "desert") {
      ctx.fillStyle = "#a58860"; ctx.strokeStyle = "#6d5636"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + 8, py + 32); ctx.lineTo(px + 14, py + 12);
      ctx.lineTo(px + 26, py + 12); ctx.lineTo(px + 32, py + 32);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#84683f";
      ctx.beginPath(); ctx.arc(px + 16, py + 20, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 25, py + 24, 2, 0, Math.PI * 2); ctx.fill();
      return;
    }
    if (w === "factory") {
      ctx.fillStyle = "#7a7f88"; ctx.strokeStyle = "#3d434a"; ctx.lineWidth = 2;
      ctx.fillRect(px + 6, py + 12, 28, 22); ctx.strokeRect(px + 6, py + 12, 28, 22);
      ctx.strokeStyle = "#3d434a";
      for (const gx2 of [px + 14, px + 20, px + 26]) {
        ctx.beginPath(); ctx.moveTo(gx2, py + 12); ctx.lineTo(gx2, py + 34); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(px + 6, py + 23); ctx.lineTo(px + 34, py + 23); ctx.stroke();
      return;
    }
    if (w === "castle") {
      ctx.fillStyle = "#e5e2d9";
      for (const [cx, cy, r] of [[14, 30, 5], [22, 32, 5], [28, 28, 4]]) {
        ctx.beginPath(); ctx.arc(px + cx, py + cy, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = "#3a3a52";
      ctx.beginPath(); ctx.arc(px + 12, py + 29, 1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 16, py + 29, 1, 0, Math.PI * 2); ctx.fill();
      return;
    }
    if (w === "reverse") {
      ctx.fillStyle = "#c74dc1"; ctx.strokeStyle = "#7a2d78"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px + 20, py + 26, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff2b0";
      ctx.beginPath(); ctx.arc(px + 16, py + 22, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 25, py + 28, 2, 0, Math.PI * 2); ctx.fill();
      return;
    }
    ctx.fillStyle = palette.bushFill;
    ctx.beginPath();
    ctx.roundRect(px + 3, py + 3, TILE - 6, TILE - 6, 8);
    ctx.fill();
    ctx.strokeStyle = palette.bushStroke;
    ctx.lineWidth = 2.5; ctx.lineCap = "round";
    for (const ox of [10, 20, 30]) {
      ctx.beginPath();
      ctx.moveTo(px + ox, py + 30);
      ctx.quadraticCurveTo(px + ox - 3, py + 18, px + ox - 6, py + 12);
      ctx.moveTo(px + ox, py + 30);
      ctx.quadraticCurveTo(px + ox + 3, py + 18, px + ox + 6, py + 12);
      ctx.stroke();
    }
  }

  drawTree(ctx, px, py, palette, gx, gy) {
    const scale = 0.86 + tileRandom(gx, gy, 1) * 0.28;
    const flip = tileRandom(gx, gy, 2) > 0.5 ? -1 : 1;
    const rotate = (tileRandom(gx, gy, 3) - 0.5) * 0.3;
    const brightness = 0.9 + tileRandom(gx, gy, 4) * 0.2;
    const baseX = px + 20;
    const baseY = py + 36;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.beginPath();
    ctx.ellipse(baseX, baseY + 2, 13 * scale, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(baseX, baseY);
    ctx.rotate(rotate);
    ctx.scale(flip * scale, scale);
    ctx.translate(-baseX, -baseY);
    ctx.filter = `brightness(${brightness})`;
    this.drawTreeShape(ctx, px, py, palette, gx, gy);
    ctx.filter = "none";
    ctx.restore();
  }

  drawTreeShape(ctx, px, py, palette, gx, gy) {
    const w = this.world;
    if (w === "sea") {
      ctx.fillStyle = "#e57373";
      ctx.beginPath();
      ctx.moveTo(px + 20, py + 36);
      ctx.lineTo(px + 12, py + 16);
      ctx.lineTo(px + 20, py + 20);
      ctx.lineTo(px + 28, py + 16);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px + 12, py + 16); ctx.lineTo(px + 6, py + 6);
      ctx.moveTo(px + 28, py + 16); ctx.lineTo(px + 34, py + 6);
      ctx.strokeStyle = "#c44848"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.stroke();
      ctx.fillStyle = "#fff0a0";
      ctx.beginPath(); ctx.arc(px + 20, py + 22, 2, 0, Math.PI * 2); ctx.fill();
      return;
    }
    if (w === "snow") {
      ctx.fillStyle = "#5e3a24";
      ctx.fillRect(px + 17, py + 26, 6, 10);
      ctx.fillStyle = "#2d5a3a";
      ctx.beginPath();
      ctx.moveTo(px + 20, py + 4); ctx.lineTo(px + 10, py + 20); ctx.lineTo(px + 30, py + 20); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px + 20, py + 12); ctx.lineTo(px + 8, py + 28); ctx.lineTo(px + 32, py + 28); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(px + 12, py + 20); ctx.lineTo(px + 20, py + 15); ctx.lineTo(px + 28, py + 20);
      ctx.lineTo(px + 30, py + 22); ctx.lineTo(px + 10, py + 22); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px + 10, py + 28); ctx.lineTo(px + 20, py + 23); ctx.lineTo(px + 30, py + 28);
      ctx.lineTo(px + 32, py + 30); ctx.lineTo(px + 8, py + 30); ctx.closePath(); ctx.fill();
      return;
    }
    if (w === "desert") {
      ctx.fillStyle = "#3f9c5a"; ctx.strokeStyle = "#286a3d"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(px + 16, py + 6, 8, 30, 4); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(px + 6, py + 16, 6, 14, 3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px + 12, py + 22); ctx.lineTo(px + 12, py + 16); ctx.lineTo(px + 16, py + 16); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(px + 28, py + 12, 6, 16, 3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px + 28, py + 18); ctx.lineTo(px + 28, py + 12); ctx.lineTo(px + 24, py + 12); ctx.stroke();
      ctx.fillStyle = "#f2e6a0";
      ctx.beginPath(); ctx.arc(px + 20, py + 4, 2.5, 0, Math.PI * 2); ctx.fill();
      return;
    }
    if (w === "factory") {
      ctx.fillStyle = "#4a4d55";
      ctx.fillRect(px + 12, py + 6, 16, 30);
      ctx.fillStyle = "#2a2c32";
      ctx.fillRect(px + 10, py + 4, 20, 5);
      ctx.strokeStyle = "#2a2c32"; ctx.lineWidth = 1.5;
      for (const yy of [py + 15, py + 22, py + 29]) {
        ctx.beginPath(); ctx.moveTo(px + 12, yy); ctx.lineTo(px + 28, yy); ctx.stroke();
      }
      const smoke = 0.5 + 0.5 * Math.sin(this.time * 2 + gx + gy);
      ctx.fillStyle = `rgba(180, 180, 190, ${0.4 + smoke * 0.3})`;
      ctx.beginPath(); ctx.arc(px + 20, py + 2, 4, 0, Math.PI * 2); ctx.fill();
      return;
    }
    if (w === "castle") {
      ctx.fillStyle = "#3d3a44";
      ctx.fillRect(px + 17, py + 16, 6, 20);
      ctx.strokeStyle = "#3d3a44"; ctx.lineWidth = 3; ctx.lineCap = "round";
      for (const [x1, y1, x2, y2] of [[20, 20, 8, 10], [20, 22, 32, 8], [20, 26, 10, 30], [20, 20, 28, 4]]) {
        ctx.beginPath(); ctx.moveTo(px + x1, py + y1); ctx.lineTo(px + x2, py + y2); ctx.stroke();
      }
      ctx.fillStyle = "#8b3355";
      ctx.beginPath(); ctx.arc(px + 8, py + 10, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 32, py + 8, 2, 0, Math.PI * 2); ctx.fill();
      return;
    }
    if (w === "reverse") {
      ctx.fillStyle = "#5b3574";
      ctx.beginPath();
      ctx.moveTo(px + 20, py + 36);
      ctx.quadraticCurveTo(px + 12, py + 26, px + 18, py + 20);
      ctx.quadraticCurveTo(px + 26, py + 14, px + 20, py + 8);
      ctx.quadraticCurveTo(px + 22, py + 22, px + 20, py + 36);
      ctx.fill();
      ctx.fillStyle = "#a54fc4";
      ctx.beginPath(); ctx.arc(px + 22, py + 10, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffe6f7";
      ctx.beginPath(); ctx.arc(px + 24, py + 8, 2, 0, Math.PI * 2); ctx.fill();
      return;
    }
    ctx.fillStyle = "#8a5a35";
    ctx.fillRect(px + 15, py + 20, 10, 14);
    ctx.fillStyle = palette.treeLeaf;
    ctx.beginPath(); ctx.arc(px + 20, py + 14, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = palette.treeFruit;
    ctx.beginPath(); ctx.arc(px + 15, py + 10, 6, 0, Math.PI * 2); ctx.fill();
  }
}

import { SPECIES } from "../data/monsters.js";
import { drawMonster } from "../sprites.js";
import { panel, FONT, FONT_BOLD } from "../ui.js";
import { getRank, RANK_COLOR } from "../systems/rank.js";
import { typeOf, typeNameEn } from "../data/types.js";
import { flavorTextOf } from "../data/flavor.js";
import { sfxSelect, sfxConfirm, sfxCancel } from "../audio.js";
import { LEGEND_REQUIREMENT, legendProgress, hasLegendReward } from "../systems/legend.js";
import { TRIBE_LIST, tribeName, tribeNameEn } from "../data/tribes.js";
import { tr } from "../i18n.js";

function speciesName(game, species) {
  return tr(game, species.name, species.nameEn);
}
function speciesGenus(game, species) {
  return tr(game, species.genus, species.genusEn);
}
function speciesTypeLabel(game, speciesId) {
  const type = typeOf(speciesId);
  return tr(game, type, typeNameEn(type));
}
function speciesTribeLabel(game, species) {
  if (!species.tribe) return "";
  return tr(game, tribeName(species.tribe), tribeNameEn(species.tribe));
}

const COLS = 4;
const ROWS = 4;
const PAGE_SIZE = COLS * ROWS;
const CELL_W = 136;
const CELL_H = 78;
const GAP = 8;
const ORIGIN_X = 30;
const ORIGIN_Y = 92;

function dexEntries() {
  return Object.values(SPECIES).filter((s) => !s.boss);
}

function legendEntries() {
  return Object.values(SPECIES).filter((s) => s.boss);
}

export class PokedexScene {
  constructor(game, prevScene) {
    this.game = game;
    this.prev = prevScene;
    this.cursor = 0;
    this.time = 0;
    this.tab = "normal";
    this.normalEntries = dexEntries();
    this.legendEntries = legendEntries();
    this.tribeFilter = null;
    this.detail = false;
  }

  get entries() {
    const base = this.tab === "normal" ? this.normalEntries : this.legendEntries;
    if (!this.tribeFilter) return base;
    return base.filter((s) => s.tribe === this.tribeFilter);
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.entries.length / PAGE_SIZE));
  }

  get page() {
    return Math.floor(this.cursor / PAGE_SIZE);
  }

  pageEntries() {
    const start = this.page * PAGE_SIZE;
    return this.entries.slice(start, start + PAGE_SIZE);
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    const n = this.entries.length;
    if (this.detail) {
      if (input.wasPressed("cancel") || input.wasPressed("ok") || input.wasPressed("dex")) {
        sfxCancel();
        this.detail = false;
      }
      return;
    }
    if (input.wasPressed("cancel") || input.wasPressed("dex")) {
      sfxCancel();
      this.game.changeScene(this.prev);
      return;
    }
    if (input.wasPressed("warp")) {
      sfxSelect();
      this.tab = this.tab === "normal" ? "legend" : "normal";
      this.tribeFilter = null;
      this.cursor = 0;
      return;
    }
    if (input.wasPressed("rename") && this.tab === "normal") {
      sfxSelect();
      const idx = this.tribeFilter ? TRIBE_LIST.indexOf(this.tribeFilter) : -1;
      this.tribeFilter = idx + 1 >= TRIBE_LIST.length ? null : TRIBE_LIST[idx + 1];
      this.cursor = 0;
      return;
    }
    if (n === 0) return;
    if (input.wasPressed("right")) { this.cursor = (this.cursor + 1) % n; sfxSelect(); }
    if (input.wasPressed("left")) { this.cursor = (this.cursor + n - 1) % n; sfxSelect(); }
    if (input.wasPressed("down") && this.cursor + COLS < n) { this.cursor += COLS; sfxSelect(); }
    if (input.wasPressed("up") && this.cursor - COLS >= 0) { this.cursor -= COLS; sfxSelect(); }
    if (input.wasPressed("ok")) {
      const seen = this.game.dex?.seen || [];
      if (seen.includes(this.entries[this.cursor].id)) {
        sfxConfirm();
        this.detail = true;
      }
    }
  }

  draw(ctx) {
    ctx.fillStyle = "#2e3350";
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = "#f0ead8";
    ctx.font = 'bold 24px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.textAlign = "left";
    const filterLabel = this.tribeFilter ? `（${tr(this.game, tribeName(this.tribeFilter), tribeNameEn(this.tribeFilter))}）` : "";
    ctx.fillText(tr(this.game, this.tab === "normal" ? `図鑑${filterLabel}` : "図鑑（ヌシ）", this.tab === "normal" ? `Dex${filterLabel}` : "Dex (Bosses)"), 30, 44);

    const seen = this.game.dex?.seen || [];
    const caught = this.game.dex?.caught || [];
    ctx.font = FONT;
    ctx.fillText(
      tr(
        this.game,
        `みつけた ${seen.length}/${this.entries.length}　なかまにした ${caught.length}/${this.entries.length}`,
        `Seen ${seen.length}/${this.entries.length}   Caught ${caught.length}/${this.entries.length}`
      ),
      210, 44
    );
    if (this.totalPages > 1) {
      ctx.textAlign = "right";
      ctx.fillText(tr(this.game, `${this.page + 1} / ${this.totalPages} ページ`, `Page ${this.page + 1} / ${this.totalPages}`), 610, 44);
      ctx.textAlign = "left";
    }

    const caughtSet = new Set(caught);
    ctx.font = '13px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    if (this.tab === "normal") {
      if (hasLegendReward(this.game)) {
        ctx.fillStyle = "#ffd75e";
        ctx.fillText(tr(this.game, "★ レジェンド解放ずみ: カザリビ を なかまにした！", "★ Legend unlocked: Kazaribi joined your team!"), 30, 64);
      } else {
        ctx.fillStyle = "#a8a8c0";
        const requirementText = LEGEND_REQUIREMENT
          .map((id) => `${speciesName(this.game, SPECIES[id])}${caughtSet.has(id) ? "✓" : ""}`)
          .join(tr(this.game, "・", ", "));
        ctx.fillText(
          tr(
            this.game,
            `★ レジェンド条件(${legendProgress(this.game)}/${LEGEND_REQUIREMENT.length}): ${requirementText}`,
            `★ Legend requirement (${legendProgress(this.game)}/${LEGEND_REQUIREMENT.length}): ${requirementText}`
          ),
          30, 64
        );
      }
    } else {
      ctx.fillStyle = "#a8a8c0";
      ctx.fillText(tr(this.game, "★ せんとうで であった ヌシたちの きろく", "★ A record of the Nushi you've encountered in battle"), 30, 64);
    }

    this.pageEntries().forEach((species, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = ORIGIN_X + col * (CELL_W + GAP);
      const y = ORIGIN_Y + row * (CELL_H + GAP);
      const globalIndex = this.page * PAGE_SIZE + i;
      panel(ctx, x, y, CELL_W, CELL_H);
      if (this.cursor === globalIndex) {
        ctx.beginPath();
        ctx.roundRect(x, y, CELL_W, CELL_H, 10);
        ctx.strokeStyle = "#ffd75e";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      const isSeen = seen.includes(species.id);
      const isCaught = caught.includes(species.id);

      if (!isSeen) {
        ctx.fillStyle = "#3a3a52";
        ctx.beginPath();
        ctx.arc(x + 26, y + 40, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f0ead8";
        ctx.font = FONT_BOLD;
        ctx.textAlign = "center";
        ctx.fillText("？", x + 26, y + 47);
        ctx.textAlign = "left";
        ctx.fillStyle = "#8a8aa0";
        ctx.font = '13px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
        ctx.fillText("？？？？", x + 50, y + 30);
        ctx.fillText(tr(this.game, "みはっけん", "Not found yet"), x + 50, y + 50);
        return;
      }

      if (!isCaught) ctx.filter = "grayscale(0.85) brightness(0.9)";
      drawMonster(ctx, species.id, x + 26, y + 42, 0.28, this.time, 0);
      ctx.filter = "none";

      const rank = getRank(species);
      ctx.fillStyle = RANK_COLOR[rank];
      ctx.beginPath();
      ctx.roundRect(x + CELL_W - 22, y + 4, 18, 16, 4);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = 'bold 12px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(rank, x + CELL_W - 13, y + 16);
      ctx.textAlign = "left";

      ctx.fillStyle = "#3a3a52";
      ctx.font = '13px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      ctx.fillText(speciesName(this.game, species), x + 50, y + 20);
      ctx.font = '11px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      ctx.fillText(`${speciesGenus(this.game, species)}（${speciesTypeLabel(this.game, species.id)}）`, x + 50, y + 36);
      const statusLabel = isCaught
        ? tr(this.game, "なかまにした！", "Caught!")
        : tr(this.game, "みつけただけ", "Seen only");
      ctx.fillStyle = isCaught ? "#4a8f4a" : "#a8a8c0";
      ctx.fillText(`${statusLabel}／${speciesTribeLabel(this.game, species)}`, x + 50, y + 54);
    });

    ctx.fillStyle = "#f0ead8";
    ctx.font = FONT;
    ctx.fillText(
      tr(
        this.game,
        "↑↓←→: えらぶ・ページ送り ／ Z: くわしく見る ／ N: 種族フィルタ ／ W: ヌシ図鑑に切替 ／ X: もどる",
        "Arrows: Choose/Page / Z: Details / N: Tribe Filter / W: Toggle Boss Dex / X: Back"
      ),
      30, 462
    );

    if (this.detail) this.drawDetail(ctx);
  }

  drawDetail(ctx) {
    const species = this.entries[this.cursor];
    const caught = (this.game.dex?.caught || []).includes(species.id);

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, 640, 480);

    panel(ctx, 90, 70, 460, 340);
    if (!caught) ctx.filter = "grayscale(0.85) brightness(0.9)";
    drawMonster(ctx, species.id, 190, 150, 0.85, this.time, 0);
    ctx.filter = "none";

    const rank = getRank(species);
    ctx.fillStyle = RANK_COLOR[rank];
    ctx.beginPath();
    ctx.roundRect(480, 92, 40, 26, 6);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = FONT_BOLD;
    ctx.textAlign = "center";
    ctx.fillText(rank, 500, 110);
    ctx.textAlign = "left";

    ctx.fillStyle = "#3a3a52";
    ctx.font = 'bold 22px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.fillText(speciesName(this.game, species), 300, 130);
    ctx.font = FONT;
    ctx.fillText(`${speciesGenus(this.game, species)}（${speciesTypeLabel(this.game, species.id)}）`, 300, 158);
    ctx.fillText(tr(this.game, `種族: ${speciesTribeLabel(this.game, species)}`, `Tribe: ${speciesTribeLabel(this.game, species)}`), 300, 182);
    ctx.fillText(caught ? tr(this.game, "なかまにした！", "Caught!") : tr(this.game, "みつけただけ", "Seen only"), 300, 206);

    ctx.font = FONT;
    ctx.fillStyle = "#3a3a52";
    const flavor = flavorTextOf(species.id, this.game.lang);
    const maxChars = this.game.lang === "en" ? 46 : 30;
    for (let i = 0, line = 0; i < flavor.length; i += maxChars, line++) {
      ctx.fillText(flavor.slice(i, i + maxChars), 120, 260 + line * 26);
    }

    ctx.font = FONT;
    ctx.fillStyle = "#5a5a70";
    ctx.fillText(tr(this.game, "Z または X で とじる", "Z or X to close"), 120, 380);
  }
}

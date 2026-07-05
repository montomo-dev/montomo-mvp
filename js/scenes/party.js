import { SPECIES } from "../data/monsters.js";
import { moveToFront } from "../systems/party.js";
import { breedMonsters } from "../systems/breeding.js";
import { SKILLS } from "../data/skills.js";
import { expToNext, MAX_LEVEL } from "../systems/growth.js";
import { markCaught } from "../systems/dex.js";
import { drawMonster } from "../sprites.js";
import { panel, hpBar, FONT, FONT_BOLD } from "../ui.js";
import { getRank, RANK_COLOR } from "../systems/rank.js";
import { sfxBreed, sfxConfirm, sfxCancel, sfxItemGet } from "../audio.js";
import { BreedingChartScene } from "./breedingChart.js";
import { ITEMS } from "../data/items.js";
import { clearStatus } from "../systems/status.js";

const nameInput = document.getElementById("name-input");
const MIN_BREED_LEVEL = 10;

export class PartyScene {
  constructor(game, prevScene) {
    this.game = game;
    this.prev = prevScene;
    this.cursor = 0;
    this.time = 0;
    this.mode = "list";
    this.firstParent = null;
    this.message = null;
    this.confirm = null;
    this.renaming = null;
  }

  startRename(index) {
    const monster = this.game.party[index];
    this.renaming = monster;
    const canvas = this.game.canvas;
    const scale = canvas.getBoundingClientRect().width / canvas.width;
    const y = 64 + index * 92;
    nameInput.style.left = `${130 * scale}px`;
    nameInput.style.top = `${(y + 8) * scale}px`;
    nameInput.style.width = `${160 * scale}px`;
    nameInput.value = monster.name;
    nameInput.classList.add("visible");
    nameInput.focus();
    nameInput.select();

    const finish = (commit) => {
      nameInput.removeEventListener("keydown", onKeyDown);
      nameInput.removeEventListener("blur", onBlur);
      nameInput.classList.remove("visible");
      if (commit) {
        const trimmed = nameInput.value.trim();
        monster.name = trimmed.length > 0 ? trimmed : SPECIES[monster.speciesId].name;
        this.game.save();
      }
      this.renaming = null;
    };
    const onKeyDown = (e) => {
      if (e.code === "Enter") { e.preventDefault(); finish(true); }
      else if (e.code === "Escape") { e.preventDefault(); finish(false); }
    };
    const onBlur = () => finish(true);
    nameInput.addEventListener("keydown", onKeyDown);
    nameInput.addEventListener("blur", onBlur);
  }

  update(dt) {
    this.time += dt;
    if (this.renaming) return;
    const input = this.game.input;
    const count = this.game.party.length;

    if (this.confirm) {
      if (input.wasPressed("left") || input.wasPressed("right")) this.confirm.yes = !this.confirm.yes;
      if (input.wasPressed("cancel")) { this.confirm = null; return; }
      if (input.wasPressed("ok")) {
        const { index, yes } = this.confirm;
        this.confirm = null;
        if (yes) this.releaseMonster(index);
        return;
      }
      return;
    }
    if (this.message) {
      if (input.wasPressed("ok") || input.wasPressed("cancel")) this.message = null;
      return;
    }
    if (input.wasPressed("cancel")) {
      if (this.mode === "breed") {
        this.mode = "list";
        this.firstParent = null;
        return;
      }
      this.game.save();
      this.game.changeScene(this.prev);
      return;
    }
    if (input.wasPressed("dex")) {
      this.game.changeScene(new BreedingChartScene(this.game, this));
      return;
    }
    if (count === 0) {
      return;
    }
    if (this.mode === "action") {
      const options = this.actionOptions();
      if (input.wasPressed("up")) this.actionCursor = (this.actionCursor + options.length - 1) % options.length;
      if (input.wasPressed("down")) this.actionCursor = (this.actionCursor + 1) % options.length;
      if (input.wasPressed("cancel")) { sfxCancel(); this.mode = "list"; return; }
      if (input.wasPressed("ok")) this.chooseAction(options[this.actionCursor]);
      return;
    }
    if (this.mode === "item") {
      const owned = this.usableItemIds();
      if (input.wasPressed("cancel")) { sfxCancel(); this.mode = "action"; this.actionCursor = 0; return; }
      if (owned.length === 0) return;
      if (input.wasPressed("up")) this.itemCursor = (this.itemCursor + owned.length - 1) % owned.length;
      if (input.wasPressed("down")) this.itemCursor = (this.itemCursor + 1) % owned.length;
      if (input.wasPressed("ok")) this.useItemOn(this.game.party[this.actionTarget], owned[this.itemCursor]);
      return;
    }

    if (input.wasPressed("up")) this.cursor = (this.cursor + count - 1) % count;
    if (input.wasPressed("down")) this.cursor = (this.cursor + 1) % count;
    if (this.mode === "list") {
      if (input.wasPressed("right")) this.startBreeding();
      if (input.wasPressed("left")) this.askRelease();
      if (input.wasPressed("rename")) { this.startRename(this.cursor); return; }
      if (input.wasPressed("ok")) {
        sfxConfirm();
        this.actionTarget = this.cursor;
        this.mode = "action";
        this.actionCursor = 0;
      }
    } else if (input.wasPressed("ok")) {
      this.chooseParent(this.cursor);
    }
  }

  actionOptions() {
    const options = [];
    if (this.actionTarget > 0) options.push("front");
    options.push("item");
    options.push("cancel");
    return options;
  }

  chooseAction(action) {
    sfxConfirm();
    if (action === "front") {
      moveToFront(this.game.party, this.actionTarget);
      this.cursor = 0;
      this.mode = "list";
      this.game.save();
    } else if (action === "item") {
      if (this.usableItemIds().length === 0) {
        this.message = "つかえる どうぐが ないよ。";
        this.mode = "list";
        return;
      }
      this.mode = "item";
      this.itemCursor = 0;
    } else {
      this.mode = "list";
    }
  }

  usableItemIds() {
    return Object.keys(this.game.items || {})
      .filter((id) => (this.game.items[id] || 0) > 0 && ITEMS[id].kind !== "bait");
  }

  useItemOn(monster, itemId) {
    const item = ITEMS[itemId];
    this.game.items[itemId]--;
    if (item.kind === "heal") {
      const before = monster.hp;
      monster.hp = Math.min(monster.maxHp, monster.hp + item.value);
      const healed = monster.hp - before;
      let msg = `${monster.name}に ${item.name}を つかった！HPが ${healed} かいふくした！`;
      if (item.cureStatus && monster.status) {
        clearStatus(monster);
        msg += ` じょうたいいじょうも なおった！`;
      }
      this.message = msg;
    } else if (item.kind === "stat_boost") {
      monster[item.stat] += item.value;
      const label = item.stat === "atk" ? "こうげき" : item.stat === "def" ? "ぼうぎょ" : item.stat;
      this.message = `${monster.name}に ${item.name}を つかった！${label}が ${item.value} あがった！`;
    }
    sfxItemGet();
    this.mode = "list";
    this.game.save();
  }

  startBreeding() {
    if (this.game.party.length < 2) {
      this.message = "配合には なかまが 2体 ひつようだよ。";
      return;
    }
    const eligible = this.game.party.filter((m) => m.level >= MIN_BREED_LEVEL);
    if (eligible.length < 2) {
      this.message = `配合には Lv.${MIN_BREED_LEVEL}いじょうの なかまが 2体 ひつようだよ。`;
      return;
    }
    this.mode = "breed";
    this.firstParent = null;
    this.cursor = 0;
  }

  askRelease() {
    if (this.game.party.length === 0) {
      this.message = "なかまが いないよ。";
      return;
    }
    this.confirm = { index: this.cursor, yes: false, monster: this.game.party[this.cursor] };
  }

  releaseMonster(index) {
    const [removed] = this.game.party.splice(index, 1);
    if (this.cursor >= this.game.party.length) this.cursor = this.game.party.length - 1;
    this.message = `${removed.name}を にがした。`;
    this.game.save();
  }

  chooseParent(index) {
    const selected = this.game.party[index];
    if (selected.level < MIN_BREED_LEVEL) {
      this.message = `Lv.${MIN_BREED_LEVEL}みまんは まだ 配合できないよ。`;
      return;
    }
    if (!this.firstParent) {
      this.firstParent = selected;
      sfxConfirm();
      return;
    }
    if (selected.uid === this.firstParent.uid) {
      this.message = "ちがう なかまを えらんでね。";
      return;
    }

    const { child, inheritedSkills, comboSkills } = breedMonsters(this.firstParent, selected);
    this.game.party = this.game.party.filter(
      (m) => m.uid !== this.firstParent.uid && m.uid !== selected.uid
    );
    this.game.party.push(child);
    markCaught(this.game, child.speciesId);
    const skillMessage = inheritedSkills.length > 0
      ? ` ${inheritedSkills.map((id) => SKILLS[id].name).join("、")}を うけついだ！`
      : "";
    const comboMessage = comboSkills.length > 0
      ? ` ぎじゅつの くみあわせで「${comboSkills.map((id) => SKILLS[id].name).join("、")}」を おぼえた！`
      : "";
    const colorMessage = child.tintName ? ` からだが ${child.tintName}いろに そまった！` : "";
    this.message = `おやは ${child.name}を のこして きえていった…${colorMessage}${skillMessage}${comboMessage}`;
    this.mode = "list";
    this.firstParent = null;
    this.cursor = this.game.party.length - 1;
    sfxBreed();
    this.game.save();
  }

  draw(ctx) {
    ctx.fillStyle = "#2e3350";
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = "#f0ead8";
    ctx.font = 'bold 24px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("パーティ", 30, 44);

    this.game.party.forEach((monster, i) => {
      const y = 64 + i * 92;
      panel(ctx, 20, y, 600, 84);
      if (this.cursor === i) {
        ctx.beginPath();
        ctx.roundRect(20, y, 600, 84, 10);
        ctx.strokeStyle = "#ffd75e";
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      if (this.mode === "breed" && this.firstParent?.uid === monster.uid) {
        ctx.fillStyle = "#b85c93";
        ctx.beginPath();
        ctx.roundRect(500, y + 48, 100, 24, 12);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = FONT_BOLD;
        ctx.fillText("おや 1", 524, y + 66);
      }
      drawMonster(ctx, monster.speciesId, 70, y + 42, 0.7, this.time + i, monster.tintHue || 0);
      if (monster.tintColor) {
        ctx.fillStyle = monster.tintColor;
        ctx.beginPath();
        ctx.arc(108, y + 16, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#2b2b33";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      const rank = getRank(SPECIES[monster.speciesId]);
      ctx.fillStyle = RANK_COLOR[rank];
      ctx.beginPath();
      ctx.roundRect(130, y + 8, 22, 18, 4);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = 'bold 13px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(rank, 141, y + 21);
      ctx.textAlign = "left";

      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.fillText(`${monster.name}  Lv.${monster.level}`, 160, y + 32);
      ctx.font = FONT;
      ctx.fillText(SPECIES[monster.speciesId].genus, 300, y + 32);
      hpBar(ctx, 130, y + 46, 190, 12, monster.hp / monster.maxHp);
      ctx.fillText(`${monster.hp} / ${monster.maxHp}`, 335, y + 58);
      ctx.fillText(
        monster.level >= MAX_LEVEL ? "レベル MAX" : `つぎのレベルまで あと ${expToNext(monster.level) - monster.exp}`,
        130, y + 76
      );
      if (i === 0) {
        ctx.fillStyle = "#e8842e";
        ctx.beginPath();
        ctx.roundRect(520, y + 14, 80, 28, 14);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = FONT_BOLD;
        ctx.fillText("せんとう", 528, y + 34);
      }
    });

    ctx.fillStyle = "#f0ead8";
    ctx.font = FONT;
    const hint = this.mode === "breed"
      ? this.firstParent
        ? "↑↓: もう1体のおやをえらぶ ／ Z: けってい ／ X: やめる"
        : "↑↓: 1体目のおやをえらぶ ／ Z: けってい ／ X: やめる"
      : "↑↓: えらぶ ／ Z: メニュー ／ →: 配合 ／ ←: にがす ／ N: なまえ ／ D: 配合表 ／ X: もどる";
    ctx.fillText(hint, 30, 462);

    if (this.message) {
      panel(ctx, 70, 184, 500, 100);
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.textAlign = "center";
      ctx.fillText(this.message, 320, 232);
      ctx.font = FONT;
      ctx.fillText("Z または X で とじる", 320, 264);
      ctx.textAlign = "left";
    }

    if (this.mode === "action") {
      const target = this.game.party[this.actionTarget];
      const options = this.actionOptions();
      const labels = { front: "せんとうに する", item: "どうぐを つかう", cancel: "やめる" };
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, 640, 480);
      panel(ctx, 190, 150, 260, 40 + options.length * 34);
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.textAlign = "center";
      ctx.fillText(`${target.name} に する こと`, 320, 176);
      options.forEach((opt, i) => {
        const y = 210 + i * 34;
        ctx.fillStyle = this.actionCursor === i ? "#e8842e" : "#3a3a52";
        ctx.fillText(labels[opt], 320, y);
      });
      ctx.font = FONT;
      ctx.fillStyle = "#5a5a70";
      ctx.fillText("↑↓: えらぶ ／ Z: けってい ／ X: もどる", 320, 210 + options.length * 34 + 20);
      ctx.textAlign = "left";
    }

    if (this.mode === "item") {
      const target = this.game.party[this.actionTarget];
      const owned = this.usableItemIds();
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, 640, 480);
      panel(ctx, 90, 130, 460, 60 + owned.length * 28);
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.textAlign = "center";
      ctx.fillText(`${target.name} に つかう どうぐ`, 320, 158);
      ctx.textAlign = "left";
      owned.forEach((itemId, i) => {
        const item = ITEMS[itemId];
        const y = 186 + i * 28;
        ctx.fillStyle = this.itemCursor === i ? "#e8842e" : "#3a3a52";
        ctx.fillText(`${item.name}（${this.game.items[itemId]}こ）`, 120, y);
        if (this.itemCursor === i) ctx.fillText("▶", 100, y);
      });
      ctx.font = FONT;
      ctx.fillStyle = "#5a5a70";
      ctx.fillText("↑↓: えらぶ ／ Z: つかう ／ X: もどる", 320, 186 + owned.length * 28 + 20);
    }

    if (this.confirm) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, 640, 480);
      panel(ctx, 80, 176, 480, 138);
      ctx.fillStyle = "#3a3a52";
      ctx.font = FONT_BOLD;
      ctx.textAlign = "center";
      ctx.fillText(`${this.confirm.monster.name}を にがします。よろしい？`, 320, 222);
      const y = 272;
      ctx.fillStyle = this.confirm.yes ? "#e8842e" : "#3a3a52";
      ctx.fillText("はい", 250, y);
      ctx.fillStyle = !this.confirm.yes ? "#e8842e" : "#3a3a52";
      ctx.fillText("いいえ", 396, y);
      ctx.font = FONT;
      ctx.fillStyle = "#5a5a70";
      ctx.fillText("←→: えらぶ ／ Z: けってい ／ X: やめる", 320, 300);
      ctx.textAlign = "left";
    }
  }
}

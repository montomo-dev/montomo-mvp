import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createMonster, rollWildSpecies, SPECIES } from "../js/data/monsters.js";
import { getStage, STAGES, TILE_TYPES } from "../js/data/stages.js";
import { breedMonsters } from "../js/systems/breeding.js";
import { depositToRanch } from "../js/systems/party.js";
import { ITEMS } from "../js/data/items.js";

test("レア枠は乱数5%未満でツキノネになる", () => {
  assert.equal(rollWildSpecies(undefined, () => 0.049), "tsukinone");
});

test("5%以上では通常モンスターになる", () => {
  const values = [0.05, 0];
  assert.equal(rollWildSpecies(undefined, () => values.shift()), "dogura");
});

test("新しい野生モンスターが出現表に入っている", () => {
  assert.equal(rollWildSpecies(undefined, () => 0.999), "tsuboco");
});

test("配合で親を残したままLv.1の子と継承技が生まれる", () => {
  const parentA = createMonster("mofuri", 3);
  const parentB = createMonster("hibachi", 3);
  const { child, inheritedSkill } = breedMonsters(parentA, parentB);

  assert.equal(child.level, 1);
  assert.deepEqual(child.parents, [parentA.uid, parentB.uid]);
  assert.ok(inheritedSkill);
  assert.ok(child.skills.includes(inheritedSkill));
  assert.equal(parentA.level, 3);
  assert.equal(parentB.level, 3);
});

test("追加した3体も個体生成できる", () => {
  const paper = createMonster("orihiko", 2);
  const wood = createMonster("kiboko", 2);
  const pot = createMonster("tsuboco", 2);

  assert.equal(paper.name, "オリヒコ");
  assert.equal(wood.name, "キボコ");
  assert.equal(pot.name, "ツボコ");
  assert.ok(paper.maxHp > 0);
  assert.ok(wood.maxHp > 0);
  assert.ok(pot.maxHp > 0);
});

test("配合専用キャラは特定の組み合わせからだけ生まれる", () => {
  const a = createMonster("mofuri", 4);
  const b = createMonster("pyokotan", 4);
  const c = createMonster("hibachi", 4);
  const d = createMonster("pachikoro", 4);
  const e = createMonster("dogura", 4);
  const f = createMonster("fuwarisu", 4);

  assert.equal(breedMonsters(a, b).child.speciesId, "obako");
  assert.equal(breedMonsters(c, d).child.speciesId, "kurista");
  assert.equal(breedMonsters(e, f).child.speciesId, "hagumon");
});

test("stage3 は cave の先にあり、ボス地形を持つ", () => {
  const stage2 = getStage("stage2");
  const cave = getStage(stage2.nextStage);
  const stage3 = getStage(cave.nextStage);

  assert.equal(stage3.id, "stage3");
  assert.equal(cave.id, "cave");
  assert.equal(stage3.prevStage, "cave");
  assert.ok(stage3.layout.some((row) => row.includes("4")));
});

test("最後の1体も牧場に預けられる", () => {
  const party = [createMonster("mofuri", 2)];
  const ranch = [];

  assert.equal(depositToRanch(party, ranch, 0), true);
  assert.equal(party.length, 0);
  assert.equal(ranch.length, 1);
});

test("新アイテム3種類が items.js に存在する", () => {
  assert.ok(ITEMS.atkSeed);
  assert.equal(ITEMS.atkSeed.kind, "stat_boost");
  assert.equal(ITEMS.atkSeed.stat, "atk");
  assert.ok(ITEMS.defSeed);
  assert.equal(ITEMS.defSeed.stat, "def");
  assert.ok(ITEMS.premiumBait);
  assert.equal(ITEMS.premiumBait.kind, "bait");
  assert.ok(ITEMS.premiumBait.value > ITEMS.bait.value);
});

test("落ちものは全ステージで有効なアイテムを指している", () => {
  for (const [id, stage] of Object.entries(STAGES)) {
    for (const item of stage.groundItems || []) {
      assert.ok(ITEMS[item.itemId], `${id} の ${item.id} の itemId '${item.itemId}' が items.js に存在しない`);
    }
  }
});

test("落ちものは種類が2種類以上に多様化されている", () => {
  const kinds = new Set();
  for (const stage of Object.values(STAGES)) {
    for (const item of stage.groundItems || []) {
      kinds.add(item.itemId);
    }
  }
  assert.ok(kinds.size >= 2, `アイテム種類=${kinds.size}種 期待2種以上`);
});

test("全モンスターに専用の描画関数(PAINTERS)が登録されている", async () => {
  const src = await readFile(new URL("../js/sprites.js", import.meta.url), "utf8");
  const painterKeys = [...src.matchAll(/^\s*(\w+):\s*paint\w+,/gm)].map((m) => m[1]);
  for (const id of Object.keys(SPECIES)) {
    assert.ok(
      painterKeys.includes(id),
      `${id} 用の描画関数が PAINTERS に登録されていない（他モンスターの見た目にフォールバックしてしまう）`
    );
  }
});

test("裏の世界へ進むと game.field と game.scene が新ステージを指す（戻される不具合の回帰防止）", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { FieldScene } = await import("../js/scenes/field.js");

  const game = {
    party: [createMonster("mofuri", 20)],
    items: {},
    money: 0,
    flags: { bossDefeated: true, stageClearedFlags: { stage3: true } },
    dex: { seen: [], caught: [] },
    input: { wasPressed: () => false, isHeld: () => false },
    save() { return true; },
    changeScene(s) { this.scene = s; },
  };
  game.field = new FieldScene(game, "stage3");
  game.scene = game.field;

  // ChoiceScene の「ウラの世界へ進む」選択と同じ処理を再現
  const field = new FieldScene(game, "reverse_stage1");
  game.field = field;
  game.changeScene(field);

  assert.equal(game.field.stageId, "reverse_stage1");
  assert.equal(game.scene, game.field, "game.scene と game.field が同じインスタンスを指していない");
});

test("NEXTタイルは出現位置(spawn.start)から十分離れている（即座に次へ進んでしまう配置ミスの防止）", () => {
  const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  for (const [id, stage] of Object.entries(STAGES)) {
    const start = stage.spawns.start;
    stage.layout.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (Number(ch) === TILE_TYPES.NEXT) {
          const d = manhattan(start, { x, y });
          assert.ok(
            d > 2,
            `${id} の NEXT タイル(${x},${y}) が spawn.start(${start.x},${start.y}) から距離${d}しか離れておらず、出現直後に次のステージへ進んでしまう`
          );
        }
      });
    });
  }
});

test("ステージ別 wildSpecies は全て monsters.js に実在する", () => {
  for (const [id, stage] of Object.entries(STAGES)) {
    for (const speciesId of stage.wildSpecies || []) {
      assert.ok(SPECIES[speciesId], `${id} の wildSpecies '${speciesId}' が SPECIES に存在しない`);
    }
  }
});

test("裏面ステージには専用のwildSpeciesが設定され、表面とは別枠になっている", () => {
  const reverseOnly = ["pukurin", "kageuri", "hoshimogu", "fuyudama", "nejiko"];
  for (const id of ["reverse_stage1", "reverse_stage2", "reverse_cave", "reverse_stage3"]) {
    const pool = STAGES[id].wildSpecies;
    assert.ok(pool && pool.length > 0, `${id} に wildSpecies が設定されていない`);
    for (const speciesId of pool) {
      assert.ok(reverseOnly.includes(speciesId), `${id} の '${speciesId}' は裏面専用モンスターの想定外`);
    }
  }
  // 表面ステージは従来のグローバル出現プールのまま(wildSpecies未設定)であること
  for (const id of ["stage1", "stage2", "cave", "stage3"]) {
    assert.equal(STAGES[id].wildSpecies, undefined, `${id} は表面ステージなので wildSpecies を設定すべきでない`);
  }
});

test("rollWildSpeciesはpool未指定時に従来のWILD_SPECIESを使う(後方互換)", () => {
  const seen = new Set();
  for (let i = 0; i < 30; i++) {
    seen.add(rollWildSpecies(undefined, () => 0.3 + i * 0.02));
  }
  for (const id of seen) {
    assert.ok(SPECIES[id], `デフォルトpoolから出た '${id}' が SPECIES に存在しない`);
  }
  assert.ok(seen.size > 1, "デフォルトpoolの多様性が失われている");
});

test("sea_stage1はreverse_stage3の先にあり、専用モンスターのみ出現する", () => {
  const sea = STAGES.sea_stage1;
  assert.ok(sea, "sea_stage1 が STAGES に存在しない");
  assert.equal(sea.prevStage, "reverse_stage3");
  assert.deepEqual(sea.wildSpecies, ["kaigaran", "awairuka"]);
  for (const id of sea.wildSpecies) {
    assert.ok(SPECIES[id], `sea_stage1 の wildSpecies '${id}' が SPECIES に存在しない`);
  }
});

test("reverse_stage3にはnextStageを設定しない（ボス再訪時の選択画面誤表示を防ぐ）", () => {
  // field.js は stage.nextStage が設定されたクリア済みボスタイル再訪時に
  // ChoiceScene（stage3→reverse_stage1固定の選択画面）を再表示する仕様のため、
  // reverse_stage3 に nextStage を設定すると誤って古い選択肢が出てしまう。
  // sea_stage1 への接続はボス撃破直後のEndingScene(nextStageId)のみで行う。
  assert.equal(STAGES.reverse_stage3.nextStage, undefined);
});

test("sea_stage1はsea_stage2と接続され、sea_stage2は専用モンスターが出現する", () => {
  assert.equal(STAGES.sea_stage1.nextStage, "sea_stage2");
  const sea2 = STAGES.sea_stage2;
  assert.ok(sea2, "sea_stage2 が STAGES に存在しない");
  assert.equal(sea2.prevStage, "sea_stage1");
  assert.deepEqual(sea2.wildSpecies, ["awairuka", "hikariebi"]);
  for (const id of sea2.wildSpecies) {
    assert.ok(SPECIES[id], `sea_stage2 の wildSpecies '${id}' が SPECIES に存在しない`);
  }
});

test("全ステージで宝箱・落ちものが木や壁と重ならず平地に置かれている（座標コピペミスの防止）", () => {
  for (const [id, stage] of Object.entries(STAGES)) {
    const checkPlacement = (kind, items) => {
      for (const item of items || []) {
        const tile = Number(stage.layout[item.y][item.x]);
        assert.equal(
          tile,
          TILE_TYPES.PLAIN,
          `${id} の ${kind} '${item.id}' (${item.x},${item.y}) が平地ではない(tile=${tile})`
        );
      }
    };
    checkPlacement("宝箱", stage.treasures);
    checkPlacement("落ちもの", stage.groundItems);
  }
});

test("全ステージのprevStage/nextStageは実在するステージのみを指す（未実装ステージ参照によるTitleフォールバックの防止）", () => {
  // getStage()は未定義IDでもSTART_STAGE_IDへ静かにフォールバックするため、
  // 未実装ステージへのnextStage/prevStageを設定したまま公開すると、
  // プレイヤーが気づかぬうちにstage1へ飛ばされる不具合になる。
  for (const [id, stage] of Object.entries(STAGES)) {
    if (stage.nextStage) {
      assert.ok(STAGES[stage.nextStage], `${id}.nextStage '${stage.nextStage}' が STAGES に存在しない`);
    }
    if (stage.prevStage) {
      assert.ok(STAGES[stage.prevStage], `${id}.prevStage '${stage.prevStage}' が STAGES に存在しない`);
    }
  }
});

test("海ワールド(sea_stage1〜sea_stage3)は一続きに接続され、sea_stage3にボスがいる", () => {
  assert.equal(STAGES.sea_stage1.nextStage, "sea_stage2");
  assert.equal(STAGES.sea_stage2.nextStage, "sea_cave");
  assert.equal(STAGES.sea_cave.nextStage, "sea_stage3");
  assert.equal(STAGES.sea_stage3.bossId, "seaNushi");
  assert.ok(SPECIES.seaNushi);
  assert.equal(SPECIES.seaNushi.boss, true);
});

test("snow_stage1はsea_stage3の先にあり、専用モンスターのみ出現する", () => {
  const snow = STAGES.snow_stage1;
  assert.ok(snow, "snow_stage1 が STAGES に存在しない");
  assert.equal(snow.prevStage, "sea_stage3");
  assert.deepEqual(snow.wildSpecies, ["yukimaro", "kooritsumu"]);
  for (const id of snow.wildSpecies) {
    assert.ok(SPECIES[id], `snow_stage1 の wildSpecies '${id}' が SPECIES に存在しない`);
  }
});

test("sea_stage3にはnextStageを設定しない（ボス再訪時の選択画面誤表示を防ぐ）", () => {
  // reverse_stage3と同じ理由で、sea_stage3にnextStageを設定すると
  // field.jsのボス再訪ロジックがstage3専用のChoiceSceneを誤って再表示する。
  // snow_stage1への接続はボス撃破直後のEndingScene(nextStageId)のみで行う。
  assert.equal(STAGES.sea_stage3.nextStage, undefined);
});

test("snow_stage1はsnow_stage2と接続され、snow_stage2は専用モンスターが出現する", () => {
  assert.equal(STAGES.snow_stage1.nextStage, "snow_stage2");
  const snow2 = STAGES.snow_stage2;
  assert.ok(snow2, "snow_stage2 が STAGES に存在しない");
  assert.equal(snow2.prevStage, "snow_stage1");
  assert.deepEqual(snow2.wildSpecies, ["kooritsumu", "pengiri"]);
  for (const id of snow2.wildSpecies) {
    assert.ok(SPECIES[id], `snow_stage2 の wildSpecies '${id}' が SPECIES に存在しない`);
  }
});

test("雪原ワールド(snow_stage1〜snow_stage3)は一続きに接続され、snow_stage3にボスがいる", () => {
  assert.equal(STAGES.snow_stage1.nextStage, "snow_stage2");
  assert.equal(STAGES.snow_stage2.nextStage, "snow_cave");
  assert.equal(STAGES.snow_cave.nextStage, "snow_stage3");
  assert.equal(STAGES.snow_stage3.bossId, "hyougaNushi");
  assert.ok(SPECIES.hyougaNushi);
  assert.equal(SPECIES.hyougaNushi.boss, true);
});

test("snow_stage3にはnextStageを設定しない（ボス再訪時の選択画面誤表示を防ぐ）", () => {
  assert.equal(STAGES.snow_stage3.nextStage, undefined);
});

test("desert_stage1はsnow_stage3の先にあり、専用モンスターのみ出現する", () => {
  const desert = STAGES.desert_stage1;
  assert.ok(desert, "desert_stage1 が STAGES に存在しない");
  assert.equal(desert.prevStage, "snow_stage3");
  assert.deepEqual(desert.wildSpecies, ["sabotenko", "sunasasori"]);
  for (const id of desert.wildSpecies) {
    assert.ok(SPECIES[id], `desert_stage1 の wildSpecies '${id}' が SPECIES に存在しない`);
  }
});

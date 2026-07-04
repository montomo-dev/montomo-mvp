import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createMonster, rollWildSpecies, SPECIES } from "../js/data/monsters.js";
import { getStage, STAGES, TILE_TYPES, WORLD_TRANSITIONS } from "../js/data/stages.js";
import { breedMonsters } from "../js/systems/breeding.js";
import { depositToRanch } from "../js/systems/party.js";
import { ITEMS } from "../js/data/items.js";
import { SKILLS } from "../js/data/skills.js";
import { getRank, RANK_ORDER, RANK_COLOR } from "../js/systems/rank.js";
import { TYPES, SPECIES_TYPE, typeOf, typeEffectiveness } from "../js/data/types.js";
import { FLAVOR_TEXT } from "../js/data/flavor.js";

test("レア枠は乱数5%未満でツキノネになる", () => {
  assert.equal(rollWildSpecies(undefined, () => 0.049), "tsukinone");
});

test("5%以上では通常モンスターになる", () => {
  const values = [0.05, 0];
  assert.equal(rollWildSpecies(undefined, () => values.shift()), "dogura");
});

test("新しい野生モンスターが出現表に入っている", () => {
  assert.equal(rollWildSpecies(undefined, () => 0.999), "kazepeko");
});

test("breedMonstersの計算自体は親オブジェクトを変更せず、Lv.1の子と継承技を返す", () => {
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

test("PartySceneで配合すると親2体はパーティから消え、子だけが残る", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { PartyScene } = await import("../js/scenes/party.js");

  const parentA = createMonster("mofuri", 3);
  const parentB = createMonster("hibachi", 3);
  const bystander = createMonster("fuwarisu", 5);
  const game = {
    party: [parentA, parentB, bystander],
    dex: { seen: [], caught: [] },
    save: () => true,
  };
  const scene = new PartyScene(game, null);
  scene.startBreeding();
  scene.chooseParent(0);
  scene.chooseParent(1);

  const uids = game.party.map((m) => m.uid);
  assert.ok(!uids.includes(parentA.uid), "配合後も親Aがパーティに残っている");
  assert.ok(!uids.includes(parentB.uid), "配合後も親Bがパーティに残っている");
  assert.ok(uids.includes(bystander.uid), "配合に関与していないなかまが消えてしまった");
  assert.equal(game.party.length, 2, "パーティ人数が 親2体消滅+子1体誕生 の想定と一致しない");
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
  const reverseOnly = [
    "pukurin",
    "kageuri",
    "hoshimogu",
    "fuyudama",
    "nejiko",
    "shizukuya",
    "tsuyuhika",
    "moriame",
    "tsukihane",
    "hikariame",
    "sumiremo",
  ];
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
  assert.deepEqual(sea.wildSpecies, ["kaigaran", "awairuka", "sazanami", "mizuhane"]);
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
  assert.deepEqual(sea2.wildSpecies, ["awairuka", "hikariebi", "mizugoma", "mizukusa"]);
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
  assert.deepEqual(snow.wildSpecies, ["yukimaro", "kooritsumu", "yukigamo"]);
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
  assert.deepEqual(desert.wildSpecies, ["sabotenko", "sunasasori", "sunaboko", "sunobori"]);
  for (const id of desert.wildSpecies) {
    assert.ok(SPECIES[id], `desert_stage1 の wildSpecies '${id}' が SPECIES に存在しない`);
  }
});

test("desert_stage1はdesert_stage2と接続され、desert_stage2は専用モンスターが出現する", () => {
  assert.equal(STAGES.desert_stage1.nextStage, "desert_stage2");
  const desert2 = STAGES.desert_stage2;
  assert.ok(desert2, "desert_stage2 が STAGES に存在しない");
  assert.equal(desert2.prevStage, "desert_stage1");
  assert.deepEqual(desert2.wildSpecies, ["sunasasori", "rakudan", "sunamaru"]);
  for (const id of desert2.wildSpecies) {
    assert.ok(SPECIES[id], `desert_stage2 の wildSpecies '${id}' が SPECIES に存在しない`);
  }
});

test("砂漠ワールド(desert_stage1〜desert_stage3)は一続きに接続され、desert_stage3にボスがいる", () => {
  assert.equal(STAGES.desert_stage1.nextStage, "desert_stage2");
  assert.equal(STAGES.desert_stage2.nextStage, "desert_cave");
  assert.equal(STAGES.desert_cave.nextStage, "desert_stage3");
  assert.equal(STAGES.desert_stage3.bossId, "sunaNushi");
  assert.ok(SPECIES.sunaNushi);
  assert.equal(SPECIES.sunaNushi.boss, true);
});

test("desert_stage3にはnextStageを設定しない（ボス再訪時の選択画面誤表示を防ぐ）", () => {
  assert.equal(STAGES.desert_stage3.nextStage, undefined);
});

test("factory_stage1はdesert_stage3の先にあり、専用モンスターのみ出現する", () => {
  const factory = STAGES.factory_stage1;
  assert.ok(factory, "factory_stage1 が STAGES に存在しない");
  assert.equal(factory.prevStage, "desert_stage3");
  assert.deepEqual(factory.wildSpecies, ["hagurumaru", "sparkun"]);
  for (const id of factory.wildSpecies) {
    assert.ok(SPECIES[id], `factory_stage1 の wildSpecies '${id}' が SPECIES に存在しない`);
  }
});

test("factory_stage1はfactory_stage2と接続され、factory_stage2は専用モンスターが出現する", () => {
  assert.equal(STAGES.factory_stage1.nextStage, "factory_stage2");
  const factory2 = STAGES.factory_stage2;
  assert.ok(factory2, "factory_stage2 が STAGES に存在しない");
  assert.equal(factory2.prevStage, "factory_stage1");
  assert.deepEqual(factory2.wildSpecies, ["sparkun", "karakuribat"]);
  for (const id of factory2.wildSpecies) {
    assert.ok(SPECIES[id], `factory_stage2 の wildSpecies '${id}' が SPECIES に存在しない`);
  }
});

test("工場ワールド(factory_stage1〜factory_stage3)は一続きに接続され、factory_stage3にボスがいる", () => {
  assert.equal(STAGES.factory_stage1.nextStage, "factory_stage2");
  assert.equal(STAGES.factory_stage2.nextStage, "factory_cave");
  assert.equal(STAGES.factory_cave.nextStage, "factory_stage3");
  assert.equal(STAGES.factory_stage3.bossId, "koujouNushi");
  assert.ok(SPECIES.koujouNushi);
  assert.equal(SPECIES.koujouNushi.boss, true);
});

test("factory_stage3にはnextStageを設定しない（ボス再訪時の選択画面誤表示を防ぐ）", () => {
  assert.equal(STAGES.factory_stage3.nextStage, undefined);
});

test("castle_stage1はfactory_stage3の先にあり、専用モンスターのみ出現する", () => {
  const castle = STAGES.castle_stage1;
  assert.ok(castle, "castle_stage1 が STAGES に存在しない");
  assert.equal(castle.prevStage, "factory_stage3");
  assert.deepEqual(castle.wildSpecies, ["akumakko", "kokushou", "kuroguri"]);
  for (const id of castle.wildSpecies) {
    assert.ok(SPECIES[id], `castle_stage1 の wildSpecies '${id}' が SPECIES に存在しない`);
  }
});

test("castle_stage1はcastle_stage2と接続され、castle_stage2は専用モンスターが出現する", () => {
  assert.equal(STAGES.castle_stage1.nextStage, "castle_stage2");
  const castle2 = STAGES.castle_stage2;
  assert.ok(castle2, "castle_stage2 が STAGES に存在しない");
  assert.equal(castle2.prevStage, "castle_stage1");
  assert.deepEqual(castle2.wildSpecies, ["kokushou", "yuureiking"]);
  for (const id of castle2.wildSpecies) {
    assert.ok(SPECIES[id], `castle_stage2 の wildSpecies '${id}' が SPECIES に存在しない`);
  }
});

test("魔王城ワールド(castle_stage1〜castle_stage3)は一続きに接続され、castle_stage3に最終ボスがいる", () => {
  assert.equal(STAGES.castle_stage1.nextStage, "castle_stage2");
  assert.equal(STAGES.castle_stage2.nextStage, "castle_cave");
  assert.equal(STAGES.castle_cave.nextStage, "castle_stage3");
  assert.equal(STAGES.castle_stage3.bossId, "maou");
  assert.ok(SPECIES.maou);
  assert.equal(SPECIES.maou.boss, true);
});

test("castle_stage3にはnextStageを設定しない（真の最終ボスなので次のワールドへは繋がない）", () => {
  assert.equal(STAGES.castle_stage3.nextStage, undefined);
});

test("全6ワールド(森・裏・海・雪原・砂漠・工場・魔王城)が一本道で接続されている", () => {
  const chain = [
    "stage1", "stage2", "cave", "stage3",
    "reverse_stage1", "reverse_stage2", "reverse_cave", "reverse_stage3",
    "sea_stage1", "sea_stage2", "sea_cave", "sea_stage3",
    "snow_stage1", "snow_stage2", "snow_cave", "snow_stage3",
    "desert_stage1", "desert_stage2", "desert_cave", "desert_stage3",
    "factory_stage1", "factory_stage2", "factory_cave", "factory_stage3",
    "castle_stage1", "castle_stage2", "castle_cave", "castle_stage3",
  ];
  for (const id of chain) {
    assert.ok(STAGES[id], `${id} が STAGES に存在しない`);
  }
  const branches = ["town1", "sea_town1", "snow_town1", "desert_town1", "factory_town1", "castle_town1"];
  assert.equal(
    Object.keys(STAGES).length,
    chain.length + branches.length,
    "STAGES の総数がチェーン+分岐ステージの想定と一致しない"
  );
});

test("各ワールドの街は自分自身のtownStageに繋がり、他ワールドの街と取り違えていない（town1固定バグの回帰防止）", () => {
  const gateways = [
    ["stage1", "town1"],
    ["sea_stage1", "sea_town1"],
    ["snow_stage1", "snow_town1"],
    ["desert_stage1", "desert_town1"],
    ["factory_stage1", "factory_town1"],
    ["castle_stage1", "castle_town1"],
  ];
  for (const [fieldId, townId] of gateways) {
    const field = STAGES[fieldId];
    const town = STAGES[townId];
    assert.ok(field, `${fieldId} が STAGES に存在しない`);
    assert.ok(town, `${townId} が STAGES に存在しない`);
    assert.equal(field.townStage, townId, `${fieldId}.townStage が ${townId} を指していない`);
    assert.equal(town.townExitStage, fieldId, `${townId}.townExitStage が ${fieldId} を指していない`);
    assert.ok(town.npcs && town.npcs.length > 0, `${townId} にNPCが設定されていない`);
    assert.ok(town.spawns.start, `${townId} にstart spawnが設定されていない`);
  }
});

test("nextStageが未設定のボスステージはWORLD_TRANSITIONSで次のワールドへ復帰できる（再訪時に詰む不具合の防止）", () => {
  // 以前のセッションで既にボスを撃破済みの場合、撃破直後のEndingScene遷移を
  // 逃していると、ボス部屋に戻っても進めなくなる不具合があった。
  // nextStageをあえて空けているボスステージ（stage3以外の全ワールドボス）は、
  // 必ずWORLD_TRANSITIONSに次のワールドへの復帰先を持つこと。
  const bossStagesWithoutNextStage = Object.values(STAGES)
    .filter((s) => s.bossId && s.nextStage === undefined && s.id !== "castle_stage3");
  assert.ok(bossStagesWithoutNextStage.length > 0, "検証対象のボスステージが見つからない");
  for (const stage of bossStagesWithoutNextStage) {
    const nextId = WORLD_TRANSITIONS[stage.id];
    assert.ok(nextId, `${stage.id} がWORLD_TRANSITIONSに登録されていない`);
    assert.ok(STAGES[nextId], `${stage.id} のWORLD_TRANSITIONS先 '${nextId}' がSTAGESに存在しない`);
  }
});

test("裏の主のひろば(reverse_stage3)を撃破済みの状態で再訪すると海の世界へ進める", async () => {
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
    party: [createMonster("mofuri", 30)],
    items: {},
    money: 0,
    flags: { bossDefeated: true, stageClearedFlags: { reverse_stage3: true } },
    dex: { seen: [], caught: [] },
    input: { wasPressed: () => false, isHeld: () => false },
    save() { return true; },
    changeScene(s) { this.scene = s; },
  };
  const field = new FieldScene(game, "reverse_stage3");
  game.field = field;
  game.scene = field;
  field.onStep(TILE_TYPES.BOSS);
  assert.equal(field.stageId, "sea_stage1");
});

test("全モンスターの学習スキルはskills.jsに実在する", () => {
  for (const species of Object.values(SPECIES)) {
    for (const entry of species.learnset) {
      assert.ok(SKILLS[entry.skill], `${species.id} の learnset '${entry.skill}' が SKILLS に存在しない`);
    }
  }
});

test("hibiwareGeki/gantekiotoshiはボス専用の必殺技として使い回しが抑えられている（技の多様化）", () => {
  const countUsers = (skillId) =>
    Object.values(SPECIES).filter((s) => s.learnset.some((l) => l.skill === skillId)).length;
  assert.ok(countUsers("hibiwareGeki") <= 5, "hibiwareGekiの使用モンスターが再び増えすぎている");
  assert.ok(countUsers("gantekiotoshi") <= 5, "gantekiotoshiの使用モンスターが再び増えすぎている");
});

test("全ボスにbossAI(フェーズ変化・ため技)が定義されている", () => {
  const bosses = Object.values(SPECIES).filter((s) => s.boss);
  assert.ok(bosses.length >= 7);
  for (const boss of bosses) {
    const ai = boss.bossAI;
    assert.ok(ai, `${boss.id} に bossAI が定義されていない`);
    assert.ok(Array.isArray(ai.phases) && ai.phases.length >= 1, `${boss.id} の phases が不正`);
    for (const phase of ai.phases) {
      assert.ok(phase.below > 0 && phase.below < 1, `${boss.id} の phase.below が不正`);
      assert.ok(phase.atkMul > 1, `${boss.id} の atkMul は1より大きい必要がある`);
      assert.ok(phase.spdMul >= 1, `${boss.id} の spdMul が不正`);
      assert.ok(typeof phase.message === "string" && phase.message.length > 0, `${boss.id} の phase.message が空`);
    }
    assert.ok(ai.charge.interval >= 2, `${boss.id} の charge.interval が短すぎる`);
    assert.ok(ai.charge.power > 1, `${boss.id} の charge.power が不正`);
    assert.ok(typeof ai.charge.name === "string" && ai.charge.name.length > 0, `${boss.id} の charge.name が空`);
    assert.ok(ai.charge.breakRatio > 0 && ai.charge.breakRatio < 1, `${boss.id} の charge.breakRatio が不正`);
  }
});

function makeBattleGame() {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  return {
    party: [createMonster("mofuri", 50)],
    items: {},
    money: 0,
    flags: { stageClearedFlags: {} },
    dex: { seen: [], caught: [] },
    input: { wasPressed: () => false, isHeld: () => false },
    save() { return true; },
    changeScene(s) { this.scene = s; },
  };
}

test("ボスはHP50%以下で第2形態になり攻撃力・素早さが上がる", async () => {
  const { BattleScene } = await import("../js/scenes/battle.js");
  const game = makeBattleGame();
  const boss = createMonster("nushi", 15);
  const battle = new BattleScene(game, boss, { isBoss: true, stageId: "stage3" });
  const atkBefore = boss.atk;
  const spdBefore = boss.spd;

  boss.hp = Math.floor(boss.maxHp * 0.4);
  const messages = [];
  battle.checkBossPhase(messages);

  assert.equal(battle.bossState.phase, 1);
  assert.ok(boss.atk > atkBefore, "第2形態で攻撃力が上がっていない");
  assert.ok(boss.spd > spdBefore, "第2形態で素早さが上がっていない");
  assert.ok(messages.includes("モリノヌシの けが さかだった！"));

  // 再チェックしても二重適用されない
  const atkAfter = boss.atk;
  battle.checkBossPhase([]);
  assert.equal(boss.atk, atkAfter, "フェーズ変化が二重適用されている");
});

test("マオウはHP25%以下でさらに第3形態(発狂)になる", async () => {
  const { BattleScene } = await import("../js/scenes/battle.js");
  const game = makeBattleGame();
  const boss = createMonster("maou", 55);
  const battle = new BattleScene(game, boss, { isBoss: true, stageId: "castle_stage3" });

  boss.hp = Math.floor(boss.maxHp * 0.2);
  const messages = [];
  battle.checkBossPhase(messages);

  assert.equal(battle.bossState.phase, 2, "2段階のフェーズが一気に適用されるべき");
  assert.ok(messages.includes("マオウは はっきょうした！ くらやみが うずまく！"));
});

test("ボスは一定ターンごとに、ため→大技のサイクルで行動する", async () => {
  const { BattleScene } = await import("../js/scenes/battle.js");
  const game = makeBattleGame();
  const boss = createMonster("nushi", 15);
  const battle = new BattleScene(game, boss, { isBoss: true, stageId: "stage3" });
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    for (let turn = 1; turn <= 3; turn++) {
      const messages = [];
      battle.bossEnemyAct(messages);
      assert.equal(battle.bossState.charging, false, `ターン${turn}でため状態になるのは早すぎる`);
    }
    const chargeMessages = [];
    battle.bossEnemyAct(chargeMessages);
    assert.equal(battle.bossState.charging, true, "interval=4ターン目でため状態になっていない");
    assert.ok(chargeMessages.some((m) => m.includes("ためはじめた")));

    const allyHpBefore = battle.ally.hp;
    const releaseMessages = [];
    battle.bossEnemyAct(releaseMessages);
    assert.equal(battle.bossState.charging, false);
    assert.ok(releaseMessages.some((m) => m.includes("もりのおたけび")), "大技名が表示されていない");
    assert.ok(battle.ally.hp < allyHpBefore, "大技でダメージが入っていない");
  } finally {
    Math.random = originalRandom;
  }
});

test("ため中に一定ダメージを与えるとひるんで大技が不発になる", async () => {
  const { BattleScene } = await import("../js/scenes/battle.js");
  const game = makeBattleGame();
  const boss = createMonster("nushi", 15);
  const battle = new BattleScene(game, boss, { isBoss: true, stageId: "stage3" });
  battle.bossState.charging = true;
  battle.bossState.chargeDamage = Math.round(boss.maxHp * 0.5);

  const allyHpBefore = battle.ally.hp;
  const messages = [];
  battle.bossEnemyAct(messages);

  assert.equal(battle.bossState.charging, false);
  assert.ok(messages.some((m) => m.includes("ひるんで")), "ひるみメッセージが出ていない");
  assert.equal(battle.ally.hp, allyHpBefore, "ひるんだのにダメージが入っている");
});

test("ぼうぎょ中は受けるダメージが大きく軽減される", async () => {
  const { BattleScene } = await import("../js/scenes/battle.js");
  const game = makeBattleGame();
  const boss = createMonster("maou", 55);
  const battle = new BattleScene(game, boss, { isBoss: true, stageId: "castle_stage3" });
  const originalRandom = Math.random;
  Math.random = () => 0.5;
  try {
    const hpStart = battle.ally.hp;
    battle.performAction(boss, battle.ally, { type: "attack" }, []);
    const normalDamage = hpStart - battle.ally.hp;

    battle.allyGuarding = true;
    const hpMid = battle.ally.hp;
    battle.performAction(boss, battle.ally, { type: "attack" }, []);
    const guardedDamage = hpMid - battle.ally.hp;
    battle.allyGuarding = false;

    assert.ok(guardedDamage < normalDamage * 0.5, `ぼうぎょの軽減が効いていない (通常${normalDamage} / ぼうぎょ${guardedDamage})`);
  } finally {
    Math.random = originalRandom;
  }
});

test("全モンスターにE〜Sいずれかのランクが付与されている", () => {
  for (const species of Object.values(SPECIES)) {
    const rank = getRank(species);
    assert.ok(RANK_ORDER.includes(rank), `${species.id} のランク '${rank}' が想定外`);
    assert.ok(RANK_COLOR[rank], `${species.id} のランク '${rank}' に表示色が定義されていない`);
  }
});

test("ボスと配合専用のレア個体はSランクになる", () => {
  assert.equal(getRank(SPECIES.maou), "S");
  assert.equal(getRank(SPECIES.nushi), "S");
  assert.equal(getRank(SPECIES.reiseiou), "S", "breedOnly かつ rare の個体はSランクになるべき");
});

test("配合専用モンスター(reiseiou以外)はAランクになる", () => {
  assert.equal(getRank(SPECIES.obako), "A");
  assert.equal(getRank(SPECIES.mofurigarden), "A");
});

test("野生でrare指定のモンスターはBランクになる", () => {
  assert.equal(getRank(SPECIES.tsukinone), "B");
  assert.equal(getRank(SPECIES.takarabox), "B");
});

test("通常の野生モンスターはrecruitEaseに応じてC〜Eに分かれる", () => {
  assert.equal(getRank(SPECIES.dogura), "E", "recruitEaseが高い(捕まえやすい)ほど低ランクになるべき");
  assert.equal(getRank(SPECIES.mofurif), "C", "recruitEaseが低い(捕まえにくい)ほど高ランクになるべき");
});

test("全モンスターに有効なタイプが1つ割り当てられている", () => {
  for (const [id, species] of Object.entries(SPECIES)) {
    assert.ok(id in SPECIES_TYPE, `${id} にタイプが割り当てられていない`);
    assert.ok(TYPES.includes(typeOf(id)), `${id} のタイプ '${typeOf(id)}' が TYPES に存在しない`);
  }
});

test("全スキルに有効なタイプが設定されている", () => {
  for (const [id, skill] of Object.entries(SKILLS)) {
    assert.ok(TYPES.includes(skill.type), `${id} のタイプ '${skill.type}' が TYPES に存在しない`);
  }
});

test("タイプ相性: くさはみずに効果抜群、ほのおにはいまひとつ", () => {
  assert.equal(typeEffectiveness("くさ", "みず"), 2);
  assert.equal(typeEffectiveness("くさ", "ほのお"), 0.5);
  assert.equal(typeEffectiveness("くさ", "でんき"), 1);
});

test("タイプ相性: でんきはじめんに無効", () => {
  assert.equal(typeEffectiveness("でんき", "じめん"), 0);
});

test("戦闘で効果抜群のタイプ相性だとメッセージが表示される", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { BattleScene } = await import("../js/scenes/battle.js");

  // hibachi(ほのお)の攻撃 → mofuri(くさ)は効果抜群になるはず
  const game = { party: [createMonster("hibachi", 15)], dex: { seen: [], caught: [] }, save: () => true };
  const enemy = createMonster("mofuri", 15);
  const battle = new BattleScene(game, enemy, {});
  const messages = [];
  const originalRandom = Math.random;
  Math.random = () => 0.5;
  try {
    battle.performAction(battle.ally, battle.enemy, { type: "attack" }, messages);
  } finally {
    Math.random = originalRandom;
  }
  assert.ok(
    messages.some((m) => m.includes("ばつぐん")),
    `効果抜群のメッセージが含まれていない: ${JSON.stringify(messages)}`
  );
});

test("ほのおタイプの攻撃は非ほのお相手にやけどを付与できる", async () => {
  const { maybeInflictStatus } = await import("../js/systems/status.js");
  const target = createMonster("mofuri", 10); // くさタイプ
  const originalRandom = Math.random;
  Math.random = () => 0; // 必ず成功する乱数
  try {
    const messages = [];
    maybeInflictStatus("ほのお", target, messages);
    assert.equal(target.status, "burn");
    assert.ok(messages.some((m) => m.includes("やけど")));
  } finally {
    Math.random = originalRandom;
  }
});

test("既に状態異常のモンスターには新しい状態異常が上書きされない", async () => {
  const { maybeInflictStatus } = await import("../js/systems/status.js");
  const target = createMonster("mofuri", 10);
  target.status = "paralysis";
  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    maybeInflictStatus("ほのお", target, []);
    assert.equal(target.status, "paralysis", "既存の状態異常が上書きされてしまった");
  } finally {
    Math.random = originalRandom;
  }
});

test("まひ状態は一定確率で行動不能になる", async () => {
  const { canAct } = await import("../js/systems/status.js");
  const monster = createMonster("mofuri", 10);
  monster.status = "paralysis";
  const originalRandom = Math.random;
  try {
    Math.random = () => 0; // 行動不能側の乱数
    assert.equal(canAct(monster, []), false);
    Math.random = () => 0.99; // 行動できる側の乱数
    assert.equal(canAct(monster, []), true);
  } finally {
    Math.random = originalRandom;
  }
});

test("やけど状態は毎ターン終了時にダメージを受ける", async () => {
  const { applyEndOfTurnStatus } = await import("../js/systems/status.js");
  const monster = createMonster("mofuri", 10);
  monster.status = "burn";
  const before = monster.hp;
  applyEndOfTurnStatus(monster, []);
  assert.ok(monster.hp < before, "やけどダメージが発生していない");
});

test("戦闘終了時にパーティ全員の状態異常が解除される", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { BattleScene } = await import("../js/scenes/battle.js");
  const ally = createMonster("mofuri", 30);
  ally.status = "paralysis";
  const game = {
    party: [ally],
    dex: { seen: [], caught: [] },
    field: { resetPosition() {}, showToast() {} },
    save: () => true,
    changeScene() {},
  };
  const enemy = createMonster("takarabox", 5);
  const battle = new BattleScene(game, enemy, {});
  battle.after = "end";
  battle.enterNext();
  assert.equal(ally.status, null, "戦闘終了後もパーティの状態異常が残っている");
});

test("全モンスターに図鑑用フレーバーテキストが設定されている", () => {
  for (const id of Object.keys(SPECIES)) {
    assert.ok(FLAVOR_TEXT[id] && FLAVOR_TEXT[id].length > 0, `${id} にフレーバーテキストが設定されていない`);
  }
});

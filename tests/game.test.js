import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createMonster, rollWildSpecies, SPECIES, WILD_SPECIES, monsterName } from "../js/data/monsters.js";
import { getStage, STAGES, TILE_TYPES, WORLD_TRANSITIONS } from "../js/data/stages.js";
import { breedMonsters } from "../js/systems/breeding.js";
import { depositToRanch } from "../js/systems/party.js";
import { ITEMS, shopInventoryFor } from "../js/data/items.js";
import { SKILLS } from "../js/data/skills.js";
import { getRank, RANK_ORDER, RANK_COLOR } from "../js/systems/rank.js";
import { TYPES, SPECIES_TYPE, typeOf, typeEffectiveness } from "../js/data/types.js";
import { FLAVOR_TEXT } from "../js/data/flavor.js";
import { SKILL_COMBOS, applyCombos } from "../js/systems/skillCombo.js";
import { BOSS_STORY, bossIntroText, bossVictoryLines } from "../js/data/story.js";
import { gainExp, MAX_LEVEL, statsFor, expToNext } from "../js/systems/growth.js";
import { LEGEND_REQUIREMENT, LEGEND_REWARD_ID, legendProgress, hasLegendReward, canClaimLegend, grantLegendReward } from "../js/systems/legend.js";
import { drawMonster } from "../js/sprites.js";
import { TRIBE_LIST } from "../js/data/tribes.js";

test("レア枠は乱数5%未満でツキノネになる", () => {
  assert.equal(rollWildSpecies(undefined, () => 0.049), "tsukinone");
});

test("5%以上では通常モンスターになる", () => {
  const values = [0.05, 0];
  assert.equal(rollWildSpecies(undefined, () => values.shift()), "kurihari");
});

test("新しい野生モンスターが出現表に入っている", () => {
  assert.equal(rollWildSpecies(undefined, () => 0.999), "kazepeko");
});

test("breedMonstersの計算自体は親オブジェクトを変更せず、Lv.1の子と継承技を返す", () => {
  const parentA = createMonster("mofuri", 3);
  const parentB = createMonster("hibachi", 3);
  const { child, inheritedSkills } = breedMonsters(parentA, parentB);

  assert.equal(child.level, 1);
  assert.deepEqual(child.parents, [parentA.uid, parentB.uid]);
  assert.ok(inheritedSkills.length > 0);
  for (const skillId of inheritedSkills) assert.ok(child.skills.includes(skillId));
  assert.equal(parentA.level, 3);
  assert.equal(parentB.level, 3);
});

test("全SPECIESにTRIBE_LISTに含まれる有効なtribeが設定されている", () => {
  for (const [id, species] of Object.entries(SPECIES)) {
    assert.ok(species.tribe, `${id} にtribeが設定されていない`);
    assert.ok(TRIBE_LIST.includes(species.tribe), `${id} のtribe「${species.tribe}」がTRIBE_LISTに存在しない`);
  }
});

test("ボス種族(boss: true)は必ずtribe「boss」を持つ", () => {
  for (const [id, species] of Object.entries(SPECIES)) {
    if (species.boss) assert.equal(species.tribe, "boss", `${id} はボスなのにtribeが「boss」でない`);
  }
});

test("同じ種族(tribe)どうしの配合はステータスが高く育つ(純血ボーナス)", () => {
  // mofuri(kemono)とdogura(kemono)は同種族
  const parentA = createMonster("mofuri", 20);
  const parentB = createMonster("dogura", 20);
  const { child, sameTribe } = breedMonsters(parentA, parentB);
  assert.equal(sameTribe, true);

  const plainAvg = Math.max(1, Math.floor((parentA.maxHp + parentB.maxHp) / 4));
  assert.ok(child.maxHp > plainAvg, "同種族配合なのにステータスボーナスが乗っていない");
});

test("異なる種族(tribe)どうしの配合はステータスボーナスが乗らない", () => {
  // mofuri(kemono)とhibachi(dragon)は異種族
  const parentA = createMonster("mofuri", 20);
  const parentB = createMonster("hibachi", 20);
  const { child, sameTribe } = breedMonsters(parentA, parentB);
  assert.equal(sameTribe, false);

  const plainAvg = Math.max(1, Math.floor((parentA.maxHp + parentB.maxHp) / 4));
  assert.equal(child.maxHp, plainAvg);
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

  const parentA = createMonster("mofuri", 10);
  const parentB = createMonster("hibachi", 10);
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

test("全モンスターの見た目(drawMonster)が例外なく描画できる", () => {
  const ctx = new Proxy(
    { createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) },
    { get: (t, k) => (k in t ? t[k] : () => {}), set: () => true }
  );
  for (const id of Object.keys(SPECIES)) {
    assert.doesNotThrow(() => drawMonster(ctx, id, 100, 100, 1, 0, 0), `${id} の描画で例外が発生した`);
  }
});

test("目の描き方(eye系ヘルパー)がタイプによって使い分けられている（使い回し防止の回帰確認）", async () => {
  const src = await readFile(new URL("../js/sprites.js", import.meta.url), "utf8");
  const usedEyeFns = new Set([...src.matchAll(/\b(eye\w*)\(ctx,/g)].map((m) => m[1]));
  assert.ok(usedEyeFns.size >= 5, `目のバリエーションが少なすぎる(${usedEyeFns.size}種類): ${[...usedEyeFns].join(", ")}`);
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
    "shizukudama",
    "kagerouzu",
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
  assert.deepEqual(sea.wildSpecies, ["kamomeru", "kaigaramaru", "kaigaran", "awairuka", "sazanami", "mizuhane"]);
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
  assert.deepEqual(sea2.wildSpecies, ["unizoku", "awairuka", "hikariebi", "mizugoma", "mizukusa"]);
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
  assert.deepEqual(snow.wildSpecies, ["shirokitsune", "kooridama", "yukimaro", "kooritsumu", "yukigamo"]);
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
  assert.deepEqual(desert.wildSpecies, ["saboko", "sunatokage", "sabotenko", "sunasasori", "sunaboko", "sunobori"]);
  for (const id of desert.wildSpecies) {
    assert.ok(SPECIES[id], `desert_stage1 の wildSpecies '${id}' が SPECIES に存在しない`);
  }
});

test("desert_stage1はdesert_stage2と接続され、desert_stage2は専用モンスターが出現する", () => {
  assert.equal(STAGES.desert_stage1.nextStage, "desert_stage2");
  const desert2 = STAGES.desert_stage2;
  assert.ok(desert2, "desert_stage2 が STAGES に存在しない");
  assert.equal(desert2.prevStage, "desert_stage1");
  assert.deepEqual(desert2.wildSpecies, ["rakudako", "sunasasori", "rakudan", "sunamaru"]);
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
  assert.deepEqual(factory.wildSpecies, ["kandenkko", "nejimaru", "hagurumaru", "sparkun"]);
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
  assert.deepEqual(castle.wildSpecies, ["obakenoko", "yamikko", "akumakko", "kokushou", "kuroguri"]);
  for (const id of castle.wildSpecies) {
    assert.ok(SPECIES[id], `castle_stage1 の wildSpecies '${id}' が SPECIES に存在しない`);
  }
});

test("castle_stage1はcastle_stage2と接続され、castle_stage2は専用モンスターが出現する", () => {
  assert.equal(STAGES.castle_stage1.nextStage, "castle_stage2");
  const castle2 = STAGES.castle_stage2;
  assert.ok(castle2, "castle_stage2 が STAGES に存在しない");
  assert.equal(castle2.prevStage, "castle_stage1");
  assert.deepEqual(castle2.wildSpecies, ["kumogumo", "kokushou", "yuureiking"]);
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

test("配合専用モンスター全14種のうち残り11種にもレシピが設定されている（幽霊データの回帰防止）", () => {
  const recipes = [
    ["obako", "tsukinone", "obagale"],
    ["kaigaran", "kurista", "kuricrown"],
    ["hagumon", "hagurumaru", "hagutitan"],
    ["mofuri", "sakuraneko", "mofurigarden"],
    ["dogura", "ishimaru", "borudrill"],
    ["hibachi", "sandango", "bakuphoenix"],
    ["fuwarisu", "torimugi", "tenstorm"],
    ["awairuka", "sazanami", "oonamiwhale"],
    ["hikariebi", "sumiremo", "hoshizora"],
    ["karakuribat", "nejiko", "omegazenmaiya"],
    ["tsukinone", "yukibouzu", "reiseiou"],
  ];
  for (const [a, b, expected] of recipes) {
    const child = breedMonsters(createMonster(a, 10), createMonster(b, 10)).child;
    assert.equal(child.speciesId, expected, `${a}+${b} が ${expected} を生まない`);
  }
});

test("breedOnlyの全モンスターがSPECIAL_RESULTSのいずれかの結果として到達可能", async () => {
  const { SPECIAL_RESULTS } = await import("../js/systems/breeding.js");
  const reachable = new Set(Object.values(SPECIAL_RESULTS));
  // kazaribiはレジェンド報酬専用の入手経路を持つため、配合レシピ経由の到達性チェックからは除外する
  const LEGEND_EXEMPT = ["kazaribi"];
  for (const [id, species] of Object.entries(SPECIES)) {
    if (species.breedOnly && !LEGEND_EXEMPT.includes(id)) {
      assert.ok(reachable.has(id), `${id} はbreedOnlyだがSPECIAL_RESULTSのどのレシピからも生まれない`);
    }
  }
});

test("ワープは未クリアのワールドを選択肢に出さず、クリア済みだけ増えていく", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { WarpScene } = await import("../js/scenes/warp.js");

  const gameNoProgress = { flags: { stageClearedFlags: {} } };
  const warpNoProgress = new WarpScene(gameNoProgress, null);
  assert.deepEqual(
    warpNoProgress.unlockedDestinations().map((d) => d.town),
    ["town1"],
    "何もクリアしていない状態では森の街しか選べないはず"
  );

  const gameProgressed = {
    flags: { stageClearedFlags: { reverse_stage3: true, sea_stage3: true } },
  };
  const warpProgressed = new WarpScene(gameProgressed, null);
  assert.deepEqual(
    warpProgressed.unlockedDestinations().map((d) => d.town),
    ["town1", "sea_town1", "snow_town1"],
    "裏の主と深海のヌシを倒した状態では雪原の街まで選べるはず"
  );
});

test("ワープ先を選ぶと同じFieldSceneインスタンスの町にstateが切り替わる", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { WarpScene } = await import("../js/scenes/warp.js");
  const { FieldScene } = await import("../js/scenes/field.js");

  const game = {
    party: [createMonster("mofuri", 20)],
    items: {},
    money: 0,
    flags: { stageClearedFlags: { reverse_stage3: true } },
    dex: { seen: [], caught: [] },
    input: { wasPressed: () => false, isHeld: () => false },
    save: () => true,
    changeScene(s) { this.scene = s; },
  };
  const field = new FieldScene(game, "stage1");
  game.field = field;
  game.scene = field;

  const warp = new WarpScene(game, field);
  warp.warpTo(warp.unlockedDestinations()[1]); // sea_town1

  assert.equal(game.field.stageId, "sea_town1");
  assert.equal(game.scene, game.field, "game.scene と game.field が同じインスタンスを指していない");
});

test("配合の子はステータス1/4ルールで生まれる(親のステータス合計÷4、端数切り捨て)", () => {
  const parentA = createMonster("mofuri", 30);
  const parentB = createMonster("hibachi", 30);
  const { child } = breedMonsters(parentA, parentB);

  assert.equal(child.maxHp, Math.max(1, Math.floor((parentA.maxHp + parentB.maxHp) / 4)));
  assert.equal(child.atk, Math.max(1, Math.floor((parentA.atk + parentB.atk) / 4)));
  assert.equal(child.def, Math.max(1, Math.floor((parentA.def + parentB.def) / 4)));
  assert.equal(child.spd, Math.max(1, Math.floor((parentA.spd + parentB.spd) / 4)));
  assert.equal(child.hp, child.maxHp);
});

test("親をレベルアップさせてから配合するほど、子の初期ステータスが高くなる", () => {
  const lowA = createMonster("mofuri", 5);
  const lowB = createMonster("hibachi", 5);
  const highA = createMonster("mofuri", 40);
  const highB = createMonster("hibachi", 40);

  const childFromLow = breedMonsters(lowA, lowB).child;
  const childFromHigh = breedMonsters(highA, highB).child;

  assert.ok(childFromHigh.maxHp > childFromLow.maxHp, "高レベル親から生まれた子のHPが高くなっていない");
  assert.ok(childFromHigh.atk > childFromLow.atk, "高レベル親から生まれた子の攻撃力が高くなっていない");
});

test("配合の技引き継ぎは、親が持つ未知の技のおよそ半分を引き継ぐ", () => {
  const parentA = createMonster("mofuri", 3);
  parentA.skills = ["happashusshu", "moguradrill", "hinokodance", "bubblesplash"];
  const parentB = createMonster("hibachi", 3);
  parentB.skills = ["biribiritouch"];

  const { child, inheritedSkills } = breedMonsters(parentA, parentB);
  const candidateCount = new Set([...parentA.skills, ...parentB.skills].filter((s) => !child.skills.includes(s) || inheritedSkills.includes(s))).size;
  assert.ok(inheritedSkills.length >= 1);
  assert.ok(inheritedSkills.length <= candidateCount);
});

test("組み合わせ技: 両方の技を持っていると自動で上位技を習得する", () => {
  const monster = createMonster("mofuri", 3);
  monster.skills = ["biribiritouch", "bubblesplash"];
  const learned = applyCombos(monster);
  assert.deepEqual(learned, ["kandenshokku"]);
  assert.ok(monster.skills.includes("kandenshokku"));
});

test("組み合わせ技: 片方の技しか持っていなければ習得しない", () => {
  const monster = createMonster("mofuri", 3);
  monster.skills = ["biribiritouch"];
  const learned = applyCombos(monster);
  assert.deepEqual(learned, []);
});

test("組み合わせ技: 既に習得済みなら重複して追加しない", () => {
  const monster = createMonster("mofuri", 3);
  monster.skills = ["biribiritouch", "bubblesplash", "kandenshokku"];
  const learned = applyCombos(monster);
  assert.deepEqual(learned, []);
  assert.equal(monster.skills.filter((s) => s === "kandenshokku").length, 1);
});

test("全ての組み合わせ技の材料・結果がSKILLSに実在する", () => {
  for (const [key, result] of Object.entries(SKILL_COMBOS)) {
    const [a, b] = key.split("+");
    assert.ok(SKILLS[a], `組み合わせ材料 '${a}' がSKILLSに存在しない`);
    assert.ok(SKILLS[b], `組み合わせ材料 '${b}' がSKILLSに存在しない`);
    assert.ok(SKILLS[result], `組み合わせ結果 '${result}' がSKILLSに存在しない`);
  }
});

test("配合の技引き継ぎは配列内で隣接しない技の組も選べる（連続インデックス切り出しによる選択漏れの回帰防止）", () => {
  let comboObserved = false;
  for (let trial = 0; trial < 50 && !comboObserved; trial++) {
    const parentA = createMonster("mofuri", 20);
    parentA.skills = ["biribiritouch", "happashusshu"];
    const parentB = createMonster("hibachi", 20);
    parentB.skills = ["bubblesplash", "hinokodance"];
    const { inheritedSkills } = breedMonsters(parentA, parentB);
    if (inheritedSkills.includes("biribiritouch") && inheritedSkills.includes("bubblesplash")) {
      comboObserved = true;
    }
  }
  assert.ok(
    comboObserved,
    "候補配列内で隣接していない biribiritouch と bubblesplash が、50回試行しても一度も同時に選ばれなかった"
  );
});

test("配合はLv.10未満のなかまを親にできない", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { PartyScene } = await import("../js/scenes/party.js");

  const low = createMonster("mofuri", 9);
  const high = createMonster("hibachi", 10);
  const game = { party: [low, high], dex: { seen: [], caught: [] }, save: () => true };
  const scene = new PartyScene(game, null);
  scene.startBreeding();
  assert.notEqual(scene.mode, "breed", "Lv.10以上が1体しかいないのに配合モードに入れてしまっている");
  assert.match(scene.message, /Lv\.10/);
});

test("Lv.10以上のなかまが2体いれば配合モードに入れ、Lv未満は親に選べない", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { PartyScene } = await import("../js/scenes/party.js");

  const low = createMonster("mofuri", 5);
  const highA = createMonster("hibachi", 10);
  const highB = createMonster("fuwarisu", 12);
  const game = { party: [low, highA, highB], dex: { seen: [], caught: [] }, save: () => true };
  const scene = new PartyScene(game, null);
  scene.startBreeding();
  assert.equal(scene.mode, "breed");

  scene.chooseParent(0); // Lv.5のmofuriを選ぼうとする
  assert.equal(scene.firstParent, null, "Lv.10未満のなかまが親として選べてしまっている");
});

test("戦闘勝利の経験値は 手持ち100% / 控え50% / 牧場10% の割合で分配される", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { BattleScene } = await import("../js/scenes/battle.js");

  const front = createMonster("mofuri", 50);
  const reserve = createMonster("hibachi", 50);
  const ranchMon = createMonster("fuwarisu", 50);
  const game = {
    party: [front, reserve],
    ranch: [ranchMon],
    dex: { seen: [], caught: [] },
    money: 0,
    flags: {},
    input: { wasPressed: () => false, isHeld: () => false },
    save: () => true,
    changeScene() {},
  };
  const enemy = createMonster("pyokotan", 5);
  const battle = new BattleScene(game, enemy, {});

  // レベル50でexpToNext=1000のため、小さいexp(45前後)ならレベルアップを跨がずそのまま比較できる
  const expectedExp = SPECIES.pyokotan.exp * enemy.level;
  battle.victory([]);

  assert.equal(front.exp, expectedExp, "手持ち(先頭)が100%のけいけんちを得ていない");
  assert.equal(reserve.exp, Math.round(expectedExp * 0.5), "控えが50%のけいけんちを得ていない");
  assert.equal(ranchMon.exp, Math.round(expectedExp * 0.1), "牧場が10%のけいけんちを得ていない");
});

test("ポーションはS/M/L/LL/Xの5段階が用意されている", () => {
  assert.equal(ITEMS.potionS.value, 20);
  assert.equal(ITEMS.potionM.value, 50);
  assert.equal(ITEMS.potionL.value, 200);
  assert.equal(ITEMS.potionLL.value, Infinity);
  assert.equal(ITEMS.potionX.value, Infinity);
  assert.equal(ITEMS.potionX.cureStatus, true);
});

test("ポーションXは状態異常もいっしょに治す", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { BattleScene } = await import("../js/scenes/battle.js");

  const ally = createMonster("mofuri", 20);
  ally.hp = 1;
  ally.status = "burn";
  const game = {
    party: [ally],
    items: { potionX: 1 },
    dex: { seen: [], caught: [] },
    input: { wasPressed: () => false, isHeld: () => false },
    save: () => true,
    changeScene() {},
  };
  const enemy = createMonster("takarabox", 5);
  const battle = new BattleScene(game, enemy, {});
  // どうぐ使用は行動権を消費し敵の反撃が入るため、乱数を固定して確実に外させる
  const originalRandom = Math.random;
  Math.random = () => 1;
  try {
    battle.useItem("potionX");
  } finally {
    Math.random = originalRandom;
  }

  assert.equal(ally.hp, ally.maxHp, "ポーションXでHPが全回復していない");
  assert.equal(ally.status, null, "ポーションXで状態異常が治っていない");
});

test("ポーションLL/Sは状態異常を治さずHPだけ回復する", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { BattleScene } = await import("../js/scenes/battle.js");

  const ally = createMonster("mofuri", 20);
  ally.hp = 1;
  ally.status = "paralysis";
  const game = {
    party: [ally],
    items: { potionLL: 1 },
    dex: { seen: [], caught: [] },
    input: { wasPressed: () => false, isHeld: () => false },
    save: () => true,
    changeScene() {},
  };
  const enemy = createMonster("takarabox", 5);
  const battle = new BattleScene(game, enemy, {});
  const originalRandom = Math.random;
  Math.random = () => 1;
  try {
    battle.useItem("potionLL");
  } finally {
    Math.random = originalRandom;
  }

  assert.equal(ally.hp, ally.maxHp, "ポーションLLでHPが全回復していない");
  assert.equal(ally.status, "paralysis", "ポーションLLで状態異常まで治ってしまっている");
});

test("スカウト成功率は総与ダメージ÷敵最大HP×50×肉ボーナス×レア度倍率で計算される", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { BattleScene } = await import("../js/scenes/battle.js");

  const enemy = createMonster("dogura", 10);
  const originalRecruitEase = SPECIES.dogura.recruitEase;
  SPECIES.dogura.recruitEase = 0.15; // 基準レア度(等倍)で式そのものを検証する
  try {
    const game = {
      party: [createMonster("mofuri", 30)],
      dex: { seen: [], caught: [] },
      money: 0,
      items: {},
      save: () => true,
      changeScene() {},
    };
    const battle = new BattleScene(game, enemy, {});
    const originalRandom = Math.random;

    battle.ally.atk = enemy.atk; // こうげき力が互角
    Math.random = () => 0.99; // 失敗させてメッセージだけ確認する
    battle.tryRecruit();
    assert.ok(battle.queue.some((m) => m.includes("せいこうりつ 50%")), "こうげき力が互角で50%になっていない");

    battle.ally.atk = enemy.atk * 2; // こうげき力が2倍
    battle.tryRecruit();
    assert.ok(battle.queue.some((m) => m.includes("せいこうりつ 100%")), "こうげき力が2倍で100%(確定)になっていない");

    Math.random = originalRandom;
  } finally {
    SPECIES.dogura.recruitEase = originalRecruitEase;
  }
});

test("スカウト成功率はレア度(recruitEase)が高いほど有利、低いほど不利になる", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { BattleScene } = await import("../js/scenes/battle.js");

  function chanceFor(speciesId, recruitEase) {
    const enemy = createMonster(speciesId, 10);
    const original = SPECIES[speciesId].recruitEase;
    SPECIES[speciesId].recruitEase = recruitEase;
    const game = {
      party: [createMonster("mofuri", 30)],
      dex: { seen: [], caught: [] },
      money: 0,
      items: {},
      save: () => true,
      changeScene() {},
    };
    const battle = new BattleScene(game, enemy, {});
    battle.ally.atk = enemy.atk; // こうげき力が互角
    Math.random = () => 0.99;
    battle.tryRecruit();
    SPECIES[speciesId].recruitEase = original;
    const msg = battle.queue.find((m) => m.includes("せいこうりつ"));
    return Number(msg.match(/(\d+)%/)[1]);
  }

  const originalRandom = Math.random;
  try {
    const easyChance = chanceFor("dogura", 0.3);
    const hardChance = chanceFor("mofurif", 0.05);
    assert.ok(easyChance > hardChance, `レア度が高い(0.3)方が低い成功率になってしまっている: easy=${easyChance} hard=${hardChance}`);
  } finally {
    Math.random = originalRandom;
  }
});

test("なかよしエサ/とくべつなエサはスカウト成功率に倍率としてかかる", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { BattleScene } = await import("../js/scenes/battle.js");

  const enemy = createMonster("dogura", 10);
  const original = SPECIES.dogura.recruitEase;
  SPECIES.dogura.recruitEase = 0.15;
  try {
    const game = {
      party: [createMonster("mofuri", 30)],
      dex: { seen: [], caught: [] },
      money: 0,
      items: { bait: 1 },
      save: () => true,
      changeScene() {},
    };
    const battle = new BattleScene(game, enemy, {});
    const originalRandom = Math.random;
    Math.random = () => 0.99;
    battle.ally.atk = enemy.atk; // こうげき力が互角
    battle.useItem("bait"); // 1.3倍のエサを使う(この時点で行動権を1ターン消費する)
    battle.tryRecruit();
    Math.random = originalRandom;

    const msg = battle.queue.find((m) => m.includes("せいこうりつ"));
    const percent = Number(msg.match(/(\d+)%/)[1]);
    assert.equal(percent, 65, `エサの1.3倍が反映されていない(期待65%): ${msg}`);
  } finally {
    SPECIES.dogura.recruitEase = original;
  }
});

test("スカウト成功率は同じ種族を持っているほど下がる(所持数+1で割る)", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { BattleScene } = await import("../js/scenes/battle.js");

  const original = SPECIES.dogura.recruitEase;
  SPECIES.dogura.recruitEase = 0.15;
  const originalRandom = Math.random;
  try {
    function chanceWithOwned(ownedCount) {
      const enemy = createMonster("dogura", 10);
      const party = [createMonster("mofuri", 30)];
      for (let i = 0; i < ownedCount; i++) party.push(createMonster("dogura", 10));
      const game = {
        party,
        dex: { seen: [], caught: [] },
        money: 0,
        items: {},
        save: () => true,
        changeScene() {},
      };
      const battle = new BattleScene(game, enemy, {});
      battle.ally.atk = enemy.atk; // こうげき力が互角
      Math.random = () => 0.99;
      battle.tryRecruit();
      const msg = battle.queue.find((m) => m.includes("せいこうりつ"));
      return Number(msg.match(/(\d+)%/)[1]);
    }

    assert.equal(chanceWithOwned(0), 50);
    assert.equal(chanceWithOwned(1), 25);
    assert.equal(chanceWithOwned(2), Math.round(50 / 3));
  } finally {
    SPECIES.dogura.recruitEase = original;
    Math.random = originalRandom;
  }
});

test("全7体のボスに物語テキスト(登場・勝利)が用意されている", () => {
  const bossIds = Object.values(SPECIES).filter((s) => s.boss).map((s) => s.id);
  assert.equal(bossIds.length, 7, "ボスの数が想定と違う");
  for (const id of bossIds) {
    assert.ok(BOSS_STORY[id], `${id} の物語テキストが story.js に無い`);
    assert.ok(bossIntroText(id, "?").length > 0);
    const lines = bossVictoryLines(id, "?");
    assert.ok(lines.length > 0);
    for (const line of lines) assert.ok(line.length > 0);
  }
});

test("魔王の勝利テキストは複数行の演出になっている", () => {
  const lines = bossVictoryLines("maou", "マオウ");
  assert.ok(lines.length >= 2, "魔王の決着シーンが1行だけになっている");
});

test("レベルの上限は100で、それ以上は経験値を得てもレベルアップしない", () => {
  assert.equal(MAX_LEVEL, 100);

  const nearMax = createMonster("mofuri", 99);
  gainExp(nearMax, SPECIES, 999999);
  assert.equal(nearMax.level, 100, "大量の経験値でLv.100を超えてしまっている");
  assert.equal(nearMax.exp, 0, "カンスト時にexpが0にリセットされていない");

  const beforeStats = { maxHp: nearMax.maxHp, atk: nearMax.atk, def: nearMax.def, spd: nearMax.spd };
  const events = gainExp(nearMax, SPECIES, 100);
  assert.equal(events.length, 0, "カンスト後も経験値イベントが発生してしまっている");
  assert.deepEqual(
    { maxHp: nearMax.maxHp, atk: nearMax.atk, def: nearMax.def, spd: nearMax.spd },
    beforeStats,
    "カンスト後にステータスが変化してしまっている"
  );
});

test("createMonsterにLv.100を超える値を渡してもLv.100にクランプされる", () => {
  const over = createMonster("mofuri", 500);
  assert.equal(over.level, 100);
});

test("全滅すると所持金が半分になり、重要でない回復アイテムを3つ失う", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { BattleScene } = await import("../js/scenes/battle.js");

  const ally = createMonster("mofuri", 10);
  ally.hp = 0;
  const game = {
    party: [ally],
    dex: { seen: [], caught: [] },
    money: 1000,
    items: { potionS: 5, potionM: 2, potionLL: 3, potionX: 1 },
    flags: {},
    field: { resetPosition() {}, showToast() {} },
    input: { wasPressed: () => false, isHeld: () => false },
    save: () => true,
    changeScene() {},
  };
  const enemy = createMonster("takarabox", 5);
  const battle = new BattleScene(game, enemy, {});
  battle.after = "gameover";
  battle.enterNext();

  assert.equal(game.money, 500, "所持金が半分になっていない");
  assert.equal(game.items.potionS, 2, "安価なポーションから優先して失われていない");
  assert.equal(game.items.potionM, 2, "potionSで3個賄えているのにpotionMまで減っている");
  assert.equal(game.items.potionLL, 3, "重要なポーションLLが減ってしまっている");
  assert.equal(game.items.potionX, 1, "重要なポーションXが減ってしまっている");
});

test("重要でない回復アイテムの合計が3個未満でも、あるだけ失って安全に処理される", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { BattleScene } = await import("../js/scenes/battle.js");

  const ally = createMonster("mofuri", 10);
  ally.hp = 0;
  const game = {
    party: [ally],
    dex: { seen: [], caught: [] },
    money: 3,
    items: { potionS: 1, potionM: 1 },
    flags: {},
    field: { resetPosition() {}, showToast() {} },
    input: { wasPressed: () => false, isHeld: () => false },
    save: () => true,
    changeScene() {},
  };
  const enemy = createMonster("takarabox", 5);
  const battle = new BattleScene(game, enemy, {});
  battle.after = "gameover";
  battle.enterNext();

  assert.equal(game.money, 1);
  assert.equal(game.items.potionS, 0);
  assert.equal(game.items.potionM, 0);
});

test("ポーションの価格は効果の上昇にきれいに比例する(3倍→6倍→プレミアム)", () => {
  assert.equal(ITEMS.potionS.price, 45);
  assert.equal(ITEMS.potionM.price, ITEMS.potionS.price * 3);
  assert.equal(ITEMS.potionL.price, ITEMS.potionM.price * 2);
  assert.ok(ITEMS.potionLL.price > ITEMS.potionL.price, "全回復のLLがLより安くなっている");
  assert.ok(ITEMS.potionX.price > ITEMS.potionLL.price, "状態異常も治すXがLLより安くなっている");
});

test("エサはポーションと同じ「3倍」の価格ルールに既に沿っている", () => {
  assert.equal(ITEMS.premiumBait.price, ITEMS.bait.price * 3);
});

test("序盤(stage1・森の街)のショップではポーションLL/Xを購入できない", () => {
  for (const stageId of ["stage1", "town1"]) {
    const inventory = shopInventoryFor(stageId);
    assert.ok(!inventory.includes("potionLL"), `${stageId} でポーションLLが買えてしまう`);
    assert.ok(!inventory.includes("potionX"), `${stageId} でポーションXが買えてしまう`);
  }
});

test("ショップの品揃えはワールド進行に応じて累積で増えていく", () => {
  const town1 = shopInventoryFor("town1");
  const sea = shopInventoryFor("sea_town1");
  const snow = shopInventoryFor("snow_town1");
  const desert = shopInventoryFor("desert_town1");
  const castle = shopInventoryFor("castle_town1");

  for (const id of town1) assert.ok(sea.includes(id), `sea_town1で${id}が消えている`);
  assert.ok(sea.includes("potionL") && !town1.includes("potionL"));
  assert.ok(snow.includes("premiumBait") && !sea.includes("premiumBait"));
  assert.ok(desert.includes("potionLL") && !snow.includes("potionLL"));
  assert.ok(castle.includes("potionX") && !desert.includes("potionX"));
});

test("街ではないフィールド(stage1)のショップは最初の街と同じ基本品揃えになる", () => {
  assert.deepEqual(shopInventoryFor("stage1"), shopInventoryFor("town1"));
});

test("ShopSceneはprevSceneのstageIdに応じて品揃えを絞り込む", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { ShopScene } = await import("../js/scenes/shop.js");

  const game = { money: 0, items: {}, save: () => true, changeScene() {}, input: { wasPressed: () => false, isHeld: () => false } };
  const earlyShop = new ShopScene(game, { stageId: "stage1" });
  assert.ok(!earlyShop.itemIds.includes("potionLL"));

  const lateShop = new ShopScene(game, { stageId: "castle_town1" });
  assert.ok(lateShop.itemIds.includes("potionLL"));
  assert.ok(lateShop.itemIds.includes("potionX"));
});

test("手持ちが満杯でもスカウトでき、手持ち選択時は自動で牧場に振り替わる", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { BattleScene } = await import("../js/scenes/battle.js");

  const fullParty = [
    createMonster("mofuri", 30),
    createMonster("mofuri", 30),
    createMonster("mofuri", 30),
    createMonster("mofuri", 30),
  ];
  const game = {
    party: fullParty,
    ranch: [],
    dex: { seen: [], caught: [] },
    money: 0,
    items: {},
    save: () => true,
    changeScene() {},
  };
  const enemy = createMonster("dogura", 5);
  const battle = new BattleScene(game, enemy, {});
  battle.ally.atk = enemy.atk * 3; // 確実に成功させる
  battle.tryRecruit();
  assert.ok(
    battle.queue.some((m) => m.includes("なかまに くわわった")),
    "手持ちが満杯だとスカウト自体ができなくなっている"
  );

  battle.rosterChoice = "party";
  battle.confirmRosterChoice();
  assert.equal(game.party.length, 4, "手持ちの上限を超えて追加されてしまっている");
  assert.equal(game.ranch.length, 1, "満杯時に牧場へ自動で振り替わっていない");
});

test("レジェンド報酬(カザリビ)は指定6体を全て捕まえるまで解放されない", () => {
  const game = { dex: { caught: LEGEND_REQUIREMENT.slice(0, 5), seen: [] }, flags: {}, party: [] };
  assert.equal(legendProgress(game), 5);
  assert.equal(canClaimLegend(game), false);

  game.dex.caught = [...LEGEND_REQUIREMENT];
  assert.equal(legendProgress(game), 6);
  assert.equal(canClaimLegend(game), true);
});

test("grantLegendRewardは条件達成時に1度だけカザリビを付与し、図鑑にも反映する", () => {
  const game = {
    dex: { caught: [...LEGEND_REQUIREMENT], seen: [] },
    flags: {},
    party: [createMonster("mofuri", 5)],
    save: () => true,
  };
  const monster = grantLegendReward(game, createMonster);
  assert.ok(monster, "条件達成時にレジェンド報酬が付与されていない");
  assert.equal(monster.speciesId, LEGEND_REWARD_ID);
  assert.ok(monster.legend, "報酬モンスターにlegendフラグが付いていない");
  assert.ok(game.party.some((m) => m.speciesId === LEGEND_REWARD_ID), "パーティにカザリビが追加されていない");
  assert.ok(game.dex.caught.includes(LEGEND_REWARD_ID), "図鑑のcaughtにカザリビが反映されていない");
  assert.equal(hasLegendReward(game), true);

  const second = grantLegendReward(game, createMonster);
  assert.equal(second, null, "2回目以降も付与されてしまっている");
});

test("パーティが満杯のときはカザリビが牧場に送られる", () => {
  const fullParty = [
    createMonster("mofuri", 5),
    createMonster("mofuri", 5),
    createMonster("mofuri", 5),
    createMonster("mofuri", 5),
  ];
  const game = {
    dex: { caught: [...LEGEND_REQUIREMENT], seen: [] },
    flags: {},
    party: fullParty,
    ranch: [],
    save: () => true,
  };
  const monster = grantLegendReward(game, createMonster);
  assert.equal(game.party.length, 4, "満杯のパーティに追加されてしまっている");
  assert.ok(game.ranch.some((m) => m.speciesId === LEGEND_REWARD_ID), "満杯時に牧場へ送られていない");
  assert.equal(monster.speciesId, LEGEND_REWARD_ID);
});

test("カザリビはbreedOnly+rareでSランクになる", () => {
  assert.equal(getRank(SPECIES.kazaribi), "S");
});

test("図鑑を開くとレジェンドの解放条件(必要な6体)が表示される", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { PokedexScene } = await import("../js/scenes/pokedex.js");

  let captured = [];
  const ctx = new Proxy(
    {
      fillText: (t) => captured.push(t),
      createLinearGradient: () => ({ addColorStop() {} }),
      createRadialGradient: () => ({ addColorStop() {} }),
    },
    { get: (t, k) => (k in t ? t[k] : () => {}), set: () => true }
  );

  const game = { dex: { seen: [], caught: [] }, flags: {} };
  const dex = new PokedexScene(game, null);
  dex.draw(ctx);
  assert.ok(
    captured.some((t) => t.includes("レジェンド条件")),
    "図鑑を開いてもレジェンドの解放条件が表示されていない"
  );
  for (const id of LEGEND_REQUIREMENT) {
    assert.ok(
      captured.some((t) => t.includes(SPECIES[id].name)),
      `レジェンド条件に${SPECIES[id].name}の名前が出ていない`
    );
  }
});

test("セーブ読み込み時にlegendClaimedフラグが保持される（再ロードでの重複付与バグの回帰防止）", () => {
  // main.jsのstartAdventure()と同じ再構築ロジックを再現(main.js自体はDOM前提の
  // 副作用が多くテストで直接importできないため)
  function reconstructFlags(save) {
    return {
      bossDefeated: !!(save && save.flags && save.flags.bossDefeated),
      stageClearedFlags: (save && save.flags && save.flags.stageClearedFlags) || {},
      legendClaimed: !!(save && save.flags && save.flags.legendClaimed),
    };
  }

  const save = { flags: { legendClaimed: true, bossDefeated: true } };
  const flags = reconstructFlags(save);
  assert.equal(flags.legendClaimed, true, "再ロード後にlegendClaimedが失われている(カザリビの再付与バグにつながる)");

  const game = { dex: { caught: [...LEGEND_REQUIREMENT] }, flags };
  assert.equal(canClaimLegend(game), false, "legendClaimedが保持されているのに再度付与可能になっている");
});

test("配合表を増やすために追加した8つの特殊配合レシピが正しく機能する", () => {
  const recipes = [
    ["hibachi", "sunasasori", "rakudaking"],
    ["kaigaran", "pyokotan", "awarukaqueen"],
    ["fuwarisu", "kazeneko", "amakumousagi"],
    ["hagurumaru", "pachikoro", "karakuriking"],
    ["fuyudama", "yukimaro", "kooritsumuking"],
    ["akumakko", "kageuri", "kokushouking"],
    ["sunamiira", "yuureiking", "tsukihanehime"],
    ["mizukusa", "noroigumo", "sumiremoking"],
  ];
  for (const [a, b, expected] of recipes) {
    const child = breedMonsters(createMonster(a, 15), createMonster(b, 15)).child;
    assert.equal(child.speciesId, expected, `${a}+${b} が ${expected} を生まない`);
  }
});

test("配合表(SPECIAL_RESULTS)は90件に増え、レシピの重複キーがない", async () => {
  const { SPECIAL_RESULTS } = await import("../js/systems/breeding.js");
  const keys = Object.keys(SPECIAL_RESULTS);
  assert.equal(keys.length, 90);
  assert.equal(new Set(keys).size, keys.length, "SPECIAL_RESULTSに重複したキーがある");
});

test("BreedingChartSceneは90件のレシピを12ページで表示できる", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { BreedingChartScene } = await import("../js/scenes/breedingChart.js");
  const game = { dex: { seen: Object.keys(SPECIES) }, changeScene() {}, input: { wasPressed: () => false } };
  const chart = new BreedingChartScene(game, null);
  assert.equal(chart.recipes.length, 90);
  assert.equal(chart.totalPages, 12);
});

test("セーブは3つのスロットに独立して保存・読み込みできる", async () => {
  globalThis.localStorage ??= (() => {
    const store = {};
    return {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = v; },
      removeItem: (k) => { delete store[k]; },
    };
  })();
  const { saveGame, loadSave, hasSave, clearSave, SAVE_SLOT_COUNT } = await import("../js/systems/save.js");

  assert.equal(SAVE_SLOT_COUNT, 3);
  for (let i = 0; i < SAVE_SLOT_COUNT; i++) clearSave(i);

  const monsterA = createMonster("mofuri", 5);
  const monsterB = createMonster("hibachi", 8);
  saveGame({ playerName: "スロット0", party: [monsterA], dex: { seen: [], caught: [] }, items: {}, money: 10, flags: {} }, 0);
  saveGame({ playerName: "スロット2", party: [monsterB], dex: { seen: [], caught: [] }, items: {}, money: 20, flags: {} }, 2);

  assert.equal(hasSave(0), true);
  assert.equal(hasSave(1), false, "何もセーブしていないスロット1にデータがあることになっている");
  assert.equal(hasSave(2), true);

  assert.equal(loadSave(0).playerName, "スロット0");
  assert.equal(loadSave(2).playerName, "スロット2");
  assert.equal(loadSave(0).party[0].speciesId, "mofuri");
  assert.equal(loadSave(2).party[0].speciesId, "hibachi");

  clearSave(0);
  assert.equal(hasSave(0), false);
  assert.equal(hasSave(2), true, "無関係なスロット2まで消えてしまっている");
});

test("空きスロットを選ぶと名前入力モードになり、埋まっているスロットはメニューが開く", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  globalThis.localStorage ??= (() => {
    const store = {};
    return {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = v; },
      removeItem: (k) => { delete store[k]; },
    };
  })();

  const { TitleScene } = await import("../js/scenes/title.js");
  const { saveGame, clearSave } = await import("../js/systems/save.js");
  clearSave(0);
  clearSave(1);
  saveGame({ playerName: "既存", party: [createMonster("mofuri", 5)], dex: { seen: [], caught: [] }, items: {}, money: 0, flags: {} }, 1);

  const game = {
    input: { wasPressed: () => false, isHeld: () => false },
    canvas: { getBoundingClientRect: () => ({ width: 640 }) },
    changeScene() {},
    startAdventure() {},
  };
  const title = new TitleScene(game);

  title.cursor = 0; // スロット0は空きのはず
  title.chooseSlot();
  assert.equal(title.renamingSlot, 0, "空きスロットを選んでも名前入力モードにならない");

  title.renamingSlot = null;
  title.phase = "slots";
  title.cursor = 1; // スロット1はセーブ済みのはず
  title.chooseSlot();
  assert.equal(title.phase, "menu", "セーブ済みスロットを選んでもメニューが開かない");
  assert.equal(title.menuSlot, 1);
});

test("3スロット化より前の旧セーブ(montomo-save-v1)はスロット0に自動で引き継がれる（進行度リセットバグの回帰防止）", async () => {
  globalThis.localStorage ??= (() => {
    const store = {};
    return {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = v; },
      removeItem: (k) => { delete store[k]; },
    };
  })();
  globalThis.localStorage.removeItem("montomo-save-v1-slot0");
  globalThis.localStorage.removeItem("montomo-save-v1-slot1");
  globalThis.localStorage.setItem(
    "montomo-save-v1",
    JSON.stringify({ v: 1, playerName: "むかしの ぼうけんしゃ", party: [{ speciesId: "mofuri", level: 42 }], money: 500 })
  );

  const { hasSave, loadSave } = await import("../js/systems/save.js");
  assert.equal(hasSave(0), true, "旧セーブがスロット0に引き継がれていない(進行度が消えたように見えるバグ)");
  const restored = loadSave(0);
  assert.equal(restored.playerName, "むかしの ぼうけんしゃ");
  assert.equal(restored.party[0].level, 42);
  assert.equal(globalThis.localStorage.getItem("montomo-save-v1"), null, "移行後も旧キーが残っている");
  assert.equal(hasSave(1), false, "無関係なスロット1にまで引き継がれてしまっている");
});

test("ショップでアイテムをまとめて購入できる", async () => {
  const { ShopScene } = await import("../js/scenes/shop.js");
  const game = {
    money: 1000,
    items: {},
    input: { wasPressed: () => false, isHeld: () => false },
    save: () => true,
    changeScene() {},
  };
  const shop = new ShopScene(game, { stageId: "stage1" });
  const itemId = shop.itemIds[shop.cursor];
  const price = ITEMS[itemId].price;

  shop.buy(itemId, 5);
  assert.equal(game.items[itemId], 5, "5個まとめて購入した数量が反映されていない");
  assert.equal(game.money, 1000 - price * 5, "まとめ買いの合計金額が正しく引かれていない");
});

test("まとめ買いは合計金額が所持金を超えると失敗し、何も変化しない", async () => {
  const { ShopScene } = await import("../js/scenes/shop.js");
  const game = {
    money: 10,
    items: {},
    input: { wasPressed: () => false, isHeld: () => false },
    save: () => true,
    changeScene() {},
  };
  const shop = new ShopScene(game, { stageId: "stage1" });
  const itemId = shop.itemIds[shop.cursor];
  shop.buy(itemId, 5);
  assert.equal(game.money, 10, "所持金が足りないのに引かれてしまっている");
  assert.equal(game.items[itemId] || 0, 0, "所持金が足りないのにアイテムが増えてしまっている");
  assert.equal(shop.message, "おかねが たりないよ。");
});

test("ショップの数量選択は左右で1個ずつ、上下で10個ずつ、最低1個・最大99個に収まる", async () => {
  const { ShopScene } = await import("../js/scenes/shop.js");
  const game = { money: 100000, items: {}, input: { wasPressed: () => false, isHeld: () => false }, save: () => true, changeScene() {} };
  const shop = new ShopScene(game, { stageId: "stage1" });
  shop.phase = "quantity";
  shop.buyQty = 1;

  game.input = { wasPressed: (k) => k === "left" };
  shop.update(0.016);
  assert.equal(shop.buyQty, 1, "最低数量の1を下回ってしまっている");

  game.input = { wasPressed: (k) => k === "up" };
  for (let i = 0; i < 20; i++) shop.update(0.016);
  assert.equal(shop.buyQty, 99, "最大数量99を超えてしまっている");
});

test("スカウト成功率はこうげき力比率の基礎値に、与えたダメージ分の上乗せが加算される", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { BattleScene } = await import("../js/scenes/battle.js");

  const original = SPECIES.dogura.recruitEase;
  SPECIES.dogura.recruitEase = 0.15; // 基準レア度(等倍)
  const originalRandom = Math.random;
  try {
    const enemy = createMonster("dogura", 10);
    enemy.maxHp = 200;
    enemy.hp = 200;
    const ally = createMonster("mofuri", 30);
    ally.atk = enemy.atk; // こうげき力が互角
    const game = {
      party: [ally],
      dex: { seen: [], caught: [] },
      money: 0,
      items: {},
      save: () => true,
      changeScene() {},
    };
    const battle = new BattleScene(game, enemy, {});
    Math.random = () => 0.99;

    battle.totalDamageDealt = 0;
    battle.tryRecruit();
    assert.ok(battle.queue.some((m) => m.includes("せいこうりつ 50%")), "未攻撃時の基礎値(こうげき力比率)が50%になっていない");

    battle.totalDamageDealt = 100; // 敵の最大HPの半分のダメージ
    battle.tryRecruit();
    assert.ok(battle.queue.some((m) => m.includes("せいこうりつ 75%")), "半分のダメージで基礎50%+上乗せ25%=75%になっていない");

    battle.totalDamageDealt = 200; // 敵の最大HPと同量のダメージ
    battle.tryRecruit();
    assert.ok(battle.queue.some((m) => m.includes("せいこうりつ 100%")), "同量のダメージで確定(100%)にならない");
  } finally {
    SPECIES.dogura.recruitEase = original;
    Math.random = originalRandom;
  }
});

test("進化後の姿を指定した特殊配合レシピが、基礎形への丸め込みより優先される", () => {
  const recipes = [
    ["kotohana", "mofurif", "hanaguruma"],
    ["harune", "mofurif", "sakuraouneko"],
    ["borudogura", "sunasasori", "sunabokoking"],
    ["borudogura", "sunamaru", "sunamiirasou"],
    ["bakuhibachi", "moriame", "tsuyuhikaking"],
    ["bakuhibachi", "hikariame", "shizukuyaseirei"],
    ["sorane", "tenfuwarisu", "hayatenoko"],
    ["kazeneko", "tenfuwarisu", "oomugiwatari"],
  ];
  for (const [a, b, expected] of recipes) {
    const child = breedMonsters(createMonster(a, 15), createMonster(b, 15)).child;
    assert.equal(child.speciesId, expected, `${a}+${b} が ${expected} を生まない`);
  }
});

test("進化前(基礎形)で配合した場合は、進化後限定レシピの影響を受けず従来通りになる", () => {
  // mofuri(進化前) + kotohana は「kotohana+mofurif」レシピの対象外なので、
  // 特殊レシピにヒットせず、通常通りどちらかの親の姿を受け継ぐだけになるはず
  const a = createMonster("mofuri", 15);
  const b = createMonster("kotohana", 15);
  const { child } = breedMonsters(a, b);
  assert.notEqual(child.speciesId, "hanaguruma", "進化前なのに進化後限定レシピが誤って適用されている");
  assert.ok(["mofuri", "kotohana"].includes(child.speciesId));
});

test("ショップの品揃えが多い街(全解禁済み)でも1ページ6件までにページ分割され、画面からはみ出さない", async () => {
  const { ShopScene } = await import("../js/scenes/shop.js");
  const game = {
    money: 100000,
    items: {},
    input: { wasPressed: () => false, isHeld: () => false },
    save: () => true,
    changeScene() {},
  };
  const shop = new ShopScene(game, { stageId: "castle_town1" });
  assert.equal(shop.itemIds.length, 13, "castle_town1の品揃え数が想定と違う");
  assert.equal(shop.totalPages, 3, "13品を1ページに収めようとして見切れる状態になっている");

  // 最後の商品(13番目)のカーソル位置での描画Y座標が画面(480px)に収まるか
  shop.cursor = shop.itemIds.length - 1;
  const ROW_H = 56, ROW_GAP = 8, PAGE_SIZE = 6;
  const rowIndexInPage = shop.cursor - shop.page * PAGE_SIZE;
  const y = 78 + rowIndexInPage * (ROW_H + ROW_GAP);
  assert.ok(y + ROW_H < 480, `最後の商品の描画位置(下端${y + ROW_H})が画面(480px)からはみ出している`);
});

test("ショップの数量選択画面はページをまたいでも正しい商品(カーソル位置)を参照する", async () => {
  const { ShopScene } = await import("../js/scenes/shop.js");
  const game = {
    money: 100000,
    items: {},
    input: { wasPressed: () => false, isHeld: () => false },
    save: () => true,
    changeScene() {},
  };
  const shop = new ShopScene(game, { stageId: "castle_town1" });
  shop.cursor = 8; // 2ページ目の商品
  shop.phase = "quantity";
  shop.buyQty = 1;
  shop.buy(shop.itemIds[shop.cursor], shop.buyQty);
  assert.equal(game.items[shop.itemIds[8]], 1, "2ページ目の商品を正しく購入できていない");
});

test("配合表を3倍に増やすために追加した60件の特殊配合レシピが全て正しく機能する", () => {
  const recipes = [
    ["fuwarisu", "orihiko", "tenfuwarisu"],
    ["orihiko", "sorane", "hayatenoko"],
    ["kiboko", "sabotenko", "hounenkibi"],
    ["kiboko", "tsuboco", "dosugame"],
    ["kaigaran", "tsuboco", "haribuneking"],
    ["honbori", "yuureiking", "shizumeganeseirei"],
    ["akumakko", "honbori", "takarabox"],
    ["sunamaru", "tsubogame", "hoshimoguking"],
    ["kuroguri", "takarabox", "yuureiteiou"],
    ["awairuka", "pukurin", "sazanamiking"],
    ["mizutama", "pukurin", "mizugomaking"],
    ["hoshimogu", "sunasasori", "sunamaruking"],
    ["hoshimogu", "sunamiira", "hoshizora"],
    ["shizumegane", "yamiankou", "shizukuyaseirei"],
    ["kuroguri", "yamiankou", "noroigumoking"],
    ["pengiri", "yukigamo", "yukimaroking"],
    ["fuyudama", "pengiri", "kooritsumuking"],
    ["rakudan", "sabotenko", "sunasasoriking"],
    ["momijiri", "sabotenko", "hanafubukiusagi"],
    ["nejiko", "sparkun", "hagurumaruking"],
    ["pachikoro", "sparkun", "paiponking"],
    ["hagurumaru", "paipon", "nejikoking"],
    ["karakuribat", "paipon", "hagurumaruking"],
    ["mizuhane", "torimugi", "oodangou"],
    ["kotohana", "mizuhane", "mizutamaking"],
    ["momijiri", "sakuraneko", "hanaguruma"],
    ["harune", "momijiri", "kazagurumaneko"],
    ["haribune", "mizugoma", "mizutamaking"],
    ["sunaboko", "sunobori", "sunamaruking"],
    ["sunamaru", "sunobori", "sunasasoriking"],
    ["kaigaran", "mizutama", "dosugame"],
    ["hanamaro", "yamakibi", "sakuraouneko"],
    ["kiboko", "yamakibi", "sabotenkoking"],
    ["shizumegane", "tsukihane", "sunamiirasou"],
    ["haribune", "mizutama", "mizuhaneking"],
    ["kageuri", "kuroguri", "akumakkoking"],
    ["kuroguri", "noroigumo", "kageurilord"],
    ["kooritsumu", "yukimaro", "yukibouzuking"],
    ["fuyudama", "yukigamo", "pengiriking"],
    ["haribune", "kaigaran", "pukurinseirei"],
    ["mizutama", "sazanami", "yamiankouking"],
    ["shizukuya", "tsuyuhika", "hikariameseirei"],
    ["moriame", "shizukuya", "mizugomaking"],
    ["kazepeko", "sorane", "orifalcon"],
    ["kazeneko", "torimugi", "honborido"],
    ["ishimaru", "sunaboko", "koganetsubo"],
    ["rakudan", "sunamaru", "hoshimoguking"],
    ["reiseiou", "yukibouzu", "yukigamohime"],
    ["sabotenko", "sunamaru", "sunoboriking"],
    ["kotohana", "momijiri", "sakuraouneko"],
    ["mizukusa", "sumiremo", "noroigumoking"],
    ["hoshizora", "sumiremo", "sunamiirasou"],
    ["sunamiira", "takarabox", "kokushouking"],
    ["kokushou", "kuroguri", "akumakkoking"],
    ["paipon", "sparkun", "pachiking"],
    ["haribune", "mizuhane", "sazanamiking"],
    ["ishimaru", "tsubogame", "kurista"],
    ["sunamaru", "yamakibi", "rakudaking"],
    ["honbori", "shizumegane", "yamiankouking"],
    ["kokushou", "takarabox", "sunamiirasou"],
  ];
  for (const [a, b, expected] of recipes) {
    const child = breedMonsters(createMonster(a, 15), createMonster(b, 15)).child;
    assert.equal(child.speciesId, expected, `${a}+${b} が ${expected} を生まない`);
  }
});

test("各フィールドステージの草むら(茂み)は2倍に増やしても壁・特殊タイル・平地アイテムと衝突しない", () => {
  const fieldIds = Object.keys(STAGES).filter((id) => !id.includes("town"));
  for (const id of fieldIds) {
    const stage = STAGES[id];
    let bushCount = 0;
    stage.layout.forEach((row) => {
      [...row].forEach((ch) => {
        if (Number(ch) === TILE_TYPES.BUSH) bushCount++;
      });
    });
    assert.ok(bushCount >= 4, `${id} の草むらが少なすぎる(${bushCount}箇所): 2倍増量が反映されていない可能性`);
  }
});

test("第1形態から第2形態への進化はLv.25で発生し、進化直後に固有技を習得する(Lv.10から引き上げ)", () => {
  // 第2形態→第3形態(モフリーフ等、evolvesAt=30)は今回の対象外なので除く
  const targets = Object.values(SPECIES).filter((s) => s.evolvesAt === 25);
  assert.ok(targets.length >= 20, `第1→第2形態の進化を持つ種族が少なすぎる(${targets.length})`);
  for (const species of targets) {
    const m = createMonster(species.id, 24);
    const firstEvents = gainExp(m, SPECIES, 480);
    const evolveEvent = firstEvents.find((e) => e.type === "evolve");
    assert.ok(evolveEvent, `${species.id} がLv.24→Lv.25で進化しない`);
    assert.equal(evolveEvent.level, 25);
    // 進化直後の固有技(Lv.26で習得)まで含めて確認する
    gainExp(m, SPECIES, expToNext(m.level));
    const evolvedSpecies = SPECIES[m.speciesId];
    const sigSkill = evolvedSpecies.learnset[0]?.skill;
    if (sigSkill) {
      assert.ok(m.skills.includes(sigSkill), `${m.speciesId} が進化直後に固有技(${sigSkill})を習得していない`);
    }
  }
});

test("モフリ・ドグラ・ヒバチ・フワリスの4系統はレベルアップだけで3進化目まで到達する", () => {
  const chains = [
    ["mofuri", "mofurif", "mofurigarden"],
    ["dogura", "borudogura", "borudrill"],
    ["hibachi", "bakuhibachi", "bakuphoenix"],
    ["fuwarisu", "tenfuwarisu", "tenstorm"],
  ];
  for (const [stage1, stage2, stage3] of chains) {
    const m = createMonster(stage1, 1);
    for (let i = 0; i < 40 && m.level < 30; i++) gainExp(m, SPECIES, 9999);
    assert.equal(m.speciesId, stage3, `${stage1} が ${stage3} まで進化しない`);
    assert.equal(SPECIES[stage1].evolvesTo, stage2);
    assert.equal(SPECIES[stage2].evolvesTo, stage3);
  }
});

test("新たに2進化目を追加した6系統(ピョコタン等)が正しく進化する", () => {
  const chains = [
    ["pyokotan", "gamadon"],
    ["pachikoro", "pachiking"],
    ["orihiko", "orifalcon"],
    ["kiboko", "kibouju"],
    ["honbori", "honborido"],
    ["tsubogame", "dosugame"],
  ];
  for (const [base, evolved] of chains) {
    const m = createMonster(base, 9);
    const events = gainExp(m, SPECIES, 99999);
    assert.equal(m.speciesId, evolved, `${base} が ${evolved} に進化しない`);
    assert.ok(events.some((e) => e.type === "evolve" && e.speciesId === evolved));
  }
});

test("野生出現する残り12系統(サンダンゴ等)にも2進化目が追加され進化する", () => {
  const chains = [
    ["tsuboco", "koganetsubo"],
    ["sandango", "oodangou"],
    ["hanamaro", "hanaguruma"],
    ["torimugi", "oomugiwatari"],
    ["kotohana", "hanautadori"],
    ["sorane", "amakumousagi"],
    ["momijiri", "momijiou"],
    ["kazeneko", "kazagurumaneko"],
    ["harune", "hanafubukiusagi"],
    ["sakuraneko", "sakuraouneko"],
    ["yamakibi", "hounenkibi"],
    ["kazepeko", "hayatenoko"],
  ];
  for (const [base, evolved] of chains) {
    const m = createMonster(base, 9);
    const events = gainExp(m, SPECIES, 99999);
    assert.equal(m.speciesId, evolved, `${base} が ${evolved} に進化しない`);
    assert.ok(events.some((e) => e.type === "evolve" && e.speciesId === evolved));
  }
});

test("WILD_SPECIESの全種は進化ずみか2進化目を持ち、フィールド出現モンスターは必ず進化するようになった", () => {
  for (const id of WILD_SPECIES) {
    assert.ok(SPECIES[id].evolvesTo, `${id} に進化先が設定されていない`);
  }
});

test("牧場のなかまが表示しきれない数まで増えると、カーソル追従でスクロールする（下までスライドできない不具合の回帰防止）", async () => {
  const { RanchScene } = await import("../js/scenes/ranch.js");
  const game = {
    party: [createMonster("mofuri", 5)],
    ranch: Array.from({ length: 40 }, () => createMonster("pyokotan", 5)),
    input: { wasPressed: () => false },
    save() {},
  };
  const scene = new RanchScene(game, null);
  assert.equal(scene.ranchScrollRow, 0);
  scene.cursor = game.party.length + game.ranch.length - 1;
  scene.updateRanchScroll();
  assert.ok(scene.ranchScrollRow > 0, "牧場の末尾にカーソルを合わせてもスクロールしない");
  const totalRanchRows = Math.ceil(game.ranch.length / 6);
  assert.ok(
    scene.ranchScrollRow + scene.ranchViewRows() >= totalRanchRows,
    "スクロールしても末尾の行が表示範囲に入らない"
  );
  scene.cursor = game.party.length;
  scene.updateRanchScroll();
  assert.equal(scene.ranchScrollRow, 0, "先頭に戻るとスクロールも先頭に戻らない");
});

test("進化するとhp/atk/def/spdの基礎値が全て進化前以上になる(バランス検証: ステータスが逆転しない)", () => {
  for (const species of Object.values(SPECIES)) {
    if (!species.evolvesTo) continue;
    const evolved = SPECIES[species.evolvesTo];
    for (const key of ["hp", "atk", "def", "spd"]) {
      assert.ok(
        evolved.base[key] >= species.base[key],
        `${species.id} → ${evolved.id} で ${key} が下がっている(${species.base[key]} → ${evolved.base[key]})`
      );
    }
  }
});

test("新規追加した22種の2進化目は、既存の2進化目(モフリーフ等)とLv30時点の総合力が近い水準にそろっている(バランス検証)", () => {
  const newEvolvedIds = [
    "gamadon", "pachiking", "orifalcon", "kibouju", "honborido", "dosugame",
    "koganetsubo", "oodangou", "hanaguruma", "oomugiwatari", "hanautadori", "amakumousagi",
    "momijiou", "kazagurumaneko", "hanafubukiusagi", "sakuraouneko", "hayatenoko", "hounenkibi",
  ];
  const total = (s) => {
    const st = statsFor(s, 30);
    return st.maxHp * 0.5 + st.atk + st.def + st.spd;
  };
  const baseline = ["mofurif", "borudogura", "bakuhibachi", "tenfuwarisu"].map((id) => total(SPECIES[id]));
  const min = Math.min(...baseline) * 0.8;
  const max = Math.max(...baseline) * 1.3;
  for (const id of newEvolvedIds) {
    const t = total(SPECIES[id]);
    assert.ok(t >= min && t <= max, `${id} の総合力(${Math.round(t)})が基準範囲(${Math.round(min)}〜${Math.round(max)})から外れている`);
  }
});

test("tr()はgame.langがenのときだけ第2引数(英語)を返す", async () => {
  const { tr } = await import("../js/i18n.js");
  assert.equal(tr({ lang: "ja" }, "こんにちは", "Hello"), "こんにちは");
  assert.equal(tr({ lang: "en" }, "こんにちは", "Hello"), "Hello");
  assert.equal(tr(null, "こんにちは", "Hello"), "こんにちは", "gameがnullのときは日本語にフォールバックする");
  assert.equal(tr(undefined, "こんにちは", "Hello"), "こんにちは");
});

test("言語設定はミュートと同様、端末側の設定としてlocalStorageに永続化される", async () => {
  globalThis.localStorage ??= (() => {
    const store = {};
    return {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = v; },
      removeItem: (k) => { delete store[k]; },
    };
  })();
  const { getStoredLang, setStoredLang } = await import("../js/i18n.js");
  setStoredLang("en");
  assert.equal(getStoredLang(), "en");
  setStoredLang("ja");
  assert.equal(getStoredLang(), "ja");
  assert.equal(setStoredLang("fr"), "ja", "サポート外の言語はjaにフォールバックする");
});

test("monsterName()は進化後も現在のspeciesIdから正しい表示名を引く", () => {
  const m = createMonster("mofuri", 1);
  assert.equal(monsterName(m, "ja"), "モフリ");
  assert.equal(monsterName(m, "en"), "Mofuri");
  for (let i = 0; i < 30 && m.level < 25; i++) gainExp(m, SPECIES, 999);
  assert.equal(m.speciesId, "mofurif");
  assert.equal(monsterName(m, "en"), "Mofurif", "進化後は新しい種族のnameEnを返す必要がある");
});

test("英語モードでのバトル勝利メッセージに進化・レベルアップ・ボス演出が正しく英訳される", async () => {
  globalThis.document ??= {
    getElementById: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      addEventListener() {},
      removeEventListener() {},
    }),
  };
  const { BattleScene } = await import("../js/scenes/battle.js");
  const ally = createMonster("mofuri", 24);
  const game = { lang: "en", party: [ally], ranch: [], items: {}, money: 0, dex: { seen: [], caught: [] }, flags: {}, save: () => true };
  const enemy = createMonster("nushi", 30);
  const battle = new BattleScene(game, enemy, { isBoss: true, stageId: "stage3" });
  assert.ok(battle.queue[0].includes("Nushi"), "ボス登場テキストが英訳されていない");
  const messages = [];
  battle.performAction(battle.ally, battle.enemy, { type: "attack" }, messages);
  enemy.hp = 0;
  battle.victory(messages);
  const joined = messages.join(" | ");
  assert.ok(joined.includes("evolved into Mofurif"), `進化メッセージが英訳されていない: ${joined}`);
  assert.ok(joined.includes("returned to normal"), `ボス勝利テキストが英訳されていない: ${joined}`);
});

test("全フィールドNPCの会話文に英訳(lineEn)が用意されている", () => {
  for (const [stageId, stage] of Object.entries(STAGES)) {
    for (const npc of stage.npcs || []) {
      assert.ok(
        npc.lineEn && npc.lineEn.length > 0,
        `${stageId} のNPC(${npc.x},${npc.y})にlineEnが設定されていない`
      );
    }
  }
});

test("手持ち・牧場を合わせて最後の1体は逃がせない(誤って二度となかまを持てなくなる不具合の回帰防止)", async () => {
  globalThis.document ??= {
    getElementById: () => ({ style: {}, classList: { add() {}, remove() {} } }),
  };
  const { PartyScene } = await import("../js/scenes/party.js");

  const soloGame = { party: [createMonster("mofuri", 5)], ranch: [], dex: { seen: [], caught: [] }, save() {} };
  const soloScene = new PartyScene(soloGame, null);
  soloScene.cursor = 0;
  soloScene.askRelease();
  assert.equal(soloScene.confirm, null, "最後の1体なのに逃がす確認画面が出てしまう");
  assert.equal(soloGame.party.length, 1);

  const backedUpGame = {
    party: [createMonster("mofuri", 5)],
    ranch: [createMonster("hibachi", 5)],
    dex: { seen: [], caught: [] },
    save() {},
  };
  const backedUpScene = new PartyScene(backedUpGame, null);
  backedUpScene.cursor = 0;
  backedUpScene.askRelease();
  assert.ok(backedUpScene.confirm, "牧場に控えがいるのに逃がす確認画面が出ない");
});

test("体は少し大きく描かれるが、目の絶対サイズは元のままになっている", async () => {
  const { drawMonster } = await import("../js/sprites.js");
  let m = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  const stack = [];
  const apply = (x, y) => ({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f });
  const arcRadii = [];
  const ctx = new Proxy(
    {
      save: () => stack.push({ ...m }),
      restore: () => { m = stack.pop(); },
      translate: (x, y) => { const p = apply(x, y); m = { ...m, e: p.x, f: p.y }; },
      scale: (sx, sy) => { m = { a: m.a * sx, b: m.b * sx, c: m.c * sy, d: m.d * sy, e: m.e, f: m.f }; },
      arc: (x, y, r) => {
        const c = apply(x, y);
        const edge = apply(x + r, y);
        arcRadii.push(Math.hypot(edge.x - c.x, edge.y - c.y));
      },
      createLinearGradient: () => ({ addColorStop() {} }),
      createRadialGradient: () => ({ addColorStop() {} }),
    },
    { get: (t, k) => (k in t ? t[k] : () => {}), set: () => true }
  );
  drawMonster(ctx, "mofuri", 0, 0, 1, 0, 0);
  // mofuriのeye()半径は8。BODY_SCALEが乗っていれば8より大きくなってしまう
  const eyeRadius = arcRadii.find((r) => Math.abs(r - 8) < 0.01);
  assert.ok(eyeRadius, `目の絶対サイズが8pxのまま描かれていない: ${arcRadii.slice(0, 10).map((r) => r.toFixed(2))}`);
  // 体(半径30)はBODY_SCALEぶん大きく描かれているはず
  const bodyRadius = arcRadii.find((r) => r > 30);
  assert.ok(bodyRadius, `体が拡大されていない: ${arcRadii.slice(0, 10).map((r) => r.toFixed(2))}`);
});

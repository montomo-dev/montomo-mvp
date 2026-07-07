import { typeOf } from "../data/types.js";
import { tr } from "../i18n.js";
import { monsterName } from "../data/monsters.js";

export const STATUS_LABEL = {
  burn: "やけど",
  paralysis: "まひ",
  freeze: "こおり",
};

export const STATUS_LABEL_EN = {
  burn: "Burn",
  paralysis: "Paralysis",
  freeze: "Frozen",
};

const INFLICT_CHANCE = { ほのお: 0.2, でんき: 0.2, こおり: 0.15 };
const STATUS_BY_TYPE = { ほのお: "burn", でんき: "paralysis", こおり: "freeze" };

// 攻撃タイプに応じて状態異常を付与するか判定する。既に状態異常がある対象や、
// 対応タイプを持たない対象(やけど無効の ほのお 等)には付与しない
export function maybeInflictStatus(attackType, target, messages, game = null) {
  const statusType = STATUS_BY_TYPE[attackType];
  if (!statusType || target.status || target.hp <= 0) return;
  if (typeOf(target.speciesId) === attackType) return;
  if (Math.random() >= INFLICT_CHANCE[attackType]) return;
  target.status = statusType;
  const name = monsterName(target, game?.lang);
  if (statusType === "burn") messages.push(tr(game, `${name} は やけどを おった！`, `${name} was burned!`));
  else if (statusType === "paralysis") messages.push(tr(game, `${name} は しびれて うごきにくくなった！`, `${name} became paralyzed!`));
  else if (statusType === "freeze") messages.push(tr(game, `${name} は こおって しまった！`, `${name} was frozen solid!`));
}

// ターン開始時のチェック。行動できない場合は false を返す
export function canAct(monster, messages, game = null) {
  const name = monsterName(monster, game?.lang);
  if (monster.status === "paralysis" && Math.random() < 0.25) {
    messages.push(tr(game, `${name} は からだが しびれて うごけない！`, `${name} is paralyzed and can't move!`));
    return false;
  }
  if (monster.status === "freeze") {
    if (Math.random() < 0.2) {
      monster.status = null;
      messages.push(tr(game, `${name} の こおりが とけた！`, `${name} thawed out!`));
      return true;
    }
    messages.push(tr(game, `${name} は こおって うごけない！`, `${name} is frozen and can't move!`));
    return false;
  }
  return true;
}

// ターン終了時のダメージ処理。0以下になったらfaint扱いはfinishTurn側で判定
export function applyEndOfTurnStatus(monster, messages, game = null) {
  if (!monster.status || monster.hp <= 0) return;
  if (monster.status === "burn") {
    const dmg = Math.max(1, Math.round(monster.maxHp / 16));
    monster.hp = Math.max(0, monster.hp - dmg);
    const name = monsterName(monster, game?.lang);
    messages.push(tr(game, `${name} は やけどの ダメージを うけた！`, `${name} took burn damage!`));
  }
}

export function clearStatus(monster) {
  monster.status = null;
}

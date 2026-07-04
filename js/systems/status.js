import { typeOf } from "../data/types.js";

export const STATUS_LABEL = {
  burn: "やけど",
  paralysis: "まひ",
  freeze: "こおり",
};

const INFLICT_CHANCE = { ほのお: 0.2, でんき: 0.2, こおり: 0.15 };
const STATUS_BY_TYPE = { ほのお: "burn", でんき: "paralysis", こおり: "freeze" };

// 攻撃タイプに応じて状態異常を付与するか判定する。既に状態異常がある対象や、
// 対応タイプを持たない対象(やけど無効の ほのお 等)には付与しない
export function maybeInflictStatus(attackType, target, messages) {
  const statusType = STATUS_BY_TYPE[attackType];
  if (!statusType || target.status || target.hp <= 0) return;
  if (typeOf(target.speciesId) === attackType) return;
  if (Math.random() >= INFLICT_CHANCE[attackType]) return;
  target.status = statusType;
  if (statusType === "burn") messages.push(`${target.name} は やけどを おった！`);
  else if (statusType === "paralysis") messages.push(`${target.name} は しびれて うごきにくくなった！`);
  else if (statusType === "freeze") messages.push(`${target.name} は こおって しまった！`);
}

// ターン開始時のチェック。行動できない場合は false を返す
export function canAct(monster, messages) {
  if (monster.status === "paralysis" && Math.random() < 0.25) {
    messages.push(`${monster.name} は からだが しびれて うごけない！`);
    return false;
  }
  if (monster.status === "freeze") {
    if (Math.random() < 0.2) {
      monster.status = null;
      messages.push(`${monster.name} の こおりが とけた！`);
      return true;
    }
    messages.push(`${monster.name} は こおって うごけない！`);
    return false;
  }
  return true;
}

// ターン終了時のダメージ処理。0以下になったらfaint扱いはfinishTurn側で判定
export function applyEndOfTurnStatus(monster, messages) {
  if (!monster.status || monster.hp <= 0) return;
  if (monster.status === "burn") {
    const dmg = Math.max(1, Math.round(monster.maxHp / 16));
    monster.hp = Math.max(0, monster.hp - dmg);
    messages.push(`${monster.name} は やけどの ダメージを うけた！`);
  }
}

export function clearStatus(monster) {
  monster.status = null;
}

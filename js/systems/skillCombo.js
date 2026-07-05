// 2つの特技を両方おぼえていると、自動で上位の組み合わせ技を習得する
export const SKILL_COMBOS = {
  "hinokodance+tsuraraotoshi": "reinetsubakuha",
  "biribiritouch+bubblesplash": "kandenshokku",
  "happashusshu+moguradrill": "daichinonekko",
  "soyokazecutter+suishouha": "tatsumakikessho",
  "kageuchi+tsukinooto": "ankokunouta",
  "raimeidan+tekkoudan": "denjihou",
  "andonflash+hotarubi": "yomosugaranohikari",
  "dangospin+mitarashihane": "mitarashisenpu",
};

// monster.skills に組み合わせの2技が揃っていれば、結果の技を追加する。
// 新しく習得した技のIDを返す(なければ空配列)
export function applyCombos(monster) {
  const learned = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const [key, resultSkill] of Object.entries(SKILL_COMBOS)) {
      if (monster.skills.includes(resultSkill)) continue;
      const [a, b] = key.split("+");
      if (monster.skills.includes(a) && monster.skills.includes(b)) {
        monster.skills.push(resultSkill);
        learned.push(resultSkill);
        changed = true;
      }
    }
  }
  return learned;
}

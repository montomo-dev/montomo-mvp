// 7つの世界にはそれぞれ「ヌシ」という守り神がいたが、裏の世界から染み出す
// 歪みの力に少しずつ蝕まれ、凶暴化してしまっている。プレイヤーはヌシたちを
// 鎮めながら、歪みの源(魔王)をたどっていく、というゲーム全体の簡単な筋書き。
export const BOSS_STORY = {
  nushi: {
    intro: "森の奥で、様子のおかしいモリノヌシが行く手を阻んだ！",
    victory: "モリノヌシの瞳から、暗い影が晴れていく…「森は…もとに もどった…」",
  },
  reverseNushi: {
    intro: "裏返った世界の最奥で、ウラノヌシが牙をむいた！",
    victory: "ウラノヌシの向こうに、歪みの気配が さらに強く感じられる…",
  },
  seaNushi: {
    intro: "深海の底で、シンカイヌシが荒れ狂っている！",
    victory: "シンカイヌシは静かに海の底へと帰っていった。歪みは、まだ続いている…",
  },
  hyougaNushi: {
    intro: "凍てついた氷河で、ヒョウガヌシが牙をむいた！",
    victory: "ヒョウガヌシの様子が、少しずつ落ち着きを取りもどしていく…",
  },
  sunaNushi: {
    intro: "灼熱の砂漠で、スナヌシが砂塵をまとって立ちはだかった！",
    victory: "スナヌシは静かに砂の中へと還っていった…",
  },
  koujouNushi: {
    intro: "止まらない機械音の中で、コウジョウヌシが暴走している！",
    victory: "コウジョウヌシの歯車が、正しいリズムを取りもどしていく…",
  },
  maou: {
    intro: "歪みの源、魔王が玉座から立ちあがった…！",
    victory: [
      "魔王は がっくりと ひざをついた。",
      "「わたしは…ただ、ひとりが 怖かっただけ なのかもしれない」",
      "魔王の姿が光に包まれ、世界に 静かな平穏が もどっていく。",
    ],
  },
};

export function bossIntroText(speciesId, fallbackName) {
  return BOSS_STORY[speciesId]?.intro || `もりの ${fallbackName} が たちはだかった！`;
}

// 常に配列を返す(通常は1行、魔王だけ複数行の演出)
export function bossVictoryLines(speciesId, fallbackName) {
  const victory = BOSS_STORY[speciesId]?.victory;
  if (!victory) return [`${fallbackName} を のりこえた…！`];
  return Array.isArray(victory) ? victory : [victory];
}

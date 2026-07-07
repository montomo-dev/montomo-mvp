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

export const BOSS_STORY_EN = {
  nushi: {
    intro: "Deep in the forest, a strangely troubled Nushi blocked the path!",
    victory: "A dark shadow clears from Nushi's eyes... \"The forest... has returned to normal...\"",
  },
  reverseNushi: {
    intro: "At the deepest reach of the inverted world, Reverse Nushi bared its fangs!",
    victory: "Beyond Reverse Nushi, the sense of distortion feels even stronger...",
  },
  seaNushi: {
    intro: "At the bottom of the deep sea, Sea Nushi is raging out of control!",
    victory: "Sea Nushi quietly returned to the ocean floor. The distortion still continues...",
  },
  hyougaNushi: {
    intro: "On the frozen glacier, Hyouga Nushi bared its fangs!",
    victory: "Hyouga Nushi is gradually regaining its calm...",
  },
  sunaNushi: {
    intro: "In the scorching desert, Suna Nushi rose up wrapped in swirling sand!",
    victory: "Suna Nushi quietly sank back into the sand...",
  },
  koujouNushi: {
    intro: "Amid the ceaseless machine noise, Koujou Nushi is running wild!",
    victory: "Koujou Nushi's gears are slowly regaining their proper rhythm...",
  },
  maou: {
    intro: "The source of the distortion, the Demon Lord, rose from the throne...!",
    victory: [
      "The Demon Lord sank to its knees.",
      "\"Maybe I was... just afraid of being alone.\"",
      "Wrapped in light, the Demon Lord's form fades, and a quiet peace returns to the world.",
    ],
  },
};

export function bossIntroText(speciesId, fallbackName, lang = "ja") {
  if (lang === "en") {
    return BOSS_STORY_EN[speciesId]?.intro || `${fallbackName} of the forest blocked the way!`;
  }
  return BOSS_STORY[speciesId]?.intro || `もりの ${fallbackName} が たちはだかった！`;
}

// 常に配列を返す(通常は1行、魔王だけ複数行の演出)
export function bossVictoryLines(speciesId, fallbackName, lang = "ja") {
  if (lang === "en") {
    const victoryEn = BOSS_STORY_EN[speciesId]?.victory;
    if (!victoryEn) return [`Overcame ${fallbackName}...!`];
    return Array.isArray(victoryEn) ? victoryEn : [victoryEn];
  }
  const victory = BOSS_STORY[speciesId]?.victory;
  if (!victory) return [`${fallbackName} を のりこえた…！`];
  return Array.isArray(victory) ? victory : [victory];
}

// 呼び出し側で日本語/英語のテキストをその場で渡すシンプルな翻訳ヘルパー。
// game.lang が "en" のときだけ第2引数(英語)を返す。
export function tr(game, ja, en) {
  return game && game.lang === "en" ? en : ja;
}

export const SUPPORTED_LANGS = ["ja", "en"];

export function normalizeLang(lang) {
  return SUPPORTED_LANGS.includes(lang) ? lang : "ja";
}

// ミュート設定と同様、言語はセーブスロットに依存しない端末側の設定として保持する
const LANG_KEY = "montomo-lang";

function hasLocalStorage() {
  return typeof localStorage !== "undefined";
}

export function getStoredLang() {
  if (!hasLocalStorage()) return "ja";
  return normalizeLang(localStorage.getItem(LANG_KEY));
}

export function setStoredLang(lang) {
  const normalized = normalizeLang(lang);
  if (hasLocalStorage()) localStorage.setItem(LANG_KEY, normalized);
  return normalized;
}

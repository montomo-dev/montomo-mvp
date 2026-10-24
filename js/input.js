const KEYMAP = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyZ: "ok",
  Enter: "ok",
  KeyS: "save",
  KeyD: "dex",
  KeyN: "rename",
  KeyX: "cancel",
  Escape: "cancel",
  KeyM: "mute",
  KeyW: "warp",
  KeyL: "lang",
};

export class Input {
  constructor() {
    this.held = new Set();
    this.pressed = new Set();
    this.sources = new Map();
    window.addEventListener("keydown", (e) => {
      const focusedTag = document.activeElement?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(focusedTag)) return;
      if (["BUTTON", "A", "SUMMARY"].includes(focusedTag) && ["Enter", "Space"].includes(e.code)) return;
      const key = KEYMAP[e.code];
      if (!key) return;
      e.preventDefault();
      this.press(key, e.code);
    });
    window.addEventListener("keyup", (e) => {
      const key = KEYMAP[e.code];
      if (key) this.release(key, e.code);
    });
    window.addEventListener("blur", () => this.reset());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.reset();
    });
  }

  isHeld(key) {
    return this.held.has(key);
  }

  wasPressed(key) {
    return this.pressed.has(key);
  }

  endFrame() {
    this.pressed.clear();
  }

  // タッチボタンなど、キーボード以外の入力元から呼ぶ
  press(key, source = "virtual") {
    if (!this.sources.has(key)) this.sources.set(key, new Set());
    this.sources.get(key).add(source);
    if (!this.held.has(key)) this.pressed.add(key);
    this.held.add(key);
  }

  release(key, source = "virtual") {
    const sources = this.sources.get(key);
    sources?.delete(source);
    if (!sources?.size) {
      this.sources.delete(key);
      this.held.delete(key);
    }
  }

  reset() {
    this.sources.clear();
    this.held.clear();
    this.pressed.clear();
  }
}

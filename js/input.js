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
};

export class Input {
  constructor() {
    this.held = new Set();
    this.pressed = new Set();
    window.addEventListener("keydown", (e) => {
      if (document.activeElement && document.activeElement.tagName === "INPUT") return;
      const key = KEYMAP[e.code];
      if (!key) return;
      e.preventDefault();
      if (!this.held.has(key)) this.pressed.add(key);
      this.held.add(key);
    });
    window.addEventListener("keyup", (e) => {
      const key = KEYMAP[e.code];
      if (key) this.held.delete(key);
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
  press(key) {
    if (!this.held.has(key)) this.pressed.add(key);
    this.held.add(key);
  }

  release(key) {
    this.held.delete(key);
  }
}

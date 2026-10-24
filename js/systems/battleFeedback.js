// Presentation cues follow message indices, never timers in the combat simulation.
// Keeping them outside the string queue preserves the existing synchronous battle API.
export class BattleFeedback {
  constructor() {
    this.cues = new WeakMap();
    this.timeline = [];
    this.index = 0;
    this.active = null;
  }

  record(messages, cue) {
    if (!(cue.amount > 0)) return;
    let cues = this.cues.get(messages);
    if (!cues) this.cues.set(messages, cues = new Map());
    cues.set(messages.length - 1, { ...cue });
  }

  begin(messages) {
    const cues = this.cues.get(messages);
    this.timeline = messages.map((_, i) => cues?.get(i) || null);
    this.index = 0;
    this.active = null;
    this.present();
  }

  advance() {
    this.index += 1;
    this.present();
  }

  present() {
    const cue = this.timeline[this.index];
    if (cue) this.active = { ...cue, age: 0, duration: 0.7 };
  }

  update(dt) {
    if (!this.active) return;
    this.active.age += Math.max(0, dt);
    if (this.active.age >= this.active.duration) this.active = null;
  }

  hasPending(monster) {
    return this.timeline.slice(this.index).some((cue) => cue?.monster === monster);
  }

  visualFor(monster, reduceMotion = false) {
    const hit = this.active;
    if (!hit || hit.monster !== monster) return null;
    const p = hit.age / hit.duration;
    const impact = Math.max(0, 1 - hit.age / 0.22);
    const strength = hit.strong ? 5 : 3;
    return {
      amount: hit.amount,
      heal: !!hit.heal,
      strong: !!hit.strong,
      alpha: Math.min(1, (1 - p) * 3),
      // Reduced motion retains the readable number, with no flash or travel.
      offsetX: reduceMotion || hit.heal ? 0 : Math.sin(hit.age * 65) * impact * strength,
      rise: reduceMotion ? 0 : (1 - (1 - p) ** 3) * 26,
      glow: reduceMotion ? 0 : impact * 0.45,
    };
  }
}

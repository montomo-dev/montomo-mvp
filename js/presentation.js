// Rendering only: no randomness, persistent state, or combat decisions.
const WORLD_LIGHT = {
  forest: ["#bee281", "#f7e4a1"], reverse: ["#b6a0ef", "#d2f7c0"],
  sea: ["#aadfea", "#e5ffff"], snow: ["#c9e4f5", "#ffffff"],
  desert: ["#e8ba77", "#f8dfaa"], factory: ["#af8f65", "#f4c688"],
  castle: ["#9b87bf", "#e6cbff"],
};

export function motionTime(game, time) {
  return game.reducedMotion ? 0 : time;
}

export function drawWorldAtmosphere(ctx, world, time, reducedMotion = false) {
  const colors = WORLD_LIGHT[world] || WORLD_LIGHT.forest;
  const t = reducedMotion ? 0 : time;
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = colors[1];
  // Sparse environmental details stay in the scenery, above the command area.
  for (let i = 0; i < 9; i++) {
    const x = (i * 73 + 39 + t * (world === "snow" ? 5 : 2)) % 640;
    const y = 94 + ((i * 37 + t * (world === "snow" ? 13 : -3) + 2400) % 225);
    const size = i % 3 === 0 ? 3 : 2;
    if (world === "sea") {
      ctx.strokeStyle = colors[1];
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, size + 1, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.fillRect(Math.round(x), Math.round(y), size, size);
    }
  }
  ctx.globalAlpha = 1;
  const shade = ctx.createLinearGradient(0, 260, 0, 344);
  shade.addColorStop(0, "rgba(16, 30, 26, 0)");
  shade.addColorStop(1, "rgba(16, 30, 26, 0.16)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 260, 640, 84);
  ctx.restore();
}

export function drawHitFeedback(ctx, x, y, amount, remaining, reducedMotion) {
  if (remaining <= 0 || amount <= 0) return;
  const progress = 1 - remaining / 0.42;
  ctx.save();
  ctx.globalAlpha = Math.min(1, remaining / 0.12);
  if (!reducedMotion) {
    ctx.strokeStyle = "#f7e4a1";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5;
      const radius = 22 + progress * 18;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
      ctx.lineTo(x + Math.cos(angle) * (radius + 7), y + Math.sin(angle) * (radius + 7));
      ctx.stroke();
    }
  }
  const textY = y - 62 - (reducedMotion ? 0 : progress * 16);
  ctx.textAlign = "center";
  ctx.font = 'bold 24px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
  ctx.strokeStyle = "#16392f";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.strokeText(String(amount), x, textY);
  ctx.fillStyle = "#fff7d7";
  ctx.fillText(String(amount), x, textY);
  ctx.restore();
}

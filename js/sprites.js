function glossFill(ctx, x, y, r, lightColor, darkColor) {
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.5, r * 0.15, x, y, r * 1.15);
  g.addColorStop(0, lightColor);
  g.addColorStop(1, darkColor);
  return g;
}

function circle(ctx, x, y, r, fill, stroke, lw = 5) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.lineJoin = "round";
    ctx.stroke();
  }
}

function glossCircle(ctx, x, y, r, light, dark, stroke = "#2b2b33", lw = 5) {
  circle(ctx, x, y, r, glossFill(ctx, x, y, r, light, dark), stroke, lw);
}

function oval(ctx, x, y, rx, ry, fill, stroke, lw = 5) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.lineJoin = "round";
    ctx.stroke();
  }
}

function glossOval(ctx, x, y, rx, ry, light, dark, stroke = "#2b2b33", lw = 5) {
  const g = ctx.createRadialGradient(
    x - rx * 0.4, y - ry * 0.5, Math.min(rx, ry) * 0.1,
    x, y, Math.max(rx, ry) * 1.2
  );
  g.addColorStop(0, light);
  g.addColorStop(1, dark);
  oval(ctx, x, y, rx, ry, g, stroke, lw);
}

function tri(ctx, x1, y1, x2, y2, x3, y3, fill, stroke, lw = 4) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.lineJoin = "round";
    ctx.stroke();
  }
}

function shine(ctx, x, y, rx, ry, rot = -0.4) {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function eye(ctx, x, y, r = 8) {
  circle(ctx, x, y, r, "#ffffff", "#2b2b33", 2.5);
  circle(ctx, x + 0.5, y + r * 0.3, r * 0.56, "#2b2b33");
  circle(ctx, x - r * 0.22, y - r * 0.28, r * 0.26, "#ffffff");
  circle(ctx, x + r * 0.32, y + r * 0.18, r * 0.12, "#ffffff");
}

// 目のバリエーション: タイプ・性格ごとに描き分けて「目の使い回し感」を減らすためのセット。
// いずれも eye() と同じ (ctx, x, y, r) で差し替えられるようにしている。

// ほのお/むし系: きりっとした吊り目
function eyeSharp(ctx, x, y, r = 8) {
  ctx.beginPath();
  ctx.moveTo(x - r, y + r * 0.1);
  ctx.quadraticCurveTo(x - r * 0.3, y - r * 0.78, x + r * 0.95, y - r * 0.35);
  ctx.quadraticCurveTo(x + r * 0.3, y + r * 0.55, x - r, y + r * 0.1);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#2b2b33";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.stroke();
  circle(ctx, x + r * 0.15, y - r * 0.05, r * 0.42, "#2b2b33");
  circle(ctx, x + r * 0.35, y - r * 0.2, r * 0.12, "#ffffff");
}

// みず系: 大きくてまるい、あどけない目
function eyeBig(ctx, x, y, r = 8) {
  circle(ctx, x, y, r * 1.15, "#ffffff", "#2b2b33", 2.5);
  circle(ctx, x, y + r * 0.15, r * 0.62, "#2b2b33");
  circle(ctx, x - r * 0.28, y - r * 0.32, r * 0.32, "#ffffff");
  circle(ctx, x + r * 0.3, y + r * 0.35, r * 0.12, "#ffffff");
}

// でんき系: 瞳が星形(スパーク)になっている目
function eyeStar(ctx, x, y, r = 8) {
  circle(ctx, x, y, r, "#ffffff", "#2b2b33", 2.5);
  starSpark(ctx, x, y + r * 0.08, r * 0.58, "#2b2b33");
  circle(ctx, x - r * 0.22, y - r * 0.26, r * 0.16, "#ffffff");
}

// こおり系: 半分閉じた、落ち着いた目
function eyeSleepy(ctx, x, y, r = 8) {
  ctx.beginPath();
  ctx.arc(x, y + r * 0.12, r, Math.PI * 0.05, Math.PI * 0.95);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#2b2b33";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  circle(ctx, x, y + r * 0.42, r * 0.4, "#2b2b33");
  circle(ctx, x - r * 0.15, y + r * 0.3, r * 0.12, "#ffffff");
}

// じめん/いわ/むし系: 白目を持たない、素朴な小さい黒目
function eyeDot(ctx, x, y, r = 8) {
  circle(ctx, x, y, r * 0.55, "#2b2b33", null);
  circle(ctx, x - r * 0.15, y - r * 0.15, r * 0.16, "#ffffff");
}

// あく/ひこう系: 鋭くつり上がった、やや威圧的な目
function eyeGlare(ctx, x, y, r = 8) {
  ctx.beginPath();
  ctx.moveTo(x - r, y - r * 0.3);
  ctx.lineTo(x + r, y + r * 0.15);
  ctx.lineTo(x + r * 0.7, y + r * 0.65);
  ctx.lineTo(x - r * 0.8, y + r * 0.35);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#2b2b33";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.stroke();
  circle(ctx, x + r * 0.15, y + r * 0.2, r * 0.38, "#2b2b33");
}

// はがね/ゴースト系: 白目のない、うつろに光る目
function eyeHollow(ctx, x, y, r = 8, glow = "#9ad9ff") {
  circle(ctx, x, y, r, "#1a1a24", "#2b2b33", 2);
  circle(ctx, x, y, r * 0.4, glow, null);
}

function blush(ctx, x, y) {
  ctx.globalAlpha = 0.45;
  circle(ctx, x, y, 4.5, "#f78fb3", null);
  ctx.globalAlpha = 1;
}

function smile(ctx, x, y, r = 5) {
  ctx.strokeStyle = "#2b2b33";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
}

function flame(ctx, x, y, s, outer, inner) {
  ctx.fillStyle = outer;
  ctx.strokeStyle = "#2b2b33";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x, y - 14 * s);
  ctx.quadraticCurveTo(x + 10 * s, y - 2 * s, x, y + 8 * s);
  ctx.quadraticCurveTo(x - 10 * s, y - 2 * s, x, y - 14 * s);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.moveTo(x, y - 7 * s);
  ctx.quadraticCurveTo(x + 5 * s, y, x, y + 6 * s);
  ctx.quadraticCurveTo(x - 5 * s, y, x, y - 7 * s);
  ctx.fill();
}

function petalFlower(ctx, x, y, r, petalColor, centerColor) {
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5;
    const px = x + Math.cos(a) * r * 0.7;
    const py = y + Math.sin(a) * r * 0.7;
    glossOval(ctx, px, py, r * 0.55, r * 0.35, petalColor, petalColor, "#2b2b33", 1.5);
  }
  circle(ctx, x, y, r * 0.4, centerColor, "#2b2b33", 1.5);
}

function rockPlate(ctx, x, y, r) {
  glossOval(ctx, x, y, r, r * 0.75, "#c9c4bb", "#8a8478", "#5c574c", 2.5);
  ctx.strokeStyle = "#5c574c";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.4, y - r * 0.3);
  ctx.lineTo(x + r * 0.1, y + r * 0.2);
  ctx.moveTo(x - r * 0.1, y - r * 0.4);
  ctx.lineTo(x + r * 0.3, y);
  ctx.stroke();
}

function windSwirl(ctx, x, y, r) {
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI * 0.2, Math.PI * 1.5);
  ctx.stroke();
}

function starSpark(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI / 2) * i;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a + Math.PI / 4) * r * 0.3, y + Math.sin(a + Math.PI / 4) * r * 0.3);
  }
  ctx.closePath();
  ctx.fill();
}

function scaleMark(ctx, x, y, r, color = "rgba(255,255,255,0.35)") {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.55, -0.45, 0, Math.PI * 2);
  ctx.fill();
}

function tinyLeaf(ctx, x, y, rot, color = "#7ed95a") {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  glossOval(ctx, 0, 0, 7, 3.5, color, "#4f9a38", "#2f6428", 1.2);
  ctx.restore();
}

function evolvedVariant(basePainter, hueDeg, accessory) {
  return function (ctx) {
    ctx.save();
    ctx.filter = `hue-rotate(${hueDeg}deg) saturate(1.25) brightness(1.05)`;
    ctx.scale(1.16, 1.16);
    basePainter(ctx);
    ctx.restore();
    if (accessory) accessory(ctx);
  };
}

function paintMofuri(ctx) {
  ctx.strokeStyle = "#4a7d2e";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(32, 6, 11, Math.PI * 0.2, Math.PI * 1.3);
  ctx.stroke();
  tri(ctx, -24, -38, -4, -24, -26, -14, "#8ed85c", "#4a7d2e");
  tri(ctx, 24, -38, 4, -24, 26, -14, "#8ed85c", "#4a7d2e");
  tri(ctx, -20, -32, -8, -24, -21, -18, "#f7b2c9", null);
  tri(ctx, 20, -32, 8, -24, 21, -18, "#f7b2c9", null);
  glossCircle(ctx, 0, 0, 30, "#a8ec78", "#5e9c3e");
  glossOval(ctx, 0, 13, 13, 12, "#e2f9c8", "#b8e48e", "#4a7d2e", 3);
  ctx.save();
  ctx.translate(0, -34);
  ctx.rotate(-0.5);
  glossOval(ctx, 0, 0, 9, 4.5, "#6cb445", "#4a7d2e", "#3a6624", 2.5);
  ctx.restore();
  shine(ctx, -12, -14, 12, 7);
  eye(ctx, -11, -5);
  eye(ctx, 11, -5);
  smile(ctx, 0, 6, 4);
  blush(ctx, -21, 4);
  blush(ctx, 21, 4);
}

function paintDogura(ctx) {
  glossCircle(ctx, -19, -24, 6.5, "#9a6f4c", "#7a5236");
  glossCircle(ctx, 19, -24, 6.5, "#9a6f4c", "#7a5236");
  glossOval(ctx, 0, 0, 30, 27, "#c99e73", "#8a6244", "#5c3f28", 5);
  glossOval(ctx, 0, 12, 17, 13, "#f0d3ac", "#d9b48f", "#8a6244", 3);
  glossOval(ctx, -15, 24, 8, 5, "#f0d3ac", "#d9b48f", "#5c3f28", 2.5);
  glossOval(ctx, 15, 24, 8, 5, "#f0d3ac", "#d9b48f", "#5c3f28", 2.5);
  ctx.strokeStyle = "#2b2b33";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(-13, -6, 5.5, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(13, -6, 5.5, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  glossCircle(ctx, 0, 0, 8.5, "#ffb0a8", "#e28277", "#a8544a", 2.5);
  circle(ctx, -2.5, -2.5, 2.2, "#ffe1dc", null);
  ctx.strokeStyle = "#5c3f28";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-26, 2); ctx.lineTo(-38, -1);
  ctx.moveTo(-26, 7); ctx.lineTo(-38, 8);
  ctx.moveTo(26, 2); ctx.lineTo(38, -1);
  ctx.moveTo(26, 7); ctx.lineTo(38, 8);
  ctx.stroke();
  shine(ctx, -11, -12, 11, 6);
  blush(ctx, -20, 8);
  blush(ctx, 20, 8);
}

function paintHibachi(ctx) {
  ctx.strokeStyle = "#a83f20";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(30, 12, 10, Math.PI * 1.1, Math.PI * 2.1);
  ctx.stroke();
  flame(ctx, 38, 4, 0.8, "#ff9d2e", "#ffe07a");
  glossCircle(ctx, 0, 0, 28, "#ff9868", "#d9633a", "#a83f20", 6);
  flame(ctx, 0, -36, 1, "#ff9d2e", "#ffe07a");
  glossOval(ctx, 0, 12, 13, 12, "#fff0d6", "#ffe1b3", "#a83f20", 3);
  glossOval(ctx, -13, 26, 7, 4.5, "#ff9868", "#d9633a", "#a83f20", 2.5);
  glossOval(ctx, 13, 26, 7, 4.5, "#ff9868", "#d9633a", "#a83f20", 2.5);
  shine(ctx, -11, -13, 11, 6);
  eyeSharp(ctx, -10, -7);
  eyeSharp(ctx, 10, -7);
  smile(ctx, 0, 4, 4.5);
  blush(ctx, -19, 2);
  blush(ctx, 19, 2);
}

function paintFuwarisu(ctx) {
  glossOval(ctx, -30, 2, 10, 16, "#d5f2fc", "#8fcbe8", "#4a86a8", 4);
  glossOval(ctx, 30, 2, 10, 16, "#d5f2fc", "#8fcbe8", "#4a86a8", 4);
  glossCircle(ctx, 0, 0, 28, "#c2eaf8", "#7bc4e0", "#4a86a8", 6);
  ctx.strokeStyle = "#4a86a8";
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-5, -27); ctx.quadraticCurveTo(-8, -38, -14, -40);
  ctx.moveTo(0, -28); ctx.quadraticCurveTo(0, -40, 0, -42);
  ctx.moveTo(5, -27); ctx.quadraticCurveTo(8, -38, 14, -40);
  ctx.stroke();
  glossOval(ctx, 0, 11, 14, 13, "#ffffff", "#e8f7ff", "#4a86a8", 3);
  shine(ctx, -11, -13, 11, 6);
  eyeGlare(ctx, -10, -6);
  eyeGlare(ctx, 10, -6);
  tri(ctx, -5, 1, 5, 1, 0, 9, "#f5a13d", "#c97c22", 1.5);
  ctx.strokeStyle = "#f5a13d";
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-10, 27); ctx.lineTo(-10, 33);
  ctx.moveTo(10, 27); ctx.lineTo(10, 33);
  ctx.stroke();
  blush(ctx, -19, 3);
  blush(ctx, 19, 3);
}

function paintMofurif(ctx) {
  ctx.strokeStyle = "#3d6b26";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(36, 10, 13, Math.PI * 0.2, Math.PI * 1.3);
  ctx.stroke();
  tri(ctx, -30, -42, -6, -26, -30, -14, "#8ed85c", "#3d6b26");
  tri(ctx, 30, -42, 6, -26, 30, -14, "#8ed85c", "#3d6b26");
  tri(ctx, -20, -34, -8, -25, -22, -18, "#f7b2c9", null);
  tri(ctx, 20, -34, 8, -25, 22, -18, "#f7b2c9", null);
  glossCircle(ctx, 0, 0, 32, "#a8ec78", "#4a7d2e", "#3d6b26", 6);
  glossOval(ctx, 0, 14, 15, 13, "#e2f9c8", "#b8e48e", "#3d6b26", 3);
  ctx.save();
  ctx.translate(2, -38);
  ctx.rotate(-0.4);
  glossOval(ctx, 0, 0, 10, 5, "#6cb445", "#3d6b26", "#2b551c", 2.5);
  ctx.restore();
  petalFlower(ctx, 16, -44, 8, "#f78fb3", "#ffe07a");
  petalFlower(ctx, 0, -24, 7, "#ffe07a", "#f78fb3");
  for (const [lx, ly, rot] of [[-22, -9, -0.8], [22, -9, 0.8], [-17, 15, -0.45], [17, 15, 0.45]]) {
    tinyLeaf(ctx, lx, ly, rot, "#9fe56c");
  }
  shine(ctx, -14, -16, 13, 8);
  eye(ctx, -12, -3, 9);
  eye(ctx, 12, -3, 9);
  smile(ctx, 0, 8, 4.5);
  blush(ctx, -23, 5);
  blush(ctx, 23, 5);
}

function paintBorudogura(ctx) {
  rockPlate(ctx, -22, -30, 9);
  rockPlate(ctx, 22, -30, 9);
  rockPlate(ctx, 0, -38, 8);
  glossOval(ctx, 0, 2, 36, 32, "#b98a5e", "#7a5236", "#4a3320", 6);
  rockPlate(ctx, -30, -2, 11);
  rockPlate(ctx, 30, -2, 11);
  rockPlate(ctx, -20, 14, 8);
  rockPlate(ctx, 20, 14, 8);
  glossOval(ctx, 0, 16, 19, 15, "#f0d3ac", "#d9b48f", "#4a3320", 3);
  glossOval(ctx, -18, 29, 10, 6, "#c9c4bb", "#8a8478", "#4a3320", 2.5);
  glossOval(ctx, 18, 29, 10, 6, "#c9c4bb", "#8a8478", "#4a3320", 2.5);
  ctx.strokeStyle = "#2b2b33";
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(-14, -8, 6, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(14, -8, 6, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  glossCircle(ctx, 0, 0, 9.5, "#ffb0a8", "#e28277", "#a8544a", 2.5);
  circle(ctx, -3, -3, 2.4, "#ffe1dc", null);
  shine(ctx, -13, -14, 12, 6);
  blush(ctx, -24, 8);
  blush(ctx, 24, 8);
}

function paintBakuhibachi(ctx) {
  ctx.strokeStyle = "#8a3016";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(34, 14, 11, Math.PI * 1.1, Math.PI * 2.1);
  ctx.stroke();
  flame(ctx, 42, 5, 0.9, "#ff9d2e", "#ffe07a");
  tri(ctx, -20, -20, -34, -30, -22, -8, "#ff9d2e", "#8a3016", 2.5);
  tri(ctx, 20, -20, 34, -30, 22, -8, "#ff9d2e", "#8a3016", 2.5);
  glossCircle(ctx, 0, 0, 31, "#ff9868", "#c2502a", "#8a3016", 6);
  flame(ctx, -12, -38, 0.9, "#ff9d2e", "#ffe07a");
  flame(ctx, 12, -38, 0.9, "#ff9d2e", "#ffe07a");
  tri(ctx, -6, -30, 0, -22, 6, -30, "#ffcf6b", "#8a3016", 1.8);
  glossOval(ctx, 0, 13, 14, 13, "#fff0d6", "#ffe1b3", "#8a3016", 3);
  glossOval(ctx, -14, 28, 8, 5, "#ff9868", "#c2502a", "#8a3016", 2.5);
  glossOval(ctx, 14, 28, 8, 5, "#ff9868", "#c2502a", "#8a3016", 2.5);
  scaleMark(ctx, -18, 2, 4, "rgba(255, 230, 122, 0.45)");
  scaleMark(ctx, 18, 1, 4, "rgba(255, 230, 122, 0.45)");
  scaleMark(ctx, 0, -12, 3.5, "rgba(255, 230, 122, 0.50)");
  starSpark(ctx, -31, -11, 4, "#ffe07a");
  starSpark(ctx, 31, -8, 4, "#ffe07a");
  shine(ctx, -12, -14, 12, 6);
  eyeSharp(ctx, -11, -6, 8.5);
  eyeSharp(ctx, 11, -6, 8.5);
  smile(ctx, 0, 5, 5);
  blush(ctx, -21, 3);
  blush(ctx, 21, 3);
}

function paintTenfuwarisu(ctx) {
  glossOval(ctx, -34, 0, 12, 20, "#d5f2fc", "#8fcbe8", "#3a6f8f", 4.5);
  glossOval(ctx, 34, 0, 12, 20, "#d5f2fc", "#8fcbe8", "#3a6f8f", 4.5);
  windSwirl(ctx, -40, -6, 9);
  windSwirl(ctx, 40, -6, 9);
  for (const side of [-1, 1]) {
    glossOval(ctx, side * 39, 14, 6, 12, "#ffffff", "#bfe9f7", "#3a6f8f", 1.6);
    glossOval(ctx, side * 45, 8, 5, 10, "#ffffff", "#bfe9f7", "#3a6f8f", 1.4);
  }
  glossCircle(ctx, 0, 0, 30, "#c2eaf8", "#6fb8d8", "#3a6f8f", 6);
  ctx.strokeStyle = "#3a6f8f";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-6, -28); ctx.quadraticCurveTo(-10, -42, -18, -46);
  ctx.moveTo(0, -29); ctx.quadraticCurveTo(0, -44, 0, -47);
  ctx.moveTo(6, -28); ctx.quadraticCurveTo(10, -42, 18, -46);
  ctx.stroke();
  glossOval(ctx, 0, 12, 15, 14, "#ffffff", "#e8f7ff", "#3a6f8f", 3);
  starSpark(ctx, 24, -34, 6, "#fff4c2");
  shine(ctx, -12, -14, 12, 6);
  eyeGlare(ctx, -11, -6, 9);
  eyeGlare(ctx, 11, -6, 9);
  tri(ctx, -5, 1, 5, 1, 0, 10, "#f5a13d", "#c97c22", 1.5);
  ctx.strokeStyle = "#f5a13d";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-11, 29); ctx.lineTo(-11, 36);
  ctx.moveTo(11, 29); ctx.lineTo(11, 36);
  ctx.stroke();
  blush(ctx, -20, 3);
  blush(ctx, 20, 3);
}

function paintPyokotan(ctx) {
  glossOval(ctx, -16, 24, 9, 6, "#9adfc8", "#4fae86", "#2f7357", 2.5);
  glossOval(ctx, 16, 24, 9, 6, "#9adfc8", "#4fae86", "#2f7357", 2.5);
  glossOval(ctx, 0, 4, 30, 27, "#b8f0d8", "#4fae86", "#2f7357", 6);
  ctx.save();
  ctx.translate(0, -30);
  glossOval(ctx, 0, 0, 8, 11, "#c9f5e2", "#6fcaa5", "#2f7357", 2.5);
  ctx.restore();
  glossCircle(ctx, -13, -10, 10, "#ffffff", "#dff7ee", "#2f7357", 2.5);
  glossCircle(ctx, 13, -10, 10, "#ffffff", "#dff7ee", "#2f7357", 2.5);
  circle(ctx, -13, -6, 6, "#2b2b33", null);
  circle(ctx, 13, -6, 6, "#2b2b33", null);
  circle(ctx, -15, -9, 2.4, "#ffffff", null);
  circle(ctx, 11, -9, 2.4, "#ffffff", null);
  glossOval(ctx, 0, 14, 14, 10, "#e2fbf0", "#c9f5e2", "#2f7357", 2.5);
  smile(ctx, 0, 6, 5);
  blush(ctx, -20, 10);
  blush(ctx, 20, 10);
}

function paintPachikoro(ctx) {
  ctx.strokeStyle = "#8a6b12";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-6, -26); ctx.quadraticCurveTo(-10, -36, -16, -40);
  ctx.moveTo(6, -26); ctx.quadraticCurveTo(10, -36, 16, -40);
  ctx.stroke();
  starSpark(ctx, -17, -42, 5, "#fff4a3");
  starSpark(ctx, 17, -42, 5, "#fff4a3");
  glossOval(ctx, -20, 8, 8, 12, "#f6d97a", "#c99a1e", "#6b4e0c", 2.5);
  glossOval(ctx, 20, 8, 8, 12, "#f6d97a", "#c99a1e", "#6b4e0c", 2.5);
  glossOval(ctx, -20, 22, 6, 5, "#6b4e0c", "#4a3608", "#2b2b33", 1.5);
  glossOval(ctx, 20, 22, 6, 5, "#6b4e0c", "#4a3608", "#2b2b33", 1.5);
  glossCircle(ctx, 0, 0, 28, "#ffe27a", "#e0a52e", "#6b4e0c", 6);
  ctx.strokeStyle = "#6b4e0c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-27, 2); ctx.quadraticCurveTo(0, 12, 27, 2);
  ctx.stroke();
  glossOval(ctx, 0, 14, 13, 11, "#fff6d9", "#ffe9a8", "#6b4e0c", 2.5);
  shine(ctx, -12, -14, 11, 6);
  eyeStar(ctx, -10, -7, 8);
  eyeStar(ctx, 10, -7, 8);
  smile(ctx, 0, 4, 4.5);
  blush(ctx, -19, 1);
  blush(ctx, 19, 1);
}

function paintOrihiko(ctx) {
  ctx.save();
  ctx.rotate(-0.08);
  ctx.beginPath();
  ctx.moveTo(-28, 4);
  ctx.lineTo(-4, -30);
  ctx.lineTo(24, -8);
  ctx.lineTo(10, 30);
  ctx.lineTo(-18, 20);
  ctx.closePath();
  ctx.fillStyle = "#f2e4c8";
  ctx.strokeStyle = "#4f4333";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#d9c19b";
  ctx.beginPath();
  ctx.moveTo(-8, -18);
  ctx.lineTo(8, -8);
  ctx.lineTo(-2, 12);
  ctx.lineTo(-18, 0);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#b98a5a";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-6, -26);
  ctx.lineTo(8, -6);
  ctx.moveTo(-19, 4);
  ctx.lineTo(10, 13);
  ctx.stroke();

  ctx.restore();
  eyeGlare(ctx, -5, -5, 7.5);
  eyeGlare(ctx, 10, -2, 7.5);
  smile(ctx, 2, 10, 4);
  blush(ctx, -18, 6);
  blush(ctx, 20, 8);
  starSpark(ctx, 19, -20, 4.5, "#fff2c0");
}

function paintKiboko(ctx) {
  ctx.fillStyle = "#9f6d45";
  ctx.strokeStyle = "#5c3f28";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.roundRect(-18, -28, 36, 56, 12);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(-22, -36, 44, 20, 8);
  ctx.fillStyle = "#b27c50";
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#d8ab7b";
  ctx.beginPath();
  ctx.roundRect(-10, -10, 20, 22, 6);
  ctx.fill();
  ctx.strokeStyle = "#5c3f28";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#7b522f";
  ctx.fillRect(-12, -28, 4, 10);
  ctx.fillRect(8, -28, 4, 10);
  ctx.beginPath();
  ctx.arc(-12, -30, 3, 0, Math.PI * 2);
  ctx.arc(12, -30, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#6d4a2a";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-14, -18); ctx.lineTo(14, -18);
  ctx.moveTo(-14, -6); ctx.lineTo(14, -6);
  ctx.moveTo(-14, 6); ctx.lineTo(14, 6);
  ctx.stroke();

  shine(ctx, -10, -20, 9, 5);
  eye(ctx, -7, -6, 6.8);
  eye(ctx, 7, -6, 6.8);
  smile(ctx, 0, 6, 3.8);
  blush(ctx, -16, 8);
  blush(ctx, 16, 8);
}

function paintTsuboco(ctx) {
  ctx.save();
  ctx.translate(0, 2);
  glossOval(ctx, 0, 0, 28, 24, "#d9a57b", "#b36d46", "#6a4029", 5);
  ctx.fillStyle = "#eed1a8";
  ctx.strokeStyle = "#6a4029";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-18, -30, 36, 14, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#8d5737";
  ctx.fillRect(-6, -36, 12, 6);
  ctx.fillRect(-12, 22, 6, 8);
  ctx.fillRect(6, 22, 6, 8);
  ctx.strokeStyle = "#6a4029";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-10, -12); ctx.lineTo(-2, -2); ctx.lineTo(-12, 8);
  ctx.moveTo(12, -8); ctx.lineTo(4, 0); ctx.lineTo(14, 10);
  ctx.stroke();
  ctx.restore();
  shine(ctx, -12, -12, 11, 6);
  eyeDot(ctx, -8, -4, 7);
  eyeDot(ctx, 8, -4, 7);
  smile(ctx, 0, 6, 4.2);
  blush(ctx, -18, 4);
  blush(ctx, 18, 4);
}

function paintTsukinone(ctx) {
  ctx.save();
  ctx.translate(-15, -30);
  ctx.rotate(-0.28);
  glossOval(ctx, 0, 0, 9, 25, "#f5edff", "#a989d4", "#51406f", 4);
  glossOval(ctx, 0, -2, 3.5, 17, "#ffe5f5", "#d79bc6", null);
  ctx.restore();
  ctx.save();
  ctx.translate(15, -30);
  ctx.rotate(0.28);
  glossOval(ctx, 0, 0, 9, 25, "#f5edff", "#a989d4", "#51406f", 4);
  glossOval(ctx, 0, -2, 3.5, 17, "#ffe5f5", "#d79bc6", null);
  ctx.restore();

  ctx.strokeStyle = "#e7c34d";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(28, 8, 14, -Math.PI * 0.4, Math.PI * 0.65);
  ctx.stroke();
  starSpark(ctx, 38, -2, 7, "#fff1a6");

  glossOval(ctx, -15, 24, 9, 6, "#dfd2f5", "#9473c4", "#51406f", 2.5);
  glossOval(ctx, 15, 24, 9, 6, "#dfd2f5", "#9473c4", "#51406f", 2.5);
  glossOval(ctx, 0, 2, 29, 28, "#f4efff", "#9d7bca", "#51406f", 6);
  glossOval(ctx, 0, 15, 14, 11, "#fff8e4", "#ead9a7", "#51406f", 2.5);
  shine(ctx, -12, -13, 11, 6);
  eye(ctx, -10, -6, 8);
  eye(ctx, 10, -6, 8);
  smile(ctx, 0, 5, 4.5);
  blush(ctx, -20, 3);
  blush(ctx, 20, 3);
  starSpark(ctx, 0, -23, 6, "#ffe676");
}

function horn(ctx, x, y, flip = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip, 1);
  ctx.fillStyle = "#e8d69b";
  ctx.strokeStyle = "#4b3a20";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(10, -26, 30, -31);
  ctx.quadraticCurveTo(22, -15, 8, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(75,58,32,0.45)";
  ctx.lineWidth = 1.8;
  for (const p of [0.32, 0.55, 0.76]) {
    ctx.beginPath();
    ctx.moveTo(7 + 18 * p, -28 * p);
    ctx.lineTo(2 + 10 * p, -12 * p);
    ctx.stroke();
  }
  ctx.restore();
}

function paintNushi(ctx) {
  // クリア目標のボス。森の大樹＋獣を合わせた、通常モンスターより大きく威圧感のある見た目。
  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    const r = 38 + (i % 2) * 7;
    ctx.strokeStyle = i % 2 ? "#d8f7a8" : "#86d46b";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 12);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "#fff4a3";
  ctx.lineWidth = 2;
  for (const r of [48, 58]) {
    ctx.beginPath();
    ctx.arc(0, -2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  horn(ctx, -24, -26, -1);
  horn(ctx, 24, -26, 1);

  // 枝角と葉冠
  ctx.strokeStyle = "#4b3a20";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-26, -28); ctx.lineTo(-42, -48); ctx.lineTo(-52, -62);
  ctx.moveTo(-38, -43); ctx.lineTo(-52, -42);
  ctx.moveTo(26, -28); ctx.lineTo(42, -48); ctx.lineTo(52, -62);
  ctx.moveTo(38, -43); ctx.lineTo(52, -42);
  ctx.stroke();
  for (const [lx, ly, r] of [[-54, -62, 8], [-52, -42, 7], [54, -62, 8], [52, -42, 7], [0, -51, 9]]) {
    glossOval(ctx, lx, ly, r, r * 0.65, "#9fe56c", "#4e9a3e", "#2f6428", 2);
  }

  // 巨体
  glossOval(ctx, 0, 4, 42, 37, "#7fc05b", "#3f7d37", "#234a24", 7);
  glossOval(ctx, 0, 17, 21, 16, "#d7efaa", "#93c66f", "#234a24", 3.5);
  shine(ctx, -18, -14, 16, 9);

  // 腕・爪
  glossOval(ctx, -39, 12, 12, 21, "#6faf52", "#336d31", "#234a24", 4);
  glossOval(ctx, 39, 12, 12, 21, "#6faf52", "#336d31", "#234a24", 4);
  for (const side of [-1, 1]) {
    tri(ctx, side * 38, 28, side * 45, 38, side * 31, 35, "#e8d69b", "#4b3a20", 1.8);
  }

  // 足元の根
  ctx.strokeStyle = "#234a24";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-14, 33); ctx.quadraticCurveTo(-30, 42, -43, 38);
  ctx.moveTo(14, 33); ctx.quadraticCurveTo(30, 42, 43, 38);
  ctx.stroke();

  // 顔。ボスらしくキリッとした目にする。
  ctx.fillStyle = "#fff7c2";
  ctx.strokeStyle = "#2b2b33";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(-14, -8, 8, 6, -0.12, 0, Math.PI * 2);
  ctx.ellipse(14, -8, 8, 6, 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  circle(ctx, -12, -7, 3.5, "#2b2b33", null);
  circle(ctx, 12, -7, 3.5, "#2b2b33", null);
  ctx.strokeStyle = "#2b2b33";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-24, -17); ctx.lineTo(-7, -12);
  ctx.moveTo(24, -17); ctx.lineTo(7, -12);
  ctx.moveTo(-8, 10); ctx.quadraticCurveTo(0, 16, 8, 10);
  ctx.stroke();

  starSpark(ctx, -31, -31, 5, "#fff4a3");
  starSpark(ctx, 32, -29, 4.5, "#fff4a3");
}

function paintHonbori(ctx) {
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#ffd88a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -2, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  glossOval(ctx, -22, -6, 7, 11, "#e0863a", "#a8621f", "#6b3f10", 2.5);
  glossOval(ctx, 22, -6, 7, 11, "#e0863a", "#a8621f", "#6b3f10", 2.5);

  glossOval(ctx, 0, -32, 12, 5, "#6b3f10", "#4a2b0a", "#2b2b33", 2);
  glossOval(ctx, 0, 30, 13, 5, "#6b3f10", "#4a2b0a", "#2b2b33", 2);

  glossOval(ctx, 0, 0, 27, 30, "#ffc46a", "#e0863a", "#6b3f10", 6);
  ctx.strokeStyle = "rgba(107, 63, 16, 0.55)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  for (const y of [-14, 0, 14]) {
    ctx.beginPath();
    ctx.moveTo(-24, y);
    ctx.quadraticCurveTo(0, y + 6, 24, y);
    ctx.stroke();
  }
  shine(ctx, -12, -16, 11, 6);

  glossOval(ctx, 0, 12, 14, 10, "#fff2d6", "#ffe0a8", "#6b3f10", 2.5);
  eyeGlare(ctx, -10, -4, 8);
  eyeGlare(ctx, 10, -4, 8);
  tri(ctx, -4, 6, 4, 6, 0, 12, "#a8621f", null);
  blush(ctx, -20, 6);
  blush(ctx, 20, 6);
}

function paintTsubogame(ctx) {
  glossOval(ctx, -18, 22, 8, 6, "#e2c99a", "#a88a5c", "#5c4a30", 2.5);
  glossOval(ctx, 18, 22, 8, 6, "#e2c99a", "#a88a5c", "#5c4a30", 2.5);
  glossOval(ctx, -22, 6, 7, 9, "#e2c99a", "#a88a5c", "#5c4a30", 2.5);
  glossOval(ctx, 22, 6, 7, 9, "#e2c99a", "#a88a5c", "#5c4a30", 2.5);
  tri(ctx, -6, 26, 6, 26, 0, 34, "#a88a5c", "#5c4a30", 2);

  glossCircle(ctx, 0, -22, 12, "#e2c99a", "#a88a5c", "#5c4a30", 2.5);
  eyeDot(ctx, -5, -23, 6);
  eyeDot(ctx, 5, -23, 6);
  smile(ctx, 0, -17, 3.5);

  glossOval(ctx, 0, 4, 30, 26, "#8fc7ae", "#5a8f7a", "#2f5745", 6);
  ctx.strokeStyle = "rgba(47, 87, 69, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-20, -6); ctx.quadraticCurveTo(-6, 4, -14, 16);
  ctx.moveTo(18, -8); ctx.quadraticCurveTo(8, 0, 16, 14);
  ctx.stroke();
  shine(ctx, -13, -8, 12, 7);
  glossOval(ctx, 0, 8, 14, 10, "#dff2e8", "#bfe4d4", "#2f5745", 2.5);
  blush(ctx, -21, 8);
  blush(ctx, 21, 8);
}

function paintSandango(ctx) {
  ctx.strokeStyle = "#a8865c";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 33);
  ctx.lineTo(0, 44);
  ctx.stroke();

  glossCircle(ctx, 0, 20, 15, "#f6a6a0", "#d97a72", "#8a4a44", 3);
  glossCircle(ctx, 0, 1, 14, "#fff6e4", "#ead9b8", "#8a7550", 3);
  shine(ctx, -14, 16, 6, 3.5);
  shine(ctx, -13, -3, 6, 3.5);

  glossOval(ctx, -13, -18, 6, 9, "#8fce6a", "#5fa03e", "#345c22", 2.2);
  glossOval(ctx, 13, -18, 6, 9, "#8fce6a", "#5fa03e", "#345c22", 2.2);
  glossCircle(ctx, 0, -20, 14, "#a8dd82", "#7ac457", "#345c22", 3);
  shine(ctx, -6, -24, 6, 3.5);
  eyeGlare(ctx, -6, -21, 6);
  eyeGlare(ctx, 6, -21, 6);
  smile(ctx, 0, -16, 3.5);
  blush(ctx, -13, -17);
  blush(ctx, 13, -17);
}

function paintPukurin(ctx) {
  // 水風船クラゲ。半透明のぷるぷるボディに、下から伸びる短い触手。
  ctx.save();
  ctx.globalAlpha = 0.85;
  glossOval(ctx, 0, 2, 28, 26, "#cdeeff", "#7ec9e8", "#3a7ea3", 5.5);
  ctx.restore();

  ctx.strokeStyle = "#3a7ea3";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.moveTo(-14, 22); ctx.quadraticCurveTo(-18, 32, -13, 40);
  ctx.moveTo(-3, 25); ctx.quadraticCurveTo(-5, 36, -1, 42);
  ctx.moveTo(9, 24); ctx.quadraticCurveTo(12, 34, 8, 41);
  ctx.stroke();
  ctx.globalAlpha = 1;

  glossOval(ctx, 0, 8, 15, 11, "#eaf9ff", "#c3ecff", "#3a7ea3", 2.5);
  circle(ctx, -14, -8, 4, "rgba(255,255,255,0.55)", null);
  circle(ctx, 10, 4, 3, "rgba(255,255,255,0.4)", null);
  shine(ctx, -12, -10, 12, 7);
  eyeBig(ctx, -9, -4, 7.5);
  eyeBig(ctx, 9, -4, 7.5);
  smile(ctx, 0, 7, 4);
  blush(ctx, -18, 6);
  blush(ctx, 18, 6);
}

function paintKageuri(ctx) {
  // 影に潜む瓜。濃い紫のつやめく実に、蔓のしっぽとつり目が特徴。
  ctx.strokeStyle = "#2b2440";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -30); ctx.quadraticCurveTo(8, -40, 4, -46);
  ctx.stroke();
  glossOval(ctx, 6, -46, 4, 3, "#7ed85c", "#4a9838", "#2b2440", 1.5);

  glossOval(ctx, 0, 4, 27, 30, "#7a68a8", "#4a3a70", "#241c38", 6);
  ctx.strokeStyle = "rgba(36, 28, 56, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-20, -10); ctx.quadraticCurveTo(-4, 2, -16, 22);
  ctx.moveTo(20, -12); ctx.quadraticCurveTo(4, 0, 15, 20);
  ctx.stroke();
  shine(ctx, -13, -12, 12, 7);

  ctx.fillStyle = "#e8d0ff";
  ctx.strokeStyle = "#241c38";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-10, -4, 6.5, 4.5, -0.25, 0, Math.PI * 2);
  ctx.ellipse(10, -4, 6.5, 4.5, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  circle(ctx, -9, -3, 2.6, "#241c38", null);
  circle(ctx, 11, -3, 2.6, "#241c38", null);
  smile(ctx, 0, 10, 4);
  blush(ctx, -19, 8);
  blush(ctx, 19, 8);
}

function paintHoshimogu(ctx) {
  // 星屑をまとうモグラ。額の星模様と、周りに浮かぶ光の粒。
  starSpark(ctx, -30, -18, 3.5, "#e6ddff");
  starSpark(ctx, 30, -14, 3, "#e6ddff");
  starSpark(ctx, -22, 24, 2.6, "#e6ddff");

  glossOval(ctx, -22, 24, 8, 6, "#39304f", "#241c38", "#140f21", 2.2);
  glossOval(ctx, 22, 24, 8, 6, "#39304f", "#241c38", "#140f21", 2.2);

  glossOval(ctx, 0, 2, 28, 27, "#5d4f80", "#392f52", "#1c1730", 6);
  ctx.fillStyle = "#e6ddff";
  ctx.strokeStyle = "#1c1730";
  ctx.lineWidth = 1.6;
  tri(ctx, -4, -18, 4, -18, 0, -9, "#e6ddff", "#1c1730", 1.4);
  shine(ctx, -13, -10, 12, 7);

  glossOval(ctx, 0, 14, 15, 11, "#efe9ff", "#cfc2f0", "#1c1730", 2.5);
  eyeDot(ctx, -9, -3, 7);
  eyeDot(ctx, 9, -3, 7);
  ctx.fillStyle = "#2b2440";
  tri(ctx, -4, 4, 4, 4, 0, 9, "#8a7ab0", null);
  smile(ctx, 0, 12, 3.6);
  blush(ctx, -18, 8);
  blush(ctx, 18, 8);
}

function paintFuyudama(ctx) {
  // まんまるな雪玉の精霊。小さなつららと、ひんやりした表情。
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "#bfe3f7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 33, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  glossCircle(ctx, 0, 2, 29, "#ffffff", "#cdeeff", "#8fbcd8", 6);

  ctx.fillStyle = "#bfe3f7";
  ctx.strokeStyle = "#6fa0c0";
  ctx.lineWidth = 1.6;
  for (const [ix, iy] of [[-16, 26], [0, 30], [16, 26]]) {
    ctx.beginPath();
    ctx.moveTo(ix - 3, iy);
    ctx.lineTo(ix + 3, iy);
    ctx.lineTo(ix, iy + 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  shine(ctx, -13, -12, 13, 8);
  glossOval(ctx, 0, 12, 14, 9, "#f2fbff", "#dcf1fb", "#8fbcd8", 2.2);
  eyeSleepy(ctx, -9, -2, 7.5);
  eyeSleepy(ctx, 9, -2, 7.5);
  smile(ctx, 0, 9, 3.8);
  ctx.globalAlpha = 0.45;
  circle(ctx, -18, 6, 4.5, "#8fd0ee", null);
  circle(ctx, 18, 6, 4.5, "#8fd0ee", null);
  ctx.globalAlpha = 1;
}

function paintNejiko(ctx) {
  // ぜんまい仕掛けの猫。背中の大きなネジと金属の耳が目印。
  ctx.save();
  ctx.translate(0, -30);
  ctx.rotate(0.15);
  ctx.fillStyle = "#a88a52";
  ctx.strokeStyle = "#5c4a26";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-4, -12, 8, 12, 2);
  ctx.fill();
  ctx.stroke();
  circle(ctx, 0, -14, 5, "#c9a45a", "#5c4a26", 2.2);
  ctx.restore();

  tri(ctx, -22, -30, -12, -18, -26, -16, "#c9a45a", "#5c4a26", 2.2);
  tri(ctx, 22, -30, 12, -18, 26, -16, "#c9a45a", "#5c4a26", 2.2);
  tri(ctx, -20, -27, -14, -19, -21, -17, "#7a5f30", null);
  tri(ctx, 20, -27, 14, -19, 21, -17, "#7a5f30", null);

  glossCircle(ctx, 0, 0, 27, "#e6c37a", "#c9a45a", "#5c4a26", 6);
  ctx.strokeStyle = "rgba(92, 74, 38, 0.5)";
  ctx.lineWidth = 1.6;
  for (const y of [-10, 0, 10]) {
    ctx.beginPath();
    ctx.moveTo(-22, y);
    ctx.lineTo(22, y);
    ctx.stroke();
  }
  shine(ctx, -12, -12, 12, 7);

  glossOval(ctx, 0, 13, 14, 10, "#fff4d9", "#f0dba8", "#5c4a26", 2.5);
  eyeHollow(ctx, -9, -3, 7.5);
  eyeHollow(ctx, 9, -3, 7.5);
  tri(ctx, -4, 4, 4, 4, 0, 8, "#a8621f", null);
  smile(ctx, 0, 11, 3.8);
  blush(ctx, -18, 7);
  blush(ctx, 18, 7);
}

function paintKaigaran(ctx) {
  // 貝殻を背負ったヤドカリ。渦巻き模様の殻と、ちょこんと出た小さなはさみが特徴。
  glossOval(ctx, -24, 10, 8, 12, "#f0c896", "#e2965a", "#a85f2c", 3);
  glossOval(ctx, 24, 10, 8, 12, "#f0c896", "#e2965a", "#a85f2c", 3);
  tri(ctx, -28, 4, -20, -2, -22, 10, "#f0c896", "#a85f2c", 2);
  tri(ctx, 28, 4, 20, -2, 22, 10, "#f0c896", "#a85f2c", 2);

  glossOval(ctx, 0, 6, 26, 24, "#f2a565", "#c97a3a", "#7a4620", 6);
  ctx.strokeStyle = "rgba(122, 70, 32, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.quadraticCurveTo(14, -8, 12, 4);
  ctx.quadraticCurveTo(10, 14, 0, 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 6, 6, 0, Math.PI * 1.5);
  ctx.stroke();
  shine(ctx, -12, -6, 12, 7);

  glossOval(ctx, 0, 18, 15, 10, "#ffe6c2", "#f2c48a", "#7a4620", 2.5);
  eyeBig(ctx, -9, 4, 7);
  eyeBig(ctx, 9, 4, 7);
  smile(ctx, 0, 15, 3.6);
  blush(ctx, -19, 12);
  blush(ctx, 19, 12);
}

function paintAwairuka(ctx) {
  // あわを吹きながら跳ねるイルカ。すべらかな体と、背びれ・尾びれが目印。
  ctx.save();
  ctx.globalAlpha = 0.55;
  for (const [bx, by, r] of [[-30, -18, 4], [-24, -28, 3], [26, -22, 3.5], [32, -12, 2.6]]) {
    circle(ctx, bx, by, r, "#eaf9ff", "#8fd0ee", 1.5);
  }
  ctx.restore();

  glossOval(ctx, 0, -30, 8, 12, "#8fd8ec", "#3f9ec2", "#1f5e78", 3);

  glossOval(ctx, 0, 4, 28, 22, "#8fd8ec", "#5ab6d9", "#1f5e78", 6);
  glossOval(ctx, -30, 10, 11, 7, "#8fd8ec", "#5ab6d9", "#1f5e78", 3);
  glossOval(ctx, 30, 10, 11, 7, "#8fd8ec", "#5ab6d9", "#1f5e78", 3);
  tri(ctx, -8, 24, 8, 24, 0, 36, "#5ab6d9", "#1f5e78", 2);

  shine(ctx, -12, -6, 12, 7);
  glossOval(ctx, 0, 14, 15, 10, "#eaf9ff", "#c3ecff", "#1f5e78", 2.5);
  eyeBig(ctx, -9, 0, 7);
  eyeBig(ctx, 9, 0, 7);
  smile(ctx, 0, 11, 4);
  blush(ctx, -18, 8);
  blush(ctx, 18, 8);
}

function paintHikariebi(ctx) {
  // 発光する小さなエビ。背中が曲がり、しっぽの先がぼんやり光る。
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#c9fff0";
  for (const [gx, gy, r] of [[24, 20, 6], [30, 12, 4], [18, 28, 4]]) {
    circle(ctx, gx, gy, r, "#c9fff0", null);
  }
  ctx.restore();

  ctx.strokeStyle = "#3fa88a";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-6, -20); ctx.quadraticCurveTo(-16, -26, -14, -34);
  ctx.moveTo(4, -20); ctx.quadraticCurveTo(10, -28, 8, -36);
  ctx.stroke();

  glossOval(ctx, -2, -4, 22, 26, "#c9fff0", "#8fe8d0", "#3fa88a", 5);
  tri(ctx, 6, 20, 22, 16, 20, 30, "#8fe8d0", "#3fa88a", 2);
  tri(ctx, 6, 20, 20, 30, 8, 32, "#8fe8d0", "#3fa88a", 2);
  ctx.fillStyle = "#fff6c2";
  circle(ctx, 22, 22, 3, "#fff6c2", null);

  ctx.strokeStyle = "rgba(63, 168, 138, 0.5)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-16, -8); ctx.lineTo(12, -2);
  ctx.moveTo(-16, 2); ctx.lineTo(10, 8);
  ctx.stroke();

  shine(ctx, -10, -10, 11, 6);
  glossOval(ctx, -2, 8, 13, 9, "#eafff8", "#c9fff0", "#3fa88a", 2.2);
  eyeBig(ctx, -8, -6, 6.5);
  eyeBig(ctx, 4, -6, 6.5);
  smile(ctx, -2, 10, 3.4);
  blush(ctx, -16, 6);
}

function paintYamiankou(ctx) {
  // 深海に潜むアンコウ。頭の上のちょうちんがぼんやり光り、丸くて平たい体つき。
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "#fff1a0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -38, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = "#2b2440";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -20); ctx.quadraticCurveTo(-2, -34, 0, -38);
  ctx.stroke();
  glossCircle(ctx, 0, -38, 6, "#fff1a0", "#e8c95a", "#8a6b1c", 2);

  glossOval(ctx, -30, 10, 10, 7, "#6a5590", "#4a3a68", "#241c38", 3);
  glossOval(ctx, 30, 10, 10, 7, "#6a5590", "#4a3a68", "#241c38", 3);

  glossOval(ctx, 0, 6, 30, 25, "#6a5590", "#4a3a68", "#241c38", 6);
  ctx.strokeStyle = "rgba(36, 28, 56, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-20, -6); ctx.quadraticCurveTo(-4, 4, -16, 22);
  ctx.moveTo(20, -6); ctx.quadraticCurveTo(4, 4, 15, 20);
  ctx.stroke();
  shine(ctx, -13, -4, 12, 7);

  ctx.fillStyle = "#241c38";
  ctx.strokeStyle = "#120e1c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, -8);
  ctx.quadraticCurveTo(0, 0, 16, -8);
  ctx.lineTo(14, 0);
  ctx.quadraticCurveTo(0, 6, -14, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f2ead6";
  for (const fx of [-11, -2, 7]) {
    ctx.beginPath();
    ctx.moveTo(fx, -6);
    ctx.lineTo(fx + 3, -6);
    ctx.lineTo(fx + 1.5, -1);
    ctx.closePath();
    ctx.fill();
  }

  glossOval(ctx, 0, 20, 14, 9, "#8a75b0", "#6a5590", "#241c38", 2.2);
  eyeBig(ctx, -9, 6, 6.5);
  eyeBig(ctx, 9, 6, 6.5);
  blush(ctx, -18, 12);
  blush(ctx, 18, 12);
}

function paintYukimaro(ctx) {
  // 雪の衣をまとったうさぎ。ふわふわの毛並みと長い耳が特徴。
  ctx.save();
  ctx.globalAlpha = 0.7;
  glossOval(ctx, -10, -34, 8, 20, "#ffffff", "#dcedf7", "#a8c8d8", 3);
  glossOval(ctx, 10, -34, 8, 20, "#ffffff", "#dcedf7", "#a8c8d8", 3);
  ctx.restore();
  glossOval(ctx, -10, -30, 5, 13, "#f7c9d8", "#eaa8c0", null, 0);
  glossOval(ctx, 10, -30, 5, 13, "#f7c9d8", "#eaa8c0", null, 0);

  glossOval(ctx, -26, 20, 9, 6, "#ffffff", "#dcedf7", "#a8c8d8", 2.5);
  glossOval(ctx, 26, 20, 9, 6, "#ffffff", "#dcedf7", "#a8c8d8", 2.5);

  glossOval(ctx, 0, 4, 27, 26, "#ffffff", "#eef5fb", "#a8c8d8", 6);
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (const [fx, fy] of [[-16, -4], [16, -4], [0, 16]]) {
    circle(ctx, fx, fy, 3.5, "#ffffff", null);
  }
  ctx.restore();
  shine(ctx, -13, -8, 12, 7);

  glossOval(ctx, 0, 16, 14, 10, "#ffffff", "#f2f8fc", "#a8c8d8", 2.2);
  eyeSleepy(ctx, -9, 2, 7);
  eyeSleepy(ctx, 9, 2, 7);
  tri(ctx, -4, 10, 4, 10, 0, 15, "#f5a8c0", null);
  smile(ctx, 0, 18, 3.4);
  blush(ctx, -18, 10);
  blush(ctx, 18, 10);
}

function paintKooritsumu(ctx) {
  // つららの結晶体。角ばった氷のパーツが集まってできた体つき。
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = "#eafcff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 33, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#eafcff";
  ctx.strokeStyle = "#3f8aa8";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  tri(ctx, 0, -36, 8, -18, -8, -18, "#eafcff", "#3f8aa8", 2);
  tri(ctx, -30, -8, -18, -18, -14, 0, "#eafcff", "#3f8aa8", 2);
  tri(ctx, 30, -8, 18, -18, 14, 0, "#eafcff", "#3f8aa8", 2);

  glossOval(ctx, 0, 6, 27, 26, "#c9f0fc", "#8fd8ec", "#3f8aa8", 6);
  ctx.strokeStyle = "rgba(63, 138, 168, 0.5)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -18); ctx.lineTo(0, 30);
  ctx.moveTo(-18, -4); ctx.lineTo(18, 12);
  ctx.stroke();
  shine(ctx, -13, -4, 12, 7);

  glossOval(ctx, 0, 18, 14, 10, "#eafcff", "#c9f0fc", "#3f8aa8", 2.2);
  eyeSleepy(ctx, -9, 4, 7);
  eyeSleepy(ctx, 9, 4, 7);
  smile(ctx, 0, 20, 3.4);
  blush(ctx, -18, 12);
  blush(ctx, 18, 12);
}

function paintPengiri(ctx) {
  // そりに乗って滑るペンギン。丸い翼を横に広げ、足元にそりの板がある。
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = "#dcedf7";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-30, 30); ctx.lineTo(-14, 30);
  ctx.moveTo(14, 30); ctx.lineTo(30, 30);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#c9722a";
  ctx.strokeStyle = "#8a4e18";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.roundRect(-24, 26, 48, 7, 3);
  ctx.fill();
  ctx.stroke();

  glossOval(ctx, -24, 8, 10, 18, "#3a4a5a", "#232d38", "#141a20", 3.5);
  glossOval(ctx, 24, 8, 10, 18, "#3a4a5a", "#232d38", "#141a20", 3.5);

  glossOval(ctx, 0, 2, 26, 30, "#3a4a5a", "#232d38", "#141a20", 6);
  glossOval(ctx, 0, 10, 16, 20, "#eef5fb", "#dcedf7", "#141a20", 3);
  shine(ctx, -12, -8, 12, 7);

  glossOval(ctx, 0, -20, 15, 15, "#3a4a5a", "#232d38", "#141a20", 5);
  glossOval(ctx, 0, -14, 9, 10, "#eef5fb", "#dcedf7", "#141a20", 2.2);
  tri(ctx, -3, -13, 3, -13, 0, -6, "#e8a23a", "#8a4e18", 1.8);
  eyeSleepy(ctx, -6, -19, 6);
  eyeSleepy(ctx, 6, -19, 6);
  blush(ctx, -14, -13);
  blush(ctx, 14, -13);
}

function paintYukibouzu(ctx) {
  // 吹雪の中を漂う半透明の精霊。裾がゆらめき、まわりに粉雪が舞う。
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (const [sx, sy, r] of [[-28, -20, 2.5], [26, -26, 2], [-22, 10, 2], [24, 8, 2.5], [0, -32, 2]]) {
    circle(ctx, sx, sy, r, "#ffffff", null);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "#f5fafd";
  ctx.strokeStyle = "#a8c8d8";
  ctx.lineWidth = 3.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, -4, 27, Math.PI, Math.PI * 2);
  ctx.lineTo(27, 14);
  ctx.quadraticCurveTo(19, 30, 13, 16);
  ctx.quadraticCurveTo(6, 30, 0, 16);
  ctx.quadraticCurveTo(-6, 30, -13, 16);
  ctx.quadraticCurveTo(-19, 30, -27, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  shine(ctx, -12, -12, 12, 7);
  oval(ctx, -9, -9, 5, 8, "#3a6f8f", null);
  oval(ctx, 9, -9, 5, 8, "#3a6f8f", null);
  circle(ctx, -10.5, -12, 1.8, "#ffffff", null);
  circle(ctx, 7.5, -12, 1.8, "#ffffff", null);
  smile(ctx, 0, 6, 4);
  blush(ctx, -18, 2);
  blush(ctx, 18, 2);
}

function paintSabotenko(ctx) {
  // トゲトゲのさぼてん。丸い腕を左右に広げ、頭にちいさな花を咲かせる。
  glossOval(ctx, -28, 4, 11, 22, "#7ed85c", "#4a8038", "#2f5624", 4);
  glossOval(ctx, 28, 4, 11, 22, "#7ed85c", "#4a8038", "#2f5624", 4);

  glossOval(ctx, 0, 4, 27, 30, "#8ee868", "#5a9a4a", "#2f5624", 6.5);
  ctx.strokeStyle = "rgba(47, 86, 36, 0.55)";
  ctx.lineWidth = 1.6;
  for (const x of [-14, 0, 14]) {
    ctx.beginPath();
    ctx.moveTo(x, -18);
    ctx.lineTo(x, 26);
    ctx.stroke();
  }
  ctx.fillStyle = "#2f5624";
  for (const [tx, ty] of [[-14, -10], [0, -16], [14, -10], [-14, 6], [0, 10], [14, 6], [-14, 20], [14, 20]]) {
    tri(ctx, tx - 2, ty, tx + 2, ty, tx, ty - 6, "#2f5624", null);
  }
  shine(ctx, -13, -6, 12, 7);

  petalFlower(ctx, 0, -30, 9, "#f78fb3", "#ffe07a");

  glossOval(ctx, 0, 18, 14, 10, "#c9f5a8", "#a8e07a", "#2f5624", 2.5);
  eye(ctx, -9, 4, 7);
  eye(ctx, 9, 4, 7);
  smile(ctx, 0, 16, 3.6);
  blush(ctx, -18, 10);
  blush(ctx, 18, 10);
}

function paintSunasasori(ctx) {
  // 砂ばのさそり。大きなはさみと、くるりと丸まったしっぽが特徴。
  ctx.strokeStyle = "#8a621c";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(6, -18); ctx.quadraticCurveTo(20, -30, 30, -24); ctx.quadraticCurveTo(28, -14, 20, -16);
  ctx.stroke();
  glossCircle(ctx, 26, -22, 8, "#f0c46a", "#d4a24a", "#8a621c", 2.5);

  for (const side of [-1, 1]) {
    glossOval(ctx, side * 30, 12, 11, 8, "#f0c46a", "#d4a24a", "#8a621c", 3);
    tri(ctx, side * 38, 4, side * 44, 12, side * 34, 16, "#d4a24a", "#8a621c", 1.8);
  }

  glossOval(ctx, 0, 4, 27, 24, "#f0c46a", "#d4a24a", "#8a621c", 6);
  ctx.strokeStyle = "rgba(138, 98, 28, 0.5)";
  ctx.lineWidth = 2;
  for (const y of [-6, 6, 16]) {
    ctx.beginPath();
    ctx.moveTo(-20, y);
    ctx.quadraticCurveTo(0, y + 5, 20, y);
    ctx.stroke();
  }
  shine(ctx, -13, -6, 12, 7);

  glossOval(ctx, 0, 16, 14, 9, "#fff0c9", "#f0d99a", "#8a621c", 2.2);
  eyeDot(ctx, -9, 2, 7);
  eyeDot(ctx, 9, 2, 7);
  smile(ctx, 0, 14, 3.4);
  blush(ctx, -18, 8);
  blush(ctx, 18, 8);
}

function paintRakudan(ctx) {
  // ふたつのこぶを持つらくだ。長い首とまつげの長い目が特徴。
  glossOval(ctx, -16, 12, 8, 20, "#c9a868", "#a8863f", "#6b5122", 3.5);
  glossOval(ctx, 16, 12, 8, 20, "#c9a868", "#a8863f", "#6b5122", 3.5);

  glossOval(ctx, -12, -8, 13, 12, "#dcc088", "#c9a868", "#6b5122", 4);
  glossOval(ctx, 10, -12, 13, 12, "#dcc088", "#c9a868", "#6b5122", 4);

  glossOval(ctx, 0, 10, 27, 22, "#dcc088", "#c9a868", "#6b5122", 6);
  shine(ctx, -13, -2, 12, 7);

  ctx.save();
  ctx.translate(20, -20);
  ctx.rotate(-0.3);
  glossOval(ctx, 0, 0, 8, 18, "#dcc088", "#c9a868", "#6b5122", 3);
  ctx.restore();

  glossCircle(ctx, 22, -34, 11, "#eed9a8", "#dcc088", "#6b5122", 3);
  ctx.strokeStyle = "#8a6b32";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  for (const [ex, ey, r, rot] of [[16, -38, 6.5, -0.3], [28, -38, 6.5, 0.3]]) {
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(-3, 2); ctx.lineTo(-6, -4);
    ctx.moveTo(0, 2); ctx.lineTo(-1, -5);
    ctx.moveTo(3, 2); ctx.lineTo(4, -4);
    ctx.stroke();
    ctx.restore();
  }
  eyeDot(ctx, 17, -34, 5.5);
  eyeDot(ctx, 27, -34, 5.5);
  smile(ctx, 22, -28, 3);
  blush(ctx, 10, -30);

  glossOval(ctx, 0, 22, 14, 9, "#f2e4bc", "#eed9a8", "#6b5122", 2.2);
}

function paintSunamiira(ctx) {
  // いにしえの布をまとったミイラ。ぐるぐる巻きの包帯とちいさな金の飾り。
  glossOval(ctx, -22, 12, 9, 18, "#e8dcb8", "#d8c89a", "#8a7550", 3);
  glossOval(ctx, 22, 12, 9, 18, "#e8dcb8", "#d8c89a", "#8a7550", 3);

  glossOval(ctx, 0, 4, 26, 28, "#e8dcb8", "#d8c89a", "#8a7550", 6);
  ctx.strokeStyle = "rgba(138, 117, 80, 0.6)";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-20, -10); ctx.quadraticCurveTo(0, -4, 20, -10);
  ctx.moveTo(-20, 4); ctx.quadraticCurveTo(0, 10, 20, 4);
  ctx.moveTo(-20, 18); ctx.quadraticCurveTo(0, 24, 20, 18);
  ctx.stroke();
  shine(ctx, -13, -6, 12, 7);

  ctx.fillStyle = "#e8c34a";
  ctx.strokeStyle = "#8a621c";
  ctx.lineWidth = 1.6;
  circle(ctx, 0, -26, 4, "#e8c34a", "#8a621c", 1.6);
  ctx.beginPath();
  ctx.moveTo(-3, -26); ctx.lineTo(3, -26);
  ctx.moveTo(0, -29); ctx.lineTo(0, -23);
  ctx.stroke();

  glossOval(ctx, 0, 4, 15, 10, "#3a3020", "#241c14", "#8a7550", 2.2);
  eyeHollow(ctx, -8, 2, 6);
  eyeHollow(ctx, 8, 2, 6);
  blush(ctx, -18, 8);
  blush(ctx, 18, 8);
}

function paintSunaNushi(ctx) {
  // 砂漠ワールドのボス。砂に埋もれた巨大な獣。金色のオーラと
  // 硬そうな甲羅状の背中、砂けむりを巻き上げる爪が特徴。
  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10;
    const r = 47 + (i % 2) * 8;
    ctx.strokeStyle = i % 2 ? "#f5dc8a" : "#c9922a";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 14);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#f5dc8a";
  ctx.lineWidth = 2;
  for (const r of [53, 65]) {
    ctx.beginPath();
    ctx.arc(0, -2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 背中の突起
  ctx.fillStyle = "#c9922a";
  ctx.strokeStyle = "#6b4e18";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  for (const [tx, ty] of [[-24, -34], [0, -42], [24, -34]]) {
    tri(ctx, tx - 9, ty + 10, tx + 9, ty + 10, tx, ty - 6, "#c9922a", "#6b4e18", 2);
  }

  // 巨体
  glossOval(ctx, 0, 6, 45, 40, "#e8c34a", "#c9922a", "#6b4e18", 7.5);
  glossOval(ctx, 0, 18, 24, 18, "#f5e0a0", "#e8c34a", "#6b4e18", 4);
  shine(ctx, -19, -14, 17, 10);

  // 太い前脚
  glossOval(ctx, -41, 26, 13, 20, "#c9922a", "#8a6620", "#6b4e18", 4.5);
  glossOval(ctx, 41, 26, 13, 20, "#c9922a", "#8a6620", "#6b4e18", 4.5);
  for (const side of [-1, 1]) {
    tri(ctx, side * 38, 40, side * 46, 50, side * 30, 48, "#f5e0a0", "#6b4e18", 2);
  }

  // 足元の砂けむり
  ctx.save();
  ctx.globalAlpha = 0.4;
  for (const [bx, by, r] of [[-38, 44, 6], [38, 46, 5], [0, 52, 5.5]]) {
    circle(ctx, bx, by, r, "#f5dc8a", "#c9922a", 1.4);
  }
  ctx.restore();

  // 顔。琥珀色の目。
  ctx.fillStyle = "#f5e0a0";
  ctx.strokeStyle = "#6b4e18";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(-16, -8, 9, 6.5, -0.16, 0, Math.PI * 2);
  ctx.ellipse(16, -8, 9, 6.5, 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  circle(ctx, -14, -7, 4, "#8a6620", null);
  circle(ctx, 14, -7, 4, "#8a6620", null);
  circle(ctx, -14, -7, 1.8, "#3a2c10", null);
  circle(ctx, 14, -7, 1.8, "#3a2c10", null);

  starSpark(ctx, -35, -33, 5.5, "#f5dc8a");
  starSpark(ctx, 36, -31, 5, "#f5dc8a");
}

function gear(ctx, x, y, r, teeth, fill, line) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = fill;
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a = (Math.PI * 2 * i) / teeth;
    const a2 = a + Math.PI / teeth;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a) * r * 1.22, Math.sin(a) * r * 1.22);
    ctx.lineTo(Math.cos(a2) * r * 1.22, Math.sin(a2) * r * 1.22);
    ctx.lineTo(Math.cos(a2) * r, Math.sin(a2) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  circle(ctx, 0, 0, r * 0.4, line, null);
  ctx.restore();
}

// --- 別スタイルのキャラ群（フラット/輪郭強め）: 見た目のみ。ステータス等はシステム側で設定 ---
function paintObako(ctx) {
  // ゆうれい系: 半透明・下がゆらめく・ツヤ無しのフラット。
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "#ece8ff";
  ctx.strokeStyle = "#5f4f96";
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0, 26, Math.PI, Math.PI * 2);
  ctx.lineTo(26, 12);
  ctx.quadraticCurveTo(19, 26, 13, 14);
  ctx.quadraticCurveTo(6, 26, 0, 14);
  ctx.quadraticCurveTo(-6, 26, -13, 14);
  ctx.quadraticCurveTo(-19, 26, -26, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  oval(ctx, -9, -5, 4.5, 7, "#5f4f96", null);
  oval(ctx, 9, -5, 4.5, 7, "#5f4f96", null);
  circle(ctx, -10.5, -8, 1.6, "#ffffff", null);
  circle(ctx, 7.5, -8, 1.6, "#ffffff", null);
  circle(ctx, 0, 7, 3, "#5f4f96", null);
  ctx.globalAlpha = 0.55;
  circle(ctx, -31, -18, 3, "#ece8ff", "#5f4f96", 1.5);
  circle(ctx, 31, -21, 2.4, "#ece8ff", "#5f4f96", 1.5);
  ctx.globalAlpha = 1;
}

function paintKurista(ctx) {
  // 結晶系: 角ばったファセット、フラットなセル塗り。
  const body = "#8fe3f2";
  const dark = "#3f9bc0";
  const line = "#1f5e78";
  ctx.fillStyle = body;
  ctx.strokeStyle = line;
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(0, -32);
  ctx.lineTo(24, -10);
  ctx.lineTo(18, 26);
  ctx.lineTo(-18, 26);
  ctx.lineTo(-24, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  tri(ctx, 0, -32, 24, -10, 0, -6, dark, line, 2);
  tri(ctx, 0, -6, 18, 26, -18, 26, dark, line, 2);
  tri(ctx, -30, -20, -24, -8, -34, -8, body, line, 2);
  tri(ctx, 30, -22, 24, -10, 34, -10, body, line, 2);
  ctx.fillStyle = "#12303c";
  ctx.beginPath(); ctx.moveTo(-13, 1); ctx.lineTo(-4, -2); ctx.lineTo(-8, 7); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(13, 1); ctx.lineTo(4, -2); ctx.lineTo(8, 7); ctx.closePath(); ctx.fill();
  smile(ctx, 0, 12, 4);
  starSpark(ctx, 9, -16, 5, "#eafbff");
}

function paintHagumon(ctx) {
  // ぜんまい仕掛けの虫: 金属・歯車のメカ系。
  const metal = "#cabd8f";
  const dark = "#8a7a4e";
  const line = "#4b3f22";
  gear(ctx, 0, -4, 18, 8, "#b7a56f", line);
  oval(ctx, 0, 10, 20, 15, metal, line, 4);
  oval(ctx, 0, 10, 11, 8, dark, line, 2);
  circle(ctx, 0, -20, 11, metal, line, 4);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-6, -28); ctx.lineTo(-11, -38);
  ctx.moveTo(6, -28); ctx.lineTo(11, -38);
  ctx.stroke();
  circle(ctx, -12, -40, 3, metal, line, 2);
  circle(ctx, 12, -40, 3, metal, line, 2);
  circle(ctx, -4, -20, 3.2, "#2b2b33", null);
  circle(ctx, 4, -20, 3.2, "#2b2b33", null);
  circle(ctx, -3, -21, 1.1, "#ffffff", null);
  circle(ctx, 5, -21, 1.1, "#ffffff", null);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-16, 8); ctx.lineTo(-27, 14);
  ctx.moveTo(-16, 15); ctx.lineTo(-27, 21);
  ctx.moveTo(16, 8); ctx.lineTo(27, 14);
  ctx.moveTo(16, 15); ctx.lineTo(27, 21);
  ctx.stroke();
}

function paintHagurumaru(ctx) {
  // 頑丈な歯車ロボット。大きな歯車の胸当てと、太い金属の腕が特徴。
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(0, 34, 26, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  glossOval(ctx, -28, 10, 10, 18, "#6a6a78", "#4a4a56", "#2b2b33", 3.5);
  glossOval(ctx, 28, 10, 10, 18, "#6a6a78", "#4a4a56", "#2b2b33", 3.5);

  glossOval(ctx, 0, 6, 27, 28, "#a8a8b8", "#8a8a9a", "#4a4a56", 6);
  gear(ctx, 0, 8, 15, 8, "#c9c9d6", "#4a4a56");
  circle(ctx, 0, 8, 5, "#6a6a78", "#2b2b33", 2);
  shine(ctx, -13, -6, 12, 7);

  glossOval(ctx, 0, -22, 15, 14, "#a8a8b8", "#8a8a9a", "#4a4a56", 5);
  glossOval(ctx, 0, -18, 10, 8, "#dcdce4", "#c9c9d6", "#4a4a56", 2.2);
  circle(ctx, -6, -18, 3, "#3a5a7a", null);
  circle(ctx, 6, -18, 3, "#3a5a7a", null);
  circle(ctx, -6.5, -19, 1, "#eafcff", null);
  circle(ctx, 5.5, -19, 1, "#eafcff", null);

  glossOval(ctx, 0, 22, 14, 8, "#dcdce4", "#c9c9d6", "#4a4a56", 2.2);
  blush(ctx, -18, 18);
  blush(ctx, 18, 18);
}

function paintSparkun(ctx) {
  // 電気の火花をまとった小さな球体。まわりに稲妻の飾りが飛び散る。
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = "#fff2a0";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  for (const [zx, zy, rot] of [[-32, -12, -0.3], [30, -18, 0.4], [-26, 22, 0.6], [28, 20, -0.5]]) {
    ctx.save();
    ctx.translate(zx, zy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(-4, -6); ctx.lineTo(2, -1); ctx.lineTo(-2, 1); ctx.lineTo(4, 6);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  glossCircle(ctx, 0, 4, 27, "#fff4b8", "#f0d040", "#a8842a", 6);
  ctx.strokeStyle = "rgba(168, 132, 42, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, -18); ctx.lineTo(2, -2); ctx.lineTo(-4, 2); ctx.lineTo(6, 20);
  ctx.stroke();
  shine(ctx, -13, -6, 12, 7);

  glossOval(ctx, 0, 16, 14, 9, "#fffbe0", "#fff0a0", "#a8842a", 2.2);
  eyeStar(ctx, -9, 2, 7);
  eyeStar(ctx, 9, 2, 7);
  smile(ctx, 0, 14, 3.4);
  blush(ctx, -18, 8);
  blush(ctx, 18, 8);
}

function paintKarakuribat(ctx) {
  // からくり仕掛けのこうもり。金属の羽根が扇状に開き、関節がぎこちなく光る。
  ctx.fillStyle = "#5a5a6a";
  ctx.strokeStyle = "#2b2b33";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.beginPath();
    ctx.moveTo(10, -4);
    ctx.lineTo(38, -20);
    ctx.lineTo(34, -4);
    ctx.lineTo(40, 6);
    ctx.lineTo(30, 6);
    ctx.lineTo(32, 16);
    ctx.lineTo(14, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(43,43,51,0.5)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(14, 0); ctx.lineTo(34, -12);
    ctx.moveTo(16, 6); ctx.lineTo(30, 4);
    ctx.stroke();
    ctx.strokeStyle = "#2b2b33";
    ctx.lineWidth = 2.5;
    ctx.restore();
  }

  glossOval(ctx, 0, 6, 20, 22, "#6a6a78", "#4a4a56", "#2b2b33", 5.5);
  ctx.strokeStyle = "rgba(43,43,51,0.5)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -8); ctx.lineTo(0, 26);
  ctx.stroke();
  shine(ctx, -10, -2, 10, 6);

  glossCircle(ctx, -10, -18, 6.5, "#c9c9d6", "#8a8a9a", "#2b2b33", 2.5);
  glossCircle(ctx, 10, -18, 6.5, "#c9c9d6", "#8a8a9a", "#2b2b33", 2.5);
  circle(ctx, -10, -18, 3, "#e04a4a", null);
  circle(ctx, 10, -18, 3, "#e04a4a", null);
  circle(ctx, -11, -19, 1, "#ffb0b0", null);
  circle(ctx, 9, -19, 1, "#ffb0b0", null);

  glossOval(ctx, 0, 14, 12, 8, "#dcdce4", "#c9c9d6", "#2b2b33", 2);
}

function paintPaipon(ctx) {
  // 配管でできた頑丈なロボット。丸いボイラー胴体と、太い配管の腕。
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(0, 34, 26, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#3a4a2e";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 20, -4);
    ctx.lineTo(side * 34, 6);
    ctx.lineTo(side * 30, 24);
    ctx.stroke();
  }
  ctx.strokeStyle = "#8a9a6a";
  ctx.lineWidth = 4;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 20, -4);
    ctx.lineTo(side * 34, 6);
    ctx.lineTo(side * 30, 24);
    ctx.stroke();
  }

  glossOval(ctx, 0, 6, 27, 28, "#8a9a6a", "#6a7a5a", "#3a4a2e", 6);
  ctx.strokeStyle = "rgba(58, 74, 46, 0.6)";
  ctx.lineWidth = 2;
  for (const y of [-8, 4, 16]) {
    ctx.beginPath();
    ctx.moveTo(-20, y);
    ctx.lineTo(20, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#4a5a3a";
  circle(ctx, -16, -8, 2.5, "#4a5a3a", "#2b3520", 1);
  circle(ctx, 16, -8, 2.5, "#4a5a3a", "#2b3520", 1);
  circle(ctx, -16, 4, 2.5, "#4a5a3a", "#2b3520", 1);
  circle(ctx, 16, 4, 2.5, "#4a5a3a", "#2b3520", 1);
  shine(ctx, -13, -8, 12, 7);

  ctx.fillStyle = "#a8b88a";
  ctx.strokeStyle = "#3a4a2e";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, -30, 12, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  glossOval(ctx, 0, -18, 10, 8, "#dcdce4", "#c9c9d6", "#3a4a2e", 2.2);
  circle(ctx, -6, -18, 3, "#3a5a7a", null);
  circle(ctx, 6, -18, 3, "#3a5a7a", null);
  circle(ctx, -6.5, -19, 1, "#eafcff", null);
  circle(ctx, 5.5, -19, 1, "#eafcff", null);

  glossOval(ctx, 0, 20, 14, 8, "#dcdce4", "#c9c9d6", "#3a4a2e", 2.2);
}

function paintKoujouNushi(ctx) {
  // 工場ワールドのボス。歯車とパイプが組み合わさった巨大な機械獣。
  // 赤い警告ランプが点滅するような光の輪で威圧感を出す。
  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10;
    const r = 47 + (i % 2) * 8;
    ctx.strokeStyle = i % 2 ? "#f0a0a0" : "#8a8a9a";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 14);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#f0a0a0";
  ctx.lineWidth = 2;
  for (const r of [53, 65]) {
    ctx.beginPath();
    ctx.arc(0, -2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 背中の歯車
  gear(ctx, -30, -32, 12, 8, "#8a8a9a", "#2b2b33");
  gear(ctx, 30, -32, 12, 8, "#8a8a9a", "#2b2b33");
  gear(ctx, 0, -44, 10, 8, "#a8a8b8", "#2b2b33");

  // 巨体
  glossOval(ctx, 0, 6, 45, 40, "#a8a8b8", "#6a6a78", "#2b2b33", 7.5);
  glossOval(ctx, 0, 18, 24, 18, "#dcdce4", "#a8a8b8", "#2b2b33", 4);
  shine(ctx, -19, -14, 17, 10);

  // 太い前脚
  glossOval(ctx, -41, 26, 13, 20, "#6a6a78", "#4a4a56", "#2b2b33", 4.5);
  glossOval(ctx, 41, 26, 13, 20, "#6a6a78", "#4a4a56", "#2b2b33", 4.5);
  for (const side of [-1, 1]) {
    tri(ctx, side * 38, 40, side * 46, 50, side * 30, 48, "#dcdce4", "#2b2b33", 2);
  }

  // 警告ランプ
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (const [bx, by, r] of [[-38, 44, 5], [38, 46, 4], [0, 52, 4.5]]) {
    circle(ctx, bx, by, r, "#f0a0a0", "#a83a3a", 1.4);
  }
  ctx.restore();

  // 顔。赤く光る目。
  ctx.fillStyle = "#dcdce4";
  ctx.strokeStyle = "#2b2b33";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(-16, -8, 9, 6.5, -0.16, 0, Math.PI * 2);
  ctx.ellipse(16, -8, 9, 6.5, 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  circle(ctx, -14, -7, 4, "#e04a4a", null);
  circle(ctx, 14, -7, 4, "#e04a4a", null);
  circle(ctx, -14, -7, 1.8, "#5a1010", null);
  circle(ctx, 14, -7, 1.8, "#5a1010", null);

  starSpark(ctx, -35, -33, 5.5, "#f0a0a0");
  starSpark(ctx, 36, -31, 5, "#f0a0a0");
}

function paintAkumakko(ctx) {
  // 小さな悪魔。とがった翼と尻尾、いたずらっぽい笑顔が特徴。
  ctx.fillStyle = "#3a1024";
  ctx.strokeStyle = "#1a0812";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.beginPath();
    ctx.moveTo(14, -6);
    ctx.lineTo(32, -16);
    ctx.lineTo(26, -2);
    ctx.lineTo(34, 8);
    ctx.lineTo(18, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = "#1a0812";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 28); ctx.quadraticCurveTo(14, 34, 12, 44);
  ctx.stroke();
  tri(ctx, 8, 40, 18, 40, 13, 48, "#5a1a3a", "#1a0812", 1.6);

  glossOval(ctx, 0, 4, 24, 24, "#8a2a5a", "#5a1a3a", "#1a0812", 5.5);
  shine(ctx, -11, -4, 11, 6);

  ctx.fillStyle = "#3a0f1e";
  tri(ctx, -12, -20, -6, -8, -18, -6, "#3a0f1e", "#1a0812", 1.6);
  tri(ctx, 12, -20, 6, -8, 18, -6, "#3a0f1e", "#1a0812", 1.6);

  glossOval(ctx, 0, 14, 13, 8, "#e8c9d8", "#d89ab8", "#1a0812", 2);
  eyeGlare(ctx, -8, 0, 6.5);
  eyeGlare(ctx, 8, 0, 6.5);
  ctx.strokeStyle = "#1a0812";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 10, 6, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
}

function paintKokushou(ctx) {
  // 闇の鎧をまとった重戦士。角ばった甲冑と、まっすぐな視線が特徴。
  glossOval(ctx, -26, 8, 10, 20, "#4a3a5a", "#2b2038", "#150e1c", 4);
  glossOval(ctx, 26, 8, 10, 20, "#4a3a5a", "#2b2038", "#150e1c", 4);

  ctx.fillStyle = "#3a2c48";
  ctx.strokeStyle = "#150e1c";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-24, -12);
  ctx.lineTo(0, -22);
  ctx.lineTo(24, -12);
  ctx.lineTo(24, 26);
  ctx.lineTo(-24, 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(21, 14, 28, 0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-20, -4); ctx.lineTo(20, -4);
  ctx.moveTo(-20, 10); ctx.lineTo(20, 10);
  ctx.stroke();
  shine(ctx, -12, -8, 11, 6);

  ctx.fillStyle = "#6a5580";
  tri(ctx, -6, -20, 6, -20, 0, -30, "#6a5580", "#150e1c", 1.8);

  glossOval(ctx, 0, 2, 15, 9, "#0d0812", "#150e1c", "#4a3a5a", 2.2);
  circle(ctx, -7, 1, 3, "#c9a0e8", null);
  circle(ctx, 7, 1, 3, "#c9a0e8", null);
}

function paintMaou(ctx) {
  // 魔王城ワールドの最終ボス。黒紫のマントと巨大な角、
  // 深紅の瞳が全てを見透かすような威圧感を放つ。
  ctx.save();
  ctx.globalAlpha = 0.24;
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 * i) / 12;
    const r = 48 + (i % 2) * 9;
    ctx.strokeStyle = i % 2 ? "#e04a4a" : "#3a2050";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 14);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "#e04a4a";
  ctx.lineWidth = 2.2;
  for (const r of [54, 67]) {
    ctx.beginPath();
    ctx.arc(0, -2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 巨大な角
  ctx.fillStyle = "#1a1024";
  ctx.strokeStyle = "#0a0612";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.beginPath();
    ctx.moveTo(16, -30);
    ctx.quadraticCurveTo(32, -56, 22, -74);
    ctx.quadraticCurveTo(24, -50, 10, -34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // マント
  glossOval(ctx, 0, 20, 48, 34, "#2b1a3a", "#150c20", "#0a0612", 6);

  // 巨体
  glossOval(ctx, 0, 4, 44, 39, "#5a3a7a", "#2b1a3a", "#0a0612", 7.5);
  glossOval(ctx, 0, 16, 23, 17, "#8a5fc0", "#5a3a7a", "#0a0612", 4);
  shine(ctx, -18, -14, 17, 9);

  // 太い腕
  glossOval(ctx, -40, 12, 13, 22, "#2b1a3a", "#150c20", "#0a0612", 4.5);
  glossOval(ctx, 40, 12, 13, 22, "#2b1a3a", "#150c20", "#0a0612", 4.5);
  for (const side of [-1, 1]) {
    tri(ctx, side * 37, 28, side * 45, 38, side * 29, 36, "#8a5fc0", "#0a0612", 2);
  }

  // 顔。深紅の瞳。
  ctx.fillStyle = "#0d0812";
  ctx.strokeStyle = "#0a0612";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(-15, -8, 9, 6.5, -0.16, 0, Math.PI * 2);
  ctx.ellipse(15, -8, 9, 6.5, 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  circle(ctx, -13, -7, 4.2, "#e04a4a", null);
  circle(ctx, 13, -7, 4.2, "#e04a4a", null);
  circle(ctx, -13, -7, 2, "#3a0808", null);
  circle(ctx, 13, -7, 2, "#3a0808", null);
  ctx.strokeStyle = "#0a0612";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-26, -18); ctx.lineTo(-8, -13);
  ctx.moveTo(26, -18); ctx.lineTo(8, -13);
  ctx.stroke();

  starSpark(ctx, -36, -34, 6, "#e04a4a");
  starSpark(ctx, 37, -32, 5.5, "#e04a4a");
}

function paintYuureiking(ctx) {
  // 王冠をかぶった幽霊。半透明の裾がゆらめき、目だけが赤く光る。
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (const [sx, sy, r] of [[-26, -18, 2.5], [24, -24, 2], [-20, 12, 2], [22, 10, 2.5]]) {
    circle(ctx, sx, sy, r, "#c9a0e8", null);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = "#5a3a7a";
  ctx.strokeStyle = "#2b1a3a";
  ctx.lineWidth = 3.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, -4, 27, Math.PI, Math.PI * 2);
  ctx.lineTo(27, 14);
  ctx.quadraticCurveTo(19, 30, 13, 16);
  ctx.quadraticCurveTo(6, 30, 0, 16);
  ctx.quadraticCurveTo(-6, 30, -13, 16);
  ctx.quadraticCurveTo(-19, 30, -27, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#e8c34a";
  ctx.strokeStyle = "#8a621c";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-12, -26); ctx.lineTo(-8, -34); ctx.lineTo(-4, -27);
  ctx.lineTo(0, -36); ctx.lineTo(4, -27);
  ctx.lineTo(8, -34); ctx.lineTo(12, -26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  shine(ctx, -12, -12, 12, 7);
  circle(ctx, -9, -8, 3.5, "#e04a4a", null);
  circle(ctx, 9, -8, 3.5, "#e04a4a", null);
  ctx.strokeStyle = "#2b1a3a";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 6, 6, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
}

function paintNoroigumo(ctx) {
  // のろいの蜘蛛。細長い8本足と、糸を紡ぐような紫のもよう。
  ctx.strokeStyle = "#0d0812";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (const side of [-1, 1]) {
    for (const [ang, len] of [[-0.9, 30], [-0.3, 34], [0.3, 34], [0.9, 30]]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.beginPath();
      ctx.moveTo(14, 4);
      ctx.quadraticCurveTo(14 + len * 0.5, 4 + Math.sin(ang) * len * 0.4, 14 + len * Math.cos(ang), 4 + len * Math.sin(ang));
      ctx.stroke();
      ctx.restore();
    }
  }

  glossOval(ctx, 0, 8, 22, 18, "#3a2450", "#1a1024", "#0d0812", 5);
  ctx.strokeStyle = "rgba(90, 58, 122, 0.5)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-14, 0); ctx.quadraticCurveTo(0, 8, 14, 0);
  ctx.moveTo(-14, 14); ctx.quadraticCurveTo(0, 20, 14, 14);
  ctx.stroke();
  shine(ctx, -10, 2, 10, 6);

  glossCircle(ctx, 0, -12, 15, "#3a2450", "#1a1024", "#0d0812", 4.5);
  eyeDot(ctx, -8, -13, 6.5);
  eyeDot(ctx, 8, -13, 6.5);
  circle(ctx, -4, -6, 2, "#0d0812", null);
  circle(ctx, 4, -6, 2, "#0d0812", null);
}

function paintReverseNushi(ctx) {
  // 裏ボス。表のヌシと同じ樹木＋獣の系統だが、枯れ木化・紫のオーラで異形さを強調。
  ctx.save();
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10;
    const r = 44 + (i % 2) * 9;
    ctx.strokeStyle = i % 2 ? "#c9a0f5" : "#6f3fa8";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 14);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "#e0c6ff";
  ctx.lineWidth = 2.2;
  for (const r of [54, 66]) {
    ctx.beginPath();
    ctx.arc(0, -2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  horn(ctx, -27, -28, -1);
  horn(ctx, 27, -28, 1);

  // 枯れ枝角と紫の葉冠
  ctx.strokeStyle = "#2b2033";
  ctx.lineWidth = 6.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-28, -30); ctx.lineTo(-46, -52); ctx.lineTo(-58, -68);
  ctx.moveTo(-42, -47); ctx.lineTo(-58, -46);
  ctx.moveTo(28, -30); ctx.lineTo(46, -52); ctx.lineTo(58, -68);
  ctx.moveTo(42, -47); ctx.lineTo(58, -46);
  ctx.stroke();
  for (const [lx, ly, r] of [[-60, -68, 9], [-58, -46, 8], [60, -68, 9], [58, -46, 8], [0, -56, 10]]) {
    glossOval(ctx, lx, ly, r, r * 0.65, "#c9a0f5", "#6f3fa8", "#3a2050", 2.2);
  }

  // 巨体（紫がかった濃緑〜黒）
  glossOval(ctx, 0, 4, 46, 41, "#7a5aa0", "#3f2960", "#1e1230", 7.5);
  glossOval(ctx, 0, 18, 23, 18, "#c9a0f5", "#8a5fc0", "#1e1230", 4);
  shine(ctx, -20, -15, 18, 10);

  // 腕・爪
  glossOval(ctx, -43, 13, 13, 23, "#5f4390", "#332055", "#1e1230", 4.5);
  glossOval(ctx, 43, 13, 13, 23, "#5f4390", "#332055", "#1e1230", 4.5);
  for (const side of [-1, 1]) {
    tri(ctx, side * 42, 30, side * 50, 42, side * 34, 38, "#e8d69b", "#2b2033", 2);
  }

  // 足元の根
  ctx.strokeStyle = "#1e1230";
  ctx.lineWidth = 5.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-15, 36); ctx.quadraticCurveTo(-33, 46, -47, 42);
  ctx.moveTo(15, 36); ctx.quadraticCurveTo(33, 46, 47, 42);
  ctx.stroke();

  // 顔。怒りを帯びた紫の目。
  ctx.fillStyle = "#e8d0ff";
  ctx.strokeStyle = "#1e1230";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(-15, -9, 9, 6.5, -0.16, 0, Math.PI * 2);
  ctx.ellipse(15, -9, 9, 6.5, 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  circle(ctx, -13, -8, 4, "#6f3fa8", null);
  circle(ctx, 13, -8, 4, "#6f3fa8", null);
  circle(ctx, -13, -8, 1.8, "#2b2033", null);
  circle(ctx, 13, -8, 1.8, "#2b2033", null);
  ctx.strokeStyle = "#1e1230";
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-26, -19); ctx.lineTo(-8, -13);
  ctx.moveTo(26, -19); ctx.lineTo(8, -13);
  ctx.moveTo(-9, 11); ctx.quadraticCurveTo(0, 4, 9, 11);
  ctx.stroke();

  starSpark(ctx, -34, -34, 5.5, "#e0c6ff");
  starSpark(ctx, 35, -32, 5, "#e0c6ff");
}

function paintSeaNushi(ctx) {
  // 海ワールドのボス。巨大な甲羅とヒレを持つ深海の主。青白い発光模様と、
  // まわりを漂う気泡の輪で威圧感を出す。
  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10;
    const r = 46 + (i % 2) * 8;
    ctx.strokeStyle = i % 2 ? "#8fe0f5" : "#3a8ab0";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 14);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#c2f0ff";
  ctx.lineWidth = 2;
  for (const r of [52, 64]) {
    ctx.beginPath();
    ctx.arc(0, -2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 大きなヒレ（頭上）
  ctx.fillStyle = "#2a5a78";
  ctx.strokeStyle = "#123a4e";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 14, -32);
    ctx.quadraticCurveTo(side * 30, -58, side * 20, -70);
    ctx.quadraticCurveTo(side * 10, -50, side * 6, -30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 甲羅（大きく硬そうな背中）
  glossOval(ctx, 0, 4, 46, 40, "#3f8aa8", "#245a72", "#123a4e", 7.5);
  glossOval(ctx, 0, 12, 30, 22, "#7ed0e8", "#3f8aa8", "#123a4e", 4);
  ctx.strokeStyle = "rgba(18, 58, 78, 0.6)";
  ctx.lineWidth = 2;
  for (const [hx, hy] of [[-16, 2], [16, 2], [0, 20], [-16, 24], [16, 24]]) {
    ctx.beginPath();
    ctx.moveTo(hx - 8, hy);
    ctx.lineTo(hx, hy - 8);
    ctx.lineTo(hx + 8, hy);
    ctx.lineTo(hx, hy + 8);
    ctx.closePath();
    ctx.stroke();
  }
  shine(ctx, -20, -12, 17, 10);

  // ヒレ状の腕
  glossOval(ctx, -42, 14, 13, 24, "#3f8aa8", "#245a72", "#123a4e", 4.5);
  glossOval(ctx, 42, 14, 13, 24, "#3f8aa8", "#245a72", "#123a4e", 4.5);

  // 足元の泡
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (const [bx, by, r] of [[-40, 38, 5], [40, 40, 4], [0, 46, 4.5]]) {
    circle(ctx, bx, by, r, "#c2f0ff", "#3a8ab0", 1.6);
  }
  ctx.restore();

  // 顔。冷ややかな青の目。
  ctx.fillStyle = "#dff7ff";
  ctx.strokeStyle = "#123a4e";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(-15, -8, 9, 6.5, -0.14, 0, Math.PI * 2);
  ctx.ellipse(15, -8, 9, 6.5, 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  circle(ctx, -13, -7, 4, "#3a8ab0", null);
  circle(ctx, 13, -7, 4, "#3a8ab0", null);
  circle(ctx, -13, -7, 1.8, "#123a4e", null);
  circle(ctx, 13, -7, 1.8, "#123a4e", null);
  ctx.strokeStyle = "#123a4e";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-9, 12); ctx.quadraticCurveTo(0, 6, 9, 12);
  ctx.stroke();

  starSpark(ctx, -33, -32, 5, "#c2f0ff");
  starSpark(ctx, 34, -30, 4.5, "#c2f0ff");
}

function paintHyougaNushi(ctx) {
  // 雪原ワールドのボス。氷河をまとう巨大な獣。冷気のオーラと
  // 鋭い氷の牙・つららの毛並みで威圧感を出す。
  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10;
    const r = 47 + (i % 2) * 8;
    ctx.strokeStyle = i % 2 ? "#eafcff" : "#7abcd8";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 14);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#eafcff";
  ctx.lineWidth = 2;
  for (const r of [53, 65]) {
    ctx.beginPath();
    ctx.arc(0, -2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 氷のたてがみ（頭の周り）
  ctx.fillStyle = "#eafcff";
  ctx.strokeStyle = "#3f7a98";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  for (const [tx, ty, r] of [[-30, -34, 10], [30, -34, 10], [-40, -14, 8], [40, -14, 8], [0, -46, 11]]) {
    tri(ctx, tx, ty - r, tx - r * 0.6, ty + r * 0.6, tx + r * 0.6, ty + r * 0.6, "#eafcff", "#3f7a98", 2);
  }

  // 巨体
  glossOval(ctx, 0, 6, 45, 40, "#8fc8e0", "#4a8fb0", "#1e4a5e", 7.5);
  glossOval(ctx, 0, 18, 24, 18, "#eafcff", "#c2ecf8", "#1e4a5e", 4);
  shine(ctx, -19, -14, 17, 10);

  // 太い前脚
  glossOval(ctx, -40, 26, 13, 20, "#4a8fb0", "#2a5f78", "#1e4a5e", 4.5);
  glossOval(ctx, 40, 26, 13, 20, "#4a8fb0", "#2a5f78", "#1e4a5e", 4.5);
  for (const side of [-1, 1]) {
    tri(ctx, side * 38, 40, side * 46, 50, side * 30, 48, "#eafcff", "#1e4a5e", 2);
  }

  // 冷気の吐息
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#eafcff";
  for (const [bx, by, r] of [[-38, 44, 5], [38, 46, 4], [0, 52, 4.5]]) {
    circle(ctx, bx, by, r, "#eafcff", "#7abcd8", 1.4);
  }
  ctx.restore();

  // 顔。鋭い氷色の目。
  ctx.fillStyle = "#eafcff";
  ctx.strokeStyle = "#1e4a5e";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(-16, -8, 9, 6.5, -0.16, 0, Math.PI * 2);
  ctx.ellipse(16, -8, 9, 6.5, 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  circle(ctx, -14, -7, 4, "#3f7a98", null);
  circle(ctx, 14, -7, 4, "#3f7a98", null);
  circle(ctx, -14, -7, 1.8, "#1e4a5e", null);
  circle(ctx, 14, -7, 1.8, "#1e4a5e", null);

  // 牙
  ctx.fillStyle = "#eafcff";
  ctx.strokeStyle = "#1e4a5e";
  ctx.lineWidth = 1.6;
  tri(ctx, -10, 12, -4, 12, -7, 22, "#eafcff", "#1e4a5e", 1.4);
  tri(ctx, 10, 12, 4, 12, 7, 22, "#eafcff", "#1e4a5e", 1.4);

  starSpark(ctx, -35, -33, 5.5, "#eafcff");
  starSpark(ctx, 36, -31, 5, "#eafcff");
}

function paintTakarabox(ctx) {
  // 宝箱に擬態するモンスター。木箱のボディに金の帯、うっすら開いた口から牙が覗く。
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 34, 26, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 箱の下段
  ctx.fillStyle = "#a8703c";
  ctx.strokeStyle = "#5c3a1e";
  ctx.lineWidth = 4.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.roundRect(-30, -4, 60, 32, 6);
  ctx.fill();
  ctx.stroke();

  // 蓋（少し開いた宝箱の口）
  ctx.fillStyle = "#c48a4c";
  ctx.beginPath();
  ctx.moveTo(-30, -4);
  ctx.quadraticCurveTo(-30, -30, 0, -32);
  ctx.quadraticCurveTo(30, -30, 30, -4);
  ctx.lineTo(24, -10);
  ctx.quadraticCurveTo(0, -8, -24, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 金の帯
  ctx.fillStyle = "#e8b23a";
  ctx.strokeStyle = "#8a611c";
  ctx.lineWidth = 2;
  ctx.fillRect(-30, 4, 60, 5);
  ctx.strokeRect(-30, 4, 60, 5);
  ctx.beginPath();
  ctx.roundRect(-6, -30, 12, 34, 3);
  ctx.fill();
  ctx.stroke();

  // 鍵穴（顔の中心に据えて表情のアクセントに）
  ctx.fillStyle = "#6b4a1c";
  ctx.beginPath();
  ctx.arc(0, 13, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-1.6, 13, 3.2, 6);

  // 牙のある口（擬態モンスターらしい凶暴さ）
  ctx.fillStyle = "#3a2210";
  ctx.beginPath();
  ctx.moveTo(-16, -9);
  ctx.quadraticCurveTo(0, -2, 16, -9);
  ctx.lineTo(14, 0);
  ctx.quadraticCurveTo(0, 5, -14, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f2ead6";
  for (const fx of [-11, -3, 5, 12]) {
    ctx.beginPath();
    ctx.moveTo(fx, -8);
    ctx.lineTo(fx + 3, -8);
    ctx.lineTo(fx + 1.5, -2);
    ctx.closePath();
    ctx.fill();
  }

  // 目（蓋の上、驚かせる演出用に吊り上がった目つき）
  ctx.fillStyle = "#ffe27a";
  ctx.strokeStyle = "#2b2b33";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-13, -19, 6, 5, -0.2, 0, Math.PI * 2);
  ctx.ellipse(13, -19, 6, 5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  circle(ctx, -13, -19, 2.6, "#2b2b33", null);
  circle(ctx, 13, -19, 2.6, "#2b2b33", null);
  circle(ctx, -14.5, -20.5, 1, "#ffffff", null);
  circle(ctx, 11.5, -20.5, 1, "#ffffff", null);

  starSpark(ctx, -26, -22, 4, "#fff1a0");
  starSpark(ctx, 27, -18, 4, "#fff1a0");
  shine(ctx, -12, -2, 12, 7);
}

function paintHanamaro(ctx) {
  // 花っぽい子犬: ふわふわでやわらかい輪郭。
  const body = "#ffd3e0";
  const ear = "#ff9db8";
  const line = "#7b4b5e";
  glossOval(ctx, 0, 0, 24, 20, body, "#f7b6c8", line, 4);
  glossOval(ctx, -18, -12, 10, 14, ear, "#f58fb0", line, 3);
  glossOval(ctx, 18, -12, 10, 14, ear, "#f58fb0", line, 3);
  oval(ctx, -10, 18, 8, 6, "#ffffff", line, 3);
  oval(ctx, 10, 18, 8, 6, "#ffffff", line, 3);
  circle(ctx, -8, -4, 3.2, "#ffffff", null);
  circle(ctx, 8, -4, 3.2, "#ffffff", null);
  circle(ctx, -8, -4, 1.2, line, null);
  circle(ctx, 8, -4, 1.2, line, null);
  smile(ctx, 0, 8, 3.5);
  tinyLeaf(ctx, -20, 20, -0.6, "#8ddf6a");
  tinyLeaf(ctx, 20, 20, 0.5, "#8ddf6a");
}

function paintTorimugi(ctx) {
  // 麦色の渡り鳥: 細身で風を切る。
  const body = "#f0d27a";
  const wing = "#fff0b0";
  const line = "#7c6329";
  oval(ctx, 0, 0, 18, 14, body, line, 4);
  oval(ctx, -24, -2, 18, 9, wing, line, 4);
  oval(ctx, 24, -2, 18, 9, wing, line, 4);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 14); ctx.lineTo(-4, 28);
  ctx.moveTo(0, 14); ctx.lineTo(6, 28);
  ctx.stroke();
  circle(ctx, -6, -2, 2.8, "#ffffff", null);
  circle(ctx, 6, -2, 2.8, "#ffffff", null);
  circle(ctx, -6, -2, 1.0, line, null);
  circle(ctx, 6, -2, 1.0, line, null);
  ctx.fillStyle = "#d88d2f";
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(30, 4);
  ctx.lineTo(18, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function paintSazanami(ctx) {
  // 水面のさざなみ: 丸い胴と波みたいな装飾。
  const body = "#a9eef2";
  const wave = "#6fd0df";
  const line = "#2b6e7a";
  glossCircle(ctx, 0, 0, 24, body, wave, line, 4);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 12, 14, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-18, -6); ctx.quadraticCurveTo(-8, -12, 0, -6);
  ctx.quadraticCurveTo(8, 0, 18, -6);
  ctx.stroke();
  circle(ctx, -8, -3, 3.2, "#ffffff", null);
  circle(ctx, 8, -3, 3.2, "#ffffff", null);
  circle(ctx, -8, -3, 1.2, line, null);
  circle(ctx, 8, -3, 1.2, line, null);
  smile(ctx, 0, 8, 3.8);
}

function paintMizuhane(ctx) {
  // 水辺の小鳥: すらっとした体と大きめの翼。
  const body = "#cfefff";
  const wing = "#84d4ec";
  const line = "#46798b";
  oval(ctx, 0, 0, 16, 18, body, line, 4);
  oval(ctx, -22, -3, 18, 10, wing, line, 4);
  oval(ctx, 22, -3, 18, 10, wing, line, 4);
  circle(ctx, -6, -4, 2.8, "#ffffff", null);
  circle(ctx, 6, -4, 2.8, "#ffffff", null);
  circle(ctx, -6, -4, 1.0, line, null);
  circle(ctx, 6, -4, 1.0, line, null);
  smile(ctx, 0, 7, 3.2);
  ctx.fillStyle = "#f1c15f";
  ctx.beginPath();
  ctx.moveTo(14, -1);
  ctx.lineTo(26, 2);
  ctx.lineTo(14, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function paintKotohana(ctx) {
  // 花のことり: 丸い胴と花びらの羽。
  const body = "#ffe0ee";
  const petal = "#f49ac0";
  const line = "#8b5771";
  glossCircle(ctx, 0, 0, 22, body, "#f7b7d1", line, 4);
  petalFlower(ctx, -18, -3, 7, petal, "#fff2f8");
  petalFlower(ctx, 18, -3, 7, petal, "#fff2f8");
  circle(ctx, -7, -3, 2.8, "#ffffff", null);
  circle(ctx, 7, -3, 2.8, "#ffffff", null);
  circle(ctx, -7, -3, 1.0, line, null);
  circle(ctx, 7, -3, 1.0, line, null);
  smile(ctx, 0, 8, 3.4);
  tinyLeaf(ctx, -10, -28, -0.4, "#76d96b");
  tinyLeaf(ctx, 10, -28, 0.5, "#76d96b");
}

function paintSunaboko(ctx) {
  // 砂のころがし屋: ころんとした球体のモンスター。
  const body = "#e0bd7a";
  const line = "#8a6b3d";
  glossCircle(ctx, 0, 0, 24, body, "#cfa968", line, 4);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-18, 0); ctx.lineTo(18, 0);
  ctx.moveTo(0, -18); ctx.lineTo(0, 18);
  ctx.stroke();
  circle(ctx, -7, -4, 3, "#ffffff", null);
  circle(ctx, 7, -4, 3, "#ffffff", null);
  circle(ctx, -7, -4, 1.1, line, null);
  circle(ctx, 7, -4, 1.1, line, null);
  smile(ctx, 0, 10, 3.8);
  ctx.globalAlpha = 0.35;
  circle(ctx, -28, 18, 5, "#f7e4b0", null);
  circle(ctx, 28, 18, 4, "#f7e4b0", null);
  ctx.globalAlpha = 1;
}

function paintSorane(ctx) {
  // 空のうさぎ: 軽く浮くような細身シルエット。
  const body = "#cce6ff";
  const line = "#53789c";
  glossOval(ctx, 0, 0, 15, 20, body, "#9fd0ff", line, 4);
  oval(ctx, -14, -18, 8, 15, "#e9f5ff", line, 3);
  oval(ctx, 14, -18, 8, 15, "#e9f5ff", line, 3);
  circle(ctx, -6, -4, 2.6, "#ffffff", null);
  circle(ctx, 6, -4, 2.6, "#ffffff", null);
  circle(ctx, -6, -4, 1.0, line, null);
  circle(ctx, 6, -4, 1.0, line, null);
  smile(ctx, 0, 8, 3.2);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-8, 16); ctx.lineTo(-10, 28);
  ctx.moveTo(8, 16); ctx.lineTo(10, 28);
  ctx.stroke();
}

function paintMomijiri(ctx) {
  // もみじぎつね: 尻尾を大きく見せる紅葉系。
  const body = "#ffd1a3";
  const tail = "#f47d4b";
  const line = "#8b4d2f";
  oval(ctx, 0, 0, 22, 18, body, line, 4);
  glossOval(ctx, -26, 0, 14, 10, tail, "#e85f38", line, 3);
  glossOval(ctx, 26, 0, 14, 10, tail, "#e85f38", line, 3);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 14); ctx.lineTo(-2, 30);
  ctx.moveTo(0, 14); ctx.lineTo(4, 30);
  ctx.stroke();
  circle(ctx, -7, -2, 2.8, "#ffffff", null);
  circle(ctx, 7, -2, 2.8, "#ffffff", null);
  circle(ctx, -7, -2, 1.0, line, null);
  circle(ctx, 7, -2, 1.0, line, null);
  smile(ctx, 0, 7, 3.4);
  tinyLeaf(ctx, -18, -24, -0.6, "#ffbf57");
  tinyLeaf(ctx, 18, -24, 0.5, "#ffbf57");
}

function paintShizukuya(ctx) {
  // 雫の宿り手: まるい体にしずく模様。
  const body = "#96e1ee";
  const line = "#2d7484";
  glossCircle(ctx, 0, 0, 23, body, "#64c8da", line, 4);
  circle(ctx, 0, -8, 7, "#e8fbff", line, 2.5);
  circle(ctx, -8, 5, 4, "#e8fbff", null);
  circle(ctx, 8, 5, 4, "#e8fbff", null);
  circle(ctx, -7, -3, 2.8, "#ffffff", null);
  circle(ctx, 7, -3, 2.8, "#ffffff", null);
  circle(ctx, -7, -3, 1.0, line, null);
  circle(ctx, 7, -3, 1.0, line, null);
  smile(ctx, 0, 10, 3.6);
}

function paintKazeneko(ctx) {
  // 風のねこ: 耳としっぽが長め。
  const body = "#d9ebff";
  const ear = "#8fb7ff";
  const line = "#5a7598";
  glossCircle(ctx, 0, 0, 22, body, "#b6d4ff", line, 4);
  tri(ctx, -18, -28, -8, -8, -26, -10, ear, line, 3);
  tri(ctx, 18, -28, 8, -8, 26, -10, ear, line, 3);
  ctx.strokeStyle = line;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(18, 14); ctx.quadraticCurveTo(34, 20, 28, 34);
  ctx.stroke();
  circle(ctx, -7, -3, 2.8, "#ffffff", null);
  circle(ctx, 7, -3, 2.8, "#ffffff", null);
  circle(ctx, -7, -3, 1.0, line, null);
  circle(ctx, 7, -3, 1.0, line, null);
  smile(ctx, 0, 8, 3.2);
}

function paintTsuyuhika(ctx) {
  // 露のひかり: ぽってり丸い体に光る雫。
  const body = "#e8ffd9";
  const core = "#9be37f";
  const line = "#6f9a56";
  glossCircle(ctx, 0, 0, 22, body, core, line, 4);
  circle(ctx, 0, -10, 7, "#ffffff", line, 2.5);
  shine(ctx, -12, -14, 8, 4, -0.2);
  circle(ctx, -7, -3, 2.8, "#ffffff", null);
  circle(ctx, 7, -3, 2.8, "#ffffff", null);
  circle(ctx, -7, -3, 1.0, line, null);
  circle(ctx, 7, -3, 1.0, line, null);
  smile(ctx, 0, 8, 3.2);
}

function paintMoriame(ctx) {
  // 森の雨つぶ: 丸いしずく型で落ち着いた色。
  const body = "#9de2cf";
  const line = "#49786c";
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.quadraticCurveTo(20, -4, 14, 16);
  ctx.quadraticCurveTo(0, 30, -14, 16);
  ctx.quadraticCurveTo(-20, -4, 0, -28);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
  circle(ctx, -6, 0, 2.8, "#ffffff", null);
  circle(ctx, 6, 0, 2.8, "#ffffff", null);
  circle(ctx, -6, 0, 1.0, line, null);
  circle(ctx, 6, 0, 1.0, line, null);
  smile(ctx, 0, 12, 3.4);
}

function paintHarune(ctx) {
  // 春のうさぎ: やわらかい色味の軽いシルエット。
  const body = "#f8deff";
  const ear = "#d99ef2";
  const line = "#7a5a95";
  glossOval(ctx, 0, 0, 16, 20, body, "#ebbff7", line, 4);
  oval(ctx, -14, -20, 8, 16, ear, "#cf87ec", line, 3);
  oval(ctx, 14, -20, 8, 16, ear, "#cf87ec", line, 3);
  circle(ctx, -6, -4, 2.6, "#ffffff", null);
  circle(ctx, 6, -4, 2.6, "#ffffff", null);
  circle(ctx, -6, -4, 1.0, line, null);
  circle(ctx, 6, -4, 1.0, line, null);
  smile(ctx, 0, 8, 3.2);
  tinyLeaf(ctx, -20, 20, -0.5, "#8ee27e");
  tinyLeaf(ctx, 20, 20, 0.5, "#8ee27e");
}

function paintMizugoma(ctx) {
  // 水のごま: 小さな丸い水生生物。
  const body = "#b8f2f1";
  const line = "#3d8486";
  glossCircle(ctx, 0, 0, 22, body, "#7ed8d9", line, 4);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-16, -6); ctx.quadraticCurveTo(-8, -14, 0, -8);
  ctx.quadraticCurveTo(8, -2, 16, -6);
  ctx.stroke();
  circle(ctx, -7, -3, 2.6, "#ffffff", null);
  circle(ctx, 7, -3, 2.6, "#ffffff", null);
  circle(ctx, -7, -3, 1.0, line, null);
  circle(ctx, 7, -3, 1.0, line, null);
  smile(ctx, 0, 8, 3.4);
}

function paintSunobori(ctx) {
  // 砂のぼり: 砂山をよじのぼる系。
  const body = "#ebc686";
  const line = "#8a6940";
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(24, 16);
  ctx.lineTo(-24, 16);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
  circle(ctx, -6, -2, 2.8, "#ffffff", null);
  circle(ctx, 6, -2, 2.8, "#ffffff", null);
  circle(ctx, -6, -2, 1.0, line, null);
  circle(ctx, 6, -2, 1.0, line, null);
  smile(ctx, 0, 8, 3.2);
}

function paintSakuraneko(ctx) {
  // 花びらっぽい耳としっぽで、少し華やかなネコ。
  const body = "#ffd0e3";
  const line = "#8f5572";
  glossCircle(ctx, 0, 0, 22, body, "#ffb4d0", line, 4);
  tri(ctx, -18, -22, -8, -35, -3, -18, "#ffc0db", "#8f5572", 2.2);
  tri(ctx, 18, -22, 8, -35, 3, -18, "#ffc0db", "#8f5572", 2.2);
  ctx.strokeStyle = line;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(12, 13);
  ctx.quadraticCurveTo(30, 12, 27, -10);
  ctx.quadraticCurveTo(24, -25, 10, -20);
  ctx.stroke();
  petalFlower(ctx, -20, 6, 5.2, "#f7a8c8", "#fff0a8");
  petalFlower(ctx, 20, 4, 5.2, "#f7a8c8", "#fff0a8");
  eye(ctx, -7, -4, 7.2);
  eye(ctx, 7, -4, 7.2);
  smile(ctx, 0, 8, 3.3);
  blush(ctx, -16, 5);
  blush(ctx, 16, 5);
}

function paintMizukusa(ctx) {
  // 水草むし: 葉っぱの衣をまとった、細長い水辺の子。
  const body = "#94e0d0";
  const line = "#467f75";
  glossOval(ctx, 0, 2, 18, 24, body, "#63c5b3", line, 4);
  tinyLeaf(ctx, -15, -18, -0.9, "#71d7c3");
  tinyLeaf(ctx, 15, -18, 0.9, "#71d7c3");
  tinyLeaf(ctx, -19, 10, -0.4, "#5ecab6");
  tinyLeaf(ctx, 19, 10, 0.4, "#5ecab6");
  ctx.strokeStyle = line;
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-3, 18);
  ctx.quadraticCurveTo(-8, 32, -2, 36);
  ctx.moveTo(3, 18);
  ctx.quadraticCurveTo(8, 32, 2, 36);
  ctx.stroke();
  eyeDot(ctx, -6, -4, 6.5);
  eyeDot(ctx, 6, -4, 6.5);
  smile(ctx, 0, 8, 3.2);
  scaleMark(ctx, -10, 6, 4, "rgba(255,255,255,0.25)");
  scaleMark(ctx, 10, 6, 4, "rgba(255,255,255,0.25)");
}

function paintSunamaru(ctx) {
  // 砂まる: まるい砂だまのようなシンプルな子。
  const body = "#e5c27f";
  const line = "#8b6a39";
  glossCircle(ctx, 0, 0, 23, body, "#d7af68", line, 4);
  ctx.fillStyle = "#cfac69";
  ctx.strokeStyle = "rgba(139, 106, 57, 0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const [x, y, r] of [[-10, -7, 2.3], [5, -10, 1.8], [10, 4, 2.1], [-4, 10, 1.9]]) {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();
  eyeDot(ctx, -7, -2, 6.8);
  eyeDot(ctx, 7, -2, 6.8);
  smile(ctx, 0, 8, 3.2);
}

function paintTsukihane(ctx) {
  // 月羽: 羽っぽい耳を持つ、少し夜色の軽いキャラ。
  const body = "#d7ccff";
  const line = "#6e5b99";
  glossOval(ctx, 0, 2, 18, 22, body, "#bfa8ff", line, 4);
  tri(ctx, -18, -20, -8, -36, -2, -18, "#eee7ff", "#6e5b99", 2);
  tri(ctx, 18, -20, 8, -36, 2, -18, "#eee7ff", "#6e5b99", 2);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-10, 12);
  ctx.quadraticCurveTo(-22, 22, -16, 34);
  ctx.moveTo(10, 12);
  ctx.quadraticCurveTo(22, 22, 16, 34);
  ctx.stroke();
  starSpark(ctx, -14, -10, 4.2, "#fff1a6");
  eyeHollow(ctx, -6, -3, 6.8);
  eyeHollow(ctx, 6, -3, 6.8);
  smile(ctx, 0, 8, 3.2);
}

function paintMizutama(ctx) {
  // 水玉: ぽこぽこと浮かぶ丸い水のいきもの。
  const body = "#91e4f2";
  const line = "#4d8fa0";
  glossCircle(ctx, -10, -2, 10, "#c9f7ff", "#91e4f2", line, 3);
  glossCircle(ctx, 10, -2, 10, "#c9f7ff", "#91e4f2", line, 3);
  glossCircle(ctx, 0, 10, 16, body, "#63cfe3", line, 4);
  scaleMark(ctx, -5, 6, 3.4, "rgba(255,255,255,0.28)");
  scaleMark(ctx, 7, 14, 3.4, "rgba(255,255,255,0.28)");
  eyeBig(ctx, -6, 8, 5.8);
  eyeBig(ctx, 6, 8, 5.8);
  smile(ctx, 0, 16, 3.0);
}

function paintIshimaru(ctx) {
  // 石まる: かなり素朴な石っころキャラ。フラット寄り。
  const body = "#c0b09c";
  const line = "#6f6357";
  ctx.save();
  ctx.translate(0, 1);
  ctx.beginPath();
  ctx.moveTo(-21, 8);
  ctx.quadraticCurveTo(-20, -17, -2, -26);
  ctx.quadraticCurveTo(18, -28, 22, -4);
  ctx.quadraticCurveTo(26, 18, 2, 24);
  ctx.quadraticCurveTo(-18, 22, -21, 8);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = "rgba(111,99,87,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.lineTo(3, -14);
  ctx.moveTo(-7, 4);
  ctx.lineTo(10, 0);
  ctx.stroke();
  eyeDot(ctx, -6, -1, 6.2);
  eyeDot(ctx, 6, -1, 6.2);
  smile(ctx, 0, 9, 3.0);
}

function paintKazepeko(ctx) {
  // 風の小動物っぽい、ふわっと軽い見た目。
  const body = "#c9f1ff";
  const line = "#4f8aa1";
  glossCircle(ctx, 0, 0, 20, body, "#8fdcff", line, 4);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-22, 2);
  ctx.quadraticCurveTo(-34, -2, -44, -12);
  ctx.moveTo(-18, 10);
  ctx.quadraticCurveTo(-31, 16, -42, 18);
  ctx.stroke();
  eyeGlare(ctx, -6, -3, 6.5);
  eyeGlare(ctx, 6, -3, 6.5);
  smile(ctx, 0, 7, 3.1);
}

function paintHikariame(ctx) {
  // 光のあめだま。やわらかい透明感のある丸型。
  const body = "#ffe4bf";
  const line = "#a97b48";
  glossOval(ctx, 0, 0, 22, 18, body, "#ffd18f", line, 4);
  starSpark(ctx, -10, -10, 4.3, "#fff1ad");
  starSpark(ctx, 10, -6, 3.6, "#fff1ad");
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-11, 16);
  ctx.lineTo(-14, 28);
  ctx.moveTo(11, 16);
  ctx.lineTo(14, 28);
  ctx.stroke();
  eyeBig(ctx, -6, 0, 6.2);
  eyeBig(ctx, 6, 0, 6.2);
  smile(ctx, 0, 10, 3.1);
}

function paintYamakibi(ctx) {
  // 山の火種っぽい、少し固めのシルエット。
  const body = "#d8a06e";
  const line = "#7b5230";
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(24, 12);
  ctx.lineTo(-24, 12);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
  tri(ctx, -10, 4, 10, 4, 0, 16, body, line, 3);
  eye(ctx, -6, -2, 6.5);
  eye(ctx, 6, -2, 6.5);
  smile(ctx, 0, 8, 3.1);
}

function paintShizumegane(ctx) {
  // しずめがね: 水底のめだまみたいな、少し不思議な子。
  const body = "#b2ece5";
  const line = "#4f7f7a";
  glossCircle(ctx, 0, 0, 21, body, "#7fd2cb", line, 4);
  circle(ctx, -8, -2, 5.5, "#ffffff", null);
  circle(ctx, 8, -2, 5.5, "#ffffff", null);
  circle(ctx, -8, -2, 2.6, line, null);
  circle(ctx, 8, -2, 2.6, line, null);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-18, -1);
  ctx.lineTo(-28, -4);
  ctx.moveTo(18, -1);
  ctx.lineTo(28, -4);
  ctx.stroke();
  smile(ctx, 0, 10, 3.0);
}

function paintHaribune(ctx) {
  // 針の船。小さいけれどきりっとした輪郭。
  const body = "#d9e3ff";
  const line = "#6575a0";
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(24, 12);
  ctx.lineTo(0, 20);
  ctx.lineTo(-24, 12);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(14, 0);
  ctx.stroke();
  eyeBig(ctx, -6, -2, 6.3);
  eyeBig(ctx, 6, -2, 6.3);
  smile(ctx, 0, 8, 3.0);
}

function paintReiseiou(ctx) {
  // 配合専用のごほうび枠: 氷・星・王冠を合わせた特別シルエット。
  const body = "#dfeaff";
  const core = "#8db8ff";
  const accent = "#fff4c8";
  const line = "#39567d";
  ctx.save();
  ctx.globalAlpha = 0.98;
  circle(ctx, 0, 0, 30, "#f7fbff", "#b4d2ff", 4);
  ctx.beginPath();
  ctx.moveTo(0, -36);
  ctx.lineTo(12, -24);
  ctx.lineTo(26, -28);
  ctx.lineTo(22, -14);
  ctx.lineTo(34, -2);
  ctx.lineTo(18, 2);
  ctx.lineTo(16, 18);
  ctx.lineTo(0, 10);
  ctx.lineTo(-16, 18);
  ctx.lineTo(-18, 2);
  ctx.lineTo(-34, -2);
  ctx.lineTo(-22, -14);
  ctx.lineTo(-26, -28);
  ctx.lineTo(-12, -24);
  ctx.closePath();
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();

  oval(ctx, -10, -2, 11, 15, body, line, 4);
  oval(ctx, 10, -2, 11, 15, body, line, 4);
  circle(ctx, -12, -4, 3.8, "#ffffff", null);
  circle(ctx, 8, -4, 3.8, "#ffffff", null);
  circle(ctx, -10, -4, 1.4, line, null);
  circle(ctx, 10, -4, 1.4, line, null);
  smile(ctx, 0, 11, 4.5);
  ctx.save();
  ctx.globalAlpha = 0.65;
  shine(ctx, -20, -20, 8, 4, -0.3);
  shine(ctx, 20, -15, 7, 3.5, 0.2);
  circle(ctx, 0, -38, 5, "#ffffff", "#b4d2ff", 2);
  ctx.restore();
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(7, -14);
  ctx.lineTo(0, -18);
  ctx.lineTo(-7, -14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function paintSumiremo(ctx) {
  // うす紫の夜ちょう: 細身の胴と大きめの羽。
  const wing = "#b79df0";
  const wingDark = "#7d61c8";
  const body = "#efe8ff";
  const line = "#55407c";
  oval(ctx, 0, 0, 12, 22, body, line, 4);
  oval(ctx, -18, -2, 18, 11, wing, line, 4);
  oval(ctx, 18, -2, 18, 11, wing, line, 4);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-6, 18); ctx.lineTo(-10, 33);
  ctx.moveTo(6, 18); ctx.lineTo(10, 33);
  ctx.stroke();
  circle(ctx, -4, -6, 3, "#ffffff", null);
  circle(ctx, 4, -6, 3, "#ffffff", null);
  circle(ctx, -4, -6, 1.2, line, null);
  circle(ctx, 4, -6, 1.2, line, null);
  smile(ctx, 0, 5, 3.2);
  shine(ctx, -18, -12, 7, 4, -0.25);
  ctx.fillStyle = wingDark;
  ctx.beginPath();
  ctx.moveTo(-18, -2);
  ctx.lineTo(-30, -10);
  ctx.lineTo(-23, 0);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(18, -2);
  ctx.lineTo(30, -10);
  ctx.lineTo(23, 0);
  ctx.closePath();
  ctx.fill();
}

function paintYukigamo(ctx) {
  // 雪の水鳥: ふっくらした胴とくちばし。
  const body = "#f4fbff";
  const wing = "#bfdff0";
  const line = "#58768e";
  glossOval(ctx, 0, 0, 24, 20, body, wing, line, 4);
  glossOval(ctx, -18, -2, 10, 14, "#e7f7ff", wing, line, 3);
  glossOval(ctx, 18, -2, 10, 14, "#e7f7ff", wing, line, 3);
  oval(ctx, 0, 11, 10, 7, "#ffffff", line, 3);
  ctx.fillStyle = "#f7c95a";
  ctx.beginPath();
  ctx.moveTo(22, -2);
  ctx.lineTo(34, 2);
  ctx.lineTo(22, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  circle(ctx, -7, -6, 2.8, "#2b2b33", null);
  circle(ctx, 7, -6, 2.8, "#2b2b33", null);
  shine(ctx, -14, -14, 9, 5, -0.2);
}

function paintKuroguri(ctx) {
  // 小さな精霊: ふわっと浮く影玉。
  const body = "#6b7286";
  const core = "#aeb6d6";
  const line = "#343b4b";
  circle(ctx, 0, 0, 24, body, line, 4);
  circle(ctx, 0, -2, 14, core, line, 3);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-16, -18); ctx.lineTo(-24, -30);
  ctx.moveTo(16, -18); ctx.lineTo(24, -30);
  ctx.stroke();
  circle(ctx, -7, -2, 3.6, "#f6f8ff", null);
  circle(ctx, 7, -2, 3.6, "#f6f8ff", null);
  circle(ctx, -7, -1.5, 1.3, line, null);
  circle(ctx, 7, -1.5, 1.3, line, null);
  smile(ctx, 0, 11, 3.4);
  ctx.globalAlpha = 0.4;
  circle(ctx, -24, 18, 4, "#cdd6ff", null);
  circle(ctx, 24, 18, 3, "#cdd6ff", null);
  ctx.globalAlpha = 1;
}

function paintKazaribi(ctx) {
  // でんせつのひかり: 金色に光る小さな精霊。柔らかい後光をまとう。
  const glow = "rgba(246, 211, 92, 0.35)";
  const core = "#fff3c4";
  const body = "#f6d35c";
  const line = "#a8791f";
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();
  glossCircle(ctx, 0, 0, 20, core, body, line, 4);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-14, -16); ctx.lineTo(-20, -27);
  ctx.moveTo(14, -16); ctx.lineTo(20, -27);
  ctx.stroke();
  circle(ctx, -18, -28, 3, "#fff3c4", null);
  circle(ctx, 18, -28, 3, "#fff3c4", null);
  circle(ctx, -6, -2, 3.4, "#ffffff", null);
  circle(ctx, 6, -2, 3.4, "#ffffff", null);
  circle(ctx, -6, -2, 1.3, line, null);
  circle(ctx, 6, -2, 1.3, line, null);
  smile(ctx, 0, 8, 3.2);
  shine(ctx, -8, -10, 6, 3.5, -0.3);
  ctx.fillStyle = "#fff3c4";
  for (const [sx, sy, r] of [[-26, 8, 2.4], [26, 6, 2], [0, 30, 2.2], [-16, 24, 1.6]]) {
    ctx.globalAlpha = 0.7;
    circle(ctx, sx, sy, r, "#fff3c4", null);
  }
  ctx.globalAlpha = 1;
}

function paintGamadon(ctx) {
  // 王冠のような大きな水玉(丸い体だけだった前身から一歩進んだ姿に)
  ctx.save();
  ctx.translate(0, -38);
  glossOval(ctx, 0, 0, 11, 15, "#2fd9c0", "#1f8f7f", "#155c50", 3);
  circle(ctx, -3, -5, 2, "#ffffff", null);
  ctx.restore();

  glossOval(ctx, -20, 28, 11, 7, "#7ee0c8", "#1f8f7f", "#155c50", 3);
  glossOval(ctx, 20, 28, 11, 7, "#7ee0c8", "#1f8f7f", "#155c50", 3);

  // 横に大きく広がった、王者らしいどっしりした体
  glossOval(ctx, 0, 6, 38, 30, "#9df0d8", "#1f8f7f", "#155c50", 6);

  glossCircle(ctx, -16, -12, 12, "#ffffff", "#dff7ee", "#155c50", 3);
  glossCircle(ctx, 16, -12, 12, "#ffffff", "#dff7ee", "#155c50", 3);
  circle(ctx, -16, -8, 7, "#2b2b33", null);
  circle(ctx, 16, -8, 7, "#2b2b33", null);
  circle(ctx, -19, -11, 2.6, "#ffffff", null);
  circle(ctx, 13, -11, 2.6, "#ffffff", null);

  // 大きく膨らんだのど袋(このモンスターならではのシルエット)
  glossOval(ctx, 0, 22, 20, 15, "#c9fbe8", "#7ee0c8", "#155c50", 3);

  smile(ctx, 0, 8, 6);
  blush(ctx, -26, 14);
  blush(ctx, 26, 14);

  for (const [wx, wy] of [[-24, -2], [24, -2], [-14, 20], [14, 20]]) {
    circle(ctx, wx, wy, 2.4, "#7ee0c8", null);
  }
}

function paintPachiking(ctx) {
  ctx.strokeStyle = "#8a6b12";
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-8, -30); ctx.quadraticCurveTo(-14, -42, -22, -46);
  ctx.moveTo(8, -30); ctx.quadraticCurveTo(14, -42, 22, -46);
  ctx.stroke();
  starSpark(ctx, -23, -48, 6, "#fff4a3");
  starSpark(ctx, 23, -48, 6, "#fff4a3");
  starSpark(ctx, 0, -40, 5, "#fff4a3");

  // 甲虫らしく頭・胸・腹の3節に分かれたシルエット(丸い体だけだった前身から進化)
  glossOval(ctx, 0, -16, 16, 13, "#ffe27a", "#c99a1e", "#6b4e0c", 5);
  glossOval(ctx, 0, 10, 24, 20, "#ffe27a", "#e0a52e", "#6b4e0c", 6);
  glossOval(ctx, 0, 34, 18, 15, "#f6d97a", "#c99a1e", "#6b4e0c", 5);

  // 大きく広げた、ふちが稲妻状の羽
  tri(ctx, -20, -4, -46, -14, -32, 20, "#fff6d9", "#6b4e0c", 3);
  tri(ctx, 20, -4, 46, -14, 32, 20, "#fff6d9", "#6b4e0c", 3);
  ctx.strokeStyle = "#e0a52e";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-38, -8); ctx.lineTo(-32, 0); ctx.lineTo(-38, 4); ctx.lineTo(-30, 14);
  ctx.moveTo(38, -8); ctx.lineTo(32, 0); ctx.lineTo(38, 4); ctx.lineTo(30, 14);
  ctx.stroke();

  glossCircle(ctx, -12, -18, 8, "#ffffff", "#dff7ee", "#6b4e0c", 2.5);
  glossCircle(ctx, 12, -18, 8, "#ffffff", "#dff7ee", "#6b4e0c", 2.5);
  circle(ctx, -12, -15, 4.6, "#2b2b33", null);
  circle(ctx, 12, -15, 4.6, "#2b2b33", null);
  starSpark(ctx, -12, -16, 2, "#fff4a3");
  starSpark(ctx, 12, -16, 2, "#fff4a3");

  glossOval(ctx, 0, 34, 10, 8, "#fff6d9", "#ffe9a8", "#6b4e0c", 2);
}
const paintOrifalcon = evolvedVariant(paintOrihiko, 22, (ctx) => {
  shine(ctx, -10, -30, 12, 5);
});
const paintKibouju = evolvedVariant(paintKiboko, -10, (ctx) => {
  tinyLeaf(ctx, -20, -30, -0.6, "#9fe56c");
  tinyLeaf(ctx, 20, -30, 0.6, "#9fe56c");
});
const paintHonborido = evolvedVariant(paintHonbori, 20, (ctx) => {
  flame(ctx, 0, -40, 0.6, "#ffe07a", "#fff6cf");
});
const paintDosugame = evolvedVariant(paintTsubogame, -12, (ctx) => {
  tri(ctx, -8, -38, 0, -50, 8, -38, "#c9e8da", "#3f6b58", 2);
});
const paintKoganetsubo = evolvedVariant(paintTsuboco, -20, (ctx) => {
  shine(ctx, -8, -32, 10, 5);
});
const paintOodangou = evolvedVariant(paintSandango, 10, (ctx) => {
  tri(ctx, -8, -38, 0, -50, 8, -38, "#ffe0c0", "#c46a4f", 2);
});
const paintHanaguruma = evolvedVariant(paintHanamaro, -16, (ctx) => {
  petalFlower(ctx, 0, -40, 8, "#ffb0d0", "#ffe07a");
});
const paintOomugiwatari = evolvedVariant(paintTorimugi, 12, (ctx) => {
  shine(ctx, -10, -32, 12, 5);
});
const paintHanautadori = evolvedVariant(paintKotohana, -14, (ctx) => {
  petalFlower(ctx, -18, -30, 6, "#ffb0d0", "#ffe07a");
  petalFlower(ctx, 18, -30, 6, "#ffb0d0", "#ffe07a");
});
const paintAmakumousagi = evolvedVariant(paintSorane, 18, (ctx) => {
  glossOval(ctx, 0, -40, 14, 6, "#e8f6ff", "#a8c8e8", "#5a9fe0", 2);
});
const paintMomijiou = evolvedVariant(paintMomijiri, -8, (ctx) => {
  tinyLeaf(ctx, -22, -28, -0.7, "#e0793a");
  tinyLeaf(ctx, 22, -28, 0.7, "#e0793a");
});
const paintKazagurumaneko = evolvedVariant(paintKazeneko, 16, (ctx) => {
  tri(ctx, -6, -38, 0, -50, 6, -38, "#dce8ff", "#5a86e0", 2);
});
const paintHanafubukiusagi = evolvedVariant(paintHarune, -12, (ctx) => {
  petalFlower(ctx, 0, -42, 7, "#ffb0d0", "#ffe07a");
});
const paintSakuraouneko = evolvedVariant(paintSakuraneko, -10, (ctx) => {
  petalFlower(ctx, -18, -32, 6, "#ffd0e2", "#ffe07a");
  petalFlower(ctx, 18, -32, 6, "#ffd0e2", "#ffe07a");
});
const paintHayatenoko = evolvedVariant(paintKazepeko, 20, (ctx) => {
  shine(ctx, -10, -32, 12, 5);
});
const paintHounenkibi = evolvedVariant(paintYamakibi, -14, (ctx) => {
  tinyLeaf(ctx, -22, -30, -0.6, "#e0c85a");
  tinyLeaf(ctx, 22, -30, 0.6, "#e0c85a");
});

// 4系統の最終進化(モフリガーデン/ボルドリル/バクフェニ/テンストーム)は、
// 見た目が2進化目の使い回しだったため、シルエットから作り直した専用の姿にする。

function paintMofurigarden(ctx) {
  ctx.strokeStyle = "#2f5c1e";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(38, 4, 13, Math.PI * 0.15, Math.PI * 1.3);
  ctx.stroke();

  // 大きく広がった花びらの襟巻き
  for (const [ang, color] of [[-1.1, "#f78fb3"], [-0.55, "#ffe07a"], [0, "#f78fb3"], [0.55, "#ffe07a"], [1.1, "#f78fb3"]]) {
    const px = Math.sin(ang) * 34;
    const py = 14 + Math.cos(ang) * 10;
    glossOval(ctx, px, py, 10, 6, color, "#c96a8c", "#3d6b26", 2);
  }

  // 体は縦長のしずく型にして、丸いだけの前身から一歩進んだ姿にする
  glossOval(ctx, 0, 4, 26, 32, "#a8ec78", "#4a7d2e", "#2f5c1e", 6);
  glossOval(ctx, 0, 22, 13, 12, "#e2f9c8", "#b8e48e", "#2f5c1e", 3);

  petalFlower(ctx, 0, -30, 11, "#ffe07a", "#f78fb3");
  petalFlower(ctx, -18, -22, 7, "#f78fb3", "#ffe07a");
  petalFlower(ctx, 18, -22, 7, "#f78fb3", "#ffe07a");

  tri(ctx, -34, -30, -8, -18, -30, -6, "#8ed85c", "#2f5c1e");
  tri(ctx, 34, -30, 8, -18, 30, -6, "#8ed85c", "#2f5c1e");

  shine(ctx, -12, -10, 12, 8);
  eye(ctx, -11, -2);
  eye(ctx, 11, -2);
  smile(ctx, 0, 12, 4.5);
  blush(ctx, -20, 8);
  blush(ctx, 20, 8);

  ctx.strokeStyle = "#4a7d2e";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 34); ctx.quadraticCurveTo(20, 44, 14, 58);
  ctx.moveTo(0, 34); ctx.quadraticCurveTo(-4, 46, 4, 60);
  ctx.stroke();
  tinyLeaf(ctx, 14, 58, 0.3, "#9fe56c");
  tinyLeaf(ctx, 4, 60, -0.3, "#9fe56c");
}

function paintBorudrill(ctx) {
  rockPlate(ctx, -14, -26, 10);
  rockPlate(ctx, 14, -26, 10);
  rockPlate(ctx, 0, -34, 9);

  // 体はモグラの丸い顔ではなく、ドリル状に尖ったひし形のシルエットにする
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(26, 6);
  ctx.lineTo(0, 34);
  ctx.lineTo(-26, 6);
  ctx.closePath();
  ctx.fillStyle = glossFill(ctx, 0, 4, 30, "#c9a878", "#75533d");
  ctx.fill();
  ctx.strokeStyle = "#3f2f20";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.stroke();

  tri(ctx, -10, -22, 10, -22, 0, -46, "#e8c99a", "#3f2f20", 3);

  glossOval(ctx, 0, 14, 15, 13, "#f0d3ac", "#d9b48f", "#3f2f20", 3);

  tri(ctx, -26, -4, -44, -14, -30, 10, "#8a6244", "#3f2f20", 3);
  tri(ctx, 26, -4, 44, -14, 30, 10, "#8a6244", "#3f2f20", 3);

  shine(ctx, -12, -14, 11, 6);
  eyeGlare(ctx, -11, -8);
  eyeGlare(ctx, 11, -8);
  ctx.strokeStyle = "#3f2f20";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 10, 5, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();
}

function paintBakuphoenix(ctx) {
  // 大きく広げた炎の翼(丸い胴体だけだった前身から、鳥らしいシルエットへ)
  ctx.save();
  ctx.translate(-32, -8);
  ctx.rotate(-0.7);
  flame(ctx, 0, 0, 1.7, "#ff9d2e", "#ffe07a");
  ctx.restore();
  ctx.save();
  ctx.translate(32, -8);
  ctx.rotate(0.7);
  flame(ctx, 0, 0, 1.7, "#ff9d2e", "#ffe07a");
  ctx.restore();

  glossOval(ctx, 0, 2, 20, 30, "#ff9868", "#d9633a", "#a83f20", 6);
  glossOval(ctx, 0, 18, 11, 12, "#fff0d6", "#ffe1b3", "#a83f20", 3);

  flame(ctx, 0, -40, 1.1, "#ff9d2e", "#ffe07a");
  flame(ctx, -11, -32, 0.7, "#ff9d2e", "#ffe07a");
  flame(ctx, 11, -32, 0.7, "#ff9d2e", "#ffe07a");

  shine(ctx, -9, -8, 9, 5);
  eyeSharp(ctx, -8, -4);
  eyeSharp(ctx, 8, -4);
  smile(ctx, 0, 8, 3.5);

  ctx.save();
  ctx.translate(0, 34);
  flame(ctx, 0, 6, 1.9, "#ff9d2e", "#ffe07a");
  ctx.restore();
}

function paintTenstorm(ctx) {
  // 大きく後方へ流れる翼(丸い胴体だけだった前身から、疾風の鳥らしいシルエットへ)
  tri(ctx, -20, -10, -50, -22, -34, 14, "#8fcbe8", "#2f5f7a", 4);
  tri(ctx, 20, -10, 50, -22, 34, 14, "#8fcbe8", "#2f5f7a", 4);

  glossOval(ctx, 0, 0, 20, 26, "#c2eaf8", "#5489b7", "#2f5f7a", 6);
  glossOval(ctx, 0, 12, 11, 11, "#ffffff", "#e8f7ff", "#2f5f7a", 3);

  ctx.strokeStyle = "#2f5f7a";
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-4, -24); ctx.lineTo(-10, -40); ctx.lineTo(-2, -34); ctx.lineTo(-8, -48);
  ctx.moveTo(4, -24); ctx.lineTo(10, -40); ctx.lineTo(2, -34); ctx.lineTo(8, -48);
  ctx.stroke();

  windSwirl(ctx, -30, 4, 10);
  windSwirl(ctx, 30, 4, 10);

  shine(ctx, -9, -10, 9, 5);
  eyeGlare(ctx, -9, -4);
  eyeGlare(ctx, 9, -4);

  ctx.strokeStyle = "#f6d35c";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(0, 24); ctx.lineTo(-6, 34); ctx.lineTo(2, 34); ctx.lineTo(-4, 46);
  ctx.stroke();
}

const PAINTERS = {
  mofuri: paintMofuri,
  dogura: paintDogura,
  hibachi: paintHibachi,
  fuwarisu: paintFuwarisu,
  mofurif: paintMofurif,
  mofurigarden: paintMofurigarden,
  borudogura: paintBorudogura,
  borudrill: paintBorudrill,
  bakuhibachi: paintBakuhibachi,
  bakuphoenix: paintBakuphoenix,
  tenfuwarisu: paintTenfuwarisu,
  tenstorm: paintTenstorm,
  pyokotan: paintPyokotan,
  gamadon: paintGamadon,
  pachikoro: paintPachikoro,
  pachiking: paintPachiking,
  orihiko: paintOrihiko,
  orifalcon: paintOrifalcon,
  kiboko: paintKiboko,
  kibouju: paintKibouju,
  tsuboco: paintTsuboco,
  koganetsubo: paintKoganetsubo,
  tsukinone: paintTsukinone,
  honbori: paintHonbori,
  honborido: paintHonborido,
  tsubogame: paintTsubogame,
  dosugame: paintDosugame,
  sandango: paintSandango,
  oodangou: paintOodangou,
  nushi: paintNushi,
  reverseNushi: paintReverseNushi,
  seaNushi: paintSeaNushi,
  hyougaNushi: paintHyougaNushi,
  sunaNushi: paintSunaNushi,
  koujouNushi: paintKoujouNushi,
  maou: paintMaou,
  takarabox: paintTakarabox,
  obako: paintObako,
  obagale: paintObako,
  kurista: paintKurista,
  kuricrown: paintKurista,
  hagumon: paintHagumon,
  hagutitan: paintHagumon,
  hagurumaru: paintHagurumaru,
  sparkun: paintSparkun,
  karakuribat: paintKarakuribat,
  paipon: paintPaipon,
  akumakko: paintAkumakko,
  kokushou: paintKokushou,
  yuureiking: paintYuureiking,
  noroigumo: paintNoroigumo,
  pukurin: paintPukurin,
  kageuri: paintKageuri,
  hoshimogu: paintHoshimogu,
  fuyudama: paintFuyudama,
  nejiko: paintNejiko,
  kaigaran: paintKaigaran,
  awairuka: paintAwairuka,
  hikariebi: paintHikariebi,
  yamiankou: paintYamiankou,
  yukimaro: paintYukimaro,
  kooritsumu: paintKooritsumu,
  pengiri: paintPengiri,
  yukibouzu: paintYukibouzu,
  sabotenko: paintSabotenko,
  sunasasori: paintSunasasori,
  rakudan: paintRakudan,
  sunamiira: paintSunamiira,
  hanamaro: paintHanamaro,
  hanaguruma: paintHanaguruma,
  torimugi: paintTorimugi,
  oomugiwatari: paintOomugiwatari,
  sazanami: paintSazanami,
  mizuhane: paintMizuhane,
  kotohana: paintKotohana,
  hanautadori: paintHanautadori,
  sunaboko: paintSunaboko,
  sorane: paintSorane,
  amakumousagi: paintAmakumousagi,
  momijiri: paintMomijiri,
  momijiou: paintMomijiou,
  shizukuya: paintShizukuya,
  kazeneko: paintKazeneko,
  kazagurumaneko: paintKazagurumaneko,
  tsuyuhika: paintTsuyuhika,
  moriame: paintMoriame,
  harune: paintHarune,
  hanafubukiusagi: paintHanafubukiusagi,
  mizugoma: paintMizugoma,
  sunobori: paintSunobori,
  sakuraneko: paintSakuraneko,
  sakuraouneko: paintSakuraouneko,
  mizukusa: paintMizukusa,
  sunamaru: paintSunamaru,
  tsukihane: paintTsukihane,
  mizutama: paintMizutama,
  ishimaru: paintIshimaru,
  kazepeko: paintKazepeko,
  hayatenoko: paintHayatenoko,
  hikariame: paintHikariame,
  yamakibi: paintYamakibi,
  hounenkibi: paintHounenkibi,
  shizumegane: paintShizumegane,
  haribune: paintHaribune,
  reiseiou: paintReiseiou,
  sumiremo: paintSumiremo,
  yukigamo: paintYukigamo,
  kuroguri: paintKuroguri,
  oonamiwhale: paintYukigamo,
  hoshizora: paintKuroguri,
  omegazenmaiya: paintReiseiou,
  kazaribi: paintKazaribi,
};

export function drawMonster(ctx, speciesId, cx, cy, scale, t, hueRotate = 0) {
  const bob = Math.sin(t * 3) * 3 * scale;
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 36 * scale, 30 * scale, 8 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(cx, cy + bob);
  ctx.scale(scale, scale);
  if (hueRotate) ctx.filter = `hue-rotate(${hueRotate}deg) saturate(1.2)`;
  const painter = PAINTERS[speciesId] || paintMofuri;
  painter(ctx);
  ctx.filter = "none";
  ctx.restore();
}

export function drawCompanion(ctx, monster, playerX, playerY, facing, t) {
  if (!monster || !monster.speciesId) return;
  const offset = {
    up: [18, 18],
    down: [-18, -20],
    left: [18, -14],
    right: [-18, -14],
  }[facing] || [-18, -20];
  const hop = Math.sin(t * 5 + monster.uid * 0.7) * 1.6;
  const x = playerX + offset[0];
  const y = playerY + offset[1] + hop;
  drawMonster(ctx, monster.speciesId, x, y, 0.38, t + monster.uid * 0.37);

  // なかよし感を出す小さな反応。戦闘性能には関係しない純粋な演出。
  if (Math.sin(t * 1.4 + monster.uid) > 0.94) {
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = "#ff8fb3";
    ctx.beginPath();
    ctx.moveTo(x, y - 34);
    ctx.bezierCurveTo(x - 5, y - 41, x - 14, y - 34, x, y - 25);
    ctx.bezierCurveTo(x + 14, y - 34, x + 5, y - 41, x, y - 34);
    ctx.fill();
    ctx.restore();
  }
}

export function drawPlayer(ctx, cx, cy, facing, t) {
  const bob = Math.sin(t * 6) * 1.2;
  const step = Math.sin(t * 10);
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.20)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 16, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(cx, cy + bob);

  // 足（歩きのニュアンス）
  ctx.strokeStyle = "#2b2b33";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (facing === "left" || facing === "right") {
    ctx.moveTo(-4, 10); ctx.lineTo(-7 - step * 2, 16);
    ctx.moveTo(5, 10); ctx.lineTo(8 + step * 2, 16);
  } else {
    ctx.moveTo(-5, 10); ctx.lineTo(-7, 16 + step);
    ctx.moveTo(5, 10); ctx.lineTo(7, 16 - step);
  }
  ctx.stroke();

  // からだ・リュック
  if (facing === "up") {
    ctx.fillStyle = "#5b8fdf";
    ctx.strokeStyle = "#2b2b33";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-10, -3, 20, 16, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d18c45";
    ctx.beginPath();
    ctx.roundRect(-7, 0, 14, 13, 4);
    ctx.fill();
    ctx.strokeStyle = "#6f4520";
    ctx.stroke();
  } else {
    ctx.fillStyle = "#4a7fd6";
    ctx.strokeStyle = "#2b2b33";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-9, -4, 18, 17, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffd75e";
    ctx.fillRect(-5, -1, 10, 3);
    ctx.strokeStyle = "#2b2b33";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-5, -1, 10, 3);
  }

  // うで
  ctx.strokeStyle = "#2b2b33";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (facing === "left") {
    ctx.moveTo(-8, 1); ctx.lineTo(-14, 7 + step);
    ctx.moveTo(8, 1); ctx.lineTo(10, 8 - step);
  } else if (facing === "right") {
    ctx.moveTo(8, 1); ctx.lineTo(14, 7 + step);
    ctx.moveTo(-8, 1); ctx.lineTo(-10, 8 - step);
  } else {
    ctx.moveTo(-9, 1); ctx.lineTo(-14, 8 - step);
    ctx.moveTo(9, 1); ctx.lineTo(14, 8 + step);
  }
  ctx.stroke();

  // 顔・帽子
  circle(ctx, 0, -12, 9.5, "#f6d0a8", "#2b2b33", 2);
  ctx.fillStyle = "#e8563f";
  ctx.strokeStyle = "#2b2b33";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -13, 10.5, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#c2432f";
  ctx.beginPath();
  ctx.roundRect(-11, -14, 22, 4, 2);
  ctx.fill();
  ctx.strokeStyle = "#2b2b33";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#fff4c2";
  ctx.beginPath();
  ctx.arc(0, -17, 2.2, 0, Math.PI * 2);
  ctx.fill();

  if (facing !== "up") {
    const dx = facing === "left" ? -3 : facing === "right" ? 3 : 0;
    circle(ctx, dx - 3, -9, 1.5, "#2b2b33", null);
    circle(ctx, dx + 3, -9, 1.5, "#2b2b33", null);
    ctx.strokeStyle = "#9b5a3c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(dx, -5, 3, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  } else {
    ctx.strokeStyle = "#8b4e32";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -12, 7, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

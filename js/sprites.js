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
  eye(ctx, -10, -7);
  eye(ctx, 10, -7);
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
  eye(ctx, -10, -6);
  eye(ctx, 10, -6);
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
  eye(ctx, -11, -6, 8.5);
  eye(ctx, 11, -6, 8.5);
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
  eye(ctx, -11, -6, 9);
  eye(ctx, 11, -6, 9);
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
  eye(ctx, -10, -7, 8);
  eye(ctx, 10, -7, 8);
  smile(ctx, 0, 4, 4.5);
  blush(ctx, -19, 1);
  blush(ctx, 19, 1);
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
  eye(ctx, -10, -4, 8);
  eye(ctx, 10, -4, 8);
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
  eye(ctx, -5, -23, 6);
  eye(ctx, 5, -23, 6);
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
  eye(ctx, -6, -21, 6);
  eye(ctx, 6, -21, 6);
  smile(ctx, 0, -16, 3.5);
  blush(ctx, -13, -17);
  blush(ctx, 13, -17);
}

const PAINTERS = {
  mofuri: paintMofuri,
  dogura: paintDogura,
  hibachi: paintHibachi,
  fuwarisu: paintFuwarisu,
  mofurif: paintMofurif,
  borudogura: paintBorudogura,
  bakuhibachi: paintBakuhibachi,
  tenfuwarisu: paintTenfuwarisu,
  pyokotan: paintPyokotan,
  pachikoro: paintPachikoro,
  tsukinone: paintTsukinone,
  honbori: paintHonbori,
  tsubogame: paintTsubogame,
  sandango: paintSandango,
  nushi: paintNushi,
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

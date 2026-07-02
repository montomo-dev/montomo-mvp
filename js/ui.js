export const FONT = '17px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
export const FONT_BOLD = 'bold 17px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';

export function panel(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fillStyle = "rgba(255, 253, 245, 0.95)";
  ctx.fill();
  ctx.strokeStyle = "#3a3a52";
  ctx.lineWidth = 3;
  ctx.stroke();
}

export function hpBar(ctx, x, y, w, h, ratio) {
  const r = Math.max(0, Math.min(1, ratio));
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fillStyle = "#dcd7c9";
  ctx.fill();
  if (r > 0) {
    ctx.beginPath();
    ctx.roundRect(x, y, Math.max(h, w * r), h, h / 2);
    ctx.fillStyle = r > 0.5 ? "#58c25a" : r > 0.25 ? "#e8b23d" : "#e05555";
    ctx.fill();
  }
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.strokeStyle = "#3a3a52";
  ctx.lineWidth = 2;
  ctx.stroke();
}

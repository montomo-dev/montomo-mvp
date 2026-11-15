export const FONT = '17px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
export const FONT_BOLD = 'bold 17px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';

const INK = "#16392f";
const PAPER = "#f7f6dc";

export function panel(ctx, x, y, w, h) {
  ctx.save();
  ctx.shadowColor = "rgba(22, 57, 47, 0.18)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fillStyle = PAPER;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(x + 5, y + 5, w - 10, h - 10, 6);
  ctx.strokeStyle = "rgba(34, 102, 76, 0.26)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

// 収まらない文字は字間ではなくフォントサイズを縮めて逃がす。
// 日本語は maxWidth の横圧縮をかけると読めなくなるため。
export function fitText(ctx, text, x, y, maxWidth, minPx = 11) {
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }
  const original = ctx.font;
  const match = original.match(/(\d+(?:\.\d+)?)px/);
  if (!match) {
    ctx.fillText(text, x, y, maxWidth);
    return;
  }
  const basePx = parseFloat(match[1]);
  for (let px = basePx - 1; px >= minPx; px -= 1) {
    ctx.font = original.replace(/\d+(?:\.\d+)?px/, `${px}px`);
    if (ctx.measureText(text).width <= maxWidth) break;
  }
  ctx.fillText(text, x, y, maxWidth);
  ctx.font = original;
}

// 折り返せない狭い枠（図鑑のカードなど）向け。
// まず少しだけ縮め、それでも入らなければ末尾を「…」で落とす。
export function clampText(ctx, text, x, y, maxWidth, minPx = 10) {
  const original = ctx.font;
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }
  const match = original.match(/(\d+(?:\.\d+)?)px/);
  if (match) {
    const basePx = parseFloat(match[1]);
    for (let px = basePx - 1; px >= minPx; px -= 1) {
      ctx.font = original.replace(/\d+(?:\.\d+)?px/, `${px}px`);
      if (ctx.measureText(text).width <= maxWidth) {
        ctx.fillText(text, x, y);
        ctx.font = original;
        return;
      }
    }
  }
  let cut = text;
  while (cut.length > 1 && ctx.measureText(cut + "…").width > maxWidth) cut = cut.slice(0, -1);
  ctx.fillText(cut + "…", x, y);
  ctx.font = original;
}

// 日本語は単語の切れ目が無いので、実測幅で1文字ずつ折る。
// 「」（）などの約物が行頭に来ないよう、直前の文字に付けて送る。
const NO_LINE_START = "、。，．）」』】〕｝ぁぃぅぇぉっゃゅょゎー！？";

export function wrapText(ctx, text, maxWidth) {
  const lines = [];
  for (const paragraph of String(text).split("\n")) {
    let line = "";
    for (const ch of paragraph) {
      const candidate = line + ch;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        if (NO_LINE_START.includes(ch) && line.length > 1) {
          lines.push(line.slice(0, -1));
          line = line.slice(-1) + ch;
        } else {
          lines.push(line);
          line = ch;
        }
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
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

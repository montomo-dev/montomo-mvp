export function makeShareUrl(title, url, result) {
  const target = url ? new URL(url) : null;
  if (target && target.protocol !== 'https:') throw Error('A verified HTTPS play URL is required');
  const suffix = result ? `で${result.display}を記録しました` : 'をプレイ中';
  const share = new URL('https://x.com/intent/post');
  share.searchParams.set('text', `「${title}」${suffix}\n#ブラウザゲーム`);
  if(target) share.searchParams.set('url', target.href);
  return share.href;
}

export function formatValue(value, board) {
  if (board.unit === 'ms') return `${(value / 1000).toFixed(2)}秒`;
  if (board.unit === 'cm') return `${(value / 100).toFixed(2)}m`;
  if (board.unit === 'm') return `${value}m`;
  const units={days:'日',runs:'点',points:'点',yen:'円',percent:'%',answers:'問',throws:'投',kills:'体',count:'回'};
  return `${value.toLocaleString('ja-JP')}${units[board.unit] || ''}`;
}

export function validResult(result, boards) {
  if (!result || !Number.isSafeInteger(result.value)) return false;
  const board = boards.find(b => b.id === result.board);
  return !!board && result.value >= board.min && result.value <= board.max && typeof result.display === 'string' && result.display.length < 100;
}

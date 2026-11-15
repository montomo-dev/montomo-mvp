import { gameProfiles } from './adapters.mjs';
import { makeShareUrl, formatValue, validResult } from './client-core.mjs';

const tag = document.querySelector('script[data-game-social-config]');
if (tag && !document.querySelector('game-social-controls')) {
  initialize(tag.dataset.gameSocialConfig).catch(() => {});
}

async function initialize(configPath) {
  const configUrl = new URL(configPath, location.href);
  if (configUrl.origin !== location.origin) return;
  const response = await fetch(configUrl, { credentials: 'omit' });
  if (!response.ok) return;
  const loaded = await response.json();
  const variant=new URLSearchParams(location.search).get('game') || document.body.dataset.variant || 'neko';
  const config=loaded.games ? loaded.games.find(g=>g.playUrl && new URL(g.playUrl).hostname===location.hostname) || loaded.games.find(g=>g.gameId==='oshite-'+variant) : loaded;
  if (!config || config.limited) return;
  const profile = gameProfiles[config.gameId];
  const boards = profile?.boards || [];
  const host = document.createElement('game-social-controls');
  host.setAttribute('aria-label', '共有とランキング');
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = new URL('./client.css', import.meta.url).href;
  shadow.append(style);
  const handle = document.createElement('button');
  handle.type = 'button'; handle.className = 'handle'; handle.textContent = boards.length ? '共有・記録' : 'X共有';
  handle.setAttribute('aria-label', boards.length ? 'X共有とオンラインランキングを開く' : 'X共有を開く');
  const backdrop = document.createElement('div'); backdrop.className = 'backdrop'; backdrop.hidden = true;
  const panel = document.createElement('section'); panel.className = 'panel'; panel.role = 'dialog'; panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', '共有とランキング');
  const header = document.createElement('header');
  const heading = document.createElement('h2'); heading.textContent = config.title;
  const close = document.createElement('button'); close.type = 'button'; close.className = 'close'; close.textContent = '×'; close.setAttribute('aria-label', '閉じる');
  header.append(heading, close); panel.append(header);
  const share = document.createElement('a'); share.className = 'share'; share.textContent = 'Xで共有'; share.target = '_blank'; share.rel = 'noopener noreferrer';
  share.href = makeShareUrl(config.title, config.playUrl); panel.append(share);
  const status = document.createElement('p'); status.className = 'status'; status.role = 'status';
  let candidate = null, run = null, runRequest = null, used = false, interacted = false, lastFingerprint;
  const storage = { getItem(key) { try { return localStorage.getItem(key); } catch { return null; } } };
  let baseline;
  try { baseline = profile?.extract(document, storage); } catch { baseline = null; }
  let player;
  try { player = localStorage.getItem('game-social.player.v1'); } catch {}
  if (!/^[a-f\d-]{36}$/i.test(player || '')) {
    player = crypto.randomUUID();
    try { localStorage.setItem('game-social.player.v1', player); } catch {}
  }

  const request = async (path, body) => {
    if (!config.apiUrl) throw Error('ランキングの接続準備中です');
    const url = new URL(path, config.apiUrl);
    const res = await fetch(url, { method: body ? 'POST' : 'GET', credentials: 'omit', referrerPolicy: 'no-referrer', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json();
    if (!res.ok) throw Error(data.error || 'ランキングに接続できません');
    return data;
  };
  const begin = () => {
    if (!boards.length || !config.apiUrl || runRequest || (run && !used)) return;
    used = false;
    runRequest = request('/v1/runs', { game: config.gameId, player }).then(data => { run = data.run; }).catch(() => { run = null; }).finally(() => { runRequest = null; });
  };
  let boardSelect, table, empty, nickname, submit, resultLabel;
  const refresh = async () => {
    if (!boardSelect) return;
    empty.hidden = false; empty.textContent = '記録を読み込み中…'; table.replaceChildren();
    try {
      const data = await request('/v1/leaderboard?game=' + encodeURIComponent(config.gameId) + '&board=' + encodeURIComponent(boardSelect.value));
      const board = boards.find(b => b.id === boardSelect.value);
      if (data.board !== board.id) return;
      empty.hidden = data.entries.length > 0;
      empty.textContent = 'まだ記録がありません。最初の記録を残してみよう。';
      for (const entry of data.entries) {
        const row = document.createElement('tr');
        for (const text of [entry.rank, entry.nickname, formatValue(entry.value, board)]) { const cell = document.createElement('td'); cell.textContent = String(text); row.append(cell); }
        table.append(row);
      }
    } catch (error) { empty.hidden = false; empty.textContent = error.message; }
  };
  if (boards.length) {
    const section = document.createElement('div'); section.className = 'rank-section';
    const label = document.createElement('h3'); label.textContent = 'みんなのランキング'; section.append(label);
    boardSelect = document.createElement('select'); boardSelect.setAttribute('aria-label', 'ランキングの種目');
    for (const board of boards) { const option = document.createElement('option'); option.value = board.id; option.textContent = board.label; boardSelect.append(option); }
    section.append(boardSelect);
    const rankingTable = document.createElement('table');
    const thead = document.createElement('thead'); const headerRow = document.createElement('tr');
    for (const text of ['順位', '名前', '記録']) { const th = document.createElement('th'); th.textContent = text; headerRow.append(th); } thead.append(headerRow);
    table = document.createElement('tbody'); rankingTable.append(thead, table); section.append(rankingTable);
    empty = document.createElement('p'); empty.className = 'empty'; section.append(empty);
    resultLabel = document.createElement('p'); resultLabel.className = 'result'; resultLabel.textContent = 'プレイ終了後、ここから記録を登録できます。'; section.append(resultLabel);
    const nameLabel = document.createElement('label'); nameLabel.textContent = 'ランキングに表示する名前';
    nickname = document.createElement('input'); nickname.maxLength = 16; nickname.placeholder = 'プレイヤー'; nickname.autocomplete = 'off'; nickname.setAttribute('aria-label', 'ランキングに表示する名前');
    nameLabel.append(nickname); section.append(nameLabel);
    const privacy = document.createElement('p'); privacy.className = 'muted'; privacy.textContent = '登録は任意です。名前と記録が公開されます。本名は使わないでください。'; section.append(privacy);
    submit = document.createElement('button'); submit.type = 'button'; submit.className = 'submit'; submit.disabled = true; submit.textContent = 'この記録を登録'; section.append(submit, status);
    submit.addEventListener('click', async () => {
      if (!candidate || used) return;
      submit.disabled = true;
      try {
        await runRequest;
        if (!run) throw Error('ゲームをもう一度プレイしてから登録してください');
        await request('/v1/scores', { game: config.gameId, player, run, board: candidate.board, value: candidate.value, nickname: nickname.value });
        used = true; status.textContent = '記録を登録しました。'; await refresh();
      } catch (error) { status.textContent = error.message; submit.disabled = false; }
    });
    boardSelect.addEventListener('change', refresh); panel.append(section);
  }
  const setCandidate = detail => {
    if (!validResult(detail, boards)) return;
    candidate = detail;
    if (resultLabel) {
      const board = boards.find(b => b.id === detail.board);
      resultLabel.textContent = `${board.label}：${formatValue(detail.value, board)}`;
      boardSelect.value = detail.board; submit.disabled = used; status.textContent = '';
    }
    const board = boards.find(b => b.id === detail.board);
    share.href = makeShareUrl(config.title, config.playUrl, { ...detail, display: `${board.label} ${detail.display}` });
  };
  const open = () => { backdrop.hidden = false; handle.setAttribute('aria-expanded', 'true'); close.focus(); refresh(); };
  const shut = () => { backdrop.hidden = true; handle.setAttribute('aria-expanded', 'false'); handle.focus(); };
  handle.addEventListener('click', open); close.addEventListener('click', shut);
  backdrop.addEventListener('click', event => { if (event.target === backdrop) shut(); });
  panel.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); shut(); }
    if (event.key === 'Tab') {
      const focusable = [...panel.querySelectorAll('button:not(:disabled),a[href],input,select')];
      const index = focusable.indexOf(shadow.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); focusable.at(-1).focus(); }
      else if (!event.shiftKey && index === focusable.length - 1) { event.preventDefault(); focusable[0].focus(); }
    }
  });
  for (const type of ['keydown', 'keyup', 'pointerdown', 'pointerup']) panel.addEventListener(type, event => event.stopPropagation());
  backdrop.append(panel); shadow.append(handle, backdrop); document.body.append(host);
  const onPlayInput = event => {
    if (!event.isTrusted || event.composedPath().includes(host)) return;
    if (event.type === 'keydown' && !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter','a','d','w','s'].includes(event.key)) return;
    interacted = true;
    if (used) { run = null; used = false; candidate = null; submit && (submit.disabled = true); }
    begin();
  };
  document.addEventListener('pointerdown', onPlayInput, { capture: true, passive: true });
  document.addEventListener('keydown', onPlayInput, { capture: true });
  window.addEventListener('game-social:result', event => { if (interacted) setCandidate(event.detail); });
  if (profile?.extract) setInterval(() => {
    if (document.hidden) return;
    let detail;
    try { detail = profile.extract(document, storage); } catch { return; }
    if (!detail) { baseline = null; lastFingerprint = null; return; }
    if (!interacted || detail.fingerprint === baseline?.fingerprint || detail.fingerprint === lastFingerprint) return;
    lastFingerprint = detail.fingerprint; setCandidate(detail);
  }, 600);
}

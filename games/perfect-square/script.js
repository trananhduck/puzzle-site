(() => {
const $ = id => document.getElementById(id);
const LS = 'perfect-square-v2';
const DIFFS = ['easy', 'medium', 'hard'], NAME = { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD' };
const HUES = [205, 160, 285, 30, 335, 95, 190, 255, 10, 130, 310, 55];
const arena = $('arena'), boardEl = $('board'), layer = $('layer'), pv = $('pv');

let view = 'menu', diff = null, lvl = 0, N = 0, cl = [], scale = 1, secs = 0, timer = null;
let won = false, drag = null, selId = null, popId = null;
// Sân chơi tính theo "ô đơn vị": khung đích nằm ở góc (0,0) kích thước N×N, phần còn lại là chỗ rải cụm.
let AW = 0, AH = 0, portrait = false;

// ---------- tiến độ (localStorage) ----------
function prog() {
  try { const p = JSON.parse(localStorage.getItem(LS)); if (p && p.done && p.cur) return p; } catch (e) {}
  return { done: { easy: {}, medium: {}, hard: {} }, cur: {} };
}
function save(p) { try { localStorage.setItem(LS, JSON.stringify(p)); } catch (e) {} }
const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
const say = t => { $('msg').textContent = t; };
const doneCount = d => Object.keys(prog().done[d] || {}).length;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- điều hướng ----------
function show(v) {
  view = v;
  $('vMenu').hidden = v !== 'menu'; $('vList').hidden = v !== 'list'; $('vGame').hidden = v !== 'game';
}
function nav(h) { try { location.hash = h; } catch (e) {} route(); }
function route() {
  const m = /^(easy|medium|hard)(?:-(\d+))?$/.exec(location.hash.slice(1));
  if (!m) { stopTimer(); buildMenu(); show('menu'); return; }
  const d = m[1], l = m[2] ? +m[2] : 0;
  if (l >= 1 && l <= LEVELS[d].length) { if (view !== 'game' || diff !== d || lvl !== l) load(d, l); return; }
  stopTimer(); buildList(d); show('list');
}
function stopTimer() { clearInterval(timer); timer = null; }

function buildMenu() {
  const box = $('diffBox'); box.innerHTML = '';
  DIFFS.forEach(d => {
    const b = document.createElement('button'); b.className = 'dbtn';
    b.innerHTML = NAME[d] + ' – ' + LEVELS[d].length + ' Levels<small>Đã hoàn thành ' + doneCount(d) + '/' + LEVELS[d].length + '</small>';
    b.onclick = () => nav(d); box.appendChild(b);
  });
}
function buildList(d) {
  $('listTitle').textContent = NAME[d];
  const g = $('lvGrid'); g.innerHTML = ''; const p = prog();
  LEVELS[d].forEach((_, i) => {
    const l = i + 1, done = p.done[d][l] !== undefined, cur = p.cur[d] === l && !done;
    const b = document.createElement('button');
    b.className = 'lv' + (done ? ' done' : cur ? ' cur' : '');
    b.innerHTML = l + '<small>' + (done ? '✓ Hoàn thành' : cur ? 'Đang chơi' : 'Chưa xong') + '</small>';
    b.onclick = () => nav(d + '-' + l); g.appendChild(b);
  });
}

// ---------- tải màn ----------
function setInit(c) {
  c.cells = c.init.map(a => a.slice());
  const b = clusterBox(c.cells); c.w = b.w; c.h = b.h; c.x = c.y = null; c.ax = c.ay = 0;
}
function dims() {
  portrait = innerWidth <= 820;
  AW = Math.ceil(N * (portrait ? 1.2 : 2.15));
  AH = Math.ceil(N * (portrait ? 2.3 : 1.25));
}
// Rải các cụm lung tung (xoay ngẫu nhiên, vị trí ngẫu nhiên, cố tránh khung đích và tránh nhau).
function scatter(list) {
  const rects = [[0, 0, N, N, 8]];
  cl.forEach(c => { if (!list.includes(c)) rects.push([c.ax, c.ay, c.w, c.h, 1]); });
  const ov = (a, b, c, d, e) => Math.max(0, Math.min(a + c, e[0] + e[2]) - Math.max(a, e[0])) * Math.max(0, Math.min(b + d, e[1] + e[3]) - Math.max(b, e[1]));
  [...list].sort((p, q) => q.w * q.h - p.w * p.h).forEach(c => {
    if (!c.rotated) for (let r = Math.random() * 4 | 0; r--;) c.cells = rotateCells(c.cells);
    const b = clusterBox(c.cells); c.w = b.w; c.h = b.h; c.x = c.y = null;
    let best = null;
    for (let t = 0; t < 150; t++) {
      const ax = Math.random() * Math.max(0, AW - c.w), ay = Math.random() * Math.max(0, AH - c.h);
      const sc = rects.reduce((s, q) => s + ov(ax - .4, ay - .4, c.w + .8, c.h + .8, q) * q[4], 0);
      if (!best || sc < best.sc) best = { ax, ay, sc };
      if (sc === 0) break;
    }
    c.ax = best.ax; c.ay = best.ay; rects.push([c.ax, c.ay, c.w, c.h, 1]);
  });
}
function load(d, l) {
  diff = d; lvl = l;
  const data = LEVELS[d][l - 1]; N = data.n;
  cl = data.c.map((cells, i) => { const c = { id: i, init: cells }; setInit(c); return c; });
  dims(); scatter(cl);
  const p = prog(); p.cur[d] = l; save(p);
  won = false; selId = null; popId = null; secs = 0;
  stopTimer(); timer = setInterval(() => { if (!won) { secs++; stats(); } }, 1000);
  $('win').classList.remove('on'); boardEl.classList.remove('win'); pv.innerHTML = '';
  say('Các cụm nằm lộn xộn khắp sân. Kéo từng cụm vào khung vuông ở góc trái; chọn cụm rồi bấm Rotate (hoặc phím R) để xoay 90°.');
  show('game'); render(); stats();
}
function stats() {
  $('lvName').textContent = NAME[diff] + ' · Level ' + lvl;
  $('time').textContent = fmt(secs);
  $('cnt').textContent = cl.filter(c => c.x !== null).length + '/' + cl.length;
  $('bNext').disabled = !(won && lvl < LEVELS[diff].length);
}

// ---------- vẽ ----------
function clusterEl(c) {
  const e = document.createElement('div');
  e.className = 'cluster' + (selId === c.id ? ' sel' : '') + (popId === c.id ? ' pop' : '');
  e.dataset.id = c.id;
  e.style.width = c.w * scale + 'px'; e.style.height = c.h * scale + 'px';
  e.style.left = c.ax * scale + 'px'; e.style.top = c.ay * scale + 'px';
  e.style.zIndex = selId === c.id ? 5 : 1;
  const hue = HUES[c.id % HUES.length];
  c.cells.forEach(([dx, dy, s], k) => {
    const d = document.createElement('div'); d.className = 'cell';
    d.style.cssText = 'left:' + dx * scale + 'px;top:' + dy * scale + 'px;width:' + s * scale + 'px;height:' + s * scale + 'px;' +
      'background:hsl(' + hue + ' 72% ' + (44 + (k % 3) * 6) + '%);font-size:' + Math.max(9, Math.min(26, s * scale * 0.42)) + 'px';
    if (s * scale >= 14) d.textContent = s;
    d.addEventListener('pointerdown', ev => startDrag(ev, c, e));
    e.appendChild(d);
  });
  return e;
}
function render() {
  scale = arena.clientWidth / AW;
  arena.style.height = AH * scale + 'px';
  const bs = N * scale + 'px';
  for (const el of [boardEl, pv]) { el.style.width = bs; el.style.height = bs; }
  const step = Math.max(1, Math.ceil(14 / scale));
  boardEl.style.backgroundSize = step * scale + 'px ' + step * scale + 'px';
  layer.innerHTML = '';
  cl.forEach(c => layer.appendChild(clusterEl(c)));
  popId = null;
}
function markSel() {
  document.querySelectorAll('.cluster[data-id]').forEach(e => { const s = +e.dataset.id === selId; e.classList.toggle('sel', s); e.style.zIndex = s ? 5 : 1; });
}

// ---------- hình học ----------
const placedExcept = id => cl.filter(c => c.x !== null && c.id !== id).flatMap(c => absSquares(c.cells, c.x, c.y));
const allPlaced = () => cl.every(c => c.x !== null);
const complete = () => allPlaced() && isComplete(N, cl.flatMap(c => absSquares(c.cells, c.x, c.y)));

// Snap chỉ dựa vào hình học (lưới nguyên + cạnh khung + cạnh các ô đã đặt), không dùng lời giải.
function snap(c, rx, ry) {
  const others = placedExcept(c.id), T = 1.5, cx = new Map(), cy = new Map();
  const add = (m, v, r, e) => { if (Math.abs(v - r) <= T) m.set(v, !!(m.get(v) || e)); };
  [Math.round(rx), Math.floor(rx), Math.ceil(rx)].forEach(v => add(cx, v, rx, false));
  [Math.round(ry), Math.floor(ry), Math.ceil(ry)].forEach(v => add(cy, v, ry, false));
  add(cx, 0, rx, true); add(cx, N - c.w, rx, true); add(cy, 0, ry, true); add(cy, N - c.h, ry, true);
  for (const [qx, qy, qs] of others) {
    add(cx, qx + qs, rx, true); add(cx, qx - c.w, rx, true); add(cx, qx, rx, true); add(cx, qx + qs - c.w, rx, true);
    add(cy, qy + qs, ry, true); add(cy, qy - c.h, ry, true); add(cy, qy, ry, true); add(cy, qy + qs - c.h, ry, true);
  }
  let best = null;
  for (const [x, ex] of cx) for (const [y, ey] of cy) {
    if (!canPlace(N, others, c.cells, x, y)) continue;
    const cost = Math.abs(x - rx) + Math.abs(y - ry) - 0.4 * (ex + ey);
    if (!best || cost < best.cost) best = { x, y, cost };
  }
  return best ? { x: best.x, y: best.y, ok: true } : { x: Math.round(rx), y: Math.round(ry), ok: false };
}

// ---------- kéo thả cụm (Pointer Events) ----------
function startDrag(ev, c, el) {
  if (won || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
  ev.preventDefault();
  selId = c.id; markSel();
  const r = el.getBoundingClientRect();
  el.classList.remove('pop'); el.classList.add('drag'); el.style.zIndex = 50;
  drag = { c, el, ox: ev.clientX - r.left, oy: ev.clientY - r.top, sx: ev.clientX, sy: ev.clientY, moved: false };
  addEventListener('pointermove', onMove); addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
}
// gl/gt: vị trí góc trái-trên của cụm (px, trong sân); rx/ry: cùng vị trí tính theo ô
function target(px, py) {
  const ar = arena.getBoundingClientRect(), c = drag.c;
  const gl = px - drag.ox - ar.left - arena.clientLeft, gt = py - drag.oy - ar.top - arena.clientTop;
  const rx = gl / scale, ry = gt / scale;
  const mx = rx + c.w / 2, my = ry + c.h / 2;
  const over = mx >= 0 && mx <= N && my >= 0 && my <= N;
  return Object.assign({ over, gl, gt, rx, ry }, over ? snap(c, rx, ry) : { ok: true });
}
function onMove(ev) {
  if (!drag) return;
  const t = target(ev.clientX, ev.clientY);
  drag.el.style.left = t.gl + 'px'; drag.el.style.top = t.gt + 'px';
  if (!drag.moved && Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) > 4) drag.moved = true;
  pv.innerHTML = '';
  if (t.over) {
    pv.className = t.ok ? '' : 'bad';
    drag.c.cells.forEach(([dx, dy, s]) => {
      const d = document.createElement('div'); d.className = 'pcell';
      d.style.cssText = 'left:' + (t.x + dx) * scale + 'px;top:' + (t.y + dy) * scale + 'px;width:' + s * scale + 'px;height:' + s * scale + 'px';
      pv.appendChild(d);
    });
  }
}
function onUp(ev) {
  if (!drag) return;
  removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp);
  const d = drag, c = d.c, t = ev.type === 'pointercancel' ? null : target(ev.clientX, ev.clientY);
  drag = null; pv.innerHTML = '';
  if (t && d.moved) {
    if (t.over) {
      if (t.ok) { c.x = c.ax = t.x; c.y = c.ay = t.y; popId = c.id; }
      else say('Vị trí không hợp lệ: các hình vuông bị chồng lấn hoặc vượt ra ngoài khung.');
    } else { // thả ra ngoài khung: nằm tự do ở đúng chỗ thả
      c.x = c.y = null; c.ax = clamp(t.rx, 0, AW - c.w); c.ay = clamp(t.ry, 0, AH - c.h);
    }
  }
  render(); stats();
  if (t && d.moved && complete()) win();
}

// ---------- nút chức năng ----------
function rotate() {
  if (won) return;
  const c = cl.find(k => k.id === selId);
  if (!c) { say('Hãy bấm chọn một cụm trước, rồi bấm Rotate.'); return; }
  const cells = rotateCells(c.cells), w = c.h, h = c.w;
  if (c.x === null) { // đang nằm tự do: xoay quanh tâm
    const mx = c.ax + c.w / 2, my = c.ay + c.h / 2;
    c.cells = cells; c.w = w; c.h = h;
    c.ax = clamp(mx - w / 2, 0, Math.max(0, AW - w)); c.ay = clamp(my - h / 2, 0, Math.max(0, AH - h));
  } else {
    const others = placedExcept(c.id);
    const cand = [[c.x, c.y], [Math.round(c.x + (c.w - w) / 2), Math.round(c.y + (c.h - h) / 2)],
      [c.x + c.w - w, c.y], [c.x, c.y + c.h - h], [c.x + c.w - w, c.y + c.h - h]];
    const hit = cand.find(([x, y]) => canPlace(N, others, cells, x, y));
    if (!hit) { say('Không đủ chỗ để xoay cụm tại vị trí này.'); return; }
    c.cells = cells; c.w = w; c.h = h; c.x = c.ax = hit[0]; c.y = c.ay = hit[1];
  }
  popId = c.id; render(); stats();
  if (complete()) win();
}
function reset() {
  if (won) return;
  cl.forEach(setInit); dims(); scatter(cl); selId = null; render(); stats();
  say('Đã xáo trộn lại tất cả các cụm.');
}
function check() {
  if (won) return;
  if (!allPlaced()) { say('Chưa hoàn chỉnh: vẫn còn cụm chưa đặt vào khung.'); return; }
  if (complete()) win(); else say('Chưa hoàn chỉnh: trong khung vẫn còn khoảng trống.');
}
function win() {
  won = true; stopTimer();
  const p = prog(), old = p.done[diff][lvl];
  if (old === undefined || secs < old) p.done[diff][lvl] = secs;
  save(p);
  const last = lvl === LEVELS[diff].length;
  boardEl.classList.add('win');
  $('wt').textContent = last ? 'DIFFICULTY COMPLETED!' : 'LEVEL COMPLETED!';
  $('wtime').textContent = 'Thời gian: ' + fmt(secs);
  $('wNext').textContent = last ? 'Chọn độ khó' : 'Next Level ▶';
  $('win').classList.add('on'); say('Hoàn thành!'); stats();
}
function next() { if (lvl < LEVELS[diff].length) nav(diff + '-' + (lvl + 1)); else nav(''); }

$('bRestart').onclick = () => load(diff, lvl);
$('bRotate').onclick = rotate; $('bReset').onclick = reset; $('bCheck').onclick = check;
$('bNext').onclick = next; $('wNext').onclick = next; $('wAgain').onclick = () => load(diff, lvl);
$('listBack').onclick = () => nav(''); $('gameBack').onclick = () => nav(diff);
addEventListener('keydown', e => { if (view === 'game' && !e.ctrlKey && !e.metaKey && (e.key === 'r' || e.key === 'R')) rotate(); });
let rz; addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(() => {
    if (view !== 'game' || drag) return;
    if ((innerWidth <= 820) !== portrait) { dims(); scatter(cl.filter(c => c.x === null)); } // đổi ngang/dọc → rải lại các cụm chưa đặt
    render();
  }, 120);
});
addEventListener('hashchange', route);
route();
})();
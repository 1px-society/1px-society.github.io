// 작은 SVG 차트 두 가지: 막대(시간대·월별·대운), 선(30일 점수). 한 색, 2px 선, 누르거나 올리면 값이 뜬다.
const NS = 'http://www.w3.org/2000/svg';
const MAIN = '#ff5c8a';
const SOFT = '#ffc2d3';
const GRID = '#e7e1f3';
const INK = '#2a2440';
const MUTED = '#6b6488';

function svg(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function frame(host, height) {
  host.replaceChildren();
  host.classList.add('chart');
  const width = Math.max(280, Math.round(host.clientWidth || 360));
  const root = svg('svg', { viewBox: `0 0 ${width} ${height}`, width: '100%', height, role: 'img' });
  const tip = document.createElement('div');
  tip.className = 'chart-tip';
  tip.hidden = true;
  host.append(root, tip);
  return { root, tip, width };
}

function showTip(host, tip, x, y, text) {
  tip.textContent = text;
  tip.hidden = false;
  const w = tip.offsetWidth;
  const hw = host.clientWidth;
  tip.style.left = `${Math.min(Math.max(0, x - w / 2), hw - w)}px`;
  tip.style.top = `${Math.max(0, y - 44)}px`;
}

function gridlines(root, left, right, top, bottom, max) {
  for (const v of [50, 100]) {
    const y = bottom - ((bottom - top) * v) / max;
    root.append(svg('line', { x1: left, x2: right, y1: y, y2: y, stroke: GRID, 'stroke-width': 1, 'stroke-dasharray': v === 100 ? '0' : '3 4' }));
    const t = svg('text', { x: left - 6, y: y + 4, 'text-anchor': 'end', 'font-size': 10, fill: MUTED });
    t.textContent = String(v);
    root.append(t);
  }
  root.append(svg('line', { x1: left, x2: right, y1: bottom, y2: bottom, stroke: '#cfc7e6', 'stroke-width': 1 }));
}

// data: [{ label, value(0~100), tip, strong }]
export function barChart(host, data, { height = 170, labelEvery = 1 } = {}) {
  const { root, tip, width } = frame(host, height);
  const left = 28, right = width - 6, top = 12, bottom = height - 24;
  gridlines(root, left, right, top, bottom, 100);
  const slot = (right - left) / data.length;
  const bw = Math.max(6, slot - 4); // 막대 사이 2px씩
  data.forEach((d, i) => {
    const h = Math.max(2, ((bottom - top) * d.value) / 100);
    const x = left + i * slot + (slot - bw) / 2;
    const y = bottom - h;
    const r = Math.min(4, bw / 2);
    const path = `M${x},${bottom} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${bottom} Z`;
    root.append(svg('path', { d: path, fill: d.strong ? MAIN : SOFT }));
    if (d.strong) {
      const v = svg('text', { x: x + bw / 2, y: y - 4, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: INK });
      v.textContent = String(d.value);
      root.append(v);
    }
    if (i % labelEvery === 0) {
      const t = svg('text', { x: x + bw / 2, y: bottom + 15, 'text-anchor': 'middle', 'font-size': 10.5, fill: MUTED });
      t.textContent = d.label;
      root.append(t);
    }
    // 막대보다 넓은 터치 영역
    const hit = svg('rect', { x: left + i * slot, y: top, width: slot, height: bottom - top + 20, fill: 'transparent' });
    hit.style.cursor = 'pointer';
    const on = () => showTip(host, tip, ((x + bw / 2) / width) * host.clientWidth, (y / height) * height, d.tip);
    hit.addEventListener('pointerenter', on);
    hit.addEventListener('click', on);
    root.append(hit);
  });
  host.addEventListener('pointerleave', () => { tip.hidden = true; });
}

// data: [{ label, value, tip, mark }]
export function lineChart(host, data, { height = 180, labelEvery = 5 } = {}) {
  const { root, tip, width } = frame(host, height);
  const left = 28, right = width - 10, top = 14, bottom = height - 24;
  gridlines(root, left, right, top, bottom, 100);
  const x = (i) => left + ((right - left) * i) / Math.max(1, data.length - 1);
  const y = (v) => bottom - ((bottom - top) * v) / 100;
  const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');
  root.append(svg('polyline', { points: pts, fill: 'none', stroke: MAIN, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
  data.forEach((d, i) => {
    if (d.mark) root.append(svg('circle', { cx: x(i), cy: y(d.value), r: 4.5, fill: MAIN, stroke: '#fff', 'stroke-width': 2 }));
    if (i % labelEvery === 0) {
      const t = svg('text', { x: x(i), y: bottom + 15, 'text-anchor': 'middle', 'font-size': 10.5, fill: MUTED });
      t.textContent = d.label;
      root.append(t);
    }
  });
  const cross = svg('line', { y1: top, y2: bottom, stroke: INK, 'stroke-width': 1, 'stroke-dasharray': '2 3', opacity: 0 });
  const dot = svg('circle', { r: 5, fill: '#fff', stroke: MAIN, 'stroke-width': 2, opacity: 0 });
  root.append(cross, dot);
  const hit = svg('rect', { x: left, y: top, width: right - left, height: bottom - top + 20, fill: 'transparent' });
  const move = (ev) => {
    const box = root.getBoundingClientRect();
    const px = ((ev.clientX - box.left) / box.width) * width;
    const i = Math.max(0, Math.min(data.length - 1, Math.round(((px - left) / (right - left)) * (data.length - 1))));
    cross.setAttribute('x1', x(i));
    cross.setAttribute('x2', x(i));
    cross.setAttribute('opacity', 0.5);
    dot.setAttribute('cx', x(i));
    dot.setAttribute('cy', y(data[i].value));
    dot.setAttribute('opacity', 1);
    showTip(host, tip, (x(i) / width) * box.width, y(data[i].value), data[i].tip);
  };
  hit.addEventListener('pointermove', move);
  hit.addEventListener('click', move);
  root.append(hit);
  host.addEventListener('pointerleave', () => {
    tip.hidden = true;
    cross.setAttribute('opacity', 0);
    dot.setAttribute('opacity', 0);
  });
}

// 가로 점수 막대(분야별): [{ label, score, text }]
export function scoreBars(host, rows) {
  host.replaceChildren(...rows.map((r) => {
    const row = document.createElement('div');
    row.className = 'srow';
    const head = document.createElement('div');
    head.className = 'srow-head';
    const name = document.createElement('b');
    name.textContent = r.label;
    const num = document.createElement('span');
    num.textContent = `${r.score}점`;
    head.append(name, num);
    const track = document.createElement('div');
    track.className = 'srow-track';
    const fill = document.createElement('div');
    fill.className = 'srow-fill';
    fill.style.width = `${r.score}%`;
    track.append(fill);
    const p = document.createElement('p');
    p.textContent = r.text;
    row.append(head, track, p);
    return row;
  }));
}

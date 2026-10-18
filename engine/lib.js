// библиотека плоской векторной графики: всё возвращает строки SVG, без состояния
const C = {
  bg: '#050c1a', bg2: '#08122a', wall: '#111d33', wall2: '#0d172b', floor: '#0a1222', line: '#22314d', line2: '#33456a',
  light: '#dfe6f0', dim: '#7d8697', warm: '#f3b85a', warm2: '#ffdc8a', red: '#d7263d', yellow: '#ffcf2e', green: '#1f9d57',
  skin: '#d4a07c', skin2: '#b98563', hair: '#1a1411', suit: '#25314a', suit2: '#1b2438', pants: '#161d2d', shoe: '#0b0f17',
  door: '#6a4930', door2: '#7d5839', door3: '#563a25', metal: '#a7b0bd', sil: '#010309',
};
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (t, a, b) => clamp((t - a) / (b - a));
const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
const eout = u => 1 - Math.pow(1 - u, 3);
const ein = u => u * u * u;
const mix = (a, b, u) => a + (b - a) * u;
const f1 = v => (Math.round(v * 100) / 100);
// детерминированный шум
function hash(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
function noise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return mix(hash(i), hash(i + 1), u) * 2 - 1; }

function R(x, y, w, h, fill, extra = '') { return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${fill}" ${extra}/>`; }
function L(x1, y1, x2, y2, stroke, w = 1, extra = '') { return `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`; }
function Ci(x, y, r, fill, extra = '') { return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${fill}" ${extra}/>`; }
function P(d, fill, extra = '') { return `<path d="${d}" fill="${fill}" ${extra}/>`; }
function T(x, y, txt, size, fill, extra = '') { return `<text x="${f1(x)}" y="${f1(y)}" font-size="${size}" fill="${fill}" ${extra}>${txt}</text>`; }
function G(inner, tr = '', extra = '') { return `<g ${tr ? `transform="${tr}"` : ''} ${extra}>${inner}</g>`; }
const MONO = 'font-family="Plex" font-weight="600" letter-spacing="1.2"';

// общие градиенты (один раз на кадр в <defs>)
function defs() {
  return `<defs>
  <radialGradient id="glowW"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset=".35" stop-color="#e59a3a" stop-opacity=".28"/><stop offset="1" stop-color="#e59a3a" stop-opacity="0"/></radialGradient>
  <radialGradient id="glowC"><stop offset="0" stop-color="#9fd0ff" stop-opacity=".55"/><stop offset=".4" stop-color="#5b8fd6" stop-opacity=".18"/><stop offset="1" stop-color="#5b8fd6" stop-opacity="0"/></radialGradient>
  <radialGradient id="glowR"><stop offset="0" stop-color="#ff5a4a" stop-opacity=".6"/><stop offset="1" stop-color="#ff2a2a" stop-opacity="0"/></radialGradient>
  <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c3cad4"/><stop offset=".5" stop-color="#6c7482"/><stop offset="1" stop-color="#3a404b"/></linearGradient>
  <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1c7" stop-opacity=".35"/><stop offset="1" stop-color="#fff1c7" stop-opacity="0"/></linearGradient>
  <linearGradient id="screen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9ecff"/><stop offset="1" stop-color="#9cc7f2"/></linearGradient>
  </defs>`;
}

// ---------- человечек. ноги в (x,y), рост h. pose: stand|walk|reach|sit|crouch|phone|look ; face 1 вправо, -1 влево
function person(o) {
  const { x, y, h = 70, face = 1, pose = 'stand', t = 0, sil = false, arm = null, hold = '' } = o;
  const s = h / 100;
  const k = sil ? C.sil : null;
  const col = (c) => k || c;
  let legL = 0, legR = 0, armF = 8, armB = -6, bob = 0, sit = 0, lean = 0;
  if (pose === 'walk') { const p = Math.sin(t * 7.5); legL = 22 * p; legR = -22 * p; armF = -16 * p; armB = 16 * p; bob = Math.abs(Math.cos(t * 7.5)) * 1.6; }
  if (pose === 'reach') { armF = -92; armB = -4; }
  if (pose === 'phone') { armF = -150; }
  if (pose === 'look') { armF = -60; lean = 4; }
  if (pose === 'crouch') { sit = 22; legL = 50; legR = -35; armF = -40; lean = 10; }
  if (pose === 'sit') { sit = 34; legL = 85; legR = 85; armF = -50; armB = -30; }
  if (arm !== null) armF = arm;
  const hip = -46 + sit - bob, sh = -80 + sit - bob;
  const leg = (ang, dx, c) => G(R(-3.5, 0, 7, 46, col(c), 'rx="3"') + R(-4, 42, 10, 5, col(C.shoe), 'rx="2"'), `translate(${dx},${hip}) rotate(${ang})`);
  const armS = (ang, dx, c) => G(R(-3, -2, 6, 34, col(c), 'rx="3"') + Ci(0, 34, 3.6, col(C.skin)) + (hold && c === C.suit ? hold : ''), `translate(${dx},${sh + 2}) rotate(${ang})`);
  let body = '';
  body += leg(legR, 2.5, C.pants) + leg(legL, -2.5, C.pants);
  body += armS(armB, -2, C.suit2);
  body += G(
    R(-10, sh, 20, hip - sh + 4, col(C.suit), 'rx="5"') + R(1, sh, 9, hip - sh + 4, col(C.suit2), 'rx="4" opacity=".55"') +
    (sil ? '' : P(`M-3.5 ${sh} L3.5 ${sh} L0 ${sh + 9} Z`, '#e8ecf2')),
    `rotate(${lean} 0 ${hip})`);
  // голова
  const hy = sh - 11;
  body += G(
    Ci(0, hy, 8.6, col(C.skin)) + (sil ? '' :
      P(`M-8.8 ${hy - 1} C-9 ${hy - 11},7 ${hy - 13},8.8 ${hy - 3} L8.8 ${hy - 1} C6 ${hy - 6},-3 ${hy - 7},-8.8 ${hy + 3} Z`, C.hair) +
      Ci(5.2, hy - 0.5, 1, '#1a1a1a') + R(-9.4, hy - 2, 3, 5, C.skin2, 'rx="1.5"')),
    `rotate(${lean} 0 ${hip})`);
  body += armS(armF, 2, C.suit);
  return G(body, `translate(${f1(x)},${f1(y)}) scale(${f1(s * face)},${f1(s)})`);
}
// тёмный силуэт: выше, тоньше, без деталей; eyes — два бледных огонька
function shadow(x, y, h = 80, eyes = 0, face = 1) {
  const s = h / 100;
  let g = P('M-11 -76 C-12 -40,-9 -10,-8 0 L8 0 C9 -10,12 -40,11 -76 C9 -84,-9 -84,-11 -76 Z', C.sil) + Ci(0, -88, 9.5, C.sil);
  if (eyes > 0) g += Ci(-3.2, -89, 1.3, `rgba(230,236,245,${eyes})`) + Ci(3.2, -89, 1.3, `rgba(230,236,245,${eyes})`);
  return G(g, `translate(${f1(x)},${f1(y)}) scale(${f1(s * face)},${f1(s)})`);
}

// ---------- предметы
function door(o) {
  const { x, y, w = 70, h = 140, num = '', open = 0, peep = true, color = C.door, chain = false } = o;
  let g = R(x - 5, y - 5, w + 10, h + 5, '#1a2438') + R(x, y, w, h, '#03060c');
  const ow = w * (1 - open * 0.82);
  g += R(x, y, ow, h, color) + R(x + 7, y + 10, ow - 14, h * 0.38, C.door2, 'opacity=".55"') + R(x + 7, y + h * 0.53, ow - 14, h * 0.4, C.door2, 'opacity=".55"');
  g += R(x + ow - 3, y, 3, h, C.door3);
  if (open < .5) {
    g += R(x + ow - 17, y + h * 0.5 - 2, 12, 3.4, C.metal, 'rx="1.5"') + Ci(x + ow - 13, y + h * 0.5 + 9, 2.2, C.metal);
    if (peep) g += Ci(x + ow / 2, y + h * 0.3, 2.6, '#1a1a1a') + Ci(x + ow / 2, y + h * 0.3, 1.5, '#5d6676');
    if (num) g += R(x + ow / 2 - 9, y + 14, 18, 10, '#c9ced6', 'rx="1"') + T(x + ow / 2, y + 22, num, 7.5, '#20242c', 'text-anchor="middle" font-family="Mont" font-weight="800"');
    if (chain) g += P(`M${x + ow - 6} ${y + h * 0.42} q 8 6 0 14`, 'none', `stroke="${C.metal}" stroke-width="1.2" stroke-dasharray="2 1.5"`);
  }
  return g;
}
function windowW(o) {
  const { x, y, w = 90, h = 120, night = true, glow = 0, curtain = 0, stars = true, frame = '#2a3a58' } = o;
  let g = R(x - 4, y - 4, w + 8, h + 8, frame) + R(x, y, w, h, night ? '#071328' : '#7f93ad');
  if (stars && night) for (let i = 0; i < 9; i++) g += Ci(x + hash(i * 3.1 + x) * w, y + hash(i * 7.7 + y) * h * 0.7, 0.6, '#aab6cc');
  if (glow) g += R(x, y, w, h, `rgba(255,214,130,${glow})`);
  g += L(x + w / 2, y, x + w / 2, y + h, frame, 3) + L(x, y + h * 0.42, x + w, y + h * 0.42, frame, 3);
  if (curtain) { g += R(x - 6, y - 6, (w / 2 + 6) * curtain, h + 12, '#2c1f2a', 'opacity=".95"') + R(x + w + 6 - (w / 2 + 6) * curtain, y - 6, (w / 2 + 6) * curtain, h + 12, '#2c1f2a', 'opacity=".95"'); }
  g += R(x - 8, y + h + 4, w + 16, 5, '#2f3f5e');
  return g;
}
function candle(x, y, t, s = 1, lit = 1) {
  const fl = 1 + 0.12 * noise1(t * 9) + 0.05 * noise1(t * 23);
  let g = '';
  if (lit) g += Ci(x, y - 14 * s, 70 * s * fl, 'url(#glowW)', `opacity="${lit}"`);
  g += R(x - 3 * s, y - 12 * s, 6 * s, 12 * s, '#efe6d4', 'rx="1"') + L(x, y - 12 * s, x, y - 14 * s, '#222', 0.8);
  if (lit) g += P(`M${x} ${y - 21 * s * fl} C${x + 2.6 * s} ${y - 16 * s},${x + 2 * s} ${y - 13 * s},${x} ${y - 13 * s} C${x - 2 * s} ${y - 13 * s},${x - 2.6 * s} ${y - 16 * s},${x} ${y - 21 * s * fl} Z`, '#ffd86b', `opacity="${lit}"`);
  return g;
}
function phone(o) {
  // смартфон: x,y центр, w ширина; screen: html-строки сообщений через lines
  const { x, y, w = 120, lines = [], glow = 1, light = true } = o;
  const h = w * 2.05, r = w * 0.14;
  let g = '';
  if (glow) g += Ci(x, y, w * 1.6, 'url(#glowC)', `opacity="${glow}"`);
  g += R(x - w / 2, y - h / 2, w, h, '#0e1118', `rx="${r}"`) + R(x - w / 2 + 4, y - h / 2 + 4, w - 8, h - 8, light ? 'url(#screen)' : '#0a0f19', `rx="${r - 3}"`);
  g += R(x - w * 0.16, y - h / 2 + 8, w * 0.32, 6, '#0e1118', 'rx="3"');
  return g;
}
// окно сообщения на экране телефона (пузырь)
function bubble(x, y, w, lines, o = {}) {
  const { bg = '#ffffff', fg = '#121620', size = 7.4, lh = 9.6, title = '', tcol = '#c0392b' } = o;
  const h = lines.length * lh + 10 + (title ? lh : 0);
  let g = R(x, y, w, h, bg, 'rx="6"');
  let yy = y + 8 + size * 0.75;
  if (title) { g += T(x + 7, yy, title, size * 0.92, tcol, 'font-family="Mont" font-weight="800"'); yy += lh; }
  lines.forEach(l => { g += T(x + 7, yy, l, size, fg, 'font-family="Mont" font-weight="600"'); yy += lh; });
  return { svg: g, h };
}
function radiator(x, y, w = 60, h = 34) {
  let g = '';
  const n = Math.floor(w / 7);
  for (let i = 0; i < n; i++) g += R(x + i * 7, y, 5.6, h, '#d9dee6', 'rx="2.6"');
  g += R(x, y + h * 0.2, w - 1, 2, '#b9c0cb') + R(x, y + h * 0.75, w - 1, 2, '#b9c0cb');
  return g;
}
// глазок: всё вне круга — тьма, кольцо металлическое
function peephole(cx = 180, cy = 300, r = 128, a = 1) {
  return P(`M-20 -20 H380 V660 H-20 Z M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`, '#000', `fill-rule="evenodd" opacity="${a}"`) +
    Ci(cx, cy, r + 4, 'none', `stroke="url(#ring)" stroke-width="10" opacity="${a}"`) +
    Ci(cx, cy, r - 2, 'none', `stroke="rgba(0,0,0,.6)" stroke-width="8" opacity="${a}"`);
}
// стрелка-пунктир и выноски
function dashed(x1, y1, x2, y2, col = C.yellow, u = 1) {
  const x = mix(x1, x2, u), y = mix(y1, y2, u);
  return L(x1, y1, x, y, col, 1.4, 'stroke-dasharray="4 3"');
}
function stars(n, seed, x0, y0, w, h, a = 1) {
  let g = '';
  for (let i = 0; i < n; i++) g += Ci(x0 + hash(i * 1.37 + seed) * w, y0 + hash(i * 2.91 + seed) * h, 0.5 + hash(i * 5.1 + seed) * 0.6, `rgba(200,212,232,${a * (0.4 + 0.6 * hash(i * 9.2 + seed))})`);
  return g;
}

// ---------- общие для сцен
const GROUND = 372;          // линия пола: ниже неё — зона субтитров, держать пустой и тёмной
// ключи [[u, значение], ...] -> значение в момент u (плавно)
function kf(keys, u) {
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (u <= keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i]; return mix(va, vb, ease((u - a) / (b - a))); }
  }
  return keys[keys.length - 1][1];
}
// снег: детерминированные хлопья в прямоугольнике
function snow(x0, y0, w, h, t, n = 40, seed = 1, wind = 18, a = .8) {
  let g = '';
  for (let i = 0; i < n; i++) {
    const sp = 22 + hash(i * 3.3 + seed) * 30, r = 0.6 + hash(i * 7.1 + seed) * 1.1;
    const yy = ((hash(i * 1.9 + seed) * h + t * sp) % h);
    const xx = ((hash(i * 5.7 + seed) * w + t * wind + Math.sin(t * 1.3 + i) * 4) % w + w) % w;
    g += Ci(x0 + xx, y0 + yy, r, `rgba(220,230,245,${a * (0.5 + 0.5 * hash(i * 9.9 + seed))})`);
  }
  return g;
}
// школьный динамик громкой связи
function speakerBox(x, y, s = 1, a = 1) {
  let g = R(x - 2 * s, y - 16 * s, 4 * s, 8 * s, '#2a3448') + R(x - 15 * s, y - 9 * s, 30 * s, 22 * s, '#cfd5de', `rx="${2.5 * s}"`);
  for (let i = 0; i < 5; i++) g += L(x - 10 * s, y - 4 * s + i * 3.4 * s, x + 10 * s, y - 4 * s + i * 3.4 * s, '#7c8697', 1.1 * s);
  return G(g, '', `opacity="${a}"`);
}
// волны звука (дуги) от точки; e — фаза 0..1 одной волны
function rings(x, y, t, opt = {}) {
  const { n = 3, r0 = 8, r1 = 46, col = '#cfd8e6', speed = 1.1, a = 0.8, w = 1.4, dir = 1 } = opt;
  let g = '';
  for (let i = 0; i < n; i++) {
    let e = ((t * speed + i / n) % 1);
    if (dir < 0) e = 1 - e;
    const r = mix(r0, r1, e);
    g += Ci(x, y, r, 'none', `stroke="${col}" stroke-width="${w}" opacity="${f1(a * (1 - e))}"`);
  }
  return g;
}

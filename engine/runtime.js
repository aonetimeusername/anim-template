// рантайм: render(t) детерминированно собирает кадр из story (сцены, камера, плашки, субтитры, зерно)
let S = null;
const $ = id => document.getElementById(id);

function init(story) { S = story; if (S.look) $('root').classList.add('look-' + S.look); }

function shotAt(t) {
  for (const sh of S.shots) if (t >= sh.t0 && t < sh.t1) return sh;
  return S.shots[S.shots.length - 1];
}

function camera(sh, t) {
  const c = sh.cam || {};
  const u = ease(lin(t, sh.t0, sh.t1));
  const z = mix(c.z0 ?? 1, c.z1 ?? 1.05, u);
  const x = mix(c.x0 ?? 0, c.x1 ?? 0, u), y = mix(c.y0 ?? 0, c.y1 ?? 0, u);
  // лёгкое «дыхание» камеры
  const dx = noise1(t * 0.35 + 3) * 1.6, dy = noise1(t * 0.3 + 11) * 1.6;
  // толчок камеры (удар)
  let kick = 0;
  for (const k of (S.kicks || [])) { const a = t - k; if (a >= 0 && a < 0.35) kick += Math.exp(-a * 12) * Math.sin(a * 70) * 3.5; }
  $('cam').style.transformOrigin = `${180 + (c.ox ?? 0)}px ${320 + (c.oy ?? 0)}px`;
  $('cam').style.transform = `translate(${f1(x + dx + kick)}px,${f1(y + dy)}px) scale(${z})`;
}

// «за вами смотрят»: передний план укрытия поверх кадра, медленный чужой дрейф (o.peek: door | slit | corner)
function peek(o, t, a) {
  const sx = noise1(t * 0.21 + 5) * 6, sy = noise1(t * 0.17 + 9) * 4;
  const D = '#020306', E = 'rgba(120,150,200,.10)';
  let g = '';
  if (o.peek === 'door') {          // щель приоткрытой двери: слева полотно, справа косяк; tOpen — дверь открывается шире (l → l1, r → r1)
    const ko = o.tOpen ? ease(lin(t, o.tOpen[0], o.tOpen[1])) : 0;
    const L = mix(o.l ?? 84, o.l1 ?? o.l ?? 84, ko), R = mix(o.r ?? 298, o.r1 ?? o.r ?? 298, ko);
    g += `<path d="M-60 -60 H${L} C${L - 7} 160 ${L + 5} 430 ${L - 3} 720 H-60 Z" fill="${D}"/>`;
    g += `<path d="M${L} -60 C${L - 7} 160 ${L + 5} 430 ${L - 3} 720" stroke="${E}" stroke-width="3" fill="none"/>`;
    g += `<rect x="${R}" y="-60" width="${430 - R}" height="780" fill="${D}"/><rect x="${R - 9}" y="-60" width="10" height="780" fill="#080b12"/>`;
  } else if (o.peek === 'slit') {   // низко, из-под двери: широкая щель, сверху полотно, снизу порог
    const T = o.top ?? 96, B = o.bot ?? 372;
    g += `<rect x="-60" y="-60" width="480" height="${T + 60}" fill="${D}"/><rect x="-60" y="${B}" width="480" height="${720 - B}" fill="${D}"/>`;
    g += `<rect x="-60" y="${B - 5}" width="480" height="5" fill="rgba(243,184,90,.16)"/>`;
  } else {                          // из-за угла / из-за курток: тёмные массы слева и сверху
    g += `<path d="M-60 -60 H200 C150 -20 110 10 84 70 C62 150 74 260 58 380 C50 470 64 600 40 720 H-60 Z" fill="${D}"/>`;
    g += `<path d="M84 70 C62 150 74 260 58 380" stroke="${E}" stroke-width="3" fill="none"/>`;
  }
  return `<svg style="position:absolute;left:-30px;top:-30px;width:420px;height:700px;opacity:${a};transform:translate(${f1(sx)}px,${f1(sy)}px)" viewBox="-30 -30 420 700">` +
    `<defs><filter id="pkb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${o.soft ?? 7}"/></filter></defs><g filter="url(#pkb)">${g}</g></svg>`;
}

// точка сцены → экран с учётом камеры кадра (как camera(), без толчков)
function toScreen(sh, t, x, y) {
  const c = sh.cam || {};
  const z = mix(c.z0 ?? 1, c.z1 ?? 1.05, ease(lin(t, sh.t0, sh.t1)));
  const tx = mix(c.x0 ?? 0, c.x1 ?? 0, ease(lin(t, sh.t0, sh.t1))) + noise1(t * 0.35 + 3) * 1.6;
  const ty = mix(c.y0 ?? 0, c.y1 ?? 0, ease(lin(t, sh.t0, sh.t1))) + noise1(t * 0.3 + 11) * 1.6;
  const ox = 180 + (c.ox ?? 0), oy = 320 + (c.oy ?? 0);
  return [ox + (x - ox) * z + tx, oy + (y - oy) * z + ty, z];
}
// рамка захвата «ВЫ»: o.box [x, y, w, h] в координатах сцены или o.keys [[t, x, y, w, h], ...]; захват за 0.25 с при t0
function track(o, t) {
  let b = o.box;
  if (o.keys) {
    const K = o.keys; b = K[0].slice(1);
    for (let i = 0; i < K.length; i++) if (t >= K[i][0]) b = K[i].slice(1);
    for (let i = 0; i + 1 < K.length; i++) if (t >= K[i][0] && t < K[i + 1][0] && K[i + 1][0] - K[i][0] < 1.5) {
      const k = ease(lin(t, K[i][0], K[i + 1][0])); b = K[i].slice(1).map((v, j) => mix(v, K[i + 1][j + 1], k));
    }
  }
  const sh = shotAt(t);
  const [x0, y0, z] = toScreen(sh, t, b[0], b[1]);
  let w = b[2] * z, hh = b[3] * z;
  const lock = eout(lin(t, o.t0, o.t0 + 0.25)), grow = 1 + 0.6 * (1 - lock);
  const jx = noise1(t * 2.3 + 1) * 1.2, jy = noise1(t * 2.1 + 7) * 1.2;
  const cx = x0 + w / 2 + jx, cy = y0 + hh / 2 + jy;
  w *= grow; hh *= grow;
  const L = Math.min(12, w * 0.3), col = o.color || '#ff3030';
  const a = lock * (1 - lin(t, o.t1 - 0.1, o.t1)) * ((t - o.t0) < 0.25 ? ((t * 30 | 0) % 2 ? 0.4 : 1) : 1);
  const c = (px, py, sx, sy) => `<path d="M${f1(px)} ${f1(py + sy * L)} V${f1(py)} H${f1(px + sx * L)}" stroke="${col}" stroke-width="1.6" fill="none"/>`;
  const X0 = cx - w / 2, Y0 = cy - hh / 2, X1 = cx + w / 2, Y1 = cy + hh / 2;
  return `<svg style="position:absolute;inset:0;width:360px;height:640px;opacity:${f1(a)}" viewBox="0 0 360 640">` +
    c(X0, Y0, 1, 1) + c(X1, Y0, -1, 1) + c(X0, Y1, 1, -1) + c(X1, Y1, -1, -1) +
    `<rect x="${f1(X0)}" y="${f1(Y0 - 13)}" width="${(o.text || 'ВЫ').length * 7 + 10}" height="12" fill="${col}"/>` +
    `<text x="${f1(X0 + 5)}" y="${f1(Y0 - 3.5)}" font-family="Plex" font-weight="600" font-size="9" letter-spacing="1" fill="#fff">${o.text || 'ВЫ'}</text></svg>`;
}
// видоискатель наблюдателя: уголки, «● REC», таймкод (o.clock0 — секунды суток в t=0)
function vf(o, t) {
  const s = Math.floor((o.clock0 ?? 3 * 3600 + 7 * 60) + t), hh = String(Math.floor(s / 3600) % 24).padStart(2, '0');
  const mm = String(Math.floor(s / 60) % 60).padStart(2, '0'), ss = String(s % 60).padStart(2, '0');
  const k = (px, py, sx, sy) => `<path d="M${px} ${py + sy * 16} V${py} H${px + sx * 16}" stroke="rgba(255,255,255,.75)" stroke-width="1.5" fill="none"/>`;
  const on = (t * 1.2) % 1 < 0.6, B = o.bottom ?? 366;
  if (o.bare) return `<svg style="position:absolute;inset:0;width:360px;height:640px" viewBox="0 0 360 640">` + k(14, 14, 1, 1) + k(346, 14, -1, 1) + k(14, B, 1, -1) + k(346, B, -1, -1) + `</svg>`;
  return `<svg style="position:absolute;inset:0;width:360px;height:640px" viewBox="0 0 360 640">` +
    k(14, 14, 1, 1) + k(346, 14, -1, 1) + k(14, B, 1, -1) + k(346, B, -1, -1) +
    `<circle cx="27" cy="29" r="3.6" fill="#ff3030" opacity="${on ? 1 : 0.25}"/>` +
    `<text x="35" y="32.5" font-family="Plex" font-weight="600" font-size="9.5" letter-spacing="1.2" fill="rgba(255,255,255,.85)">REC</text>` +
    `<text x="333" y="32.5" text-anchor="end" font-family="Plex" font-weight="600" font-size="9.5" letter-spacing="1.2" fill="rgba(255,255,255,.85)">${hh}:${mm}:${ss}</text>` +
    (o.label ? `<text x="333" y="${B - 6}" text-anchor="end" font-family="Plex" font-weight="600" font-size="8" letter-spacing="1.4" fill="rgba(255,255,255,.6)">${o.label}</text>` : '') + `</svg>`;
}

function overlays(t) {
  let h = '';
  for (const o of S.overlays) {
    if (o.kind !== 'peek' || t < o.t0 || t >= o.t1) continue;
    h += peek(o, t, lin(t, o.t0, o.t0 + (o.fin ?? 0.01)) * (1 - lin(t, o.t1 - (o.fout ?? 0.01), o.t1)));
  }
  for (const o of S.overlays) {
    if (t < o.t0 || t >= o.t1) continue;
    if (o.kind === 'vf') h += vf(o, t);
    else if (o.kind === 'track') h += track(o, t);
  }
  for (const o of S.overlays) {
    if (t < o.t0 || t >= o.t1) continue;
    const a = lin(t, o.t0, o.t0 + 0.14) * (1 - lin(t, o.t1 - 0.12, o.t1));
    const sc = 0.82 + 0.18 * eout(lin(t, o.t0, o.t0 + 0.16));
    const st = `left:${o.x}px;top:${o.y}px;opacity:${a};transform:translate(-50%,-50%) rotate(${o.rot || 0}deg) scale(${sc});`;
    if (o.kind === 'stk') h += `<div class="stk" style="${st}">${o.n ? `<span class="n">${o.n}.</span>` : ''}${o.text}</div>`;
    else if (o.kind === 'hand') h += `<div class="stk hand" style="${st}">${o.text}${o.sub ? `<small>${o.sub}</small>` : ''}</div>`;
    else if (o.kind === 'chip') h += `<div class="chip ${o.color || 'dark'}" style="${st}">${o.text}</div>`;
    else if (o.kind === 'mono') h += `<div class="mono" style="${st}transform:translate(-50%,-50%);">${o.text}</div>`;
    else if (o.kind === 'you') h += `<div class="you" style="${st}">${o.text || 'ВЫ'}</div>`;
    else if (o.kind === 'part') h += `<div class="part" style="top:${o.y}px;opacity:${a};font-size:${o.size || 30}px;line-height:${(o.size || 30) * 1.08}px;">${o.sub ? `<i>${o.sub}</i>` : ''}${o.text}</div>`;
  }
  $('ov').innerHTML = h;
}

function captions(t) {
  const W = S.words, P = S.pages;
  let cur = -1;
  for (let i = 0; i < P.length; i++) {
    const st = (i === 0 && S.capFrom0) ? -1 : W[P[i][0]].t0 - 0.05;   // capFrom0: первая страница видна уже в нулевом кадре
    const en = i + 1 < P.length ? Math.min(W[P[i + 1][0]].t0 - 0.05, W[P[i][P[i].length - 1]].t1 + 0.6) : W[P[i][P[i].length - 1]].t1 + 0.6;
    if (t >= st && t < en) { cur = i; break; }
  }
  const cap = $('cap');
  if (cur < 0 || (S.capOff || []).some(([a, b]) => t >= a && t < b)) { cap.innerHTML = ''; return; }
  const p0 = W[P[cur][0]].t0 - 0.05;
  const pop = 1 + 0.07 * (1 - eout(lin(t, p0, p0 + 0.09)));
  cap.style.transform = `scale(${pop})`;
  cap.innerHTML = P[cur].map(i => {
    const w = W[i];
    const on = t >= w.t0 - 0.02 || (cur === 0 && S.capFrom0);   // первая страница сразу белая: её видно в ленте до старта
    return `<span class="w ${on ? 'on' : ''} ${w.c || ''}">${w.w}</span>${w.br ? '<br>' : ''}`;
  }).join('');
}

let grainCtx = null, grainImg = null;
function grain(frame) {
  if (!grainCtx) { grainCtx = $('grain').getContext('2d'); grainImg = grainCtx.createImageData(360, 640); }
  const d = grainImg.data;
  let s = (frame * 2654435761) >>> 0;
  for (let i = 0; i < d.length; i += 4) {
    s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
    const v = s & 255;
    d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
  }
  grainCtx.putImageData(grainImg, 0, 0);
}

function fadeAt(t) {
  let a = 0;
  for (const f of (S.fades || [])) {   // {t0,t1,a0,a1}
    if (t >= f.t0 && t <= f.t1) a = Math.max(a, mix(f.a0, f.a1, lin(t, f.t0, f.t1)));
  }
  return a;
}

// «look» — цветовое решение поверх любой сцены (S.look или cam.look кадра); без look кадр не меняется
const LUM = '.2126 .7152 .0722 0 0';
const tbl = (stops, ch) => stops.map(c => (parseInt(c.slice(1 + 2 * ch, 3 + 2 * ch), 16) / 255).toFixed(3)).join(' ');
const ramp = stops => [0, 1, 2].map(ch => `<feFunc${'RGB'[ch]} type="table" tableValues="${tbl(stops, ch)}"/>`).join('');
const KEEP_RED = `<feColorMatrix in="SourceGraphic" type="matrix" values="1.15 0 0 0 0  0 .9 0 0 0  0 0 .9 0 0  4.2 -4.2 0 0 -1.15" result="red"/>`;
const LOOKS = {
  // монохром с холодным оттенком, красный остаётся красным (опасность = единственный цвет)
  mono: `${'<feColorMatrix type="matrix" values="' + LUM + ' ' + LUM + ' ' + LUM + ' 0 0 0 1 0"/>'}<feComponentTransfer result="m">${ramp(['#030405', '#14181d', '#2f363e', '#58616b', '#8b939b', '#b9bfc4', '#dde0e2', '#f2f3f4', '#ffffff', '#ffffff', '#ffffff'])}</feComponentTransfer>${KEEP_RED}<feComposite in="red" in2="m" operator="over"/>`,
  // ночь в холодном тоне: чёрно-синий → бледно-голубой, красный остаётся
  night: `${'<feColorMatrix type="matrix" values="' + LUM + ' ' + LUM + ' ' + LUM + ' 0 0 0 1 0"/>'}<feComponentTransfer result="m">${ramp(['#020309', '#0c1426', '#1f2f4c', '#3f5679', '#6e86a8', '#a3b6cf', '#cfdbe9', '#eef3f9', '#ffffff', '#ffffff', '#ffffff'])}</feComponentTransfer>${KEEP_RED}<feComposite in="red" in2="m" operator="over"/>`,
  // приглушённый цвет: насыщенность 30 %, тени глубже, красный остаётся полным
  muted: `<feColorMatrix type="saturate" values=".3"/><feComponentTransfer result="m"><feFuncR type="gamma" amplitude="1.15" exponent="1.1"/><feFuncG type="gamma" amplitude="1.15" exponent="1.1"/><feFuncB type="gamma" amplitude="1.2" exponent="1.05"/></feComponentTransfer>${KEEP_RED}<feComposite in="red" in2="m" operator="over"/>`,
  // ночная камера наблюдения: зелёно-серый, тени подняты
  cctv: `${'<feColorMatrix type="matrix" values="' + LUM + ' ' + LUM + ' ' + LUM + ' 0 0 0 1 0"/>'}<feComponentTransfer>${ramp(['#06100b', '#1d3326', '#3d5c47', '#62836b', '#8aa891', '#b2c9b6', '#d3e3d4', '#ebf3ea', '#f7fbf6', '#ffffff', '#ffffff'])}</feComponentTransfer>`,
  // ризограф: синяя краска + розово-красная на бумаге
  riso: `${'<feColorMatrix type="matrix" values="' + LUM + ' ' + LUM + ' ' + LUM + ' 0 0 0 1 0"/>'}<feComponentTransfer>${ramp(['#141833', '#272a56', '#6a2f63', '#d8435f', '#ff6b6b', '#f7c9b0', '#f3ead8', '#f3ead8', '#f3ead8', '#f3ead8', '#f3ead8'])}</feComponentTransfer>`,
};
function looked(look, body, t) {
  if (!look || !LOOKS[look]) return body;
  let over = '';
  if (look === 'cctv') over = `<defs><pattern id="lk_scan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="rgba(0,0,0,.28)"/></pattern></defs><rect x="-200" y="-200" width="760" height="1040" fill="url(#lk_scan)"/>` +
    `<rect x="-200" y="${f1(((t * 70) % 760) - 200)}" width="760" height="22" fill="rgba(200,255,210,.05)"/>`;
  if (look === 'riso') over = `<defs><pattern id="lk_dot" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(18)"><circle cx="1.5" cy="1.5" r=".55" fill="rgba(20,24,51,.22)"/></pattern></defs><rect x="-200" y="-200" width="760" height="1040" fill="url(#lk_dot)"/>`;
  return `<defs><filter id="lk_${look}" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">${LOOKS[look]}</filter></defs>` +
    `<g filter="url(#lk_${look})">${body}</g>${over}`;
}

function render(t, frame) {
  const sh = shotAt(t);
  const fn = SCENES[sh.scene];
  const u = t - sh.t0;
  const body = fn ? fn(u, sh.p || {}, sh.t1 - sh.t0, t) : '';
  $('stage').innerHTML = defs() + looked((sh.cam || {}).look ?? S.look, body, t);
  camera(sh, t);
  overlays(t);
  captions(t);
  grain(Math.floor((frame ?? Math.round(t * 30)) / 2));   // зерно меняется 15 раз в секунду — легче для кодека
  $('fade').style.opacity = fadeAt(t);
  return sh.scene;
}

// сцена bedroom: спальня Даши ночью, вид сбоку (три четверти). Колонка на тумбочке, жалюзи с оранжевым фонарём, приоткрытая дверь, тьма под кроватью
//   p.ring  — [[t0,t1,'listen'|'speak'], ...] состояние кольца колонки (вне интервалов — слабое синее дежурное)
//   p.phone — [t0,t1] Даша держит телефон над лицом (с t0 телефон уходит с тумбочки и остаётся у неё в руке)
//   p.under — t: под кроватью проявляются глаза и облачко выдоха (0.6 с); облачко тает к концу кадра
//   p.still — true: не моргает
// Композиция под камеры: общий план; кольцо Z1.5–1.6 (ox −90, oy −20) — колонка слева, лицо в центре;
// финал Z1.7–1.9 (ox +20, oy +120) — щель под кроватью (y 312…348) в центре кадра, лицо Даши вверху слева.
(() => {
  const CAP = 'stroke-linecap="round" stroke-linejoin="round"';
  const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const rad = d => d * Math.PI / 180;
  const rot = (v, a) => [v[0] * Math.cos(rad(a)) - v[1] * Math.sin(rad(a)), v[0] * Math.sin(rad(a)) + v[1] * Math.cos(rad(a))];
  const SP = { x: 64, y: 214, rx: 19, ry: 5.8, base: 248 };   // верх колонки и низ корпуса
  const HD = { x: 154, y: 224 }, HS = 0.66, HR = -76;          // голова: центр, масштаб, поворот (нос вверх, подбородок вправо)
  const MT = 258, RAIL0 = 292, RAIL1 = 312, FL = 348;           // край матраса, царга, низ царги, пол у передних ножек
  const SK = '#b8998e', SK2 = '#8c7479', SK3 = '#6a5660', HAIRC = '#16111a', HAIR2 = '#3a2e3e', LIPS = '#946069';
  const PJ = '#8d96ae', PJ2 = '#6b7490', PJ3 = '#4c5470';
  const BL = '#283858', BL2 = '#1b2742', BL3 = '#3f5379', SHEET = '#66718e';
  const WOOD = '#2b2029', WOOD2 = '#3a2c36', WOOD3 = '#1d1620';

  function smooth(pts) {
    let s = '';
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      s += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
    }
    return s;
  }
  const RRX = SP.rx - 2.6, RRY = SP.ry - 0.9;
  const arcSeg = (a0, a1) => `M${f1(SP.x + RRX * Math.cos(a0))} ${f1(SP.y + RRY * Math.sin(a0))} A${RRX} ${RRY} 0 0 1 ${f1(SP.x + RRX * Math.cos(a1))} ${f1(SP.y + RRY * Math.sin(a1))}`;
  // сужающийся сегмент конечности: трапеция + круглые концы
  function seg(a, b, wa, wb, fill, extra = '') {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    return P(`M${f1(a[0] + nx * wa / 2)} ${f1(a[1] + ny * wa / 2)} L${f1(b[0] + nx * wb / 2)} ${f1(b[1] + ny * wb / 2)} L${f1(b[0] - nx * wb / 2)} ${f1(b[1] - ny * wb / 2)} L${f1(a[0] - nx * wa / 2)} ${f1(a[1] - ny * wa / 2)} Z`, fill, extra) +
      Ci(a[0], a[1], wa / 2, fill, extra) + Ci(b[0], b[1], wb / 2, fill, extra);
  }

  // голова в локальных координатах: профиль лицом вправо, потом поворот носом вверх
  const FACE = 'M-27 -8 C-27 4 -24 14 -18 24 C-12 31 -3 36 8 37.5 C13 38 16.5 35.6 19 31.6 C20.8 27.8 21.6 24 22.2 21 C22.8 18.4 23 16 23.6 13.4 C25 9 25.2 5 25 1 C26.4 -4 27.2 -11 26.6 -18 C24.6 -32 12 -39 -1 -39 C-16 -39 -27 -28 -27 -8 Z';
  const NOSE = 'M20.4 -2 C21.8 3.6 25.4 8.2 28.6 11.4 C28 14 25.2 15.4 22.2 14.8 Z';
  const EYE = 'M15.8 4.1 C13.3 -0.3 7.3 -1 3.6 2.2 C6.4 6.2 12.1 7.1 15.8 4.1 Z';
  const HAIR = 'M24 -24 C16 -23 7 -19 3 -11 C0 -5 -2 -1.5 -5 -1.5 C-10 -3 -15 -1 -16 6 C-17 13 -15 20 -12 26 L-20 28 C-29 20 -33 4 -31 -14 C-28 -32 -14 -44 2 -43 C14 -42 22 -35 24 -24 Z';
  const EY = 3.4;

  // кисть в покое (ладонью вниз), ось — вдоль предплечья
  function handRest(W, a) {
    let h = '';
    h += P('M-1 -4.4 C4 -5.2 9 -5 12 -3.6 C14.4 -2.4 14.6 2.6 12.4 4 C8 5.4 3 5.2 -1 4.2 Z', SK);
    h += P('M11 -3.6 C15 -3.8 18.6 -2.2 20 0.6 C20.6 2.8 19.2 4.4 17 4.2 L11.4 3.8 Z', SK);
    [-1.6, 0.4, 2.3].forEach(y => h += P(`M13.4 ${y} C15.6 ${f1(y + 0.2)} 17.6 ${f1(y + 0.6)} 19.4 ${f1(y + 1.4)}`, 'none', `stroke="${SK3}" stroke-width=".6" opacity=".75" ${CAP}`));
    h += P('M10.6 -3.6 C11.6 -1 11.6 1.6 10.8 3.8', 'none', `stroke="${SK2}" stroke-width=".7" opacity=".6" ${CAP}`);
    h += P('M3 3.8 C7 6.6 11 7.2 13.4 6.2', 'none', `stroke="${SK}" stroke-width="3" ${CAP}`) + P('M5 6.2 C8 7.9 11 8.1 13.6 7.1', 'none', `stroke="${SK3}" stroke-width=".6" opacity=".6" ${CAP}`);
    h += P('M-1 -4.4 C4 -5.2 9 -5 12 -3.6 C15 -3.8 18.6 -2.2 20 0.6', 'none', `stroke="#ffb870" stroke-width=".8" opacity=".25" ${CAP}`);
    return G(h, `translate(${f1(W[0])} ${f1(W[1])}) rotate(${f1(a)})`);
  }
  // кисть с телефоном: локальные координаты телефона (экран снизу, y+), запястье в (25.7, 7.9)
  const WRIST = [25.7, 7.9];
  function phoneHand(Pc, pa, scr) {
    let h = '';
    h += R(-18, -2.4, 36, 4.8, '#0a0e16', 'rx="1.6"') + R(-18, -2.4, 36, 1, '#3a4660', 'opacity=".6"') + R(-14, -3.1, 6, 0.9, '#141a26', 'rx=".4"');
    h += R(-17, 1.5, 34, 1.2, '#e8f4ff', `opacity="${f1(0.15 + 0.85 * scr)}"`);
    h += P('M28 9 C23 11.4 15.6 9.6 12.6 5.4 C10.6 2 11.6 -3 14.6 -5.2 C18.6 -7.4 24.4 -5.4 27.4 -1.4 C29.6 2 29.8 6 28 9 Z', SK);
    h += P('M27.4 -1.4 C29.6 2 29.8 6 28 9', 'none', `stroke="${SK3}" stroke-width=".8" opacity=".6" ${CAP}`);
    h += P('M16 -5.4 C11 -6.8 5 -6.6 1.4 -5 C0 -4.2 0.4 -2.6 1.8 -2.5 L15 -2.3 Z', SK);
    [4.6, 8.4, 12.2].forEach(x => h += L(x, -6.4, x + 0.3, -2.6, SK3, 0.6, 'opacity=".75"'));
    h += P('M15 2.6 C11 1.4 7.4 0.2 5 -0.4', 'none', `stroke="${SK}" stroke-width="3.2" ${CAP}`) + P('M14 4 C10.6 3 7.6 1.8 5.4 1.2', 'none', `stroke="${SK3}" stroke-width=".6" opacity=".6" ${CAP}`);
    h += P('M28 9 C23 11.4 15.6 9.6 12.6 5.4', 'none', `stroke="#d8ecff" stroke-width="1.2" opacity="${f1(0.6 * scr)}" ${CAP}`);
    h += P('M5 1.2 C8 2.4 11 3.4 14 4', 'none', `stroke="#d8ecff" stroke-width=".9" opacity="${f1(0.55 * scr)}" ${CAP}`);
    return G(h, `translate(${f1(Pc[0])} ${f1(Pc[1])}) rotate(${f1(pa)})`);
  }

  SCENES.bedroom = function (u, p, d, t) {
    const tEnd = t - u + d;
    const win = (a, b) => sstep(a, a + 0.18, t) * (1 - sstep(b - 0.18, b, t));
    let wl = 0, ws = 0;
    (p.ring || []).forEach(([a, b, m]) => { const w = win(a, b); if (m === 'speak') ws = Math.max(ws, w); else wl = Math.max(wl, w); });
    const ph = p.phone || null;
    const kR = ph ? eout(lin(t, ph[0], ph[0] + 0.65)) * (1 - ease(lin(t, ph[1], ph[1] + 0.7))) : 0;   // рука с телефоном поднята
    const phHeld = ph && t >= ph[0];
    const tU = p.under ?? 1e9;
    const kEye = ease(lin(t, tU, tU + 0.6));
    const kF = ease(lin(t, tU + 0.25, tU + 1.0));
    // огибающая «речи» колонки
    const gate = sstep(-0.3, 0.2, noise1(t * 2.6 + 9));
    const env = (0.5 + 0.5 * Math.sin(2 * Math.PI * 7.1 * t + 2.2 * noise1(t * 3.1))) * mix(0.3, 1, gate) * 0.75 + 0.25 * gate;
    const speakK = ws * env;
    const ls = 0.12 + 0.2 * wl + 1.25 * speakK;           // сила синего света колонки
    const lf = clamp((ls - 0.12) / 1.0);                   // доля света колонки, долетающая до лица
    const look = Math.max(wl, ws);                         // смотрит на колонку
    const br = Math.sin(t * 2 * Math.PI / 4.0) * 0.9;     // дыхание
    const flick = 1 + 0.035 * noise1(t * 2.2) + 0.02 * noise1(t * 9);
    let blink = 0;
    if (!p.still) { const per = 4.3, k = Math.floor((t + 0.7) / per), tb = k * per - 0.7 + 1.1 + 2.2 * hash(k * 3.3 + 1); const x = (t - tb) / 0.16; if (x > 0 && x < 1) blink = Math.sin(x * Math.PI); if (hash(k * 5.1) > .7) { const x2 = (t - tb - 0.3) / 0.16; if (x2 > 0 && x2 < 1) blink = Math.max(blink, Math.sin(x2 * Math.PI)); } }
    const scr = kR * (0.9 + 0.1 * noise1(t * 6));          // яркость экрана телефона

    // ---------- defs
    let g = `<defs>
      <linearGradient id="bd_wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070e1f"/><stop offset=".6" stop-color="#0f1a31"/><stop offset="1" stop-color="#111d36"/></linearGradient>
      <linearGradient id="bd_floor" gradientUnits="userSpaceOnUse" x1="0" y1="296" x2="0" y2="372"><stop offset="0" stop-color="#0a1222"/><stop offset=".7" stop-color="#0e182d"/><stop offset="1" stop-color="#070d1a"/></linearGradient>
      <linearGradient id="bd_band" gradientUnits="userSpaceOnUse" x1="320" y1="150" x2="110" y2="300"><stop offset="0" stop-color="#ffb55c" stop-opacity=".46"/><stop offset=".55" stop-color="#f09a42" stop-opacity=".2"/><stop offset="1" stop-color="#e08a36" stop-opacity="0"/></linearGradient>
      <linearGradient id="bd_bandB" gradientUnits="userSpaceOnUse" x1="370" y1="205" x2="200" y2="295"><stop offset="0" stop-color="#ffb55c" stop-opacity=".6"/><stop offset="1" stop-color="#f09a42" stop-opacity=".1"/></linearGradient>
      <linearGradient id="bd_cloth" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c2332"/><stop offset=".35" stop-color="#2d3648"/><stop offset=".7" stop-color="#232b3b"/><stop offset="1" stop-color="#171d2a"/></linearGradient>
      <linearGradient id="bd_nst" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2029"/><stop offset="1" stop-color="#21192a"/></linearGradient>
      <linearGradient id="bd_gap" gradientUnits="userSpaceOnUse" x1="0" y1="${RAIL1}" x2="0" y2="${FL}"><stop offset="0" stop-color="#000104"/><stop offset=".55" stop-color="#01030a"/><stop offset=".86" stop-color="#030713" stop-opacity=".92"/><stop offset="1" stop-color="#050b18" stop-opacity=".55"/></linearGradient>
      <linearGradient id="bd_gapH" gradientUnits="userSpaceOnUse" x1="112" y1="0" x2="362" y2="0"><stop offset="0" stop-color="#000104" stop-opacity=".6"/><stop offset=".12" stop-color="#000104" stop-opacity="0"/><stop offset=".9" stop-color="#000104" stop-opacity="0"/><stop offset="1" stop-color="#000104" stop-opacity=".5"/></linearGradient>
      <linearGradient id="bd_bot" gradientUnits="userSpaceOnUse" x1="0" y1="352" x2="0" y2="374"><stop offset="0" stop-color="#03060c" stop-opacity="0"/><stop offset="1" stop-color="#03060c" stop-opacity="1"/></linearGradient>
      <linearGradient id="bd_glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2740"/><stop offset=".5" stop-color="#6b4a30"/><stop offset="1" stop-color="#c88a48"/></linearGradient>
      <linearGradient id="bd_phL" gradientUnits="userSpaceOnUse" x1="31" y1="0" x2="2" y2="0"><stop offset="0" stop-color="#e2f0ff" stop-opacity=".7"/><stop offset=".5" stop-color="#bcdcff" stop-opacity=".3"/><stop offset="1" stop-color="#bcdcff" stop-opacity="0"/></linearGradient>
      <linearGradient id="bd_spL" gradientUnits="userSpaceOnUse" x1="0" y1="-42" x2="0" y2="18"><stop offset="0" stop-color="#6aaeff" stop-opacity=".75"/><stop offset=".55" stop-color="#4f8fe0" stop-opacity=".28"/><stop offset="1" stop-color="#4f8fe0" stop-opacity="0"/></linearGradient>
      <linearGradient id="bd_hb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6aaeff" stop-opacity=".55"/><stop offset="1" stop-color="#6aaeff" stop-opacity="0"/></linearGradient>
      <radialGradient id="bd_mist"><stop offset="0" stop-color="#d4e3f4" stop-opacity=".9"/><stop offset=".6" stop-color="#d4e3f4" stop-opacity=".4"/><stop offset="1" stop-color="#d4e3f4" stop-opacity="0"/></radialGradient>
      <radialGradient id="bd_eye"><stop offset="0" stop-color="#e8f1fb" stop-opacity=".6"/><stop offset="1" stop-color="#e8f1fb" stop-opacity="0"/></radialGradient>
      <radialGradient id="bd_blush"><stop offset="0" stop-color="#d6606a" stop-opacity=".26"/><stop offset="1" stop-color="#d6606a" stop-opacity="0"/></radialGradient>
      <radialGradient id="bd_vig" cx=".5" cy=".42" r=".75"><stop offset=".55" stop-color="#02050b" stop-opacity="0"/><stop offset="1" stop-color="#02050b" stop-opacity=".6"/></radialGradient>
      <pattern id="bd_mesh" width="2.6" height="2.6" patternUnits="userSpaceOnUse"><path d="M0 0L2.6 2.6M2.6 0L0 2.6" stroke="#000" stroke-opacity=".38" stroke-width=".55"/></pattern>
      <filter id="bd_bl" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="2.4"/></filter>
      <filter id="bd_bl3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
      <clipPath id="bd_cwall"><rect x="104" y="136" width="260" height="156"/></clipPath>
      <clipPath id="bd_cf"><path d="${FACE}"/><path d="${NOSE}"/></clipPath>
    </defs>`;

    const bands = (shift, w, fill, a) => {
      let s = '';
      for (let k = 0; k < 20; k++) {
        const yk = 80 + k * 17 + shift;
        s += P(`M40 ${f1(yk + 78)} L370 ${f1(yk - 21)} L370 ${f1(yk - 21 + w)} L40 ${f1(yk + 78 + w)} Z`, fill, `opacity="${f1(a * flick)}"`);
      }
      return s;
    };

    // ================= СТЕНА =================
    g += R(-20, -20, 400, 320, 'url(#bd_wall)');
    g += Ci(286, 104, 170, 'url(#glowW)', `opacity="${f1(0.32 * flick)}"`);
    g += G(bands(0, 9, 'url(#bd_band)', 1), '', 'clip-path="url(#bd_cwall)"');
    // постер
    g += R(128, 30, 52, 62, '#0b1427') + R(131, 33, 46, 56, '#16233f') +
      P('M131 89 L131 74 L146 58 L156 70 L164 60 L177 76 L177 89 Z', '#0d1830') + Ci(163, 48, 5.5, '#3a4a6e', 'opacity=".8"') +
      L(128, 30, 180, 30, '#ffb870', 0.8, 'opacity=".22"');
    // полка с книгами и мишкой
    const SHY = 122;
    g += R(124, SHY, 84, 4, WOOD2) + R(124, SHY, 84, 1, '#ffb870', 'opacity=".22"');
    [[128, 24, 6, '#3a2d4a'], [135, 19, 5, '#2c3d57'], [141, 22, 6, '#4a2c36'], [148, 17, 5, '#2f4a46'], [154, 21, 5, '#3b3352']].forEach(([x, h, w, c]) =>
      g += R(x, SHY - h, w, h, c, 'rx="0.8"') + R(x + w - 1, SHY - h, 1, h, '#ffb870', 'opacity=".2"') + R(x + 1.2, SHY - h + 3, w - 2.4, 1, 'rgba(255,255,255,.12)'));
    g += G(Ci(0, -13, 5, '#1c1722') + Ci(-3.6, -17.5, 2.1, '#1c1722') + Ci(3.6, -17.5, 2.1, '#1c1722') + Ci(0, -4.5, 6.4, '#1c1722') +
      Ci(-5, -1, 2.2, '#1c1722') + Ci(5, -1, 2.2, '#1c1722') + Ci(-1.8, -13.4, 0.7, '#e0b890', 'opacity=".55"') + Ci(1.8, -13.4, 0.7, '#e0b890', 'opacity=".55"') +
      P('M3.5 -16 C6 -12 6 -2 5 3', 'none', 'stroke="#ffb870" stroke-width=".8" opacity=".35"'), `translate(192,${SHY})`);
    // окно с жалюзи
    const WX = 240, WY = 28, WW = 96, WH = 128;
    g += R(WX - 5, WY - 5, WW + 10, WH + 10, '#1a2236') + R(WX, WY, WW, WH, 'url(#bd_glass)');
    g += Ci(WX + 70, WY + 96, 26, 'url(#glowW)', `opacity="${f1(0.9 * flick)}"`) + Ci(WX + 70, WY + 96, 3, '#fff0cf', 'opacity=".9"');
    g += P(`M${WX} ${WY + WH} L${WX} ${WY + 98} L${WX + 30} ${WY + 86} L${WX + 38} ${WY + 70} L${WX + 56} ${WY + 70} L${WX + 56} ${WY + 90} L${WX + 96} ${WY + 90} L${WX + 96} ${WY + WH} Z`, '#150f1a', 'opacity=".85"');
    for (let i = 0; i < 11; i++) {
      const y = WY + 4 + i * 11.4;
      g += R(WX, y, WW, 7.2, '#0b1222') + R(WX, y, WW, 1, '#ffb870', 'opacity=".28"') + R(WX, y + 7.2, WW, 1.6, 'rgba(0,0,0,.55)');
    }
    g += L(WX + 90, WY - 6, WX + 90, WY + WH + 18, '#2b3550', 0.9) + Ci(WX + 90, WY + WH + 20, 2, '#2b3550');
    g += R(WX - 9, WY + WH + 4, WW + 18, 5, '#232e49') + R(WX - 9, WY + WH + 4, WW + 18, 1, '#ffb870', 'opacity=".3"');
    // пылинки в свете
    for (let i = 0; i < 16; i++) {
      const x = 130 + ((hash(i * 2.3) * 220 + t * (2 + hash(i) * 3) + Math.sin(t * 0.7 + i) * 6) % 220);
      const y = 150 + ((hash(i * 4.1) * 110 - t * (1.5 + hash(i * 2) * 2.5) + 400) % 110);
      g += Ci(x, y, 0.55 + hash(i * 9) * 0.5, `rgba(255,214,150,${f1(0.25 + 0.3 * Math.sin(t * 1.6 + i * 2) ** 2)})`);
    }
    // дверь в коридор (приоткрыта): створка повёрнута к нам, за ней — чёрная щель
    g += R(-6, 58, 62, 238, '#141c30') + R(-2, 66, 54, 230, '#010207');
    g += P('M-2 66 L24 72 L24 292 L-2 296 Z', '#30241c');
    g += P('M3 88 L19 91 L19 170 L3 172 Z', '#3a2c22', 'opacity=".7"') + P('M3 184 L19 185 L19 278 L3 282 Z', '#3a2c22', 'opacity=".7"');
    g += P('M24 72 L26 72 L26 292 L24 292 Z', '#6a5a50', 'opacity=".5"') + Ci(21, 186, 1.8, '#b8b0a8', 'opacity=".7"');
    g += R(-7, 54, 64, 7, '#1d2740') + R(-7, 54, 64, 1, '#ffb870', 'opacity=".18"');
    // плинтус
    g += R(0, 288, 360, 8, '#16213a') + R(0, 288, 360, 1.2, '#ffb870', 'opacity=".16"');
    // свет колонки на стене: широкое пятно + яркое ядро над колонкой (в speak заметно растёт)
    g += Ci(SP.x + 10, SP.y - 10, 90 + 120 * ls, 'url(#glowC)', `opacity="${f1(0.16 + 0.6 * ls)}"`);
    g += `<ellipse cx="${SP.x + 6}" cy="${SP.y - 34}" rx="${f1(30 + 34 * lf)}" ry="${f1(40 + 40 * lf)}" fill="url(#glowC)" opacity="${f1(0.25 + 0.75 * lf)}"/>`;

    // ================= ПОЛ =================
    g += R(-20, 296, 400, 90, 'url(#bd_floor)');
    for (let i = 0; i < 5; i++) g += L(-20, 302 + i * 12 + i * i * 1.5, 380, 302 + i * 12 + i * i * 1.5, '#1a2742', 0.7, 'opacity=".45"');
    for (let i = 0; i < 18; i++) { const y0 = 348 + (i % 3) * 7; g += L(i * 22 + (i % 2) * 9, y0, i * 22 + (i % 2) * 9 - 1, y0 + 7, '#1a2742', 0.7, 'opacity=".45"'); }
    // тьма под кроватью
    g += R(116, RAIL1 - 2, 248, FL - RAIL1 + 3, 'url(#bd_gap)') + R(116, RAIL1 - 2, 248, FL - RAIL1 + 3, 'url(#bd_gapH)');
    // вещи под кроватью: коробка в глубине, тапки у края
    g += R(134, 316, 44, 15, '#050a15', 'rx="1.5"') + R(134, 316, 44, 1.2, '#7d97c4', 'opacity=".09"');
    g += P('M300 349 C300 342 307 340 315 341 C320 342 322 345 322 349 Z', '#0f182c') + P('M326 349 C326 343 332 341 338 342 C342 343 343 346 343 349 Z', '#0f182c');
    g += P('M300 349 C300 342 307 340 315 341', 'none', 'stroke="#ffb870" stroke-width=".7" opacity=".14"');
    // ---- ТО, ЧТО ПОД КРОВАТЬЮ
    if (kEye > 0) {
      const ex = 226, ey = 330;
      g += `<ellipse cx="${ex + 2}" cy="${ey + 3}" rx="20" ry="10" fill="#000002" opacity="${f1(0.6 * kEye)}" filter="url(#bd_bl3)"/>`;
      g += P(`M${ex - 13} ${ey - 2} C${ex - 9} ${ey - 9} ${ex + 9} ${ey - 9} ${ex + 13} ${ey - 2}`, 'none', `stroke="#56719f" stroke-width=".8" opacity="${f1(0.16 * kEye)}"`);
      const ea = kEye * (0.86 + 0.08 * noise1(t * 1.3));
      [[-6.4, 0.4], [6.4, -0.4]].forEach(([dx, dy]) => {
        const cx = ex + dx, cy = ey + dy;
        g += Ci(cx, cy, 9, 'url(#bd_eye)', `opacity="${f1(ea * 0.85)}"`);
        g += P(`M${f1(cx - 3.5)} ${f1(cy + 0.2)} C${f1(cx - 1.7)} ${f1(cy - 2.1)} ${f1(cx + 1.7)} ${f1(cy - 2.3)} ${f1(cx + 3.5)} ${f1(cy - 0.2)} C${f1(cx + 1.7)} ${f1(cy + 1.5)} ${f1(cx - 1.7)} ${f1(cy + 1.6)} ${f1(cx - 3.5)} ${f1(cy + 0.2)} Z`, '#e4ecf7', `opacity="${f1(ea)}"`);
        g += Ci(cx - 0.7, cy - 0.3, 0.9, '#0a0f1a', `opacity="${f1(ea)}"`);
      });
      // пальцы на краю пола: только кончики выходят из темноты
      if (kF > 0.01) {
        let fg = '';
        [[250, 0, 6.4], [254.6, 1.2, 7.4], [259.2, 0.6, 7], [263.6, -0.8, 5.6]].forEach(([x, dy, l]) => {
          const y0 = FL - 9 + dy;
          fg += P(`M${x - 1} ${f1(y0)} C${x - 1.2} ${f1(y0 + l * 0.6)} ${x - 0.6} ${f1(y0 + l)} ${x + 0.4} ${f1(y0 + l)} C${x + 1.4} ${f1(y0 + l)} ${x + 1.4} ${f1(y0 + l * 0.6)} ${x + 1.1} ${f1(y0)} Z`, '#7d8aa2');
          fg += Ci(x + 0.2, y0 + l - 0.9, 0.55, '#b4c0d4', 'opacity=".6"');
        });
        g += G(fg, '', `opacity="${f1(0.22 * kF)}"`);
      }
      // облачко выдоха: выходит изо рта, плывёт к нам и вправо, к концу кадра тает
      const cA = ease(lin(t, tU + 0.12, tU + 0.7)) * (1 - Math.pow(lin(t, tEnd - 1.2, tEnd), 2));
      if (cA > 0.01) {
        let mg = '';
        const age = clamp((t - tU - 0.12) / 3);
        for (let i = 0; i < 8; i++) {
          const hh = hash(i * 3.7 + 2), h2 = hash(i * 6.1 + 5);
          const x = ex + 4 + 3.4 * i + 18 * hh * (0.3 + age) + Math.sin(t * 0.8 + i * 1.7) * 2;
          const y = ey + 10 - 3 * h2 - 5 * age * (0.4 + hh) + Math.cos(t * 0.9 + i) * 1.1;
          mg += Ci(x, y, 3.6 + 3.4 * h2 + 4 * age, 'url(#bd_mist)', `opacity="${f1(0.42 * (1 - i * 0.07))}"`);
        }
        g += G(mg, '', `opacity="${f1(cA)}"`);
      }
    }

    // ================= ТУМБОЧКА =================
    g += R(28, 340, 4, 8, '#150f18') + R(92, 340, 4, 8, '#150f18');
    g += R(24, 252, 74, 88, 'url(#bd_nst)') + P('M30 244 L104 244 L98 252 L24 252 Z', WOOD2) + P('M98 252 L104 244 L104 334 L98 340 Z', '#1a131c');
    g += R(24, 252, 74, 1.2, '#ffb870', 'opacity=".16"');
    g += R(29, 258, 64, 34, '#241b27') + R(29, 298, 64, 36, '#241b27') + R(29, 258, 64, 1, 'rgba(255,255,255,.07)') + R(29, 298, 64, 1, 'rgba(255,255,255,.07)');
    g += Ci(61, 275, 2, '#8a8f9c') + Ci(61, 316, 2, '#8a8f9c');
    g += Ci(SP.x, 262, 60, 'url(#glowC)', `opacity="${f1(0.1 + 0.6 * ls)}"`);   // отсвет на столешнице и фасаде
    // стакан воды
    g += R(31, 231, 9, 16, '#5d7090', 'opacity=".16" rx="1"') + R(31.6, 238, 7.8, 8.6, '#7fa0c8', 'opacity=".18"') + L(31.4, 231, 31.4, 247, '#cfe0f6', 0.6, `opacity="${f1(0.3 + 0.4 * ls)}"`) + `<ellipse cx="35.5" cy="231" rx="4.5" ry="1.2" fill="none" stroke="#9fb4d8" stroke-width=".5" opacity=".4"/>`;
    // телефон на тумбочке
    if (!phHeld) g += P('M84 247 L100 246 L100.8 248.6 L84.8 249.6 Z', '#0b0f17') + P('M85 247.2 L99.6 246.3 L100 247.2 L85.3 248.1 Z', '#16202f') + L(85, 247.4, 99.6, 246.5, '#9fb4d8', 0.5, 'opacity=".4"');
    // ---- КОЛОНКА
    const bx0 = SP.x - SP.rx, bx1 = SP.x + SP.rx;
    g += `<ellipse cx="${SP.x}" cy="${SP.base + 1.5}" rx="${SP.rx + 1.5}" ry="5.6" fill="#05070c" opacity=".7"/>`;
    const body = `M${bx0} ${SP.y} L${bx0} ${SP.base} A${SP.rx} ${SP.ry} 0 0 0 ${bx1} ${SP.base} L${bx1} ${SP.y} Z`;
    g += P(body, 'url(#bd_cloth)') + P(body, 'url(#bd_mesh)');
    g += P(`M${bx1 - 6} ${SP.y + 1} L${bx1 - 6} ${SP.base + 2} L${bx1} ${SP.base} L${bx1} ${SP.y} Z`, '#ffb870', 'opacity=".12"');
    g += P(`M${bx0} ${SP.base - 3.5} L${bx0} ${SP.base} A${SP.rx} ${SP.ry} 0 0 0 ${bx1} ${SP.base} L${bx1} ${SP.base - 3.5} A${SP.rx} ${SP.ry} 0 0 1 ${bx0} ${SP.base - 3.5} Z`, '#0b0e15');
    g += P(`M${bx0} ${SP.y} L${bx0} ${SP.base - 1}`, 'none', `stroke="#9fd0ff" stroke-width="1.1" opacity="${f1(0.1 + 0.45 * ls)}"`);
    g += P(`M${bx0 + 3} ${SP.y + 4} L${bx0 + 3} ${SP.base - 2}`, 'none', `stroke="#9fd0ff" stroke-width="2.4" opacity="${f1(0.18 * lf)}"`);
    g += `<ellipse cx="${SP.x}" cy="${SP.y}" rx="${SP.rx}" ry="${SP.ry}" fill="#10141d"/><ellipse cx="${SP.x}" cy="${SP.y}" rx="${SP.rx - 5}" ry="${SP.ry - 1.9}" fill="#07090e"/>`;
    g += `<ellipse cx="${SP.x}" cy="${SP.y}" rx="${SP.rx}" ry="${SP.ry}" fill="none" stroke="#8d97aa" stroke-width=".5" opacity=".35"/>`;
    g += Ci(SP.x - 2.4, SP.y - 0.2, 0.8, '#3a4660') + Ci(SP.x + 2.4, SP.y + 0.2, 0.8, '#3a4660');
    // кольцо: 12 сегментов
    let ringG = '', ringC = '';
    const head = (t * 2 * Math.PI / 1.25);
    for (let i = 0; i < 12; i++) {
      const ac = (i * 30 - 90) * Math.PI / 180;
      const standby = 0.26 + 0.07 * Math.sin(t * 1.5 + i * 0.4);
      const dl = ((head - ac) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI), dl2 = ((head + Math.PI - ac) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const listen = Math.max(standby * 0.8, Math.exp(-Math.min(dl, dl2) / 0.85));
      const speak = clamp(0.28 + 0.8 * env * (0.72 + 0.28 * Math.sin(i * 1.9 + t * 11)), 0, 1);
      const it = mix(mix(standby, listen, wl), speak, ws);
      const sa = ac - 0.36, sb = ac + 0.36;
      ringG += P(arcSeg(sa, sb), 'none', `stroke="#4f9bff" stroke-width="4.6" opacity="${f1(it * 0.9)}" ${CAP}`);
      ringC += P(arcSeg(sa, sb), 'none', `stroke="${ws > 0.5 ? '#cfe6ff' : '#78b8ff'}" stroke-width="2" opacity="${f1(0.15 + it * 0.85)}" ${CAP}`);
      if (it > 0.55) ringC += P(arcSeg(sa + 0.06, sb - 0.06), 'none', `stroke="#f2f8ff" stroke-width="1" opacity="${f1((it - 0.5) * 1.6)}" ${CAP}`);
    }
    g += G(ringG, '', 'filter="url(#bd_bl)"') + ringC;
    g += Ci(SP.x, SP.y - 2, 24 + 18 * ls, 'url(#glowC)', `opacity="${f1(0.3 + 0.6 * ls)}"`);

    // ================= КРОВАТЬ =================
    // изголовье (стойки до пола)
    g += P(`M102 ${FL} L102 160 C102 150 108 146 116 146 L120 146 L120 ${FL} Z`, WOOD) + R(106, 166, 10, 118, WOOD2, 'opacity=".55"') +
      R(119, 146, 1.2, FL - 146, '#ffb870', 'opacity=".24"') + R(102, 146, 18, 1.2, '#ffb870', 'opacity=".2"');
    g += R(102, 150, 9, FL - 150, 'url(#bd_hb)', `opacity="${f1(0.15 + 0.85 * lf)}"`);   // свет колонки на ребре изголовья
    // матрас (бок), царга, ножки
    g += R(118, MT - 4, 260, RAIL0 - MT + 4, '#2a3856') + R(118, MT - 4, 260, 1.4, '#4b5c82');
    g += R(114, RAIL0, 262, RAIL1 - RAIL0, WOOD) + R(114, RAIL0, 262, 1.4, '#ffb870', 'opacity=".26"') + R(114, RAIL1 - 3, 262, 3, 'rgba(1,3,8,.55)');
    g += R(122, RAIL1, 9, FL - RAIL1, WOOD3) + R(344, RAIL1, 9, FL - RAIL1, WOOD3) + R(122, RAIL1, 1.2, FL - RAIL1, '#ffb870', 'opacity=".1"') + R(344, RAIL1, 1.2, FL - RAIL1, '#ffb870', 'opacity=".1"');
    // подушка
    const pil = 'M114 252 C110 238 118 228 134 226 C156 222 186 226 196 238 C200 246 196 256 186 257 L122 257 C118 257 115 255 114 252 Z';
    g += P(pil, '#4c5876') + P('M122 232 C140 224 172 224 190 236', 'none', `stroke="#7d8aa8" stroke-width="2.2" opacity=".5" ${CAP}`) +
      P('M186 257 C196 256 200 246 196 238 C198 248 194 254 184 255 Z', '#ffb870', 'opacity=".16"');
    g += Ci(128, 236, 64, 'url(#glowC)', `opacity="${f1(0.55 * lf)}"`);
    // свет телефона: конус от экрана к лицу (за головой — волосы не засвечиваются)
    const S = [202, 242];
    const E = [mix(244, 238, kR), mix(262, 256, kR)];
    const W = [mix(272, 206, kR), mix(238, 202, kR) - 14 * Math.sin(Math.PI * kR)];
    const fa = Math.atan2(W[1] - E[1], W[0] - E[0]) * 180 / Math.PI;   // угол предплечья
    const raised = phHeld && kR > 0.15;
    const pa = fa + 144.4;
    const wr = rot(WRIST, pa), Pc = [W[0] - wr[0], W[1] - wr[1]];
    if (raised) {
      const s1 = rot([-16, 2.6], pa), s2 = rot([10, 2.6], pa);
      const A = [Pc[0] + s1[0], Pc[1] + s1[1]], B = [Pc[0] + s2[0], Pc[1] + s2[1]];
      g += `<defs><linearGradient id="bd_cone" gradientUnits="userSpaceOnUse" x1="${f1(Pc[0])}" y1="${f1(Pc[1])}" x2="160" y2="218"><stop offset="0" stop-color="#d6ebff" stop-opacity=".55"/><stop offset="1" stop-color="#9fd0ff" stop-opacity=".05"/></linearGradient></defs>`;
      g += P(`M${f1(A[0])} ${f1(A[1])} L${f1(B[0])} ${f1(B[1])} L186 228 L140 206 Z`, 'url(#bd_cone)', `opacity="${f1(scr * 0.5)}"`);
      g += Ci(170, 212, 40, 'url(#glowC)', `opacity="${f1(0.55 * scr)}"`);
    }
    // хвост волос на подушке (за головой)
    g += P('M144 238 C134 236 124 231 115 233 C110 235 111 240 116 241 C125 242 135 243 145 243 Z', HAIRC) +
      P('M140 238 C131 236 123 234 117 236', 'none', `stroke="${HAIR2}" stroke-width=".9" opacity=".8" ${CAP}`);

    // ---- голова
    const gz = (() => {
      const idle = [0.5, -0.5];
      const sp = [-0.5, -1.25], phn = [1.5, 0.45];
      let gx = mix(idle[0], sp[0], look), gy = mix(idle[1], sp[1], look);
      gx = mix(gx, phn[0], kR); gy = mix(gy, phn[1], kR);
      return [gx + 0.15 * noise1(t * 0.9 + 4), gy + 0.15 * noise1(t * 1.1 + 9)];
    })();
    const hr = HR - 7 * look * (1 - kR) + 7 * kR + 0.8 * noise1(t * 0.5 + 2);
    const open = 1 - 0.94 * clamp(blink);
    let hd = '';
    // шея
    hd += P('M-15 16 C-8 26 0 32 6 34 L8 62 L-20 62 Z', SK2) + P('M-15 16 C-8 26 0 32 6 34', 'none', `stroke="${SK3}" stroke-width="1" opacity=".6" ${CAP}`);
    hd += P(FACE, SK);
    let fc = '';
    fc += P('M20.5 -2 C22 6 23.4 14 22.6 20 C22 26 20 31 16 42 L40 42 L40 -6 Z', SK2, 'opacity=".45"');
    fc += P('M-27 -2 C-27 8 -24 16 -18 24 C-12 31 -5 35 2 37 L-30 46 Z', SK2, 'opacity=".55"');
    fc += Ci(6, 15, 8.5, 'url(#bd_blush)');
    hd += G(fc, '', 'clip-path="url(#bd_cf)"');
    // нос
    hd += P(NOSE, SK) + P('M28.6 11.4 C28 14 25.2 15.4 22.2 14.8', 'none', `stroke="${SK3}" stroke-width=".9" ${CAP}`) +
      P('M24.4 13.6 C25.2 12.6 26.4 12.8 26.9 13.9', 'none', `stroke="${SK3}" stroke-width=".8" opacity=".8" ${CAP}`) +
      P('M20.5 -2 C21.4 3 23.6 7 26.4 10', 'none', `stroke="${SK2}" stroke-width=".7" opacity=".6" ${CAP}`);
    // глаз: белок, радужка смотрит по gz, веко
    hd += `<clipPath id="bd_ce"><path d="${EYE}" transform="translate(0 ${EY}) scale(1 ${f1(open)}) translate(0 ${-EY})"/></clipPath>`;
    let ey = P(EYE, '#c9c6cc');
    ey += Ci(11 + 1.5 * gz[0], 3.0 + 1.2 * gz[1], 2.5, '#2b2024') + Ci(11 + 1.5 * gz[0], 3.0 + 1.2 * gz[1], 1.2, '#0d0a0c');
    ey += Ci(11.7 + 1.5 * gz[0], 2.1 + 1.2 * gz[1], 0.7, '#fff', 'opacity=".9"');
    ey += P('M3.6 2.2 C7.3 -1 13.3 -0.3 15.8 4.1 L15.8 1 L3.6 0 Z', SK3, 'opacity=".35"');   // тень верхнего века на белке
    hd += G(G(ey, '', 'clip-path="url(#bd_ce)"'), '');
    const lidY = y => f1(EY + (y - EY) * open);
    hd += P(`M15.8 ${lidY(4.1)} C13.3 ${lidY(-0.3)} 7.3 ${lidY(-1)} 3.6 ${lidY(2.2)} l-1.6 -1`, 'none', `stroke="#1f1418" stroke-width="1.4" ${CAP}`);
    hd += P(`M14.4 ${lidY(-1.6)} C12 ${lidY(-3.8)} 8 ${lidY(-4)} 5 ${lidY(-1.8)}`, 'none', `stroke="${SK2}" stroke-width=".8" opacity=".8" ${CAP}`);
    hd += P('M5 5.6 C8 7.4 12 7.6 14.6 5.8', 'none', `stroke="${SK3}" stroke-width=".6" opacity=".55" ${CAP}`);
    // бровь (внутренний край чуть приподнят — тревога)
    const bu = -1.2 * look - 0.8 * kR;
    hd += P(`M19.4 ${f1(-7.6 + bu)} C15.4 ${f1(-9 + bu)} 10 ${f1(-8.6 + bu * 0.4)} 4.6 ${f1(-5.6)}`, 'none', `stroke="${HAIRC}" stroke-width="1.9" ${CAP}`);
    // рот: губы чуть разомкнуты
    const MY = 22.6;
    hd += P(`M21.6 ${MY} C19.6 ${MY - 1.5} 17.6 ${MY - 1} 16.6 ${MY - 0.6} C15.2 ${MY - 1.2} 13.4 ${MY - 0.8} 11.6 ${MY + 0.2} C14.2 ${MY + 0.9} 19.2 ${MY + 1} 21.6 ${MY} Z`, LIPS);
    hd += P(`M20.6 ${MY + 0.9} C17.6 ${MY + 3.8} 14 ${MY + 3.4} 12.2 ${MY + 0.9} Z`, '#a46e75');
    hd += P(`M21.6 ${MY} C18.4 ${MY + 0.9} 14.6 ${MY + 0.9} 11.6 ${MY + 0.2}`, 'none', `stroke="#4a2228" stroke-width=".9" ${CAP}`);
    // свет на лице: телефон спереди, колонка со стороны макушки
    let lt = '';
    if (kR > 0.02) lt += R(-40, -50, 80, 100, 'url(#bd_phL)', `opacity="${f1(0.95 * scr)}"`);
    if (lf > 0.02) lt += R(-40, -50, 80, 100, 'url(#bd_spL)', `opacity="${f1(lf)}"`);
    if (lt) hd += G(lt, '', 'clip-path="url(#bd_cf)"');
    if (kR > 0.02) hd += Ci(11.5 + 1.5 * gz[0], 2.6 + 1.2 * gz[1], 0.55, '#eaf6ff', `opacity="${f1(0.8 * scr * open)}"`);   // блик экрана в глазу
    // волосы: гладко назад в низкий хвост
    hd += P(HAIR, HAIRC);
    hd += P('M18 -30 C8 -36 -8 -38 -20 -30', 'none', `stroke="${HAIR2}" stroke-width="1.1" opacity=".8" ${CAP}`) +
      P('M14 -24 C4 -27 -10 -26 -22 -18', 'none', `stroke="${HAIR2}" stroke-width="1" opacity=".7" ${CAP}`) +
      P('M6 -16 C-4 -16 -14 -12 -24 -2', 'none', `stroke="${HAIR2}" stroke-width=".9" opacity=".6" ${CAP}`);
    hd += P('M-31 -14 C-28 -32 -14 -44 2 -43 C14 -42 22 -35 24 -24', 'none', `stroke="#78b4ff" stroke-width="1.4" opacity="${f1(0.12 + 0.6 * lf)}" ${CAP}`);
    hd += P('M24 -24 C16 -23 7 -19 3 -11', 'none', `stroke="#d8ecff" stroke-width="1" opacity="${f1(0.5 * scr)}" ${CAP}`);
    // ухо поверх волос
    hd += `<ellipse cx="-8" cy="6" rx="4.4" ry="6.6" fill="${SK}"/>` + P('M-6 1.4 C-10 1 -11.6 5 -10.6 8.6 C-9.8 11 -7.6 11.4 -6.6 10', 'none', `stroke="${SK3}" stroke-width="1" ${CAP}`) +
      `<ellipse cx="-7.6" cy="6" rx="1.4" ry="2.4" fill="${SK3}" opacity=".6"/>`;
    g += G(hd, `translate(${HD.x} ${f1(HD.y + br * 0.3)}) rotate(${f1(hr)}) scale(${HS})`);
    // край подушки перед затылком
    g += P('M116 254 C130 245 150 245 166 249 C178 251 190 254 192 257 L116 257 Z', '#4c5876') + P('M120 251 C134 246 152 246 168 250', 'none', `stroke="#7d8aa8" stroke-width="1.3" opacity=".45" ${CAP}`);
    g += Ci(128, 248, 40, 'url(#glowC)', `opacity="${f1(0.4 * lf)}"`);

    // ---- плечо и грудь в пижаме (до края одеяла)
    g += P('M182 223 C190 219 200 219 208 223 L211 258 L185 258 C182 246 181 234 182 223 Z', PJ);
    g += P('M185 258 C183 248 183 240 186 234 C192 240 200 242 208 242 L211 258 Z', PJ3, 'opacity=".85"');
    g += P('M183 225 C187 231 194 232 199 226', 'none', `stroke="${PJ3}" stroke-width="1.6" ${CAP}`) + P('M183 224 C187 229 194 230 199 225', 'none', `stroke="#d7deec" stroke-width=".8" opacity=".5" ${CAP}`);

    // ---- одеяло
    const pts = [[204, 228, .3], [212, 217, .8], [230, 211, 1], [250, 214, .8], [270, 219, .4], [290, 215, .2], [312, 212, .1], [336, 215, 0], [362, 218, 0], [380, 222, 0]]
      .map(([x, y, a]) => [x, y - br * a]);
    const hem = [[380, 294], [350, 290], [318, 296], [284, 291], [250, 296], [222, 291], [210, 293]];
    const blanketD = `M${f1(pts[0][0])} ${f1(pts[0][1])}${smooth(pts)} L380 294${smooth(hem)} C207 270 203 248 ${f1(pts[0][0])} ${f1(pts[0][1])} Z`;
    g += `<clipPath id="bd_cbl"><path d="${blanketD}"/></clipPath>`;
    g += P(blanketD, BL);
    g += P(`M212 ${f1(219 - br * .8)}${smooth([[212, 219 - br * .8], [230, 213.5 - br], [250, 216.5 - br * .8], [268, 221 - br * .4]])}`, 'none', `stroke="${BL3}" stroke-width="2.4" opacity=".7" ${CAP}`);
    g += P('M268 220 C272 244 274 268 272 292', 'none', `stroke="${BL2}" stroke-width="3" opacity=".55" ${CAP}`) + P('M330 216 C334 240 332 266 334 292', 'none', `stroke="${BL2}" stroke-width="2.6" opacity=".5" ${CAP}`);
    g += P('M236 214 C240 236 242 264 238 292', 'none', `stroke="${BL2}" stroke-width="2.2" opacity=".4" ${CAP}`) + P('M300 214 C304 240 302 266 306 293', 'none', `stroke="${BL2}" stroke-width="2.4" opacity=".4" ${CAP}`);
    g += P('M252 216 C255 230 256 244 255 258', 'none', `stroke="${BL3}" stroke-width="1.4" opacity=".4" ${CAP}`) + P('M316 213 C319 228 320 242 319 256', 'none', `stroke="${BL3}" stroke-width="1.4" opacity=".35" ${CAP}`);
    g += G(R(200, 262, 190, 40, '#12192b', 'opacity=".45"') + G(bands(8, 11, 'url(#bd_bandB)', 0.7), 'rotate(-14 290 250)') + P(`M${f1(pts[0][0])} ${f1(pts[0][1])}${smooth(pts)} L380 236 L204 240 Z`, BL3, 'opacity=".35"'), '', 'clip-path="url(#bd_cbl)"');
    g += P(`M${f1(pts[1][0])} ${f1(pts[1][1])}${smooth(pts.slice(1, 9))}`, 'none', `stroke="#ffb870" stroke-width="1" opacity=".3" ${CAP}`);
    // отогнутый край пододеяльника
    g += P(`M199 ${f1(226 - br * .3)} C203 ${f1(222 - br * .3)} 208 ${f1(222 - br * .5)} 212 ${f1(225 - br * .6)} C210 240 210 254 211 266 L206 268 C205 252 203 238 199 ${f1(226 - br * .3)} Z`, SHEET);
    g += P(`M212 ${f1(225 - br * .6)} C211 246 213 270 216 292`, 'none', `stroke="${BL2}" stroke-width="1.2" opacity=".7" ${CAP}`) + P(`M201 ${f1(228 - br * .3)} C203 242 205 254 206 266`, 'none', 'stroke="#c4cde0" stroke-width=".8" opacity=".3"');
    if (raised) g += Ci(206, 222, 34, 'url(#glowC)', `opacity="${f1(0.4 * scr)}"`);

    // ---- рука (ближняя): плечо → локоть → запястье, короткий рукав пижамы
    const Ms = [mix(S[0], E[0], 0.4), mix(S[1], E[1], 0.4)];
    let arm = '';
    arm += seg(S, E, 12.8, 11.4, SK3) + seg(E, W, 11.6, 8.8, SK3);              // контур
    arm += seg(S, E, 11.2, 9.8, SK) + seg(E, W, 10, 7.2, SK);
    {
      const dx = W[0] - E[0], dy = W[1] - E[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      const sgn = raised ? -1 : 1;    // подсветка с нижней (к лицу/одеялу) стороны предплечья
      arm += L(E[0] + nx * 3.4 * sgn, E[1] + ny * 3.4 * sgn, W[0] + nx * 2.4 * sgn, W[1] + ny * 2.4 * sgn, raised ? '#d8ecff' : '#ffb870', 1, `opacity="${f1(raised ? 0.55 * scr : 0.22)}" ${CAP}`);
      arm += P(`M${f1(E[0] - nx * 2 + dx / l * 2)} ${f1(E[1] - ny * 2 + dy / l * 2)} q ${f1(-nx * 1.5)} ${f1(-ny * 1.5)} ${f1(dx / l * 3)} ${f1(dy / l * 3)}`, 'none', `stroke="${SK3}" stroke-width=".8" opacity=".6" ${CAP}`);
    }
    arm += seg(S, Ms, 15.6, 13.6, PJ3) + seg(S, Ms, 14, 12, PJ);
    {
      const dx = Ms[0] - S[0], dy = Ms[1] - S[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      arm += L(Ms[0] + nx * 5.8, Ms[1] + ny * 5.8, Ms[0] - nx * 5.8, Ms[1] - ny * 5.8, PJ3, 1.2, CAP);
      arm += L(S[0] + nx * 5.5, S[1] + ny * 5.5, Ms[0] + nx * 5.5, Ms[1] + ny * 5.5, PJ2, 1.6, `opacity=".6" ${CAP}`);
      arm += L(S[0] - nx * 6, S[1] - ny * 6, Ms[0] - nx * 5.6, Ms[1] - ny * 5.6, '#d7deec', 0.9, `opacity=".45" ${CAP}`);
    }
    if (raised) arm += phoneHand(Pc, pa, scr);
    else {
      if (phHeld) arm += G(R(-2, -7.5, 24, 3.6, '#0b0f17', 'rx="1.2"') + R(-2, -7.5, 24, 0.8, '#3a4660', 'opacity=".5"'), `translate(${f1(W[0])} ${f1(W[1])}) rotate(${f1(fa)})`);
      arm += handRest(W, fa);
    }
    g += arm;
    // отсвет колонки на постель
    if (lf > 0.02) g += Ci(170, 236, 70, 'url(#glowC)', `opacity="${f1(0.3 * lf)}"`);

    // ================= ВИНЬЕТКА И НИЗ =================
    g += R(-20, -20, 400, 400, 'url(#bd_vig)');
    g += R(-20, 352, 400, 22, 'url(#bd_bot)') + R(-20, 373, 400, 300, '#03060c');
    return g;
  };
})();

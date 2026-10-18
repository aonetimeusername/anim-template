// сцены ключа d: gym (Тёма оставляет телефон), door_out (дверь 214 в коридоре), wall_wires (провода из стены в 214)

// ---------------------------------------------------------------- gym
// p.tPlace — абс. время, когда телефон ложится на скамейку. Дальше Тёма разворачивается и уходит влево.
(() => {
  const FL = 368;      // линия, на которой стоят ноги (пол виден узкой полосой, ниже — тьма под субтитры)
  const WB = 336;      // низ стены
  const H = 96;        // рост Тёмы
  const X0 = 160;      // где он стоит у скамейки
  const BX = 174, BW = 92, BT = 341;   // скамейка: левый край, длина, верх столешницы
  const D2R = Math.PI / 180;

  // где окажется кисть при угле руки a и наклоне корпуса lean (лицом вправо)
  const hand = (x, a, lean) => {
    const s = H / 100;
    const lx = (2 - 34 * Math.sin(a * D2R)) * s, ly = (-78 + 34 * Math.cos(a * D2R)) * s;
    const L_ = lean * D2R;
    return [x + lx * Math.cos(L_) - ly * Math.sin(L_), FL + lx * Math.sin(L_) + ly * Math.cos(L_)];
  };
  const A_UP = -76, A_DOWN = -22, LEAN_DOWN = 17;
  const PH = (() => { const h = hand(X0 + 3, A_DOWN, LEAN_DOWN); return { x: h[0] + 4, y: BT }; })();

  const ph = (x, y, w, k = 1) => {   // телефон, лежащий на столешнице (вид сверху-сбоку)
    const hh = w * 0.42;
    return P(`M${x - w / 2} ${y} L${x - w / 2 + 2.6} ${y - hh} L${x + w / 2 + 2.6} ${y - hh} L${x + w / 2} ${y} Z`, '#0e1118') +
      P(`M${x - w / 2 + 1.2} ${y - 0.6} L${x - w / 2 + 3.4} ${y - hh + 0.7} L${x + w / 2 + 1.6} ${y - hh + 0.7} L${x + w / 2 - 1.2} ${y - 0.6} Z`, `rgba(180,215,250,${0.55 + 0.4 * k})`);
  };

  function bg(t) {
    let g = '';
    g += R(0, 0, 360, WB + 2, '#0d1830');
    // потолок, балки, фермы
    g += R(0, 0, 360, 26, '#070e1c') + L(0, 26, 360, 26, '#18253f', 2);
    for (let x = -20; x < 380; x += 52) g += L(x, 26, x + 26, 0, '#10192e', 2) + L(x + 26, 0, x + 52, 26, '#10192e', 2);
    for (const lx of [64, 180, 296]) g += L(lx, 26, lx, 38, '#1c2a44', 1.4) + R(lx - 17, 38, 34, 5, '#1a273e') + R(lx - 14, 43, 28, 2, '#0c1526');
    // защитные маты вдоль низа стены
    g += R(0, 292, 360, WB - 292, '#142240') + L(0, 292, 360, 292, '#1d2e52', 1.5);
    for (let x = 0; x < 360; x += 45) g += L(x, 292, x, WB, '#0b1428', 1.4);
    // высокие окна
    for (const wx of [106, 202]) {
      const wy = 140, ww = 58, wh = 128;
      g += R(wx - 4, wy - 4, ww + 8, wh + 8, '#24324d') + R(wx, wy, ww, wh, '#08152e');
      g += R(wx, wy, ww, 40, 'rgba(110,150,210,.10)');
      g += snow(wx, wy, ww, wh, t, 16, wx * 0.1, 9, .85);
      for (let i = 1; i < 3; i++) g += L(wx + (ww / 3) * i, wy, wx + (ww / 3) * i, wy + wh, '#24324d', 2.4);
      for (let i = 1; i < 5; i++) g += L(wx, wy + (wh / 5) * i, wx + ww, wy + (wh / 5) * i, '#24324d', 2.4);
      g += R(wx - 8, wy + wh + 4, ww + 16, 5, '#2c3b5a');
    }
    // шведская стенка
    {
      const x0 = 16, x1 = 76, y0 = 196;
      g += R(x0 - 2, y0, 5, WB - y0, '#3b4a6a') + R(x1 - 3, y0, 5, WB - y0, '#3b4a6a');
      for (let y = y0 + 6; y < WB - 2; y += 8) g += L(x0 + 2, y, x1 - 2, y, '#2d3d5f', 2.4) + L(x0 + 2, y - 1.2, x1 - 2, y - 1.2, 'rgba(140,165,210,.18)', .8);
      g += R(x0 - 4, y0 - 4, x1 - x0 + 8, 4, '#2d3d5f');
    }
    // баскетбольный щит и кольцо
    {
      const bx = 288, by = 146, sw = Math.sin(t * 1.2) * 1.1;
      g += R(bx - 14, 26, 3, by - 26, '#1c2a44') + R(bx + 11, 26, 3, by - 26, '#1c2a44');
      g += R(bx - 27, by, 54, 38, '#1a2a47', 'rx="2"') + R(bx - 27, by, 54, 38, 'none', 'stroke="#8fa0bd" stroke-width="1.5" rx="2"');
      g += R(bx - 10, by + 17, 20, 15, 'none', 'stroke="#a8b6cd" stroke-width="1.5"');
      g += R(bx - 27, by + 34, 54, 4, '#10192e');
      g += R(bx - 10, by + 30, 20, 2.6, '#a8431c');
      g += `<ellipse cx="${bx}" cy="${by + 35}" rx="13" ry="3.4" fill="none" stroke="#c25a24" stroke-width="2.2"/>`;
      for (let i = 0; i < 6; i++) {
        const tx = bx - 12 + i * 4.8, bxx = bx - 7 + i * 2.8 + sw;
        g += L(tx, by + 36, bxx, by + 56, 'rgba(200,210,225,.55)', .8);
      }
      g += P(`M${bx - 10} ${by + 42} q ${5 + sw * 0.4} 3 ${10 + sw} 0 t ${10} 0`, 'none', 'stroke="rgba(200,210,225,.4)" stroke-width=".8"');
    }
    // пол: узкая полоса паркета с разметкой, ниже — тьма под субтитры
    g += R(0, WB, 360, FL + 40 - WB, '#0b1830') + L(0, WB, 360, WB, '#2f4268', 1.6);
    for (const y of [344, 353, 364]) g += L(0, y, 360, y, '#10223f', 1);
    for (const wx of [106, 202]) {
      const sh = noise1(t * 0.35 + wx) * 2;
      g += P(`M${wx + 12 + sh} ${WB} L${wx + 70 + sh} ${WB} L${wx + 104 + sh} ${FL + 14} L${wx + 34 + sh} ${FL + 14} Z`, `rgba(150,185,235,${0.07 + 0.02 * noise1(t * 0.8 + wx)})`);
    }
    // разметка: линия, центральный круг, штрафная зона
    const MK = 'rgba(130,165,225,.5)';
    g += L(0, 346, 360, 346, MK, 1.4);
    g += `<ellipse cx="236" cy="357" rx="104" ry="10" fill="none" stroke="${MK}" stroke-width="1.6"/>`;
    g += L(236, 346, 236, 368, 'rgba(130,165,225,.4)', 1.3);
    g += P('M96 346 L74 368 M154 346 L142 368', 'none', 'stroke="rgba(130,165,225,.36)" stroke-width="1.3"');
    return g;
  }

  SCENES.gym = function (u, p, d, t) {
    const a = t - (p.tPlace ?? 53.4);          // сек. от касания
    let g = '';
    g += R(0, 0, 360, 640, '#050c1a') + bg(t);
    // мяч в углу
    g += `<ellipse cx="136" cy="${FL + 1}" rx="9" ry="2.4" fill="rgba(0,0,0,.45)"/>` + Ci(136, FL - 7, 8, '#7a3e1c') +
      P(`M136 ${FL - 15} V${FL + 1} M128 ${FL - 7} H144 M${130.5} ${FL - 12.5} q 6 5.5 0 11 M${141.5} ${FL - 12.5} q -6 5.5 0 11`, 'none', 'stroke="#2b1609" stroke-width=".9"');
    // скамейка
    g += `<ellipse cx="${BX + BW / 2}" cy="${FL + 1.5}" rx="${BW / 2 + 8}" ry="3" fill="rgba(0,0,0,.4)"/>`;
    g += R(BX + 6, BT + 4, 3.4, FL - BT - 4, '#1d2a44') + R(BX + BW - 9, BT + 4, 3.4, FL - BT - 4, '#1d2a44');
    g += R(BX + 6, FL - 9, BW - 12, 2, '#1d2a44');
    g += R(BX, BT, BW, 5, '#4d3826') + P(`M${BX} ${BT} L${BX + 4} ${BT - 4} L${BX + BW + 4} ${BT - 4} L${BX + BW} ${BT} Z`, '#76583a') +
      R(BX + BW, BT - 4, 4, 9, '#3a2a1b', 'opacity=".6"');

    // --- Тёма
    const walkT = 1.0, turnT = 0.78, SPD = 78, RAMP = 0.3;
    let x = X0 + 1.2, pose = 'stand', arm = 8, lean = 0, sx = 1, tt = 0;
    const holding = a < 0;
    if (a < 0) {                                      // несёт телефон и опускает его к скамейке
      const k = ease(lin(a, -0.46, 0));
      arm = mix(A_UP, A_DOWN, k); lean = mix(0, LEAN_DOWN, k); x = X0 + 3 * k;
    } else if (a < 0.3) { arm = A_DOWN; lean = LEAN_DOWN; x = X0 + 3; }
    else if (a < turnT) {                             // убирает руку, выпрямляется
      const k = ease(lin(a, 0.3, 0.72));
      arm = mix(A_DOWN, 8, k); lean = mix(LEAN_DOWN, 0, k); x = X0 + 3 - 1.8 * k;
    } else if (a < walkT) {                           // разворачивается
      sx = Math.cos(Math.PI * lin(a, turnT, walkT));
    } else {                                          // уходит влево
      const w = a - walkT;
      sx = -1; pose = 'walk'; tt = w; arm = null;
      x = X0 + 1.2 - SPD * (w < RAMP ? w * w / (2 * RAMP) : w - RAMP / 2);
    }
    const hold = holding ? Ci(0, 38, 17, 'url(#glowC)', 'opacity=".5"') + R(-4.1, 29.5, 8.2, 13.4, '#0e1118', 'rx="1.8"') + R(-3.1, 30.6, 6.2, 11.2, '#bfe0ff', 'rx="1.2"') : '';
    g += `<ellipse cx="${x}" cy="${FL + 1}" rx="17" ry="3" fill="rgba(0,0,0,.4)"/>`;
    const per = person({ x, y: FL, h: H, face: 1, pose, t: tt, arm: pose === 'walk' ? null : arm, hold });
    g += G(per, `rotate(${f1(lean)} ${f1(x)} ${FL}) translate(${f1(x)} 0) scale(${f1(sx)} 1) translate(${f1(-x)} 0)`);

    // --- телефон на скамейке
    if (a >= 0) {
      const k = 1 + 0.35 * Math.sin(t * 3.1);
      g += Ci(PH.x, PH.y - 2, 40 + 4 * Math.sin(t * 1.7), 'url(#glowC)', `opacity="${f1(0.4 + 0.2 * k)}"`);
      g += rings(PH.x, PH.y - 2, t, { n: 2, r0: 3, r1: 22, col: '#9fd0ff', speed: 0.8, a: 0.35, w: 1, dir: -1 });
      g += ph(PH.x, PH.y, 13, k * 0.7);
      // индикатор записи
      if (Math.sin(t * 5) > 0) g += Ci(PH.x + 4.8, PH.y - 3.2, 0.9, '#ff4a4a');
    }
    // подпись
    g += T(22, 128, '1 ЭТАЖ · СПОРТЗАЛ', 8.5, '#8f9bb0', MONO);
    // тёмная зона под субтитры
    g += R(0, FL + 1, 360, 20, 'url(#dg_gf)') + R(0, FL + 20, 360, 280, '#050c1a');
    g = `<defs><linearGradient id="dg_gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050c1a" stop-opacity="0"/><stop offset="1" stop-color="#050c1a" stop-opacity="1"/></linearGradient></defs>` + g;
    return g;
  };
})();

// ---------------------------------------------------------------- door_out
// p.num — номер на табличке, p.pulse [[t0,t1]..] (абс. время) — когда динамик на стене звучит, p.shadow — высокий силуэт у двери
(() => {
  const DW = 128, DH = 240, DX = 116, DY = GROUND - DH;
  const SP = { x: 288, y: 128, s: 1.15 };

  // динамик и волны
  function speaker(t, p) {
    let g = speakerBox(SP.x, SP.y, SP.s);
    let amt = 0;
    for (const [a, b] of (p.pulse || [])) {
      if (t >= a && t < b + 0.6) {
        const k = 1 - lin(t, b, b + 0.6);
        amt = Math.max(amt, k * lin(t, a, a + 0.1));
        g += rings(SP.x, SP.y + 2, t, { n: 3, r0: 10, r1: 74, a: 0.8 * k, w: 1.6 });
      }
    }
    if (amt > 0) g = Ci(SP.x, SP.y + 2, 46, 'url(#glowC)', `opacity="${f1(0.55 * amt)}"`) + g;
    return g;
  }

  // силуэт: длинный, узкий; голова медленно поворачивается к двери (k: -1 смотрит влево, 0 — на нас, 1 — к двери)
  function tall(x, y, h, k, eyes, br) {
    const s = h / 100, sx = s * 0.8, sy = s * (1 + br);
    const hx = 2.3 * k, rx = 9.5 - 1.3 * Math.abs(k);
    let g = P('M-11 -76 C-12 -40,-9 -10,-8 0 L8 0 C9 -10,12 -40,11 -76 C9 -84,-9 -84,-11 -76 Z', C.sil);
    // длинные руки
    g += P('M-10.5 -74 C-14 -52,-14 -34,-12.5 -14', 'none', `stroke="${C.sil}" stroke-width="3.2" stroke-linecap="round"`) +
      P('M10.5 -74 C14 -52,14 -34,12.5 -14', 'none', `stroke="${C.sil}" stroke-width="3.2" stroke-linecap="round"`);
    let hd = `<ellipse cx="${f1(hx)}" cy="-88" rx="${f1(rx)}" ry="10.4" fill="${C.sil}"/>`;
    if (Math.abs(k) > 0.05) { const sg = k > 0 ? 1 : -1; hd += P(`M${f1(hx + sg * (rx - 2))} -90.4 L${f1(hx + sg * (rx + 2.6 * Math.abs(k)))} -87 L${f1(hx + sg * (rx - 2))} -85.6 Z`, C.sil); }
    hd += P('M-4 -80 L4 -80 L3 -77 L-3 -77 Z', C.sil);
    if (eyes > 0) {
      const sep = 3.2 * (1 - Math.abs(k) * 0.62), c = hx + 4.8 * k;
      hd += Ci(c - sep, -89, 1.35, `rgba(230,236,245,${f1(eyes * (1 - Math.abs(k) * 0.6 * (k > 0 ? 1 : 0)))})`) + Ci(c + sep, -89, 1.35, `rgba(230,236,245,${f1(eyes)})`);
    }
    g += G(hd, `rotate(${f1(6 * k)} 0 -80)`);
    return G(g, `translate(${f1(x)},${f1(y)}) scale(${f1(sx)},${f1(sy)})`);
  }

  // ч.2 — необязательные параметры door_out (без них кадр как в ч.1):
  //   insideDark true  — внутри 214 темно: нет полосы света и теней ступней под дверью
  //   headTo -1..1     — голова силуэта сразу повёрнута (1 — к двери), глаза .9 с первого кадра
  //   talk [[t0,t1]..] — силуэт говорит в щель: от лица к двери идут мелкие бледно-белые дуги
  //   eyesFlash t      — глаза вспыхивают .9 → 1.0 с ореолом (на «запись»)
  //   wave {t, t1?, tMatch?, label?, matchLabel?, mergeLabel?, x0?, x1?, y?, h?}
  //       — над дверью с t рисуется белая волна «здесь» (24 столбика, слева направо до t1 = t+0.75);
  //         с tMatch слева въезжает голубая копия и за 0.3 с ложится точно поверх; вспышка, подписи сливаются
  const TX = 86, TH = 1.108 * DH;        // силуэт: x и рост (как в ч.1)
  // точка на голове силуэта (локальные координаты tall) -> холст
  function headPt(k, lx, ly, br = 0) {
    const s = TH / 100, sx = s * 0.8, sy = s * (1 + br);
    const a = 6 * k * Math.PI / 180, dx = lx, dy = ly + 80;
    const rx = dx * Math.cos(a) - dy * Math.sin(a), ry = dx * Math.sin(a) + dy * Math.cos(a);
    return [TX + rx * sx, GROUND + (ry - 80) * sy];
  }
  // огибающая «Здесь!» с лестничным эхом (τ 0..1): атака «З», «-де-», «-сь!», три затухающих отражения
  function zdesEnv(tau) {
    const gs = (c, w) => Math.exp(-Math.pow((tau - c) / w, 2));
    return Math.min(1, 0.06 + 0.5 * gs(0.1, 0.05) + 0.95 * gs(0.27, 0.1) + 0.55 * gs(0.46, 0.065) + 0.44 * gs(0.64, 0.04) + 0.28 * gs(0.79, 0.035) + 0.16 * gs(0.92, 0.03));
  }
  const WN = 24;
  function waveBars(o, h, col, mode) {   // mode: 'fill' | 'line'
    const { x0, x1, y } = o, st = (x1 - x0) / WN, bw = st * 0.56;
    let g = '';
    for (let k = 0; k < WN; k++) {
      const hk = h[k];
      if (hk <= 0.2) continue;
      const x = x0 + st * (k + 0.5) - bw / 2;
      g += mode === 'line' ? R(x - 0.6, y - hk - 0.6, bw + 1.2, 2 * hk + 1.2, 'none', `stroke="${col}" stroke-width="1.1" rx="${f1(bw / 2 + 0.6)}"`)
                           : R(x, y - hk, bw, 2 * hk, col, `rx="${f1(bw / 2)}"`);
    }
    return g;
  }
  // волна «здесь» над дверью. Подпись — справа под волной (слева под ней в кадре door стоит плашка).
  function wave(t, w) {
    const o = { x0: w.x0 ?? 128, x1: w.x1 ?? 308, y: w.y ?? 82 }, H = w.h ?? 15;
    const t0 = w.t, t1 = w.t1 ?? (w.t + 0.75);
    if (t < t0) return '';
    const full = [], cur = [];
    for (let k = 0; k < WN; k++) {
      const tau = (k + 0.5) / WN;
      const hk = Math.max(1.3, H * zdesEnv(tau) * (0.66 + 0.34 * Math.abs(noise1(k * 1.7 + 3))));
      full.push(hk);
      const tk = t0 + (t1 - t0) * k / WN;
      cur.push(hk * eout(lin(t, tk, tk + 0.1)));
    }
    const tm = w.tMatch, land = tm != null ? tm + 0.3 : 1e9;
    const fl = t >= land ? Math.exp(-(t - land) / 0.16) : 0;
    const ly = o.y + H + 13;
    let g = '';
    // мягкая подложка, чтобы волна читалась на стене
    g += R(o.x0 - 12, o.y - H - 10, o.x1 - o.x0 + 24, 2 * H + 37, 'rgba(3,7,16,.42)', `rx="9" opacity="${f1(lin(t, t0, t0 + 0.2))}"`);
    if (fl > 0.01) g += `<defs><radialGradient id="dg_wfl"><stop offset="0" stop-color="#ffffff" stop-opacity=".75"/><stop offset=".55" stop-color="#dbe8ff" stop-opacity=".25"/><stop offset="1" stop-color="#dbe8ff" stop-opacity="0"/></radialGradient></defs>` +
      `<ellipse cx="${f1((o.x0 + o.x1) / 2)}" cy="${o.y}" rx="${f1((o.x1 - o.x0) / 2 + 40)}" ry="${H + 34}" fill="url(#dg_wfl)" opacity="${f1(0.8 * fl)}"/>`;
    // белая волна с ореолом
    g += G(waveBars(o, cur.map(v => v > 0.2 ? v + 1.8 : 0), '#cfe0ff', 'fill'), '', `opacity="${f1(0.16 + 0.45 * fl)}"`);
    g += waveBars(o, cur, fl > 0 ? '#ffffff' : '#e9eef6', 'fill');
    // курсор, пока рисуется
    if (t < t1 + 0.05) {
      const xc = o.x0 + (o.x1 - o.x0) * lin(t, t0, t1);
      g += L(xc, o.y - H - 4, xc, o.y + H + 4, '#ffffff', 1.2, `opacity=".8" stroke-linecap="round"`) + Ci(xc, o.y - H - 4, 1.7, '#ffffff');
    }
    // подписи
    const lab = w.label ?? '19:47 · за дверью', mlab = w.matchLabel ?? '19:41 · 3 этаж', mrg = w.mergeLabel ?? '19:41 = 19:47';
    const TA = `${MONO} text-anchor="end"`;
    // подпись в две строки: «19:47» крупно, «за дверью» мелко (делим по « · »), правый край по x1
    const lbl = (x, y, s, col, a) => { const [m, sub] = s.split(' · '); return T(x, y, m, 11, col, `${TA} opacity="${f1(a)}"`) + (sub ? T(x, y + 9.5, sub, 8, col, `${TA} opacity="${f1(a * 0.85)}"`) : ''); };
    const aOld = lin(t, t0, t0 + 0.2) * (1 - lin(t, land, land + 0.1));
    if (aOld > 0.01) g += lbl(o.x1, ly, lab, '#e9eef6', aOld);
    if (tm != null && t >= tm) {
      const k = eout(lin(t, tm, land));
      const off = -(o.x1 - o.x0 + 40) * (1 - k);
      const uy = o.y - H - 13;   // подпись копии едет над волной
      if (t < land) {   // голубая копия въезжает слева вместе со своей подписью
        g += G(waveBars(o, full, '#8fc4ff', 'fill'), `translate(${f1(off)} 0)`, 'opacity=".8"');
        g += lbl(o.x1 + off, uy, mlab, '#9fcbff', 0.95);
      } else {          // легла точно поверх: голубой контур вокруг белых столбиков, подписи слились
        g += waveBars(o, full, '#8fc4ff', 'line');
        const am = lin(t, land + 0.06, land + 0.16), ad = lin(t, land, land + 0.1);
        if (ad < 1) g += lbl(o.x1, mix(uy, ly, ease(ad)), mlab, '#9fcbff', 0.95 * (1 - ad));
        const parts = mrg.split('=');
        const txt = parts.length === 2 ? `<tspan fill="#9fcbff">${parts[0]}</tspan><tspan fill="#ffffff">=</tspan><tspan fill="#ffffff">${parts[1]}</tspan>` : mrg;
        g += T(o.x1, ly + 4, txt, 11, '#ffffff', `${TA} opacity="${f1(am)}"`);
        if (fl > 0.02) g += T(o.x1, ly + 4, txt, 11, '#ffffff', `${TA} opacity="${f1(0.6 * fl)}" stroke="#ffffff" stroke-width=".6"`);
      }
    }
    return g;
  }

  SCENES.door_out = function (u, p, d, t) {
    const num = p.num || '214';
    const dark = !!p.shadow;
    let g = '';
    const flick = 0.5 + 0.5 * noise1(t * 7);
    // стена и потолок
    g += R(0, 0, 360, GROUND, '#0f1a2f');
    g += R(0, 0, 360, 34, '#0a1324') + L(0, 34, 360, 34, '#1b2943', 2);
    for (const lx of [60, 180, 300]) g += R(lx - 22, 34, 44, 5, '#1a273e') + R(lx - 18, 39, 36, 2, `rgba(190,215,255,${f1(0.07 + 0.05 * flick * (lx === 180 ? 1 : 0))})`);
    g += R(0, 258, 360, GROUND - 258, '#0c1628') + L(0, 258, 360, 258, '#22324f', 2);
    g += R(0, GROUND - 10, 360, 10, '#091120');
    // окно слева, под ним батарея
    {
      const wx = 14, wy = 104, ww = 46, wh = 116;
      g += P(`M${wx} ${GROUND} L${wx + ww} ${GROUND} L${wx + ww + 56} ${GROUND + 24} L${wx - 22} ${GROUND + 24} Z`, 'url(#dg_beam)', 'opacity=".16"');
      g += R(wx - 4, wy - 4, ww + 8, wh + 8, '#24324d') + R(wx, wy, ww, wh, '#06102a');
      g += G(snow(wx, wy, ww, wh, t, 14, 3, 10, .9));
      g += L(wx + ww / 2, wy, wx + ww / 2, wy + wh, '#24324d', 3) + L(wx, wy + 46, wx + ww, wy + 46, '#24324d', 3) + R(wx - 8, wy + wh + 4, ww + 16, 5, '#2c3b5a');
      g += G(radiator(wx - 2, 304, 50, 34), '', 'opacity=".42"');
    }
    // доска объявлений справа
    {
      const bx = 266, by = 176;
      g += R(bx - 3, by - 3, 66, 78, '#1e2638') + R(bx, by, 60, 72, '#2a2420');
      const papers = [[6, 8, 22, 28, -3], [32, 6, 20, 20, 2], [10, 42, 18, 24, 3], [34, 34, 22, 30, -2]];
      papers.forEach(([dx, dy, w, h, r], i) => {
        g += G(R(bx + dx, by + dy, w, h, 'rgba(200,208,222,.5)') + L(bx + dx + 3, by + dy + 7, bx + dx + w - 3, by + dy + 7, 'rgba(40,46,60,.55)', 1.2) + L(bx + dx + 3, by + dy + 12, bx + dx + w - 5, by + dy + 12, 'rgba(40,46,60,.4)', 1) + Ci(bx + dx + w / 2, by + dy + 2.4, 1.2, '#b0303a'), `rotate(${r} ${bx + dx + w / 2} ${by + dy + h / 2})`);
      });
    }
    // динамик в стене коридора
    if (!p.noSpeaker) g += speaker(t, p);   // у двери 214 динамика нет: рассказчик как раз говорит, что его сняли
    if (!p.noSpeaker && dark && !((p.pulse || []).length)) {   // слушает: красный огонёк и тихие кольца внутрь
      const pl = 0.55 + 0.45 * Math.sin(t * 3.2);
      g += Ci(SP.x + 11, SP.y + 9, 1.8, C.red, `opacity="${f1(0.5 + 0.5 * pl)}"`) + Ci(SP.x + 11, SP.y + 9, 8, 'url(#glowR)', `opacity="${f1(pl)}"`);
      g += rings(SP.x, SP.y + 2, t, { n: 2, r0: 8, r1: 34, col: '#ff4a4a', a: 0.3, w: 1.1, dir: -1, speed: 0.6 });
    }

    // дверь
    const cx = DX + DW / 2;
    g += R(DX - 6, DY - 6, DW + 12, DH + 6, '#1a2438') + R(DX, DY, DW, DH, '#03060c');
    g += R(DX, DY, DW, DH, C.door) + R(DX, DY, DW, DH, 'rgba(4,8,18,.3)');
    g += R(DX + 10, DY + 62, DW - 20, 68, C.door2, 'opacity=".5"') + R(DX + 10, DY + 142, DW - 20, 72, C.door2, 'opacity=".5"');
    g += R(DX + 10, DY + 62, DW - 20, 68, 'none', `stroke="${C.door3}" stroke-width="1.6"`) + R(DX + 10, DY + 142, DW - 20, 72, 'none', `stroke="${C.door3}" stroke-width="1.6"`);
    g += R(DX + DW - 4, DY, 4, DH, C.door3) + R(DX, DY, 3, DH, 'rgba(200,170,130,.1)');
    g += R(DX, DY + DH - 22, DW, 22, 'rgba(20,16,12,.45)');            // отбойная пластина
    g += R(DX + DW - 30, DY + 118, 21, 4.6, C.metal, 'rx="2"') + Ci(DX + DW - 23, DY + 131, 2.8, C.metal) + Ci(DX + DW - 23, DY + 131, 1.1, '#1a1a1a');
    // табличка с номером
    {
      const px = cx - 25, py = DY + 20;
      g += R(px - 2, py - 2, 54, 30, '#10192c', 'rx="2"') + R(px, py, 50, 26, '#c9ced6', 'rx="1.5"') + R(px, py, 50, 4, 'rgba(255,255,255,.35)', 'rx="1.5"');
      g += T(cx, py + 20, num, 19, '#20242c', 'text-anchor="middle" font-family="Mont" font-weight="800" letter-spacing=".6"');
    }
    // полоска света под дверью (кто-то внутри)
    if (dark && !p.insideDark) {
      const f = 0.55 + 0.25 * noise1(t * 5.3) + 0.12 * Math.sin(t * 2.1);
      g += P(`M${DX + 4} ${GROUND} L${DX + DW - 4} ${GROUND} L${DX + DW + 16} ${GROUND + 15} L${DX - 12} ${GROUND + 15} Z`, 'url(#dg_spill)', `opacity="${f1(f)}"`);
      g += R(DX + 3, GROUND - 3.4, DW - 6, 3.4, '#ffd89a', `opacity="${f1(0.45 + 0.5 * f)}"`);
      // кто-то стоит по ту сторону вплотную к двери: две тени от ступней прерывают полоску
      const fk = lin(u, 0.5, 0.9), fx = DX + DW * 0.56 + Math.sin(t * 1.3) * 0.8;
      if (fk > 0) g += R(fx - 14, GROUND - 3.8, 11, 4.2, '#0a0f1a', `opacity="${f1(fk * 0.92)}"`) + R(fx + 3, GROUND - 3.8, 11, 4.2, '#0a0f1a', `opacity="${f1(fk * 0.92)}"`);
    }
    // пол
    g += R(0, GROUND, 360, 640 - GROUND, '#070d1a') + L(0, GROUND, 360, GROUND, '#2a3b5c', 2);
    for (let i = 0; i < 6; i++) g += L(0, GROUND + 18 + i * i * 9, 360, GROUND + 18 + i * i * 9, '#0b1424', 1);
    // силуэт
    if (dark) {
      const k = p.headTo != null ? p.headTo : mix(-1, 1, ease(lin(u, 0.25, 2.1)));
      let eyes = p.headTo != null ? 0.9 : lin(u, 0.55, 1.1) * 0.9;
      // говорит: доля «звука» 0..1
      let talk = 0;
      for (const [a, b] of (p.talk || [])) talk = Math.max(talk, lin(t, a, a + 0.08) * (1 - lin(t, b, b + 0.25)));
      const ef = p.eyesFlash != null ? t - p.eyesFlash : -1;
      if (ef >= 0) eyes = Math.min(1, eyes + 0.1 * eout(lin(ef, 0, 0.08)));
      const br = 0.004 * Math.sin(u * 1.9) + (talk > 0 ? 0.003 * talk * Math.sin(t * 23) : 0);
      g += tall(86, GROUND, 1.108 * DH, k, eyes, br);
      if (ef >= 0) {   // ореол вокруг глаз
        const sep = 3.2 * (1 - Math.abs(k) * 0.62), c = 2.3 * k + 4.8 * k;
        const fa = 0.25 + 0.75 * Math.exp(-ef / 0.45);
        for (const ex of [c - sep, c + sep]) {
          const [xx, yy] = headPt(k, ex, -89, br);
          g += Ci(xx, yy, 7 + 6 * Math.exp(-ef / 0.3), 'url(#dg_eye)', `opacity="${f1(fa)}"`);
        }
      }
      if (talk > 0.01) {   // голос идёт в щель двери: бледные дуги от лица к двери
        const [mx, my] = headPt(k, 2.3 * k + (9.5 - 1.3 * Math.abs(k)) * Math.sign(k || 1) * 0.85, -84.5, br);
        const dir = k >= 0 ? 0 : Math.PI;
        for (let i = 0; i < 4; i++) {
          const e = ((t * 1.9 + i / 4) % 1);
          const r = 4 + 32 * e, sp = 0.6;
          const xA = mx + Math.cos(dir - sp) * r, yA = my + Math.sin(dir - sp) * r, xB = mx + Math.cos(dir + sp) * r, yB = my + Math.sin(dir + sp) * r;
          g += P(`M${f1(xA)} ${f1(yA)} A${f1(r)} ${f1(r)} 0 0 1 ${f1(xB)} ${f1(yB)}`, 'none', `stroke="#e8eef8" stroke-width="${f1(1.6 - 0.7 * e)}" stroke-linecap="round" opacity="${f1(0.8 * talk * Math.sin(Math.PI * e))}"`);
        }
        g += L(DX + 0.5, my - 26, DX + 0.5, my + 22, '#dfe8f6', 1.2, `opacity="${f1(0.22 * talk * (0.7 + 0.3 * Math.sin(t * 17)))}"`);
      }
    }
    // пылинки
    for (let i = 0; i < 9; i++) {
      const xx = 20 + hash(i * 3.1) * 320 + Math.sin(t * 0.5 + i) * 6, yy = 70 + ((hash(i * 7.7) * 300 + t * (3 + hash(i) * 5)) % 300);
      g += Ci(xx, yy, 0.7, `rgba(190,210,240,${f1(0.18 + 0.12 * hash(i * 2.2))})`);
    }
    g += R(0, 0, 360, 640, `rgba(2,5,12,${f1((dark ? 0.2 : 0.06) + 0.03 * noise1(t * 6))})`);
    if (p.wave) g += wave(t, p.wave);
    if (p.eyesFlash != null) g = `<defs><radialGradient id="dg_eye"><stop offset="0" stop-color="#f2f6ff" stop-opacity=".9"/><stop offset=".35" stop-color="#cfe0ff" stop-opacity=".35"/><stop offset="1" stop-color="#cfe0ff" stop-opacity="0"/></radialGradient></defs>` + g;
    g = `<defs><linearGradient id="dg_beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1c7" stop-opacity=".5"/><stop offset="1" stop-color="#fff1c7" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="dg_spill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".5"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></linearGradient></defs>` + g;
    return g;
  };
})();

// ---------------------------------------------------------------- wall_wires
(() => {
  const HX = 180, HY = 206;   // дыра в стене (локальные координаты группы, которая увеличивается в K раз вокруг неё)
  const K = 1.42, AX = 180, AY = 233;   // масштаб и куда встаёт дыра на холсте
  const BOARD = 341;          // верхний край доски

  // кривая провода: от дыры вниз, кончик качается
  function wire(t, o) {
    const { sx, ex, ey, col, ph, amp = 1, lw = 2.6, hi } = o;
    const s1 = Math.sin(t * 1.6 + ph) * 3.2 * amp + noise1(t * 0.9 + ph) * 1.5 * amp;
    const s2 = Math.sin(t * 1.35 + ph + 0.9) * 6.5 * amp + noise1(t * 0.7 + ph * 2) * 2 * amp;
    const x0 = HX + sx, y0 = HY + 3;
    const c1x = x0 + o.c1 + s1 * 0.4, c1y = y0 + 22;
    const c2x = ex + o.c2 + s2 * 0.6, c2y = ey - 24;
    const exx = ex + s2, eyy = ey + Math.abs(s2) * 0.18;
    const dx = exx - c2x, dy = eyy - c2y, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl;
    const bx = exx + ux * 11, by = eyy + uy * 11;   // оголённый конец
    let g = '';
    const body = `M${f1(x0)} ${f1(y0)} C${f1(c1x)} ${f1(c1y)},${f1(c2x)} ${f1(c2y)},${f1(exx)} ${f1(eyy)}`;
    g += P(body, 'none', `stroke="rgba(0,0,0,.35)" stroke-width="${lw}" stroke-linecap="round" transform="translate(3.5,2.2)"`);
    g += P(body, 'none', `stroke="${col}" stroke-width="${lw}" stroke-linecap="round"`);
    g += P(body, 'none', `stroke="${hi}" stroke-width="${f1(lw * 0.3)}" stroke-linecap="round" transform="translate(-.6,-.5)" opacity=".7"`);
    // жила
    g += L(exx, eyy, bx, by, '#e09a58', 1.7, 'stroke-linecap="round"') + Ci(exx, eyy, lw * 0.5 + 0.2, '#c9b9a0');
    const ang = Math.atan2(uy, ux);
    for (let i = -1; i <= 1; i++) {
      const aa = ang + i * 0.38, ln = 6.5 + (i === 0 ? 1.5 : 0);
      g += L(bx, by, bx + Math.cos(aa) * ln, by + Math.sin(aa) * ln, '#ffc27a', 1.1, 'stroke-linecap="round"');
    }
    const gl = Math.pow(Math.max(0, Math.sin(t * 4.4 + ph * 3)), 10);
    if (gl > 0.05) g += Ci(bx + ux * 3, by + uy * 3, 1.1 + gl * 1.2, `rgba(255,235,200,${f1(gl)})`);
    return { svg: g, tip: [bx, by] };
  }

  SCENES.wall_wires = function (u, p, d, t) {
    let g = '';
    // стена
    g += R(0, 0, 360, 640, '#0e192e');
    g += Ci(60, 150, 280, 'url(#glowC)', 'opacity=".16"');
    g += R(0, 0, 360, 34, '#0a1324') + L(0, 34, 360, 34, '#1b2943', 2);
    // грязь на стене, потёки
    for (let i = 0; i < 9; i++) g += R(24 + hash(i * 3.3) * 312, 36, 1 + hash(i) * 2.2, 40 + hash(i * 5.1) * 150, 'rgba(0,0,0,.13)');

    // всё, что на стене у дыры, — одной группой, крупнее
    let w = '';
    const px = 118, py = 150, pw = 124, ph = 110;
    // след от динамика: чистый светлый прямоугольник среди запылённой стены (мягкий край)
    for (let i = 3; i >= 1; i--) w += R(px - i * 3, py - i * 3, pw + i * 6, ph + i * 6, `rgba(0,0,0,${f1(0.045 + 0.015 * (4 - i))})`, `rx="${i * 3}"`);
    {
      const jt = n => (hash(n * 1.7 + 4.1) - 0.5) * 1.6;
      let pd = `M${f1(px + jt(1))} ${f1(py + jt(2))}`;
      for (let x_ = px + 12; x_ < px + pw; x_ += 12) pd += ` L${f1(x_)} ${f1(py + jt(x_))}`;
      for (let y_ = py + 12; y_ < py + ph; y_ += 12) pd += ` L${f1(px + pw + jt(y_ + 50))} ${f1(y_)}`;
      for (let x_ = px + pw - 12; x_ > px; x_ -= 12) pd += ` L${f1(x_)} ${f1(py + ph + jt(x_ + 90))}`;
      for (let y_ = py + ph - 12; y_ > py; y_ -= 12) pd += ` L${f1(px + jt(y_ + 130))} ${f1(y_)}`;
      w += P(pd + ' Z', '#1f3050');
    }
    w += R(px, py, pw, ph, 'url(#dg_dust)');
    for (let i = 0; i < 60; i++) w += Ci(px + 4 + hash(i * 2.7) * (pw - 8), py + 4 + hash(i * 4.9) * (ph - 8), 0.45 + hash(i * 8.1) * 0.6, `rgba(190,205,230,${f1(0.08 + 0.12 * hash(i * 1.3))})`);
    w += L(px, py, px + pw, py, 'rgba(160,185,225,.16)', 1) + L(px, py, px, py + ph, 'rgba(160,185,225,.12)', 1);
    // потёки пыли под пятном
    for (let i = 0; i < 5; i++) w += R(px + 10 + hash(i * 6.1) * (pw - 20), py + ph, 1.4, 8 + hash(i * 2.2) * 16, 'rgba(0,0,0,.18)');
    // дырки от шурупов
    for (const [sx_, sy_] of [[px + 9, py + 9], [px + pw - 9, py + 9], [px + 9, py + ph - 9], [px + pw - 9, py + ph - 9]]) w += Ci(sx_, sy_, 1.6, '#0a1222') + Ci(sx_ - 0.4, sy_ - 0.4, 1, '#050a14');
    // кронштейн (пустой)
    w += R(HX - 24, py + 10, 48, 8, '#59647a', 'rx="1.6"') + R(HX - 24, py + 10, 48, 1.6, '#97a3ba', 'rx="1"') +
      Ci(HX - 17, py + 14, 2, '#2a3244') + Ci(HX + 17, py + 14, 2, '#2a3244') +
      R(HX - 3, py + 18, 6, 14, '#4a5469') + R(HX - 7, py + 31, 14, 4, '#59647a', 'rx="1.4"');
    // трещины от дыры
    w += P(`M${HX + 9} ${HY - 4} l 10 -9 l 6 -14 M${HX - 9} ${HY + 2} l -12 6 l -4 12 M${HX + 4} ${HY + 8} l 6 10 l -2 12`, 'none', 'stroke="#05080f" stroke-width="1" stroke-linecap="round" opacity=".8"');
    // дыра
    {
      let d_ = '';
      const n = 11;
      for (let i = 0; i < n; i++) {
        const a_ = (i / n) * Math.PI * 2, r_ = (i % 2 ? 7.5 : 10) + hash(i * 3.7) * 3.2;
        d_ += (i ? 'L' : 'M') + f1(HX + Math.cos(a_) * r_ * 1.1) + ' ' + f1(HY + Math.sin(a_) * r_ * 0.9) + ' ';
      }
      d_ += 'Z';
      w += P(d_, '#02050b', 'stroke="#2f4166" stroke-width="1.3" stroke-linejoin="round"');
      for (let i = 0; i < 6; i++) { const a_ = hash(i * 9.1) * 6.28, r_ = 14 + hash(i * 4.2) * 7; w += R(HX + Math.cos(a_) * r_ - 1.5, HY + Math.sin(a_) * r_ * 0.85 - 1.2, 3 + hash(i) * 2, 2.2, '#324567', `transform="rotate(${f1(hash(i) * 90)} ${f1(HX + Math.cos(a_) * r_)} ${f1(HY + Math.sin(a_) * r_ * 0.85)})"`); }
    }
    // провода
    const ws = [
      wire(t, { sx: -6, ex: HX - 22, ey: 259, col: C.red, hi: '#ff8c8c', ph: 0.4, c1: -8, c2: -4, amp: 1.1 }),
      wire(t, { sx: 1, ex: HX + 4, ey: 271, col: C.yellow, hi: '#fff3a8', ph: 2.1, c1: 5, c2: 10, amp: 1.0 }),
      wire(t, { sx: 7, ex: HX + 30, ey: 252, col: '#242a38', hi: '#6a7690', ph: 4.0, c1: 12, c2: 6, amp: 1.25 }),
    ];
    for (const q of ws) w += q.svg;
    // искра в момент «провода»
    const sp = t - (p.tSpark ?? 62.43);
    if (sp > 0 && sp < 0.2) {
      const tp = ws[0].tip, k = 1 - sp / 0.2;
      w += Ci(tp[0], tp[1], 26, 'url(#glowC)', `opacity="${f1(k)}"`) + Ci(tp[0], tp[1], 2.2 * k + 0.6, '#eaf4ff');
      for (let i = 0; i < 4; i++) { const a_ = hash(i * 3.3) * 6.28, r_ = 4 + sp * 60 * hash(i + 2); w += L(tp[0], tp[1], tp[0] + Math.cos(a_) * r_, tp[1] + Math.sin(a_) * r_, `rgba(220,240,255,${f1(k)})`, 0.9); }
    }
    // падающая крошка
    for (let i = 0; i < 4; i++) {
      const per = 1.3 + i * 0.37, ph0 = (t / per + hash(i * 6.1)) % 1;
      w += Ci(HX - 14 + hash(i * 2.1) * 28 + Math.sin(t * 2 + i) * 1.5, HY + 12 + ph0 * ph0 * 70, 0.8 + hash(i) * 0.5, `rgba(200,212,235,${f1(0.7 * (1 - ph0))})`);
    }
    g += G(w, `translate(${AX},${AY}) scale(${K}) translate(${-HX},${-HY})`);

    // доска: верхний край, мел-пыль на раме
    g += R(0, BOARD, 360, 11, '#2a3856') + L(0, BOARD, 360, BOARD, '#566a96', 1.4) + L(0, BOARD + 11, 360, BOARD + 11, '#101a2e', 1.2);
    g += R(0, BOARD + 11, 360, 100, '#10222a');
    g += P(`M30 ${BOARD + 24} q 40 -8 80 0 M170 ${BOARD + 26} q 60 6 120 -2`, 'none', 'stroke="rgba(210,225,240,.1)" stroke-width="1.6" stroke-linecap="round"');
    for (let i = 0; i < 18; i++) g += R(HX - 50 + hash(i * 3.7) * 100, BOARD - 2.4 + hash(i) * 2, 1.2 + hash(i * 2) * 2, 1.8, `rgba(215,225,240,${f1(0.35 + 0.3 * hash(i * 5))})`);
    g += R(0, 352, 360, 22, 'url(#dg_gf2)') + R(0, 373, 360, 280, '#050c1a');
    // слабый общий дрейф света
    g += R(0, 0, 360, 372, `rgba(120,160,230,${f1(0.025 + 0.02 * noise1(t * 1.1))})`);
    g = `<defs><linearGradient id="dg_gf2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050c1a" stop-opacity="0"/><stop offset="1" stop-color="#050c1a" stop-opacity="1"/></linearGradient>` +
      `<linearGradient id="dg_dust" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7f98c4" stop-opacity=".16"/><stop offset="1" stop-color="#7f98c4" stop-opacity="0"/></linearGradient></defs>` + g;
    return g;
  };
})();

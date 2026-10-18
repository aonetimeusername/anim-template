// сцена smoke_detector: потолок кабинета 214 снизу, пожарный датчик ИП-212; рука Тёмы трясёт меловую тряпку,
// пыль летит в прорези, датчик срабатывает (tSmoke), включается тревога (tSiren), рука уходит вниз.
// p (абсолютные времена, с; без них — отсчёт от начала кадра):
//   tShake — начало тряски (верхние пики: tShake + k·period), period — период взмаха (0.32),
//   tSmoke — датчик сработал (диод красный, кольцо, писк), tSiren — тревога (красный пульс 1.5 Гц, рука уходит),
//   tStop — когда рука перестаёт трясти (по умолчанию = tSmoke: замирает на писке; можно = tSiren)
(() => {
  const CAP = 'stroke-linecap="round"';
  const rad = d => d * Math.PI / 180;
  const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const rot2 = (x, y, deg) => { const a = rad(deg), c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; };

  const DX = 180, DY = 190;          // центр датчика
  const DS = 1.2;                    // масштаб датчика (корпус r48 -> ~58 на холсте)
  const RS = 31;                     // радиус окружности прорезей
  const SLOTS = [];
  for (let i = 0; i < 12; i++) { const a = rad(i * 30 + 15); SLOTS.push([Math.cos(a) * RS, Math.sin(a) * RS, i * 30 + 15]); }
  const LED_A = 24, LED_R = 42.5;    // светодиод на корпусе: угол / радиус
  const LED = [Math.cos(rad(LED_A)) * LED_R, Math.sin(rad(LED_A)) * LED_R];

  // ---------------- поза руки во времени
  // wrist — запястье (холст), rot — наклон кисти, flap — фаза хлопанья краёв тряпки
  function pose(t, T) {
    const rise = eout(lin(t, T.t0, T.t0 + 0.4));
    const A = lin(t, T.shake - 0.12, T.shake) * (1 - sstep(T.stop, T.stop + 0.22, t));
    const ph = 2 * Math.PI * (t - T.shake) / T.period;
    const down = ein(lin(t, T.siren, T.siren + 0.5));
    const idle = (1 - A) * rise;
    const tremble = t > T.stop ? 0.6 * noise1(t * 19 + 3) * lin(t, T.stop, T.stop + 0.2) : 0;
    const x = mix(150, 172, rise) + 3 * A * Math.sin(ph) + idle * 1.4 * noise1(t * 0.9 + 2) + tremble;
    const y = mix(650, 358, rise) - 10 * A * Math.cos(ph) + idle * 1.6 * noise1(t * 0.7 + 7) + 380 * down;
    const r = 6 * A * Math.sin(ph) + idle * 1.5 * noise1(t * 0.6 + 5) - 4 * down;
    return { x, y, r, A, ph, down };
  }

  // ---------------- датчик
  function detector(cx, cy, st) {
    const { dust, red, ledOn, ledCol, slotRed } = st;
    let g = '';
    g += `<clipPath id="sd_body"><circle cx="${f1(cx)}" cy="${f1(cy)}" r="48"/></clipPath>`;
    // тень на потолке (мягкая: два слоя)
    g += Ci(cx + 3, cy + 4, 56, 'rgba(0,0,0,.22)') + Ci(cx + 3, cy + 4, 51, 'rgba(0,0,0,.2)');
    // корпус
    let b = Ci(cx, cy, 48, '#dfe5ee');
    b += Ci(cx - 9, cy + 10, 50, '#c2cad6', 'opacity=".55"');                 // затенённая сторона (от луны справа)
    b += Ci(cx - 3, cy + 3, 44, '#dfe5ee', 'opacity=".55"');
    b += P(`M${f1(cx + 46)} ${f1(cy - 12)} A47 47 0 0 1 ${f1(cx + 14)} ${f1(cy + 45)}`, 'none', `stroke="#f6f9fd" stroke-width="2" opacity=".75" ${CAP}`);
    b += Ci(cx, cy, 47, 'none', 'stroke="#a9b2c0" stroke-width="1.6"');
    // выдавленная маркировка
    b += T(cx - 2, cy + 43, 'ИП 212-141', 4.3, '#aab3c1', `text-anchor="middle" font-family="Plex" font-weight="600" letter-spacing="0.6"`);
    g += G(b, '', 'clip-path="url(#sd_body)"');
    // наклейка
    g += G(R(-9, -4, 18, 8, '#f2f4f7', 'rx="1"') + R(-9, 2, 18, 2, C.red) + L(-6.5, -1.6, 4, -1.6, '#9aa3b1', 0.7) + L(-6.5, 0.2, 1, 0.2, '#9aa3b1', 0.7),
      `translate(${f1(cx - 31)} ${f1(cy + 31)}) rotate(45)`);
    // внутренний цилиндр
    g += Ci(cx + 1, cy + 2, 37, 'rgba(60,70,88,.28)');
    g += Ci(cx, cy, 36, '#cfd6e1') + Ci(cx, cy, 36, 'none', 'stroke="#aeb7c4" stroke-width="1.2"');
    g += Ci(cx, cy, 24, '#d8dee8') + Ci(cx, cy, 24, 'none', 'stroke="#b8c1cd" stroke-width="1"');
    // прорези дымовой камеры
    const sc = dust > 0 ? `rgb(${Math.round(mix(90, 150, dust))},${Math.round(mix(101, 158, dust))},${Math.round(mix(119, 172, dust))})` : '#5a6577';
    for (const [sx, sy, a] of SLOTS) {
      g += G(R(-5, -1.6, 10, 3.2, sc, 'rx="1.6"') + R(-5, -1.6, 10, 1, '#3b4455', 'rx=".5" opacity=".7"'), `translate(${f1(cx + sx)} ${f1(cy + sy)}) rotate(${a})`);
    }
    if (slotRed > 0) {
      for (const [sx, sy, a] of SLOTS) g += G(R(-5, -1.6, 10, 3.2, C.red, `rx="1.6" opacity="${f1(slotRed * 0.55)}"`), `translate(${f1(cx + sx)} ${f1(cy + sy)}) rotate(${a})`);
    }
    // сетка
    g += Ci(cx, cy, 13, '#b9c2cf') + Ci(cx, cy, 13, 'none', 'stroke="#9aa4b3" stroke-width="1"');
    g += `<clipPath id="sd_mesh"><circle cx="${f1(cx)}" cy="${f1(cy)}" r="12"/></clipPath>`;
    let m = '';
    for (const k of [-5, 5]) m += L(cx + k, cy - 13, cx + k, cy + 13, '#8e98a8', 1) + L(cx - 13, cy + k, cx + 13, cy + k, '#8e98a8', 1);
    g += G(m, '', 'clip-path="url(#sd_mesh)"') + Ci(cx, cy, 2.2, '#7d8798');
    g += P(`M${f1(cx + 9)} ${f1(cy - 8)} A12 12 0 0 1 ${f1(cx + 11)} ${f1(cy + 5)}`, 'none', `stroke="#eef2f7" stroke-width="1.1" opacity=".7" ${CAP}`);
    // светодиод
    const lx = cx + LED[0], ly = cy + LED[1];
    g += Ci(lx, ly, 3.8, '#9aa3b1') + Ci(lx, ly, 2.4, ledOn > 0.02 ? ledCol : (red ? '#5a1b22' : '#2e4a3c'));
    if (ledOn > 0.02) g += Ci(lx, ly, 2.4, '#ffffff', `opacity="${f1(0.35 * ledOn)}"`);
    return g;
  }

  // ---------------- рука с тряпкой. Локально: запястье в (0,0), кисть вверх
  function armSvg(ps, t, T) {
    const { x, y, r, A, ph } = ps;
    let g = '';
    const ex = x - 44, ey = y + 380;
    const ang = Math.atan2(y - ey, x - ex);                 // направление руки (вверх)
    const ux = Math.cos(ang), uy = Math.sin(ang);
    const nx = -uy, ny = ux;                                // нормаль: вправо
    const dg = ang * 180 / Math.PI + 90;                    // поворот, при котором локальная +y — вниз по руке

    // ---- кисть + тряпка (поворот вокруг запястья)
    const wv = (k) => A * Math.sin(ph - 1.1 - k * 0.9) + (1 - A) * 0.2 * noise1(t * 1.1 + k * 2);
    let h = '';
    const rg = '#858b96', rg2 = '#646b77', rg3 = '#9fa6b2', rgL = '#bfcadb';
    // контур тряпки: верх волной, бока, рваный низ с защипом в кулаке
    const top = [];
    for (let i = 0; i <= 6; i++) {
      const k = i / 6, xx = mix(-44, 44, k);
      top.push([xx + (i === 0 ? -2 * wv(0) : i === 6 ? 2 * wv(1) : 0), -84 - 3 * Math.sin(k * Math.PI) + 3.2 * wv(k) * (i % 2 ? 1 : -1)]);
    }
    const lc = [-49 - 3 * wv(0.2), -40 + 3 * wv(0.4)], rc = [49 + 3 * wv(0.8), -42 - 3 * wv(0.6)];   // нижние углы
    const zig = (a, b, n, side) => {
      let s_ = '';
      for (let i = 1; i <= n; i++) {
        const k = i / n, px = mix(a[0], b[0], k), py = mix(a[1], b[1], k);
        s_ += ` L${f1(px)} ${f1(py + (i % 2 ? 4.5 : 0) + (i === n ? 0 : 0))}`;
      }
      return s_;
    };
    let path = `M${f1(top[0][0])} ${f1(top[0][1])}`;
    for (let i = 1; i < top.length; i++) {
      const [x0, y0] = top[i - 1], [x1, y1] = top[i];
      path += ` Q${f1((x0 + x1) / 2)} ${f1(Math.min(y0, y1) - 3)} ${f1(x1)} ${f1(y1)}`;
    }
    path += ` C${f1(top[6][0] + 4)} -70,${f1(rc[0] + 2)} -56,${f1(rc[0])} ${f1(rc[1])}`;
    path += zig(rc, [17, -36], 5);
    path += ' L-17 -36';
    path += zig([-17, -36], lc, 5);
    path += ` C${f1(lc[0] + 2)} -56,${f1(top[0][0] - 4)} -70,${f1(top[0][0])} ${f1(top[0][1])} Z`;
    h += `<clipPath id="sd_rag"><path d="${path}"/></clipPath>`;
    let rgIn = P(path, rg);
    // крупные тени и свет внутри контура
    rgIn += P(`M-60 -100 L-14 -100 C-22 -80,-20 -56,-8 -36 L-60 -30 Z`, rg2, 'opacity=".75"');
    rgIn += P(`M10 -100 L60 -100 L60 -60 C46 -66,30 -74,16 -96 Z`, rg3, 'opacity=".9"');
    rgIn += P(`M-6 -38 Q-12 -62 -30 -84`, 'none', `stroke="${rg2}" stroke-width="1.6" ${CAP}`);
    rgIn += P(`M6 -38 Q10 -60 26 -86`, 'none', `stroke="${rg2}" stroke-width="1.5" opacity=".8" ${CAP}`);
    // мел: горизонтальные белые полосы (тряпкой вытирали доску)
    rgIn += P(`M-50 -74 C-30 ${f1(-78 + 2 * wv(0.3))},-6 -76,20 ${f1(-79 + 2 * wv(0.6))} S44 -76,56 -78`, 'none', `stroke="#f1f4f9" stroke-width="6" opacity=".42"`);
    rgIn += P(`M-50 -60 C-34 -62,-20 -61,-8 -63`, 'none', `stroke="#f1f4f9" stroke-width="4" opacity=".35"`);
    rgIn += P(`M8 -62 C22 -64,38 -62,56 -64`, 'none', `stroke="#f1f4f9" stroke-width="5" opacity=".4"`);
    rgIn += P(`M-50 -48 C-40 -49,-30 -48,-22 -50`, 'none', `stroke="#f1f4f9" stroke-width="3" opacity=".3"`);
    for (const [ex_, ey_, rr] of [[-26, -70, 1.3], [-10, -82, 1.1], [24, -70, 1.2], [36, -56, 1], [-36, -54, 1], [4, -68, 1.1], [14, -84, 0.9]]) rgIn += Ci(ex_, ey_, rr, '#ffffff', 'opacity=".8"');
    h += G(rgIn, '', 'clip-path="url(#sd_rag)"');
    // кромка: светлая по верху справа (луна), меловая пыль по верхнему краю
    h += P(`M${f1(top[3][0])} ${f1(top[3][1])} Q${f1((top[3][0] + top[4][0]) / 2)} ${f1(Math.min(top[3][1], top[4][1]) - 3)} ${f1(top[4][0])} ${f1(top[4][1])} Q${f1((top[4][0] + top[5][0]) / 2)} ${f1(Math.min(top[4][1], top[5][1]) - 3)} ${f1(top[5][0])} ${f1(top[5][1])}`, 'none', `stroke="${rgL}" stroke-width="1.6" opacity=".7" ${CAP}`);
    // кулак (ближе к камере)
    h += R(-19, -42, 38, 34, C.skin, 'rx="11"');
    h += P('M-19 -24 L19 -24 L19 -19 Q19 -8 8 -8 L-8 -8 Q-19 -8 -19 -19 Z', C.skin2, 'opacity=".6"');
    for (const fx of [-9.5, 0, 9.5]) h += L(fx, -40, fx, -25, '#8a5f45', 1, `opacity=".7" ${CAP}`);
    h += P('M-19 -32 C-25 -34,-25 -42,-18 -44 C-10 -46,0 -44,6 -40 C2 -37,-8 -35,-19 -32 Z', '#c48d69');   // большой палец
    h += L(-16, -41.5, 2, -41.5, '#e7c09f', 1.1, `opacity=".55" ${CAP}`);
    h += L(18.5, -36, 18.5, -16, '#f0c7a6', 1.2, `opacity=".55" ${CAP}`);
    // запястье
    h += P('M-12.5 -12 L12.5 -12 L12 12 L-12 12 Z', C.skin2);
    h += L(11.8, -10, 11.4, 10, '#e2b391', 1, `opacity=".5" ${CAP}`);
    g += G(h, `translate(${f1(x)} ${f1(y)}) rotate(${f1(r)})`);

    // ---- рукав: от локтя (ниже кадра) к запястью, сужается вверх (ракурс). Рисуем в системе руки: +y — к локтю
    const len = Math.hypot(x - ex, y - ey);
    const w0 = 24, w1 = 54, s0 = 12;                         // полуширина у края / у локтя; край рукава ниже запястья
    let sv = '';
    sv += P(`M${-w0} ${s0} Q0 ${s0 - 9} ${w0} ${s0} L${w1} ${f1(len)} L${-w1} ${f1(len)} Z`, C.suit);
    sv += P(`M${-w0} ${s0} Q${-w0 * 0.6} ${s0 - 6} ${f1(-w0 * 0.15)} ${s0 - 6.5} L${f1(-w1 * 0.1)} ${f1(len)} L${-w1} ${f1(len)} Z`, C.suit2, 'opacity=".85"');
    // манжета рубашки: полоска над краем рукава
    sv = P(`M${-w0 + 6} ${s0 - 3} Q0 ${s0 - 12} ${w0 - 6} ${s0 - 3} L${w0 - 6} ${s0 + 1} Q0 ${s0 - 8} ${-w0 + 6} ${s0 + 1} Z`, '#a7b0bf') + sv;
    // кромка рукава
    sv += P(`M${-w0} ${s0} Q0 ${s0 - 9} ${w0} ${s0}`, 'none', `stroke="#33415f" stroke-width="1.6" ${CAP}`);
    // складки
    for (const [yy, a0, a1] of [[50, -16, 8], [98, -26, -2], [160, -20, 18]]) sv += P(`M${a0} ${yy} q ${(a1 - a0) / 2} -7 ${a1 - a0} -1`, 'none', `stroke="${C.suit2}" stroke-width="1.6" ${CAP}`);
    // контровой свет луны справа
    sv += L(w0 - 1.5, s0 + 1, w1 - 2, len, '#9ec2f0', 1.4, `opacity=".45" ${CAP}`);
    g += G(sv, `translate(${f1(x)} ${f1(y)}) rotate(${f1(dg)})`);
    return g;
  }

  // точка верхнего края тряпки (для вылета пыли)
  function ragTop(ps, lx) {
    const [qx, qy] = rot2(lx, -86 + Math.abs(lx) * 0.05, ps.r);
    return [ps.x + qx, ps.y + qy];
  }

  SCENES.smoke_detector = function (u, p, d, t) {
    const t0 = t - u;
    const T = {
      t0,
      shake: p.tShake ?? t0 + 1.4,
      period: p.period ?? 0.32,
      smoke: p.tSmoke ?? t0 + 5.2,
    };
    T.siren = p.tSiren ?? T.smoke + 0.45;
    T.stop = Math.min(p.tStop ?? T.smoke, T.siren);   // рука замирает на писке датчика (можно передать tStop = tSiren)
    const FL = GROUND;
    let g = `<defs>
      <linearGradient id="sd_ceil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070f1e"/><stop offset=".55" stop-color="#0a1527"/><stop offset="1" stop-color="#0a1527"/></linearGradient>
      <linearGradient id="sd_hush" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03060c" stop-opacity="0"/><stop offset=".55" stop-color="#03060c" stop-opacity=".88"/><stop offset="1" stop-color="#03060c" stop-opacity="1"/></linearGradient>
      <radialGradient id="sd_haze"><stop offset="0" stop-color="#eef3fa" stop-opacity=".9"/><stop offset=".5" stop-color="#dfe7f2" stop-opacity=".4"/><stop offset="1" stop-color="#dfe7f2" stop-opacity="0"/></radialGradient>
      <radialGradient id="sd_red"><stop offset="0" stop-color="#ff3a4c" stop-opacity=".9"/><stop offset=".45" stop-color="#d7263d" stop-opacity=".35"/><stop offset="1" stop-color="#d7263d" stop-opacity="0"/></radialGradient>
      <radialGradient id="sd_puff"><stop offset="0" stop-color="#eef3fb" stop-opacity="1"/><stop offset=".55" stop-color="#e4ebf6" stop-opacity=".45"/><stop offset="1" stop-color="#e4ebf6" stop-opacity="0"/></radialGradient>
      <linearGradient id="sd_wash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7263d" stop-opacity="1"/><stop offset=".72" stop-color="#d7263d" stop-opacity=".85"/><stop offset="1" stop-color="#d7263d" stop-opacity="0"/></linearGradient>
    </defs>`;

    // ---- потолок
    g += R(-20, -20, 400, 680, 'url(#sd_ceil)');
    g += Ci(330, 250, 220, 'url(#glowC)', 'opacity=".35"');
    // отсвет окна на потолке (луна + снег снаружи): бледная рама справа
    {
      const q = [[262, 196], [384, 150], [384, 318], [278, 338]];
      const quad = (pts) => `M${pts.map(v => f1(v[0]) + ' ' + f1(v[1])).join(' L')} Z`;
      const lerp2 = (a, b, k) => [mix(a[0], b[0], k), mix(a[1], b[1], k)];
      g += P(quad(q), '#a8ccf5', 'opacity=".04"');
      const inset = (k) => q.map(v => [mix(v[0], 318, k), mix(v[1], 248, k)]);
      g += P(quad(inset(0.14)), '#a8ccf5', 'opacity=".03"');
      // тени переплёта
      const m0 = lerp2(q[0], q[1], 0.5), m1 = lerp2(q[3], q[2], 0.5);
      g += L(m0[0], m0[1], m1[0], m1[1], '#0a1527', 3.5, 'opacity=".5"');
      const h0 = lerp2(q[0], q[3], 0.42), h1 = lerp2(q[1], q[2], 0.42);
      g += L(h0[0], h0[1], h1[0], h1[1], '#0a1527', 3.5, 'opacity=".5"');
    }
    // швы плит (наклон 2°)
    const seam = (y0) => {
      const k = Math.tan(rad(2));
      return L(-20, y0 + 200 * k, 380, y0 - 200 * k, '#101c34', 2.2) + L(-20, y0 + 200 * k + 2.2, 380, y0 - 200 * k + 2.2, '#0e1a30', 1, 'opacity=".7"') +
        L(-20, y0 + 200 * k - 1.6, 380, y0 - 200 * k - 1.6, '#16264a', 0.8, 'opacity=".45"');
    };
    g += seam(118) + seam(292);
    // трещинка и пятно от протечки
    g += P('M262 122 l9 14 l-4 9 l10 13', 'none', 'stroke="#0d182c" stroke-width="1.1"');
    g += P('M44 250 C52 238,78 234,96 241 C112 247,118 262,106 271 C96 279,72 281,56 274 C42 268,38 258,44 250 Z', '#0c172b', 'opacity=".6"');
    g += P('M58 252 C66 246,82 245,92 250 C100 255,98 263,88 266 C76 269,62 266,57 260 Z', '#0b1629', 'opacity=".55"');
    g += P('M96 241 C112 247,118 262,106 271', 'none', 'stroke="#0f1c33" stroke-width="1.2" opacity=".8"');
    // выключенный светильник слева
    g += R(-20, 54, 96, 38, 'rgba(0,0,0,.25)', 'rx="3"');
    g += R(-20, 58, 90, 30, '#121d33', 'rx="3"') + R(-20, 58, 90, 30, 'none', 'stroke="#1b2944" stroke-width="1.2" rx="3"');
    g += R(-16, 66, 80, 6, '#2a3a58', 'rx="3"') + R(-16, 76, 80, 6, '#26354f', 'rx="3"');
    g += L(-14, 67.4, 60, 67.4, '#3b4f73', 0.8, 'opacity=".7"');
    g += R(64, 64, 4, 20, '#0d1628');

    // ---- пыль в лунном свете (фон)
    for (let i = 0; i < 14; i++) {
      const xx = 200 + ((hash(i * 2.3) * 160 + t * (2 + 3 * hash(i))) % 170);
      const yy = 120 + ((hash(i * 5.1) * 230 + t * (1.5 + 2 * hash(i * 7)) + 230) % 230);
      g += Ci(xx, yy, 0.5 + 0.6 * hash(i * 9), `rgba(190,215,255,${f1(0.12 + 0.18 * (0.5 + 0.5 * noise1(t * 0.9 + i)))})`);
    }

    // ---- состояние датчика
    const dust = lin(t, T.shake, T.smoke);
    const afterSmoke = t >= T.smoke;
    const sirenK = eout(lin(t, T.siren, T.siren + 0.3));
    let ledOn, ledCol;
    if (!afterSmoke) {
      const m = ((t - T.t0) % 1.5 + 1.5) % 1.5;
      ledOn = m < 0.12 ? 1 : 0; ledCol = '#3ddc84';
    } else {
      ledOn = 0.55 + 0.45 * (0.5 + 0.5 * Math.cos(2 * Math.PI * 2.5 * (t - T.smoke))); ledCol = C.red;
    }
    const jx = t >= T.siren ? noise1(t * 31 + 2) * 1.0 : 0, jy = t >= T.siren ? noise1(t * 27 + 8) * 1.0 : 0;
    const cx = DX + jx, cy = DY + jy;

    const pul = 0.5 - 0.5 * Math.cos(2 * Math.PI * 1.5 * (t - T.siren));
    if (t >= T.siren) g += Ci(cx, cy, 190, 'url(#sd_red)', `opacity="${f1(sirenK * (0.3 + 0.25 * pul))}"`);
    g += G(detector(cx, cy, { dust, red: afterSmoke, ledOn, ledCol, slotRed: afterSmoke ? 0.4 * ledOn * lin(t, T.smoke, T.smoke + 0.2) : 0 }), `translate(${f1(cx)} ${f1(cy)}) scale(${DS}) translate(${f1(-cx)} ${f1(-cy)})`);
    const lx = cx + LED[0] * DS, ly = cy + LED[1] * DS;
    if (!afterSmoke && ledOn) g += Ci(lx, ly, 8, 'url(#glowC)', 'opacity=".9"') + Ci(lx, ly, 8, '#3ddc84', 'opacity=".18"');
    if (afterSmoke) g += Ci(lx, ly, 14 + 4 * ledOn, 'url(#glowR)', `opacity="${f1(0.6 + 0.4 * ledOn)}"`);

    // ---- дымка вокруг датчика
    const hz = dust * 0.5 * (1 - 0.4 * lin(t, T.siren, T.siren + 1.2));
    if (hz > 0.005) {
      const blow = t > T.siren ? 40 * (t - T.siren) : 0;
      let hh = `<ellipse cx="${f1(180 + blow)}" cy="218" rx="112" ry="70" fill="url(#sd_haze)"/>`;
      for (let i = 0; i < 4; i++) {
        const bx = 180 + blow * (1 + 0.3 * i) + (hash(i * 3.7) - 0.5) * 120 + noise1(t * 0.5 + i * 4) * 10;
        const by = 214 + (hash(i * 5.3) - 0.5) * 60 + noise1(t * 0.4 + i * 7) * 6;
        hh += Ci(bx, by, 34 + 16 * hash(i * 1.9), 'url(#sd_haze)', 'opacity=".6"');
      }
      g += G(hh, '', `opacity="${f1(hz)}"`);
      // взвесь: мелкие пылинки висят в дымке
      for (let i = 0; i < 46; i++) {
        const born = mix(T.shake, T.smoke, hash(i * 3.71));
        const a = lin(t, born, born + 0.4);
        if (a <= 0) continue;
        const ang = hash(i * 1.37) * Math.PI * 2, rr = 22 + 78 * Math.sqrt(hash(i * 8.11));
        const px = 180 + Math.cos(ang) * rr * 1.25 + noise1(t * 0.6 + i * 3.3) * 7 + blow * (0.8 + 0.6 * hash(i * 2.2));
        const py = 214 + Math.sin(ang) * rr * 0.62 + noise1(t * 0.5 + i * 5.7) * 6 - 4 * (t - born) * hash(i * 6.6);
        const al = a * (0.25 + 0.45 * hash(i * 4.9)) * (1 - 0.5 * lin(t, T.siren, T.siren + 1));
        g += Ci(px, py, 0.6 + 0.8 * hash(i * 9.3), `rgba(240,245,252,${f1(al)})`);
      }
    }

    // ---- срабатывание: красное кольцо и писк
    if (afterSmoke) {
      const e = lin(t, T.smoke, T.smoke + 0.5);
      if (e < 1) g += Ci(cx, cy, mix(48 * DS + 2, 130, eout(e)), 'none', `stroke="${C.red}" stroke-width="2" opacity="${f1(0.8 * (1 - e))}"`);
      const bp = t - T.smoke;
      for (const b0 of [0, 0.3]) {
        const a = bp - b0;
        if (a < 0 || a > 0.32) continue;
        const k = eout(lin(a, 0, 0.1)), al = 1 - lin(a, 0.18, 0.32);
        for (let i = 0; i < 3; i++) {
          const ang = rad(LED_A - 30 + i * 30), r0 = 6 + 2 * k, r1 = r0 + 6 * k;
          g += L(lx + Math.cos(ang) * r0, ly + Math.sin(ang) * r0, lx + Math.cos(ang) * r1, ly + Math.sin(ang) * r1, '#ffffff', 1.6, `opacity="${f1(al * 0.95)}" ${CAP}`);
        }
      }
    }

    // ---- рука
    const ps = pose(t, T);
    if (ps.y < 700) g += armSvg(ps, t, T);

    // ---- облачка мела: вылет на верхнем пике каждого взмаха
    const LIFE = 0.6;
    for (let k = 0; k < 40; k++) {
      const tk = T.shake + k * T.period;
      if (tk > T.stop + 0.04) break;
      const age = t - tk;
      if (age < 0 || age > LIFE + 0.25) continue;
      const pk = pose(tk, T);
      // мягкие клубы
      for (let j = 0; j < 5; j++) {
        const e = age / (LIFE + 0.25);
        const [ox, oy] = ragTop(pk, (j / 4 - 0.5) * 64 + (hash(k * 7.1 + j * 2.3) - 0.5) * 14);
        const hj = hash(k * 1.7 + j * 9.3);
        const bx = ox + (hash(k * 3.3 + j * 5.1) - 0.5) * 44 * eout(e) + (j / 4 - 0.5) * 20 * eout(e);
        const by = oy + 4 - 10 * hj - (12 + 30 * hj) * eout(e);
        const br = (8 + 6 * hash(k * 4.4 + j)) + (18 + 10 * hj) * eout(e);
        g += Ci(bx, by, br, 'url(#sd_puff)', `opacity="${f1(0.55 * Math.pow(1 - e, 1.3) * sstep(0, 0.08, e))}"`);
      }
      if (age > LIFE) continue;
      const e = age / LIFE;
      for (let i = 0; i < 30; i++) {
        const h1 = hash(k * 31.7 + i * 3.13), h2 = hash(k * 13.1 + i * 7.77), h3 = hash(k * 5.9 + i * 11.3), h4 = hash(k * 2.7 + i * 1.91), h5 = hash(k * 17.3 + i * 4.4);
        const lx0 = (h1 - 0.5) * 72;
        const [sx, sy] = ragTop(pk, lx0);
        const vx = lx0 * 0.5 + (h3 - 0.5) * 2 * (10 + 26 * h4);
        const vy = -(20 + 40 * h2);
        const e1 = eout(Math.min(1, e / 0.6));
        let px = sx + vx * e1, py = sy + vy * e1;
        let m = 0;
        if (e > 0.6) {
          const qx = sx + vx, qy = sy + vy;
          let best = 1e9, bx = 0, by = 0;
          for (const [ssx, ssy] of SLOTS) { const dd = (qx - cx - ssx * DS) ** 2 + (qy - cy - ssy * DS) ** 2; if (dd < best) { best = dd; bx = cx + ssx * DS; by = cy + ssy * DS; } }
          m = ease((e - 0.6) / 0.4);
          px = mix(qx, bx, m); py = mix(qy, by, m);
        }
        const al = 0.7 * (1 - lin(e, 0.72, 1)) * Math.min(1, e * 12);
        const rr = (0.8 + 1.4 * h5) * (1 - 0.45 * m);
        g += Ci(px, py, rr, `rgba(255,255,255,${f1(al)})`);
      }
    }

    // ---- тревога: плавный красный свет (без вспышек), 1.5 Гц
    if (t >= T.siren) {
      const a = sirenK * (0.10 + 0.12 * pul);
      g += R(-20, -20, 400, FL + 80, 'url(#sd_wash)', `opacity="${f1(a)}"`);
    }

    // ---- зона субтитров
    g += R(-20, FL - 40, 400, 200, 'url(#sd_hush)');
    g += R(-20, FL + 158, 400, 640 - FL, '#03060c');
    return g;
  };
})();

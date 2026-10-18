// сцены ключа b: classroom (Тёма просыпается в тёмном классе), window_phone (метель за окном -> телефон крупно)
// classroom:    p.tWake (абс. время пробуждения), p.clock "19:40"
// window_phone: p.tPhone (абс. время перехода на крупный план телефона)
(() => {
  const rad = a => a * Math.PI / 180;
  const sinD = a => Math.sin(rad(a)), cosD = a => Math.cos(rad(a));
  const backOut = (x, c = 1.4) => { const c3 = c + 1; return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const rnd = (x1, y1, x2, y2, col, w, extra = '') => L(x1, y1, x2, y2, col, w, `stroke-linecap="round" ${extra}`);
  const rot = (a, x, y) => `rotate(${f1(a)} ${f1(x)} ${f1(y)})`;
  const MONT = (w = 700) => `font-family="Mont" font-weight="${w}"`;

  const DEFS = `<defs>
    <linearGradient id="bGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d447c"/><stop offset="1" stop-color="#0b1d3c"/></linearGradient>
    <linearGradient id="bLock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#23579a"/><stop offset=".5" stop-color="#14305f"/><stop offset="1" stop-color="#08142c"/></linearGradient>
    <linearGradient id="bMaskG" gradientUnits="userSpaceOnUse" x1="0" y1="344" x2="0" y2="384"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
    <mask id="bPhoneMask"><rect x="-20" y="-20" width="400" height="680" fill="url(#bMaskG)"/></mask>
  </defs>`;

  // ---------------------------------------------------------------- общее: метель
  // косые полосы снега внутри прямоугольника (с клипом). vx — скорость ветра влево, vy — вниз
  function blizzard(x0, y0, w, h, t, o = {}) {
    const { n = 70, seed = 3, vx = 210, vy = 70, a = 1, len = 1, wmul = 1 } = o;
    const cl = `bwc${seed}`;
    const W = w + 140, H = h + 100;
    let s = '';
    for (let i = 0; i < n; i++) {
      const k = hash(i * 1.7 + seed), kk = hash(i * 4.3 + seed * 2), k3 = hash(i * 9.1 + seed * 3);
      const sp = 0.6 + k3 * 0.9;
      const dx = -vx * sp, dy = vy * sp;
      const px = ((((k * W + dx * t) % W) + W) % W) - 70 + x0;
      const py = ((((kk * H + dy * t) % H) + H) % H) - 50 + y0;
      const nn = Math.hypot(dx, dy), l0 = (12 + kk * 30) * len * sp;
      s += rnd(px, py, px - dx / nn * l0, py - dy / nn * l0, `rgba(226,236,250,${f1(a * (0.25 + 0.6 * k3))})`, (0.7 + k * 1.2) * wmul);
    }
    return `<clipPath id="${cl}"><rect x="${x0}" y="${y0}" width="${w}" height="${h}"/></clipPath>` + G(s, '', `clip-path="url(#${cl})"`);
  }

  // ================================================================ CLASSROOM
  const HIPS = [46, 154, 262, 370];       // x таза каждого ряда (Тёма на 262), все смотрят влево, на доску
  const loc = (hx, inner) => G(inner, `translate(${hx} ${GROUND}) scale(-1 1)`);
  const chairSvg = col => R(-16, -34, 34, 4, col, 'rx="1.5"') + R(-18.5, -74, 3.6, 42, col, 'rx="1.6"') + R(-12.5, -30, 2.6, 30, col) + R(12.5, -30, 2.6, 30, col) + R(-17, -52, 3, 2, col);
  const deskSvg = (leg, top, hi) => R(26, -58, 3, 58, leg) + R(78, -58, 3, 58, leg) + R(30, -32, 48, 2.6, leg) + R(22, -62, 62, 4.6, top, 'rx="1"') + R(22, -62, 62, 1, hi, 'opacity=".75"');

  function clockSvg(cx, cy, r, t, hh, mm) {
    let g = Ci(cx, cy, r * 2.6, 'url(#glowC)', 'opacity=".22"');
    g += Ci(cx, cy, r + 3, '#2a3b5c') + Ci(cx, cy, r, '#b3bdcc');
    for (let i = 0; i < 12; i++) {
      const a = i * 30, big = i % 3 === 0;
      g += rnd(cx + (r * (big ? .72 : .82)) * sinD(a), cy - (r * (big ? .72 : .82)) * cosD(a), cx + r * .92 * sinD(a), cy - r * .92 * cosD(a), '#2b3447', big ? 1.6 : .9);
    }
    const ah = ((hh % 12) + mm / 60) * 30, am = mm * 6;
    const sec = Math.floor(t) + eout(clamp((t % 1) * 7));
    const as = sec * 6;
    g += rnd(cx, cy, cx + r * .5 * sinD(ah), cy - r * .5 * cosD(ah), '#161c28', 2.3);
    g += rnd(cx, cy, cx + r * .8 * sinD(am), cy - r * .8 * cosD(am), '#161c28', 1.6);
    g += rnd(cx - r * .16 * sinD(as), cy + r * .16 * cosD(as), cx + r * .86 * sinD(as), cy - r * .86 * cosD(as), '#c8283c', .8);
    g += Ci(cx, cy, 1.7, '#c8283c');
    return g;
  }

  function classWindow(x, y, w, h, t) {
    const fr = '#2c3e60';
    let g = R(x - 5, y - 5, w + 10, h + 10, fr) + R(x, y, w, h, 'url(#bGlass)');
    g += R(x, y, w, h, `rgba(190,215,250,${f1(.05 + .03 * noise1(t * 1.3))})`);
    g += snow(x, y, w, h, t, 34, 5, 34, .9);
    g += P(`M${x} ${y + h} v-7 q8 -8 18 -4 t20 -2 t22 -5 t22 2 t20 -4 t20 3 V${y + h} Z`, '#dbe6f5', 'opacity=".7"');
    g += P(`M${x + 8} ${y} L${x + 44} ${y} L${x + 14} ${y + h * .55} L${x} ${y + h * .55} L${x} ${y + 30} Z`, 'rgba(255,255,255,.04)');
    g += L(x + w / 2, y, x + w / 2, y + h, fr, 4) + L(x, y + h * .36, x + w, y + h * .36, fr, 4);
    g += R(x - 10, y + h + 5, w + 20, 6, '#33466a') + L(x - 10, y + h + 5, x + w + 10, y + h + 5, '#587099', 1);
    return g;
  }

  function boardSvg() {
    let g = R(11, 172, 132, 96, '#22324f') + R(15, 176, 124, 82, '#081f2c');
    const ch = 'stroke="#9fb0c8" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"';
    g += `<path d="M24 193 q5 -6 10 0 t10 0 t10 0 t10 0 t10 0" ${ch} opacity=".55"/>`;
    g += `<path d="M24 208 q5 -6 10 0 t10 0 t10 0 t10 0" ${ch} opacity=".45"/>`;
    g += `<path d="M24 223 h30 M24 232 h22" ${ch} opacity=".4"/>`;
    g += `<path d="M96 246 h30 L96 218 Z" ${ch} opacity=".5"/>`;
    g += `<path d="M96 241 h5 v5" ${ch} opacity=".4"/>`;
    g += R(11, 267, 132, 4, '#34476b') + R(30, 264.5, 9, 3, '#cfd8e6', 'opacity=".8" rx="1"');
    return g;
  }

  // Тёма в профиле (смотрит вправо в локальных координатах, переворот делает loc()). s: 0 — спит на руках, 1 — выпрямился
  function tyoma(s, t, o) {
    const { look = 0, tw = 0 } = o;
    const jit = s > .6 ? (1 - lin(t, tw + .3, tw + 1.1)) * noise1(t * 16) * 1.4 : 0;
    const th = mix(50, 3, s) + (1 - s) * Math.sin(t * 2.0) * 0.9 + jit;
    const Sx = 42 * sinD(th), Sy = -40 - 42 * cosD(th);
    const hxL = Sx + mix(18, 1, s), hyL = Sy + mix(-14, -14, s);
    const hr = mix(64, 0, s) - look * 22 + (1 - s) * Math.sin(t * 2.0) * 1.2;
    const awake = s > .35;
    const startle = awake ? 1 - lin(t, tw + .05, tw + .7) : 0;

    // ноги
    let low = rnd(3, -38, 31, -38, '#141c30', 8) + rnd(31, -38, 33, -8, '#141c30', 7) + R(30, -7, 13, 7, '#0a0e16', 'rx="2.5"');
    low += rnd(0, -38, 28, -38, '#222e4a', 8.4) + rnd(28, -38, 30, -8, '#222e4a', 7.4) + R(27, -7, 14, 7, '#121823', 'rx="2.5"') + rnd(0, -41.6, 28, -41.6, '#3a4d74', 1, 'opacity=".7"');
    // туловище
    const torso = G(R(-10.5, -82, 21, 44, '#2a3856', 'rx="5"') + R(1, -82, 9.5, 44, C.suit2, 'rx="4" opacity=".5"') + R(-10.5, -80, 2.2, 38, '#4a608c', 'rx="1.1" opacity=".75"') + R(-2, -83.6, 7, 2.6, '#e8ecf2', 'rx="1"'), rot(th, 0, -40)) +
      rnd(Sx, Sy, hxL, hyL, C.skin2, 6.2);
    // руки
    const aN = mix(88, 40, s), f = mix(0.14, 1, ease(lin(s, 0, .85)));
    const arm = (da, col, dx, dy, hand) => {
      const a = aN + da, sx = Sx + dx, sy = Sy + dy;
      const ex = sx + 21 * sinD(a), ey = sy + 21 * cosD(a), fx = ex + 22 * f, fy = ey;
      return rnd(sx, sy, ex, ey, col, 7) + rnd(ex, ey, fx, fy, col, 7) +
        (hand && f > .5 ? Ci(fx + 2, fy, 3.7, C.skin, `opacity="${f1(lin(f, .5, .85))}"`) : '');
    };
    const ex0 = Sx + 21 * sinD(aN), ey0 = Sy + 21 * cosD(aN);
    let arms = arm(7, '#18203a', -2, 1.5, false);
    if (s < .45) arms += Ci(ex0 + 3.2, ey0 - 4.6, 4.3, '#18203a', `opacity="${f1(1 - lin(s, 0, .45))}"`);
    arms += arm(0, C.suit, 0, 0, true);
    // голова
    const eye = awake
      ? (startle > 0 ? Ci(5.2, -.5, 2.1, '#e8ecf2') + Ci(5.7, -.5, 1.2, '#14161c') : Ci(5.2, -.5, 1, '#1a1a1a'))
      : rnd(3.2, -.2, 7, .4, '#1a1a1a', 1.1);
    const head = G(Ci(0, 0, 8.6, C.skin) + P('M-8.8 -1 C-9 -11,7 -13,8.8 -3 L8.8 -1 C6 -6,-3 -7,-8.8 3 Z', C.hair) + R(-9.4, -2, 3, 5, C.skin2, 'rx="1.5"') + eye,
      `translate(${f1(hxL)} ${f1(hyL)}) rotate(${f1(hr)}) scale(1.12)`);
    return { low, torso, arms, head, headLocal: [hxL, hyL] };
  }

  SCENES.classroom = function (u, p, d, t) {
    const tW = p.tWake ?? 21.05;
    const [hh, mm] = String(p.clock || '19:40').split(':').map(Number);
    const raw = lin(t, tW, tW + 0.3);
    const s = t < tW ? 0 : clamp(backOut(raw, 1.25), 0, 1.07);
    const tS = tW + 1.5;                       // динамик начинает перекличку
    const kS = lin(t, tS, tS + .25);
    const look = lin(t, tW + 1.0, tW + 1.6);
    const SPX = 77, SPY = 148;
    let g = DEFS;
    // стена, потолок, цоколь
    g += R(0, 0, 360, GROUND, '#0c1628');
    g += R(0, 0, 360, 38, '#08101f') + L(0, 38, 360, 38, '#17243c', 2);
    for (const lx of [92, 268]) g += R(lx - 30, 38, 60, 5, '#16233a') + R(lx - 26, 43, 52, 3, '#0e1a2e');
    g += R(0, 296, 360, GROUND - 296, '#09121f') + L(0, 296, 360, 296, '#1b2a45', 2);
    // холодный свет окна
    g += Ci(256, 222, 200, 'url(#glowC)', `opacity="${f1(.3 + .05 * noise1(t * 1.7))}"`);
    // доска и динамик над ней
    g += boardSvg();
    g += R(SPX - 1.5, 120, 3, 12, '#2a3448');
    if (kS > 0) g += Ci(SPX, SPY, 78, 'url(#glowC)', `opacity="${f1(kS * (.35 + .22 * Math.sin(t * 7.5)))}"`);
    g += speakerBox(SPX, SPY, 1.2, .9);
    g += Ci(SPX + 11, SPY + 10, 1.6, kS > 0 ? `rgba(255,70,70,${f1(.55 + .45 * Math.sin(t * 9))})` : '#3a1a22');
    if (kS > 0) {
      g += rings(SPX, SPY + 2, t, { n: 3, r0: 8, r1: 66, col: '#d7e6ff', a: .85 * kS, speed: 1.0, w: 1.6 });
      // широкие слабые круги: голос заполняет класс
      g += `<clipPath id="bRoomClip"><rect x="0" y="40" width="360" height="${GROUND - 40}"/></clipPath>` +
        G(rings(SPX, SPY + 2, t, { n: 3, r0: 70, r1: 290, col: '#9fc4f5', a: .3 * kS, speed: .55, w: 1.3 }), '', 'clip-path="url(#bRoomClip)"');
    }
    // часы
    g += clockSvg(166, 198, 18, t, hh, mm);
    // окно
    g += classWindow(196, 150, 120, 142, t);
    // ряды парт (далёкие темнее)
    HIPS.forEach((hx, i) => {
      const me = i === 2, op = me ? 1 : [.62, .78, 1, .85][i];
      const col = me ? '#1f2d49' : '#1a263f', top = me ? '#26385c' : '#223250';
      g += G(loc(hx, chairSvg(col)), '', `opacity="${op}"`);
      if (!me) g += G(loc(hx, deskSvg('#131c30', top, '#4a6089')), '', `opacity="${op}"`);
    });
    // рюкзак на спинке стула
    g += loc(262, R(-42, -74, 24, 38, '#2b3d62', 'rx="6"') + R(-39, -52, 17, 14, '#22324f', 'rx="3"') + R(-42, -66, 24, 2, '#8fa3c4', 'opacity=".45"') + L(-30, -52, -30, -38, '#10192b', 1));
    // Тёма
    const ty = tyoma(s, t, { look, tw: tW });
    g += loc(262, ty.low + ty.torso);
    g += loc(262, deskSvg('#131c30', '#26385c', '#4a6089'));
    g += loc(262, R(70, -65.5, 15, 3.5, '#9fb0c8', 'opacity=".55" rx="1"') + rnd(66, -67, 74, -64.5, '#d4a24a', 1.6));
    g += loc(262, ty.arms + ty.head);
    // волнение: звёздочки пробуждения
    const hw = [262 - ty.headLocal[0], GROUND + ty.headLocal[1]];
    const sb = 1 - lin(t, tW + .05, tW + .45);
    if (t >= tW && sb > 0) for (let i = 0; i < 4; i++) {
      const a = rad(-125 + i * 24), r0 = 17, r1 = 17 + 9 * eout(lin(t, tW, tW + .25));
      g += rnd(hw[0] + r0 * Math.cos(a), hw[1] + r0 * Math.sin(a), hw[0] + r1 * Math.cos(a), hw[1] + r1 * Math.sin(a), '#f3f6fb', 1.6, `opacity="${f1(sb)}"`);
    }
    // «z-z-z» над спящим
    const za = 1 - lin(t, tW - .02, tW + .12);
    if (za > 0) for (let i = 0; i < 3; i++) {
      const ph = ((t * .42 + i / 3) % 1);
      g += T_('z', hw[0] + 4 + ph * 16 + 3 * Math.sin(ph * 8), hw[1] - 18 - ph * 46, 7 + ph * 8, '#a9bde0', Math.sin(ph * Math.PI) * .85 * za);
    }
    // пол (в зоне субтитров всё тёмное)
    g += R(0, GROUND, 360, 640 - GROUND, '#070d1a') + L(0, GROUND, 360, GROUND, '#2a3b5c', 2);
    for (let i = 0; i < 5; i++) g += L(0, GROUND + 18 + i * i * 9, 360, GROUND + 18 + i * i * 9, '#0b1424', 1);
    g += R(0, 0, 360, 640, `rgba(2,6,14,${f1(.16 - .06 * raw)})`);
    return g;
  };
  function T_(txt, x, y, size, col, op) { return T(x, y, txt, f1(size), col, `${MONT(800)} opacity="${f1(op)}"`); }

  // ================================================================ WINDOW_PHONE
  const WX = 118, WS = 1.85;                  // Тёма у окна: x ног и масштаб
  const WSH = [WX + 13.5 * WS, GROUND - 77 * WS];   // правое плечо (на холсте)
  // рука с телефоном (абс. координаты холста) в момент t
  function handPos(t, tP) {
    const dt = t - tP;
    const lift = kf([[-3.2, 0], [-1.7, .3], [-1.0, 1], [1, 1]], dt);
    const wig = lin(dt, -1.05, -.85) * (1 - lin(dt, -.3, -.1));
    return {
      x: WSH[0] + 40 + lift * 5 + Math.sin(dt * 15) * 4 * wig,
      y: WSH[1] + 30 - lift * 50 + Math.cos(dt * 11) * 5 * wig,
      ang: -8 - lift * 22 + Math.sin(dt * 13) * 12 * wig,
    };
  }
  function ik(sx, sy, hx, hy, l1, l2, dir = 1) {
    let dx = hx - sx, dy = hy - sy, dist = Math.hypot(dx, dy);
    const mx = l1 + l2 - .01;
    if (dist > mx) { dx *= mx / dist; dy *= mx / dist; dist = mx; }
    const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    return [sx + dx / dist * a - dy / dist * hh * dir, sy + dy / dist * a + dx / dist * hh * dir, sx + dx, sy + dy];
  }

  // вид «Тёма у окна»
  function stormView(t, tP) {
    const gust = .5 + .5 * noise1(t * .8 + 4);
    const GX = 30, GY = 120, GW = 300, GH = 192;     // стекло
    let g = R(0, 0, 360, GROUND, '#0a1325') + R(0, 0, 360, 110, '#08101f');
    g += speakerBox(318, 58, .85, .6);
    g += Ci(180, 220, 270, 'url(#glowC)', `opacity="${f1(.2 + .12 * gust)}"`);
    // окно: от ветра чуть дребезжит
    const sh = .5 + gust * .8;
    const jx = noise1(t * 21) * .35 * sh, jy = noise1(t * 17 + 9) * .3 * sh;
    let w = R(22, GY - 8, 316, GH + 16, '#27395a') + R(GX, GY, GW, GH, 'url(#bGlass)');
    w += R(GX, GY, GW, GH, `rgba(205,225,250,${f1(.14 + .14 * gust)})`);
    w += Ci(300, 160, 70, 'url(#glowW)', 'opacity=".22"');         // фонарь за метелью
    // широкие порывы
    let bands = '';
    for (let i = 0; i < 6; i++) {
      const x = 400 - ((t * (120 + i * 30) + i * 97) % 540), y = GY + 10 + i * 32;
      bands += G(R(-210, -10, 420, 20, `rgba(225,238,255,${f1((.06 + .08 * gust) * (.6 + .4 * hash(i)))})`, 'rx="10"'), `translate(${f1(x)} ${y}) rotate(-17)`);
    }
    w += `<clipPath id="bwb"><rect x="${GX}" y="${GY}" width="${GW}" height="${GH}"/></clipPath>` + G(bands, '', 'clip-path="url(#bwb)"');
    w += blizzard(GX, GY, GW, GH, t, { n: 90, seed: 3, vx: 200, vy: 62, a: .6, len: .9 });
    w += blizzard(GX, GY, GW, GH, t, { n: 52, seed: 11, vx: 340, vy: 105, a: .95, len: 1.5, wmul: 1.5 });
    w += snow(GX, GY, GW, GH, t, 46, 8, -150, .85);
    w += P(`M${GX} ${GY + GH} v-9 q14 -10 30 -5 t32 -3 t34 -6 t34 2 t36 -5 t34 4 t36 -4 t34 3 V${GY + GH} Z`, '#dfe8f6', 'opacity=".78"');
    // рама и переплёты
    const fr = '#27395a';
    w += R(177, GY, 6, GH, fr) + R(GX, GY + 54, GW, 6, fr);
    w += R(GX, GY, GW, 3, 'rgba(0,0,0,.35)');
    g += G(w, `translate(${f1(jx)} ${f1(jy)})`);
    // подоконник, радиатор
    g += R(12, 318, 336, 8, '#2f4166') + L(12, 318, 348, 318, '#587099', 1.2);
    g += R(0, 326, 360, GROUND - 326, '#09111f');
    g += G(radiator(206, 336, 98, 30), '', 'opacity=".38"');
    // Тёма со спины
    const X = WX, sc = WS, Y = GROUND, br = Math.sin(t * 1.7) * .6;
    let b = R(-10, -48, 9, 48, '#1c2740', 'rx="3.5"') + R(1, -48, 9, 48, '#1c2740', 'rx="3.5"');
    b += R(-11, -5, 11, 5, C.shoe, 'rx="2.5"') + R(0, -5, 11, 5, C.shoe, 'rx="2.5"');
    b += rnd(-14.5, -77, -17.5, -52, '#1f2a45', 6.6) + Ci(-17.8, -47.5, 3.8, C.skin);
    b += R(-13.5, -84 + br, 27, 42, '#2a3856', 'rx="6"') + L(0, -81, 0, -44, C.suit2, 1.3, 'opacity=".75"') + R(-13.5, -50, 27, 8, C.suit2, 'rx="4" opacity=".5"');
    b += R(-13.5, -82 + br, 2.4, 36, '#4a608c', 'rx="1.2" opacity=".7"');
    b += R(-3.6, -90, 7.2, 9, C.skin2, 'rx="2"') + Ci(-9.1, -95 + br * .5, 2.1, C.skin2) + Ci(9.1, -95 + br * .5, 2.1, C.skin2);
    b += Ci(0, -97 + br * .5, 9.4, C.hair) + R(-8.2, -97 + br * .5, 16.4, 9.4, C.hair, 'rx="4.5"');
    g += G(b, `translate(${X} ${Y}) scale(${sc})`);
    // правая рука с телефоном
    const hp = handPos(t, tP);
    const [Sx, Sy] = WSH;
    const [ex, ey, hx, hy] = ik(Sx, Sy, hp.x, hp.y, 35, 34, 1);
    const pw = .6 + .1 * noise1(t * 6);
    g += Ci(hx, hy - 5, 86, 'url(#glowC)', `opacity="${f1(.5 + pw * .45)}"`);
    g += rnd(Sx, Sy, ex, ey, '#2f3e60', 6.6 * sc * .85) + rnd(ex, ey, hx, hy, '#2f3e60', 6.2 * sc * .85);
    g += rnd(Sx, Sy, ex, ey, '#4a608c', 1.4, 'opacity=".6"');
    g += Ci(hx, hy, 5.4, C.skin);
    g += G(R(-7, -14, 14, 28, '#0e1118', 'rx="3.4"') + R(-5.6, -12.6, 11.2, 25.2, 'url(#screen)', 'rx="2.4"') + R(-4, -8.5, 8, 2, 'rgba(60,90,140,.6)') + R(-4, -4.4, 8, 2, 'rgba(60,90,140,.4)'),
      `translate(${f1(hx)} ${f1(hy - 5)}) rotate(${f1(hp.ang)})`);
    // пол
    g += R(0, GROUND, 360, 640 - GROUND, '#070d1a') + L(0, GROUND, 360, GROUND, '#2a3b5c', 2);
    for (let i = 0; i < 5; i++) g += L(0, GROUND + 18 + i * i * 9, 360, GROUND + 18 + i * i * 9, '#0b1424', 1);
    return g;
  }

  // экран блокировки крупно
  let tTy = 27.73;   // время слова «Ты» — задаётся из p.tTy в window_phone
  function lockScreen(cx, cy, w, t, tP) {
    const h = w * 2.05, x0 = cx - w / 2, y0 = cy - h / 2, r = w * .15;
    const sx = x0 + 4, sw = w - 8;
    let g = '';
    g += R(x0 - 1.6, y0 - 1.6, w + 3.2, h + 3.2, '#2c3446', `rx="${r + 1.6}"`);
    g += R(x0, y0, w, h, '#0a0d14', `rx="${r}"`);
    g += R(x0 - 3.2, y0 + 62, 2.4, 18, '#2c3446', 'rx="1"') + R(x0 - 3.2, y0 + 88, 2.4, 18, '#2c3446', 'rx="1"') + R(x0 + w + .8, y0 + 76, 2.4, 30, '#2c3446', 'rx="1"');
    g += R(sx, y0 + 4, sw, h - 8, 'url(#bLock)', `rx="${r - 3.5}"`);
    g += snow(sx, y0 + 4, sw, 150, t, 16, 5, 7, .3);
    // статус-бар: перечёркнутая сеть, «Нет сети», батарея
    const sy = y0 + 18, bx = sx + 9;
    const flick = (t % 1.9) < .22 ? .55 : .16;
    for (let i = 0; i < 4; i++) g += R(bx + i * 3.4, sy - 3 - i * 2.1, 2.3, 3 + i * 2.1, '#fff', `opacity="${f1(i === 0 ? flick + .12 : .2)}" rx=".6"`);
    g += rnd(bx - 1.6, sy + .6, bx + 13.4, sy - 10.6, '#ff4a4a', 1.5);
    g += T(bx + 17, sy, 'Нет сети', 6.6, '#fff', `${MONT(700)}`);
    g += R(sx + sw - 25, sy - 6.5, 15, 7.4, 'none', 'stroke="#fff" stroke-width=".9" opacity=".8" rx="2"') + R(sx + sw - 23.6, sy - 5.1, 5.5, 4.6, '#fff', 'opacity=".85" rx="1"') + R(sx + sw - 9.5, sy - 4, 1.5, 2.6, '#fff', 'opacity=".7" rx=".6"');
    g += R(cx - 11, y0 + 8, 22, 6.4, '#05070b', 'rx="3.2"');
    // замок, дата, время
    g += R(cx - 4.6, y0 + 49, 9.2, 7.4, '#fff', 'rx="1.6" opacity=".9"') + P(`M${cx - 3} ${y0 + 49} v-2.8 a3 3 0 0 1 6 0 v2.8`, 'none', 'stroke="#fff" stroke-width="1.3" opacity=".9"');
    g += T(cx, y0 + 74, 'Четверг', 9.6, 'rgba(255,255,255,.9)', `text-anchor="middle" ${MONT(600)}`);
    g += T(cx, y0 + 113, '19:41', 43, '#fff', `text-anchor="middle" ${MONT(700)} letter-spacing="-1"`);
    // уведомление «Мама»
    const dt = t - tP;
    const kIn = eout(lin(dt, .35, .7));
    const kb = lin(t, tTy, tTy + 0.37);
    const buzz = t >= tTy ? 1 - kb : 0;
    const pop = 1 + .055 * buzz * Math.sin(kb * 14 + 1.57);
    const cy0 = y0 + 142 + (1 - kIn) * 16, ch = 64, cw = sw - 12, cx0 = sx + 6;
    let c = R(cx0, cy0, cw, ch, 'rgba(244,247,252,.97)', 'rx="10"');
    c += R(cx0 + 8, cy0 + 8, 15, 15, '#2fbf62', 'rx="4"') + Ci(cx0 + 15.5, cy0 + 15, 4.6, '#fff') + P(`M${cx0 + 12} ${cy0 + 18} l-1.6 3.2 l4 -1.4 z`, '#fff');
    c += T(cx0 + 29, cy0 + 19.5, 'Мама', 9.6, '#10151f', MONT(800));
    c += T(cx0 + cw - 9, cy0 + 19, '18:52', 6.8, '#6b7385', `text-anchor="end" ${MONT(600)}`);
    c += T(cx0 + 10, cy0 + 47, 'Ты где?', 14.5, '#10151f', MONT(800));
    const dx = cx0 + cw - 15, dy = cy0 + 41;
    const pr = (t * .9) % 1;
    c += Ci(dx, dy, 3 + pr * 8, 'none', `stroke="#2d7bff" stroke-width="1.2" opacity="${f1(.7 * (1 - pr))}"`) + Ci(dx, dy, 4.3, '#2d7bff');
    if (buzz > 0) c += R(cx0 - 5 * (1 - buzz), cy0 - 5 * (1 - buzz), cw + 10 * (1 - buzz), ch + 10 * (1 - buzz), 'none', `stroke="#8bb8ff" stroke-width="1.6" rx="12" opacity="${f1(buzz)}"`);
    g += G(c, `translate(${f1(cx)} ${f1(cy0 + ch / 2)}) scale(${f1(pop)}) translate(${-f1(cx)} ${-f1(cy0 + ch / 2)})`, `opacity="${f1(kIn)}"`);
    return g;
  }

  SCENES.window_phone = function (u, p, d, t) {
    const tP = p.tPhone ?? 25.87;
    tTy = p.tTy ?? 27.73;
    const kL = lin(t, tP - .08, tP + .27);        // переход ~0.35 c
    const e = eout(kL);
    const PCX = 180, PCY = 270, PW = 152, PK = 1.1;   // крупный план: телефон чуть увеличен
    const a0 = handPos(tP - .08, tP);
    let g = DEFS;
    g += R(-20, -20, 400, 680, '#050c1a');
    if (kL > 0) {
      // фон крупного плана: расфокусированная метель и холодное свечение
      g += Ci(PCX, PCY, 250, 'url(#glowC)', `opacity="${f1(.3 + .05 * noise1(t * 3))}"`);
      g += blizzard(0, 0, 360, 380, t, { n: 38, seed: 21, vx: 230, vy: 75, a: .22, len: 1.1, wmul: 1.3 });
    }
    if (kL < 1) {
      const Z = mix(1, 2.8, ease(kL));
      g += G(stormView(t, tP), `translate(${f1(a0.x)} ${f1(a0.y)}) scale(${f1(Z)}) translate(${-f1(a0.x)} ${-f1(a0.y)})`, `opacity="${f1(1 - lin(kL, .08, .5))}"`);
    }
    if (kL > 0) {
      const sc = mix(.11, 1, e), cx = mix(a0.x, PCX, e), cy = mix(a0.y, PCY, e);
      const sway = noise1(t * .8 + 2) * .7 * lin(kL, .8, 1);
      const bloom = Math.sin(kL * Math.PI);
      const y0 = PCY - PW * 2.05 / 2;
      const ph = G(lockScreen(PCX, PCY, PW, t, tP), `translate(${PCX} ${f1(y0)}) scale(${PK}) translate(${-PCX} ${f1(-y0)})`);
      const tr = `translate(${f1(cx)} ${f1(cy + noise1(t * .9) * 1.1 * lin(kL, .8, 1))}) rotate(${f1(sway)}) scale(${f1(sc)}) translate(${-PCX} ${-PCY})`;
      g += G(G(ph, tr), '', `mask="url(#bPhoneMask)" opacity="${f1(lin(kL, 0, .3))}"`);
      if (bloom > 0) g += Ci(cx, cy, 120 * sc + 40, 'url(#glowC)', `opacity="${f1(bloom * .8)}"`);
    }
    return g;
  };
})();

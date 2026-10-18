// сцены ключа f: room214_dark (тёмный кабинет, Тёма под окном), handle (ручка двери изнутри, крупно)
(() => {
  const CAP = 'stroke-linecap="round"';
  const rad = d => d * Math.PI / 180;
  const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };

  // ================= room214_dark =================

  // Тёма: сидит на полу, колени к груди, рука зажимает рот. x,y — точка пола под ним; face -1 = смотрит влево (на дверь)
  function temaHiding(x, y, h, face, jx, jy, rim = 0) {
    const s = h / 100;
    const hx = 2, hy = -58;
    let g = '';
    // дальняя рука (обнимает колени)
    g += L(-1, -43, 21, -33, C.suit2, 6, CAP) + Ci(24, -34, 3.3, C.skin2);
    // ноги: дальняя темнее
    g += L(-1, -12, 22, -37, '#0f1522', 8, CAP) + L(22, -37, 29, -4, '#0f1522', 7, CAP) + R(24, -7, 13, 7, '#070a10', 'rx="3"');
    g += L(1, -12, 25, -38, C.pants, 8.4, CAP) + L(25, -38, 32, -4.5, C.pants, 7.4, CAP) + R(27, -7.5, 13, 7.5, '#0d121c', 'rx="3"');
    // торс
    g += R(-10, -46, 20, 38, C.suit, 'rx="5"') + R(1, -46, 9, 38, C.suit2, 'rx="4" opacity=".55"');
    g += P('M-3.5 -46 L3.5 -46 L0 -37 Z', '#c9cfd9');
    // голова чуть вперёд
    let head = Ci(hx, hy, 8.6, C.skin);
    head += G(P(`M-8.8 ${hy - 1} C-9 ${hy - 11},7 ${hy - 13},8.8 ${hy - 3} L8.8 ${hy - 1} C6 ${hy - 6},-3 ${hy - 7},-8.8 ${hy + 3} Z`, C.hair), `translate(${hx},0)`);
    head += R(hx - 9.4, hy - 2, 3, 5, C.skin2, 'rx="1.5"');
    // широко раскрытый глаз
    head += Ci(hx + 4.8, hy - 1.6, 2.1, '#e9edf3') + Ci(hx + 5.6, hy - 1.5, 1.15, '#12151c');
    head += L(hx + 2.4, hy - 5.2, hx + 7.4, hy - 6.4, C.hair, 1, CAP);
    head += P(`M${hx - 8.6} ${hy - 1.2} A8.8 8.8 0 0 1 ${hx - 2.2} ${hy - 8.6}`, 'none', `stroke="#a9cbf5" stroke-width="1.2" opacity=".6" ${CAP}`);
    g += G(head, 'rotate(6 0 -46)');
    // рука у рта: плечо -> локоть -> ладонь
    g += L(1, -44, 15, -35, C.suit, 6.6, CAP) + Ci(15, -35, 3.2, C.suit);
    g += L(15, -35, 9.4, -50.6, C.suit, 6, CAP);
    g += L(12.6, -37, 7.4, -50.4, '#7fa6d8', 0.9, `opacity=".35" ${CAP}`);
    g += R(4.4, -57, 9.6, 9.4, '#c58f6b', 'rx="4.2"') + L(6.6, -56.4, 6.6, -50.4, '#8a5f45', 0.7) + L(8.8, -56.8, 8.8, -49.6, '#8a5f45', 0.7) + L(11, -56.4, 11, -50.2, '#8a5f45', 0.7) + R(2.9, -55, 3.2, 4.6, '#c58f6b', 'rx="1.6"');
    // холодный контровой свет со стороны окна (спина)
    g += L(-10, -44, -10, -12, '#9ec2f0', 1.1, `opacity="${f1(0.42 + 0.5 * rim)}" ${CAP}`);
    g += L(3, -40.6, 22, -46.4, '#9ec2f0', 0.9, `opacity=".18" ${CAP}`);
    return G(g, `translate(${f1(x + jx)},${f1(y + jy)}) scale(${f1(s * face)},${f1(s)})`);
  }

  // облачко пара: рождается в age=0, живёт life секунд
  function puff(ox, oy, age, life, dirx, seed, k = 1) {
    if (age < 0 || age > life) return '';
    const e = age / life;
    let g = '';
    for (let i = 0; i < 5; i++) {
      const hh = hash(seed * 7.3 + i * 3.1), h2 = hash(seed * 3.7 + i * 5.9);
      const px = ox + dirx * (8 + 22 * hh) * eout(e) + (h2 - 0.5) * 5 * e;
      const py = oy - (4 + 14 * h2) * eout(e) - 4 * e * e + (hh - 0.5) * 3;
      const r = (3 + 11 * eout(e)) * (0.65 + 0.55 * hash(seed + i * 1.7));
      const a = 0.5 * k * Math.pow(1 - e, 1.4) * sstep(0, 0.1, e);
      g += Ci(px, py, r, `rgba(228,238,252,${f1(a)})`);
    }
    return g;
  }

  function wallClock(cx, cy, r, secDeg, minDeg, hourDeg, flash) {
    let g = Ci(cx, cy, r + 3.2, '#222d47') + Ci(cx, cy, r, '#8693a8') + Ci(cx, cy, r - 1.6, '#9ba7ba');
    for (let i = 0; i < 12; i++) {
      const a = rad(i * 30), big = i % 3 === 0;
      g += L(cx + Math.sin(a) * (r - 2), cy - Math.cos(a) * (r - 2), cx + Math.sin(a) * (r - (big ? 5.6 : 4)), cy - Math.cos(a) * (r - (big ? 5.6 : 4)), '#1c2538', big ? 1.4 : 0.8);
    }
    const hand = (deg, len, w, col, tail = 0) => {
      const a = rad(deg);
      return L(cx - Math.sin(a) * tail, cy + Math.cos(a) * tail, cx + Math.sin(a) * len, cy - Math.cos(a) * len, col, w, CAP);
    };
    g += hand(hourDeg, r * 0.5, 1.9, '#0f1626') + hand(minDeg, r * 0.78, 1.4, '#0f1626');
    g += hand(secDeg, r * 0.86, 0.8, C.red, 4) + Ci(cx, cy, 1.5, C.red);
    if (flash > 0) g += Ci(cx, cy, r + 3.2 + (1 - flash) * 9, 'none', `stroke="#cfe4ff" stroke-width="1.1" opacity="${f1(flash * 0.8)}"`) + Ci(cx, cy, r + 3.2, 'none', `stroke="#cfe4ff" stroke-width="1.2" opacity="${f1(flash)}"`);
    return g;
  }

  // минимальный стульчик у двери, спинкой подпирает ручку
  function chairSmall(handleX, topY) {
    const x0 = handleX - 24;
    let g = '';
    g += L(x0 + 6, topY + 32, x0 + 4, 378, '#0b0e16', 3, CAP) + L(x0 + 42, topY + 32, x0 + 44, 378, '#0b0e16', 3, CAP);  // передние ножки
    g += L(x0 + 11, topY + 30, x0 + 12, 373, '#090c13', 2.2, CAP) + L(x0 + 37, topY + 30, x0 + 36, 373, '#090c13', 2.2, CAP);  // задние
    g += R(x0 + 2, topY + 30, 48, 6, '#1b1618', 'rx="2"');       // сиденье
    g += L(x0 + 9, topY + 24, x0 + 9, topY + 31, '#0b0e16', 2.4) + L(x0 + 39, topY + 24, x0 + 39, topY + 31, '#0b0e16', 2.4);
    g += R(x0 + 4, topY, 44, 26, '#241b1a', 'rx="3.5"');          // спинка
    g += R(x0 + 4, topY, 44, 3, '#58576b', 'rx="1.5" opacity=".55"');
    g += L(x0 + 10, topY + 9, x0 + 42, topY + 9, '#2e2321', 0.8) + L(x0 + 8, topY + 16, x0 + 44, topY + 16, '#2e2321', 0.8);
    return g;
  }

  SCENES.room214_dark = function (u, p, d, t) {
    const FL = GROUND;
    const problem = !!p.breath;
    const cnt = p.count || [];
    let g = '';

    // тик: секунды с последнего счёта
    let sinceTick = 99;
    for (const c of cnt) if (t >= c) sinceTick = Math.min(sinceTick, t - c);
    const tickFlash = sinceTick < 0.32 ? Math.pow(1 - sinceTick / 0.32, 2) : 0;

    // ---- стена, потолок, пол
    g += R(0, 0, 360, FL, '#0a1527') + R(0, 0, 360, 24, '#060c19') + L(0, 24, 360, 24, '#101c34', 1.5);
    g += R(0, FL, 360, 640 - FL, '#05080f');
    g += R(0, FL - 9, 360, 9, '#0d1a31') + L(0, FL, 360, FL, '#1b2b48', 1.6);
    for (let i = 0; i < 4; i++) g += L(0, FL + 14 + i * i * 12, 360, FL + 14 + i * i * 12, '#070c15', 1);

    // ---- лунный свет: ореол на стене
    g += Ci(222, 188, 215, 'url(#glowC)', `opacity="${f1(0.42 + 0.05 * tickFlash)}"`);

    // ---- снятый динамик: бледный след на краске и торчащие провода
    g += R(66, 56, 36, 24, '#0e1a30', 'rx="2"') + R(66, 56, 36, 24, 'none', 'stroke="#18274a" stroke-width="1"') + Ci(84, 68, 2.6, '#03060c');
    const sw = Math.sin(t * 0.9) * 1.6 + noise1(t * 0.45 + 4) * 0.8;
    g += P(`M82 68 q ${-3 + sw} 13 ${1 + sw * 1.3} 27 q ${1 + sw * 0.6} 6 ${-1 + sw * 1.5} 12`, 'none', `stroke="#b8923f" stroke-width="1.4" ${CAP}`);
    g += P(`M86.5 68 q ${4 + sw * 0.8} 10 ${2 + sw} 22 q ${-1 + sw * 0.6} 7 ${2 + sw * 1.4} 11`, 'none', `stroke="#6f7787" stroke-width="1.4" ${CAP}`);

    // ---- окно
    const wx = 170, wy = 122, ww = 104, wh = 116;
    g += R(wx - 5, wy - 5, ww + 10, wh + 10, '#1b2842');
    g += `<defs><linearGradient id="fq_glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#27456f"/><stop offset="1" stop-color="#132747"/></linearGradient>
      <linearGradient id="fq_shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8cfff" stop-opacity=".2"/><stop offset="1" stop-color="#a8cfff" stop-opacity=".02"/></linearGradient>
      <linearGradient id="fq_hush" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".9"/></linearGradient></defs>`;
    g += R(wx, wy, ww, wh, 'url(#fq_glass)');
    g += stars(10, 5, wx + 2, wy + 2, ww - 4, 40, 0.8);
    g += Ci(wx + 70, wy + 24, 30, 'url(#glowC)', 'opacity=".9"') + Ci(wx + 70, wy + 24, 7.5, '#e6eefb') + Ci(wx + 73, wy + 22, 6.4, '#27456f', 'opacity=".55"');
    g += snow(wx, wy, ww, wh, t, 34, 3, 15, 0.95);
    // перекладины
    g += R(wx + ww / 2 - 1.8, wy, 3.6, wh, '#1b2842') + R(wx, wy + wh * 0.42, ww, 3.6, '#1b2842');
    g += L(wx, wy + wh * 0.42, wx + ww, wy + wh * 0.42, '#4d73a8', 0.8, 'opacity=".5"') + L(wx - 5, wy - 5, wx + ww + 5, wy - 5, '#4d73a8', 0.8, `opacity="${f1(0.4 + 0.5 * tickFlash)}"`);
    // шпингалет на средней стойке: ответная планка и откинутая ручка (открыт)
    const lx = wx + ww / 2, ly = wy + wh * 0.72;
    g += R(lx - 3, ly - 7, 6, 15, '#6d788c', 'rx="1.4"') + Ci(lx, ly + 1, 1.5, '#2a3242') + L(lx, ly - 4, lx + 9, ly - 9.5, '#aab5c7', 2, CAP) + Ci(lx + 9.5, ly - 10, 1.6, '#c9d3e2');
    // подоконник
    g += R(wx - 12, wy + wh + 5, ww + 24, 6, '#2c3d60') + L(wx - 12, wy + wh + 5, wx + ww + 12, wy + wh + 5, '#4c6894', 1);
    g += R(wx - 6, wy + wh + 11, ww + 12, 4, '#0b1427');

    // ---- луч лунного света (дымка + пылинки), не доходит до зоны субтитров
    const sh = 1 + 0.18 * tickFlash;
    g += P(`M${wx + 4} ${wy + wh + 11} L${wx + ww - 4} ${wy + wh + 11} L${wx + ww - 60} ${FL} L${wx - 82} ${FL} Z`, 'url(#fq_shaft)', `opacity="${f1(0.8 * sh)}"`);
    for (let i = 0; i < 16; i++) {
      const k = hash(i * 2.3 + 1);
      const yy = wy + wh + 14 + ((hash(i * 4.7) * 110 + t * (2 + 3 * k)) % (FL - wy - wh - 20));
      const frac = (yy - (wy + wh + 11)) / (FL - wy - wh - 11);
      const xx = mix(wx + 8 + hash(i * 9.1) * (ww - 16), wx - 70 + hash(i * 9.1) * (ww - 16), frac) + Math.sin(t * 0.7 + i) * 3;
      g += Ci(xx, yy, 0.6 + 0.4 * hash(i * 1.1), `rgba(200,225,255,${f1(0.5 * (0.3 + 0.7 * Math.abs(Math.sin(t * 0.8 + i * 2))) * (1 - frac * 0.6))})`);
    }

    // ---- батарея под окном
    const rx0 = 192, ry0 = 313;
    g += L(rx0 + 10, ry0 + 42, rx0 + 10, FL, '#202c44', 3) + L(rx0 + 70, ry0 + 42, rx0 + 70, FL, '#202c44', 3);
    g += G(radiator(rx0, ry0, 77, 44), '', 'opacity=".34"') + L(rx0 + 1, ry0 + 1, rx0 + 76, ry0 + 1, '#9ec2f0', 1, 'opacity=".4"');

    // ---- часы на стене
    const secBase = problem ? 12 : 41;
    let secDeg;
    if (problem) {
      const k = Math.floor(u + 0.0), a = u - k;
      secDeg = (secBase + k) * 6 + 6 * lin(a, 0, 0.05) + 1.6 * Math.exp(-a * 28) * Math.sin(a * 85);
    } else {
      let n = 0, last = -9;
      for (const c of cnt) if (t >= c) { n++; last = c; }
      const a = t - last;
      secDeg = (secBase + n - 1) * 6 + (n ? 6 * lin(a, 0, 0.05) + 1.8 * Math.exp(-a * 28) * Math.sin(a * 85) : 6);
    }
    g += wallClock(71, 172, 19, secDeg, 270 + (problem ? 6 : 0), 232.5 + (problem ? 0.5 : 0), problem ? 0 : tickFlash);

    // ---- дверь слева + подпирающий стул
    const dx = 40, dy = FL - 138, dw = 62;
    g += door({ x: dx, y: dy, w: dw, h: 138, num: '', peep: false, color: '#5b4231' });
    g += R(dx - 5, dy - 5, dw + 10, 143, 'rgba(3,7,16,.62)');
    // полоска света из коридора под дверью (едва заметная)
    g += R(dx, FL - 2, dw, 2, '#ffd9a0', `opacity="${f1(0.4 + 0.08 * noise1(t * 6))}"`);
    g += chairSmall(91, 305);

    // ---- Тёма
    const tx = 206, ty = FL + 7, th = 152;
    const tr = 0.22;   // мелкая дрожь от страха
    const jx = noise1(t * 21 + 4) * tr, jy = noise1(t * 17 + 9) * tr * 0.7;
    g += temaHiding(tx, ty, th, -1, jx, jy, problem ? 0 : tickFlash);

    // ---- пар изо рта (только в «problem»)
    if (problem) {
      const s = th / 100;
      const ox = tx - 10.5 * s - 2, oy = ty - 53 * s;
      for (let k = -1; k <= 2; k++) {
        const t0 = 0.5 + k * 1.2;
        g += puff(ox, oy, u - t0, 1.35, -1, 4 + k, 1);
      }
    }

    // ---- зона субтитров: гасим
    g += R(0, FL + 70, 360, 640 - FL - 70, '#020409');
    return g;
  };

  // ================= handle =================
  // раскладка по вертикали: ручка выше, пол (свет под дверью) у линии GROUND-12, чтобы низ не лез в зону субтитров
  const HY = 108, FY = 360;          // ось ручки; верхняя линия пола (низ двери выше на 9 px)
  // ч.2 — необязательные параметры (без них кадр как в ч.1):
  //   hot 0..1            — горячий свет из коридора: полоса под дверью ярче (×1+0.6·hot) с ореолом, тёплый разлив на нижней филёнке
  //   press [t | [t,px]]  — рывок рычага +4° за 0.08 с, отпуск 0.25 с; стул сдвигается на px (по умолчанию 2, последний из ≥2 — 3), сыплется труха
  //   key true            — в скважине торчит наш латунный ключ
  //   jingle t            — за дверью звякнули ключи: накладка дрожит ±1 px 0.3 с, вокруг скважины бегут 3 блика
  //   scrape [t0,t1]      — чужой ключ толкает наш: дрожь ±1.2 px / ±4°, металлическая крошка; в t1 резкий стоп и белое кольцо
  //   bang t              — удар: полотно вздрагивает (+3 px), стул уезжает на 6 px и поворачивается на 1.5°, пыль сверху, свет мигает 2×0.06 с, ступни переступают
  const KX = 98, KY = 180.6;         // круглая часть скважины (ось нашего ключа)

  // наш ключ: стержень из скважины, латунная головка 16×12 с отверстием; kr — поворот, kx/ky — сдвиг, hot — тёплый подсвет снизу
  function ourKey(kx, ky, kr, hot, flash) {
    let k = '';
    // тень стержня и головки на накладке (свет сверху-слева)
    k += P('M-1.6 1.5 L3.6 1.5 L6.6 10.4 C11.6 11.4,12.4 22.6,5.2 24.4 C-2.6 25.4,-6 18.6,-2.4 12.6 Z', 'rgba(2,4,9,.5)', 'transform="translate(2.4 2.6)"');
    // стержень и плечико
    k += R(-2.3, -1.2, 4.6, 10.6, '#8a6a2a', 'rx="1.3"') + L(-1.05, -0.4, -1.05, 8.6, '#f1d98e', 0.8, `opacity=".75" ${CAP}`);
    k += R(-4.2, 8, 8.4, 3, '#a9873a', 'rx="1.2"') + L(-3.6, 8.5, 3.6, 8.5, '#f3dc94', 0.7, 'opacity=".6"');
    // головка
    k += `<ellipse cx="0" cy="16.6" rx="8" ry="6.2" fill="url(#fq_brass)" stroke="#5f4414" stroke-width=".9"/>`;
    k += `<ellipse cx="0" cy="16.6" rx="6.1" ry="4.4" fill="none" stroke="#f2d888" stroke-width=".7" opacity=".5"/>`;
    k += `<ellipse cx="0.3" cy="17.2" rx="2.5" ry="1.9" fill="#1c212b" stroke="#6e5019" stroke-width=".6"/>`;
    k += P('M-6.2 13.6 A7.4 5.6 0 0 1 2.4 10.7', 'none', `stroke="#fff6d8" stroke-width="1.1" opacity=".7" ${CAP}`);
    if (hot > 0) k += P('M-6.4 19.8 A7.6 5.8 0 0 0 6.4 19.8', 'none', `stroke="#ffc874" stroke-width="1.2" opacity="${f1(0.25 + 0.45 * hot)}" ${CAP}`);
    if (flash > 0) k += `<ellipse cx="0" cy="16.6" rx="8" ry="6.2" fill="#ffffff" opacity="${f1(0.7 * flash)}"/>`;
    return G(k, `translate(${f1(KX + kx)} ${f1(KY + ky)}) rotate(${f1(kr)})`);
  }
  // крошечный четырёхлучевой блик
  const glint = (x, y, s, a) => a <= 0.01 ? '' :
    L(x - s, y, x + s, y, '#f4f8ff', 0.9, `opacity="${f1(a)}" ${CAP}`) + L(x, y - s, x, y + s, '#f4f8ff', 0.9, `opacity="${f1(a)}" ${CAP}`) + Ci(x, y, 0.9 + 0.5 * a, '#ffffff', `opacity="${f1(a)}"`);

  SCENES.handle = function (u, p, d, t) {
    const tD = p.tDown ?? 106.872;
    const a = t - tD;                       // с момента нажатия
    let g = '';

    // ---- ч.2: рывки (press), удар (bang), ключи (jingle/scrape)
    const hot = clamp(p.hot ?? 0);
    const prs = (p.press || []).map((q, i, arr) => Array.isArray(q) ? { t: q[0], px: q[1] } : { t: q, px: (arr.length > 1 && i === arr.length - 1) ? 3 : 2 });
    let pJerk = 0, pShift = 0, pAmp = 0;
    for (const q of prs) {
      const e = t - q.t;
      if (e < 0) continue;
      pJerk += e < 0.08 ? 4 * eout(e / 0.08) : 4 * (1 - ease(lin(e, 0.08, 0.33)));
      pShift += q.px * eout(lin(e, 0.02, 0.16));
      pAmp += 1.8 * Math.exp(-e / 0.16);
    }
    const bb = p.bang != null ? t - p.bang : -1;
    const bOn = bb >= 0;
    const bMove = bOn ? eout(lin(bb, 0, 0.12)) : 0;                                   // стул уезжает
    const bDoor = (bOn && bb < 0.3) ? 3 * Math.exp(-bb / 0.065) * Math.cos(bb * 58) : 0;   // полотно вздрагивает
    const bLev = bOn ? 2.6 * eout(lin(bb, 0, 0.04)) * (1 - ease(lin(bb, 0.04, 0.4))) : 0;
    const bAmp = bOn ? 3.2 * Math.exp(-bb / 0.2) : 0;
    const bBlink = (bOn && ((bb >= 0.03 && bb < 0.09) || (bb >= 0.17 && bb < 0.23))) ? 0.16 : 1;
    const jj = p.jingle != null ? t - p.jingle : -1;
    const jOn = jj >= 0 && jj < 0.3;
    const jdx = jOn ? noise1(t * 83 + 1) * 1.0 : 0, jdy = jOn ? noise1(t * 71 + 5) * 1.0 : 0;
    const sc = p.scrape || null;
    const scOn = !!sc && t >= sc[0] && t < sc[1];
    // всё, что крепится к полотну, сдвигаем вместе; без новых параметров обёртки нет
    const DS = s => bDoor ? G(s, `translate(${f1(bDoor)} 0)`) : s;
    const hwx = bDoor + jdx, hwy = jdy;
    const HS = s => (hwx || hwy) ? G(s, `translate(${f1(hwx)} ${f1(hwy)})`) : s;

    // угол ручки (вниз), с «залипанием» на стуле и рывком к слову «вниз»
    let th = a <= 0 ? 0 : kf([[0, 0], [0.35, 2], [0.62, 3.6], [1.3, 26]], a);
    th += a > 1.3 ? 1.6 * lin(a, 1.3, 3.0) : 0;
    const push = clamp((th - 3) / 23);       // сколько стул уже уступил
    // дрожь стула: растёт при нажатии, затухает после
    const amp = 0.35 + 1.5 * lin(a, -0.2, 0.55) * (1 - 0.65 * lin(a, 1.3, 2.4)) + pAmp + bAmp;
    const burst = 0.45 + 0.55 * sstep(-0.2, 0.5, noise1(t * 4.3 + 2));
    const cj = amp * burst;
    const cdx = noise1(t * 43 + 1) * cj * 0.9, cdy = noise1(t * 51 + 7) * cj * 0.55;

    g += `<defs><linearGradient id="fq_door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2332"/><stop offset=".55" stop-color="#111722"/><stop offset="1" stop-color="#090c14"/></linearGradient>
      <linearGradient id="fq_plate" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4b5567"/><stop offset=".5" stop-color="#394152"/><stop offset="1" stop-color="#262c39"/></linearGradient>
      <linearGradient id="fq_lev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdd7e6"/><stop offset=".28" stop-color="#8f9bad"/><stop offset=".7" stop-color="#4c5565"/><stop offset="1" stop-color="#2e3541"/></linearGradient>
      <linearGradient id="fq_spill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd48a" stop-opacity=".7"/><stop offset=".4" stop-color="#e59a3a" stop-opacity=".26"/><stop offset="1" stop-color="#e59a3a" stop-opacity="0"/></linearGradient>
      <linearGradient id="fq_shd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c0805" stop-opacity=".92"/><stop offset="1" stop-color="#0c0805" stop-opacity="0"/></linearGradient>
      <linearGradient id="fq_hush" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".95"/></linearGradient>
      <clipPath id="fq_flr"><rect x="0" y="${FY}" width="360" height="120"/></clipPath></defs>`;
    if (hot > 0 || p.key) g += `<defs><linearGradient id="fq_hot" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffb860" stop-opacity=".62"/><stop offset=".45" stop-color="#ffb860" stop-opacity=".2"/><stop offset="1" stop-color="#ffb860" stop-opacity="0"/></linearGradient>
      <linearGradient id="fq_brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2d27c"/><stop offset=".5" stop-color="#c8a24a"/><stop offset="1" stop-color="#8a6624"/></linearGradient></defs>`;
    g += R(-10, -10, 380, 660, '#04060a');
    g += DS(R(-10, -10, 346, FY - 9 + 10, 'url(#fq_door)'));
    // филёнки двери
    g += DS(R(18, 14, 296, 252, '#141b29', 'rx="3"') + R(18, 14, 296, 252, 'none', 'stroke="#222d42" stroke-width="1.6" rx="3"'));
    g += DS(R(18, 284, 296, 56, '#0d131e', 'rx="3"') + R(18, 284, 296, 56, 'none', 'stroke="#1a2438" stroke-width="1.6" rx="3"'));
    g += DS(L(18, 15, 314, 15, '#3a4863', 1.4, 'opacity=".55"') + L(19, 285, 313, 285, '#2c3a56', 1.2, 'opacity=".45"'));
    g += Ci(30, 10, 280, 'url(#glowC)', 'opacity=".26"');      // холодный отсвет окна сверху-слева
    // торец двери, щель, коробка, ответная планка
    g += DS(R(326, -10, 8, FY - 9 + 10, '#1d2535') + L(326, 0, 326, FY - 9, '#394764', 1)) + R(334, -10, 5, 660, '#010204') + R(339, -10, 40, 660, '#0b1018');
    g += R(341, 62, 14, 92, '#59627a') + R(341, 62, 14, 92, 'none', 'stroke="#2b3345" stroke-width="1"') + R(344, 92, 8, 30, '#06080d', 'rx="1.5"');
    g += DS(R(321, 96, 15, 17, '#5d6677') + L(321, 97, 336, 97, '#a9b4c6', 1, 'opacity=".6"'));   // язычок замка в торце двери
    g += DS(R(0, FY - 17, 336, 8, '#070a10') + L(0, FY - 9.5, 336, FY - 9.5, '#202c44', 1));
    // тёплый разлив снизу на нижней филёнке (горячий свет)
    if (hot > 0) g += DS(R(18, 317, 300, FY - 9 - 317, 'url(#fq_hot)', `opacity="${f1(hot * bBlink)}"`));
    g += R(-10, FY, 380, 660 - FY, '#04060b');

    // ---- свет из-под двери + тень ног
    const lm = (1 + 0.6 * hot) * bBlink;
    const fl = 1 + 0.07 * noise1(t * 9) + 0.04 * noise1(t * 31);
    const arrive = lin(a, -0.3, 0.02);
    const cx = mix(272, 209, eout(arrive));
    const ph = arrive * Math.PI * 3.2;
    const walking = a < 0.02;
    const feet = [];
    {
      const sw = walking ? 13 * Math.sin(ph) : 0;
      const sway = a >= 0.02 ? 0.7 * noise1(t * 1.3 + 3) : 0;
      const sh2 = (a > 0.55 && a < 0.7) ? 1.6 * Math.sin((a - 0.55) / 0.15 * Math.PI) : 0;   // переступил, когда ручка пошла
      // после удара ступни переступают: левая — назад-влево, правая — вправо
      const sA = bOn ? (bb < 0.08 ? 0 : -7 * ease(lin(bb, 0.08, 0.2))) : 0, vA = (bOn && bb >= 0.08 && bb < 0.2) ? 0 : 1;
      const sB = bOn ? (bb < 0.24 ? 0 : 6 * ease(lin(bb, 0.24, 0.36))) : 0, vB = (bOn && bb >= 0.24 && bb < 0.36) ? 0 : 1;
      feet.push({ x: walking ? cx - 21 + sw : 188 + sway + sh2 + sA, v: walking ? (Math.cos(ph) > -0.3 ? 1 : 0) : vA },
                { x: walking ? cx + 21 - sw : 230 - sway * 0.6 + sB, v: walking ? (Math.cos(ph) < 0.3 ? 1 : 0) : vB });
    }
    g += G(`<ellipse cx="180" cy="${FY}" rx="230" ry="40" fill="url(#glowW)" opacity="${f1(0.24 * fl * lm)}"/>`, '', 'clip-path="url(#fq_flr)"');
    g += P(`M-20 ${FY} L380 ${FY} L440 ${FY + 44} L-80 ${FY + 44} Z`, 'url(#fq_spill)', `opacity="${f1(Math.min(1, 0.5 * fl * lm))}"`);
    if (hot > 0) g += `<ellipse cx="180" cy="${FY - 5}" rx="250" ry="22" fill="url(#glowW)" opacity="${f1(0.55 * hot * fl * bBlink)}"/>`;
    g += R(-4, FY - 9, 368, 9, '#ffe2a2', `opacity="${f1(Math.min(1, 0.92 * fl * lm))}"`) + R(-4, FY - 9, 368, 2.6, '#fff4d6', (hot > 0 || bBlink < 1) ? `opacity="${f1(0.75 * Math.min(1, bBlink * (1 + 0.3 * hot)))}"` : 'opacity=".75"');
    for (const f of feet) {
      if (f.v < 0.5) continue;
      g += P(`M${f1(f.x - 17)} ${FY} L${f1(f.x + 17)} ${FY} L${f1(f.x + 32)} ${FY + 44} L${f1(f.x - 32)} ${FY + 44} Z`, 'url(#fq_shd)', 'opacity=".95"');
      g += R(f.x - 17.5, FY - 10, 35, 11.5, '#0a0705', 'rx="6"');
      g += R(f.x - 21, FY - 11, 42, 4.5, '#0a0705', 'opacity=".5"');
    }
    // удар: пылинки из щели подлетают в свете
    if (bOn && bb < 1.3) {
      for (let i = 0; i < 10; i++) {
        const age = bb - 0.03 * hash(i * 4.1 + 2);
        if (age < 0 || age > 1.2) continue;
        const e = age / 1.2;
        const xx = 40 + hash(i * 7.3 + 1) * 280 + (hash(i * 2.9) - 0.5) * 30 * e, yy = FY - 6 - (8 + 26 * hash(i * 5.5)) * eout(Math.min(1, age / 0.5)) + 14 * e * e;
        g += Ci(xx, yy, 0.6 + 0.6 * hash(i * 3.7), '#ffdca6', `opacity="${f1(0.85 * (1 - e))}"`);
      }
    }

    // ---- стул: спинка под ручкой (цельная группа дрожит и уступает)
    const chairTx = cdx + 2.4 * push + 0.25 * pShift + 1.2 * bMove, chairTy = cdy + 13 * push + pShift + 6 * bMove;
    let ch = '';
    const legB = FY - 1, legF = FY + 17;
    ch += L(140, 236, 138, legB, '#080a10', 5, CAP) + L(296, 236, 298, legB, '#080a10', 5, CAP);
    ch += L(112, 254, 108, legF, '#0a0d14', 7, CAP) + L(318, 254, 322, legF, '#0a0d14', 7, CAP);
    ch += L(110, 312, 320, 312, '#0a0d14', 5, CAP);
    ch += L(138, legB - 10, 138, legB, '#c88a3e', 3, `opacity=".7" ${CAP}`) + L(298, legB - 10, 298, legB, '#c88a3e', 3, `opacity=".7" ${CAP}`);
    ch += L(108, legF - 9, 108, legF, '#d8943f', 4, `opacity=".6" ${CAP}`) + L(322, legF - 9, 322, legF, '#d8943f', 4, `opacity=".6" ${CAP}`);
    // сиденье
    ch += R(92, 238, 246, 17, '#1d1b20', 'rx="4"') + R(92, 238, 246, 3.5, '#4a4a58', 'rx="1.6" opacity=".5"');
    // трубчатые стойки спинки
    ch += R(135, 150, 9, 92, '#0c1018') + R(293, 150, 9, 92, '#0c1018') + L(139.5, 150, 139.5, 242, '#3a465c', 1, 'opacity=".5"') + L(297.5, 150, 297.5, 242, '#3a465c', 1, 'opacity=".5"');
    // спинка (фанерная)
    ch += R(122, 118, 194, 86, '#2a2529', 'rx="10"') + R(122, 118, 194, 86, 'none', 'stroke="#15121a" stroke-width="2" rx="10"');
    ch += R(125, 119, 188, 6, '#6e6a7c', 'rx="3" opacity=".42"');
    for (let i = 0; i < 5; i++) ch += L(130, 140 + i * 12, 308, 140 + i * 12 + (i % 2 ? 1.5 : -1.2), '#322d32', 1);
    for (const [rx_, ry_] of [[134, 130], [304, 130], [134, 192], [304, 192]]) ch += Ci(rx_, ry_, 2.2, '#5b5f6e') + Ci(rx_ - .5, ry_ - .5, 0.8, '#aab3c4');
    g += G(ch, `translate(${f1(chairTx)} ${f1(chairTy)}) rotate(${f1(1.3 * push + 1.5 * bMove)} 218 200)`);

    // ---- накладка, розетка, замок
    const px = 98, py = HY;
    let hw = '';
    hw += R(70, 34, 56, 196, 'url(#fq_plate)', 'rx="11"') + R(70, 34, 56, 196, 'none', 'stroke="#677188" stroke-width="1" rx="11" opacity=".55"');
    hw += L(74, 44, 74, 220, '#8f9bb2', 1, 'opacity=".4"');
    for (const sy of [48, 216]) hw += Ci(px, sy, 4.4, '#2d3442') + Ci(px, sy, 3.4, '#6d778a') + L(px - 2.6, sy + 1.4, px + 2.6, sy - 1.4, '#1d222c', 1);
    hw += Ci(px, 182, 11, '#262d3a') + Ci(px, 182, 8.5, '#6a7487') + Ci(px, 182, 6.4, '#1c222d') + P(`M${px - 1.6} 180 h3.2 v6 h-3.2 z M${px} 177.6 a2.6 2.6 0 1 0 .01 0`, '#05070b');
    // наш ключ в скважине
    if (p.key) {
      let kx = 0, ky = 0, kr = 0;
      if (scOn) { kx = noise1(t * 47 + 2) * 1.2; ky = noise1(t * 53 + 3) * 1.2; kr = noise1(t * 39 + 7) * 4; }
      const se = sc ? t - sc[1] : -1;
      const kfl = (se >= 0 && se < 0.12) ? 1 - se / 0.12 : 0;
      hw += ourKey(kx, ky, kr, hot, kfl);
    }
    hw += Ci(px, py, 20, '#2b3240') + Ci(px, py, 17.5, '#7b8698') + Ci(px, py - 1, 13.5, '#4d5667') + L(px - 14, py - 8, px + 6, py - 16, '#d6e0f0', 1.4, 'opacity=".5"');

    // ---- рычаг
    const lj = (a > 0 && a < 1.5) ? noise1(t * 60) * 0.25 : 0;
    let lev = '';
    lev += P('M-4 -2 L164 -3 L164 12 L-4 15 Z', 'rgba(0,0,0,.55)', 'transform="translate(2 8)"');
    lev += P('M-12 -12 C20 -10,90 -8,150 -7 Q172 -6 172 1.5 Q172 9 150 9.5 C90 10,20 12,-12 14 Q-18 1 -12 -12 Z', 'url(#fq_lev)');
    lev += P('M-6 -9 C30 -8,100 -6,150 -5.2', 'none', 'stroke="#eaf1fb" stroke-width="1.6" opacity=".6" stroke-linecap="round"');
    lev += L(0, 8.5, 150, 7.4, '#171c26', 1.2, 'opacity=".7"');
    lev += Ci(165, 1, 3.6, '#2c3340', 'opacity=".55"');
    hw += G(lev, `translate(${px} ${py}) rotate(${f1(th + lj + pJerk + bLev)})`);
    hw += Ci(px, py, 4.5, '#aab5c7') + Ci(px, py, 2, '#3b4353');
    // блики вокруг скважины: звякнули ключи
    if (jj >= 0 && jj < 0.5) {
      for (let i = 0; i < 3; i++) {
        const k = lin(jj, i * 0.06, i * 0.06 + 0.36), al = Math.sin(Math.PI * k);
        const an = -2.2 + i * 2.1 + jj * 6.5;
        hw += glint(KX + Math.cos(an) * 11.6, 182 + Math.sin(an) * 11.6, 2.2 + 2.4 * al, 0.95 * al);
      }
    }
    g += HS(hw);

    // ---- чужой ключ: металлическая крошка, в конце резкий стоп и белое кольцо
    if (sc) {
      for (let i = 0; i < 48; i++) {
        const tb = sc[0] + (i + hash(i * 3.9)) / 24;
        if (tb >= sc[1]) break;
        const age = t - tb;
        if (age < 0 || age > 0.6) continue;
        const e = age / 0.6;
        const xx = KX + (hash(i * 5.3) - 0.5) * 8 + (hash(i * 2.2) - 0.5) * 46 * age, yy = KY + 2 + (hash(i * 7.1) - 0.2) * 5 - 18 * age + 300 * age * age;
        const r = 0.55 + 0.75 * hash(i * 1.9), al = f1(0.95 * (1 - e * e));
        g += Ci(xx + hwx, yy + hwy, r, hash(i * 6.6) > 0.35 ? '#e6ecf5' : '#c8a24a', `opacity="${al}"`);
      }
      const se = t - sc[1];
      if (se >= 0 && se < 0.34) {
        const k = se / 0.34;
        g += Ci(KX, 186, 12 + 30 * eout(k), 'none', `stroke="#ffffff" stroke-width="${f1(1.8 - 0.8 * k)}" opacity="${f1(0.95 * (1 - k))}"`);
      }
    }

    // ---- пылинки/труха от скрипа
    for (let i = 0; i < 9; i++) {
      const st = 0.15 + hash(i * 3.3) * 1.75, age = a - st;
      if (age < 0 || age > 0.9) continue;
      const x0 = 150 + hash(i * 6.1) * 120, y0 = 206 + chairTy;
      g += Ci(x0 + Math.sin(i * 3 + age * 5) * 2, y0 + age * (30 + hash(i) * 40), 0.7 + hash(i * 9) * 0.5, `rgba(176,186,204,${f1(0.5 * (1 - age / 0.9))})`);
    }
    // ---- труха на каждом рывке: с кромки спинки под рычагом и из-под ножек
    prs.forEach((q, j) => {
      const e0 = t - q.t;
      if (e0 < 0 || e0 > 1.1) return;
      for (let i = 0; i < 10; i++) {
        const age = e0 - 0.1 * hash(j * 13.1 + i * 2.7);
        if (age < 0 || age > 0.9) continue;
        const e = age / 0.9, s = j * 31.7 + i;
        // из-под нижней кромки рычага, там где он вдавлен в спинку
        const x0 = 128 + hash(s * 1.3) * 104, y0 = HY + (x0 - px) * Math.tan((th + pJerk) * Math.PI / 180) + 11 + hwy;
        g += Ci(x0 + hwx + (hash(s * 4.1) - 0.5) * 16 * e, y0 + 8 * age + 190 * age * age, 0.6 + 0.7 * hash(s * 2.3), `rgba(206,188,168,${f1(0.8 * (1 - e))})`);
      }
    });
    // ---- удар: пыль с верхнего края полотна
    if (bOn && bb < 1.9) {
      for (let i = 0; i < 12; i++) {
        const age = bb - 0.02 - 0.16 * hash(i * 3.1 + 9);
        if (age < 0 || age > 1.6) continue;
        const e = age / 1.6;
        const xx = 26 + hash(i * 6.7 + 3) * 290 + Math.sin(age * 4 + i) * 3, yy = 2 + hash(i * 8.3) * 12 + 22 * age + 130 * age * age;
        const r = 0.9 + 1.3 * hash(i * 1.7);
        g += Ci(xx, yy, r, '#c9d2e0', `opacity="${f1(0.8 * (1 - e))}"`);
      }
    }

    // ---- зона субтитров: гасим, середина кадра тёмная и пустая
    g += R(0, 376, 360, 134, 'url(#fq_hush)');
    g += R(0, 508, 360, 140, '#000');
    return g;
  };
})();

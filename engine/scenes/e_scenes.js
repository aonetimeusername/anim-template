// ключ e: chair_door (Тёма запирает дверь и подпирает ручку стулом), exit_canopy (путь отхода: окно -> козырёк -> сугроб)
// chair_door:  p.tChair — абс. время «запирается» (щелчок замка около tChair, стул въезжает ~0.6 с после)
// exit_canopy: p.tPath — начало пунктира, p.tLatch — врезка со шпингалетом
//   ч.2 (без этих полей сцена рисуется как в ч.1):
//   latchInset:false — не рисовать врезку со шпингалетом (и жёлтый кружок у окна)
//   pathDim: 0..1 — общая прозрачность плана (жёлтый пунктир, стрелка, кольцо цели, размерная линия «3 М»)
//   hornLump:true — снежный ком на наружной стене между окном и козырьком (≈(112,238) лок.); из-под него
//                   торчит край раструба и кронштейн: при пересмотре видно, что под снегом рупор
//   siren:[t0,t1] (абс.) — тревога: плавный красный пульс 1.5 Гц (фаза от абс. t, как в corridor/section) на здании,
//                   отсвет из окна и двери на снег (≤.22); вход 0.25 с, выход в один кадр
//   fig:{tOut,tClose,tJump,tLand,h} (абс.) — Тёма вместо штатного: стоит у открытого окна; с tOut за 0.9 с
//        пролезает в проём и садится на козырёк; на tClose разворачивается, тянется к створке и за ~0.5 с
//        прикрывает её (стук на tClose+0.45); за 2 с на четвереньках ползёт к краю (вмятины в снегу),
//        выглядывает вниз, приседает; на tJump летит по жёлтой дуге, на tLand падает в сугроб (облако r 0→28),
//        увязает по плечи, отдувается паром и оглядывается на окно. h — рост (по умолчанию 48, как в 214)
(() => {
  const rad = d => d * Math.PI / 180;
  const frac = x => x - Math.floor(x);

  // угол руки person (локальный, как в lib), при котором кисть приходит в мировую точку (tx,ty)
  // lean — наклон корпуса вокруг ног (градусы, «вперёд» положителен), face — направление
  function armAngle(x, y, h, face, lean, tx, ty) {
    const s = h / 100, a = rad(lean * face);
    const vx = tx - x, vy = ty - y;
    const c = Math.cos(-a), sn = Math.sin(-a);
    const rx = vx * c - vy * sn, ry = vx * sn + vy * c;
    const lx = rx / (s * face), ly = ry / s;
    return Math.atan2(-(lx - 2), ly + 78) * 180 / Math.PI;
  }
  // точка в системе стула (начало — задняя ножка на полу) -> мировая
  function chairPt(px, th, lx, ly) {
    const a = rad(th), c = Math.cos(a), s = Math.sin(a);
    return [px + lx * c - ly * s, GROUND + lx * s + ly * c];
  }

  // =====================================================================================
  // школьный стул в профиле: спинка справа (к двери), сиденье слева. th — наклон на задние ножки
  function chairSvg(px, th) {
    const tube = '#8793a8', tubeD = '#5b667b', wood = '#9a7447', woodD = '#6a4d2e', woodL = '#bb915a';
    let g = '';
    g += L(-36, -14, 1, -14, tubeD, 2.8);
    g += L(-36, 0, -34.6, -39, tube, 4.2, 'stroke-linecap="round"');
    g += L(0.6, 0, 4.4, -79, tube, 4.4, 'stroke-linecap="round"');
    g += L(-0.8, 0, 3.4, -78, '#b4bdcc', 1.1, 'stroke-linecap="round" opacity=".7"');
    g += R(-41, -43.5, 47, 6, wood, 'rx="2.2"') + R(-41, -43.5, 47, 1.6, woodL, 'rx="0.8"') + R(-41, -38.4, 47, 1.0, woodD);
    g += P('M2.4 -82 L9 -81.4 L6.6 -51 L0.6 -51.6 Z', wood) + L(8.5, -81.2, 6.1, -51.4, woodL, 1.1) + L(2.2, -81.8, 0.5, -51.8, woodD, 1);
    g += R(-2.4, -1.4, 6.4, 3, '#1b1f27', 'rx="1.2"') + R(-38.4, -1.4, 6.4, 3, '#1b1f27', 'rx="1.2"');
    return G(g, `translate(${f1(px)},${GROUND}) rotate(${f1(th)})`);
  }

  // =====================================================================================
  SCENES.chair_door = function (u, p, d, t) {
    const tc = p.tChair ?? (t - u + 0.35);
    const a = t - tc;                                  // секунды от «tChair»
    const DX = 198, DW = 104, DT = 172;                // дверь: x, ширина, верх (низ — GROUND)
    const LX = DX + 9, LY = 262;                       // замок
    const RX = DX + 22, HY = 292;                      // розетка и ручка-нажим
    const flick = 0.5 + 0.5 * noise1(t * 13) * (hash(Math.floor(t * 12)) > 0.9 ? 1.4 : 0.6);

    // ---- таймлайн
    const k = ease(lin(a, -0.30, 0.04));               // поворот ключа 0..1
    const b = ease(lin(a, -0.12, 0.05));               // язычок замка выдвинут
    const ck = a - 0.04;                               // время после щелчка
    const A_END = 0.9;                                 // стул упёрся под ручку
    const sP = eout(lin(a, 0.30, A_END));               // 0..1 — стул и Тёма продвигаются к двери
    const pivot = mix(192, 210.3, sP);
    let th = 15 * ease(lin(a, 0.30, 0.55)) - 1.5 * ease(lin(a, 0.78, A_END));
    const thump = a - A_END;                           // после удара
    if (thump > 0) th += 1.1 * Math.exp(-thump * 11) * Math.abs(Math.sin(thump * 34));
    const shk = thump > 0 ? Math.exp(-thump * 13) * Math.sin(thump * 62) : 0;

    // ---- стена, окно, часы
    let g = R(0, 0, 360, GROUND, '#0f1a2f');
    g += R(0, 0, 360, 56, '#0b1426') + L(0, 56, 360, 56, '#16233b', 2);
    g += R(0, 262, 360, GROUND - 262, '#0c1628') + L(0, 262, 360, 262, '#22324f', 2);
    const wx = 40, wy = 146, ww = 66, wh = 116;
    g += Ci(wx + ww / 2, wy + wh / 2, 125, 'url(#glowC)', 'opacity=".20"');
    g += R(wx - 4, wy - 4, ww + 8, wh + 8, '#24324d') + R(wx, wy, ww, wh, '#06102a');
    g += G(snow(wx, wy, ww, wh, t, 22, 5, -26, .9));
    g += L(wx + ww / 2, wy, wx + ww / 2, wy + wh, '#24324d', 3) + L(wx, wy + wh * 0.42, wx + ww, wy + wh * 0.42, '#24324d', 3);
    g += R(wx - 8, wy + wh + 2, ww + 16, 5, '#2c3b5a');
    g += R(wx + ww - 9, wy + 58, 14, 3, '#9aa5b7', 'rx="1"');                    // шпингалет рамы (в след. кадре откроют)
    // батарея под окном (приглушена)
    g += radiator(wx - 2, 322, 58, 34) + R(wx - 2, 322, 58, 34, 'rgba(5,12,26,.55)');
    // часы
    const cx = 152, cy = 134;
    g += Ci(cx, cy, 14, '#1a2538') + Ci(cx, cy, 12.4, '#8e9aae');
    for (let i = 0; i < 12; i++) { const an = rad(i * 30); g += L(cx + Math.sin(an) * 10.4, cy - Math.cos(an) * 10.4, cx + Math.sin(an) * 11.8, cy - Math.cos(an) * 11.8, '#2a3448', 1); }
    const sec = Math.floor(t) + eout(lin(frac(t), 0, 0.12));
    g += L(cx, cy, cx + Math.sin(rad(128)) * 6, cy - Math.cos(rad(128)) * 6, '#1a2234', 1.8) + L(cx, cy, cx + Math.sin(rad(96)) * 9.4, cy - Math.cos(rad(96)) * 9.4, '#1a2234', 1.3);
    g += L(cx, cy, cx + Math.sin(rad(-sec * 6)) * 10.6, cy - Math.cos(rad(-sec * 6)) * 10.6, '#b23a45', 0.7) + Ci(cx, cy, 1.4, '#1a2234');
    // розетка на стене
    g += R(166, 286, 9, 13, '#1b2740', 'rx="1.5"') + L(168.5, 290, 168.5, 295, '#0b1220', 1) + L(172.5, 290, 172.5, 295, '#0b1220', 1);

    // ---- дверь изнутри
    g += R(DX - 7, 138, DW + 14, GROUND - 138, '#1a2438');                        // коробка и фрамуга
    g += R(DX, 142, DW, 20, '#0d1a33') + R(DX, 142, DW, 20, `rgba(150,196,255,${f1(0.10 + 0.10 * flick)})`);
    g += L(DX + DW / 2, 142, DX + DW / 2, 162, '#1a2438', 2.5);
    g += R(DX, DT, DW, GROUND - DT, '#03060c');
    const ds = shk * 1.3;
    let dr = '';
    dr += R(DX, DT, DW, GROUND - DT, '#573c28') + R(DX, DT, 3, GROUND - DT, '#6d4b31') + R(DX + DW - 3, DT, 3, GROUND - DT, '#40291a');
    dr += R(DX + 10, DT + 12, DW - 20, 78, '#4a3322') + R(DX + 10, DT + 12, DW - 20, 2, '#3a2819') + R(DX + 10, DT + 100, DW - 20, 92, '#4a3322') + R(DX + 10, DT + 100, DW - 20, 2, '#3a2819');
    for (const hy of [DT + 22, DT + 98, DT + 172]) dr += R(DX + DW - 6, hy, 7, 15, '#262d3b', 'rx="1.5"');
    g += G(dr, `translate(${f1(ds)},0)`);
    // ответная планка и язычок замка
    g += R(DX - 6, LY - 9, 4, 18, '#5d687c', 'rx="1"');
    g += R(DX - 5.5 * b, LY - 3, 5.5 * b + 3, 6, '#c3cbd6', 'rx="1"');
    // замок и ключ (крупно: это «маленькая анимация у замка»)
    {
      const ls = 1.3;
      const plate = R(-6.5, -10, 13, 25, '#7f8a9c', 'rx="3"') + R(-6.5, -10, 13, 2, '#a3adbd', 'rx="1"') + Ci(0, 0, 4.8, '#232a36') + Ci(0, 0, 3.2, '#10151d');
      g += G(plate, `translate(${f1(LX + ds)},${LY}) scale(${ls})`);
      const kg = R(-3, -14.5, 6, 11.5, '#e8edf5', 'rx="3"') + Ci(0, -10.8, 1.4, '#232a36') + R(-1.4, -4, 2.8, 4.5, '#c0c8d4');
      g += G(kg, `translate(${f1(LX + ds)},${LY}) scale(${ls}) rotate(${f1(90 * k)})`);
      if (ck > 0 && ck < 0.35) {
        const e = ck / 0.35;
        g += Ci(LX, LY, 5 + 20 * eout(e), 'none', `stroke="#cfe6ff" stroke-width="1.3" opacity="${f1(0.85 * (1 - e))}"`);
        for (let i = 0; i < 6; i++) {
          const an = rad(-60 + i * 36), r0 = 11 + 3 * e, r1 = 15 + 11 * eout(e);
          g += L(LX + Math.cos(an) * r0, LY + Math.sin(an) * r0, LX + Math.cos(an) * r1, LY + Math.sin(an) * r1, '#e8f3ff', 1.4, `opacity="${f1(1 - e)}" stroke-linecap="round"`);
        }
        g += Ci(LX, LY, 24, 'url(#glowC)', `opacity="${f1(0.9 * (1 - e))}"`);
      }
    }
    // ручка-нажим
    g += G(Ci(RX, HY, 5.8, '#8d97a8') + Ci(RX, HY, 2.8, '#6a7587') + R(RX - 3, HY + 2.5, 28, 1.6, 'rgba(0,0,0,.4)') + R(RX - 3, HY - 2.5, 28, 5, '#b6bfcc', 'rx="2.5"') + R(RX - 1, HY - 2.1, 24, 1.2, '#dfe5ee', 'rx=".6"'), `translate(${f1(ds)},0)`);
    // полоса света из коридора под дверью + короткий разлив
    g += R(DX + 2, GROUND - 2.5, DW - 4, 2.5, `rgba(170,215,255,${f1(0.30 + 0.30 * flick)})`);
    g += P(`M${DX + 2} ${GROUND} L${DX + DW - 2} ${GROUND} L${DX + DW + 6} ${GROUND + 9} L${DX - 4} ${GROUND + 9} Z`, `rgba(150,196,255,${f1(0.06 + 0.05 * flick)})`);

    // ---- пол
    g += R(0, GROUND, 360, 640 - GROUND, '#070d1a') + L(0, GROUND, 360, GROUND, '#2a3b5c', 2);

    // ---- Тёма
    let tx, face = 1, lean = 0, pose = 'stand', arm = null;
    const gap = 64;      // расстояние от ног Тёмы до задней ножки стула
    const leanPush = 10;
    if (a < 1.35) {
      tx = mix(192 - gap, 210.3 - 57, sP);
      const leanMax = 18;
      lean = a < 0.95 ? mix(leanPush, leanMax, ease(lin(a, 0.30, A_END))) : leanMax * (1 - ease(lin(a, 0.95, 1.35)));
      if (a > 0.30 && a < A_END) pose = 'walk';
      // цель руки: замок -> спинка стула
      const lockT = [LX - 8, LY + 3];
      const ct = chairPt(pivot, th, -3.2, -72);
      const m = ease(lin(a, 0.06, 0.30));
      const rel = ease(lin(a, 0.96, 1.25));
      let aa = armAngle(tx, GROUND, 150, 1, lean, mix(lockT[0], ct[0], m), mix(lockT[1], ct[1], m));
      if (rel > 0) aa = mix(aa, 8, rel);
      arm = aa;
    } else {
      face = -1; pose = 'walk';
      const xe = 128;
      const wk = ease(lin(a, 1.40, 1.98));
      tx = mix(210.3 - 57, xe, wk);
      const raise = ease(lin(a, 2.05, 2.35));
      if (wk >= 1) pose = 'stand';
      if (raise > 0) {
        const aa = armAngle(tx, GROUND, 150, -1, 0, wx + ww + 1, 233);
        arm = mix(8, aa, raise);
      }
    }
    const breath = pose === 'stand' ? Math.sin(t * 2.3) * 0.7 : 0;
    g += G(G(person({ x: tx, y: GROUND, h: 150, face, pose, t, arm }), lean ? `rotate(${f1(lean * face)} ${f1(tx)} ${GROUND})` : ''), `translate(0,${f1(breath)})`);

    // ---- стул (ближе к камере, чем Тёма)
    g += `<ellipse cx="${f1(pivot - 18)}" cy="${GROUND + 1.5}" rx="${f1(28 - th * 0.6)}" ry="2.4" fill="rgba(0,0,0,.5)"/>`;
    g += chairSvg(pivot, th);

    // ---- пыль и толчок в момент удара
    if (thump > 0 && thump < 0.5) {
      const e = thump / 0.5, cxp = 238, cyp = 297;
      for (let i = 0; i < 6; i++) {
        const an = rad(200 + i * 28 + hash(i) * 10), rr = 4 + 16 * eout(e) * (0.7 + 0.5 * hash(i + 3));
        g += Ci(cxp + Math.cos(an) * rr, cyp + Math.sin(an) * rr * 0.8, 1.6 + 1.4 * e, `rgba(190,205,225,${f1(0.55 * (1 - e))})`);
      }
      if (e < 0.4) for (let i = 0; i < 3; i++) g += L(cxp + 12 + i * 3, cyp - 12 + i * 6, cxp + 20 + i * 4, cyp - 15 + i * 7, '#dfe9f7', 1.1, `opacity="${f1(1 - e / 0.4)}" stroke-linecap="round"`);
    }
    // лёгкая пыль в луче у окна
    for (let i = 0; i < 8; i++) {
      const xx = wx + 10 + ((hash(i * 3.1) * 90 + t * (4 + hash(i) * 5)) % 90), yy = 180 + hash(i * 7.7) * 120 + Math.sin(t * 0.8 + i) * 6;
      g += Ci(xx, yy, 0.8, `rgba(200,220,245,${f1(0.18 + 0.12 * hash(i * 2.2))})`);
    }
    return G(g, 'translate(360 0) scale(-1 1)');   // зеркало: в room214_dark дверь слева, окно справа
  };

  // =====================================================================================
  // ломаная пунктиром, постепенно (prog 0..1 по длине), ровные штрихи как у dashed()
  function polyDash(pts, prog, col, w, on, off) {
    const lens = []; let total = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(l); total += l; }
    const end = total * prog;
    const at = sd => {
      let s = 0;
      for (let i = 0; i < lens.length; i++) {
        if (sd <= s + lens[i] || i === lens.length - 1) { const f = lens[i] ? Math.min(1, (sd - s) / lens[i]) : 0; return [mix(pts[i][0], pts[i + 1][0], f), mix(pts[i][1], pts[i + 1][1], f)]; }
        s += lens[i];
      }
    };
    let g = '';
    for (let s0 = 0; s0 < end; s0 += on + off) {
      const A = at(s0), B = at(Math.min(s0 + on, end));
      g += L(A[0], A[1], B[0], B[1], col, w, 'stroke-linecap="round"');
    }
    return { svg: g, head: at(end), total };
  }

  // =====================================================================================
  // ч.2: Тёма-«фигура» для exit_canopy (p.fig). Пропорции и цвета как у person() из lib, но с коленями и локтями.
  // Все координаты — локальные координаты здания (до сдвига OX).
  const rot = (x, y, a) => { const c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; };
  const CAPR = 'stroke-linecap="round"';
  // верх снежной подушки козырька (те же кривые, что в path козырька: Q и отражённая T)
  function snowTop(x) {
    if (x <= 146) { const u = clamp((x - 106) / 40); return 264 * (1 - u) * (1 - u) + 2 * 258 * (1 - u) * u + 261 * u * u; }
    const u = clamp((x - 146) / 40); return 261 * (1 - u) * (1 - u) + 2 * 264 * (1 - u) * u + 262 * u * u;
  }
  // верх сугроба под козырьком: две кубические Безье из path сцены (DROP=352, GROUND=372)
  function driftTop(x) {
    const segs = [[[150, 372], [172, 372], [190, 358], [216, 352]], [[216, 352], [246, 350], [268, 364], [330, 372]]];
    const sg = x < 216 ? segs[0] : segs[1];
    const bz = (k, u) => { const v = 1 - u; return v * v * v * sg[0][k] + 3 * v * v * u * sg[1][k] + 3 * v * u * u * sg[2][k] + u * u * u * sg[3][k]; };
    let lo = 0, hi = 1;
    for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (bz(0, m) < x) lo = m; else hi = m; }
    return bz(1, (lo + hi) / 2);
  }
  // сустав двухзвенной конечности: A — корень, B — цель, bend ±1 — сторона сгиба (по часовой на экране)
  function joint(A, B, l1, l2, bend) {
    let dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy);
    const dm = l1 + l2 - 0.001;
    if (d > dm) { B = [A[0] + dx / d * dm, A[1] + dy / d * dm]; dx = B[0] - A[0]; dy = B[1] - A[1]; d = dm; }
    if (d < 1e-3) return { K: [A[0], A[1] + l1], E: B };
    const an = Math.atan2(dy, dx) + bend * Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    return { K: [A[0] + Math.cos(an) * l1, A[1] + Math.sin(an) * l1], E: B };
  }
  // поза (бедро x,y; наклон tor «вперёд» в градусах; цели стоп fF/fB и кистей hF/hB; явные колени kF/kB) -> суставы
  function solveKid(P) {
    const s = P.s, face = P.face, a = rad(P.tor * face);
    const at = (lx, ly) => { const v = rot(lx * face * s, ly * s, a); return [P.x + v[0], P.y + v[1]]; };
    const J = { x: P.x, y: P.y, tor: P.tor, face, s, nod: P.nod || 0 };
    J.sF = at(2, -32); J.sB = at(-2, -32);
    const leg = (foot, knee) => knee ? { K: knee, E: foot } : joint([P.x, P.y], foot, 23 * s, 23 * s, -face);
    const lf = leg(P.fF, P.kF), lb = leg(P.fB, P.kB);
    J.kF = lf.K; J.eF = lf.E; J.kB = lb.K; J.eB = lb.E;
    const af = joint(J.sF, P.hF, 17 * s, 17 * s, face), ab = joint(J.sB, P.hB, 17 * s, 17 * s, face);
    J.lF = af.K; J.wF = af.E; J.lB = ab.K; J.wB = ab.E;
    return J;
  }
  const JP = ['sF', 'sB', 'kF', 'eF', 'kB', 'eB', 'lF', 'wF', 'lB', 'wB'];
  function mixJ(A, B, e) {
    if (e <= 0) return A;
    if (e >= 1) return B;
    const o = { face: e < 0.5 ? A.face : B.face, s: A.s };
    for (const k of ['x', 'y', 'tor', 'nod']) o[k] = mix(A[k], B[k], e);
    for (const k of JP) o[k] = [mix(A[k][0], B[k][0], e), mix(A[k][1], B[k][1], e)];
    return o;
  }
  // сплайн Эрмита по ключам [[время, поза-цели], ...]: касательные по соседям, на концах — 0 (плавный старт/стоп)
  function splPose(keys, c) {
    const n = keys.length;
    if (c <= keys[0][0]) return keys[0][1];
    if (c >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0;
    while (c > keys[i + 1][0]) i++;
    const [t1, A] = keys[i], [t2, B] = keys[i + 1], dt = t2 - t1, u = (c - t1) / dt;
    const h00 = 2 * u * u * u - 3 * u * u + 1, h10 = u * u * u - 2 * u * u + u, h01 = -2 * u * u * u + 3 * u * u, h11 = u * u * u - u * u;
    const tan = (j, get) => (j <= 0 || j >= n - 1) ? 0 : (get(keys[j + 1][1]) - get(keys[j - 1][1])) / (keys[j + 1][0] - keys[j - 1][0]);
    const val = get => h00 * get(A) + h10 * dt * tan(i, get) + h01 * get(B) + h11 * dt * tan(i + 1, get);
    const o = {};
    for (const k in A) {
      if (Array.isArray(A[k])) o[k] = [val(q => q[k][0]), val(q => q[k][1])];
      else if (typeof A[k] === 'number' && k !== 'face' && k !== 's') o[k] = val(q => q[k]);
      else o[k] = A[k];
    }
    return o;
  }
  function kidSvg(J) {
    const s = J.s, face = J.face;
    const limb = (A, K, E, col, w) => L(A[0], A[1], K[0], K[1], col, w, CAPR) + L(K[0], K[1], E[0], E[1], col, w, CAPR);
    const shoe = (K, E) => {
      let dx = E[0] - K[0], dy = E[1] - K[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const tx = face * dy, ty = -face * dx, bx = E[0] - dx * 1.5 * s, by = E[1] - dy * 1.5 * s;
      return L(bx - tx * 1.5 * s, by - ty * 1.5 * s, bx + tx * 3.5 * s, by + ty * 3.5 * s, C.shoe, f1(5 * s), CAPR);
    };
    const hip = [J.x, J.y];
    let g = '';
    g += limb(hip, J.kB, J.eB, C.pants, f1(7 * s)) + shoe(J.kB, J.eB);
    g += limb(hip, J.kF, J.eF, C.pants, f1(7 * s)) + shoe(J.kF, J.eF);
    g += limb(J.sB, J.lB, J.wB, C.suit2, f1(6 * s)) + Ci(J.wB[0], J.wB[1], 3.6 * s, C.skin);
    const hy = -45;
    const head = Ci(0, hy, 8.6, C.skin) +
      P(`M-8.8 ${hy - 1} C-9 ${hy - 11},7 ${hy - 13},8.8 ${hy - 3} L8.8 ${hy - 1} C6 ${hy - 6},-3 ${hy - 7},-8.8 ${hy + 3} Z`, C.hair) +
      Ci(5.2, hy - 0.5, 1, '#1a1a1a') + R(-9.4, hy - 2, 3, 5, C.skin2, 'rx="1.5"');
    const torso = R(-10, -34, 20, 38, C.suit, 'rx="5"') + R(1, -34, 9, 38, C.suit2, 'rx="4" opacity=".55"') + P('M-3.5 -34 L3.5 -34 L0 -25 Z', '#e8ecf2');
    g += G(torso + G(head, `rotate(${f1(J.nod)} 0 -34)`), `translate(${f1(J.x)},${f1(J.y)}) rotate(${f1(J.tor * face)}) scale(${f1(s * face)},${f1(s)})`);
    g += limb(J.sF, J.lF, J.wF, C.suit, f1(6 * s)) + Ci(J.wF[0], J.wF[1], 3.6 * s, C.skin);
    return g;
  }
  // интенсивность тревоги (как sirenK в corridor.js ч.2): фаза от абсолютного t, вход 0.25 с, выход в один кадр
  function sirenE(siren, t) {
    if (!siren) return null;
    const [a, b] = siren === true ? [-1e9, 1e9] : siren;
    if (t < a || t >= b) return null;
    return (0.10 + 0.12 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 1.5 * t))) * lin(t, a, a + 0.25);
  }
  // трапеция скорости: разгон и торможение по a доли отрезка
  const trap = (e, a = 0.18) => {
    const v = 1 / (1 - a);
    if (e < a) return v * e * e / (2 * a);
    if (e < 1 - a) return v * (e - a / 2);
    return 1 - v * (1 - e) * (1 - e) / (2 * a);
  };

  // ---- таймлайн фигуры. Возвращает суставы J и служебное (для вмятин, облаков и т.п.)
  function figState(t, F, ARC) {
    const s = (F.h ?? 48) / 100;
    const tO = F.tOut, tC = F.tClose, tJ = F.tJump, tLd = F.tLand;
    const sy = x => snowTop(x) + 0.6;
    const st = { s };
    // стоит у окна (в 214, пол FL2=252), руки на подоконнике
    const STAND = { x: 80, y: 230, tor: 4, face: 1, s, nod: 0, fF: [82, 252], fB: [78, 252], hF: [88.5, 226], hB: [87.5, 226.5] };
    // присел на козырьке после вылаза
    const CROUCH = { x: 116, y: 251, tor: 40, face: 1, s, nod: -14, fF: [121, sy(121)], fB: [112, sy(112)], hF: [127.5, 259], hB: [125, 259.5] };
    const CLIMB = [
      [0.00, STAND],
      [0.12, { ...STAND, x: 81, y: 233, tor: 14, hF: [89, 226], hB: [88, 226.5] }],                       // присел, толчок
      [0.32, { x: 90, y: 219, tor: 50, face: 1, s, nod: -10, fF: [93, 226], fB: [87, 226], hF: [104, 226], hB: [102, 226.5] }], // на подоконнике
      [0.52, { x: 100, y: 218, tor: 62, face: 1, s, nod: -20, fF: [104, 226], fB: [98, 226], hF: [112, 229], hB: [110, 228] }], // в проёме, голова снаружи
      [0.70, { x: 110, y: 237, tor: 34, face: 1, s, nod: -8, fF: [116, 253], fB: [109, 250], hF: [121, 246], hB: [118, 243] }], // спрыгивает
      [0.90, CROUCH],
    ];
    const grip = o => [97 - 9 * Math.sin(rad(15 * o)), 225 - 9 * Math.cos(rad(15 * o))];   // точка на створке (9 px от оси)
    const CL = [
      [-0.32, CROUCH],
      [-0.12, { x: 114, y: 244.5, tor: 6, face: 1, s, nod: 0, fF: [118.5, sy(118.5)], fB: [111, sy(111)], hF: [117, 254], hB: [112, 254] }],
    ];
    const CLB = [   // лицом к окну (face -1): «вперёд» — к стене
      [-0.12, { x: 114, y: 244.5, tor: 6, face: -1, s, nod: 0, fF: [110.5, sy(110.5)], fB: [117.5, sy(117.5)], hF: [111, 254], hB: [116, 254] }],
      [0.12, { x: 111.5, y: 241.5, tor: 27, face: -1, s, nod: -18, fF: [107.5, sy(107.5)], fB: [114.5, sy(114.5)], hF: [104, 238], hB: [118, 248] }],
      [0.46, { x: 113, y: 242.5, tor: 14, face: -1, s, nod: -10, fF: [108, sy(108)], fB: [115, sy(115)], hF: [104, 238], hB: [118.5, 249] }],
      [0.62, { x: 114, y: 244.5, tor: 6, face: -1, s, nod: 0, fF: [110.5, sy(110.5)], fB: [117.5, sy(117.5)], hF: [111, 254], hB: [116, 254] }],
    ];
    const CLF = { x: 114, y: 244.5, tor: 6, face: 1, s, nod: 0, fF: [117.5, sy(117.5)], fB: [110.5, sy(110.5)], hF: [117, 254], hB: [112, 254] };
    // ползёт: бедро от xs до xe, шаг диагональными парами, колени и кисти стоят на снегу, пока опорные
    const tc0 = tC + 0.85, tc1 = Math.max(tc0 + 0.6, Math.min(tc0 + 2.0, tJ - 0.45));
    const xs = 117, xe = 163, DT = xe - xs, NS = Math.max(1, Math.round(DT / 12)), SS = DT / NS, SIG = 0.62;
    const step = ph => {
      if (ph < SIG) return [SS * SIG * (0.5 - ph / SIG), 0];
      const q = (ph - SIG) / (1 - SIG);
      return [SS * SIG * (-0.5 + ease(q)), Math.sin(Math.PI * q)];
    };
    const crawl = (D, nod) => {
      const cyc = D / SS, x = xs + D;
      const y = snowTop(x) - 10.6 - 0.6 * Math.abs(Math.sin(2 * Math.PI * cyc));
      const knee = ph => { const [r, lf] = step(frac(cyc + ph)); const kx = x + 1.5 + r; return [kx, snowTop(kx) - 0.6 - 2.4 * lf]; };
      const hand = ph => { const [r, lf] = step(frac(cyc + ph)); const hx = x + 17.5 + r; return [hx, snowTop(hx) + 0.2 - 2.8 * lf]; };
      const kF = knee(0.5), kB = knee(0);
      return solveKid({ x, y, tor: 80, face: 1, s, nod, kF, fF: [kF[0] - 10.4, kF[1] - 1.4], kB, fB: [kB[0] - 10.4, kB[1] - 1.4], hF: hand(0), hB: hand(0.5) });
    };
    // присел на краю перед прыжком (бедро — в начале дуги), руки отведены назад
    const SQ = { x: ARC(0)[0], y: ARC(0)[1], tor: 34, face: 1, s, nod: -6, fF: [183.5, sy(183.5)], fB: [177.5, sy(177.5)], hF: [171, 251], hB: [169, 249] };
    st.dents = [];
    // ---- вмятины (появляются, когда нога/колено/ладонь там побывали)
    if (t >= tO + 0.86) st.dents.push([112, 2.6], [121, 2.6]);
    if (t >= tC - 0.12) st.dents.push([107.5, 2.4], [114.5, 2.4]);
    if (t >= tc0) {
      const D = DT * trap(lin(t, tc0, tc1));
      for (const [base, ph, r] of [[1.5, 0.5, 2.6], [1.5, 0, 2.6], [17.5, 0, 1.9], [17.5, 0.5, 1.9]]) {
        // опорная фаза начинается при D/SS + ph = целое; точка опоры = x бедра + base + SS*SIG/2
        for (let n = 0; n <= NS + 1; n++) {
          const Dn = Math.max(0, (n - ph) * SS);
          if (Dn > D + 1e-6) break;
          const rel = Dn === 0 ? step(frac(ph))[0] : SS * SIG * 0.5;
          st.dents.push([xs + Dn + base + rel, r]);
        }
      }
    }
    if (t >= tJ - 0.2) st.dents.push([177.5, 2.4], [183.5, 2.4]);

    let J;
    if (t < tO) {
      const b = Math.sin(t * 2.3) * 0.4;
      J = solveKid({ ...STAND, y: STAND.y + b });
    } else if (t < tO + 0.9) {
      J = solveKid(splPose(CLIMB, t - tO));
    } else if (t < tC - 0.32) {
      const b = Math.sin((t - tO) * 2.6) * 0.5;
      J = solveKid({ ...CROUCH, y: CROUCH.y + b, nod: CROUCH.nod + 6 * Math.sin((t - tO) * 1.7) });
    } else if (t < tC - 0.12) {
      J = solveKid(splPose(CL, t - tC));
    } else if (t < tC + 0.62) {
      const P0 = splPose(CLB, t - tC);
      const reach = ease(lin(t, tC - 0.1, tC + 0.12)) * (1 - ease(lin(t, tC + 0.48, tC + 0.62)));
      const g0 = grip(1 - ease(lin(t, tC + 0.12, tC + 0.46)));
      P0.hF = [mix(P0.hF[0], g0[0], reach), mix(P0.hF[1], g0[1], reach)];
      J = solveKid(P0);
    } else if (t < tc0) {
      J = mixJ(solveKid(CLF), crawl(0, -48), ease(lin(t, tC + 0.66, tc0)));
    } else if (t < tJ - 0.42) {
      const e = lin(t, tc0, tc1);
      const peek = ease(lin(t, tc1 - 0.1, tc1 + 0.12));
      J = crawl(DT * trap(e), -48 + 40 * peek);
    } else if (t < tJ) {
      const e = lin(t, tJ - 0.42, tJ);
      const A = crawl(DT, -8), B = solveKid(SQ);
      J = mixJ(A, B, ease(e));
      J.y += 2.2 * Math.sin(Math.PI * e);                // проседает перед толчком
    } else if (t < tLd) {
      // полёт по готовой дуге: x — равномерно, y — с ускорением (как сама дуга)
      const q = lin(t, tJ, tLd), H = ARC(q);
      const tor = mix(34, -6, ease(lin(q, 0, 0.55)));
      const P0 = { x: H[0], y: H[1], tor, face: 1, s, nod: mix(-6, -22, lin(q, 0, 0.5)) };
      const fl = Math.sin(t * 19) * 1.6 * lin(q, 0.2, 0.5);
      const rel = (k0, k1, k2, k3) => {     // ступни/кисти относительно бедра: толчок -> поджал -> выпрямил к посадке
        const a = q < 0.14 ? [mix(k0[0], k1[0], ease(q / 0.14)), mix(k0[1], k1[1], ease(q / 0.14))]
          : q < 0.55 ? [mix(k1[0], k2[0], ease((q - 0.14) / 0.41)), mix(k1[1], k2[1], ease((q - 0.14) / 0.41))]
            : [mix(k2[0], k3[0], ease((q - 0.55) / 0.45)), mix(k2[1], k3[1], ease((q - 0.55) / 0.45))];
        return [H[0] + a[0], H[1] + a[1]];
      };
      P0.fF = rel([2.5, 8.2], [-15, 5], [5, 15], [3, 21]);
      P0.fB = rel([-3.5, 8.2], [-18, 4], [1, 16], [-2.5, 21]);
      for (const f of [P0.fF, P0.fB]) if (f[0] < 187.5 && f[1] > snowTop(f[0]) + 0.6) f[1] = snowTop(f[0]) + 0.6;   // пока над козырьком — скользят по снегу
      const sh = solveKid({ ...P0, fF: P0.fF, fB: P0.fB, hF: [0, 0], hB: [0, 0] });
      const ra = (sp, k0, k1, k2) => {     // кисти от плеча: отведены назад -> мах вперёд-вверх -> вверх (машет)
        const a = q < 0.16 ? [mix(k0[0], k1[0], ease(q / 0.16)), mix(k0[1], k1[1], ease(q / 0.16))]
          : [mix(k1[0], k2[0], ease(lin(q, 0.16, 0.5))), mix(k1[1], k2[1], ease(lin(q, 0.16, 0.5)))];
        return [sp[0] + a[0], sp[1] + a[1]];
      };
      P0.hF = ra(sh.sF, [-10, 4], [11, -6], [4 + fl, -15]);
      P0.hB = ra(sh.sB, [-11, 3], [9, -8], [-4 - fl, -14.5]);
      J = solveKid(P0);
    } else {
      // в сугробе: ушёл по плечи, сложился, выпрямился, оглянулся на окно
      const c = t - tLd;
      const sink = eout(lin(c, 0, 0.16));
      const bounce = c > 0.16 ? -1.6 * Math.exp(-(c - 0.16) * 7) * Math.sin((c - 0.16) * 18) : 0;
      const x = 216 + 1.5 * sink, y = 347 + 17 * sink + bounce;
      const look = c >= 1.45;
      const face = look ? -1 : 1;
      const tor = look ? mix(2, -2, ease(lin(c, 1.45, 1.8))) : mix(-6, 22, ease(lin(c, 0, 0.16))) * (1 - ease(lin(c, 0.9, 1.4))) + 2 * ease(lin(c, 0.9, 1.4));
      const nod = look ? mix(-10, -28, ease(lin(c, 1.45, 1.9))) : mix(-22, 18, ease(lin(c, 0, 0.2))) * (1 - ease(lin(c, 0.95, 1.4)));
      const P0 = { x, y, tor, face, s, nod, fF: [x + 9 * face, 368.5], fB: [x + 5 * face, 369.5] };
      const sh = solveKid({ ...P0, hF: [0, 0], hB: [0, 0] });
      const up = 1 - ease(lin(c, 0.05, 0.35));
      const push = ease(lin(c, 0.9, 1.3));
      const rest = [[x + 12, driftTop(x + 12) - 0.2], [x - 10, driftTop(x - 10) - 0.2]];
      P0.hF = [mix(rest[0][0], sh.sF[0] + 4, up), mix(rest[0][1] - 1.5 * push, sh.sF[1] - 15, up)];
      P0.hB = [mix(rest[1][0], sh.sB[0] - 4, up), mix(rest[1][1] - 1.5 * push, sh.sB[1] - 14, up)];
      if (look) { P0.hF = [x - 11, driftTop(x - 11) - 0.2]; P0.hB = [x + 10, driftTop(x + 10) - 0.2]; }
      J = solveKid(P0);
      st.mouth = [J.x + rot(face * 6 * s, -46 * s, rad(J.tor * face))[0], J.y + rot(face * 6 * s, -46 * s, rad(J.tor * face))[1]];
    }
    st.J = J;
    st.tc0 = tc0; st.tc1 = tc1;
    return st;
  }

  SCENES.exit_canopy = function (u, p, d, t) {
    const t0 = t - u;
    const tP = p.tPath ?? (t0 + 3.38), tL = p.tLatch ?? (t0 + 5.25);
    const tt = t + 0.5 * Math.sin(t * 0.9);                // порывы метели
    const OX = 22;                                         // сдвиг здания вправо (чтобы левая стена была в кадре)
    const WX = 88, WW = 18, WINY0 = 182, WINY1 = 226;      // стена в разрезе и проём окна 214 (локальные x до сдвига)
    const FL2 = 252, CY = 264, CX0 = 106, CX1 = 186, DROP = 352;
    // ч.2: тревога, фигура Тёмы, дуга прыжка (та же, что у жёлтого пунктира)
    const sirA = sirenE(p.siren, t);
    const F = p.fig ? { ...p.fig } : null;
    if (F) {
      F.tOut = F.tOut ?? (t0 + 0.2); F.tClose = F.tClose ?? (F.tOut + 2.0);
      F.tJump = F.tJump ?? (F.tClose + 3.4); F.tLand = F.tLand ?? (F.tJump + 0.79);
    }
    const ARC = q => [181 + (216 - 181) * q, (CY - 10) + ((DROP - 5) - (CY - 10)) * q * q];
    const fs = F ? figState(t, F, ARC) : null;
    let g = R(-20, -20, 400, 680, '#050b18');
    g += G(snow(0, 0, 360, GROUND, tt, 110, 3, -60, .42));

    // ---- здание в разрезе (локальные координаты, затем сдвиг OX)
    let b = '';
    b += R(-8, 128, 96, FL2 - 128, '#0d1a33') + R(-8, FL2 + 12, 96, GROUND - FL2 - 12, '#0c1730');      // каб. 214 и холл
    b += Ci(60, 336, 62, 'url(#glowW)', 'opacity=".22"');
    b += R(-8, FL2, 96, 12, '#1d2b46');
    b += R(-18, 124, 10, GROUND - 124, '#1d2b46');                                                       // дальняя (левая) стена
    b += R(WX, 124, WW, GROUND - 124, '#1d2b46') + L(WX + WW, 128, WX + WW, GROUND, '#2c3f63', 1);
    b += R(WX, WINY0, WW, WINY1 - WINY0, '#08122a');                                                     // проём окна
    b += R(WX, 312, WW, GROUND - 312, '#3a2a1a') + R(WX, 312, WW, GROUND - 312, 'rgba(255,200,120,.10)'); // дверной проём
    b += R(-18, 118, 136, 10, '#1a2740') + P('M-18 118 Q 20 110 54 114 T 118 115 V119 H-18 Z', '#cfd8e6', 'opacity=".6"');
    b += R(CX0, WINY1 - 1, 5, 3, '#2f3f5e');                                                             // наружный подоконник
    b += T(2, 144, '214', 7, '#8f9bb0', MONO) + T(2, 277, 'ВХОД', 6.5, '#6f7c92', MONO);
    // мебель в 214 и холле
    b += R(4, 234, 34, 3.5, '#1a2742') + R(7, 237.5, 2.2, 14.5, '#142038') + R(32, 237.5, 2.2, 14.5, '#142038');
    b += R(26, 244, 13, 2.4, '#172540') + R(36, 232, 2.2, 14, '#172540');
    b += R(6, 342, 44, 3.2, '#18233f') + R(10, 345, 2, 18, '#101828') + R(44, 345, 2, 18, '#101828');
    // контуры комнат как на схеме школы
    b += R(-8, 128, 96, FL2 - 128, 'none', 'stroke="#9fb0c8" stroke-width="1.1" opacity=".42"');
    b += R(-8, FL2 + 12, 96, GROUND - FL2 - 12, 'none', 'stroke="#9fb0c8" stroke-width="1.1" opacity=".3"');
    if (sirA !== null) {
      // тревога внутри: всё здание в разрезе дышит красным
      b += R(-18, 118, 124, GROUND - 118, `rgba(215,38,61,${f1(sirA)})`);
    }
    if (p.hornLump) {
      // кронштейн и раструб (повёрнут вниз-вправо), почти целиком под снегом: виден только тёмный край
      b += L(WX + WW, 235.5, 110, 237, '#2c3650', 1.5);
      b += P('M108.4 236.4 L111.2 235.2 L117.6 240.4 L113.8 243.6 Z', '#3a4560');
      b += L(117.6, 240.4, 113.8, 243.6, '#6f7b93', 1, 'stroke-linecap="round"') + P('M116.8 241 L114.4 243 L115.4 241.4 Z', '#0d1322');
      // снежная шапка на нём: налипший ком, не ярче снега на козырьке
      b += P('M106 239.8 C 105.8 235.4, 108.6 233.2, 111.8 233.4 C 115 233.6, 117.6 235.8, 117.2 238.8 C 116.6 240.6, 114.2 240.4, 112.2 241.2 C 110.2 242, 107.2 241.8, 106 239.8 Z', '#aab6ca', 'opacity=".9"');
      b += P('M106.6 240.4 C 108.6 241.6, 110.6 241.2, 112.2 240.6 C 114 239.9, 115.8 240.1, 116.9 239.2 C 116.2 240.9, 114.2 240.8, 112.3 241.6 C 110.4 242.4, 107.8 242.2, 106.6 240.4 Z', '#6d7b96', 'opacity=".8"');
      b += P('M107.6 235.6 C 109.2 234.2, 111.6 233.9, 113.8 234.6', 'none', 'stroke="#dfe6f0" stroke-width=".7" opacity=".55" stroke-linecap="round"');
    }

    // козырёк, лампа
    b += L(CX0, 292, CX1 - 4, CY + 8, '#33456a', 1.4);
    b += R(CX0, CY, CX1 - CX0, 6, '#2a3a58');
    b += P(`M${CX0} ${CY} Q ${CX0 + 18} ${CY - 6} ${CX0 + 40} ${CY - 3} T ${CX1} ${CY - 2} V${CY + 1} H${CX0} Z`, '#cfd8e6', 'opacity=".85"');
    const lampF = 1 + 0.07 * noise1(t * 7) + 0.03 * noise1(t * 19);
    b += Ci(130, 290, 50 * lampF, 'url(#glowW)', 'opacity=".6"') + R(128, CY + 6, 4, 5, '#3a4560') + Ci(130, CY + 14, 2.8, '#ffe9b0');
    // земля и сугроб
    b += R(-30, GROUND - 6, 420, 6, '#8e9bb2', 'opacity=".5"');
    b += P(`M150 ${GROUND} C 172 ${GROUND}, 190 ${DROP + 6}, 216 ${DROP} C 246 ${DROP - 2}, 268 ${GROUND - 8}, 330 ${GROUND} Z`, '#c4d0e2', 'opacity=".9"');
    b += P(`M216 ${DROP + 2} C 246 ${DROP}, 268 ${GROUND - 8}, 330 ${GROUND} L 232 ${GROUND} C 232 ${GROUND - 10} 226 ${DROP + 8} 216 ${DROP + 2} Z`, '#8c9bb6', 'opacity=".45"');
    b += R(-30, GROUND, 420, 640 - GROUND, '#070d1a') + L(-30, GROUND, 420, GROUND, '#2a3b5c', 2);
    if (sirA !== null) {
      // отсвет из окна и двери: на фасад снаружи и на снег (козырёк, полоса у стены, сугроб)
      b += Ci(WX + WW + 10, 204, 60, 'url(#glowR)', `opacity="${f1(sirA * 0.9)}"`) + Ci(WX + WW + 10, 342, 72, 'url(#glowR)', `opacity="${f1(sirA * 0.8)}"`);   // пик glowR .6 -> ≤.13
      const red = `rgba(215,38,61,${f1(sirA * 0.75)})`;
      b += P(`M${CX0} ${CY} Q ${CX0 + 18} ${CY - 6} ${CX0 + 40} ${CY - 3} T ${CX1} ${CY - 2} V${CY + 1} H${CX0} Z`, red);
      b += R(-30, GROUND - 6, 420, 6, `rgba(215,38,61,${f1(sirA * 0.6)})`);
      b += P(`M150 ${GROUND} C 172 ${GROUND}, 190 ${DROP + 6}, 216 ${DROP} C 246 ${DROP - 2}, 268 ${GROUND - 8}, 330 ${GROUND} Z`, `rgba(215,38,61,${f1(sirA * 0.5)})`);
    }
    if (fs) for (const [dx, r] of fs.dents) b += `<ellipse cx="${f1(dx)}" cy="${f1(snowTop(dx) + 0.2)}" rx="${f1(r)}" ry="1.1" fill="rgba(58,76,110,.55)"/>`;

    // Тёма в 214
    if (!F) {
      const wk = ease(lin(u, 0.1, 1.3));
      const tx = mix(28, 72, wk);
      const reachT = ease(lin(t, tL - 0.45, tL - 0.1)) * (1 - ease(lin(t, tL + 1.1, tL + 1.5)));
      const aa = armAngle(tx, FL2, 48, 1, 0, 90, 207);
      b += person({ x: tx, y: FL2, h: 48, face: 1, pose: (u < 1.4 ? 'walk' : 'stand'), t: u, arm: reachT > 0 ? mix(8, aa, reachT) : null });
    }
    // створка окна: после шпингалета откидывается внутрь
    let open = ease(lin(t, tL + 0.85, tL + 1.35));
    if (F) open *= 1 - ease(lin(t, F.tClose + 0.12, F.tClose + 0.46));
    b += G(L(97, WINY1 - 1, 97, WINY0 + 1, '#6f8bb5', 1.6, 'opacity=".85"') + R(95, WINY0, 4, 3, '#33456a') + R(95, WINY1 - 3, 4, 3, '#33456a'), `rotate(${f1(-15 * open)} 97 ${WINY1 - 1})`);
    if (open > 0.05) for (let i = 0; i < 5; i++) {
      const e = frac(t * 0.9 + i * 0.2);
      b += Ci(112 - e * 70, 192 + hash(i) * 26 + e * 10, 1 + 0.6 * hash(i + 2), `rgba(225,235,248,${f1(0.7 * open * (1 - e))})`);
    }
    g += G(b, `translate(${OX},0)`);

    // ---- метель поверх здания
    g += G(snow(0, 0, 360, GROUND, tt, 70, 11, -90, .75));
    for (let i = 0; i < 9; i++) {
      const sp = 150 + hash(i * 1.7) * 110, xx = (((hash(i * 4.1) * 520) - t * sp) % 520 + 520) % 520 - 80, yy = 130 + hash(i * 2.3) * 230;
      g += L(xx, yy, xx + 30 + hash(i) * 20, yy + 4, 'rgba(210,222,240,.11)', 1, 'stroke-linecap="round"');
    }

    // ---- подсветка окна «Окно выходит…»
    const hlA = lin(t, t0 + 2.4, t0 + 2.7) * (1 - lin(t, tP + 0.1, tP + 0.6));
    if (hlA > 0) {
      const pu = 0.65 + 0.35 * Math.sin(t * 7);
      g += R(83 + OX, WINY0 - 5, WW + 10, WINY1 - WINY0 + 10, 'none', `stroke="${C.yellow}" stroke-width="1.6" stroke-dasharray="4 3" opacity="${f1(hlA * pu)}"`);
    }

    // ---- путь: окно -> козырёк -> сугроб
    const ax0 = 181 + OX, ay0 = CY - 10, ax1 = 216 + OX, ay1 = DROP - 5;
    const arc = [];
    for (let i = 0; i <= 14; i++) { const s = i / 14; arc.push([ax0 + (ax1 - ax0) * s, ay0 + (ay1 - ay0) * s * s]); }
    const pts = [[99 + OX, 205], [126 + OX, ay0], [ax0, ay0]].concat(arc.slice(1));
    const prog = lin(t, tP, tP + 1.6);
    let ps = '';                                           // план (пунктир + «3 М»); ч.2: p.pathDim — общая прозрачность
    if (prog > 0) {
      const pg = ease(prog) * 0.4 + prog * 0.6;
      const pd = polyDash(pts, pg, C.yellow, 1.7, 4.2, 3.2);
      ps += polyDash(pts, pg, 'rgba(255,207,46,.16)', 5.5, 7.4, 0).svg;
      ps += pd.svg;
      if (prog < 1) ps += Ci(pd.head[0], pd.head[1], 8, 'rgba(255,207,46,.28)') + Ci(pd.head[0], pd.head[1], 2.6, C.yellow);
      else {
        const dx = ax1 - ax0, dy = 2 * (ay1 - ay0), ln = Math.hypot(dx, dy), ux = dx / ln, uy = dy / ln;
        const ex = ax1 + ux * 3, ey = ay1 + uy * 3;
        ps += P(`M${f1(ex)} ${f1(ey)} L${f1(ex - ux * 8 - uy * 4.2)} ${f1(ey - uy * 8 + ux * 4.2)} L${f1(ex - ux * 8 + uy * 4.2)} ${f1(ey - uy * 8 - ux * 4.2)} Z`, C.yellow);
        const pa = frac((t - tP - 1.6) * 0.9);
        if (!F) ps += Ci(ax1 + 3, DROP + 3, 5 + 20 * pa, 'none', `stroke="${C.yellow}" stroke-width="1.2" opacity="${f1(0.7 * (1 - pa))}"`);
        else {    // ч.2: цель пульсирует, пока Тёма не приземлился; бегущей метки нет — по пути идёт сам Тёма
          const ra = 0.7 * (1 - pa) * (1 - lin(t, F.tLand - 0.1, F.tLand + 0.1));
          if (ra > 0) ps += Ci(ax1 + 3, DROP + 3, 5 + 20 * pa, 'none', `stroke="${C.yellow}" stroke-width="1.2" opacity="${f1(ra)}"`);
        }
        // бегущая метка по готовому пути
        const run = frac((t - tP - 1.7) / 1.8);
        const pr = polyDash(pts, ease(run), C.yellow, 0, 1, 1);
        if (!F) ps += Ci(pr.head[0], pr.head[1], 2.2, '#fff6cf', `opacity="${f1(0.9 * (1 - lin(run, 0.8, 1)))}"`);
      }
    }

    // ---- размерная линия «3 м» между козырьком и сугробом
    {
      const xd = 288, yA = CY - 3, yB = DROP;
      const dp = ease(lin(t, tP + 1.45, tP + 1.85));
      if (dp > 0) {
        ps += L(CX1 + OX + 4, yA, xd + 6, yA, '#9fb0c8', 1, `stroke-dasharray="2 2" opacity="${f1(0.7 * dp)}"`);
        ps += L(ax1 + 6, yB, xd + 6, yB, '#9fb0c8', 1, `stroke-dasharray="2 2" opacity="${f1(0.7 * dp)}"`);
        const ym = mix(yA, yB, dp);
        ps += L(xd, yA, xd, ym, '#e8edf5', 1.5);
        ps += P(`M${xd} ${yA} l-3 7 h6 Z`, '#e8edf5');
        if (dp > 0.98) ps += P(`M${xd} ${yB} l-3 -7 h6 Z`, '#e8edf5');
        const la = lin(t, tP + 1.7, tP + 2.0);
        if (la > 0) ps += T(xd - 9, (yA + yB) / 2 + 4, '3 М', 12, '#f0f4fa', `${MONO} text-anchor="end" opacity="${f1(la)}"`);
      }
    }
    g += p.pathDim != null ? G(ps, '', `opacity="${f1(p.pathDim)}"`) : ps;

    // ---- ч.2: Тёма (p.fig) — поверх плана, чтобы движение читалось; ниже — сугроб поверх ног и облака снега
    if (fs) {
      const J = fs.J, tO = F.tOut, tC = F.tClose, tJ = F.tJump, tLd = F.tLand;
      let fg = '';
      // контровой свет: тонкий холодный ореол, чтобы тёмный костюм не терялся на ночном небе
      fg += Ci(J.x + rot(0, -16 * J.s, rad(J.tor * J.face))[0], J.y + rot(0, -16 * J.s, rad(J.tor * J.face))[1], 26, 'url(#glowC)', 'opacity=".45"');
      if (t > tJ && t < tLd) {
        const q = lin(t, tJ, tLd), a = 0.5 * lin(q, 0.12, 0.3);   // скоростные штрихи позади, вдоль дуги
        for (let k = 0; k < 3; k++) {
          const q1 = q - 0.07 - 0.05 * k, q2 = q1 - 0.12;
          if (q2 < 0) continue;
          const o = (k - 1) * 4.5, A = ARC(q1), B = ARC(q2);
          fg += L(A[0] - o, A[1] - 6 + o * 0.3, B[0] - o, B[1] - 6 + o * 0.3, '#dfe7f3', 1, `stroke-linecap="round" opacity="${f1(a * (1 - 0.25 * k))}"`);
        }
      }
      fg += kidSvg(J);
      // снежная пыль: приземлился на козырёк / стук створки / ком с края при прыжке
      const puff = (x, y, tt0, n, rr, dur, seed) => {
        const e = lin(t, tt0, tt0 + dur);
        if (e <= 0 || e >= 1) return '';
        let q = '';
        for (let i = 0; i < n; i++) {
          const an = rad(190 + 160 * hash(i * 3.7 + seed)), sp = rr * (0.5 + 0.5 * hash(i * 1.3 + seed));
          const px = x + Math.cos(an) * sp * eout(e), py = y + Math.sin(an) * sp * 0.7 * eout(e) + 9 * e * e;
          q += Ci(px, py, 0.7 + 0.8 * hash(i + seed), `rgba(228,236,248,${f1(0.8 * (1 - e))})`);
        }
        return q;
      };
      fg += puff(117, 261, tO + 0.86, 9, 9, 0.45, 1);
      fg += puff(103, 225.5, tC + 0.45, 6, 6, 0.4, 2);
      {   // снег осыпается с края козырька при толчке
        const e = lin(t, tJ - 0.02, tJ + 0.7);
        if (e > 0 && e < 1) for (let i = 0; i < 6; i++) {
          const dt = (t - tJ) - 0.04 * i;
          if (dt < 0) continue;
          fg += Ci(184 + 3 * hash(i * 2.1) + 6 * dt, 262 + 60 * dt * dt + 4 * dt, 0.8 + 0.6 * hash(i), `rgba(228,236,248,${f1(0.85 * (1 - e))})`);
        }
      }
      g += G(fg, `translate(${OX},0)`);
      if (t >= tLd - 0.02) {
        let dr = '';
        // сугроб перерисован поверх: Тёма в нём по плечи (подложка цвета неба — иначе фигура просвечивает сквозь .9)
        dr += P(`M150 ${GROUND} C 172 ${GROUND}, 190 ${DROP + 6}, 216 ${DROP} C 246 ${DROP - 2}, 268 ${GROUND - 8}, 330 ${GROUND} Z`, '#050b18');
        dr += P(`M150 ${GROUND} C 172 ${GROUND}, 190 ${DROP + 6}, 216 ${DROP} C 246 ${DROP - 2}, 268 ${GROUND - 8}, 330 ${GROUND} Z`, '#c4d0e2', 'opacity=".9"');
        dr += P(`M216 ${DROP + 2} C 246 ${DROP}, 268 ${GROUND - 8}, 330 ${GROUND} L 232 ${GROUND} C 232 ${GROUND - 10} 226 ${DROP + 8} 216 ${DROP + 2} Z`, '#8c9bb6', 'opacity=".45"');
        if (sirA !== null) dr += P(`M150 ${GROUND} C 172 ${GROUND}, 190 ${DROP + 6}, 216 ${DROP} C 246 ${DROP - 2}, 268 ${GROUND - 8}, 330 ${GROUND} Z`, `rgba(215,38,61,${f1(sirA * 0.5)})`);
        // края воронки вокруг него
        const sk = eout(lin(t, tLd, tLd + 0.16));
        const lip = (cx, cy, rx, ry) => P(`M${f1(cx - rx)} ${f1(cy)} A ${f1(rx)} ${f1(ry)} 0 0 1 ${f1(cx + rx)} ${f1(cy)} Z`, '#b5c0d2') +
          P(`M${f1(cx - rx * 0.7)} ${f1(cy - ry * 0.55)} A ${f1(rx * 0.8)} ${f1(ry * 0.8)} 0 0 1 ${f1(cx + rx * 0.5)} ${f1(cy - ry * 0.75)}`, 'none', 'stroke="#d6dfeb" stroke-width=".7" opacity=".7"');
        if (sk > 0.05) dr += lip(J.x - 8, DROP + 1.6, 5.5 * sk, 3 * sk) + lip(J.x + 8.5, DROP + 1.0, 6 * sk, 3.2 * sk);
        // облако снега r 0 -> 28 и комья
        const c = t - tLd;
        if (c < 1.6) {
          const R0 = 28 * eout(lin(c, 0, 0.5)), fa = 1 - lin(c, 0.25, 1.6);
          dr += `<ellipse cx="216" cy="${f1(DROP - 2 - 3 * c)}" rx="${f1(R0 * 0.95)}" ry="${f1(R0 * 0.55)}" fill="rgba(222,230,243,${f1(0.32 * fa)})"/>`;
          for (let i = 0; i < 18; i++) {
            const an = rad(185 + 170 * hash(i * 2.9)), rr = R0 * Math.sqrt(0.08 + 0.92 * hash(i * 1.7));
            const px = 216 + Math.cos(an) * rr, py = DROP - 1 + Math.sin(an) * rr * 0.75 - (4 + 6 * hash(i * 3.3)) * c;
            const pr = (3 + 4.5 * hash(i * 4.3)) * (0.35 + 0.65 * eout(lin(c, 0, 0.45))) * (1 + 0.35 * c);
            dr += Ci(px, py, pr, `rgba(226,234,246,${f1(0.5 * fa * (0.6 + 0.4 * hash(i * 7.1)))})`);
          }
          for (let i = 0; i < 10; i++) {
            const vx = (hash(i * 5.1) - 0.5) * 70, vy = -40 - 50 * hash(i * 6.3), cc = Math.min(c, 0.9);
            const px = 216 + vx * cc, py = DROP - 2 + vy * cc + 160 * cc * cc;
            if (py < DROP + 2) dr += Ci(px, py, 0.9 + 0.7 * hash(i), `rgba(236,241,250,${f1(0.9 * (1 - lin(c, 0.4, 0.9)))})`);
          }
        }
        // пар изо рта
        if (fs.mouth && c > 1.0) {
          for (let k = 0; k < 2; k++) {
            const e = frac((c - 1.0) / 1.25 - k * 0.5);
            const fc = J.face, mx = fs.mouth[0] + fc * (2 + 7 * e), my = fs.mouth[1] - 7 * e;
            dr += Ci(mx, my, 1.2 + 3.6 * eout(e), `rgba(220,230,245,${f1(0.42 * (1 - e) * lin(e, 0, 0.12))})`);
          }
        }
        g += G(dr, `translate(${OX},0)`);
      }
    }

    // ---- врезка-кружок со шпингалетом (ч.2: latchInset:false — без неё)
    if (p.latchInset !== false) {
      const ia = lin(t, tL, tL + 0.12), sc = 0.55 + 0.45 * eout(lin(t, tL, tL + 0.30));
      if (ia > 0) {
        const cx = 256, cy = 180, rr = 44;
        g += L(WX + WW + 2 + OX, 204, cx - rr + 4, cy + 8, 'rgba(207,216,230,.35)', 1, `stroke-dasharray="2 3" opacity="${f1(ia)}"`);
        g += Ci(97 + OX, 204, 7, 'none', `stroke="${C.yellow}" stroke-width="1.2" opacity="${f1(ia * (0.6 + 0.4 * Math.sin(t * 8)))}"`);
        const wind = -1.6 * Math.sin(Math.PI * lin(t, tL + 0.30, tL + 0.46));
        const sl = ease(lin(t, tL + 0.50, tL + 0.78));
        const rx0 = -19 - 21 * sl + wind;
        const ck2 = t - (tL + 0.78);
        let s = '';
        s += R(-50, -50, 100, 100, '#6b7a92');
        s += R(-50, -50, 52, 100, '#7a89a1') + R(-50, -50, 52, 6, '#8f9db4') + R(2, -50, 48, 100, '#66758d');
        for (let i = 0; i < 7; i++) s += L(-50, -40 + i * 14 + hash(i) * 4, 2, -40 + i * 14 + hash(i + 5) * 4 + 2, 'rgba(40,55,80,.18)', 1);
        s += R(-2, -50, 4, 100, '#030a18');
        s += `<g opacity="${f1(0.5 * sl)}">${Ci(0, -20 + ((t * 30) % 40), 1, '#e8f1ff')}${Ci(0, 8 + ((t * 24) % 36) - 20, 0.9, '#e8f1ff')}</g>`;
        s += R(-41, -10, 42, 20, 'rgba(0,0,0,.25)', 'rx="4"') + R(-42, -11, 42, 20, '#d4dae4', 'rx="4"') + R(-42, -11, 42, 3, '#eef2f7', 'rx="2"');
        s += R(-30, -7, 6, 12, '#a3aebf', 'rx="1.5"') + R(-12, -7, 6, 12, '#a3aebf', 'rx="1.5"');
        s += Ci(-37, 0, 1.6, '#6a7587') + Ci(-4, 0, 1.6, '#6a7587');
        s += R(3, -10, 20, 20, 'rgba(0,0,0,.25)', 'rx="3"') + R(2, -11, 20, 20, '#c7cfda', 'rx="3"') + R(5, -3.2, 15, 6.4, '#080d17', 'rx="2"');
        s += Ci(7, -7, 1.3, '#6a7587') + Ci(7, 5, 1.3, '#6a7587');
        s += R(rx0, -2.4, 36, 4.8, '#f0f3f8', 'rx="2.4"') + R(rx0, -2.4, 36, 1.5, '#ffffff', 'rx=".7"') + R(rx0, 0.6, 36, 1.8, '#a9b3c3', 'rx=".9"');
        s += R(rx0 + 9, -13, 3, 11, '#c4ccd8', 'rx="1.2"') + Ci(rx0 + 10.5, -14.5, 4.6, '#e6ebf2') + Ci(rx0 + 9.2, -15.8, 1.5, '#ffffff');
        if (ck2 > 0 && ck2 < 0.4) {
          const e = ck2 / 0.4;
          s += Ci(-8, 0, 5 + 26 * eout(e), 'none', `stroke="#fff" stroke-width="1.4" opacity="${f1(0.75 * (1 - e))}"`);
          for (let i = 0; i < 5; i++) { const an = rad(150 + i * 15), r0 = 10, r1 = 15 + 10 * eout(e); s += L(-8 + Math.cos(an) * r0, Math.sin(an) * r0, -8 + Math.cos(an) * r1, Math.sin(an) * r1, '#fff6cf', 1.4, `opacity="${f1(1 - e)}" stroke-linecap="round"`); }
        }
        s += Ci(0, 0, 44, 'none', 'stroke="rgba(0,0,0,.5)" stroke-width="10"');
        const z = 1 + 0.03 * lin(t, tL, tL + 2);
        g += G(
          `<clipPath id="eLC"><circle cx="0" cy="0" r="44"/></clipPath>` +
          Ci(0, 0, 48, '#02050b') +
          G(G(s, `scale(${f1(z)})`), '', 'clip-path="url(#eLC)"') +
          Ci(0, 0, 47, 'none', 'stroke="url(#ring)" stroke-width="5"'),
          `translate(${cx},${cy}) scale(${f1(sc)})`, `opacity="${f1(ia)}"`);
      }
    }
    return g;
  };
})();

// сцена smart_speaker: умная колонка крупно на тумбочке в темноте (стакан воды, угол телефона, свет кольца на стене и столешнице)
//   p.ring   — [[t0,t1,'listen'|'speak'], ...] состояние кольца (вне интервалов — мягкое синее дежурное свечение)
//   p.unplug — абсолютное время рывка. Пока передан, шнур виден всегда: из-за колонки по столешнице за стаканом к правому краю (к розетке).
//              −0.6 с: справа сверху входит рука Даши (кисть + рукав светлой пижамы), пальцы смыкаются на шнуре за стаканом и приподнимают его;
//              t: рывок вправо — шнур натягивается, штекер выскакивает из-за колонки, шнур хлещет и уходит за край;
//              кольцо гаснет по кругу за 0.3 с (последний, передний сегмент мигает красным), свет на стене/столе пропадает, рябь стихает;
//              +0.4…1.0 с: рука медленно уходит. Дальше — тёмная колонка в слабом свете фонаря.
//   p.glitch — [t, ...] кольцо на 0.12 с краснеет и дёргается
//   p.redRing — [[t0,t1], ...]: красное слушающее кольцо, резкое включение с двумя короткими провалами света за 0.18 с.
//                 Времена абсолютные, конец интервала исключён; unplug и countdown сохраняют приоритет.
//   p.countdown — [t0,t1], абсолютные времена: 12 → 0 красных сегментов равными шагами;
//                 последний (спереди) мигает дважды. С t1 — дежурный режим, независимо от p.ring.
//                 unplug имеет приоритет; без countdown SVG остаётся прежним.
//   speak: кольцо пульсирует по огибающей «речи» (6–9 Гц), свет на стене/столе дышит, по воде в стакане идёт рябь
(() => {
  const CAP = 'stroke-linecap="round" stroke-linejoin="round"';
  const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const hx = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  const mc = (a, b, k) => { const A = hx(a), B = hx(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };
  const CX = 180, TY = 228, BY = 312;                  // центр колонки, центр верхнего эллипса, центр основания
  const RX = 62, RY = 14.6;                            // эллипс кольца света
  const TB = 296;                                      // задний край столешницы
  const BODY = `M102 ${TY} L98 ${BY} A82 16 0 0 0 262 ${BY} L258 ${TY} A78 19 0 0 1 102 ${TY} Z`;
  const arc = (a0, a1) => `M${f1(CX + RX * Math.cos(a0))} ${f1(TY + RY * Math.sin(a0))} A${RX} ${RY} 0 0 1 ${f1(CX + RX * Math.cos(a1))} ${f1(TY + RY * Math.sin(a1))}`;

  // ================= p.unplug: шнур, штекер, рука Даши =================
  const SK = '#b8998e', SK2 = '#8c7479', PJ = '#8d96ae', PJ2 = '#6b7490', PJ3 = '#4c5470';   // кожа и пижама — как в k_bedroom
  const hexm = (a, b, k) => '#' + hx(a).map((v, i) => Math.round(v + (hx(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');
  const rad = d => d * Math.PI / 180;
  const rotv = (v, a) => { const c = Math.cos(rad(a)), s = Math.sin(rad(a)); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; };
  const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
  const lerp2 = (a, b, k) => [mix(a[0], b[0], k), mix(a[1], b[1], k)];
  const nrm = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
  const bez3 = (a, b, c, d, s) => { const m = 1 - s; return [0, 1].map(j => m * m * m * a[j] + 3 * m * m * s * b[j] + 3 * m * s * s * c[j] + s * s * s * d[j]); };
  const bez2 = (a, b, c, s) => { const m = 1 - s; return [0, 1].map(j => m * m * a[j] + 2 * m * s * b[j] + s * s * c[j]); };
  const pt = v => `${f1(v[0])} ${f1(v[1])}`;
  function smooth(pts) {
    let s = '';
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      s += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
    }
    return s;
  }
  // сужающийся сегмент конечности (как в k_bedroom)
  function seg(a, b, wa, wb, fill, extra = '') {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    return P(`M${f1(a[0] + nx * wa / 2)} ${f1(a[1] + ny * wa / 2)} L${f1(b[0] + nx * wb / 2)} ${f1(b[1] + ny * wb / 2)} L${f1(b[0] - nx * wb / 2)} ${f1(b[1] - ny * wb / 2)} L${f1(a[0] - nx * wa / 2)} ${f1(a[1] - ny * wa / 2)} Z`, fill, extra) +
      Ci(a[0], a[1], wa / 2, fill, extra) + Ci(b[0], b[1], wb / 2, fill, extra);
  }
  const PL0 = [238, 297];                   // гнездо питания на задней стенке колонки (скрыто корпусом)
  const GP = [271, 302];                  // где кисть берёт шнур: сразу за правым боком колонки
  const GL = [297, 240];                    // куда приподнимает шнур перед рывком (над стаканом)
  const CEND = [392, 302];                  // к розетке за правым краем
  const PLC = [298, 236], PLE = [410, 270]; // полёт выскочившего штекера: квадратичная Безье PL0 → PLE
  const FLl = [-27, 0], FRl = [25, 1];      // где шнур входит в кулак и выходит из него (локально)

  // поза кисти: G — центр хвата (через него проходит шнур), rot — поворот, curl — 0 раскрыта … 1 сжата
  function handPose(age) {
    const kr = sstep(-0.6, -0.31, age), kg = sstep(-0.37, -0.22, age), kl = sstep(-0.26, -0.05, age);
    const ka = sstep(-0.1, -0.02, age), ky = sstep(0, 0.1, age), kf = sstep(0.08, 0.38, age), kw = sstep(0.42, 1.02, age);
    const S0 = [GP[0] + 125, GP[1] - 170];
    let G = bez3(S0, [S0[0] - 20, S0[1] + 60], [GP[0] + 22, GP[1] - 56], GP, kr);
    G = add(G, [0, -17 * (1 - kg)]);               // раскрытые пальцы касаются столешницы, при хвате кисть опускается на шнур
    G = add(G, [GL[0] - GP[0], GL[1] - GP[1]], kl);
    G = add(G, [-3, 2.5], ka * (1 - ky));          // замах: чуть назад перед рывком
    G = add(G, [28, -15], ky);                     // рывок
    G = add(G, [5, -6], kf);                       // доводка
    G = add(G, [125, -105], kw);                   // медленно уходит
    const rot = -24 * (1 - kr) - 4 * kr - 6 * kl - 9 * ky - 8 * kw;
    return { G, rot, curl: mix(0.12, 1, kg), kl };
  }

  // шнур: точки осевой линии (от штекера/гнезда через кулак к правому краю) и штекер в полёте
  function cordGeom(age, H) {
    const kgc = sstep(-0.31, -0.24, age);
    const cr = H ? mix(0, H.rot, kgc) : 0, Gc = H ? lerp2(GP, H.G, kgc) : GP, kl = H ? H.kl : 0;
    const FL = add(Gc, rotv(FLl, cr)), FR = add(Gc, rotv(FRl, cr)), ld = rotv([-1, 0], cr), rd = rotv([1, 0], cr);
    const N = 16, left = [];
    let plug = null;
    if (age < 0.035) {
      // лежит / приподнят; в t натягивается в струну
      const kt = sstep(0, 0.035, age);
      let b1 = [PL0[0] + 26, PL0[1] + 2], b2 = add(add(FL, ld, 14), [0, 7 * kl]);
      b1 = lerp2(b1, lerp2(PL0, FL, 1 / 3), kt); b2 = lerp2(b2, lerp2(PL0, FL, 2 / 3), kt);
      for (let i = 0; i <= N; i++) left.push(bez3(PL0, b1, b2, FL, i / N));
    } else {
      // штекер выскочил: летит за рукой, свободный конец хлещет затухающей волной
      const sp = clamp((age - 0.035) / 0.25);
      let T = bez2(PL0, PLC, PLE, sp);
      const v = nrm([(1 - sp) * (PLC[0] - PL0[0]) + sp * (PLE[0] - PLC[0]), (1 - sp) * (PLC[1] - PL0[1]) + sp * (PLE[1] - PLC[1])]);
      if (age > 0.285 && H) { const H0 = handPose(0.285); T = add(T, [H.G[0] - H0.G[0], H.G[1] - H0.G[1]]); }
      const d = Math.hypot(FL[0] - T[0], FL[1] - T[1]);
      const dep = nrm(lerp2(ld, nrm([T[0] - FL[0], T[1] - FL[1]]), sstep(0.1, 0.22, age)));
      const b1 = add(T, v, 0.35 * d + 6), b2 = add(add(FL, dep, 0.3 * d + 6), [0, 10 * sstep(0.04, 0.2, age)]);
      const A = 10 * Math.exp(-6 * (age - 0.035)) * sstep(0.035, 0.07, age);
      const raw = [];
      for (let i = 0; i <= N; i++) raw.push(bez3(T, b1, b2, FL, i / N));
      for (let i = 0; i <= N; i++) {
        const s = i / N, a = raw[Math.max(0, i - 1)], b = raw[Math.min(N, i + 1)], tg = nrm([b[0] - a[0], b[1] - a[1]]);
        const w = A * Math.sin(Math.PI * s) * Math.sin(2 * Math.PI * 1.4 * s - 40 * age);
        left.push([raw[i][0] - tg[1] * w, raw[i][1] + tg[0] * w]);
      }
      plug = { p: T, a: Math.atan2(v[1], v[0]) * 180 / Math.PI + 30 * Math.sin(age * 38) * Math.exp(-age * 5) };
    }
    const right = [], c1 = add(add(FR, rd, 16), [0, 9 * kl + 8 * (1 - kl)]), c2 = [Math.max(FR[0] + 32, 342), 307];
    for (let i = 0; i <= N; i++) right.push(bez3(FR, c1, c2, CEND, i / N));
    return { pts: left.concat([Gc], right), plug };
  }

  function cordSvg(pts, hi, lying) {
    const d = `M${pt(pts[0])}` + smooth(pts);
    let s = '';
    if (lying > 0.01) s += P(d, 'none', `stroke="#010207" stroke-width="5.5" opacity="${f1(0.6 * lying)}" transform="translate(1 2.4)" filter="url(#ss_b2)" ${CAP}`);
    s += P(d, 'none', `stroke="#090b12" stroke-width="4.8" ${CAP}`);
    s += P(d, 'none', `stroke="#a9c6f2" stroke-width="1.1" opacity="${f1(hi)}" transform="translate(-0.3 -1.35)" ${CAP}`);
    return s;
  }

  // штекер: корпус-цилиндр, хвостовик к шнуру (вперёд по движению), металлический штырь сзади
  function plugSvg(p, a, lit) {
    let s = '';
    s += P('M1 -2.4 L-5 -3.6 L-5 3.6 L1 2.4 Z', '#0b0e15');
    s += R(-18, -4.2, 13.5, 8.4, '#1d2331', 'rx="2.4"') + R(-17, -3.6, 11.5, 2, '#46516a', 'rx="1" opacity=".85"');
    s += L(-12, -4, -12, 4, '#0b0e15', 0.8);
    s += R(-24, -1.9, 6.5, 3.8, '#8e9ab0', 'rx=".7"') + R(-24, -1.9, 6.5, 1.2, '#eef4ff', `opacity="${f1(0.35 + 0.5 * lit)}"`);
    return G(s, `translate(${pt(p)}) rotate(${f1(a)})`);
  }

  // кисть Даши, вид с тыльной стороны (левая рука, большой палец слева); центр хвата в (0,0), шнур идёт по оси x
  //   c: 0 — пальцы раскрыты, 1 — кулак на шнуре; lit — свет кольца; dim — потемнение после выключения; sil — только силуэт (для тени на стене)
  function handSvg(c, lit, dim, sil) {
    const S = col => sil || col;
    const sk = S(hexm(hexm(SK, '#7f819f', 0.2), '#2f2b38', 0.6 * dim)), skD = S(hexm(hexm(SK2, '#5f6386', 0.2), '#211e29', 0.6 * dim));
    const skL = hexm('#dcc5bb', '#4c4556', 0.6 * dim), OL = S(hexm('#46363f', '#14111a', 0.5 * dim));
    const pj = S(hexm(hexm(PJ, '#2a3046', 0.2), '#262b3d', 0.6 * dim)), pj2 = S(hexm(hexm(PJ2, '#1a1f30', 0.25), '#1b1f2d', 0.6 * dim)), pj3 = hexm(PJ3, '#161a26', 0.5 * dim);
    const RIM = '#b4d2ff', rimA = 0.62 * lit;
    const W = [8, -41], u = rotv([1, 0], -50), n = [-u[1], u[0]];   // запястье; u — вдоль предплечья вверх-вправо, n — вниз-вправо
    const at = (l, k) => add(add(W, u, l), n, k);
    let h = '';
    // предплечье (голое у запястья) и рукав пижамы
    h += seg(W, at(46, 0), 25.6, 30, OL) + seg(W, at(46, 0), 24, 28.4, sk);
    h += P(`M${pt(at(15, -19))} Q${pt(at(11, 0))} ${pt(at(16, 20))} L${pt(at(180, 25))} L${pt(at(180, -25))} Z`, pj2, sil ? '' : `stroke="${OL}" stroke-width="1.2"`);
    if (!sil) {
      h += P(`M${pt(at(15, -19))} Q${pt(at(13, -8))} ${pt(at(13.5, -2))} L${pt(at(180, -4))} L${pt(at(180, -25))} Z`, pj);
      h += P(`M${pt(at(18.5, -18.6))} Q${pt(at(15, 0))} ${pt(at(19.5, 19.6))}`, 'none', `stroke="${pj3}" stroke-width="1.3" ${CAP}`);
      // дальше от кольца рукав уходит в тень
      h += `<linearGradient id="ss_slv" gradientUnits="userSpaceOnUse" x1="${f1(at(24, 0)[0])}" y1="${f1(at(24, 0)[1])}" x2="${f1(at(120, 0)[0])}" y2="${f1(at(120, 0)[1])}"><stop offset="0" stop-color="#050913" stop-opacity="0"/><stop offset="1" stop-color="#050913" stop-opacity=".6"/></linearGradient>`;
      [[40, 1], [64, 0.8], [96, 1]].forEach(([l, o]) => {
        h += P(`M${pt(at(l, -21))} Q${pt(at(l + 9, -3))} ${pt(at(l + 4, 14))}`, 'none', `stroke="${pj3}" stroke-width="1.2" opacity="${f1(0.75 * o)}" ${CAP}`);
        h += P(`M${pt(at(l - 2.4, -20))} Q${pt(at(l + 6, -5))} ${pt(at(l + 2, 8))}`, 'none', `stroke="#c9d1e6" stroke-width=".9" opacity="${f1(0.2 * o * (1 - 0.7 * dim))}" ${CAP}`);
      });
      h += L(at(15, -19)[0], at(15, -19)[1], at(180, -25)[0], at(180, -25)[1], RIM, 1.4, `opacity="${f1(rimA * 0.8)}" ${CAP}`);
      h += L(W[0] - n[0] * 12.4, W[1] - n[1] * 12.4, at(15, -13.6)[0], at(15, -13.6)[1], RIM, 1.1, `opacity="${f1(rimA * 0.7)}" ${CAP}`);
    }
    if (!sil) h += P(`M${pt(at(14, -26))} L${pt(at(181, -26))} L${pt(at(181, 26))} L${pt(at(14, 26))} Z`, 'url(#ss_slv)');
    // тыльная сторона ладони
    const DOR = 'M-20 -8 C-22 -19 -13.5 -38 -1.6 -48.8 L17.6 -33.4 C20.2 -25 20 -15 18.6 -6 Z';
    h += P(DOR, sk);
    if (!sil) h += P('M-1.6 -48.8 C-13.5 -38 -22 -19 -20 -8 M18.6 -6 C20 -15 20.2 -25 17.6 -33.4', 'none', `stroke="${OL}" stroke-width="1.3" ${CAP}`);
    if (!sil) {
      h += P('M17.6 -33.4 C20.2 -25 20 -15 18.6 -6 L9.5 -8 C12 -17 11.5 -26 7.4 -37 Z', skD, 'opacity=".5"');
      [[-14.5, 0], [-4.6, 1], [5.2, 2], [14, 3]].forEach(([x, i]) => h += P(`M${f1(x * 0.92)} -14 Q${f1(x * 0.6 + 1)} -26 ${f1(2 + i * 3.6)} -38`, 'none', `stroke="${skD}" stroke-width=".8" opacity=".35" ${CAP}`));
    }
    // четыре пальца. Кулак: основные фаланги закрывают шнур спереди, на сгибе пальцы уходят назад к ладони (тёмный подворот)
    const KX = [-14.5, -4.6, 5.2, 14], KY = [-10, -10.6, -10, -8.6], FW = [10, 10.4, 9.6, 8.4];
    const LC = [15, 16, 15, 12.5], LO = [29, 31, 29, 24], AC = [-2, -0.6, 0.6, 2.5], AO = [-10, -3, 3, 10];
    for (const i of [3, 2, 1, 0]) {
      const Lf = mix(LO[i], LC[i], c), a = mix(AO[i], AC[i], c), d = [Math.sin(rad(a)), Math.cos(rad(a))];
      const K = [KX[i], KY[i]], s0 = add(K, d, -4), T = add(K, d, Lf), w = FW[i], pp = [d[1], -d[0]], tk = 4.8 * c;
      if (tk > 0.3) h += seg(T, add(T, d, tk), w * 0.86 + 1.8, w * 0.66 + 1.8, OL) + seg(T, add(T, d, tk), w * 0.86, w * 0.66, skD);
      h += seg(s0, T, w + 1.8, w * 0.92 + 1.8, OL) + seg(s0, T, w, w * 0.92, sk);
      if (sil) continue;
      h += seg(add(add(K, pp, -w * 0.3), d, -1), add(add(T, pp, -w * 0.28), d, -1), w * 0.3, w * 0.28, skD, 'opacity=".4"');
      h += `<ellipse cx="${f1(K[0])}" cy="${f1(K[1] - 0.4)}" rx="${f1(w * 0.34)}" ry="1.8" fill="${skL}" opacity=".4"/>`;
      if (c > 0.4) h += P(`M${pt(add(add(T, pp, -w * 0.3), d, -1.2))} Q${pt(add(T, d, -3.2))} ${pt(add(add(T, pp, w * 0.3), d, -1.2))}`, 'none', `stroke="${skL}" stroke-width="1" opacity="${f1(0.4 * (c - 0.4) / 0.6)}" ${CAP}`);
      if (c < 0.6) {   // ногти на раскрытых пальцах
        const nc = add(K, d, Lf - 3.4);
        h += `<ellipse cx="${f1(nc[0])}" cy="${f1(nc[1])}" rx="${f1(w * 0.3)}" ry="2.7" fill="#e6d3cb" opacity="${f1(0.75 * (1 - c / 0.6))}" transform="rotate(${f1(-a)} ${f1(nc[0])} ${f1(nc[1])})"/>`;
        const m = add(K, d, Lf * 0.55);
        h += P(`M${pt(add(m, pp, -w * 0.36))} Q${pt(add(m, d, 1.6))} ${pt(add(m, pp, w * 0.36))}`, 'none', `stroke="${OL}" stroke-width=".8" opacity=".5" ${CAP}`);
      }
    }
    if (!sil) h += L(KX[0] - FW[0] / 2 - 0.5, KY[0] - 2, KX[0] - FW[0] / 2 - 0.3, KY[0] + mix(LO[0], LC[0], c), RIM, 1.1, `opacity="${f1(rimA * 0.7)}" ${CAP}`);
    // большой палец: обходит шнур слева и ложится поверх указательного
    const B = [-16, -26], M = lerp2([-29, -14], [-25, -9], c), Tt = lerp2([-37, 1], [-12.5, 6.5], c);
    h += seg(B, M, 12.6, 11.2, OL) + seg(M, Tt, 11.2, 9.6, OL) + seg(B, M, 11, 9.6, sk) + seg(M, Tt, 9.6, 8, sk);
    if (!sil) {
      const td = nrm([Tt[0] - M[0], Tt[1] - M[1]]), tn = add(Tt, td, -2.6);
      h += seg(add(B, [2.4, 1.6]), add(M, [3.2, 0.4]), 4, 3.4, skD, 'opacity=".35"');
      h += `<ellipse cx="${f1(tn[0])}" cy="${f1(tn[1] - 0.6)}" rx="2.9" ry="2.1" fill="${skL}" opacity=".6" transform="rotate(${f1(Math.atan2(td[1], td[0]) * 180 / Math.PI)} ${f1(tn[0])} ${f1(tn[1])})"/>`;
      h += P(`M${pt(add(M, [-1.4, -3.4]))} Q${pt(add(M, [2.6, 0]))} ${pt(add(M, [0.6, 3.8]))}`, 'none', `stroke="${OL}" stroke-width=".8" opacity=".6" ${CAP}`);
      // ободок света кольца по левому краю
      h += P(`M${pt(add(B, [-5.6, 0.5]))} Q${pt(add(M, [-6.2, -1]))} ${pt(add(M, [-4.8, 1.6]))} L${pt(add(Tt, [-2.6, 3.4]))}`, 'none', `stroke="${RIM}" stroke-width="1.3" opacity="${f1(rimA)}" ${CAP}`);
      h += P('M-21.1 -12 C-22.1 -21 -14.1 -38.6 -2.4 -49.7', 'none', `stroke="${RIM}" stroke-width="1.2" opacity="${f1(rimA * 0.75)}" ${CAP}`);
    }
    return h;
  }
  const redBlink = age => { const pu = (a, b) => sstep(a, a + 0.025, age) * (1 - sstep(b - 0.025, b, age)); return pu(0.235, 0.33) + 0.7 * pu(0.4, 0.47); };

  SCENES.smart_speaker = function (u, p, d, t) {
    const U = Number.isFinite(p.unplug);
    const age = U ? t - p.unplug : -Infinity;
    const power = 1 - sstep(0, 0.3, age);                // питание: гаснет за 0.3 с после рывка
    const settled = 1 - sstep(0, 0.65, age);             // рябь в стакане стихает
    const win = (a, b) => sstep(a, a + 0.18, t) * (1 - sstep(b - 0.18, b, t));
    let wl = 0, ws = 0;
    (p.ring || []).forEach(([a, b, m]) => { const w = win(a, b); if (m === 'speak') ws = Math.max(ws, w); else wl = Math.max(wl, w); });
    const cd = Array.isArray(p.countdown) && p.countdown.length === 2 &&
      p.countdown.every(Number.isFinite) && p.countdown[1] > p.countdown[0];
    const counting = cd && t >= p.countdown[0] && t < p.countdown[1];
    const cdStep = counting ? 12 * (t - p.countdown[0]) / (p.countdown[1] - p.countdown[0]) : 0;
    const cdLeft = counting ? 12 - Math.floor(cdStep) : 0;
    // Две локальные вспышки только последнего сегмента; частота зависит от длины отсчёта.
    const cdBlink = counting && cdLeft === 1 ? (cdStep - 11 < 0.3 ||
      (cdStep - 11 >= 0.5 && cdStep - 11 < 0.8) ? 1 : 0) : 1;
    if (cd && t >= p.countdown[0]) { wl = counting ? 1 : 0; ws = 0; }
    // Удалённое включение: только локальный свет, без сдвига корпуса и вспышки всего кадра.
    let redStart = -Infinity;
    (p.redRing || []).forEach(([a, b]) => {
      if (Number.isFinite(a) && Number.isFinite(b) && t >= a && t < b) redStart = Math.max(redStart, a);
    });
    const remote = Number.isFinite(redStart) && !(age >= 0) && !counting;   // красное кольцо — после отсчёта и до рывка шнура
    const redAge = t - redStart;
    const redFlicker = remote && ((redAge >= 0.045 && redAge < 0.075) ||
      (redAge >= 0.11 && redAge < 0.14)) ? 0.12 : 1;
    if (remote) { wl = 1; ws = 0; }
    // срыв: красное дёргающееся кольцо 0.12 с
    let gk = 0, gj = 0;
    (p.glitch || []).forEach(tg => { if (t >= tg && t < tg + 0.12) { gk = 1; gj = Math.floor((t - tg) * 50) + 1 + Math.floor(tg * 7); } });
    // огибающая «речи»
    const gate = sstep(-0.3, 0.2, noise1(t * 2.6 + 9));
    const env = (0.5 + 0.5 * Math.sin(2 * Math.PI * 7.1 * t + 2.2 * noise1(t * 3.1)) * (0.8 + 0.2 * Math.sin(2 * Math.PI * 8.4 * t))) * mix(0.3, 1, gate) * 0.75 + 0.25 * gate;
    const speakK = ws * env * settled;
    const ls = (counting ? 0.12 + 0.6 * (cdLeft === 1 ? cdBlink : cdLeft) / 12 :
      Math.min(1.6, 0.42 + 0.3 * wl + 1.0 * speakK + 0.5 * gk)) * power * redFlicker;   // сила света кольца
    const breathe = 1 + 0.04 * noise1(t * 1.7) + 0.015 * noise1(t * 8);
    // цвета кольца: синий -> красный при срыве
    const cDeep = counting || remote ? '#ff3030' : mc('#2f6fe0', '#d7142a', gk), cMid = counting || remote ? '#ff3030' : mc('#78b8ff', '#ff4a4a', gk), cHi = counting || remote ? '#ff3030' : mc('#e3f0ff', '#ffc4bc', gk), cWall = counting || remote ? '#ff3030' : mc('#4a86e8', '#c01a2a', gk);
    const jx = gk ? (hash(gj * 3.1) - 0.5) * 7 : 0, jy = gk ? (hash(gj * 5.3) - 0.5) * 2.4 : 0;

    // ---------- defs
    let g = `<defs>
      <linearGradient id="ss_wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050b18"/><stop offset=".7" stop-color="#0c1730"/><stop offset="1" stop-color="#0e1a33"/></linearGradient>
      <pattern id="ss_pap" width="16" height="10" patternUnits="userSpaceOnUse"><rect width="16" height="10" fill="none"/><rect x="0" y="0" width="1" height="10" fill="#9fb4d8" opacity=".045"/><rect x="8" y="0" width="1" height="10" fill="#9fb4d8" opacity=".02"/></pattern>
      <linearGradient id="ss_tab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#33263a"/><stop offset=".25" stop-color="#271c2e"/><stop offset=".6" stop-color="#150f1c"/><stop offset="1" stop-color="#07060b"/></linearGradient>
      <pattern id="ss_mesh" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx=".75" cy=".75" r=".78" fill="#04060a" opacity=".7"/><circle cx="2.25" cy="2.25" r=".78" fill="#04060a" opacity=".7"/><circle cx=".75" cy=".4" r=".4" fill="#6b7790" opacity=".3"/><circle cx="2.25" cy="1.9" r=".4" fill="#6b7790" opacity=".3"/></pattern>
      <linearGradient id="ss_cyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#232b3b"/><stop offset=".2" stop-color="#3a4558"/><stop offset=".45" stop-color="#47536a"/><stop offset=".75" stop-color="#2a3345"/><stop offset="1" stop-color="#151b27"/></linearGradient>
      <linearGradient id="ss_shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#02040a" stop-opacity=".72"/><stop offset=".16" stop-color="#02040a" stop-opacity=".2"/><stop offset=".42" stop-color="#02040a" stop-opacity="0"/><stop offset=".72" stop-color="#02040a" stop-opacity=".28"/><stop offset="1" stop-color="#02040a" stop-opacity=".82"/></linearGradient>
      <linearGradient id="ss_topl" x1="0" y1="${TY}" x2="0" y2="${TY + 46}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${cMid}" stop-opacity="${f1(Math.min(.62, (.2 + .3 * ls) * power))}"/><stop offset="1" stop-color="${cMid}" stop-opacity="0"/></linearGradient>
      <linearGradient id="ss_botd" x1="0" y1="${BY - 40}" x2="0" y2="${BY + 14}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#02040a" stop-opacity="0"/><stop offset="1" stop-color="#02040a" stop-opacity=".42"/></linearGradient>
      <linearGradient id="ss_rimR" x1="0" y1="0" x2="1" y2="0"><stop offset=".9" stop-color="#ffb55c" stop-opacity="0"/><stop offset="1" stop-color="#ffb55c" stop-opacity=".28"/></linearGradient>
      <radialGradient id="ss_cap" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#1b212d"/><stop offset="1" stop-color="#0a0d14"/></radialGradient>
      <radialGradient id="ss_wg"><stop offset="0" stop-color="${cWall}" stop-opacity="${f1(remote ? .52 * redFlicker : Math.min(.5, .26 * ls))}"/><stop offset=".5" stop-color="${cWall}" stop-opacity="${f1(remote ? .28 * redFlicker : Math.min(.2, .1 * ls))}"/><stop offset="1" stop-color="${cWall}" stop-opacity="0"/></radialGradient>
      <radialGradient id="ss_pool"><stop offset="0" stop-color="${cMid}" stop-opacity="${f1(Math.min(.6, .3 * ls))}"/><stop offset=".55" stop-color="${cDeep}" stop-opacity="${f1(Math.min(.25, .12 * ls))}"/><stop offset="1" stop-color="${cDeep}" stop-opacity="0"/></radialGradient>
      <linearGradient id="ss_cone" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${cMid}" stop-opacity="${f1(Math.min(.5, .3 * ls))}"/><stop offset="1" stop-color="${cMid}" stop-opacity="0"/></linearGradient>
      <linearGradient id="ss_band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb55c" stop-opacity=".2"/><stop offset="1" stop-color="#f09a42" stop-opacity=".03"/></linearGradient>
      <linearGradient id="ss_glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${cMid}" stop-opacity="${f1((.16 + .1 * ls) * power)}"/><stop offset=".3" stop-color="#9fb8d8" stop-opacity=".1"/><stop offset=".75" stop-color="#8aa0c0" stop-opacity=".07"/><stop offset="1" stop-color="#ffb55c" stop-opacity=".16"/></linearGradient>
      <linearGradient id="ss_water" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${cMid}" stop-opacity="${f1((.34 + .16 * ls) * power)}"/><stop offset=".45" stop-color="#5a82b6" stop-opacity=".22"/><stop offset="1" stop-color="#2a3d62" stop-opacity=".24"/></linearGradient>
      <radialGradient id="ss_gsh"><stop offset="0" stop-color="#010207" stop-opacity=".7"/><stop offset="1" stop-color="#010207" stop-opacity="0"/></radialGradient>
      <linearGradient id="ss_ph" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b0f19"/><stop offset="1" stop-color="#05070c"/></linearGradient>
      <radialGradient id="ss_phr" cx=".92" cy=".1" r=".9"><stop offset="0" stop-color="${cMid}" stop-opacity="${f1(Math.min(.8, (.35 + .3 * ls) * power))}"/><stop offset="1" stop-color="${cMid}" stop-opacity="0"/></radialGradient>
      <linearGradient id="ss_refl" x1="0" y1="${BY + 4}" x2="0" y2="${BY + 62}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="ss_rm" maskUnits="userSpaceOnUse" x="0" y="0" width="360" height="640"><rect x="0" y="${BY}" width="360" height="90" fill="url(#ss_refl)"/></mask>
      <radialGradient id="ss_vig" cx=".5" cy=".42" r=".75"><stop offset=".45" stop-color="#010309" stop-opacity="0"/><stop offset="1" stop-color="#010309" stop-opacity=".78"/></radialGradient>
      <linearGradient id="ss_bot" gradientUnits="userSpaceOnUse" x1="0" y1="340" x2="0" y2="374"><stop offset="0" stop-color="#03060c" stop-opacity="0"/><stop offset="1" stop-color="#03060c" stop-opacity="1"/></linearGradient>
      <filter id="ss_b2" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter>
      <filter id="ss_b4" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="4"/></filter>
      <filter id="ss_b9" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter>
      <clipPath id="ss_bodyc"><path d="${BODY}"/></clipPath>
    </defs>`;

    // ================= СТЕНА =================
    g += R(-20, -20, 400, TB + 20, 'url(#ss_wall)') + R(-20, -20, 400, TB + 20, 'url(#ss_pap)');
    // полосы фонаря через жалюзи (мягкие, наискосок)
    let bands = '';
    [[228, 26], [282, 20], [330, 24]].forEach(([x0, w]) => { bands += P(`M${x0} -10 L${x0 + w} -10 L${x0 + w - 98} ${TB + 6} L${x0 - 98} ${TB + 6} Z`, 'url(#ss_band)'); });
    g += G(bands, '', 'filter="url(#ss_b4)"');
    // размытая рамка на стене слева (глубина)
    g += G(R(18, 46, 66, 92, '#0b1427') + R(23, 51, 56, 82, '#101c36') + R(23, 124, 56, 9, '#1a2a4c', 'opacity=".7"'), '', 'filter="url(#ss_b2)" opacity=".7"');
    // свет кольца на стене: конус вверх и общее гало
    g += G(P(`M96 ${TY} L264 ${TY} L318 -10 L42 -10 Z`, 'url(#ss_cone)'), '', 'filter="url(#ss_b9)"');
    g += `<ellipse cx="${CX + jx * 0.4}" cy="${remote ? 184 : 150}" rx="${remote ? 118 : 215}" ry="${remote ? 106 : 175}" fill="url(#ss_wg)"/>`;
    // плинтус-тень у столешницы
    g += R(-20, TB - 7, 400, 7, '#05080f', 'opacity=".75"');

    // ================= СТОЛЕШНИЦА =================
    g += R(-20, TB, 400, 400, 'url(#ss_tab)');
    g += L(-20, TB + 0.6, 380, TB + 0.6, '#4a3a4e', 1.2, 'opacity=".7"');
    g += L(-20, TB + 2.4, 380, TB + 2.4, '#0a0710', 1, 'opacity=".5"');
    let grain = '';
    for (let i = 0; i < 16; i++) {
      const yy = TB + 7 + i * i * 0.46 + i * 4, a = 0.035 + 0.04 * hash(i * 1.7), o = (hash(i * 3.3) - 0.5) * 14;
      grain += P(`M-10 ${f1(yy)} Q 80 ${f1(yy + o)} 180 ${f1(yy - o * 0.4)} T 370 ${f1(yy + o * 0.5)}`, 'none', `stroke="#a58aa8" stroke-width="${f1(0.5 + i * 0.045)}" opacity="${f1(a)}"`);
    }
    g += grain;
    // полосы фонаря на столешнице
    let tb = '';
    [[236, 26], [290, 20]].forEach(([x0, w]) => { tb += P(`M${x0 - 90} ${TB} L${x0 - 90 + w} ${TB} L${x0 - 150 + w} ${TB + 90} L${x0 - 150} ${TB + 90} Z`, '#ffb55c', 'opacity=".07"'); });
    g += G(tb, '', 'filter="url(#ss_b4)"');
    // отблеск кольца на столешнице
    g += `<ellipse cx="${CX}" cy="${BY + 12}" rx="175" ry="34" fill="url(#ss_pool)"/>` + `<ellipse cx="${CX}" cy="${BY + 18}" rx="150" ry="24" fill="url(#ss_pool)" opacity=".7"/>`;
    g += `<ellipse cx="${CX}" cy="${BY + 4}" rx="104" ry="17" fill="url(#ss_pool)" opacity=".8"/>`;
    // тень колонки
    g += `<ellipse cx="${CX + 3}" cy="${BY + 3}" rx="96" ry="19" fill="#010207" opacity=".7"/>`;

    if (!U) {
      // шнур питания (уходит назад вправо)
      g += P(`M226 ${BY - 7} C252 ${BY - 12} 290 ${TB + 2} 372 ${TB + 3}`, 'none', `stroke="#07090f" stroke-width="4" ${CAP}`);
      g += P(`M226 ${BY - 8.4} C252 ${BY - 13.4} 290 ${TB + 0.6} 372 ${TB + 1.6}`, 'none', `stroke="#3a4560" stroke-width=".8" opacity=".55" ${CAP}`);
    } else if (age < 1.05) {
      // шнур, штекер и рука — за корпусом колонки и за стаканом
      const H = age > -0.6 ? handPose(age) : null;
      const cg = cordGeom(age, H);
      const lit = Math.min(1, 0.1 + 0.9 * ls) * power;
      g += cordSvg(cg.pts, 0.14 + 0.5 * lit, 1 - (H ? H.kl : 0));
      if (cg.plug) g += plugSvg(cg.plug.p, cg.plug.a, lit);
      if (H) {
        // тень руки на стене от кольца (свет слева) и сама рука
        if (lit > 0.02) g += G(G(handSvg(H.curl, 0, 0, '#01030a'), `translate(${pt(add(H.G, [10, 3]))}) rotate(${f1(H.rot)})`), '', `filter="url(#ss_b4)" opacity="${f1(0.6 * lit)}"`);
        g += G(handSvg(H.curl, lit, 1 - power), `translate(${pt(H.G)}) rotate(${f1(H.rot)})`);
      }
    }

    // ================= КОЛОНКА =================
    const bodyG = () => {
      let b = P(BODY, 'url(#ss_cyl)') + G(R(90, TY - 24, 190, 120, 'url(#ss_mesh)'), '', 'clip-path="url(#ss_bodyc)"');
      b += P(BODY, 'url(#ss_shade)') + P(BODY, 'url(#ss_botd)') + P(BODY, 'url(#ss_rimR)');
      return b;
    };
    // отражение в лакированной столешнице
    g += G(G(bodyG(), `translate(0 ${2 * BY + 4}) scale(1 -1)`), '', 'mask="url(#ss_rm)" opacity=".8"');
    // тело
    let sp = bodyG();
    // свет кольца стекает на ткань
    sp += P(BODY, 'url(#ss_topl)', `opacity="${f1((0.55 + 0.45 * Math.min(1, ls)) * power)}"`);
    // шов ткани у крышки и резиновое основание
    sp += P(`M102 ${TY + 0.5} A78 19 0 0 0 258 ${TY + 0.5}`, 'none', 'stroke="#07090e" stroke-width="1.4" opacity=".8"');
    sp += P(`M98.6 ${BY - 7} A81.6 15.6 0 0 0 261.4 ${BY - 7} L262 ${BY} A82 16 0 0 1 98 ${BY} Z`, '#0a0d14');
    sp += P(`M98.4 ${BY - 6.6} A81.6 15.6 0 0 0 261.6 ${BY - 6.6}`, 'none', 'stroke="#5d6a84" stroke-width=".6" opacity=".4"');
    // дрожь ткани при речи
    if (speakK > 0.05) sp += P(BODY, cMid, `opacity="${f1(0.05 * speakK)}"`);
    g += sp;

    if (power < 1) g += P(BODY, '#030710', `opacity="${f1(0.58 * (1 - power))}"`);

    // крышка
    g += `<ellipse cx="${CX}" cy="${TY}" rx="78" ry="19" fill="#1d2330"/>`;
    g += `<ellipse cx="${CX}" cy="${TY - 0.6}" rx="77" ry="18.4" fill="none" stroke="#8d97aa" stroke-width=".7" opacity=".5"/>`;
    g += `<ellipse cx="${CX}" cy="${TY + 0.4}" rx="73.5" ry="16.9" fill="url(#ss_cap)"/>`;
    g += `<ellipse cx="${CX}" cy="${TY}" rx="${RX + 6.5}" ry="${RY + 2.6}" fill="none" stroke="#04060a" stroke-width="2.2" opacity=".85"/>`;
    g += `<ellipse cx="${CX}" cy="${TY}" rx="${RX - 6}" ry="${RY - 2.4}" fill="none" stroke="#04060a" stroke-width="1.6" opacity=".7"/>`;
    // отсвет кольца на поверхности крышки
    g += `<ellipse cx="${CX}" cy="${TY}" rx="70" ry="16.4" fill="${cMid}" opacity="${f1(Math.min(.16, .05 * ls))}"/>`;
    // кнопки и микрофоны
    const bt = (x, y, kind) => {
      let s = `<ellipse cx="${x}" cy="${y}" rx="6.4" ry="2.5" fill="#06080d"/><ellipse cx="${x}" cy="${y - 0.3}" rx="5.6" ry="2.1" fill="#161b27"/>`;
      if (kind === '+') s += L(x - 2.4, y, x + 2.4, y, '#7d8aa6', .9) + L(x, y - 0.9, x, y + 0.9, '#7d8aa6', .9);
      if (kind === '-') s += L(x - 2.4, y, x + 2.4, y, '#7d8aa6', .9);
      if (kind === 'o') s += `<ellipse cx="${x}" cy="${y}" rx="2.2" ry=".9" fill="none" stroke="#7d8aa6" stroke-width=".7"/>`;
      if (kind === 'm') s += `<ellipse cx="${x}" cy="${y}" rx="2.2" ry=".9" fill="none" stroke="#7d8aa6" stroke-width=".7"/>` + L(x - 2.6, y + 0.9, x + 2.6, y - 0.9, '#c9505a', .8);
      return s;
    };
    g += bt(CX - 26, TY + 1.5, '-') + bt(CX + 26, TY + 1.5, '+') + bt(CX - 11, TY + 5, 'm') + bt(CX + 11, TY + 5, 'o');
    for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.5; g += Ci(CX + (i ? 7 * Math.cos(a) : 0), TY - 3 + (i ? 1.6 * Math.sin(a) : 0), 0.7, '#030407', 'opacity=".9"'); }

    // кольцо: 12 сегментов (при срыве — красное, со смещением)
    let ringG = '', ringC = '';
    const head = t * 2 * Math.PI / 1.25;
    for (let i = 0; i < 12; i++) {
      const ac = (i * 30 - 90) * Math.PI / 180;
      const standby = 0.34 + 0.09 * Math.sin(t * 1.4 + i * 0.5);
      const dl = ((head - ac) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI), dl2 = ((head + Math.PI - ac) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const listen = Math.max(standby * 0.8, Math.exp(-Math.min(dl, dl2) / 0.85));
      const speak = clamp(0.3 + 0.8 * env * (0.72 + 0.28 * Math.sin(i * 1.9 + t * 11)), 0, 1);
      let it = mix(mix(standby, listen, wl), speak, ws);
      let sa = ac - 0.36, sb = ac + 0.36;
      if (gk) { it = mix(it, 0.35 + 0.65 * hash(gj * 1.9 + i * 4.1), 0.85); const da = (hash(gj * 2.3 + i) - 0.5) * 0.3; sa += da; sb += da; }
      if (remote) it = listen * redFlicker;
      // unplug: гаснут по часовой, начиная слева-спереди; последний — передний (i = 6) — мигает красным
      let segOff = 1, red = false;
      if (counting) {
        // Убираем по часовой стрелке; промежутки позволяют считать отдельные сегменты.
        const k = (i + 5) % 12;
        segOff = k < 12 - cdLeft ? 0 : (cdLeft === 1 ? cdBlink : 1);
        it = 0.9 + 0.1 * listen;
        sa = ac - 0.19; sb = ac + 0.19;
      }
      if (U) {
        const k = (i + 5) % 12;
        segOff = 1 - sstep(k * 0.021, k * 0.021 + 0.06, age);
        if (k === 11 && age >= 0.235) { red = true; segOff = redBlink(age); it = 0.95; }
      }
      if (segOff <= 0.002) continue;
      const deep = red ? '#d7142a' : cDeep, mid = red ? '#ff4a4a' : (it > 0.7 ? cHi : cMid);
      ringG += P(arc(sa, sb), 'none', `stroke="${deep}" stroke-width="5" opacity="${f1(Math.min(1, it) * 0.95 * segOff)}" ${CAP}`);
      ringC += P(arc(sa, sb), 'none', `stroke="${mid}" stroke-width="2" opacity="${f1((0.16 + Math.min(1, it) * 0.84) * segOff)}" ${CAP}`);
      if (it > 0.55 && !red && !counting && !remote) ringC += P(arc(sa + 0.07, sb - 0.07), 'none', `stroke="#fbfdff" stroke-width=".9" opacity="${f1(Math.min(1, (it - 0.5) * 1.8) * segOff)}" ${CAP}`);
    }
    const ringT = `translate(${f1(jx)} ${f1(jy)})`;
    g += G(ringG, ringT, 'filter="url(#ss_b2)"') + G(ringG, ringT, 'filter="url(#ss_b4)" opacity=".7"') + G(ringC, ringT);
    // гало над кольцом
    g += `<ellipse cx="${CX + jx}" cy="${TY - 2}" rx="${f1((95 + 28 * ls) * breathe)}" ry="${f1((34 + 14 * ls) * breathe)}" fill="url(#ss_pool)" opacity="${f1(Math.min(1, 0.55 + 0.35 * ls))}"/>`;

    // ================= СТАКАН ВОДЫ =================
    const GX = 301, GB = 336, GT = 272, WY = 289;
    const gbody = `M${GX - 23} ${GT} L${GX - 17} ${GB} A17 5 0 0 0 ${GX + 17} ${GB} L${GX + 23} ${GT} A23 6.5 0 0 1 ${GX - 23} ${GT} Z`;
    const wbody = `M${GX - 21.4} ${WY} L${GX - 17} ${GB} A17 5 0 0 0 ${GX + 17} ${GB} L${GX + 21.4} ${WY} A21.4 6 0 0 1 ${GX - 21.4} ${WY} Z`;
    // тень и каустика от стакана (свет колонки слева -> тень вправо)
    g += `<ellipse cx="${GX + 30}" cy="${GB + 2}" rx="34" ry="6" fill="url(#ss_gsh)"/>`;
    g += `<ellipse cx="${GX + 28}" cy="${GB + 2.5}" rx="17" ry="3" fill="${cMid}" opacity="${f1(Math.min(.5, (.14 + .14 * ls) * power))}" filter="url(#ss_b2)"/>`;
    g += `<ellipse cx="${GX}" cy="${GB + 0.5}" rx="19" ry="5.6" fill="#010207" opacity=".6"/>`;
    g += P(gbody, 'url(#ss_glass)') + P(wbody, 'url(#ss_water)');
    // отражение дна и блики
    g += `<ellipse cx="${GX}" cy="${GB}" rx="15" ry="4" fill="none" stroke="#bcd0ee" stroke-width=".7" opacity=".3"/>`;
    g += P(`M${GX - 18} ${GT + 8} L${GX - 14.4} ${GB - 6}`, 'none', `stroke="#e9f2ff" stroke-width="2" opacity=".22" ${CAP}`);
    g += P(`M${GX + 16} ${GT + 9} L${GX + 12.6} ${GB - 8}`, 'none', `stroke="#ffcf94" stroke-width="1.3" opacity=".24" ${CAP}`);
    g += P(`M${GX - 20} ${WY + 7} L${GX - 16.8} ${GB - 10}`, 'none', `stroke="${cHi}" stroke-width="3" opacity="${f1(Math.min(.55, (.12 + .22 * ls) * power))}" filter="url(#ss_b2)"`);
    // поверхность воды + рябь от голоса
    g += `<ellipse cx="${GX}" cy="${WY}" rx="21.4" ry="6" fill="#7f9fcc" opacity=".28"/>`;
    g += `<ellipse cx="${GX}" cy="${WY}" rx="21" ry="5.7" fill="none" stroke="#dcebff" stroke-width=".7" opacity=".35"/>`;
    const rp = (0.15 + 3.4 * speakK) * settled;
    for (let k = 0; k < 3; k++) {
      const e = (t * 1.7 + k / 3) % 1;
      g += `<ellipse cx="${GX}" cy="${WY + 0.4}" rx="${f1(3 + 17 * e)}" ry="${f1((3 + 17 * e) * 0.28)}" fill="none" stroke="#e6f1ff" stroke-width=".8" opacity="${f1(Math.min(.6, rp * 0.2) * (1 - e))}"/>`;
    }
    // край стакана
    g += `<ellipse cx="${GX}" cy="${GT}" rx="23" ry="6.5" fill="none" stroke="#d3e0f4" stroke-width="1" opacity=".55"/>`;
    g += `<ellipse cx="${GX}" cy="${GT - 0.4}" rx="22" ry="6" fill="none" stroke="${cMid}" stroke-width=".6" opacity="${f1(Math.min(.5, (.15 + .15 * ls) * power))}"/>`;

    // ================= УГОЛ ТЕЛЕФОНА =================
    const ph = 'M-20 350 L50 337 Q62 335 70 340 L98 362 L112 404 L-20 404 Z';
    g += `<ellipse cx="46" cy="352" rx="64" ry="12" fill="#010207" opacity=".55" transform="translate(-4 8)"/>`;
    g += G(P(ph, '#8793ae'), 'translate(0 3.5)') + P(ph, '#1a2033');
    g += G(P('M-20 353 L50 340 Q61 338 68 343 L95 364 L108 404 L-20 404 Z', 'url(#ss_ph)')) ;
    g += P('M-20 353 L50 340 Q61 338 68 343 L95 364 L108 404 L-20 404 Z', 'url(#ss_phr)');
    g += P('M-20 353 L50 340 Q61 338 68 343', 'none', 'stroke="#aab6d0" stroke-width=".8" opacity=".35"');
    g += P('M20 392 L74 352 L88 364 L50 404 Z', '#aac4ee', 'opacity=".035"');
    g += P(`M-20 352 L50 339`, 'none', 'stroke="#c9d6f0" stroke-width=".9" opacity=".25"');

    // ================= частицы пыли в свете =================
    let dust = '';
    for (let i = 0; i < 16; i++) {
      const bx = 40 + hash(i * 3.7) * 280, by = 60 + hash(i * 5.9) * 215;
      const x = bx + Math.sin(t * (0.25 + 0.2 * hash(i)) + i * 2) * 9, y = by - ((t * (2 + 3 * hash(i * 2.2)) + hash(i * 8.1) * 40) % 44);
      const near = Math.exp(-Math.pow((x - CX) / 140, 2) - Math.pow((y - 170) / 120, 2));
      dust += Ci(x, y, 0.6 + 0.7 * hash(i * 6.1), cHi, `opacity="${f1(near * (0.12 + 0.28 * hash(i * 4.4)) * Math.min(1.3, ls))}"`);
    }
    g += dust;

    // ================= виньетка, красный тон срыва, низ под субтитры =================
    g += R(-20, -20, 400, 400, 'url(#ss_vig)');
    if (gk && power > 0) g += R(-20, -20, 400, 400, '#d7142a', 'opacity=".05"');
    g += R(-20, 330, 400, 50, 'url(#ss_bot)') + R(-20, 373, 400, 300, '#03060c');
    return g;
  };
})();

// «Домофон»: рука Саши в боковом кармане куртки, крупно. Все события — абсолютное время.
//   p.tIn  — из правого нижнего угла рука тянется к прорези и уходит в карман (0.5 с), дальше шарит:
//            пальцы скрыты передней стенкой, под тканью ходит бугорок костяшек, прорезь оттянута
//   p.tOut — кисть выходит (0.4 с), разворачивается пустой ладонью к камере (держит ≈0.55 с) и уходит вниз;
//            подкладка кармана остаётся вывернутой светлым язычком
//   p.dim  — холодный свет экрана домофона слева гаснет за 0.4 с (остаётся тёплый снизу из-под двери)
// Без tIn рука входит с начала кадра (первые ~0.15 с её ещё нет в кадре). Камера Z(1.0→1.08):
// карман (центр прорези 210,250) у центра кадра, крючок вешалки сверху, пустой крючок ключницы справа вверху.
// Слои: стена → куртка → тень руки → [рука, пока пальцы в кармане] → передняя стенка (та же куртка в клипе мешка)
//       → бугорок/складки → подкладка → кант прорези → [рука снаружи].
(() => {
  const CAP = 'stroke-linecap="round" stroke-linejoin="round"';
  const sm = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const rad = d => d * Math.PI / 180;
  const pt = v => `${f1(v[0])} ${f1(v[1])}`;
  const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  // Саша как в k_hall_intercom (кожа #c79f86, футболка #7d8596), приглушённо ночью
  const SK = '#a48a7c', SK2 = '#7f695f', SK3 = '#3f302f', SKH = '#c4aa99', PALM = '#ae9384', NAIL = '#b9a096';
  const TEE = '#687082', TEE2 = '#4b5264', TEE3 = '#1d2233';
  const WARM = '#ffb870', COLD = '#cfe3ff';
  const CX = 132;                                            // ось куртки (молния)
  // прорезь кармана A (низ-лево) → B (верх-право); мешок лежит вверх-влево по N
  const C0 = [210, 250], SL = 92, SA = rad(-63);
  const U = [Math.cos(SA), Math.sin(SA)], N = [U[1], -U[0]];
  const A = add(C0, U, -SL / 2), B = add(C0, U, SL / 2);
  const DEEP = 50, HS = 1.3;
  const TH_IN = Math.atan2(N[1], N[0]) * 180 / Math.PI + 6;   // ось кисти при входе (чуть круче нормали)
  const depth = X => dot([X[0] - A[0], X[1] - A[1]], N);
  const mx = s => s.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, x, y) => `${f1(2 * CX - +x)} ${y}`);   // зеркало по оси куртки

  // сужающийся сегмент: трапеция + круглые концы (как в k_bedroom)
  function seg(a, b, wa, wb, fill, extra = '') {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    return P(`M${f1(a[0] + nx * wa / 2)} ${f1(a[1] + ny * wa / 2)} L${f1(b[0] + nx * wb / 2)} ${f1(b[1] + ny * wb / 2)} L${f1(b[0] - nx * wb / 2)} ${f1(b[1] - ny * wb / 2)} L${f1(a[0] - nx * wa / 2)} ${f1(a[1] - ny * wa / 2)} Z`, fill, extra) +
      Ci(a[0], a[1], wa / 2, fill, extra) + Ci(b[0], b[1], wb / 2, fill, extra);
  }
  // линия вдоль сегмента со сдвигом по левой нормали (рим, тени)
  function edge(a, b, off, stroke, w, op, k0 = 0, k1 = 1) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    return L(a[0] + dx * k0 + nx * off, a[1] + dy * k0 + ny * off, a[0] + dx * k1 + nx * off, a[1] + dy * k1 + ny * off, stroke, w, `opacity="${f1(op)}" ${CAP}`);
  }

  // ---------- кисть (локально: запястье в 0,0, пальцы по +x, большой палец на −y) ----------
  function fingers(sp, cu, palm) {
    const F = palm
      ? [[29.6, -9.8, 24.5, 7.6, -7], [32.4, -2.8, 27.5, 8, -1.5], [31.6, 4.6, 25.5, 7.6, 4.5], [28.6, 11.2, 20, 6.8, 11]]
      : [[29.5, -9.2, 25, 7.5, -2.5], [31.8, -2.4, 28, 7.9, -.5], [30.8, 4.5, 26, 7.5, 2], [27.8, 10.8, 20.5, 6.6, 5.5]];
    return F.map(([x, y, l, w, a], i) => {
      const aa = rad(a + sp * [-6, -2, 2.5, 7][i]), ll = l * (1 - .22 * cu);
      const d = [Math.cos(aa), Math.sin(aa)];
      return { b: [x, y], e: [x + ll * d[0], y + ll * d[1]], w, d, n: [-d[1], d[0]], l: ll };
    });
  }
  const BACK = 'M0 -10.8 C5 -12.2 12 -13.4 20 -13.4 L30 -12.8 C33.4 -8 34.4 -2 34 3 C33.4 9 31.2 13.2 28 14.6 C19 15.2 9 13.8 0 11 Z';
  const PALMP = 'M0 -11.4 C6 -14.6 15 -16 24 -15 L31 -12.6 C34.6 -6.4 35.6 1 35 6 C34.2 10.8 32 14.4 28.8 15.4 C19 16 9 14.6 0 11.6 Z';

  function hand(kind, sp, cu, cold) {
    const palm = kind === 'palm';
    const F = fingers(sp, cu, palm);
    const TH = palm ? [[5, -9.6], [14, -19], [22.4, -25]] : [[7, -8.6], [16.4, -15.8], [24.6, -19 - 2 * sp]];
    const thW = palm ? [11.4, 10, 8.2] : [12, 10, 8.2];
    const body = palm ? PALMP : BACK;
    const thumb = (fill, grow) => seg(TH[0], TH[1], thW[0] + grow, thW[1] + grow, fill) + seg(TH[1], TH[2], thW[1] + grow, thW[2] + grow, fill);
    // силуэт (обводка, тень, бугорок под тканью): grow — расширение контура
    const shape = (fill, grow) => {
      let s = P(body, fill, grow > 0 ? `stroke="${fill}" stroke-width="${grow}" ${CAP}` : '');
      for (let i = 3; i >= 0; i--) s += seg(F[i].b, F[i].e, F[i].w + grow, F[i].w * .86 + grow, fill);
      return s + thumb(fill, grow);
    };
    const base = palm ? PALM : SK;
    let f = '';
    if (!palm) {
      f += P(body, base);
      // свет на тыльной стороне: ближе к большому пальцу светлее, у мизинца тень
      f += P('M3 -6 C12 -8.6 22 -9.2 30 -8', 'none', `stroke="${SKH}" stroke-width="5" opacity=".14" ${CAP}`);
      f += P('M1.5 8.6 C10 11.4 19 12.8 27.4 12.8', 'none', `stroke="${SK2}" stroke-width="3.8" opacity=".75" ${CAP}`);
      // косточка запястья со стороны мизинца
      f += P('M2.6 7.2 Q5 5.4 7.4 7.4', 'none', `stroke="${SKH}" stroke-width="1" opacity=".35" ${CAP}`);
    } else {
      f += P(body, base);
      f += `<ellipse cx="12" cy="-6.6" rx="10" ry="6" transform="rotate(-24 12 -6.6)" fill="${SKH}" opacity=".26"/>`;
      f += `<ellipse cx="19.5" cy="2.6" rx="9" ry="7.4" fill="${SK2}" opacity=".12"/>`;
      f += P('M23.6 -11.4 C15 -9.6 8.6 -4.6 5 3', 'none', `stroke="${SK2}" stroke-width=".95" opacity=".75" ${CAP}`);
      f += P('M29.4 11.6 C26 7 25 1.6 25.8 -5.2', 'none', `stroke="${SK2}" stroke-width=".85" opacity=".6" ${CAP}`);
      f += P('M23 -6 C20 -1 18.6 3.6 19.2 8.4', 'none', `stroke="${SK2}" stroke-width=".7" opacity=".4" ${CAP}`);
      f += P('M1 2 C1.6 -1 1.6 -4 1 -7', 'none', `stroke="${SK2}" stroke-width=".7" opacity=".45" ${CAP}`);   // складка запястья
    }
    // пальцы от мизинца к указательному, граница с соседом — тонкой тёмной линией
    for (let i = 3; i >= 0; i--) {
      const q = F[i];
      f += seg(q.b, q.e, q.w, q.w * .86, base);
      if (i < 3) {
        const r = F[i + 1], l = Math.min(q.l, r.l + (r.b[0] - q.b[0])) - 2.4;
        const s0 = [q.b[0] + q.d[0] * 4 + q.n[0] * q.w * .5, q.b[1] + q.d[1] * 4 + q.n[1] * q.w * .5];
        const s1 = [q.b[0] + q.d[0] * l + q.n[0] * q.w * .44, q.b[1] + q.d[1] * l + q.n[1] * q.w * .44];
        f += L(s0[0], s0[1], s1[0], s1[1], SK3, 1, `opacity=".85" ${CAP}`);
      }
    }
    F.forEach(q => {
      const at = (k, o) => [q.b[0] + q.d[0] * k + q.n[0] * o, q.b[1] + q.d[1] * k + q.n[1] * o];
      const arc = (k, w, c, sw, op, bow) => { const a0 = at(k, -q.w * w), a1 = at(k, q.w * w), m = at(k + bow, 0); return P(`M${pt(a0)} Q${pt(m)} ${pt(a1)}`, 'none', `stroke="${c}" stroke-width="${sw}" opacity="${op}" ${CAP}`); };
      if (!palm) {
        const kn = at(-.6, -.4);
        f += Ci(kn[0], kn[1], q.w * .34, SKH, 'opacity=".22"');                         // костяшка — мягкий блик
        f += arc(q.l * .5, .24, SK2, .75, .7, 1.3) + arc(q.l * .5 + 1.7, .18, SK2, .6, .45, 1.1);   // средний сустав
        const c = at(q.l - 2.8, 0), a = Math.atan2(q.d[1], q.d[0]) * 180 / Math.PI;
        f += `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="2.3" ry="${f1(q.w * .24)}" transform="rotate(${f1(a)} ${pt(c)})" fill="${NAIL}" opacity=".28"/>`;
      } else {
        f += arc(1.2, .34, SK2, .8, .7, 1.2);
        f += arc(q.l * .42, .3, SK2, .7, .65, 1) + arc(q.l * .74, .28, SK2, .65, .55, .8);
        const c = at(q.l - 3, 0);
        f += Ci(c[0], c[1], q.w * .28, SKH, 'opacity=".22"');
      }
    });
    if (!palm) {
      const q = F[3];
      f += L(q.b[0] + q.n[0] * q.w * .3, q.b[1] + q.n[1] * q.w * .3, q.e[0] + q.n[0] * q.w * .26, q.e[1] + q.n[1] * q.w * .26, SK2, 2, `opacity=".7" ${CAP}`);
      // большой палец сбоку кисти: без шва у основания, складка-перепонка к указательному, ноготь сбоку
      f += thumb(base, 0);
      f += P(`M${pt([TH[0][0] + 6, TH[0][1] + 1.2])} Q${pt([TH[1][0] + 3, TH[1][1] + 3.6])} ${pt([TH[1][0] + 8.4, TH[1][1] + 3.2])}`, 'none', `stroke="${SK3}" stroke-width=".9" opacity=".6" ${CAP}`);
      f += edge(TH[1], TH[2], 1.6, SK2, .8, .6, -.04, .12);
      const td = [TH[2][0] - TH[1][0], TH[2][1] - TH[1][1]], tl = Math.hypot(td[0], td[1]), ta = Math.atan2(td[1], td[0]) * 180 / Math.PI;
      const nc = [TH[2][0] - td[0] / tl * 1.8 + 1, TH[2][1] - td[1] / tl * 1.8 + 1.6];
      f += `<ellipse cx="${f1(nc[0])}" cy="${f1(nc[1])}" rx="2.6" ry="1.7" transform="rotate(${f1(ta)} ${pt(nc)})" fill="${NAIL}" opacity=".3"/>`;
      // рим снизу-слева: тёплый от двери и холодный от экрана — по большому и указательному
      [[TH[0], TH[1], thW[0]], [TH[1], TH[2], thW[1]]].forEach(([a, b, w]) => {
        f += edge(a, b, -(w / 2 - 2.2), COLD, 2.8, .22 * cold, .05, .95) + edge(a, b, -(w / 2 - .9), WARM, 1.3, .4) + edge(a, b, -(w / 2 - 1.9), COLD, 1, .6 * cold, .1, .9);
      });
      const q0 = F[0];
      f += edge(q0.b, q0.e, -(q0.w / 2 - 1.8), COLD, 2.4, .2 * cold, .3, .9) + edge(q0.b, q0.e, -(q0.w / 2 - .8), WARM, 1.1, .3, .3, .9) + edge(q0.b, q0.e, -(q0.w / 2 - 1.6), COLD, .9, .55 * cold, .3, .85);
    } else {
      // большой палец поверх ладони (ладонью к камере он ближе к нам)
      f += thumb(base, 0);
      f += P(`M${pt(TH[0])} Q 4 -15 ${pt(TH[1])}`, 'none', `stroke="${SK2}" stroke-width="2.6" opacity=".4" ${CAP}`);
      f += edge(TH[0], TH[1], -(thW[0] / 2 - 1), SK2, 2.2, .55) + edge(TH[1], TH[2], -(thW[1] / 2 - 1), SK2, 2, .55);
      const c = [mix(TH[1][0], TH[2][0], .62), mix(TH[1][1], TH[2][1], .62)];
      f += Ci(c[0], c[1], 3.2, SKH, 'opacity=".22"') + edge(TH[1], TH[2], 0, SK2, .7, .5, .28, .3);
      // рим снизу-слева: на ладони это ребро мизинца (+y), после отражения оно смотрит вниз-влево
      f += P('M2 11.2 C10 14 19 15.4 28.4 15', 'none', `stroke="${WARM}" stroke-width="1.3" opacity=".42" ${CAP}`);
      f += P('M3 10 C10 12.6 18 13.8 27 13.6', 'none', `stroke="${COLD}" stroke-width="1" opacity="${f1(.5 * cold)}" ${CAP}`);
      const q = F[3];
      f += edge(q.b, q.e, q.w / 2 - 2, COLD, 2.6, .2 * cold, .05, .9) + edge(q.b, q.e, q.w / 2 - .8, WARM, 1.2, .4, .05, .9) + edge(q.b, q.e, q.w / 2 - 1.6, COLD, .9, .55 * cold, .1, .85);
      const q0 = F[0];
      f += edge(q0.b, q0.e, -(q0.w / 2 - 1), SK2, 1.8, .6, .1, .92);
    }
    return { shape, f, F, TH };
  }

  // ---------- куртка-парка (по оси CX) ----------
  const TORSO = 'M98 64 C74 70 44 86 22 108 L-4 150 L-30 400 L294 400 L268 150 L242 108 C220 86 190 70 166 64 Z';
  const SLV_R = 'M236 104 C256 112 270 130 278 156 L300 330 Q302 346 290 350 L262 352 Q252 350 252 338 L246 180 C244 150 240 128 232 112 Z';
  const SLV_L = mx(SLV_R);
  const COLLAR = 'M95 66 Q132 53 169 66 L167 92 Q132 100 97 92 Z';
  const FLAP = 'M132 92 L148 92 Q150 250 148 400 L132 400 Z';

  SCENES.coat_pocket = function (u, p, d, t) {
    const st = t - u;
    const ti = p.tIn ?? st, to = p.tOut ?? (ti + 1.6), td = p.dim ?? 1e9;
    const fade = sm(td, td + .4, t);
    const cold = 1 - fade * (1 - .3 * Math.max(0, Math.sin((t - td) * 55)) * (1 - sm(td + .1, td + .2, t)));
    const tt = t - ti;

    // ---------- движение руки ----------
    const kR = eout(lin(t, ti, ti + .3));                     // тянется из угла к прорези
    const kI = ease(lin(t, ti + .16, ti + .52));              // пальцы уходят в карман
    const ru = sm(ti + .45, ti + .7, t) * (1 - sm(to - .16, to, t));   // шарит
    const kO = sm(to, to + .38, t);                           // вытаскивает
    const kP = ease(lin(t, to + .2, to + .6));                // поднимает к себе ладонью
    const kF = ease(lin(t, to + .3, to + .52));               // разворот кисти
    const hold = sm(to + .5, to + .7, t);
    const kL = ein(lin(t, to + 1.12, to + 1.7));              // уходит вниз из кадра
    const show = t >= ti && kL < 1;

    const th0 = TH_IN + ru * 7 * Math.sin(tt * 2 * Math.PI * 1.15 + 1.3) + 4 * kO;
    const dk = mix(-34 * HS, 8, kI) + ru * (3.6 * Math.sin(tt * 2 * Math.PI * 2.1) + 1.2 * noise1(tt * 6 + 2)) - kO * 58;   // глубина костяшек за прорезью
    const lat = ru * (7 * Math.sin(tt * 2 * Math.PI * 1.4 + .6) + 2 * noise1(tt * 4 + 7));
    const dir0 = [Math.cos(rad(th0)), Math.sin(rad(th0))];
    const K = add(add(A, U, SL * .5 + lat), dir0, dk / dot(dir0, N));
    const Wp = add(K, dir0, -31 * HS);                        // запястье «на рельсе» кармана
    const W0 = [410, 430], arc = Math.sin(Math.PI * kR) * 16;
    let W = [mix(W0[0], Wp[0], kR) - arc * .3, mix(W0[1], Wp[1], kR) + arc];
    let th = mix(-120, th0, kR);
    const WP = [286, 304];
    W = [mix(W[0], WP[0], kP), mix(W[1], WP[1], kP)];
    th = mix(th, -122, kP);
    W = [W[0] + hold * .9 * noise1(t * 9) + kL * 120, W[1] + hold * .9 * noise1(t * 9 + 5) + kL * 170];
    th += kL * 12;
    const sy = Math.cos(Math.PI * kF);
    const kind = sy >= 0 ? 'back' : 'palm';
    const syA = (.34 + .66 * Math.abs(sy)) * (sy >= 0 ? 1 : -1);   // ребром кисть не становится «щепкой»
    const sp = kind === 'palm' ? .45 : .5 * kO;
    const cu = kind === 'palm' ? .3 : .25 * (1 - kO) + .06;
    const Hn = hand(kind, sp, cu, cold);
    const hc = Math.cos(rad(th)), hs = Math.sin(rad(th));
    const toW = (x, y) => [W[0] + (x * hc - y * syA * hs) * HS, W[1] + (x * hs + y * syA * hc) * HS];
    const HTR = `translate(${pt(W)}) rotate(${f1(th)}) scale(${HS} ${f1(HS * syA)})`;
    const tipD = Math.max(...Hn.F.map(q => depth(toW(q.e[0], q.e[1]))), depth(toW(Hn.TH[2][0], Hn.TH[2][1])));
    const inside = show && tipD > -.5;
    const load = show ? clamp((dk + 28) / 26) : 0;            // кисть в прорези: оттяжка, складки
    const gape = 2.4 * sm(to + .2, to + .5, t);              // после выхода прорезь остаётся чуть раскрытой (подкладка распирает)
    const open = Math.max(load * 7.4 + ru * 1.3 * Math.sin(tt * 2 * Math.PI * 2.1 + .8), gape);
    const sW = clamp(dot([K[0] - A[0], K[1] - A[1]], U) / SL, .22, .78);
    const Sw = add(A, U, SL * sW);
    const cU = add(Sw, N, open * 1.8), cD = add(Sw, N, -open * .8);
    // предплечье (ракурс: плечо у камеры справа внизу, предплечье сокращается и расширяется к локтю)
    const phi = th + 180 + mix(4, -16, kP);
    const LF = mix(72, 66, kP);
    const d1 = [Math.cos(rad(phi)), Math.sin(rad(phi))], n1 = [d1[1], -d1[0]];   // n1 — к верхнему (теневому) ребру
    const E = add(W, d1, LF);
    const psi = rad(phi - 14), ps = [Math.cos(psi), Math.sin(psi)], pn = [ps[1], -ps[0]];
    const HM = add(E, ps, 19), SH = add(E, ps, 150);

    const bag = `M${pt(A)} Q${pt(cU)} ${pt(B)} L${pt(add(add(B, N, 28), U, 4))} Q${pt(add(add(B, N, DEEP + 8), U, -4))} ${pt(add(add(C0, N, DEEP + 4), U, -6))} Q${pt(add(add(A, N, DEEP - 4), U, -10))} ${pt(add(add(A, N, 22), U, -4))} Z`;
    let g = `<defs>
      <linearGradient id="cp_wall" x2="0" y2="1"><stop stop-color="#0d172b"/><stop offset=".7" stop-color="#121d34"/><stop offset="1" stop-color="#1a1f2e"/></linearGradient>
      <linearGradient id="cp_coat" gradientUnits="userSpaceOnUse" x1="-20" y1="0" x2="300" y2="0"><stop stop-color="#1b2439"/><stop offset="1" stop-color="#131b2d"/></linearGradient>
      <linearGradient id="cp_slv" gradientUnits="userSpaceOnUse" x1="-40" y1="0" x2="300" y2="0"><stop stop-color="#172036"/><stop offset="1" stop-color="#0f1626"/></linearGradient>
      <linearGradient id="cp_warm" gradientUnits="userSpaceOnUse" x1="0" y1="390" x2="0" y2="170"><stop stop-color="#f3b85a" stop-opacity=".2"/><stop offset=".5" stop-color="#f3b85a" stop-opacity=".06"/><stop offset="1" stop-color="#f3b85a" stop-opacity="0"/></linearGradient>
      <linearGradient id="cp_cold" gradientUnits="userSpaceOnUse" x1="-20" y1="0" x2="240" y2="0"><stop stop-color="#9fd0ff" stop-opacity=".26"/><stop offset=".55" stop-color="#9fd0ff" stop-opacity=".05"/><stop offset="1" stop-color="#9fd0ff" stop-opacity="0"/></linearGradient>
      <linearGradient id="cp_bottom" gradientUnits="userSpaceOnUse" x1="0" y1="340" x2="0" y2="375"><stop stop-color="#03060c" stop-opacity="0"/><stop offset="1" stop-color="#03060c"/></linearGradient>
      <linearGradient id="cp_lin" gradientUnits="userSpaceOnUse" x1="${f1(C0[0])}" y1="${f1(C0[1] - 6)}" x2="${f1(C0[0] + 10)}" y2="${f1(C0[1] + 48)}"><stop stop-color="#3e4456"/><stop offset=".4" stop-color="#7d8394"/><stop offset="1" stop-color="#9c9ba2"/></linearGradient>
      <radialGradient id="cp_vig" cx=".5" cy=".42" r=".75"><stop offset=".55" stop-color="#03060c" stop-opacity="0"/><stop offset="1" stop-color="#03060c" stop-opacity=".7"/></radialGradient>
      <filter id="cp_b3" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="cp_b1" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.1"/></filter>
      <filter id="cp_b2" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.8"/></filter>
      <filter id="cp_b6" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
      <clipPath id="cp_coatclip"><path d="${TORSO}"/><path d="${SLV_L}"/><path d="${SLV_R}"/><path d="${COLLAR}"/></clipPath>
      <clipPath id="cp_bag"><path d="${bag}"/></clipPath>
      <mask id="cp_hsil" maskUnits="userSpaceOnUse" x="-20" y="-20" width="400" height="420"><g filter="url(#cp_b2)"><g transform="${HTR}">${Hn.shape('#fff', 4)}</g></g></mask>
    </defs>`;

    // ---------- стена, свет экрана слева, отсвет из-под двери снизу ----------
    g += R(-20, -20, 400, 680, '#03060c') + R(-20, -20, 400, 396, 'url(#cp_wall)');
    for (let i = 0; i < 16; i++) g += R(i * 25 - 8, -20, 7, 396, '#8193bd', 'opacity=".025"');
    g += Ci(-16, 176, 260, 'url(#glowC)', `opacity="${f1(.6 * cold)}"`);
    g += R(-20, 170, 400, 206, 'url(#cp_warm)');
    // край трубки домофона у левой кромки (почти за кадром)
    g += R(-30, 122, 38, 126, '#1a2234', 'rx="7"') + R(4, 128, 2, 114, '#8593aa', 'opacity=".18"');
    g += R(-26, 148, 28, 46, '#0b1322', 'rx="3"') + R(-26, 148, 28, 46, '#bfe0ff', `rx="3" opacity="${f1(.8 * cold)}"`);
    g += P('M-24 186 L0 154', 'none', `stroke="#cfe3ff" stroke-width="1" opacity="${f1(.1 + .1 * fade)}" ${CAP}`);

    // ---------- ключница: пустой крючок ----------
    g += G(P('M298 72 L320 58 L342 72 L342 120 Q342 124 338 124 L302 124 Q298 124 298 120 Z', '#02050b'), 'translate(5 -3)', 'opacity=".5" filter="url(#cp_b2)"');
    g += P('M298 72 L320 58 L342 72 L342 120 Q342 124 338 124 L302 124 Q298 124 298 120 Z', '#2a2530');
    g += P('M298 72 L320 58 L342 72', 'none', `stroke="#4a4350" stroke-width="1.2" ${CAP}`);
    g += L(300, 74, 300, 120, '#cfe3ff', 1, `opacity="${f1(.08 + .22 * cold)}"`) + L(302, 122, 338, 122, WARM, 1, 'opacity=".22"');
    g += Ci(320, 78, 1.6, '#14121a');
    g += `<ellipse cx="320" cy="104" rx="7" ry="10" fill="#3a3440" opacity=".5"/>`;     // выцветшее пятно, где висели ключи
    g += P('M316 86 L316 101 Q316 110 324 108 Q330 106 328 99', 'none', `stroke="#07080d" stroke-width="5.6" ${CAP}`);
    g += P('M316 85 L316 100 Q316 107 322 106 Q327 105 326 99', 'none', `stroke="#8e8f98" stroke-width="3.2" ${CAP}`);
    g += P('M315 86 L315 98', 'none', `stroke="#e8eefc" stroke-width=".9" opacity="${f1(.15 + .3 * cold)}" ${CAP}`);
    g += P('M318 107 Q323 108 326 102', 'none', `stroke="${WARM}" stroke-width=".9" opacity=".35" ${CAP}`);

    // ---------- вешалка, мягкая тень куртки на стене ----------
    g += R(-20, 26, 282, 20, '#1d1e2a', 'rx="3"') + R(-20, 27, 282, 2, '#5a5f73', 'opacity=".25"') + R(-20, 44, 282, 2, '#07090f', 'opacity=".6"');
    g += Ci(244, 36, 2, '#4d5465') + L(242.8, 36, 245.2, 36, '#141b29', .7);
    const sil = P(TORSO, '#02050b') + P(SLV_L, '#02050b') + P(SLV_R, '#02050b') + P(COLLAR, '#02050b');
    g += G(G(sil, 'translate(14 -6)'), '', `opacity="${f1(.22 + .3 * cold)}" filter="url(#cp_b6)"`);
    g += P(`M${CX} 32 L${CX} 48 Q${CX} 57 ${CX + 8} 55 Q${CX + 14} 53 ${CX + 12} 47`, 'none', `stroke="#626b7d" stroke-width="4" ${CAP}`);
    g += P(`M${CX - 6} 62 Q${CX - 5} 46 ${CX + 1} 46 Q${CX + 7} 46 ${CX + 8} 62`, 'none', `stroke="#0b111d" stroke-width="3.4" ${CAP}`);

    // ---------- куртка (дважды: целиком и передней стенкой кармана в клипе мешка) ----------
    const coatArt = () => {
      let c = '';
      c += P(TORSO, 'url(#cp_coat)');
      c += P(`M98 66 Q${CX} 38 166 66 Q${CX} 58 98 66 Z`, '#080d18');       // изнанка воротника сзади
      // заломы от крючка к плечам
      c += P('M108 84 Q84 94 60 116 M156 84 Q180 94 204 116 M118 96 Q108 116 104 142 M146 96 Q156 116 160 142', 'none', `stroke="#0b1222" stroke-width="2.2" opacity=".8" ${CAP}`);
      c += P('M107 87 Q83 97 59 119 M157 87 Q181 97 205 119', 'none', `stroke="#33415d" stroke-width=".9" opacity=".4" ${CAP}`);
      // молния и ветрозащитная планка с кнопками
      c += P(`M${CX} 92 L${CX} 400`, 'none', `stroke="#070c16" stroke-width="3" ${CAP}`);
      c += P(FLAP, '#1e2840');
      c += P('M148 92 Q150 250 148 400', 'none', `stroke="#0a101d" stroke-width="1.6" ${CAP}`);
      c += P('M144.6 96 Q146.4 250 144.6 400', 'none', 'stroke="#4c5873" stroke-width=".8" opacity=".45" stroke-dasharray="2.2 2.2"');
      [128, 188, 248, 308].forEach(y => { c += Ci(140.5, y, 3.4, '#2f3a52') + Ci(140.5, y, 1.6, '#151c2c') + P(`M137.6 ${y + 1.4} Q140.5 ${y + 3.6} 143.4 ${y + 1.4}`, 'none', `stroke="${WARM}" stroke-width=".7" opacity=".25" ${CAP}`); });
      // складки на полах
      c += P('M70 196 Q78 250 70 330 M100 230 Q96 290 102 360 M186 140 Q180 170 188 196 M244 300 Q248 336 244 370', 'none', `stroke="#0b1222" stroke-width="2.4" opacity=".8" ${CAP}`);
      c += P('M71 198 Q79 250 71 328 M187 142 Q181 170 189 194', 'none', `stroke="#33405b" stroke-width=".8" opacity=".35" ${CAP}`);
      // левый карман — зеркальный, у кромки кадра
      const A2 = [2 * CX - A[0], A[1]], B2 = [2 * CX - B[0], B[1]], N2 = [-N[0], N[1]];
      c += P(`M${pt(A2)} L${pt(B2)}`, 'none', `stroke="#02040a" stroke-width="2.2" ${CAP}`);
      c += P(`M${pt(A2)} L${pt(B2)} L${pt(add(B2, N2, 6.6))} L${pt(add(A2, N2, 6.6))} Z`, '#1e2840');
      c += P(`M${pt(add(A2, N2, 3.4))} L${pt(add(B2, N2, 3.4))}`, 'none', 'stroke="#4c5873" stroke-width=".8" opacity=".5" stroke-dasharray="2 2"');
      // рукава поверх боков: тень под рукавом, швы, манжеты внизу
      c += P(SLV_R, '#070b15', 'transform="translate(-4 2)" opacity=".7"') + P(SLV_L, '#070b15', 'transform="translate(4 2)" opacity=".7"');
      c += P(SLV_L, 'url(#cp_slv)') + P(SLV_R, 'url(#cp_slv)');
      c += P('M262 168 Q270 240 280 300 M10 190 Q4 240 -4 290', 'none', `stroke="#0a101e" stroke-width="2" opacity=".85" ${CAP}`);
      c += P('M248 182 L254 338 M16 182 L10 338', 'none', `stroke="#26324b" stroke-width="1" opacity=".55" ${CAP}`);
      c += P('M254 322 L298 316 M10 322 L-34 316', 'none', `stroke="#2a3550" stroke-width="1.6" opacity=".8" ${CAP}`);
      // воротник-стойка
      c += P(COLLAR, '#1f2a41');
      c += P('M97 92 Q132 100 167 92', 'none', `stroke="#090f1b" stroke-width="1.8" ${CAP}`);
      c += P('M96 68 Q132 55 168 68', 'none', `stroke="#3b4864" stroke-width="1" opacity=".55" ${CAP}`);
      c += P('M100 74 Q132 63 164 74', 'none', 'stroke="#4c5873" stroke-width=".7" opacity=".4" stroke-dasharray="2 2"');
      c += L(CX, 62, CX, 93, '#070c16', 3.4) + R(CX - 2.4, 70, 4.8, 11, '#6b778c', 'rx="1.8"') + R(CX - 1.2, 72, 2.4, 4.6, '#0b111d', 'rx="1"');
      // свет: холодный слева (гаснет), тёплый снизу; рим по левому краю и по низу рукавов
      c += G(R(-20, 30, 340, 380, 'url(#cp_cold)', `opacity="${f1(cold)}"`) + R(-20, 30, 340, 380, 'url(#cp_warm)'), '', 'clip-path="url(#cp_coatclip)"');
      c += P('M98 66 C74 72 44 88 22 110', 'none', `stroke="${COLD}" stroke-width="1" opacity="${f1(.3 * cold)}" ${CAP}`);
      c += P('M95 66 Q113 59 132 57', 'none', `stroke="${COLD}" stroke-width="1" opacity="${f1(.35 * cold)}" ${CAP}`);
      return c;
    };
    g += coatArt();

    // прорезь: тёмная щель; с рукой — раскрытая «линза»
    g += P(`M${pt(A)} L${pt(B)}`, 'none', `stroke="#02040a" stroke-width="2.4" ${CAP}`);
    if (open > .3) g += P(`M${pt(A)} Q${pt(cU)} ${pt(B)} Q${pt(cD)} ${pt(A)} Z`, '#010309');
    g += P(`M${pt(add(A, N, -1.7))} Q${pt(add(cD, N, -1.7))} ${pt(add(B, N, -1.7))}`, 'none', `stroke="${WARM}" stroke-width=".9" opacity=".2" ${CAP}`);
    g += P(`M${pt(add(A, N, -1.7))} Q${pt(add(cD, N, -1.7))} ${pt(add(B, N, -1.7))}`, 'none', `stroke="#3a4762" stroke-width=".8" opacity=".5" ${CAP}`);

    // ---------- рука ----------
    let armSh = '', handSh = '', arm = '';
    if (show) {
      const dsh = .6 + 1.4 * kP;
      armSh = G(seg(W, E, 24, 40, '#02050b') + seg(E, SH, 44, 60, '#02050b'), `translate(${f1(8 * dsh)} ${f1(-6 * dsh)})`, 'opacity=".42" filter="url(#cp_b3)"');
      handSh = G(G(Hn.shape('#02050b', 1), HTR), `translate(${f1(6 * dsh)} ${f1(-5 * dsh)})`, 'opacity=".4" filter="url(#cp_b2)"');
      // плечо уходит в рукав: тёмная горловина рукава позади
      arm += `<ellipse cx="${f1(HM[0])}" cy="${f1(HM[1])}" rx="5" ry="27" transform="rotate(${f1(psi * 180 / Math.PI)} ${pt(HM)})" fill="${TEE3}"/>`;
      arm += seg(E, add(HM, ps, 8), 41, 45, SK3) + seg(E, add(HM, ps, 8), 38.6, 42.6, SK);
      arm += edge(E, add(HM, ps, 8), 19, WARM, 1.3, .3) + edge(E, add(HM, ps, 8), -18, SK2, 4, .5);
      // контур предплечья и кисти, потом заливки
      arm += seg(W, E, 22 * HS + 2.4, 40.4, SK3);
      arm += G(Hn.shape(SK3, 2), HTR);
      arm += seg(W, E, 22 * HS, 38, SK);
      // свет по предплечью: нижне-левое ребро тёплое/холодное, верхнее — в тени
      arm += P(`M${pt(add(W, n1, -12))} L${pt(add(E, n1, -18.6))} L${pt(add(E, n1, -7))} L${pt(add(W, n1, -5))} Z`, SKH, 'opacity=".16"');
      arm += P(`M${pt(add(W, n1, 13.2))} L${pt(add(E, n1, 18.6))} L${pt(add(E, n1, 11))} L${pt(add(W, n1, 9))} Z`, SK2, 'opacity=".55"');
      arm += P(`M${pt(add(W, n1, -13.4))} L${pt(add(E, n1, -18.4))}`, 'none', `stroke="${WARM}" stroke-width="1.5" opacity=".38" ${CAP}`);
      arm += P(`M${pt(add(add(W, d1, 3), n1, -10.4))} L${pt(add(add(E, d1, -12), n1, -14.6))}`, 'none', `stroke="${COLD}" stroke-width="4" opacity="${f1(.16 * cold)}" ${CAP}`);
      arm += P(`M${pt(add(add(W, d1, 4), n1, -12.4))} L${pt(add(add(E, d1, -14), n1, -16.8))}`, 'none', `stroke="${COLD}" stroke-width="1.1" opacity="${f1(.55 * cold)}" ${CAP}`);
      if (kind === 'palm') arm += P(`M${pt(add(W, n1, -6))} L${pt(add(E, n1, -9))}`, 'none', `stroke="${SKH}" stroke-width="7" opacity="${f1(.14 * kF)}" ${CAP}`);
      arm += P(`M${pt(add(add(W, d1, 26), n1, 9))} q ${f1(d1[0] * 10 - n1[0] * 2)} ${f1(d1[1] * 10 - n1[1] * 2)} ${f1(d1[0] * 22 + n1[0] * 1)} ${f1(d1[1] * 22 + n1[1] * 1)}`, 'none', `stroke="${SK2}" stroke-width="1" opacity=".55" ${CAP}`);
      arm += G(Hn.f, HTR);
      if (cold > .01) arm += G(G(Hn.shape('#9fd0ff', 0), HTR) + seg(W, E, 22 * HS, 38, '#9fd0ff'), '', `opacity="${f1(.07 * cold)}"`);
      // рукав серой футболки: раструб с подгибом, складки, тёплый рим снизу
      const h0 = add(HM, pn, -27), h1 = add(HM, pn, 27), s0 = add(SH, pn, -36), s1 = add(SH, pn, 36);
      const hc0 = add(HM, ps, -5);
      const sleeve = `M${pt(h0)} Q${pt(hc0)} ${pt(h1)} L${pt(s1)} L${pt(s0)} Z`;
      arm += P(sleeve, TEE3, `stroke="${TEE3}" stroke-width="2.6" ${CAP}`) + P(sleeve, TEE);
      arm += P(`M${pt(add(h0, ps, 7))} Q${pt(add(hc0, ps, 7))} ${pt(add(h1, ps, 7))}`, 'none', `stroke="${TEE2}" stroke-width="1.6" opacity=".9" ${CAP}`);
      arm += P(`M${pt(add(h0, ps, 4.6))} Q${pt(add(hc0, ps, 4.6))} ${pt(add(h1, ps, 4.6))}`, 'none', 'stroke="#a3abbb" stroke-width=".8" opacity=".4" stroke-dasharray="2 2"');
      arm += P(`M${pt(add(add(HM, ps, 16), pn, 14))} q ${f1(ps[0] * 18 + pn[0] * 5)} ${f1(ps[1] * 18 + pn[1] * 5)} ${f1(ps[0] * 40 + pn[0] * 3)} ${f1(ps[1] * 40 + pn[1] * 3)}`, 'none', `stroke="${TEE2}" stroke-width="2" opacity=".85" ${CAP}`);
      arm += P(`M${pt(add(add(HM, ps, 12), pn, -8))} q ${f1(ps[0] * 14 - pn[0] * 4)} ${f1(ps[1] * 14 - pn[1] * 4)} ${f1(ps[0] * 34 - pn[0] * 2)} ${f1(ps[1] * 34 - pn[1] * 2)}`, 'none', `stroke="${TEE2}" stroke-width="1.6" opacity=".75" ${CAP}`);
      arm += P(`M${pt(add(add(HM, ps, 22), pn, 2))} q ${f1(ps[0] * 10)} ${f1(ps[1] * 10)} ${f1(ps[0] * 26 + pn[0] * 6)} ${f1(ps[1] * 26 + pn[1] * 6)}`, 'none', `stroke="#8e96a8" stroke-width="1" opacity=".35" ${CAP}`);
      arm += P(`M${pt(add(h0, pn, 1.4))} L${pt(add(s0, pn, 1.4))}`, 'none', `stroke="${WARM}" stroke-width="1.6" opacity=".34" ${CAP}`);
      arm += P(`M${pt(add(h1, pn, -2.4))} L${pt(add(s1, pn, -2.4))}`, 'none', `stroke="${TEE3}" stroke-width="4" opacity=".55" ${CAP}`);
      arm += P(`M${pt(add(h0, ps, .6))} Q${pt(add(hc0, ps, .6))} ${pt(h1)}`, 'none', `stroke="${COLD}" stroke-width="1" opacity="${f1(.35 * cold)}" ${CAP}`);
    }
    g += handSh;
    if (inside) g += armSh + arm;

    // ---------- передняя стенка кармана поверх пальцев ----------
    g += G(coatArt(), '', 'clip-path="url(#cp_bag)"');
    if (show && tipD > -6) {
      // ткань обтягивает кисть (тиснение): мягкая тень сверху-справа, свет снизу-слева, середина — та же ткань
      const vis = clamp((tipD + 4) / 16) * (1 - kO * .6);
      let bu = '';
      bu += G(G(Hn.shape('#01040a', 2), HTR), 'translate(2.4 -3.2)', 'filter="url(#cp_b2)" opacity=".42"');
      bu += G(G(Hn.shape('#8a9cc6', 4), HTR), 'translate(-2.6 2.2)', `filter="url(#cp_b1)" opacity="${f1(.14 + .36 * cold)}"`);
      bu += G(G(Hn.shape('#e3ad74', 4), HTR), 'translate(-.6 3)', 'filter="url(#cp_b1)" opacity=".34"');
      bu += G(coatArt(), '', 'mask="url(#cp_hsil)"');
      bu += G(G(Hn.shape('#8090b4', 0), HTR), 'translate(-1 2)', `filter="url(#cp_b3)" opacity="${f1(.12 + .1 * cold)}"`);
      bu += G(G(Hn.shape('#d9a36e', -2), HTR), 'translate(0 3)', 'filter="url(#cp_b3)" opacity=".14"');
      Hn.F.forEach((q, i) => {
        const wig = ru * 3.4 * Math.sin(tt * 13 + i * 1.9), side = ru * 1.4 * Math.sin(tt * 9 + i * 2.7);
        [[1.5, 4.6, 3.4], [q.l * .55 + wig, 3.8, 2.8]].forEach(([k, rx, ry]) => {
          const X = toW(q.b[0] + q.d[0] * k + q.n[0] * side, q.b[1] + q.d[1] * k + q.n[1] * side);
          const kk = clamp((depth(X) - 3) / 8);
          if (kk <= 0) return;
          bu += `<ellipse cx="${f1(X[0] + 2.2)}" cy="${f1(X[1] - 2)}" rx="${rx}" ry="${f1(ry * .8)}" transform="rotate(${f1(th)} ${f1(X[0] + 2.2)} ${f1(X[1] - 2)})" fill="#02050c" opacity="${f1(.2 * kk)}" filter="url(#cp_b2)"/>`;
          bu += `<ellipse cx="${f1(X[0] - 1)}" cy="${f1(X[1] + 1)}" rx="${f1(rx * .8)}" ry="${f1(ry * .7)}" transform="rotate(${f1(th)} ${f1(X[0] - 1)} ${f1(X[1] + 1)})" fill="#6e81aa" opacity="${f1(kk * (.18 + .3 * cold))}" filter="url(#cp_b2)"/>`;
        });
      });
      // складки натяжения от концов прорези к костяшкам
      const Kc = toW(33, 0);
      const fold = (a, b, c) => P(`M${pt(a)} Q${pt(c)} ${pt(b)}`, 'none', `stroke="#040812" stroke-width="2" opacity="${f1(.55 * load)}" ${CAP}`) +
        P(`M${pt(add(a, [-1.4, 1.4]))} Q${pt(add(c, [-1.4, 1.4]))} ${pt(add(b, [-1.4, 1.4]))}`, 'none', `stroke="#4a5878" stroke-width=".9" opacity="${f1((.16 + .2 * cold) * load)}" ${CAP}`);
      bu += fold(add(add(A, U, 9), N, 6), add(Kc, U, -11), add(add(A, U, 18), N, 18));
      bu += fold(add(add(B, U, -9), N, 6), add(Kc, U, 11), add(add(B, U, -15), N, 18));
      g += G(bu, '', `clip-path="url(#cp_bag)" opacity="${f1(vis)}"`);
    }
    // строчка мешка кармана (показывает его размер)
    g += P(`M${pt(add(add(B, N, 28), U, 4))} Q${pt(add(add(B, N, DEEP + 8), U, -4))} ${pt(add(add(C0, N, DEEP + 4), U, -6))} Q${pt(add(add(A, N, DEEP - 4), U, -10))} ${pt(add(add(A, N, 22), U, -4))}`, 'none', 'stroke="#3d4964" stroke-width=".9" opacity=".45" stroke-dasharray="2.4 2.2"');
    if (show && !inside) g += armSh;

    // ---------- подкладка: вывернута светлым мятым язычком ----------
    const kLn = eout(lin(t, to + .26, to + .6));
    if (kLn > 0) {
      const ta = t - to - .45, sway = ta > 0 ? 4 * Math.exp(-3.2 * ta) * Math.sin(ta * 13) : 0;
      const gv0 = [-N[0] * .35 + .12, -N[1] * .35 + .93], gl = Math.hypot(gv0[0], gv0[1]), gv = [gv0[0] / gl, gv0[1] / gl];
      const r0 = add(A, U, SL * .28), r1 = add(A, U, SL * .64), rc = add(A, U, SL * .45);
      const len = 44 * kLn;
      const tip = add(add(rc, gv, len), U, sway + 1);
      const s0 = add(add(r0, gv, len * .66), U, -3), s1 = add(add(r1, gv, len * .62), U, 4);
      const lob = add(add(rc, gv, len * .82), U, 7);
      const tong = `M${pt(r0)} Q${pt(add(add(r0, gv, len * .32), U, -4))} ${pt(s0)} Q${pt(add(add(tip, U, -9), gv, 1))} ${pt(tip)} Q${pt(add(add(tip, U, 5), gv, 2))} ${pt(lob)} Q${pt(add(add(lob, U, 6), gv, -2))} ${pt(s1)} Q${pt(add(add(r1, gv, len * .3), U, 3))} ${pt(r1)} Z`;
      g += G(P(tong, '#02050b'), 'translate(3 1)', 'opacity=".6" filter="url(#cp_b2)"');
      g += P(tong, 'url(#cp_lin)', `stroke="#1c2130" stroke-width="1" ${CAP}`);
      g += P(`M${pt(add(rc, gv, 4))} Q${pt(add(add(rc, gv, len * .5), U, -4))} ${pt(add(add(tip, gv, -4), U, -1))}`, 'none', `stroke="#5a6072" stroke-width="2.2" opacity=".75" ${CAP}`);
      g += P(`M${pt(add(add(r1, gv, 4), U, -3))} Q${pt(add(add(r1, gv, len * .45), U, -1))} ${pt(add(lob, U, -3))}`, 'none', `stroke="#626a7c" stroke-width="1.4" opacity=".7" ${CAP}`);
      g += P(`M${pt(s0)} Q${pt(add(add(tip, U, -9), gv, 1))} ${pt(tip)} Q${pt(add(add(tip, U, 5), gv, 2))} ${pt(lob)}`, 'none', `stroke="${WARM}" stroke-width="1.2" opacity=".3" ${CAP}`);
      g += P(`M${pt(add(add(s0, gv, -3), U, 2))} Q${pt(add(add(tip, U, -7), gv, -3))} ${pt(add(tip, gv, -3.4))}`, 'none', 'stroke="#d5d7de" stroke-width=".7" opacity=".4" stroke-dasharray="1.8 1.8"');
      g += P(`M${pt(r0)} Q${pt(add(rc, gv, 6))} ${pt(r1)}`, 'none', `stroke="#141927" stroke-width="3" opacity=".6" ${CAP}`);
    }

    // ---------- кант прорези (передняя губа) — поверх пальцев и подкладки ----------
    const wA = add(A, N, 5.2), wB = add(B, N, 5.2), wC = add(cU, N, 5.2);
    g += P(`M${pt(A)} Q${pt(cU)} ${pt(B)} L${pt(wB)} Q${pt(wC)} ${pt(wA)} Z`, '#1e283e', 'opacity=".75"');
    g += P(`M${pt(add(A, N, 2.8))} Q${pt(add(cU, N, 2.8))} ${pt(add(B, N, 2.8))}`, 'none', 'stroke="#46526c" stroke-width=".75" opacity=".45" stroke-dasharray="2 2"');
    g += P(`M${pt(A)} Q${pt(cU)} ${pt(B)}`, 'none', `stroke="#34405a" stroke-width="1.2" opacity="${f1(.55 + .35 * load)}" ${CAP}`);
    g += P(`M${pt(add(A, N, .4))} Q${pt(add(cU, N, .4))} ${pt(add(B, N, .4))}`, 'none', `stroke="${WARM}" stroke-width=".8" opacity="${f1(.08 + .18 * clamp(open / 6))}" ${CAP}`);
    g += P(`M${pt(wA)} Q${pt(wC)} ${pt(wB)}`, 'none', `stroke="#0a101d" stroke-width=".8" opacity=".3" ${CAP}`);
    [A, B].forEach(X => g += L(X[0] - N[0] * .5, X[1] - N[1] * .5, X[0] + N[0] * 5.2, X[1] + N[1] * 5.2, '#3a4660', 1.6, `opacity=".6" ${CAP}`));

    if (show && !inside) g += arm;

    // ---------- виньетка, чистая зона субтитров ----------
    g += R(-20, -20, 400, 396, 'url(#cp_vig)');
    g += R(-20, 340, 400, 35, 'url(#cp_bottom)') + R(-20, 374, 400, 300, '#03060c');
    return g;
  };
})();

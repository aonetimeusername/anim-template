// ключ g: horn_close — крупно наружный рупор на стене над козырьком входа, ночь, метель
// p.tWake  — абс. время «пробуждения»: ком снега вздрагивает, щелчок реле, снег съезжает, загорается красный огонёк.
//            −10 (любое далёкое прошлое) = рупор уже раскрыт; не задан = рупор спит под снегом весь кадр
// p.listen — после пробуждения к устью тянутся красные дуги ВНУТРЬ (слушает)
// p.tSay   — [t0,t1] абс.: рупор говорит — тёплые дуги наружу, дрожь корпуса, снег сыплется с шапки, светодиод белеет
// p.wave   — 'tema': справа рисуется жёлтая волна записи «здесь.m4a» за [t0,t1], в t0 глитч 0.2 с
(() => {
  const rad = d => d * Math.PI / 180;
  const frac = x => x - Math.floor(x);

  // огибающая записи «здесь.m4a» (та же форма, что в phone_ui ч.1): tau — секунды записи 0..1.2, k — номер столбика
  // TODO: вынести в lib (сейчас продублирована в c_scenes.js/phone_ui)
  function recEnv(tau, k) {
    const env = 0.16 + 0.84 * Math.exp(-Math.pow((tau - 0.62) / 0.24, 2)) + 0.18 * Math.exp(-Math.pow((tau - 0.14) / 0.1, 2));
    return Math.min(1, env * (0.55 + 0.45 * Math.abs(noise1(k * 1.9 + 4))));
  }

  // ---- геометрия рупора: локальные координаты (ось раструба +x), поворот 30° вниз-вправо
  const HA = 30, HS = 1.0;
  const HX = 150, HY = 160;
  const hc = Math.cos(rad(HA)), hs = Math.sin(rad(HA));
  const toW = (lx, ly) => [HX + HS * (lx * hc - ly * hs), HY + HS * (lx * hs + ly * hc)];
  const MOUTH = toW(70, 0), MR = 34 * HS;            // центр устья и «радиус» кромки
  const LED = toW(-16, -8);                          // светодиод на корпусе-драйвере
  const half = x => 9 + 25 * Math.pow(Math.max(0, (x - 4) / 66), 1.6);   // полувысота раструба (экспоненциальный)
  // ком снега: кружки в локальных координатах [x, y, r] (тело / шапка сверху / низ у кромки)
  const LC = [
    [-36, 0, 19], [-24, -1, 20], [-12, -1, 19], [0, -2, 17], [12, -3, 17], [24, -4, 20], [36, -5, 23], [48, -5, 26], [60, -6, 28], [70, -8, 27],
    [-6, -8, 18], [6, -10, 18], [4, 8, 12],
    [-30, -12, 16], [-14, -16, 17], [2, -17, 17], [20, -20, 19], [40, -26, 19], [60, -30, 15],
  ].map(([x, y, r]) => { const [wx, wy] = toW(x, y); return [wx, wy, r * HS]; });
  const LCX = LC.reduce((a, c) => a + c[0], 0) / LC.length, LCY = LC.reduce((a, c) => a + c[1], 0) / LC.length;
  const CAN = 300;                                   // верх плиты козырька
  const cushTop = x => CAN - 9.5 + 1.8 * noise1(x * 0.035 + 1.3) + 0.9 * noise1(x * 0.12 + 7);

  // дуга вокруг точки (cx,cy) радиуса r, направление dir° (0 — вправо, по часовой вниз), раствор ±half°
  function arc(cx, cy, r, dir, hf) {
    const a0 = rad(dir - hf), a1 = rad(dir + hf);
    return `M${f1(cx + Math.cos(a0) * r)} ${f1(cy + Math.sin(a0) * r)} A${f1(r)} ${f1(r)} 0 0 1 ${f1(cx + Math.cos(a1) * r)} ${f1(cy + Math.sin(a1) * r)}`;
  }
  function bellPath(k0, k1) {          // полоса раструба между долями полувысоты k0..k1 (−1 верх, +1 низ)
    let a = '', b = '';
    for (let i = 0; i <= 12; i++) { const x = 4 + 66 * i / 12; a += (i ? ' L' : 'M') + `${f1(x)} ${f1(half(x) * k0)}`; }
    for (let i = 12; i >= 0; i--) { const x = 4 + 66 * i / 12; b += ` L${f1(x)} ${f1(half(x) * k1)}`; }
    return a + b + ' Z';
  }

  // ---- корпус рупора (локально)
  function hornBody(t, listenK, sayK, ledCol, ledOn) {
    let h = '';
    h += `<ellipse cx="-38" cy="0" rx="4.5" ry="16" fill="#46516a"/>`;
    h += R(-38, -16, 31, 32, '#5f6c85', 'rx="3"');
    h += R(-38, -16, 31, 7, '#76849f', 'rx="3"') + R(-38, 9, 31, 7, '#4a566e', 'rx="3"');
    for (const x of [-37, -24.5, -9.5]) h += R(x, -17, 2.8, 34, '#4b5770', 'rx="1.2"') + R(x, -17, 1, 34, '#8d9ab2', 'opacity=".55"');
    h += R(-33, -18.5, 5, 37, '#3a4560', 'rx="1.5"') + R(-33, -18.5, 5, 3, '#56658a', 'rx="1"');     // хомут
    h += R(-21, -13.5, 10, 10, '#262f42', 'rx="1.6"') + R(-21, -13.5, 10, 1.6, '#3b4760', 'rx="1"');  // модуль со светодиодом
    h += R(-6.5, -18, 4.5, 36, '#56627a', 'rx="1.5"') + R(-6.5, -18, 4.5, 4, '#7684a0', 'rx="1.5"');   // фланец
    h += R(-2, -9, 7, 18, '#4f5b73') + R(-2, -9, 7, 4, '#66738c');                                    // горло
    // раструб
    h += P(bellPath(-1, 1), '#6b7891');
    h += P(bellPath(-1, -0.42), '#808da6');
    h += P(bellPath(0.5, 1), '#56627b');
    let top = '';
    for (let i = 0; i <= 12; i++) { const x = 4 + 66 * i / 12; top += (i ? ' L' : 'M') + `${f1(x)} ${f1(-half(x))}`; }
    h += P(top, 'none', 'stroke="#a3afc3" stroke-width="1.2"');
    for (const x of [28, 50]) h += L(x, -half(x) + 0.6, x, half(x) - 0.6, '#5c6881', 1.2);
    // кромка и глубина устья
    h += `<ellipse cx="70" cy="0" rx="9.5" ry="34.5" fill="#8a96ad"/>`;
    h += `<ellipse cx="69.4" cy="-1" rx="8" ry="32.5" fill="none" stroke="#b9c3d2" stroke-width="1.1" opacity=".7"/>`;
    h += `<ellipse cx="71.2" cy="0.4" rx="6.8" ry="30.5" fill="#1a2233"/>`;
    h += `<ellipse cx="72.8" cy="1" rx="3.6" ry="16" fill="#0b1018"/>`;
    // свет в глубине: красный (слушает) / тёплый (говорит)
    if (listenK > 0.01) h += `<ellipse cx="72" cy="0.6" rx="6" ry="27" fill="url(#hcl_red)" opacity="${f1(listenK)}"/>`;
    if (sayK > 0.01) h += `<ellipse cx="72" cy="0.6" rx="6.6" ry="29.5" fill="url(#hcl_warm)" opacity="${f1(sayK)}"/>`;
    // светодиод
    h += Ci(-16, -8, 3.2, '#141a26') + Ci(-16, -8, 2.5, ledOn > 0 ? ledCol : '#3a1a20', ledOn > 0 ? `opacity="${f1(0.45 + 0.55 * ledOn)}"` : '');
    if (ledOn > 0) h += Ci(-16.7, -8.7, 0.9, '#fff', `opacity="${f1(0.85 * ledOn)}"`);
    return h;
  }
  // шапка снега после схода (локально): по верху драйвера и раструба + шапочка на кромке
  function hornCap(k) {
    if (k <= 0) return '';
    const edge = [[-40, -16], [-6.5, -17.5], [-2, -9.5]];
    for (let i = 0; i <= 10; i++) { const x = 4 + 66 * i / 10; edge.push([x, -half(x)]); }
    const N = 26, seg = [];
    let len = 0;
    for (let i = 1; i < edge.length; i++) { const l = Math.hypot(edge[i][0] - edge[i - 1][0], edge[i][1] - edge[i - 1][1]); seg.push(l); len += l; }
    const top = [], bot = [];
    for (let j = 0; j <= N; j++) {
      let sd = len * j / N, i = 0;
      while (i < seg.length - 1 && sd > seg[i]) { sd -= seg[i]; i++; }
      const f = Math.min(1, sd / seg[i]);
      const x = mix(edge[i][0], edge[i + 1][0], f), y = mix(edge[i][1], edge[i + 1][1], f);
      const q = j / N;
      const th = (2.0 + 3.4 * Math.sin(q * Math.PI) + 1.4 * noise1(q * 9 + 2)) * k;
      top.push([x - 0.5 * th * 0.5, y - th]);
      bot.push([x, y + 0.8]);
    }
    let d = `M${f1(bot[0][0])} ${f1(bot[0][1])}`;
    top.forEach(p => { d += ` L${f1(p[0])} ${f1(p[1])}`; });
    for (let j = bot.length - 1; j >= 0; j--) d += ` L${f1(bot[j][0])} ${f1(bot[j][1])}`;
    let g = P(d + ' Z', '#cfd8e6', 'stroke="#cfd8e6" stroke-width="1.6" stroke-linejoin="round"');
    g += P(`M${top.map(p => `${f1(p[0])} ${f1(p[1] + 0.3)}`).join(' L')}`, 'none', 'stroke="#eef3f9" stroke-width="1" opacity=".8"');
    g += `<ellipse cx="68" cy="-34.5" rx="${f1(8 * k)}" ry="${f1(4.4 * k)}" fill="#cfd8e6" transform="rotate(-24 68 -34.5)"/>`;
    g += `<ellipse cx="-38" cy="-14.5" rx="${f1(5 * k)}" ry="${f1(3.2 * k)}" fill="#cfd8e6"/>`;
    return g;
  }
  // мягкий замкнутый контур по точкам (квадратичные сплайны через середины)
  function smooth(pts, dx = 0, dy = 0) {
    const n = pts.length, m = i => [(pts[i][0] + pts[(i + 1) % n][0]) / 2 + dx, (pts[i][1] + pts[(i + 1) % n][1]) / 2 + dy];
    let d = `M${f1(m(n - 1)[0])} ${f1(m(n - 1)[1])}`;
    for (let i = 0; i < n; i++) { const q = m(i); d += ` Q${f1(pts[i][0] + dx)} ${f1(pts[i][1] + dy)} ${f1(q[0])} ${f1(q[1])}`; }
    return d + ' Z';
  }
  // контур кома: огибающая кружков LC лучами из центра, сглаженная, с лёгкой «снежной» неровностью
  const HULL = (() => {
    const n = 60, rs = [];
    for (let k = 0; k < n; k++) {
      const th = k / n * Math.PI * 2, dx = Math.cos(th), dy = Math.sin(th);
      let best = 0;
      for (const [x, y, r] of LC) {
        const px = x - LCX, py = y - LCY, b = dx * px + dy * py, disc = b * b - (px * px + py * py) + r * r;
        if (disc >= 0) best = Math.max(best, b + Math.sqrt(disc));
      }
      rs.push(best);
    }
    let cur = rs;
    for (let it = 0; it < 3; it++) cur = cur.map((_, k) => { const g = j => cur[(k + j + n) % n]; return (g(-2) + 2 * g(-1) + 3 * g(0) + 2 * g(1) + g(2)) / 9; });
    return cur.map((r, k) => {
      const th = k / n * Math.PI * 2, up = Math.max(0, -Math.sin(th));
      const rr = r * (1 + 0.035 * noise1(th * 3.1 + 2) + 0.05 * up * noise1(th * 8.5 + 5) + 0.02 * noise1(th * 17 + 1));
      return [LCX + Math.cos(th) * rr, LCY + Math.sin(th) * rr];
    });
  })();
  // ком снега целиком (мир): тень, тело, блики, складки; из-под низа темнеет устье
  function lumpSvg(ledOn) {
    let g = '';
    const H0 = smooth(HULL);
    g += P(smooth(HULL, 2, 4), '#050a16', 'opacity=".35"');                       // тень на стене
    let body = '';
    body += P(H0, '#cfd8e6');
    body += P(H0 + ' ' + smooth(HULL, 0, 4.5), '#eef3f9', 'fill-rule="evenodd"');    // светлая кромка сверху
    body += P(H0 + ' ' + smooth(HULL, -3, -9), '#9fb0c8', 'fill-rule="evenodd"');    // голубая тень снизу
    body += P(H0 + ' ' + smooth(HULL, -1, -4), '#b3c2d6', 'fill-rule="evenodd" opacity=".55"');
    // складки и вмятины
    const a = toW(-34, 4), b = toW(4, 10), c = toW(36, 10);
    body += P(`M${f1(a[0])} ${f1(a[1])} Q${f1(b[0])} ${f1(b[1] + 3)} ${f1(c[0])} ${f1(c[1])}`, 'none', 'stroke="#a9b9cf" stroke-width="1.8" stroke-linecap="round"');
    const d1 = toW(14, -24), d2 = toW(36, -32), d3 = toW(56, -36);
    body += P(`M${f1(d1[0])} ${f1(d1[1])} Q${f1(d2[0])} ${f1(d2[1] - 3)} ${f1(d3[0])} ${f1(d3[1])}`, 'none', 'stroke="#b4c3d7" stroke-width="1.4" stroke-linecap="round" opacity=".8"');
    // устье едва темнеет из-под снега: тёмная впадина у нижнего правого края
    {
      const [mx, my] = toW(74, 12);
      body += `<ellipse cx="${f1(mx + 1)}" cy="${f1(my + 1)}" rx="7.5" ry="20" fill="#8a9cb7" transform="rotate(${HA} ${f1(mx + 1)} ${f1(my + 1)})"/>`;
      body += `<ellipse cx="${f1(mx + 2)}" cy="${f1(my + 3)}" rx="5" ry="15" fill="#1a2233" opacity=".8" transform="rotate(${HA} ${f1(mx + 2)} ${f1(my + 3)})"/>`;
      const [ox, oy] = toW(66, 2);
      body += `<ellipse cx="${f1(ox)}" cy="${f1(oy)}" rx="12" ry="18" fill="#cfd8e6" transform="rotate(${HA} ${f1(ox)} ${f1(oy)})"/>`;
    }
    for (const [lx, ly, r] of [[-22, -6, 2.2], [30, -6, 1.8], [52, 4, 2.4], [8, -10, 1.5]]) { const [x, y] = toW(lx, ly); body += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r * 1.6)}" ry="${f1(r * 0.7)}" fill="#b6c4d7"/>`; }
    g += `<clipPath id="hcl_lc"><path d="${H0}"/></clipPath>` + G(body, '', 'clip-path="url(#hcl_lc)"');
    // свисающие сосульки снизу кома
    for (const [lx, ly, l] of [[24, 22, 9], [46, 30, 13], [-26, 19, 6]]) {
      const [x, y] = toW(lx, ly);
      g += P(`M${f1(x - 2.5)} ${f1(y - 3)} L${f1(x + 2.5)} ${f1(y - 3)} L${f1(x + 0.3)} ${f1(y + l)} Z`, '#bcd0e6');
    }
    // красный свет сквозь снег
    if (ledOn > 0) {
      g += Ci(LED[0], LED[1], 30, 'url(#glowR)', `opacity="${f1(ledOn)}"`);
      g += Ci(LED[0], LED[1], 7, '#ff6a5a', `opacity="${f1(0.45 * ledOn)}"`);
    }
    return g;
  }

  // ---- фон: стена, окно 214, кабель, кронштейн
  function wall(t) {
    let g = R(-20, -20, 400, 680, '#0d1830');
    // ряды панелей с еле заметной разницей тона
    for (let r = 0; r < 10; r++) {
      const y = -20 + r * 34;
      const v = hash(r * 3.7 + 1);
      if (v > 0.55) g += R(-20, y, 400, 34, `rgba(30,48,84,${f1(0.10 + 0.12 * (v - 0.55))})`);
      if (v < 0.25) g += R(-20, y, 400, 34, 'rgba(4,9,20,.18)');
    }
    g += Ci(150, 170, 230, 'url(#hcl_amb)');
    for (let y = 14; y < CAN; y += 34) {
      g += L(-20, y, 380, y, '#0b1528', 2) + L(-20, y + 1.6, 380, y + 1.6, '#142240', 0.8, 'opacity=".8"');
      // налипший снег на кромке шва
      for (let i = 0; i < 6; i++) {
        const x = hash(i * 5.3 + y) * 380 - 10, w = 6 + hash(i * 2.2 + y) * 22;
        g += R(x, y - 1.6, w, 1.4, '#9fb0c8', `rx=".7" opacity="${f1(0.10 + 0.16 * hash(i + y))}"`);
      }
    }
    g += L(112, -20, 112, CAN, '#0b1528', 2) + L(113.6, -20, 113.6, CAN, '#142240', 0.8);
    // водосточная труба слева
    g += R(14, -20, 15, CAN + 20, '#16233d') + R(14, -20, 4, CAN + 20, '#22314f') + R(25, -20, 4, CAN + 20, '#101a30');
    for (const y of [40, 150, 258]) {
      g += R(11, y, 21, 5, '#1d2b48', 'rx="1"') + R(9, y - 1.5, 25, 2.2, '#b9c6d8', 'rx="1" opacity=".55"');
    }
    // угол окна 214 (закрыто)
    const wx = 230, wb = 74;
    g += R(wx, -20, 160, wb + 20, '#24324d');
    g += R(wx + 8, -20, 62, wb - 8 + 20, '#06102a') + R(wx + 78, -20, 90, wb - 8 + 20, '#06102a');
    g += P(`M${wx + 8} 28 L${wx + 44} -20 L${wx + 58} -20 L${wx + 8} 46 Z`, '#9fd0ff', 'opacity=".07"');
    g += P(`M${wx + 78} 50 L${wx + 130} -20 L${wx + 140} -20 L${wx + 78} 62 Z`, '#9fd0ff', 'opacity=".05"');
    g += R(wx + 8, -20, 62, wb - 8 + 20, 'none', 'stroke="#18233b" stroke-width="1.4"');
    // снег в нижних углах стёкол
    g += P(`M${wx + 8} ${wb - 8} L${wx + 8} ${wb - 17} Q${wx + 12} ${wb - 12} ${wx + 26} ${wb - 10} L${wx + 34} ${wb - 8} Z`, '#cfd8e6', 'opacity=".75"');
    g += P(`M${wx + 78} ${wb - 8} L${wx + 78} ${wb - 14} Q${wx + 84} ${wb - 10} ${wx + 98} ${wb - 9} L${wx + 104} ${wb - 8} Z`, '#cfd8e6', 'opacity=".65"');
    // ручка створки (изнутри, тускло)
    g += R(wx + 64, 18, 3, 12, '#3a4a6a', 'rx="1"');
    // отлив и снег на нём
    g += R(wx - 8, wb, 180, 6, '#2f3f5e') + R(wx - 8, wb + 6, 180, 3, 'rgba(0,0,0,.35)');
    g += P(`M${wx - 8} ${wb} L${wx - 8} ${wb - 4} Q${wx + 20} ${wb - 9} ${wx + 52} ${wb - 6} T${wx + 120} ${wb - 6} T${wx + 175} ${wb - 5} L${wx + 175} ${wb} Z`, '#cfd8e6');
    g += P(`M${wx - 8} ${wb - 4} Q${wx + 20} ${wb - 9} ${wx + 52} ${wb - 6} T${wx + 120} ${wb - 6}`, 'none', 'stroke="#eef3f9" stroke-width="1" opacity=".7"');
    for (const [x, l] of [[wx + 14, 7], [wx + 61, 11], [wx + 112, 6]]) g += P(`M${x - 2} ${wb + 6} L${x + 2} ${wb + 6} L${x} ${wb + 6 + l} Z`, '#b9cbe0', 'opacity=".8"');
    // кабель от модуля рупора вверх по стене, на трёх скобах, под отлив 214
    const c0 = toW(-16, -13.5);
    const cab = `M${f1(c0[0])} ${f1(c0[1])} C ${f1(c0[0] + 1)} 128, 148 124, 148 114 L148 112 Q148 104 156 104 L224 104 Q232 104 232 96 L232 ${wb + 6}`;
    g += P(cab, 'none', 'stroke="#04070e" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"');
    g += P(cab, 'none', 'stroke="#2a3550" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round" transform="translate(-0.7 -0.7)"');
    g += R(159, 101.4, 58, 1.6, '#cfd8e6', 'rx=".8" opacity=".55"');                    // снег на горизонтальном участке
    for (const [x, y, v] of [[148, 118, 1], [192, 104, 0], [232, 90, 1]]) {
      g += v ? R(x - 4, y - 1.6, 8, 3.2, '#3a4560', 'rx="1"') + Ci(x - 3, y, 0.9, '#5a6782') + Ci(x + 3, y, 0.9, '#5a6782')
        : R(x - 1.6, y - 4, 3.2, 8, '#3a4560', 'rx="1"') + Ci(x, y - 3, 0.9, '#5a6782') + Ci(x, y + 3, 0.9, '#5a6782');
    }
    // Г-кронштейн: пластина на шве x=112, вынос вправо и стойка вниз к хомуту
    const cl = toW(-30.5, -18.5);
    g += R(104, 96, 16, 36, '#26324b', 'rx="2"') + R(104, 96, 16, 3, '#3d4b68', 'rx="1.5"');
    for (const y of [102, 126]) g += Ci(112, y, 1.8, '#4a5876') + L(110.8, y, 113.2, y, '#141c2e', 0.7);
    g += P(`M110 106 L${f1(cl[0] + 3)} 106 L${f1(cl[0] + 3)} ${f1(cl[1] + 2)} L${f1(cl[0] - 3)} ${f1(cl[1] + 2)} L${f1(cl[0] - 3)} 112 L110 112 Z`, '#3a4560');
    g += L(110, 106.6, cl[0] + 2.4, 106.6, '#56658a', 1) + L(cl[0] + 2.4, 106.6, cl[0] + 2.4, cl[1], '#4a5876', 0.8);
    g += P(`M108 106 Q${f1((108 + cl[0]) / 2)} 101 ${f1(cl[0] + 4)} 105 L${f1(cl[0] + 4)} 106.4 L108 106.4 Z`, '#cfd8e6', 'opacity=".9"');
    return g;
  }

  // ---- козырёк входа
  function canopy(t) {
    let g = '';
    // тёплый подсвет от лампы под козырьком
    g += Ci(150, 316, 120, 'url(#glowW)', `opacity="${f1(0.30 * (1 + 0.05 * noise1(t * 7)))}"`);
    g += R(-20, CAN, 400, 12, '#2a3a58') + R(-20, CAN, 400, 2, '#3b4f74') + R(-20, CAN + 10, 400, 2, '#1c2840');
    // снежная подушка с карнизом
    let d = 'M-20 ' + CAN;
    for (let x = -20; x <= 380; x += 8) d += ` L${x} ${f1(cushTop(x))}`;
    d += ` L380 ${CAN}`;
    for (let x = 380; x >= -20; x -= 10) d += ` L${x} ${f1(CAN + 2.4 + 1.6 * Math.max(0, noise1(x * 0.09 + 4)))}`;
    g += P(d + ' Z', '#cfd8e6');
    let top = '';
    for (let x = -20; x <= 380; x += 8) top += (x === -20 ? 'M' : ' L') + `${x} ${f1(cushTop(x) + 0.4)}`;
    g += P(top, 'none', 'stroke="#eef3f9" stroke-width="1.4" opacity=".8"');
    g += P(`M-20 ${CAN - 2} L380 ${CAN - 2} L380 ${CAN + 2} L-20 ${CAN + 2} Z`, '#9fb0c8', 'opacity=".55"');
    // сосульки
    for (const [x, len, w] of [[38, 15, 5], [101, 24, 6], [176, 11, 4.5], [247, 20, 5.5], [316, 13, 4.5]]) {
      g += P(`M${x - w / 2} ${CAN + 11} L${x + w / 2} ${CAN + 11} L${x + 0.5} ${CAN + 11 + len} Z`, '#bcd0e6');
      g += L(x - w / 4, CAN + 12, x + 0.3, CAN + 9 + len * 0.8, '#eef6ff', 0.8, 'opacity=".75"');
    }
    return g;
  }

  // ---- куски снега: старт в теле кома, падение с g=900, приземление на подушку
  const SLAB = 0.15;                                 // ком сползает целиком, потом рассыпается
  const CH = [];
  for (let i = 0; i < 14; i++) {
    const src = LC[Math.floor(hash(i * 3.71 + 0.3) * LC.length)];
    const th = hash(i * 5.31 + 0.7) * Math.PI * 2, rr = src[2] * 0.55 * Math.sqrt(hash(i * 6.2 + 1));
    const sx = src[0] + Math.cos(th) * rr, sy = src[1] + Math.sin(th) * rr * 0.8 + 4;
    const r = 3 + 5 * hash(i * 7.13 + 0.1);
    const vx = (sx - LCX) * 0.9 + (hash(i * 2.9) - 0.5) * 50 - 12, vy = SLAB * 900 - 40 + 70 * hash(i * 8.3);
    const del = 0.05 * hash(i * 4.4) + (sy < LCY ? 0.04 : 0);
    const sy0 = sy + 450 * SLAB * SLAB, sx0 = sx - 10 * SLAB;
    // время до подушки: sy0 + vy s + 450 s² = yl
    const yl = CAN - 10 - r * 0.25;
    const sl = (-vy + Math.sqrt(vy * vy + 4 * 450 * (yl - sy0))) / 900;
    CH.push({ sx: sx0, sy: sy0, r, vx, vy, del, sl, yl, xl: sx0 + vx * sl });
  }
  // мелкая крошка
  const CR = [];
  for (let i = 0; i < 20; i++) {
    const q = HULL[Math.floor(hash(i * 2.3 + 9) * HULL.length)];
    const sx = mix(q[0], LCX, 0.25 * hash(i * 4.1)), sy = mix(q[1], LCY, 0.25 * hash(i * 6.6)) + 450 * SLAB * SLAB;
    CR.push({ sx, sy, r: 0.9 + 1.4 * hash(i * 3.3), vx: (sx - LCX) * 1.6 + (hash(i * 7.7) - 0.5) * 80, vy: 60 + 160 * hash(i * 5.9) });
  }
  function chunk(x, y, r, i, sq = 1) {
    const a = hash(i * 1.3) * 6.28;
    return `<ellipse cx="${f1(x + 0.8)}" cy="${f1(y + r * 0.35 * sq)}" rx="${f1(r * 1.05)}" ry="${f1(r * 0.82 * sq)}" fill="#9fb0c8"/>` +
      `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * 0.8 * sq)}" fill="#cfd8e6"/>` +
      Ci(x + Math.cos(a) * r * 0.55, y - r * 0.35 * sq, r * 0.55 * Math.min(1, sq + 0.3), '#dfe7f1');
  }

  SCENES.horn_close = function (u, p, d, t) {
    const tW = (p.tWake === undefined || p.tWake === null) ? 1e9 : p.tWake;
    const aW = t - tW;                                    // секунды после пробуждения
    const tB = tW + 0.25;                                 // срыв кома
    const aB = t - tB;
    const say = p.tSay || null;
    const tt = t + 0.5 * Math.sin(t * 0.9);              // порывы метели

    // ---- голос
    let lv = 0, sayK = 0;
    if (say) {
      const [s0, s1] = say;
      sayK = lin(t, s0 - 0.02, s0 + 0.06) * (1 - lin(t, s1 - 0.1, s1 + 0.25));
      const env = lin(t, s0, s0 + 0.05) * (1 - lin(t, s1 - 0.42, s1 - 0.12));
      lv = env * (0.55 + 0.45 * Math.abs(noise1(t * 9 + 3)));
    }
    const awake = aW >= 0;
    const ledOn = awake ? lin(aW, 0.15, 0.2) : 0;
    // пульс 0.55+0.45·sin(3.2t), фаза от пробуждения: огонёк загорается на пике; при загорании короткая вспышка
    const pulse = 0.55 + 0.45 * Math.sin((t - tW - 0.15) * 3.2 + Math.PI / 2);
    const flare = awake ? 1 + 1.3 * (1 - lin(aW, 0.15, 0.5)) * (aW > 0.15 ? 1 : 0) : 1;
    const white = say ? lin(t, say[0] - 0.02, say[0] + 0.04) * (1 - lin(t, say[1], say[1] + 0.12)) : 0;
    const listenK = (p.listen && awake) ? lin(aW, 0.5, 1.0) * (1 - 0.9 * sayK) : 0;

    let g = `<defs>
      <radialGradient id="hcl_amb"><stop offset="0" stop-color="#3b5d92" stop-opacity=".22"/><stop offset="1" stop-color="#3b5d92" stop-opacity="0"/></radialGradient>
      <radialGradient id="hcl_red" cx=".6" cy=".5"><stop offset="0" stop-color="#ff5a4a" stop-opacity=".9"/><stop offset=".6" stop-color="#c41f2e" stop-opacity=".35"/><stop offset="1" stop-color="#c41f2e" stop-opacity="0"/></radialGradient>
      <radialGradient id="hcl_warm" cx=".6" cy=".5"><stop offset="0" stop-color="#fff3c4" stop-opacity="1"/><stop offset=".55" stop-color="#ffcf6a" stop-opacity=".55"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
      <radialGradient id="hcl_wl"><stop offset="0" stop-color="#ffffff" stop-opacity=".85"/><stop offset=".4" stop-color="#dfe9ff" stop-opacity=".3"/><stop offset="1" stop-color="#dfe9ff" stop-opacity="0"/></radialGradient>
      <radialGradient id="hcl_puff"><stop offset="0" stop-color="#e6edf6" stop-opacity=".75"/><stop offset=".6" stop-color="#cfd8e6" stop-opacity=".3"/><stop offset="1" stop-color="#cfd8e6" stop-opacity="0"/></radialGradient>
      <radialGradient id="hcl_vig" cx=".45" cy=".3" r=".75"><stop offset=".55" stop-color="#02050c" stop-opacity="0"/><stop offset="1" stop-color="#02050c" stop-opacity=".7"/></radialGradient>
      <linearGradient id="hcl_low" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a14" stop-opacity="0"/><stop offset="1" stop-color="#050a14" stop-opacity="1"/></linearGradient>
    </defs>`;
    g += wall(t);
    // дальний слой метели (за рупором)
    g += G(snow(-20, -20, 400, 400, tt * 0.8, 80, 3, -45, .36));

    // ---- свет светодиода на стене
    if (ledOn > 0) {
      const lc = white > 0.5 ? 'url(#hcl_wl)' : 'url(#glowR)';
      g += Ci(LED[0], LED[1], white > 0.5 ? 60 : 95, lc, `opacity="${f1(ledOn * (white > 0.5 ? 0.22 : 0.42 * (0.65 + 0.35 * pulse)))}"`);
    }
    // тёплое пятно на стене, пока говорит
    if (sayK > 0) g += Ci(MOUTH[0] + 20, MOUTH[1] + 10, 120, 'url(#glowW)', `opacity="${f1(0.45 * sayK * (0.6 + 0.4 * lv))}"`);

    // ---- рупор (виден, когда снег сорвался)
    const shx = noise1(t * 55) * 1.2 * lv, shy = noise1(t * 47 + 9) * 1.2 * lv;
    const capK = awake && aB > -0.01 ? 1 : 0;
    if (aB > -0.01) {
      const ledCol = white > 0.5 ? '#ffffff' : C.red;
      const led = ledOn * (white > 0.5 ? 1 : pulse);
      let h = hornBody(t, listenK * (0.55 + 0.45 * Math.sin(t * 3.2)), sayK * (0.5 + 0.5 * lv), ledCol, led) + hornCap(capK);
      g += G(h, `translate(${f1(HX + shx)} ${f1(HY + shy)}) rotate(${HA}) scale(${HS})`);
      // ореол светодиода
      if (ledOn > 0) {
        const lc = white > 0.5 ? 'url(#hcl_wl)' : 'url(#glowR)';
        g += Ci(LED[0] + shx, LED[1] + shy, white > 0.5 ? 14 : 18 * flare, lc, `opacity="${f1(ledOn * (white > 0.5 ? 0.8 : pulse))}"`);
      }
    }

    // ---- ком снега до срыва
    if (aB < SLAB) {
      const shk = (aW > 0 && aW < 0.25) ? 2 * Math.sin(aW * 95) * (1 - aW / 0.25 * 0.5) : 0;
      const sa = Math.max(0, aB), pv = toW(-40, 0);
      g += G(lumpSvg(ledOn), `translate(${f1(shk - 10 * sa)} ${f1(450 * sa * sa)}) rotate(${f1(8 * sa / SLAB)} ${f1(pv[0])} ${f1(pv[1])})`);
    }
    // щелчок реле
    if (aW > 0 && aW < 0.24) {
      const e = aW / 0.24;
      const cx = LED[0] - 18, cy = LED[1] - 22;
      for (let i = 0; i < 4; i++) {
        const an = rad(-150 + i * 30), r0 = 6 + 5 * e, r1 = 10 + 12 * eout(e);
        g += L(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0, cx + Math.cos(an) * r1, cy + Math.sin(an) * r1, '#ffffff', 1.6, `opacity="${f1(1 - e)}" stroke-linecap="round"`);
      }
    }

    // ---- слушает: красные дуги внутрь, к устью
    if (listenK > 0.01) {
      const n = 2, sp = 0.6;
      for (let i = 0; i < n; i++) {
        const ph = frac(t * sp + i / n);                 // 0 — далеко, 1 — у устья
        const r = mix(98, MR + 6, ph);
        const al = 0.45 * listenK * Math.pow(ph, 0.8) * (1 - lin(ph, 0.82, 1));
        g += P(arc(MOUTH[0], MOUTH[1], r, HA, 58), 'none', `stroke="#ff4a4a" stroke-width="1.8" stroke-linecap="round" opacity="${f1(al)}"`);
      }
    }
    // ---- говорит: тёплые дуги наружу, 3 в секунду
    if (say) {
      const [s0, s1] = say, life = 1.05;
      for (let k = 0; k * (1 / 3) <= s1 - s0; k++) {
        const ts = s0 + k / 3, age = t - ts;
        if (age < 0 || age > life) continue;
        const ph = age / life, r = mix(20, 150, Math.pow(ph, 0.8));
        const al = 0.8 * Math.pow(1 - ph, 0.9) * Math.min(1, ph * 8 + 0.3) * (0.8 + 0.2 * hash(k + 3));
        const dA = arc(MOUTH[0], MOUTH[1], r, HA, 52 - 10 * ph);
        g += P(dA, 'none', `stroke="#ffd27a" stroke-width="${f1(7 - 3 * ph)}" stroke-linecap="round" opacity="${f1(al * 0.16)}"`);
        g += P(dA, 'none', `stroke="#ffe9a8" stroke-width="${f1(2.6 - 1.2 * ph)}" stroke-linecap="round" opacity="${f1(al)}"`);
      }
    }

    // ---- козырёк (подушка и сосульки), осевший снег
    g += canopy(t);
    if (aB >= SLAB) {
      const aS = aB - SLAB;
      // облако снежной пыли
      if (aS < 0.75) {
        const e = aS / 0.75;
        for (let i = 0; i < 8; i++) {
          const q = HULL[(i * 7) % HULL.length];
          const x = mix(q[0], LCX, 0.35) - 55 * aS, y = mix(q[1], LCY, 0.35) + 10 + 60 * aS + 50 * aS * aS;
          g += Ci(x, y, 14 + 22 * eout(e) * (0.7 + 0.5 * hash(i)), 'url(#hcl_puff)', `opacity="${f1(0.9 * Math.pow(1 - e, 1.6))}"`);
        }
      }
      CR.forEach((c, i) => {
        if (aS > 0.6) return;
        const x = c.sx + c.vx * aS - 20 * aS, y = c.sy + c.vy * aS + 450 * aS * aS;
        if (y > CAN - 8) return;
        g += Ci(x, y, c.r, '#e6edf6', `opacity="${f1(1 - lin(aS, 0.35, 0.6))}"`);
      });
      CH.forEach((c, i) => {
        const s = aS - c.del;
        if (s <= 0) { g += chunk(c.sx, c.sy, c.r, i); return; }
        if (s < c.sl) {
          const x = c.sx + c.vx * s, y = c.sy + c.vy * s + 450 * s * s;
          const vy = c.vy + 900 * s;
          // пыльный след
          for (let j = 1; j <= 2; j++) {
            const s2 = Math.max(0, s - j * 0.035);
            g += Ci(c.sx + c.vx * s2 + 3, c.sy + c.vy * s2 + 450 * s2 * s2, c.r * (0.7 - j * 0.15), '#cfd8e6', `opacity="${f1(0.28 / j)}"`);
          }
          g += chunk(x, y, c.r, i, 1 + Math.min(0.25, vy / 3000));
        } else {
          // лёг на подушку и рассыпался
          const e = Math.min(1, (s - c.sl) / 0.18);
          const x = c.xl + c.vx * 0.08 * eout(e);
          g += chunk(x, c.yl + c.r * 0.25 * e, c.r * (1 + 0.15 * e), i, 1 - 0.45 * eout(e));
          if (e < 1) for (let j = 0; j < 4; j++) {
            const an = rad(-160 + j * 45 + 20 * hash(i + j)), rr = (4 + 10 * hash(i * 3 + j)) * eout(e);
            g += Ci(x + Math.cos(an) * (c.r + rr), c.yl - 2 + Math.sin(an) * rr * 0.7, 1.1, '#e6edf6', `opacity="${f1(0.9 * (1 - e))}"`);
          }
        }
      });
    }
    // снег сыплется с шапки, пока говорит
    if (say) {
      const [s0, s1] = say;
      for (let k = 0; k < 26; k++) {
        const ts = s0 + k * 0.045;
        if (ts > s1) break;
        const age = t - ts;
        if (age < 0 || age > 0.9) continue;
        const q = hash(k * 4.7 + 1);
        const lx = mix(-36, 68, q), [bx, by] = toW(lx, (lx < 0 ? -17 : -half(lx)) - 3);
        const x = bx + shx - 25 * age + 6 * Math.sin(age * 9 + k), y = by + shy + 40 * age + 380 * age * age;
        g += Ci(x, y, 0.8 + 1.0 * hash(k * 2.1), '#e6edf6', `opacity="${f1(0.9 * (1 - age / 0.9))}"`);
      }
    }

    // ---- волна записи «здесь.m4a»
    if (say && p.wave === 'tema') {
      const [s0, s1] = say;
      const ap = lin(t, s0 - 0.02, s0 + 0.1);
      if (ap > 0) {
        const N = 30, X0 = 216, X1 = 320, WY = 246, BSP = (X1 - X0) / (N - 1);
        const prog = lin(t, s0, s1);
        let w = '';
        for (let k = 0; k < N; k++) {
          const x = X0 + k * BSP, q = k / N, tb = mix(s0, s1, q);
          if (t < tb) { w += R(x - 1, WY - 1, 2, 2, '#9fb0c8', 'rx="1" opacity=".35"'); continue; }
          let h = Math.max(2, recEnv(q * 1.2, k) * 36);
          h *= eout(lin(t, tb, tb + 0.12));
          if (t < s1) h *= 1 + 0.12 * noise1(t * 13 + k);
          h = Math.max(2, h);
          w += R(x - 1.1, WY - h / 2, 2.2, h, C.yellow, 'rx="1.1"');
        }
        const lab = P(`M${X0} ${WY + 22} l5 3 l-5 3 Z`, C.yellow) + T(X0 + 9, WY + 28, 'здесь.m4a', 8, '#9fb0c8', MONO);
        const ph = prog < 1 ? L(X0 + prog * (X1 - X0), WY - 21, X0 + prog * (X1 - X0), WY + 19, '#fff6cf', 1.2, 'opacity=".85"') : '';
        const plate = R(X0 - 12, WY - 25, X1 - X0 + 24, 60, 'rgba(4,9,20,.62)', 'rx="10" stroke="rgba(159,176,200,.28)" stroke-width="1"');
        const gl = t >= s0 && t < s0 + 0.2;
        let wv = plate;
        if (gl) {
          const j = 2 + 1.2 * Math.abs(noise1(t * 60));
          wv += G(w + lab, `translate(${f1(j)} 0)`, 'opacity=".75"').replace(new RegExp(C.yellow, 'g'), '#ff3b4a').replace(/#9fb0c8/g, '#ff3b4a');
          wv += G(w + lab, `translate(${f1(-j)} 0)`, 'opacity=".75"').replace(new RegExp(C.yellow, 'g'), '#38d6ff').replace(/#9fb0c8/g, '#38d6ff');
          // рваные полосы
          for (let i = 0; i < 3; i++) {
            const yy = WY - 24 + hash(Math.floor(t * 30) * 3.1 + i) * 60;
            wv += R(X0 - 12 + hash(i + Math.floor(t * 30)) * 20, yy, 70 + 60 * hash(i * 7 + Math.floor(t * 30)), 1.6, i % 2 ? '#ff3b4a' : '#38d6ff', 'opacity=".55"');
          }
        }
        wv += w + lab + ph;
        g += G(wv, `translate(0 ${f1((1 - eout(ap)) * 6)})`, `opacity="${f1(ap)}"`);
      }
    }

    // ---- ближний слой метели, косой влево, и полосы порывов
    g += G(snow(-14, -14, 248, 256, tt, 36, 11, -85, .78), 'scale(1.55)');
    for (let i = 0; i < 8; i++) {
      const sp = 160 + hash(i * 1.7) * 120, xx = (((hash(i * 4.1) * 520) - t * sp) % 520 + 520) % 520 - 80, yy = 20 + hash(i * 2.3) * 300;
      g += L(xx, yy, xx + 34 + hash(i) * 22, yy + 5, 'rgba(210,222,240,.12)', 1, 'stroke-linecap="round"');
    }
    // виньетка и тёмный низ под субтитры
    g += R(-20, -20, 400, 680, 'url(#hcl_vig)');
    g += R(-20, 318, 400, 66, 'url(#hcl_low)') + R(-20, 383, 400, 300, '#050a14');
    return g;
  };
})();

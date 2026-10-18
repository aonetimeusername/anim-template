// сцена peephole_view: вид в глазок на лестничную площадку (fisheye). Кадр 360×640, круг в верхней части кадра (ниже GROUND — тьма).
// Геометрия честно трёхмерная (площадка 3×2.6 м): точки проецируются и прогоняются через «рыбий глаз», рёбра дробятся → кривые линии как в настоящем глазке.
// Лампа под потолком, напротив две двери (дермантин и сталь), справа стена с дверью и щитком, слева лестничный марш вниз с перилами и холодное окно. Пусто.
//   p.flicker — [[t0, t1]] лампа мигает неровно, как умирающая (меняется только яркость внутри картинки, без вспышек на весь кадр)
//   p.figure  — {t, x} с момента t на площадке стоит тёмный силуэт (x — метры вдоль площадки, 0 центр; по умолчанию нет)
(() => {
  const CX = 180, CY = 205, RR = 158;                 // круг глазка
  const KF = 1.5, RM = 1.12, ATM = Math.atan(KF * RM);
  const ZN = 0.45, ZB = 2.8, YC = -1, YF = 1.6, XL = -1.5, XR = 1.5, STX = -0.375, STZ = 1.5;
  const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const px = (m, z) => m / z * 205;
  const LAMP = [0.15, -0.9, 1.9];

  // проекция + рыбий глаз
  const P3 = (x, y, z) => {
    const X = x / z, Y = (y - 0.3) / z, r = Math.hypot(X, Y);
    if (r < 1e-6) return [CX, CY];
    const rd = RR * Math.atan(KF * r) / ATM;
    return [CX + X / r * rd, CY + Y / r * rd];
  };
  const fm = q => f1(q[0]) + ' ' + f1(q[1]);
  const path3 = (pts, n, close = true) => {
    let d = '';
    const m = close ? pts.length : pts.length - 1;
    for (let i = 0; i < m; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      for (let k = 0; k < n; k++) {
        const s = k / n;
        d += (d ? 'L' : 'M') + fm(P3(a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s));
      }
    }
    if (!close) d += 'L' + fm(P3(...pts[pts.length - 1]));
    return d + (close ? 'Z' : '');
  };
  const poly3 = (pts, fill, extra = '', n = 10) => P(path3(pts, n), fill, extra);
  const line3 = (a, b, col, w0 = 1, w1 = w0, extra = '', n = 10) => {
    if (w0 === w1) return P(path3([a, b], n, false), 'none', `stroke="${col}" stroke-width="${f1(w0)}" stroke-linecap="round" ${extra}`);
    let g = '';
    const S = 6;
    for (let i = 0; i < S; i++) {
      const A = a.map((v, j) => v + (b[j] - v) * i / S), B = a.map((v, j) => v + (b[j] - v) * (i + 1) / S);
      g += P(path3([A, B], 3, false), 'none', `stroke="${col}" stroke-width="${f1(mix(w0, w1, (i + .5) / S))}" stroke-linecap="round" ${extra}`);
    }
    return g;
  };
  // плоскости: (u,v) -> 3D
  const BW = (u, v) => [u, v, ZB], RW = (u, v) => [XR, v, u], LW = (u, v) => [XL, v, u];
  const rectP = (pl, u0, v0, u1, v1) => [pl(u0, v0), pl(u1, v0), pl(u1, v1), pl(u0, v1)];
  const rgbm = (a, b, k) => `rgb(${Math.round(mix(a[0], b[0], k))},${Math.round(mix(a[1], b[1], k))},${Math.round(mix(a[2], b[2], k))})`;

  SCENES.peephole_view = function (u, p, d, t) {
    p = p || {};
    // ---------- лампа: умирающая при flicker
    let b = 0.985 + 0.015 * noise1(t * 37);
    (p.flicker || []).forEach(([a, e]) => {
      const env = sstep(a, a + 0.12, t) * (1 - sstep(e - 0.15, e, t));
      if (env <= 0) return;
      const k1 = Math.floor(t * 8.5 + 1.3), k2 = Math.floor(t * 21 + 4), k3 = Math.floor(t * 47);
      const r = hash(k1 * 1.71 + 3.3);
      let s = r < 0.3 ? 0.07 : r < 0.5 ? 0.34 : r < 0.78 ? 0.78 : 1;
      if (hash(k2 * 2.9 + 1.1) < 0.22) s *= 0.45;
      s *= 0.88 + 0.12 * hash(k3 * 0.77);
      b = mix(b, s, env);
    });
    b = clamp(b, 0.04, 1);
    const lp = P3(...LAMP), fp = P3(LAMP[0], YF, LAMP[2]);
    const wp = P3(-1.05, -0.2, ZB);
    const rS = px(0.17, LAMP[2]);
    const sway = [noise1(t * 0.45) * 0.7, noise1(t * 0.37 + 5) * 0.6];     // глаз у линзы чуть «дышит»
    const ov = (pts, grad, k, n = 10) => poly3(pts, `url(#${grad})`, `opacity="${f1(b * k)}"`, n);

    let g = `<defs>
      <clipPath id="pv_c"><circle cx="${CX}" cy="${CY}" r="${RR}"/></clipPath>
      <clipPath id="pv_out" clip-rule="evenodd"><path clip-rule="evenodd" d="M-20 -20H380V660H-20Z M${CX - RR - 13} ${CY} a${RR + 13} ${RR + 13} 0 1 0 ${2 * RR + 26} 0 a${RR + 13} ${RR + 13} 0 1 0 ${-2 * RR - 26} 0Z"/></clipPath>
      <radialGradient id="pv_lw" gradientUnits="userSpaceOnUse" cx="${f1(lp[0])}" cy="${f1(lp[1])}" r="235">
        <stop offset="0" stop-color="#ffe2a0" stop-opacity=".66"/><stop offset=".16" stop-color="#ffd088" stop-opacity=".44"/><stop offset=".42" stop-color="#f0a85a" stop-opacity=".19"/><stop offset=".75" stop-color="#d98a45" stop-opacity=".05"/><stop offset="1" stop-color="#d98a45" stop-opacity="0"/></radialGradient>
      <radialGradient id="pv_lf" gradientUnits="userSpaceOnUse" cx="${f1(fp[0])}" cy="${f1(fp[1])}" r="150">
        <stop offset="0" stop-color="#ffd890" stop-opacity=".5"/><stop offset=".45" stop-color="#f0b060" stop-opacity=".2"/><stop offset="1" stop-color="#f0b060" stop-opacity="0"/></radialGradient>
      <radialGradient id="pv_cold" gradientUnits="userSpaceOnUse" cx="${f1(wp[0])}" cy="${f1(wp[1])}" r="120">
        <stop offset="0" stop-color="#9cc8ff" stop-opacity=".42"/><stop offset=".5" stop-color="#6c9ee0" stop-opacity=".14"/><stop offset="1" stop-color="#6c9ee0" stop-opacity="0"/></radialGradient>
      <radialGradient id="pv_vig" gradientUnits="userSpaceOnUse" cx="${CX}" cy="${CY}" r="${RR}">
        <stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset=".86" stop-color="#000" stop-opacity=".42"/><stop offset="1" stop-color="#000" stop-opacity=".86"/></radialGradient>
      <radialGradient id="pv_dome"><stop offset="0" stop-color="#fffbe6"/><stop offset=".55" stop-color="#ffe5a0"/><stop offset="1" stop-color="#d89a4a"/></radialGradient>
      <radialGradient id="pv_spot" gradientUnits="userSpaceOnUse" cx="${CX - 52}" cy="${CY - 62}" r="46"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <linearGradient id="pv_door" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="430"><stop offset="0" stop-color="#0b1220"/><stop offset=".78" stop-color="#050810"/><stop offset="1" stop-color="#03060c"/></linearGradient>
      <linearGradient id="pv_void" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a16" stop-opacity=".1"/><stop offset="1" stop-color="#02040a" stop-opacity=".85"/></linearGradient>
    </defs>`;

    g += `<g clip-path="url(#pv_c)"><g transform="translate(${f1(sway[0])},${f1(sway[1])})">`;
    g += Ci(CX, CY, RR + 30, '#03050b');

    const WU = '#1b2842', WP = '#12303a', CE = '#101a30';
    // ================= ПОТОЛОК =================
    g += poly3([[XL, YC, ZN], [XR, YC, ZN], [XR, YC, ZB], [XL, YC, ZB]], CE, '', 14);
    for (const z of [1.0, 1.75, 2.45]) g += line3([XL, YC, z], [XR, YC, z], '#0a1224', 1.4, 1.4, '', 14);
    g += ov([[XL, YC, ZN], [XR, YC, ZN], [XR, YC, ZB], [XL, YC, ZB]], 'pv_lw', 1.15, 14);
    // кабель вдоль потолка к лампе
    g += line3([XR - 0.12, YC + 0.02, ZN], [XR - 0.12, YC + 0.02, 1.9], '#070c18', 3.2, 1.6, '', 8) + line3([XR - 0.12, YC + 0.02, 1.9], [LAMP[0], YC, 1.9], '#070c18', 1.6, 1.3, '', 8);

    // ================= ЛЕВАЯ СТЕНА (лестничный проём) =================
    g += poly3(rectP(LW, ZN, YC, ZB, 0.6), WU, '', 12);
    g += poly3(rectP(LW, ZN, 0.6, ZB, YF), WP, '', 12);
    g += poly3(rectP(LW, STZ, YF, ZB, 3.2), '#0d1d26', '', 8);
    g += poly3(rectP(LW, STZ, YF, ZB, 3.2), 'url(#pv_void)', '', 8);
    g += ov(rectP(LW, ZN, YC, ZB, YF), 'pv_lw', 0.9, 12);

    // ================= ПРАВАЯ СТЕНА =================
    g += poly3(rectP(RW, ZN, YC, ZB, 0.6), WU, '', 12);
    g += poly3(rectP(RW, ZN, 0.6, ZB, YF), WP, '', 12);
    g += line3(RW(ZN, 0.6), RW(ZB, 0.6), '#4c6e68', 2, 1.1, '', 12);
    g += poly3(rectP(RW, ZN, 1.5, ZB, YF), '#0a1420', '', 12);
    g += ov(rectP(RW, ZN, YC, ZB, YF), 'pv_lw', 1, 12);
    // щиток
    g += poly3(rectP(RW, 0.78, -0.3, 1.2, 0.5), '#3a4452', '', 4) + poly3(rectP(RW, 0.8, -0.28, 1.18, 0.48), '#2e3744', '', 4);
    g += line3(RW(0.99, -0.28), RW(0.99, 0.48), '#1a2029', 1.4, 1.2, '', 4);
    g += poly3(rectP(RW, 0.93, 0.1, 0.96, 0.2), '#aab2bd', '', 2);
    g += poly3(rectP(RW, 1.03, -0.2, 1.15, -0.1), '#8b94a0', '', 2);
    g += ov(rectP(RW, 0.78, -0.3, 1.2, 0.5), 'pv_lw', 0.9, 4);
    g += line3(RW(0.9, -0.3), RW(0.86, YC), '#090e18', 2.6, 1.6, '', 6) + line3(RW(1.0, -0.3), RW(1.05, YC), '#090e18', 2.2, 1.4, '', 6);
    // объявление
    g += poly3(rectP(RW, 1.27, 0.0, 1.45, 0.34), '#b8bfca', '', 2) + ov(rectP(RW, 1.27, 0.0, 1.45, 0.34), 'pv_lw', 0.6, 2);
    for (let i = 0; i < 4; i++) g += line3(RW(1.3, 0.07 + i * 0.065), RW(1.42 - (i % 2) * 0.04, 0.07 + i * 0.065), '#556070', 1, 1, '', 2);
    // дверь справа: дерматин
    {
      const u0 = 1.62, u1 = 2.52, vT = -0.4, vB = YF;
      g += poly3(rectP(RW, u0 - 0.06, vT - 0.06, u1 + 0.06, vB), '#070c18', '', 8);
      g += poly3(rectP(RW, u0, vT, u1, vB), '#3b2a24', '', 12);
      const clipL = (pl, a, c) => {          // диагональ v = vT + s*(u-u0) + c в прямоугольнике двери
        const s = a, tA = [], tB = [];
        const lo = Math.max(u0, u0 + (vT - vT - c) / s), hi = Math.min(u1, u0 + (vB - vT - c) / s);
        const lo2 = s > 0 ? Math.max(u0, u0 + (-c) / s) : Math.max(u0, u0 + (vB - vT - c) / s);
        const hi2 = s > 0 ? Math.min(u1, u0 + (vB - vT - c) / s) : Math.min(u1, u0 + (-c) / s);
        if (hi2 - lo2 < 0.02) return '';
        return line3(pl(lo2, vT + s * (lo2 - u0) + c), pl(hi2, vT + s * (hi2 - u0) + c), '#1f140f', 1.2, 1.0, '', 3);
      };
      for (let c = -0.9; c < 2.2; c += 0.24) g += clipL(RW, 1, c) + clipL(RW, -1, c + 0.9);
      g += ov(rectP(RW, u0, vT, u1, vB), 'pv_lw', 1.1, 12);
      g += poly3(rectP(RW, u0 + 0.05, 0.02, u0 + 0.095, 0.35), '#9aa2ae', '', 2);          // ручка
      g += Ci(...P3(XR, 0.12, 2.28), 1.5, '#cfd6e0', `opacity="${f1(0.5 + 0.5 * b)}"`);     // глазок
      g += poly3(rectP(RW, 2.1, -0.18, 2.34, -0.04), '#a9b0bb', '', 2);                    // табличка
      g += poly3(rectP(RW, u0, vB - 0.03, u1, vB), '#05080f', '', 6);
    }

    // ================= ЗАДНЯЯ СТЕНА =================
    g += poly3(rectP(BW, XL, YC, XR, 0.6), WU, '', 14);
    g += poly3(rectP(BW, XL, 0.6, XR, YF), WP, '', 14);
    g += line3(BW(XL, 0.6), BW(XR, 0.6), '#4c6e68', 1.5, 1.5, '', 14);
    g += poly3(rectP(BW, XL, YF, STX, 3.2), '#0d1d26', '', 8) + poly3(rectP(BW, XL, YF, STX, 3.2), 'url(#pv_void)', '', 8);
    g += poly3(rectP(BW, XL, 1.5, XR, YF), '#0a1420', '', 14);
    g += ov(rectP(BW, XL, YC, XR, YF), 'pv_lw', 1, 14);
    // окно на лестничной клетке
    g += poly3(rectP(BW, -1.32, -0.62, -0.78, 0.2), '#1a2438', '', 6) + poly3(rectP(BW, -1.28, -0.58, -0.82, 0.16), '#17315a', '', 6);
    g += poly3(rectP(BW, -1.28, -0.58, -0.82, 0.16), 'url(#pv_cold)', 'opacity=".9"', 6);
    g += line3(BW(-1.05, -0.58), BW(-1.05, 0.16), '#1a2438', 2.6, 2.6, '', 4) + line3(BW(-1.28, -0.2), BW(-0.82, -0.2), '#1a2438', 2.6, 2.6, '', 4);
    g += poly3(rectP(BW, -1.36, 0.2, -0.74, 0.25), '#2a3652', '', 4);
    g += poly3(rectP(BW, -1.5, -0.8, -0.2, 0.9), 'url(#pv_cold)', 'opacity=".55"', 8);
    // дверь A (дерматин), слева-центр
    {
      const u0 = -0.1, u1 = 0.68, vT = -0.4, vB = YF;
      g += poly3(rectP(BW, u0 - 0.06, vT - 0.06, u1 + 0.06, vB), '#070c18', '', 8);
      g += poly3(rectP(BW, u0, vT, u1, vB), '#3d2b22', '', 8);
      const dl = (c, s) => {
        let lo = u0, hi = u1;
        const vAt = u => vT + s * (u - u0) + c;
        if (s > 0) { lo = Math.max(u0, u0 + (vT - vT - c) / s); hi = Math.min(u1, u0 + (vB - vT - c) / s); }
        else { lo = Math.max(u0, u0 + (vB - vT - c) / s); hi = Math.min(u1, u0 + (-c) / s); }
        if (hi - lo < 0.02) return '';
        return line3(BW(lo, vAt(lo)), BW(hi, vAt(hi)), '#1f140f', 1.1, 1.1, '', 3);
      };
      for (let c = -0.8; c < 2.2; c += 0.2) g += dl(c, 1) + dl(c + 0.8, -1);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 9; j++) g += Ci(...P3(u0 + 0.19 + i * 0.2, vT + 0.2 + j * 0.2, ZB), 0.9, '#8b8f98', 'opacity=".5"');
      g += ov(rectP(BW, u0, vT, u1, vB), 'pv_lw', 1.1, 8);
      g += poly3(rectP(BW, u1 - 0.14, 0.06, u1 - 0.1, 0.36), '#a2aab6', '', 2);
      g += Ci(...P3((u0 + u1) / 2, 0.1, ZB), 1.4, '#cfd6e0', `opacity="${f1(0.5 + 0.5 * b)}"`);
      g += poly3(rectP(BW, 0.22, -0.2, 0.36, -0.1), '#b6bcc6', '', 2) + ov(rectP(BW, 0.22, -0.2, 0.36, -0.1), 'pv_lw', 0.8, 2);
      g += T(...P3(0.29, -0.115, ZB).map((v, i) => i ? v : v), '46', 4.6, '#222831', 'text-anchor="middle" font-family="Mont" font-weight="800"');
      // звонок
      g += Ci(...P3(0.82, 0.12, ZB), 1.1, '#8d95a3') + Ci(...P3(0.82, 0.12, ZB), 4, 'url(#glowW)', 'opacity=".2"');
      // полоска холодного света из-под двери (кто-то не спит)
      const tv = 0.55 + 0.45 * (noise1(t * 3.1) * 0.5 + 0.5);
      g += poly3(rectP(BW, u0 + 0.02, vB - 0.022, u1 - 0.02, vB), `rgba(150,200,255,${f1(0.25 + 0.4 * tv)})`, '', 8);
      g += poly3([[u0 + 0.05, YF, ZB - 0.02], [u1 - 0.05, YF, ZB - 0.02], [u1 + 0.1, YF, ZB - 0.5], [u0 - 0.05, YF, ZB - 0.5]], `rgba(120,170,235,${f1(0.04 + 0.1 * tv)})`, '', 6);
    }
    // дверь B (сталь), справа у угла
    {
      const u0 = 0.98, u1 = 1.42, vT = -0.4, vB = YF;
      g += poly3(rectP(BW, u0 - 0.05, vT - 0.05, u1 + 0.05, vB), '#070c18', '', 6);
      g += poly3(rectP(BW, u0, vT, u1, vB), '#26333f', '', 8);
      g += poly3(rectP(BW, u0 + 0.05, vT + 0.1, u1 - 0.05, 0.4), '#1d2832', '', 6) + poly3(rectP(BW, u0 + 0.05, 0.55, u1 - 0.05, YF - 0.12), '#1d2832', '', 6);
      g += ov(rectP(BW, u0, vT, u1, vB), 'pv_lw', 1.1, 8);
      g += poly3(rectP(BW, u0 + 0.04, 0.06, u0 + 0.08, 0.34), '#a2aab6', '', 2);
      g += Ci(...P3((u0 + u1) / 2, 0.1, ZB), 1.3, '#cfd6e0', `opacity="${f1(0.5 + 0.5 * b)}"`);
      g += poly3(rectP(BW, 1.12, -0.2, 1.28, -0.1), '#b6bcc6', '', 2) + ov(rectP(BW, 1.12, -0.2, 1.28, -0.1), 'pv_lw', 0.8, 2);
      g += T(...P3(1.2, -0.115, ZB), '45', 4.6, '#222831', 'text-anchor="middle" font-family="Mont" font-weight="800"');
      g += poly3(rectP(BW, u0, vB - 0.03, u1, vB), '#05080f', '', 6);
    }

    // ================= ПОЛ =================
    {
      const zs = [ZN, 0.8, 1.15, 1.5, 1.85, 2.2, 2.55, ZB];
      for (let r = 0; r < 7; r++) for (let c = 0; c < 8; c++) {
        const x0 = XL + 0.375 * c, x1 = x0 + 0.375;
        if (x1 <= STX + 1e-6 && zs[r] >= STZ - 1e-6) continue;
        const h = hash(r * 7.3 + c * 3.1);
        const col = (r + c) % 2 ? (h < 0.2 ? '#18253f' : '#1b2a46') : (h < 0.2 ? '#121c31' : '#152038');
        g += poly3([[x0, YF, zs[r]], [x1, YF, zs[r]], [x1, YF, zs[r + 1]], [x0, YF, zs[r + 1]]], col, 'stroke="#0a1224" stroke-width=".8"', 3);
      }
      const FLOOR = [[XL, YF, ZN], [XR, YF, ZN], [XR, YF, ZB], [STX, YF, ZB], [STX, YF, STZ], [XL, YF, STZ]];
      g += ov(FLOOR, 'pv_lw', 0.9, 12) + ov(FLOOR, 'pv_lf', 1, 12);
      g += line3([XL, YF, STZ], [STX, YF, STZ], '#40537a', 2.6, 2, '', 6) + ov([[XL, YF, STZ], [STX, YF, STZ], [STX, YF, STZ + .02], [XL, YF, STZ + .02]], 'pv_lw', 1, 2);
      g += poly3([[XL, YF, ZN], [XR, YF, ZN], [XR, YF, ZN + .05], [XL, YF, ZN + .05]], '#02040a', '', 2);
      // коврик у двери A
      g += poly3([[-0.05, YF, 2.15], [0.63, YF, 2.15], [0.63, YF, 2.72], [-0.05, YF, 2.72]], '#1a1d28', 'stroke="#0d1018" stroke-width="1"', 4);
      g += poly3([[0.0, YF, 2.2], [0.58, YF, 2.2], [0.58, YF, 2.67], [0.0, YF, 2.67]], 'none', 'stroke="#2a3040" stroke-width=".8"', 4);
      g += ov([[-0.05, YF, 2.15], [0.63, YF, 2.15], [0.63, YF, 2.72], [-0.05, YF, 2.72]], 'pv_lw', 0.8, 4);
      // рекламный листок на полу и окурок
      g += poly3([[0.5, YF, 1.25], [0.72, YF, 1.28], [0.7, YF, 1.46], [0.47, YF, 1.43]], '#aab4c6', '', 3) + ov([[0.5, YF, 1.25], [0.72, YF, 1.28], [0.7, YF, 1.46], [0.47, YF, 1.43]], 'pv_lf', 1.3, 3);
      g += line3([0.53, YF, 1.31], [0.66, YF, 1.33], '#6a7690', 1, 1, '', 2) + line3([0.52, YF, 1.37], [0.65, YF, 1.39], '#6a7690', 1, 1, '', 2);
      g += poly3([[-0.55, YF, 1.9], [-0.5, YF, 1.9], [-0.5, YF, 1.94], [-0.55, YF, 1.94]], '#c6c0b0', '', 2);
    }

    // ================= ЛЕСТНИЦА ВНИЗ =================
    for (let i = 4; i >= 0; i--) {
      const z0 = STZ + 0.28 * i, z1 = z0 + 0.28, y = YF + 0.18 * (i + 1);
      const T4 = [[XL, y, z0], [STX, y, z0], [STX, y, z1], [XL, y, z1]];
      g += poly3(T4, '#2d4166', '', 8);
      g += ov(T4, 'pv_lw', 0.9, 8) + poly3(T4, 'url(#pv_cold)', 'opacity="1"', 8);
      g += line3([XL, y, z0], [STX, y, z0], '#6a82b0', Math.max(1.6, px(0.05, z0)), Math.max(1.2, px(0.04, z0)), '', 8);
      g += poly3([[XL, y, z1], [STX, y, z1], [STX, y + .09, z1], [XL, y + .09, z1]], '#050a14', 'opacity=".7"', 6);
    }
    // перила: поручень и балясины
    {
      const rail = z => 0.72 + 0.643 * (z - STZ);
      const fl = z => YF + 0.643 * (z - STZ);
      for (let k = 0; k <= 6; k++) {
        const z = STZ + 0.04 + k * 0.215;
        g += line3([STX, rail(z) + 0.04, z], [STX, fl(z), z], '#2a3552', px(0.022, z), px(0.022, z), '', 3) +
             line3([STX - 0.012, rail(z) + 0.04, z], [STX - 0.012, fl(z), z], '#516087', 0.8, 0.8, 'opacity=".5"', 3);
      }
      g += line3([STX, rail(STZ), STZ], [STX, rail(ZB), ZB], '#2c3856', px(0.06, STZ), px(0.06, ZB), '', 12);
      g += line3([STX, rail(STZ) - 0.015, STZ], [STX, rail(ZB) - 0.015, ZB], '#b8c0d0', 1.4, 0.8, `opacity="${f1(0.28 + 0.4 * b)}"`, 12);
      g += line3([STX, rail(STZ) + 0.06, STZ], [STX, rail(ZB) + 0.06, ZB], '#2a3552', px(0.02, STZ), px(0.02, ZB), '', 12);
      // стойка у начала марша
      g += line3([STX, 0.55, STZ], [STX, YF, STZ], '#2e3a5a', px(0.085, STZ), px(0.085, STZ), '', 4);
      g += line3([STX - 0.02, 0.55, STZ], [STX - 0.02, YF, STZ], '#b0b8c8', 1.2, 1.2, `opacity="${f1(0.18 + 0.36 * b)}"`, 4);
      g += Ci(...P3(STX, 0.52, STZ), px(0.06, STZ), '#3d4a6c') + Ci(...P3(STX - .01, 0.5, STZ), px(0.03, STZ), '#b8c0d0', `opacity="${f1(0.25 + 0.4 * b)}"`);
    }

    // ================= СИЛУЭТ (на будущее) =================
    if (p.figure && t >= p.figure.t) {
      const fx = p.figure.x === undefined ? 0.3 : p.figure.x, fz = 2.3, sw = Math.sin(t * 1.3) * 0.006;
      const el = (cx, cz, rx, rz, n) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * 6.2832) * rx, YF, cz + Math.sin(i / n * 6.2832) * rz]);
      g += poly3(el(fx, fz, 0.34, 0.14, 14), '#02040a', 'opacity=".55"', 2);
      const B = [[-.07, .06], [-.22, .13], [-.26, .72], [-.2, .74], [-.18, .98], [-.16, 1.6], [-.03, 1.6], [0, 1.08], [.03, 1.6], [.16, 1.6], [.18, .98], [.2, .74], [.26, .72], [.22, .13], [.07, .06]]
        .map(([x, y]) => [fx + x + sw * (1.6 - y), y - 0.15 + 0.0, fz]);
      const H = Array.from({ length: 14 }, (_, i) => [fx + sw * 1.7 + Math.cos(i / 14 * 6.2832) * 0.105, -0.04 + Math.sin(i / 14 * 6.2832) * 0.125, fz]);
      g += poly3(B, '#02040a', '', 2) + poly3(H, '#02040a', '', 2);
      g += line3([fx - 0.22, -0.01, fz], [fx - 0.26, 0.57, fz], '#a8b8d0', 1, 1, `opacity="${f1(0.18 * b)}"`, 3);
      g += poly3(H, 'url(#pv_lw)', `opacity="${f1(b * 0.55)}"`, 2);
    }

    // ================= ЛАМПА =================
    {
      g += Ci(lp[0], lp[1], rS * 7.5, 'url(#glowW)', `opacity="${f1(b * 0.95)}"`);
      g += Ci(lp[0], lp[1], rS * 2.6, 'url(#glowW)', `opacity="${f1(b)}"`);
      const cap = P3(LAMP[0], YC, LAMP[2]);
      g += `<ellipse cx="${f1(cap[0])}" cy="${f1(cap[1] + 0.5)}" rx="${f1(rS * 0.92)}" ry="${f1(rS * 0.3)}" fill="#1e2538"/>`;
      g += `<ellipse cx="${f1(cap[0])}" cy="${f1(cap[1] + 2.3)}" rx="${f1(rS * 1.0)}" ry="${f1(rS * 0.24)}" fill="#2d3550"/>`;
      g += Ci(lp[0], lp[1] + 1, rS, rgbm([62, 52, 36], [255, 240, 196], Math.pow(b, 0.8)));
      g += Ci(lp[0], lp[1] + 1, rS, 'url(#pv_dome)', `opacity="${f1(Math.pow(b, 1.3))}"`);
      g += P(`M${f1(lp[0] - rS * .5)} ${f1(lp[1] + 2)} q ${f1(rS * .25)} ${f1(-rS * .7)} ${f1(rS * .5)} 0`, 'none', `stroke="#ffb35a" stroke-width="1.4" stroke-linecap="round" opacity="${f1((1 - b) * 0.9)}"`);
      g += Ci(lp[0] - rS * 0.35, lp[1] - rS * 0.3, rS * 0.22, '#fff', `opacity="${f1(0.18 + 0.3 * b)}"`);
      g += Ci(lp[0], lp[1] + 1, rS, 'none', `stroke="#0d1220" stroke-width="1.3" opacity=".7"`);
      g += P(`M${f1(lp[0] - rS * .9)} ${f1(lp[1] + rS * .5)} Q${f1(lp[0])} ${f1(lp[1] + rS * 1.35)} ${f1(lp[0] + rS * .9)} ${f1(lp[1] + rS * .5)}`, 'none', `stroke="#05080f" stroke-width="1.6" opacity=".6"`);
      // пылинки в свете
      for (let i = 0; i < 18; i++) {
        const mx = LAMP[0] + (hash(i * 1.7) - .5) * 1.6 + 0.05 * Math.sin(t * 0.33 + i * 2.1), my = -0.5 + hash(i * 3.3 + 9) * 1.8 + 0.05 * Math.sin(t * 0.41 + i), mz = 1.3 + hash(i * 5.9 + 5) * 1.3;
        const q = P3(mx, my, mz), dd = Math.hypot(q[0] - lp[0], q[1] - lp[1]);
        const a = clamp(1 - dd / 150) * (0.35 + 0.35 * hash(i * 9.1)) * b;
        if (a > 0.02) g += Ci(q[0], q[1], 0.7 + hash(i * 2.2) * 0.5, `rgba(255,236,190,${f1(a)})`);
      }
      // мотылёк
      {
        const ang = t * 4.3 + 2 * noise1(t * 1.7), rr = rS * 1.9 + 5 * noise1(t * 2.6 + 3);
        const mx = lp[0] + Math.cos(ang) * rr, my = lp[1] + Math.sin(ang) * rr * 0.65 + 3;
        const fl = Math.abs(Math.sin(t * 38)) * 0.8 + 0.2;
        g += `<ellipse cx="${f1(mx - 1.4)}" cy="${f1(my)}" rx="1.4" ry="${f1(0.6 * fl + 0.2)}" fill="#171310" transform="rotate(-25 ${f1(mx)} ${f1(my)})"/><ellipse cx="${f1(mx + 1.4)}" cy="${f1(my)}" rx="1.4" ry="${f1(0.6 * fl + 0.2)}" fill="#171310" transform="rotate(25 ${f1(mx)} ${f1(my)})"/>` + Ci(mx, my, 0.7, '#0c0a08');
      }
    }
    g += `</g>`;
    // линза: виньетка и блик
    g += Ci(CX, CY, RR + 2, 'url(#pv_vig)');
    g += Ci(CX, CY, RR, 'url(#pv_spot)');
    g += P(`M${CX - 118} ${CY - 70} A 138 138 0 0 1 ${CX - 56} ${CY - 128}`, 'none', 'stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".1"');
    g += `</g>`;

    // ================= ДВЕРЬ ВОКРУГ ГЛАЗКА =================
    g += peephole(CX, CY, RR, 1);
    g += `<g clip-path="url(#pv_out)">` + R(-20, -20, 400, 700, 'url(#pv_door)');
    for (let i = -12; i < 14; i++) g += L(i * 36, -10, i * 36 + 420, 410, '#142038', 1, 'opacity=".55"') + L(i * 36 + 420, -10, i * 36, 410, '#142038', 1, 'opacity=".55"');
    for (let i = 0; i < 90; i++) g += Ci(hash(i * 2.3) * 360, hash(i * 4.1 + 1) * 400, 0.9, '#2b3a5a', 'opacity=".5"');
    g += `</g>`;
    g += Ci(CX, CY, RR + 11.5, 'none', 'stroke="#161d2c" stroke-width="7"');
    g += P(`M${CX - 112} ${CY - 118} A 163 163 0 0 1 ${CX - 20} ${CY - 163}`, 'none', 'stroke="#dfe6f0" stroke-width="1.6" stroke-linecap="round" opacity=".22"');
    g += P(`M${CX + 60} ${CY + 152} A 163 163 0 0 0 ${CX + 128} ${CY + 98}`, 'none', 'stroke="#dfe6f0" stroke-width="1" stroke-linecap="round" opacity=".1"');
    // слабый тёплый отсвет линзы на металле
    g += Ci(CX, CY, RR + 8, 'none', `stroke="#ffd48a" stroke-width="2" opacity="${f1(0.12 * b)}"`);
    g += R(-20, 372, 400, 40, 'url(#pv_door)', 'opacity=".5"');
    return g;
  };
})();

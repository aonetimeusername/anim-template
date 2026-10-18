// hall_speaker — вид из спальни через приоткрытую дверь: коридор уходит к прихожей (входная дверь, вешалка, комод с колонкой).
// Свет: кольцо второй колонки (синий, главный), тёплая полоска из-под входной двери (лампа площадки),
//   тёплый отсвет фонаря из кухонного проёма справа (пятно на полу видно сразу, сам проём — когда дверь откроется).
// p.ring    — [[t0,t1,'listen'|'speak'], ...] как в bedroom/smart_speaker; speak — свет на стенах, потолке и полу дышит с огибающей речи.
// p.red     — true: красное кольцо (#ff3030) и красный отсвет, включая тусклый дежурный режим.
// p.occlude — [t0,t1] тёмный мягкий вертикальный силуэт (без лица и рук) проходит слева направо между колонкой и камерой:
//             закрывает кольцо и свет на стене, гасит отсвет на ближнем полу/потолке, тянет тень к камере; потом свет возвращается.
// p.door    — [t0,t1] дверь спальни (передний план) медленно открывается шире: край 262 → 326 (≈18% кадра), открывается правая стена коридора.
// Все времена абсолютные (t); без параметров — пустой коридор, дежурное кольцо.
// Камеры: общий {z0:1,z1:1.06}; колонка {z0:1.8,z1:2,ox:13,oy:-41} — колонка в центре полезной части кадра (выше субтитров).
(() => {
  const CAP = 'stroke-linecap="round" stroke-linejoin="round"';
  const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const VX = 163, VY = 180;                          // точка схода
  const BL = 64, BR = 262, BT = 78, BB = 298;        // задняя стена прихожей
  const pp = (x, y, k) => [f1(VX + (x - VX) * k), f1(VY + (y - VY) * k)];
  const poly = pts => 'M' + pts.map(q => q.join(' ')).join(' L') + ' Z';
  // колонка — та же модель, что в k_smart_speaker (координаты оттуда), уменьшенная
  const SX = 186, SB = 252.5, SS = 0.31;              // центр основания на комоде, масштаб
  const TX = SX - 180 * SS, TYo = SB - 312 * SS;      // перенос из системы k_smart_speaker
  const RCY = TYo + 228 * SS;                         // центр кольца ≈ 226.5
  const CX = 180, TY = 228, BY = 312, RX = 62, RY = 14.6;
  const BODY = `M102 ${TY} L98 ${BY} A82 16 0 0 0 262 ${BY} L258 ${TY} A78 19 0 0 1 102 ${TY} Z`;
  const arc = (a0, a1) => `M${f1(CX + RX * Math.cos(a0))} ${f1(TY + RY * Math.sin(a0))} A${RX} ${RY} 0 0 1 ${f1(CX + RX * Math.cos(a1))} ${f1(TY + RY * Math.sin(a1))}`;
  const KD = 1.3;                                     // глубина, на которой проходит силуэт (пол y≈333)
  const FYD = VY + (BB - VY) * KD;

  SCENES.hall_speaker = function (u, p, d, t) {
    // Меняем только свет колонки; без red исходные цвета и SVG сохраняются.
    const light = blue => p.red === true ? '#ff3030' : blue;
    const win = (a, b) => sstep(a, a + 0.18, t) * (1 - sstep(b - 0.18, b, t));
    let wl = 0, ws = 0;
    (p.ring || []).forEach(([a, b, m]) => { const w = win(a, b); if (m === 'speak') ws = Math.max(ws, w); else wl = Math.max(wl, w); });
    // огибающая «речи» — как в smart_speaker
    const gate = sstep(-0.3, 0.2, noise1(t * 2.6 + 9));
    const env = (0.5 + 0.5 * Math.sin(2 * Math.PI * 7.1 * t + 2.2 * noise1(t * 3.1)) * (0.8 + 0.2 * Math.sin(2 * Math.PI * 8.4 * t))) * mix(0.3, 1, gate) * 0.75 + 0.25 * gate;
    const speakK = ws * env;
    const redDim = p.red === true ? mix(0.45, 1, Math.max(wl, ws)) : 1;
    const ls = Math.min(1.6, 0.42 + 0.3 * wl + 1.0 * speakK) * redDim;   // сила света кольца
    const breathe = 1 + 0.04 * noise1(t * 1.7) + 0.015 * noise1(t * 8);
    const L1 = Math.min(1.25, ls);
    // силуэт
    const occ = p.occlude;
    let ox = -999, oa = 0, cover = 0;
    if (occ) {
      const q = (t - occ[0]) / (occ[1] - occ[0]);
      if (q > -0.02 && q < 1.02) {
        // идёт ровно, но чуть замедляется перед колонкой (q≈0.57), чтобы перекрытие кольца читалось
        const qc = clamp(q), A = 0.5, Q0 = 0.07;
        ox = mix(6, 304, qc + A * (Math.sin(2 * Math.PI * (qc - Q0)) + Math.sin(2 * Math.PI * Q0)) / (2 * Math.PI));
        oa = sstep(occ[0] - 0.02, occ[0] + 0.06, t) * (1 - sstep(occ[1] - 0.08, occ[1] + 0.02, t));
        cover = oa * Math.exp(-Math.pow((ox - SX) / 36, 2));
      }
    }
    const nearL = L1 * (1 - 0.88 * cover);             // свет кольца, доходящий до ближней части коридора
    const wallL = L1 * (1 - 0.35 * cover);             // на задней стене (частично закрыт силуэтом визуально)
    // дверь спальни
    const opening = p.door ? sstep(p.door[0], p.door[1], t) : 0;
    const edge = 262 + 64 * opening;

    let g = `<defs>
      <linearGradient id="hs_wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16213b"/><stop offset=".6" stop-color="#1b2844"/><stop offset="1" stop-color="#1e2b49"/></linearGradient>
      <linearGradient id="hs_lw" gradientUnits="userSpaceOnUse" x1="${BL}" y1="0" x2="20" y2="0"><stop offset="0" stop-color="#1c2a49"/><stop offset="1" stop-color="#111a30"/></linearGradient>
      <linearGradient id="hs_rw" gradientUnits="userSpaceOnUse" x1="${BR}" y1="0" x2="340" y2="0"><stop offset="0" stop-color="#1b2847"/><stop offset="1" stop-color="#101a30"/></linearGradient>
      <linearGradient id="hs_ceil" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${BT}"><stop offset="0" stop-color="#0b1325"/><stop offset="1" stop-color="#16213c"/></linearGradient>
      <linearGradient id="hs_floor" gradientUnits="userSpaceOnUse" x1="0" y1="${BB}" x2="0" y2="372"><stop offset="0" stop-color="#1d2640"/><stop offset="1" stop-color="#121a2d"/></linearGradient>
      <pattern id="hs_pap" width="11" height="10" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="4" height="10" fill="#8fa6d6" opacity=".035"/></pattern>
      <radialGradient id="hs_wg"><stop offset="0" stop-color="${light('#5a96f0')}" stop-opacity=".62"/><stop offset=".45" stop-color="${light('#3f74d0')}" stop-opacity=".26"/><stop offset="1" stop-color="${light('#3f74d0')}" stop-opacity="0"/></radialGradient>
      <radialGradient id="hs_pool"><stop offset="0" stop-color="${light('#8cc4ff')}" stop-opacity=".75"/><stop offset=".55" stop-color="${light('#3f7ae0')}" stop-opacity=".25"/><stop offset="1" stop-color="${light('#3f7ae0')}" stop-opacity="0"/></radialGradient>
      <linearGradient id="hs_cone" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${light('#78b8ff')}" stop-opacity=".55"/><stop offset="1" stop-color="${light('#78b8ff')}" stop-opacity="0"/></linearGradient>
      <linearGradient id="hs_streak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light('#8cc4ff')}" stop-opacity=".55"/><stop offset="1" stop-color="${light('#8cc4ff')}" stop-opacity="0"/></linearGradient>
      <linearGradient id="hs_gap" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8a24c"/><stop offset=".25" stop-color="#ffdc9a"/><stop offset=".75" stop-color="#ffdc9a"/><stop offset="1" stop-color="#e8a24c"/></linearGradient>
      <linearGradient id="hs_spillW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3b85a" stop-opacity=".55"/><stop offset=".5" stop-color="#e09a48" stop-opacity=".18"/><stop offset="1" stop-color="#e09a48" stop-opacity="0"/></linearGradient>
      <radialGradient id="hs_warm"><stop offset="0" stop-color="#f3b85a" stop-opacity=".5"/><stop offset=".5" stop-color="#d98c3e" stop-opacity=".15"/><stop offset="1" stop-color="#d98c3e" stop-opacity="0"/></radialGradient>
      <linearGradient id="hs_kit" gradientUnits="userSpaceOnUse" x1="0" y1="110" x2="0" y2="350"><stop offset="0" stop-color="#15131b"/><stop offset=".5" stop-color="#241d24"/><stop offset=".8" stop-color="#4a3528"/><stop offset="1" stop-color="#7a5434"/></linearGradient>
      <linearGradient id="hs_patch" gradientUnits="userSpaceOnUse" x1="300" y1="0" x2="190" y2="0"><stop offset="0" stop-color="#f3b85a" stop-opacity=".42"/><stop offset="1" stop-color="#f3b85a" stop-opacity=".06"/></linearGradient>
      <linearGradient id="hs_door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#28324b"/><stop offset=".7" stop-color="#20293f"/><stop offset="1" stop-color="#1b2236"/></linearGradient>
      <linearGradient id="hs_doorLow" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f3b85a" stop-opacity=".2"/><stop offset=".35" stop-color="#f3b85a" stop-opacity=".05"/><stop offset="1" stop-color="#f3b85a" stop-opacity="0"/></linearGradient>
      <linearGradient id="hs_coatB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#36507e"/><stop offset=".45" stop-color="#26385c"/><stop offset="1" stop-color="#18233d"/></linearGradient>
      <linearGradient id="hs_coatP" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1f2c48"/><stop offset=".5" stop-color="#121a2e"/><stop offset="1" stop-color="#0c1222"/></linearGradient>
      <linearGradient id="hs_comT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c2a3e"/><stop offset="1" stop-color="#3a3850"/></linearGradient>
      <linearGradient id="hs_comF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2638"/><stop offset="1" stop-color="#1a1826"/></linearGradient>
      <pattern id="hs_mesh" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx=".75" cy=".75" r=".78" fill="#04060a" opacity=".5"/><circle cx="2.25" cy="2.25" r=".78" fill="#04060a" opacity=".5"/><circle cx=".75" cy=".4" r=".4" fill="#6b7790" opacity=".3"/><circle cx="2.25" cy="1.9" r=".4" fill="#6b7790" opacity=".3"/></pattern>
      <linearGradient id="hs_cyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a4762"/><stop offset=".2" stop-color="#4d5b78"/><stop offset=".45" stop-color="#5a6884"/><stop offset=".75" stop-color="#36425a"/><stop offset="1" stop-color="#1c2334"/></linearGradient>
      <linearGradient id="hs_shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#02040a" stop-opacity=".35"/><stop offset=".16" stop-color="#02040a" stop-opacity=".08"/><stop offset=".42" stop-color="#02040a" stop-opacity="0"/><stop offset=".72" stop-color="#02040a" stop-opacity=".2"/><stop offset="1" stop-color="#02040a" stop-opacity=".65"/></linearGradient>
      <linearGradient id="hs_topl" gradientUnits="userSpaceOnUse" x1="0" y1="${TY}" x2="0" y2="${TY + 60}"><stop offset="0" stop-color="${light('#78b8ff')}" stop-opacity="${f1(Math.min(.7, .25 + .32 * ls))}"/><stop offset="1" stop-color="${light('#78b8ff')}" stop-opacity="0"/></linearGradient>
      <linearGradient id="hs_botd" gradientUnits="userSpaceOnUse" x1="0" y1="${BY - 40}" x2="0" y2="${BY + 14}"><stop offset="0" stop-color="#02040a" stop-opacity="0"/><stop offset="1" stop-color="#02040a" stop-opacity=".42"/></linearGradient>
      <radialGradient id="hs_cap" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#1b212d"/><stop offset="1" stop-color="#0a0d14"/></radialGradient>
      <radialGradient id="hs_occ"><stop offset="0" stop-color="#010309" stop-opacity=".9"/><stop offset="1" stop-color="#010309" stop-opacity="0"/></radialGradient>
      <radialGradient id="hs_vig" cx=".45" cy=".42" r=".8"><stop offset=".5" stop-color="#010309" stop-opacity="0"/><stop offset="1" stop-color="#010309" stop-opacity=".6"/></radialGradient>
      <linearGradient id="hs_bot" gradientUnits="userSpaceOnUse" x1="0" y1="338" x2="0" y2="374"><stop offset="0" stop-color="#03060c" stop-opacity="0"/><stop offset="1" stop-color="#03060c" stop-opacity="1"/></linearGradient>
      <linearGradient id="hs_leaf" gradientUnits="userSpaceOnUse" x1="${f1(edge)}" y1="0" x2="${f1(edge + 70)}" y2="0"><stop offset="0" stop-color="#0d1322"/><stop offset="1" stop-color="#05080f"/></linearGradient>
      <filter id="hs_b1" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.2"/></filter>
      <filter id="hs_b3" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="hs_b8" x="-60%" y="-30%" width="220%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>
      <filter id="hs_occB" x="-80%" y="-20%" width="260%" height="140%"><feGaussianBlur stdDeviation="5.5"/></filter>
      <filter id="hs_occB2" x="-100%" y="-30%" width="300%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
      <filter id="hs_rb2" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="4"/></filter>
      <filter id="hs_rb4" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="8"/></filter>
      <clipPath id="hs_bodyc"><path d="${BODY}"/></clipPath>
      <clipPath id="hs_backc"><rect x="${BL}" y="${BT}" width="${BR - BL}" height="${BB - BT}"/></clipPath>
      <clipPath id="hs_ceilc"><path d="${poly([[BL, BT], [BR, BT], pp(BR, BT, 2.4), pp(BL, BT, 2.4)])}"/></clipPath>
      <clipPath id="hs_floorc"><path d="${poly([[BL, BB], [BR, BB], pp(BR, BB, 2.4), pp(BL, BB, 2.4)])}"/></clipPath>
    </defs>`;

    // ================= КОРИДОР: плоскости =================
    g += R(-20, -20, 400, 420, '#0b1222');
    g += P(poly([[BL, BT], [BR, BT], pp(BR, BT, 2.4), pp(BL, BT, 2.4)]), 'url(#hs_ceil)');
    g += P(poly([[BL, BT], [BL, BB], pp(BL, BB, 2.4), pp(BL, BT, 2.4)]), 'url(#hs_lw)');
    g += P(poly([[BR, BT], [BR, BB], pp(BR, BB, 2.4), pp(BR, BT, 2.4)]), 'url(#hs_rw)');
    g += P(poly([[BL, BB], [BR, BB], pp(BR, BB, 2.4), pp(BL, BB, 2.4)]), 'url(#hs_floor)');
    g += R(BL, BT, BR - BL, BB - BT, 'url(#hs_wall)') + R(BL, BT, BR - BL, BB - BT, 'url(#hs_pap)');
    // углы: светлая кромка, чтобы читалась коробка коридора
    g += L(BL, BT, BL, BB, '#3a4d78', 0.9, 'opacity=".55"') + L(BR, BT, BR, BB, '#3a4d78', 0.9, 'opacity=".45"');
    g += L(BL, BT, BR, BT, '#33456c', 0.9, 'opacity=".6"');
    g += P(`M${pp(BL, BT, 2.4).join(' ')} L${BL} ${BT} M${BR} ${BT} L${pp(BR, BT, 2.4).join(' ')}`, 'none', 'stroke="#2c3c60" stroke-width=".9" opacity=".6"');
    // карниз-плинтус потолка и плинтусы пола
    g += R(BL, BB - 5, BR - BL, 5, '#27324c') + R(BL, BB - 5, BR - BL, 0.9, '#7f9cd0', `opacity="${f1(0.12 + 0.18 * wallL)}"`);
    g += P(poly([[BL, BB - 5], [BL, BB], pp(BL, BB, 2.4), pp(BL, BB - 5, 2.4)]), '#212b44');
    g += P(poly([[BR, BB - 5], [BR, BB], pp(BR, BB, 2.4), pp(BR, BB - 5, 2.4)]), '#212b44');
    // доски пола (сходятся в точку схода) и стыки
    let fl = '';
    for (let i = 0; i <= 9; i++) { const xb = BL + i * (BR - BL) / 9; const e = pp(xb, BB, 2.4); fl += `M${f1(xb)} ${BB} L${e[0]} ${e[1]} `; }
    g += G(P(fl, 'none', 'stroke="#0d1424" stroke-width=".8" opacity=".7"'), '', 'clip-path="url(#hs_floorc)"');
    let jn = '';
    [[1.12, 0], [1.3, 1], [1.52, 0]].forEach(([k, o]) => {
      for (let i = o; i < 9; i += 2) { const a = pp(BL + i * 22, BB, k), b = pp(BL + (i + 1) * 22, BB, k); jn += `M${a[0]} ${a[1]} L${b[0]} ${b[1]} `; }
    });
    g += G(P(jn, 'none', 'stroke="#0d1424" stroke-width=".7" opacity=".55"'), '', 'clip-path="url(#hs_floorc)"');

    // ================= ПРАВАЯ СТЕНА: кухонный проём (видно, когда дверь открывается) =================
    {
      const k0 = 1.15, k1 = 1.45, top = BB - 0.77 * (BB - BT);
      const a = pp(BR, top, k0), b = pp(BR, top, k1), c = pp(BR, BB, k1), dd = pp(BR, BB, k0);
      const fa = pp(BR, top - 6, k0 - 0.03), fb = pp(BR, top - 6, k1 + 0.03), fc = pp(BR, BB, k1 + 0.03), fd = pp(BR, BB, k0 - 0.03);
      g += P(poly([fa, fb, fc, fd]), '#2a3654');
      g += P(poly([a, b, c, dd]), 'url(#hs_kit)');
      // тёплая полоса света на откосе проёма
      g += P(poly([pp(BR, top + 40, k0), pp(BR, top + 40, k0 + 0.05), pp(BR, BB, k0 + 0.05), dd]), '#f3b85a', 'opacity=".28"');
    }

    // ================= ПОТОЛОК: плафон (выключен) =================
    {
      const c = pp(VX, BT, 1.32);
      g += P(`M${c[0] - 15} ${c[1]} L${c[0] + 15} ${c[1]} C${c[0] + 14} ${c[1] + 7} ${c[0] - 14} ${c[1] + 7} ${c[0] - 15} ${c[1]} Z`, '#2a3550');
      g += P(`M${c[0] - 12} ${c[1] + 3.2} C${c[0] - 6} ${c[1] + 6.4} ${c[0] + 6} ${c[1] + 6.4} ${c[0] + 12} ${c[1] + 3.2}`, 'none', `stroke="${light('#8cc4ff')}" stroke-width=".9" opacity="${f1(0.15 + 0.3 * nearL)}"`);
      g += R(c[0] - 17, c[1] - 1.6, 34, 2, '#1d2640');
    }

    // ================= ЗАДНЯЯ СТЕНА: входная дверь =================
    {
      const x = 74, y = 126, w = 66, h = BB - 1 - y;
      g += R(x - 6, y - 6, w + 12, h + 6, '#2b3756') + R(x - 6, y - 6, w + 12, 1.2, '#8fb0e6', 'opacity=".22"') + R(x - 6, y - 6, 1.2, h + 6, '#8fb0e6', 'opacity=".12"');
      g += R(x, y, w, h, '#05080f');
      g += R(x + 0.5, y + 0.5, w - 1.5, h - 1, 'url(#hs_door)');
      g += R(x + 7, y + 10, w - 15, h * 0.38, '#0a0f1c', 'opacity=".45"') + R(x + 7, y + h * 0.52, w - 15, h * 0.4, '#0a0f1c', 'opacity=".45"');
      g += R(x + 7, y + 10, w - 15, 0.9, '#9cb6e2', 'opacity=".14"') + R(x + 7, y + h * 0.52, w - 15, 0.9, '#9cb6e2', 'opacity=".14"');
      g += R(x + 0.5, y + 0.5, w - 1.5, h - 1, 'url(#hs_doorLow)');
      // глазок с тёплой точкой лампы площадки, цепочка, замок, ручка
      g += Ci(x + 33, y + 40, 2.4, '#4a5368') + Ci(x + 33, y + 40, 1.3, '#ffd99a', 'opacity=".75"') + Ci(x + 33, y + 40, 4.5, 'url(#hs_warm)', 'opacity=".6"');
      g += P(`M${x + 7} ${y + 54} C${x + 22} ${y + 61} ${x + 40} ${y + 61} ${x + 54} ${y + 53}`, 'none', 'stroke="#8f9ab0" stroke-width="1.1" stroke-dasharray="1.3 1" opacity=".75"');
      g += R(x + 52, y + 50, 5, 5, '#6f7a90', 'rx="1"');
      g += R(x + 53, y + 72, 7, 15, '#5f6a80', 'rx="1.6"') + Ci(x + 56.5, y + 77, 1.8, '#9aa4b8');
      g += R(x + 54, y + 92, 7, 16, '#5f6a80', 'rx="1.8"') + R(x + 42, y + 96, 19, 3.4, '#b4bccb', 'rx="1.7"') + R(x + 42, y + 96, 19, 0.9, '#fff', 'opacity=".4"');
      // полоска света из-под двери и тонкая линия притвора
      g += R(x + 1, BB - 2.6, w - 2, 2.6, 'url(#hs_gap)');
      g += R(x + w - 1.2, y + 4, 1, h - 6, '#f3b85a', 'opacity=".22"');
      // выключатель с огоньком
      g += R(x + w + 10, 202, 7, 10, '#2c3754', 'rx="1.2"') + Ci(x + w + 13.5, 207, 0.9, '#ff9a4a') + Ci(x + w + 13.5, 207, 4, 'url(#hs_warm)', 'opacity=".7"');
    }

    // ================= ВЕШАЛКА: полка, крючки, две куртки =================
    {
      const rim = (dd, o) => P(dd, 'none', `stroke="${light('#9cc4f0')}" stroke-width="1" opacity="${f1(o)}" ${CAP}`);
      g += R(219, 120, 43, 3.5, '#3a3046') + R(219, 120, 43, 0.9, light('#9cc4f0'), `opacity="${f1(0.12 + 0.2 * wallL)}"`);
      g += P('M224 120 C224 112 234 110 238 120 Z', '#1a2238') + R(243, 111, 13, 9, '#222c46', 'rx="1.4"');
      g += R(219, 134, 43, 5, '#3a3046') + R(219, 134, 43, 0.9, light('#9cc4f0'), `opacity="${f1(0.12 + 0.2 * wallL)}"`);
      [229, 250].forEach(x => g += Ci(x, 137, 1.6, '#8a93a6'));
      // пуховик (светлее, ближе к колонке)
      g += P('M229 138 L229 144', 'none', 'stroke="#6a7386" stroke-width="1"');
      g += P('M216 160 C217 150 222 144 229 144 C236 144 241 150 242 160 L243 230 C235 234 223 234 215 230 Z', 'url(#hs_coatB)');
      for (let i = 0; i < 5; i++) g += P(`M216 ${166 + i * 13} C222 ${169 + i * 13} 236 ${169 + i * 13} 242.5 ${166 + i * 13}`, 'none', 'stroke="#0c1424" stroke-width="1" opacity=".75"');
      g += P('M229 146 L229 229', 'none', 'stroke="#0e1628" stroke-width=".9"');
      g += rim('M216.5 160 C217.5 151 222 145 229 144.6', 0.25 + 0.5 * wallL) + rim('M216 162 L215.4 228', 0.15 + 0.45 * wallL);
      // длинная парка с капюшоном (темнее, частично за краем двери)
      g += P('M250 138 L250 146', 'none', 'stroke="#6a7386" stroke-width="1"');
      g += P('M238 168 C239 156 244 151 250.5 151 C257 151 262 156 263 168 L265 262 C256 266 244 266 235 262 Z', 'url(#hs_coatP)', 'stroke="#05080f" stroke-width="1"');
      g += P('M250.5 154 L250 262', 'none', 'stroke="#060a14" stroke-width=".9"') + Ci(248, 186, 1.1, '#3a4562') + Ci(248, 206, 1.1, '#3a4562') + Ci(248, 226, 1.1, '#3a4562');
      g += `<ellipse cx="250.5" cy="147" rx="9" ry="8" fill="#1e2a46" stroke="#05080f" stroke-width="1"/><ellipse cx="251" cy="149" rx="5.4" ry="5.2" fill="#03050b"/>`;
      g += rim('M241.5 146 C243 141 247 139.5 251 139.6', 0.2 + 0.45 * wallL) + rim('M238.4 168 L236 260', 0.12 + 0.4 * wallL);
      // ботинки под вешалкой
      g += P('M224 303 C224 297 229 295 234 296 C238 297 238 300 240 302 L240 304 L224 304 Z', '#151d30') + R(224, 302.6, 16, 1.4, '#8f9ab0', 'opacity=".35"');
      g += P('M243 305 C243 298 248 296 253 297 C257 298 258 301 259 303 L259 305 Z', '#121a2c') + R(243, 303.6, 16, 1.4, '#8f9ab0', 'opacity=".3"');
    }

    // ================= КОМОД =================
    {
      // столешница (видна сверху), фасад с двумя ящиками, ножки
      g += `<ellipse cx="${SX}" cy="304" rx="48" ry="5" fill="#04070e" opacity=".55"/>`;
      g += R(152, 296, 3, 7, '#141220') + R(217, 296, 3, 7, '#141220');
      g += R(149, 258, 74, 39, 'url(#hs_comF)');
      g += R(152, 262, 68, 15, 'none', 'stroke="#0d0b16" stroke-width="1"') + R(152, 280, 68, 14, 'none', 'stroke="#0d0b16" stroke-width="1"');
      g += R(152, 262.5, 68, 0.8, '#8fb0e6', `opacity="${f1(0.06 + 0.12 * nearL)}"`) + R(152, 280.5, 68, 0.8, '#8fb0e6', `opacity="${f1(0.05 + 0.1 * nearL)}"`);
      g += R(181, 268.5, 10, 2.2, '#6c7488', 'rx="1.1"') + R(181, 286, 10, 2.2, '#6c7488', 'rx="1.1"');
      g += P('M152 247 L220 247 L223 258 L149 258 Z', 'url(#hs_comT)');
      g += R(149, 257.4, 74, 1.4, light('#9cc4f0'), `opacity="${f1(0.2 + 0.4 * nearL)}"`);
      // свет кольца на столешнице
      g += `<ellipse cx="${SX}" cy="252" rx="${f1(42 * breathe)}" ry="6.5" fill="url(#hs_pool)" opacity="${f1(Math.min(1, 0.45 + 0.4 * L1))}"/>`;
      // шнур уходит за комод
      g += P(`M${SX + 21} 251 C${SX + 28} 251 ${SX + 31} 249.5 ${SX + 33} 247.4`, 'none', `stroke="#0a0e18" stroke-width="1.3" ${CAP}`);
    }

    // ================= СВЕТ КОЛЬЦА НА СТЕНЕ И ПОТОЛКЕ (под колонкой по порядку слоёв) =================
    {
      let wl2 = '';
      wl2 += G(P(`M${SX - 14} ${RCY} L${SX + 14} ${RCY} L${SX + 62} ${BT} L${SX - 62} ${BT} Z`, 'url(#hs_cone)', `opacity="${f1(Math.min(1, 0.55 * wallL))}"`), '', 'filter="url(#hs_b8)"');
      wl2 += `<ellipse cx="${SX}" cy="${RCY - 18}" rx="${f1(150 * breathe)}" ry="${f1(150 * breathe)}" fill="url(#hs_wg)" opacity="${f1(Math.min(1, 0.85 * wallL))}"/>`;
      g += G(wl2, '', 'clip-path="url(#hs_backc)"');
      // потолок: отсвет у задней стены и дальше к камере
      g += G(`<ellipse cx="${SX - 8}" cy="${BT}" rx="150" ry="58" fill="url(#hs_wg)" opacity="${f1(Math.min(1, 0.7 * L1 * (1 - 0.4 * cover)))}"/>` +
        `<ellipse cx="${SX - 12}" cy="${BT - 40}" rx="160" ry="50" fill="url(#hs_wg)" opacity="${f1(Math.min(1, 0.4 * nearL))}"/>`, '', 'clip-path="url(#hs_ceilc)"');
      // боковые стены у задней части
      g += P(poly([[BL, BT], [BL, BB], pp(BL, BB, 1.5), pp(BL, BT, 1.5)]), light('#4a86e8'), `opacity="${f1(0.14 * nearL)}"`);
      g += P(poly([[BR, BT], [BR, BB], pp(BR, BB, 1.6), pp(BR, BT, 1.6)]), light('#4a86e8'), `opacity="${f1(0.12 * nearL)}"`);
    }

    // ================= ПОЛ: свет =================
    {
      let fg = '';
      // тёплый свет из-под входной двери
      fg += P(`M75 ${BB} L139 ${BB} L156 336 L52 336 Z`, 'url(#hs_spillW)');
      fg += `<ellipse cx="107" cy="${BB + 2}" rx="54" ry="10" fill="url(#hs_warm)"/>`;
      // тёплое пятно фонаря из кухонного проёма (справа)
      fg += G(P(poly([pp(BR, BB, 1.15), pp(BR, BB, 1.45), [212, 352], [192, 317]]), 'url(#hs_patch)'), '', 'filter="url(#hs_b3)"');
      // синее: пятно под комодом, блик-отражение кольца на лаке, рассеянный свет к камере
      fg += `<ellipse cx="${SX}" cy="${BB + 8}" rx="${f1(84 * breathe)}" ry="15" fill="url(#hs_pool)" opacity="${f1(Math.min(1, 0.55 * L1))}"/>`;
      fg += G(R(SX - 11, 304, 22, 58, 'url(#hs_streak)', `opacity="${f1(Math.min(1, 0.55 * nearL))}"`), '', 'filter="url(#hs_b3)"');
      fg += `<ellipse cx="${SX - 10}" cy="350" rx="150" ry="40" fill="url(#hs_wg)" opacity="${f1(Math.min(1, 0.45 * nearL))}"/>`;
      g += G(fg, '', 'clip-path="url(#hs_floorc)"');
      // тёплый отсвет на низ задней стены у двери
      g += `<ellipse cx="107" cy="${BB - 4}" rx="62" ry="22" fill="url(#hs_warm)" opacity=".45"/>`;
    }

    // ================= КОЛОНКА (модель k_smart_speaker) =================
    {
      let sp = '';
      sp += `<ellipse cx="${CX + 2}" cy="${BY + 4}" rx="84" ry="13" fill="#010207" opacity=".55" filter="url(#hs_rb2)"/>`;
      sp += P(BODY, 'url(#hs_cyl)') + G(R(90, TY - 24, 190, 120, 'url(#hs_mesh)'), '', 'clip-path="url(#hs_bodyc)"');
      sp += P(BODY, 'url(#hs_shade)') + P(BODY, 'url(#hs_botd)');
      sp += P(BODY, 'url(#hs_topl)', `opacity="${f1(0.6 + 0.4 * Math.min(1, ls))}"`);
      sp += P(`M102 ${TY + 0.5} A78 19 0 0 0 258 ${TY + 0.5}`, 'none', 'stroke="#07090e" stroke-width="2.4" opacity=".8"');
      sp += P(`M98.6 ${BY - 9} A81.6 15.6 0 0 0 261.4 ${BY - 9} L262 ${BY} A82 16 0 0 1 98 ${BY} Z`, '#0a0d14');
      sp += P(`M98.4 ${BY - 8.6} A81.6 15.6 0 0 0 261.6 ${BY - 8.6}`, 'none', 'stroke="#5d6a84" stroke-width="1.6" opacity=".5"');
      // контур силуэта — чтобы цилиндр отделялся от стены
      sp += P(`M102 ${TY} L98 ${BY}`, 'none', 'stroke="#7d93bd" stroke-width="2.6" opacity=".35"');
      if (speakK > 0.05) sp += P(BODY, light('#78b8ff'), `opacity="${f1(0.06 * speakK)}"`);
      // крышка
      sp += `<ellipse cx="${CX}" cy="${TY}" rx="78" ry="19" fill="#1d2330"/>`;
      sp += `<ellipse cx="${CX}" cy="${TY - 0.6}" rx="77" ry="18.4" fill="none" stroke="#a7b3c8" stroke-width="2" opacity=".55"/>`;
      sp += `<ellipse cx="${CX}" cy="${TY + 0.4}" rx="73.5" ry="16.9" fill="url(#hs_cap)"/>`;
      sp += `<ellipse cx="${CX}" cy="${TY}" rx="70" ry="16.4" fill="${light('#78b8ff')}" opacity="${f1(Math.min(.22, .08 * ls))}"/>`;
      // кнопки
      [[-26, 1.5], [26, 1.5], [-11, 5], [11, 5]].forEach(([dx, dy]) => sp += `<ellipse cx="${CX + dx}" cy="${TY + dy}" rx="6.4" ry="2.5" fill="#06080d"/>`);
      // кольцо: 12 сегментов
      let ringG = '', ringC = '';
      const head = t * 2 * Math.PI / 1.25;
      for (let i = 0; i < 12; i++) {
        const ac = (i * 30 - 90) * Math.PI / 180;
        const standby = 0.34 + 0.09 * Math.sin(t * 1.4 + i * 0.5);
        const dl = ((head - ac) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI), dl2 = ((head + Math.PI - ac) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const lis = Math.max(standby * 0.8, Math.exp(-Math.min(dl, dl2) / 0.85));
        const spk = clamp(0.3 + 0.8 * env * (0.72 + 0.28 * Math.sin(i * 1.9 + t * 11)), 0, 1);
        const it = Math.min(1, mix(mix(standby, lis, wl), spk, ws)) * redDim;
        const sa = ac - 0.36, sb = ac + 0.36;
        ringG += P(arc(sa, sb), 'none', `stroke="${light('#2f6fe0')}" stroke-width="11" opacity="${f1(it * 0.95)}" ${CAP}`);
        ringC += P(arc(sa, sb), 'none', `stroke="${p.red === true ? '#ff3030' : (it > 0.7 ? '#e3f0ff' : '#86c2ff')}" stroke-width="4.6" opacity="${f1((0.3 + it * 0.7) * redDim)}" ${CAP}`);
        if (it > 0.55) ringC += P(arc(sa + 0.07, sb - 0.07), 'none', `stroke="${light('#fbfdff')}" stroke-width="2" opacity="${f1(Math.min(1, (it - 0.5) * 1.8))}" ${CAP}`);
      }
      sp += G(ringG, '', 'filter="url(#hs_rb2)"') + G(ringG, '', 'filter="url(#hs_rb4)" opacity=".75"') + ringC;
      sp += `<ellipse cx="${CX}" cy="${TY - 2}" rx="${f1((100 + 30 * ls) * breathe)}" ry="${f1((36 + 15 * ls) * breathe)}" fill="url(#hs_pool)" opacity="${f1(Math.min(1, 0.55 + 0.35 * ls))}"/>`;
      g += G(sp, `translate(${f1(TX)} ${f1(TYo)}) scale(${SS})`);
    }

    // ================= ТЁМНОЕ НЕЧТО: проходит слева направо =================
    if (oa > 0.001) {
      const x = ox, bob = Math.sin(clamp((t - occ[0]) / (occ[1] - occ[0])) * Math.PI * 4) * 1.4;
      // тень к камере: свет кольца сзади, тень ложится на ближний пол
      const sh = (xc) => [f1(xc + (xc - SX) * 1.25), 384];
      const shp = poly([[f1(x - 20), FYD], [f1(x + 20), FYD], sh(x + 30), sh(x - 30)]);
      g += G(P(shp, '#010309', `opacity="${f1(0.6 * oa * Math.min(1, L1 + 0.2))}"`), '', 'filter="url(#hs_b3)" clip-path="url(#hs_floorc)"');
      // мягкая темнота вокруг (полутень) и плотное ядро — без головы, рук и лица
      g += G(`<ellipse cx="${f1(x)}" cy="${f1(FYD - 98 + bob)}" rx="46" ry="120" fill="url(#hs_occ)"/>`, '', `opacity="${f1(0.7 * oa)}" filter="url(#hs_occB2)"`);
      const yb = v => f1(FYD - v + bob);
      const body = `M${f1(x - 21)} ${FYD + 2} C${f1(x - 25)} ${FYD - 60} ${f1(x - 28)} ${FYD - 115} ${f1(x - 27)} ${yb(148)} C${f1(x - 26)} ${yb(160)} ${f1(x - 20)} ${yb(166)} ${f1(x - 16)} ${yb(172)} C${f1(x - 15)} ${yb(198)} ${f1(x + 13)} ${yb(200)} ${f1(x + 15)} ${yb(174)} C${f1(x + 20)} ${yb(167)} ${f1(x + 27)} ${yb(161)} ${f1(x + 28)} ${yb(148)} C${f1(x + 29)} ${FYD - 115} ${f1(x + 25)} ${FYD - 60} ${f1(x + 21)} ${FYD + 2} Z`;
      g += G(P(body, '#010309'), '', `opacity="${f1(0.97 * oa)}" filter="url(#hs_occB)"`);
    }

    // ================= ПЕРЕДНИЙ ПЛАН: проём спальни =================
    // левый косяк и стена спальни
    g += R(-30, -30, 52, 470, '#04070d');
    g += R(22, -30, 13, 470, '#0a101c') + R(33.4, 6, 1.2, 400, light('#5b78ad'), `opacity="${f1(0.18 + 0.22 * nearL)}"`);
    g += R(21, -30, 1.4, 470, '#02040a');
    // притолока
    g += R(-30, -30, 420, 34, '#04070d') + R(22, 4, 360, 7, '#0a101c') + R(34, 10.4, 330, 1, light('#5b78ad'), `opacity="${f1(0.12 + 0.16 * nearL)}"`);
    // створка двери спальни: торец + полотно
    g += P(`M${f1(edge)} -30 L${f1(edge + 7)} -30 L${f1(edge + 7)} 420 L${f1(edge)} 420 Z`, '#1a2338');
    g += R(edge, -30, 1.2, 450, light('#7e9ccd'), `opacity="${f1(0.22 + 0.3 * nearL)}"`);
    g += P(`M${f1(edge + 7)} -30 L400 -30 L400 420 L${f1(edge + 7)} 420 Z`, 'url(#hs_leaf)');
    // филёнки полотна — едва видны
    g += P(`M${f1(edge + 20)} 40 L400 34 M${f1(edge + 20)} 40 L${f1(edge + 20)} 196 L400 200 M${f1(edge + 20)} 226 L400 228 M${f1(edge + 20)} 226 L${f1(edge + 20)} 380`, 'none', 'stroke="#18213a" stroke-width="1.2" opacity=".8"');
    // ручка
    g += R(edge + 9, 276, 8, 26, '#141b2b', 'rx="2"') + P(`M${f1(edge + 13)} 287 L${f1(edge + 30)} 285`, 'none', `stroke="#3c4862" stroke-width="3.2" ${CAP}`) +
      P(`M${f1(edge + 13)} 286 L${f1(edge + 30)} 284`, 'none', `stroke="#8fa6d0" stroke-width=".8" opacity="${f1(0.25 + 0.3 * nearL)}" ${CAP}`);

    // ================= виньетка и низ под субтитры =================
    g += R(-20, -20, 400, 420, 'url(#hs_vig)');
    g += R(-20, 338, 400, 40, 'url(#hs_bot)') + R(-20, 373, 400, 300, '#03060c');
    return g;
  };
})();

// door_lock — внутренняя сторона входной двери крупно, ночь: тёмный дерматин с ромбовой простёжкой и гвоздиками,
// наличники и полоски обоев по краям, выключатель слева. Свет только с площадки: полоска под дверью и нить в притворе справа.
//   p.tKey — t: снаружи вставляют ключ — вертушка дрожит 0.35 с (±2–3 px на концах), свет в притворе вздрагивает, цепочка качается
//   p.turn — [t0, t1]: вертушка САМА поворачивается на 90°: два рывка, пауза (ключ возится), медленный ровный доворот; после t1 повёрнута
//   p.bare — true: только цилиндр под ключ, ручка и глазок; яркая щель и контрастные тени обуви
//   p.feet — t: в полоске под дверью две мягкие тени ног (без перехода), остаются до конца
//   p.keyhole — true: вместо вертушки пустой цилиндр со скважиной; turn вращает прорезь, tKey мелко дрожит
//   p.handle — [t0, t1]: рычаг медленно опускается на 25° и остаётся опущенным (также без keyhole)
//   p.pass — [[t0, t1, dir], ...]: две мягкие тени проходят под дверью; +1 вправо, −1 влево
//   p.peep — t: свет в глазке перекрывают снаружи; после t глазок остаётся тёмным
// Все времена абсолютные; отсутствующее событие не происходит, явное 0 поддерживается. Цепочка всегда висит НЕ накинутой.
// Камеры (cam): общий план {"z0":1,"z1":1.05,"ox":0,"oy":0};
//   крупно вертушка {"z0":1.6,"z1":1.75,"ox":0,"oy":-156} — ось вертушки остаётся в точке (180,164), над субтитрами;
//   глазок {"z0":2.2,"z1":2.2,"ox":0,"oy":-320} — центр глазка ≈ (180,82), без верхней чёрной полосы;
//   щель под дверью {"z0":1.6,"z1":1.7,"ox":0,"oy":120} — щель ≈ y 292 кадра, над ней ручка, под ней тени на коврике.
(() => {
  const CAP = 'stroke-linecap="round" stroke-linejoin="round"';
  const sm = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  // рывок с лёгким перелётом и возвратом (как защёлка, проскочившая упор)
  const jerk = k => { k = clamp(k); const c1 = 2.1, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
  const LX0 = 64, LX1 = 296, LB = 348;                 // полотно двери
  const QX0 = 78, QX1 = 282, QB = 334, QY = -4;        // поле простёжки (валик 14 px по краям)
  const QW = (QX1 - QX0) / 5, QH = 52;                 // ромб 40.8×52
  const KX = 180, KY = 164;                            // ось вертушки
  const HX = 180, HY = 254;                            // ось ручки
  const CH = [306.5, 101];                             // ушко цепочки на коробке
  const GX = 296.8;                                    // нить света в притворе
  const THUMB = 'M-26 -8.6 C-15 -8.6 -12 -6 0 -6 C12 -6 15 -8.6 26 -8.6 C32.2 -8.6 32.2 8.6 26 8.6 C15 8.6 12 6 0 6 C-12 6 -15 8.6 -26 8.6 C-32.2 8.6 -32.2 -8.6 -26 -8.6 Z';
  const LEVER = 'M186 247.6 L128 248.4 C118.6 248.6 112.4 250.6 112.4 255 C112.4 259.4 117.4 261 124.4 260.6 L186 259.4 Z';
  const screw = (x, y, r = 2.5) => Ci(x, y, r + .7, '#0b0f18') + Ci(x, y - .3, r, '#5c6577') +
    L(x - r * .55, y + r * .4, x + r * .55, y - r * .4, '#1b2130', .8, CAP) + Ci(x - r * .4, y - r * .6, r * .28, '#c4cad6', 'opacity=".55"');

  // угол цепочки: затухающие качания от толчков двери
  function sway(t, p) {
    let a = 0;
    const kick = (t0, A) => { const e = t - t0; if (e > 0 && e < 5) a += A * Math.sin(e * 8.6) * Math.exp(-e * 1.25) * sm(e / .06); };
    if (p.tKey != null) kick(p.tKey, .075);
    if (Array.isArray(p.turn)) { const [t0, t1] = p.turn, D = Math.max(t1 - t0, 0); kick(t0, .035); kick(t0 + .17 * D, .03); }
    return a;
  }

  SCENES.door_lock = function (u, p, d, t) {
    const bare = p.bare === true;
    // ---------- события
    const ka = t - (p.tKey ?? Infinity);
    const kEnv = ka >= 0 && ka < .35 ? sm(ka / .04) * (1 - sm((ka - .23) / .12)) : 0;
    // дрожь покадровая (30 fps): знак чередуется, 4–6° → концы барашка ходят на 2–3 px
    const kf = Math.floor(Math.max(ka, 0) * 30 + 1e-6);
    const jit = kEnv * (kf % 2 ? 1 : -1) * (4 + 2 * hash(kf * 7.3 + 1));
    const jx = kEnv * (hash(kf * 3.1 + 2) - .5) * 1.6, jy = kEnv * (hash(kf * 5.7 + 4) - .5) * 1.2;
    const crack = 1 - kEnv * (.38 + .3 * Math.sin(ka * 71));                       // свет в притворе вздрагивает
    let angle = 0;
    if (Array.isArray(p.turn)) {
      const [a, b] = p.turn;
      const q = b > a ? (t - a) / (b - a) : (t >= a ? 1 : -1);
      if (q >= 1) angle = 90;
      else if (q > 0) {
        const s = clamp((q - .42) / .58);
        angle = 13 * jerk(q / .05) + 16 * jerk((q - .17) / .05) + 61 * (.55 * s + .45 * sm(s));
        const fid = sm((q - .23) / .03) * (1 - sm((q - .39) / .03));            // в паузе ключ снаружи возится
        angle += fid * (1.1 * noise1(t * 19 + 5) + .5 * Math.sin(t * 61));
      }
    }
    const feet = p.feet != null && t >= p.feet;
    let handleAngle = 0;
    if (Array.isArray(p.handle)) {
      const [a, b] = p.handle;
      // Рычаг смотрит влево: отрицательный угол опускает свободный конец.
      handleAngle = -25 * sm(b > a ? (t - a) / (b - a) : (t >= a ? 1 : 0));
    }
    const sw = sway(t, p), bend = (sway(t, p) - sway(t - .05, p)) * 160;

    let g = `<defs>
      <linearGradient id="dl_wall" x2="0" y2="1"><stop stop-color="#070d1b"/><stop offset=".55" stop-color="#0d172c"/><stop offset="1" stop-color="#0f1a31"/></linearGradient>
      <pattern id="dl_pap" width="24" height="32" patternUnits="userSpaceOnUse" x="2" y="6"><rect x="0" width="1.2" height="32" fill="#9fb4d8" opacity=".07"/><path d="M12 10 L15 16 L12 22 L9 16 Z" fill="#9fb4d8" opacity=".08"/><circle cx="12" cy="3" r="1" fill="#9fb4d8" opacity=".07"/></pattern>
      <linearGradient id="dl_trim" x2="1" y2="0"><stop stop-color="#121a2c"/><stop offset=".2" stop-color="#1f2840"/><stop offset=".7" stop-color="#19223a"/><stop offset="1" stop-color="#0c1222"/></linearGradient>
      <radialGradient id="dl_cush" cx=".5" cy=".42" r=".62"><stop stop-color="#2c354b"/><stop offset=".5" stop-color="#1f2638"/><stop offset="1" stop-color="#0f1422"/></radialGradient>
      <linearGradient id="dl_haze" x2="1" y2="0"><stop stop-color="#f3b85a" stop-opacity="0"/><stop offset="1" stop-color="#f3b85a" stop-opacity=".085"/></linearGradient>
      <linearGradient id="dl_rollV" x2="1" y2="0"><stop stop-color="#0b101c"/><stop offset=".45" stop-color="#252d42"/><stop offset=".75" stop-color="#1b2234"/><stop offset="1" stop-color="#0c111d"/></linearGradient>
      <linearGradient id="dl_rollH" x2="0" y2="1"><stop stop-color="#0d121f"/><stop offset=".4" stop-color="#232b40"/><stop offset="1" stop-color="#0b0f1a"/></linearGradient>
      <linearGradient id="dl_rollW" x2="1" y2="0"><stop stop-color="#f3b85a" stop-opacity="0"/><stop offset=".6" stop-color="#f3b85a" stop-opacity=".1"/><stop offset="1" stop-color="#f3b85a" stop-opacity=".34"/></linearGradient>
      <linearGradient id="dl_jamb" x2="1" y2="0"><stop stop-color="#f3b85a" stop-opacity=".42"/><stop offset=".35" stop-color="#f3b85a" stop-opacity=".1"/><stop offset="1" stop-color="#f3b85a" stop-opacity="0"/></linearGradient>
      <radialGradient id="dl_crackG"><stop stop-color="#f3b85a" stop-opacity=".28"/><stop offset=".5" stop-color="#f3b85a" stop-opacity=".07"/><stop offset="1" stop-color="#f3b85a" stop-opacity="0"/></radialGradient>
      <radialGradient id="dl_amb" cx=".5" cy=".42" r=".55"><stop stop-color="#9fb4d8" stop-opacity=".075"/><stop offset="1" stop-color="#9fb4d8" stop-opacity="0"/></radialGradient>
      <linearGradient id="dl_low" x2="0" y2="1"><stop stop-color="#f3b85a" stop-opacity="0"/><stop offset="1" stop-color="#f3b85a" stop-opacity=".07"/></linearGradient>
      <linearGradient id="dl_plate" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#5d6678"/><stop offset=".3" stop-color="#7c8596"/><stop offset=".55" stop-color="#596274"/><stop offset="1" stop-color="#363e50"/></linearGradient>
      <linearGradient id="dl_ros" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#8f98a9"/><stop offset=".45" stop-color="#626b7d"/><stop offset="1" stop-color="#394152"/></linearGradient>
      <linearGradient id="dl_thumb" x2="0" y2="1"><stop stop-color="#c9ced8"/><stop offset=".3" stop-color="#9da5b4"/><stop offset=".7" stop-color="#6c7486"/><stop offset="1" stop-color="#4a5264"/></linearGradient>
      <radialGradient id="dl_hub" cx=".4" cy=".35" r=".7"><stop stop-color="#d3d8e1"/><stop offset=".6" stop-color="#8790a2"/><stop offset="1" stop-color="#535b6d"/></radialGradient>
      <linearGradient id="dl_lever" x2="0" y2="1"><stop stop-color="#c3c9d4"/><stop offset=".35" stop-color="#959daf"/><stop offset="1" stop-color="#4c5466"/></linearGradient>
      <linearGradient id="dl_floor" x2="0" y2="1"><stop stop-color="#121a2b"/><stop offset="1" stop-color="#05080f"/></linearGradient>
      <linearGradient id="dl_spill" gradientUnits="userSpaceOnUse" x1="0" y1="351" x2="0" y2="394"><stop stop-color="#f3b85a" stop-opacity=".55"/><stop offset=".3" stop-color="#f3b85a" stop-opacity=".22"/><stop offset="1" stop-color="#f3b85a" stop-opacity="0"/></linearGradient>
      <linearGradient id="dl_shadow" gradientUnits="userSpaceOnUse" x1="0" y1="349" x2="0" y2="396"><stop stop-color="#02040a" stop-opacity=".97"/><stop offset=".45" stop-color="#02040a" stop-opacity=".72"/><stop offset="1" stop-color="#02040a" stop-opacity="0"/></linearGradient>
      <linearGradient id="dl_bottom" gradientUnits="userSpaceOnUse" x1="0" y1="365" x2="0" y2="404"><stop stop-color="#03060c" stop-opacity="0"/><stop offset="1" stop-color="#03060c"/></linearGradient>
      <radialGradient id="dl_vig" cx=".5" cy=".3" r=".78"><stop offset=".5" stop-color="#02050b" stop-opacity="0"/><stop offset="1" stop-color="#02050b" stop-opacity=".72"/></radialGradient>
      <radialGradient id="dl_peep"><stop stop-color="#ffdc8a" stop-opacity=".8"/><stop offset="1" stop-color="#f3b85a" stop-opacity="0"/></radialGradient>
      <filter id="dl_soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6"/></filter>
      <filter id="dl_b1" x="-40%" y="-200%" width="180%" height="500%"><feGaussianBlur stdDeviation="1.1"/></filter>
      <filter id="dl_b3" x="-50%" y="-30%" width="200%" height="160%"><feGaussianBlur stdDeviation="2.6"/></filter>
      <clipPath id="dl_field"><rect x="${QX0}" y="-60" width="${f1(QX1 - QX0)}" height="${QB + 60}"/></clipPath>
    </defs>`;

    // ================= СТЕНА, НАЛИЧНИКИ, КОРОБКА =================
    g += R(-180, -240, 720, 1100, '#03060c');
    g += R(-20, -60, 400, 420, 'url(#dl_wall)') + R(-20, -60, 400, 420, 'url(#dl_pap)');
    // плинтус
    g += R(-20, 338, 62, 13, '#141c2e') + R(-20, 338, 62, 1, '#3a4660', 'opacity=".5"');
    g += R(318, 338, 62, 13, '#141c2e') + R(318, 338, 62, 1, '#3a4660', 'opacity=".5"');
    // выключатель слева (тот же, что в прихожей: одна клавиша, оранжевый огонёк)
    g += R(9, 147, 23, 34, '#05080f', 'rx="3" opacity=".7"');
    g += R(8, 145, 23, 34, '#222a3f', 'rx="3"') + R(8, 145, 23, 1.2, '#55617e', 'rx=".6" opacity=".6"');
    g += R(13, 151, 13, 21, '#171e31', 'rx="2"') + R(13, 151, 13, 1, '#3d4862', 'opacity=".7"') + L(13.5, 161.5, 25.5, 161.5, '#0c111d', .8);
    // наличники
    g += R(38, -60, 18, 412, 'url(#dl_trim)') + L(38.5, -60, 38.5, 352, '#05080f', 1) + L(52, -60, 52, 352, '#0b111e', .8, 'opacity=".8"');
    g += R(304, -60, 18, 412, 'url(#dl_trim)') + L(321.5, -60, 321.5, 352, '#05080f', 1) + L(308, -60, 308, 352, '#0b111e', .8, 'opacity=".8"');
    // коробка: левая в тени, правая подсвечена из притвора
    g += R(56, -60, 8, 412, '#0a0f1b') + L(63.4, -60, 63.4, 350, '#010309', 1.4);
    g += R(GX, -60, 304 - GX, 412, '#111827') + R(GX, -60, 304 - GX, 412, 'url(#dl_jamb)', `opacity="${f1(crack)}"`);
    g += R(-20, 349, 400, 4, '#0d1322');

    // ================= ПОЛОТНО: ДЕРМАТИН =================
    g += R(LX0, -60, LX1 - LX0, LB + 60, '#121827');
    // поле с ромбами
    let q = '';
    for (let r = 0; ; r++) {
      const cy = QY + (r - 2) * QH / 2; if (cy > QB + QH / 2) break;
      const odd = (r & 1) === 1;
      for (let m = -1; m <= 6; m++) {
        const cx = QX0 + m * QW + (odd ? 0 : QW / 2);
        if (cx < QX0 - QW / 2 || cx > QX1 + QW / 2) continue;
        q += P(`M${f1(cx)} ${f1(cy - QH / 2)} L${f1(cx + QW / 2)} ${f1(cy)} L${f1(cx)} ${f1(cy + QH / 2)} L${f1(cx - QW / 2)} ${f1(cy)} Z`, 'url(#dl_cush)', 'stroke="#070a12" stroke-width="1.5" stroke-linejoin="round"');
        // нижняя губа шва чуть светлее — шов вдавлен
        q += P(`M${f1(cx - QW / 2 + 2)} ${f1(cy + 1.4)} L${f1(cx)} ${f1(cy + QH / 2 - .4)} L${f1(cx + QW / 2 - 2)} ${f1(cy + 1.4)}`, 'none', 'stroke="#3a4560" stroke-width=".6" opacity=".35"');
      }
    }
    g += `<g clip-path="url(#dl_field)">${q}</g>`;
    g += R(222, -60, QX1 - 222, QB + 60, 'url(#dl_haze)', `opacity="${f1(crack)}"`);
    // валик по краям полотна
    g += P(`M${LX0} -60 L${QX0} -60 L${QX0} ${QB} L${LX0} ${LB} Z`, 'url(#dl_rollV)');
    g += P(`M${QX1} -60 L${LX1} -60 L${LX1} ${LB} L${QX1} ${QB} Z`, 'url(#dl_rollV)');
    g += P(`M${QX1} -60 L${LX1} -60 L${LX1} ${LB} L${QX1} ${QB} Z`, 'url(#dl_rollW)', `opacity="${f1(crack)}"`);
    g += P(`M${LX0} ${LB} L${QX0} ${QB} L${QX1} ${QB} L${LX1} ${LB} Z`, 'url(#dl_rollH)');
    g += L(QX0, QB, LX0 + 1, LB - 1, '#070a12', .9) + L(QX1, QB, LX1 - 1, LB - 1, '#070a12', .9);
    g += R(LX0, 290, LX1 - LX0, LB - 290, 'url(#dl_low)');
    // гвоздики по границе поля и пуговицы на пересечениях швов
    const nail = (x, y, r, w) => {
      let s = Ci(x, y + .5, r + .6, '#05070d') + Ci(x, y, r, '#58627a') + Ci(x - r * .35, y - r * .4, r * .38, '#c3cad8', 'opacity=".6"');
      if (w > .02) s += Ci(x + r * .45, y + r * .2, r * .45, '#ffd08a', `opacity="${f1(w)}"`);
      return s;
    };
    for (let y = QY; y <= QB + .1; y += QH / 5) { g += nail(QX0, y, 1.35, 0) + nail(QX1, y, 1.35, .75 * crack); }
    for (let x = QX0 + QW / 4; x < QX1 - .1; x += QW / 4) g += nail(x, QB, 1.35, .25 * clamp((x - 200) / 82));
    for (let r = 0; ; r++) {
      const y = QY + r * QH / 2; if (y > QB - 1) break;
      for (let x = QX0 + ((r & 1) ? QW / 2 : 0); x <= QX1 + .1; x += QW) {
        g += Ci(x, y + .6, 3.3, '#05070d', 'opacity=".9"') + nail(x, y, 2.2, .85 * Math.pow(clamp((x - 200) / 82), 2) * crack);
      }
    }
    // мягкий холодный «свет глаз» по центру полотна
    g += R(LX0, -60, LX1 - LX0, LB + 60, 'url(#dl_amb)');
    // края полотна
    g += L(LX0 + .6, -60, LX0 + .6, LB, '#03050b', 1.2);
    g += L(LX1 - 1.2, -60, LX1 - 1.2, LB, '#2d3650', .8, `opacity=".7"`);

    // ================= ПРИТВОР: НИТЬ СВЕТА =================
    g += `<ellipse cx="${GX}" cy="170" rx="22" ry="230" fill="url(#dl_crackG)" opacity="${f1(crack)}"/>`;
    g += R(GX - .9, -60, 1.9, LB + 61, '#f3b85a', `opacity="${f1(.85 * crack)}"`);
    g += R(GX - .3, -60, .7, LB + 61, '#ffe2a0', `opacity="${f1(.7 * crack)}"`);

    // ================= ГЛАЗОК =================
    g += Ci(180.6, 39.4, 10.6, '#02040a', 'opacity=".75" filter="url(#dl_soft)"') + Ci(180, 37.4, 9.4, 'url(#dl_ros)');
    g += Ci(180, 37.4, 9.4, 'none', 'stroke="#1b2130" stroke-width=".8"') + Ci(180, 37.4, 6.6, '#2a3242') + Ci(180, 37.4, 5.2, '#060a12');
    if (p.peep == null) {
      // Без нового параметра сохраняем исходный SVG, включая блик линзы.
      g += Ci(180, 37.4, 4.4, 'url(#dl_peep)', 'opacity=".4"') + Ci(178.2, 35.6, 1.1, '#e7ebf2', 'opacity=".55"');
    } else if (t < p.peep) {
      // Небольшая светлая линза читается и после ночного цветового фильтра.
      g += Ci(180, 37.4, 4.4, 'url(#dl_peep)') + Ci(180, 37.4, 2.5, '#ffdc8a') + Ci(179.6, 36.9, 1, '#fff0c4');
    }
    g += P('M187.6 40 A8.2 8.2 0 0 1 182.4 45.4', 'none', `stroke="#f3b85a" stroke-width=".9" opacity=".45" ${CAP}`);

    // ================= ЦЕПОЧКА (не накинута) =================
    if (!bare) {
    // планка с пазом на полотне: круглое окно слева пустое
    g += R(227, 91, 64, 14, '#03050b', 'rx="4" filter="url(#dl_soft)" opacity=".85"');
    g += R(226, 88, 64, 13, 'url(#dl_plate)', 'rx="3.5"') + R(226.5, 88.4, 63, 1, '#c9cfdb', 'rx=".5" opacity=".35"');
    g += L(289.6, 89.5, 289.6, 100, '#f3b85a', .9, `opacity="${f1(.6 * crack)}"`);
    g += R(243, 92.9, 39, 3.4, '#05080f', 'rx="1.7"') + Ci(238.4, 94.5, 4.3, '#05080f') + P('M234.4 95.6 A4.3 4.3 0 0 0 242.2 96.4', 'none', 'stroke="#9aa3b3" stroke-width=".6" opacity=".5"');
    g += screw(230.6, 94.5, 1.7) + screw(286, 94.5, 1.7);
    // ушко на коробке
    g += R(300.5, 84, 12.5, 26, '#03050b', 'rx="3" filter="url(#dl_soft)" opacity=".8"');
    g += R(300, 82, 12.5, 25, 'url(#dl_plate)', 'rx="3"') + R(300, 82, 1.4, 25, '#ffd08a', `rx=".7" opacity="${f1(.55 * crack)}"`);
    g += screw(306.2, 87.5, 1.5) + Ci(CH[0], CH[1], 2.6, 'none', 'stroke="#9aa3b3" stroke-width="1.3"');
    {
      // свисает дугой; при толчке качается, хвост запаздывает
      const N = 15, pts = [];
      const c = Math.cos(sw), s = Math.sin(sw);
      for (let i = 0; i <= N; i++) {
        const k = i / N;
        const x = 4.6 * Math.sin(Math.PI * k * .95) - 2.2 * k * k - bend * k * k, y = 66 * k;
        pts.push([CH[0] + x * c - y * s, CH[1] + 2 + x * s + y * c]);
      }
      let sh = '', ch = '', ce = '';
      for (let i = 0; i < N; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, an = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
        const warm = clamp(1 - Math.abs(mx - GX) / 18) * crack;
        sh += `<ellipse cx="${f1(mx - 1.6)}" cy="${f1(my + 2.6)}" rx="3.6" ry="2" transform="rotate(${f1(an)} ${f1(mx - 1.6)} ${f1(my + 2.6)})" fill="#02040a"/>`;
        if (i % 2 === 0) {
          ch += `<ellipse cx="${f1(mx)}" cy="${f1(my)}" rx="4.3" ry="2.6" transform="rotate(${f1(an)} ${f1(mx)} ${f1(my)})" fill="none" stroke="#05080f" stroke-width="2.3"/>`;
          ch += `<ellipse cx="${f1(mx)}" cy="${f1(my)}" rx="4.3" ry="2.6" transform="rotate(${f1(an)} ${f1(mx)} ${f1(my)})" fill="none" stroke="#9aa3b5" stroke-width="1.05"/>`;
        } else {
          const dx = Math.cos(an * Math.PI / 180) * 3.6, dy = Math.sin(an * Math.PI / 180) * 3.6;
          ce += L(mx - dx, my - dy, mx + dx, my + dy, '#05080f', 3.2, CAP) + L(mx - dx, my - dy, mx + dx, my + dy, '#7d8699', 1.7, CAP) +
            L(mx - dx * .6, my - dy * .6, mx + dx * .2, my + dy * .2, '#d4d9e3', .6, `opacity=".55" ${CAP}`);
        }
        if (warm > .03) ce += Ci(mx - (i % 2 ? .9 : 2.2), my - .3, .9, '#ffd08a', `opacity="${f1(.95 * warm)}"`);
      }
      const [ex, ey] = pts[N];
      g += `<g filter="url(#dl_soft)" opacity=".55">${sh}${Ci(ex - 1.6, ey + 4.6, 4.4, '#02040a')}</g>`;
      g += ch + ce;
      // головка на конце
      g += Ci(ex, ey + 2.4, 4.6, '#05080f') + Ci(ex, ey + 2.4, 3.7, 'url(#dl_hub)') + Ci(ex - 1, ey + 1.4, 1, '#eef1f6', 'opacity=".6"');
      g += Ci(ex - 2, ey + 3, 1.2, '#ffd08a', `opacity="${f1(.85 * clamp(1 - Math.abs(ex - GX) / 18) * crack)}"`);
    }

    } // !bare: цепочка вместе с обеими планками

    // ================= ЗАМОК: НАКЛАДКА И ВЕРТУШКА =================
    g += R(144, 116, 76, 106, '#02040a', 'rx="11" filter="url(#dl_soft)" opacity=".85"');
    g += R(142, 112, 76, 104, 'url(#dl_plate)', 'rx="10"');
    g += R(142.6, 112.6, 74.8, 102.8, 'none', 'rx="9.6" stroke="#cdd3de" stroke-width=".8" opacity=".3"');
    g += P('M217.4 124 L217.4 205 Q217.4 215.4 207 215.4 L152 215.4', 'none', `stroke="#f3b85a" stroke-width="1" opacity="${f1(.45 * (.6 + .4 * crack))}" ${CAP}`);
    g += screw(KX, 122.5) + screw(KX, 205.5);
    // розетка
    g += Ci(KX + .8, KY + 2, 31, '#0b0f18', 'opacity=".9"') + Ci(KX, KY, 29, 'url(#dl_ros)');
    g += Ci(KX, KY, 29, 'none', 'stroke="#1b2130" stroke-width=".9"') + Ci(KX, KY, 23, '#262e3e') + Ci(KX, KY, 23, 'none', 'stroke="#0d121c" stroke-width="1.4"');
    g += P(`M${KX - 26} ${KY - 9} A27.5 27.5 0 0 1 ${KX + 9} ${KY - 26}`, 'none', `stroke="#dfe4ec" stroke-width="1" opacity=".42" ${CAP}`);
    g += P(`M${KX + 27} ${KY + 5} A27.5 27.5 0 0 1 ${KX + 5} ${KY + 27}`, 'none', `stroke="#f3b85a" stroke-width="1.1" opacity=".5" ${CAP}`);
    if (p.keyhole === true || bare) {
      // Лицевая сторона цилиндра: неподвижный свет на металле, вращается пустая прорезь.
      g += `<defs><linearGradient id="dl_cylinder" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="#c4bd9e"/><stop offset=".3" stop-color="#a6a596"/><stop offset=".65" stop-color="#797e7d"/><stop offset="1" stop-color="#50585e"/></linearGradient></defs>`;
      let cy = Ci(.5, 1.2, 22, '#0a0e17') + Ci(0, 0, 21, 'url(#dl_cylinder)', 'stroke="#323b45" stroke-width="1"');
      cy += Ci(0, 0, 18.8, 'none', 'stroke="#d3ccb0" stroke-width=".65" opacity=".45"');
      cy += P('M-18 -5 A18.8 18.8 0 0 1 -5 -18', 'none', `stroke="#eee9d3" stroke-width="1.3" opacity=".7" ${CAP}`);
      cy += P('M19 4 A19.4 19.4 0 0 1 5 19', 'none', `stroke="#f3b85a" stroke-width=".9" opacity=".45" ${CAP}`);
      // Узкий канал с уступом бородки, без головки или стержня ключа изнутри.
      const slot = P('M-1.8 -10 L1.8 -10 L1.8 -2 L.7 -2 L.7 1 L1.8 1 L1.8 10 L-1.8 10 Z', '#020409', 'stroke="#424a50" stroke-width=".8" stroke-linejoin="round"') +
        P('M2.5 -9 L2.5 -2 M2.5 2 L2.5 9', 'none', `stroke="#ded8bc" stroke-width=".7" opacity=".65" ${CAP}`);
      cy += G(slot, `rotate(${f1(angle + jit * .45)})`);
      g += G(cy, `translate(${f1(KX + jx * .35)} ${f1(KY + jy * .35)})`);
    } else {
      // вертушка: тень, тёплый кант снизу-справа, тело (кант и тень не вращаются вместе с бликом)
      const rot = `rotate(${f1(angle + jit)})`;
      const at = (dx, dy) => `translate(${f1(KX + jx + dx)} ${f1(KY + jy + dy)}) ${rot}`;
      g += G(P(THUMB, '#01030a') + Ci(0, 0, 10, '#01030a'), at(1.3, 4), 'opacity=".8" filter="url(#dl_soft)"');
      g += G(P(THUMB, '#f3b85a'), at(1.1, 1), 'opacity=".62"');
      let th = P(THUMB, 'url(#dl_thumb)', 'stroke="#1a2130" stroke-width=".9"');
      th += P('M-25.5 -6.8 C-15 -6.8 -12 -4.4 0 -4.4 C12 -4.4 15 -6.8 25.5 -6.8', 'none', `stroke="#eef1f6" stroke-width="1" opacity=".45" ${CAP}`);
      [-24, -20.5, 20.5, 24].forEach(x => th += L(x, -5, x, 5, '#3c4456', .9, `opacity=".7" ${CAP}`));
      th += Ci(0, .8, 9.6, '#2c3444') + Ci(0, 0, 9, 'url(#dl_hub)') + Ci(0, 0, 9, 'none', 'stroke="#2a3141" stroke-width=".7"');
      th += L(-5, 0, 5, 0, '#3a4252', 1.2, CAP);
      g += G(th, at(0, 0));
    }

    // ================= РУЧКА =================
    g += R(168, 226, 28, 98, '#02040a', 'rx="13" filter="url(#dl_soft)" opacity=".85"');
    g += R(166, 222, 28, 98, 'url(#dl_plate)', 'rx="13"') + R(166.6, 222.6, 26.8, 96.8, 'none', 'rx="12.6" stroke="#cdd3de" stroke-width=".7" opacity=".28"');
    g += P('M193.4 236 L193.4 306 Q193.4 319.4 180 319.4', 'none', `stroke="#f3b85a" stroke-width="1" opacity=".42" ${CAP}`);
    g += screw(180, 231) + screw(180, 311);
    // скважина нижнего замка
    g += Ci(180, 291, 7.2, '#262e3e') + Ci(180, 291, 7.2, 'none', 'stroke="#0d121c" stroke-width="1"');
    g += Ci(180, 289.4, 2.3, '#020409') + P('M178.6 290 L181.4 290 L182.2 296 L177.8 296 Z', '#020409');
    // рычаг
    if (handleAngle !== 0) g += `<g transform="rotate(${f1(handleAngle)} ${HX} ${HY})">`;
    g += G(P(LEVER, '#01030a'), 'translate(1.4 4.2)', 'opacity=".8" filter="url(#dl_soft)"');
    g += P(LEVER, '#f3b85a', 'transform="translate(.4 1.1)" opacity=".55"');
    g += P(LEVER, 'url(#dl_lever)', 'stroke="#1a2130" stroke-width=".9"');
    g += P('M184 249.6 L128 250.4 C120.6 250.6 115.2 251.8 114.4 254', 'none', `stroke="#eef1f6" stroke-width="1" opacity=".5" ${CAP}`);
    if (handleAngle !== 0) g += '</g>';
    g += Ci(HX, HY, 12, '#0b0f18', 'opacity=".7"') + Ci(HX, HY - .6, 11, 'url(#dl_ros)') + Ci(HX, HY - .6, 7.4, 'url(#dl_hub)');
    g += P(`M${HX + 10} ${HY + 2} A11 11 0 0 1 ${HX + 2} ${HY + 10}`, 'none', `stroke="#f3b85a" stroke-width="1" opacity=".55" ${CAP}`);

    // ================= ПОЛ, ЩЕЛЬ, КОВРИК =================
    g += R(-20, 352, 400, 50, 'url(#dl_floor)');
    for (let i = 0; i < 9; i++) { const x = 20 + i * 40; g += L(x + (x - 180) * .02, 352, x + (x - 180) * .55, 402, '#1c2538', .8, 'opacity=".55"'); }
    g += L(-20, 361, 380, 361, '#1c2538', .7, 'opacity=".45"');
    // свет из-под двери на полу
    g += P(`M${LX0} 351 L${LX1} 351 L${LX1 + 36} 394 L${LX0 - 36} 394 Z`, 'url(#dl_spill)');
    // коврик
    g += P('M90 355.6 L270 355.6 L286 386 L74 386 Z', '#05080f', 'opacity=".6"');
    g += P('M92 356 L268 356 L284 386 L76 386 Z', '#1b2337');
    g += P('M97 359 L263 359 L276 384 L84 384 Z', '#141b2c');
    for (let y = 362; y < 384; y += 3.2) { const k = (y - 359) / 25; g += L(97 - 13 * k, y, 263 + 13 * k, y, '#1d2639', .9, 'opacity=".8"'); }
    g += P('M92 356 L268 356 L269 358 L91 358 Z', '#2c3650') + L(92, 356.2, 268, 356.2, '#f3b85a', .8, 'opacity=".55"');
    g += P('M92 356 L268 356 L284 386 L76 386 Z', 'url(#dl_spill)', 'opacity=".9"');
    // сама щель
    g += R(LX0 - 1, 348.3, LX1 - LX0 + 2, 3.2, '#f3b85a');
    g += R(LX0 + 4, 349.2, LX1 - LX0 - 8, 1.1, '#ffe2a0', 'opacity=".85"');
    g += `<ellipse cx="180" cy="350.5" rx="140" ry="7" fill="url(#dl_crackG)" opacity=".9"/>`;
    if (bare) {
      // Свет площадки остаётся светлым и после look=night. Отдельные градиенты
      // не меняют SVG старой сцены при отсутствии bare.
      g += `<defs>
        <linearGradient id="dl_bareSpill" gradientUnits="userSpaceOnUse" x1="0" y1="351" x2="0" y2="391"><stop stop-color="#ffe5ab" stop-opacity=".85"/><stop offset=".35" stop-color="#f3b85a" stop-opacity=".48"/><stop offset="1" stop-color="#f3b85a" stop-opacity="0"/></linearGradient>
        <linearGradient id="dl_bareShadow" gradientUnits="userSpaceOnUse" x1="0" y1="348" x2="0" y2="393"><stop stop-color="#010309"/><stop offset=".55" stop-color="#010309" stop-opacity=".96"/><stop offset="1" stop-color="#010309" stop-opacity="0"/></linearGradient>
        <clipPath id="dl_bareClip"><path d="M64 348 L296 348 L296 352 L332 394 L28 394 L64 352 Z"/></clipPath>
      </defs>`;
      g += P('M64 351 L296 351 L332 394 L28 394 Z', 'url(#dl_bareSpill)');
      g += R(63, 348.3, 234, 3.8, '#ffe5ab') + R(67, 349.1, 226, 1.6, '#fff5d9');
      // Контактная тень носка с округлой широкой передней частью и узкой
      // щиколоткой; дальше от порога тень вытягивается и мягко растворяется.
      const shoe = (x, width, lift, direction = 0) => {
        const toe = P('M-11 0 C-13 1 -16 4 -16 7 C-16 11 -10 13 0 13 C10 13 16 11 16 7 C16 4 13 1 11 0 Z', '#010309');
        const cast = P('M-11 0 L11 0 C12 11 18 24 22 42 Q0 48 -22 42 C-18 24 -12 11 -11 0 Z', 'url(#dl_bareShadow)');
        return G(cast + G(toe, `translate(${direction * 3} ${f1(lift)}) scale(1 ${f1(1 - lift * .035)})`),
          `translate(${f1(x)} 348) skewX(${direction * 16}) scale(${f1(width / 32)} 1)`);
      };
      let shadows = '';
      if (feet) shadows += shoe(145, 35, 0) + shoe(215, 36, 0);
      if (Array.isArray(p.pass)) for (const event of p.pass) {
        if (!Array.isArray(event)) continue;
        const [a, b, dir] = event;
        if (!(b > a && t >= a && t < b)) continue;
        const k = (t - a) / (b - a), sign = dir < 0 ? -1 : 1;
        const center = sign > 0 ? -25 + 410 * k : 385 - 410 * k;
        // Противофазные ступни: опорная задерживается, вторая обгоняет её.
        const phase = (t - a) * Math.PI * 4;
        for (let leg = 0; leg < 2; leg++) {
          const step = phase + leg * Math.PI;
          const x = center + sign * (leg ? 18 : -18) + sign * 17 * Math.sin(step);
          shadows += shoe(x, 33, 4 * Math.max(0, Math.cos(step)), sign);
        }
      }
      g += `<g clip-path="url(#dl_bareClip)">${shadows}</g>`;
    }
    if (feet && !bare) {
      // две тени ног: мягкие пятна, расходятся от лампы на площадке (она по центру за дверью)
      const foot = (fx, w) => {
        const a = fx - w / 2, b = fx + w / 2, k = .4, bot = 393;
        const A = a + (a - 180) * k, B = b + (b - 180) * k;
        return P(`M${f1(a + 2)} 349 C${f1(a - 1)} 360 ${f1(A + 3)} 376 ${f1(A + 7)} ${bot} Q${f1((A + B) / 2)} ${bot + 7} ${f1(B - 7)} ${bot} C${f1(B - 3)} 376 ${f1(b + 1)} 360 ${f1(b - 2)} 349 Z`, 'url(#dl_shadow)');
      };
      g += `<g filter="url(#dl_b3)">${foot(143, 31)}${foot(217, 32)}</g>`;
      g += R(118, 348.6, 124, 2.6, '#02040a', 'opacity=".3" filter="url(#dl_b1)"');
      g += `<g filter="url(#dl_b1)">${R(129, 347.8, 28, 4.4, '#02040a', 'rx="2.2"')}${R(203, 347.8, 29, 4.4, '#02040a', 'rx="2.2"')}</g>`;
    }


    // Проходящие снаружи ноги перекрывают только щель и её свет на полу.
    // Линейный проход за весь интервал; короткий детерминированный шаг
    // меняет расстояние между ногами. За пределами [t0,t1) следа нет.
    if (!bare && Array.isArray(p.pass)) {
      let shadows = '';
      for (const event of p.pass) {
        if (!Array.isArray(event)) continue;
        const [a, b, dir] = event;
        if (!(b > a && t >= a && t < b)) continue;
        const k = (t - a) / (b - a), sign = dir < 0 ? -1 : 1;
        const center = sign > 0 ? -5 + 370 * k : 365 - 370 * k;
        const stride = 24 + 5 * Math.sin(k * Math.PI * 4);
        for (let leg = -1; leg <= 1; leg += 2) {
          const x = center + leg * stride, w = leg < 0 ? 27 : 30;
          const left = x - w / 2, right = x + w / 2;
          const l = left + (left - 180) * .4, r = right + (right - 180) * .4;
          shadows += P(`M${f1(left)} 348 L${f1(right)} 348 C${f1(right)} 360 ${f1(r)} 378 ${f1(r + 3)} 394 L${f1(l - 3)} 394 C${f1(l)} 378 ${f1(left)} 360 ${f1(left)} 348 Z`, 'url(#dl_shadow)');
          shadows += R(left, 347, w, 5.5, '#02040a', 'rx="2"');
        }
      }
      if (shadows) {
        g += `<defs><clipPath id="dl_passClip"><path d="M${LX0} 347 L${LX1} 347 L${LX1} 351 L${LX1 + 36} 394 L${LX0 - 36} 394 L${LX0} 351 Z"/></clipPath></defs>`;
        g += `<g clip-path="url(#dl_passClip)"><g filter="url(#dl_b3)">${shadows}</g></g>`;
      }
    }

    // ================= ФИНАЛ =================
    g += R(-20, -60, 400, 460, 'url(#dl_vig)');
    // огонёк выключателя светится поверх виньетки
    g += Ci(19.5, 166.5, 6, 'url(#glowW)', 'opacity=".5"') + Ci(19.5, 166.5, 1.5, '#ff9a4a', 'opacity=".9"');
    g += R(-180, 365, 720, 600, 'url(#dl_bottom)');
    return g;
  };
})();

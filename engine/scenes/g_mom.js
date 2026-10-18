// сцена mom_close: крупный план мамы (голова и плечи, три четверти, лицом влево — к школе), метель, боке рупора и фонаря
//   p.tCall   — абс. время крика «Тёма!»: ладонь к губам, рот широко, клуб пара, 3 дуги звука влево
//   p.tInhale — абс. время вдоха: плечи вверх, пар втягивается и больше не идёт, глаза шире, огонёк рупора пульсирует 5 Гц
//   p.look    — поворот головы (−1 смотрит прямо на школу; −0.6 — чуть развёрнута и запрокинута к рупору)
(() => {
  const CAP = 'stroke-linecap="round" stroke-linejoin="round"';
  const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const rad = d => d * Math.PI / 180;
  const HX = 212, HY = 196;               // центр головы на холсте
  const SKIN = '#e2cfc0', SKIN_SH = '#b9a8a0', HAIR = '#3a2a22', LIPS = '#9a5a5a';
  const HAT = '#7a2a3a', HAT2 = '#6a2232', HAT3 = '#561b29', MIT = '#6e2636', MIT2 = '#561b29';
  const SCARF = '#5a6070', SCARF2 = '#4a505e', SCARF3 = '#7a8294', COAT = '#2f2638', COAT2 = '#241d2c', COATL = '#3d3249';
  const LED = [60, 150], PORCH = [40, 262], LAMP = [330, 120];

  // точка из локальных координат головы в холст: поворот на rot вокруг (px,py), затем сдвиг на (ox,oy)
  function tp(x, y, rot, px, py, ox, oy) {
    const a = rad(rot), dx = x - px, dy = y - py;
    return [ox + px + dx * Math.cos(a) - dy * Math.sin(a), oy + py + dx * Math.sin(a) + dy * Math.cos(a)];
  }

  // клуб пара: рождается в age=0, живёт life; уходит влево-вверх. back (0..1) — втягивание обратно в рот
  function puff(ox, oy, age, life, seed, k = 1, sc = 1, back = 0) {
    if (age < 0 || age > life) return '';
    const e = (age / life) * (1 - back);
    let g = '';
    for (let i = 0; i < 7; i++) {
      const hh = hash(seed * 7.3 + i * 3.1), h2 = hash(seed * 3.7 + i * 5.9);
      const px = ox - (5 + 30 * hh) * eout(e) * sc + (h2 - 0.5) * 6 * e;
      const py = oy - (2 + 13 * h2) * eout(e) * sc - 8 * e * e * sc + (hh - 0.5) * 3;
      const r = (3 + 12 * eout(e)) * sc * (0.6 + 0.55 * hash(seed + i * 1.7));
      const a = 0.42 * k * Math.pow(1 - e, 1.25) * sstep(0, 0.07, e) * (1 - back * 0.4);
      g += Ci(px, py, r * 1.35, 'url(#mc_soft)', `opacity="${f1(Math.min(1, a))}"`);
    }
    return g;
  }

  // слой снега: хлопья летят влево-вниз; soft — размытые (радиальный градиент)
  function flakes(t, o) {
    const { n, seed, vx, vy, r0, r1, a, soft = false, x0 = -30, y0 = -30, w = 420, h = 440 } = o;
    let g = '';
    for (let i = 0; i < n; i++) {
      const k = hash(i * 1.7 + seed), kk = hash(i * 4.3 + seed * 2), k3 = hash(i * 9.1 + seed * 3);
      const sp = 0.7 + 0.6 * k3;
      const x = x0 + ((((k * w + vx * sp * t + Math.sin(t * 1.7 + i) * 6) % w) + w) % w);
      const y = y0 + ((((kk * h + vy * sp * t) % h) + h) % h);
      const r = r0 + (r1 - r0) * hash(i * 2.2 + seed * 5);
      const al = a * (0.45 + 0.55 * k3);
      g += soft ? Ci(x, y, r * 2.2, 'url(#mc_flake)', `opacity="${f1(al)}"`) : Ci(x, y, r, `rgba(225,234,248,${f1(al)})`);
    }
    return g;
  }

  SCENES.mom_close = function (u, p, d, t) {
    const tC = p.tCall ?? 1e9, tI = p.tInhale ?? 1e9, look = p.look ?? -1;   // нет события — оно «в будущем»
    const lk = clamp(look + 1, 0, 0.7);                     // 0 — профиль к школе, больше — к зрителю (рабочий диапазон look −1…−0.3)
    // ---- события
    const kRaise = eout(lin(t, tC - 0.25, tC));             // ладонь к губам
    const kShout = sstep(tC - 0.06, tC + 0.06, t) * (1 - 0.55 * sstep(tC + 0.62, tC + 0.95, t));   // рот
    const kFwd = ease(lin(t, tC - 0.25, tC)) * (1 - 0.5 * ease(lin(t, tC + 0.9, tC + 1.6)));
    const kIn = ease(lin(t, tI, tI + 0.5));                 // вдох
    const kPull = ease(lin(t, tI, tI + 0.45));              // пар втягивается
    // ---- поза
    const brth = Math.sin(t * 2 * Math.PI / 2.7) * 0.8 * (1 - kIn);
    const bx = -3 * kFwd + noise1(t * 0.5 + 3) * 0.6 + noise1(t * 19) * 0.14;
    const by = -brth - 3 * kIn + noise1(t * 17 + 5) * 0.12;
    const pitch = lk * 10 + 3 * kIn - 2.5 * kFwd * (1 - kIn) + noise1(t * 0.6 + 8) * 0.8;   // + = подбородок вверх
    const yaw = lk * 5;                                      // черты лица смещаются к зрителю
    const OX = HX + bx, OY = HY + by;
    const PVX = 4, PVY = 36;                                 // шарнир головы (шея)
    const toC = (x, y) => tp(x, y, pitch, PVX, PVY, OX, OY);

    // ---- огонёк рупора: медленно «дышит», после вдоха — 5 Гц
    const slow = 0.78 + 0.22 * Math.sin(t * 2 * Math.PI * 0.7);
    const fast = 0.55 + 0.45 * Math.sin((t - tI) * 2 * Math.PI * 5);
    const ledA = mix(slow, fast, sstep(tI, tI + 0.3, t));

    let g = `<defs>
      <linearGradient id="mc_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040915"/><stop offset=".55" stop-color="#0a1531"/><stop offset="1" stop-color="#0d1a37"/></linearGradient>
      <linearGradient id="mc_fac" gradientUnits="userSpaceOnUse" x1="96" y1="0" x2="140" y2="0"><stop offset="0" stop-color="#0a1324"/><stop offset="1" stop-color="#0a1324" stop-opacity="0"/></linearGradient>
      <radialGradient id="mc_flake"><stop offset="0" stop-color="#eef4ff" stop-opacity="1"/><stop offset=".45" stop-color="#eef4ff" stop-opacity=".55"/><stop offset="1" stop-color="#eef4ff" stop-opacity="0"/></radialGradient>
      <radialGradient id="mc_soft"><stop offset="0" stop-color="#e9f0fb" stop-opacity=".9"/><stop offset=".55" stop-color="#e9f0fb" stop-opacity=".55"/><stop offset="1" stop-color="#e9f0fb" stop-opacity="0"/></radialGradient>
      <radialGradient id="mc_blush"><stop offset="0" stop-color="#d6606a" stop-opacity=".32"/><stop offset="1" stop-color="#d6606a" stop-opacity="0"/></radialGradient>
      <filter id="mc_bl" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="5"/></filter>
      <radialGradient id="mc_blur"><stop offset="0" stop-color="#0e192d" stop-opacity="1"/><stop offset=".6" stop-color="#0e192d" stop-opacity=".9"/><stop offset="1" stop-color="#0e192d" stop-opacity="0"/></radialGradient>
      <linearGradient id="mc_ul" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="8"><stop offset="0" stop-color="#eaf3ff" stop-opacity=".5"/><stop offset="1" stop-color="#eaf3ff" stop-opacity="0"/></linearGradient>
      <linearGradient id="mc_red" gradientUnits="userSpaceOnUse" x1="-29" y1="0" x2="-17" y2="0"><stop offset="0" stop-color="#ff3c3c" stop-opacity=".5"/><stop offset="1" stop-color="#ff3c3c" stop-opacity="0"/></linearGradient>
      <linearGradient id="mc_bot" gradientUnits="userSpaceOnUse" x1="0" y1="304" x2="0" y2="374"><stop offset="0" stop-color="#03060d" stop-opacity="0"/><stop offset="1" stop-color="#03060d" stop-opacity=".97"/></linearGradient>
      <radialGradient id="mc_haze"><stop offset="0" stop-color="#1b3061" stop-opacity=".55"/><stop offset="1" stop-color="#1b3061" stop-opacity="0"/></radialGradient>
    </defs>`;

    // ================= фон (размыт) =================
    g += R(-20, -20, 400, 680, 'url(#mc_sky)');
    g += Ci(250, 250, 230, 'url(#mc_haze)');                 // городская дымка за метелью
    // фасад школы слева: тёмный блок с мягким краем, карниз
    g += R(-20, -20, 160, 420, 'url(#mc_fac)');
    g += R(-20, 92, 150, 8, 'rgba(150,175,215,.035)', 'rx="4"');
    // рупор: расплывчатый раструб под шапкой снега, рядом огонёк
    g += Ci(62, 152, 34, 'url(#mc_blur)', 'opacity=".9"');
    g += P('M34 140 C40 136, 50 134, 58 136 L86 132 C92 140, 94 166, 88 176 L58 164 C50 166, 40 162, 34 158 Z', '#0f1b30');
    g += `<ellipse cx="87" cy="154" rx="6" ry="22" fill="#0b1426"/>`;
    g += P('M36 139 C46 131, 70 129, 87 131 C70 133, 50 135, 36 139 Z', 'rgba(220,232,248,.2)');
    g += Ci(LED[0], LED[1], 22 + 6 * ledA, 'url(#glowR)', `opacity="${f1(0.55 + 0.45 * ledA)}"`);
    g += Ci(LED[0], LED[1], 6, C.red, `opacity="${f1(0.55 + 0.45 * ledA)}"`) + Ci(LED[0], LED[1], 3.2, '#ff8a7a', `opacity="${f1(0.35 + 0.5 * ledA)}"`);
    // козырёк крыльца со снегом и тёплая лампа под ним
    g += R(-20, 237, 134, 11, '#0c1629', 'rx="5"') + R(-20, 232, 130, 7, 'rgba(222,232,248,.16)', 'rx="3.5"');
    const pfl = 1 + 0.04 * noise1(t * 5 + 2);
    g += Ci(PORCH[0], PORCH[1], 34 * pfl, 'url(#glowW)') + Ci(PORCH[0], PORCH[1], 5, '#ffe1a6', 'opacity=".8"');
    // фонарь справа
    g += Ci(LAMP[0], LAMP[1], 60, 'url(#glowW)') + Ci(LAMP[0], LAMP[1], 11, '#ffcf8a', 'opacity=".35"') + Ci(LAMP[0], LAMP[1], 5.5, '#fff0d2', 'opacity=".75"');
    // круги боке: снежинки у ламп вне фокуса
    const bok = [[298, 90, 9, '#ffcf8a', .1], [348, 170, 7, '#ffcf8a', .12], [314, 152, 12, '#ffcf8a', .06], [276, 132, 6, '#ffcf8a', .07],
      [92, 118, 5, '#ff6a5a', .1], [30, 186, 8, '#ff6a5a', .07], [70, 292, 7, '#ffcf8a', .09], [12, 226, 10, '#ffcf8a', .05], [150, 58, 10, '#9fc4ff', .05], [126, 210, 8, '#9fc4ff', .045]];
    bok.forEach(([x, y, r, c, a], i) => {
      g += Ci(x + noise1(t * 0.4 + i * 3) * 4, y + noise1(t * 0.35 + i * 7) * 4, r, c, `opacity="${f1(a)}"`);
    });
    // дальний снег
    g += flakes(t, { n: 80, seed: 3, vx: -60, vy: 40, r0: 0.5, r1: 1.2, a: 0.5 });
    g += flakes(t, { n: 30, seed: 7, vx: -120, vy: 60, r0: 1, r1: 1.7, a: 0.55 });

    // ================= мама =================
    // --- тело (плечи, пальто, шарф) в локальных координатах головы
    let body = '';
    // волосы сзади: из-под шапки до плеч
    body += P('M12 -8 C30 -6, 41 8, 40 28 C39 42, 33 52, 22 58 L6 54 C16 40, 20 20, 12 -8 Z', HAIR);
    body += P('M30 4 C36 16, 37 30, 33 44', 'none', `stroke="#4c382e" stroke-width="1.1" opacity=".8" ${CAP}`);
    body += P('M40 18 C41 32, 37 46, 28 55', 'none', `stroke="#ffb878" stroke-width="1.2" opacity=".3" ${CAP}`);
    let coat = '';
    coat += P('M-82 230 C-82 160, -80 120, -70 100 C-64 88, -54 80, -42 74 L-22 66 L34 60 L74 70 C90 76, 100 86, 106 100 C114 120, 116 160, 118 230 Z', COAT);
    // рукав ближней руки: тень и шов
    coat += P('M78 72 C92 82, 100 96, 102 120 L106 230 L118 230 C116 160, 114 120, 106 100 C100 86, 90 76, 78 72 Z', COAT2, 'opacity=".7"');
    coat += P('M78 74 C92 86, 98 104, 100 134', 'none', `stroke="#1b1522" stroke-width="1.4" ${CAP}`);
    coat += P('M-50 80 C-60 92, -66 110, -68 136', 'none', `stroke="#1b1522" stroke-width="1.4" ${CAP}`);
    // борт и пуговицы
    coat += P('M8 76 C6 120, 2 170, 0 230', 'none', `stroke="#1b1522" stroke-width="2" ${CAP}`);
    coat += Ci(15, 104, 2.4, '#1d1724') + Ci(13, 140, 2.4, '#1d1724');
    // контровой свет от фонаря по ближнему плечу
    coat += P('M36 60 L74 70 C90 76, 100 86, 106 100 C112 114, 115 132, 116 150', 'none', `stroke="#ffb878" stroke-width="1.6" opacity=".4" ${CAP}`);
    coat += P('M-22 66 L-42 74 C-54 80, -64 88, -70 100 C-76 112, -79 128, -80 146', 'none', `stroke="#9ec2f0" stroke-width="1.2" opacity=".22" ${CAP}`);
    // шея (в тени)
    coat += P('M-12 24 L-10 50 L18 50 L16 20 Z', '#bda69c');
    // шарф: два толстых оборота вокруг шеи
    let sc = '';
    sc += P('M-36 60 C-38 74, -18 84, 6 84 C28 84, 46 76, 46 62 C46 54, 40 50, 30 48 L-26 52 C-32 54, -36 56, -36 60 Z', SCARF2);
    sc += P('M-35 59 C-36 70, -18 79, 6 79 C27 79, 44 72, 44 61 C40 66, 26 72, 6 72 C-14 72, -30 66, -35 59 Z', SCARF);
    sc += P('M-30 44 C-24 36, -4 33, 14 34 C30 35, 42 42, 43 52 C42 63, 26 70, 4 70 C-16 70, -31 63, -33 53 C-33 49, -32 46, -30 44 Z', SCARF);
    // рубчик вязки
    for (let i = 0; i < 10; i++) {
      const x = -28 + i * 7.6;
      const top = 37 + Math.pow((x - 6) / 36, 2) * 7, bot = 68 - Math.pow((x - 6) / 38, 2) * 10;
      sc += P(`M${f1(x)} ${f1(top)} C${f1(x + 1.6)} ${f1(mix(top, bot, 0.35))}, ${f1(x + 1.4)} ${f1(mix(top, bot, 0.7))}, ${f1(x - 0.6)} ${f1(bot)}`, 'none', `stroke="${SCARF2}" stroke-width="1.1" opacity=".7" ${CAP}`);
    }
    for (let i = 0; i < 11; i++) {
      const x = -30 + i * 7.2;
      sc += L(x, 72 + Math.pow((x - 6) / 40, 2) * -4, x - 1.2, 80 - Math.pow((x - 6) / 40, 2) * 8, SCARF2, 1, `opacity=".7" ${CAP}`);
    }
    sc += P('M-30 45 C-22 37, -4 34, 14 35 C29 36, 40 42, 42 50', 'none', `stroke="${SCARF3}" stroke-width="1.6" opacity=".85" ${CAP}`);
    sc += P('M-33 54 C-31 63, -16 70, 4 70', 'none', `stroke="#353a46" stroke-width="1.4" opacity=".8" ${CAP}`);
    // конец шарфа свисает на ближней стороне
    sc = P('M4 64 C6 78, 8 92, 6 106 L22 108 C24 94, 24 78, 20 62 Z', SCARF2) + P('M6 64 C8 78, 10 92, 9 106 L20 107 C21 94, 21 78, 18 62 Z', SCARF) +
      [76, 86, 96].map(y => L(9.4, y, 20.4, y + 0.6, SCARF2, 1, 'opacity=".8"')).join('') + L(8, 106.5, 21, 107.6, '#3a3f4b', 1.4) + sc;
    // снег на плечах и шарфе
    let sn = '';
    // комочки снега: несколько слипшихся кружков, чуть ниже кромки
    const clumps = [[50, 64.6, 1.2], [63, 68.4, 0.9], [79, 74.6, 1.3], [92, 83.4, 0.8], [-42, 74, 1.1], [-56, 82.4, 0.8], [-10, 35.8, 1], [6, 34.6, 0.8], [24, 36.6, 1.1], [35, 42, 0.7]];
    clumps.forEach(([x, y, k], i) => {
      for (let j = 0; j < 3; j++) {
        const dx = (hash(i * 3.1 + j) - 0.5) * 4 * k, dy = hash(i * 5.7 + j * 2) * 1.6 * k;
        sn += Ci(x + dx, y + dy - 0.6, (0.6 + 0.6 * hash(i + j * 7.3)) * k, '#e9eff8', `opacity="${f1(0.55 + 0.4 * hash(i * 1.3 + j))}"`);
      }
    });
    const colS = 1 + 0.03 * kIn;
    body += G(coat + sc + sn, `translate(6 58) scale(${f1(colS)}) translate(-6 -58)`);

    // --- голова
    const jd = 3.2 * kShout + 0.9 * kIn;                    // опускание челюсти
    const face = `M27 -8 C27 4, 24 14, 18 24 C12 ${31 + jd * 0.5}, 3 ${36 + jd}, -8 ${38 + jd} C-13 ${38.6 + jd}, -17 ${36 + jd}, -19.5 ${32 + jd * 0.8} ` +
      `C-21.4 ${28 + jd * 0.6}, -22 ${24 + jd * 0.3}, -22.6 21 C-23.2 18.4, -23.4 16, -24 13.4 C-25.4 9, -25.6 5, -25.4 1 C-26.8 -4, -27.6 -11, -27 -18 ` +
      `C-25 -32, -12 -39, 1 -39 C16 -39, 27 -28, 27 -8 Z`;
    let hd = `<clipPath id="mc_fc"><path d="${face}"/></clipPath>`;
    hd += P(face, SKIN);
    let fc = '';
    // дальняя щека в холодной тени (полоса за линией носа)
    const yw = yaw * 0.6;
    fc += P(`M${-20.5 + yw} -2 C${-22 + yw} 6, ${-23.4 + yw} 14, ${-22.6 + yw} 20 C${-22 + yw} 26, ${-20 + yw} 31, -16 42 L-40 42 L-40 -6 Z`, SKIN_SH, 'opacity=".8"');
    // тень от шапки на лбу
    fc += P('M-32 -13 C-12 -17, 14 -12, 34 1 L34 6 C14 -6, -12 -11, -32 -8 Z', '#bca59c', 'opacity=".7"');
    // тень под челюстью сзади
    fc += P(`M27 -2 C27 8, 24 16, 18 24 C12 ${31 + jd * 0.5}, 5 ${35 + jd}, -2 ${37 + jd} L30 44 Z`, '#cbb4a9', 'opacity=".6"');
    // холодный подсвет снизу (подбородок, скула)
    fc += P(face, 'url(#mc_ul)');
    fc += `<ellipse cx="${f1(-9 + yaw)}" cy="12" rx="7" ry="3.6" fill="rgba(244,250,255,.2)"/>`;
    // красный край от светодиода
    fc += P(face, 'url(#mc_red)', `opacity="${f1(0.5 + 0.5 * ledA)}"`);
    // тёплый контровой по челюсти
    fc += P('M27 -8 C27 4, 24 14, 18 24', 'none', `stroke="#ffb878" stroke-width="1.6" opacity=".3" ${CAP}`);
    hd += G(fc, '', 'clip-path="url(#mc_fc)"');

    // черты лица (смещаются с поворотом)
    let ft = '';
    // румянец от мороза
    ft += Ci(-5, 14.5, 9, 'url(#mc_blush)');
    // нос
    ft += P('M-20.5 -2 C-22 4, -26.4 9, -30.4 12.4 C-29.6 15.2, -26 16.6, -22.4 15.4 Z', SKIN);
    ft += Ci(-27.4, 12.8, 4, 'url(#mc_blush)');
    ft += P('M-30.4 12.4 C-29.6 15.2, -26 16.6, -22.4 15.4', 'none', `stroke="#b48a7c" stroke-width="1" ${CAP}`);
    ft += P('M-25.6 14.4 C-24.4 13.2, -23 13.6, -22.4 15', 'none', `stroke="#a87a6e" stroke-width=".9" ${CAP}`);
    ft += P('M-20.5 -2 C-21.4 3, -23.6 7, -26.4 10', 'none', `stroke="#c9ab9e" stroke-width=".8" opacity=".75" ${CAP}`);
    // глаз: тёмный миндаль с бликом; open — раскрытие (веко)
    let blink = 0;
    const bp = (t + 0.7) % 3.6;
    if (bp < 0.16 && Math.abs(t - tC) > 0.5 && t < tI - 0.2) blink = Math.sin(Math.PI * bp / 0.16);
    const open = (1 + 0.22 * kIn + 0.1 * kShout) * (1 - 0.92 * blink);
    const EY = 3.4;
    const eye = 'M-15 4 C-12.8 0.2, -7.6 -0.4, -4.4 2.4 C-6.8 5.8, -11.8 6.6, -15 4 Z';
    ft += G(P(eye, '#1d1620') + (blink < 0.5 ? Ci(-10.6 - lk * 0.6, 2.2 - lk * 0.8, 1.1, '#fff') + Ci(-7.4, 4.2, 0.45, '#fff', 'opacity=".7"') : ''),
      `translate(0 ${EY}) scale(1 ${f1(open)}) translate(0 ${-EY})`);
    // верхнее веко-линия, ресницы, складка века
    const lidY = (y) => f1(EY + (y - EY) * open);
    ft += P(`M-15.6 ${lidY(3.6)} C-12.8 ${lidY(-0.6)}, -7.6 ${lidY(-1)}, -3.8 ${lidY(2)} l1.5 -1.1`, 'none', `stroke="#24181a" stroke-width="1.3" ${CAP}`);
    ft += P(`M-14 ${lidY(-1.4)} C-11.4 ${lidY(-3.6)}, -7.6 ${lidY(-3.8)}, -5 ${lidY(-2.2)}`, 'none', `stroke="#c6aa9e" stroke-width=".8" opacity=".75" ${CAP}`);
    ft += P('M-13.6 6.8 C-10.6 7.9, -7.4 7.5, -5.4 6.1', 'none', `stroke="#b08a80" stroke-width=".7" opacity=".5" ${CAP}`);
    // бровь: тревожный изгиб (внутренний край выше)
    const bu = -1.6 * kShout - 1.2 * kIn;
    ft += P(`M-18 ${f1(-7.4 + bu)} C-14.2 ${f1(-8.8 + bu)}, -9.4 ${f1(-7.8 + bu)}, -4.2 ${f1(-5 + bu * 0.5)}`, 'none', `stroke="${HAIR}" stroke-width="2" ${CAP}`);
    // рот
    const MX = -17, MY = 22.6 + jd * 0.55;
    if (kShout > 0.02) {
      const rx = 1.6 + 2.4 * kShout, ry = 1.4 + 3.6 * kShout;
      ft += `<ellipse cx="${MX}" cy="${f1(MY + 0.4)}" rx="${f1(rx + 0.9)}" ry="${f1(ry + 0.9)}" fill="${LIPS}"/>`;
      ft += `<ellipse cx="${MX}" cy="${f1(MY + 0.4)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="#2a1218"/>`;
      ft += `<ellipse cx="${MX + 0.4}" cy="${f1(MY + 0.4 + ry * 0.55)}" rx="${f1(rx * 0.7)}" ry="${f1(ry * 0.35)}" fill="#7a3a42"/>`;
    } else if (kIn > 0.02) {
      const s = kIn;
      ft += `<ellipse cx="${MX}" cy="${f1(MY + 0.3)}" rx="${f1(1.2 + 1.5 * s)}" ry="${f1(1 + 2 * s)}" fill="${LIPS}"/>`;
      ft += `<ellipse cx="${MX}" cy="${f1(MY + 0.3)}" rx="${f1(0.5 + 1.1 * s)}" ry="${f1(0.4 + 1.5 * s)}" fill="#2a1218"/>`;
    } else {
      ft += P(`M-21.6 ${MY} C-19.6 ${MY - 1.5}, -17.6 ${MY - 1}, -16.6 ${MY - 0.6} C-15.2 ${MY - 1.2}, -13.4 ${MY - 0.8}, -11.6 ${MY + 0.2} C-14.2 ${MY + 0.9}, -19.2 ${MY + 1}, -21.6 ${MY} Z`, LIPS);
      ft += P(`M-20.4 ${MY + 0.6} C-17.4 ${MY + 3.6}, -13.8 ${MY + 3.2}, -12 ${MY + 0.6} Z`, '#a86a6a');
      ft += P(`M-21.6 ${MY} C-18.4 ${MY + 0.9}, -14.6 ${MY + 0.9}, -11.6 ${MY + 0.2}`, 'none', `stroke="#5a2a30" stroke-width=".8" ${CAP}`);
    }
    hd += G(ft, `translate(${f1(yaw)} 0)`);
    // прядь у виска
    hd += P('M3 -12 C6 -4, 8 6, 5 15 C10 8, 12 -2, 11 -12 Z', HAIR);
    // шапка: тулья, вязаные столбики, резинка в рубчик
    let hat = '';
    hat += P('M-31 -18 C-33 -38, -18 -52, 2 -53 C22 -53, 37 -40, 35 -4 C14 -17, -12 -22, -31 -18 Z', HAT);
    for (let i = 0; i < 7; i++) {
      const x = -24 + i * 8.6;
      hat += P(`M${f1(x)} ${f1(-20 + Math.abs(x) * 0.08 + (x > 0 ? x * 0.32 : 0))} C${f1(x * 0.92)} -34, ${f1(x * 0.6 + 2)} -46, ${f1(2 + x * 0.12)} -52`, 'none', `stroke="${HAT2}" stroke-width="1.1" opacity=".8" ${CAP}`);
    }
    hat += P('M-31 -18 C-33 -38, -18 -52, 2 -53', 'none', `stroke="#b04a5a" stroke-width="1.2" opacity=".35" ${CAP}`);
    hat += P('M2 -53 C22 -53, 37 -40, 35 -4', 'none', `stroke="#ffb878" stroke-width="1.6" opacity=".45" ${CAP}`);
    // резинка
    hat += P('M-31 -19 C-12 -23, 14 -18, 35 -5 L34 6 C14 -8, -12 -13, -30 -9 Z', HAT2);
    for (let i = 0; i <= 20; i++) {
      const e = i / 20;
      const xt = mix(-31, 35, e), yt = (1 - e) * (1 - e) * -19 + 2 * (1 - e) * e * -21.5 + e * e * -5;
      const xb = mix(-30, 34, e), yb = (1 - e) * (1 - e) * -9 + 2 * (1 - e) * e * -11.5 + e * e * 6;
      hat += L(xt + 0.3, yt + 0.8, xb, yb - 0.4, HAT3, 1.3, CAP);
    }
    hat += P('M-30 -9 C-12 -13, 14 -8, 34 6', 'none', `stroke="${HAT3}" stroke-width="1.2" ${CAP}`);
    hat += P('M-31 -19 C-12 -23, 14 -18, 35 -5', 'none', `stroke="#8e3a4b" stroke-width="1" opacity=".8" ${CAP}`);
    // помпон
    const PX = 4, PY = -60;
    let pom = '';
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; pom += Ci(PX + Math.cos(a) * 7.6, PY + Math.sin(a) * 7.2, 3.2, '#84303f'); }
    pom += Ci(PX, PY, 8.4, '#84303f') + Ci(PX - 2, PY - 2.6, 5, '#9a4253') + Ci(PX + 4, PY + 3, 4, '#6a2232', 'opacity=".6"');
    pom += P(`M${PX + 6} ${PY - 6} A9 9 0 0 1 ${PX + 9} ${PY + 3}`, 'none', `stroke="#ffb878" stroke-width="1.4" opacity=".45" ${CAP}`);
    // снег на шапке
    for (const [x, y, r] of [[-6, -51.5, 1.3], [-12, -49.5, 1], [8, -52.6, 1.1], [16, -50, 0.9], [PX - 4, PY - 7.6, 1.2], [PX + 2, PY - 8.6, 0.9], [-22, -42, 0.9]]) hat += Ci(x, y, r, '#eef3fb', 'opacity=".85"');
    hd += hat + pom;

    const headTr = `rotate(${f1(pitch)} ${PVX} ${PVY})`;
    g += G(body + G(hd, headTr), `translate(${f1(OX)} ${f1(OY)})`);

    // --- телефон в правой руке у груди: видна верхняя кромка, фонарик бьёт влево
    const phx = OX + 40, phy = OY + 104 - 1.5 * kIn;
    const ledX = phx - 4.2, ledY = phy + 3.6;
    let ph = '';
    ph += G(R(-6.5, 0, 13, 34, '#0d1017', 'rx="2.4"') + R(-5.6, 0.4, 11.2, 1.3, '#6b7690', 'rx=".6"') + R(3.6, 2, 2.2, 30, '#1c2230', 'rx="1"') +
      R(-5.4, 2.2, 3, 4.4, '#20283a', 'rx="1"'), `translate(${f1(phx)} ${f1(phy)}) rotate(-6)`);
    // варежка, обхватившая телефон
    ph += P(`M${phx - 10} ${phy + 18} C${phx - 13} ${phy + 30}, ${phx - 6} ${phy + 44}, ${phx + 6} ${phy + 44} C${phx + 16} ${phy + 42}, ${phx + 18} ${phy + 28}, ${phx + 12} ${phy + 16} C${phx + 6} ${phy + 12}, ${phx - 5} ${phy + 12}, ${phx - 10} ${phy + 18} Z`, MIT);
    ph += P(`M${phx - 9} ${phy + 20} C${phx - 11} ${phy + 12}, ${phx - 6} ${phy + 9}, ${phx - 3} ${phy + 13} C${phx - 2} ${phy + 17}, ${phx - 5} ${phy + 22}, ${phx - 9} ${phy + 20} Z`, '#7e2e3f');
    ph += P(`M${phx - 10} ${phy + 18} C${phx - 13} ${phy + 30}, ${phx - 6} ${phy + 44}, ${phx + 6} ${phy + 44}`, 'none', `stroke="#c9dcff" stroke-width="1.2" opacity=".35" ${CAP}`);
    g += ph;
    // световое пятно на пальто от фонарика
    g += Ci(ledX - 4, ledY + 8, 30, 'url(#glowC)', 'opacity=".45"');

    // --- пар изо рта
    const [mx, my] = toC(-24 + yaw, 22.6 + jd * 0.55);
    let st = '';
    const PER = 1.4, LIFE = 1.35;
    const T0 = t - u - 0.35;                                // первый выдох — до начала кадра: пар виден уже в первом кадре
    const n0 = Math.floor((t - LIFE - T0) / PER), n1 = Math.floor((t - T0) / PER);
    for (let n = n0; n <= n1 + 1; n++) {
      const tb = n * PER + T0;
      if (tb > tC - 0.4 && tb < tC + 1.0) continue;         // вдох перед криком и сам крик
      if (tb >= tI) continue;                               // после вдоха пара нет
      const back = t > tI ? kPull : 0;
      const age = back > 0 ? Math.min(tI - tb, LIFE) : t - tb;
      st += puff(mx, my, age, LIFE, n * 1.37 + 2, 1, 1, back);
    }
    // большой клуб пара на крик
    if (t >= tC - 0.02) {
      const back = t > tI && tC < tI ? kPull : 0;
      st += puff(mx - 3, my - 1, Math.min(t - tC, back > 0 ? tI - tC : 99), 1.8, 91, 1.0, 1.6, back);
      st += puff(mx - 6, my + 1, Math.min(t - tC - 0.12, back > 0 ? tI - tC - 0.12 : 99), 1.6, 47, 0.9, 1.3, back);
    }
    g += st;

    // --- дальняя рука: сложенная ладонь у губ (на крик). локоть перед грудью, предплечье почти вертикально
    if (kRaise > 0.001) {
      const tgt = toC(-37 + yaw, 31), rest = [OX - 50, OY + 190];
      const hxp = mix(rest[0], tgt[0], kRaise), hyp = mix(rest[1], tgt[1], kRaise);
      const elb = [mix(OX - 60, OX - 70, kRaise), mix(OY + 196, OY + 100, kRaise)];
      const shd = [OX - 46, OY + 86 - 3 * kIn];
      const ang = Math.atan2(hyp - elb[1], hxp - elb[0]) * 180 / Math.PI;   // направление предплечья
      const wx = hxp - Math.cos(rad(ang)) * 11, wy = hyp - Math.sin(rad(ang)) * 11;   // запястье
      let ar = '';
      // рукав: плечо -> локоть -> запястье (сначала общий контур, потом заливка — стык на локте без шва)
      ar += L(shd[0], shd[1], elb[0], elb[1], '#1b1522', 23, CAP) + L(elb[0], elb[1], wx, wy, '#1b1522', 20, CAP);
      ar += L(shd[0], shd[1], elb[0], elb[1], COATL, 20, CAP) + L(elb[0], elb[1], wx, wy, COATL, 17, CAP);
      ar += P(`M${f1(elb[0] + 4)} ${f1(elb[1] - 8)} q 5 3 6 9`, 'none', `stroke="#1b1522" stroke-width="1.2" opacity=".7" ${CAP}`);
      {
        const nx = -Math.sin(rad(ang)), ny = Math.cos(rad(ang));
        ar += L(elb[0] + nx * 6, elb[1] + ny * 6, wx + nx * 6, wy + ny * 6, '#9ec2f0', 1.1, `opacity=".22" ${CAP}`);
        ar += L(elb[0] - nx * 7, elb[1] - ny * 7, wx - nx * 6, wy - ny * 6, '#ff6a5a', 1.2, `opacity="${f1(0.14 + 0.14 * ledA)}" ${CAP}`);
      }
      // манжета рукава
      ar += G(R(-4, -9.5, 7, 19, '#2a2234', 'rx="3"'), `translate(${f1(wx)} ${f1(wy)}) rotate(${f1(ang)})`);
      // варежка вдоль предплечья, пальцами вверх; большой палец к губам
      let mt = '';
      mt += P('M0 -7 C6 -9, 14 -8.5, 18 -5 C21 -2, 21 3, 18 6 C14 8.5, 6 9, 0 7 Z', MIT);
      mt += P('M6 5.4 C9 11, 14.6 12.4, 16 9 C16.8 6.6, 13 5.2, 10 5.2 Z', '#7e2e3f');
      mt += P('M0 -7 C6 -9, 14 -8.5, 18 -5 C21 -2, 21 1, 20 3', 'none', `stroke="#ff7a6a" stroke-width="1.1" opacity="${f1(0.22 + 0.25 * ledA)}" ${CAP}`);
      mt += P('M3 4 C8 5, 13 4.6, 17 2.6', 'none', `stroke="${MIT2}" stroke-width="1" opacity=".8" ${CAP}`);
      mt += R(-4, -7.6, 6, 15.2, MIT2, 'rx="2"');
      for (let i = 0; i < 4; i++) mt += L(-3 + i * 1.6, -6.6, -3 + i * 1.6, 6.6, '#47141f', 0.7);
      ar += G(mt, `translate(${f1(wx)} ${f1(wy)}) rotate(${f1(ang)}) scale(1.12)`);
      g += ar;
    }

    // --- дуги звука: три белые дуги уходят влево за 0.6 с
    for (let i = 0; i < 3; i++) {
      const a = t - (tC + 0.02 + i * 0.12), life = 0.44;
      if (a < 0 || a > life) continue;
      const e = a / life, r = 14 + 64 * eout(e);
      const cx = mx - 8 - 20 * e, cy = my - 2;
      const a0 = rad(148), a1 = rad(212);
      const x0 = cx + Math.cos(a0) * r, y0 = cy + Math.sin(a0) * r, x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
      g += P(`M${f1(x0)} ${f1(y0)} A${f1(r)} ${f1(r)} 0 0 1 ${f1(x1)} ${f1(y1)}`, 'none', `stroke="#f4f7fc" stroke-width="${f1(2.6 - 1.3 * e)}" opacity="${f1(0.95 * (1 - e) * sstep(0, 0.08, e))}" ${CAP}`);
    }

    // --- луч фонарика влево (мягкие края) + подсвеченный снег в нём
    const bx2 = -30, cyB = ledY - 40;
    const cone = (sp) => `M${f1(ledX)} ${f1(ledY - 1.2)} L${bx2} ${f1(cyB - sp)} L${bx2} ${f1(cyB + sp)} L${f1(ledX)} ${f1(ledY + 1.2)} Z`;
    g += `<defs><linearGradient id="mc_bm" gradientUnits="userSpaceOnUse" x1="${f1(ledX)}" y1="0" x2="${bx2}" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".4" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="mc_bc" gradientUnits="userSpaceOnUse" x1="${f1(ledX)}" y1="0" x2="${bx2}" y2="0"><stop offset="0" stop-color="#e4efff" stop-opacity=".2"/><stop offset=".45" stop-color="#e4efff" stop-opacity=".08"/><stop offset="1" stop-color="#e4efff" stop-opacity="0"/></linearGradient>
      <mask id="mc_bmask"><path d="${cone(78)}" fill="url(#mc_bm)"/></mask></defs>`;
    g += G(P(cone(70), 'url(#mc_bc)') + P(cone(40), 'url(#mc_bc)'), '', 'filter="url(#mc_bl)"');
    g += G(flakes(t, { n: 90, seed: 13, vx: -150, vy: 70, r0: 0.7, r1: 1.7, a: 1 }), '', 'mask="url(#mc_bmask)"');
    // сам светодиод телефона
    g += Ci(ledX, ledY, 14, 'url(#glowC)') + `<ellipse cx="${f1(ledX)}" cy="${f1(ledY)}" rx="12" ry=".7" fill="#eaf4ff" opacity=".35"/>` + Ci(ledX, ledY, 2, '#ffffff');

    // ================= ближний снег (крупные размытые хлопья) =================
    g += flakes(t, { n: 14, seed: 21, vx: -210, vy: 80, r0: 2, r1: 4, a: 0.5, soft: true });

    // тёмный низ под субтитры (виньетку даёт рантайм)
    g += R(-20, 300, 400, 80, 'url(#mc_bot)') + R(-20, 373, 400, 300, '#03060d');
    return g;
  };
})();

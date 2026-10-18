// сцена phone_log: экран телефона крупно, «История запросов» приложения умного дома; рука держит телефон в темноте
//   p.tScroll    — начало жеста: палец тянет список вниз (0.5 с), отпускает, список пружинит; открывается верхняя строка (по умолч. 1.0)
//   p.tHighlight — верхняя строка краснеет, раскрывается плеер с кнопкой ▶ (по умолч. 2.6)
//   p.play       — [t0, t1] играет запись: столбики загораются слева направо, кнопка ▶ → пауза (по умолч. [3.2, 4.6])
//   p.room       — подпись под запросом: верхняя «Прихожая», остальные «Спальня»; верхняя краснеет и растёт вместе с подсветкой
//   p.ago        — время верхней строки «1 мин назад» вместо «03:02»
//   p.clock      — время в строке состояния «ЧЧ:ММ» (по умолч. «03:04»)
//   p.rows       — [[время, текст, комната], ...] вместо ROWS; самая новая сверху, комната видна при p.room
//   p.newRow     — {t, row: [время, текст, комната]}: красная строка «сейчас», въезд и сдвиг за 0.3 с
//   p.notif      — {t, title, text}: push с домом поверх шапки, въезд/выезд внутри 2 с
(() => {
  const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const hx = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  const mc = (a, b, k) => { const A = hx(a), B = hx(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };
  const SX0 = 33, SX1 = 327, SY0 = 17, SW = SX1 - SX0;      // экран
  const HDR = 92, LIST_Y = 100, PITCH = 72, RH = 64;       // низ шапки, верх списка, шаг строк, высота строки
  const ROWS = [
    ['03:02', '«Она спит?»'],
    ['02:47', '«Какая завтра погода»'],
    ['23:14', '«Будильник на 7:00»'],
    ['23:10', '«Включи музыку»'],
    ['22:51', '«Выключи свет»'],
  ];
  const wave = (cx, cy, col, s = 1) => [5, 9, 14, 9, 5].map((h, i) => R(cx - 10 * s + i * 4.8 * s, cy - h * s / 2, 2.8 * s, h * s, col, `rx="${1.4 * s}"`)).join('');
  const NB = 44, BX0 = 86, BSTEP = 4.45;
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // палец: кончик в (0,0), тело вниз; повернуть/сдвинуть снаружи
  function finger(w, len, nailK) {
    const a = w / 2, r = a * 0.7;
    const body = `M${-a} ${r + 8} C${-a} ${r * 0.3},${-a * 0.55} 0,0 0 C${a * 0.55} 0,${a} ${r * 0.3},${a} ${r + 8} L${a + 3} ${len} L${-a - 3} ${len} Z`;
    let g = P(body, 'url(#pl_fing)');
    g += P(body, 'url(#pl_fedge)');
    g += P(body, 'url(#pl_tipg)');
    const nw = a * 0.56;
    g += P(`M${-nw} ${r * 0.8 + 6} C${-nw} ${r * 0.25},${-nw * 0.5} 4,0 4 C${nw * 0.5} 4,${nw} ${r * 0.25},${nw} ${r * 0.8 + 6} L${nw * 0.95} ${a * 1.5} C${nw * 0.9} ${a * 1.5 + 5},${-nw * 0.9} ${a * 1.5 + 5},${-nw * 0.95} ${a * 1.5} Z`, `rgba(224,190,170,${nailK})`);
    g += P(`M${-nw * 0.7} ${r * 0.7 + 6} C${-nw * 0.7} ${r * 0.3},${-nw * 0.4} 8,0 8`, 'none', `stroke="rgba(190,225,255,.5)" stroke-width="1.3" stroke-linecap="round"`);
    // складки сустава
    [len * 0.5, len * 0.5 + 7].forEach(y => { g += L(-a * 0.5, y, a * 0.5, y, 'rgba(10,6,10,.45)', 1.4, 'stroke-linecap="round"'); });
    return g;
  }

  SCENES.phone_log = function (u, p, d, t) {
    const rows = p.rows != null ? p.rows : ROWS;
    const fresh = p.newRow && t >= (p.newRow.t ?? t - u);
    const insert = fresh ? sstep(0, 0.3, t - (p.newRow.t ?? t - u)) : 0;
    const tS = p.tScroll != null ? p.tScroll : 1.0;
    const play = p.play || [3.2, 4.6];
    let tH = p.tHighlight != null ? p.tHighlight : 2.6;
    if (!p.tHighlight && p.play) tH = Math.min(tH, play[0] - 0.6);
    const hl = fresh ? 0 : sstep(tH, tH + 0.35, t);
    const ex = sstep(tH + 0.05, tH + 0.6, t) * (1 - insert); // раскрытие/сворачивание плеера
    const prog = clamp((t - play[0]) / (play[1] - play[0]));
    const playing = t >= play[0] && t < play[1];
    const btnPop = (() => { const k = clamp((t - tH - 0.15) / 0.4); return k <= 0 ? 0 : eout(k) * (1 + 0.22 * Math.sin(Math.PI * k)); })();

    // ---------- жест: список и палец
    const dragK = ease(clamp((t - tS) / 0.5));               // 0..1 протяжка
    const tr = t - (tS + 0.5);
    const spring = tr > 0 ? 11 * Math.exp(-6.2 * tr) * Math.cos(15 * tr) - (tr > 0 ? 0 : 0) : 0;
    const off = -PITCH + (PITCH + 11) * dragK - (tr > 0 ? 11 * dragK : 0) + spring;   // после отпускания: 0 + пружина
    const press = sstep(tS - 0.25, tS - 0.05, t) * (1 - sstep(tS + 0.5, tS + 0.62, t));  // палец прижат
    const away = sstep(tS + 0.62, tS + 1.5, t);                // палец уходит
    const fx = 238 + 6 * away, fy = 214 + (off + PITCH) * 0.95 + 38 * away + (1 - press) * 22 * (1 - away) * (t < tS ? 1 : 0.4);
    const fAlpha = 1 - sstep(tS + 1.0, tS + 1.7, t);

    // тремор руки
    const tx = 1.3 * noise1(t * 0.7), ty = 1.6 * noise1(t * 0.55 + 4);
    const cG = mc('#4a86e8', '#d7263d', hl * 0.55), cG2 = mc('#9fd0ff', '#ff8a8a', hl * 0.45);

    let g = `<defs>
      <radialGradient id="pl_bg" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#0a1428"/><stop offset=".6" stop-color="#050b18"/><stop offset="1" stop-color="#02050c"/></radialGradient>
      <radialGradient id="pl_halo" cx=".5" cy=".42" r=".5"><stop offset=".55" stop-color="${cG}" stop-opacity=".32"/><stop offset="1" stop-color="${cG}" stop-opacity="0"/></radialGradient>
      <linearGradient id="pl_body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a3346"/><stop offset=".5" stop-color="#121722"/><stop offset="1" stop-color="#0a0d15"/></linearGradient>
      <linearGradient id="pl_scr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101c32"/><stop offset="1" stop-color="#0b1424"/></linearGradient>
      <linearGradient id="pl_hdr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16243d"/><stop offset="1" stop-color="#101c32"/></linearGradient>
      <linearGradient id="pl_hsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a14" stop-opacity=".85"/><stop offset="1" stop-color="#050a14" stop-opacity="0"/></linearGradient>
      <linearGradient id="pl_card" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2c47"/><stop offset="1" stop-color="#15233b"/></linearGradient>
      <linearGradient id="pl_cardR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a1a28"/><stop offset="1" stop-color="#2e1220"/></linearGradient>
      <linearGradient id="pl_sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".09"/><stop offset=".35" stop-color="#fff" stop-opacity=".02"/><stop offset=".36" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="pl_fing" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a4338"/><stop offset=".5" stop-color="#573630"/><stop offset="1" stop-color="#2a1a1c"/></linearGradient>
      <linearGradient id="pl_fedge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${cG2}" stop-opacity=".22"/><stop offset=".22" stop-color="${cG2}" stop-opacity=".05"/><stop offset=".8" stop-color="#ffb55c" stop-opacity="0"/><stop offset="1" stop-color="#ffb55c" stop-opacity=".16"/></linearGradient>
      <radialGradient id="pl_tipg" cx=".5" cy=".05" r=".55"><stop offset="0" stop-color="${cG2}" stop-opacity=".42"/><stop offset="1" stop-color="${cG2}" stop-opacity="0"/></radialGradient>
      <linearGradient id="pl_fr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#704a3c"/><stop offset=".35" stop-color="#4e3228"/><stop offset="1" stop-color="#241619"/></linearGradient>
      <linearGradient id="pl_frl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${cG2}" stop-opacity=".5"/><stop offset=".45" stop-color="${cG2}" stop-opacity="0"/></linearGradient>
      <radialGradient id="pl_glowR"><stop offset="0" stop-color="#ff3a4a" stop-opacity=".5"/><stop offset="1" stop-color="#ff3a4a" stop-opacity="0"/></radialGradient>
      <radialGradient id="pl_vig" cx=".5" cy=".4" r=".8"><stop offset=".5" stop-color="#010309" stop-opacity="0"/><stop offset="1" stop-color="#010309" stop-opacity=".8"/></radialGradient>
      <linearGradient id="pl_bot" gradientUnits="userSpaceOnUse" x1="0" y1="336" x2="0" y2="374"><stop offset="0" stop-color="#03060c" stop-opacity="0"/><stop offset="1" stop-color="#03060c" stop-opacity="1"/></linearGradient>
      <filter id="pl_b3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="pl_b8" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="8"/></filter>
      <filter id="pl_b16" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="16"/></filter>
      <clipPath id="pl_sc"><rect x="${SX0}" y="${SY0}" width="${SW}" height="900" rx="30"/></clipPath>
      <clipPath id="pl_ls"><rect x="${SX0}" y="${HDR}" width="${SW}" height="400"/></clipPath>
    </defs>`;

    // ---------- фон и гало экрана
    g += R(-20, -20, 400, 700, 'url(#pl_bg)');
    g += `<ellipse cx="180" cy="230" rx="260" ry="250" fill="url(#pl_halo)"/>`;
    // едва видимая складка одеяла/потолок: мягкие пятна холодного света по краям
    g += `<ellipse cx="-10" cy="120" rx="60" ry="90" fill="${cG}" opacity=".07" filter="url(#pl_b16)"/>`;
    g += `<ellipse cx="372" cy="330" rx="60" ry="100" fill="#ffb55c" opacity=".05" filter="url(#pl_b16)"/>`;

    // ================= телефон + держащая рука (общий тремор и наклон) =================
    let ph = '';
    // корпус
    ph += R(24, 7, 312, 900, 'url(#pl_body)', 'rx="40"');
    ph += R(24.8, 7.8, 310.4, 900, 'none', `rx="39.5" stroke="${cG2}" stroke-opacity=".28" stroke-width="1.2"`);
    ph += R(19.5, 118, 4, 30, '#1b2230', 'rx="1.5"') + R(19.5, 160, 4, 30, '#1b2230', 'rx="1.5"') + R(336, 150, 4, 46, '#1b2230', 'rx="1.5"');
    ph += R(SX0 - 3, SY0 - 3, SW + 6, 906, '#03050a', 'rx="33"');

    // ---------- экран
    let sc = R(SX0, SY0, SW, 900, 'url(#pl_scr)');
    // список
    let ls = '';
    const H0 = RH + 36 * ex;
    // При раннем newRow заодно отпускаем протяжку: к концу въезда карточки не перекрываются.
    const rowY = i => (i === 0 ? LIST_Y + off : LIST_Y + off + H0 + 8 + (i - 1) * PITCH) + (PITCH - off) * insert;
    if (fresh && insert > 0) {
      const [, q, room] = p.newRow.row;
      const y = LIST_Y - (PITCH - off) * (1 - insert);
      ls += R(38, y, 284, RH, '#23141f', 'rx="15"');
      ls += R(38.7, y + 0.7, 282.6, RH - 1.4, 'none', 'rx="14.5" stroke="#ff3030" stroke-width="1.4"');
      ls += R(39, y + 16, 3, 32, '#ff3030', 'rx="1.5"');
      ls += Ci(64, y + 32, 17, '#481b29') + wave(64, y + 32, '#ff3030');
      ls += T(92, y + (p.room ? 18 : 20), 'сейчас', 11, '#ff3030', 'font-family="Plex" font-weight="700" letter-spacing=".7"');
      ls += T(92, y + (p.room ? 37 : 44), esc(q), 15.5, '#fff0f0', 'font-family="Mont" font-weight="800"');
      if (p.room) ls += T(92, y + 54, esc(room), 12, '#ff3030', 'font-family="Mont" font-weight="600"');
    }
    rows.forEach(([tm, q, room], i) => {
      const y = rowY(i), h = i === 0 ? H0 : RH, hi = i === 0 ? hl : 0;
      if (y > 400 || y + h < HDR - 2) return;
      if (hi > 0.01) ls += `<ellipse cx="180" cy="${f1(y + 32)}" rx="190" ry="60" fill="url(#pl_glowR)" opacity="${f1(hi * 0.55)}"/>`;
      ls += R(38, y, 284, h, 'url(#pl_card)', 'rx="15"');
      if (hi > 0.01) ls += R(38, y, 284, h, 'url(#pl_cardR)', `rx="15" opacity="${f1(hi)}"`) + R(38.7, y + 0.7, 282.6, h - 1.4, 'none', `rx="14.5" stroke="#ff4a5c" stroke-opacity="${f1(hi * 0.85)}" stroke-width="1.3"`);
      else ls += R(38.5, y + 0.5, 283, h - 1, 'none', 'rx="14.5" stroke="#8fb4ee" stroke-opacity=".09" stroke-width="1"');
      // иконка волны
      ls += Ci(64, y + 32, 17, mc('#2a4a7c', '#7c1a2c', hi), `opacity="${f1(0.55 + 0.25 * hi)}"`);
      ls += wave(64, y + 32, mc('#a8d0ff', '#ffb0b0', hi), 1);
      // время, метка, текст
      ls += T(92, y + (p.room ? 18 : 24), p.ago && i === 0 ? '1 мин назад' : tm, 10.5, mc('#7f93b5', '#ff7b86', hi), 'font-family="Plex" font-weight="600" letter-spacing="1"');
      if (!p.room) ls += T(310, y + 24, 'Колонка · Спальня', 8.4, mc('#566a8c', '#a06a78', hi), 'text-anchor="end" font-family="Mont" font-weight="600"');
      ls += T(92, y + (p.room ? 37 : 47), q, 15.5, mc('#e8f0fc', '#ffffff', hi), 'font-family="Mont" font-weight="800"');
      if (p.room) ls += T(92, y + 54, p.rows != null ? room : (i === 0 ? 'Прихожая' : 'Спальня'), 10.5 + 1.5 * hi, mc('#8793a5', '#ff7b86', hi), 'font-family="Mont" font-weight="600"');
      // плеер (только верхняя строка)
      if (i === 0 && ex > 0.01 && !fresh) {
        const cy = y + 82;
        let pl = L(50, y + 62, 310, y + 62, '#ff4a5c', 1, `opacity="${f1(0.22 * ex)}"`);
        // кнопка
        const bs = btnPop;
        let b = Ci(0, 0, 14, '#d7263d') + Ci(0, 0, 14, 'none', 'stroke="#ff8a96" stroke-opacity=".6" stroke-width="1"');
        b += playing ? R(-4.6, -5.4, 3.2, 10.8, '#fff', 'rx="1"') + R(1.4, -5.4, 3.2, 10.8, '#fff', 'rx="1"') : P('M-3.6 -6 L6 0 L-3.6 6 Z', '#fff');
        pl += `<ellipse cx="62" cy="${f1(cy)}" rx="${f1(26 * bs)}" ry="${f1(26 * bs)}" fill="url(#pl_glowR)" opacity=".7"/>`;
        pl += G(b, `translate(62,${f1(cy)}) scale(${f1(bs)})`);
        // столбики
        const head = prog * NB;
        for (let k = 0; k < NB; k++) {
          const env = Math.pow(Math.sin(Math.PI * (k + 0.5) / NB), 0.55);
          let amp = (0.22 + 0.78 * Math.abs(noise1(k * 0.62 + 3.3))) * env;
          const on = k < head;
          if (on && playing) amp *= 1 + 0.22 * noise1(t * 13 + k * 1.7);
          const bh = Math.max(3, amp * 30);
          const near = on && playing ? clamp(1 - (head - k) / 5) : 0;       // яркая «голова» бегущей волны
          const col = on ? mc('#ff4a5c', '#ffe0e0', near * 0.8) : '#5b6f96';
          pl += R(BX0 + k * BSTEP, cy - bh / 2, 2.7, bh, col, `rx="1.3" opacity="${on ? 1 : f1(0.6)}"`);
        }
        pl += T(310, cy + 4, '0:01', 10.5, '#d6e4fa', 'text-anchor="end" font-family="Plex" font-weight="600"');
        ls += G(pl, '', `opacity="${f1(ex)}"`);
      }
    });
    sc += G(ls, '', 'clip-path="url(#pl_ls)"');
    // шапка
    sc += R(SX0, SY0, SW, HDR - SY0, 'url(#pl_hdr)') + R(SX0, HDR, SW, 12, 'url(#pl_hsh)');
    sc += L(SX0, HDR, SX1, HDR, '#2a3d60', 1, 'opacity=".8"');
    sc += T(52, 40, esc(p.clock ?? '03:04'), 11, '#dfe9fa', 'font-family="Plex" font-weight="600" letter-spacing=".6"');
    sc += R(155, 24, 50, 15, '#02040a', 'rx="7.5"') + Ci(194, 31.5, 2.4, '#0d1626');
    // сигнал, батарея
    [0, 1, 2, 3].forEach(i => { sc += R(264 + i * 4.2, 38 - 3 - i * 2.2, 2.8, 3 + i * 2.2, i < 3 ? '#dfe9fa' : '#4a5c7e', 'rx=".8"'); });
    sc += R(285, 30.5, 19, 9.5, 'none', 'rx="3" stroke="#dfe9fa" stroke-opacity=".7" stroke-width="1"') + R(287, 32.5, 6, 5.5, '#dfe9fa', 'rx="1.5"') + R(305, 33.5, 1.6, 3.5, '#dfe9fa', 'rx=".8" opacity=".6"');
    sc += P('M54 70 L47 76.5 L54 83', 'none', 'stroke="#8fb4ee" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"');
    sc += T(66, 76, 'История запросов', 19, '#f1f6ff', 'font-family="Mont" font-weight="800"');
    sc += T(66, 87, 'Умный дом · сегодня ночью', 8.6, '#5f7396', 'font-family="Mont" font-weight="600"');
    [0, 1, 2].forEach(i => { sc += Ci(300 + i * 0, 62 + i * 6.5, 1.8, '#8fb4ee'); });
    // стекло: блик, лёгкий красный отсвет
    sc += P(`M${SX0} ${SY0} L${SX1} ${SY0} L${SX1} 150 L${SX0} 330 Z`, 'url(#pl_sheen)');
    // Push закрывает только шапку: новая строка остаётся целиком видна ниже y=100.
    if (p.notif) {
      const age = t - (p.notif.t ?? t - u);
      if (age > 0 && age < 2) {
        const k = sstep(0, 0.22, age) * (1 - sstep(1.75, 2, age));
        let push = R(39, 29, 282, 61, '#02050c', 'rx="14" opacity=".7"');
        push += R(39, 25, 282, 61, '#23344f', 'rx="14" stroke="#7899bf" stroke-opacity=".55" stroke-width="1"');
        push += R(49, 40, 28, 28, '#354c6c', 'rx="8"');
        push += P('M54 53 L63 45 L72 53 M56 52 L56 62 L70 62 L70 52 M61 62 L61 56 L65 56 L65 62', 'none', 'stroke="#dcecff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"');
        push += T(87, 48, esc(p.notif.title), 12, '#f1f6ff', 'font-family="Mont" font-weight="800"');
        push += T(87, 68, esc(p.notif.text), 11, '#c6d9ef', 'font-family="Mont" font-weight="500"');
        sc += G(push, `translate(0,${f1(-90 * (1 - k))})`);
      }
    }
    ph += G(sc, '', 'clip-path="url(#pl_sc)"');

    // ---------- держащая рука: большой палец слева, кончики пальцев справа
    ph += `<ellipse cx="60" cy="318" rx="52" ry="68" fill="${cG}" opacity=".16" filter="url(#pl_b16)"/>`;
    ph += `<ellipse cx="46" cy="300" rx="34" ry="46" fill="#010309" opacity=".55" filter="url(#pl_b8)"/>`;     // тень на экране
    ph += G(finger(70, 300, 0.2), 'translate(46,284) rotate(19)');
    [[132, 36], [178, 38], [226, 38], [274, 34]].forEach(([y0, h], i) => {
      ph += `<ellipse cx="318" cy="${y0 + h / 2 + 2}" rx="12" ry="${h * 0.6}" fill="#010309" opacity=".5" filter="url(#pl_b3)"/>`;
      ph += R(322 - i * 1.2, y0, 64, h, 'url(#pl_fr)', `rx="${h / 2}"`) + R(322 - i * 1.2, y0, 64, h, 'url(#pl_frl)', `rx="${h / 2}"`);
      ph += R(323 - i * 1.2, y0 + 0.6, 40, h - 1.2, 'none', `rx="${h / 2 - 0.6}" stroke="${cG2}" stroke-opacity=".35" stroke-width="1"`);
    });
    g += G(ph, `translate(${f1(tx)},${f1(ty)}) rotate(-2 180 250)`);

    // ---------- палец, тянущий список
    if (fAlpha > 0.01) {
      const hov = 1 - press;
      let fg = `<ellipse cx="${f1(fx + 10 + 8 * hov)}" cy="${f1(fy + 22 + 14 * hov)}" rx="${f1(30 + 12 * hov)}" ry="${f1(24 + 8 * hov)}" fill="#010309" opacity="${f1((0.5 - 0.2 * hov) * fAlpha)}" filter="url(#pl_b8)"/>`;
      fg += G(finger(52, 280, 0.28), `translate(${f1(fx)},${f1(fy)}) rotate(-23) scale(${f1(1 + 0.05 * hov)})`, `opacity="${f1(fAlpha)}"`);
      // отсвет экрана вокруг касания
      if (press > 0.01) fg += Ci(fx - 2, fy + 4, 34, 'url(#pl_glowR)', 'opacity="0"');
      g += fg;
    }

    // ---------- пыль в луче экрана, виньетка, зона субтитров
    let dust = '';
    for (let i = 0; i < 22; i++) {
      const x = 20 + hash(i * 3.1 + 1) * 320 + 6 * Math.sin(t * 0.4 + i), y = ((hash(i * 7.7 + 2) * 420 - t * (3 + 4 * hash(i * 2.2))) % 420 + 420) % 420 - 20;
      dust += Ci(x, y, 0.5 + 0.8 * hash(i * 4.4), cG2, `opacity="${f1(0.08 + 0.2 * hash(i * 6.6))}"`);
    }
    g += dust;
    g += R(-20, -20, 400, 700, 'url(#pl_vig)');
    g += R(-20, 330, 400, 50, 'url(#pl_bot)') + R(-20, 373, 400, 300, '#03060c');
    return g;
  };
})();

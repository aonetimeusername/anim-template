// сцены ключа «a»: speaker_close (крупный план динамика), school_ext (фасад школы ночью, замок на двери), endcard (финальный титр)
(() => {
  const f = v => Math.round(v * 100) / 100;
  const frac = x => x - Math.floor(x);

  // ---------------------------------------------------------------- speaker_close
  // уровень «голоса» (0..1) по интервалам звучания, с речевой модуляцией
  function voice(t, pulses) {
    let best = 0;
    for (const [a, b] of pulses) {
      if (t < a || t > b + 0.3) continue;
      const env = lin(t, a, a + 0.06) * (1 - lin(t, b, b + 0.3));
      const mod = 0.5 + 0.5 * Math.abs(noise1(t * 9 + a * 3));
      best = Math.max(best, env * mod);
    }
    return best;
  }
  // волны — скруглённые прямоугольники вокруг корпуса; inward — сжимаются к динамику
  function waves(t, pulses, box, o) {
    const { life = 1.15, gap = 0.27, k1 = 86, col = '#cfd8e6', a = 0.8, inward = false, sw = 1.6 } = o;
    let g = '';
    for (const [a0, b0] of pulses) {
      if (t < a0 || t > b0 + life) continue;
      const n = Math.floor((b0 - a0) / gap);
      for (let k = 0; k <= n; k++) {
        const age = t - (a0 + k * gap);
        if (age < 0 || age > life) continue;
        const ph = age / life;
        const e = inward ? 1 - ph : ph;
        const al = (inward ? Math.pow(ph, 0.8) * (1 - lin(ph, 0.86, 1)) : Math.pow(1 - ph, 1.4) * Math.min(1, ph * 10 + 0.25))
          * a * (0.75 + 0.25 * hash(k + a0));
        const kk = 4 + k1 * e;
        g += R(box.x - kk, box.y - kk, box.w + 2 * kk, box.h + 2 * kk, 'none',
          `rx="${f(10 + kk)}" stroke="${col}" stroke-width="${sw}" opacity="${f(al)}"`);
      }
    }
    return g;
  }

  SCENES.speaker_close = function (u, p, d, t) {
    const ear = !!p.ear, pulses = p.pulse || [];
    const lv = voice(t, pulses);
    const box = { x: 80, y: 132, w: 200, h: 118 };
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const slits = [];
    for (let i = 0; i < 8; i++) slits.push([108, 156 + i * 9.4, 144, 4.6]);
    let g = `<defs>
      <clipPath id="aa_slits">${slits.map(s => `<rect x="${s[0]}" y="${s[1]}" width="${s[2]}" height="${s[3]}" rx="2.3"/>`).join('')}</clipPath>
      <linearGradient id="aa_wf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a14" stop-opacity="0"/><stop offset="1" stop-color="#050a14" stop-opacity="1"/></linearGradient>
    </defs>`;
    // стены и потолок: слева плоская стена, справа угол
    g += R(-20, -20, 400, 680, '#0d172b');
    g += P('M296 62 L380 44 V660 H296 Z', '#091122');
    g += P('M-20 -20 H380 V44 L296 62 H-20 Z', '#070d1b');
    g += L(-20, 62, 296, 62, '#1d2c49', 2) + L(296, 62, 380, 44, '#16233c', 2) + L(296, 62, 296, 660, '#1a2945', 1.6);
    g += R(-20, 66, 316, 3, '#101b32');
    {   // потолочный светильник: мёртвый, изредка коротко моргает
      const burst = hash(Math.floor(t * 1.3) * 3.7 + 1) > 0.76 ? 1 : 0;
      const fk = 0.07 + burst * (noise1(t * 37) > -0.15 ? 0.6 : 0.1);
      g += Ci(74, 34, 96, 'url(#glowC)', `opacity="${f(fk * 0.55)}"`);
      g += R(12, 14, 124, 15, '#0f192e', 'rx="2"') + R(17, 18.5, 114, 6, `rgba(200,222,255,${f(fk)})`, 'rx="3"');
      g += L(30, 4, 30, 14, '#16233c', 1.4) + L(118, 4, 118, 14, '#16233c', 1.4);
    }
    // нижняя «школьная покраска»
    g += R(-20, 322, 316, 400, '#0a1325') + L(-20, 322, 296, 322, '#1b2a47', 2) + P('M296 322 L380 300 V660 H296 Z', '#070e1e') + L(296, 322, 380, 300, '#16233c', 2);
    // лунный свет из окна (слабое мерцание)
    g += P('M-20 70 L170 70 L100 420 L-90 420 Z', '#9fd0ff', `opacity="${f(0.045 + 0.02 * noise1(t * 0.8))}"`);
    g += Ci(95, 110, 170, 'url(#glowC)', `opacity="${f(0.2 + 0.05 * noise1(t * 1.3))}"`);
    // трещина в краске
    g += P('M30 214 l8 10 l-3 12 l9 14 l-4 11', 'none', 'stroke="#16233c" stroke-width="1.2"');
    const gBg = g; g = '';   // дальше — передний план, сдвинут вниз, чтобы плашка раскадровки не касалась корпуса
    // мягкая тень корпуса на стене
    g += R(88, 146, 200, 118, '#03060c', 'rx="10" opacity=".22"') + R(84, 140, 200, 118, '#03060c', 'rx="10" opacity=".25"');
    // пыль в лунном свете
    for (let i = 0; i < 18; i++) {
      const x = (hash(i * 2.3) * 300 + t * (3 + hash(i) * 5)) % 300;
      const y = 78 + (((hash(i * 5.1) * 250 - t * (2 + hash(i * 7) * 5)) % 250) + 250) % 250;
      g += Ci(x, y, 0.5 + hash(i * 9) * 0.8, `rgba(190,215,255,${f(0.16 + 0.2 * (0.5 + 0.5 * noise1(t * 0.9 + i)))})`);
    }
    // кабель: из верхнего угла корпуса в отверстие в стене
    const sway = noise1(t * 0.6) * 0.8 + noise1(t * 40) * 0.6 * lv;
    g += Ci(266, 98, 7, '#04070d') + Ci(266, 98, 7, 'none', 'stroke="#26324b" stroke-width="1.6"');
    g += P(`M254 140 C ${f(252 + sway)} 122, ${f(274 + sway)} 120, 267 99`, 'none', 'stroke="#05080f" stroke-width="3.6" stroke-linecap="round"');
    g += P(`M254 140 C ${f(252 + sway)} 122, ${f(274 + sway)} 120, 267 99`, 'none', 'stroke="#2a3448" stroke-width="0.8" stroke-linecap="round" transform="translate(-0.8 0)"');
    g += R(255, 114, 9, 4, '#2a3448', 'rx="1.5"');
    // кронштейн: пластина на стене у потолка + штанга
    g += R(150, 70, 60, 22, '#1c2840', 'rx="3"') + R(150, 70, 60, 3, '#2d3d5c', 'rx="1.5"');
    for (const sx of [157, 203]) for (const sy of [76, 86]) g += Ci(sx, sy, 2, '#3a4a6a') + L(sx - 1.2, sy, sx + 1.2, sy, '#12192a', 0.8);
    g += R(176, 92, 8, 44, '#2a3448') + L(177.6, 92, 177.6, 136, '#44526c', 1);
    g += R(171, 124, 18, 7, '#3a4660', 'rx="2"');
    // корпус динамика (вибрирует от голоса)
    const vx = noise1(t * 55) * 0.8 * lv, vy = noise1(t * 47 + 9) * 0.55 * lv;
    let b = '';
    b += R(box.x, box.y, box.w, box.h, '#b3bccb', 'rx="9"');
    b += P(`M${box.x} ${box.y + 100} H${box.x + box.w} V${box.y + 109} Q${box.x + box.w} ${box.y + box.h} ${box.x + box.w - 9} ${box.y + box.h} H${box.x + 9} Q${box.x} ${box.y + box.h} ${box.x} ${box.y + 109} Z`, '#97a1b2');
    b += R(box.x + 4, box.y + 3, box.w - 8, 5, '#d7dee9', 'rx="2.5"');
    b += L(box.x, box.y + 100, box.x + box.w, box.y + 100, '#7f8a9d', 1.2);
    // решётка
    b += R(98, 148, 164, 86, '#8e99ab', 'rx="6"') + R(98, 148, 164, 86, 'none', 'rx="6" stroke="#6f7b8f" stroke-width="1"');
    for (const s of slits) b += R(s[0], s[1], s[2], s[3], '#090e18', 'rx="2.3"');
    // свет в прорезях: голос (холодный) / «слушает» (красный, тусклый)
    const earGlow = ear ? 0.28 + 0.12 * Math.sin(t * 3) : 0;
    const inner = Ci(cx, cy + 2, 74 + 10 * lv, ear ? 'url(#glowR)' : 'url(#glowC)', `opacity="${f(ear ? earGlow + lv * 0.5 : lv * 1.0)}"`);
    b += G(inner, '', 'clip-path="url(#aa_slits)"');
    // винты
    for (const [sx, sy] of [[90, 141], [270, 141], [90, 242], [270, 242]]) b += Ci(sx, sy, 2.6, '#7f8a9d') + Ci(sx - 0.5, sy - 0.6, 1, '#cfd8e6');
    // шильдик
    b += R(98, 237.5, 56, 7, '#a2acbc', 'rx="1"') + T(101, 242.7, 'ТРАНСЛЯЦИЯ', 4.6, '#5d697f', 'font-family="Plex" font-weight="600" letter-spacing="0.9"');
    // светодиод «запись»
    const ledX = 252, ledY = 241;
    let on = 0;
    if (ear) on = lin(u, 0.22, 0.28) * (0.85 + 0.15 * Math.sin(t * 5));
    else {
      const lastEnd = pulses.length ? Math.max(...pulses.map(q => q[1])) : 1e9;
      if (t > lastEnd + 0.08 && t < lastEnd + 0.2) on = 0.5;
    }
    b += Ci(ledX, ledY, 4.2, '#59616f') + Ci(ledX, ledY, 3.2, on > 0 ? '#ff3b3b' : '#2a1519', on > 0 ? `opacity="${f(0.35 + 0.65 * on)}"` : '');
    if (ear) b += T(ledX - 7, ledY + 2.2, 'REC', 5.8, '#c42b2b', `text-anchor="end" font-family="Plex" font-weight="600" letter-spacing="0.8" opacity="${f(on)}"`);
    g += G(b, `translate(${f(vx)},${f(vy)})`);
    // красное свечение светодиода на корпусе и стене
    if (on > 0) {
      const burst = ear ? 1 + 1.4 * (1 - lin(u, 0.22, 0.55)) * (u > 0.22 ? 1 : 0) : 0.6;
      g += Ci(ledX, ledY, 46 * burst, 'url(#glowR)', `opacity="${f(0.8 * on)}"`);
      g += Ci(ledX, ledY, 120, 'url(#glowR)', `opacity="${f(0.22 * on)}"`);
    }
    // волны
    const wbox = { x: box.x + vx, y: box.y + vy, w: box.w, h: box.h };
    if (!ear) {
      g += waves(t, pulses, wbox, { col: '#cfd8e6', a: 0.7, inward: false });
    } else {
      g += waves(t, pulses, wbox, { col: '#ff4a4a', a: 0.95, inward: true, life: 1.0, gap: 0.24, sw: 1.8 });
      // «слушающий» фон: редкие слабые красные волны внутрь, всегда
      const idle = lin(u, 0.28, 0.6);
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.55 + i / 3) % 1, kk = 4 + 86 * (1 - ph);
        g += R(box.x - kk, box.y - kk, box.w + 2 * kk, box.h + 2 * kk, 'none',
          `rx="${f(10 + kk)}" stroke="#ff4a4a" stroke-width="1.2" opacity="${f(0.2 * idle * Math.pow(ph, 0.8) * (1 - lin(ph, 0.86, 1)))}"`);
      }
    }
    g = gBg + G(g, 'translate(0,10)');
    // нижняя зона субтитров — тёмная
    g += R(-20, 316, 400, 110, 'url(#aa_wf)') + R(-20, 424, 400, 260, '#050a14');
    return g;
  };

  // ---------------------------------------------------------------- school_ext
  // светящееся окно-мерцание не нужно: окна тёмные, только блики
  function chainPts(prog) {
    // три прядки цепи вокруг двух ручек; возвращает звенья до доли prog
    const strands = [
      [[169, 310], [180, 319], [191, 311]],
      [[191, 320], [180, 330], [169, 321]],
      [[169, 329], [180, 338], [191, 330]],
    ];
    const per = 6, total = strands.length * per;
    let g = '';
    for (let s = 0; s < strands.length; s++) {
      const [a, c, b] = strands[s];
      for (let k = 0; k < per; k++) {
        const idx = s * per + k;
        if ((idx + 0.5) / total > prog) continue;
        const e = (k + 0.5) / per;
        const x = (1 - e) * (1 - e) * a[0] + 2 * (1 - e) * e * c[0] + e * e * b[0];
        const y = (1 - e) * (1 - e) * a[1] + 2 * (1 - e) * e * c[1] + e * e * b[1];
        const dx = 2 * (1 - e) * (c[0] - a[0]) + 2 * e * (b[0] - c[0]);
        const dy = 2 * (1 - e) * (c[1] - a[1]) + 2 * e * (b[1] - c[1]);
        const ang = Math.atan2(dy, dx) * 180 / Math.PI;
        const inner = (idx % 2 === 0)
          ? `<ellipse cx="0" cy="0" rx="3.1" ry="2" fill="none" stroke="#b6bfcc" stroke-width="1.3"/>`
          : R(-2.6, -0.8, 5.2, 1.6, '#8d97a8', 'rx="0.8"');
        g += G(inner, `translate(${f(x)},${f(y)}) rotate(${f(ang)})`);
      }
    }
    return g;
  }

  function padlock(open) {
    // центр шарнира в (0,0), тело ниже
    let g = '';
    const lift = open * 4.5;
    g += P(`M-4 0 V-6 Q-4 -12 0 -12 Q4 -12 4 -6 V${f(-lift)}`, 'none', 'stroke="#c3cad6" stroke-width="2.3" stroke-linecap="round"');
    g += R(-7.5, 0, 15, 12.5, '#c9a24a', 'rx="2.6"') + R(-7.5, 7.2, 15, 5.3, '#a98530', 'rx="2.6"') + R(-7.5, 7.2, 15, 2, '#a98530');
    g += R(-5.5, 1.6, 11, 1.6, '#e8cf86', 'rx="0.8" opacity=".75"');
    g += Ci(0, 5.4, 1.5, '#2a1f08') + R(-0.5, 5.4, 1, 3.6, '#2a1f08');
    return g;
  }

  function window3(x, y, w, h, i, t) {
    let g = R(x - 2, y - 2, w + 4, h + 4, '#18243d') + R(x, y, w, h, '#050a16');
    g += L(x + w / 2, y, x + w / 2, y + h, '#18243d', 1.6) + L(x, y + h * 0.45, x + w, y + h * 0.45, '#18243d', 1.6);
    const gl = 0.035 + 0.05 * Math.max(0, noise1(t * 0.55 + i * 3.1));
    g += P(`M${x + 2} ${y + h} L${x + w * 0.55} ${y} L${x + w * 0.85} ${y} L${x + w * 0.3} ${y + h} Z`, '#9fd0ff', `opacity="${f(gl)}"`);
    g += R(x - 3, y + h + 2, w + 6, 3, '#22314d') + R(x - 3, y + h + 0.2, w + 6, 2.2, '#cfd8e6', 'opacity=".55" rx="1"');
    return g;
  }

  // p.tLock — абс. время щелчка замка (−100 = цепь и замок уже висят); p.clock 'ЧЧ:ММ' — стрелки часов (по умолчанию 18:00);
  // p.label:false — без таблички «18:00»; p.walkers — уходящие силуэты (по умолчанию: есть, если не задан clock)
  SCENES.school_ext = function (u, p, d, t) {
    const TL = p.tLock ?? 9.937;
    const dt = t - TL;
    const kick = dt > 0 && dt < 0.4 ? Math.abs(Math.sin(dt * 26)) * (1 - dt / 0.4) : 0;
    const fl = 1 + 0.07 * noise1(t * 7) + 0.04 * noise1(t * 19) - 0.38 * kick;
    let g = `<defs>
      <linearGradient id="aa_haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14224a" stop-opacity="0"/><stop offset="1" stop-color="#1c2f58" stop-opacity=".55"/></linearGradient>
      <linearGradient id="aa_gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03060d" stop-opacity="0"/><stop offset="1" stop-color="#03060d" stop-opacity="1"/></linearGradient>
      <linearGradient id="aa_cb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe0ff" stop-opacity=".22"/><stop offset="1" stop-color="#bfe0ff" stop-opacity="0"/></linearGradient>
      <linearGradient id="aa_wb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe0a0" stop-opacity=".5"/><stop offset="1" stop-color="#ffe0a0" stop-opacity="0"/></linearGradient>
      <linearGradient id="aa_dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
      <clipPath id="aa_cone"><path d="M176 272 L184 272 L276 372 L84 372 Z"/></clipPath>
    </defs>`;
    g += R(-20, -20, 400, 680, '#050b18');
    g += R(0, 100, 360, 270, 'url(#aa_haze)');
    g += G(snow(0, 0, 360, 372, t, 60, 3, 26, 0.35));
    // ---- здание
    g += R(20, 96, 320, 5, '#cfd8e6', 'opacity=".5" rx="2"');
    g += R(22, 100, 316, 250, '#0d1830');
    g += R(22, 100, 316, 8, '#0a1324');
    g += R(22, 342, 316, 8, '#0a1324');
    for (const ly of [166, 226]) g += L(22, ly, 338, ly, '#14213a', 3);
    // центральный объём и фронтон
    g += R(112, 100, 136, 250, '#101c34');
    g += P('M106 102 L180 76 L254 102 Z', '#101c34');
    g += P('M106 102 L180 76 L254 102', 'none', 'stroke="#cfd8e6" stroke-width="2" opacity=".35"');
    // окна по бокам
    let wi = 0;
    for (const row of [116, 176, 236]) {
      for (const x of [29.5, 57, 84.5, 255.5, 283, 310.5]) g += window3(x, row, 20, 36, wi++, t);
    }
    // центр: широкое окно 2-го этажа и часы
    g += window3(150, 176, 60, 36, wi++, t);
    // часы: по умолчанию 18:00 (минутная вверх, часовая вниз); p.clock 'ЧЧ:ММ' — стрелки на это время. Красная секундная идёт рывками
    {
      const n = Math.floor(t), ang = mix((n - 1) * 6, n * 6, eout(lin(t - n, 0, 0.14)));
      g += Ci(180, 134, 18.5, '#16233b') + Ci(180, 134, 16, '#5f6c85');
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g += L(180 + Math.sin(a) * 12.4, 134 - Math.cos(a) * 12.4, 180 + Math.sin(a) * 14.6, 134 - Math.cos(a) * 14.6, '#d9dfea', i % 3 ? 0.8 : 1.5); }
      if (p.clock == null) g += L(180, 134, 180, 123.5, '#0b1220', 1.7, 'stroke-linecap="round"') + L(180, 134, 180, 140, '#0b1220', 2.2, 'stroke-linecap="round"');
      else {
        const [hh, mm] = String(p.clock).split(':').map(Number);
        const am = (mm || 0) * 6 * Math.PI / 180, ah = ((hh % 12) + (mm || 0) / 60) * 30 * Math.PI / 180;
        g += L(180, 134, 180 + Math.sin(am) * 10.5, 134 - Math.cos(am) * 10.5, '#0b1220', 1.7, 'stroke-linecap="round"');
        g += L(180, 134, 180 + Math.sin(ah) * 6.8, 134 - Math.cos(ah) * 6.8, '#0b1220', 2.2, 'stroke-linecap="round"');
      }
      g += L(180, 134, 180 + Math.sin(ang * Math.PI / 180) * 13, 134 - Math.cos(ang * Math.PI / 180) * 13, '#d7263d', 0.9) + Ci(180, 134, 1.6, '#d7263d');
    }
    // ---- крыльцо: колонны, козырёк, дверь
    g += R(124, 262, 7, 88, '#16233b') + R(229, 262, 7, 88, '#16233b');
    g += R(112, 256, 136, 9, '#0a1324') + R(110, 252.5, 140, 4.5, '#cfd8e6', 'opacity=".55" rx="2"') + R(112, 265, 136, 2, '#2a3550');
    // дверь (двустворчатая) + замок. дрожь от удара
    const shake = dt > 0 ? Math.sin(dt * 60) * 1.0 * Math.exp(-dt * 16) : 0;
    let dr = '';
    dr += R(140, 272, 80, 78, '#1a2438') + R(144, 276, 72, 74, '#03060c');
    for (const lx of [144, 180]) {
      dr += R(lx, 276, 36, 74, C.door);
      dr += R(lx + 5, 281, 26, 28, '#050a16') + L(lx + 18, 281, lx + 18, 309, '#2a1c10', 1.6) + L(lx + 5, 295, lx + 31, 295, '#2a1c10', 1.2);
      dr += P(`M${lx + 7} 309 L${lx + 20} 281 L${lx + 27} 281 L${lx + 16} 309 Z`, '#9fd0ff', 'opacity=".05"');
      dr += R(lx + 5, 316, 26, 28, C.door2, 'opacity=".55"');
    }
    dr += R(179, 276, 2, 74, C.door3);
    dr += R(144, 276, 72, 74, 'url(#aa_dg)');
    // ручки-скобы
    dr += R(167.4, 303, 3.6, 34, C.metal, 'rx="1.8"') + R(189, 303, 3.6, 34, C.metal, 'rx="1.8"') + R(168, 304, 1, 32, '#e6ebf2', 'opacity=".5"') + R(189.6, 304, 1, 32, '#e6ebf2', 'opacity=".5"');
    // цепь и замок в момент tLock
    const chainP = ease(lin(t, TL - 0.22, TL - 0.06));
    if (chainP > 0) dr += chainPts(chainP);
    if (t > TL - 0.12) {
      const drop = (1 - ein(lin(t, TL - 0.12, TL))) * -11;
      const open = 1 - lin(t, TL - 0.005, TL + 0.03);
      const ang = dt > 0 ? 15 * Math.exp(-dt * 5) * Math.sin(dt * 21) : 0;
      dr += G(G(padlock(open), `rotate(${f(ang)})`), `translate(180,${f(330 + drop)})`);
    }
    // вспышка «щелчка»
    if (dt > 0 && dt < 0.5) {
      const k = lin(dt, 0, 0.5);
      dr += Ci(180, 336, 30 * (1 - k * 0.4), 'url(#glowW)', `opacity="${f(0.95 * (1 - k))}"`);
      dr += rings(180, 336, dt, { n: 2, r0: 4, r1: 30, col: '#ffe9a8', speed: 2.0, a: 0.9 * (1 - k), w: 1.4 });
      const s = 7 * (1 - k) * (dt < 0.1 ? 1.4 : 1);
      dr += P(`M180 ${336 - s * 1.8} L${180 + s * 0.35} ${336 - s * 0.35} L${180 + s * 1.8} 336 L${180 + s * 0.35} ${336 + s * 0.35} L180 ${336 + s * 1.8} L${180 - s * 0.35} ${336 + s * 0.35} L${180 - s * 1.8} 336 L${180 - s * 0.35} ${336 - s * 0.35} Z`, '#fff4cf', `opacity="${f(1 - k)}"`);
    }
    g += G(dr, `translate(${f(shake)},0)`);
    // ступени
    g += R(138, 350, 84, 5, '#1d2b48') + R(132, 355, 96, 5, '#17233c') + R(126, 360, 108, 5, '#111b30');
    for (const [x, w, y] of [[138, 84, 350], [132, 96, 355], [126, 108, 360]]) g += R(x, y, w, 1.6, '#cfd8e6', 'opacity=".4"');
    // табличка 18:00 у двери (появляется на абс. 8.75 с — тайминг ч.1); p.label:false — без таблички
    if (p.label !== false) {
      const aLab = lin(t, 8.75, 9.0);
      g += R(251, 294, 40, 15, '#0a1322', `rx="2" opacity="${f(aLab)}"`) + R(251, 294, 40, 15, 'none', `rx="2" stroke="#22314d" stroke-width="1" opacity="${f(aLab)}"`);
      g += T(271, 304.6, `18<tspan opacity="${Math.floor(t * 1.2) % 2 === 0 ? 1 : 0.2}">:</tspan>00`, 8, '#9fb0c8', `text-anchor="middle" font-family="Plex" font-weight="600" letter-spacing="1" opacity="${f(aLab)}"`);
    }
    // ---- сугробы и забор
    g += P('M-10 352 C 30 336 70 346 112 351 L 250 351 C 290 342 330 336 370 352 V 430 H-10 Z', '#1a2843');
    g += P('M-10 352 C 30 336 70 346 112 351', 'none', 'stroke="#cfd8e6" stroke-width="1.4" opacity=".28"') + P('M250 351 C 290 342 330 336 370 352', 'none', 'stroke="#cfd8e6" stroke-width="1.4" opacity=".28"');
    g += P('M-10 364 C 40 352 80 361 124 365 L 236 365 C 280 359 320 352 370 364 V 430 H-10 Z', '#233352');
    g += P('M-10 364 C 40 352 80 361 124 365', 'none', 'stroke="#cfd8e6" stroke-width="1.4" opacity=".3"') + P('M236 365 C 280 359 320 352 370 364', 'none', 'stroke="#cfd8e6" stroke-width="1.4" opacity=".3"');
    // забор с проёмом перед крыльцом
    let fence = '';
    for (let x = -4; x < 364; x += 8) {
      if (x > 128 && x < 232) continue;
      fence += R(x, 354, 1.9, 22, '#080f1e') + P(`M${x - 0.7} 354 L${x + 0.95} 350.5 L${x + 2.6} 354 Z`, '#080f1e');
    }
    for (const [a, b] of [[-10, 130], [232, 370]]) fence += R(a, 361, b - a, 2, '#080f1e') + R(a, 371, b - a, 2, '#080f1e');
    for (const x of [124, 232]) fence += R(x, 345, 8, 31, '#0f1a30') + R(x - 2, 341.5, 12, 4.5, '#cfd8e6', 'opacity=".5" rx="1.5"');
    g += fence;
    // холодный уличный фонарь справа (декор)
    {
      const fl2 = 1 + 0.05 * noise1(t * 5 + 4);
      g += P('M290 242 L328 242 L350 372 L266 372 Z', 'url(#aa_cb)', 'opacity=".3"');
      g += P('M296 242 L322 242 L338 372 L280 372 Z', 'url(#aa_cb)', 'opacity=".3"');
      g += P('M303 242 L315 242 L326 372 L292 372 Z', 'url(#aa_cb)', 'opacity=".35"');
      g += R(335, 238, 2.8, 140, '#070c19') + P('M338 238 Q338 228 326 228 L318 228', 'none', 'stroke="#070c19" stroke-width="2.6"');
      g += P('M312 229 H326 L323 234 H315 Z', '#0d1830') + Ci(319, 235, 2.6, '#cfe6ff');
      g += Ci(319, 238, 46 * fl2, 'url(#glowC)', 'opacity=".75"');
    }
    // уходящие силуэты (p.walkers; по умолчанию есть, а с p.clock — нет: поздно, школа пустая)
    if (p.walkers ?? p.clock == null) for (const [x0, x1, st] of [[70, -22, 0.0], [102, -22, 0.15]]) {
      const x = mix(x0, x1, lin(u, st, st + 1.75));
      if (x > -16) g += person({ x, y: 372, h: 24, face: -1, pose: 'walk', t: u + st * 3, sil: true });
    }
    // тёплый фонарь над дверью: лампа, конус, снег в конусе
    g += P('M176 272 L184 272 L276 372 L84 372 Z', 'url(#aa_wb)', `opacity="${f(0.55 * fl)}"`);
    {
      let warm = '';
      const n = 34;
      for (let i = 0; i < n; i++) {
        const sp = 24 + hash(i * 3.3 + 21) * 30, r = 0.7 + hash(i * 7.1 + 21) * 1.0;
        const yy = (hash(i * 1.9 + 21) * 100 + t * sp) % 100, xx = ((hash(i * 5.7 + 21) * 200 + t * 40 + Math.sin(t * 1.3 + i) * 4) % 200 + 200) % 200;
        warm += Ci(80 + xx, 272 + yy, r, `rgba(255,236,190,${f(0.55 + 0.4 * hash(i * 9.9 + 21))})`);
      }
      g += G(warm, '', 'clip-path="url(#aa_cone)"');
    }
    g += R(177, 265, 6, 3, '#2a3448') + P('M173 273 L187 273 L184.5 268 L175.5 268 Z', '#ffe9b0');
    g += Ci(180, 276, 72 * fl, 'url(#glowW)', `opacity="${f(0.95 * Math.min(1, fl))}"`);
    // ---- метель: ближний слой крупных хлопьев и порывы ветра
    {
      let fg = '';
      for (let i = 0; i < 22; i++) {
        const sp = 60 + hash(i * 3.7 + 9) * 60, r = 1.3 + hash(i * 6.1 + 9) * 1.6;
        const yy = (hash(i * 1.1 + 9) * 400 + t * sp) % 400, xx = (((hash(i * 4.3 + 9) * 380 + t * 70 + Math.sin(t * 1.7 + i) * 8) % 380) + 380) % 380 - 10;
        fg += Ci(xx, yy, r, `rgba(225,234,248,${f(0.28 + 0.3 * hash(i * 8.8 + 9))})`);
      }
      g += fg;
      g += snow(0, 0, 360, 392, t, 70, 11, 48, 0.8);
      for (let i = 0; i < 9; i++) {
        const y = 40 + i * 38 + hash(i) * 10, x = (((t * (120 + hash(i) * 60) + i * 97) % 460) - 70);
        g += L(x, y, x + 34, y + 5, 'rgba(220,230,245,.07)', 1);
      }
    }
    // землю за кадром (зона субтитров) — тёмной
    g += R(-20, 366, 400, 52, 'url(#aa_gf)') + R(-20, 416, 400, 260, '#03060d');
    return g;
  };

  // ---------------------------------------------------------------- endcard
  function wrapLines(text) {
    const toks = text.toUpperCase().split(/\s+/).filter(Boolean);
    const units = [];
    for (let i = 0; i < toks.length; i++) {
      let w = toks[i];
      while (w.replace(/[^А-ЯЁA-Z0-9]/gi, '').length <= 2 && i + 1 < toks.length) w += ' ' + toks[++i];
      units.push(w);
    }
    const lines = [];
    let cur = '';
    for (const w of units) {
      if (cur && (cur + ' ' + w).length > 12) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  SCENES.endcard = function (u, p, d, t) {
    const sub = p.sub || '', lines = wrapLines(p.text || '');
    const FS = 28, LH = 33;
    const n = lines.length;
    const y0 = 300 - ((n - 1) / 2) * LH + 8;     // базовая линия первой строки
    const subY = y0 - 44;
    const prog = lin(u, 0.05, 0.55);
    const alpha = ease(prog), dy = (1 - eout(prog)) * 14;
    // глитч в первые ~0.5 с
    const k = Math.floor(u * 30);
    const gl = (u > 0.2 && u < 0.62 && hash(k * 3.1 + 1) > 0.35) ? 1 : 0;
    const gdx = gl * (3 + hash(k * 1.3) * 5) * (hash(k * 7.7) > 0.5 ? 1 : -1);
    const bandY = 230 + hash(k * 2.9) * 130, bandH = 14 + hash(k * 4.1) * 28, bandDx = gl * (hash(k * 5.3) - 0.5) * 26;
    const textBlock = (col) => {
      let s = '';
      if (sub) s += T(180, subY, sub, 32, col || '#ffcf2e', 'text-anchor="middle" font-family="Hand" font-weight="700"');
      lines.forEach((ln, i) => {
        const words = ln.split(' ');
        const spans = words.map(w => `<tspan fill="${col || (/^ДИНАМИК/.test(w) ? '#ff3b3b' : '#ffffff')}">${w}</tspan>`).join(' ');
        s += `<text x="180" y="${f(y0 + i * LH)}" font-size="${FS}" text-anchor="middle" font-family="Mont" font-weight="900" letter-spacing="-0.3">${spans}</text>`;
      });
      return s;
    };
    let g = `<defs><clipPath id="aa_band"><rect x="-20" y="${f(bandY)}" width="400" height="${f(bandH)}"/></clipPath></defs>`;
    g += R(-20, -20, 400, 680, '#020307');
    g += Ci(180, 80, 150, 'url(#glowC)', `opacity="${f(0.1 + 0.03 * noise1(t * 1.1))}"`);
    // призрак снятого динамика: чистое пятно на стене
    g += R(92, 58, 176, 112, '#ffffff', 'rx="8" opacity=".035"') + R(92, 58, 176, 112, 'none', 'rx="8" stroke="#9fb0c8" stroke-width="1" stroke-dasharray="3 5" opacity=".16"');
    // пыль
    for (let i = 0; i < 14; i++) {
      const x = (hash(i * 2.3 + 5) * 360 + t * (2 + hash(i) * 3)) % 360;
      const y = ((hash(i * 5.1 + 5) * 330 - t * (2 + hash(i * 7) * 4)) % 330 + 330) % 330;
      g += Ci(x, y, 0.5 + hash(i * 9) * 0.6, `rgba(190,215,255,${f(0.1 + 0.15 * (0.5 + 0.5 * noise1(t * 0.8 + i)))})`);
    }
    // кронштейн (чуть покачивается)
    const swing = 0.5 * Math.sin(t * 1.3) + 0.3 * noise1(t * 0.9);
    let br = '';
    br += R(150, -4, 60, 22, '#1c2840', 'rx="3"') + R(150, 15, 60, 3, '#0e1626');
    for (const sx of [158, 202]) br += Ci(sx, 8, 2, '#3a4a6a');
    br += R(176, 18, 8, 28, '#2a3448') + L(177.6, 18, 177.6, 46, '#44526c', 1);
    br += R(138, 44, 84, 8, '#2a3448', 'rx="2"') + R(138, 44, 84, 2, '#44526c', 'rx="1"');
    br += P('M142 52 V76 Q142 92 158 92 H202 Q218 92 218 76 V52', 'none', 'stroke="#2a3448" stroke-width="6" stroke-linejoin="round"');
    br += P('M142 52 V76 Q142 92 158 92', 'none', 'stroke="#44526c" stroke-width="1.2" opacity=".7"');
    for (const bx of [142, 218]) br += Ci(bx, 62, 3.4, '#44526c') + Ci(bx, 62, 1.4, '#12192a');
    br += R(172, 52, 16, 7, '#3a4660', 'rx="2"');         // сальник кабеля
    // провода: свисают из сальника, покачиваются
    const wires = [
      { col: '#c8283a', len: 92, dx: -16, ph: 0.0, tip: '#e8c068' },
      { col: '#8fa0bc', len: 76, dx: 1, ph: 1.7, tip: '#e8c068' },
      { col: '#c9a24a', len: 104, dx: 17, ph: 3.1, tip: '#f0d28a' },
    ];
    for (const w of wires) {
      const N = 14;
      let d2 = '';
      let ex = 0, ey = 0;
      for (let i = 0; i <= N; i++) {
        const s = i / N;
        const x = 180 + w.dx * s + (noise1(t * 0.8 + w.ph) * 9 + Math.sin(t * 1.9 + w.ph) * 3.5) * Math.pow(s, 1.5);
        const y = 59 + w.len * s * (1 - 0.04 * Math.abs(Math.sin(t * 1.9 + w.ph)) * s);
        d2 += (i ? ' L' : 'M') + f(x) + ' ' + f(y);
        ex = x; ey = y;
      }
      br += P(d2, 'none', `stroke="${w.col}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`);
      br += L(ex, ey, ex + 2.4, ey + 5, w.tip, 1.2, 'stroke-linecap="round"') + L(ex, ey, ex - 2.2, ey + 4.6, w.tip, 1.2, 'stroke-linecap="round"') + L(ex, ey, ex + 0.2, ey + 6, w.tip, 1.2, 'stroke-linecap="round"');
    }
    g += G(G(br, `rotate(${f(swing)} 180 8)`), 'translate(180 0) scale(1.22) translate(-180 0)', 'opacity=".95"');
    // текст: появление + глитч
    const tb = textBlock();
    if (gl) {
      g += G(textBlock('#ff1f4a'), `translate(${f(gdx)},${f(dy)})`, `style="mix-blend-mode:screen" opacity="${f(0.7 * alpha)}"`);
      g += G(textBlock('#18e6ff'), `translate(${f(-gdx)},${f(dy)})`, `style="mix-blend-mode:screen" opacity="${f(0.7 * alpha)}"`);
    }
    g += G(tb, `translate(0,${f(dy)})`, `opacity="${f(alpha)}"`);
    if (gl) {
      g += G(G(tb, `translate(${f(bandDx)},${f(dy)})`), '', `clip-path="url(#aa_band)" opacity="${f(alpha)}"`);
      g += R(-20, bandY + bandH * 0.4, 400, 1.2, '#ffffff', `opacity="${f(0.25 * alpha)}"`);
    }
    return g;
  };
})();

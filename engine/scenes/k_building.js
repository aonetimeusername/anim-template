// building — 12 этажей, 6 колонн; col=1..6 слева направо, floor=1..12 снизу.
// you:[col,floor]; climb:[t0,t1,f0,f1]; off:t — все времена абсолютные.
// Центр you: X=110+37*(col-1), Y=60+21.5*(12-floor).
// Камера Z=2.2, целевая точка экрана (180,190), без x/y-сдвигов:
// ox=2.2*(X-180)/1.2; oy=(2.2*Y-190)/1.2-320.
// Для you:[3,9]: {z0:2.2,z1:2.2,ox:7.333333,oy:-250.083333}.
// Общий план: {z0:1,z1:1.05}. Встроенное дыхание камеры даёт ±1.6 px.
(() => {
  const RED = '#ff3030';
  const pos = (col, floor) => [110 + 37 * (col - 1), 60 + 21.5 * (12 - floor)];
  const bound = (v, a, b) => Math.round(clamp(Number(v) || a, a, b));
  const warmSeed = [[1, 11], [5, 10], [2, 8], [6, 6], [3, 4], [1, 2], [4, 7]];

  SCENES.building = function (u, p, d, t) {
    p = p || {};
    const you = Array.isArray(p.you) ? [bound(p.you[0], 1, 6), bound(p.you[1], 1, 12)] : null;
    const isYou = (c, f) => you && c === you[0] && f === you[1];
    const warm = warmSeed.filter(([c, f]) => !isYou(c, f)).slice(0, 6);
    const climb = Array.isArray(p.climb) ? p.climb : null;
    const f0 = climb ? bound(climb[2], 1, 12) : 1;
    const f1 = climb ? Math.max(f0, bound(climb[3], 1, 12)) : 1;
    const start = climb ? Number(climb[0]) : Infinity;
    const end = climb ? Math.max(start, Number(climb[1])) : Infinity;
    const arrival = f => f1 === f0 ? start : start + (end - start) * (f - f0) / (f1 - f0);
    // Каждый предыдущий свет держится ещё 0.4 с после следующего включения.
    const stairOn = (f, at) => climb && f >= f0 && f <= f1 && at >= arrival(f) &&
      (f === f1 || at < arrival(f + 1) + 0.4);
    const off = Number.isFinite(p.off) ? p.off : Infinity;
    // Снимок горящих окон при off: никакого состояния между вызовами/кадрами.
    const extinguish = warm.map(([c, f]) => ({id: `w${c}_${f}`, seed: c * 17 + f * 9}));
    for (let f = 1; f <= 12; f++) {
      if (Number.isFinite(off) && stairOn(f, off)) extinguish.push({id: `s${f}`, seed: 300 + f * 13});
    }
    extinguish.sort((a, b) => hash(a.seed) - hash(b.seed) || a.seed - b.seed);
    const visible = id => {
      if (t < off) return true;
      const i = extinguish.findIndex(w => w.id === id);
      return i >= 0 && t < off + 1.5 * (i + 1) / extinguish.length;
    };

    let g = `<defs>
      <linearGradient id="bld_sky" x2="0" y2="1"><stop stop-color="#050916"/><stop offset="1" stop-color="#17243a"/></linearGradient>
      <linearGradient id="bld_wall" x2="1" y2="0"><stop stop-color="#26344a"/><stop offset=".5" stop-color="#2e3d53"/><stop offset="1" stop-color="#1c293d"/></linearGradient>
      <linearGradient id="bld_bottom" x2="0" y2="1"><stop stop-color="#03060c" stop-opacity="0"/><stop offset="1" stop-color="#03060c"/></linearGradient>
    </defs>`;
    g += R(-220, -400, 800, 1100, '#03060c') + R(-40, -100, 440, 475, 'url(#bld_sky)');
    // Дальние крыши: не спорят с главным домом.
    g += P('M-30 277 H8 V253 H30 V268 H48 V342 H-30 Z M322 269 H347 V248 H375 V334 H322 Z', '#0a1220');
    g += P('M42 43 L58 35 L58 324 L42 332 Z', '#152135');
    g += P('M58 35 L320 35 L326 327 L52 327 Z', 'url(#bld_wall)');
    // Парапет, снег, две короткие вентиляционные шахты.
    g += R(98, 25, 13, 10, '#1b293e') + R(264, 28, 17, 7, '#1b293e');
    g += P('M55 34 L321 34 L323 39 L54 39 Z', '#52627a');
    g += L(56, 34, 320, 34, '#a6b3c6', 1.3, 'opacity=".65"');
    // Узкая лестничная клетка отделена от квартир глухим швом.
    g += R(60, 42, 24, 275, '#1a293e') + L(88, 40, 88, 321, '#101b2d', 1.4);
    for (let f = 1; f <= 12; f++) {
      const y = pos(1, f)[1];
      g += L(54, y + 12.5, 325, y + 12.5, '#142136', 1);
      g += L(55, y + 13.5, 325, y + 13.5, '#42516a', 0.6, 'opacity=".38"');
    }
    for (let c = 0; c <= 6; c++) {
      const x = 91.5 + c * 37;
      g += L(x, 41, x, 324, '#18263b', 0.8);
    }
    // Окна: свет внутри проёма, тонкий переплёт, холодный бетон подоконника.
    for (let f = 1; f <= 12; f++) {
      const y = pos(1, f)[1];
      const on = stairOn(f, t) && visible(`s${f}`);
      if (on) g += Ci(72, y, 18, 'url(#glowW)', 'opacity=".48"');
      g += R(65, y - 7.5, 14, 15, '#0a1323');
      g += R(66, y - 6.5, 12, 13, on ? '#edbd7b' : '#101d30');
      g += L(66, y + 0.5, 78, y + 0.5, on ? '#705e4b' : '#24314a', 0.8);
      g += L(64, y + 8, 80, y + 8, '#516079', 0.9);
      for (let c = 1; c <= 6; c++) {
        const x = pos(c, f)[0], mine = isYou(c, f);
        const lit = warm.some(w => w[0] === c && w[1] === f) && visible(`w${c}_${f}`);
        if (mine || lit) g += Ci(x, y, mine ? 22 : 16, mine ? 'url(#glowC)' : 'url(#glowW)', `opacity="${mine ? '.65' : '.3'}"`);
        g += R(x - 10, y - 8, 20, 16, '#111a29');
        g += R(x - 8.5, y - 6.5, 17, 13, mine ? '#9fd0ff' : lit ? '#d4a666' : '#0b1423');
        if (lit) {
          g += R(x - 8.5, y - 6.5, 4, 13, '#9b754b', 'opacity=".7"');
          g += R(x + 5, y - 6.5, 3.5, 13, '#6b5745', 'opacity=".65"');
        }
        if (mine) {
          // Человек у экрана: голова и плечи читаются в крупном плане.
          g += Ci(x + 3.3, y - 1.9, 2.1, '#111b2c');
          g += P(`M${x - .1} ${y + 6.5} L${x + .5} ${y + 2} Q${x + 3} ${y} ${x + 5.7} ${y + 2} L${x + 7} ${y + 6.5} Z`, '#111b2c');
          g += R(x - 6.3, y + 1.4, 4.8, 3.6, '#e1f0ff') + R(x - 7, y + 5.2, 8, 1, '#344a65');
        }
        g += L(x - 1, y - 6.5, x - 1, y + 6.5, '#34455b', 1);
        g += L(x - 11, y + 8, x + 11, y + 8, '#69788e', 1, 'opacity=".75"');
      }
    }
    // Цоколь и подъезд под вертикалью лестницы.
    g += R(52, 310, 274, 19, '#182338') + R(64, 314, 17, 29, '#080f1d');
    g += R(67, 317, 11, 24, '#273448') + L(76, 323, 76, 334, '#8694a6', 1);
    g += P('M57 309 L86 309 L94 315 L52 315 Z', '#43516a') + R(52, 315, 42, 3, '#111a2a');
    g += L(56, 309, 85, 309, '#a9b4c6', 1.4);
    g += P('M69 318 L76 318 L99 348 L48 348 Z', '#f3b85a', 'opacity=".08"');
    g += Ci(72, 319, 24, 'url(#glowW)', 'opacity=".65"') + R(69, 318, 6, 1.8, '#ffe0a0');
    g += P('M-30 348 Q17 330 52 341 L61 345 L83 345 Q122 336 156 343 Q224 334 268 344 Q322 335 390 348 V380 H-30 Z', '#3d4d65');
    g += P('M66 343 H82 L140 378 H24 Z', '#152033');
    g += L(63, 343, 85, 343, '#718099', 1.3);
    // Голые деревья по краям; ни одно не закрывает окна you.
    const tree = (x, flip) => G(P('M0 361 L2 292 L-3 264 L-12 247 M2 292 L15 270 L22 245 M-3 264 L-2 238 M15 270 L31 264 M1 320 L-16 295 L-24 279 M-16 295 L-31 293', 'none', 'stroke="#080f1c" stroke-width="2.4" stroke-linecap="round"') + L(1, 355, 2, 299, '#080f1c', 4), `translate(${x} 0) scale(${flip} 1)`);
    g += tree(24, 1) + tree(347, -1);
    // Красный захват поверх фасада; плашка не перекрывает собственное окно.
    if (you) {
      const [x, y] = pos(you[0], you[1]);
      g += P(`M${x - 14} ${y - 5} v-7 h6 M${x + 8} ${y - 12} h6 v7 M${x - 14} ${y + 5} v7 h6 M${x + 8} ${y + 12} h6 v-7`, 'none', `stroke="${RED}" stroke-width="1.5"`);
      g += R(x - 12, y - 27, 24, 13, RED, 'rx="2"');
      g += T(x, y - 17.1, 'ВЫ', 9, '#05070c', 'text-anchor="middle" font-family="Plex" font-weight="700"');
    }
    g += R(-40, 352, 440, 30, 'url(#bld_bottom)') + R(-220, 382, 800, 600, '#03060c');
    return g;
  };
})();

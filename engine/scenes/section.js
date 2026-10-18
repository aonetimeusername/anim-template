// разрез школы: 3 этажа. p.mode: 'speakers' | 'mic' | 'listen' | 'orlov' | 'except'
// p.tMic — абс. время превращения динамиков в микрофоны; p.tema — точка Тёмы в 214; p.phone {t} — телефон в спортзале звонит
// p.except {t0, step} — кабинеты загораются по одному начиная с t0, 214 остаётся тёмным
// p.shadow214 — абс. время: на полосе лестницы справа от 214 за 0.5 с проявляется высокий тёмный силуэт с двумя глазами (ч.2)
// mode 'siren' (ч.2): p.tSiren — абс. начало тревоги: все кабинеты, кроме тёмного 214, плавно пульсируют красным 1.5 Гц
//   (a ≤ .25, фаза от абсолютного t, как в corridor.js/e_scenes.js; вход 0.25 с), у каждого в правом верхнем углу
//   маленький оповещатель, от него НАРУЖУ кольца (красное/бледное по очереди, 1.5 в секунду, внутри своего кабинета);
//   p.tDeaf — абс.: за 0.3 с все красные «уши» перечёркиваются белой чертой (волной слева направо), их кольца гаснут.
//   Полноэкранных вспышек нет.
// p.temaPose — поза Тёмы в 214 ('sit' по умолчанию, 'stand' — стоит)
// всё в IIFE: так черновик можно грузить поверх старого section.js (const SCHOOL не объявляется второй раз)
(() => {
const SCHOOL = (() => {
  const x0 = 34, w = 292, fh = 74, top = 128;
  const rooms = [];
  const row = (floor, names) => {
    const y = top + (3 - floor) * fh;
    let x = x0;
    for (const [name, k] of names) { rooms.push({ name, x, y, w: (w / 4) * k, h: fh, floor }); x += (w / 4) * k; }
  };
  row(3, [['311', 1], ['312', 1], ['313', 1], ['314', 1]]);
  row(2, [['211', 1], ['212', 1], ['213', 1], ['214', 1]]);
  row(1, [['спортзал', 2], ['столовая', 1], ['вход', 1]]);   // вход под 214: окно 214 над козырьком
  return { x0, w, fh, top, bottom: top + 3 * fh, rooms };
})();
globalThis.SCHOOL ??= SCHOOL;   // геометрия разреза остаётся доступной глобально, как была до IIFE

// силуэт на лестнице у 214: ноги на полу 2-го этажа, лицом к 214 (влево), холодный подсвет со ступеней за спиной
function stairShadow(S, r214, T, t) {
  const a = ease(lin(t, T, T + 0.5));
  if (a <= 0) return '';
  const sx = S.x0 + S.w, sw = 14;                    // полоса лестницы
  const x = sx + sw / 2 + 0.4, y = r214.y + r214.h - 1.5, h = 44, s = h / 100;
  const sway = noise1(t * 0.7 + 5) * 0.35;           // почти неподвижен
  let g = `<defs><clipPath id="sc_stair"><rect x="${sx}" y="${S.top}" width="${sw}" height="${S.bottom - S.top}"/></clipPath></defs>`;
  // свет на ступенях за ним: силуэт читается тёмным пятном на светлом
  g += G(
    Ci(x, y - 24, 34, 'url(#glowC)', `opacity="${f1(0.95 * a)}"`) + Ci(x, y - 16, 16, 'url(#glowC)', `opacity="${f1(0.5 * a)}"`),
    '', 'clip-path="url(#sc_stair)"');
  // тело: выше человека, узкое, длинные руки почти до колен, маленькая голова
  let b = P('M-11 -74 C-11 -78,-7 -80,-3 -80 L3 -80 C7 -80,11 -78,11 -74 L8.6 -40 L7.6 0 L1.3 0 L0 -28 L-1.3 0 L-7.6 0 L-8.6 -40 Z', C.sil);
  b += P('M-11.6 -73 C-14 -60,-14.6 -46,-14.2 -27 C-14 -24.5,-11.4 -24.5,-11.4 -27 L-10.6 -46 Z', C.sil);
  b += P('M11.6 -73 C14 -60,14.6 -46,14.2 -27 C14 -24.5,11.4 -24.5,11.4 -27 L10.6 -46 Z', C.sil);
  b += R(-3, -84, 6, 6, C.sil) + `<ellipse cx="0" cy="-90" rx="8" ry="9.4" fill="${C.sil}"/>`;
  g += G(b, `translate(${f1(x + sway)},${f1(y)}) scale(${f1(s)},${f1(s)})`, `opacity="${f1(a)}"`);
  // глаза: появляются в конце проявления, смотрят на 214; редко моргают
  const ea = 0.55 * ease(lin(t, T + 0.3, T + 0.6));
  const ph = ((t - T) % 3.1 + 3.1) % 3.1, blink = t - T > 1.2 && ph > 2.95 ? 0.15 : 1;
  if (ea > 0) {
    const ex = x + sway - 0.6, ey = y - 90.5 * s;
    g += Ci(ex, ey, 4.5, 'url(#glowC)', `opacity="${f1(ea * 0.6)}"`);
    for (const dx of [-1.6, 1.6]) g += `<ellipse cx="${f1(ex + dx)}" cy="${f1(ey)}" rx=".85" ry="${f1(0.85 * blink)}" fill="rgba(230,236,245,${f1(ea)})"/>`;
  }
  return g;
}

// тревога: k — фаза пульса 0..1 от абсолютного t, on — вход 0.25 с; до tSiren — null
function sirenPulse(tSiren, t) {
  if (tSiren == null || t < tSiren) return null;
  return { k: 0.5 + 0.5 * Math.sin(2 * Math.PI * 1.5 * t), on: lin(t, tSiren, tSiren + 0.25) };
}
// маленький оповещатель в углу кабинета: красная коробка, решётка слева, линза справа (lit 0..1), кольца наружу
function roomSounder(x, y, sr, t, clip) {
  const lit = (0.25 + 0.75 * sr.k) * sr.on;
  const rr = [Ci(x + 2.6, y - 0.6, 13, 'url(#glowR)', `opacity="${f1(0.5 * lit)}"`)];
  // кольца рождаются на пике пульса (как у «Маяка» в коридоре), живут 1.33 с
  const tt = (t - 1 / 6) * 0.75;
  for (let i = 0; i < 2; i++) {
    const e = ((tt + i / 2) % 1 + 1) % 1, r = mix(6, 24, eout(e));
    rr.push(Ci(x, y, r, 'none', `stroke="${i ? '#f5c9cf' : C.red}" stroke-width="${f1(1.6 - 0.9 * e)}" opacity="${f1(0.7 * (1 - e) * sr.on)}"`));
  }
  let g = G(rr.join(''), '', `clip-path="url(#${clip})"`);
  g += R(x - 6.4, y - 4.6, 12.8, 9.2, '#1a2438', 'rx="1"');
  g += R(x - 5.6, y - 3.8, 11.2, 7.6, '#a31d2c', 'rx="1.2"') + R(x - 5.6, y - 3.8, 11.2, 1.7, '#c8293b', 'rx="1"');
  g += Ci(x - 2.3, y + 0.2, 2.4, '#5c0e18') + Ci(x - 2.3, y + 0.2, 1.3, 'none', 'stroke="#8e1a28" stroke-width=".5"');
  g += Ci(x + 2.6, y - 0.6, 1.6, lit > 0.6 ? '#ff8a72' : '#c23a3a') + Ci(x + 2.6, y - 0.6, 0.7, '#ffd1c8', `opacity="${f1(lit)}"`);
  return g;
}
// «ухо» под сиреной: пока слышит — кольца внутрь (как в listen); на tDeaf (+сдвиг волны) за 0.18 с
// кольца гаснут, ухо тускнеет и его перечёркивает белая черта (сверху-слева вниз-вправо)
function sirenEar(cx, cy, t, tDeaf, micU, ph) {
  const d = tDeaf == null ? 0 : lin(t, tDeaf, tDeaf + 0.18), du = ease(d);
  let g = '';
  if (d < 1) g += rings(cx, cy, ph, { n: 2, r0: 6, r1: 22, col: '#ff4a4a', a: 0.7 * micU * (1 - d), speed: 0.9, dir: -1 });
  if (du > 0) {
    const x1 = cx - 7.5, y1 = cy - 7.5, x2 = mix(x1, cx + 7.5, du), y2 = mix(y1, cy + 7.5, du);
    g += Ci(cx, cy, 5.5 * micU, `rgba(5,11,24,${f1(0.4 * du)})`);
    g += L(x1, y1, x2, y2, '#050b18', 3.6, 'stroke-linecap="round" opacity=".75"') + L(x1, y1, x2, y2, '#f4f6fa', 1.8, 'stroke-linecap="round"');
  }
  return g;
}

SCENES.section = function (u, p, d, t) {
  const S = SCHOOL;
  let g = '';
  g += R(0, 0, 360, 640, '#050b18') + G(snow(0, 0, 360, 420, t, 70, 7, 22, .55));
  // крыша, земля, сугробы
  g += R(S.x0 - 8, S.top - 10, S.w + 16, 10, '#1a2740');
  g += R(0, S.bottom, 360, 640 - S.bottom, '#060a14') + P(`M0 ${S.bottom} Q60 ${S.bottom - 10} 120 ${S.bottom} T240 ${S.bottom} T360 ${S.bottom} V${S.bottom + 6} H0 Z`, '#cfd8e6', 'opacity=".55"');
  const mode = p.mode || 'speakers';
  const micU = p.tMic ? lin(t, p.tMic, p.tMic + 0.35) : (mode === 'speakers' ? 0 : 1);
  // тревога (ч.2): пульс, клипы кабинетов для колец оповещателей, волна «глухоты» слева направо (0.12 с + 0.18 с на ухо)
  const sr = mode === 'siren' ? sirenPulse(p.tSiren, t) : null;
  if (sr) g += `<defs>${S.rooms.map((q, i) => `<clipPath id="sec_rm${i}"><rect x="${f1(q.x)}" y="${f1(q.y)}" width="${f1(q.w)}" height="${f1(q.h)}"/></clipPath>`).join('')}</defs>`;
  const deafAt = cx => p.tDeaf == null ? null : p.tDeaf + 0.12 * clamp((cx - (S.x0 + S.w / 8)) / (S.w * 3 / 4));
  for (const r of S.rooms) {
    const is214 = r.name === '214';
    let lit = 0;
    if (mode === 'except' && p.except && !is214) {
      const idx = S.rooms.filter(q => q.name !== '214').indexOf(r);
      lit = lin(t, p.except.t0 + idx * p.except.step, p.except.t0 + idx * p.except.step + 0.2);
    }
    g += R(r.x, r.y, r.w, r.h, lit ? `rgba(160,40,45,${0.28 * lit})` : '#0b1528');
    if (sr && !is214) g += R(r.x, r.y, r.w, r.h, `rgba(215,38,61,${f1((0.09 + 0.16 * sr.k) * sr.on)})`);
    g += R(r.x, r.y, r.w, r.h, 'none', `stroke="#9fb0c8" stroke-width="1.2" opacity=".8"`);
    g += T(r.x + 5, r.y + 11, r.name.toUpperCase(), 6.5, '#8f9bb0', MONO);
    const cx = r.x + r.w / 2, cy = r.y + 26;
    if (r.floor > 1 || r.name === 'спортзал') {
      if (is214) {
        // снятый динамик: провода
        g += P(`M${cx - 4} ${r.y + 4} q -3 8 2 14 M${cx + 3} ${r.y + 4} q 4 7 -1 13`, 'none', `stroke="#c9a24a" stroke-width="1.3"`);
      } else {
        const sc = 0.42;
        if (micU < 1) g += G(speakerBox(cx, cy, sc), '', `opacity="${1 - micU}"`);
        if (micU > 0) {
          // микрофон/«ухо»: красный кружок с дугами
          g += Ci(cx, cy, 5.5 * micU, C.red) + Ci(cx, cy, 2.2 * micU, '#ffb3b3');
          if (mode === 'siren') g += sirenEar(cx, cy, t, deafAt(cx), micU, t + r.x * 0.01);
          else if (mode !== 'except' || lit > 0) g += rings(cx, cy, t + r.x * 0.01, { n: 2, r0: 6, r1: 22, col: '#ff4a4a', a: 0.7 * micU * (mode === 'except' ? lit : 1), speed: 0.9, dir: -1 });
        }
      }
    }
    if (sr && !is214) g += roomSounder(r.x + r.w - 10, r.y + 10, sr, t, `sec_rm${S.rooms.indexOf(r)}`);
  }
  // Гусев: кто-то ответил из 311 — свет, фигурка, волны; на хлопке — красная вспышка и тьма
  if (mode === 'gusev') {
    const q = S.rooms.find(r => r.name === '311');
    const on = lin(t, p.tHere - 0.05, p.tHere + 0.15);
    if (t < p.tSlam && on > 0) {
      g += R(q.x, q.y, q.w, q.h, `rgba(190,215,255,${f1(0.2 * on)})`);
      g += person({ x: q.x + q.w / 2 + 8, y: q.y + q.h - 3, h: 32, pose: 'stand', face: 1 });
      g += rings(q.x + q.w / 2, q.y + 36, t, { n: 3, r0: 8, r1: 48, col: '#cfe3ff', a: 0.85 * on, speed: 1.3 });
    }
    if (t >= p.tSlam) {
      const k = lin(t, p.tSlam, p.tSlam + 0.7);
      g += R(q.x, q.y, q.w, q.h, `rgba(215,38,61,${f1(0.8 * (1 - k))})`);
      g += R(q.x + 1, q.y + 1, q.w - 2, q.h - 2, `rgba(0,0,0,${f1(0.9 * k)})`);
      g += R(q.x + 2, q.y + 2, q.w - 4, q.h - 4, 'none', `stroke="${C.red}" stroke-width="1.6" stroke-dasharray="5 3" opacity="${f1(0.8 * k)}"`);
    }
  }
  // лестница справа
  g += R(S.x0 + S.w, S.top, 14, S.bottom - S.top, '#0d1830') + R(S.x0 + S.w, S.top, 14, S.bottom - S.top, 'none', 'stroke="#9fb0c8" stroke-width="1" opacity=".5"');
  for (let i = 0; i < 9; i++) g += L(S.x0 + S.w + 2, S.top + 10 + i * 24, S.x0 + S.w + 12, S.top + 18 + i * 24, '#53647f', 1);
  const r214 = S.rooms.find(r => r.name === '214'), gym = S.rooms.find(r => r.name === 'спортзал');
  // силуэт на лестнице у 214 (ч.2)
  if (p.shadow214 != null) g += stairShadow(S, r214, p.shadow214, t);
  // Тёма в 214
  if (p.tema) g += person({ x: r214.x + 30, y: r214.y + r214.h - 3, h: 34, pose: p.temaPose || 'sit', face: -1 });
  // телефон в спортзале
  if (p.phone) {
    const on = t >= p.phone.t;
    g += R(gym.x + gym.w / 2 - 4, gym.y + gym.h - 14, 8, 13, on ? '#bfe0ff' : '#1d2638', 'rx="1.5"');
    if (on) g += Ci(gym.x + gym.w / 2, gym.y + gym.h - 8, 30, 'url(#glowC)') + rings(gym.x + gym.w / 2, gym.y + gym.h - 8, t, { r0: 6, r1: 40, col: '#9fd0ff', a: 0.8 });
  }
  // 214 — дыра: красная пунктирная рамка
  if (mode === 'except' && p.except) {
    const n = S.rooms.length - 1, tEnd = p.except.tFrame ?? (p.except.t0 + n * p.except.step);
    const k = lin(t, tEnd, tEnd + 0.3);
    if (k > 0) {
      const pulse = 0.65 + 0.35 * Math.sin(t * 6);
      g += R(r214.x + 2, r214.y + 2, r214.w - 4, r214.h - 4, 'none', `stroke="${C.red}" stroke-width="2.4" stroke-dasharray="6 4" opacity="${k * pulse}"`);
      g += T(r214.x + r214.w - 12, r214.y + 22, '?', 15, C.red, `text-anchor="middle" font-family="Mont" font-weight="900" opacity="${k}"`);
    }
  }
  return g;
};
})();

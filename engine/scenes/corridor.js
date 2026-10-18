// школьный коридор, вид сбоку. p: doors [{x,num,open}], windows [{x}], speaker {x,y,pulse:[t0,t1]} (абс. время звучания),
// actors [{kind:'person'|'shadow', keys:[[u,x]..], pose, face, h, eyes}], coin {x, t}, exit (табличка «выход»), dark (0..1)
// ч.2:
//   siren [t0,t1] (абс.) — пожарная тревога: плавный красный пульс 1.5 Гц на стенах (a=.10….22) и отсвет на полу у плинтуса,
//         который гаснет к зоне субтитров. Вход — 0.25 с, выход — в один кадр. Без белых вспышек.
//   sounder {x,y,s} — красная коробка оповещателя «Маяк» на стене: решётка, линза-лампа, надпись. Пока идёт siren,
//         лампа горит в такт пульсу и от коробки наружу расходятся кольца (по очереди красное и бледно-розовое, 1.5 в секунду).
//   actors[].run (только kind:'shadow') — бег: на движущемся отрезке ключей быстрый разгон (≈0.12 с) и ровная скорость
//         вместо плавного ease; наклон вперёд 8° по face, подскок 2 px в такт шагу (низ — в момент шага);
//         шаги идут от начала движения через ac.steps и прекращаются после последнего ключа — круги на полу просто гаснут.
// всё в IIFE: черновик грузится поверх engine/scenes/corridor.js без конфликтов имён
(() => {
// трапециевидный профиль скорости: разгон a, ровно, торможение a (доля отрезка)
const runEase = (e, a = 0.15) => {
  const v = 1 / (1 - a);
  if (e < a) return v * e * e / (2 * a);
  if (e < 1 - a) return v * (e - a / 2);
  return 1 - v * (1 - e) * (1 - e) / (2 * a);
};
function runKf(keys, u) {
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (u <= keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i]; return mix(va, vb, runEase((u - a) / (b - a))); }
  }
  return keys[keys.length - 1][1];
}
// интенсивность тревоги 0..1 (фаза от абсолютного t — стыкуется с другими сценами с тем же пульсом)
function sirenK(siren, t) {
  if (!siren) return null;
  const [a, b] = siren === true ? [-1e9, 1e9] : siren;
  if (t < a || t >= b) return null;
  return { k: 0.5 + 0.5 * Math.sin(2 * Math.PI * 1.5 * t), on: lin(t, a, a + 0.25) };
}
// оповещатель «Маяк»: красный корпус, решётка слева, линза справа; lit 0..1 — яркость лампы
function sounderBox(x, y, s, lit) {
  let g = R(x - 19 * s, y - 14 * s, 38 * s, 28 * s, '#1a2438', `rx="${2 * s}"`);                         // монтажная плита
  g += R(x - 17 * s, y - 12 * s, 34 * s, 24 * s, '#a31d2c', `rx="${2.5 * s}"`);
  g += R(x - 17 * s, y - 12 * s, 34 * s, 5 * s, '#c8293b', `rx="${2.5 * s}"`);                          // блик верхней грани
  g += R(x - 17 * s, y + 9 * s, 34 * s, 3 * s, '#7a1420', `rx="${1.5 * s}"`);                          // тень низа
  g += Ci(x - 7 * s, y + 0.5 * s, 7.2 * s, '#5c0e18');                                               // решётка
  for (const r of [5.4, 3.6, 1.8]) g += Ci(x - 7 * s, y + 0.5 * s, r * s, 'none', `stroke="#8e1a28" stroke-width="${0.8 * s}"`);
  g += Ci(x + 8 * s, y - 2.5 * s, 4.2 * s, '#6e1620');                                               // линза
  g += Ci(x + 8 * s, y - 2.5 * s, 3.4 * s, mixHex('#7d1a24', '#ff6a55', lit));
  if (lit > 0.05) g += Ci(x + 8 * s, y - 2.5 * s, 1.4 * s, '#ffd1c8', `opacity="${f1(lit)}"`);
  g += T(x + 8 * s, y + 7.4 * s, 'МАЯК', 4.4 * s, '#f6dcdc', 'text-anchor="middle" font-family="Mont" font-weight="800" letter-spacing=".3"');
  return g;
}
function mixHex(c0, c1, u) {
  const h = (c, i) => parseInt(c.slice(1 + 2 * i, 3 + 2 * i), 16);
  let o = '#';
  for (let i = 0; i < 3; i++) o += Math.round(mix(h(c0, i), h(c1, i), clamp(u))).toString(16).padStart(2, '0');
  return o;
}

SCENES.corridor = function (u, p, d, t) {
  let g = '';
  const W = '#0f1a2f';
  g += R(0, 0, 360, GROUND, W);
  g += R(0, 0, 360, 34, '#0a1324') + L(0, 34, 360, 34, '#1b2943', 2);
  for (const lx of [60, 180, 300]) g += R(lx - 22, 34, 44, 5, '#1a273e');
  // окна (снег, лунный свет на полу)
  for (const w of (p.windows || [])) {
    g += P(`M${w.x - 10} ${GROUND} L${w.x + 70} ${GROUND} L${w.x + 120} 640 L${w.x - 40} 640 Z`, 'url(#beam)', 'opacity=".25"');
    g += R(w.x - 4, 104, 68, 114, '#24324d') + R(w.x, 108, 60, 106, '#06102a');
    g += G(snow(w.x, 108, 60, 106, t, 14, w.x, 10, .9));
    g += L(w.x + 30, 108, w.x + 30, 214, '#24324d', 3) + L(w.x, 150, w.x + 60, 150, '#24324d', 3) + R(w.x - 8, 216, 76, 5, '#2c3b5a');
  }
  // панель-«школьная покраска» снизу
  g += R(0, 262, 360, GROUND - 262, '#0c1628') + L(0, 262, 360, 262, '#22324f', 2);
  // двери
  for (const dr of (p.doors || [])) g += door({ x: dr.x, y: GROUND - 138, w: 62, h: 138, num: dr.num, open: dr.open || 0, color: dr.color || C.door });
  // табличка «выход»
  if (p.exit) g += Ci(p.exit.x, 64, 40, 'url(#glowC)', 'opacity=".35"') + R(p.exit.x - 22, 56, 44, 15, '#1f8f4e', 'rx="2"') +
    T(p.exit.x, 67, 'ВЫХОД', 8.5, '#e8fff0', 'text-anchor="middle" font-family="Mont" font-weight="800"');
  // динамик + волны во время звучания
  if (p.speaker) {
    const sp = p.speaker;
    g += speakerBox(sp.x, sp.y || 66, sp.s || 1);
    for (const [a, b] of (sp.pulse || [])) if (t >= a && t < b + 0.6) g += rings(sp.x, (sp.y || 66) + 2, t, { a: 0.75 * (1 - lin(t, b, b + 0.6)), r1: 60 });
    if (sp.glitch && t >= sp.glitch && t < sp.glitch + 0.6) {
      const k = 1 - lin(t, sp.glitch, sp.glitch + 0.6);
      let z = `M${sp.x - 34} ${(sp.y || 66) + 30}`;
      for (let i = 1; i <= 12; i++) z += ` L${sp.x - 34 + i * 5.7} ${(sp.y || 66) + 30 + (hash(i + Math.floor(t * 24)) - 0.5) * 22 * k}`;
      g += P(z, 'none', `stroke="${C.red}" stroke-width="1.6" opacity="${k}"`);
    }
  }
  // пол
  g += R(0, GROUND, 360, 640 - GROUND, '#070d1a') + L(0, GROUND, 360, GROUND, '#2a3b5c', 2);
  for (let i = 0; i < 6; i++) g += L(0, GROUND + 18 + i * i * 9, 360, GROUND + 18 + i * i * 9, '#0b1424', 1);
  // тревога: красный пульс на стенах и отсвет на полу (к субтитрам гаснет)
  const sr = sirenK(p.siren, t);
  if (sr) {
    const a = (0.10 + 0.12 * sr.k) * sr.on;
    g += `<defs><linearGradient id="cor_sirenFl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7263d" stop-opacity="1"/><stop offset="1" stop-color="#d7263d" stop-opacity="0"/></linearGradient></defs>`;
    g += R(0, 0, 360, GROUND, `rgba(215,38,61,${f1(a)})`);
    g += R(0, GROUND, 360, 96, 'url(#cor_sirenFl)', `opacity="${f1(a)}"`);
  }
  // оповещатель «Маяк»
  if (p.sounder) {
    const so = p.sounder, sx = so.x, sy = so.y || 84, ss = so.s || 1;
    const lit = sr ? (0.25 + 0.75 * sr.k) * sr.on : 0;
    if (sr) {
      g += Ci(sx + 8 * ss, sy - 2.5 * ss, 46 * ss, 'url(#glowR)', `opacity="${f1(0.55 * lit)}"`);
      // кольца наружу: рождаются на пике пульса, по очереди красное и бледное, живут 1.33 с
      const tt = t - 1 / 6;
      for (let i = 0; i < 2; i++) {
        const e = ((tt * 0.75 + i / 2) % 1 + 1) % 1, r = mix(16, 84, eout(e)) * ss;
        g += Ci(sx, sy, r, 'none', `stroke="${i ? '#f5c9cf' : C.red}" stroke-width="${f1((1.8 - e) * ss)}" opacity="${f1(0.6 * (1 - e) * sr.on)}"`);
      }
    }
    g += sounderBox(sx, sy, ss, lit);
  }
  // монета
  if (p.coin && t >= p.coin.t) {
    const a = t - p.coin.t, cx = p.coin.x;
    const y0 = p.coin.y0 || 300, yb = GROUND - 2;
    let cy = a < 0.32 ? mix(y0, yb, (a / 0.32) ** 2) : yb - Math.abs(Math.sin((a - 0.32) * 18)) * 10 * Math.exp(-(a - 0.32) * 6);
    g += P(`M${cx - 3} ${cy} a3 1.6 0 1 0 6 0 a3 1.6 0 1 0 -6 0`, '#e6c35c');
    if (a > 0.32 && a < 1.6) g += rings(cx, yb, a, { n: 3, r0: 4, r1: 70, speed: 1.4, a: 0.7 * (1 - lin(a, 0.6, 1.6)), col: '#ffcf2e' });
  }
  // герои
  for (const ac of (p.actors || [])) {
    if (ac.kind === 'shadow' && ac.run) { g += runner(ac, u); continue; }
    const x = kf(ac.keys, u);
    const moving = ac.keys.length > 1 && u > ac.keys[0][0] && u < ac.keys[ac.keys.length - 1][0];
    if (ac.kind === 'shadow') {
      // шаги: тусклые круги на полу в такт звуку (интервал ac.steps, первый шаг через 0.3 с)
      if (ac.steps) for (let k = 0; ; k++) {
        const us = 0.3 + k * ac.steps;
        if (us > u) break;
        const a = u - us;
        if (a < 0.9) g += P(`M${f1(kf(ac.keys, us) - 40 * eout(a / 0.9) - 6)} ${GROUND + 2} a${f1(6 + 40 * eout(a / 0.9))} ${f1(2 + 7 * eout(a / 0.9))} 0 1 0 ${f1(12 + 80 * eout(a / 0.9))} 0`, 'none', `stroke="#9fb0c8" stroke-width="1" opacity="${f1(0.45 * (1 - a / 0.9))}"`);
      }
      g += shadow(x, GROUND, ac.h || 92, ac.eyes || 0, ac.face || 1);
    }
    else g += person({ x, y: GROUND, h: ac.h || 72, face: ac.face || 1, pose: moving ? 'walk' : (ac.pose || 'stand'), t: u, arm: ac.arm ?? null });
  }
  if (p.dark) g += R(0, 0, 360, 640, `rgba(0,0,0,${p.dark})`);
  return g;
};

// бегущий силуэт (shadow + run:true)
function runner(ac, u) {
  const keys = ac.keys, face = ac.face || 1, h = ac.h || 92;
  // начало движения — последний ключ, совпадающий по x с первым; конец — последний ключ
  let i0 = 0;
  while (i0 + 1 < keys.length && keys[i0 + 1][1] === keys[0][1]) i0++;
  const t0 = keys[i0][0], t1 = keys[keys.length - 1][0];
  const x = runKf(keys, u);
  let g = '';
  // шаги: от начала бега через ac.steps, после последнего ключа новых нет — старые гаснут
  if (ac.steps) for (let k = 0; ; k++) {
    const us = t0 + k * ac.steps;
    if (us > u || us > t1) break;
    const a = u - us;
    if (a < 0.9) {
      const e = eout(a / 0.9), sx = runKf(keys, us);
      g += P(`M${f1(sx - 40 * e - 6)} ${GROUND + 2} a${f1(6 + 40 * e)} ${f1(2 + 7 * e)} 0 1 0 ${f1(12 + 80 * e)} 0`, 'none', `stroke="#9fb0c8" stroke-width="1" opacity="${f1(0.5 * (1 - a / 0.9))}"`);
    }
  }
  // наклон 8° вперёд: за 0.08 с до старта и 0.12 с после — набирает; подскок 2 px между шагами (на шаге — 0)
  const lean = 8 * face * ease(lin(u, t0 - 0.08, t0 + 0.12)) * (1 - lin(u, t1, t1 + 0.15));
  const st = ac.steps || 0.27;
  const bob = u > t0 && u < t1 ? -2 * Math.abs(Math.sin(Math.PI * (u - t0) / st)) : 0;
  g += G(shadow(0, 0, h, ac.eyes || 0, face), `translate(${f1(x)},${f1(GROUND + bob)}) rotate(${f1(lean)})`);
  return g;
}
})();

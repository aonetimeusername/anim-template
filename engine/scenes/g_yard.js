// черновик ч.2, ключ g: yard_gate — финал. Двор школы сбоку, широкий план, ночь, метель.
// Слева угол фасада с окном 214 и маленьким рупором, козырёк над входом, сугроб с Тёмой (голова в вмятине),
// в центре снег двора, справа забор с калиткой и натриевый фонарь. Мама входит с фонариком телефона.
// p (все времена абсолютные, как t):
//   siren [t0,t1]  — красный пульс и кольца из рупора; в t1 (tCut) строб и кольца пропадают в один кадр
//   tWake          — рупор просыпается: ком снега падает, загорается светодиод, тихие кольца внутрь (слушает)
//   tMom, tStop    — в калитке вспыхивает фонарик, через 0.3 с входит мама и идёт 334→240 к tStop
//   momX           — мама уже стоит здесь (кадры после mom)
//   tCall          — мама кричит: ладонь у губ, три дуги летят к рупору, светодиод вспыхивает
//   tRun, runTo    — бег от momX к runTo за 1.0 с, фонарик на фасаде
//   tPa, paEnd     — рупор говорит с мамой: широкие бледные дуги, мама замирает, луч поднимается на рупор
//   momLook:'horn' — голова и луч уже на рупоре
//   tShout, tHush  — Тёма приподнимается и открывает рот / закрывает рот ладонью и ныряет в сугроб
//   beam {t0,t1}   — луч с рупора скользит вниз и в t1-0.4 проходит в 4 px над головой Тёмы
//   eyes           — в тёмном окне вахты загораются два глаза (пасхалка)
(() => {
  const CAP = 'stroke-linecap="round"';
  const rad = a => a * Math.PI / 180, deg = a => a * 180 / Math.PI;
  const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const has = v => v !== undefined && v !== null;
  const NEVER = 1e9;

  // ---- раскладка
  const HX = 96, HY = 214, HROT = 30, HS = 0.85;           // рупор: центр корпуса, наклон раструба вниз-вправо, масштаб
  const hornPt = (lx, ly) => { const a = rad(HROT); lx *= HS; ly *= HS; return [HX + lx * Math.cos(a) - ly * Math.sin(a), HY + lx * Math.sin(a) + ly * Math.cos(a)]; };
  const MOUTH = hornPt(19, 0);                              // устье
  const LEDP = hornPt(-1.6, -2.2);                          // светодиод на корпусе
  const TX = 118, TY = 322, TR = 6.8, TK = TR / 8.6;        // голова Тёмы (центр, радиус)
  const HUSH_DY = 13;                                       // насколько ныряет голова: над краем вмятины остаются макушка и глаза
  const BEAM_L = 172, BEAM_H = 15;                          // луч фонарика: длина и полуугол
  // гребень сугроба (для приземления комков снега)
  const RIDGE = [[-24, 333], [0, 327], [58, 324.5], [96, 328.5], [108, 336], [118, 338.8], [130, 336.5], [142, 329.5], [160, 333], [174, 347], [185, 364], [192, 376]];
  const ridgeY = x => {
    for (let i = 1; i < RIDGE.length; i++) if (x <= RIDGE[i][0]) { const [a, ya] = RIDGE[i - 1], [b, yb] = RIDGE[i]; return mix(ya, yb, clamp((x - a) / (b - a))); }
    return 374;
  };
  const RIDGE_D = 'M-24 333 C-4 327 26 324.5 58 324.5 C78 324.5 89 325.5 96 328.5 C102 331 107 338.5 118 338.8 C129 339 134 331 142 329.5 C153 328 164 334 174 347';
  const DRIFT = 'M-24 384 L' + RIDGE_D.slice(1) + ' C181 356 185 366 192 376 L192 384 Z';
  // путь мамы по двору: из калитки к крыльцу
  const momYAt = x => x >= 318 ? mix(361, 359, clamp((x - 318) / 16)) : (x > 240 ? mix(366, 361, (x - 240) / 78) : 366);

  // облачко пара (как в f_scenes), sc — масштаб, ветер сносит влево
  function puff(ox, oy, age, life, dirx, seed, k = 1, sc = 1) {
    if (age < 0 || age > life) return '';
    const e = age / life;
    let g = '';
    for (let i = 0; i < 5; i++) {
      const hh = hash(seed * 7.3 + i * 3.1), h2 = hash(seed * 3.7 + i * 5.9);
      const px = ox + sc * (dirx * (8 + 22 * hh) * eout(e) + (h2 - 0.5) * 5 * e) - 14 * e * e;
      const py = oy + sc * (-(4 + 14 * h2) * eout(e) - 4 * e * e + (hh - 0.5) * 3);
      const r = sc * (3 + 11 * eout(e)) * (0.65 + 0.55 * hash(seed + i * 1.7));
      const a = 0.5 * k * Math.pow(1 - e, 1.4) * sstep(0, 0.1, e);
      g += Ci(px, py, r, `rgba(228,238,252,${f1(a)})`);
    }
    return g;
  }
  // периодическое дыхание: облачко раз в per секунд (по абсолютному времени, без скачков между кадрами)
  function breath(t, ox, oy, per, life, dirx, seed, k, sc, from = -NEVER, to = NEVER) {
    let g = '';
    const n = Math.floor(t / per);
    for (let i = n - 2; i <= n; i++) {
      const born = i * per + 0.37 * per;
      if (born < from || born > to) continue;
      g += puff(ox, oy, t - born, life, dirx, seed + i * 3.7, k, sc);
    }
    return g;
  }
  // дуга окружности (центр, радиус, направление и полураствор в градусах)
  function arc(cx, cy, r, dirDeg, halfDeg, stroke, w, a) {
    const a0 = rad(dirDeg - halfDeg), a1 = rad(dirDeg + halfDeg);
    return P(`M${f1(cx + r * Math.cos(a0))} ${f1(cy + r * Math.sin(a0))} A${f1(r)} ${f1(r)} 0 0 1 ${f1(cx + r * Math.cos(a1))} ${f1(cy + r * Math.sin(a1))}`, 'none',
      `stroke="${stroke}" stroke-width="${f1(w)}" opacity="${f1(a)}" ${CAP}`);
  }

  // ---------------------------------------------------------------- мама (h 46–48, лицом влево)
  // локальные координаты: начало в точке между стоп, вперёд = −x
  function momPose(o) {
    const { pose = 'stand', ph = 0 } = o;
    let la = 3, lb = -3, bob = 0, lean = 0, armB = 6, hem = 0;
    if (pose === 'walk') { const sn = Math.sin(ph); la = 24 * sn; lb = -24 * sn; bob = Math.abs(Math.cos(ph)) * 0.8; armB = -18 * sn; hem = sn; }
    if (pose === 'run') { const sn = Math.sin(ph); la = 34 * sn; lb = -34 * sn; bob = Math.abs(Math.cos(ph)) * 1.5; armB = -36 * sn; hem = 1.6 * sn; lean = -8; }
    return { la, lb, bob, lean, armB, hem, hip: -19 - bob, sh: -35 - bob };
  }
  function momWorld(M, lx, ly) {
    const l = rad(M.lean), s = M.s;
    return [M.x + s * (lx * Math.cos(l) - ly * Math.sin(l)), M.y + s * (lx * Math.sin(l) + ly * Math.cos(l))];
  }
  // рука с телефоном следует за лучом: возвращает локальную кисть и кончик телефона
  function momArm(M, e) {
    const ea = clamp(e * 0.6 - 6, -50, 38);
    const sx = -0.4, sy = M.sh + 1.8;
    const hx = sx - 12.2 * Math.cos(rad(ea)), hy = sy - 12.2 * Math.sin(rad(ea));
    return { ea, sx, sy, hx, hy, tx: hx - 2.4 * Math.cos(rad(e)), ty: hy - 2.4 * Math.sin(rad(e)) };
  }
  function momFig(M, e, o) {
    const { look = 0, call = 0, mouth = 0, rim = 0 } = o;
    const { la, lb, hip, sh, armB, hem } = M;
    const coat = '#3b2f45', coatD = '#2a2034';
    let g = '';
    const leg = (ang, dx, col) => G(R(-1.4, 0, 2.8, 18.2, col, 'rx="1.3"') + R(-3.7, 16.3, 5.5, 2.7, '#0b0f17', 'rx="1.2"'), `translate(${dx},${f1(hip)}) rotate(${f1(ang)})`);
    g += leg(lb, 0.9, '#100d16');
    // дальняя рука: качается при ходьбе, при крике — ладонь у губ
    {
      const ax = 0.9, ay = sh + 1.6;
      const sw = rad(armB);
      const e1 = [ax - 6.2 * Math.sin(sw), ay + 6.2 * Math.cos(sw)], h1 = [ax - 12 * Math.sin(sw), ay + 12 * Math.cos(sw)];
      const e2 = [-2.6, sh + 7.6], h2 = [-5.3, sh - 3.0];
      const el = [mix(e1[0], e2[0], call), mix(e1[1], e2[1], call)], hd = [mix(h1[0], h2[0], call), mix(h1[1], h2[1], call)];
      g += P(`M${f1(ax)} ${f1(ay)} L${f1(el[0])} ${f1(el[1])} L${f1(hd[0])} ${f1(hd[1])}`, 'none', `stroke="${coatD}" stroke-width="3.1" stroke-linejoin="round" ${CAP}`);
      g += Ci(hd[0], hd[1], 1.35 + 0.35 * call, '#c9a68e');
    }
    g += leg(la, -0.9, '#17131f');
    // сумка и пальто до колен
    const hs = hem * 0.7;
    g += R(3.6, hip - 5.6, 5.8, 5.4, '#4b3a30', 'rx="1.1"') + R(3.6, hip - 5.6, 5.8, 1.9, '#5d4a3d', 'rx="0.9"');
    g += P(`M-4.7 ${f1(sh)} Q0 ${f1(sh - 1.7)} 4.9 ${f1(sh)} L${f1(7.7 - hs)} ${f1(hip + 7)} Q0 ${f1(hip + 8.4)} ${f1(-7.5 - hs)} ${f1(hip + 7)} Z`, coat);
    g += P(`M1.2 ${f1(sh - 0.6)} L4.9 ${f1(sh)} L${f1(7.7 - hs)} ${f1(hip + 7)} L${f1(1.6 - hs)} ${f1(hip + 7.9)} Z`, coatD, 'opacity=".75"');
    g += L(-3.3, sh + 1.6, -4.7 - hs * 0.5, hip + 7.4, '#2a2034', 0.7);
    for (let i = 0; i < 3; i++) g += Ci(-3.1 - i * 0.25, sh + 5.5 + i * 4.6, 0.42, '#1a1420');
    g += R(-6.0, hip - 1.2, 12.4, 1.5, '#2a2034', 'rx=".7"');
    g += L(-3.2, sh + 0.8, 5.6, hip - 3.2, '#1b141e', 0.9);                       // ремень сумки
    if (rim > 0) g += P(`M4.4 ${f1(sh + 0.4)} Q5.6 ${f1(sh + 1.2)} ${f1(6.3 - hs * 0.5)} ${f1(hip - 2)}`, 'none', `stroke="#ffb35a" stroke-width=".8" opacity="${f1(rim * 0.45)}" ${CAP}`);
    // шарф
    g += R(-3.7, sh - 2.4, 7.2, 2.9, '#5a6070', 'rx="1.3"') + P(`M2.2 ${f1(sh - 0.8)} L4.7 ${f1(sh + 5.6)} L3.0 ${f1(sh + 6.0)} L1.0 ${f1(sh + 0.3)} Z`, '#4b5060');
    // голова (поворот вверх на look градусов вокруг шеи)
    {
      const hx = -0.7, hy = sh - 6.3, r = 4.3;
      let hd = '';
      hd += P(`M${f1(hx + 0.6)} ${f1(hy - 3.4)} C${f1(hx + 5.2)} ${f1(hy - 2.4)} ${f1(hx + 5.4)} ${f1(hy + 4.4)} ${f1(hx + 3.4)} ${f1(hy + 6.4)} L${f1(hx + 1.0)} ${f1(hy + 5.6)} Z`, '#3a2a22');
      hd += Ci(hx, hy, r, '#e2cfc0');
      hd += P(`M${f1(hx + 0.6)} ${f1(hy - 4.2)} C${f1(hx + 4.8)} ${f1(hy - 3.2)} ${f1(hx + 5.0)} ${f1(hy + 2.6)} ${f1(hx + 2.6)} ${f1(hy + 4.0)} C${f1(hx + 2.4)} ${f1(hy + 1)} ${f1(hx + 1.2)} ${f1(hy - 1.6)} ${f1(hx + 0.6)} ${f1(hy - 4.2)} Z`, '#3a2a22');
      hd += P(`M${f1(hx - 4.1)} ${f1(hy - 0.4)} L${f1(hx - 5.3)} ${f1(hy + 1.3)} L${f1(hx - 3.9)} ${f1(hy + 1.5)} Z`, '#e2cfc0');
      hd += Ci(hx + 2.2, hy + 1.2, 1.3, '#b9a8a0', 'opacity=".55"');
      hd += `<ellipse cx="${f1(hx - 2.5)}" cy="${f1(hy - 0.4)}" rx=".62" ry=".78" fill="#1a1418"/>` + L(hx - 3.7, hy - 1.9, hx - 1.5, hy - 2.1, '#3a2a22', 0.55, CAP);
      hd += Ci(hx - 2.4, hy + 1.3, 0.9, '#d98f86', 'opacity=".45"');
      if (mouth <= 0.05) hd += L(hx - 4.0, hy + 2.6, hx - 2.9, hy + 2.7, '#9a5a5a', 0.5, CAP);
      if (mouth > 0.05) hd += `<ellipse cx="${f1(hx - 3.2)}" cy="${f1(hy + 2.5)}" rx="${f1(0.55 + 0.25 * mouth)}" ry="${f1(0.4 + 0.9 * mouth)}" fill="#3a1418"/>`;
      // вязаная шапка с помпоном
      hd += P(`M${f1(hx - 4.8)} ${f1(hy - 0.9)} C${f1(hx - 5.0)} ${f1(hy - 7.0)} ${f1(hx + 4.7)} ${f1(hy - 7.4)} ${f1(hx + 4.8)} ${f1(hy - 0.6)} Z`, '#7a2a3a');
      hd += R(hx - 5.0, hy - 1.9, 10.0, 2.0, '#5e1f2c', 'rx=".9"');
      for (let i = 0; i < 4; i++) hd += L(hx - 3.6 + i * 2.4, hy - 1.8, hx - 3.6 + i * 2.4, hy + 0.0, '#4a1822', 0.4);
      hd += Ci(hx + 2.3, hy - 7.7, 1.9, '#8e3446') + Ci(hx + 1.8, hy - 8.2, 0.7, '#b0546a');
      hd += Ci(hx - 1.2, hy - 5.4, 0.45, '#e8eef6') + Ci(hx + 1.6, hy - 6.1, 0.4, '#e8eef6');
      if (rim > 0) hd += P(`M${f1(hx + 1.9)} ${f1(hy - 6)} A4.8 4.8 0 0 1 ${f1(hx + 4.9)} ${f1(hy - 1)}`, 'none', `stroke="#ffb35a" stroke-width=".9" opacity="${f1(rim * 0.75)}"`);
      g += G(hd, `rotate(${f1(look)} -0.4 ${f1(sh - 1)})`);
    }
    // ближняя рука с телефоном
    {
      const A = momArm(M, e);
      const el = [mix(A.sx, A.hx, 0.5), mix(A.sy, A.hy, 0.5) + 1.2];
      g += P(`M${f1(A.sx)} ${f1(A.sy)} L${f1(el[0])} ${f1(el[1])} L${f1(A.hx)} ${f1(A.hy)}`, 'none', `stroke="${coat}" stroke-width="3.3" stroke-linejoin="round" ${CAP}`);
      g += L(A.sx, A.sy - 1.2, el[0], el[1] - 1.4, '#4c3e58', 0.8, `opacity=".8" ${CAP}`);
      g += G(R(-2.5, -1.0, 4.4, 2.0, '#0e1118', 'rx=".6"') + Ci(-2.4, 0, 0.62, '#ffffff'), `translate(${f1(A.hx)},${f1(A.hy)}) rotate(${f1(e)})`);
      g += Ci(A.hx, A.hy, 1.35, '#c9a68e');
    }
    return G(g, `translate(${f1(M.x)},${f1(M.y)}) scale(${f1(M.s)}) rotate(${f1(M.lean)})`);
  }

  // ---------------------------------------------------------------- Тёма: голова и плечи над гребнем, лицом вправо
  // рисуется в локальных координатах головы стиля person() (r 8.6) и масштабируется до TR
  function temaHead(x, cy, o) {
    const { mouth = 0, hand = 0, t = 0 } = o;
    const jx = noise1(t * 19 + 4) * 0.28, jy = noise1(t * 15 + 9) * 0.22;
    let g = '';
    // плечи и шея
    g += P('M-17 30 C-17 14 -9.5 9.5 0 9.5 C9.5 9.5 16 14 16 30 Z', C.suit);
    g += P('M-17 30 C-17 14 -9.5 9.5 -2 9.6 L-4.5 30 Z', C.suit2, 'opacity=".8"');
    g += L(-14.5, 15, -7, 11, '#3a4a6a', 1, `opacity=".7" ${CAP}`);
    g += P('M-3 9.6 L3 9.6 L0 15 Z', '#c9cfd9');
    g += R(-3, 5, 6, 5.5, '#c9b2a2');
    for (const [dx, dy] of [[-11, 13], [-6, 11], [7, 11.5], [12, 14]]) g += Ci(dx, dy, 0.9, '#e8eef6', 'opacity=".85"');
    // голова в стиле person(): профиль вправо, широко раскрытый глаз
    g += Ci(0, 0, 8.6, '#e6d6c8');
    g += P('M-8.8 -1 C-9 -11 7 -13 8.8 -3 L8.8 -1 C6 -6 -3 -7 -8.8 3 Z', C.hair);
    g += R(-9.4, -2, 3, 5, '#c9b2a2', 'rx="1.5"');
    g += Ci(4.8, -1.4, 2.2, '#eef2f7') + Ci(5.7, -1.3, 1.2, '#12151c');
    g += L(2.4, -5.0, 7.4, -6.2, C.hair, 1.1, CAP);
    g += Ci(-3, -8.2, 0.8, '#eef3fa') + Ci(2.5, -8.8, 0.7, '#eef3fa') + Ci(-6.5, -4.5, 0.65, '#eef3fa');
    // тёплый контровой от лампы под козырьком (сзади-слева)
    g += P('M-8.4 2 A8.8 8.8 0 0 1 -3 -8.2', 'none', `stroke="#ffcf8a" stroke-width="1.1" opacity=".4" ${CAP}`);
    // рот
    if (mouth > 0.05) g += `<ellipse cx="6.0" cy="4.4" rx="${f1(1.0 + 0.9 * mouth)}" ry="${f1(0.8 + 1.9 * mouth)}" fill="#2a0f12"/>`;
    else g += L(4.6, 4.6, 7.4, 4.3, '#8a5a4a', 1, CAP);
    // ладонь на рту
    if (hand > 0) {
      const dy = (1 - eout(hand)) * 16;
      g += L(1, 22 + dy, 6.5, 9 + dy, C.suit, 6.4, CAP);
      g += R(2.6, 0.6 + dy, 9.2, 8.4, C.skin, 'rx="4"') + R(1.2, 2.0 + dy, 3.2, 4.6, C.skin, 'rx="1.6"');
      for (const fx of [4.9, 7.1, 9.3]) g += L(fx, 1.2 + dy, fx, 7.6 + dy, C.skin2, 0.7);
    }
    return G(g, `translate(${f1(x + jx)},${f1(cy + jy)}) scale(${f1(TR / 8.6)})`);
  }

  // ---------------------------------------------------------------- рупор на стене
  function hornSvg(t, st) {
    const { awake, wakeAge, talk, glint, led } = st;
    let g = '';
    // кабель вверх к подоконнику 214 и кронштейн
    g += P('M91.4 210.4 Q88.6 205.5 88.6 199.5 L88.6 196 Q88.6 192.3 84.5 192.2', 'none', 'stroke="#1b2333" stroke-width="1.3"');
    g += R(87, 199.5, 3.3, 1.8, '#3a4560') + R(87, 195, 3.3, 1.8, '#3a4560');
    g += R(80.4, 203, 3.6, 9, '#2a3550', 'rx="1"') + L(83, 207.5, 91.5, 211, '#3a4560', 2.4, CAP);
    const shk = (awake ? 0 : 0) + (talk > 0 ? noise1(t * 40) * 0.7 * talk : 0);
    let h = '';
    h += P('M5 -6 L19 -13 L19 13 L5 6 Z', '#5f6c85');
    h += P('M5 -6 L19 -13 L19 -10 L5 -4.2 Z', '#7d8aa3', 'opacity=".85"');
    h += P('M5 4.4 L19 10.4 L19 13 L5 6 Z', '#454f66');
    h += R(-5.5, -6, 11, 12, '#4d5870', 'rx="1.6"');
    for (const rx_ of [-2.6, 0.2, 3]) h += L(rx_, -5.6, rx_, 5.6, '#39435a', 1);
    h += L(-5.2, -5.4, 5, -5.4, '#76839c', 0.8, 'opacity=".7"');
    h += `<ellipse cx="18.2" cy="0" rx="2.4" ry="11.6" fill="#141b29"/>`;
    h += `<ellipse cx="19" cy="0" rx="2.9" ry="13" fill="none" stroke="#8a96ad" stroke-width="1.4"/>`;
    if (awake) h += P('M-5.5 -6.2 L5 -6.2 L19 -13.2 L19 -15 L5 -8.2 L-5.5 -8.2 Z', '#cfd8e6', 'opacity=".85"');
    if (glint > 0) {
      h += P('M5 -6 L19 -13 L19 13 L5 6 Z', '#ffffff', `opacity="${f1(0.32 * glint)}"`);
      h += `<ellipse cx="19" cy="0" rx="2.9" ry="13" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="${f1(0.9 * glint)}"/>`;
    }
    g += G(h, `translate(${f1(HX + shk)},${HY}) rotate(${HROT}) scale(${HS})`);
    // светодиод
    if (led > 0) {
      g += Ci(LEDP[0], LEDP[1], 6.5 + 3 * led, 'url(#glowR)', `opacity="${f1(0.75 * Math.min(1, led))}"`);
      g += Ci(LEDP[0], LEDP[1], 1.35, talk > 0.2 ? '#ffd9d9' : C.red) + Ci(LEDP[0] - 0.4, LEDP[1] - 0.4, 0.5, '#ffd0d0', `opacity="${f1(Math.min(1, led))}"`);
    } else g += Ci(LEDP[0], LEDP[1], 1.1, '#2a1418');
    // блик от фонарика: звёздочка на кромке
    if (glint > 0.05) {
      const [sx, sy] = hornPt(19, -9);
      const s = 5 + 3 * glint;
      g += Ci(sx, sy, 12 * glint, 'url(#glowC)', `opacity="${f1(glint)}"`);
      g += P(`M${f1(sx)} ${f1(sy - s)} L${f1(sx + 0.8)} ${f1(sy - 0.8)} L${f1(sx + s)} ${f1(sy)} L${f1(sx + 0.8)} ${f1(sy + 0.8)} L${f1(sx)} ${f1(sy + s)} L${f1(sx - 0.8)} ${f1(sy + 0.8)} L${f1(sx - s)} ${f1(sy)} L${f1(sx - 0.8)} ${f1(sy - 0.8)} Z`, '#ffffff', `opacity="${f1(0.95 * glint)}"`);
    }
    // до пробуждения — снежный ком; при пробуждении дрожит и осыпается
    if (!awake || wakeAge < 0.2) {
      const tr = awake ? noise1(t * 55) * 1.6 : 0;
      let b = '';
      const lumps = [[90, 216, 6], [95.5, 209.5, 7], [103.5, 207.5, 7.2], [110.5, 211, 6.4], [111.5, 218.5, 5.4], [104, 221, 6.2], [95.5, 221.5, 5.6]];
      for (const [x, y, r] of lumps) if (y > 212 || x > 108) b += Ci(x + 1.2, y + 1.8, r, '#8c9bb6');
      for (const [x, y, r] of lumps) b += Ci(x, y, r, '#cfd8e6');
      b += P('M101 225.5 C106 226 111 224 114 220.5 C114 224.5 110 227.5 104 227.8 C99.5 228 96 226.5 94 225 C96.5 225.6 98.5 225.6 101 225.5 Z', '#9fb0c8', 'opacity=".9"');
      b += P('M89.5 210 C92 204 98 201.5 104 201.6', 'none', 'stroke="#eef3f9" stroke-width="1.6" opacity=".85" stroke-linecap="round"');
      b += `<ellipse cx="112.6" cy="224.4" rx="1.4" ry="4.6" fill="#141b29" opacity=".55" transform="rotate(30 112.6 224.4)"/>`;
      b += P('M97 227.5 L98.2 231 L99.3 227.6 Z M106 227.4 L106.9 230 L107.8 227.2 Z', '#b9c8dc', 'opacity=".8"');
      g += G(b, `translate(${f1(tr)},0)`);
    }
    return g;
  }
  // комки снега с рупора при пробуждении
  function hornClumps(wakeAge) {
    if (wakeAge < 0.2 || wakeAge > 1.4) return '';
    let g = '';
    const a = wakeAge - 0.2;
    for (let i = 0; i < 6; i++) {
      const x0 = 90 + hash(i * 3.1 + 2) * 28, y0 = 204 + hash(i * 5.3 + 1) * 22, r = 2.4 + hash(i * 7.7) * 2.2;
      const vx = -12 + hash(i * 2.9) * 30;
      const x = x0 + vx * a;
      const land = x <= 121 ? 238.5 : ridgeY(x) - 1;
      const tl = Math.sqrt(Math.max(0, 2 * (land - y0) / 900));
      if (a < tl) g += Ci(x, y0 + 450 * a * a, r, '#dfe6f0');
      else {
        const k = lin(a - tl, 0, 0.6);
        g += `<ellipse cx="${f1(x0 + vx * tl)}" cy="${f1(land + 0.5)}" rx="${f1(r * (1 + 0.6 * k))}" ry="${f1(r * (0.6 - 0.35 * k))}" fill="#dfe6f0" opacity="${f1(1 - k)}"/>`;
      }
    }
    return g;
  }

  // голое дерево за забором: силуэт, снег на верхней стороне веток, лёгкое покачивание от порывов
  function tree(x, y, t, gust) {
    let g = '', sn = '';
    const sway = (0.8 + 1.4 * gust) * Math.sin(t * 1.1) + 0.5 * noise1(t * 0.8 + 2);
    const br = (x0, y0, len, ang, w, d, seed) => {
      const a = rad(ang + sway * (6 - d) * 0.35);
      const x1 = x0 + len * Math.sin(a), y1 = y0 - len * Math.cos(a);
      g += L(x0, y0, x1, y1, '#050a16', f1(w), CAP);
      if (w > 0.7 && Math.abs(ang) > 12) sn += L(x0, y0 - w * 0.45, x1, y1 - w * 0.45, '#8e9dbc', f1(Math.max(0.6, w * 0.35)), `opacity=".35" ${CAP}`);
      if (d === 0) return;
      br(x1, y1, len * (0.66 + 0.14 * hash(seed)), ang - (14 + 16 * hash(seed * 2.3)), w * 0.64, d - 1, seed * 1.7 + 1);
      br(x1, y1, len * (0.68 + 0.14 * hash(seed * 3.1)), ang + (12 + 18 * hash(seed * 4.7)), w * 0.64, d - 1, seed * 2.3 + 2);
      if (d > 3 && hash(seed * 5.5) > 0.5) br(x1, y1, len * 0.5, ang + (hash(seed * 7.1) - 0.5) * 20, w * 0.5, d - 2, seed * 3.1 + 3);
    };
    br(x, y, 58, -4, 5.2, 6, 1.37);
    return g + sn;
  }

  // ---------------------------------------------------------------- сцена
  SCENES.yard_gate = function (u, p, d, t) {
    const tt = t + 0.5 * Math.sin(t * 0.9);                       // порывы метели
    const gust = 0.5 + 0.5 * Math.sin(t * 0.9 + 1.4);
    const siren = p.siren || null;
    const tCut = siren ? siren[1] : -NEVER;
    const sirenOn = !!siren && t >= siren[0] && t < siren[1];
    const tWake = has(p.tWake) ? p.tWake : -10;
    const awake = t >= tWake, wakeAge = t - tWake;
    const lampF = 1 + 0.06 * noise1(t * 6) + 0.03 * noise1(t * 17);

    // ---- мама: положение и поза
    const M = { vis: false, x: 240, y: 366, s: 54 / 46, pose: 'stand', ph: 0, alpha: 1 };
    if (has(p.tMom)) {
      const tS = has(p.tStop) ? p.tStop : p.tMom + 1.9;
      if (t >= p.tMom + 0.02) {
        const k = lin(t, p.tMom, tS), s = 1 - Math.pow(1 - k, 1.6);
        M.vis = true; M.x = mix(334, 240, s); M.pose = k < 1 ? 'walk' : 'stand'; M.ph = (334 - M.x) / 30 * 2 * Math.PI;
        M.alpha = mix(0.3, 1, lin(t, p.tMom, p.tMom + 0.4));
      }
    } else if (has(p.momX)) { M.vis = true; M.x = p.momX; }
    let runK = -1;
    if (M.vis && has(p.tRun) && has(p.runTo) && t >= p.tRun) {
      runK = lin(t, p.tRun, p.tRun + 1.0);
      const x0 = M.x, s = ease(runK) * 0.75 + runK * 0.25;
      M.x = mix(x0, p.runTo, s); M.pose = runK < 1 ? 'run' : 'stand'; M.ph = (x0 - M.x) / 27 * 2 * Math.PI;
    }
    M.y = momYAt(M.x);
    Object.assign(M, momPose(M));
    let hornE = 50;                                            // угол с телефона на устье рупора
    for (let i = 0; i < 3; i++) { const A = momArm(M, hornE), Oh = momWorld(M, A.tx, A.ty); hornE = deg(Math.atan2(Oh[1] - MOUTH[1], Oh[0] - MOUTH[0])); }

    // ---- угол луча фонарика (вверх от горизонтали, влево)
    let beamOn = 0, E = 0;
    const sweep = (t0, base, amp, per = 3) => base + amp * Math.sin(2 * Math.PI * (t - t0) / per);
    if (M.vis) {
      beamOn = 1;
      if (has(p.tMom)) E = sweep(p.tMom, -21, 9);                 // идёт: светит под ноги и вдоль двора, водит ±9°
      else E = sweep(0.4, 32, 5);                                // стоит: ищет по фасаду и козырьку, выше головы Тёмы
      if (runK >= 0) {
        const r1 = p.tRun + 1.0;
        E = mix(E, 38 + 2.2 * Math.sin(M.ph * 2), sstep(p.tRun - 0.1, p.tRun + 0.3, t));
        E = mix(E, sweep(r1, 38, 4, 3.4), sstep(r1 - 0.15, r1 + 0.5, t));
      }
      if (p.momLook === 'horn') E = hornE + 0.6 * noise1(t * 3);
      if (has(p.tPa)) E = mix(E, hornE + 0.5 * noise1(t * 4), ease(lin(t, p.tPa, p.tPa + 0.6)));
    }
    // луч по двору: с рупора вниз, в t1-0.4 нижний край в 4 px над макушкой Тёмы, дальше уходит обратно вверх
    const hushK = has(p.tHush) ? lin(t, p.tHush + 0.12, p.tHush + 0.42) : 0;
    const shoutK = has(p.tShout) ? lin(t, p.tShout, p.tShout + 0.2) : 0;
    const temaY = TY - 4 * eout(shoutK) * (1 - hushK) + HUSH_DY * ease(hushK);
    if (M.vis && p.beam) {
      const b0 = p.beam.t0, tm = p.beam.t1 - 0.4;
      // eMin: нижний край луча проходит через точку на 4 px выше пригнутой головы
      const topY = TY + HUSH_DY - TR - 4;
      let eMin = 25;
      for (let i = 0; i < 3; i++) {
        const A = momArm(M, eMin), O = momWorld(M, A.tx, A.ty);
        eMin = deg(Math.atan2(O[1] - topY, O[0] - TX)) + BEAM_H;
      }
      const e0 = E;
      const v = 1.6 * (e0 - eMin) / Math.max(0.5, tm - b0);       // скорость в нижней точке, °/с
      if (t >= b0 && t <= tm) E = mix(e0, eMin, Math.pow(lin(t, b0, tm), 1.6));
      else if (t > tm) { const dt = t - tm; E = Math.min(e0, eMin + v * dt + 26 * dt * dt); }   // не задерживаясь, уходит обратно вверх
    }
    const arm = momArm(M, E);
    const O = momWorld(M, arm.tx, arm.ty);
    // вспышка фонарика в калитке
    const flash = has(p.tMom) ? Math.exp(-Math.max(0, t - p.tMom) * 7) * (t >= p.tMom ? 1 : 0) : 0;
    const beamI = beamOn * (has(p.tMom) ? lin(t, p.tMom, p.tMom + 0.05) : 1);
    const beamPoly = () => {
      const pts = [[O[0], O[1]]];
      for (let i = 0; i <= 8; i++) {
        const a = rad(E - BEAM_H + i * (2 * BEAM_H / 8));
        pts.push([O[0] - BEAM_L * Math.cos(a), O[1] - BEAM_L * Math.sin(a)]);
      }
      return 'M' + pts.map(q => `${f1(q[0])} ${f1(q[1])}`).join(' L') + ' Z';
    };
    const wedge = (half, len) => {
      const a0 = rad(E - half), a1 = rad(E + half);
      return `M${f1(O[0])} ${f1(O[1])} L${f1(O[0] - len * Math.cos(a0))} ${f1(O[1] - len * Math.sin(a0))} A${len} ${len} 0 0 1 ${f1(O[0] - len * Math.cos(a1))} ${f1(O[1] - len * Math.sin(a1))} Z`;
    };
    // блик на рупоре
    let glint = 0;
    if (beamI > 0) {
      const ah = deg(Math.atan2(O[1] - MOUTH[1], O[0] - MOUTH[0])), dist = Math.hypot(O[0] - MOUTH[0], O[1] - MOUTH[1]);
      glint = beamI * Math.pow(clamp(1 - Math.abs(ah - E) / 9), 2) * (dist < BEAM_L + 10 ? 1 : 0);
    }

    // ---- defs
    let g = `<defs>
      <linearGradient id="gy_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03070f"/><stop offset=".55" stop-color="#071023"/><stop offset="1" stop-color="#0d1a36"/></linearGradient>
      <linearGradient id="gy_haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14224a" stop-opacity="0"/><stop offset="1" stop-color="#1c2f58" stop-opacity=".55"/></linearGradient>
      <linearGradient id="gy_glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#091530"/><stop offset="1" stop-color="#050b1b"/></linearGradient>
      <radialGradient id="gy_na"><stop offset="0" stop-color="#ffc070" stop-opacity=".85"/><stop offset=".35" stop-color="#ff9a3c" stop-opacity=".28"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
      <linearGradient id="gy_nac" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb25a" stop-opacity=".34"/><stop offset="1" stop-color="#ffb25a" stop-opacity=".02"/></linearGradient>
      <radialGradient id="gy_hz"><stop offset="0" stop-color="#3a2a52" stop-opacity=".5"/><stop offset="1" stop-color="#3a2a52" stop-opacity="0"/></radialGradient>
      <linearGradient id="gy_dr" gradientUnits="userSpaceOnUse" x1="0" y1="324" x2="0" y2="376"><stop offset="0" stop-color="#c8d3e4"/><stop offset=".45" stop-color="#aebbd2"/><stop offset="1" stop-color="#7d8caa"/></linearGradient>
      <radialGradient id="gy_sr" gradientUnits="userSpaceOnUse" cx="104" cy="236" r="300"><stop offset="0" stop-color="#d7263d" stop-opacity="1"/><stop offset=".5" stop-color="#d7263d" stop-opacity=".45"/><stop offset="1" stop-color="#d7263d" stop-opacity="0"/></radialGradient>
      <clipPath id="gy_up"><rect x="-20" y="-20" width="400" height="392"/></clipPath>
      <linearGradient id="gy_gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03060d" stop-opacity="0"/><stop offset="1" stop-color="#03060d" stop-opacity="1"/></linearGradient>
      <radialGradient id="gy_bg" gradientUnits="userSpaceOnUse" cx="${f1(O[0])}" cy="${f1(O[1])}" r="${BEAM_L}"><stop offset="0" stop-color="#f4f8ff" stop-opacity=".55"/><stop offset=".45" stop-color="#e6efff" stop-opacity=".22"/><stop offset="1" stop-color="#e6efff" stop-opacity="0"/></radialGradient>
      <radialGradient id="gy_bs" gradientUnits="userSpaceOnUse" cx="${f1(O[0])}" cy="${f1(O[1])}" r="${BEAM_L}"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset=".5" stop-color="#eef4ff" stop-opacity=".45"/><stop offset="1" stop-color="#eef4ff" stop-opacity="0"/></radialGradient>
      <clipPath id="gy_bc"><path d="${beamPoly()}"/></clipPath>
      <clipPath id="gy_nc"><path d="M323 175 L337 175 L392 360 L266 360 Z"/></clipPath>
    </defs>`;

    // ---- небо, дымка, дальние дома
    g += R(-20, -20, 400, 680, '#050b18') + R(-20, -20, 400, 392, 'url(#gy_sky)');
    g += `<ellipse cx="270" cy="340" rx="210" ry="110" fill="url(#gy_hz)"/>`;
    {
      let hs = '';
      for (const [x, top, w, seed] of [[128, 300, 66, 1], [190, 276, 58, 2], [244, 292, 50, 3], [292, 266, 90, 4]]) {
        hs += R(x, top, w, 360 - top, '#0a1530');
        hs += R(x, top - 2, w, 2.5, '#2a3a58', 'opacity=".6"');
        for (let i = 0; i < 14; i++) {
          if (hash(i * 3.7 + seed * 11) > 0.22) continue;
          const wx = x + 5 + Math.floor(hash(i * 1.3 + seed) * (w - 12) / 8) * 8, wy = top + 8 + Math.floor(hash(i * 2.1 + seed * 5) * (340 - top - 20) / 10) * 10;
          hs += R(wx, wy, 3, 4, '#f3b85a', `opacity="${f1(0.28 + 0.2 * hash(i + seed))}"`);
        }
      }
      g += hs;
    }
    g += tree(272, 354, t, gust);
    g += R(0, 100, 360, 272, 'url(#gy_haze)');
    g += G(snow(0, 0, 360, 372, tt, 80, 3, -46, 0.34));

    // ---- натриевый фонарь за забором
    {
      const fl = 1 + 0.05 * noise1(t * 5 + 4);
      g += P('M323 175 L337 175 L392 360 L266 360 Z', 'url(#gy_nac)', `opacity="${f1(0.9 * fl)}"`);
      g += P('M326 175 L334 175 L366 360 L292 360 Z', 'url(#gy_nac)', `opacity="${f1(0.5 * fl)}"`);
      g += `<ellipse cx="330" cy="358" rx="74" ry="8" fill="url(#gy_na)" opacity="${f1(0.55 * fl)}"/>`;
      g += R(342.8, 168, 3, 192, '#070c19') + P('M344.3 170 Q344.3 162 336 162 L332 162', 'none', 'stroke="#070c19" stroke-width="2.6"');
      g += P('M324 162.5 H338 L335 168.5 H327 Z', '#0d1830') + `<ellipse cx="331" cy="169.5" rx="4.4" ry="1.8" fill="#ffd9a0"/>`;
      g += Ci(331, 172, 70 * fl, 'url(#gy_na)', 'opacity=".55"');
      // тёплый снег в конусе
      let w = '';
      for (let i = 0; i < 34; i++) {
        const sp = 26 + hash(i * 3.3 + 21) * 34, r = 0.7 + hash(i * 7.1 + 21) * 1.1;
        const yy = 175 + (hash(i * 1.9 + 21) * 185 + tt * sp) % 185;
        const xx = 262 + ((hash(i * 5.7 + 21) * 130 - tt * 52 + Math.sin(t * 1.3 + i) * 4) % 130 + 130) % 130;
        w += Ci(xx, yy, r, `rgba(255,214,160,${f1(0.5 + 0.45 * hash(i * 9.9 + 21))})`);
      }
      g += G(w, '', 'clip-path="url(#gy_nc)"');
    }

    // ---- забор и калитка
    {
      let fc = '';
      for (let x = 252; x < 366; x += 7) {
        if (x > 287 && x < 334) continue;
        fc += R(x, 331, 1.9, 28, '#080f1e') + P(`M${x - 0.6} 331 L${x + 0.95} 327.5 L${x + 2.5} 331 Z`, '#080f1e');
      }
      for (const [a, b] of [[248, 290], [332, 370]]) fc += R(a, 337, b - a, 2, '#080f1e') + R(a, 351, b - a, 2, '#080f1e') + R(a, 336.2, b - a, 0.9, '#cfd8e6', 'opacity=".3"');
      fc += R(246, 326, 5, 34, '#0f1a30') + R(245, 323, 7, 3.6, '#cfd8e6', 'opacity=".55" rx="1.4"');
      // створка калитки: открывается внутрь двора к tMom
      const op = has(p.tMom) ? ease(lin(t, p.tMom - 0.15, p.tMom + 0.35)) : (has(p.momX) ? 1 : 0);
      const lw = 30 * (1 - 0.72 * op);
      let lf = '';
      for (let i = 0; i <= 4; i++) { const x = 326 - (i / 4) * lw; lf += R(x - 0.9, 333 + op * i * 0.6, 1.8, 24 + op * i * 0.8, '#0b1427'); }
      lf += R(326 - lw, 338, lw, 1.8, '#0b1427') + R(326 - lw, 350, lw, 1.8, '#0b1427');
      fc += lf;
      fc += R(289, 322, 6, 38, '#0f1a30') + R(287.5, 318.5, 9, 4.2, '#cfd8e6', 'opacity=".6" rx="1.5"');
      g += fc;
    }

    // ---- снег двора
    g += P('M96 351 C170 346 262 348 380 352 V384 H96 Z', '#1a2843') + P('M96 351 C170 346 262 348 380 352', 'none', 'stroke="#cfd8e6" stroke-width="1.3" opacity=".26"');
    g += P('M120 362 C200 357 290 359 380 362 V384 H120 Z', '#233352') + P('M120 362 C200 357 290 359 380 362', 'none', 'stroke="#cfd8e6" stroke-width="1.3" opacity=".3"');
    g += `<ellipse cx="318" cy="361" rx="60" ry="6" fill="url(#gy_na)" opacity=".4"/>`;
    // следы мамы
    if (M.vis) {
      let fp = '';
      const startX = 318, endX = M.x + 6;
      for (let k = 0; ; k++) {
        const x = startX - k * 7.2;
        if (x < endX) break;
        fp += `<ellipse cx="${f1(x)}" cy="${f1(momYAt(x) + (k % 2 ? 1.1 : -0.6))}" rx="2.5" ry="1.3" fill="#0f1a30" opacity=".9"/>`;
      }
      g += fp;
    }

    // ---- фасад
    {
      let f = '';
      f += R(-20, 92, 138, 290, '#0d1830');
      for (const y of [124, 158, 192, 226]) f += L(-20, y, 114, y, '#0a1426', 1.4);
      for (let row = 0; row < 4; row++) for (const x of (row % 2 ? [30, 72] : [8, 50, 94])) f += L(x, 92 + row * 34 + (row ? 0 : 0), x, 124 + row * 34, '#0a1426', 1.1);
      f += R(114.5, 92, 3.5, 290, '#14213a') + L(118, 92, 118, 380, '#22314d', 1);
      // парапет со снегом
      f += R(-20, 88, 140, 6, '#16233b') + P('M-20 89 C10 84.5 40 86.5 70 84.8 C92 83.8 110 85.4 121 87.6 L121 89.5 L-20 89.5 Z', '#cfd8e6', 'opacity=".62"');
      // окно 214 (закрыто)
      f += R(10, 124, 78, 66, '#24324d') + R(14, 128, 70, 58, 'url(#gy_glass)');
      f += P('M22 186 L48 128 L60 128 L34 186 Z', '#9fd0ff', 'opacity=".05"') + P('M58 186 L76 146 L81 146 L63 186 Z', '#ffb35a', 'opacity=".05"');
      f += R(47.5, 128, 3, 58, '#24324d') + R(14, 150, 70, 3, '#24324d');
      f += R(16, 147, 30, 2.4, '#cfd8e6', 'opacity=".35" rx="1"') + R(52, 147, 30, 2.4, '#cfd8e6', 'opacity=".3" rx="1"');
      f += R(6, 190, 86, 4.5, '#2f3f5e') + P('M6 190.5 C24 187.5 50 188.6 70 187.6 C80 187.2 88 188 92 190.5 Z', '#dfe6f0', 'opacity=".85"');
      f += R(6, 194.5, 86, 1.6, '#0a1426');
      g += f;
    }
    // ---- рупор
    const callArrive = has(p.tCall) ? p.tCall + 0.7 : NEVER;
    const talk = (has(p.tPa) && t >= p.tPa && t < (has(p.paEnd) ? p.paEnd : p.tPa + 2.5)) ? 1 : 0;
    let led = 0;
    if (awake) {
      led = lin(wakeAge, 0.32, 0.4) * (0.55 + 0.45 * Math.sin(t * 3.2));
      if (wakeAge > 0.32 && wakeAge < 0.7) led += 1.2 * (1 - lin(wakeAge, 0.32, 0.7));
      if (t >= callArrive && t < callArrive + 0.3) led *= 1.5;
      if (talk) led = 0.9 + 0.2 * Math.abs(noise1(t * 9));
    }
    g += hornSvg(t, { awake, wakeAge, talk, glint, led });
    if (awake && !talk && !sirenOn) {
      const dense = t >= callArrive && t < callArrive + 2.2;
      g += rings(MOUTH[0], MOUTH[1], t, { n: dense ? 3 : 2, r0: 6, r1: dense ? 44 : 38, col: '#ff4a4a', a: dense ? 0.5 : 0.35 * lin(wakeAge, 0.35, 0.8), dir: -1, speed: dense ? 1.0 : 0.6, w: 1.2 });
    }

    // ---- козырёк, колонна, вход
    {
      let c = '';
      c += R(-20, 254, 124, 128, '#0a1324');
      c += Ci(60, 266, 74, 'url(#glowW)', `opacity="${f1(0.2 * lampF)}"`);
      // дверь: две створки, цепь с замком на скобах
      c += R(-20, 262, 70, 120, '#16213a') + R(-20, 266, 66, 116, '#0b0f1a');
      c += R(-10, 270, 26, 30, '#050a16') + R(22, 270, 22, 30, '#050a16') + L(19, 266, 19, 382, '#16213a', 1.6);
      c += P('M24 300 L33 270 L37 270 L28 300 Z', '#ffd9a0', 'opacity=".05"');
      c += R(13.6, 300, 2.6, 26, '#5d6676', 'rx="1.2"') + R(21.8, 300, 2.6, 26, '#5d6676', 'rx="1.2"');
      // цепь крест-накрест через скобы и висячий замок (как в ч.1)
      c += P('M13.2 304 Q19 311 25 317.5 M25 304 Q19 311 13.2 317.5', 'none', 'stroke="#8a96ad" stroke-width="1.5" stroke-dasharray="2.2 1.1"');
      c += P('M12.6 309.5 Q19 312.5 25.6 309.5', 'none', 'stroke="#aeb7c6" stroke-width="1.3" stroke-dasharray="2 1.1"');
      c += P('M17 322 V318.5 Q17 315.8 19.2 315.8 Q21.4 315.8 21.4 318.5 V322', 'none', 'stroke="#aeb7c6" stroke-width="1.1"') + R(15.6, 321, 7.2, 6, '#8a96ad', 'rx="1.2"') + Ci(19.2, 323.6, 0.7, '#2a2f3a');
      c += Ci(16.6, 322.4, 0.9, '#ffffff', `opacity="${f1(0.5 + 0.4 * Math.max(0, noise1(t * 2.3 + 5)))}"`);
      // окно вахты: тёмное стекло, две решётки
      c += R(55, 285, 46, 48, '#1a2438') + R(58, 288, 40, 42, '#050a16');
      c += P('M62 330 L78 288 L83 288 L67 330 Z', '#ffd9a0', 'opacity=".04"');
      if (has(p.eyes)) {
        // пасхалка: два глаза; гаснут, когда по окну проходит луч
        const ex = 76.5, ey = 303.5;
        let lit = 0;
        if (beamI > 0) { const ae = deg(Math.atan2(O[1] - ey, O[0] - ex)); lit = clamp(1 - Math.abs(ae - E) / BEAM_H) > 0 ? 1 : 0; }
        const blink = (t > p.eyes + 1.6 && t < p.eyes + 1.72) ? 0.1 : 1;
        const ea = 0.55 * lin(t, p.eyes, p.eyes + 0.35) * blink * (1 - 0.9 * lit);
        if (ea > 0) c += Ci(ex - 2.3, ey, 1.3, `rgba(230,236,245,${f1(ea)})`) + Ci(ex + 2.3, ey, 1.3, `rgba(230,236,245,${f1(ea)})`) + Ci(ex, ey, 7, 'url(#glowC)', `opacity="${f1(ea * 0.25)}"`);
      }
      c += L(71, 288, 71, 330, '#2a3550', 1.7) + L(85, 288, 85, 330, '#2a3550', 1.7);
      c += R(53, 331, 50, 3, '#22314d');
      // козырёк со снежной шапкой и сосульками
      c += R(-20, 246, 141, 8, '#2a3a58') + L(-20, 246.7, 121, 246.7, '#3b4f75', 1) + R(-20, 254, 141, 1.6, '#16213a');
      c += P('M-20 247 L-20 239.5 C0 236.5 22 238.8 42 237.2 C62 235.8 84 238.2 100 236.6 C110 235.8 119 237 122 240.5 C123.8 243.5 122 246.6 119 247 Z', '#cfd8e6', 'opacity=".93"');
      c += P('M-20 242 C10 240.5 50 242 80 241 C100 240.5 115 241.8 122 243', 'none', 'stroke="#9fb0c8" stroke-width="1.2" opacity=".5"');
      for (let i = 0; i < 11; i++) {
        const x = 40 + i * 7.6 + hash(i * 2.2) * 3, len = 2.5 + hash(i * 4.9) * 4 + (i > 6 ? 4 * hash(i) : 0);
        c += P(`M${f1(x - 1.3)} 255 L${f1(x + 1.3)} 255 L${f1(x)} ${f1(255 + len)} Z`, '#b9c8dc', 'opacity=".75"');
      }
      // лампа под козырьком
      c += R(55.5, 255, 9, 2.6, '#3a4560') + Ci(60, 259, 2.2, '#ffe9b0') + Ci(60, 262, 40 * lampF, 'url(#glowW)', `opacity="${f1(0.35 * lampF)}"`);
      // колонна
      c += R(104, 255, 7, 127, '#16233b') + L(110.3, 255, 110.3, 382, '#22314d', 1) + R(102.5, 254.5, 10, 3, '#1d2b46');
      g += c;
    }
    g += hornClumps(wakeAge);

    // ---- мама
    if (M.vis) {
      const pa = has(p.tPa) ? ease(lin(t, p.tPa, p.tPa + 0.4)) : 0;
      let look = 4 + 3 * Math.sin(t * 0.7);
      if (has(p.tMom) && !has(p.momX)) look = mix(2, 8, lin(t, (p.tStop || p.tMom + 1.9) - 0.3, (p.tStop || p.tMom + 1.9) + 0.4));
      if (p.momLook === 'horn') look = 15;
      look = mix(look, 15, pa);
      const callK = has(p.tCall) ? lin(t, p.tCall - 0.05, p.tCall + 0.15) * (1 - lin(t, p.tCall + 0.95, p.tCall + 1.2)) : 0;
      const rim = clamp(1 - Math.abs(M.x - 318) / 48);
      g += G(momFig(M, E, { look, call: callK, mouth: callK, rim }), '', `opacity="${f1(M.alpha)}"`);
      if (has(p.tMom) && t < p.tMom + 0.6) g += R(327, 322, 6, 38, '#0f1a30') + R(325.5, 318.5, 9, 4.2, '#cfd8e6', 'opacity=".6" rx="1.5"');
    }
    if (!(M.vis && has(p.tMom) && t < p.tMom + 0.6)) g += R(327, 322, 6, 38, '#0f1a30') + R(325.5, 318.5, 9, 4.2, '#cfd8e6', 'opacity=".6" rx="1.5"');

    // ---- луч фонарика: объём (рисуется до сугроба — сугроб и Тёма его перекрывают)
    if (beamI > 0) {
      g += G(P(wedge(BEAM_H, BEAM_L), 'url(#gy_bg)', `opacity="${f1(0.55 * beamI)}"`) +
        P(wedge(BEAM_H * 0.62, BEAM_L * 0.96), 'url(#gy_bg)', `opacity="${f1(0.55 * beamI)}"`) +
        P(wedge(BEAM_H * 0.28, BEAM_L * 0.9), 'url(#gy_bg)', `opacity="${f1(0.6 * beamI)}"`), '', 'clip-path="url(#gy_up)"');
      // освещённые поверхности в конусе: фасад, козырёк, двор
      g += G(R(-20, 88, 138, 294, 'url(#gy_bs)', 'opacity=".55"') + P('M96 351 C170 346 262 348 380 352 V372 H96 Z', 'url(#gy_bs)', 'opacity=".5"'), '', 'clip-path="url(#gy_bc)"');
    }

    // ---- Тёма и сугроб
    {
      const mouth = has(p.tShout) ? lin(t, p.tShout + 0.05, p.tShout + 0.2) * (1 - lin(t, has(p.tHush) ? p.tHush : NEVER, (has(p.tHush) ? p.tHush : NEVER) + 0.12)) : 0;
      const hand = has(p.tHush) ? lin(t, p.tHush - 0.02, p.tHush + 0.16) : 0;
      g += temaHead(TX, temaY, { mouth, hand, t });
      let s = '';
      s += P(DRIFT, 'url(#gy_dr)');
      s += P('M142 329.5 C153 328 164 334 174 347 C181 356 185 366 192 376 L146 376 C158 362 154 340 142 329.5 Z', '#8c9bb6', 'opacity=".5"');
      s += P('M96 328.5 C102 331 107 338.5 118 338.8 C129 339 134 331 142 329.5 C134 334.5 127 342 118 342.2 C108 342 102 334.5 96 328.5 Z', '#8c9bb6', 'opacity=".85"');
      s += P('M-24 352 C20 344 70 346 120 352 C150 356 170 362 186 372', 'none', 'stroke="#8c9bb6" stroke-width="1.2" opacity=".35"');
      s += P(RIDGE_D, 'none', 'stroke="#f2f6fb" stroke-width="1.7" opacity=".7" stroke-linecap="round"');
      s += Ci(52, 334, 62, 'url(#glowW)', `opacity="${f1(0.22 * lampF)}"`);
      // комья снега у вмятины (падение)
      for (const [x, y, r] of [[146, 333, 2.6], [152, 338, 1.8], [90, 330, 2.0], [139, 341, 1.4], [160, 342, 1.6], [128, 345, 1.2]]) s += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f1(r * 0.7)}" fill="#dbe3ef"/>` + `<ellipse cx="${x + 0.5}" cy="${f1(y + r * 0.4)}" rx="${r}" ry="${f1(r * 0.35)}" fill="#8c9bb6" opacity=".5"/>`;
      // искры на насте
      for (let i = 0; i < 9; i++) {
        const x = 4 + hash(i * 3.9) * 160, y = ridgeY(x) + 4 + hash(i * 6.1) * 22;
        const a = Math.max(0, Math.sin(t * (1.6 + hash(i) * 2) + i * 2.1));
        s += Ci(x, y, 0.7, '#ffffff', `opacity="${f1(0.7 * a * a)}"`);
      }
      if (sirenOn) s += P(DRIFT, `rgba(215,38,61,${f1(0.12 + 0.1 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 1.5 * t)))})`);
      g += s;
      if (beamI > 0) g += G(P(DRIFT, 'url(#gy_bs)', 'opacity=".6"'), '', 'clip-path="url(#gy_bc)"');
    }

    // ---- метель: ближний слой, снег в луче, позёмка с гребня, полосы порывов
    g += G(snow(0, 0, 360, 380, tt, 60, 11, -92, 0.72));
    {
      let fg = '';
      for (let i = 0; i < 18; i++) {
        const sp = 70 + hash(i * 3.7 + 9) * 60, r = 1.3 + hash(i * 6.1 + 9) * 1.5;
        const yy = (hash(i * 1.1 + 9) * 400 + tt * sp) % 400, xx = (((hash(i * 4.3 + 9) * 400 - tt * 110 + Math.sin(t * 1.7 + i) * 8) % 400) + 400) % 400 - 20;
        if (yy > 376) continue;
        fg += Ci(xx, yy, r, `rgba(225,234,248,${f1(0.25 + 0.3 * hash(i * 8.8 + 9))})`);
      }
      g += fg;
    }
    if (beamI > 0) g += G(snow(0, 0, 360, 380, tt, 60, 11, -92, 1) + snow(0, 0, 360, 372, tt, 80, 3, -46, 1) + snow(0, 0, 360, 380, tt, 40, 27, -70, 1), '', `clip-path="url(#gy_bc)" opacity="${f1(beamI)}"`);
    for (let i = 0; i < 10; i++) {
      const age = (t * 0.8 + hash(i * 1.7)) % 1, x0 = 10 + hash(i * 4.4) * 150;
      const x = x0 - age * (40 + 50 * gust), y = ridgeY(x0) - 1 - age * 10 - Math.sin(age * 6 + i) * 2;
      g += Ci(x, y, 0.6 + 0.6 * hash(i * 2.2), `rgba(230,238,250,${f1(0.5 * gust * Math.sin(age * Math.PI))})`);
    }
    for (let i = 0; i < 9; i++) {
      const sp = 150 + hash(i * 1.7) * 110, xx = (((hash(i * 4.1) * 520) - tt * sp) % 520 + 520) % 520 - 80, yy = 110 + hash(i * 2.3) * 240;
      g += L(xx, yy, xx + 30 + hash(i) * 20, yy + 4, `rgba(210,222,240,${f1(0.05 + 0.08 * gust)})`, 1, CAP);
    }

    // ---- линза фонарика и вспышка
    if (beamI > 0) {
      g += Ci(O[0], O[1], 9, 'url(#glowC)', `opacity="${f1(0.9 * beamI)}"`) + Ci(O[0], O[1], 1.3, '#ffffff', `opacity="${f1(beamI)}"`);
      if (flash > 0.02) {
        const s = 14 * flash + 3;
        g += Ci(O[0], O[1], 30 * flash + 6, 'url(#glowC)', `opacity="${f1(flash)}"`);
        g += L(O[0] - s, O[1], O[0] + s, O[1], '#ffffff', 1.1, `opacity="${f1(flash)}"`) + L(O[0], O[1] - s * 0.6, O[0], O[1] + s * 0.6, '#ffffff', 1, `opacity="${f1(flash)}"`);
      }
    }

    // ---- пар: Тёма и мама
    {
      const mx = TX + 8.5 * TK, my = temaY + 3.5 * TK;
      const hushT = has(p.tHush) ? p.tHush : NEVER;
      if (t < tCut || !siren) {
        if (siren) g += breath(t, mx, my, 1.6, 1.35, 1, 4, 1, 0.62, -NEVER, Math.min(tCut, hushT));
      }
      if (t >= tCut || !siren) g += breath(t, mx, my, 2.4, 1.2, 1, 8, 0.9, 0.31, siren ? tCut : -NEVER, hushT - 0.3);
      if (has(p.tShout)) g += puff(mx + 1, my, t - p.tShout - 0.1, 1.5, 1, 13, 1.2, 0.95);
      if (M.vis) {
        const hd = momWorld(M, -5.2, M.sh - 4.4);
        const paFrom = has(p.tPa) ? p.tPa : NEVER, paTo = has(p.paEnd) ? p.paEnd : NEVER;
        const per = (M.pose === 'stand') ? 1.6 : 1.2;
        // во время голоса из рупора мама замирает и не дышит
        g += breath(t, hd[0], hd[1], per, 1.1, -1, 21, 0.85, 0.4, has(p.tMom) ? p.tMom + 0.3 : -NEVER, paFrom - 0.2);
        if (paTo < NEVER) g += breath(t, hd[0], hd[1], per, 1.1, -1, 21, 0.85, 0.4, paTo, NEVER);
      }
    }

    // ---- сирена: плавный красный пульс и кольца из рупора; в tCut пропадают в один кадр
    if (sirenOn) {
      const a = 0.08 + 0.12 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 1.5 * t));
      g += R(-20, -20, 400, 392, `rgba(215,38,61,${f1(a * 0.3)})`) + R(-20, -20, 400, 392, 'url(#gy_sr)', `opacity="${f1(Math.min(1, a * 1.7))}"`);
      for (let k = Math.floor(t * 2) - 3; k <= Math.floor(t * 2); k++) {
        const born = k / 2, age = t - born, life = 1.4;
        if (age < 0 || age > life || born < siren[0] - 1.4) continue;
        const e = age / life;
        g += Ci(MOUTH[0], MOUTH[1], mix(10, 140, e * 0.65 + eout(e) * 0.35), 'none', `stroke="${Math.abs(k) % 2 ? '#ff4a4a' : '#f2f5fa'}" stroke-width="${f1(1.6 - 0.8 * e)}" opacity="${f1(0.5 * (1 - e))}"`);
      }
    }
    // ---- голос из рупора к маме: широкие бледные дуги
    if (has(p.tPa) && M.vis && t >= p.tPa) {
      const hd = momWorld(M, -1, M.sh - 6);
      const dir = deg(Math.atan2(hd[1] - MOUTH[1], hd[0] - MOUTH[0]));
      const pEnd = has(p.paEnd) ? p.paEnd : p.tPa + 2.5;
      const kn = Math.floor((t - p.tPa) * 2);
      for (let k = kn - 3; k <= kn; k++) {
        const born = p.tPa + k / 2, age = t - born, life = 1.3;
        if (k < 0 || age < 0 || age > life || born > pEnd - 0.1) continue;
        const e = age / life;
        g += arc(MOUTH[0], MOUTH[1], mix(20, 220, e), dir, 38 - 10 * e, '#dfe6f0', 4 - 2 * e, 0.45 * Math.pow(1 - e, 0.9) * lin(e, 0, 0.05));
      }
    }
    // ---- крик мамы: три белые дуги летят к рупору
    if (M.vis && has(p.tCall)) {
      const mh = momWorld(M, -5.4, M.sh - 4.2);
      const dist = Math.hypot(mh[0] - MOUTH[0], mh[1] - MOUTH[1]);
      const dir = deg(Math.atan2(MOUTH[1] - mh[1], MOUTH[0] - mh[0]));
      for (let i = 0; i < 3; i++) {
        const age = t - (p.tCall + i * 0.12), life = 0.58;
        if (age < 0 || age > life) continue;
        const e = age / life;
        g += arc(mh[0], mh[1], mix(5, dist - 4, eout(e)), dir, 22 - 8 * e, '#ffffff', 1.8 - 0.6 * e, 0.9 * (1 - e * e));
      }
    }

    // ---- зона субтитров: тёмная
    g += R(-20, 368, 400, 54, 'url(#gy_gf)') + R(-20, 420, 400, 260, '#03060d');
    return g;
  };
})();

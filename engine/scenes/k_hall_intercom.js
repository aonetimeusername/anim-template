// сцена hall_intercom: тёмная прихожая. Слева вешалка с куртками и трубка видеодомофона, справа входная дверь с глазком; Саша в полный рост (≈120)
//   p.at      — ключи позиции [[t, 'screen'|'door'], ...]: переход шагом за 0.8 с; у экрана смотрит в экран, у двери наклоняется к глазку
//   p.ring    — [[t0, t1]] домофон звонит: экран мигает «ВЫЗОВ», вокруг трубки дуги звука
//   p.flicker — [[t0, t1]] полоска света из-под двери (лампа на площадке) мигает; вместе с ней мигает лампа на картинке экрана и огонёк глазка
//   p.knock   — [t, ...] дверь вздрагивает (+1.5 px), с косяка сыплется пыль
//   p.peepOff — абсолютное t: огонёк глазка и его отсвет гаснут навсегда, независимо от flicker
//   p.bare    — true: без цепочки, задвижки и вертушки; остаются ручка, цилиндр под ключ и глазок
(() => {
  const CAP = 'stroke-linecap="round" stroke-linejoin="round"';
  const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const FY = 348;                                   // пол под Сашей
  const FL = 332;                                   // линия пола у стены
  const SCR = { x: 78, y: 230 };                    // центр экрана домофона
  const DR = { x: 214, y: 176, w: 82, h: 156 };     // дверь
  const PEEP = { x: 247, y: 242 };
  const POS = { screen: { x: 128, f: -1, lean: 3 }, door: { x: 214, f: 1, lean: 20 } };
  const SKIN = '#c79f86', SKIN2 = '#9d7766', HAIRC = '#15110f';
  const TEE = '#7d8596', TEE2 = '#586072', JEAN = '#202840', JEAN2 = '#151b2d', SHOE = '#10141e';
  const FACE = 'M-9 -2 C-9 -9 -4 -11 1 -11 C7 -11 10 -7 10.2 -3 L10.8 0.6 L12.4 3.4 L10.6 4.6 L10.5 6.2 L9.6 7.2 L9.9 8.6 C8.6 10.6 5 11.4 1.5 11 C-3 10.6 -7 7 -9 2 Z';
  const HAIR = 'M-9.6 5 C-12 -2 -11 -10 -3 -12.6 C-1 -14.6 1.5 -13 2.6 -14.6 C4.6 -13 6.2 -13.6 7.4 -12 C9.6 -11 11.2 -8 10.4 -4 C9.4 -6 8 -6.4 6.4 -5.4 C5.6 -7 3.6 -6.6 2.4 -5.2 C1.2 -6.4 -0.8 -5.4 -1.4 -3.6 C-3 -3.8 -4.4 -2.6 -4.6 -0.4 C-5.6 0.6 -7 3.4 -7.2 6 Z M-6 -12 L-8.6 -16.4 L-3.4 -13.2 Z M0.2 -13.6 L1.6 -18 L3.6 -14 Z M4.6 -13 L8 -16 L7.6 -11.6 Z';
  const TORSO = 'M-10 -96 C-11.4 -84 -10.5 -70 -9.8 -57 L10 -57 C10.5 -70 11.8 -84 9.3 -96 C5 -99.4 -5 -99.4 -10 -96 Z';

  const arm = (S, a1, a2, sl, sk) => {
    const sa = Math.sin(a1), ca = Math.cos(a1);
    const E = [S[0] + 24 * sa, S[1] + 24 * ca], W = [E[0] + 23 * Math.sin(a2), E[1] + 23 * Math.cos(a2)];
    const M = [S[0] + 12 * sa, S[1] + 12 * ca];
    return L(S[0], S[1], M[0], M[1], sl, 9.4, CAP) +
      P(`M${f1(M[0])} ${f1(M[1])} L${f1(E[0])} ${f1(E[1])} L${f1(W[0])} ${f1(W[1])}`, 'none', `stroke="${sk}" stroke-width="5.4" ${CAP}`) +
      Ci(W[0], W[1], 3.2, sk);
  };
  // двухзвенная обратная кинематика: возвращает углы (от «вниз», + к +x)
  const ik = (S, T, l1 = 24, l2 = 23) => {
    const dx = T[0] - S[0], dy = T[1] - S[1];
    const d = clamp(Math.hypot(dx, dy), 6, l1 + l2 - 0.5);
    const th = Math.atan2(dx, dy), al = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const a1 = th - al, E = [S[0] + l1 * Math.sin(a1), S[1] + l1 * Math.cos(a1)];
    return [a1, Math.atan2(T[0] - E[0], T[1] - E[1])];
  };

  function sasha(t, st) {
    const { X, sx, lean, ph, amp, dW, glow, ls, blink, peepL } = st;
    const bob = Math.abs(Math.sin(ph)) * 1.3 * amp + Math.sin(t * 2.1) * 0.25;
    const sg = sx < 0 ? -1 : 1;
    const sw = Math.max(Math.abs(sx), 0.04) * sg;
    // ноги
    const legs = (th, kn, c1, c2) => G(
      P('M-5.6 0 C-6.2 12 -5.4 22 -4.8 28 L5.2 28 C5.8 22 6.6 12 5.8 0 Z', c1) +
      G(P('M-4.8 -0.5 L-4.3 27.5 L4.3 27.5 L4.8 -0.5 Z', c1) +
        P('M-4.8 21 L-4.4 27.5 L-5.6 27.5 L-5.6 30 L14.6 30 Q15.6 28.4 13 27.4 L6 25 L5 21 Z', SHOE) +
        R(-5.6, 28.4, 20.4, 1.7, '#c9d0dc', 'rx=".8"') + P('M7 25.6 Q11 26.4 13.4 27.4', 'none', 'stroke="#2a3040" stroke-width=".9"'), 'translate(0,28) rotate(' + f1(kn) + ')') +
      '', 'translate(0,-58) rotate(' + f1(-th) + ')');
    const sP = Math.sin(ph) * amp, cP = Math.cos(ph) * amp;
    let g = '';
    g += legs(-5 * (1 - amp) - 26 * sP, 4 + 30 * Math.max(0, -cP), JEAN2, JEAN2);
    g += legs(2 * (1 - amp) + 26 * sP, 2 + 30 * Math.max(0, cP), JEAN, JEAN);
    // туловище
    const hang1 = 0.07 + 0.03 * Math.sin(t * 2.1), hang2 = 0.22 + 0.04 * Math.sin(t * 2.1 + 1);
    // цель руки на двери, переводим из мира в локаль торса
    const Lr = lean * Math.PI / 180, hipY = FY - bob;
    const wx = 250, wy = 277;
    const lx = (wx - X) * sg, ly = wy - hipY + 58;
    const T = [lx * Math.cos(Lr) + ly * Math.sin(Lr), -lx * Math.sin(Lr) + ly * Math.cos(Lr) - 58];
    const S1 = [0, -93];
    const [i1, i2] = ik(S1, T);
    const sw1 = 0.5 * amp * sP;
    const nA1 = mix(hang1 + 0.5 * amp * sP, i1, dW), nA2 = mix(hang2 + 0.45 * amp * sP, i2, dW);
    const fA1 = -0.08 - 0.5 * amp * sP + 0.04 * Math.sin(t * 2.1 + 2), fA2 = -0.04 - 0.4 * amp * sP;
    const hy = -108.5 - 4.5 * dW, hx = 3 + 6 * dW, pitch = 3 + 9 * dW + noise1(t * 0.7 + 4) * 1.4;
    const eyeRy = (1.6 * (1 - blink)) * mix(1, 0.62, dW);
    const hd = G(
      P(FACE, SKIN) + `<ellipse cx="-2.2" cy="1.8" rx="2.1" ry="3" fill="${SKIN2}"/>` +
      `<g clip-path="url(#hi_cHead)"><g transform="scale(${ls} 1)">${R(-10, -12, 24, 24, 'url(#hi_fLight)', `opacity="${f1(glow)}"`)}</g></g>` +
      P(HAIR, HAIRC) +
      P('M6.8 -12 C9.6 -11 11.2 -8 10.4 -4', 'none', `stroke="#9cc4f0" stroke-width=".8" opacity="${f1(glow * (ls > 0 ? 0.7 : 0.05))}" ${CAP}`) +
      `<ellipse cx="5.6" cy="-2.2" rx="1.1" ry="${f1(Math.max(eyeRy, 0.18))}" fill="#12141b"/>` +
      Ci(6, -2.8, 0.36, '#e8f2ff', `opacity="${f1(glow * 0.9 * (1 - blink))}"`) +
      L(3.6, -5.2, 7.8, -5.7, HAIRC, 1, CAP) + L(8.2, 6.6, 10, 6.6, '#6d4a45', 0.7, CAP) +
      (peepL > 0 ? Ci(8, -2.4, 7, 'url(#hi_peepG)', `opacity="${f1(peepL)}"`) : ''),
      `translate(${f1(hx)},${f1(hy)}) rotate(${f1(pitch)}) scale(.95)`);
    // шея: от основания шеи на плечах до точки под черепом (в системе головы), толстая линия — не рвётся при любом наклоне
    const pr = pitch * Math.PI / 180, nb = [-1.5, 4.5];
    const nx = hx + 0.95 * (nb[0] * Math.cos(pr) - nb[1] * Math.sin(pr)), ny = hy + 0.95 * (nb[0] * Math.sin(pr) + nb[1] * Math.cos(pr));
    const neck = L(0.3, -94, nx, ny, SKIN2, 7.4, CAP) + L(0.3, -94, nx, ny, SKIN2, 7.4, CAP);
    const torso = G(
      arm(S1, fA1, fA2, TEE2, SKIN2) +
      neck +
      P(TORSO, TEE) + P('M2 -96 C4 -90 4.6 -70 4.4 -57 L10 -57 C10.5 -70 11.8 -84 9.3 -96 Z', TEE2, 'opacity=".5"') +
      P('M-10 -90 C-11.4 -80 -10.5 -68 -9.8 -57 L-6 -57 C-6.6 -68 -7 -80 -6.4 -91 Z', TEE2, 'opacity=".55"') +
      P('M-3.4 -97.6 C-1 -94.6 2 -94.6 4.4 -97.4', 'none', `stroke="${TEE2}" stroke-width="1.5" ${CAP}`) +
      P('M-4 -78 C-1 -76 3 -76 5 -78', 'none', 'stroke="#586072" stroke-width=".8" opacity=".6"') +
      R(-9.8, -59.6, 19.6, 2.8, '#6b7488', 'opacity=".55"') +
      `<g clip-path="url(#hi_cTorso)"><g transform="scale(${ls} 1)">${R(-12, -100, 28, 48, 'url(#hi_tLight)', `opacity="${f1(glow * 0.85)}"`)}</g></g>` +
      hd +
      arm(S1, nA1, nA2, TEE, SKIN) +
      Ci(S1[0], S1[1], 0.01, 'none'),
      `rotate(${f1(lean)} 0 -58)`);
    g += R(-9.4, -62, 18.8, 8, JEAN, 'rx="2"') + torso;
    // тёплый отсвет полоски на носках у двери
    return G(g, `translate(${f1(X)},${f1(FY - bob)}) scale(${f1(sw)},1)`);
  }

  // ---------- вешалка
  function rack(glow) {
    let g = '';
    const rim = (d, o) => P(d, 'none', `stroke="#9cc4f0" stroke-width="1" opacity="${f1(o)}"`);
    // полка со шапкой
    g += R(4, 166, 50, 4, '#2a2230') + R(4, 166, 50, 1, '#9cc4f0', `opacity="${f1(0.1 + 0.15 * glow)}"`);
    g += P('M10 166 C10 157 22 155 26 166 Z', '#111726') + Ci(18, 157, 2, '#1d2640') + R(34, 154, 17, 12, '#1a2236', 'rx="1.5"') + R(34, 154, 17, 1.2, '#9cc4f0', 'opacity=".16"');
    // куртка L: короткий бомбер, светлее (сзади слева)
    g += P('M12 190 L12 199', 'none', 'stroke="#555d6e" stroke-width="1.2"');
    g += P('M3 218 C4 205 8 200 12 200 C17 200 21 205 22 218 L23 274 C15 278 8 278 2 274 Z', '#2a3552');
    g += R(2, 268, 21, 6, '#171e34', 'rx="2"') + P('M12 202 L12.4 270', 'none', 'stroke="#0c1220" stroke-width="1" opacity=".8"');
    g += rim('M3 218 C4 205 8 200 12 200', 0.2 + 0.4 * glow);
    // куртка R: пуховик, светлый, ниже (сзади справа)
    g += P('M43 190 L43 198', 'none', 'stroke="#555d6e" stroke-width="1.2"');
    g += P('M33 218 C34 206 38 199 43 199 C48 199 52 206 53 218 L54 292 C47 296 39 296 32 292 Z', 'url(#hi_coatB)');
    for (let i = 0; i < 5; i++) g += P(`M33 ${226 + i * 14} C39 ${229 + i * 14} 47 ${229 + i * 14} 53.5 ${226 + i * 14}`, 'none', 'stroke="#0c1220" stroke-width="1.1" opacity=".85"');
    g += rim('M52.5 214 L54 290', 0.15 + 0.45 * glow);
    // куртка M: длинная парка с капюшоном, спереди, самая тёмная; капюшон — тёмный провал как лицо
    g += P('M28 190 L28 196', 'none', 'stroke="#555d6e" stroke-width="1.2"');
    g += P('M16 228 C17 214 22 208 28.5 208 C35 208 40 214 41 228 L44 320 C34 324 22 324 12 320 Z', '#0b101c', 'stroke="#02040a" stroke-width="1.4"');
    g += P('M28.5 210 L28 321', 'none', 'stroke="#05080f" stroke-width="1" opacity=".8"') + Ci(26, 250, 1.3, '#2a3246') + Ci(26, 272, 1.3, '#2a3246') + Ci(26, 294, 1.3, '#2a3246');
    g += `<ellipse cx="28.5" cy="203" rx="10.4" ry="9.4" fill="#1a2440" stroke="#02040a" stroke-width="1.2"/><ellipse cx="29" cy="205" rx="6.4" ry="6.2" fill="#010308"/>`;
    g += rim('M18.5 200 C20 194 25 193 29 193.4', 0.3 + 0.5 * glow) + rim('M40 226 L43 318', 0.12 + 0.4 * glow);
    // доска с крючками
    g += R(4, 186, 50, 6, '#2b2230') + R(4, 186, 50, 1, '#9cc4f0', `opacity="${f1(0.1 + 0.15 * glow)}"`);
    [12, 28, 43].forEach(x => g += Ci(x, 190, 2, '#6b7384') + Ci(x - 0.5, 189.5, 0.7, '#aab2c2'));
    return g;
  }

  SCENES.hall_intercom = function (u, p, d, t) {
    const win = (arr) => { let w = 0; (arr || []).forEach(([a, b]) => { w = Math.max(w, sstep(a, a + 0.08, t) * (1 - sstep(b - 0.08, b, t))); }); return w; };
    // ---------- события
    const rw = win(p.ring);
    const fw = win(p.flicker);
    const nA = hash(Math.floor(t * 11) + 3.7), nB = hash(Math.floor(t * 23) + 9.1);
    const fv = (nA < 0.38 ? 0.1 : (nA < 0.55 ? 0.55 : 1)) * (nB < 0.2 ? 0.6 : 1);
    const fl = mix(1, fv, fw);                      // яркость лампы на площадке
    const lamp = 0.9 * fl;
    const peepOn = p.peepOff != null && t >= p.peepOff ? 0 : 1;
    const pulse = sstep(0.1, 0.9, 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 2.2));
    const glow = 0.62 + 0.03 * noise1(t * 1.7) + 0.38 * pulse * rw;     // яркость экрана домофона
    let dx = 0;
    (p.knock || []).forEach(tk => { const a = t - tk; if (a > 0 && a < 0.5) dx += 1.9 * Math.sin(a * 58) * Math.exp(-a * 9); });
    // ---------- Саша
    const keys = (p.at && p.at.length ? p.at : [[0, 'screen']]).slice().sort((a, b) => a[0] - b[0]);
    let cur = keys[0][1], prev = cur, tk = -1e9;
    for (let i = 1; i < keys.length; i++) if (keys[i][0] <= t && keys[i][1] !== cur) { prev = cur; cur = keys[i][1]; tk = keys[i][0]; }
    const A = POS[prev], B = POS[cur];
    const w = lin(t, tk, tk + 0.8);
    const X = mix(A.x, B.x, ease(w));
    const sx = mix(A.f, B.f, ease(lin(t, tk, tk + 0.16)));
    const lean = mix(mix(A.lean, 4, ease(lin(t, tk, tk + 0.3))), B.lean, ease(lin(t, tk + 0.5, tk + 1.1))) + Math.sin(t * 2.1) * 0.35;
    const amp = clamp(Math.sin(Math.PI * w) * 2.4, 0, 1);
    const ph = (t - tk) * 14;
    const dW = cur === 'door' ? ease(lin(t, tk + 0.75, tk + 1.25)) : (prev === 'door' ? 1 - ease(lin(t, tk, tk + 0.3)) : 0);
    const sg = sx < 0 ? -1 : 1;
    const toScr = (SCR.x < X ? -1 : 1) * sg;
    const dist = Math.abs(X - SCR.x);
    const fall = clamp(1 - (dist - 40) / 130, 0, 1);
    const litS = fall * glow * (toScr > 0 ? 1 : 0.45) * (0.85 + 0.15 * (1 - Math.abs(sx)));
    const bk = (() => { const per = 4.1, k = Math.floor((t + 0.5) / per), tb = k * per - 0.5 + 1 + 2 * hash(k * 3.3 + 1), x = (t - tb) / 0.15; return x > 0 && x < 1 ? Math.sin(x * Math.PI) : 0; })();
    const peepL = dW * lamp * 0.55 * peepOn;

    // ---------- defs
    let g = `<defs>
      <linearGradient id="hi_wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a17"/><stop offset=".5" stop-color="#0c162b"/><stop offset="1" stop-color="#101b33"/></linearGradient>
      <linearGradient id="hi_floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1427"/><stop offset=".5" stop-color="#080e1c"/><stop offset="1" stop-color="#03060c"/></linearGradient>
      <radialGradient id="hi_scrGlow"><stop offset="0" stop-color="#bfe0ff" stop-opacity=".62"/><stop offset=".3" stop-color="#7fb2ee" stop-opacity=".26"/><stop offset=".65" stop-color="#4a7fcf" stop-opacity=".08"/><stop offset="1" stop-color="#4a7fcf" stop-opacity="0"/></radialGradient>
      <radialGradient id="hi_stair"><stop offset="0" stop-color="#f0e6a2" stop-opacity=".5"/><stop offset=".45" stop-color="#cdbf6e" stop-opacity=".16"/><stop offset="1" stop-color="#cdbf6e" stop-opacity="0"/></radialGradient>
      <linearGradient id="hi_spill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0e8a8" stop-opacity=".6"/><stop offset=".45" stop-color="#d8cc80" stop-opacity=".2"/><stop offset="1" stop-color="#d8cc80" stop-opacity="0"/></linearGradient>
      <linearGradient id="hi_gap" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9cf8e"/><stop offset=".3" stop-color="#fff6c8"/><stop offset=".7" stop-color="#fff6c8"/><stop offset="1" stop-color="#d9cf8e"/></linearGradient>
      <linearGradient id="hi_door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e2539"/><stop offset=".6" stop-color="#181f33"/><stop offset="1" stop-color="#131a2b"/></linearGradient>
      <linearGradient id="hi_doorLow" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e6dc92" stop-opacity=".07"/><stop offset=".5" stop-color="#e6dc92" stop-opacity=".02"/><stop offset="1" stop-color="#e6dc92" stop-opacity="0"/></linearGradient>
      <linearGradient id="hi_coatA" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#090e19"/><stop offset=".6" stop-color="#121a2d"/><stop offset="1" stop-color="#1d2842"/></linearGradient>
      <linearGradient id="hi_coatB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#121a2c"/><stop offset=".65" stop-color="#1b2540"/><stop offset="1" stop-color="#2a3a5e"/></linearGradient>
      <linearGradient id="hi_plastic" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7e879a"/><stop offset=".45" stop-color="#b3bccb"/><stop offset="1" stop-color="#8d97aa"/></linearGradient>
      <linearGradient id="hi_scrBg" gradientUnits="userSpaceOnUse" x1="0" y1="221" x2="0" y2="239"><stop offset="0" stop-color="#6a7890"/><stop offset=".55" stop-color="#3b4658"/><stop offset="1" stop-color="#232b38"/></linearGradient>
      <radialGradient id="hi_scrLamp"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".4" stop-color="#e8f1ff" stop-opacity=".4"/><stop offset="1" stop-color="#e8f1ff" stop-opacity="0"/></radialGradient>
      <radialGradient id="hi_fLight" cx="1" cy=".5" r=".95"><stop offset="0" stop-color="#d8ecff" stop-opacity=".95"/><stop offset=".5" stop-color="#a9cdf5" stop-opacity=".4"/><stop offset="1" stop-color="#a9cdf5" stop-opacity="0"/></radialGradient>
      <linearGradient id="hi_tLight" gradientUnits="userSpaceOnUse" x1="11" y1="0" x2="-3" y2="0"><stop offset="0" stop-color="#cfe6ff" stop-opacity=".8"/><stop offset="1" stop-color="#8fbaf0" stop-opacity="0"/></linearGradient>
      <radialGradient id="hi_peepG"><stop offset="0" stop-color="#f4eeb4" stop-opacity=".9"/><stop offset="1" stop-color="#f4eeb4" stop-opacity="0"/></radialGradient>
      <radialGradient id="hi_peepW"><stop offset="0" stop-color="#fff8cf" stop-opacity=".95"/><stop offset=".35" stop-color="#f0e6a2" stop-opacity=".35"/><stop offset="1" stop-color="#f0e6a2" stop-opacity="0"/></radialGradient>
      <radialGradient id="hi_vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#02050b" stop-opacity="0"/><stop offset="1" stop-color="#02050b" stop-opacity=".7"/></radialGradient>
      <linearGradient id="hi_bot" gradientUnits="userSpaceOnUse" x1="0" y1="354" x2="0" y2="376"><stop offset="0" stop-color="#03060c" stop-opacity="0"/><stop offset="1" stop-color="#03060c" stop-opacity="1"/></linearGradient>
      <pattern id="hi_scan" width="4" height="1.5" patternUnits="userSpaceOnUse"><rect width="4" height=".6" fill="#000" opacity=".28"/></pattern>
      <filter id="hi_bl" x="-60%" y="-30%" width="220%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="hi_bl1" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".8"/></filter>
      <clipPath id="hi_cHead"><path d="${FACE}"/></clipPath>
      <clipPath id="hi_cTorso"><path d="${TORSO}"/></clipPath>
      <clipPath id="hi_cScr"><rect x="66" y="221" width="24" height="18" rx="1.6"/></clipPath>
    </defs>`;

    // ================= СТЕНА =================
    g += R(-20, -20, 400, 360, 'url(#hi_wall)');
    for (let i = 0; i < 18; i++) g += R(i * 22 - 4, -20, 9, 360, '#7f93c0', 'opacity=".022"');
    // потолочный плафон (выключен)
    g += P('M148 -2 L148 6 C148 12 160 14 178 14 C196 14 208 12 208 6 L208 -2 Z', '#1c2438') + P('M156 6 C160 11 196 11 200 6', 'none', 'stroke="#9cc4f0" stroke-width=".8" opacity=".14"');
    // часы 03:07
    {
      const cx = 255, cy = 104, hr = (3 + 7 / 60) * 30, mn = 7 * 6, sc = Math.floor(t + 11) * 6;
      const hand = (a, l, w, c) => L(cx, cy, cx + l * Math.sin(a * Math.PI / 180), cy - l * Math.cos(a * Math.PI / 180), c, w, CAP);
      g += Ci(cx, cy, 16.5, '#171f33') + Ci(cx, cy, 14.2, '#78839a') + Ci(cx, cy, 14.2, 'none', 'stroke="#0c1220" stroke-width=".8"');
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g += L(cx + 12 * Math.sin(a), cy - 12 * Math.cos(a), cx + 13.4 * Math.sin(a), cy - 13.4 * Math.cos(a), '#1a2133', i % 3 ? 0.7 : 1.3); }
      g += hand(hr, 7, 1.7, '#12182a') + hand(mn, 11, 1.2, '#12182a') + hand(sc, 11.5, 0.6, '#9a2a35') + Ci(cx, cy, 1.4, '#12182a');
      g += P('M244 98 C248 92 262 91 267 95', 'none', 'stroke="#fff" stroke-width="1" opacity=".16"');
    }
    // картина
    g += G(R(118, 92, 34, 28, '#1a2236') + R(120, 94, 30, 24, '#16233f') + P('M120 118 L120 108 L129 100 L135 107 L141 101 L150 110 L150 118 Z', '#0d1830') + Ci(142, 102, 3, '#40517a', 'opacity=".8"') + R(118, 92, 34, 1, '#9cc4f0', 'opacity=".16"'), 'rotate(-2 135 106)');
    // ключница над домофоном
    g += R(60, 160, 36, 5, '#2b2230') + R(60, 160, 36, 1, '#9cc4f0', `opacity="${f1(0.1 + 0.15 * glow)}"`);
    [[66, 12], [74, 9], [83, 14], [90, 8]].forEach(([x, l], i) => g += L(x, 165, x, 165 + l, '#8a93a6', 0.8) + Ci(x, 166 + l, 2 + (i % 2) * 0.5, i % 2 ? '#a9b2c3' : '#6c7587', `opacity="${f1(0.55 + 0.4 * glow)}"`));
    // выключатель
    g += R(318, 228, 13, 19, '#252d44', 'rx="2"') + R(321, 232, 7, 11, '#1a2136', 'rx="1.5"') + Ci(324.5, 237, 1, '#ff9a4a', 'opacity=".8"') + Ci(324.5, 237, 5, 'url(#glowW)', 'opacity=".35"');

    // ================= ВЕШАЛКА =================
    g += rack(glow);

    // ================= ДОМОФОН =================
    {
      const vib = rw > 0.3 ? Math.sin(t * 95) * 0.32 * rw : 0;
      const blinkT = Math.sin(t * 2 * Math.PI * 1.9) > -0.25 ? 1 : 0.0;
      // свет экрана на стену
      g += R(55, 188, 46, 92, '#1c2436', 'rx="5"') + R(55, 188, 46, 92, 'none', 'rx="5" stroke="#0a0f1a" stroke-width="1"');
      g += R(98.4, 190, 1.6, 88, '#9cc4f0', `opacity="${f1(0.05 + 0.1 * glow)}"`);
      g += R(57, 190, 42, 1.2, '#9cc4f0', 'opacity=".1"');
      g += P('M78 280 C70 284 86 288 78 292 C70 296 86 300 78 304', 'none', 'stroke="#10151f" stroke-width="2.4" stroke-linecap="round"');
      g += G(
        R(62, 198, 32, 74, 'url(#hi_plastic)', 'rx="7"') + R(62, 198, 32, 74, 'none', 'rx="7" stroke="#2a3244" stroke-width=".9"') +
        R(64, 199, 3, 70, '#fff', 'rx="1.5" opacity=".13"') +
        [0, 1, 2, 3].map(i => R(71, 202 + i * 2.7, 14, 1.2, '#4a5366', 'rx=".6"')).join('') +
        Ci(90, 204, 1.2, '#d7263d', `opacity="${f1(0.5 + 0.5 * (Math.sin(t * 2.6) > 0.3 ? 1 : 0.15) + rw * 0.4)}"`) +
        R(64, 217, 28, 24, '#05080f', 'rx="3"') +
        // экран с картинкой
        `<g clip-path="url(#hi_cScr)">` +
          R(66, 221, 24, 18, 'url(#hi_scrBg)') +
          Ci(72, 222.5, 9, 'url(#hi_scrLamp)', `opacity="${f1(lamp)}"`) + R(70.2, 221.2, 4, 1.4, '#ffffff', `opacity="${f1(0.3 + 0.7 * lamp)}"`) +
          R(66, 231, 24, 8, '#1d2431') + R(66, 230.4, 24, 0.9, '#7e8ca2', 'opacity=".5"') +
          R(80, 223.5, 7, 10, '#38425a') + R(80, 223.5, 7, 0.7, '#8c9bb5', 'opacity=".6"') + R(80.8, 225, 5.4, 3.6, '#2a3348') + Ci(85.5, 229, 0.5, '#aab6cc') +
          R(79, 234, 9, 2.2, '#161b26') +
          L(66, 229.5, 78, 239, '#aab6ca', 0.8, 'opacity=".7"') + L(66, 232.5, 74, 239, '#aab6ca', 0.7, 'opacity=".45"') +
          R(66, 221 + ((t * 6) % 24) - 3, 24, 2.4, '#fff', 'opacity=".07"') +
          (rw > 0.02 ? R(66, 230.6, 24, 8.4, '#0a0e16', `opacity="${f1(0.82 * rw)}"`) + T(78, 236.6, 'ВЫЗОВ', 4.6, blinkT ? '#ff5a4e' : '#5a2420', `text-anchor="middle" font-family="Mont" font-weight="800" opacity="${f1(rw)}"`) : '') +
          R(66, 221, 24, 18, 'url(#hi_scan)') + R(66, 221, 24, 18, '#9cc4f0', `opacity="${f1(0.07 * rw * pulse)}"`) +
        `</g>` +
        P('M66 221 L76 221 L66 231 Z', '#fff', 'opacity=".07"') +
        Ci(72, 249, 2.7, '#2a3244') + Ci(78, 249, 2.7, '#2a3244') + Ci(84, 249, 2.7, '#2a3244') +
        Ci(72, 249, 1.1, '#f0b040', 'opacity=".9"') + Ci(84, 249, 1.1, '#3fcf7a', 'opacity=".9"') + R(77, 248.4, 2, 1.2, '#8a93a6', 'rx=".6"') +
        [0, 1, 2].map(i => Ci(75 + i * 3, 262, 0.7, '#3a4256')).join('') +
        R(64, 266, 28, 1, '#5a6276', 'opacity=".5"'),
        `translate(${f1(vib)},0)`);
      // дуги звука
      if (rw > 0.02) for (let i = 0; i < 3; i++) {
        const e = (t * 1.35 + i / 3) % 1, r = 14 + e * 34, a = 0.8 * rw * (1 - e) * sstep(0, 0.12, e), an = 0.62;
        const px = (s) => `M${f1(SCR.x - 0 + s * r * Math.cos(an))} ${f1(222 - r * Math.sin(an))} A${f1(r)} ${f1(r)} 0 0 ${s > 0 ? 1 : 0} ${f1(SCR.x + s * r * Math.cos(an))} ${f1(222 + r * Math.sin(an))}`;
        g += P(px(1), 'none', `stroke="#cfe2ff" stroke-width="1.4" opacity="${f1(a)}" ${CAP}`) + P(px(-1), 'none', `stroke="#cfe2ff" stroke-width="1.4" opacity="${f1(a)}" ${CAP}`);
      }
    }

    // ================= ДВЕРЬ =================
    {
      const { x, y, w, h } = DR;
      g += R(x - 7, y - 7, w + 14, h + 7, '#131b2e') + R(x - 7, y - 7, w + 14, 1.4, '#9cc4f0', 'opacity=".12"') + R(x - 7, y - 7, 1.2, h + 7, '#9cc4f0', 'opacity=".06"');
      g += R(x, y, w, h, '#010207');
      const lx = x + dx;
      let d = R(lx, y, w - 1.5, h - 1.5, 'url(#hi_door)');
      d += R(lx + 8, y + 10, w - 17, h * 0.4, '#000', 'opacity=".22"') + R(lx + 8, y + h * 0.55, w - 17, h * 0.36, '#000', 'opacity=".22"');
      d += R(lx + 8, y + 10, w - 17, 1, '#fff', 'opacity=".07"') + R(lx + 8, y + h * 0.55, w - 17, 1, '#fff', 'opacity=".07"');
      d += R(lx + 8, y + 10 + h * 0.4 - 1, w - 17, 1, '#fff', 'opacity=".05"') + R(lx + 8, y + h * 0.55 + h * 0.36 - 1, w - 17, 1, '#fff', 'opacity=".05"');
      d += R(lx, y, w - 1.5, h - 1.5, 'url(#hi_doorLow)', `opacity="${f1(fl * 0.6)}"`);
      d += R(lx, y, 1.4, h - 1.5, '#000', 'opacity=".3"') + R(lx + w - 3, y, 1.5, h - 1.5, '#000', 'opacity=".3"');
      // глазок
      d += Ci(PEEP.x + dx, PEEP.y, 8, 'url(#hi_peepW)', `opacity="${f1(lamp * 0.8 * peepOn)}"`) + Ci(PEEP.x + dx, PEEP.y, 3.7, '#6b7384') + Ci(PEEP.x + dx, PEEP.y, 2.9, '#1b1f2a') +
        Ci(PEEP.x + dx, PEEP.y, 1.5, '#fff6c8', `opacity="${f1((0.35 + 0.65 * lamp) * peepOn)}"`) + P(`M${f1(PEEP.x + dx - 3)} ${PEEP.y - 1.5} A3.4 3.4 0 0 1 ${f1(PEEP.x + dx + 1)} ${PEEP.y - 3.2}`, 'none', 'stroke="#fff" stroke-width=".6" opacity=".5"');
      // цепочка
      if (!p.bare) d += R(lx + 8, y + 33, 7, 4, '#7b8498', 'rx="1"') + R(lx + 63, y + 31, 8, 8, '#7b8498', 'rx="1.2"') +
        P(`M${f1(lx + 15)} ${y + 35} C${f1(lx + 30)} ${y + 44} ${f1(lx + 50)} ${y + 44} ${f1(lx + 63)} ${y + 35}`, 'none', 'stroke="#aab2c2" stroke-width="1.5" stroke-dasharray="1.6 1.2"');
      // замки и ручка (с правой стороны)
      if (p.bare) {
        // Цилиндр с круглой скважиной и узким пазом вместо вертушки.
        d += R(lx + 67, y + 52, 9, 22, '#6f788c', 'rx="2"') +
          Ci(lx + 71.5, y + 63, 3.6, '#98a1b3') + Ci(lx + 71.5, y + 63, 3.6, 'none', 'stroke="#2a3040" stroke-width=".6"') +
          Ci(lx + 71.5, y + 62, 1.2, '#171d2b') + R(lx + 70.8, y + 62, 1.4, 3.8, '#171d2b');
      } else d += R(lx + 67, y + 52, 9, 22, '#6f788c', 'rx="2"') + Ci(lx + 71.5, y + 59, 3.6, '#98a1b3') + Ci(lx + 71.5, y + 59, 3.6, 'none', 'stroke="#2a3040" stroke-width=".6"') + R(lx + 70.8, y + 55.6, 1.4, 6.8, '#2a3040') +
        Ci(lx + 71.5, y + 68, 2.2, '#2a3040') +
        R(lx + 52, y + 84, 24, 6, '#454e62', 'rx="1.5" opacity=".0"');
      d += R(lx + 66, y + 86, 11, 26, '#6f788c', 'rx="2.5"') + R(lx + 48, y + 90.5, 28, 4.6, '#aeb6c5', 'rx="2.3"') + R(lx + 48, y + 90.5, 28, 1.2, '#fff', 'rx=".6" opacity=".35"') + Ci(lx + 71.5, y + 92.8, 3.2, '#8e97a9') +
        Ci(lx + 71.5, y + 104, 1.8, '#2a3040') + R(lx + 71, y + 106, 1, 3.6, '#2a3040');
      g += d;
      // полоска света из-под двери
      g += R(x + 1, FL - 1.8, w - 3, 2.6, 'url(#hi_gap)', `opacity="${f1(fl)}"`);
      // отсвет на стене и полу
      g += `<ellipse cx="${x + w / 2}" cy="${FL - 6}" rx="92" ry="46" fill="url(#hi_stair)" opacity="${f1(0.2 * fl)}"/>`;
    }
    // пыль с косяка
    (p.knock || []).forEach((tk, ki) => {
      const a0 = t - tk; if (a0 < 0 || a0 > 2.2) return;
      for (let i = 0; i < 20; i++) {
        const h1 = hash(ki * 17 + i * 3.1 + 1), h2 = hash(ki * 11 + i * 5.7 + 2), h3 = hash(ki * 7 + i * 2.3 + 3);
        const a = a0 - h3 * 0.25; if (a < 0 || a > 1.9) continue;
        let x0, y0;
        if (h1 < 0.55) { x0 = DR.x - 5 + h2 * (DR.w + 10); y0 = DR.y - 5; } else { x0 = h2 < 0.5 ? DR.x - 5 : DR.x + DR.w + 5; y0 = DR.y - 4 + h1 * 50; }
        const px = x0 + (h3 - 0.5) * 9 * a + Math.sin(a * 3.2 + i) * 1.6, py = y0 + 14 * a + 8 * a * a;
        const al = 0.6 * sstep(0, 0.08, a) * (1 - sstep(1.0, 1.9, a));
        g += Ci(px, py, 0.5 + h1 * 0.9, `rgba(178,190,210,${f1(al)})`);
      }
    });

    // ================= ПОЛ =================
    g += R(0, FL - 6, 360, 6, '#141d33') + R(0, FL - 6, 360, 1, '#9cc4f0', `opacity="${f1(0.07 + 0.08 * glow)}"`);
    g += R(-20, FL, 400, 50, 'url(#hi_floor)');
    for (let i = 0; i < 4; i++) g += L(-20, FL + 8 + i * 9, 380, FL + 8 + i * 9, '#1b2844', 0.7, 'opacity=".55"');
    for (let i = 0; i < 18; i++) g += L(i * 21 + (i % 2) * 9, FL + 8 + (i % 3) * 9, i * 21 + (i % 2) * 9, FL + 17 + (i % 3) * 9, '#1b2844', 0.7, 'opacity=".5"');
    // обувь у вешалки
    g += P('M8 346 C8 340 14 338 20 339 C24 340 24 343 26 345 L26 347 L8 347 Z', '#0b101c') + R(8, 345.4, 18, 1.8, '#c9d0dc', 'opacity=".5"') +
      P('M30 347 C30 339 36 337 42 338 C46 339 47 343 48 346 L48 347 Z', '#0e1424') + R(30, 345.4, 18, 1.8, '#c9d0dc', 'opacity=".4"') + P('M10 339.5 C14 338.4 18 338.6 21 339.6', 'none', `stroke="#9cc4f0" stroke-width=".7" opacity="${f1(0.15 + 0.4 * glow)}"`);
    // свет из-под двери на полу
    g += P(`M${DR.x + 2} ${FL} L${DR.x + DR.w - 2} ${FL} L${DR.x + DR.w + 38} 372 L${DR.x - 36} 372 Z`, 'url(#hi_spill)', `opacity="${f1(fl * 0.85)}" ${''}`);
    // коврик
    g += P('M219 338 L291 338 L303 360 L207 360 Z', '#161d2d') + P('M219 338 L291 338 L292 340 L218 340 Z', '#212a40') +
      P('M222 343 L288 343 M220 348 L290 348 M214 354 L296 354', 'none', 'stroke="#252f48" stroke-width="1"') + P('M207 360 L303 360', 'none', 'stroke="#0a0f1a" stroke-width="1.6"') +
      P('M219 338 L291 338 L303 360 L207 360 Z', 'url(#hi_spill)', `opacity="${f1(fl * 0.7)}"`);
    // свет экрана на пол
    g += `<ellipse cx="96" cy="346" rx="64" ry="9" fill="url(#hi_scrGlow)" opacity="${f1(0.7 * glow)}"/>`;

    // ================= ЗАЛИВКА СВЕТОМ ЭКРАНА НА СТЕНУ =================
    g += Ci(SCR.x, SCR.y, 150, 'url(#hi_scrGlow)', `opacity="${f1(0.95 * glow)}"`);
    g += Ci(SCR.x, SCR.y, 38, 'url(#hi_scrGlow)', `opacity="${f1(0.55 * glow)}"`);

    // ================= САША =================
    // мягкая тень на стене (справа от него, свет слева)
    g += `<ellipse cx="${f1(X + 30 * (SCR.x < X ? 1 : 0.2))}" cy="268" rx="15" ry="64" fill="#02040a" opacity="${f1(0.4 * fall * glow)}" filter="url(#hi_bl)"/>`;
    g += `<ellipse cx="${f1(X + 2)}" cy="${FY + 1}" rx="19" ry="3.2" fill="#02040a" opacity=".55"/>`;
    g += sasha(t, { X, sx, lean, ph, amp, dW, glow: litS, ls: toScr > 0 ? 1 : -1, blink: bk, peepL });
    // тёплый отсвет полоски на носках у двери
    {
      const prox = clamp(1 - Math.abs(X - 255) / 90, 0, 1) * fl * 0.5;
      if (prox > 0.02) g += R(X - 14, FY - 3, 34, 1.8, '#f0e6a2', `opacity="${f1(prox)}" rx=".9"`);
    }

    // ================= ФИНАЛ =================
    g += R(-20, -20, 400, 420, 'url(#hi_vig)');
    g += R(-20, 354, 400, 30, 'url(#hi_bot)');
    g += R(-20, 372, 400, 30, '#03060c');
    return g;
  };
})();

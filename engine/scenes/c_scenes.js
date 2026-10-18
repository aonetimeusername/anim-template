// сцены ключа «c»: journal (классный журнал под фонариком), phone_ui (диктофон -> будильник)

// ============================================================
// journal: p.roll [{n,t}], p.focus (null | индекс), p.tFocus, p.timer, p.ok
//   режимы: roll (focus==null) · sixteen (focus!=null, нет ok) · next (есть ok)
// ============================================================
(() => {
  const NAMES = ['Абрамова', 'Белов', 'Воронцова', 'Гусев', 'Демидова', 'Ермаков', 'Жукова', 'Зайцев', 'Ильина',
    'Калинин', 'Лебедева', 'Морозов', 'Никитина', 'Новиков', 'Олейник', 'Орлов', 'Осипова', 'Павлов'];
  const PW = 244, RH = 20, HH = 44, PX = 44, PY = 124, PH = HH + NAMES.length * RH + 16;
  const SCR = -178;                                  // сдвиг страницы, при котором 16-я строка на y≈300
  const INK = '#1f2f63', PAPER = '#e9e1ca', DARK = '5,12,26';
  const HAND = 'font-family="Hand" font-weight="700"';
  const rowY = i => HH + i * RH;
  const pad2 = n => (n < 10 ? '0' : '') + n;
  const GR = ['5', '4', '5', 'н', '4', '5', '3', '5'];

  // рукописный овал: полилиния со слабой спиралью и «перехлёстом» в конце
  //   a0 — угол начала штриха (по умолчанию как в части 1: сверху слева)
  function ovalPath(cx, cy, rx, ry, a0 = -2.55) {
    let d = '';
    const N = 60, turn = 1.14;
    for (let k = 0; k <= N; k++) {
      const q = k / N, a = a0 + q * Math.PI * 2 * turn;
      const w = 1 + 0.035 * Math.sin(a * 2 + 1.3) + 0.075 * q;
      const x = cx + Math.cos(a) * rx * w, y = cy + Math.sin(a) * ry * (w + 0.03 * Math.sin(a * 3));
      d += (k ? 'L' : 'M') + f1(x) + ' ' + f1(y);
    }
    return d;
  }

  // положение полосы (дробный индекс строки)
  function barPos(p, t, mode) {
    if (mode === 'next') return mix(p.focus - 1, p.focus, ease(lin(t, p.tFocus, p.tFocus + 0.3)));
    const roll = p.roll || [];
    let ci = -1;
    for (let k = 0; k < roll.length; k++) if (roll[k].t <= t) ci = k;
    if (ci < 0) return roll.length ? roll[0].n : 0;
    const cur = roll[ci], prev = ci > 0 ? roll[ci - 1].n : cur.n;
    return mix(prev, cur.n, ease(lin(t, cur.t, cur.t + 0.3)));
  }
  function lastRead(p, t, mode) {
    if (mode === 'next') return p.tFocus;
    let r = -99;
    for (const e of (p.roll || [])) if (e.t <= t) r = e.t;
    return r;
  }

  // ---------- страница «СВЕДЕНИЯ О РОДИТЕЛЯХ» (p.page === 'parents', часть 2)
  //   p.focus — индекс строки с овалом вокруг имени матери, p.tFocus — когда рисуется овал (до него — прокрутка),
  //   p.erased — (необяз.) вычеркнутые ученики, как на основной странице. Таймера и полосы «читают» нет.
  const STUD = ['Абрамова Алина', 'Белов Кирилл', 'Воронцова Софья', 'Гусев Илья', 'Демидова Полина', 'Ермаков Егор',
    'Жукова Дарья', 'Зайцев Максим', 'Ильина Вероника', 'Калинин Матвей', 'Лебедева Ксения', 'Морозов Никита',
    'Никитина Ева', 'Новиков Глеб', 'Олейник Тимур', 'Орлов Артём', 'Осипова Милана', 'Павлов Роман'];
  const MOMS = ['Абрамова Елена Юрьевна', 'Белова Наталья Игоревна', 'Воронцова Ольга Петровна', 'Гусева Марина Андреевна',
    'Демидова Анна Олеговна', 'Ермакова Юлия Алексеевна', 'Жукова Светлана Павловна', 'Зайцева Оксана Олеговна',
    'Ильина Вера Николаевна', 'Калинина Алла Борисовна', 'Лебедева Мария Евгеньевна', 'Морозова Галина Ивановна',
    'Никитина Олеся Ивановна', 'Новикова Инна Петровна', 'Олейник Жанна Игоревна', 'Орлова Ирина Сергеевна',
    'Осипова Татьяна Романовна', 'Павлова Лариса Ивановна'];
  // ширины имён матерей в Hand 700 при кегле 12 (замер getComputedTextLength в Chrome) — под размер овала
  const MOMW12 = [109.6, 111.6, 118.5, 110.1, 110.2, 118.9, 120, 110.8, 109.7, 113.2, 118.7, 119.5, 117.7, 112.5, 111.2, 104, 121, 115.9];
  const PWP = 300, HHP = 50, PXP = 30, PHP = HHP + NAMES.length * RH + 16;
  const SCRP = SCR - (HHP - HH);                     // 16-я строка снова на y≈300
  const CS = 31, CM = 114, CT = 237, SEP1 = 110, SEP2 = 234;   // колонки: ученик | мать | телефон
  const FS = 11.5, FT = 10;
  const rowP = i => HHP + i * RH;
  // телефон: начало номера читается, хвост затёрт точками; у фокусной строки — «8 9·· ···-··-··».
  // Точки рисуем кружками: «·» в Caveat слишком мелкий. Шаг знаков Caveat 700 при кегле 10.5 (замер в Chrome):
  // цифра 4.7, пробел 2.5, дефис 3.4; точка чуть уже цифры (4.0).
  const KT = FT / 10.5, ADV = { ' ': 2.5 * KT, '-': 3.4 * KT, '.': 4.0 * KT };
  function phoneInk(i, focus, x, yb) {
    const dg = k => String(Math.floor(hash(i * 5.31 + k * 1.93 + 7.7) * 10) % 10);
    const s = i === focus ? '8 9.. ...-..-..' : `8 9${dg(0)}${dg(1)} ${dg(2)}${dg(3)}${dg(4)}-..-..`;
    let out = '', run = '', rx = x, cx = x;
    const flush = () => { if (run) out += T(f1(rx), yb, run, FT, INK, HAND); run = ''; };
    for (let k = 0; k < s.length; k++) {
      const ch = s[k];
      if (ch === '.') {
        flush();
        const h = hash(i * 13.1 + k * 3.7);
        out += Ci(cx + 2 * KT + (h - 0.5) * 0.7, yb - 2.7 + (hash(k * 7.3 + i) - 0.5) * 0.7, 0.95 + 0.2 * h, INK);
      } else {
        if (!run) rx = cx;
        run += ch;
      }
      cx += ADV[ch] !== undefined ? ADV[ch] : 4.7 * KT;
    }
    flush();
    return out;
  }

  function parentsPage(p, t) {
    let pg = '';
    pg += R(3, 6, PWP, PHP, 'rgba(0,0,0,.55)', 'rx="3"');
    pg += R(0, 0, PWP, PHP, PAPER, 'rx="3"');
    pg += R(0, 0, PWP, PHP, 'url(#cj_grid)');
    pg += R(0, 0, 9, PHP, 'rgba(60,40,20,.14)');
    pg += R(0, 0, PWP, PHP, 'none', 'stroke="rgba(120,100,70,.35)" stroke-width="1" rx="3"');
    // шапка
    pg += T(10, 14, 'КЛАССНЫЙ ЖУРНАЛ', 6.5, '#6b7690', MONO);
    pg += T(PWP - 10, 15, '9 «Б»', 14, INK, `${HAND} text-anchor="end" opacity=".9"`);
    pg += T(10, 34, 'СВЕДЕНИЯ О РОДИТЕЛЯХ', 18, INK, `${HAND} transform="rotate(-0.6 10 30)"`);
    const LAB = 'font-family="Mont" font-weight="600"';
    pg += T(CS + 1, 45.5, 'ученик', 7.5, '#6b7690', LAB);
    pg += T(CM, 45.5, 'мать', 7.5, '#6b7690', LAB);
    pg += T(CT, 45.5, 'телефон', 7.5, '#6b7690', LAB);
    pg += L(0, HHP, PWP, HHP, '#5a6b92', 1.2);
    // линовка и колонки
    for (let i = 1; i <= NAMES.length; i++) pg += L(0, rowP(i), PWP, rowP(i), '#8ea3c7', 0.7, 'opacity=".7"');
    pg += L(26, 0, 26, PHP, '#c85a5a', 0.9, 'opacity=".7"') + L(28.4, 0, 28.4, PHP, '#c85a5a', 0.6, 'opacity=".5"');
    pg += L(SEP1, 38, SEP1, rowP(NAMES.length), '#8ea3c7', 0.6, 'opacity=".75"');
    pg += L(SEP2, 38, SEP2, rowP(NAMES.length), '#8ea3c7', 0.6, 'opacity=".75"');
    // строки: всё от руки, у каждой ячейки свой лёгкий наклон и сдвиг
    const foc = p.focus != null ? p.focus : -1;
    for (let i = 0; i < NAMES.length; i++) {
      const y0 = rowP(i);
      const j1 = hash(i * 3.7 + 1.1), j2 = hash(i * 2.9 + 4.4), j3 = hash(i * 6.1 + 0.3);
      pg += T(21, y0 + 13.5, (i + 1) + '.', 8.5, '#5f6c85', 'text-anchor="end" ' + MONO);
      const er = (p.erased || []).includes(i);
      const xs = CS + (j1 - 0.5) * 1.6, xm = CM + (j2 - 0.5) * 2.2, xt = CT + (j3 - 0.5) * 2;
      pg += T(f1(xs), y0 + 14.4, STUD[i], FS, INK, `${HAND} opacity="${er ? 0.1 : 1}" transform="rotate(${f1((j1 - 0.5) * 1.4)} ${CS} ${y0 + 11})"`);
      if (er) pg += P(`M${CS - 2} ${f1(y0 + 10)} q 25 -2.2 50 0.4 t 26 -0.6`, 'none', `stroke="${C.red}" stroke-width="2.2" stroke-linecap="round" opacity=".75"`);
      pg += T(f1(xm), y0 + 14.4, MOMS[i], FS, INK, `${HAND} opacity=".96" transform="rotate(${f1((j2 - 0.5) * 1.2)} ${CM} ${y0 + 11})"`);
      pg += G(phoneInk(i, foc, xt, y0 + 14.2), `rotate(${f1((j3 - 0.5) * 1.4)} ${CT} ${y0 + 11})`, 'opacity=".9"');
    }
    // рукописный красный овал вокруг имени матери
    if (foc >= 0 && foc < NAMES.length && p.tFocus != null) {
      const prog = ease(lin(t, p.tFocus, p.tFocus + 0.5));
      if (prog > 0.002) {
        const w = MOMW12[foc] * FS / 12, cx = CM + w / 2 + 0.5, cy = rowP(foc) + RH / 2 + 1.5;
        // штрих начинается снизу слева и сразу обводит левый край — не читается как подчёркивание строки выше
        const dd = ovalPath(cx, cy, w / 2 + 7, 13, 2.75);
        pg += P(dd, 'none', `pathLength="1" stroke="rgba(215,38,61,.28)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${f1(prog * 1000) / 1000} 3"`);
        pg += P(dd, 'none', `pathLength="1" stroke="${C.red}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${f1(prog * 1000) / 1000} 3"`);
      }
    }
    return pg;
  }

  SCENES.journal = function (u, p, d, t) {
    const mode = p.ok !== undefined ? 'next' : (p.focus != null ? 'sixteen' : 'roll');
    const par = p.page === 'parents';                 // часть 2: страница «Сведения о родителях»
    const flick = 1 + 0.05 * noise1(t * 8) + 0.025 * noise1(t * 21);
    let g = '';
    g += `<defs>
      <pattern id="cj_grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="#8fa8cf" stroke-width=".4" opacity=".4"/></pattern>
      <radialGradient id="cj_dark" gradientUnits="userSpaceOnUse" cx="178" cy="238" r="${f1(236 * flick)}" gradientTransform="translate(178 238) scale(1 .8) translate(-178 -238)">
        <stop offset="0" stop-color="rgb(${DARK})" stop-opacity="0"/><stop offset=".42" stop-color="rgb(${DARK})" stop-opacity=".04"/>
        <stop offset=".74" stop-color="rgb(${DARK})" stop-opacity=".55"/><stop offset="1" stop-color="rgb(${DARK})" stop-opacity=".94"/></radialGradient>
      <linearGradient id="cj_fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(${DARK})" stop-opacity="0"/><stop offset="1" stop-color="rgb(${DARK})" stop-opacity="1"/></linearGradient>
      <linearGradient id="cj_cone" gradientUnits="userSpaceOnUse" x1="322" y1="30" x2="150" y2="270"><stop offset="0" stop-color="#fff1c7" stop-opacity=".30"/><stop offset="1" stop-color="#fff1c7" stop-opacity=".02"/></linearGradient>
    </defs>`;
    // фон: тёмный стол
    g += R(-20, -20, 400, 680, '#050c1a');
    g += P('M-20 40 H380 V400 H-20 Z', '#08122a', 'opacity=".55"');

    // ---------- страница
    let scroll;
    if (par) scroll = p.tFocus != null ? kf([[Math.max(p.tFocus - 1.6, t - u), -4], [p.tFocus - 0.1, SCRP]], t) : -4 * (u / d);
    else if (mode === 'roll') scroll = -4 * (u / d);
    else if (mode === 'sixteen') scroll = kf([[Math.max(p.tFocus - 1.6, t - u), -4], [p.tFocus - 0.1, SCR]], t);
    else scroll = SCR;
    const rot = 1.7 + 0.25 * noise1(t * 0.45 + 2);
    const bp = barPos(p, t, mode);
    let pg = '';
    if (par) pg = parentsPage(p, t);
    else {
    // тень и бумага
    pg += R(3, 6, PW, PH, 'rgba(0,0,0,.55)', 'rx="3"');
    pg += R(0, 0, PW, PH, PAPER, 'rx="3"');
    pg += R(0, 0, PW, PH, 'url(#cj_grid)');
    pg += R(0, 0, 9, PH, 'rgba(60,40,20,.14)');                        // тень от переплёта
    pg += R(0, 0, PW, PH, 'none', 'stroke="rgba(120,100,70,.35)" stroke-width="1" rx="3"');
    // шапка
    pg += T(10, 14, 'КЛАССНЫЙ ЖУРНАЛ', 6.5, '#6b7690', MONO);
    pg += T(10, 37, '9 «Б»', 24, INK, HAND);
    pg += T(44, 37, 'фамилия, имя', 7.5, '#6b7690', 'font-family="Mont" font-weight="600"');
    const dates = ['02.09', '05.09', '09.09', '12.09', '16.09', '19.09', '23.09', '26.09'];
    dates.forEach((s, k) => { pg += T(140 + k * 12.5 + 6.2, 40, s.slice(0, 2), 5.6, '#6b7690', 'font-family="Plex" font-weight="600" text-anchor="middle"'); });
    pg += L(0, HH, PW, HH, '#5a6b92', 1.2);
    // линейки строк
    for (let i = 1; i <= NAMES.length; i++) pg += L(0, rowY(i), PW, rowY(i), '#8ea3c7', 0.7, 'opacity=".7"');
    // колонки: красная «граница полей» и оценки
    pg += L(26, 0, 26, PH, '#c85a5a', 0.9, 'opacity=".7"') + L(28.4, 0, 28.4, PH, '#c85a5a', 0.6, 'opacity=".5"');
    for (let k = 0; k <= 8; k++) pg += L(140 + k * 12.5, HH, 140 + k * 12.5, rowY(NAMES.length), '#8ea3c7', 0.6, 'opacity=".75"');

    // полоса «читают сейчас»
    {
      const by = rowY(bp), pulse = 0.9 + 0.1 * Math.sin(t * 5.5);
      pg += R(-3, by - 2.5, PW + 6, RH + 5, `rgba(255,60,70,${f1(0.13 * pulse)})`, 'rx="3"');
      pg += R(0, by, PW, RH, `rgba(215,38,61,${f1(0.40 * pulse)})`);
      pg += R(0, by, 3.2, RH, C.red);
      pg += P(`M-11 ${f1(by + 4.5)} L-2.5 ${f1(by + RH / 2)} L-11 ${f1(by + RH - 4.5)} Z`, C.red, `opacity="${f1(0.9 * pulse)}"`);
    }
    // строки
    for (let i = 0; i < NAMES.length; i++) {
      const y0 = rowY(i), j = hash(i * 3.7 + 1.1);
      pg += T(21, y0 + 13, (i + 1) + '.', 8.5, '#5f6c85', 'text-anchor="end" ' + MONO);
      // вычеркнутая фамилия: p.erase {i,t} — зачёркивание и растворение в кадре; p.erased — уже стёртые
      const ee = p.erase && p.erase.i === i ? p.erase : null, er = (p.erased || []).includes(i);
      const nOp = er ? 0.1 : (ee ? 1 - 0.9 * lin(t, ee.t + 0.7, ee.t + 1.8) : 1);
      pg += T(f1(32 + (j - 0.5) * 1.8), y0 + 14.3, NAMES[i], 17, INK, `${HAND} opacity="${f1(nOp)}" transform="rotate(${f1((j - 0.5) * 1.6)} 32 ${y0 + 12})"`);
      if (ee || er) {
        const sk = er ? 1 : eout(lin(t, ee.t, ee.t + 0.55));
        if (sk > 0) pg += P(`M30 ${f1(y0 + 10)} q 25 -2.2 50 0.4 t ${f1(52 * sk)} -0.6`, 'none', `stroke="${C.red}" stroke-width="2.2" stroke-linecap="round" opacity="${f1(er ? 0.75 : 0.95)}"`);
      }
      for (let k = 0; k < 8; k++) {
        const h = hash((i * 8 + k) * 1.7 + 3.3);
        if (h > 0.7) pg += T(140 + k * 12.5 + 6.2, y0 + 14, GR[Math.floor(h * 97) % GR.length], 12, INK, `${HAND} text-anchor="middle" opacity=".85"`);
      }
    }
    // овал вокруг 16-й строки, таймер, галочка
    const oi = mode === 'next' ? p.focus - 1 : p.focus;
    if (mode !== 'roll') {
      const oy = rowY(oi) + RH / 2;
      const prog = ease(lin(t, p.tFocus, p.tFocus + 0.5)) * (mode === 'next' ? 0 : 1) + (mode === 'next' ? 1 : 0);
      if (prog > 0.002) {
        const dd = ovalPath(45, oy + 0.5, 45, 15.5);
        pg += P(dd, 'none', `pathLength="1" stroke="rgba(215,38,61,.28)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${f1(prog * 1000) / 1000} 3"`);
        pg += P(dd, 'none', `pathLength="1" stroke="${C.red}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${f1(prog * 1000) / 1000} 3"`);
      }
      // таймер
      const tx = 142, ty = oy - 12.5, tw = 98, th = 25;
      let ta = 0, label = '05:00', pulse = 0;
      if (mode === 'sixteen' && t >= p.timer) {
        const rem = Math.max(0, 300 - (t - p.timer) * 6), rs = Math.ceil(rem);
        label = pad2(Math.floor(rs / 60)) + ':' + pad2(rs % 60);
        ta = 1; pulse = 1 - ((t - p.timer) % 1);
      } else if (mode === 'next') {
        label = '00:00';
        ta = 1 - lin(t, p.tFocus, p.tFocus + 0.4);
        pulse = 0.5 + 0.5 * Math.sin(t * 14);
      }
      if (ta > 0.01) {
        const pop = mode === 'sixteen' ? 0.55 + 0.45 * eout(lin(t, p.timer, p.timer + 0.22)) : 1;
        let tm = Ci(tx + tw / 2, ty + th / 2, 56, 'url(#glowR)', `opacity="${f1(0.55 * (0.6 + 0.4 * pulse))}"`);
        tm += R(tx, ty, tw, th, '#0a0d14', `rx="5" stroke="${C.red}" stroke-width="1.4"`);
        // иконка часов
        tm += Ci(tx + 14, ty + th / 2, 7.2, 'none', `stroke="#ff6b62" stroke-width="1.5"`) +
          L(tx + 14, ty + th / 2, tx + 14, ty + th / 2 - 4.5, '#ff6b62', 1.4, 'stroke-linecap="round"') +
          L(tx + 14, ty + th / 2, tx + 17.8, ty + th / 2 + 1.8, '#ff6b62', 1.4, 'stroke-linecap="round"');
        tm += T(tx + 28, ty + 17.5, label, 17, '#ff4a4a', 'font-family="Plex" font-weight="600" letter-spacing="1"');
        pg += G(tm, `translate(${f1(tx + tw / 2)} ${f1(ty + th / 2)}) scale(${f1(pop)}) translate(${-f1(tx + tw / 2)} ${-f1(ty + th / 2)})`, `opacity="${f1(ta)}"`);
      }
      // галочка «сработало»
      if (mode === 'next' && t >= p.ok) {
        const a = t - p.ok, k = ease(lin(a, 0, 0.3)), cxk = 108, cyk = oy;
        pg += Ci(cxk + 6, cyk - 2, 10 + 22 * eout(lin(a, 0, 0.6)), 'none', `stroke="${C.green}" stroke-width="1.6" opacity="${f1(0.7 * (1 - lin(a, 0, 0.6)))}"`);
        pg += Ci(cxk + 6, cyk - 2, 13, 'rgba(31,157,87,.18)', `opacity="${f1(k)}"`);
        pg += P(`M${cxk - 3} ${cyk + 1} L${cxk + 2.5} ${cyk + 8} L${cxk + 15} ${cyk - 10}`, 'none',
          `pathLength="1" stroke="#27c46f" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${f1(k * 1000) / 1000 || 0.001} 3"`);
      }
    }
    }
    if (par) g += G(pg, `translate(${PXP} ${f1(PY + scroll)}) rotate(${f1(rot * 100) / 100} ${PWP / 2} 150)`);
    else g += G(pg, `translate(${PX} ${f1(PY + scroll)}) rotate(${f1(rot * 100) / 100} ${PW / 2} 150)`);

    // ---------- свет фонарика: конус, пятно, пыль
    g += P('M322 30 L-30 120 L-30 420 L330 430 Z', 'url(#cj_cone)', `opacity="${f1(flick)}"`);
    g += Ci(176, 232, 205, 'url(#glowW)', `opacity="${f1(0.34 * flick)}"`);
    for (let i = 0; i < 16; i++) {
      const hx = hash(i * 2.3 + 5), hy = hash(i * 4.1 + 2), sp = 3 + hash(i * 6.7) * 5;
      const x = 40 + hx * 270 + Math.sin(t * 0.6 + i) * 7, y = 100 + (((hy * 290 - t * sp) % 290) + 290) % 290;
      g += Ci(x, y, 0.7 + hash(i * 9.1) * 0.8, `rgba(255,236,190,${f1(0.25 + 0.4 * hash(i * 3.3 + t * 0.2))})`);
    }
    g += R(-20, -20, 400, 440, 'url(#cj_dark)');
    // фонарик (голова в правом верхнем углу)
    {
      const fl = G(
        R(-74, -9, 66, 18, '#232c3f', 'rx="3"') + R(-74, -9, 66, 4, '#3a465e', 'rx="2"') +
        R(-12, -12, 12, 24, '#3a455c', 'rx="2"') + R(-12, -12, 12, 4, '#5a6882', 'rx="2"') +
        P('M0 -11 L5 -9 Q8 0 5 9 L0 11 Z', '#fff1c7'),
        'translate(322 30) rotate(126.6)');
      g += Ci(322, 30, 40, 'url(#glowW)', `opacity="${f1(0.65 * flick)}"`) + fl;
    }
    // голос: динамик слева вверху, кольца на каждой фамилии
    {
      const tr = par ? -99 : lastRead(p, t, mode), a = t - tr;
      g += speakerBox(32, 82, 0.78, 0.9);
      if (a >= 0 && a < 1.0) g += rings(32, 84, a * 1.1, { n: 2, r0: 9, r1: 36, col: '#cfd8e6', a: 0.8 * (1 - lin(a, 0.45, 1.0)), speed: 1 });
    }
    // тьма снизу: зона субтитров
    g += R(-20, 322, 400, 70, 'url(#cj_fade)');
    g += R(-20, 391, 400, 260, '#050c1a');
    return g;
  };
})();

// ============================================================
// phone_ui: p.tRec, p.tAlarm  — «Диктофон» -> «Будильник»
// ============================================================
(() => {
  const FM = 'font-family="Mont"';
  const cx = 180, PWD = 150, PHT = 257, PT = 106, X0 = cx - PWD / 2;   // всё рисуется для PT=106, группа телефона сдвигается на +5
  const SX = X0 + 5, SY = PT + 5, SW = PWD - 10, SH = PHT - 10;
  const BTN_Y = 322;
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const mixc = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(mix(v, B[i], k))).join(',')})`; };
  const W = (w) => `${FM} font-weight="${w}"`;
  const N = 30, BSP = 3.7, BX0 = cx - (N - 1) * BSP / 2;

  function screenRec(t, tRec, tStop, tAlarm) {
    const recProg = lin(t, tRec, tRec + 0.12) * (1 - lin(t, tStop, tStop + 0.15));
    const recording = t >= tRec && t < tStop;
    let a = '';
    a += T(SX + 13, 156, 'Диктофон', 13, '#fff', W(800));
    // панель записи
    a += R(SX + 9, 168, 122, 86, '#131824', 'rx="11"');
    if (recording) {
      const bl = 0.55 + 0.45 * Math.sin(t * 9);
      a += Ci(SX + 20, 180.5, 2.6, '#ff453a', `opacity="${f1(bl)}"`) + T(SX + 26.5, 183, 'ЗАПИСЬ', 6.3, '#ff6b62', MONO.replace('letter-spacing="1.2"', 'letter-spacing=".8"'));
    }
    const timer = t >= tRec + 0.95 ? '0:01' : '0:00';
    a += T(cx, 207, timer, 22, '#fff', `${W(800)} text-anchor="middle" letter-spacing=".5"`);
    // волна
    const prog = lin(t, tRec + 0.05, tRec + 1.25);          // доля уже записанного
    const done = t >= tStop;
    for (let k = 0; k < N; k++) {
      const x = BX0 + k * BSP, q = k / N;
      const tb = tRec + 0.05 + q * 1.2;
      const shown = t >= tb;
      if (!shown) { a += R(x - 1, 233, 2, 2, '#46516a', 'rx="1"'); continue; }
      const tau = q * 1.2;
      let env = 0.16 + 0.84 * Math.exp(-Math.pow((tau - 0.62) / 0.24, 2)) + 0.18 * Math.exp(-Math.pow((tau - 0.14) / 0.1, 2));
      env *= 0.55 + 0.45 * Math.abs(noise1(k * 1.9 + 4));
      let h = Math.max(2, Math.min(1, env) * 33);
      h *= eout(lin(t, tb, tb + 0.14));
      if (!done) h *= 1 + 0.14 * noise1(t * 13 + k);
      h = Math.max(2, h);
      a += R(x - 1, 234 - h / 2, 2, h, done ? '#a9b8d2' : '#ff4d4d', 'rx="1"');
    }
    if (recording) { const px = BX0 + prog * (N - 1) * BSP; a += L(px, 217, px, 252, '#ff453a', 1.2, 'opacity=".9"'); }
    // список записей
    const rowA = lin(t, tStop + 0.05, tStop + 0.4);
    if (rowA > 0) {
      const y = 262 + (1 - eout(rowA)) * 12;
      const pulse = lin(t, tAlarm - 0.75, tAlarm - 0.5) * (1 - lin(t, tAlarm - 0.1, tAlarm + 0.1));
      let r = R(SX + 9, y, 122, 34, '#1b2133', 'rx="9"');
      if (pulse > 0) r += R(SX + 8, y - 1, 124, 36, 'none', `rx="10" stroke="${C.yellow}" stroke-width="1.6" opacity="${f1(pulse * (0.6 + 0.4 * Math.sin(t * 16)))}"`);
      r += Ci(SX + 26, y + 17, 10.5, '#2b3553');
      [[-4.5, 3], [-1.5, 7], [1.5, 4.5], [4.5, 2.5]].forEach(([dx, hh]) => { r += R(SX + 26 + dx - 0.9, y + 17 - hh, 1.8, hh * 2, '#e8ecf2', 'rx=".9"'); });
      r += T(SX + 42, y + 15, 'здесь.m4a · 0:01', 8.4, '#fff', W(700));
      r += T(SX + 42, y + 26, 'Сегодня, 19:43', 6.6, '#7d8697', W(600));
      a += G(r, '', `opacity="${f1(rowA)}"`);
    } else {
      a += T(cx, 282, 'Нет записей', 7.6, '#4b566b', `${W(600)} text-anchor="middle"`);
    }
    // кнопка записи
    if (recording) a += Ci(cx, BTN_Y, 46, 'url(#glowR)', `opacity="${f1(0.55 + 0.25 * Math.sin(t * 9))}"`);
    const idle = 0.8 + 0.2 * Math.sin(t * 3);
    a += Ci(cx, BTN_Y, 21, 'none', `stroke="#e8ecf2" stroke-width="2.2" opacity="${recording ? 1 : f1(idle)}"`);
    const iw = mix(32, 15, recProg), irx = mix(16, 4, recProg);
    a += R(cx - iw / 2, BTN_Y - iw / 2, iw, iw, '#ff3b30', `rx="${f1(irx)}"`);
    // касание
    const touch = lin(t, tRec - 0.22, tRec - 0.1) * (1 - lin(t, tRec + 0.08, tRec + 0.24));
    if (touch > 0) a += Ci(cx + 1, BTN_Y + 2, 11, `rgba(255,255,255,${f1(0.4 * touch)})`);
    const rp = t - tRec;
    if (rp >= 0 && rp < 0.55) a += Ci(cx, BTN_Y, 10 + 30 * eout(rp / 0.55), 'none', `stroke="#fff" stroke-width="1.4" opacity="${f1(0.55 * (1 - rp / 0.55))}"`);
    return a;
  }

  function screenAlarm(t, tAlarm) {
    const age = t - tAlarm;
    const sw = eout(lin(t, tAlarm + 0.5, tAlarm + 0.8));
    const sk = lin(t, tAlarm + 0.05, tAlarm + 0.4);
    const sc = 0.88 + 0.12 * eout(sk) + 0.035 * Math.sin(sk * Math.PI);
    let b = '';
    b += T(SX + 13, 156, 'Будильник', 13, '#fff', W(800));
    b += Ci(SX + 122, 152, 6.5, '#262c3d') + L(SX + 119, 152, SX + 125, 152, '#ff9f0a', 1.5, 'stroke-linecap="round"') + L(SX + 122, 149, SX + 122, 155, '#ff9f0a', 1.5, 'stroke-linecap="round"');
    b += R(SX + 9, 168, 122, 118, '#161b28', 'rx="12"');
    b += T(SX + 19, 184, 'Вечер · каждый день', 7, '#7d8697', W(600));
    // время
    const glowK = 0.5 + 0.5 * Math.sin(t * 3);
    b += Ci(cx, 214, 70, 'url(#glowC)', `opacity="${f1(0.28 + 0.1 * glowK)}"`);
    b += G(T(cx, 227, '19:45', 37, '#fff', `${W(800)} text-anchor="middle" letter-spacing="-.5"`), `translate(${cx} 214) scale(${f1(sc)}) translate(${-cx} -214)`);
    b += L(SX + 19, 238, SX + 121, 238, '#262c3b', 1);
    // строка «Мелодия»
    const sweep = eout(lin(t, tAlarm + 0.85, tAlarm + 1.15));
    if (sweep > 0) b += R(SX + 9, 240, 122 * sweep, 18, 'rgba(255,207,46,.15)') + R(SX + 9, 257, 122 * sweep, 1.2, C.yellow, 'opacity=".8"');
    b += T(SX + 19, 252.5, `Мелодия: <tspan fill="${C.yellow}" font-weight="800">здесь.m4a</tspan>`, 8.2, '#d3d8e2', W(700));
    // переключатель
    b += T(SX + 19, 276, sw > 0.5 ? 'Включён' : 'Выключен', 8.2, sw > 0.5 ? '#d3d8e2' : '#7d8697', W(700));
    const tx = SX + 121 - 31, ty = 266;
    b += R(tx, ty, 31, 18, mixc('#3a3f4d', '#30d158', sw), 'rx="9"');
    b += Ci(tx + 9 + 13 * sw, ty + 9, 7.4, '#fff');
    if (age > 0.5 && age < 0.95) b += Ci(tx + 22, ty + 9, 8 + 16 * eout((age - 0.5) / 0.45), 'none', `stroke="#30d158" stroke-width="1.3" opacity="${f1(0.7 * (1 - (age - 0.5) / 0.45))}"`);
    // подпись и колокольчик
    b += T(cx, 302, 'Сработает сегодня в 19:45', 7, '#7d8697', `${W(600)} text-anchor="middle"`);
    const ring = lin(t, tAlarm + 0.7, tAlarm + 1.0), sh = Math.sin(t * 20) * 9 * ring * (0.75 + 0.25 * Math.sin(t * 5));
    const bell = G(P('M-9 7 C-9 7,-6 4,-6 -2 C-6 -8,-3 -11,0 -11 C3 -11,6 -8,6 -2 C6 4,9 7,9 7 Z', '#ffb02e') + Ci(0, 10, 2.4, '#ffb02e') + Ci(0, -12.5, 1.6, '#ffb02e'),
      `translate(${cx} 327) scale(1.2) rotate(${f1(sh)} 0 -12)`);
    b += bell;
    if (ring > 0) for (const s of [-1, 1]) for (let i = 0; i < 2; i++) {
      const e = (t * 1.6 + i * 0.5) % 1;
      b += P(`M${f1(cx + s * (15 + e * 7))} ${f1(327 - 6 - e * 2)} q ${f1(s * 4)} 6 0 12`, 'none', `stroke="#ffb02e" stroke-width="1.4" stroke-linecap="round" opacity="${f1(ring * 0.8 * (1 - e))}"`);
    }
    return b;
  }

  SCENES.phone_ui = function (u, p, d, t) {
    const tRec = p.tRec, tAlarm = p.tAlarm, tStop = tRec + 1.25;
    let g = '';
    g += `<defs><clipPath id="cp_scr"><rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" rx="18"/></clipPath></defs>`;
    g += R(-20, -20, 400, 680, '#050c1a') + P('M-20 60 H380 V400 H-20 Z', '#08122a', 'opacity=".5"');
    const e = eout(lin(u, 0, 0.55));
    const oy = (1 - e) * 28 + Math.sin(t * 1.5) * 1.1;
    const rec = t >= tRec && t < tStop;
    const glowFl = 1 + 0.06 * noise1(t * 6);
    g += Ci(cx, 238, 210 * glowFl, 'url(#glowC)', `opacity="${f1(0.62 * e)}"`);
    if (rec) g += Ci(cx, 238, 200, 'url(#glowR)', 'opacity=".28"');
    // пыль в свете экрана
    for (let i = 0; i < 14; i++) {
      const hx = hash(i * 2.3 + 8), hy = hash(i * 4.1 + 3), sp = 3 + hash(i * 6.7) * 5;
      const x = 40 + hx * 280 + Math.sin(t * 0.6 + i) * 7, y = 80 + (((hy * 300 - t * sp) % 300) + 300) % 300;
      g += Ci(x, y, 0.7 + hash(i * 9.1) * 0.8, `rgba(190,220,255,${f1(0.2 + 0.3 * hash(i * 3.3 + t * 0.2))})`);
    }
    // корпус
    let ph = '';
    ph += R(X0 - 2, PT + 62, 2.5, 22, '#1b2130', 'rx="1"') + R(X0 - 2, PT + 90, 2.5, 22, '#1b2130', 'rx="1"') + R(X0 + PWD - 0.5, PT + 76, 2.5, 34, '#1b2130', 'rx="1"');
    ph += R(X0, PT, PWD, PHT, '#0e1118', `rx="23" stroke="#2b3447" stroke-width="1.2"`);
    ph += R(SX, SY, SW, SH, '#090c13', 'rx="18"');
    // экран (с клипом): сдвиг/смена
    const kA = eout(lin(t, tAlarm - 0.02, tAlarm + 0.3));
    let sc = '';
    // статус-бар
    sc += T(SX + 15, 124, '19:43', 7.5, '#fff', W(700));
    sc += R(SX + SW - 26, 118.5, 12, 6, 'none', 'rx="1.8" stroke="#fff" stroke-width=".8" opacity=".85"') + R(SX + SW - 25, 119.5, 8, 4, '#fff', 'rx="1" opacity=".85"');
    sc += Ci(SX + SW - 32, 121.5, 1.1, '#fff') + Ci(SX + SW - 35.5, 121.5, 1.1, '#fff') + Ci(SX + SW - 39, 121.5, 1.1, '#fff', 'opacity=".5"');
    if (kA < 1) sc += G(screenRec(t, tRec, tStop, tAlarm), `translate(${f1(-34 * kA)} 0)`, `opacity="${f1(1 - lin(kA, 0, 0.6))}"`);
    if (kA > 0) sc += G(screenAlarm(t, tAlarm), `translate(${f1(34 * (1 - kA))} 0)`, `opacity="${f1(lin(kA, 0.4, 1))}"`);
    sc += R(cx - 20, PT + PHT - 13, 40, 3.2, 'rgba(255,255,255,.55)', 'rx="1.6"');
    ph += G(sc, '', 'clip-path="url(#cp_scr)"');
    ph += R(cx - 17, PT + 11, 34, 9, '#000', 'rx="4.5"');
    ph += P(`M${X0 + 5} ${PT + 40} Q${X0 + 5} ${PT + 5} ${X0 + 40} ${PT + 5} L${X0 + 74} ${PT + 5} L${X0 + 5} ${PT + 120} Z`, 'rgba(255,255,255,.035)');
    g += G(ph, `translate(0 ${f1(oy + 5)})`, `opacity="${f1(e)}"`);
    // зона субтитров — тёмная
    g += R(-20, 391, 400, 260, '#050c1a');
    return g;
  };
})();

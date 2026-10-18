// сцена intercom_screen: экран видеодомофона крупно — чёрно-белая (сине-серая) картинка с камеры на площадке, дверь «47», перила, лампа
//   p.figure  — {t, tHead, tSmile, knock:[...]} Саша у двери: t — стоит спиной; tHead — медленно разворачивает голову к камере;
//               tSmile — слишком ровная улыбка; knock — поднимает руку и стучит (два удара). Нет p.figure — площадка пуста.
//               Не переданные tHead/tSmile — «в будущем» (не наступают); figure.t по умолчанию 0.
//   figure.d  — [[t,d], ...]: мгновенные ключи расстояния 0..1; 0 — у двери,
//               1 — на марше слева за перилами. До первого ключа — у двери.
//               Проекция ног: (162-100*d,294-62*d), масштаб 1-.62*d.
//   p.glitch  — [t, ...] срыв картинки на 0.1 с (полосы, сдвиг)
//   p.flicker — [[t0, t1]] лампа на площадке мигает (картинка темнеет/светлеет)
//   p.call    — [[t0,t1], ...] интервалы вызова; вне интервалов «КАМЕРА 1». Без параметра — прежний вызов.
//   p.off     — абсолютный момент чёрного экрана: мерцание [t-.55,t-.4), затухание [t-.4,t].
//   p.clock0  — секунд на экранных часах mm:ss в момент t=0 (по умолчанию 187 = 03:07)
//   p.hm      — секунды суток в t=0: часы показывают настоящее ЧЧ:ММ (вместо тикающих mm:ss)
//   p.keys    — [t0,t1] связка в скважине; figure.keys:true — такая же в опущенной правой руке.
//   p.strip   — [t0,t1] тёплый свет под дверью, появление/угасание по .15 с внутри интервала.
//   figure.kind — 'stranger': не Саша, а чужой — высокий (почти до верха проёма), худой, тёмная длинная куртка,
//               капюшон надвинут, в капюшоне только темнота; руки длинные, опущены; голова наклонена набок.
//               tHead — медленно (1.8 с) поворачивает капюшон к камере, лица нет; tSmile и figure.keys игнорируются; knock работает.
//               Стоит на 20 px левее места Саши (×масштаб d), чтобы табличка «47» была видна рядом с капюшоном.
//               Верх капюшона при d=0 — y≈70 холста: для крупного плана нужен oy≈-190 (oy=10 капюшон срезает).
//   figure.tag  — true (или строка): красные уголки рамки захвата вокруг фигуры и плашка «НЕ ВЫ» (как рамка «ВЫ» в runtime.track);
//               захват с миганием 0.25 с при появлении, на скачках figure.d — короткий перезахват.
//   p.handle47  — [t0,t1] ручка двери «47» медленно опускается (≈34°), дёргается внизу и возвращается; дверь чуть дребезжит.
(() => {
  const CAP = 'stroke-linecap="round" stroke-linejoin="round"';
  const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const E = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${fill}" ${extra}/>`;
  const SX = 30, SY = 26, SW = 300, SH = 300;       // экран на холсте
  const FX = 162, FY = 294;                         // ноги Саши (локально в экране)
  const LAMP = [58, 22];
  const DOOR = { x: 112, y: 40, w: 110, b: 262 };
  const SK = '#c6d0dc', SK2 = '#8f9bad', SK3 = '#5f6b7e';
  const HAIR = '#141820', HAIR2 = '#323a48';
  const SHIRT = '#7f8c9f', SHIRT2 = '#505b6d', SHIRT3 = '#343d4c';
  const PANTS = '#262c38', PANTS2 = '#161b24';

  // Кольцо — начало координат; три разных бородки и небольшой пластиковый брелок.
  function keyBunch(t, lamp, swing = 0) {
    const metal = '#b6c5d6', edge = '#354153';
    let k = E(0, 0, 3, 3.5, 'none', `stroke="${edge}" stroke-width="2"`) +
      E(0, 0, 3, 3.5, 'none', `stroke="${metal}" stroke-width=".9"`);
    for (const [x, y, angle, length] of [[-1.8, 3, 23, 9], [0, 4, -4, 12], [1.9, 2.8, -27, 10]]) {
      k += G(E(0, 0, 1.7, 2, 'none', `stroke="${metal}" stroke-width="1"`) +
        P(`M-.6 1.5 L-.6 ${length} L2.2 ${length} L2.2 ${length - 2} L.7 ${length - 2} L.7 ${length - 4} L2 ${length - 4}`, 'none', `stroke="${edge}" stroke-width="2.3" ${CAP}`) +
        P(`M-.6 1.5 L-.6 ${length} L2.2 ${length} L2.2 ${length - 2} L.7 ${length - 2} L.7 ${length - 4} L2 ${length - 4}`, 'none', `stroke="${metal}" stroke-width="1" ${CAP}`),
        `translate(${x},${y}) rotate(${angle})`);
    }
    k += L(2, 2, 4, 7, metal, .8) +
      P('M3 6 L6.5 6.4 Q7.4 6.6 7.1 8 L5.9 13 Q5.7 14 4.6 13.6 L1.8 12.8 Q1 12.5 1.3 11.3 L2.3 7 Q2.5 6 3 6 Z', '#ff3030', `stroke="#794a29" stroke-width=".65"`) +
      Ci(3.7, 7.6, .65, edge) + L(2.5, 10, 2.1, 11.9, '#ffd398', .7, CAP);
    // Блик затухает вместе с лампой; без отдельных вспышек экрана.
    k += G(P('M-2.7 -1 Q-2.4 -3.1 .4 -3.3 M-.6 7 L-.6 10', 'none', `stroke="#f5f8ff" stroke-width=".85" ${CAP}`), '', `opacity="${clamp(lamp).toFixed(3)}"`);
    return G(k, `rotate(${f1(Math.sin(t * 2.8) * 5 + Math.sin(t * 1.3) * 1.5 + swing)} 0 -3)`);
  }

  // ---- голова (центр 0,0; ширина ±13.6, высота ±16). Камера сверху: макушка и чёлка видны, подбородок короче
  const FACE_F = 'M0 -16 C8.6 -16 13.6 -10 13.6 -1.5 C13.6 5.5 11 11 6.8 14.3 C4.4 16.1 -4.4 16.1 -6.8 14.3 C-11 11 -13.6 5.5 -13.6 -1.5 C-13.6 -10 -8.6 -16 0 -16 Z';
  // мягкие вихры по верху: овальные пряди, без шипов
  const tufts = () =>
    E(-8, -17, 5.2, 3.1, HAIR, 'transform="rotate(-32 -8 -17)"') + E(-1, -19.2, 5.8, 3.2, HAIR, 'transform="rotate(-8 -1 -19.2)"') +
    E(6.4, -17.8, 5.2, 3.1, HAIR, 'transform="rotate(24 6.4 -17.8)"') + E(11.4, -12.6, 4.2, 2.7, HAIR, 'transform="rotate(58 11.4 -12.6)"') +
    P('M3.6 -20.4 Q6.4 -23 9.6 -22.4 M-12.8 -11.6 Q-15.6 -12 -16.6 -9.8', 'none', `stroke="${HAIR}" stroke-width="1.6" ${CAP}`);
  const ears = (a, b) => E(-13.5, 2, 2.5, 4.4, a) + E(13.5, 2, 2.5, 4.4, b) +
    P('M-13.8 -0.6 Q-12.4 2 -13.6 4.8 M13.8 -0.6 Q12.4 2 13.6 4.8', 'none', `stroke="${SK3}" stroke-width=".7" opacity=".8" ${CAP}`);

  // затылок
  function headBack() {
    let g = '';
    g += ears(SK2, SK3);
    g += E(0, 5, 10.4, 10.6, SK3);
    g += P('M-14.2 2 C-15.6 -9 -11 -18.8 0 -19.3 C11 -18.8 15.6 -9 14.2 2 C13.6 6 12 8.6 10 10.4 C9.2 9 8 8.6 7 9.6 C6.4 11.8 4.6 12.6 3 11.6 C2 10.4 0 10.2 -1 11.6 C-2.6 12.8 -4.6 12.2 -5.4 10.2 C-6.6 8.8 -8.4 9 -9.6 10.2 C-11.8 8.4 -13.6 5.8 -14.2 2 Z', HAIR);
    g += tufts();
    // пряди от макушки (вихор справа-сверху)
    g += P('M2.6 -9 Q-5 -9 -11 -2 M2.6 -9 Q-3 -3 -6 8.6 M2.6 -9 Q3.6 0 3.2 10 M2.6 -9 Q9 -3 11 4 M2.6 -9 Q10 -10 12.4 -12 M2.6 -9 Q-3 -15 -9 -15.6', 'none', `stroke="${HAIR2}" stroke-width=".9" opacity=".5" ${CAP}`);
    g += P('M-13.6 -2 C-14.6 -10 -10.4 -17.4 -2.6 -18.8', 'none', `stroke="#dfe8f5" stroke-width="1.2" opacity=".42" ${CAP}`);
    return g;
  }
  // лицо в камеру: s — улыбка 0..1 (тонкая, ровная, без зубов); глаза не участвуют
  function headFront(s) {
    let g = '';
    g += ears(SK, SK2);
    g += P(FACE_F, 'url(#ic_skin)');
    let sh = '';
    sh += P('M6.4 -16 C12 -6 11.4 6 4.6 16.4 L16 16.4 L16 -16 Z', 'rgba(36,48,66,.34)');      // правая щека в тени (лампа слева сверху)
    sh += E(-5.2, -.8, 5.6, 4.4, 'url(#ic_sock)') + E(5.2, -.8, 5.6, 4.4, 'url(#ic_sock)'); // глазницы — мягкая тень от верхнего света
    sh += R(-14, -9, 28, 4.2, 'rgba(20,28,42,.28)');                                              // тень от чёлки
    sh += E(-4.6, 6.6, 3.6, 2.2, 'rgba(240,246,255,.14)');
    g += G(sh, '', 'clip-path="url(#ic_fcF)"');
    let f = '';
    // брови — ровные, спокойные
    f += P('M-9.4 -5 Q-6 -6.2 -2.4 -5.3 M9.4 -5 Q6 -6.2 2.4 -5.3', 'none', `stroke="${HAIR}" stroke-width="1.5" ${CAP}`);
    // глаза: тёмный миндаль без зрачка и без белка, тяжёлое верхнее веко
    const eye = (sx) => `<path transform="scale(${sx} 1)" d="M-8.3 -0.6 C-6.9 -2.5 -3.7 -2.6 -2.2 -0.9 C-3.6 0.7 -6.9 0.8 -8.3 -0.6 Z" fill="#04060a"/>` +
      `<path transform="scale(${sx} 1)" d="M-8.6 -0.5 C-7 -2.9 -3.6 -3 -1.9 -1" fill="none" stroke="#2a3242" stroke-width=".8" ${CAP}/>`;
    f += eye(1) + eye(-1);
    // нос
    f += P('M0.6 -2 C1.4 1.4 2.2 3.6 2.2 5.2', 'none', `stroke="${SK3}" stroke-width=".7" opacity=".55" ${CAP}`) +
      P('M-1.9 5.6 Q0 6.9 1.9 5.6', 'none', `stroke="${SK3}" stroke-width="1" ${CAP}`) + E(-1.3, 5.9, .75, .5, '#2a3242') + E(1.4, 5.9, .75, .5, '#2a3242') +
      L(-.4, -2, -.4, 3.6, 'rgba(240,246,255,.3)', 1, CAP);
    // рот: прямая линия, уголки ровно приподняты — слишком аккуратная улыбка
    const hw = mix(3.4, 6, s), y0 = 10.2, cu = .6 * s;
    const mouth = `M${f1(-hw)} ${f1(y0 - cu)} Q${f1(-hw + 1.3)} ${f1(y0 + .2)} ${f1(-hw + 2.6)} ${f1(y0 + .25)} L${f1(hw - 2.6)} ${f1(y0 + .25)} Q${f1(hw - 1.3)} ${f1(y0 + .2)} ${f1(hw)} ${f1(y0 - cu)}`;
    f += P(`M${f1(-hw + 1)} ${f1(y0 - .9)} Q0 ${f1(y0 - 1.6)} ${f1(hw - 1)} ${f1(y0 - .9)}`, 'none', `stroke="${SK3}" stroke-width=".8" opacity=".45" ${CAP}`);
    f += P(mouth, 'none', `stroke="#141922" stroke-width="1.15" ${CAP}`);
    if (s > .05) f += P(`M${f1(-hw - .6)} ${f1(y0 - cu - 1)} q-.9 1 -.5 2.2 M${f1(hw + .6)} ${f1(y0 - cu - 1)} q.9 1 .5 2.2`, 'none', `stroke="${SK3}" stroke-width=".7" opacity="${f1(.35 * s)}" ${CAP}`);
    f += E(0, 14.6, 5.4, 1.3, 'rgba(25,34,48,.25)');
    g += f;
    // чёлка: мягкие пряди лопастями, свисают на лоб
    g += P('M-14 0 C-15.6 -9 -12 -17.5 -2 -19 C7 -20.2 14.6 -15 14.4 -4 C14.2 -1.5 14 0.5 13.4 2 C12.8 -1 12.4 -3.2 11.2 -5 C10.8 -3.6 9.6 -2.8 8.6 -3.4 C9 -5.4 8 -7 6.4 -7.4 C5.6 -5.8 3.6 -5.2 2.2 -6 C2 -7.6 0.4 -8.6 -1.4 -8 C-2.4 -6.2 -4.6 -5.6 -5.8 -6.6 C-6.8 -8 -8.6 -7.8 -9.6 -6.4 C-10.6 -4.6 -11.8 -3.4 -12.2 -1.8 C-12.8 -.6 -13.4 .4 -14 0 Z', HAIR);
    g += tufts();
    g += P('M-11 -7.4 Q-9.4 -13.6 -3.4 -17 M-4 -8.6 Q-2 -14 4 -17.4 M3 -7.6 Q6 -12.4 11 -14 M9.4 -4.6 Q11.6 -8.4 13 -11', 'none', `stroke="${HAIR2}" stroke-width=".95" opacity=".9" ${CAP}`);
    g += P('M-13.4 -3 C-14.6 -11 -10.6 -17.4 -3 -19', 'none', `stroke="#dfe8f5" stroke-width="1.2" opacity=".42" ${CAP}`) +
      P('M-13.3 1 C-13 6 -11 10.4 -7.4 13.6', 'none', `stroke="#e8f0fb" stroke-width="1" opacity=".3" ${CAP}`);
    return g;
  }
  // конечность-трапеция со скруглёнными концами
  const limb = (A, B, wa, wb, fill) => {
    const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    return P(`M${f1(A[0] + nx * wa / 2)} ${f1(A[1] + ny * wa / 2)} L${f1(B[0] + nx * wb / 2)} ${f1(B[1] + ny * wb / 2)} L${f1(B[0] - nx * wb / 2)} ${f1(B[1] - ny * wb / 2)} L${f1(A[0] - nx * wa / 2)} ${f1(A[1] - ny * wa / 2)} Z`, fill) +
      Ci(A[0], A[1], wa / 2, fill) + Ci(B[0], B[1], wb / 2, fill);
  };
  // рука: плечо S, локоть Eb, запястье W; fist 0..1 — кисть сжата; lit — освещённая сторона
  function armDraw(S, Eb, W, lit, fist, fs = 1) {
    const sk = lit ? SK : SK2, sl = lit ? SHIRT : SHIRT2;
    let g = '';
    g += limb(Eb, W, 8.2, 6.4, sk);
    g += limb(S, Eb, 10, 8.4, sk);
    g += P(`M${f1(Eb[0] - 2.4)} ${f1(Eb[1] + .6)} q2.4 1.6 4.6 -.2`, 'none', `stroke="${SK3}" stroke-width=".8" opacity=".7" ${CAP}`);
    const M = [mix(S[0], Eb[0], .5), mix(S[1], Eb[1], .5)];
    g += limb(S, M, 12.6, 11.6, sl);
    const dx = Eb[0] - S[0], dy = Eb[1] - S[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * 5.8, ny = dx / l * 5.8;
    g += L(M[0] + nx, M[1] + ny, M[0] - nx, M[1] - ny, SHIRT3, 1.4, CAP);
    const ux = W[0] - Eb[0], uy = W[1] - Eb[1], ul = Math.hypot(ux, uy) || 1, ang = Math.atan2(uy, ux) * 180 / Math.PI - 90;
    if (fist > .5) {
      const cx = W[0] + ux / ul * 3.6, cy = W[1] + uy / ul * 3.6;
      g += G(R(-4.8, -4.4, 9.6, 9, sk, 'rx="3.4"') + P('M-3.6 -2.2 L3.6 -2.2', 'none', `stroke="${SK3}" stroke-width=".7" ${CAP}`) +
        P('M-1.2 -4.2 L-1.2 -2.4 M1.4 -4.2 L1.4 -2.4', 'none', `stroke="${SK3}" stroke-width=".55" opacity=".8"`) + P('M-4.6 1.2 Q-1 3.2 2.4 1.6', 'none', `stroke="${SK3}" stroke-width=".7" ${CAP}`),
        `translate(${f1(cx)},${f1(cy)}) scale(${f1(fs)})`);
    } else {
      const cx = W[0] + ux / ul * 4.6, cy = W[1] + uy / ul * 4.6;
      g += G(E(0, 0, 3.9, 5.8, sk) + P('M-1.6 1.8 L-1.6 5 M.6 2.2 L.6 5.4', 'none', `stroke="${SK3}" stroke-width=".5" opacity=".7"`), `translate(${f1(cx)},${f1(cy)}) rotate(${f1(ang)})`);
    }
    if (lit) g += P(`M${f1(S[0] - 6)} ${f1(S[1] + 3)} L${f1(M[0] - 6)} ${f1(M[1])}`, 'none', `stroke="rgba(225,236,250,.4)" stroke-width="1.1" ${CAP}`);
    return g;
  }

  // ======================= чужой (figure.kind:'stranger') =======================
  // Локально: ноги в (0,0), верх капюшона ≈ -250 (у Саши макушка ≈ -186). Свет лампы слева сверху.
  // Куртка почти чёрная: подсветка лампы и экранные слои всё равно её приподнимут; читается краевым светом слева.
  const COAT2 = '#181d25', COAT3 = '#0a0d12', COATS = '#262d38', RIM = 'rgba(222,234,250,.55)';
  const HAND = '#a5b0c0', HAND2 = '#738097';
  const NECK_Y = -201, HOOD_Y = -224;
  const COAT_D = 'M-7 -203 C-12.6 -202 -17.4 -199 -19.6 -193.4 C-21 -188 -20 -176 -19.2 -160 C-18.4 -146 -17.6 -132 -17.8 -118 C-18.4 -100 -20.4 -82 -21.6 -66 Q0 -61.8 21.6 -66 C20.4 -82 18.4 -100 17.8 -118 C17.6 -132 18.4 -146 19.2 -160 C20 -176 21 -188 19.6 -193.4 C17.4 -199 12.6 -202 7 -203 Z';
  // капюшон со спины: округлый, с едва заметным «хвостиком» на макушке
  const HOOD_D = 'M2.4 -26.4 C10.6 -24.6 16.2 -16.6 16.2 -4.6 C16.2 5.6 13.8 13.4 10 19.6 Q0 21.4 -10 19.6 C-13.8 13.4 -16.2 5.6 -16.2 -4.6 C-16.2 -15.8 -10 -23.6 -1.4 -24.6 C.2 -24.8 1.4 -25.4 2.4 -26.4 Z';
  // проём капюшона — арка, сужается книзу; внутри ничего
  const VOID_D = 'M0 -13 C7.4 -13 10.6 -5.4 10.6 2.6 C10.6 10.4 6.4 16.6 0 19 C-6.4 16.6 -10.6 10.4 -10.6 2.6 C-10.6 -5.4 -7.4 -13 0 -13 Z';
  const COWL_D = 'M-13.6 -211 C-17.6 -206 -19.6 -200 -18.8 -194.4 Q0 -189 18.8 -194.4 C19.6 -200 17.6 -206 13.6 -211 Q0 -205.6 -13.6 -211 Z';
  const S_SL = [-17.6, -189], S_SR = [17.6, -189];
  const S_EL = [-22.2, -143], S_WL = [-24, -98], S_ER = [22.2, -143], S_WR = [24, -98];
  const S_UE = [42, -175], S_UW = [31.5, -205];
  const SOX = -20;   // чужой стоит левее места Саши: капюшон на высоте таблички, а «47» должна оставаться видна
  const strangerDefs = `<defs>
      <linearGradient id="ic_coat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#323b49"/><stop offset=".45" stop-color="#1e242e"/><stop offset="1" stop-color="#0d1016"/></linearGradient>
      <linearGradient id="ic_hoodg" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="#3e4858"/><stop offset=".45" stop-color="#232a35"/><stop offset="1" stop-color="#10141a"/></linearGradient>
      <radialGradient id="ic_void" cx=".5" cy=".35" r=".75"><stop offset="0" stop-color="#000"/><stop offset=".7" stop-color="#010204"/><stop offset="1" stop-color="#070a0f"/></radialGradient>
      <clipPath id="ic_hoodclip"><path d="${HOOD_D}"/></clipPath>
    </defs>`;

  // рукав куртки + длинная бледная кисть (или кулак при стуке)
  function sleeve(S, Eb, W, lit, fist, fs = 1) {
    const c = lit ? COATS : COAT2, h = lit ? HAND : HAND2;
    const ux = W[0] - Eb[0], uy = W[1] - Eb[1], ul = Math.hypot(ux, uy) || 1, ang = Math.atan2(uy, ux) * 180 / Math.PI - 90;
    const nx = -uy / ul, ny = ux / ul;
    let g = '';
    if (fist > .5) {
      const cx = W[0] + ux / ul * 3.8, cy = W[1] + uy / ul * 3.8;
      g += G(R(-4.4, -4.6, 8.8, 9.2, h, 'rx="3.2"') + P('M-3.2 -2.2 L3.2 -2.2', 'none', `stroke="${SK3}" stroke-width=".7" ${CAP}`),
        `translate(${f1(cx)},${f1(cy)}) rotate(${f1(ang)}) scale(${f1(fs)})`);
    } else {
      // кисть висит из рукава: узкая, длинная, пальцы сомкнуты, без деталей
      const cx = W[0] + ux / ul * 7.4, cy = W[1] + uy / ul * 7.4;
      g += G(P('M-2.8 -7.6 C-3.5 -2 -3.3 4.4 -2.3 8.8 C-1.5 10.9 1.4 10.9 2.2 8.8 C3.2 4.4 3.4 -2 2.7 -7.6 Z', h) +
        P('M-.8 2.4 L-.9 9.4', 'none', `stroke="${SK3}" stroke-width=".55" opacity=".6" ${CAP}`) +
        P('M1.4 -7.6 C2.4 -2 2.2 4.4 1.2 9.6', 'none', 'stroke="rgba(10,14,20,.35)" stroke-width="1.6"') +
        R(-3, -7.6, 6, 3.6, 'rgba(8,11,16,.5)'), `translate(${f1(cx)},${f1(cy)}) rotate(${f1(ang)})`);
    }
    g += limb(Eb, W, 8.4, 7.8, c);
    g += limb(S, Eb, 9.8, 8.6, c);
    // манжета, складка на локте, тёмный зазор с телом (внутренняя сторона) и краевой свет снаружи
    g += L(W[0] + nx * 4.3, W[1] + ny * 4.3, W[0] - nx * 4.3, W[1] - ny * 4.3, COAT3, 1.7, CAP);
    g += P(`M${f1(Eb[0] - 3)} ${f1(Eb[1] - 1)} q3 2 5.6 .2`, 'none', `stroke="${COAT3}" stroke-width=".9" opacity=".8" ${CAP}`);
    const sd = Math.sign(S[0]);
    g += L(Eb[0] - sd * 4, Eb[1] + 2, W[0] - sd * 3.6, W[1] - 1, COAT3, 1.2, CAP);
    if (lit) g += L(S[0] - 4.6, S[1] + 3, Eb[0] - 4.3, Eb[1], RIM, 1.1, CAP) + L(Eb[0] - 4.1, Eb[1], W[0] - 3.8, W[1] - 1.6, 'rgba(222,234,250,.35)', 1, CAP);
    else g += L(Eb[0] + 4.1, Eb[1] + 4, W[0] + 3.8, W[1] - 2, 'rgba(222,234,250,.12)', .9, CAP);
    return g;
  }

  // капюшон в своих координатах (центр 0,0); k — поворот к камере 0..1: проём наползает слева, складки уходят вправо
  function hood(k) {
    let g = P(HOOD_D, 'url(#ic_hoodg)');
    const clip = 'clip-path="url(#ic_hoodclip)"';
    let in_ = E(14.6, -1, 9, 28, 'rgba(3,5,8,.42)') + E(0, 22, 18, 7, 'rgba(3,5,8,.55)');
    // мягкие складки от макушки к вороту (со спины)
    if (k < .98) in_ += G(P('M3 -23.6 C7.4 -12 8.6 2 7 18.4', 'none', `stroke="${COAT3}" stroke-width="1.1" opacity=".45" ${CAP}`) +
      P('M.6 -22.8 C-3.4 -11 -5.6 3 -6.2 17.4', 'none', `stroke="rgba(200,214,234,.09)" stroke-width="1" ${CAP}`),
      `translate(${f1(14 * k)},0)`, `opacity="${f1(1 - k)}"`);
    if (k > 0) {
      const ox = mix(-24.5, 0, k), oy = mix(2, 3.4, k), sx = mix(.36, 1.1, k), sy = mix(1, 1.05, k);
      // край проёма (толстая кромка ткани), светлее сверху-слева, затем темнота
      in_ += G(P(VOID_D, '#2a323e', 'transform="scale(1.24 1.17) translate(0,-.6)"') +
        P(VOID_D, 'url(#ic_void)') +
        P('M-10.4 1.6 C-10.4 -6.8 -6.6 -14.6 1.2 -14.8', 'none', `stroke="rgba(222,234,250,.42)" stroke-width="1.3" transform="scale(1.18 1.12)" ${CAP}`),
        `translate(${f1(ox)},${f1(oy)}) scale(${f1(sx)},${f1(sy)})`);
    }
    g += G(in_, '', clip);
    g += P('M-15.6 -2 C-15.8 -14 -9.6 -23.4 -1.4 -24.6', 'none', `stroke="${RIM}" stroke-width="1.3" ${CAP}`);
    return g;
  }

  // контур чужого для тени на стене (сплошной, прозрачность — группой, чтобы перекрытия не темнели)
  function strangerSil(tilt, armUp) {
    const c = 'rgb(0,3,8)';
    return P(COAT_D, c) + P('M-10.6 -68 L-10 -6 L10 -6 L10.6 -68 Z', c) +
      P(`M${S_SL[0]} ${S_SL[1]} L${S_EL[0]} ${S_EL[1]} L${S_WL[0]} ${S_WL[1] + 14}` + (armUp ? '' : ` M${S_SR[0]} ${S_SR[1]} L${S_ER[0]} ${S_ER[1]} L${S_WR[0]} ${S_WR[1] + 14}`), 'none', `stroke="${c}" stroke-width="8.6" ${CAP}`) +
      G(P(HOOD_D, c), `rotate(${f1(tilt)} 0 ${NECK_Y}) translate(0,${HOOD_Y})`);
  }

  function strangerFig(o) {
    const { k, tilt, sway, arm, eR, wR, wind, ring, ringA } = o;
    let s = '';
    if (ringA > 0 && arm > .5) s += E(wR[0] + 1, wR[1] + 3, 6 + 7 * ring, 4 + 4 * ring, `rgba(225,236,252,${f1(.22 * ringA)})`);
    // ноги: тонкие, почти чёрные; ботинки без светлой подошвы
    s += P('M-10.4 -68 L-2.8 -68 L-3.6 -8 L-9.4 -8 Z', '#141920') + P('M2.8 -68 L10.4 -68 L9.4 -8 L3.6 -8 Z', '#0c0f15');
    s += P('M-10.4 -68 L-9 -68 L-8.3 -8 L-9.4 -8 Z', 'rgba(205,220,240,.2)');
    s += E(-7, -4.6, 5.6, 3.6, '#080b10') + E(7, -4.6, 5.6, 3.6, '#080b10') + P('M-12 -5.6 Q-7 -8.6 -2 -5.6', 'none', `stroke="rgba(190,205,225,.25)" stroke-width=".9" ${CAP}`);
    // длинная куртка со спины
    let c = P(COAT_D, 'url(#ic_coat)');
    c += P('M0 -196 L0 -94', 'none', `stroke="${COAT3}" stroke-width="1" opacity=".8"`) +
      P('M0 -94 L.5 -63.6', 'none', `stroke="${COAT3}" stroke-width="1.7"`) + P('M-1.3 -93 L-1 -64', 'none', 'stroke="rgba(190,205,225,.14)" stroke-width=".8"');
    c += P('M-17.4 -177 Q0 -171 17.4 -177', 'none', `stroke="${COAT3}" stroke-width=".9" opacity=".6" ${CAP}`);
    c += P('M-11 -150 Q-13 -124 -10.4 -98 M9.4 -144 Q11.4 -116 9.6 -94 M-14.6 -92 Q-16.2 -79 -15 -64.6 M13.8 -90 Q15.4 -77 14.4 -64.6', 'none', `stroke="${COAT3}" stroke-width=".9" opacity=".55" ${CAP}`);
    c += P('M-21.6 -66 Q0 -61.8 21.6 -66', 'none', `stroke="${COAT3}" stroke-width="1.8" ${CAP}`) +
      P('M-18.1 -112 C-18.8 -96 -20.4 -82 -21.5 -66.6', 'none', `stroke="${RIM}" stroke-width="1" opacity=".7" ${CAP}`);
    c += P('M-7 -203 C-12.6 -202 -17.4 -199 -19.6 -193.4', 'none', `stroke="${RIM}" stroke-width="1.3" ${CAP}`);
    s += c;
    // руки висят вдоль тела
    s += sleeve(S_SL, S_EL, S_WL, 1, 0);
    if (arm <= .05) s += sleeve(S_SR, S_ER, S_WR, 0, 0);
    // капюшон: наклон набок вокруг шеи; тень от него на спине; складки капюшона на плечах поверх
    s += E(0, -196.6, 13.4, 4.6, 'rgba(4,6,10,.55)');
    s += G(hood(k), `rotate(${f1(tilt)} 0 ${NECK_Y}) translate(0,${HOOD_Y})`);
    s += P(COWL_D, 'url(#ic_hoodg)') + P('M-16.4 -199 Q0 -193.4 16.4 -199', 'none', `stroke="${COAT3}" stroke-width=".9" opacity=".6" ${CAP}`) +
      P('M-13.6 -211 C-17.6 -206 -19.6 -200 -18.8 -194.4', 'none', `stroke="${RIM}" stroke-width="1.1" ${CAP}`) +
      P('M-12 -209.6 Q0 -205 12 -209.6', 'none', `stroke="${COAT3}" stroke-width="1.3" opacity=".85" ${CAP}`);
    if (arm > .05) s += sleeve(S_SR, eR, wR, 0, arm, 1 + .1 * wind);
    return G(s, `rotate(${f1(sway)})`);
  }

  SCENES.intercom_screen = function (u, p, d, t) {
    // off — конец выключения, а не начало: к tOff картинка уже полностью погасла.
    const tOff = p.off ?? Infinity;
    const shutdown = t >= tOff - .55;
    let backlight = 1;
    if (shutdown) {
      if (t < tOff - .4) {
        const phase = (t - (tOff - .55)) / .15;
        // Два провала подсветки, без усиления яркости и без вспышек.
        backlight = phase < .24 ? .45 : phase < .52 ? .9 : phase < .78 ? .32 : .75;
      } else backlight = 1 - sstep(tOff - .4, tOff, t);
    }
    const F = p.figure || null;
    const ft = F ? (F.t ?? 0) : 1e9, tH = F ? (F.tHead ?? 1e9) : 1e9, tS = F ? (F.tSmile ?? 1e9) : 1e9;
    const knocks = (F && F.knock) || [];
    const stranger = !!F && F.kind === 'stranger';
    // у Саши голова переключается на срыве картинки; чужой поворачивает капюшон плавно — без срыва
    const glitches = [...(p.glitch || []), ...(tH < 1e8 && !stranger ? [tH - .03] : [])], flick = p.flicker || [];
    const vis = t >= ft;
    // Последний наступивший ключ; от порядка вызовов рендера ничего не зависит.
    let distance = 0, distanceTime = -Infinity;
    for (const [at, value] of (F && F.d) || []) {
      if (Number.isFinite(at) && Number.isFinite(value) && at <= t && at >= distanceTime) {
        distance = clamp(value);
        distanceTime = at;
      }
    }
    const fi = Math.floor(t * 20);

    // ---- лампа
    let Lm = 1 + 0.012 * noise1(t * 40);
    for (const [a, b] of flick) if (t >= a && t < b) {
      const n = noise1(t * 31 + 7) + noise1(t * 13 + 2) * .8;
      Lm *= n > 0.15 ? 1 : n > -0.45 ? 0.5 : 0.16;
    }
    // ---- голова: медленно приподнимается со спины, затем на срыве картинки — уже лицом в камеру (без промежуточных кадров)
    const tSw = tH + .04;
    const front = t >= tSw;
    const kPre = front ? 0 : sstep(tH - 1.1, tH, t);
    const kSet = sstep(tSw, tSw + .5, t);
    const sm = ease(lin(t, tS, tS + 1.1));
    const tilt = front ? 4.5 * sstep(tS + .5, tS + 3.6, t) : -4 * kPre + noise1(t * .4 + 5) * .8;
    // ---- рука / стук: два удара на каждый knock, перед ударом — замах кулаком к себе
    let arm = 0, rap = 0, shake = 0, wind = 0, ring = 0, ringA = 0;
    for (const kt of knocks) {
      arm = Math.max(arm, eout(lin(t, kt - .4, kt - .1)) * (1 - ease(lin(t, kt + .6, kt + 1.0))));
      for (const dt of [0, .22]) {
        const th = kt + dt, a = t - th;
        wind = Math.max(wind, sstep(th - .16, th - .07, t) * (1 - sstep(th - .045, th, t)));
        if (a >= 0 && a < .6) { rap += Math.exp(-a * 16); shake += Math.exp(-a * 11) * Math.sin(a * 70) * 1.6; }
        if (a >= 0 && a < .2) { ring = Math.max(ring, a / .2); ringA = Math.max(ringA, 1 - a / .2); }
      }
    }
    Lm = Math.max(.1, Lm - .06 * rap);
    const breath = Math.sin(t * 2.1) * .45 * (1 - .85 * kSet);

    // ======================= картинка камеры =======================
    let pic = '';
    pic += R(0, 0, SW, SH, 'url(#ic_wall)');
    // низ стены окрашен (панель) с кромкой
    pic += R(0, 138, SW, 130, 'url(#ic_dado)') + R(0, 137, SW, 2.4, 'rgba(210,222,238,.5)') + R(0, 139.4, SW, 2, 'rgba(10,16,26,.5)');
    // потолок с лёгкой перспективой
    pic += P(`M0 0 L${SW} 0 L${SW} 14 Q${SW / 2} 28 0 14 Z`, '#242c38') + P(`M0 14 Q${SW / 2} 28 ${SW} 14`, 'none', 'stroke="rgba(190,205,225,.35)" stroke-width="1.2"');
    // электрощит и труба справа
    pic += R(250, 62, 42, 62, '#5d6878', 'rx="2"') + R(252, 64, 38, 58, '#7a8798', 'rx="1.5"') + L(271, 64, 271, 122, '#4a5463', 1) + R(266, 90, 3.5, 9, '#c5ceda', 'rx="1.5"') + R(276, 76, 10, 6, '#aab4c2') +
      R(255, 112, 14, 7, '#d8dee8', 'opacity=".7"') + L(256, 115, 267, 115, '#6c7686', .6);
    pic += R(298, 14, 5, 250, '#4a5463') + R(298, 14, 1.6, 250, 'rgba(220,232,250,.4)') + R(296, 90, 9, 4, '#3a4352') + R(296, 180, 9, 4, '#3a4352');
    // выключатель слева от двери (над перилами)
    pic += R(84, 98, 14, 22, '#cdd6e2', 'rx="2"') + R(87, 103, 8, 12, '#b2bdcb', 'rx="1.5"');

    // ---- ручка «47» (p.handle47): медленно вниз, два рывка внизу, медленно назад; дверь дребезжит в пределах полпикселя
    let hAng = 0, hRattle = 0, hSwing = 0;
    if (p.handle47) {
      const [h0, h1] = p.handle47, hd = Math.max(.2, h1 - h0);
      const down = sstep(h0, h0 + .42 * hd, t), up = sstep(h1 - .36 * hd, h1, t);
      const hold = sstep(h0 + .3 * hd, h0 + .42 * hd, t) * (1 - sstep(h1 - .4 * hd, h1 - .3 * hd, t));
      const jerk = hold * Math.max(0, Math.sin((t - h0 - .42 * hd) / (.22 * hd) * Math.PI * 2));
      hAng = 34 * down * (1 - up) + 4 * jerk;
      hRattle = .55 * jerk * Math.sin(t * 47);
      if (t >= h0 && t < h1 + 1.2) hSwing = 7 * Math.sin((t - h0) * 7.5) * Math.exp(-Math.max(0, t - h0 - .42 * hd) * 2.2) * sstep(h0, h0 + .3 * hd, t);
    }
    // ---- дверь
    const dx = shake + hRattle, X0 = DOOR.x, X1 = DOOR.x + DOOR.w, Y0 = DOOR.y, Y1 = DOOR.b;
    let dr = '';
    dr += P(`M${X0 - 8} ${Y1} Q${X0 - 11} ${(Y0 + Y1) / 2} ${X0 - 8} ${Y0 - 6} Q${(X0 + X1) / 2} ${Y0 - 12} ${X1 + 8} ${Y0 - 6} Q${X1 + 11} ${(Y0 + Y1) / 2} ${X1 + 8} ${Y1} Z`, '#2a323f');
    dr += P(`M${X0 - 8} ${Y1} Q${X0 - 11} ${(Y0 + Y1) / 2} ${X0 - 8} ${Y0 - 6}`, 'none', 'stroke="rgba(200,215,235,.35)" stroke-width="1.2"');
    dr += P(`M${X0} ${Y1} Q${X0 - 2.5} ${(Y0 + Y1) / 2} ${X0} ${Y0} Q${(X0 + X1) / 2} ${Y0 - 5} ${X1} ${Y0} Q${X1 + 2.5} ${(Y0 + Y1) / 2} ${X1} ${Y1} Z`, 'url(#ic_door)');
    // филёнки
    const pan = (y0, y1) => R(X0 + 13, y0, DOOR.w - 26, y1 - y0, '#5a6676', 'rx="2"') + R(X0 + 13, y0, DOOR.w - 26, 2, 'rgba(10,16,26,.55)') + R(X0 + 13, y0, 2, y1 - y0, 'rgba(10,16,26,.45)') +
      R(X0 + 13, y1 - 1.6, DOOR.w - 26, 1.6, 'rgba(225,235,248,.28)') + R(X1 - 15, y0, 2, y1 - y0, 'rgba(225,235,248,.2)');
    dr += pan(Y0 + 10, Y0 + 104) + pan(Y0 + 116, Y1 - 10);
    // табличка «47», глазок, ручка и замок
    dr += R(158, 56, 30, 17, '#d9e0ea', 'rx="2"') + R(158, 56, 30, 17, 'none', 'rx="2" stroke="#2a323f" stroke-width="1"') + T(173, 69.2, '47', 13, '#1b2029', 'text-anchor="middle" font-family="Mont" font-weight="800"');
    dr += Ci(173, 86, 3.4, '#1a1f28') + Ci(173, 86, 2, '#6c7788') + Ci(172.4, 85.4, .7, '#e7eef8');
    const lever = R(190, 164, 22, 4.4, '#c3ccd8', 'rx="2.2"') + R(190, 164, 22, 1.4, 'rgba(255,255,255,.6)', 'rx=".7"');
    dr += R(200, 160, 14, 13, '#2c3441', 'rx="2"') +
      (hAng > .01 ? G(R(190, 165.8, 22, 4.4, 'rgba(6,10,16,.5)', 'rx="2.2"'), `rotate(${f1(-hAng)} 208 166.2) translate(.6,1)`) + G(lever, `rotate(${f1(-hAng)} 208 166.2)`) + Ci(208, 166.2, 1.5, '#8994a6') : lever) +
      Ci(205, 182, 2.6, '#2a313c') + Ci(205, 182, 1.2, '#9aa5b5');
    dr += R(X0, Y1 - 18, DOOR.w, 18, 'rgba(10,16,26,.38)') + R(X0, Y1 - 18, DOOR.w, 1.4, 'rgba(210,222,240,.4)');
    // полоса света снизу двери нет (улица) — тёмная щель порога
    dr += R(X0 - 4, Y1 - 1, DOOR.w + 8, 3, '#0a0e14');
    if (p.keys && t >= p.keys[0] && t < p.keys[1]) {
      // Стержень уходит в существующую скважину; головка выступает из полотна.
      dr += L(205, 182, 209, 184, '#d3deea', 1.5, CAP) +
        E(209.2, 184.2, 1.7, 2.1, '#9eafc3', 'stroke="#354153" stroke-width=".7"') +
        G(keyBunch(t, Lm, hSwing), 'translate(209.5,188) scale(1.7)');
    }
    pic += G(dr, `translate(${f1(dx)},0)`);

    // ---- лестница слева: поручень, стойки, ступени, тёмный пролёт
    let st = '';
    const rail = x => 176 + (112 - x) * 0.4545;
    st += P(`M-6 ${f1(rail(-6) + 80)} L112 262 L112 ${SH + 4} L-6 ${SH + 4} Z`, '#06090e');
    // ступени (профиль), края светлые
    for (let i = 0; i < 7; i++) {
      const xr = 112 - 22 * i, yt = 262 + 10 * i;
      st += R(xr - 22, yt, 22, SH - yt + 4, i % 2 ? '#0b1017' : '#0e141c') + R(xr - 22, yt, 22, 1.6, 'rgba(150,170,195,.28)') + R(xr - 22, yt, 1.2, 10, 'rgba(0,0,0,.5)');
    }
    // фон между стойками — стена пролёта
    st += P(`M-6 ${f1(rail(-6))} L112 176 L112 262 L-6 ${f1(rail(-6) + 80)} Z`, 'url(#ic_well)', 'opacity=".95"');
    const railStart = st.length;
    for (let i = 0; i < 6; i++) {
      const bx = 100 - 22 * i, yt = rail(bx), yb = 262 + 10 * Math.floor((112 - bx) / 22);
      st += R(bx - 1.3, yt, 2.6, yb - yt, '#12171f') + R(bx - 1.3, yt, 0.9, yb - yt, 'rgba(190,205,225,.45)');
    }
    st += L(-6, rail(-6), 112, 176, '#0c1017', 7, CAP) + L(-6, rail(-6) - 2.4, 112, 173.6, 'rgba(210,224,244,.6)', 1.4, CAP);
    st += R(106, 160, 12, 112, '#0f141b', 'rx="2"') + R(106, 160, 3, 112, 'rgba(200,214,235,.4)') + R(103, 154, 18, 8, '#1a202a', 'rx="3"') + R(103, 154, 18, 2, 'rgba(220,232,250,.45)', 'rx="1"');
    const railFront = st.slice(railStart);
    pic += st;

    // ---- пол площадки и плитка
    let fl = R(112, 262, SW - 112, SH - 262 + 4, 'url(#ic_floor)') + R(105, 262, 8, 4, '#06090e');
    fl += R(112, 262, SW - 112, 1.6, 'rgba(210,224,244,.45)') + R(112, 263.6, SW - 112, 5, 'rgba(0,0,0,.35)');
    for (const yy of [271, 283, 298]) fl += L(112, yy, SW, yy, 'rgba(10,16,26,.55)', 1);
    for (let xb = -80; xb <= 460; xb += 60) { const k1 = 0, vx = 170, vy = -150; const xa = vx + (xb - vx) * (262 - vy) / (330 - vy), xc = vx + (xb - vx) * (SH - vy) / (330 - vy); fl += L(xa, 262, xc, SH, 'rgba(10,16,26,.5)', 1); }
    fl += E(150, 292, 90, 16, 'url(#ic_flrlight)');
    pic += fl;
    // коврик
    pic += P('M112 268 L218 268 L236 298 L98 298 Z', '#1b212b') + P('M112 268 L218 268 L222 274 L108 274 Z', '#2a3340');
    for (let i = 0; i < 7; i++) { const yy = 276 + i * 3.4, a = (yy - 268) / 30; pic += L(mix(111, 98, a) + 4, yy, mix(219, 236, a) - 4, yy, 'rgba(120,140,165,.28)', .9); }
    pic += P('M98 298 L236 298', 'none', 'stroke="rgba(190,205,225,.3)" stroke-width="1.2"');

    if (p.strip && t >= p.strip[0] && t < p.strip[1]) {
      const a = sstep(p.strip[0], p.strip[0] + .15, t) * (1 - sstep(p.strip[1] - .15, p.strip[1], t));
      pic += `<defs><radialGradient id="ic_stripglow"><stop offset="0" stop-color="#f3b85a" stop-opacity=".65"/><stop offset=".5" stop-color="#f3b85a" stop-opacity=".24"/><stop offset="1" stop-color="#f3b85a" stop-opacity="0"/></radialGradient></defs>`;
      pic += G(E(168 + dx, 266, 65, 13, 'url(#ic_stripglow)') +
        E(168 + dx, 262.8, 56, 4.5, 'url(#ic_stripglow)') +
        L(X0 + 2 + dx, Y1 + .4, X1 - 2 + dx, Y1 + .4, '#f3b85a', 1.8, CAP) +
        L(X0 + 4 + dx, Y1 + .2, X1 - 4 + dx, Y1 + .2, '#ffe0a4', .65, CAP), '', `opacity="${a.toFixed(4)}"`);
    }

    // ---- Саша: та же фигура, что в прихожей (серая футболка, тёмные джинсы, тёмные растрёпанные волосы), вид сверху-сзади
    // руки: висящие и поднятая для стука (локоть в сторону, кулак у двери на уровне головы)
    const SL = [-21.5, -137], SR = [21.5, -137];
    const hEL = [-24.6, -106], hWL = [-23.2, -78], hER = [24.6, -106], hWR = [23.2, -78];
    const uE = [45, -125], uW = [33, -152];
    const ab = Math.sin(Math.PI * arm);
    const eR = [mix(hER[0], uE[0], arm) + 7 * ab + 2 * wind, mix(hER[1], uE[1], arm) + 1.5 * wind];
    const wR = [mix(hWR[0], uW[0], arm) + 15 * ab + 2.6 * wind, mix(hWR[1], uW[1], arm) + 4.5 * wind - 1.4 * Math.min(rap, 1)];
    // чужой: поворот капюшона, наклон, почти неподвижное покачивание; рука для стука — своя длинная
    let sk = 0, sTilt = 0, sSway = 0, seR = S_ER, swR = S_WR;
    if (stranger) {
      sk = ease(lin(t, tH, tH + 1.8));
      sTilt = -(8.5 + .7 * noise1(t * .23 + 3) - 3.5 * Math.sin(Math.PI * sk) + 4.5 * sstep(tH + 1.6, tH + 4, t));
      sSway = .35 * noise1(t * .31 + 11);
      seR = [mix(S_ER[0], S_UE[0], arm) + 7 * ab + 2 * wind, mix(S_ER[1], S_UE[1], arm) + 1.5 * wind];
      swR = [mix(S_WR[0], S_UW[0], arm) + 15 * ab + 2.6 * wind, mix(S_WR[1], S_UW[1], arm) + 4.5 * wind - 1.4 * Math.min(rap, 1)];
    }
    // чужой рисуется в два приёма: тени на двери/полу — здесь, сама фигура — поверх ореола и конуса лампы
    // (тёмная ткань «съедает» свет и остаётся плотным силуэтом), но под виньеткой, провалами лампы и тонировкой
    let strangerBody = '';
    if (vis && stranger) {
      const place = g => distance > 0 ? G(g, `translate(${f1(FX - 100 * distance)},${f1(FY - 62 * distance)}) scale(${(1 - .62 * distance).toFixed(4)}) translate(${-FX},${-FY})`) : g;
      const sh = (ox, oy, al) => G(strangerSil(sTilt, arm > .05) + (arm > .05 ? P(`M${S_SR[0]} ${S_SR[1]} L${f1(seR[0])} ${f1(seR[1])} L${f1(swR[0])} ${f1(swR[1])}`, 'none', `stroke="rgb(0,3,8)" stroke-width="10" ${CAP}`) : ''),
        `translate(${f1(FX + SOX + ox)},${f1(FY + oy)}) rotate(${f1(sSway)})`, `opacity="${al}"`);
      // лампа выше и левее: тень на двери ниже и правее фигуры, а не «вторая голова» рядом
      pic += strangerDefs + place(G(sh(24, 15, .18) + sh(18, 10, .18) + sh(11, 5, .16), '', 'clip-path="url(#ic_wclip)"') +
        E(FX + SOX + 13, FY - 2, 30, 6, 'rgba(0,3,8,.5)') + E(FX + SOX + 38, FY, 34, 5, 'rgba(0,3,8,.28)'));
      strangerBody = place(G(strangerFig({ k: sk, tilt: sTilt, sway: sSway, arm, eR: seR, wR: swR, wind, ring, ringA }), `translate(${FX + SOX},${FY})`) +
        G(E(-18, -140, 30, 92, 'rgba(210,228,255,.05)'), `translate(${FX + SOX},${FY})`)) + (distance > 0 ? railFront : '');
    }
    if (vis && !stranger) {
      const figureStart = pic.length;
      const sil = (ox, oy, al) => {
        const c = `rgba(0,3,8,${al})`;
        return G(P('M-24 -140 C-20 -147 -10 -150 0 -150 C10 -150 20 -147 24 -140 L28 -110 L27 -76 L19 -78 L17 -6 L-17 -6 L-19 -78 L-27 -76 L-28 -110 Z', c) +
          E(0, -167, 14.5, 17, c) + (arm > .05 ? P(`M${f1(SR[0])} ${f1(SR[1])} L${f1(eR[0])} ${f1(eR[1])} L${f1(wR[0])} ${f1(wR[1])}`, 'none', `stroke="${c}" stroke-width="10" ${CAP}`) : ''),
          `translate(${f1(FX + ox)},${f1(FY + oy)})`);
      };
      pic += G(sil(22, 6, .2) + sil(17, 3, .2) + sil(12, 1, .18), '', 'clip-path="url(#ic_wclip)"');
      pic += E(FX + 12, FY - 2, 32, 6.5, 'rgba(0,3,8,.5)') + E(FX + 34, FY, 28, 5, 'rgba(0,3,8,.28)');
      let s = '';
      // контакт кулака с дверью: короткая светлая вспышка на полотне
      if (ringA > 0 && arm > .5) s += E(wR[0] + 1, wR[1] + 3, 6 + 7 * ring, 4 + 4 * ring, `rgba(225,236,252,${f1(.22 * ringA)})`);
      // ноги (джинсы сужаются к полу — камера сверху), задние карманы, обувь с белой подошвой
      s += P('M-17.5 -86 L-1.4 -86 L-2.6 -9 L-14.2 -9 Z', PANTS) + P('M1.4 -86 L17.5 -86 L14.2 -9 L2.6 -9 Z', PANTS2);
      s += P('M-17.5 -86 L-15.4 -86 L-12.8 -9 L-14.2 -9 Z', 'rgba(205,220,240,.16)');
      s += P('M-14 -80 L-4 -80 L-4.6 -68 Q-9 -65.6 -13.4 -68 Z M4 -80 L14 -80 L13.4 -68 Q9 -65.6 4.6 -68 Z', 'none', `stroke="${PANTS2}" stroke-width="1" opacity=".9"`);
      s += P('M-12.6 -46 Q-8.6 -43.6 -4 -45.6 M4 -45.6 Q8.6 -43.6 12.4 -46 M-12 -22 Q-8.4 -19.6 -4 -21 M4 -21 Q8.4 -19.6 11.6 -22', 'none', `stroke="${PANTS2}" stroke-width=".9" opacity=".8" ${CAP}`);
      s += E(-8.6, -4.6, 7.4, 4.4, '#0b0e14') + E(8.6, -4.6, 7.4, 4.4, '#0b0e14');
      s += P('M-15.6 -3.4 Q-8.6 .6 -1.6 -3.4 M1.6 -3.4 Q8.6 .6 15.6 -3.4', 'none', 'stroke="rgba(205,215,230,.55)" stroke-width="1.5" stroke-linecap="round"');
      // футболка со спины: трапеции, лопатки, подол поверх джинсов
      let tor = P('M-6.5 -150 C-13 -148.5 -20 -146 -23 -141 C-24.6 -136 -23 -128 -21 -118 C-19 -104 -17 -92 -17.6 -82 C-8 -79 8 -79 17.6 -82 C17 -92 19 -104 21 -118 C23 -128 24.6 -136 23 -141 C20 -146 13 -148.5 6.5 -150 Z', 'url(#ic_shirt)');
      tor += P('M-6.5 -150 C-13 -148.5 -20 -146 -23 -141', 'none', `stroke="rgba(228,238,252,.5)" stroke-width="1.3" ${CAP}`);
      tor += P('M-15 -128 Q-10 -118 -4 -121 M15 -128 Q10 -118 4 -121', 'none', `stroke="${SHIRT3}" stroke-width="1" opacity=".35" ${CAP}`);
      tor += P('M-15 -96 Q-12 -90 -13 -84 M10 -100 Q12 -92 11 -85', 'none', `stroke="${SHIRT3}" stroke-width=".9" opacity=".35" ${CAP}`);
      tor += P('M-17.6 -82 C-8 -79 8 -79 17.6 -82', 'none', `stroke="${SHIRT3}" stroke-width="1.8"`);
      s += G(tor, `translate(0,${f1(breath)})`);
      // висящая левая рука; правая — висит или стучит
      s += G(armDraw(SL, hEL, hWL, 1, 0), `translate(0,${f1(breath)})`);
      if (arm <= .05) s += G(armDraw(SR, hER, hWR, 0, 0), `translate(0,${f1(breath)})`);
      if (F.keys === true && arm <= .05) s += G(keyBunch(t, Lm), `translate(${hWR[0]},${f1(hWR[1] + 8 + breath)})`);
      // шея и ворот; при развёрнутой голове — складки скрученной шеи
      const hy = -167 - 1.4 * kPre - 1.2 * kSet + breath * .6;
      s += P(`M-5.6 ${f1(hy + 9)} L-6.2 -147 L6.2 -147 L5.6 ${f1(hy + 9)} Z`, SK3) + R(-6, hy + 9, 3, -147 - hy - 9, 'rgba(225,235,250,.18)');
      if (front) s += P('M-5.4 -154 Q0 -150.6 5.6 -155.6 M-5.8 -150.6 Q-1 -148.6 5.8 -151.6', 'none', `stroke="#3c4657" stroke-width=".9" opacity=".85" ${CAP}`);
      s += P('M-8.4 -150.6 Q0 -145 8.4 -150.6 L7.4 -147.6 Q0 -143 -7.4 -147.6 Z', SHIRT2);
      s += G(front ? headFront(sm) : headBack(), `translate(${f1(kPre * 1.2)},${f1(hy)}) rotate(${f1(tilt)} 0 12)`);
      if (arm > .05) s += armDraw(SR, eR, wR, 0, arm, 1 + .1 * wind);
      pic += G(s, `translate(${FX},${FY})`);
      // холодная дымка света лампы слева
      pic += G(E(-18, -110, 30, 66, 'rgba(210,228,255,.06)'), `translate(${FX},${FY})`);
      if (distance > 0) {
        const figure = pic.slice(figureStart), scale = 1 - .62 * distance;
        pic = pic.slice(0, figureStart) + G(figure,
          `translate(${f1(FX - 100 * distance)},${f1(FY - 62 * distance)}) scale(${scale.toFixed(4)}) translate(${-FX},${-FY})`) + railFront;
      }
    }

    // ---- свет лампы, тьма по краям, холодный тон
    pic += Ci(LAMP[0] + 20, LAMP[1] + 30, 180, 'url(#ic_lampglow)', `opacity="${f1(.8 * Lm)}"`);
    pic += P(`M${LAMP[0] - 8} ${LAMP[1] + 8} L${LAMP[0] + 8} ${LAMP[1] + 8} L${LAMP[0] + 200} 262 L${LAMP[0] - 90} 262 Z`, 'url(#ic_cone)', `opacity="${f1(.5 * Lm)}"`);
    pic += strangerBody;
    pic += R(0, 0, SW, SH, 'url(#ic_lampmask)', `opacity="${f1(clamp(1.04 - .1 * Lm))}"`);
    pic += R(0, 0, SW, SH, '#02040a', `opacity="${f1(clamp((1 - Lm) * .62, 0, .9))}"`);
    pic += R(0, 0, SW, SH, '#0c1b30', 'opacity=".2"');
    // плафон лампы
    pic += Ci(LAMP[0], LAMP[1] + 8, 34, 'url(#ic_bloom)', `opacity="${f1(Lm)}"`);
    pic += P(`M${LAMP[0] - 16} ${LAMP[1] - 4} L${LAMP[0] + 16} ${LAMP[1] - 4} L${LAMP[0] + 13} ${LAMP[1] + 6} Q${LAMP[0]} ${LAMP[1] + 11} ${LAMP[0] - 13} ${LAMP[1] + 6} Z`, `rgba(${Math.round(60 + 190 * Lm)},${Math.round(70 + 185 * Lm)},${Math.round(84 + 170 * Lm)},1)`);
    pic += E(LAMP[0], LAMP[1] + 8, 10, 3.2, `rgba(255,255,255,${f1(.4 + .6 * clamp(Lm))})`);

    // ======================= склейка экрана =======================
    const gl = glitches.find(a => t >= a && t < a + .11);
    const gk = gl !== undefined ? 1 : 0;
    let scr = `<g id="ic_pic" transform="translate(${f1(noise1(fi * 3.1) * .5 + shake * .25)},${f1((gk ? noise1(fi * 7) * 4 : 0) + Math.min(rap, 1.2) * 1.3)})">${pic}</g>`;
    if (gk) {
      const a = gl;
      for (let i = 0; i < 6; i++) {
        const by = hash(a * 13 + i * 3.7) * SH, bh = 6 + hash(a * 7 + i * 5.1) * 34, bdx = (hash(a * 3 + i * 9.3) - .5) * 60;
        scr += `<clipPath id="ic_gb${i}"><rect x="0" y="${f1(by)}" width="${SW}" height="${f1(bh)}"/></clipPath>`;
        scr += G(R(0, by, SW, bh, '#05080d') + `<use href="#ic_pic" x="${f1(bdx)}" y="0"/>` + R(0, by, SW, bh, `rgba(220,235,255,${f1(.06 + .1 * hash(i + a))})`), '', `clip-path="url(#ic_gb${i})"`);
      }
      scr += R(0, hash(a * 5) * SH, SW, 1.6, 'rgba(235,245,255,.7)') + R(0, hash(a * 9) * SH, SW, 5, 'rgba(235,245,255,.14)');
    }
    // зерно, строки развёртки, бегущая полоса
    let gr = '';
    for (let i = 0; i < 90; i++) {
      const x = hash(i * 3.1 + fi * 7.7) * SW, y = hash(i * 5.3 + fi * 3.3) * SH, w = 1 + hash(i * 1.7 + fi) * 2;
      gr += R(x, y, w, 1, i % 4 ? 'rgba(225,235,250,.3)' : 'rgba(0,0,0,.5)');
    }
    gr += R(0, hash(fi * 1.7) * SH, SW, 1, 'rgba(230,240,255,.09)') + R(0, hash(fi * 2.9 + 3) * SH, SW, 1.4, 'rgba(0,0,0,.14)');
    scr += gr;
    scr += R(0, 0, SW, SH, 'url(#ic_scan)');
    const ry = ((t * 36) % (SH + 90)) - 70;
    scr += R(0, ry, SW, 60, 'url(#ic_roll)');
    scr += R(0, 0, SW, SH, 'url(#ic_vig)');

    // экранная графика (OSD)
    const osd = (x, y, txt, sz, anchor = 'start', col = '#eef4fb') => T(x, y, txt, sz, col, `${MONO} text-anchor="${anchor}" stroke="#04070b" stroke-width="2.6" paint-order="stroke"`);
    let hud = '';
    const timedCall = p.call !== undefined;
    const calling = !timedCall || p.call.some(([a, b]) => t >= a && t < b);
    const callOn = calling && t < tOff && (t * 1.7) % 1 < .62;
    if (timedCall && !calling) hud += osd(14, 25, 'КАМЕРА 1', 14);
    if (callOn && timedCall) hud += osd(14, 25, 'ВЫЗОВ', 14) +
      P('M89 15 C87 17 89 22 92 25 C95 28 100 30 102 28 L104 25 L99 22 L97 24 Q93 22 92 19 L94 17 L91 13 Z', '#eef4fb');
    if (callOn && !timedCall) hud += osd(14, 25, 'ВЫЗОВ', 14) + Ci(88, 20.5, 2.4, '#eef4fb') + P('M93 16 Q97 20.5 93 25 M97 13 Q103 20.5 97 28', 'none', 'stroke="#eef4fb" stroke-width="1.4" stroke-linecap="round"');
    const sec = p.hm != null ? Math.floor((p.hm + t) / 60) : Math.floor((p.clock0 ?? 187) + t);   // p.hm — секунды суток: часы ЧЧ:ММ идут по-настоящему
    const mm = String(Math.floor(sec / 60) % 100).padStart(2, '0'), ss = String(sec % 60).padStart(2, '0');
    hud += osd(SW - 12, 25, `${mm}:${ss}`, 14, 'end');
    const recOn = (t * .9) % 1 < .68;
    hud += Ci(18, SH - 16, recOn ? 5 : 2.6, recOn ? C.red : '#5a1a22') + (recOn ? Ci(18, SH - 16, 14, 'url(#glowR)', 'opacity=".8"') : '') + osd(30, SH - 11.5, 'REC', 11.5);
    hud += osd(SW - 12, SH - 11.5, 'КАМ 1', 10.5, 'end', '#c4cfdc');
    scr += hud;

    // ======================= корпус трубки =======================
    let g = defs();
    g += `<defs>
      <linearGradient id="ic_body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a4452"/><stop offset=".45" stop-color="#262d38"/><stop offset="1" stop-color="#171c25"/></linearGradient>
      <radialGradient id="ic_spill" cx="180" cy="176" r="270" gradientUnits="userSpaceOnUse"><stop offset=".45" stop-color="#8fb4e6" stop-opacity=".30"/><stop offset="1" stop-color="#8fb4e6" stop-opacity="0"/></radialGradient>
      <radialGradient id="ic_halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#6f9ad6" stop-opacity=".22"/><stop offset="1" stop-color="#6f9ad6" stop-opacity="0"/></radialGradient>
      <linearGradient id="ic_fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03060c" stop-opacity="0"/><stop offset="1" stop-color="#03060c" stop-opacity="1"/></linearGradient>
      <linearGradient id="ic_wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#aab6c6"/><stop offset=".45" stop-color="#8996a7"/><stop offset="1" stop-color="#586374"/></linearGradient>
      <linearGradient id="ic_dado" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b7889"/><stop offset=".5" stop-color="#566273"/><stop offset="1" stop-color="#3d4756"/></linearGradient>
      <linearGradient id="ic_door" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7c8999"/><stop offset=".55" stop-color="#67738a" stop-opacity="1"/><stop offset="1" stop-color="#465060"/></linearGradient>
      <linearGradient id="ic_floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f7b8b"/><stop offset="1" stop-color="#2a323d"/></linearGradient>
      <linearGradient id="ic_well" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#05070b"/><stop offset="1" stop-color="#151b24"/></linearGradient>
      <radialGradient id="ic_flrlight"><stop offset="0" stop-color="#cfe0f5" stop-opacity=".3"/><stop offset="1" stop-color="#cfe0f5" stop-opacity="0"/></radialGradient>
      <radialGradient id="ic_lampglow"><stop offset="0" stop-color="#eaf4ff" stop-opacity=".75"/><stop offset=".3" stop-color="#cfe3fa" stop-opacity=".3"/><stop offset="1" stop-color="#cfe3fa" stop-opacity="0"/></radialGradient>
      <radialGradient id="ic_bloom"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".25" stop-color="#e8f2ff" stop-opacity=".55"/><stop offset="1" stop-color="#e8f2ff" stop-opacity="0"/></radialGradient>
      <linearGradient id="ic_cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6f1ff" stop-opacity=".32"/><stop offset="1" stop-color="#e6f1ff" stop-opacity="0"/></linearGradient>
      <radialGradient id="ic_lampmask" cx="${LAMP[0]}" cy="${LAMP[1]}" r="360" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#02040a" stop-opacity="0"/><stop offset=".3" stop-color="#02040a" stop-opacity=".1"/><stop offset=".65" stop-color="#02040a" stop-opacity=".5"/><stop offset="1" stop-color="#02040a" stop-opacity=".84"/></radialGradient>
      <linearGradient id="ic_skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9e2ee"/><stop offset=".55" stop-color="#b3bfce"/><stop offset="1" stop-color="#7d899b"/></linearGradient>
      <linearGradient id="ic_shirt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#97a4b6"/><stop offset=".5" stop-color="#7a879a"/><stop offset="1" stop-color="#4c5769"/></linearGradient>
      <linearGradient id="ic_roll" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#dbe9ff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <radialGradient id="ic_vig" cx=".5" cy=".5" r=".72"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".72"/></radialGradient>
      <linearGradient id="ic_glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".4" stop-color="#fff" stop-opacity=".02"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <radialGradient id="ic_btn" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#3a4452"/><stop offset="1" stop-color="#151a22"/></radialGradient>
      <pattern id="ic_scan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".26"/></pattern>
      <clipPath id="ic_scr"><rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" rx="18"/></clipPath>
      <radialGradient id="ic_sock"><stop offset="0" stop-color="#0e1420" stop-opacity=".6"/><stop offset=".6" stop-color="#0e1420" stop-opacity=".32"/><stop offset="1" stop-color="#0e1420" stop-opacity="0"/></radialGradient>
      <clipPath id="ic_fcF"><path d="${FACE_F}"/></clipPath>
      <clipPath id="ic_wclip"><rect x="0" y="0" width="${SW}" height="262"/></clipPath>
    </defs>`;
    g += R(-20, -20, 400, 680, '#03060c');
    g += Ci(180, 190, 330, 'url(#ic_halo)', shutdown ? `opacity="${backlight.toFixed(4)}"` : '');
    g += R(10, 12, 344, 440, '#000', 'rx="30" opacity=".55"');
    g += R(6, 6, 348, 450, 'url(#ic_body)', 'rx="28"');
    g += R(6.5, 6.5, 347, 449, 'none', 'rx="28" stroke="rgba(200,218,240,.3)" stroke-width="1"');
    g += R(6, 6, 348, 450, 'url(#ic_spill)', `rx="28"${shutdown ? ` opacity="${backlight.toFixed(4)}"` : ''}`);
    // лёгкий блик пластика и винты
    g += P('M14 40 Q14 14 40 12 L150 11', 'none', 'stroke="rgba(235,243,255,.28)" stroke-width="1.6" stroke-linecap="round"');
    for (const [x, y] of [[26, 28], [334, 28]]) g += Ci(x, y, 3.2, '#10151c') + Ci(x - .6, y - .6, 3.2, 'none', 'stroke="rgba(200,215,235,.28)" stroke-width=".8"') + L(x - 2, y, x + 2, y, '#06090e', .9);
    // рамка экрана
    g += R(18, 16, 324, 320, '#04070b', 'rx="14"') + R(18, 16, 324, 320, 'none', 'rx="14" stroke="rgba(190,210,235,.18)" stroke-width="1"');
    if (shutdown) scr = R(0, 0, SW, SH, '#020408') +
      (backlight > 0 ? G(scr, '', `opacity="${backlight.toFixed(4)}"`) : '');
    g += `<g clip-path="url(#ic_scr)"><g transform="translate(${SX},${SY})">${scr}</g>`;
    g += R(SX, SY, SW, SH, 'url(#ic_glass)', 'rx="18"') + `</g>`;
    g += R(SX, SY, SW, SH, 'none', 'rx="18" stroke="rgba(0,0,0,.7)" stroke-width="2"');
    // рамка захвата «НЕ ВЫ» поверх стекла — тем же почерком, что «ВЫ» в runtime.track
    if (vis && F.tag && t < tOff) {
      const txt = typeof F.tag === 'string' ? F.tag : 'НЕ ВЫ';
      const bb = stranger ? [SOX - 30, -253, SOX + 30, 0] : [-31, -191, 31, 0];
      const sc = 1 - .62 * distance, bx = FX - 100 * distance, by = FY - 62 * distance, pad = 2 + 2 * sc;
      let x0 = SX + bx + bb[0] * sc - pad, y0 = SY + by + bb[1] * sc - pad, w = (bb[2] - bb[0]) * sc + 2 * pad, hh = (bb[3] - bb[1]) * sc + 2 * pad;
      const lock = eout(lin(t, ft, ft + .25));
      const re = distanceTime > ft + .01 ? 1 - eout(lin(t, distanceTime, distanceTime + .22)) : 0;
      const grow = (1 + .6 * (1 - lock)) * (1 + .2 * re);
      const cx = x0 + w / 2 + noise1(t * 2.3 + 1) * 1.2, cy = y0 + hh / 2 + noise1(t * 2.1 + 7) * 1.2;
      w *= grow; hh *= grow;
      const blink = (t - ft) < .25 || re > .45 ? ((t * 30 | 0) % 2 ? .4 : 1) : 1;
      const a = lock * blink * (shutdown ? backlight : 1);
      if (a > .005) {
        const Lc = Math.min(12, w * .3), col = '#ff3030';
        const c = (px, py, sx, sy) => `<path d="M${f1(px)} ${f1(py + sy * Lc)} V${f1(py)} H${f1(px + sx * Lc)}" stroke="${col}" stroke-width="1.6" fill="none"/>`;
        // захват не вылезает за стекло: плашке оставлено место сверху
        const X0 = Math.max(cx - w / 2, SX + 4), Y0 = Math.max(cy - hh / 2, SY + 17), X1 = Math.min(cx + w / 2, SX + SW - 4), Y1 = Math.min(cy + hh / 2, SY + SH - 4);
        g += G(c(X0, Y0, 1, 1) + c(X1, Y0, -1, 1) + c(X0, Y1, 1, -1) + c(X1, Y1, -1, -1) +
          R(X0, Y0 - 13, txt.length * 7 + 10, 12, col) +
          `<text x="${f1(X0 + 5)}" y="${f1(Y0 - 3.5)}" font-family="Plex" font-weight="600" font-size="9" letter-spacing="1" fill="#fff">${txt}</text>`,
          '', `opacity="${f1(a)}"`);
      }
    }
    // кнопки: ключ, динамик, трубка
    const callBlink = (callOn ? 1 : calling ? .25 : 0) * backlight;
    g += R(14, 338, 332, 34, 'rgba(0,0,0,.18)');
    const btn = (x, y) => Ci(x, y + 1.5, 13, '#0a0d12') + Ci(x, y, 12, 'url(#ic_btn)') + Ci(x, y, 12, 'none', 'stroke="rgba(190,210,235,.3)" stroke-width="1"') + P(`M${x - 9} ${y - 5} Q${x} ${y - 11} ${x + 9} ${y - 5}`, 'none', 'stroke="rgba(235,243,255,.28)" stroke-width="1" stroke-linecap="round"');
    g += btn(74, 354);
    g += Ci(70, 354, 3.6, 'none', 'stroke="#aab7c8" stroke-width="1.5"') + L(73.6, 354, 82, 354, '#aab7c8', 1.5, CAP) + L(78.5, 354, 78.5, 357.6, '#aab7c8', 1.4, CAP) + L(81.6, 354, 81.6, 357, '#aab7c8', 1.4, CAP);
    g += btn(286, 354);
    g += P('M279 357.5 C279 352 283 349.5 286 349.5 C289 349.5 293 352 293 357.5 L289.6 357.5 C289.6 355 288 353.4 286 353.4 C284 353.4 282.4 355 282.4 357.5 Z', '#c0606b', 'opacity=".9"');
    g += Ci(286, 354, 15, 'url(#glowR)', `opacity="${f1(.18 * callBlink)}"`) + Ci(74, 354, 16, 'url(#glowC)', 'opacity=".22"');
    for (let i = -3; i <= 3; i++) g += R(176 + i * 7 - 1.6, 349, 3.2, 12, '#07090d', 'rx="1.6"') + R(176 + i * 7 - 1.6, 349, 3.2, 1.2, 'rgba(190,210,235,.22)', 'rx=".6"');
    g += Ci(180, 341, 1.8, callOn && backlight > 0 ? '#ff6a5a' : '#4a1a20') + (callOn ? Ci(180, 341, 8, 'url(#glowR)', shutdown ? `opacity="${f1(.7 * backlight)}"` : 'opacity=".7"') : '');
    // низ: уход в тёмную зону субтитров
    g += R(0, 372, 360, 40, 'url(#ic_fade)') + R(-20, 411, 400, 260, '#03060c');
    return g;
  };
})();

// сцены: (u — время от начала кадра, p — параметры, d — длина кадра, t — время ролика) -> SVG
const SCENES = {
  black: () => R(-20, -20, 400, 680, '#000'),

  demo_door(u, p) {
    let g = R(0, 0, 360, 640, C.wall) + R(0, 470, 360, 170, C.floor) + L(0, 470, 360, 470, C.line2, 2);
    g += door({ x: 145, y: 330, w: 72, h: 140, num: '41' });
    g += person({ x: 95 + Math.min(u, 1.2) * 12, y: 470, h: 74, pose: u > 1.4 ? 'reach' : 'walk', t: u });
    return g;
  },
  demo_peep(u, p) {
    let g = R(0, 0, 360, 640, '#9aa6b8') + R(0, 380, 360, 260, '#6d7a8e');
    g += P('M0 170 L120 250 L120 380 L0 470 Z', '#7f8ca0') + P('M360 170 L240 250 L240 380 L360 470 Z', '#7f8ca0');
    g += R(120, 250, 120, 130, '#8794a8') + R(165, 275, 30, 105, '#2e7d4f');
    g += door({ x: 40, y: 285, w: 34, h: 120, peep: false }) + door({ x: 286, y: 285, w: 34, h: 120, peep: false });
    g += shadow(212, 380, 70, lin(u, 1, 1.6));
    g += peephole(180, 300, 132);
    return g;
  },
  demo_room(u, p) {
    let g = R(0, 0, 360, 640, C.wall2) + R(0, 450, 360, 190, C.floor);
    g += windowW({ x: 200, y: 200, w: 110, h: 150, curtain: 0.35 });
    g += R(40, 400, 120, 8, '#3a2a1f') + R(48, 408, 6, 42, '#2d2118') + R(146, 408, 6, 42, '#2d2118');
    g += candle(80, 400, u, 1.1);
    g += person({ x: 130, y: 450, h: 76, pose: 'phone', face: -1 });
    g += phone({ x: 112, y: 330, w: 14, glow: 0.8 });
    return g;
  },
};

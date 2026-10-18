// plan — квартира 47, строго сверху. Все события используют абсолютное t.
// Опорные точки (центры, px):
// P.door=[244,230]; P.landing=[278,230]; P.stairs=[294,308];
// P.hall=[202,230]; P.intercom=[231,204]; P.coat=[43,226];
// P.spk_hall=[100,246]; P.bed=[94,135]; P.spk_bed=[126,113];
// P.bed_door=[112,186]; P.kitchen=[194,139].
// Общий: {z0:1,z1:1.04}. Прихожая+площадка:
// {z0:1.6,z1:1.6,ox:146.67,oy:-24.33}; (235,239) -> (180,205).
// youKeys/it: каждый ключ запускает переход к нему за 0.6/0.35 с;
// первый ключ it появляется мгновенно. ping исходит из позиции it в момент события.
(() => {
  const PT = Object.freeze({door:[244,230], landing:[278,230], stairs:[294,308],
    hall:[202,230], intercom:[231,204], coat:[43,226], spk_hall:[100,246],
    bed:[94,135], spk_bed:[126,113], bed_door:[112,186], kitchen:[194,139]});
  const RED = '#ff3030', WALL = '#cfd6e0', INK = '#8294ad';
  const CAP = 'stroke-linecap="round" stroke-linejoin="round"';
  const font = 'font-family="Plex" font-weight="600" letter-spacing=".5"';
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  // Reconstruct completed/interrupted transitions, independent of rendering order.
  function position(keys, base, time, duration) {
    let from = base, target = base, start = -Infinity;
    const at = q => {
      if (!target) return null;
      if (!from) return target;
      const k = clamp((q-start)/duration), e = k*k*(3-2*k);
      return [mix(from[0],target[0],e),mix(from[1],target[1],e)];
    };
    for (const [s,x,y] of keys || []) {
      if (s > time) break;
      from = at(s); target = [x,y]; start = s;
    }
    return at(time);
  }
  const line = (a,b,c,d,col=INK,w=1) => L(a,b,c,d,col,w,CAP);
  const outline = (path,col=INK,w=1) => P(path,'none',`stroke="${col}" stroke-width="${w}" ${CAP}`);
  const label = (x,y,s,size=10.5) => T(x,y,s,size,WALL,`${font} text-anchor="middle"`);
  SCENES.plan = function(u,p,d,t) {
    let g = `<defs><pattern id="pl_grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#9fd0ff" stroke-width=".5" opacity=".075"/></pattern><clipPath id="pl_clip"><rect x="24" y="74" width="312" height="274"/></clipPath><linearGradient id="pl_scan" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#9fd0ff" stop-opacity="0"/><stop offset="1" stop-color="#9fd0ff" stop-opacity=".07"/></linearGradient><linearGradient id="pl_bottom" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#05070c"/><stop offset="1" stop-color="#03060c"/></linearGradient></defs>`;
    g += R(-30,-30,420,730,'#05070c') + R(0,372,360,268,'url(#pl_bottom)');
    g += T(24,42,'КВ. 47 · 9 ЭТАЖ · СХЕМА',9,WALL,font);
    g += Ci(294,39,2.4,RED,`opacity="${Math.floor(t*2)%2 ? '.35' : '1'}"`)+T(302,42,'LIVE',8.5,RED,font);
    g += line(24,53,336,53,'#334156',.7);
    // Subtle difference in floor fill separates the common landing from the flat.
    g += R(24,74,220,274,'#080d16') + R(244,74,92,274,'#0d1420');
    g += R(24,74,312,274,'url(#pl_grid)');
    let scanY = 74 + ((t*.18)%1+1)%1*274;
    g += G(R(24,scanY-24,312,24,'url(#pl_scan)')+line(24,scanY,336,scanY,'#9fd0ff',.6),'','clip-path="url(#pl_clip)" opacity=".45"');
    // Continuous outer shell; gaps in partitions are actual walkable doorways.
    g += outline('M244 216V74H24V348H244V244 M244 74H336V348H244',WALL,1.5);
    g += outline('M24 186H98 M126 186H166 M192 186H244 M144 74V186 M24 260H120 M146 260H180 M206 260H244 M154 260V348',WALL,1.5);
    // Door leaves and swing arcs, lighter than walls.
    g += outline('M98 186V160 M98 160A26 26 0 0 1 124 186 M166 186V160 M166 160A26 26 0 0 1 192 186 M120 260V286 M120 286A26 26 0 0 0 146 260 M206 260V286 M180 260A26 26 0 0 0 206 286', '#53657c',.7);
    g += outline('M244 244H216 M216 244A28 28 0 0 1 244 216',WALL,1);
    // Bedroom: pillow, blanket seam, bedside table. No perspective.
    g += R(54,103,56,58,'none',`stroke="${INK}" rx="2"`)+R(58,107,21,12,'none',`stroke="${INK}" rx="2"`)+R(84,107,21,12,'none',`stroke="${INK}" rx="2"`)+line(54,124,110,124);
    g += R(117,104,18,18,'none',`stroke="${INK}" rx="1"`);
    // Kitchen counter, sink and four burner hob.
    g += outline('M152 83H236V117H226V93H152Z');
    g += R(188,96,19,13,'none',`stroke="${INK}" rx="2"`);
    for (let x of [216,229]) for (let y of [99,109]) g += Ci(x,y,2.7,'none',`stroke="${INK}" stroke-width=".7"`);
    // Living room sofa / table, bath and basin, coat rack, hallway chest.
    g += R(34,290,19,45,'none',`stroke="${INK}" rx="2"`)+R(34,290,28,7,'none',`stroke="${INK}" rx="1"`)+R(34,328,28,7,'none',`stroke="${INK}" rx="1"`)+R(76,305,30,20,'none',`stroke="${INK}" rx="3"`);
    g += R(213,286,23,52,'none',`stroke="${INK}" rx="8"`)+Ci(225,293,1,INK)+R(164,321,22,16,'none',`stroke="${INK}" rx="4"`);
    g += line(33,214,54,214)+outline('M37 214V220L33 225H43L39 220 M48 214V220L44 225H54L50 220');
    g += R(80,237,40,17,'none',`stroke="${INK}" rx="1"`);
    // Landing: elevator doors and a split staircase with central rail.
    g += R(266,90,54,58,'none',`stroke="${INK}"`)+line(293,90,293,148)+outline('M278 116L282 112L286 116 M300 122L304 126L308 122');
    g += label(293,162,'ЛИФТ',8);
    g += outline('M260 276H326V338H260Z M293 276V338');
    for (let y=284;y<338;y+=8) g += line(260,y,326,y,'#53657c',.7);
    g += outline('M276 327V288L272 294 M276 288L280 294 M310 288V327L306 321 M310 327L314 321',WALL,.9);
    // Labels stay clear of symbols and central actor positions.
    g += label(84,91,'СПАЛЬНЯ')+label(194,174,'КУХНЯ')+label(131,204,'ПРИХОЖАЯ')+label(89,278,'КОМНАТА')+label(199,278,'ВАННАЯ',9.5)+label(290,192,'ПЛОЩАДКА',9.5);
    // Active devices: exact same footprint as standby symbols, saturated danger red.
    const active = name => (p.dev||[]).some(([a,b,n]) => n===name && t>=a && t<b);
    for (const name of ['intercom','spk_bed','spk_hall']) {
      const [x,y]=PT[name], on=active(name), col=on?RED:INK;
      if (on) g += Ci(x,y,12,RED,'opacity=".1"')+Ci(x,y,10,'none',`stroke="${RED}" opacity=".6" stroke-width=".8"`);
      if (name==='intercom') g += R(x-5,y-9,10,18,'#080d16',`stroke="${col}" rx="2"`)+outline(`M${x+1} ${y-6}h-3v12h3`,col,1.4);
      else g += Ci(x,y,5,'#080d16',`stroke="${col}" stroke-width="1.2"`)+Ci(x,y,2,'none',`stroke="${col}" stroke-width=".7"`);
    }
    // Event rings originate where the threat was, never follow its later jump.
    for (const s of p.ping||[]) {
      const age=t-s, q=position(p.it,null,s,.35);
      if (q && age>=0 && age<.85) g += G(Ci(q[0],q[1],5+age*37,'none',`stroke="${RED}" stroke-width="1.2" opacity="${f1((1-age/.85)*.7)}"`),'','clip-path="url(#pl_clip)"');
    }
    const you=position(p.youKeys,p.you||PT.bed,t,.6);
    if (you) {
      const [x,y]=you;
      g += outline(`M${x-13} ${y-6}v-7h7 M${x+6} ${y-13}h7v7 M${x-13} ${y+6}v7h7 M${x+6} ${y+13}h7v-7`,RED,1.8);
      g += Ci(x,y,2,RED)+R(x-13,y-27,26,11,RED,'rx="1"')+T(x,y-19,'ВЫ',8,'#05070c',`${font} text-anchor="middle"`);
    }
    const it=position(p.it,null,t,.35);
    if (it) {
      const [x,y]=it, radius=8+2*Math.sin(t*7);
      g += Ci(x,y,12,RED,'opacity=".08"')+Ci(x,y,radius,'none',`stroke="${RED}" stroke-width="1" opacity=".65"`)+Ci(x,y,3.4,RED);
      // Put the tag to the left near the right edge, so arbitrary labels stay inside.
      const text=esc(p.itLabel ?? '?'), left=x>290;
      g += T(x+(left?-15:15),y+3,text,10,RED,`${font} text-anchor="${left?'end':'start'}" paint-order="stroke" stroke="#05070c" stroke-width="3" stroke-linejoin="round"`);
    }
    return g;
  };
})();

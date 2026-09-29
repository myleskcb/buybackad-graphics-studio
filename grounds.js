/* GROUNDS — drawn backgrounds for the ad engine. Browser-side, no deps.
   window.GROUNDS.list is the catalogue; GROUNDS.draw(kind, ctx, W, H, P, seed)
   paints one in a palette P = { c1, c2, ink, accent, support, accent2, accent3 }.
   Every style is built to sit UNDER type: mid-contrast, soft edges, no hard
   colour blocks in the middle of the card, grain on top so nothing reads flat. */
(function(){
  const hexRgb = h => { const m = String(h || '#888888').replace('#',''); const v = m.length === 3 ? m.split('').map(c => c + c).join('') : m; return [parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16)]; };
  const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
  const lum = h => { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return '#' + [0,1,2].map(i => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2,'0')).join(''); };
  const rng = seed => { let x = (seed * 9301 + 49297) % 233280; return () => (x = (x * 9301 + 49297) % 233280) / 233280; };
  const grain = (g, W, H, a) => { for (let i = 0; i < 7000; i++){ g.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '0,0,0' : '255,255,255') + ',' + (Math.random() * a).toFixed(3) + ')'; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); } };
  const vignette = (g, W, H, a) => { const v = g.createRadialGradient(W/2, H/2, H * 0.35, W/2, H/2, H * 0.85); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,' + a + ')'); g.fillStyle = v; g.fillRect(0, 0, W, H); };
  const cols = P => [P.accent, P.support, P.accent2 || P.accent, P.accent3 || P.support].filter(Boolean);
  const dark = P => lum(P.c1) < 0.35;

  const K = {};
  /* — gradients — */
  K.linear     = { name:'Linear gradient',      note:'ground to its darker stop, corner to corner',            draw(g,W,H,P,r){ const gr = g.createLinearGradient(0,0,W,H); gr.addColorStop(0,P.c1); gr.addColorStop(1,P.c2||mix(P.c1,'#000000',0.35)); g.fillStyle=gr; g.fillRect(0,0,W,H); } };
  K.duo        = { name:'Two-tone gradient',    note:'ground into the accent, soft, diagonal',                  draw(g,W,H,P,r){ const gr = g.createLinearGradient(0,H,W,0); gr.addColorStop(0,P.c1); gr.addColorStop(1,mix(P.c1,P.accent,0.55)); g.fillStyle=gr; g.fillRect(0,0,W,H); } };
  K.mesh       = { name:'Mesh gradient',        note:'iOS-style: soft colour clouds of the palette',            draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); const c=cols(P); for(let i=0;i<6;i++){ const x=r()*W,y=r()*H,rad=380+r()*420; const gr=g.createRadialGradient(x,y,0,x,y,rad); gr.addColorStop(0,rgba(c[i%c.length],0.7)); gr.addColorStop(1,rgba(c[i%c.length],0)); g.fillStyle=gr; g.fillRect(0,0,W,H);} } };
  K.spotlight  = { name:'Spotlight',            note:'one warm pool of light, top centre',                      draw(g,W,H,P,r){ g.fillStyle=P.c2||mix(P.c1,'#000',0.3); g.fillRect(0,0,W,H); const gr=g.createRadialGradient(W/2,H*0.25,0,W/2,H*0.25,H*0.9); gr.addColorStop(0,P.c1); gr.addColorStop(1,P.c2||mix(P.c1,'#000',0.3)); g.fillStyle=gr; g.fillRect(0,0,W,H); } };
  K.sweep      = { name:'Corner sweep',         note:'accent rising from one corner, fading out',               draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); const gr=g.createRadialGradient(W,H,0,W,H,W*1.1); gr.addColorStop(0,rgba(P.accent,0.85)); gr.addColorStop(1,rgba(P.accent,0)); g.fillStyle=gr; g.fillRect(0,0,W,H); } };
  K.glow       = { name:'Glow ground',          note:'dark ground, accent glow behind the headline zone',      draw(g,W,H,P,r){ g.fillStyle=dark(P)?P.c1:mix(P.ink,'#000',0.4); g.fillRect(0,0,W,H); const gr=g.createRadialGradient(W/2,H*0.38,0,W/2,H*0.38,W*0.7); gr.addColorStop(0,rgba(P.accent,0.55)); gr.addColorStop(1,rgba(P.accent,0)); g.fillStyle=gr; g.fillRect(0,0,W,H); } };
  K.vignetteG  = { name:'Gradient + vignette',  note:'the ground with soft dark edges',                        draw(g,W,H,P,r){ K.linear.draw(g,W,H,P,r); vignette(g,W,H,0.45); } };
  /* — soft forms — */
  K.blobs      = { name:'Soft blobs',           note:'blurred colour circles, no edges',                        draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); const c=cols(P); g.filter='blur(40px)'; for(let i=0;i<6;i++){ g.fillStyle=rgba(c[i%c.length],0.5); g.beginPath(); g.arc(r()*W,r()*H,170+r()*240,0,Math.PI*2); g.fill(); } g.filter='none'; } };
  K.bokeh      = { name:'Bokeh',                note:'out-of-focus lights in the accent',                       draw(g,W,H,P,r){ g.fillStyle=dark(P)?P.c1:mix(P.c1,'#000',0.55); g.fillRect(0,0,W,H); const c=cols(P); for(let i=0;i<26;i++){ const x=r()*W,y=r()*H,rad=20+r()*90; const gr=g.createRadialGradient(x,y,0,x,y,rad); gr.addColorStop(0,rgba(c[i%c.length],0.55)); gr.addColorStop(0.8,rgba(c[i%c.length],0.25)); gr.addColorStop(1,rgba(c[i%c.length],0)); g.fillStyle=gr; g.beginPath(); g.arc(x,y,rad,0,Math.PI*2); g.fill(); } } };
  K.aurora     = { name:'Aurora',               note:'soft ribbons of light across a deep ground',             draw(g,W,H,P,r){ g.fillStyle=dark(P)?P.c1:mix(P.c1,'#000',0.6); g.fillRect(0,0,W,H); const c=cols(P); g.filter='blur(26px)'; for(let i=0;i<4;i++){ g.strokeStyle=rgba(c[i%c.length],0.55); g.lineWidth=90+r()*80; g.beginPath(); const y0=H*0.2+i*H*0.18; g.moveTo(-100,y0); for(let x=0;x<=W+100;x+=60) g.lineTo(x,y0+Math.sin(x/220+i+r()*0.3)*70); g.stroke(); } g.filter='none'; } };
  K.waves      = { name:'Soft waves',           note:'layered translucent waves at the foot',                   draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); const c=cols(P); for(let i=0;i<5;i++){ const base=H*(0.5+i*0.1),amp=50+r()*60,ph=r()*6; const gr=g.createLinearGradient(0,base-amp,0,H); gr.addColorStop(0,rgba(c[i%c.length],0.35)); gr.addColorStop(1,rgba(c[i%c.length],0.05)); g.fillStyle=gr; g.beginPath(); g.moveTo(0,H); for(let x=0;x<=W;x+=16) g.lineTo(x,base+Math.sin(x/200+ph)*amp); g.lineTo(W,H); g.closePath(); g.fill(); } } };
  K.curves     = { name:'Curved bands',         note:'two wide curved bands in the support tone',              draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); for(let i=0;i<2;i++){ g.fillStyle=rgba(P.support,0.28-i*0.1); g.beginPath(); g.moveTo(0,H); g.bezierCurveTo(W*0.3,H*(0.55-i*0.15),W*0.7,H*(0.95-i*0.2),W,H*(0.6-i*0.15)); g.lineTo(W,H); g.closePath(); g.fill(); } } };
  K.rings      = { name:'Concentric rings',     note:'thin rings around a point, very light',                   draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); const cx=W*0.7,cy=H*0.3; g.strokeStyle=rgba(P.accent,0.18); g.lineWidth=3; for(let rad=60;rad<1400;rad+=70){ g.beginPath(); g.arc(cx,cy,rad,0,Math.PI*2); g.stroke(); } } };
  K.arcs       = { name:'Arc outlines',         note:'a few large thin arcs, corner anchored',                  draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); g.strokeStyle=rgba(P.accent,0.3); g.lineWidth=5; for(let i=0;i<4;i++){ g.beginPath(); g.arc(-60,H+60,300+i*180,-Math.PI/2,0); g.stroke(); } } };
  K.rays       = { name:'Soft sunburst',        note:'faint rays from a corner, low contrast',                  draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); const cx=W*0.85,cy=H*0.15,N=20; for(let i=0;i<N;i++){ g.fillStyle=rgba(i%2?P.accent:P.support,0.12); g.beginPath(); g.moveTo(cx,cy); const a0=(i/N)*Math.PI*2,a1=((i+0.5)/N)*Math.PI*2; g.lineTo(cx+Math.cos(a0)*1800,cy+Math.sin(a0)*1800); g.lineTo(cx+Math.cos(a1)*1800,cy+Math.sin(a1)*1800); g.closePath(); g.fill(); } } };
  /* — pattern — */
  K.dotgrid    = { name:'Dot grid',             note:'small dots on a soft ground',                             draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); g.fillStyle=rgba(P.ink,0.14); for(let x=30;x<W;x+=44) for(let y=30;y<H;y+=44){ g.beginPath(); g.arc(x,y,2.4,0,Math.PI*2); g.fill(); } } };
  K.finegrid   = { name:'Fine grid',            note:'blueprint-style hairlines',                               draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); g.strokeStyle=rgba(P.ink,0.12); g.lineWidth=1; for(let x=0;x<W;x+=48){ g.beginPath(); g.moveTo(x+0.5,0); g.lineTo(x+0.5,H); g.stroke(); } for(let y=0;y<H;y+=48){ g.beginPath(); g.moveTo(0,y+0.5); g.lineTo(W,y+0.5); g.stroke(); } } };
  K.halftone   = { name:'Halftone fade',        note:'dots that grow toward one edge',                         draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); g.fillStyle=rgba(P.accent,0.35); for(let x=20;x<W;x+=34) for(let y=20;y<H;y+=34){ const t=Math.max(0,(x/W-0.45))*1.8; if(t<=0) continue; g.beginPath(); g.arc(x,y,Math.min(13,t*14),0,Math.PI*2); g.fill(); } } };
  K.stripes    = { name:'Thin diagonal stripes',note:'hairline stripes at 45°, very quiet',                    draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); g.strokeStyle=rgba(P.ink,0.08); g.lineWidth=2; for(let x=-H;x<W+H;x+=28){ g.beginPath(); g.moveTo(x,0); g.lineTo(x+H,H); g.stroke(); } } };
  K.bands      = { name:'Wide soft bands',      note:'two broad diagonal bands of the support tone',           draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); g.save(); g.translate(W/2,H/2); g.rotate(-0.35); g.fillStyle=rgba(P.support,0.22); g.fillRect(-W,-90,W*2,180); g.fillStyle=rgba(P.accent,0.16); g.fillRect(-W,220,W*2,140); g.restore(); } };
  K.chevron    = { name:'Chevron',              note:'soft chevrons pointing up from the foot',                draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); for(let i=0;i<4;i++){ g.strokeStyle=rgba(P.accent,0.18-i*0.03); g.lineWidth=70; g.beginPath(); g.moveTo(-50,H-60-i*150); g.lineTo(W/2,H-260-i*150); g.lineTo(W+50,H-60-i*150); g.stroke(); } } };
  K.topo       = { name:'Topographic',          note:'contour lines, faint',                                   draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); g.strokeStyle=rgba(P.ink,0.14); g.lineWidth=2; const cx=W*0.6,cy=H*0.55; for(let k=1;k<10;k++){ g.beginPath(); for(let a=0;a<=Math.PI*2+0.1;a+=0.12){ const rad=k*75+Math.sin(a*3+k)*22+Math.cos(a*5-k)*14; const x=cx+Math.cos(a)*rad*1.25,y=cy+Math.sin(a)*rad; if(a===0) g.moveTo(x,y); else g.lineTo(x,y); } g.stroke(); } } };
  K.lowpoly    = { name:'Low-poly facets',      note:'triangles in near-ground tones',                          draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); const step=180; for(let y=-step;y<H+step;y+=step) for(let x=-step;x<W+step;x+=step){ for(let t=0;t<2;t++){ const j=()=>(r()-0.5)*60; g.fillStyle=rgba(t?P.support:P.accent,0.08+r()*0.12); g.beginPath(); if(t){ g.moveTo(x+j(),y+j()); g.lineTo(x+step+j(),y+j()); g.lineTo(x+j(),y+step+j()); } else { g.moveTo(x+step+j(),y+j()); g.lineTo(x+step+j(),y+step+j()); g.lineTo(x+j(),y+step+j()); } g.closePath(); g.fill(); } } } };
  K.confetti   = { name:'Sparse confetti',      note:'a few small shapes in the palette, edges only',          draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); const c=cols(P); for(let i=0;i<26;i++){ const x=r()<0.5?r()*W*0.22:W-r()*W*0.22,y=r()*H; g.save(); g.translate(x,y); g.rotate(r()*3); g.fillStyle=rgba(c[i%c.length],0.7); if(i%3===0) g.fillRect(-9,-4,18,8); else if(i%3===1){ g.beginPath(); g.arc(0,0,6,0,Math.PI*2); g.fill(); } else { g.beginPath(); g.moveTo(0,-9); g.lineTo(8,6); g.lineTo(-8,6); g.closePath(); g.fill(); } g.restore(); } } };
  K.memphis    = { name:'Light memphis',        note:'a few outline shapes, corners only',                     draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); g.lineWidth=5; const c=cols(P); const spots=[[90,90],[W-110,120],[100,H-120],[W-90,H-90]]; spots.forEach((s,i)=>{ g.strokeStyle=rgba(c[i%c.length],0.55); g.beginPath(); if(i%2){ g.arc(s[0],s[1],46,0,Math.PI*2); } else { g.moveTo(s[0]-40,s[1]+30); g.lineTo(s[0],s[1]-40); g.lineTo(s[0]+40,s[1]+30); g.closePath(); } g.stroke(); }); g.strokeStyle=rgba(P.ink,0.25); g.beginPath(); g.moveTo(W*0.55,60); g.quadraticCurveTo(W*0.7,120,W*0.62,200); g.stroke(); } };
  /* — texture — */
  K.grainy     = { name:'Grainy solid',         note:'the ground with film grain',                             draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); grain(g,W,H,0.12); } };
  K.paperTex   = { name:'Paper texture',        note:'warm fibre, no rules',                                    draw(g,W,H,P,r){ g.fillStyle=mix(P.c1,'#fff4dc',0.5); g.fillRect(0,0,W,H); grain(g,W,H,0.09); vignette(g,W,H,0.12); } };
  K.linen      = { name:'Linen',                note:'fine crosshatch weave',                                  draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); g.strokeStyle=rgba(P.ink,0.05); g.lineWidth=1; for(let x=0;x<W;x+=4){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); } for(let y=0;y<H;y+=4){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); } } };
  K.brushed    = { name:'Brushed metal',        note:'horizontal streaks on a neutral',                         draw(g,W,H,P,r){ const base=dark(P)?'#2a2d33':'#d9dce1'; g.fillStyle=base; g.fillRect(0,0,W,H); for(let y=0;y<H;y+=2){ g.fillStyle='rgba('+(dark(P)?'255,255,255':'0,0,0')+','+(r()*0.06).toFixed(3)+')'; g.fillRect(0,y,W,1); } const gr=g.createLinearGradient(0,0,W,0); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(0.5,'rgba(255,255,255,0.12)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,W,H); } };
  K.carbon     = { name:'Carbon weave',         note:'dark micro-weave for vehicles and tech',                  draw(g,W,H,P,r){ g.fillStyle='#15171b'; g.fillRect(0,0,W,H); for(let y=0;y<H;y+=10) for(let x=0;x<W;x+=10){ g.fillStyle=((x/10+y/10)%2)?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.25)'; g.fillRect(x,y,10,10); } const gr=g.createRadialGradient(W/2,H*0.4,0,W/2,H*0.4,W); gr.addColorStop(0,rgba(P.accent,0.18)); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(0,0,W,H); } };
  K.marble     = { name:'Marble veins',         note:'a pale stone with faint veins',                          draw(g,W,H,P,r){ g.fillStyle=mix(P.c1,'#f4f1ec',0.6); g.fillRect(0,0,W,H); g.strokeStyle=rgba(P.ink,0.1); g.lineWidth=3; for(let i=0;i<7;i++){ g.beginPath(); let x=r()*W,y=0; g.moveTo(x,y); while(y<H){ x+=(r()-0.5)*90; y+=60+r()*60; g.lineTo(x,y); } g.stroke(); } grain(g,W,H,0.05); } };
  K.velvet     = { name:'Velvet',               note:'deep ground with a soft central lift',                   draw(g,W,H,P,r){ const d=dark(P)?P.c1:mix(P.accent,'#000',0.6); g.fillStyle=d; g.fillRect(0,0,W,H); const gr=g.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.75); gr.addColorStop(0,rgba('#ffffff',0.12)); gr.addColorStop(1,'rgba(0,0,0,0.35)'); g.fillStyle=gr; g.fillRect(0,0,W,H); grain(g,W,H,0.08); } };
  /* — photo-like — */
  K.stars      = { name:'Starfield',            note:'deep space with a faint nebula',                          draw(g,W,H,P,r){ const gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,'#050a1e'); gr.addColorStop(1,'#0b0517'); g.fillStyle=gr; g.fillRect(0,0,W,H); const nb=g.createRadialGradient(W*0.3,H*0.35,0,W*0.3,H*0.35,520); nb.addColorStop(0,rgba(P.accent,0.28)); nb.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=nb; g.fillRect(0,0,W,H); for(let i=0;i<1200;i++){ g.fillStyle='rgba(255,255,255,'+(0.3+r()*0.7).toFixed(2)+')'; g.beginPath(); g.arc(r()*W,r()*H,r()*1.6+0.4,0,Math.PI*2); g.fill(); } } };
  K.skyline    = { name:'City dusk',            note:'gradient sky with a soft skyline silhouette',           draw(g,W,H,P,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,mix(P.c1,P.accent,0.3)); gr.addColorStop(1,dark(P)?P.c1:mix(P.c1,'#000',0.5)); g.fillStyle=gr; g.fillRect(0,0,W,H); g.fillStyle='rgba(0,0,0,0.35)'; let x=0; while(x<W){ const w=40+r()*90,h=80+r()*260; g.fillRect(x,H-h,w,h); x+=w+6; } } };
  K.duneshade  = { name:'Dune shade',           note:'two soft hills in the support tone',                     draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); [[0.35,0.5],[0.7,0.62]].forEach(([cx,cy],i)=>{ const gr=g.createRadialGradient(W*cx,H*cy,0,W*cx,H*cy,W*0.6); gr.addColorStop(0,rgba(P.support,0.35-i*0.1)); gr.addColorStop(1,rgba(P.support,0)); g.fillStyle=gr; g.fillRect(0,0,W,H); }); } };
  K.frost      = { name:'Frosted glass',        note:'pale blur with a soft colour behind',                    draw(g,W,H,P,r){ K.mesh.draw(g,W,H,P,r); g.fillStyle='rgba(255,255,255,0.55)'; g.fillRect(0,0,W,H); grain(g,W,H,0.04); } };
  K.shadowcast = { name:'Cast shadow',          note:'a soft window shadow falling across the ground, blurred seam',    draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); const lg=g.createLinearGradient(0,0,W,H); lg.addColorStop(0,rgba('#ffffff',0.22)); lg.addColorStop(0.5,rgba('#ffffff',0)); g.fillStyle=lg; g.fillRect(0,0,W,H); g.filter='blur(26px)'; g.fillStyle='rgba(8,10,16,0.34)'; g.beginPath(); g.moveTo(W*0.62,-40); g.lineTo(W+60,-40); g.lineTo(W+60,H+60); g.lineTo(W*0.22,H+60); g.closePath(); g.fill(); g.filter='blur(60px)'; g.fillStyle='rgba(8,10,16,0.16)'; g.beginPath(); g.moveTo(W*0.5,-80); g.lineTo(W+80,-80); g.lineTo(W+80,H+80); g.lineTo(W*0.05,H+80); g.closePath(); g.fill(); g.filter='none'; } };
  K.blinds     = { name:'Window blinds',        note:'sunlight through blinds: diagonal light slats inside a cast shadow', draw(g,W,H,P,r){ K.shadowcast.draw(g,W,H,P,r); g.save(); g.filter='blur(10px)'; g.translate(W*0.5,H*0.5); g.rotate(-0.55); for(let i=-4;i<=4;i++){ g.fillStyle=rgba('#ffffff',0.09); g.fillRect(-W, i*150-26, W*2, 52); } g.restore(); } };
  K.split      = { name:'Diagonal split',       note:'ground and support tone, soft seam',                     draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); g.filter='blur(14px)'; g.fillStyle=rgba(P.support,0.55); g.beginPath(); g.moveTo(W*0.55,0); g.lineTo(W,0); g.lineTo(W,H); g.lineTo(W*0.25,H); g.closePath(); g.fill(); g.filter='none'; } };

  /* — solid and sunburst (owner, 2026-09-27: "backgrounds that are solid
     colors, sunburst all sorts of styles even patterns overlays") — */
  K.solid      = { name:'Solid colour',         note:'the ground colour, flat',                                 draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); } };
  const wedges = (g, cx, cy, N, R, fill, rot) => { g.fillStyle = fill; for (let i = 0; i < N; i += 2){ const a0 = rot + (i / N) * Math.PI * 2, a1 = rot + ((i + 1) / N) * Math.PI * 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R); g.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R); g.closePath(); g.fill(); } };
  K.sunburst   = { name:'Sunburst',             note:'rays from behind the product in a lighter tone of the ground', draw(g,W,H,P,r){ const d=dark(P); g.fillStyle=P.c1; g.fillRect(0,0,W,H); const cx=W/2,cy=H*0.56;
      wedges(g,cx,cy,32,Math.hypot(W,H),d?mix(P.c1,'#ffffff',0.11):mix(P.c1,'#000000',0.07),-Math.PI/2);
      const f=g.createRadialGradient(cx,cy,W*0.1,cx,cy,W*0.85); f.addColorStop(0,rgba(P.c1,0)); f.addColorStop(1,rgba(P.c1,0.75)); g.fillStyle=f; g.fillRect(0,0,W,H);
      const gl=g.createRadialGradient(cx,cy,0,cx,cy,W*0.42); gl.addColorStop(0,'rgba(255,255,255,'+(d?0.1:0.3)+')'); gl.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gl; g.fillRect(0,0,W,H); } };
  K.burst      = { name:'Accent sunburst',      note:'rays in the accent over the ground, fading to the edges',  draw(g,W,H,P,r){ g.fillStyle=P.c1; g.fillRect(0,0,W,H); const cx=W/2,cy=H*0.56;
      wedges(g,cx,cy,24,Math.hypot(W,H),rgba(P.accent,0.2),-Math.PI/2);
      const f=g.createRadialGradient(cx,cy,W*0.12,cx,cy,W*0.9); f.addColorStop(0,rgba(P.c1,0)); f.addColorStop(1,rgba(P.c1,0.8)); g.fillStyle=f; g.fillRect(0,0,W,H); } };
  K.burstTop   = { name:'Light from above',     note:'soft rays falling from the top centre',                   draw(g,W,H,P,r){ const d=dark(P); g.fillStyle=P.c1; g.fillRect(0,0,W,H); g.save(); g.filter='blur(6px)';
      wedges(g,W/2,-H*0.25,40,Math.hypot(W,H)*1.4,d?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.28)',0); g.restore();
      const f=g.createLinearGradient(0,0,0,H); f.addColorStop(0,rgba(P.c1,0)); f.addColorStop(1,rgba(P.c1,0.85)); g.fillStyle=f; g.fillRect(0,0,W,H); } };

  const list = Object.keys(K).map(key => ({ key, name: K[key].name, note: K[key].note }));
  function draw(kind, g, W, H, P, seed){
    const r = rng(seed || 1);
    (K[kind] || K.linear).draw(g, W, H, P, r);
    if (!/grainy|paperTex|marble|velvet|frost|solid/.test(kind)) grain(g, W, H, 0.05);
  }

  /* PATTERN OVERLAYS on a photograph. Neutral ink only, black or white at a
     low strength (DESIGN-LAW rule 56: rung 1 over a photograph is light and
     shade, never a colour), so the picture keeps its own colour. */
  const O = {
    dots(g,W,H,c,a){ g.fillStyle='rgba('+c+','+a+')'; for(let x=11;x<W;x+=22) for(let y=11;y<H;y+=22){ g.beginPath(); g.arc(x,y,2.6,0,Math.PI*2); g.fill(); } },
    halftone(g,W,H,c,a){ g.fillStyle='rgba('+c+','+a+')'; for(let x=14;x<W;x+=28) for(let y=14;y<H;y+=28){ const t=Math.min(1,Math.max(0,(x/W+y/H)-0.9)*1.3); if(t<=0) continue; g.beginPath(); g.arc(x,y,1+t*11,0,Math.PI*2); g.fill(); } },
    grid(g,W,H,c,a){ g.strokeStyle='rgba('+c+','+a+')'; g.lineWidth=1.5; for(let x=0;x<=W;x+=40){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); } for(let y=0;y<=H;y+=40){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); } },
    stripes(g,W,H,c,a){ g.strokeStyle='rgba('+c+','+a+')'; g.lineWidth=3; for(let x=-H;x<W+H;x+=18){ g.beginPath(); g.moveTo(x,0); g.lineTo(x+H,H); g.stroke(); } },
    rays(g,W,H,c,a){ wedges(g,W/2,H*0.56,32,Math.hypot(W,H),'rgba('+c+','+a+')',-Math.PI/2); },
    scan(g,W,H,c,a){ g.fillStyle='rgba('+c+','+a+')'; for(let y=0;y<H;y+=5) g.fillRect(0,y,W,2); },
    grain(g,W,H,c,a){ for(let i=0;i<26000;i++){ g.fillStyle='rgba('+(Math.random()<0.5?'0,0,0':'255,255,255')+','+(Math.random()*a).toFixed(3)+')'; g.fillRect(Math.random()*W,Math.random()*H,2,2); } },
  };
  const OVERLAY_A = { dots:0.2, halftone:0.3, grid:0.14, stripes:0.12, rays:0.12, scan:0.16, grain:0.22 };
  const overlays = [['dots','Dots'],['halftone','Halftone'],['grid','Grid'],['stripes','Stripes'],['rays','Sunburst rays'],['scan','Scanlines'],['grain','Film grain']];
  function overlay(kind, g, W, H, tone, a){ if (!O[kind]) return; g.save(); O[kind](g, W, H, tone === 'light' ? '255,255,255' : '0,0,0', a == null ? OVERLAY_A[kind] : a); g.restore(); }

  /* A drawn ground or an overlaid photograph as a background SOURCE, so the
     studio treats it like any photograph (thumbnails, editor, export, video):
       ground:<kind>/<c1>/<c2>/<accent>/<support>/<ink>/<seed>
       overlay:<kind>/<dark|light>|<photo src>
     Hex without '#'. canvasFor() paints it; an overlay needs its photo's
     element (it is drawn at the photo's own size, the pattern scaled to it). */
  const hx = h => String(h || '#888888').replace('#', '').slice(0, 6);
  function src(kind, P, seed){ return 'ground:' + kind + '/' + [P.c1, P.c2 || P.c1, P.accent || P.c1, P.support || P.accent || P.c1, P.ink || '#ffffff'].map(hx).join('/') + '/' + (seed || 1); }
  function overlaySrc(kind, tone, base){ return 'overlay:' + kind + '/' + (tone === 'light' ? 'light' : 'dark') + '|' + base; }
  function parse(s){
    s = String(s || '');
    let m = /^ground:([A-Za-z]+)\/([0-9a-f]{6})\/([0-9a-f]{6})\/([0-9a-f]{6})\/([0-9a-f]{6})\/([0-9a-f]{6})\/(\d+)$/i.exec(s);
    if (m) return { type:'ground', kind:m[1], P:{ c1:'#'+m[2], c2:'#'+m[3], accent:'#'+m[4], support:'#'+m[5], ink:'#'+m[6] }, seed:+m[7] };
    m = /^overlay:([A-Za-z]+)\/(dark|light)\|(.+)$/.exec(s);
    if (m) return { type:'overlay', kind:m[1], tone:m[2], base:m[3] };
    return null;
  }
  /* the kinds' blur filters are in 1080px space: scaled with the canvas */
  const scaledCtx = (g, k) => new Proxy(g, {
    get(t, p){ const v = t[p]; return typeof v === 'function' ? v.bind(t) : v; },
    set(t, p, v){ if (p === 'filter' && typeof v === 'string') v = v.replace(/blur\(([\d.]+)px\)/g, (x, n) => 'blur(' + (n * k) + 'px)'); t[p] = v; return true; },
  });
  function canvasFor(s, baseEl, size){
    const q = parse(s); if (!q) return null;
    const c = document.createElement('canvas');
    if (q.type === 'ground'){
      const n = size || 1620, k = n / 1080; c.width = c.height = n;
      const g = c.getContext('2d'); g.scale(k, k);
      draw(q.kind, scaledCtx(g, k), 1080, 1080, q.P, q.seed);
      return c;
    }
    if (!baseEl || !(baseEl.width || baseEl.naturalWidth)) return null;
    const w = baseEl.naturalWidth || baseEl.width, h = baseEl.naturalHeight || baseEl.height, k = Math.min(w, h) / 1080;
    c.width = w; c.height = h;
    const g = c.getContext('2d'); g.drawImage(baseEl, 0, 0, w, h); g.scale(k, k);
    overlay(q.kind, g, w / k, h / k, q.tone);
    return c;
  }
  window.GROUNDS = { list, draw, kinds: Object.keys(K), overlay, overlays, src, overlaySrc, parse, canvasFor };
})();

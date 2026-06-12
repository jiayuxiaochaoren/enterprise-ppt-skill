function createCultureManifestoDefault(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addRect,
    addText
  } = ctx;
  const {
    drawDarkStageShell,
    drawFooter
  } = deps;

  return function cultureManifestoDefault(slide, plan, s, idx) {
    drawDarkStageShell(slide, {
      stageOpts:{ field:true },
      kicker:'CULTURE MANIFESTO',
      kickerOpts:{ x:0.84, y:0.92, w:1.80, h:0.13, fontSize:6.8, color:C.cyan, charSpace:1.1 },
      idx,
      pageNumberMethod:'text',
      pageNumberOpts:{ x:11.70, y:0.76, w:0.72, h:0.22, fontSize:13, bold:true, color:C.accent, align:'right' }
    });
    const statement = s.statement || s.title || '共识不是口号，而是持续行动的方式';
    addText(slide, statement, { x:0.82, y:1.72, w:6.88, h:0.92, fontSize:30, bold:true, color:C.white, fit:'shrink', breakLine:true });
    addText(slide, s.claim || s.subtitle || s.intro || '', { x:0.86, y:3.02, w:5.80, h:0.25, fontSize:11.0, color:'CBD5E1', fit:'shrink' });
    addHairline(slide, 0.88, 3.54, 0.86, C.accent, 0, 0.75);
    const values = (s.values || s.items || []).slice(0,4);
    values.forEach((v,i)=>{
      const x = 0.92 + i*2.78;
      const title = typeof v === 'string' ? v : (v.title || v.label || '');
      const body = typeof v === 'string' ? '' : (v.body || v.note || '');
      addRect(slide, x, 4.66, 2.30, 1.10, C.ink2, '334155', { fill:{color:C.ink2, transparency:34}, line:{color:i===0?C.accent:'334155', transparency:i===0?24:58, width:0.45} });
      addText(slide, String(i+1).padStart(2,'0'), { x:x+0.24, y:4.92, w:0.32, h:0.12, fontSize:7.0, bold:true, color:i===0?C.accent:C.cyan });
      addText(slide, title, { x:x+0.24, y:5.20, w:1.48, h:0.16, fontSize:10.8, bold:true, color:C.white, fit:'shrink' });
      if (body) addText(slide, body, { x:x+0.24, y:5.52, w:1.68, h:0.14, fontSize:6.7, color:'A8B3C3', fit:'shrink' });
    });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createCultureManifestoDefault
};

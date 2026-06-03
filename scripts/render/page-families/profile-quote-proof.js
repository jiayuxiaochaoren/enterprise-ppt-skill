function createQuoteProofRenderer(ctx = {}, deps = {}) {
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

  return function quoteProof(slide, plan, s, idx) {
    drawDarkStageShell(slide, {
      stageOpts:{ field:false },
      breathingCircle:{ x:8.72, y:0.70, w:3.88, h:2.10, color:C.accent },
      kicker:'CUSTOMER VOICE',
      kickerOpts:{ x:0.86, y:0.94, w:1.92, h:0.14, fontSize:8.2, color:C.darkMuted, charSpace:0.8 },
      idx,
      pageNumberMethod:'text',
      pageNumberOpts:{ x:11.70, y:0.76, w:0.72, h:0.22, fontSize:13, bold:true, color:C.accent, align:'right' }
    });
    const quote = s.quote || s.statement || s.title || '一句来自用户、客户或团队的关键声音。';
    addText(slide, `“${quote}”`, { x:0.82, y:1.72, w:6.90, h:1.05, fontSize:27, bold:true, color:C.white, fit:'shrink', breakLine:true });
    addText(slide, s.attribution || s.subtitle || '', { x:0.88, y:3.12, w:4.20, h:0.16, fontSize:9.2, color:C.captionOnImage, fit:'shrink' });
    addHairline(slide, 0.88, 3.54, 0.86, C.accent, 0, 0.75);
    const proofs = (s.items || s.cards || []).slice(0,3);
    proofs.forEach((p,i)=>{
      const x = 0.92 + i*3.18;
      addRect(slide, x, 4.70, 2.62, 0.90, C.ink2, C.darkLine, { fill:{color:C.ink2, transparency:32}, line:{color:C.darkLine, transparency:56, width:0.45} });
      addText(slide, String(i+1).padStart(2,'0'), { x:x+0.24, y:4.98, w:0.32, h:0.12, fontSize:7.0, bold:true, color:i===0?C.accent:C.cyan });
      addText(slide, typeof p === 'string' ? p : (p.title || ''), { x:x+0.62, y:4.94, w:1.58, h:0.15, fontSize:9.2, bold:true, color:C.white, fit:'shrink' });
      const body = typeof p === 'string' ? '' : (p.body || p.note || '');
      if (body) addText(slide, body, { x:x+0.62, y:5.24, w:1.68, h:0.12, fontSize:6.5, color:C.darkMuted, fit:'shrink' });
    });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createQuoteProofRenderer
};

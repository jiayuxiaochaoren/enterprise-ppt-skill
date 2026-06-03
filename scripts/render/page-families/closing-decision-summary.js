const { createPageFamilyPrimitives } = require('./primitives');

function createClosingDecisionSummaryRenderer(ctx = {}, deps = {}) {
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const {
    closingActions,
    closingMeta
  } = deps;

  return function closingDecisionSummary(slide, plan, s, idx) {
    const C = ctx.colors();
    drawLightPageHeader(slide, {
      kicker:s.label || 'FINAL DECISION',
      title:s.title || plan.closingTitle || ctx.copyFallback(plan, 'closingTitle'),
      titleY:1.18,
      titleW:6.72,
      titleH:0.72,
      titleSize:ctx.typeSize('coverTitle', 30.0),
      titleBreakLine:true,
      subtitle:s.subtitle || plan.closingSubtitle || ctx.copyFallback(plan, 'closingSubtitle'),
      subtitleY:2.20,
      subtitleW:5.88,
      subtitleH:0.22,
      subtitleSize:11.0,
      subtitleColor:C.body,
      idx
    });
    ctx.addRect(slide, 8.60, 0.96, 2.92, 5.58, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    ctx.addText(slide, 'DECISION', { x:9.00, y:1.32, w:1.88, h:0.36, fontFace:ctx.profileFont('latin'), fontSize:23.0, bold:true, color:C.accent, align:'right', fit:'shrink' });
    ctx.addLabel(slide, 'BOARD READY', { x:9.58, y:1.86, w:1.14, h:0.10, fontSize:5.8, color:C.darkMuted || '94A3B8', align:'right', charSpace:0.8 });
    ctx.addHairline(slide, 9.02, 2.54, 1.28, C.accent, 0, 0.58);
    ctx.addText(slide, s.decision || s.note || ctx.copyFallback(plan, 'closingNote'), {
      x:9.02, y:3.02, w:1.88, h:0.56, fontSize:9.0, bold:true, color:C.white, breakLine:true, fit:'shrink'
    });
    ctx.addText(slide, ctx.copyFallback(plan, 'closingDecisionOutcome'), { x:9.02, y:4.72, w:1.72, h:0.22, fontSize:7.4, color:C.captionOnImage, fit:'shrink' });
    const actions = closingActions(s);
    actions.forEach((a,i)=>{
      const x = 0.92 + i*2.50;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      ctx.addRect(slide, x, 4.02, 2.10, 1.30, ctx.panelFill(), C.line, { fill:{color:ctx.panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?22:16, width:0.46} });
      ctx.addRect(slide, x, 4.02, 2.10, 0.04, accent, accent, { line:{color:accent, transparency:100} });
      ctx.addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:4.36, w:0.34, h:0.12, fontSize:7.0, color:accent });
      ctx.addText(slide, a.title || '', { x:x+0.68, y:4.30, w:0.98, h:0.15, fontSize:9.2, bold:true, color:C.text, fit:'shrink' });
      ctx.addText(slide, a.body || '', { x:x+0.22, y:4.78, w:1.56, h:0.18, fontSize:7.1, color:C.body, fit:'shrink' });
    });
    ctx.addHairline(slide, 0.92, 6.18, 6.80, C.line, 14, 0.45);
    ctx.addText(slide, closingMeta(plan), { x:0.92, y:6.46, w:6.40, h:0.14, fontSize:7.2, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, fit:'shrink' });
  };
}

module.exports = {
  createClosingDecisionSummaryRenderer
};

const { createPageFamilyPrimitives } = require('./primitives');
const {
  createRightSideCardRenderer
} = require('./right-side-card');

function createClosingDecisionSummaryRenderer(ctx = {}, deps = {}) {
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const {
    closingActions,
    closingMeta
  } = deps;
  const {
    drawRightSideCard
  } = createRightSideCardRenderer(ctx);

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
      canvasOpts:{ motif:'none' },
      idx
    });
    const side = drawRightSideCard(slide, {}, { fill:C.ink, railColor:C.accent, railTransparency:18 });
    ctx.addText(slide, '决策', { x:side.x+0.38, y:side.y+0.42, w:1.88, h:0.36, fontFace:ctx.profileFont('editorial'), fontSize:23.0, bold:true, color:C.accent, align:'right', fit:'shrink' });
    ctx.addLabel(slide, 'BOARD READY', { x:side.x+0.98, y:side.y+0.94, w:1.14, h:0.10, fontSize:5.8, color:C.darkMuted || '94A3B8', align:'right', charSpace:0.8 });
    ctx.addHairline(slide, side.x+0.42, side.y+1.72, 1.28, C.accent, 0, 0.58);
    ctx.addText(slide, s.decision || s.note || ctx.copyFallback(plan, 'closingNote'), {
      x:side.x+0.42, y:side.y+2.18, w:1.88, h:0.56, fontSize:9.0, bold:true, color:C.white, breakLine:true, fit:'shrink'
    });
    const actions = closingActions(s);
    actions.slice(0, 3).forEach((a, i) => {
      const y = side.y + 3.56 + i * 0.36;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      ctx.addText(slide, String(i + 1).padStart(2, '0'), { x:side.x+0.42, y, w:0.28, h:0.10, fontSize:5.8, bold:true, color:accent, fit:'shrink' });
      ctx.addText(slide, a.title || '', { x:side.x+0.82, y:y-0.02, w:1.14, h:0.11, fontSize:7.0, color:C.captionOnImage, fit:'shrink' });
    });
    ctx.addText(slide, ctx.copyFallback(plan, 'closingDecisionOutcome'), {
      x:side.x+0.42, y:side.y+side.h-0.48, w:1.72, h:0.18,
      fontSize:7.2, color:C.captionOnImage, fit:'shrink'
    });
    actions.forEach((a,i)=>{
      const x = 0.92 + i*2.50;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      ctx.addRect(slide, x, 4.02, 2.10, 1.30, ctx.panelFill(), C.line, { fill:{color:ctx.panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?22:16, width:0.46} });
      ctx.addRect(slide, x, 4.02, 2.10, 0.04, accent, accent, { line:{color:accent, transparency:100} });
      ctx.addRect(slide, x+0.18, 4.24, 0.36, 0.36, ctx.panelFill(), accent, {
        fill:{color:ctx.panelFill(), transparency:12},
        line:{color:accent, transparency:28, width:0.44}
      });
      ctx.addNumber(slide, String(i+1).padStart(2,'0'), {
        x:x+0.18, y:4.24, w:0.36, h:0.36,
        fontSize:7.0, color:accent, align:'center', valign:'mid', margin:0, fit:'shrink', allowTiny:true
      });
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

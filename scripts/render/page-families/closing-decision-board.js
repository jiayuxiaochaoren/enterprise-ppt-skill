const { createPageFamilyPrimitives } = require('./primitives');

function createClosingDecisionBoardRenderer(ctx = {}, options = {}) {
  const { closingActions, closingMeta } = options;
  const C = ctx.colors();
  const { drawDarkStageShell } = createPageFamilyPrimitives(ctx);
  const {
    addHairline,
    addText,
    addRect
  } = ctx;

  return function closingDecisionBoard(slide, plan, s, idx) {
    drawDarkStageShell(slide, {
      stageOpts:{ field:false },
      breathingCircle:{ x:8.16, y:0.72, w:4.18, h:2.44, color:C.accent },
      kicker:s.label || 'FINAL POSITION',
      kickerOpts:{ x:0.92, y:0.98, w:1.70, h:0.13, fontSize:6.9, color:C.cyan, charSpace:1.05 },
      idx,
      pageNumberMethod:'number',
      pageNumberOpts:{ x:11.58, y:0.92, w:0.56, h:0.18, fontSize:10.8, color:C.accent, align:'right' }
    });
    addText(slide, s.title || plan.closingTitle || ctx.copyFallback(plan, 'closingTitle'), {
      x:0.90, y:1.94, w:6.66, h:0.86,
      fontSize:31.0, bold:true, color:C.darkText || C.white, fit:'shrink', breakLine:true
    });
    addText(slide, s.subtitle || plan.closingSubtitle || ctx.copyFallback(plan, 'closingSubtitle'), {
      x:0.92, y:3.14, w:5.50, h:0.22,
      fontSize:11.4, color:C.darkMuted || 'CBD5E1', fit:'shrink'
    });
    addRect(slide, 0.94, 3.68, 0.96, 0.05, C.accent, C.accent);
    const actions = closingActions(s);
    actions.forEach((a, i) => {
      const y = 4.88 + i * 0.48;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addHairline(slide, 0.94, y-0.12, 6.20, C.darkLine || '334155', 42, 0.45);
      addText(slide, String(i+1).padStart(2,'0'), { x:0.94, y, w:0.32, h:0.10, fontSize:6.2, bold:true, color:accent });
      addText(slide, a.title || '', { x:1.48, y:y-0.02, w:1.20, h:0.13, fontSize:8.5, bold:true, color:C.darkText || C.white, fit:'shrink' });
      addText(slide, a.body || '', { x:3.00, y:y-0.02, w:3.78, h:0.14, fontSize:7.2, color:C.darkMuted || 'CBD5E1', fit:'shrink' });
    });
    addText(slide, closingMeta(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.4, color:C.muted, fit:'shrink' });
  };
}

module.exports = {
  createClosingDecisionBoardRenderer
};

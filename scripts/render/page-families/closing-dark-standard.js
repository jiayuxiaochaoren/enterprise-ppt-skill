const { createPageFamilyPrimitives } = require('./primitives');

function createClosingDarkRenderer(ctx = {}) {
  const C = ctx.colors();
  const { drawDarkStageShell, drawFooter } = createPageFamilyPrimitives(ctx);
  const {
    addDarkBreathingCircle,
    addEnergyLens,
    addEnergyMotionBackdrop,
    addEnergyPhotoBackdrop,
    addLabel,
    addNumber,
    addRect,
    addText,
    addVisualPhotoBackdrop,
    copyFallback
  } = ctx;

  return function closingDark(slide, plan, s, idx) {
    drawDarkStageShell(slide, { stageOpts:{ field:false } });
    if (plan.industry === 'energy-utility') {
      if (!plan.motionBackdrop || !addEnergyMotionBackdrop(slide)) {
        addEnergyPhotoBackdrop(slide);
      }
      addEnergyLens(slide, 7.90, 0.72, 4.42, C.accent);
    } else if (addVisualPhotoBackdrop(slide, plan, s, 'closing', { transparency:72 })) {
      addDarkBreathingCircle(slide, 8.42, 0.82, 4.08, 2.30, C.accent);
    } else {
      addDarkBreathingCircle(slide, 8.42, 0.82, 4.08, 2.30, C.accent);
    }
    addLabel(slide, 'FINAL ALIGNMENT', { x:0.92, y:1.26, w:1.70, h:0.14, fontSize:7.2, color:C.cyan, charSpace:1.1 });
    addNumber(slide, String(idx || 10).padStart(2,'0'), { x:11.58, y:0.82, w:0.56, h:0.18, fontSize:11.5, color:C.accent, align:'right' });
    addText(slide, s.title || copyFallback(plan, 'closingTitle'), { x:0.90, y:2.12, w:7.36, h:0.72, fontSize:32.5, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.subtitle || copyFallback(plan, 'closingSubtitle'), { x:0.92, y:3.02, w:5.90, h:0.22, fontSize:12.2, color:'CBD5E1', fit:'shrink' });
    addRect(slide, 0.94, 3.52, 0.96, 0.05, C.accent, C.accent);
    addRect(slide, 2.02, 3.52, 0.34, 0.05, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:40}, line:{color:C.cyan, transparency:100} });
    const note = s.note || copyFallback(plan, 'closingNote');
    addRect(slide, 0.92, 5.46, 8.95, 0.76, C.ink2, '334155', { fill:{color:C.ink2, transparency:22}, line:{color:'334155', transparency:54, width:0.36} });
    addLabel(slide, 'NEXT DECISION', { x:1.18, y:5.74, w:1.22, h:0.11, fontSize:6.6, bold:true, color:C.accent, charSpace:0.8 });
    addText(slide, note, { x:2.58, y:5.71, w:6.58, h:0.18, fontSize:9.2, color:'CBD5E1', fit:'shrink' });
    drawFooter(slide, plan, { color:C.darkMuted || 'D8CDD0' });
  };
}

module.exports = {
  createClosingDarkRenderer
};

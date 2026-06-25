function createCoverShowcaseRenderer(ctx = {}, deps = {}) {
  const {
    addCoverKicker,
    colors,
    drawDarkStageShell,
    drawFooter,
    fileExists
  } = deps;

  return function coverShowcase(slide, plan, s, industry, title) {
    const C = colors();
    const design = ctx.designForSlide(plan, s, 'cover');
    if (!design.wantsImage) return false;
    const imagePath = design.imagePath;
    if (!imagePath || !fileExists(imagePath)) return false;
    drawDarkStageShell(slide, {
      stageOpts:{ field:false },
      breathingCircle:{ x:8.72, y:0.62, w:3.72, h:2.04, color:C.accent }
    });
    addCoverKicker(slide, plan, industry, { x:0.84, y:0.96, w:3.80, h:0.14, fontSize:7.0, color:C.cyan, charSpace:1.1 });
    ctx.addText(slide, title, { x:0.82, y:1.76, w:4.82, h:1.08, fontSize:ctx.typeSize('coverTitle', 29.0), bold:true, color:C.white, breakLine:true, fit:'shrink' });
    const insight = s.coverInsight || plan.coverInsight || industry.insight || s.subtitle || plan.subtitle;
    ctx.addText(slide, insight, { x:0.86, y:3.28, w:4.24, h:0.26, fontSize:10.7, color:'CBD5E1', fit:'shrink' });

    const frame = { x:6.24, y:1.04, w:5.20, h:4.92 };
    ctx.addRect(slide, frame.x, frame.y, frame.w, frame.h, C.ink2, '334155', {
      fill:{color:C.ink2, transparency:10},
      line:{color:'334155', transparency:58, width:0.45}
    });
    ctx.addPhotoPanel(slide, imagePath, frame.x, frame.y, frame.w, frame.h, {
      transparency:100,
      stroke:'334155',
      strokeTransparency:42,
      fit:'cover'
    });

    ctx.addDeckMeta(slide, plan, { x:0.86, y:6.34, w:5.50, h:0.16, fontSize:7.3, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { fontSize:7.5, color:C.muted });
    return true;
  };
}

module.exports = {
  createCoverShowcaseRenderer
};

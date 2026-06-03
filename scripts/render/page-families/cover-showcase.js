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
    const companyIntro = ctx.isCompanyIntroPlan(plan);
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
    ctx.addRect(slide, 0.86, 3.78, 0.82, 0.045, C.accent, C.accent);
    ctx.addRect(slide, 1.82, 3.78, 0.34, 0.045, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:40}, line:{color:C.cyan, transparency:100} });

    ctx.addRect(slide, 6.16, 0.74, 6.22, 5.42, C.ink2, '334155', { fill:{color:C.ink2, transparency:12}, line:{color:'334155', transparency:62, width:0.45} });
    ctx.addPhotoPanel(slide, imagePath, 6.36, 0.96, 5.82, 4.64, { transparency:100, stroke:'334155', strokeTransparency:56 });
    ctx.addRect(slide, 6.36, 5.60, 5.82, 0.56, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    ctx.addLabel(slide, companyIntro ? '现场图像' : 'VISUAL EVIDENCE', { x:6.66, y:5.82, w:1.12, h:0.10, fontSize:5.8, color:C.accent, charSpace:companyIntro ? 0 : 0.8 });
    const fallbackCaption = ctx.copyFallback(plan, 'fallbackCaption', companyIntro ? '产品与现场能力展示' : '');
    ctx.addText(slide, (s.visual && s.visual.caption) || fallbackCaption, { x:8.02, y:5.81, w:3.24, h:0.12, fontSize:6.8, color:'CBD5E1', fit:'shrink' });

    ctx.addDeckMeta(slide, plan, { x:0.86, y:6.34, w:5.50, h:0.16, fontSize:7.3, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { fontSize:7.5, color:C.muted });
    return true;
  };
}

module.exports = {
  createCoverShowcaseRenderer
};

function createAiryConceptOpening(ctx = {}, deps = {}) {
  const {
    colors,
    drawFooter,
    drawLightCanvasShell,
    fileExists
  } = deps;

  return function airyConceptOpening(slide, plan, s) {
    const C = colors();
    drawLightCanvasShell(slide);
    const imagePath = ctx.designForSlide(plan, s, 'cover').imagePath;
    ctx.addLabel(slide, 'CONCEPT OPENING', { x:0.88, y:0.92, w:1.62, h:0.13, fontSize:7.0, color:C.accent, charSpace:1.0 });
    ctx.addText(slide, s.title || plan.title || ctx.copyFallback(plan, 'coverTitle'), {
      x:0.86, y:1.70, w:6.52, h:0.86, fontSize:ctx.typeSize('coverTitle', 31.0), bold:true, color:C.text, fit:'shrink', breakLine:true
    });
    ctx.addText(slide, s.subtitle || s.coverInsight || plan.subtitle || ctx.copyFallback(plan, 'industryInsight'), {
      x:0.90, y:2.86, w:4.88, h:0.22, fontSize:11.0, color:C.body, fit:'shrink'
    });
    ctx.addRect(slide, 0.92, 3.44, 0.92, 0.04, C.accent, C.accent);
    ctx.addRect(slide, 2.00, 3.44, 0.32, 0.04, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:36}, line:{color:C.cyan, transparency:100} });

    const object = { x:7.70, y:1.28, w:2.78, h:2.78 };
    slide.addShape('ellipse', { x:object.x-0.54, y:object.y-0.54, w:object.w+1.08, h:object.h+1.08, fill:{color:C.softBlue || 'EFF6FF', transparency:34}, line:{color:C.softBlue || 'EFF6FF', transparency:100} });
    ctx.addRect(slide, object.x, object.y, object.w, object.h, ctx.panelFill(), C.line, { fill:{color:ctx.panelFill(), transparency:0}, line:{color:C.line, transparency:18, width:0.44} });
    if (imagePath && fileExists(imagePath)) {
      ctx.addPhotoPanel(slide, imagePath, object.x+0.20, object.y+0.20, object.w-0.40, object.h-0.40, { tone:'light', transparency:100, stroke:C.line, strokeTransparency:28, fit:'cover' });
    } else {
      ctx.genericShowcaseField(slide, object.x+0.20, object.y+0.20, object.w-0.40, object.h-0.40, 'CORE OBJECT');
    }
    ctx.addLabel(slide, 'ONE OBJECT', { x:7.82, y:4.52, w:0.98, h:0.09, fontSize:5.6, color:C.accent, charSpace:0.8 });
    ctx.addText(slide, (s.visual && s.visual.caption) || ctx.copyFallback(plan, 'fallbackCaption'), { x:8.98, y:4.48, w:1.86, h:0.12, fontSize:7.4, color:C.body, fit:'shrink' });

    const proof = s.coverProof || s.note || ctx.copyFallback(plan, 'coverProof');
    ctx.addRect(slide, 0.92, 5.46, 7.20, 0.48, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:10}, line:{color:C.line, transparency:100} });
    ctx.addLabel(slide, 'PROOF DIRECTION', { x:1.16, y:5.63, w:1.30, h:0.09, fontSize:5.6, color:C.accent, charSpace:0.7 });
    ctx.addText(slide, proof, { x:2.82, y:5.60, w:4.64, h:0.12, fontSize:7.8, color:C.body, fit:'shrink' });
    ctx.addDeckMeta(slide, plan, { x:0.90, y:6.42, w:5.60, h:0.14, fontSize:7.2, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { fontSize:7.6, color:C.muted });
  };
}

module.exports = {
  createAiryConceptOpening
};

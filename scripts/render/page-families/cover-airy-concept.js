function createAiryConceptOpening(ctx = {}, deps = {}) {
  const {
    colors,
    drawFooter,
    drawLightCanvasShell,
    fileExists,
    shouldUseCoverImage
  } = deps;

  return function airyConceptOpening(slide, plan, s) {
    const C = colors();
    drawLightCanvasShell(slide);
    const imagePath = ctx.designForSlide(plan, s, 'cover').imagePath;
    const title = deps.coverTitleText(s.title || plan.title || ctx.copyFallback(plan, 'coverTitle'));
    ctx.addLabel(slide, 'CONCEPT OPENING', { x:0.88, y:0.92, w:1.62, h:0.13, fontSize:7.0, color:C.accent, charSpace:1.0 });
    ctx.addText(slide, title, {
      x:0.86, y:1.70, w:6.52, h:0.86,
      fontFace:ctx.profileFont('editorial'),
      fontSize:ctx.typeSize('coverTitle', 31.0),
      bold:true, color:C.text, fit:'shrink', breakLine:true
    });
    ctx.addText(slide, s.subtitle || s.coverInsight || plan.subtitle || ctx.copyFallback(plan, 'industryInsight'), {
      x:0.90, y:2.86, w:4.88, h:0.22, fontSize:11.0, color:C.body, fit:'shrink'
    });

    const object = { x:7.70, y:1.28, w:2.78, h:2.78 };
    const hasImage = shouldUseCoverImage
      ? shouldUseCoverImage(s, { imagePath }, { requireTrustedEvidence:true }) && fileExists(imagePath)
      : imagePath && fileExists(imagePath);
    slide.addShape('ellipse', { x:object.x-0.54, y:object.y-0.54, w:object.w+1.08, h:object.h+1.08, fill:{color:C.softBlue || 'EFF6FF', transparency:34}, line:{color:C.softBlue || 'EFF6FF', transparency:100} });
    if (hasImage) {
      ctx.addRect(slide, object.x, object.y, object.w, object.h, ctx.panelFill(), C.line, { fill:{color:ctx.panelFill(), transparency:0}, line:{color:C.line, transparency:18, width:0.44} });
      ctx.addPhotoPanel(slide, imagePath, object.x+0.20, object.y+0.20, object.w-0.40, object.h-0.40, { tone:'light', transparency:100, stroke:C.line, strokeTransparency:28, fit:'cover' });
      const caption = s.visual && s.visual.caption;
      if (caption) {
        ctx.addText(slide, caption, { x:7.82, y:4.48, w:3.02, h:0.12, fontSize:7.4, color:C.body, fit:'shrink' });
      }
    }

    const rawProof = s.coverProof || s.note || '';
    const proof = typeof ctx.publicSlideNote === 'function' ? ctx.publicSlideNote(rawProof) : rawProof;
    if (proof) {
      ctx.addRect(slide, 0.92, 5.46, 7.20, 0.48, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:10}, line:{color:C.line, transparency:100} });
      ctx.addText(slide, proof, { x:1.16, y:5.60, w:6.68, h:0.12, fontSize:7.8, color:C.body, fit:'shrink' });
    }
    ctx.addDeckMeta(slide, plan, { x:0.90, y:6.42, w:5.60, h:0.14, fontSize:7.2, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { fontSize:7.6, color:C.muted });
  };
}

module.exports = {
  createAiryConceptOpening
};

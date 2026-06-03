function createCoverLightEditorialProofPanel(ctx = {}, deps = {}) {
  const {
    colors,
    fileExists
  } = deps;

  function drawLightEditorialProofPanel(slide, plan, s, insight, panel, companyIntro) {
    const C = colors();
    ctx.addRect(slide, 8.98, 1.28, 2.74, 3.96, panel, C.line, {
      fill:{color:panel, transparency:18},
      line:{color:C.line, transparency:16, width:0.45}
    });
    const design = ctx.designForSlide(plan, s, 'cover');
    const hasPanelImage = design.imagePath && fileExists(design.imagePath);
    if (hasPanelImage) {
      ctx.addPhotoPanel(slide, design.imagePath, 8.98, 1.28, 2.74, 3.96, {
        tone:'light',
        transparency:72,
        stroke:C.line,
        strokeTransparency:24
      });
      ctx.addRect(slide, 8.98, 4.24, 2.74, 1.00, panel, panel, {
        fill:{color:panel, transparency:10},
        line:{color:panel, transparency:100}
      });
      ctx.addLabel(slide, companyIntro ? '现场图像' : 'VISUAL PROOF', {
        x:9.24, y:4.58, w:1.08, h:0.10,
        fontSize:5.8, color:C.accent, charSpace:companyIntro ? 0 : 0.8
      });
      const imageCaption = ctx.copyFallback(plan, 'fallbackCaption');
      ctx.addText(slide, (s.visual && s.visual.caption) || imageCaption, {
        x:9.24, y:4.82, w:1.88, h:0.15,
        fontSize:7.4, color:C.body, fit:'shrink'
      });
      return;
    }

    ctx.addText(slide, '01', {
      x:9.28, y:1.64, w:0.44, h:0.18,
      fontSize:10, bold:true, color:C.accent
    });
    ctx.addText(slide, s.coverProofTitle || plan.coverProofTitle || ctx.copyFallback(plan, 'coverProofTitle'), {
      x:9.28, y:2.20, w:1.78, h:0.18,
      fontSize:11.2, bold:true, color:C.text, fit:'shrink'
    });
    ctx.addText(slide, s.coverProof || plan.coverProof || insight || ctx.copyFallback(plan, 'coverProof'), {
      x:9.28, y:2.80, w:1.74, h:0.52,
      fontSize:7.6, color:C.body, breakLine:true, fit:'shrink'
    });
  }

  return {
    drawLightEditorialProofPanel
  };
}

module.exports = {
  createCoverLightEditorialProofPanel
};

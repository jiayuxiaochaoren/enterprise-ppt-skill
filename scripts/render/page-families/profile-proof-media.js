function createProfileProofMediaRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addPhotoPanel,
    addRect,
    designForSlide,
    fileExists,
    imageAspect,
    panelFill
  } = ctx;

  function drawProfileProofMedia(slide, plan, s, companyIntro) {
    const proofDesign = designForSlide(plan, s, 'situation');
    const hasProofImage = proofDesign.imagePath && fileExists(proofDesign.imagePath);
    const proofIsPortrait = hasProofImage && imageAspect(proofDesign.imagePath) < 0.9;
    if (hasProofImage) {
      if (proofIsPortrait) {
        addPhotoPanel(slide, proofDesign.imagePath, 9.10, 2.08, 2.36, 3.74, { tone:'light', transparency:72, stroke:C.line, strokeTransparency:26, fit:'cover' });
        addRect(slide, 9.10, 5.18, 2.36, 0.64, panelFill(), panelFill(), { fill:{color:panelFill(), transparency:10}, line:{color:panelFill(), transparency:100} });
        addLabel(slide, companyIntro ? '现场图片' : 'BRAND PROOF', { x:9.34, y:5.40, w:1.04, h:0.09, fontSize:5.5, color:C.accent, charSpace:companyIntro ? 0 : 0.8 });
      } else {
        addPhotoPanel(slide, proofDesign.imagePath, 4.64, 1.98, 6.40, 1.44, { tone:'light', transparency:72, stroke:C.line, strokeTransparency:26, fit:'cover' });
        addRect(slide, 4.64, 3.06, 6.40, 0.36, panelFill(), panelFill(), { fill:{color:panelFill(), transparency:10}, line:{color:panelFill(), transparency:100} });
        addLabel(slide, companyIntro ? '现场图片' : 'BRAND PROOF', { x:4.92, y:3.18, w:1.04, h:0.09, fontSize:5.5, color:C.accent, charSpace:companyIntro ? 0 : 0.8 });
      }
    }
    return {
      hasProofImage,
      proofIsPortrait
    };
  }

  return {
    drawProfileProofMedia
  };
}

module.exports = {
  createProfileProofMediaRenderer
};

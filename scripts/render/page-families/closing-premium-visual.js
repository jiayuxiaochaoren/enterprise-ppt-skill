function createPremiumClosingVisual(ctx = {}, C = ctx.colors()) {
  const {
    addDarkBreathingCircle,
    addLabel,
    addPhotoPanel,
    addRect,
    fileExists,
    galleryImages,
    mediaForRole,
    resolveAssetPath
  } = ctx;

  function resolvePremiumClosingImage(plan, s) {
    const imagePath = (s.visual && s.visual.image)
      ? resolveAssetPath(s.visual.image)
      : (galleryImages(plan, s)[0] || mediaForRole(plan, s, 'closing'));
    return imagePath && fileExists(imagePath) ? imagePath : '';
  }

  function drawPremiumClosingVisual(slide, plan, s) {
    const imagePath = resolvePremiumClosingImage(plan, s);
    if (imagePath) {
      addPhotoPanel(slide, imagePath, 6.22, 0.74, 5.64, 5.82, {
        tone:'dark',
        transparency:50,
        stroke:C.accent,
        strokeTransparency:62,
        strokeWidth:0.40,
        fit:'cover'
      });
      addRect(slide, 6.22, 0.74, 5.64, 5.82, C.ink, C.ink, {
        fill:{color:C.ink, transparency:82},
        line:{color:C.ink, transparency:100}
      });
      addLabel(slide, 'DECISION MATERIALS', { x:6.54, y:1.02, w:1.76, h:0.10, fontSize:5.8, color:C.cyan, charSpace:0.8 });
      return true;
    }
    addDarkBreathingCircle(slide, 8.62, 0.96, 3.70, 2.08, C.accent);
    return false;
  }

  return {
    drawPremiumClosingVisual,
    resolvePremiumClosingImage
  };
}

module.exports = {
  createPremiumClosingVisual
};

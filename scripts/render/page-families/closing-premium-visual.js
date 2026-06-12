function createPremiumClosingVisual(ctx = {}, C = ctx.colors()) {
  const {
    addDarkBreathingCircle,
    addLabel,
    addPhotoPanel,
    addRect,
    canvasHeight,
    canvasWidth,
    fileExists,
    galleryImages,
    mediaForRole,
    resolveAssetPath
  } = ctx;

  function resolvePremiumClosingImage(plan, s) {
    const imagePath = (s.visual && s.visual.image)
      ? resolveAssetPath(s.visual.image)
      : (galleryImages(plan, s)[0] || mediaForRole(plan, s, 'closing'));
    if (!imagePath || !fileExists(imagePath)) return '';
    if (/generated-product-hero\.png$/i.test(String(imagePath))) {
      const scene = String(imagePath).replace(/generated-product-hero\.png$/i, 'generated-vanity-scene.png');
      if (scene !== imagePath && fileExists(scene)) return scene;
      const detail = String(imagePath).replace(/generated-product-hero\.png$/i, 'generated-vanity-detail.png');
      if (detail !== imagePath && fileExists(detail)) return detail;
    }
    return imagePath;
  }

  function drawPremiumClosingVisual(slide, plan, s) {
    const imagePath = resolvePremiumClosingImage(plan, s);
    const W = typeof canvasWidth === 'function' ? canvasWidth() : 13.333;
    const H = typeof canvasHeight === 'function' ? canvasHeight() : 7.5;
    if (imagePath) {
      slide.addImage({
        path:imagePath,
        x:0,
        y:0,
        w:W,
        h:2.72,
        sizing:{ type:'cover', w:W, h:2.72 }
      });
      addRect(slide, 0, 0, W, 2.72, C.ink, C.ink, {
        fill:{color:C.ink, transparency:42},
        line:{color:C.ink, transparency:100}
      });
      addRect(slide, 0, 2.68, W, 0.05, C.accent, C.accent, {
        fill:{color:C.accent, transparency:8},
        line:{color:C.accent, transparency:100}
      });
      addRect(slide, 8.64, 0.56, 3.78, 0.52, C.ink, C.ink, {
        fill:{color:C.ink, transparency:28},
        line:{color:C.accent, transparency:58, width:0.36}
      });
      addLabel(slide, 'DECISION MATERIALS', { x:8.92, y:0.75, w:1.76, h:0.10, fontSize:5.8, color:C.cyan, charSpace:0.8 });
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

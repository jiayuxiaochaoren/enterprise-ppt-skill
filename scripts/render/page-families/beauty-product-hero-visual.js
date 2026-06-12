function createBeautyProductHeroVisual(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addSmartPhotoPanel,
    addText,
    fileExists
  } = ctx;

  function drawProductHeroVisual(slide, s, design, hero) {
    const hasImage = design.imagePath && fileExists(design.imagePath);
    if (hasImage) {
      addSmartPhotoPanel(slide, design.imagePath, hero.x, hero.y, hero.w, hero.h, { role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:20 });
    }
    if (hasImage && s.visual && s.visual.caption) {
      addRect(slide, hero.x, hero.y+hero.h-0.72, hero.w, 0.72, C.ink, C.ink, { fill:{color:C.ink, transparency:8}, line:{color:C.ink, transparency:100} });
      addLabel(slide, (s.visual && s.visual.captionLabel) || 'VISUAL PROOF', { x:hero.x+0.28, y:hero.y+hero.h-0.42, w:1.10, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.8 });
      addText(slide, s.visual.caption, { x:hero.x+1.66, y:hero.y+hero.h-0.43, w:3.42, h:0.12, fontSize:7.0, color:'CBD5E1', fit:'shrink' });
    }
  }

  return {
    drawProductHeroVisual
  };
}

module.exports = {
  createBeautyProductHeroVisual
};

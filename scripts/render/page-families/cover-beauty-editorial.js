function createBeautyBrandEditorialCover(ctx = {}, deps = {}) {
  const {
    colors,
    drawFooter,
    drawLightCanvasShell,
    fileExists
  } = deps;

  return function beautyBrandEditorialCover(slide, plan, s) {
    const C = colors();
    drawLightCanvasShell(slide);
    ctx.addLabel(slide, 'BEAUTY BRAND WORLD', { x:0.86, y:0.48, w:2.00, h:0.13, fontSize:7.0, color:C.accent, charSpace:1.0 });
    ctx.addText(slide, s.title || plan.title || ctx.copyFallback(plan, 'coverTitle'), {
      x:0.84, y:1.54, w:5.40, h:0.84, fontSize:ctx.typeSize('coverTitle', 30.0), bold:true, color:C.text, fit:'shrink', breakLine:true
    });
    ctx.addText(slide, s.subtitle || s.coverInsight || plan.subtitle || ctx.copyFallback(plan, 'industryInsight'), {
      x:0.86, y:2.70, w:4.62, h:0.30, fontSize:11.0, color:C.body, fit:'shrink'
    });
    ctx.addRect(slide, 0.88, 3.28, 0.86, 0.05, C.accent, C.accent);
    ctx.addRect(slide, 1.88, 3.28, 0.34, 0.05, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:38}, line:{color:C.cyan, transparency:100} });

    const imagePath = ctx.designForSlide(plan, s, 'cover').imagePath;
    const hero = { x:6.46, y:1.16, w:4.92, h:3.86 };
    ctx.addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    if (imagePath && fileExists(imagePath)) {
      ctx.addPhotoPanel(slide, imagePath, hero.x+0.18, hero.y+0.18, hero.w-0.36, 2.56, { tone:'light', transparency:88, stroke:'FFFFFF', strokeTransparency:70, fit:'cover' });
    } else {
      ctx.genericShowcaseField(slide, hero.x+0.22, hero.y+0.24, hero.w-0.44, 2.50, 'PRODUCT TEXTURE');
    }
    ctx.addRect(slide, hero.x, hero.y+hero.h-0.98, hero.w, 0.98, C.ink, C.ink, { fill:{color:C.ink, transparency:8}, line:{color:C.ink, transparency:100} });
    ctx.addLabel(slide, 'PRODUCT · TEXTURE · PROOF', { x:hero.x+0.30, y:hero.y+hero.h-0.64, w:1.72, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.7 });
    ctx.addText(slide, (s.visual && s.visual.caption) || ctx.copyFallback(plan, 'fallbackCaption'), {
      x:hero.x+0.30, y:hero.y+hero.h-0.36, w:3.50, h:0.14, fontSize:7.5, color:'CBD5E1', fit:'shrink'
    });

    const proof = Array.isArray(s.coverIndex) ? s.coverIndex : (Array.isArray(plan.coverIndex) ? plan.coverIndex : []);
    proof.slice(0, 3).forEach((row, i) => {
      const item = Array.isArray(row) ? row : [ctx.itemTitle(row), ctx.itemBody(row)];
      const y = 4.22 + i * 0.54;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      ctx.addNumber(slide, String(i + 1).padStart(2, '0'), { x:0.92, y:y+0.04, w:0.30, h:0.10, fontSize:6.5, color:accent });
      ctx.addText(slide, item[0], { x:1.38, y, w:0.98, h:0.14, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      ctx.addText(slide, item[1], { x:2.76, y, w:2.56, h:0.14, fontSize:7.5, color:C.body, fit:'shrink' });
    });
    ctx.addDeckMeta(slide, plan, { x:0.88, y:6.36, w:5.50, h:0.14, fontSize:7.4, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { fontSize:7.6, color:C.muted });
  };
}

module.exports = {
  createBeautyBrandEditorialCover
};

const { createPageFamilyPrimitives } = require('./primitives');

function createClosingCompanyThanksRenderer(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const H = typeof ctx.canvasHeight === 'function' ? ctx.canvasHeight() : 7.5;
  const { drawDarkStageShell, drawFooter } = createPageFamilyPrimitives(ctx);
  const {
    ContactBlock,
    addHairline,
    addLabel,
    addRect,
    addText,
    copyFallback,
    fileExists,
    mediaForRole,
    resolveAssetPath,
    smartPhotoFit,
    typeSize
  } = ctx;
  const {
    contactItemsForClosing
  } = deps;

  return function closingCompanyThanks(slide, plan, s, idx) {
    drawDarkStageShell(slide, {
      stageOpts:{ field:false },
      breathingCircle:{ x:8.54, y:0.40, w:4.18, h:2.36, color:C.accent },
      kicker:s.label || '致谢',
      kickerOpts:{ x:0.86, y:0.82, w:1.10, h:0.12, fontSize:7.0, color:C.accent, charSpace:0 },
      idx,
      pageNumberMethod:'number',
      pageNumberOpts:{ x:11.70, y:0.72, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' }
    });

    const imagePath = (s.visual && s.visual.image) ? resolveAssetPath(s.visual.image) : mediaForRole(plan, s, 'closing');
    if (imagePath && fileExists(imagePath)) {
      addRect(slide, 7.02, 0.00, 6.32, H, C.ink2, C.ink2);
      slide.addImage({ path:imagePath, x:7.12, y:0.62, w:5.16, h:5.78, sizing:{ type:smartPhotoFit(imagePath, { w:5.16, h:5.78 }, 'showcase'), w:5.16, h:5.78 } });
      addRect(slide, 7.12, 0.62, 5.16, 5.78, C.ink, C.ink, { fill:{color:C.ink, transparency:20}, line:{color:C.darkLine || '334155', transparency:42, width:0.46} });
      addRect(slide, 7.12, 5.94, 5.16, 0.46, C.ink, C.ink, { fill:{color:C.ink, transparency:4}, line:{color:C.ink, transparency:100} });
      addLabel(slide, '现场图像', { x:7.42, y:6.10, w:0.88, h:0.09, fontSize:5.4, color:C.accent, charSpace:0 });
    } else {
      addRect(slide, 7.22, 0.82, 4.70, 5.52, C.ink2, C.darkLine || '334155', { fill:{color:C.ink2, transparency:0}, line:{color:C.darkLine || '334155', transparency:42, width:0.46} });
      addText(slide, plan.organization || plan.title || '', { x:7.72, y:2.64, w:3.00, h:0.56, fontSize:18.6, bold:true, color:C.white, fit:'shrink', breakLine:true });
      addHairline(slide, 7.74, 3.68, 1.16, C.accent, 0, 0.58);
    }

    addText(slide, s.title || copyFallback(plan, 'closingSimpleTitle'), {
      x:0.84, y:1.72, w:5.54, h:0.82,
      fontSize:typeSize('coverTitle', 35.0), bold:true, color:C.darkText || C.white, fit:'shrink'
    });
    addText(slide, s.subtitle || plan.organization || plan.title || copyFallback(plan, 'closingSimpleSubtitle'), {
      x:0.88, y:2.86, w:5.44, h:0.24,
      fontSize:12.4, bold:true, color:C.captionOnImage || 'CBD5E1', fit:'shrink'
    });
    addRect(slide, 0.88, 3.40, 0.98, 0.05, C.accent, C.accent);
    addRect(slide, 2.02, 3.40, 0.36, 0.05, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:28}, line:{color:C.cyan, transparency:100} });

    const contacts = contactItemsForClosing(plan, s).slice(0, 4);
    if (!ContactBlock(slide, contacts, 0.90, 4.46, { dark:true })) {
      addText(slide, copyFallback(plan, 'closingContactFallback'), { x:0.90, y:4.78, w:4.82, h:0.16, fontSize:8.8, color:C.darkMuted || '94A3B8', fit:'shrink' });
    }
    addHairline(slide, 0.86, 6.42, 5.76, C.darkLine || '334155', 42, 0.55);
    drawFooter(slide, plan, { x:0.86, y:6.76, w:5.80, h:0.14, fontSize:7.8, color:C.darkMuted || '94A3B8', fit:'shrink' });
  };
}

module.exports = {
  createClosingCompanyThanksRenderer
};

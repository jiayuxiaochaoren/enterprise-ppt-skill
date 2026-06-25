function createCoverDarkEnergyCopy(ctx = {}, deps = {}) {
  const {
    addCoverKicker,
    colors,
    splitEnergyTitle
  } = deps;

  function drawEnergyCoverCopy(slide, plan, s, industry, title) {
    const C = colors();
    const [primaryTitle, secondaryTitle] = splitEnergyTitle(title);
    addCoverKicker(slide, plan, industry, {
      x:0.86, y:1.10, w:3.8, h:0.16,
      fontSize:7.6, color:C.cyan, charSpace:1.15
    });
    if (secondaryTitle) {
      ctx.addText(slide, primaryTitle, {
        x:0.84, y:2.02, w:5.15, h:0.58,
        fontSize:ctx.typeSize('coverHeroTitle', 41.0), bold:true, color:C.white, fit:'shrink', breakLine:false
      });
      ctx.addText(slide, secondaryTitle, {
        x:0.88, y:2.78, w:5.80, h:0.42,
        fontSize:24.5, bold:true, color:C.white, fit:'shrink', breakLine:false
      });
    } else {
      ctx.addText(slide, title, {
        x:0.84, y:2.30, w:7.25, h:0.62,
        fontSize:ctx.typeSize('coverTitle', 33.0), bold:true, color:C.white, fit:'shrink', breakLine:false
      });
    }
    const insight = s.coverInsight || plan.coverInsight || industry.insight || s.subtitle || plan.subtitle;
    ctx.addText(slide, insight, {
      x:0.88, y:3.48, w:5.85, h:0.22,
      fontSize:11.2, color:'CBD5E1', fit:'shrink'
    });
    ctx.addDeckMeta(slide, plan, {
      x:0.88, y:6.24, w:7.3, h:0.16,
      fontSize:7.8, color:'CBD5E1', fit:'shrink'
    });
  }

  return {
    drawEnergyCoverCopy
  };
}

module.exports = {
  createCoverDarkEnergyCopy
};

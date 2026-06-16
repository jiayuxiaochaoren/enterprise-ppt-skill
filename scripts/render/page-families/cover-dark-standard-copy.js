function createCoverDarkStandardCopy(ctx = {}, deps = {}) {
  const {
    addCoverKicker,
    colors
  } = deps;

  function drawStandardCoverCopy(slide, plan, s, industry, title) {
    const C = colors();
    addCoverKicker(slide, plan, industry, {
      x:0.92, y:1.18, w:3.8, h:0.16,
      fontSize:8.6, color:C.cyan, charSpace:1.1
    });
    ctx.addText(slide, title, {
      x:0.88, y:2.05, w:6.55, h:1.08,
      fontSize:ctx.typeSize('coverTitle', 31.0), bold:true, color:C.white, breakLine:true, fit:'shrink'
    });
    const insight = s.coverInsight || plan.coverInsight || industry.insight || s.subtitle || plan.subtitle;
    ctx.addText(slide, insight, {
      x:0.92, y:3.36, w:5.7, h:0.20,
      fontSize:11.5, color:'CBD5E1', fit:'shrink'
    });
    ctx.addDeckMeta(slide, plan, {
      x:0.92, y:6.30, w:7.1, h:0.16,
      fontSize:8.2, color:'CBD5E1'
    });
  }

  return {
    drawStandardCoverCopy
  };
}

module.exports = {
  createCoverDarkStandardCopy
};

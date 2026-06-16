const {
  createCoverLightEditorialMotif
} = require('./cover-light-editorial-motif');
const {
  createCoverLightEditorialProofPanel
} = require('./cover-light-editorial-proof-panel');

function createCoverLightEditorialRenderer(ctx = {}, deps = {}) {
  const {
    addCoverKicker,
    colors,
    drawFooter,
    fileExists
  } = deps;
  const { drawLightEditorialMotif } = createCoverLightEditorialMotif(ctx, deps);
  const { drawLightEditorialProofPanel } = createCoverLightEditorialProofPanel(ctx, {
    colors,
    fileExists
  });

  return function coverLightEditorial(slide, plan, s, industry, title) {
    const C = colors();
    const bg = ctx.surfaceFill();
    const panel = ctx.panelFill();
    const motif = ctx.presentationSpec().coverMotif || 'editorial-rule';
    const companyIntro = ctx.isCompanyIntroPlan(plan);
    drawLightEditorialMotif(slide, motif, bg);

    const x0 = motif === 'ivory-editorial' ? 4.72 : 0.84;
    const metaColor = motif === 'ivory-editorial' ? C.muted : C.muted;
    addCoverKicker(slide, plan, industry, { x:x0, y:1.02, w:3.80, h:0.14, fontSize:7.1, color:metaColor, charSpace:1.1 });
    ctx.addText(slide, title, {
      x:x0, y:1.92, w:5.92, h:1.02,
      fontFace:ctx.profileFont('editorial'),
      fontSize:ctx.typeSize('coverTitle', 31.0),
      bold:true, color:C.text, breakLine:true, fit:'shrink'
    });
    const insight = s.coverInsight || plan.coverInsight || industry.insight || s.subtitle || plan.subtitle;
    ctx.addText(slide, insight, { x:x0+0.02, y:3.34, w:5.55, h:0.20, fontSize:10.8, color:C.body, fit:'shrink' });

    if (motif !== 'ivory-editorial') {
      drawLightEditorialProofPanel(slide, plan, s, insight, panel, companyIntro);
    }

    ctx.addDeckMeta(slide, plan, { x:x0+0.02, y:6.38, w:5.70, h:0.14, fontSize:7.2, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { fontSize:ctx.typeSize('caption', 7.4), color:C.muted });
  };
}

module.exports = {
  createCoverLightEditorialRenderer
};

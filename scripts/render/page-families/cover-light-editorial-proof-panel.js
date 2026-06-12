const {
  createRightSideCardRenderer
} = require('./right-side-card');

function createCoverLightEditorialProofPanel(ctx = {}, deps = {}) {
  const {
    colors,
    fileExists
  } = deps;
  const {
    drawRightSideCard
  } = createRightSideCardRenderer(ctx);

  function drawLightEditorialProofPanel(slide, plan, s, insight, panel, companyIntro) {
    const C = colors();
    const design = ctx.designForSlide(plan, s, 'cover');
    const hasPanelImage = design.imagePath && fileExists(design.imagePath);
    if (hasPanelImage) {
      const card = drawRightSideCard(slide, {}, {
        fill:panel,
        line:C.line,
        lineTransparency:16,
        railColor:C.accent,
        railTransparency:8
      });
      ctx.addPhotoPanel(slide, design.imagePath, card.x, card.y, card.w, card.h, {
        tone:'light',
        transparency:100,
        stroke:C.line,
        strokeTransparency:22,
        fit:'cover'
      });
      return;
    }

    const card = drawRightSideCard(slide, {}, {
      fill:panel,
      line:C.line,
      lineTransparency:16,
      railColor:C.accent,
      railTransparency:8
    });
    ctx.addText(slide, '01', {
      x:card.x+0.42, y:card.y+0.42, w:0.44, h:0.18,
      fontSize:10.2, bold:true, color:C.accent
    });
    ctx.addText(slide, s.coverProofTitle || plan.coverProofTitle || ctx.copyFallback(plan, 'coverProofTitle'), {
      x:card.x+0.42, y:card.y+1.04, w:2.02, h:0.22,
      fontSize:12.2, bold:true, color:C.text, fit:'shrink'
    });
    ctx.addText(slide, s.coverProof || plan.coverProof || insight || ctx.copyFallback(plan, 'coverProof'), {
      x:card.x+0.42, y:card.y+1.78, w:1.98, h:0.62,
      fontSize:8.4, color:C.body, breakLine:true, fit:'shrink'
    });
    ctx.addRect(slide, card.x+0.42, card.y+3.00, 1.10, 0.035, C.accent, C.accent, {
      fill:{color:C.accent, transparency:12},
      line:{color:C.accent, transparency:100}
    });
    const rows = [
      ['背景', '留白承载判断'],
      ['语气', '克制、清晰、可复盘']
    ];
    rows.forEach((row, i) => {
      const y = card.y + 3.44 + i * 0.38;
      ctx.addText(slide, row[0], {
        x:card.x+0.42, y, w:0.42, h:0.10,
        fontSize:6.4, bold:true, color:i === 0 ? C.accent : C.cyan, fit:'shrink'
      });
      ctx.addText(slide, row[1], {
        x:card.x+1.06, y:y-0.01, w:1.34, h:0.12,
        fontSize:7.1, color:C.muted, fit:'shrink'
      });
    });
  }

  return {
    drawLightEditorialProofPanel
  };
}

module.exports = {
  createCoverLightEditorialProofPanel
};

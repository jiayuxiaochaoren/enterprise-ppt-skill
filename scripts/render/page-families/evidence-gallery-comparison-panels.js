function createCaseComparisonPanels(ctx = {}) {
  const {
    addLabel,
    addPhotoPanel,
    addRect,
    addText,
    fileExists,
    genericShowcaseField,
    panelFill
  } = ctx;
  const C = ctx.colors();

  function drawCaseComparisonPanels(slide, panels) {
    panels.forEach((p,i)=>{
      addRect(slide, p.x, 2.02, 4.82, 3.92, panelFill(), C.line, {
        fill:{color:panelFill(), transparency:0},
        line:{color:i===1?p.color:C.line, transparency:i===1?18:14, width:0.50}
      });
      if (p.image && fileExists(p.image)) addPhotoPanel(slide, p.image, p.x+0.18, 2.20, 4.46, 2.48, {
        tone:'light', transparency:100, stroke:C.line, strokeTransparency:24, fit:'cover'
      });
      else genericShowcaseField(slide, p.x+0.18, 2.20, 4.46, 2.48, p.label);
      addLabel(slide, p.label, {
        x:p.x+0.28, y:4.94, w:0.90, h:0.10, fontSize:6.8, color:p.color, charSpace:0.8
      });
      addText(slide, p.title, {
        x:p.x+0.28, y:5.22, w:1.68, h:0.15, fontSize:10.4, bold:true, color:C.text, fit:'shrink'
      });
      addText(slide, p.body, {
        x:p.x+2.18, y:5.19, w:1.94, h:0.18, fontSize:7.0, color:C.body, fit:'shrink'
      });
    });

    return panels.map(p => ({ x:p.x, y:2.02, w:4.82, h:3.92 }));
  }

  return {
    drawCaseComparisonPanels
  };
}

module.exports = {
  createCaseComparisonPanels
};

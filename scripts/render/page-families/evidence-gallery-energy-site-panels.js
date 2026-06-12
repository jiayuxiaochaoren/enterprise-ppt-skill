function createEnergySiteComparisonPanels(ctx = {}) {
  const {
    addLabel,
    addPhotoPanel,
    addRect,
    addText,
    fileExists,
    genericShowcaseField
  } = ctx;
  const C = ctx.colors();

  function drawEnergySiteComparisonPanels(slide, panels) {
    panels.forEach((p,i)=>{
      addRect(slide, p.x, 2.02, 4.50, 3.56, C.ink2, '334155', {
        fill:{color:C.ink2, transparency:i===0?12:4},
        line:{color:i===1?C.accent:'334155', transparency:i===1?18:44, width:0.46}
      });
      if (p.image && fileExists(p.image)) addPhotoPanel(slide, p.image, p.x+0.18, 2.22, 4.14, 2.14, {
        tone:'light', transparency:88, stroke:'334155', strokeTransparency:36, fit:'cover'
      });
      else genericShowcaseField(slide, p.x+0.18, 2.22, 4.14, 2.14, p.label);
      addLabel(slide, p.label, {
        x:p.x+0.26, y:4.66, w:0.84, h:0.10, fontSize:6.0, color:p.accent, charSpace:0.85
      });
      addText(slide, p.title, {
        x:p.x+0.26, y:4.94, w:1.22, h:0.15, fontSize:10.0, bold:true, color:C.white, fit:'shrink'
      });
      addText(slide, p.body, {
        x:p.x+1.72, y:4.92, w:2.02, h:0.18, fontSize:7.0, color:'CBD5E1', fit:'shrink'
      });
    });
  }

  return {
    drawEnergySiteComparisonPanels
  };
}

module.exports = {
  createEnergySiteComparisonPanels
};

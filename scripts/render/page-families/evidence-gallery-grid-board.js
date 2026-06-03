function createGridEvidenceBoardRenderer(ctx = {}, deps = {}) {
  const {
    addEvidenceCaptionStack,
    addRect,
    addSmartPhotoPanel,
    addText,
    panelFill
  } = ctx;
  const C = ctx.colors();
  const {
    drawFooter
  } = deps;

  return function renderGridEvidenceBoard(slide, plan, s, images = [], items = []) {
    const slots = [
      { x:0.92, y:2.06, w:3.36, h:1.58 },
      { x:4.62, y:2.06, w:3.36, h:1.58 },
      { x:8.32, y:2.06, w:3.36, h:1.58 },
      { x:0.92, y:4.42, w:3.36, h:1.58 },
      { x:4.62, y:4.42, w:3.36, h:1.58 },
      { x:8.32, y:4.42, w:3.36, h:1.58 }
    ];
    slots.slice(0, Math.min(6, Math.max(images.length, items.length))).forEach((slot,i)=>{
      const item = items[i] || {};
      const img = images[i];
      if (img) addSmartPhotoPanel(slide, img, slot.x, slot.y, slot.w, 1.04, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:24 });
      else addRect(slide, slot.x, slot.y, slot.w, 1.04, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:6}, line:{color:C.line, transparency:100} });
      addRect(slide, slot.x, slot.y+1.04, slot.w, 0.54, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:18, width:0.36} });
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.muted);
      addEvidenceCaptionStack(slide, item, `证据 ${i+1}`, { x:slot.x+0.22, y:slot.y+1.14, w:2.80, h:0.36 }, {
        number:i+1,
        accent,
        titleSize:8.8,
        bodySize:7.8,
        titleH:0.13,
        bodyY:0.22,
        bodyH:0.12,
        maxBodyChars:20,
        dropLongBody:true
      });
    });
    addText(slide, s.note || '图片与案例统一裁切比例和 caption，形成可核验的现场证据板。', { x:0.92, y:6.50, w:8.4, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createGridEvidenceBoardRenderer
};

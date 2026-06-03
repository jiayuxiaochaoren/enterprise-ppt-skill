const {
  createFourImageEvidenceNote
} = require('./evidence-gallery-four-image-note');

function createStackedEvidenceColumns(ctx = {}) {
  const {
    addNumber,
    addRect,
    addSmartPhotoPanel,
    addText,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;
  const C = ctx.colors();
  const { drawEvidenceBoardNote } = createFourImageEvidenceNote(ctx);

  function drawStackedEvidenceColumns(slide, s, images, items, layout) {
    const photoW = layout === 'vertical-strip' ? 1.38 : 2.14;
    const slots = [
      { x:0.92, y:2.04, w:2.42, h:3.94 },
      { x:3.64, y:2.04, w:2.42, h:3.94 },
      { x:6.36, y:2.04, w:2.42, h:3.94 },
      { x:9.08, y:2.04, w:2.42, h:3.94 }
    ];
    slots.forEach((slot,i)=>{
      const item = items[i] || {};
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), i===0 ? accent : C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?18:16, width:0.44} });
      const px = slot.x + (slot.w - photoW) / 2;
      addSmartPhotoPanel(slide, images[i], px, slot.y+0.18, photoW, 2.34, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:24 });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:slot.x+0.24, y:slot.y+2.82, w:0.30, h:0.10, fontSize:6.6, color:accent });
      addText(slide, itemTitle(item, `证据 ${i+1}`), { x:slot.x+0.62, y:slot.y+2.76, w:1.14, h:0.14, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(item), { x:slot.x+0.62, y:slot.y+3.20, w:1.24, h:0.20, fontSize:6.8, color:C.body, fit:'shrink', breakLine:true });
    });
    drawEvidenceBoardNote(slide, s, '不同画幅的现场素材统一进入稳定证据列，保留可读标题与 caption。');
  }

  return {
    drawStackedEvidenceColumns
  };
}

module.exports = {
  createStackedEvidenceColumns
};

const {
  createFourImageEvidenceNote
} = require('./evidence-gallery-four-image-note');

function createGridEvidenceBoard(ctx = {}) {
  const {
    addEvidenceCaptionStack,
    addRect,
    addSmartPhotoPanel,
    panelFill
  } = ctx;
  const C = ctx.colors();
  const { drawEvidenceBoardNote } = createFourImageEvidenceNote(ctx);

  function drawGridEvidenceBoard(slide, s, images, items) {
    const gridSlots = [
      { x:0.92, y:2.04, w:5.08, h:1.78 },
      { x:6.36, y:2.04, w:5.08, h:1.78 },
      { x:0.92, y:4.14, w:5.08, h:1.78 },
      { x:6.36, y:4.14, w:5.08, h:1.78 }
    ];
    gridSlots.forEach((slot,i)=>{
      const item = items[i] || {};
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), i===0 ? accent : C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?18:16, width:0.44} });
      addSmartPhotoPanel(slide, images[i], slot.x+0.14, slot.y+0.14, 2.06, slot.h-0.28, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:26 });
      addEvidenceCaptionStack(slide, item, `证据 ${i+1}`, { x:slot.x+2.48, y:slot.y+0.24, w:2.06, h:1.06 }, {
        number:i+1,
        accent,
        titleSize:9.4,
        bodySize:8.0,
        bodyY:0.42,
        maxBodyChars:28,
        dropLongBody:true
      });
    });
    drawEvidenceBoardNote(slide, s, '四组证据保持统一比例、标题和说明，形成稳定的现场判断板。');
  }

  return {
    drawGridEvidenceBoard
  };
}

module.exports = {
  createGridEvidenceBoard
};

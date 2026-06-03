const {
  createFourImageEvidenceNote
} = require('./evidence-gallery-four-image-note');

function createMosaicEvidenceBoard(ctx = {}) {
  const {
    addEvidenceCaptionStack,
    addLabel,
    addRect,
    addSmartPhotoPanel,
    addText,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;
  const C = ctx.colors();
  const { drawEvidenceBoardNote } = createFourImageEvidenceNote(ctx);

  function drawMosaicEvidenceBoard(slide, s, images, items) {
    const hero = { x:0.92, y:2.04, w:5.18, h:3.94 };
    const lead = items[0] || {};
    addRect(slide, hero.x, hero.y, hero.w, hero.h, panelFill(), C.accent, { fill:{color:panelFill(), transparency:0}, line:{color:C.accent, transparency:18, width:0.52} });
    addSmartPhotoPanel(slide, images[0], hero.x+0.16, hero.y+0.16, hero.w-0.32, 2.68, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:24 });
    addLabel(slide, 'PRIMARY EVIDENCE', { x:hero.x+0.28, y:hero.y+3.08, w:1.30, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, itemTitle(lead, '核心证据'), { x:hero.x+0.28, y:hero.y+3.38, w:1.70, h:0.15, fontSize:10.6, bold:true, color:C.text, fit:'shrink' });
    addText(slide, itemBody(lead), { x:hero.x+2.26, y:hero.y+3.34, w:2.34, h:0.18, fontSize:8.0, color:C.body, fit:'shrink' });

    images.slice(1,4).forEach((img,i)=>{
      const y = 2.04 + i*1.34;
      const item = items[i+1] || {};
      const accent = i===0 ? C.cyan : (i===1 ? C.violet : C.muted);
      addRect(slide, 6.42, y, 5.16, 1.08, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?22:16, width:0.42} });
      addSmartPhotoPanel(slide, img, 6.58, y+0.14, 1.46, 0.80, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:28 });
      addEvidenceCaptionStack(slide, item, `证据 ${i+2}`, { x:8.34, y:y+0.20, w:2.72, h:0.72 }, {
        number:i+2,
        accent,
        titleSize:9.2,
        bodySize:8.2,
        bodyY:0.36,
        maxBodyChars:28,
        dropLongBody:true
      });
    });
    drawEvidenceBoardNote(slide, s, '主证据与辅助证据分层呈现，避免把关键现场图平均摊平。');
  }

  return {
    drawMosaicEvidenceBoard
  };
}

module.exports = {
  createMosaicEvidenceBoard
};

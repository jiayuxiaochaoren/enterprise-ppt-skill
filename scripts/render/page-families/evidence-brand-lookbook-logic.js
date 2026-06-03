function createRetailLookbookLogicPanel(ctx = {}) {
  const {
    addLabel,
    addRect,
    addText
  } = ctx;
  const C = ctx.colors();

  function drawMerchandisingLogic(slide, s) {
    const narrative = { x:6.70, y:4.36, w:4.66, h:1.78 };
    addRect(slide, narrative.x, narrative.y, narrative.w, narrative.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'MERCHANDISING LOGIC', { x:narrative.x+0.30, y:narrative.y+0.34, w:1.68, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, s.storyTitle || '从视觉偏好到复购理由', { x:narrative.x+0.30, y:narrative.y+0.72, w:1.96, h:0.18, fontSize:12.6, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.storyBody || s.note || 'lookbook 页不是随机拼图，它要让顾客看到产品、搭配、空间和会员触达之间的关系。', { x:narrative.x+2.46, y:narrative.y+0.66, w:1.76, h:0.58, fontSize:8.8, color:C.captionOnImage, breakLine:true, fit:'shrink' });
    ['COLOR', 'TEXTURE', 'SCENE'].forEach((label, i) => {
      const color = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addRect(slide, narrative.x+0.30+i*0.70, narrative.y+1.34, 0.38, 0.10, color, color, { line:{color, transparency:100} });
      addText(slide, label, { x:narrative.x+0.30+i*0.70, y:narrative.y+1.52, w:0.46, h:0.10, fontSize:5.6, color:'94A3B8', align:'center', fit:'shrink' });
    });
  }

  return {
    drawMerchandisingLogic
  };
}

module.exports = {
  createRetailLookbookLogicPanel
};

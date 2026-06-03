function createFinancePortfolioProofRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addNumber,
    addPhotoPanel,
    addRect,
    addText,
    genericShowcaseField,
    itemTitle,
    panelFill
  } = ctx;

  function drawFinancePortfolioProofSlots(slide, images, items) {
    const smallSlots = [
      { x:6.28, y:2.02, image:images[1], item:items[1], label:'COMMERCIAL PROOF', fallback:'产品材料示意', color:C.cyan },
      { x:9.00, y:2.02, image:images[2], item:items[2], label:'GOVERNANCE PROOF', fallback:'治理材料示意', color:C.violet }
    ];
    smallSlots.forEach((slot,i)=>{
      addRect(slide, slot.x, slot.y, 2.42, 1.74, panelFill(), C.line, {
        fill:{color:panelFill(), transparency:0},
        line:{color:C.line, transparency:16, width:0.38}
      });
      if (slot.image) addPhotoPanel(slide, slot.image, slot.x+0.12, slot.y+0.12, 2.18, 1.08, {
        tone:'light', transparency:100, stroke:C.line, strokeTransparency:30, fit:'cover'
      });
      else genericShowcaseField(slide, slot.x+0.12, slot.y+0.12, 2.18, 1.08, slot.fallback);
      const item = slot.item || {
        title:slot.fallback,
        body:i===0 ? '判断商业化进展。' : '沉淀投后动作。'
      };
      addLabel(slide, slot.label, {
        x:slot.x+0.18, y:slot.y+1.38, w:1.16, h:0.08, fontSize:5.4, color:slot.color, charSpace:0.5
      });
      addText(slide, itemTitle(item, slot.fallback), {
        x:slot.x+1.28, y:slot.y+1.32, w:0.86, h:0.13, fontSize:8.8, bold:true, color:C.text, fit:'shrink', align:'right'
      });
    });
  }

  function drawFinancePortfolioReadout(slide, readout) {
    addRect(slide, readout.x, readout.y, readout.w, readout.h, C.ink, C.ink, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.ink, transparency:100}
    });
    addLabel(slide, 'IC READOUT', {
      x:readout.x+0.28, y:readout.y+0.30, w:0.94, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8
    });
    [
      ['01', '项目质量', '能否继续配置资源'],
      ['02', '风险信号', '是否需要处置节奏'],
      ['03', '资本动作', '加仓、维持或退出']
    ].forEach((row,i)=>{
      const y = readout.y + 0.72 + i*0.34;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addNumber(slide, row[0], { x:readout.x+0.30, y:y+0.02, w:0.28, h:0.09, fontSize:6.4, color:accent });
      addText(slide, row[1], { x:readout.x+0.74, y:y, w:0.86, h:0.12, fontSize:8.8, bold:true, color:C.white, fit:'shrink' });
      addText(slide, row[2], { x:readout.x+2.16, y:y, w:2.10, h:0.12, fontSize:8.8, color:'CBD5E1', fit:'shrink', align:'right' });
    });
  }

  return {
    drawFinancePortfolioProofSlots,
    drawFinancePortfolioReadout
  };
}

module.exports = {
  createFinancePortfolioProofRenderer
};

const {
  industryBusinessLogicItems
} = require('./financial-industry-chart-slide-data');

function createFinancialIndustryChartSlidePanels(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText,
    compactEvidenceCaption,
    panelFill
  } = ctx;

  function drawProofObjectPanel(slide, s, side, variantLabel) {
    addRect(slide, side.x, side.y, side.w, side.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'PROOF OBJECT', { x:side.x+0.28, y:side.y+0.34, w:1.28, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    addText(slide, s.coreTitle || variantLabel || '行业读数', { x:side.x+0.28, y:side.y+0.86, w:1.72, h:0.32, fontSize:14.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.coreBody || s.decision || '把行业材料转成可判断、可追责、可行动的证据对象。', { x:side.x+0.28, y:side.y+1.56, w:1.86, h:0.66, fontSize:8.8, color:'CBD5E1', fit:'shrink', breakLine:true });
    addHairline(slide, side.x+0.28, side.y+2.62, 0.78, C.accent, 0, 0.55);
    addText(slide, s.note || '关键指标与行业对象放在同一张判断图中。', { x:side.x+0.28, y:side.y+2.92, w:1.76, h:0.42, fontSize:8.8, color:'A8B3C3', fit:'shrink', breakLine:true });
  }

  function drawChartBoardShell(slide, board) {
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  }

  function drawBusinessLogicRow(slide, s) {
    const logicItems = industryBusinessLogicItems(s);
    if (logicItems.length < 2) return;
    addHairline(slide, 0.94, 6.32, 10.70, C.line, 12, 0.55);
    const slotW = 10.44 / logicItems.length;
    logicItems.forEach((item, i) => {
      const x = 1.00 + i * slotW;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : C.muted));
      addLabel(slide, item.label, { x, y:6.54, w:0.46, h:0.10, fontSize:5.8, color:accent, charSpace:0 });
      addText(slide, compactEvidenceCaption(item.text, 20), { x:x+0.54, y:6.50, w:slotW-0.66, h:0.14, fontSize:7.6, color:C.body, fit:'shrink' });
    });
  }

  return {
    drawBusinessLogicRow,
    drawChartBoardShell,
    drawProofObjectPanel
  };
}

module.exports = {
  createFinancialIndustryChartSlidePanels
};

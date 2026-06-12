const {
  coerceChartItems
} = require('./financial-chart-utils');

function createQualityHandoffBoardRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addArrowLine,
    addLabel,
    addRect,
    addText,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;

  function renderQualityHandoffBoard(slide, s, board) {
    const items = coerceChartItems(s.qualityHandoff || s.handoffs || s.handoffMap, [
      { from:'导诊', to:'检查', title:'身份与检查项目', body:'避免重复问询' },
      { from:'检查', to:'医生', title:'报告节点', body:'异常优先提醒' },
      { from:'医生', to:'随访', title:'处置建议', body:'进入质控复盘' }
    ]).slice(0,4);
    addLabel(slide, 'ROLE HANDOFFS', { x:board.x+0.30, y:board.y+0.32, w:1.30, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.8 });
    items.forEach((it,i)=>{
      const x = board.x + 0.34 + i*1.78;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addRect(slide, x, board.y+0.92, 1.34, 1.62, panelFill(), accent, { fill:{color:panelFill(), transparency:0}, line:{color:accent, transparency:22, width:0.42} });
      addText(slide, it.from || `角色 ${i+1}`, { x:x+0.16, y:board.y+1.08, w:0.82, h:0.16, fontSize:8.8, bold:true, color:accent, fit:'shrink' });
      addText(slide, it.to || '下一角色', { x:x+0.16, y:board.y+1.40, w:0.82, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemTitle(it, '交接材料'), { x:x+0.16, y:board.y+1.86, w:0.96, h:0.16, fontSize:8.8, color:C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+0.16, y:board.y+2.18, w:0.92, h:0.18, fontSize:8.8, color:C.body, fit:'shrink' });
      if (i < items.length - 1) addArrowLine(slide, x+1.42, board.y+1.72, 0.28, 0, accent, { transparency:20, width:0.34 });
    });
    return true;
  }

  return {
    renderQualityHandoffBoard
  };
}

module.exports = {
  createQualityHandoffBoardRenderer
};

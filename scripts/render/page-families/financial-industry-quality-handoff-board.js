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

  function summaryCards(slide, s, board) {
    const logic = s.businessLogic || {};
    const items = [
      ['现状', logic.currentState || '交接节点需要统一留痕。'],
      ['动作', logic.action || '把身份、报告和处置建议写成标准节点。'],
      ['衡量', logic.metric || '交接准时率、异常响应时长']
    ];
    items.forEach((item, i) => {
      const x = board.x + 0.40 + i * 3.36;
      const color = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addRect(slide, x, board.y + board.h - 0.76, 2.92, 0.48, i === 0 ? (C.panelAlt || 'F1F5F9') : 'FFFFFF', color, {
        fill:{ color:i === 0 ? (C.panelAlt || 'F1F5F9') : 'FFFFFF', transparency:0 },
        line:{ color:color, transparency:34, width:0.28 }
      });
      addLabel(slide, item[0], {
        x:x+0.14, y:board.y + board.h - 0.60, w:0.36, h:0.08,
        fontSize:5.2, color:color, charSpace:0
      });
      addText(slide, item[1], {
        x:x+0.56, y:board.y + board.h - 0.64, w:2.12, h:0.16,
        fontSize:7.0, color:C.body, fit:'shrink', breakLine:true
      });
    });
  }

  function renderQualityHandoffBoard(slide, s, board) {
    const items = coerceChartItems(s.qualityHandoff || s.handoffs || s.handoffMap, [
      { from:'导诊', to:'检查', title:'身份与检查项目', body:'避免重复问询' },
      { from:'检查', to:'医生', title:'报告节点', body:'异常优先提醒' },
      { from:'医生', to:'随访', title:'处置建议', body:'进入质控复盘' }
    ]).slice(0,4);
    if (board.w >= 10) {
      addLabel(slide, 'ROLE HANDOFFS', { x:board.x+0.32, y:board.y+0.30, w:1.30, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.8 });
      addText(slide, '质量交接', { x:board.x+0.32, y:board.y+0.58, w:1.32, h:0.16, fontSize:9.0, bold:true, color:C.text, fit:'shrink' });
      const count = Math.max(1, items.length);
      const gap = 0.34;
      const cardW = Math.min(2.42, Math.max(2.14, (board.w - 1.40 - gap * (count - 1)) / count));
      const totalW = cardW * count + gap * (count - 1);
      const startX = board.x + (board.w - totalW) / 2;
      const cardH = 1.48;
      const cardY = board.y + 0.96;
      items.forEach((it, i) => {
        const x = startX + i * (cardW + gap);
        const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
        addRect(slide, x, cardY, cardW, cardH, i === 0 ? (C.panelAlt || 'F1F5F9') : panelFill(), accent, {
          fill:{ color:i === 0 ? (C.panelAlt || 'F1F5F9') : panelFill(), transparency:0 },
          line:{ color:accent, transparency:24, width:0.42 }
        });
        addLabel(slide, `0${i+1}`, { x:x+0.14, y:cardY+0.18, w:0.24, h:0.08, fontSize:5.0, color:accent, charSpace:0 });
        addText(slide, it.from || `角色 ${i+1}`, { x:x+0.16, y:cardY+0.42, w:0.90, h:0.16, fontSize:8.8, bold:true, color:accent, fit:'shrink' });
        addText(slide, it.to || '下一角色', { x:x+0.16, y:cardY+0.70, w:0.96, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
        addText(slide, itemTitle(it, '交接材料'), { x:x+0.16, y:cardY+1.02, w:1.38, h:0.14, fontSize:8.0, color:C.text, fit:'shrink' });
        addText(slide, itemBody(it), { x:x+0.16, y:cardY+1.22, w:cardW-0.32, h:0.14, fontSize:7.2, color:C.body, fit:'shrink', breakLine:true });
        if (i < items.length - 1) addArrowLine(slide, x + cardW + 0.08, cardY + 0.72, gap - 0.12, 0, accent, { transparency:20, width:0.34 });
      });
      summaryCards(slide, s, board);
      return true;
    }
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

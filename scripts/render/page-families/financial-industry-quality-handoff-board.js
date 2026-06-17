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

  function summaryItems(s = {}) {
    const logic = s.businessLogic || {};
    return [
      ['交接断点', logic.currentState || '跨科室交接容易出现信息遗漏和响应延迟。'],
      ['留痕动作', logic.action || '把每次交接改成有对象、有时限、有证据的节点。'],
      ['追踪指标', logic.metric || '交接准时率、异常报告响应时长']
    ];
  }

  function handoffHeadline(item = {}, index = 0) {
    const from = item.from || `角色 ${index + 1}`;
    const to = item.to || '下一角色';
    return `${from} -> ${to}`;
  }

  function handoffBody(item = {}) {
    const body = itemBody(item);
    return body ? `留痕要求：${body}` : '留痕要求：保留报告、处置和回传记录。';
  }

  function summaryCards(slide, s, board) {
    const items = summaryItems(s);
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
      addLabel(slide, '交接节点', { x:board.x+0.32, y:board.y+0.30, w:1.30, h:0.10, fontSize:6.8, color:C.accent, charSpace:0 });
      addText(slide, '质量交接链路', { x:board.x+0.32, y:board.y+0.58, w:1.72, h:0.16, fontSize:9.0, bold:true, color:C.text, fit:'shrink' });
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
        addText(slide, handoffHeadline(it, i), { x:x+0.16, y:cardY+0.42, w:cardW-0.32, h:0.16, fontSize:8.6, bold:true, color:accent, fit:'shrink' });
        addLabel(slide, '交接对象', { x:x+0.16, y:cardY+0.74, w:0.44, h:0.08, fontSize:4.8, color:C.cyan, charSpace:0 });
        addText(slide, itemTitle(it, '交接对象待确认'), { x:x+0.16, y:cardY+0.90, w:cardW-0.32, h:0.14, fontSize:7.8, color:C.text, fit:'shrink' });
        addText(slide, handoffBody(it), { x:x+0.16, y:cardY+1.14, w:cardW-0.32, h:0.18, fontSize:6.8, color:C.body, fit:'shrink', breakLine:true });
        if (i < items.length - 1) addArrowLine(slide, x + cardW + 0.08, cardY + 0.72, gap - 0.12, 0, accent, { transparency:20, width:0.34 });
      });
      summaryCards(slide, s, board);
      return true;
    }
    addLabel(slide, '交接节点', { x:board.x+0.30, y:board.y+0.32, w:1.30, h:0.10, fontSize:6.8, color:C.accent, charSpace:0 });
    items.forEach((it,i)=>{
      const x = board.x + 0.34 + i*1.78;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addRect(slide, x, board.y+0.92, 1.34, 1.62, panelFill(), accent, { fill:{color:panelFill(), transparency:0}, line:{color:accent, transparency:22, width:0.42} });
      addText(slide, handoffHeadline(it, i), { x:x+0.16, y:board.y+1.06, w:1.04, h:0.16, fontSize:7.8, bold:true, color:accent, fit:'shrink' });
      addLabel(slide, '对象', { x:x+0.16, y:board.y+1.38, w:0.22, h:0.08, fontSize:4.6, color:C.cyan, charSpace:0 });
      addText(slide, itemTitle(it, '交接对象'), { x:x+0.16, y:board.y+1.54, w:0.98, h:0.16, fontSize:7.6, color:C.text, fit:'shrink' });
      addText(slide, handoffBody(it), { x:x+0.16, y:board.y+1.86, w:0.98, h:0.34, fontSize:6.8, color:C.body, fit:'shrink', breakLine:true });
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

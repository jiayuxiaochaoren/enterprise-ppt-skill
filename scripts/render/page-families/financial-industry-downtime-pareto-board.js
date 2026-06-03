const {
  coerceChartItems
} = require('./financial-chart-utils');

function createDowntimeParetoBoardRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText,
    itemTitle
  } = ctx;

  function renderDowntimeParetoBoard(slide, s, board) {
    const items = coerceChartItems(s.downtimePareto || s.pareto || s.lossPareto || s.oeeLosses, [
      { title:'等待备件', value:36, body:'停机分钟' },
      { title:'传感器误报', value:28, body:'停机分钟' },
      { title:'换型调试', value:22, body:'停机分钟' },
      { title:'巡检遗漏', value:14, body:'停机分钟' }
    ]).slice(0,5);
    const max = Math.max(...items.map(it => Number(it.value) || 1), 1);
    addLabel(slide, 'LOSS SOURCES', { x:board.x+0.30, y:board.y+0.32, w:1.30, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.8 });
    items.forEach((it,i)=>{
      const y = board.y + 0.86 + i*0.56;
      const val = Number(it.value) || (max - i*5);
      const w = Math.max(0.44, (board.w - 2.78) * val / max);
      const color = i===0 ? C.risk : (i===1 ? C.accent : C.cyan);
      addText(slide, itemTitle(it, `损失 ${i+1}`), { x:board.x+0.34, y:y-0.02, w:1.28, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addRect(slide, board.x+1.86, y+0.02, board.w-2.60, 0.16, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:100} });
      addRect(slide, board.x+1.86, y+0.02, w, 0.16, color, color, { fill:{color, transparency:i===0?0:10}, line:{color, transparency:100} });
      addText(slide, `${val}${it.unit || '%'}`, { x:board.x+board.w-0.78, y:y-0.01, w:0.46, h:0.12, fontSize:7.2, bold:true, color:color, align:'right', fit:'shrink' });
    });
    return true;
  }

  return {
    renderDowntimeParetoBoard
  };
}

module.exports = {
  createDowntimeParetoBoardRenderer
};

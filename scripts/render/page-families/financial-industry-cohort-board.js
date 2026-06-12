const {
  chartNumber,
  coerceChartItems
} = require('./financial-chart-utils');

function createMemberCohortLadderBoard(ctx = {}) {
  const C = ctx.colors();
  const {
    addRect,
    addText,
    itemBody,
    itemTitle
  } = ctx;

  function renderMemberCohortLadderBoard(slide, s, board) {
    const items = coerceChartItems(s.memberCohorts || s.cohorts || s.rfmLadder, [
      { title:'新客', value:'31%', body:'首购转化' },
      { title:'活跃会员', value:'42%', body:'复购贡献' },
      { title:'高价值会员', value:'18%', body:'客单提升' },
      { title:'沉睡会员', value:'9%', body:'召回动作' }
    ]).slice(0,4);
    const values = items.map((it, i) => chartNumber(it.value, items.length - i));
    const max = Math.max(...values, 1);
    const labelW = Math.min(2.05, Math.max(1.44, board.w * 0.20));
    const barX = board.x + 0.72 + labelW + 0.34;
    const barMaxW = Math.max(2.40, Math.min(4.90, board.w - labelW - 3.90));
    items.forEach((it,i)=>{
      const y = board.y + 0.92 + i*0.62;
      const val = values[i];
      const w = Math.max(0.42, barMaxW * val / max);
      const labelX = board.x + 0.72;
      const accent = i===0 ? C.muted : (i===1 ? C.accent : (i===2 ? C.cyan : C.violet));
      addText(slide, itemTitle(it, `客群 ${i+1}`), {
        x:labelX, y:y+0.06, w:labelW, h:0.18,
        fontSize:8.4, bold:true, color:C.text, fit:'shrink'
      });
      addRect(slide, barX, y+0.08, barMaxW, 0.22, C.line, C.line, {
        fill:{color:C.line, transparency:78},
        line:{color:C.line, transparency:100}
      });
      addRect(slide, barX, y+0.08, w, 0.22, accent, accent, {
        fill:{color:accent, transparency:i===0?18:8},
        line:{color:accent, transparency:100}
      });
      addText(slide, String(it.value || ''), {
        x:barX+barMaxW+0.28, y:y+0.06, w:0.66, h:0.18,
        fontSize:8.4, bold:true, color:accent, fit:'shrink'
      });
      addText(slide, itemBody(it), {
        x:barX+barMaxW+1.08, y:y+0.06, w:Math.max(1.30, board.x + board.w - (barX + barMaxW + 1.08) - 0.44), h:0.18,
        fontSize:8.2, color:C.body, fit:'shrink'
      });
    });
  }

  return {
    renderMemberCohortLadderBoard
  };
}

module.exports = {
  createMemberCohortLadderBoard
};

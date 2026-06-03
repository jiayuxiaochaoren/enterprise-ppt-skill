const {
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
    items.forEach((it,i)=>{
      const y = board.y + 3.10 - i*0.62;
      const w = 1.24 + i*0.70;
      const x = board.x + 0.72 + i*0.38;
      const accent = i===0 ? C.muted : (i===1 ? C.accent : (i===2 ? C.cyan : C.violet));
      addRect(slide, x, y, w, 0.38, accent, accent, { fill:{color:accent, transparency:i===0?22:8}, line:{color:accent, transparency:100} });
      addText(slide, itemTitle(it, `客群 ${i+1}`), { x:x+0.14, y:y+0.08, w:0.82, h:0.16, fontSize:8.8, bold:true, color:C.onAccent || C.white, fit:'shrink' });
      addText(slide, it.value || '', { x:x+w+0.28, y:y+0.08, w:0.54, h:0.16, fontSize:8.8, bold:true, color:accent, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+w+0.92, y:y+0.08, w:1.44, h:0.16, fontSize:8.8, color:C.body, fit:'shrink' });
    });
  }

  return {
    renderMemberCohortLadderBoard
  };
}

module.exports = {
  createMemberCohortLadderBoard
};

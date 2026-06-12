const {
  firstChartItems
} = require('./financial-chart-utils');

function createDefaultIndustryReadoutBoard(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addNumber,
    addText,
    itemBody,
    itemTitle
  } = ctx;

  function renderDefaultIndustryReadoutBoard(slide, s, board) {
    const items = firstChartItems(s, ['items', 'cards', 'metrics', 'facts', 'signals'], [
      { title:'对象', body:'行业材料对象' },
      { title:'证据', body:'可检查事实' },
      { title:'动作', body:'下一步行动' }
    ]).slice(0,4);
    items.forEach((it,i)=>{
      const y = board.y + 0.82 + i*0.68;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:board.x+0.34, y:y+0.08, w:0.30, h:0.11, fontSize:6.8, color:accent });
      addText(slide, itemTitle(it, `证据 ${i+1}`), { x:board.x+0.82, y:y, w:1.30, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:board.x+2.42, y:y, w:3.72, h:0.16, fontSize:8.8, color:C.body, fit:'shrink' });
      addHairline(slide, board.x+0.82, y+0.36, board.w-1.52, C.line, 18, 0.30);
    });
  }

  return {
    renderDefaultIndustryReadoutBoard
  };
}

module.exports = {
  createDefaultIndustryReadoutBoard
};

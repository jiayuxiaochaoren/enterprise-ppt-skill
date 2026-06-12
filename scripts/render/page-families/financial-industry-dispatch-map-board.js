const {
  coerceChartItems
} = require('./financial-chart-utils');

function createDispatchMapBoardRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addRect,
    addText,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;

  function renderDispatchMapBoard(slide, s, board) {
    const items = coerceChartItems(s.dispatchMap || s.siteDispatch || s.loadStorageDispatch, [
      { title:'A 站', value:'SOC 63%', body:'告警优先' },
      { title:'B 站', value:'负荷高峰', body:'调度放电' },
      { title:'C 站', value:'限电风险', body:'策略复盘' },
      { title:'区域中心', value:'36min', body:'平均处置' }
    ]).slice(0,4);
    addText(slide, s.centerTitle || '区域调度', { x:board.x+3.12, y:board.y+1.76, w:1.06, h:0.16, fontSize:11.4, bold:true, color:C.text, align:'center', fit:'shrink' });
    slide.addShape('ellipse', { x:board.x+3.12, y:board.y+1.22, w:1.06, h:1.06, fill:{color:C.panelAlt || C.softBlue, transparency:5}, line:{color:C.accent, transparency:28, width:0.42} });
    const pos = [[0.42,0.76],[5.54,0.76],[0.42,2.72],[5.54,2.72]];
    items.forEach((it,i)=>{
      const [px,py]=pos[i];
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.risk));
      addRect(slide, board.x+px, board.y+py, 1.64, 0.72, panelFill(), accent, { fill:{color:panelFill(), transparency:0}, line:{color:accent, transparency:22, width:0.38} });
      addText(slide, itemTitle(it, `站点 ${i+1}`), { x:board.x+px+0.16, y:board.y+py+0.10, w:0.72, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, it.value || '', { x:board.x+px+0.94, y:board.y+py+0.10, w:0.52, h:0.16, fontSize:8.8, color:accent, align:'right', fit:'shrink' });
      addText(slide, itemBody(it), { x:board.x+px+0.16, y:board.y+py+0.44, w:1.16, h:0.14, fontSize:8.8, color:C.muted, fit:'shrink' });
    });
    return true;
  }

  return {
    renderDispatchMapBoard
  };
}

module.exports = {
  createDispatchMapBoardRenderer
};

function createBrandWorldBoardRenderer(ctx = {}) {
  const C = ctx.colors();

  function drawBrandWorldBoard(slide, board, groups = {}) {
    ctx.addRect(slide, board.x, board.y, board.w, board.h, ctx.panelFill(), C.line, { fill:{ color:ctx.panelFill(), transparency:0 }, line:{ color:C.line, transparency:14, width:0.46 } });
    [
      { label:'BRAND SIGNAL', items:groups.drivers, color:C.accent, fallback:'品牌主张' },
      { label:'OPERATING ACTION', items:groups.actions, color:C.cyan, fallback:'经营动作' },
      { label:'BUSINESS PROOF', items:groups.outcomes, color:C.violet, fallback:'业务结果' }
    ].forEach((group, i) => {
      const y = board.y + 0.42 + i * 1.08;
      ctx.addLabel(slide, group.label, { x:board.x + 0.28, y, w:1.52, h:0.10, fontSize:6.8, color:group.color, charSpace:0.65 });
      group.items.slice(0, 3).forEach((item, j) => {
        const x = board.x + 0.30 + j * 1.52;
        ctx.addRect(slide, x, y + 0.34, 1.14, 0.42, j === 0 ? C.ink : 'FFFFFF', C.line, { fill:{ color:j === 0 ? C.ink : 'FFFFFF', transparency:j === 0 ? 0 : 0 }, line:{ color:j === 0 ? group.color : C.line, transparency:j === 0 ? 22 : 18, width:0.30 } });
        ctx.addText(slide, ctx.itemTitle(item, `${group.fallback}${j + 1}`), {
          x:x + 0.08, y:y + 0.42, w:0.98, h:0.22,
          fontSize:7.2, bold:j === 0, color:j === 0 ? C.white : C.text, fit:false, align:'center', valign:'mid', breakLine:true
        });
      });
    });
  }

  return {
    drawBrandWorldBoard
  };
}

module.exports = {
  createBrandWorldBoardRenderer
};

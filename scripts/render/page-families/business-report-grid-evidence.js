function createGridEvidenceRows(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addNumber,
    addText,
    itemBody,
    itemTitle
  } = ctx;

  function drawGridEvidenceRows(slide, board, items, compactRightRail) {
    const cols = compactRightRail ? 1 : 3;
    const colW = compactRightRail ? Math.max(1.80, board.w - 0.68) : 2.18;
    items.forEach((it,i)=>{
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = board.x + 0.28 + col * (compactRightRail ? 0 : 2.34);
      const y = board.y + 0.76 + row * 1.02;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addHairline(slide, x, y+0.86, colW, C.line, 18, 0.30);
      addNumber(slide, String(i+1).padStart(2,'0'), { x, y:y+0.02, w:0.28, h:0.10, fontSize:6.6, color:accent });
      addText(slide, itemTitle(it, `要点 ${i+1}`), { x:x+0.40, y:y-0.02, w:compactRightRail ? Math.max(1.20, colW - 0.46) : 1.28, h:0.15, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+0.40, y:y+0.30, w:compactRightRail ? Math.max(1.20, colW - 0.46) : 1.52, h:0.28, fontSize:compactRightRail ? 6.9 : 7.4, color:C.body, fit:'shrink', breakLine:true });
    });
    if (!items.length) {
      addText(slide, '暂无结构化条目', { x:board.x+0.28, y:board.y+1.08, w:2.2, h:0.16, fontSize:10.0, color:C.muted });
    }
  }

  return {
    drawGridEvidenceRows
  };
}

module.exports = {
  createGridEvidenceRows
};

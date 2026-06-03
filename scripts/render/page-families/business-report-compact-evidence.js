function createCompactEvidenceRows(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;

  function drawCompactEvidenceRows(slide, s, board, items, compactRightRail) {
    items.forEach((it, i) => {
      const y = board.y + 0.78 + i * 1.04;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addRect(slide, board.x + 0.30, y, board.w - 0.60, 0.78, i === 0 ? C.panelAlt : panelFill(), i === 0 ? accent : C.line, {
        fill:{ color:i === 0 ? C.panelAlt : panelFill(), transparency:i === 0 ? 10 : 0 },
        line:{ color:i === 0 ? accent : C.line, transparency:i === 0 ? 18 : 16, width:0.38 }
      });
      addNumber(slide, String(i + 1).padStart(2, '0'), { x:board.x+0.58, y:y+0.24, w:0.30, h:0.10, fontSize:6.8, color:accent });
      addText(slide, itemTitle(it, `证据 ${i + 1}`), {
        x:board.x+1.04, y:y+0.18, w:compactRightRail ? Math.max(1.0, board.w - 1.42) : 1.54, h:0.15,
        fontSize:9.4, bold:true, color:C.text, fit:'shrink'
      });
      addText(slide, itemBody(it), {
        x:compactRightRail ? board.x+1.04 : board.x+2.82,
        y:compactRightRail ? y+0.44 : y+0.16,
        w:compactRightRail ? Math.max(1.0, board.w - 1.42) : 3.92,
        h:compactRightRail ? 0.18 : 0.28,
        fontSize:compactRightRail ? 7.0 : 8.2,
        color:C.body,
        fit:'shrink',
        breakLine:true
      });
    });
    addHairline(slide, board.x+0.32, board.y+3.86, board.w-0.64, C.line, 18, 0.30);
    addText(slide, s.evidenceNote || s.note || '先把证据边界讲清楚，再进入品牌选择判断。', {
      x:board.x+0.34, y:board.y+3.96, w:compactRightRail ? Math.max(1.0, board.w - 0.68) : 5.86, h:0.12,
      fontSize:compactRightRail ? 6.8 : 7.4, color:C.muted, fit:'shrink'
    });
  }

  return {
    drawCompactEvidenceRows
  };
}

module.exports = {
  createCompactEvidenceRows
};

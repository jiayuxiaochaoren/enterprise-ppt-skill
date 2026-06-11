const {
  centeredStackY
} = require('../layout/card-layout');

function createGridEvidenceRows(ctx = {}) {
  const C = ctx.colors();
  const {
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;

  function drawGridEvidenceRows(slide, board, items, compactRightRail) {
    const visible = items.slice(0, compactRightRail ? 4 : 6);
    const cols = compactRightRail ? 1 : (visible.length <= 4 ? 2 : 3);
    const rows = Math.max(1, Math.ceil(visible.length / cols));
    const gapX = compactRightRail ? 0 : 0.24;
    const gapY = rows <= 2 ? 0.28 : 0.18;
    const startX = board.x + 0.30;
    const startY = board.y + 0.76;
    const gridW = board.w - 0.60;
    const gridH = board.h - 1.02;
    const colW = compactRightRail ? gridW : (gridW - gapX * (cols - 1)) / cols;
    const rowH = Math.max(0.72, (gridH - gapY * (rows - 1)) / rows);
    visible.forEach((it,i)=>{
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (colW + gapX);
      const y = startY + row * (rowH + gapY);
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, x, y, colW, rowH, panelFill(), C.line, {
        fill:{ color:panelFill(), transparency:0 },
        line:{ color:i === 0 ? accent : C.line, transparency:i === 0 ? 28 : 24, width:0.30 }
      });
      addRect(slide, x, y, 0.045, rowH, accent, accent, {
        fill:{ color:accent, transparency:0 },
        line:{ color:accent, transparency:100 }
      });
      const title = itemTitle(it, `要点 ${i+1}`);
      const body = itemBody(it);
      const titleH = 0.16;
      const bodyH = body ? Math.min(0.42, Math.max(0.24, rowH - 0.56)) : 0;
      const stack = body ? [titleH, bodyH] : [titleH];
      const [titleY, bodyY] = centeredStackY(y, rowH, stack, body ? 0.10 : 0);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.20, y:titleY+0.02, w:0.28, h:0.10, fontSize:6.4, color:accent });
      addText(slide, title, { x:x+0.58, y:titleY, w:Math.max(0.90, colW - 0.82), h:titleH, fontSize:8.6, bold:true, color:C.text, fit:'shrink', valign:'mid' });
      if (body) {
        addText(slide, body, { x:x+0.58, y:bodyY, w:Math.max(0.90, colW - 0.82), h:bodyH, fontSize:7.1, color:C.body, fit:'shrink', breakLine:true, valign:'mid' });
      }
    });
    if (!visible.length) {
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

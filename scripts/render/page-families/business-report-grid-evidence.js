const {
  centeredStackY
} = require('../layout/card-layout');

function createGridEvidenceRows(ctx = {}) {
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

  function drawGridEvidenceRows(slide, board, items, compactRightRail) {
    const visible = items.slice(0, compactRightRail ? 4 : 6);
    const textLoad = visible.reduce((sum, it) => sum + String(itemTitle(it, '') || '').length + String(itemBody(it) || '').length, 0);
    const dense = !compactRightRail && (visible.length >= 5 || textLoad > 150);
    if (dense) {
      drawDenseEvidenceRows(slide, board, visible);
      return;
    }
    const cols = compactRightRail ? 1 : (visible.length <= 4 ? 2 : 3);
    const rows = Math.max(1, Math.ceil(visible.length / cols));
    const gapX = compactRightRail ? 0 : 0.24;
    const gapY = compactRightRail ? 0.14 : (rows <= 2 ? 0.28 : 0.18);
    const startX = board.x + 0.30;
    const startY = board.y + 0.76;
    const gridW = board.w - 0.60;
    const gridH = board.h - 1.02;
    const colW = compactRightRail ? gridW : (gridW - gapX * (cols - 1)) / cols;
    const fitRowH = (gridH - gapY * (rows - 1)) / rows;
    const desiredRowH = compactRightRail ? 0.66 : 0.82;
    const rowH = Math.min(desiredRowH, Math.max(0.36, fitRowH));
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
      const titleH = compactRightRail ? 0.14 : 0.16;
      const bodyH = body
        ? (compactRightRail ? Math.min(0.34, Math.max(0.22, rowH - 0.34)) : Math.min(0.42, Math.max(0.24, rowH - 0.56)))
        : 0;
      const stack = body ? [titleH, bodyH] : [titleH];
      const [titleY, bodyY] = centeredStackY(y, rowH, stack, body ? (compactRightRail ? 0.06 : 0.10) : 0);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.20, y:titleY+0.02, w:0.28, h:0.10, fontSize:6.4, color:accent });
      addText(slide, title, { x:x+0.58, y:titleY, w:Math.max(0.90, colW - 0.82), h:titleH, fontSize:compactRightRail ? 8.0 : 8.6, bold:true, color:C.text, fit:'shrink', valign:'mid' });
      if (body) {
        addText(slide, body, { x:x+0.58, y:bodyY, w:Math.max(0.90, colW - 0.82), h:bodyH, fontSize:compactRightRail ? 6.5 : 7.1, color:C.body, fit:'shrink', breakLine:true, valign:'mid' });
      }
    });
    if (!visible.length) {
      addText(slide, '暂无结构化条目', { x:board.x+0.28, y:board.y+1.08, w:2.2, h:0.16, fontSize:10.0, color:C.muted });
    }
  }

  function drawDenseEvidenceRows(slide, board, visible) {
    const list = visible.slice(0, 6);
    const lead = list[0] || {};
    const startX = board.x + 0.34;
    const startY = board.y + 0.74;
    const innerW = board.w - 0.68;
    const accent = C.accent;
    addRect(slide, startX, startY, innerW, 0.70, C.panelAlt || panelFill(), accent, {
      fill:{ color:C.panelAlt || panelFill(), transparency:8 },
      line:{ color:accent, transparency:24, width:0.32 }
    });
    addRect(slide, startX, startY, 0.045, 0.70, accent, accent, {
      fill:{ color:accent, transparency:0 },
      line:{ color:accent, transparency:100 }
    });
    addNumber(slide, '01', { x:startX+0.22, y:startY+0.28, w:0.32, h:0.10, fontSize:6.8, color:accent });
    addText(slide, itemTitle(lead, '重点观察'), {
      x:startX+0.66, y:startY+0.15, w:2.42, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink', valign:'mid'
    });
    addText(slide, itemBody(lead), {
      x:startX+3.18, y:startY+0.14, w:Math.max(2.2, innerW-3.44), h:0.34, fontSize:7.2, color:C.body, fit:'shrink', breakLine:true, valign:'mid'
    });
    const rows = list.slice(1);
    const listTop = startY + 0.98;
    const listBottom = board.y + board.h - 0.24;
    const rowStep = Math.min(0.48, Math.max(0.36, (listBottom - listTop) / Math.max(1, rows.length)));
    rows.forEach((it, index) => {
      const i = index + 1;
      const y = listTop + index * rowStep;
      const color = i === 1 ? C.cyan : (i === 2 ? C.violet : C.muted);
      addHairline(slide, startX, y - 0.06, innerW, C.line, 18, 0.28);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:startX+0.04, y:y+0.08, w:0.32, h:0.10, fontSize:6.4, color });
      addText(slide, itemTitle(it, `要点 ${i+1}`), {
        x:startX+0.52, y:y, w:2.16, h:0.15, fontSize:8.0, bold:true, color:C.text, fit:'shrink'
      });
      const body = itemBody(it);
      if (body) {
        addText(slide, body, {
          x:startX+2.86, y:y-0.01, w:Math.max(2.2, innerW-2.94), h:0.22, fontSize:6.7, color:C.body, fit:'shrink', breakLine:true
        });
      }
    });
  }

  return {
    drawGridEvidenceRows
  };
}

module.exports = {
  createGridEvidenceRows
};

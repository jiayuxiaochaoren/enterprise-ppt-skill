const {
  centeredStackY
} = require('../layout/card-layout');

function createCompactEvidenceRows(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle,
    panelFill,
    publicSlideNote
  } = ctx;

  function drawCompactEvidenceRows(slide, s, board, items, compactRightRail) {
    const rows = items.slice(0, 3);
    const note = publicSlideNote(s.evidenceNote || s.note || '');
    const top = board.y + 0.76;
    const bottom = board.y + board.h - (note ? 0.76 : 0.26);
    const gap = compactRightRail ? 0.12 : 0.18;
    const available = Math.max(0.60, bottom - top - gap * Math.max(0, rows.length - 1));
    const rowH = Math.max(0.56, Math.min(0.84, available / Math.max(1, rows.length)));
    rows.forEach((it, i) => {
      const y = top + i * (rowH + gap);
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addRect(slide, board.x + 0.30, y, board.w - 0.60, rowH, i === 0 ? C.panelAlt : panelFill(), i === 0 ? accent : C.line, {
        fill:{ color:i === 0 ? C.panelAlt : panelFill(), transparency:i === 0 ? 10 : 0 },
        line:{ color:i === 0 ? accent : C.line, transparency:i === 0 ? 26 : 24, width:0.30 }
      });
      addRect(slide, board.x + 0.30, y, 0.045, rowH, accent, accent, {
        fill:{ color:accent, transparency:0 },
        line:{ color:accent, transparency:100 }
      });
      const titleH = 0.15;
      const bodyH = compactRightRail ? 0.20 : 0.28;
      const [titleY, bodyY] = centeredStackY(y, rowH, [titleH, bodyH], 0.08);
      addNumber(slide, String(i + 1).padStart(2, '0'), { x:board.x+0.58, y:titleY+0.02, w:0.30, h:0.10, fontSize:6.8, color:accent });
      addText(slide, itemTitle(it, `证据 ${i + 1}`), {
        x:board.x+1.04, y:titleY, w:compactRightRail ? Math.max(1.0, board.w - 1.42) : 1.54, h:titleH,
        fontSize:9.0, bold:true, color:C.text, fit:'shrink', valign:'mid'
      });
      addText(slide, itemBody(it), {
        x:compactRightRail ? board.x+1.04 : board.x+2.82,
        y:compactRightRail ? bodyY : titleY,
        w:compactRightRail ? Math.max(1.0, board.w - 1.42) : 3.92,
        h:compactRightRail ? bodyH : Math.max(titleH, bodyH),
        fontSize:compactRightRail ? 7.0 : 8.0,
        color:C.body,
        fit:'shrink',
        breakLine:true,
        valign:'mid'
      });
    });
    if (note) {
      const noteLineY = board.y + board.h - 0.42;
      addHairline(slide, board.x+0.32, noteLineY, board.w-0.64, C.line, 18, 0.30);
      addText(slide, note, {
        x:board.x+0.34, y:noteLineY+0.10, w:compactRightRail ? Math.max(1.0, board.w - 0.68) : Math.max(1.0, board.w - 1.60), h:0.12,
        fontSize:compactRightRail ? 6.8 : 7.4, color:C.muted, fit:'shrink'
      });
    }
  }

  return {
    drawCompactEvidenceRows
  };
}

module.exports = {
  createCompactEvidenceRows
};

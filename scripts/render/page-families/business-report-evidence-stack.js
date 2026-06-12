const {
  createCompactEvidenceRows
} = require('./business-report-compact-evidence');
const {
  createGridEvidenceRows
} = require('./business-report-grid-evidence');

function createReportEvidenceStack(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    panelFill
  } = ctx;
  const { drawCompactEvidenceRows } = createCompactEvidenceRows(ctx);
  const { drawGridEvidenceRows } = createGridEvidenceRows(ctx);

  function drawEvidenceStack(slide, s, board, items, compactRightRail) {
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:22, width:0.34} });
    addLabel(slide, '证据栈', { x:board.x+0.28, y:board.y+0.28, w:1.28, h:0.12, fontSize:6.6, color:C.accent, charSpace:0 });
    if (items.length > 0 && items.length <= 3) {
      drawCompactEvidenceRows(slide, s, board, items, compactRightRail);
      return;
    }
    drawGridEvidenceRows(slide, board, items, compactRightRail);
  }

  return {
    drawEvidenceStack
  };
}

module.exports = {
  createReportEvidenceStack
};

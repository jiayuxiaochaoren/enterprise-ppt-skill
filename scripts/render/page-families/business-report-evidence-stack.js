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

  function policyContextVariant(plan = {}, s = {}) {
    return plan.industry === 'government-public-sector'
      && /policy-context-board/i.test(String(s.layoutVariant || s.variant || s.proofObject || s.proof_object || ''));
  }

  function lifestyleOperationsBoard(plan = {}, s = {}) {
    return plan.industry === 'lifestyle-food-tourism-fashion'
      && /operating model|report board/i.test(String(s.label || ''));
  }

  function drawEvidenceStack(slide, plan, s, board, items, compactRightRail) {
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:22, width:0.34} });
    addLabel(slide, s.evidenceLabel || (policyContextVariant(plan, s)
      ? '执行抓手'
      : (lifestyleOperationsBoard(plan, s)
        ? '保障动作'
        : (plan.industry === 'general-operations' ? '经营证据' : '关键依据'))), { x:board.x+0.28, y:board.y+0.28, w:1.28, h:0.12, fontSize:6.6, color:C.accent, charSpace:0 });
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

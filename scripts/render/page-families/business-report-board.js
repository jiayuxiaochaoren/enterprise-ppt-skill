const { createPageFamilyPrimitives } = require('./primitives');
const {
  reportBoardItems
} = require('./business-report-board-data');
const {
  createReportBoardPanels
} = require('./business-report-board-panels');

function createReportBoardRenderer(ctx = {}) {
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const {
    copyFallback,
    reportBoardNeedsRightOverlayRail
  } = ctx;
  const {
    drawEvidenceStack,
    drawExecutiveReadPanel
  } = createReportBoardPanels(ctx);

  return function reportBoard(slide, plan, s, idx) {
    drawLightPageHeader(slide, {
      kicker:s.label || 'REPORT BOARD',
      title:s.title || copyFallback(plan, 'industryCoreTitle'),
      titleY:1.04,
      titleW:6.2,
      titleH:0.36,
      subtitle:s.claim || s.subtitle || s.intro || copyFallback(plan, 'reportBoardClaim'),
      subtitleW:7.0,
      idx,
      pageNumber:'chrome'
    });
    const items = reportBoardItems(s).slice(0,9);
    const summary = s.summary || s.coreBody || s.note || copyFallback(plan, 'reportBoardCoreBody');
    drawExecutiveReadPanel(slide, plan, s, summary);

    const compactRightRail = reportBoardNeedsRightOverlayRail(s);
    const board = { x:4.12, y:2.08, w:compactRightRail ? 3.54 : 7.46, h:4.16 };
    drawEvidenceStack(slide, s, board, items, compactRightRail);
    drawFooter(slide, plan);
  };
}

module.exports = {
  createReportBoardRenderer,
  reportBoardItems
};

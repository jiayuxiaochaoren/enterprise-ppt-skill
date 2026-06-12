const {
  createReportEvidenceStack
} = require('./business-report-evidence-stack');
const {
  createReportExecutivePanel
} = require('./business-report-executive-panel');

function createReportBoardPanels(ctx = {}) {
  const { drawEvidenceStack } = createReportEvidenceStack(ctx);
  const { drawExecutiveReadPanel } = createReportExecutivePanel(ctx);
  return {
    drawEvidenceStack,
    drawExecutiveReadPanel
  };
}

module.exports = {
  createReportBoardPanels
};

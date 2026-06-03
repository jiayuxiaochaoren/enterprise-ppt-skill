const {
  createPrimitiveEvidence
} = require('./primitive-evidence');
const {
  createPrimitiveMetrics
} = require('./primitive-metrics');

function createPrimitiveContent(ctx = {}, C = ctx.colors()) {
  const {
    drawMetricCard,
    drawMetricRow
  } = createPrimitiveMetrics(ctx, C);
  const {
    drawCaptionStack,
    drawEvidenceBoard,
    drawEvidencePanel,
    drawImagePanel
  } = createPrimitiveEvidence(ctx, C);

  return {
    drawCaptionStack,
    drawEvidenceBoard,
    drawEvidencePanel,
    drawImagePanel,
    drawMetricCard,
    drawMetricRow
  };
}

module.exports = {
  createPrimitiveContent
};

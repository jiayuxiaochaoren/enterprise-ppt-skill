const {
  createSustainabilityImageEvidencePanels
} = require('./evidence-brand-sustainability-images');
const {
  createSustainabilityMetricsReadout
} = require('./evidence-brand-sustainability-metrics');

function createSustainabilityProofPanels(ctx = {}) {
  const {
    drawImageEvidenceSpread
  } = createSustainabilityImageEvidencePanels(ctx);
  const {
    drawMetricsReadout
  } = createSustainabilityMetricsReadout(ctx);

  return {
    drawImageEvidenceSpread,
    drawMetricsReadout
  };
}

module.exports = {
  createSustainabilityProofPanels
};

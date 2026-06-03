const {
  componentConsumptionAuditFromRender,
  expectedRenderedCountsForSlide
} = require('./component-consumption-audit');
const {
  contentCoverageAuditFromRender
} = require('./content-coverage-audit');
const {
  overlayContractAuditFromRender
} = require('./overlay-contract-audit');
const {
  renderMetaSchemaAuditFromRender
} = require('./render-meta-schema-audit');
const {
  routeMetadataAuditFromRender
} = require('./route-metadata-audit');
const {
  findingsFromPreviewSimilarity,
  secondaryVisualReview
} = require('./secondary-visual-review');

module.exports = {
  componentConsumptionAuditFromRender,
  contentCoverageAuditFromRender,
  expectedRenderedCountsForSlide,
  findingsFromPreviewSimilarity,
  overlayContractAuditFromRender,
  renderMetaSchemaAuditFromRender,
  routeMetadataAuditFromRender,
  secondaryVisualReview
};

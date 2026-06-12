const {
  createChartAcceptanceGate,
  issueCategoryForFinding
} = require('./chart-acceptance-gate');
const {
  chartEvidenceQA
} = require('./chart-evidence-qa');
const {
  pageLevelChartScores
} = require('./chart-page-scores');
const {
  chartSemanticQA
} = require('./chart-semantic-qa');
const {
  chartVisualQA
} = require('./chart-visual-qa');

const {
  chartAcceptanceGate
} = createChartAcceptanceGate({ chartSemanticQA });

module.exports = {
  chartAcceptanceGate,
  chartEvidenceQA,
  chartSemanticQA,
  chartVisualQA,
  issueCategoryForFinding,
  pageLevelChartScores
};

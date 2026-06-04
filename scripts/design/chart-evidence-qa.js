const {
  slideHasChartIntent
} = require('./chart-intent');
const {
  routeChartSpec
} = require('./chart-spec-routing');

function chartEvidenceQA(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || plan;
  const slides = normalized.slides || [];
  const findings = [];
  slides.forEach((slide, i) => {
    const chartEligible = slideHasChartIntent(slide);
    if (!chartEligible) return;
    const spec = routeChartSpec(normalized, slide, { index: i + 1, total: slides.length });
    if (!spec || spec.kind === 'informationGap') return;
    const trace = spec.sourceTrace || {};
    const evidenceMode = (spec.dataQuality && spec.dataQuality.evidenceMode) || 'untraced';
    if (!spec.proofObject || spec.proofObject === 'unknown') {
      findings.push({ slide: i + 1, level: 'review', type: 'chartProofObjectMissing', issueCategory: 'data_contract_gap', message: 'chart cannot be traced to a proof object' });
    }
    if (!(trace.sourceIds || []).length && evidenceMode === 'untraced') {
      findings.push({ slide: i + 1, level: 'review', type: 'chartEvidenceUntraced', issueCategory: 'data_contract_gap', message: 'chart evidence mode is untraced' });
    }
  });
  return {
    version: 'chart-evidence-qa/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    findings
  };
}

module.exports = {
  chartEvidenceQA
};

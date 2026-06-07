const {
  dataSufficiency
} = require('./chart-data-shape');
const {
  slideHasChartIntent
} = require('./chart-intent');
const {
  routeChartSpec
} = require('./chart-spec-routing');
const {
  sourceTraceObjectIsExplainable
} = require('./source-evidence');
const {
  chartEvidenceQA
} = require('./chart-evidence-qa');
const {
  chartSemanticQA
} = require('./chart-semantic-qa');
const {
  chartVisualQA
} = require('./chart-visual-qa');

function pageLevelChartScores(plan = {}, normalizedPlan = null, renderMeta = null) {
  const normalized = normalizedPlan || plan;
  const semantic = chartSemanticQA(plan, normalized);
  const visual = chartVisualQA(plan, normalized, renderMeta);
  const evidence = chartEvidenceQA(plan, normalized);
  const bySlide = new Map();
  [semantic, visual, evidence].forEach(audit => {
    (audit.findings || []).forEach(finding => {
      if (!finding.slide) return;
      const row = bySlide.get(finding.slide) || [];
      row.push(finding);
      bySlide.set(finding.slide, row);
    });
  });
  return {
    version: 'page-level-chart-score/v1',
    slides: (normalized.slides || []).map((slide, i) => {
      const chartEligible = slideHasChartIntent(slide);
      const spec = chartEligible ? routeChartSpec(normalized, slide, { index: i + 1, total: (normalized.slides || []).length }) : null;
      const findings = bySlide.get(i + 1) || [];
      if (!spec) {
        return {
          slide: i + 1,
          applicability: 'not_applicable',
          chartKind: '',
          componentId: '',
          chartFitScore: null,
          dataSufficiencyScore: null,
          visualLegibilityScore: null,
          evidenceTraceScore: null,
          findings
        };
      }
      const fail = findings.filter(f => f.level === 'fail').length;
      const review = findings.filter(f => f.level !== 'fail' && f.level !== 'info').length;
      const sufficiency = dataSufficiency(spec);
      const sourceTraceExplainable = sourceTraceObjectIsExplainable(spec.sourceTrace || {}, { requireSourceId:true });
      return {
        slide: i + 1,
        applicability: 'applicable',
        chartKind: spec.kind,
        componentId: spec.componentId,
        chartFitScore: Math.max(0, 100 - fail * 45 - review * 14),
        dataSufficiencyScore: sufficiency.ok ? 100 : 40,
        visualLegibilityScore: Math.max(0, 100 - findings.filter(f => f.issueCategory === 'renderer_layout_bug').length * 22),
        evidenceTraceScore: sourceTraceExplainable ? 100 : 64,
        findings
      };
    })
  };
}

module.exports = {
  pageLevelChartScores
};

const {
  slideHasChartIntent
} = require('./chart-intent');
const {
  routeChartSpec
} = require('./chart-spec-routing');
const {
  sourceTraceObjectIsExplainable
} = require('./source-evidence');

function chartVisualQA(plan = {}, normalizedPlan = null, renderMeta = null) {
  const normalized = normalizedPlan || plan;
  const slides = normalized.slides || [];
  const findings = [];
  const rendered = new Map(((renderMeta && renderMeta.slides) || []).map(slide => [Number(slide.slide), slide]));
  slides.forEach((slide, i) => {
    const chartEligible = slideHasChartIntent(slide);
    if (!chartEligible) return;
    const spec = routeChartSpec(normalized, slide, { index: i + 1, total: slides.length });
    if (!spec || spec.kind === 'informationGap') return;
    const needsAxis = ['bar', 'line', 'waterfall', 'pareto', 'matrix', 'heatmap'].includes(spec.kind);
    const needsUnit = ['bar', 'line', 'waterfall', 'funnel', 'pareto', 'scorecard', 'kpi'].includes(spec.kind);
    const meta = rendered.get(i + 1);
    const visual = meta && meta.chartConsumption ? meta.chartConsumption.visualChecks || {} : {};
    if (needsAxis && !(spec.categories || []).length && !(spec.matrix && spec.matrix.rows && spec.matrix.columns)) {
      findings.push({ slide: i + 1, level: 'fail', type: 'chartAxisLabelsMissing', issueCategory: 'renderer_layout_bug', message: `${spec.kind} chart lacks category/axis labels` });
    }
    if (needsUnit && !spec.unit) {
      findings.push({ slide: i + 1, level: 'review', type: 'chartUnitMissing', issueCategory: 'data_contract_gap', message: `${spec.kind} chart lacks unit` });
    }
    if (!sourceTraceObjectIsExplainable(spec.sourceTrace || {}, { requireSourceId:true })) {
      findings.push({ slide: i + 1, level: 'review', type: 'chartSourceMissing', issueCategory: 'data_contract_gap', message: 'chart lacks source trace' });
    }
    if (visual.labelCollision) {
      findings.push({ slide: i + 1, level: 'review', type: 'chartLabelOverlap', issueCategory: 'renderer_layout_bug', message: 'renderer reported possible chart label overlap' });
    }
    if (visual.valueOverflow) {
      findings.push({ slide: i + 1, level: 'review', type: 'chartValueOverflow', issueCategory: 'renderer_layout_bug', message: 'renderer reported possible value overflow' });
    }
    if (meta && meta.chartConsumption && !meta.chartConsumption.rendered) {
      findings.push({ slide: i + 1, level: 'fail', type: 'chartNotRendered', issueCategory: 'component_gap', message: `planned chart component was not rendered: ${spec.componentId}` });
    }
  });
  return {
    version: 'chart-visual-qa/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    findings
  };
}

module.exports = {
  chartVisualQA
};

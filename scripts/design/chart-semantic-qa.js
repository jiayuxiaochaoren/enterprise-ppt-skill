const {
  BODY_EXEMPT_TYPES
} = require('./chart-spec-constants');
const {
  dataSufficiency,
  valuesForSpec
} = require('./chart-data-shape');
const {
  chartSignalText,
  slideHasChartIntent
} = require('./chart-intent');
const {
  hasExplicitChartSignal,
  routeChartSpec
} = require('./chart-spec-routing');

function chartSemanticQA(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || plan;
  const slides = normalized.slides || [];
  const findings = [];
  slides.forEach((slide, i) => {
    const chartEligible = slideHasChartIntent(slide);
    if (!chartEligible || (BODY_EXEMPT_TYPES.has(slide.type || '') && !hasExplicitChartSignal(slide))) return;
    const spec = routeChartSpec(normalized, slide, { index: i + 1, total: slides.length });
    if (!spec) return;
    if (spec.chartContractError) {
      findings.push({
        slide: i + 1,
        level: 'fail',
        type: 'chartSpecUnknownKind',
        issueCategory: 'data_contract_gap',
        message: `unknown chartSpec kind: ${spec.chartContractError.kind || spec.kind || 'unknown'}`
      });
      return;
    }
    const text = chartSignalText(slide);
    const sufficiency = dataSufficiency(spec);
    const requested = spec.requestedKind || spec.kind;
    if (spec.kind === 'informationGap') {
      const allowVisibleGap = slide.allowInformationGap === true || slide.allow_information_gap === true;
      findings.push({
        slide: i + 1,
        level: allowVisibleGap ? 'review' : 'fail',
        type: 'chartInformationGap',
        issueCategory: 'data_contract_gap',
        message: spec.informationGap && spec.informationGap.reason || '当前数据不足以生成可信图表'
      });
      return;
    }
    if (/monthly|trend|pulse|月度|趋势/.test(text) && spec.kind !== 'line' && requested !== 'line') {
      findings.push({ slide: i + 1, level: 'fail', type: 'monthlySeriesNotLine', issueCategory: 'routing_error', message: 'monthly sequence data must route to a line chart' });
    }
    if (/funnel|漏斗/.test(text) && spec.kind !== 'funnel' && requested !== 'funnel') {
      findings.push({ slide: i + 1, level: 'fail', type: 'funnelNotFunnel', issueCategory: 'routing_error', message: 'funnel stage data must route to a funnel chart' });
    }
    if (/waterfall|bridge|瀑布|目标桥|增长桥/.test(text) && spec.kind !== 'waterfall' && requested !== 'waterfall') {
      findings.push({ slide: i + 1, level: 'fail', type: 'waterfallNotWaterfall', issueCategory: 'routing_error', message: 'bridge data must route to a waterfall chart' });
    }
    if (spec.kind === 'line' && !sufficiency.ok) {
      findings.push({ slide: i + 1, level: 'fail', type: 'fakeTrendLine', issueCategory: 'data_contract_gap', message: sufficiency.reasons.join('; ') });
    }
    if (spec.kind === 'funnel') {
      const numeric = valuesForSpec(spec).map(v => v.value).filter(v => v != null);
      if (numeric.length >= 3 && new Set(numeric.map(v => Number(v).toFixed(4))).size === 1) {
        findings.push({ slide: i + 1, level: 'review', type: 'equalLengthFunnel', issueCategory: 'renderer_layout_bug', message: 'funnel values are all equal; verify this is real data, not equal bars' });
      }
    }
  });
  return {
    version: 'chart-semantic-qa/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    findings
  };
}

module.exports = {
  chartSemanticQA
};

const {
  routeChartSpec,
  chartSpecToComponentId
} = require('./chart-spec-routing');
const {
  slideHasChartIntent
} = require('./chart-intent');

const CHART_ROUTE_TYPES = new Set(['metric-comparison', 'industry-chart', 'finance-bridge']);

function chartPreflightAudit(plan = {}, normalizedPlan = null, options = {}) {
  const normalized = normalizedPlan || plan;
  const slides = normalized.slides || [];
  const findings = [];
  slides.forEach((slide, i) => {
    const type = String(slide.type || '');
    const chartRoute = CHART_ROUTE_TYPES.has(type);
    const hasIntent = chartRoute && slideHasChartIntent(slide);
    if (!hasIntent) return;
    const spec = routeChartSpec(normalized, slide, { index: i + 1, total: slides.length });
    if (!spec) {
      findings.push({
        slide: i + 1,
        level: 'fail',
        type: 'acceptanceChartSpecContractError',
        issueCategory: 'data_contract_gap',
        message: 'chart route has no chartSpec/v1 or routable chart data'
      });
      return;
    }
    if (spec.chartContractError) {
      findings.push({
        slide: i + 1,
        level: 'fail',
        type: 'acceptanceChartSpecContractError',
        issueCategory: 'data_contract_gap',
        message: spec.chartContractError.type || 'chartSpec contract error'
      });
    }
    if (spec.kind !== 'informationGap' && spec.dataQuality && spec.dataQuality.sufficient === false) {
      findings.push({
        slide: i + 1,
        level: 'fail',
        type: 'acceptanceChartSpecContractError',
        issueCategory: 'data_contract_gap',
        message: 'chartSpec dataQuality is insufficient for a non-gap chart'
      });
    }
    if (options.strict && spec && (spec.source === 'repair' || slide.chartSpecInferred === true)) {
      findings.push({
        slide: i + 1,
        level: 'fail',
        type: 'acceptanceChartSpecRepairInStrictMode',
        issueCategory: 'data_contract_gap',
        message: 'strict mode requires planner-provided chartSpec/v1, not renderer/planner repair inference'
      });
    }
    if (spec.kind !== 'informationGap' && !chartSpecToComponentId(spec)) {
      findings.push({
        slide: i + 1,
        level: 'fail',
        type: 'chartNotRendered',
        issueCategory: 'component_gap',
        message: `chartSpec kind ${spec.kind || 'unknown'} has no renderer component`
      });
    }
  });
  return {
    version: 'chart-preflight-audit/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    findings
  };
}

module.exports = {
  chartPreflightAudit
};

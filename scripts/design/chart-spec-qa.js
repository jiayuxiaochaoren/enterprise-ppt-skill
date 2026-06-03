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
const {
  createChartAcceptanceGate,
  issueCategoryForFinding
} = require('./chart-acceptance-gate');

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
    const sourceIds = (spec.sourceTrace && spec.sourceTrace.sourceIds) || [];
    if (!sourceIds.length && !((spec.sourceTrace && spec.sourceTrace.sourceNote) || '').trim()) {
      findings.push({ slide: i + 1, level: 'review', type: 'chartSourceMissing', issueCategory: 'data_contract_gap', message: 'chart lacks visible source trace' });
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
      const sourceIds = spec.sourceTrace ? spec.sourceTrace.sourceIds || [] : [];
      return {
        slide: i + 1,
        applicability: 'applicable',
        chartKind: spec.kind,
        componentId: spec.componentId,
        chartFitScore: Math.max(0, 100 - fail * 45 - review * 14),
        dataSufficiencyScore: sufficiency.ok ? 100 : 40,
        visualLegibilityScore: Math.max(0, 100 - findings.filter(f => f.issueCategory === 'renderer_layout_bug').length * 22),
        evidenceTraceScore: sourceIds.length ? 100 : 64,
        findings
      };
    })
  };
}

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

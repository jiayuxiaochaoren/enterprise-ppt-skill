const RISK_GOVERNANCE_COMPONENTS = new Set(['risk-register', 'risk-matrix', 'governance-table', 'permission-audit-tag']);
const METRIC_CHART_COMPONENTS = new Set([
  'kpi-strip',
  'metric-strip',
  'kpi-primary-metric',
  'chart-commentary-panel',
  'scorecard',
  'quality-scorecard',
  'line-chart',
  'bar-chart',
  'waterfall-chart',
  'funnel-chart',
  'matrix-chart',
  'heatmap-chart',
  'pareto-chart'
]);
const STRUCTURED_METRIC_CHART_FIELDS = [
  'metrics',
  'chartSpec',
  'chart_spec',
  'chartKind',
  'chart_kind',
  'series',
  'monthlyPulse',
  'monthlyTrend',
  'waterfallBridge',
  'targetBridge',
  'channelEfficiency',
  'mediaEfficiency',
  'memberCohorts',
  'adoptionFunnel',
  'qualityScorecard',
  'oee',
  'oeeComponents'
];
const RISK_GOVERNANCE_FIELDS = ['rows', 'risks', 'controls', 'riskRegister', 'riskMatrix', 'controlsMatrix', 'matrix'];

function createRiskGovernanceFallbackHelpers(deps = {}) {
  const {
    compactUnique,
    commonCaptionFields,
    hasFieldPath,
    hasSourceEvidence,
    normalizeKey,
    normalizeStageCoveragePolicy,
    proofObjectIdForSlide,
    version
  } = deps;

  function hasStructuredMetricOrChartEvidence(slide = {}) {
    return STRUCTURED_METRIC_CHART_FIELDS.some(field => hasFieldPath(slide, field));
  }

  function nativeRiskGovernanceFields(slide = {}) {
    return RISK_GOVERNANCE_FIELDS.filter(field => hasFieldPath(slide, field));
  }

  function isNativeRiskGovernanceSlide(slide = {}) {
    const type = normalizeKey(slide.type);
    if (['risk-table', 'risk', 'controls-table'].includes(type)) return true;
    const routeText = normalizeKey([
      slide.layoutVariant,
      slide.layout_variant,
      slide.variant,
      proofObjectIdForSlide(slide),
      slide.title,
      slide.subtitle
    ].filter(Boolean).join(' '));
    return /risk|governance|control|responsibility|风险|治理|保障|责任|内控/.test(routeText);
  }

  function stageOwnsAnyComponent(stage = {}, componentSet = new Set()) {
    const policy = normalizeStageCoveragePolicy(stage);
    return compactUnique(policy.components || []).some(id => componentSet.has(id));
  }

  function nativeRiskRouteOutranksMetricOnlyStage(stage = {}, slide = {}) {
    if (!isNativeRiskGovernanceSlide(slide)) return false;
    if (!nativeRiskGovernanceFields(slide).length) return false;
    if (hasStructuredMetricOrChartEvidence(slide)) return false;
    if (stageOwnsAnyComponent(stage, RISK_GOVERNANCE_COMPONENTS)) return false;
    return stageOwnsAnyComponent(stage, METRIC_CHART_COMPONENTS);
  }

  function nativeRiskGovernanceChain(chain = {}, slide = {}, reason = '') {
    const fields = nativeRiskGovernanceFields(slide);
    const type = normalizeKey(slide.type);
    const routeText = normalizeKey([
      slide.layoutVariant,
      slide.layout_variant,
      slide.variant,
      proofObjectIdForSlide(slide)
    ].filter(Boolean).join(' '));
    const component = hasFieldPath(slide, 'riskRegister') || /risk-register/.test(routeText)
      ? 'risk-register'
      : 'governance-table';
    const coveragePolicy = normalizeStageCoveragePolicy({
      components: [component],
      coveragePolicy: { requiredAll: [component], minHits: 1 }
    });
    return {
      version,
      industry: normalizeKey(slide.industry || ''),
      chainId: chain.id || 'industry-native',
      chainLabel: chain.label || '行业原生证据',
      stage: 'evidence',
      stageId: 'native-risk-governance',
      stageLabel: type === 'risk-table' ? '风险/治理保障' : '治理保障',
      position: 3,
      confidence: 'medium',
      score: 3,
      components: coveragePolicy.components,
      coveragePolicy,
      avoidComponents: compactUnique(chain.avoidComponents || []),
      matchedFields: fields,
      matchedKeywords: [],
      matchedProofObjects: [],
      matchedRoutes: [],
      evidenceReasons: compactUnique([reason, ...fields.map(field => `field:${field}`)]),
      structuredEvidenceBound: true,
      inferenceBasis: 'native-route',
      requiresCaption: false,
      requiresSource: false,
      hasCaptionEvidence: commonCaptionFields.some(field => hasFieldPath(slide, field)),
      hasSourceEvidence: hasSourceEvidence(slide),
      visibleSourceNotes: false,
      sourceNoteComponentSuppressed: false,
      visualGrammar: null
    };
  }

  return {
    isNativeRiskGovernanceSlide,
    nativeRiskGovernanceChain,
    nativeRiskGovernanceFields,
    nativeRiskRouteOutranksMetricOnlyStage
  };
}

module.exports = {
  createRiskGovernanceFallbackHelpers
};

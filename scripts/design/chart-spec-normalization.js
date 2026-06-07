const {
  BEAUTY_TEMPLATE_COMPONENTS,
  CHART_COMPONENTS,
  CHART_SPEC_VERSION,
  KNOWN_CHART_KINDS
} = require('./chart-spec-constants');
const {
  coerceItems,
  evidenceModeForSlide,
  proofObjectId,
  sourceClassForTrace,
  sourceTraceForSlide
} = require('./chart-data-utils');
const {
  dataForKind,
  dataSufficiency,
  primaryUnit,
  valuesForSpec
} = require('./chart-data-shape');
const {
  beautyTemplateRoute,
  routeRequestedKind,
  slideHasChartIntent
} = require('./chart-intent');

function canDowngradeToKpi(requestedKind, data = {}, plan = {}, slide = {}) {
  const values = (data.series || []).flatMap(series => series.values || []);
  const numeric = values.filter(v => v.value != null || v.rawValue);
  const explicit = Boolean(
    slide.dataComponent ||
    slide.data_component ||
    slide.previousDataComponent ||
    slide.previous_data_component ||
    slide.chartKind ||
    slide.chart_kind ||
    slide.previousChartKind ||
    slide.previous_chart_kind
  );
  const industry = String(plan.industry || '').toLowerCase();
  const beautyNoGeneric = /beauty|brand-retail|consumer/.test(industry);
  if (beautyNoGeneric && beautyTemplateRoute(plan, slide)) return false;
  if (explicit && ['line', 'waterfall', 'funnel', 'matrix', 'heatmap', 'pareto'].includes(requestedKind)) return false;
  return numeric.length === 1 && requestedKind !== 'kpi';
}

function informationGapSpec(base = {}, sufficiency = {}) {
  return Object.assign({}, base, {
    kind: 'informationGap',
    requestedKind: base.kind,
    componentId: CHART_COMPONENTS.informationGap,
    source: base.source || base.chartSpecSource || 'repair',
    informationGap: {
      reason: (sufficiency.reasons || []).join('；') || '当前数据不足以生成可信图表',
      missingFields: sufficiency.missingFields || [],
      policy: 'do-not-render-fake-chart'
    },
    dataQuality: Object.assign({}, base.dataQuality || {}, {
      sufficient: false,
      downgraded: false
    })
  });
}

function dataQualityForSpec(spec = {}, slide = {}, sourceTrace = {}, sufficiency = { ok:true }) {
  const values = valuesForSpec(spec);
  const numeric = values.filter(v => v.value != null);
  return Object.assign({}, spec.dataQuality || {}, {
    sufficient: sufficiency.ok !== false,
    sourceClass: sourceClassForTrace(sourceTrace),
    evidenceMode: evidenceModeForSlide(slide, sourceTrace),
    realSeries: numeric.length >= 2,
    pointCount: values.length,
    numericPointCount: numeric.length
  });
}

function normalizeExistingChartSpec(slide = {}) {
  const spec = Object.assign({}, slide.chartSpec);
  if (!spec.source) spec.source = spec.kind === 'informationGap' ? 'explicit-gap' : 'planner';
  const sourceTrace = sourceTraceForSlide(slide);
  if (spec.kind === 'informationGap') {
    return Object.assign({}, spec, {
      source: spec.source || 'explicit-gap',
      requestedKind: spec.requestedKind || spec.requested_kind || '',
      componentId: spec.componentId || CHART_COMPONENTS.informationGap,
      sourceTrace,
      dataQuality: dataQualityForSpec(spec, slide, sourceTrace, { ok:false }),
      informationGap: spec.informationGap || {
        reason: spec.reason || 'Planner explicitly requested a visible chart information gap.',
        missingFields: spec.missingFields || [],
        policy: 'explicit-gap'
      }
    });
  }
  if (!KNOWN_CHART_KINDS.has(spec.kind)) {
    return Object.assign({}, spec, {
      componentId: spec.componentId || '',
      sourceTrace,
      dataQuality: dataQualityForSpec(spec, slide, sourceTrace, { ok:false }),
      chartContractError: {
        type: 'unknownChartKind',
        kind: spec.kind || '',
        policy: 'planner-must-use-chartSpec-v1-known-kind-or-explicit-informationGap'
      }
    });
  }
  const sufficiency = dataSufficiency(spec);
  const enriched = Object.assign({}, spec, {
    sourceTrace,
    dataQuality: dataQualityForSpec(spec, slide, sourceTrace, sufficiency)
  });
  return sufficiency.ok ? enriched : informationGapSpec(enriched, sufficiency);
}

function normalizeChartSpec(plan = {}, slide = {}, options = {}) {
  if (slide.chartSpec && slide.chartSpec.version === CHART_SPEC_VERSION) {
    return normalizeExistingChartSpec(slide);
  }

  if (!slideHasChartIntent(slide)) return null;
  const route = routeRequestedKind(plan, slide);
  if (!route.kind) return null;
  const data = dataForKind(route.kind, slide);
  const sourceTrace = sourceTraceForSlide(slide);
  const proofId = proofObjectId(slide);
  const values = (data.series || []).flatMap(series => series.values || []);
  const spec = {
    version: CHART_SPEC_VERSION,
    id: slide.chartId || slide.chart_id || `${proofId || 'chart'}-${options.index || ''}`.replace(/^-|-$/g, ''),
    kind: route.kind,
    source: 'repair',
    componentId: route.industryTemplate ? (BEAUTY_TEMPLATE_COMPONENTS[route.industryTemplate] || CHART_COMPONENTS[route.kind]) : CHART_COMPONENTS[route.kind],
    industryTemplate: route.industryTemplate || '',
    routeSource: route.source,
    title: slide.chartTitle || slide.title || '',
    insight: slide.insight || slide.claim || slide.subtitle || slide.note || '',
    series: data.series || [],
    categories: data.categories || [],
    matrix: data.matrix || null,
    table: data.table || null,
    unit: primaryUnit(data, slide),
    period: slide.period || slide.timePeriod || slide.time_period || '',
    baseline: slide.baseline || slide.base || '',
    sourceTrace,
    proofObject: proofId,
    annotations: slide.annotations || slide.callouts || [],
    dataQuality: {
      sufficient: true,
      sourceClass: sourceClassForTrace(sourceTrace),
      evidenceMode: evidenceModeForSlide(slide, sourceTrace),
      realSeries: values.filter(v => v.value != null).length >= 2,
      pointCount: values.length,
      numericPointCount: values.filter(v => v.value != null).length,
      downgradePolicy: route.industryTemplate ? 'industry-template-no-generic-downgrade' : 'allow-safe-kpi-downgrade'
    }
  };

  const sufficiency = dataSufficiency(spec);
  if (sufficiency.ok) return spec;
  if (canDowngradeToKpi(route.kind, data, plan, slide)) {
    const kpiData = dataForKind('kpi', Object.assign({}, slide, { metrics: values.map(v => ({ label: v.category, value: v.rawValue, note: v.note, unit: v.unit })) }));
    return Object.assign({}, spec, {
      kind: 'kpi',
      requestedKind: route.kind,
      componentId: CHART_COMPONENTS.kpi,
      series: kpiData.series,
      categories: kpiData.categories,
      unit: primaryUnit(kpiData, slide),
      dataQuality: Object.assign({}, spec.dataQuality, {
        sufficient: true,
        downgraded: true,
        downgradeReason: sufficiency.reasons.join('; ')
      })
    });
  }
  return informationGapSpec(spec, sufficiency);
}

module.exports = {
  canDowngradeToKpi,
  coerceItems,
  informationGapSpec,
  normalizeChartSpec,
  normalizeExistingChartSpec
};

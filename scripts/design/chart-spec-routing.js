const {
  CHART_COMPONENTS
} = require('./chart-spec-constants');
const {
  hasChartFieldData,
  isChartDataComponent,
  slideHasChartIntent
} = require('./chart-intent');
const {
  canDowngradeToKpi,
  informationGapSpec,
  normalizeChartSpec
} = require('./chart-spec-normalization');
const {
  assetAuthorizationStatusHasSignal,
  sourceTraceForSlide
} = require('./source-evidence');

function routeChartSpec(plan = {}, slide = {}, options = {}) {
  return normalizeChartSpec(plan, slide, options);
}

function chartSpecToComponentId(spec = {}) {
  if (!spec) return '';
  return spec.componentId || CHART_COMPONENTS[spec.kind] || '';
}

function chartConsumedFields(spec = {}) {
  const fields = ['kind', 'title', 'insight'];
  if (spec.series && spec.series.length) fields.push('series');
  if (spec.categories && spec.categories.length) fields.push('categories');
  if (spec.unit) fields.push('unit');
  if (spec.period) fields.push('period');
  if (spec.baseline) fields.push('baseline');
  if (spec.sourceTrace) {
    const trace = sourceTraceForSlide({ sourceTrace: spec.sourceTrace });
    if ((trace.sourceIds || []).length ||
      (trace.sources || []).length ||
      (trace.imageProvenance || []).length ||
      (trace.assetAuthorizationStatuses || []).some(assetAuthorizationStatusHasSignal) ||
      assetAuthorizationStatusHasSignal(trace.assetAuthorizationStatus)) {
      fields.push('sourceTrace');
    }
  }
  if (spec.annotations && spec.annotations.length) fields.push('annotations');
  if (spec.matrix) fields.push('matrix');
  if (spec.table) fields.push('table');
  if (spec.informationGap) fields.push('informationGap');
  return fields;
}

function hasExplicitChartSignal(slide = {}) {
  return Boolean(slide.chartSpec || slide.chartKind || slide.chart_kind) ||
    isChartDataComponent(slide.dataComponent || slide.data_component) ||
    hasChartFieldData(slide);
}

module.exports = {
  canDowngradeToKpi,
  chartConsumedFields,
  chartSpecToComponentId,
  hasExplicitChartSignal,
  informationGapSpec,
  normalizeChartSpec,
  routeChartSpec
};

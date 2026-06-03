const constants = require('./design/chart-spec-constants');
const dataUtils = require('./design/chart-data-utils');
const dataShape = require('./design/chart-data-shape');
const intent = require('./design/chart-intent');
const routing = require('./design/chart-spec-routing');
const qa = require('./design/chart-spec-qa');

module.exports = Object.assign(
  {},
  constants,
  {
    asNumber: dataUtils.asNumber,
    coerceItems: dataUtils.coerceItems,
    proofObjectId: dataUtils.proofObjectId,
    sourceTraceForSlide: dataUtils.sourceTraceForSlide
  },
  {
    dataSufficiency: dataShape.dataSufficiency,
    valuesForSpec: dataShape.valuesForSpec
  },
  {
    slideHasChartIntent: intent.slideHasChartIntent
  },
  {
    chartConsumedFields: routing.chartConsumedFields,
    chartSpecToComponentId: routing.chartSpecToComponentId,
    hasExplicitChartSignal: routing.hasExplicitChartSignal,
    routeChartSpec: routing.routeChartSpec
  },
  qa
);

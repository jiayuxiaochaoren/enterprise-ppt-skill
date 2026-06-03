const { createPageFamilyPrimitives } = require('./primitives');
const {
  createMetricComparisonLogicRow
} = require('./financial-metric-comparison-logic-row');
const {
  createMetricComparisonPanel
} = require('./financial-metric-comparison-panel');

function createGenericMetricComparisonRenderer(ctx = {}) {
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const { drawMetricComparisonLogicRow } = createMetricComparisonLogicRow(ctx);
  const { drawMetricComparisonPanel } = createMetricComparisonPanel(ctx);

  return function genericMetricComparison(slide, plan, s, idx) {
    const claim = s.claim || s.subtitle || s.intro || '以少量核心指标判断增长质量，并把变化原因收束到下一步经营动作。';
    drawLightPageHeader(slide, {
      kicker:'PERFORMANCE SIGNAL',
      title:s.title || '关键指标变化',
      titleY:1.06,
      titleW:5.9,
      titleH:0.36,
      titleSize:24,
      subtitle:claim,
      subtitleY:1.54,
      subtitleW:6.8,
      subtitleSize:10.2,
      idx
    });

    drawMetricComparisonPanel(slide, s);
    drawMetricComparisonLogicRow(slide, s);
    drawFooter(slide, plan);
  };
}

module.exports = {
  createGenericMetricComparisonRenderer
};

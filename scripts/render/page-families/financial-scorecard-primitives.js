const {
  createPageFamilyPrimitives
} = require('./primitives');

function metricPctWidth(value, max = 1.8, fallback = 0.56) {
  const num = Number(String(value || '').replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(num)) return max * fallback;
  return Math.max(0.22, Math.min(max, max * Math.min(100, Math.abs(num)) / 100));
}

function findMetric(metrics = [], re, fallbackIndex = 0) {
  return metrics.find(m => re.test(`${m.label || ''} ${m.title || ''} ${m.note || ''}`)) || metrics[fallbackIndex] || {};
}

function createFinancialScorecardPrimitives(ctx = {}) {
  const { drawLightPageHeader } = createPageFamilyPrimitives(ctx);

  function drawScorecardHeader(slide, s, idx, opts = {}) {
    const subtitle = opts.useProvidedSubtitle
      ? opts.subtitle
      : (s.claim || s.subtitle || opts.subtitle);
    drawLightPageHeader(slide, {
      kicker:opts.kicker,
      title:s.title || opts.title,
      titleY:1.06,
      titleW:opts.titleW,
      titleH:0.36,
      titleSize:opts.titleSize || 24,
      titleMaxLines:opts.titleMaxLines,
      titleBreakLine:opts.titleBreakLine,
      subtitle,
      subtitleY:1.54,
      subtitleW:opts.subtitleW,
      subtitleH:0.20,
      subtitleSize:opts.subtitleSize || 10.0,
      idx
    });
  }

  return {
    drawScorecardHeader
  };
}

module.exports = {
  createFinancialScorecardPrimitives,
  findMetric,
  metricPctWidth
};

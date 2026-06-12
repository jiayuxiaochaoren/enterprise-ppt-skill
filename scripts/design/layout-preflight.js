function visibleLength(text = '') {
  return [...String(text || '').trim()].reduce((sum, char) => sum + (/[\u4e00-\u9fff]/.test(char) ? 2 : 1), 0);
}

function countItems(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') {
    return ['items', 'values', 'points', 'rows', 'cells']
      .map(field => Array.isArray(value[field]) ? value[field].length : 0)
      .reduce((a, b) => a + b, 0);
  }
  return 0;
}

function metricUnitWrapRisk(metric = {}) {
  const valueLen = visibleLength(metric.value || metric.amount || '');
  const unitLen = visibleLength(metric.unit || metric.suffix || '');
  return unitLen > 0 && (valueLen >= 10 || (valueLen >= 8 && unitLen >= 4));
}

function layoutPreflightAudit(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || plan;
  const slides = normalized.slides || [];
  const findings = [];
  slides.forEach((slide, i) => {
    const type = String(slide.type || '');
    const titleLen = visibleLength(slide.title || '');
    const subtitleLen = visibleLength(slide.subtitle || slide.claim || '');
    const compactTitleRoute = ['report-board', 'risk-table', 'portfolio-table', 'metric-comparison', 'industry-chart'].includes(type);
    const titleLimit = compactTitleRoute ? 52 : 66;
    if (titleLen > titleLimit && subtitleLen > 28) {
      findings.push({
        slide: i + 1,
        level: 'review',
        type: 'titleSubtitleCollisionRisk',
        message: `title/subtitle budget is high for ${type || 'slide'} route (${titleLen}+${subtitleLen})`
      });
    }
    const cardCount = Array.isArray(slide.cards) ? slide.cards.length : 0;
    const longCards = (slide.cards || []).filter(card => visibleLength(card.body || card.text || '') > 88).length;
    if (cardCount >= 6 && longCards >= 3) {
      findings.push({
        slide: i + 1,
        level: 'review',
        type: 'textDensity',
        message: 'dense card route has multiple long text blocks before rendering'
      });
    }
    const overflowingCards = (slide.cards || []).filter(card => visibleLength([
      card.title,
      card.value,
      card.unit,
      card.body || card.text
    ].filter(Boolean).join(' ')) > 124).length;
    if (cardCount >= 4 && overflowingCards >= 2) {
      findings.push({
        slide: i + 1,
        level: 'review',
        type: 'cardContentOverflowRisk',
        message: 'multiple cards exceed the safe pre-render text budget'
      });
    }
    if ((slide.metrics || []).some(metricUnitWrapRisk)) {
      findings.push({
        slide: i + 1,
        level: 'review',
        type: 'metricUnitWrapRisk',
        message: 'metric value and unit exceed single-line budget before rendering'
      });
    }
    const matrixItemCount = countItems(slide.channelEfficiency || slide.mediaEfficiency || slide.scatter || slide.matrix || slide.riskMatrix);
    if ((type === 'industry-chart' || type === 'metric-comparison') && matrixItemCount > 8) {
      findings.push({
        slide: i + 1,
        level: 'review',
        type: 'chartLabelDensityRisk',
        message: `chart route has ${matrixItemCount} matrix/scatter labels before rendering`
      });
    }
    if (type === 'timeline' && /closed-loop|flywheel|loop/i.test(String(slide.layoutVariant || slide.variant || '')) && titleLen + subtitleLen > 128) {
      findings.push({
        slide: i + 1,
        level: 'review',
        type: 'closedLoopCenteringRisk',
        message: 'closed-loop route has high header text budget that can shift the center composition'
      });
    }
  });
  return {
    version: 'layout-preflight-audit/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    findings
  };
}

module.exports = {
  layoutPreflightAudit,
  metricUnitWrapRisk,
  visibleLength
};

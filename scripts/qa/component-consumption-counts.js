function arrayLength(slide = {}, keys = []) {
  return Math.max(0, ...keys.map(key => Array.isArray(slide[key]) ? slide[key].length : 0));
}

function imageCountForSlide(slide = {}) {
  return arrayLength(slide, ['images']) +
    (slide.visual && Array.isArray(slide.visual.images) ? slide.visual.images.length : 0) +
    (slide.image || (slide.visual && slide.visual.image) ? 1 : 0);
}

function expectedRenderedCountsForSlide(slide = {}) {
  const counts = {};
  const plannedIds = new Set(((slide.componentPlan && slide.componentPlan.componentIds) || [])
    .concat(((slide.componentPlan && slide.componentPlan.components) || []).map(component => component.id))
    .filter(Boolean));
  const set = (ids, value) => {
    const count = Number(value || 0);
    if (!count) return;
    ids.forEach(id => {
      if (plannedIds.has(id)) counts[id] = Math.max(counts[id] || 0, count);
    });
  };
  set(['navigation-sequence'], arrayLength(slide, ['items', 'sections']));
  set(['content-card-grid'], arrayLength(slide, ['cards', 'items', 'modules', 'values', 'sections']));
  set(['process-rail'], arrayLength(slide, ['phases', 'actions', 'steps', 'timeline', 'milestones']));
  const rowCount = arrayLength(slide, ['rows', 'risks', 'controls']);
  set(['risk-register', 'governance-table', 'table-with-commentary'], rowCount);
  const metricCount = arrayLength(slide, ['metrics']);
  set(['kpi-strip', 'metric-strip', 'scorecard'], Math.min(metricCount, 4));
  set(['kpi-primary-metric'], metricCount ? 1 : 0);
  const galleryCount = Math.max(imageCountForSlide(slide), arrayLength(slide, ['cards', 'items']));
  set(['proof-gallery', 'proof-gallery-grid'], galleryCount);
  set(['hero-image'], imageCountForSlide(slide) ? 1 : 0);
  set(['product-matrix'], arrayLength(slide, ['products', 'productStory']));
  set(['load-curve-band'], plannedIds.has('load-curve-band') ? 1 : 0);
  return counts;
}

function renderedCountForComponent(consumed = null, drawn = null, expected = 0) {
  return Number(
    (consumed && consumed.drawnCount != null ? consumed.drawnCount : null) ??
    (consumed && consumed.itemCount != null ? consumed.itemCount : null) ??
    (drawn && drawn.drawnCount != null ? drawn.drawnCount : null) ??
    (drawn && drawn.itemCount != null ? drawn.itemCount : null) ??
    (consumed && consumed.rendered && expected <= 1 ? 1 : 0)
  );
}

module.exports = {
  arrayLength,
  expectedRenderedCountsForSlide,
  imageCountForSlide,
  renderedCountForComponent
};

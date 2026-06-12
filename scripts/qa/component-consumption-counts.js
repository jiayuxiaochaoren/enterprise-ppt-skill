function arrayLength(slide = {}, keys = []) {
  return Math.max(0, ...keys.map(key => Array.isArray(slide[key]) ? slide[key].length : 0));
}

function imageCountForSlide(slide = {}) {
  const refs = [];
  const push = value => {
    if (Array.isArray(value)) value.forEach(push);
    else if (value) refs.push(String(value));
  };
  push(slide.images);
  if (slide.visual) {
    push(slide.visual.images);
    push(slide.visual.image);
  }
  push(slide.image);
  return new Set(refs).size;
}

function objectArrayLength(value = {}, keys = []) {
  return Math.max(0, ...keys.map(key => value && Array.isArray(value[key]) ? value[key].length : 0));
}

function expectedRenderedCountsForSlide(slide = {}) {
  const counts = {};
  const plannedIds = new Set(((slide.componentPlan && slide.componentPlan.components) || [])
    .filter(component => component && component.required !== false)
    .map(component => component.id)
    .concat(((slide.componentPlan && slide.componentPlan.componentIds) || []).filter(id => {
      const component = ((slide.componentPlan && slide.componentPlan.components) || []).find(item => item && item.id === id);
      return !component || component.required !== false;
    }))
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
  set(['quality-scorecard'], Math.max(metricCount, objectArrayLength(slide.oeeComponents, ['items']), slide.oee ? 1 : 0));
  const galleryCount = Math.max(imageCountForSlide(slide), arrayLength(slide, ['cards', 'items']));
  set(['proof-gallery', 'proof-gallery-grid'], galleryCount);
  set(['hero-image'], imageCountForSlide(slide) ? 1 : 0);
  set(['product-matrix'], arrayLength(slide, ['products', 'productStory']));
  set(['equipment-nameplate'], slide.equipment || slide.productionLine || slide.topology || slide.layers ? 1 : 0);
  set(['inspection-matrix'], Math.max(arrayLength(slide, ['inspectionMatrix', 'inspectionRecords', 'rows', 'controls']), arrayLength(slide, ['phases', 'steps']) ? 1 : 0));
  set(['site-evidence-frame'], imageCountForSlide(slide) || slide.siteEvidence || slide.assetReadout ? 1 : 0);
  set(['patient-journey-band'], Math.max(objectArrayLength(slide.serviceBlueprint, ['stages']), arrayLength(slide, ['touchpoints', 'phases']), slide.journeyMap ? 1 : 0));
  set(['service-blueprint-lane'], Math.max(objectArrayLength(slide.serviceBlueprint, ['stages']), arrayLength(slide, ['touchpoints', 'handoffs']), slide.serviceBlueprint ? 1 : 0));
  set(['prototype-frame'], imageCountForSlide(slide) || slide.prototype || slide.prototypeFlow ? 1 : 0);
  set(['workflow-rail'], Math.max(arrayLength(slide, ['steps', 'phases', 'items', 'workflow', 'workflows']), slide.automationWorkflow || slide.platformCapabilities ? 1 : 0));
  set(['permission-audit-tag'], Math.max(arrayLength(slide, ['permissionGovernance', 'permissions', 'risks', 'rows']), slide.auditLog ? 1 : 0));
  set(['adoption-funnel'], Math.max(objectArrayLength(slide.adoptionFunnel, ['steps']), objectArrayLength(slide.activationFunnel, ['steps']), objectArrayLength(slide.cohortFunnel, ['steps']), slide.adoptionFunnel || slide.activationFunnel || slide.cohortFunnel ? 1 : 0));
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
  objectArrayLength,
  renderedCountForComponent
};

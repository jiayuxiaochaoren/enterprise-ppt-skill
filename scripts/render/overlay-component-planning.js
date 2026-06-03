const {
  canonicalComponentId
} = require('./component-capability-manifest');

function plannedComponentsForSlide(s = {}) {
  const components = s.componentPlan && Array.isArray(s.componentPlan.components) ? s.componentPlan.components : [];
  return components.map(component => typeof component === 'string' ? { id: component, required: true } : component)
    .map(component => component && component.id ? Object.assign({}, component, { id: canonicalComponentId(component.id, { preferAlias:true }) }) : component)
    .filter(component => component && component.id);
}

function reportBoardNeedsRightOverlayRail(s = {}) {
  if (String(s.type || '') !== 'report-board') return false;
  const rightRailComponents = new Set([
    'proof-gallery',
    'proof-gallery-grid',
    'risk-register',
    'risk-matrix',
    'governance-table',
    'product-matrix'
  ]);
  return plannedComponentsForSlide(s).some(component =>
    component &&
    component.required !== false &&
    rightRailComponents.has(component.id)
  );
}

module.exports = {
  plannedComponentsForSlide,
  reportBoardNeedsRightOverlayRail
};

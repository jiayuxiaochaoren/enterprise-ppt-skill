const {
  componentCapabilityFor
} = require('../render/component-capability-manifest');

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

function componentConsumptionAuditFromRender(normalized = {}, renderMetaResult = {}) {
  const slides = normalized.slides || [];
  const findings = [];
  const renderMeta = renderMetaResult.meta;
  const plannedRequired = slides.flatMap((slide, i) => {
    const components = slide.componentPlan && Array.isArray(slide.componentPlan.components) ? slide.componentPlan.components : [];
    return components
      .filter(component => component.required !== false)
      .map(component => ({ slide:i + 1, id:component.id }));
  });
  if (!renderMeta) {
    if (plannedRequired.length) {
      findings.push({
        level:'fail',
        type:'renderMetaMissing',
        message: renderMetaResult.error || 'render metadata sidecar is missing; component consumption cannot be verified'
      });
    }
    return {
      version:'component-consumption-audit/v1',
      status: findings.length ? 'fail' : 'pass',
      renderMeta: renderMetaResult.file || '',
      checkedComponents: plannedRequired.length,
      findings
    };
  }
  const renderedBySlide = new Map((renderMeta.slides || []).map(slide => [Number(slide.slide), slide]));
  const expectedCountsBySlide = new Map(slides.map((slide, i) => [i + 1, expectedRenderedCountsForSlide(slide)]));
  plannedRequired.forEach(component => {
    const rendered = renderedBySlide.get(component.slide);
    const consumed = rendered && Array.isArray(rendered.consumedComponents)
      ? rendered.consumedComponents.find(item => item.id === component.id && item.rendered)
      : null;
    if (!consumed) {
      findings.push({
        slide: component.slide,
        level:'fail',
        type:'componentNotConsumed',
        message:`planned required component was not consumed by renderer: ${component.id}`
      });
    }
  });
  (renderMeta.slides || []).forEach(slide => {
    const expectedCounts = expectedCountsBySlide.get(Number(slide.slide)) || {};
    const plannedById = new Map((slide.plannedComponents || []).map(component => [component.id, component]));
    Object.entries(expectedCounts).forEach(([id, expected]) => {
      if (!expected) return;
      const consumed = (slide.consumedComponents || []).find(component => component.id === id && component.rendered);
      const drawn = (slide.drawnComponents || []).find(component => component.id === id);
      const actual = Number(
        (consumed && consumed.drawnCount != null ? consumed.drawnCount : null) ??
        (consumed && consumed.itemCount != null ? consumed.itemCount : null) ??
        (drawn && drawn.drawnCount != null ? drawn.drawnCount : null) ??
        (drawn && drawn.itemCount != null ? drawn.itemCount : null) ??
        (consumed && consumed.rendered && expected <= 1 ? 1 : 0)
      );
      if (actual < expected) {
        findings.push({
          slide: slide.slide,
          level:'fail',
          type:'renderedCountMismatch',
          message:`component ${id} rendered ${actual}/${expected} expected items`
        });
      }
    });
    (slide.unknownComponents || []).forEach(component => {
      findings.push({
        slide: slide.slide,
        level:'fail',
        type:'unknownComponentId',
        message:`renderer received unknown component id: ${component.id}`
      });
    });
    (slide.consumedComponents || []).forEach(component => {
      const planned = plannedById.get(component.id) || {};
      const allowedModes = planned.allowedModes || planned.supportedModes || [];
      const actualMode = component.mode === 'native-renderer'
        ? 'native'
        : (component.mode === 'overlay' ? 'overlay' : '');
      const capability = componentCapabilityFor(component.id);
      const manifestModes = capability && Array.isArray(capability.supportedModes) ? capability.supportedModes : [];
      if (component.rendered && actualMode && manifestModes.length && !manifestModes.includes(actualMode)) {
        findings.push({
          slide: slide.slide,
          level:'fail',
          type:'componentModeMismatch',
          message:`component ${component.id} rendered as ${actualMode}, but capability manifest allows ${manifestModes.join(',')}`
        });
      }
      if (component.rendered && actualMode && Array.isArray(allowedModes) && allowedModes.length && !allowedModes.includes(actualMode)) {
        findings.push({
          slide: slide.slide,
          level:'fail',
          type:'componentModeMismatch',
          message:`component ${component.id} rendered as ${actualMode}, but allowed modes are ${allowedModes.join(',')}`
        });
      }
      if (component.mode === 'native-renderer' && component.rendered) {
        const hasEvidence = component.nativeSlot && component.bbox && component.rendererMethod && Number(component.drawnCount || 0) > 0;
        if (!hasEvidence) {
          findings.push({
            slide: slide.slide,
            level:'fail',
            type:'nativeComponentEvidenceMissing',
            message:`native component ${component.id} was marked rendered without drawnCount/nativeSlot/bbox/rendererMethod evidence`
          });
        }
        const drawn = (slide.drawnComponents || []).find(item => item.id === component.id);
        const drawnEvidence = drawn && drawn.nativeSlot && drawn.bbox && drawn.rendererMethod && Number(drawn.drawnCount || 0) > 0;
        if (!drawnEvidence) {
          findings.push({
            slide: slide.slide,
            level:'fail',
            type:'nativeComponentDrawnEvidenceMissing',
            message:`native component ${component.id} was consumed without matching drawnComponents evidence`
          });
        }
      }
      if (component.mode === 'native-claimed-undrawn') {
        findings.push({
          slide: slide.slide,
          level: component.required === false ? 'review' : 'fail',
          type:'nativeComponentClaimedButUndrawn',
          message:`native component ${component.id} was declared owned but no drawn evidence was recorded`
        });
      }
    });
    (slide.missingRequiredComponents || []).forEach(id => {
      if (!findings.some(f => f.slide === slide.slide && f.message.includes(id))) {
        findings.push({
          slide: slide.slide,
          level:'fail',
          type:'componentNotConsumed',
          message:`renderer reported missing required component: ${id}`
        });
      }
    });
  });
  return {
    version:'component-consumption-audit/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    renderMeta: renderMetaResult.file || '',
    checkedComponents: plannedRequired.length,
    findings
  };
}

module.exports = {
  componentConsumptionAuditFromRender,
  expectedRenderedCountsForSlide
};

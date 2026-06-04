const {
  expectedRenderedCountsForSlide,
  renderedCountForComponent
} = require('./component-consumption-counts');
const {
  modeFindingsForComponent
} = require('./component-consumption-mode-policy');
const {
  nativeEvidenceFindingsForComponent
} = require('./component-consumption-native-evidence');

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
      const actual = renderedCountForComponent(consumed, drawn, expected);
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
      findings.push(...modeFindingsForComponent(slide.slide, component, planned));
      findings.push(...nativeEvidenceFindingsForComponent(slide, component));
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

const {
  chainsShareIdentity,
  industryEvidenceChainShapeIssues,
  normalizeIndustryEvidenceChainId,
  normalizeIndustryEvidenceChainShape
} = require('../design/industry-evidence-chain');
const {
  hasSourceEvidence,
  hasSourceTraceRefs,
  hasVisibleSourceNote,
  sourceTraceIsExplainable
} = require('../design/source-evidence');

function hasValue(value) {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return String(value).trim() !== '';
}

function hasFieldPath(source = {}, field = '') {
  const parts = String(field || '').split('.').filter(Boolean);
  if (!parts.length) return false;
  let current = source;
  for (const part of parts) {
    if (Array.isArray(current)) {
      current = current.map(item => item && item[part]).filter(hasValue);
      if (!current.length) return false;
      continue;
    }
    if (!current || typeof current !== 'object' || !hasValue(current[part])) return false;
    current = current[part];
  }
  return hasValue(current);
}

function plannedIdsForSlide(slide = {}) {
  const componentPlan = slide.componentPlan || {};
  return [
    ...(Array.isArray(componentPlan.componentIds) ? componentPlan.componentIds : []),
    ...(Array.isArray(componentPlan.components) ? componentPlan.components.map(component => component && component.id) : [])
  ].filter(Boolean);
}

function plannedComponentsForSlide(slide = {}) {
  const componentPlan = slide.componentPlan || {};
  const components = Array.isArray(componentPlan.components) ? componentPlan.components : [];
  if (components.length) return components.filter(component => component && component.id);
  return (Array.isArray(componentPlan.componentIds) ? componentPlan.componentIds : [])
    .filter(Boolean)
    .map(id => ({ id, source: 'componentIds' }));
}

function renderedSlideFor(renderMeta = null, slideNumber = 1) {
  if (!renderMeta || !Array.isArray(renderMeta.slides)) return null;
  return renderMeta.slides.find(slide => Number(slide.slide) === Number(slideNumber)) || renderMeta.slides[slideNumber - 1] || null;
}

function consumedIdsForSlide(rendered = null) {
  if (!rendered || !Array.isArray(rendered.consumedComponents)) return [];
  return rendered.consumedComponents.filter(component => component && component.rendered).map(component => component.id).filter(Boolean);
}

function consumedComponentForSlide(rendered = null, id = '') {
  if (!rendered || !Array.isArray(rendered.consumedComponents)) return null;
  return rendered.consumedComponents.find(component => component && component.id === id) || null;
}

function knownIndustry(plan = {}, slide = {}) {
  return normalizeIndustryEvidenceChainId(plan.industry, slide) !== 'neutral-general';
}

function crossIndustryFindings(slideNo, chain = {}, planned = []) {
  const findings = [];
  const plannedSet = new Set(planned);
  const nonConsumer = new Set([
    'industrial-manufacturing',
    'energy-infrastructure',
    'finance-investment',
    'healthcare-operations',
    'saas-technology',
    'public-sector',
    'people-culture'
  ]);
  if (nonConsumer.has(chain.chainId) && plannedSet.has('product-matrix')) {
    findings.push({
      slide: slideNo,
      level: 'fail',
      type: 'crossIndustryComponentMismatch',
      message: `${chain.chainLabel || chain.chainId} slide was planned with consumer product-matrix`
    });
  }
  if (chain.chainId === 'consumer-beauty') {
    ['equipment-nameplate', 'inspection-matrix', 'patient-journey-band', 'service-blueprint-lane', 'permission-audit-tag'].forEach(id => {
      if (plannedSet.has(id)) {
        findings.push({
          slide: slideNo,
          level: 'fail',
          type: 'crossIndustryComponentMismatch',
          message: `consumer/beauty slide was planned with non-consumer component: ${id}`
        });
      }
    });
  }
  return findings;
}

function chainIdentity(chain = {}) {
  return `${chain.chainId || 'unknown-chain'} / ${chain.stageId || 'unknown-stage'}`;
}

function componentSetDiffers(a = {}, b = {}) {
  const left = new Set(Array.isArray(a.components) ? a.components : []);
  const right = new Set(Array.isArray(b.components) ? b.components : []);
  if (left.size !== right.size) return true;
  for (const id of left) if (!right.has(id)) return true;
  return false;
}

function inputChainFindings({ canonical = {}, slide = {}, slideNo = 1, suppliedRaw = null, supplied = null } = {}) {
  const findings = [];
  if (suppliedRaw) {
    const issues = industryEvidenceChainShapeIssues(suppliedRaw);
    if (issues.length) {
      findings.push({
        slide: slideNo,
        level: 'fail',
        type: 'industryEvidenceChainInvalid',
        message: `input componentPlan.industryEvidenceChain is malformed: ${issues.join(', ')}`
      });
    }
  }
  if (supplied && canonical) {
    if (canonical.stageId === 'neutral-general') {
      if (supplied.stageId !== 'neutral-general' || supplied.chainId !== 'neutral-general') {
        findings.push({
          slide: slideNo,
          level: 'review',
          type: 'industryEvidenceChainInputSuppressed',
          message: `input componentPlan.industryEvidenceChain ${chainIdentity(supplied)} was suppressed because canonical inference is neutral/general`
        });
      }
    } else if (!chainsShareIdentity(supplied, canonical)) {
      findings.push({
        slide: slideNo,
        level: 'fail',
        type: 'industryEvidenceChainMismatch',
        message: `input componentPlan.industryEvidenceChain ${chainIdentity(supplied)} differs from canonical ${chainIdentity(canonical)}`
      });
    } else if (componentSetDiffers(supplied, canonical)) {
      findings.push({
        slide: slideNo,
        level: 'review',
        type: 'industryEvidenceChainComponentMismatch',
        message: `input componentPlan.industryEvidenceChain components differ from canonical ${chainIdentity(canonical)}`
      });
    }
  }
  if (slide.previousIndustryEvidenceChain) {
    const previousIssues = industryEvidenceChainShapeIssues(slide.previousIndustryEvidenceChain);
    if (previousIssues.length) {
      findings.push({
        slide: slideNo,
        level: 'review',
        type: 'previousIndustryEvidenceChainInvalid',
        message: `previousIndustryEvidenceChain is malformed: ${previousIssues.join(', ')}`
      });
    }
    const previous = normalizeIndustryEvidenceChainShape(slide.previousIndustryEvidenceChain);
    if (previous && canonical && !chainsShareIdentity(previous, canonical)) {
      findings.push({
        slide: slideNo,
        level: 'review',
        type: 'industryEvidenceChainStale',
        message: `previousIndustryEvidenceChain ${chainIdentity(previous)} was suppressed; canonical chain is ${chainIdentity(canonical)}`
      });
    } else if (previous && canonical && canonical.stageId !== 'neutral-general' && !previousIssues.length && componentSetDiffers(previous, canonical)) {
      findings.push({
        slide: slideNo,
        level: 'review',
        type: 'previousIndustryEvidenceChainComponentMismatch',
        message: `previousIndustryEvidenceChain components differ from canonical ${chainIdentity(canonical)}`
      });
    }
  }
  return findings;
}

module.exports = {
  consumedComponentForSlide,
  consumedIdsForSlide,
  crossIndustryFindings,
  hasSourceEvidence,
  hasSourceTraceRefs,
  hasVisibleSourceNote,
  hasFieldPath,
  inputChainFindings,
  knownIndustry,
  plannedComponentsForSlide,
  plannedIdsForSlide,
  renderedSlideFor,
  sourceTraceIsExplainable
};

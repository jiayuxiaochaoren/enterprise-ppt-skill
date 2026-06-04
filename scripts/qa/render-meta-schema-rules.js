const {
  componentAliasTargetFor,
  isComponentAlias
} = require('../render/component-capability-manifest');
const {
  RENDER_META_SCHEMA_CONTRACT
} = require('./contract-registry');

function normalizedValues(value) {
  const raw = Array.isArray(value) ? value : [value];
  return [...new Set(raw
    .map(item => String(item || '').trim())
    .filter(Boolean))];
}

function auditRenderMetaRoot(renderMeta = {}, expectedSlideCount = 0, findings = []) {
  if (renderMeta.version !== 'render-meta/v1') {
    findings.push({ level:'fail', type:'renderMetaVersionInvalid', message:'render meta version must be render-meta/v1' });
  }
  if (!Array.isArray(renderMeta.slides)) {
    findings.push({ level:'fail', type:'renderMetaSlidesMissing', message:'render meta must contain slides[]' });
    return false;
  }
  if (expectedSlideCount && renderMeta.slides.length !== expectedSlideCount) {
    findings.push({ level:'fail', type:'renderMetaSlideCountMismatch', message:`render meta has ${renderMeta.slides.length} slide records for ${expectedSlideCount} PPT slides` });
  }
  if (Number.isFinite(Number(renderMeta.slideCount)) && Number(renderMeta.slideCount) !== renderMeta.slides.length) {
    findings.push({ level:'fail', type:'renderMetaDeclaredSlideCountMismatch', message:'render meta slideCount does not match slides[] length' });
  }
  return true;
}

function slideNumberFor(slide = {}, index = 0, findings = []) {
  const slideNo = Number(slide.slide || index + 1);
  if (!Number.isFinite(slideNo) || slideNo < 1) {
    findings.push({ slide:index + 1, level:'fail', type:'renderMetaSlideNumberInvalid', message:'slide record must include a positive slide number' });
  }
  return slideNo;
}

function auditSlideBaseFields(slide = {}, slideNo, findings = []) {
  if (!slide.type) {
    findings.push({ slide:slideNo, level:'fail', type:'renderMetaSlideTypeMissing', message:'slide record must include type' });
  }
  RENDER_META_SCHEMA_CONTRACT.slideArrays.forEach(field => {
    if (!Array.isArray(slide[field])) {
      findings.push({ slide:slideNo, level:'fail', type:'renderMetaComponentArrayMissing', message:`${field} must be an array` });
    }
  });
}

function auditRendererMatchAndRoute(slide = {}, slideNo, findings = []) {
  const renderer = slide.rendererMatch || {};
  const allowedMatchKinds = new Set(RENDER_META_SCHEMA_CONTRACT.allowedRendererMatchKinds);
  RENDER_META_SCHEMA_CONTRACT.rendererMatchFields.forEach(field => {
    if (!renderer[field]) {
      findings.push({ slide:slideNo, level:'fail', type:'renderMetaRendererFieldMissing', message:`rendererMatch.${field} is required` });
    }
  });
  if (renderer.matchKind && !allowedMatchKinds.has(renderer.matchKind)) {
    findings.push({ slide:slideNo, level:'fail', type:'renderMetaRendererMatchKindInvalid', message:`unsupported renderer match kind: ${renderer.matchKind}` });
  }
  if (renderer.matchKind === 'fallback') {
    findings.push({ slide:slideNo, level:'review', type:'fallbackRendererUsed', message:`fallback renderer used for slide type ${renderer.requestedType || slide.type || 'unknown'}` });
  }

  const renderRoute = slide.renderRoute || {};
  if (renderRoute.version !== 'render-route/v1') {
    findings.push({ slide:slideNo, level:'fail', type:'renderMetaRenderRouteMissing', message:'renderRoute v1 is required on every slide' });
    return;
  }
  RENDER_META_SCHEMA_CONTRACT.renderRouteFields.forEach(field => {
    if (!renderRoute[field]) {
      findings.push({ slide:slideNo, level:'fail', type:'renderMetaRenderRouteFieldMissing', message:`renderRoute.${field} is required` });
    }
  });
  if (renderRoute.renderer && renderer.rendererId && renderRoute.renderer.id && renderRoute.renderer.id !== renderer.rendererId) {
    findings.push({ slide:slideNo, level:'fail', type:'renderMetaRenderRouteFieldMissing', message:'renderRoute.renderer.id must match rendererMatch.rendererId' });
  }
}

function auditPlannedComponents(slide = {}, slideNo, findings = []) {
  (slide.plannedComponents || []).forEach(component => {
    if (isComponentAlias(component.id)) {
      findings.push({ slide:slideNo, level:'fail', type:'renderMetaComponentAliasNotCanonical', message:`plannedComponents.${component.id} must be normalized to ${componentAliasTargetFor(component.id)}` });
    }
    RENDER_META_SCHEMA_CONTRACT.plannedComponentFields.forEach(field => {
      if (component[field] == null || (Array.isArray(component[field]) && !component[field].length)) {
        findings.push({ slide:slideNo, level:'fail', type:'renderMetaComponentContractFieldMissing', message:`plannedComponents.${component.id || 'unknown'}.${field} is required` });
      }
    });
  });
}

function auditDrawnComponents(slide = {}, slideNo, findings = []) {
  (slide.drawnComponents || []).forEach(component => {
    RENDER_META_SCHEMA_CONTRACT.drawnComponentFields.forEach(field => {
      if (!component[field]) {
        findings.push({ slide:slideNo, level:'fail', type:'renderMetaDrawnComponentFieldMissing', message:`drawnComponents.${component.id || 'unknown'}.${field} is required` });
      }
    });
    if (Number(component.drawnCount || 0) <= 0) {
      findings.push({ slide:slideNo, level:'fail', type:'renderMetaDrawnComponentFieldMissing', message:`drawnComponents.${component.id || 'unknown'}.drawnCount must be greater than 0` });
    }
  });
}

function auditConsumedNativeEvidence(slide = {}, slideNo, findings = []) {
  (slide.consumedComponents || []).forEach(component => {
    if (component.mode !== 'native-renderer' || !component.rendered) return;
    RENDER_META_SCHEMA_CONTRACT.consumedNativeEvidenceFields.forEach(field => {
      if (!component[field]) {
        findings.push({ slide:slideNo, level:'fail', type:'renderMetaConsumedComponentEvidenceMissing', message:`consumedComponents.${component.id || 'unknown'}.${field} is required for native renderer evidence` });
      }
    });
  });
}

function auditComponentEvidence(slide = {}, slideNo, findings = []) {
  auditPlannedComponents(slide, slideNo, findings);
  auditDrawnComponents(slide, slideNo, findings);
  auditConsumedNativeEvidence(slide, slideNo, findings);
}

function assetFieldMissing(asset = {}, field) {
  const value = asset[field];
  if (field === 'boundAssetCount') return value == null;
  return Array.isArray(value) ? value.length === 0 : !value;
}

function auditAssetDecision(slide = {}, slideNo, findings = []) {
  const asset = slide.assetDecision || {};
  if (asset.version !== 'asset-decision/v1') {
    findings.push({ slide:slideNo, level:'fail', type:'renderMetaAssetDecisionMissing', message:'assetDecision v1 is required on every slide' });
    return;
  }
  RENDER_META_SCHEMA_CONTRACT.assetDecisionFields.forEach(field => {
    if (assetFieldMissing(asset, field)) {
      findings.push({ slide:slideNo, level:'fail', type:'renderMetaAssetDecisionFieldMissing', message:`assetDecision.${field} is required` });
    }
  });
  if (asset.status === 'bound' && Number(asset.boundAssetCount || 0) < 1) {
    findings.push({ slide:slideNo, level:'fail', type:'renderMetaBoundAssetMissing', message:'assetDecision.status is bound but no bound asset refs are recorded' });
  }
  auditMixedAssetDecision(asset, slideNo, findings);
  if (asset.status === 'blocked' && asset.mode !== 'blocked') {
    findings.push({ slide:slideNo, level:'fail', type:'renderMetaBlockedAssetModeInvalid', message:'blocked asset decisions must use mode=blocked' });
  }
  if (asset.generatedAssetPrompt && Number(asset.boundAssetCount || 0) < 1 && !['pending-generation', 'needs-generation'].includes(asset.mode)) {
    findings.push({ slide:slideNo, level:'fail', type:'renderMetaGeneratedPromptModeInvalid', message:'unbound generated prompts must remain auditable as pending generation' });
  }
  if (asset.skippedCriticalVisual === true) {
    findings.push({
      slide: slideNo,
      level:'review',
      type:'skippedCriticalAsset',
      message:`critical visual role ${asset.originalRole || asset.resolvedRole || 'unknown'} was skipped by asset decision`
    });
  }
}

function auditMixedAssetDecision(asset = {}, slideNo, findings = []) {
  const provenanceClasses = normalizedValues(asset.provenanceClasses);
  if (String(asset.provenanceClass || '').trim() === 'mixed' && provenanceClasses.length < 2) {
    findings.push({
      slide:slideNo,
      level:'fail',
      type:'renderMetaAssetDecisionMixedDetailMissing',
      message:'assetDecision.provenanceClass=mixed requires provenanceClasses[] with at least two concrete classes'
    });
  }
  const proofEligibility = normalizedValues(asset.proofEligibility);
  const proofSummary = String(asset.proofEligibilitySummary || '').trim();
  if (
    (proofSummary === 'mixed' || proofEligibility.includes('mixed')) &&
    proofEligibility.filter(value => value !== 'mixed').length < 2
  ) {
    findings.push({
      slide:slideNo,
      level:'fail',
      type:'renderMetaAssetDecisionMixedDetailMissing',
      message:'mixed proof eligibility requires proofEligibility[] with at least two concrete values'
    });
  }
}

function collectRenderMetaSchemaFindings(renderMeta = {}, expectedSlideCount = 0) {
  const findings = [];
  if (!auditRenderMetaRoot(renderMeta, expectedSlideCount, findings)) return findings;
  renderMeta.slides.forEach((slide, index) => {
    const slideNo = slideNumberFor(slide, index, findings);
    auditSlideBaseFields(slide, slideNo, findings);
    auditRendererMatchAndRoute(slide, slideNo, findings);
    auditComponentEvidence(slide, slideNo, findings);
    auditAssetDecision(slide, slideNo, findings);
  });
  return findings;
}

module.exports = {
  auditAssetDecision,
  auditComponentEvidence,
  auditRendererMatchAndRoute,
  auditRenderMetaRoot,
  auditSlideBaseFields,
  collectRenderMetaSchemaFindings,
  normalizedValues
};

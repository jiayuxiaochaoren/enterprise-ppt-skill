const {
  componentAliasTargetFor,
  isComponentAlias
} = require('../render/component-capability-manifest');

function normalizedValues(value) {
  const raw = Array.isArray(value) ? value : [value];
  return [...new Set(raw
    .map(item => String(item || '').trim())
    .filter(Boolean))];
}

function renderMetaSchemaAuditFromRender(renderMetaResult = {}, expectedSlideCount = 0) {
  const findings = [];
  const renderMeta = renderMetaResult.meta;
  if (!renderMeta) {
    findings.push({
      level: renderMetaResult.file ? 'fail' : 'review',
      type: renderMetaResult.file ? 'renderMetaUnreadable' : 'renderMetaMissing',
      message: renderMetaResult.error || 'render metadata sidecar is missing'
    });
    return {
      version:'render-meta-schema-audit/v1',
      schema:'render-meta/v1',
      status: findings.some(f => f.level === 'fail') ? 'fail' : 'review',
      renderMeta: renderMetaResult.file || '',
      findings
    };
  }
  if (renderMeta.version !== 'render-meta/v1') {
    findings.push({ level:'fail', type:'renderMetaVersionInvalid', message:'render meta version must be render-meta/v1' });
  }
  if (!Array.isArray(renderMeta.slides)) {
    findings.push({ level:'fail', type:'renderMetaSlidesMissing', message:'render meta must contain slides[]' });
  } else {
    if (expectedSlideCount && renderMeta.slides.length !== expectedSlideCount) {
      findings.push({ level:'fail', type:'renderMetaSlideCountMismatch', message:`render meta has ${renderMeta.slides.length} slide records for ${expectedSlideCount} PPT slides` });
    }
    if (Number.isFinite(Number(renderMeta.slideCount)) && Number(renderMeta.slideCount) !== renderMeta.slides.length) {
      findings.push({ level:'fail', type:'renderMetaDeclaredSlideCountMismatch', message:'render meta slideCount does not match slides[] length' });
    }
    const allowedMatchKinds = new Set(['exact', 'alias', 'fallback', 'industry-override']);
    renderMeta.slides.forEach((slide, i) => {
      const slideNo = Number(slide.slide || i + 1);
      if (!Number.isFinite(slideNo) || slideNo < 1) {
        findings.push({ slide:i + 1, level:'fail', type:'renderMetaSlideNumberInvalid', message:'slide record must include a positive slide number' });
      }
      if (!slide.type) {
        findings.push({ slide:slideNo, level:'fail', type:'renderMetaSlideTypeMissing', message:'slide record must include type' });
      }
      const renderer = slide.rendererMatch || {};
      ['requestedType', 'matchedType', 'matchKind', 'rendererId', 'rendererName', 'source'].forEach(field => {
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
      ['plannedComponents', 'unknownComponents', 'drawnComponents', 'consumedComponents', 'missingRequiredComponents', 'textBoxes'].forEach(field => {
        if (!Array.isArray(slide[field])) {
          findings.push({ slide:slideNo, level:'fail', type:'renderMetaComponentArrayMissing', message:`${field} must be an array` });
        }
      });
      (slide.plannedComponents || []).forEach(component => {
        if (isComponentAlias(component.id)) {
          findings.push({ slide:slideNo, level:'fail', type:'renderMetaComponentAliasNotCanonical', message:`plannedComponents.${component.id} must be normalized to ${componentAliasTargetFor(component.id)}` });
        }
        ['id', 'allowedModes', 'slotPolicy', 'repairPolicy', 'priority'].forEach(field => {
          if (component[field] == null || (Array.isArray(component[field]) && !component[field].length)) {
            findings.push({ slide:slideNo, level:'fail', type:'renderMetaComponentContractFieldMissing', message:`plannedComponents.${component.id || 'unknown'}.${field} is required` });
          }
        });
      });
      (slide.drawnComponents || []).forEach(component => {
        ['id', 'nativeSlot', 'bbox', 'rendererMethod'].forEach(field => {
          if (!component[field]) {
            findings.push({ slide:slideNo, level:'fail', type:'renderMetaDrawnComponentFieldMissing', message:`drawnComponents.${component.id || 'unknown'}.${field} is required` });
          }
        });
        if (Number(component.drawnCount || 0) <= 0) {
          findings.push({ slide:slideNo, level:'fail', type:'renderMetaDrawnComponentFieldMissing', message:`drawnComponents.${component.id || 'unknown'}.drawnCount must be greater than 0` });
        }
      });
      (slide.consumedComponents || []).forEach(component => {
        if (component.mode !== 'native-renderer' || !component.rendered) return;
        ['nativeSlot', 'bbox', 'rendererMethod'].forEach(field => {
          if (!component[field]) {
            findings.push({ slide:slideNo, level:'fail', type:'renderMetaConsumedComponentEvidenceMissing', message:`consumedComponents.${component.id || 'unknown'}.${field} is required for native renderer evidence` });
          }
        });
      });
      const asset = slide.assetDecision || {};
      if (asset.version !== 'asset-decision/v1') {
        findings.push({ slide:slideNo, level:'fail', type:'renderMetaAssetDecisionMissing', message:'assetDecision v1 is required on every slide' });
      } else {
        ['status', 'mode', 'action', 'reason', 'riskLevel', 'originalRole', 'resolvedRole', 'provenanceClass', 'proofEligibility', 'boundAssetCount'].forEach(field => {
          const value = asset[field];
          const missing = field === 'boundAssetCount'
            ? value == null
            : (Array.isArray(value) ? value.length === 0 : !value);
          if (missing) {
            findings.push({ slide:slideNo, level:'fail', type:'renderMetaAssetDecisionFieldMissing', message:`assetDecision.${field} is required` });
          }
        });
        if (asset.status === 'bound' && Number(asset.boundAssetCount || 0) < 1) {
          findings.push({ slide:slideNo, level:'fail', type:'renderMetaBoundAssetMissing', message:'assetDecision.status is bound but no bound asset refs are recorded' });
        }
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
    });
  }
  return {
    version:'render-meta-schema-audit/v1',
    schema:'render-meta/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    renderMeta: renderMetaResult.file || '',
    findings
  };
}

module.exports = {
  renderMetaSchemaAuditFromRender
};

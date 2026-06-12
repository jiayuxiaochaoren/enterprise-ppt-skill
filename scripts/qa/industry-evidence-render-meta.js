function hasText(value) {
  return value != null && String(value).trim() !== '';
}

function countFor(component = {}) {
  return Math.max(
    Number(component.drawnCount || 0),
    Number(component.itemCount || 0)
  );
}

function hasVisibleBBox(bbox = null) {
  return Boolean(
    bbox &&
    Number(bbox.w || 0) > 0 &&
    Number(bbox.h || 0) > 0
  );
}

function chainMetaMatches(component = {}, chain = {}) {
  const meta = component.industryEvidenceChain || {};
  return meta.chainId === chain.chainId &&
    meta.stageId === chain.stageId &&
    component.chainStage === chain.stageId &&
    hasText(component.chainStageLabel) &&
    hasText(component.evidenceReason);
}

function hasConcreteRendererEvidence(component = {}) {
  const method = String(component.rendererMethod || '');
  const module = String(component.rendererModule || '');
  if (method === 'nativeDrawnEvidenceFor') return true;
  if (/^drawIndustryComponent:/.test(method)) return true;
  return /industry-components|industry|components\//.test(module) && hasText(method);
}

function renderMetaFieldFindings(slideNo, chain = {}, componentId = '', component = {}, scope = 'consumedComponents') {
  const findings = [];
  if (!chainMetaMatches(component, chain)) {
    findings.push({
      slide: slideNo,
      level: 'fail',
      type: 'industryEvidenceRenderMetaFieldMissing',
      message: `${scope}.${componentId} is missing chainStage, chainStageLabel, evidenceReason, or industryEvidenceChain ids`
    });
  }
  if (!hasVisibleBBox(component.bbox)) {
    findings.push({
      slide: slideNo,
      level: 'fail',
      type: 'industryEvidenceComponentBboxMissing',
      message: `${scope}.${componentId} is missing a visible bbox`
    });
  }
  if (countFor(component) <= 0) {
    findings.push({
      slide: slideNo,
      level: 'fail',
      type: 'industryEvidenceComponentDrawCountMissing',
      message: `${scope}.${componentId} is missing drawnCount/itemCount evidence`
    });
  }
  return findings;
}

function industryRenderMetaFindingsForComponent(slideNo, chain = {}, componentId = '', rendered = {}, consumed = null) {
  const findings = [];
  if (!consumed || !consumed.rendered) return findings;
  findings.push(...renderMetaFieldFindings(slideNo, chain, componentId, consumed));
  if (consumed.mode !== 'native-renderer') return findings;
  const drawn = (rendered.drawnComponents || []).find(component => component.id === componentId);
  if (!drawn) {
    findings.push({
      slide: slideNo,
      level: 'fail',
      type: 'industryNativeDrawnEvidenceMissing',
      message: `native industry component ${componentId} was consumed without drawnComponents evidence`
    });
    return findings;
  }
  findings.push(...renderMetaFieldFindings(slideNo, chain, componentId, drawn, 'drawnComponents'));
  if (!hasConcreteRendererEvidence(drawn)) {
    findings.push({
      slide: slideNo,
      level: 'fail',
      type: 'industryNativeDrawnEvidenceMissing',
      message: `native industry component ${componentId} must expose nativeDrawnEvidenceFor or explicit industry renderer evidence`
    });
  }
  return findings;
}

module.exports = {
  industryRenderMetaFindingsForComponent
};

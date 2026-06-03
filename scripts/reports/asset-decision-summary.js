const {
  addCount,
  safeCount
} = require('./report-utils');

function normalizedValues(value) {
  const raw = Array.isArray(value) ? value : [value];
  return [...new Set(raw
    .map(item => String(item || '').trim())
    .filter(Boolean))];
}

function provenanceDetailValues(decision = {}) {
  const classes = normalizedValues(decision.provenanceClasses);
  if (classes.length) return classes;
  return normalizedValues(decision.provenanceClass || 'unknown');
}

function proofDetailValues(decision = {}) {
  const proof = normalizedValues(decision.proofEligibility);
  if (proof.length) return proof;
  return normalizedValues(decision.proofEligibilitySummary || 'unknown');
}

function primaryProofEligibility(decision = {}) {
  if (Array.isArray(decision.proofEligibility)) {
    return decision.proofEligibility[0] || decision.proofEligibilitySummary || 'unknown';
  }
  return decision.proofEligibility || decision.proofEligibilitySummary || 'unknown';
}

function assetDecisionSummary(renderMeta = {}) {
  const slides = Array.isArray(renderMeta.slides) ? renderMeta.slides : [];
  const summary = {
    version: 'asset-decision-summary/v1',
    slideCount: slides.length,
    boundAssetCount: 0,
    byAction: {},
    byAuthorizationStatus: {},
    byRiskLevel: {},
    byProvenanceClass: {},
    byProvenanceClassDetail: {},
    byProofEligibility: {},
    byProofEligibilityDetail: {},
    mixedProvenanceSlides: [],
    mixedProofEligibilitySlides: [],
    skippedCriticalVisuals: [],
    reviewRequiredCount: 0
  };
  slides.forEach((slide, index) => {
    const decision = slide.assetDecision || {};
    const slideNo = Number(slide.slide || index + 1);
    const provenanceDetails = provenanceDetailValues(decision);
    const proofDetails = proofDetailValues(decision);
    summary.boundAssetCount += safeCount(decision.boundAssetCount);
    addCount(summary.byAction, decision.action || decision.status || 'unknown');
    addCount(summary.byAuthorizationStatus, decision.authorizationStatus || 'none');
    addCount(summary.byRiskLevel, decision.riskLevel || 'unknown');
    addCount(summary.byProvenanceClass, decision.provenanceClass || 'unknown');
    provenanceDetails.forEach(value => addCount(summary.byProvenanceClassDetail, value));
    addCount(summary.byProofEligibility, primaryProofEligibility(decision));
    proofDetails.forEach(value => addCount(summary.byProofEligibilityDetail, value));
    if ((decision.provenanceClass || '').trim() === 'mixed' || provenanceDetails.length > 1) {
      summary.mixedProvenanceSlides.push({
        slide: slideNo,
        provenanceClass: decision.provenanceClass || '',
        provenanceClasses: provenanceDetails,
        authorizationStatus: decision.authorizationStatus || '',
        boundAssetCount: safeCount(decision.boundAssetCount)
      });
    }
    if (primaryProofEligibility(decision) === 'mixed' || proofDetails.length > 1) {
      summary.mixedProofEligibilitySlides.push({
        slide: slideNo,
        proofEligibility: proofDetails,
        proofEligibilitySummary: decision.proofEligibilitySummary || ''
      });
    }
    if (decision.skippedCriticalVisual) {
      summary.skippedCriticalVisuals.push({
        slide: slideNo,
        originalRole: decision.originalRole || '',
        resolvedRole: decision.resolvedRole || '',
        reason: decision.reason || ''
      });
    }
    if (decision.reviewRequired) summary.reviewRequiredCount += 1;
  });
  return summary;
}

module.exports = {
  assetDecisionSummary
};

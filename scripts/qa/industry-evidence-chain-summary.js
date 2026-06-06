function statusForFindings(findings = []) {
  if (findings.some(finding => finding.level === 'fail')) return 'fail';
  if (findings.some(finding => finding.level === 'review')) return 'review';
  return 'pass';
}

function unique(values = []) {
  return [...new Set((values || []).filter(Boolean).map(value => String(value)))];
}

function compactFinding(finding = null) {
  if (!finding) return null;
  return {
    level: finding.level || '',
    type: finding.type || '',
    slide: finding.slide || null,
    chainId: finding.chainId || '',
    message: finding.message || ''
  };
}

function buildIndustryEvidenceChainSummary({
  effective = {},
  findings = [],
  metrics = {},
  sampleId = '',
  slideAudits = []
} = {}) {
  const blocking = findings.find(finding => finding.level === 'fail') ||
    findings.find(finding => finding.level === 'review') ||
    null;
  const chainMismatchFindings = findings.filter(finding => finding.type === 'industryEvidenceChainMismatch' || finding.type === 'industryEvidenceChainInvalid');
  const chainMismatchSlides = unique(chainMismatchFindings.map(finding => finding.slide).filter(Boolean)).length;
  return {
    version: 'industry-evidence-chain-summary/v1',
    sampleId,
    industry: effective.industry || '',
    status: statusForFindings(findings),
    slideCount: slideAudits.length,
    stageCoverage: metrics.stageCoverage || {},
    componentHits: metrics.componentHits || 0,
    consumedHits: metrics.consumedHits || 0,
    keyComponents: unique(slideAudits.flatMap(slide => slide.expectedComponents.filter(id => slide.plannedComponents.includes(id)))),
    consumedComponents: unique(slideAudits.flatMap(slide => slide.expectedComponents.filter(id => slide.consumedComponents.includes(id)))),
    neutralFallbackSlides: metrics.neutralFallbackSlides || 0,
    conflictSummary: {
      suppressedComponentPlanSlides: slideAudits.filter(slide => slide.inputMetadata && slide.inputMetadata.previousComponentPlan).length,
      suppressedComponentHintSlides: slideAudits.filter(slide => slide.inputMetadata && (slide.inputMetadata.previousComponentHints || slide.inputMetadata.previousComponentSuggestions)).length,
      suppressedCompositionPlanSlides: slideAudits.filter(slide => slide.inputMetadata && slide.inputMetadata.previousCompositionPlan).length,
      suppressedAssetGenerationSlides: slideAudits.filter(slide => slide.inputMetadata && slide.inputMetadata.previousAssetGeneration).length,
      staleChainSlides: findings.filter(finding => finding.type === 'industryEvidenceChainStale').length,
      chainMismatchSlides,
      chainMismatchFindings: chainMismatchFindings.length
    },
    blockingGap: compactFinding(blocking)
  };
}

module.exports = {
  buildIndustryEvidenceChainSummary,
  statusForFindings
};

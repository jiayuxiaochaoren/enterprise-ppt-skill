function createEvidenceAuditHelpers({
  normalizeDeckPlan = plan => plan,
  slideProofObject = () => ({ id: 'unknown' }),
  sourceTraceAudit = () => ({ findings: [] }),
  sourceTraceForSlide = () => ({})
} = {}) {
  function evidenceAudit(plan = {}, normalizedPlan = null) {
    const normalized = normalizedPlan || normalizeDeckPlan(plan);
    const slides = normalized.slides || [];
    const findings = [];
    const bodySlides = slides.filter(s => !['cover', 'closing', 'toc', 'toc-clean', 'chapter-divider'].includes(s.type || ''));
    bodySlides.forEach(slide => {
      const absoluteIndex = slides.indexOf(slide) + 1;
      const proof = slideProofObject(slide);
      if (!proof.id || proof.id === 'unknown' || proof.id === 'narrative-block') {
        findings.push({
          slide: absoluteIndex,
          level: 'review',
          type: 'proofObjectMissing',
          message: 'body slide should expose a concrete proof object, not only a title/body block'
        });
      }
      if (!proof.factual && !proof.generatedIllustration && !['toc-clean', 'chapter-divider'].includes(slide.type || '')) {
        const trace = sourceTraceForSlide(slide);
        const explicitBoundary = /plan-authored|brief|source-derived|structure-only|synthetic|generated/i.test(String(proof.provenance || proof.evidenceMode || proof.evidence_mode || trace.sourceNote || trace.source_note || ''));
        if (!explicitBoundary) {
          findings.push({
            slide: absoluteIndex,
            level: 'review',
            type: 'evidenceProvenanceWeak',
            message: 'proof object lacks source ids or explicit generated-illustration provenance'
          });
        }
      }
      if (proof.generatedIllustration && proof.factual) {
        findings.push({
          slide: absoluteIndex,
          level: 'fail',
          type: 'generatedEvidenceMisclassified',
          message: 'model-generated illustration is marked as factual evidence'
        });
      }
    });
    sourceTraceAudit(plan, normalized).findings.forEach(f => findings.push(f));
    return {
      version: 'evidence-audit/v1',
      checkedSlides: bodySlides.length,
      status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
      findings
    };
  }

  return {
    evidenceAudit
  };
}

module.exports = {
  createEvidenceAuditHelpers
};

const {
  createSourceTraceAuditPrimitives
} = require('./source-trace-audit-primitives');

function createSourceTraceAuditHelpers({
  compactUnique,
  imageRefsForSlide,
  normalizeDeckPlan,
  slideProofObject,
  sourceEntriesForSlide,
  sourceTraceForSlide,
  sourceTraceIsPlanAuthored
} = {}) {
  const {
    metricTraceEntries,
    normalizeAuthorizationStatus,
    sourceEntryHasExcerpt,
    sourceEntryHasPage
  } = createSourceTraceAuditPrimitives({
    compactUnique,
    sourceTraceIsPlanAuthored
  });

  function sourceTraceAudit(plan = {}, normalizedPlan = null) {
    const normalized = normalizedPlan || normalizeDeckPlan(plan);
    const slides = normalized.slides || [];
    const findings = [];
    slides.forEach((slide, i) => {
      if (['cover', 'closing', 'toc', 'toc-clean', 'chapter-divider'].includes(slide.type || '')) return;
      const entries = sourceEntriesForSlide(slide);
      const trace = sourceTraceForSlide(slide);
      const proof = slideProofObject(slide);
      const hasSource = entries.length || (proof.sourceIds || []).length;
      if (!hasSource && proof.factual) {
        findings.push({
          slide: i + 1,
          level: 'fail',
          type: 'sourceTraceMissing',
          message: 'factual proof object has no source trace'
        });
        return;
      }
      entries.forEach(entry => {
        const isImage = entry.kind === 'image' || entry.assetProvenance || /image|screenshot|photo/i.test(entry.provenance || '');
        if (!isImage && !sourceEntryHasPage(entry)) {
          findings.push({
            slide: i + 1,
            level: 'fail',
            type: 'sourceTraceNotExplainable',
            message: `source ${entry.id} needs page/pageRef`
          });
        }
        if (!isImage && !sourceEntryHasExcerpt(entry)) {
          findings.push({
            slide: i + 1,
            level: 'fail',
            type: 'sourceTraceNotExplainable',
            message: `source ${entry.id} needs original excerpt`
          });
        }
        if (isImage && !entry.assetProvenance && !(trace.imageProvenance || []).some(img => img.sourceId === entry.id)) {
          findings.push({
            slide: i + 1,
            level: 'fail',
            type: 'imageProvenanceMissing',
            message: `image source ${entry.id} needs screenshot/image provenance`
          });
        }
        if (isImage) {
          const entryStatus = normalizeAuthorizationStatus(entry.authorizationStatus || trace.assetAuthorizationStatus);
          if (entryStatus === 'blocked') {
            findings.push({
              slide: i + 1,
              level: 'fail',
              type: 'assetAuthorizationBlocked',
              message: `image source ${entry.id || 'unknown'} is not authorized for external use`
            });
          } else if (entryStatus === 'unknown') {
            findings.push({
              slide: i + 1,
              level: 'review',
              type: 'assetAuthorizationUnknown',
              message: `image source ${entry.id || 'unknown'} authorization is unknown`
            });
          }
        }
      });
      (Array.isArray(slide.metrics) ? slide.metrics : []).forEach((metric, metricIndex) => {
        if (!metric || (!metric.value && !metric.amount && !metric.delta)) return;
        const metricEntries = metricTraceEntries(metric, trace);
        if (!metricEntries.length) {
          findings.push({
            slide: i + 1,
            level: 'fail',
            type: 'metricSourceTraceMissing',
            message: `metric ${metricIndex + 1} needs source id, page, and original excerpt`
          });
          return;
        }
        metricEntries.forEach(entry => {
          if (!sourceEntryHasPage(entry) || !sourceEntryHasExcerpt(entry)) {
            findings.push({
              slide: i + 1,
              level: 'fail',
              type: 'metricSourceTraceNotExplainable',
              message: `metric ${metricIndex + 1} source ${entry.id || 'unknown'} needs page and original excerpt`
            });
          }
        });
      });
      (trace.imageProvenance || []).forEach(img => {
        const status = normalizeAuthorizationStatus(img.authorizationStatus || trace.assetAuthorizationStatus);
        if (status === 'blocked') {
          findings.push({
            slide: i + 1,
            level: 'fail',
            type: 'assetAuthorizationBlocked',
            message: `image source ${img.sourceId || img.file || 'unknown'} is not authorized for external use`
          });
        } else if (status === 'unknown') {
          findings.push({
            slide: i + 1,
            level: 'review',
            type: 'assetAuthorizationUnknown',
            message: `image source ${img.sourceId || img.file || 'unknown'} authorization is unknown`
          });
        }
      });
      const imageProvenance = Array.isArray(trace.imageProvenance) ? trace.imageProvenance : [];
      const generatedOnly = imageProvenance.length > 0 && imageProvenance.every(img => {
        const proofEligibility = String(img.proofEligibility || '').toLowerCase();
        const provenanceClass = String(img.provenanceClass || img.type || img.provenance || '').toLowerCase();
        return proofEligibility === 'synthetic-only' ||
          proofEligibility === 'illustration-only' ||
          /model-generated|generated|synthetic/.test(provenanceClass);
      });
      const hasFactualProofImage = imageProvenance.some(img => String(img.proofEligibility || '').toLowerCase() === 'factual-proof' ||
        ['user-owned', 'public-licensed'].includes(String(img.provenanceClass || '').toLowerCase()));
      if (proof.factual && imageProvenance.length && generatedOnly && !hasFactualProofImage) {
        findings.push({
          slide: i + 1,
          level: 'fail',
          type: 'generatedAssetCannotSatisfyFactualProof',
          message: 'factual proof slide only has generated/synthetic image provenance'
        });
      }
    });
    return {
      version: 'source-trace-audit/v1',
      status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
      findings
    };
  }

  function assetAuthorizationGate(plan = {}, normalizedPlan = null) {
    const normalized = normalizedPlan || normalizeDeckPlan(plan);
    const slides = normalized.slides || [];
    const required = Boolean(
      plan.formalMaterialGeneration ||
      plan.outputIntent === 'formal' ||
      plan.materialIntelligence ||
      (plan.commercialReview && plan.commercialReview.requiresAssetGate)
    );
    const findings = [];
    slides.forEach((slide, i) => {
      const trace = sourceTraceForSlide(slide);
      const imageRefs = imageRefsForSlide(slide);
      const provenance = Array.isArray(trace.imageProvenance) ? trace.imageProvenance : [];
      const status = normalizeAuthorizationStatus(trace.assetAuthorizationStatus);
      if (imageRefs.length && required && !provenance.length && status !== 'cleared') {
        findings.push({
          slide: i + 1,
          level: 'fail',
          type: 'assetAuthorizationGateMissing',
          message: 'formal material generation requires image/screenshot provenance and authorization status before rendering'
        });
      }
      provenance.forEach(item => {
        const itemStatus = normalizeAuthorizationStatus(item.authorizationStatus || trace.assetAuthorizationStatus);
        if (itemStatus === 'blocked') {
          findings.push({
            slide: i + 1,
            level: 'fail',
            type: 'assetAuthorizationBlocked',
            message: `asset ${item.sourceId || item.file || 'unknown'} is blocked for external material generation`
          });
        } else if (required && itemStatus !== 'cleared' && itemStatus !== 'internal-only') {
          findings.push({
            slide: i + 1,
            level: 'fail',
            type: 'assetAuthorizationUnresolved',
            message: `asset ${item.sourceId || item.file || 'unknown'} authorization must be resolved before formal rendering`
          });
        }
      });
    });
    const explicit = plan.assetAuthorizationGate || {};
    const explicitUnresolved = /needs|pending|blocked|unresolved|待|未/i.test(String(explicit.status || ''));
    const hasFailingFinding = findings.some(f => f.level === 'fail');
    const status = hasFailingFinding || explicitUnresolved ? 'needs_authorization' : 'ready';
    return {
      version: 'asset-authorization-gate/v1',
      required,
      status,
      canRenderFormal: !required || status === 'ready',
      findings
    };
  }

  return {
    assetAuthorizationGate,
    metricTraceEntries,
    normalizeAuthorizationStatus,
    sourceEntryHasExcerpt,
    sourceEntryHasPage,
    sourceTraceAudit
  };
}

module.exports = {
  createSourceTraceAuditHelpers
};

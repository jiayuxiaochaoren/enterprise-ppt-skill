function createSourceTraceHelpers({
  clampText,
  compactUnique,
  flattenText,
  normalizeDeckPlan,
  proofObjectIdForSlide,
  slideProofObject
} = {}) {
function sourceTracePolicyForPlan(plan = {}) {
  const policy = plan.sourceTracePolicy || plan.source_trace_policy || {};
  if (!policy || typeof policy !== 'object') return {};
  return policy;
}

function sourceTracePolicyMode(plan = {}) {
  return String(sourceTracePolicyForPlan(plan).mode || plan.sourceTraceMode || plan.source_trace_mode || '').trim();
}

function slideHasSourceBoundary(slide = {}) {
  const trace = sourceTraceForSlide(slide);
  const proof = slide.proof || {};
  const sourceIds = compactUnique([
    ...((trace.sourceIds) || []),
    ...((proof.sourceIds) || []),
    ...(slide.sourceIds || []),
    ...(slide.source_ids || [])
  ]);
  return Boolean(
    sourceIds.length ||
    trace.sourceNote ||
    trace.source_note ||
    proof.provenance ||
    proof.evidenceMode ||
    proof.evidence_mode
  );
}

function sourceTraceForSlide(slide = {}) {
  const proofTrace = (slide.proof && slide.proof.sourceTrace) || {};
  const slideTrace = slide.sourceTrace || {};
  if (!Object.keys(proofTrace).length) return slideTrace;
  if (!Object.keys(slideTrace).length) return proofTrace;
  const sourceIds = compactUnique([
    ...((proofTrace.sourceIds) || []),
    ...((slideTrace.sourceIds) || [])
  ]);
  const sourceMap = new Map();
  [...(proofTrace.sources || []), ...(slideTrace.sources || [])].forEach(entry => {
    if (entry && entry.id) sourceMap.set(entry.id, Object.assign({}, sourceMap.get(entry.id) || {}, entry));
  });
  return Object.assign({}, proofTrace, slideTrace, {
    sourceIds,
    sources: [...sourceMap.values()],
    imageProvenance: [
      ...((proofTrace.imageProvenance) || []),
      ...((slideTrace.imageProvenance) || [])
    ]
  });
}

function sourceTraceIsPlanAuthored(trace = {}) {
  const text = flattenText([
    trace.kind,
    trace.provenance,
    trace.sourceNote,
    trace.source_note,
    ...(Array.isArray(trace.sources) ? trace.sources.map(entry => [
      entry && entry.kind,
      entry && entry.provenance,
      entry && entry.authorizationStatus
    ]) : [])
  ]).toLowerCase();
  return /plan-authored|plan-brief|self-contained/.test(text);
}

function sourceEntriesForSlide(slide = {}) {
  const trace = sourceTraceForSlide(slide);
  const entries = Array.isArray(trace.sources) ? trace.sources : [];
  const sourceIds = compactUnique([
    ...((trace.sourceIds) || []),
    ...(((slide.proof || {}).sourceIds) || []),
    ...(slide.sourceIds || []),
    ...(slide.source_ids || [])
  ]);
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  sourceIds.forEach(id => {
    if (!byId.has(id)) byId.set(id, { id });
  });
  return [...byId.values()];
}

function planAuthoredSourceTrace(plan = {}, slide = {}, index = 0) {
  const policy = sourceTracePolicyForPlan(plan);
  const baseId = policy.sourceId || policy.source_id || 'plan-brief';
  const id = `${baseId}-slide-${String(index + 1).padStart(2, '0')}`;
  const excerpt = clampText(flattenText([
    slide.claim,
    slide.title,
    slide.subtitle,
    slide.intro,
    slide.note,
    slide.businessLogic && (slide.businessLogic.action || slide.businessLogic.impact || slide.businessLogic.currentState)
  ]), 180);
  return {
    version: 'source-trace/v2',
    claimId: slide.claimId || slide.claim_id || `claim-${String(index + 1).padStart(2, '0')}`,
    evidenceIds: [`evidence-${String(index + 1).padStart(2, '0')}`],
    sourceIds: [id],
    sources: [{
      id,
      kind: 'plan-brief',
      name: policy.label || policy.name || plan.title || 'Deck plan brief',
      page: policy.page || 'deck-plan',
      excerpt: excerpt || slide.title || 'Plan-authored slide content',
      provenance: 'plan-authored-brief',
      authorizationStatus: policy.authorizationStatus || 'cleared'
    }],
    sourceNote: policy.sourceNote || policy.source_note || 'Plan-authored content boundary; no external source material was supplied for this slide.',
    imageProvenance: [],
    assetAuthorizationStatus: policy.authorizationStatus || 'cleared'
  };
}

function preferredProofObjectIdForTrace(slide = {}) {
  const proofId = String((slide.proof && slide.proof.id) || '').trim();
  if (proofId && !/^slide-\d+$/i.test(proofId)) return proofId;
  const explicit = String(slide.proofObject || slide.proof_object || '').trim();
  if (explicit) return explicit;
  return proofObjectIdForSlide(slide);
}

function applyPlanAuthoredSourceTrace(plan = {}, slide = {}, index = 0) {
  if (!/^plan-authored|brief|self-contained$/i.test(sourceTracePolicyMode(plan))) return slide;
  if (['cover', 'cover-dark', 'closing', 'closing-dark', 'toc', 'toc-clean', 'chapter-divider'].includes(slide.type || '')) return slide;
  if (slideHasSourceBoundary(slide)) return slide;
  const trace = planAuthoredSourceTrace(plan, slide, index);
  const proofId = preferredProofObjectIdForTrace(slide) || `slide-${String(index + 1).padStart(2, '0')}`;
  return Object.assign({}, slide, {
    sourceTrace: trace,
    proof: Object.assign({}, slide.proof || {}, {
      version: 'proof-object/v1',
      id: proofId,
      factual: false,
      generatedIllustration: false,
      sourceIds: trace.sourceIds,
      provenance: 'plan-authored-brief',
      evidenceMode: 'plan-authored-claim',
      sourceTrace: trace
    })
  });
}

function sourceEntryHasPage(entry = {}) {
  return Boolean(entry.page || entry.pageNumber || entry.pageRef || entry.page_ref);
}

function sourceEntryHasExcerpt(entry = {}) {
  return Boolean(entry.excerpt || entry.sourceExcerpt || entry.source_excerpt || entry.originalExcerpt || entry.original_excerpt);
}

function metricTraceEntries(metric = {}, slideTrace = {}) {
  const trace = metric.sourceTrace || metric.source_trace || {};
  const ids = compactUnique([
    metric.sourceId,
    metric.source_id,
    ...((metric.sourceIds) || []),
    ...((metric.source_ids) || []),
    ...((trace.sourceIds) || [])
  ].filter(Boolean));
  const slideEntries = Array.isArray(slideTrace.sources) ? slideTrace.sources : [];
  const entries = Array.isArray(trace.sources) ? trace.sources.slice() : [];
  if (!ids.length && !entries.length && sourceTraceIsPlanAuthored(slideTrace)) {
    return slideEntries.slice();
  }
  ids.forEach(id => {
    if (!entries.some(entry => entry && entry.id === id)) {
      const inherited = slideEntries.find(entry => entry && entry.id === id);
      entries.push(inherited || { id });
    }
  });
  return entries;
}

function imageRefsForSlide(slide = {}) {
  return compactUnique([
    slide.image,
    slide.visual && slide.visual.image,
    ...(Array.isArray(slide.images) ? slide.images : []),
    ...((slide.visual && Array.isArray(slide.visual.images)) ? slide.visual.images : [])
  ].filter(Boolean));
}

function normalizeAuthorizationStatus(value = '') {
  const text = String(value || '').toLowerCase();
  if (!text) return 'unknown';
  if (/blocked|forbidden|not authorized|未授权|禁止|不可外发/.test(text)) return 'blocked';
  if (/needs authorization|need authorization|unknown|待确认|不明确|未确认/.test(text)) return 'unknown';
  if (/internal|draft|内审|内部/.test(text)) return 'internal-only';
  if (/user-owned|owned|licensed|authorized|public|公开|授权|可外发/.test(text)) return 'cleared';
  return text;
}

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
    applyPlanAuthoredSourceTrace,
    assetAuthorizationGate,
    imageRefsForSlide,
    normalizeAuthorizationStatus,
    planAuthoredSourceTrace,
    preferredProofObjectIdForTrace,
    sourceEntriesForSlide,
    sourceTraceAudit,
    sourceTraceForSlide,
    sourceTraceIsPlanAuthored,
    sourceTracePolicyForPlan,
    sourceTracePolicyMode
  };
}

module.exports = {
  createSourceTraceHelpers
};

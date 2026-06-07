const {
  assetAuthorizationStatusHasSignal,
  sourceEntryIds,
  sourceIdValues,
  sourceTraceForSlide: canonicalSourceTraceForSlide
} = require('./source-evidence');

function createSourceTraceCoreHelpers({
  clampText,
  compactUnique,
  flattenText,
  proofObjectIdForSlide
} = {}) {
  function sourceTracePolicyForPlan(plan = {}) {
    const policy = plan.sourceTracePolicy || plan.source_trace_policy || {};
    if (!policy || typeof policy !== 'object') return {};
    return policy;
  }

  function sourceTracePolicyMode(plan = {}) {
    return String(sourceTracePolicyForPlan(plan).mode || plan.sourceTraceMode || plan.source_trace_mode || '').trim();
  }

  function sourceTraceForSlide(slide = {}) {
    return canonicalSourceTraceForSlide(slide);
  }

  function slideHasSourceBoundary(slide = {}) {
    const trace = sourceTraceForSlide(slide);
    const proof = slide.proof || {};
    const sourceIds = sourceIdValues(
      trace.sourceIds,
      trace.source_ids,
      proof.sourceIds,
      proof.source_ids,
      slide.sourceIds,
      slide.source_ids
    );
    return Boolean(
      sourceIds.length ||
      (Array.isArray(trace.sources) && trace.sources.length) ||
      (Array.isArray(trace.imageProvenance) && trace.imageProvenance.length) ||
      assetAuthorizationStatusHasSignal(trace.assetAuthorizationStatus) ||
      (trace.assetAuthorizationStatuses || []).some(assetAuthorizationStatusHasSignal) ||
      trace.sourceNote ||
      trace.source_note ||
      proof.provenance ||
      proof.evidenceMode ||
      proof.evidence_mode
    );
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
    const sourceIds = sourceIdValues(
      trace.sourceIds,
      trace.source_ids,
      (slide.proof || {}).sourceIds,
      (slide.proof || {}).source_ids,
      slide.sourceIds,
      slide.source_ids
    );
    const byId = new Map();
    const ordered = [];
    const rememberEntry = entry => {
      if (!entry || typeof entry !== 'object') return;
      const aliases = sourceEntryIds(entry);
      const existing = aliases.map(alias => byId.get(alias)).find(Boolean);
      if (existing) {
        Object.assign(existing, entry);
        aliases.forEach(alias => byId.set(alias, existing));
        return;
      }
      ordered.push(entry);
      aliases.forEach(alias => byId.set(alias, entry));
    };
    entries.forEach(rememberEntry);
    sourceIds.forEach(id => {
      if (!byId.has(id)) rememberEntry({ id });
    });
    return ordered;
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

  function imageRefsForSlide(slide = {}) {
    return compactUnique([
      slide.image,
      slide.visual && slide.visual.image,
      ...(Array.isArray(slide.images) ? slide.images : []),
      ...((slide.visual && Array.isArray(slide.visual.images)) ? slide.visual.images : [])
    ].filter(Boolean));
  }

  return {
    applyPlanAuthoredSourceTrace,
    imageRefsForSlide,
    planAuthoredSourceTrace,
    preferredProofObjectIdForTrace,
    slideHasSourceBoundary,
    sourceEntriesForSlide,
    sourceTraceForSlide,
    sourceTraceIsPlanAuthored,
    sourceTracePolicyForPlan,
    sourceTracePolicyMode
  };
}

module.exports = {
  createSourceTraceCoreHelpers
};

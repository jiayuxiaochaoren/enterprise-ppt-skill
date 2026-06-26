function hasValue(value) {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return String(value).trim() !== '';
}

function toArray(value) { return hasValue(value) ? (Array.isArray(value) ? value : [value]) : []; }

function compactUnique(values = []) {
  return [...new Set((values || []).filter(hasValue).map(value => String(value)))];
}

function fieldValues(objects = [], fields = []) {
  return objects.flatMap(object => fields.flatMap(field => toArray(object && object[field])));
}

const SOURCE_ENTRY_ID_FIELDS = ['id', 'sourceId', 'source_id', 'ref', 'file', 'assetId', 'asset_id'];
const FACTUAL_IMAGE_PROVENANCE_CLASSES = new Set(['user-owned', 'public-licensed', 'client-supplied', 'first-party', 'user-provided', 'client-provided']);

function sourceIdValues(...values) {
  return compactUnique(values.flatMap(toArray));
}

function normalizeAuthorizationStatus(value = '') {
  const text = String(value || '').toLowerCase().trim();
  if (!text) return 'unknown';
  if (/blocked|forbidden|denied|not authorized|unauthorized|未授权|禁止|不可外发/.test(text)) return 'blocked';
  if (/needs[\s_-]*review|needs[\s_-]*authorization|need[\s_-]*authorization|pending|unresolved|unknown|待确认|不明确|未确认/.test(text)) return 'unknown';
  if (
    /user[\s_-]*(selected|chosen|picked).*(generated|imagegen|synthetic|cover)|(?:generated|imagegen|synthetic).*user[\s_-]*(selected|chosen|picked)|conversation[\s_-]*(attachment|asset)|session[\s_-]*(generated|selected)/.test(text)
  ) return 'internal-only';
  if (/internal[\s_-]*only|synthetic[\s_-]*only|internal|draft|内审|内部/.test(text)) return 'internal-only';
  if (/cleared|approved|licensed|authorized|user[\s_-]*(owned|provided|supplied)|client[\s_-]*(provided|supplied)|public|公开|授权|可外发/.test(text)) return 'cleared';
  return text;
}

function authorizationStatusRank(value = '') {
  const normalized = normalizeAuthorizationStatus(value);
  if (/blocked|forbidden|denied|not authorized/.test(normalized)) return 50;
  if (normalized === 'unknown') return 40;
  if (normalized === 'internal-only') return 30;
  if (normalized === 'cleared') return 20;
  return 10;
}

function preferredAuthorizationStatus(values = []) {
  return compactUnique(values)
    .sort((a, b) => authorizationStatusRank(b) - authorizationStatusRank(a))[0] || '';
}

function effectiveImageAuthorizationStatus(item = {}, trace = {}) {
  const statuses = [
    item && item.authorizationStatus,
    item && item.authorization_status,
    trace && trace.assetAuthorizationStatus,
    trace && trace.asset_authorization_status,
    ...toArray(trace && trace.assetAuthorizationStatuses),
    ...toArray(trace && trace.asset_authorization_statuses)
  ];
  return preferredAuthorizationStatus(statuses);
}

function assetAuthorizationStatusHasSignal(value = '') {
  if (!hasValue(value)) return false;
  return !/^(none|not[\s_-]*provided|unavailable|missing|no[\s_-]*provenance)$/i.test(String(value).trim());
}

function imageAuthorizationStatus(value = {}) {
  return String(value.authorizationStatus || value.authorization_status || '').trim();
}

function imageProofEligibility(value = {}) {
  return String(value.proofEligibility || value.proof_eligibility || '').trim();
}

function imageProvenanceClass(value = {}) {
  const text = String(value.provenanceClass || value.provenance_class || value.type || value.provenance || '').toLowerCase().trim();
  if (!text) return '';
  if (/not[\s_-]*provided|unavailable|missing|unknown|none|no[\s_-]*provenance/.test(text)) return 'unknown';
  if (/generated|imagegen|model|synthetic|illustration/.test(text)) return 'model-generated-preview';
  if (/client[\s_-]*(supplied|provided)|user[\s_-]*(owned|provided)|first[\s_-]*party|owned|provided|用户|自有/.test(text)) return 'user-owned';
  if (/public|licensed|stock|wikimedia|unsplash|pexels/.test(text)) return 'public-licensed';
  return text;
}

function imageProvenanceCanSatisfyFactualProof(value = {}) {
  const proofEligibility = imageProofEligibility(value).toLowerCase();
  if (proofEligibility !== 'factual-proof') return false;
  return FACTUAL_IMAGE_PROVENANCE_CLASSES.has(imageProvenanceClass(value));
}

function imageProvenanceIsSyntheticOnly(value = {}) {
  const proofEligibility = imageProofEligibility(value).toLowerCase();
  const provenanceClass = imageProvenanceClass(value);
  return proofEligibility === 'synthetic-only' ||
    proofEligibility === 'illustration-only' ||
    /model-generated|generated|synthetic/.test(provenanceClass);
}

function visibleSourceNoteText(slide = {}) {
  const proof = slide.proof || {};
  return String(slide.sourceNote || slide.source_note || proof.sourceNote || proof.source_note || proof.source || '').trim();
}

function sourceTraceForSlide(slide = {}) {
  const proof = slide.proof || {};
  const chartSpec = slide.chartSpec || slide.chart_spec || {};
  const proofTrace = proof.sourceTrace || proof.source_trace || {};
  const slideTrace = slide.sourceTrace || slide.source_trace || {};
  const chartTrace = chartSpec.sourceTrace || chartSpec.source_trace || {};
  const traceObjects = [proof, proofTrace, slideTrace, chartTrace, slide];
  const imageProvenance = fieldValues(traceObjects, ['imageProvenance', 'image_provenance']);
  const sourceIds = compactUnique(fieldValues(traceObjects, ['sourceIds', 'source_ids']));
  const assetAuthorizationStatuses = compactUnique([
    ...fieldValues(traceObjects, ['assetAuthorizationStatus', 'asset_authorization_status', 'assetAuthorizationStatuses', 'asset_authorization_statuses']),
    ...imageProvenance.map(item => item && imageAuthorizationStatus(item))
  ]);
  const sourceMap = new Map();
  fieldValues(traceObjects, ['sources']).forEach(entry => {
    if (!entry || typeof entry !== 'object') return;
    const key = sourceEntryDisplayId(entry) || '';
    if (key) {
      sourceMap.set(key, Object.assign({}, sourceMap.get(key) || {}, entry));
    } else {
      sourceMap.set(`anon-${sourceMap.size}`, entry);
    }
  });
  sourceIds.forEach(id => {
    if (!sourceMap.has(id)) sourceMap.set(id, { id });
  });
  const sourceNote = chartTrace.sourceNote || chartTrace.source_note ||
    slideTrace.sourceNote || slideTrace.source_note ||
    proofTrace.sourceNote || proofTrace.source_note ||
    visibleSourceNoteText(slide);
  return Object.assign({}, proofTrace, slideTrace, chartTrace, {
    sourceIds,
    sources: [...sourceMap.values()],
    sourceNote,
    imageProvenance,
    assetAuthorizationStatus: preferredAuthorizationStatus(assetAuthorizationStatuses),
    assetAuthorizationStatuses
  });
}

function sourceEntryHasPage(entry = {}) {
  return hasValue(entry.page) || hasValue(entry.pageRef) || hasValue(entry.page_ref) || hasValue(entry.pageNumber) || hasValue(entry.sourcePage);
}

function sourceEntryHasExcerpt(entry = {}) {
  return hasValue(entry.excerpt) || hasValue(entry.sourceExcerpt) || hasValue(entry.source_excerpt) || hasValue(entry.originalExcerpt) || hasValue(entry.original_excerpt);
}

function sourceIdentityValues(entry = {}) {
  return compactUnique(SOURCE_ENTRY_ID_FIELDS.map(field => entry[field]));
}

function sourceEntryIds(entry = {}) {
  return sourceIdentityValues(entry);
}

function sourceEntryDisplayId(entry = {}) {
  return sourceEntryIds(entry)[0] || '';
}

function hasTextSourceTraceSignal(slide = {}) {
  const trace = sourceTraceForSlide(slide);
  return Boolean((trace.sourceIds || []).length ||
    (trace.sources || []).some(entry => sourceEntryIds(entry).length || sourceEntryHasPage(entry) || sourceEntryHasExcerpt(entry)));
}

function hasAssetProvenanceSignal(slide = {}) {
  const trace = sourceTraceForSlide(slide);
  return Boolean(
    (trace.imageProvenance || []).length ||
    assetAuthorizationStatusHasSignal(trace.assetAuthorizationStatus) ||
    (trace.assetAuthorizationStatuses || []).some(assetAuthorizationStatusHasSignal)
  );
}

function hasStructuredSourceTraceSignal(slide = {}) {
  return hasTextSourceTraceSignal(slide) || hasAssetProvenanceSignal(slide);
}

function sourceTraceHasRefs(slide = {}) {
  return hasStructuredSourceTraceSignal(slide);
}

function hasSourceTraceNoteText(slide = {}) {
  const trace = sourceTraceForSlide(slide);
  return hasValue(trace.sourceNote) || hasValue(trace.source_note);
}

function sourceTraceObjectIsExplainable(trace = {}, opts = {}) {
  const sourceIds = compactUnique([
    ...toArray(trace.sourceIds),
    ...toArray(trace.source_ids)
  ]);
  if (opts.requireSourceId && !sourceIds.length) return false;
  const sourceIdSet = new Set(sourceIds);
  return toArray(trace.sources).some(entry => {
    if (!sourceEntryHasPage(entry) || !sourceEntryHasExcerpt(entry)) return false;
    if (!opts.requireSourceId) return true;
    return sourceEntryIds(entry).some(id => sourceIdSet.has(id));
  });
}

function sourceTraceIsExplainable(slide = {}) {
  return sourceTraceObjectIsExplainable(sourceTraceForSlide(slide));
}

function sourceTraceNoteText(slide = {}, maxChars = 96) {
  const trace = sourceTraceForSlide(slide);
  const traceNote = trace.sourceNote || trace.source_note;
  if (hasValue(traceNote)) return String(traceNote).replace(/\s+/g, ' ').trim().slice(0, maxChars);
  const sourceIds = compactUnique(trace.sourceIds || []);
  const sourceIdSet = new Set(sourceIds);
  const entry = toArray(trace.sources).find(item => {
    const entryIds = sourceEntryIds(item || {});
    if (!entryIds.length || !sourceEntryHasPage(item) || !sourceEntryHasExcerpt(item)) return false;
    return sourceIds.length ? entryIds.some(id => sourceIdSet.has(id)) : true;
  }) || {};
  const id = sourceEntryDisplayId(entry);
  if (!id) return '';
  const page = entry.page || entry.pageRef || entry.page_ref || entry.pageNumber || entry.sourcePage || '';
  const excerpt = entry.excerpt || entry.sourceExcerpt || entry.source_excerpt || entry.originalExcerpt || entry.original_excerpt || '';
  return [
    id ? `Source ${id}` : 'Source',
    page ? `p.${page}` : '',
    excerpt ? String(excerpt).replace(/\s+/g, ' ').trim().slice(0, Math.max(24, maxChars - 24)) : ''
  ].filter(Boolean).join(' · ').slice(0, maxChars);
}

function hasVisibleSourceNote(slide = {}) {
  return Boolean(visibleSourceNoteText(slide));
}

function hasSourceEvidence(slide = {}) {
  return hasVisibleSourceNote(slide) || sourceTraceIsExplainable(slide);
}

function visibleSourceNotesEnabled(plan = {}, opts = {}) {
  const tracePolicy = plan.sourceTracePolicy || {};
  const values = [
    opts.visibleSourceNotes,
    opts.visible_source_notes,
    plan.visibleSourceNotes,
    plan.visible_source_notes,
    plan.sourceNotePolicy,
    plan.source_note_policy,
    tracePolicy.visibleSourceNotes,
    tracePolicy.visible_source_notes
  ].filter(value => value != null && String(value).trim() !== '');
  if (values.some(value => value === false || /^(false|no|none|hidden|hide|off|disable|disabled|internal|audit-only|internal-only)$/i.test(String(value).trim()) ||
    /\b(no visible|do not render|don't render|do not show|don't show|never show|never render|without source note|without source notes)\b/i.test(String(value)))) {
    return false;
  }
  return values.some(value => value === true || /^(true|on|visible|show|render|ppt)$/i.test(String(value).trim()));
}

module.exports = {
  assetAuthorizationStatusHasSignal,
  effectiveImageAuthorizationStatus,
  hasSourceEvidence,
  hasAssetProvenanceSignal,
  hasStructuredSourceTraceSignal,
  hasSourceTraceRefs: sourceTraceHasRefs,
  hasSourceTraceNoteText,
  hasTextSourceTraceSignal,
  hasVisibleSourceNote,
  imageAuthorizationStatus,
  imageProvenanceCanSatisfyFactualProof,
  imageProvenanceClass,
  imageProvenanceIsSyntheticOnly,
  imageProofEligibility,
  normalizeAuthorizationStatus,
  preferredAuthorizationStatus,
  sourceEntryHasExcerpt,
  sourceEntryIds,
  sourceEntryDisplayId,
  sourceEntryHasPage,
  sourceIdValues,
  sourceIdentityValues,
  sourceTraceForSlide,
  sourceTraceIsExplainable,
  sourceTraceObjectIsExplainable,
  sourceTraceNoteText,
  toArray,
  visibleSourceNotesEnabled,
  visibleSourceNoteText
};

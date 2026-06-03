function sourceEntryHasPage(entry = {}) {
  return Boolean(entry.page || entry.pageNumber || entry.pageRef || entry.page_ref);
}

function sourceEntryHasExcerpt(entry = {}) {
  return Boolean(entry.excerpt || entry.sourceExcerpt || entry.source_excerpt || entry.originalExcerpt || entry.original_excerpt);
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

function createMetricTraceEntries({
  compactUnique = values => Array.from(new Set((values || []).filter(Boolean))),
  sourceTraceIsPlanAuthored = () => false
} = {}) {
  return function metricTraceEntries(metric = {}, slideTrace = {}) {
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
  };
}

function createSourceTraceAuditPrimitives(deps = {}) {
  return {
    metricTraceEntries: createMetricTraceEntries(deps),
    normalizeAuthorizationStatus,
    sourceEntryHasExcerpt,
    sourceEntryHasPage
  };
}

module.exports = {
  createMetricTraceEntries,
  createSourceTraceAuditPrimitives,
  normalizeAuthorizationStatus,
  sourceEntryHasExcerpt,
  sourceEntryHasPage
};

const {
  normalizeAuthorizationStatus,
  sourceEntryHasExcerpt,
  sourceEntryHasPage,
  sourceEntryIds
} = require('./source-evidence');

function toArray(value) {
  if (value == null || value === '') return [];
  return Array.isArray(value) ? value : [value];
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
      ...toArray(metric.sourceIds),
      ...toArray(metric.source_ids),
      ...toArray(trace.sourceIds),
      ...toArray(trace.source_ids)
    ].filter(Boolean));
    const slideEntries = Array.isArray(slideTrace.sources) ? slideTrace.sources : [];
    const entries = Array.isArray(trace.sources) ? trace.sources.slice() : [];
    if (!ids.length && !entries.length && slideEntries.length) {
      return slideEntries.slice();
    }
    ids.forEach(id => {
      const matchesId = entry => sourceEntryIds(entry || {}).includes(String(id));
      if (!entries.some(entry => entry && matchesId(entry))) {
        const inherited = slideEntries.find(entry => entry && matchesId(entry));
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

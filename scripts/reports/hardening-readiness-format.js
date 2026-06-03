function formatList(values = []) {
  return (Array.isArray(values) ? values : []).join(', ') || 'none';
}

function formatObjectiveFailureSignals(signals = {}) {
  const entries = Object.entries(signals || {});
  if (!entries.length) return 'none';
  return entries
    .map(([id, values]) => `${id}: ${formatList(values)}`)
    .join('; ');
}

function formatObjectivePrioritySummary(summary = {}) {
  const parts = Object.entries(summary || {}).map(([priority, row]) => {
    const failed = formatList(row.failedObjectiveIds);
    return `${priority} ${row.ready ? 'ready' : 'not ready'} ${row.pass || 0}/${row.total || 0}${failed === 'none' ? '' : ` failed ${failed}`}`;
  });
  return parts.join('; ') || 'none';
}

function formatMismatchValue(value) {
  if (Array.isArray(value)) return value.join(',') || 'none';
  return value ? 'true' : 'false';
}

function formatMismatchDetail(detail = {}) {
  return `${detail.field} expected=${formatMismatchValue(detail.expected)} actual=${formatMismatchValue(detail.actual)}`;
}

module.exports = {
  formatList,
  formatMismatchDetail,
  formatMismatchValue,
  formatObjectiveFailureSignals,
  formatObjectivePrioritySummary
};

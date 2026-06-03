function valueLabel(value) {
  return value === null ? 'not_applicable' : String(value);
}

function sectionItem(id, label, extra = {}) {
  return Object.assign({ id, label: label || id }, extra);
}

function safeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) ? count : 0;
}

function plural(count, singular, pluralValue = `${singular}s`) {
  return count === 1 ? singular : pluralValue;
}

function evidenceStrengthLabel(value = {}) {
  const entries = Object.entries(value || {})
    .filter(([, count]) => Number(count) > 0)
    .map(([level, count]) => `${level}:${count}`);
  return entries.length ? entries.join(', ') : 'not_reported';
}

function addCount(target = {}, key = '') {
  const normalized = String(key || 'none').trim() || 'none';
  target[normalized] = (target[normalized] || 0) + 1;
}

function previewEvidence(preview = {}, countFallback = 0) {
  const status = preview.status || 'unknown';
  const provider = preview.provider || 'none';
  const count = safeCount(preview.count ?? countFallback);
  return sectionItem('preview', `Preview: ${status} via ${provider} (${count} ${plural(count, 'PNG')})`, {
    status,
    provider,
    count,
    error: preview.error || '',
    detail: preview.detail || ''
  });
}

function severityPolicyEvidence(policy = {}, summary = {}) {
  const mode = policy.mode || '';
  const promoted = Array.isArray(policy.promotedTypes) ? policy.promotedTypes : [];
  const categories = Array.isArray(policy.categories) ? policy.categories : [];
  const failCount = summary && summary.byLevel ? safeCount(summary.byLevel.fail) : 0;
  const reviewCount = summary && summary.byLevel ? safeCount(summary.byLevel.review) : 0;
  return sectionItem(
    'quality_severity_policy',
    policy.version
      ? `Severity policy: ${mode || 'unknown'} (${promoted.length} promoted types; ${failCount} fail, ${reviewCount} review)`
      : 'Severity policy: not_reported',
    {
      status: policy.version ? 'reported' : 'not_reported',
      version: policy.version || '',
      matrixVersion: policy.matrixVersion || '',
      mode,
      promotedTypes: promoted,
      categories,
      summary: summary || null
    }
  );
}

function buildReportSchema(kind, status, meta = {}, sections = {}) {
  return {
    version: 'delivery-report-summary/v1',
    kind,
    status,
    meta,
    sections: {
      evidence: sections.evidence || [],
      pass: sections.pass || [],
      risk: sections.risk || [],
      not_applicable: sections.not_applicable || [],
      unavailable: sections.unavailable || [],
      next_actions: sections.next_actions || []
    }
  };
}

function parseJsonFromOutput(text = '') {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(trimmed.slice(first, last + 1));
      } catch (__) {
        return null;
      }
    }
  }
  return null;
}

function markdownFromReport(reportSchema = {}) {
  const sections = reportSchema.sections || {};
  const meta = reportSchema.meta || {};
  const title = reportSchema.kind === 'delivery' ? 'Material To Delivery Summary' : 'PPTX Validation Summary';
  const lines = [
    `# ${title}`,
    '',
    `- Status: ${reportSchema.status || 'unknown'}`,
    `- Quality mode: ${meta.qualityMode || meta.quality_mode || ''}`,
    `- Preview: ${meta.previewStatus || 'unknown'} (${meta.previewProvider || 'none'}, ${meta.previewCount || 0} PNG)`,
    '',
    '## Evidence Snapshot',
    ...((sections.evidence || []).length ? sections.evidence.map(item => `- ${item.label || item.id}`) : ['- None']),
    '',
    '## Pass',
    ...(sections.pass || []).map(item => `- ${item.label || item.id}`),
    '',
    '## Risk',
    ...(sections.risk || []).map(item => `- ${item.label || item.id}`),
    '',
    '## Not Applicable',
    ...(sections.not_applicable || []).map(item => `- ${item.label || item.id}${item.value ? `: ${item.value}` : ''}`),
    '',
    '## Unavailable',
    ...(sections.unavailable || []).map(item => `- ${item.label || item.id}${item.detail ? ` (${item.detail})` : ''}`),
    '',
    '## Next Actions',
    ...((sections.next_actions || []).length ? sections.next_actions.map(item => `- ${item.label || item.id}`) : ['- None'])
  ];
  return `${lines.join('\n')}\n`;
}

module.exports = {
  addCount,
  buildReportSchema,
  evidenceStrengthLabel,
  markdownFromReport,
  parseJsonFromOutput,
  plural,
  previewEvidence,
  safeCount,
  sectionItem,
  severityPolicyEvidence,
  valueLabel
};

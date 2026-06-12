const {
  buildReportSchema,
  markdownFromReport,
  previewEvidence,
  sectionItem,
  severityPolicyEvidence,
  valueLabel
} = require('./report-utils');

function validationReport(summary = {}) {
  const checks = summary.checks || {};
  const preview = summary.preview || {};
  const visualQa = summary.visual_qa || {};
  const severityPolicy = visualQa.severity_policy || {};
  const severitySummary = visualQa.severity_summary || severityPolicy.summary || null;
  const pass = Object.entries(checks)
    .filter(([, value]) => value === true)
    .map(([key]) => sectionItem(key, key));
  const risk = Object.entries(checks)
    .filter(([, value]) => value === false)
    .map(([key]) => sectionItem(key, key));
  const notApplicable = Object.entries(checks)
    .filter(([, value]) => value === null)
    .map(([key, value]) => sectionItem(key, key, { value: valueLabel(value) }));
  const unavailable = [];
  if (preview.error) {
    unavailable.push(sectionItem('preview', preview.error, {
      provider: preview.provider || 'none',
      detail: preview.detail || ''
    }));
  }
  if (preview.status === 'metadata_fallback') {
    unavailable.push(sectionItem('screenshot_preview', 'metadata_fallback', {
      provider: preview.provider || 'metadata_fallback'
    }));
  }
  const evidence = [
    previewEvidence(preview),
    sectionItem(
      'render_meta',
      `Render meta: ${summary.render_meta_present ? 'present' : 'missing'}`,
      { present: Boolean(summary.render_meta_present) }
    ),
    sectionItem(
      'visual_qa',
      `Visual QA: ${summary.visual_qa ? (summary.visual_qa.success ? 'pass' : 'fail') : 'not_run'}`,
      { status: summary.visual_qa ? (summary.visual_qa.success ? 'pass' : 'fail') : 'not_run' }
    ),
    severityPolicyEvidence(severityPolicy, severitySummary)
  ];
  return buildReportSchema('validation', summary.success ? 'pass' : 'fail', {
    file: summary.file || '',
    slideCount: summary.slide_count || 0,
    qualityMode: summary.quality_mode || '',
    previewProvider: preview.provider || 'none',
    previewStatus: preview.status || 'unknown',
    previewCount: preview.count || 0,
    renderMetaPresent: Boolean(summary.render_meta_present),
    visualQaStatus: summary.visual_qa ? (summary.visual_qa.success ? 'pass' : 'fail') : 'not_run',
    severityPolicyVersion: severityPolicy.version || '',
    severityMatrixVersion: severityPolicy.matrixVersion || '',
    severityPromotedTypes: Array.isArray(severityPolicy.promotedTypes) ? severityPolicy.promotedTypes : []
  }, {
    evidence,
    pass,
    risk,
    not_applicable: notApplicable,
    unavailable: unavailable.length ? unavailable : [sectionItem('none', 'None')],
    next_actions: (summary.next_actions || []).map((item, index) => sectionItem(`next-${index + 1}`, item))
  });
}

function validationMarkdown(summary = {}) {
  return markdownFromReport(summary.report || validationReport(summary));
}

module.exports = {
  validationMarkdown,
  validationReport
};

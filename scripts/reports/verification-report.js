const {
  buildReportSchema,
  evidenceStrengthLabel,
  previewEvidence,
  sectionItem
} = require('./report-utils');

function validationPreview(raw = {}) {
  const validation = raw.validation || {};
  const validationSummary = validation.summary || validation;
  return validationSummary.preview || {};
}

function verificationReport(report = {}, raw = {}) {
  const hardening = raw.hardening || {};
  const template = raw.template || {};
  const preview = validationPreview(raw);
  const previewUnavailable = Boolean(preview.error || ['metadata_fallback', 'unavailable'].includes(preview.status));
  const steps = report.steps || [];
  const failedSteps = steps.filter(step => step.status === 'fail').length;
  const passedSteps = steps.filter(step => step.status === 'pass').length;
  const evidence = [
    previewEvidence(preview),
    sectionItem(
      'hardening_evidence_strength',
      `Hardening evidence strength: ${evidenceStrengthLabel(hardening.evidenceStrength)}`,
      { value: hardening.evidenceStrength || {} }
    ),
    sectionItem(
      'template_evidence_strength',
      `Template evidence strength: ${evidenceStrengthLabel(template.evidenceStrength)}`,
      { value: template.evidenceStrength || {} }
    ),
    sectionItem(
      'verification_steps',
      `Verification steps: ${passedSteps} pass, ${failedSteps} fail`,
      { passCount: passedSteps, failCount: failedSteps }
    )
  ];
  return buildReportSchema('delivery-verification', report.success ? 'pass' : 'fail', {
    qualityMode: report.qualityMode || '',
    previewProvider: preview.provider || report.previewMode || 'none',
    previewStatus: preview.status || report.previewMode || 'unknown',
    hardeningEvidenceStrength: hardening.evidenceStrength || {},
    templateEvidenceStrength: template.evidenceStrength || {}
  }, {
    evidence,
    pass: steps
      .filter(step => step.status === 'pass')
      .map(step => sectionItem(step.name || step.label, step.name || step.label)),
    risk: steps
      .filter(step => step.status === 'fail')
      .map(step => sectionItem(step.name || step.label, `${step.name || step.label} failed`)),
    not_applicable: [],
    unavailable: previewUnavailable
      ? [sectionItem('preview', preview.error || preview.status, { detail: preview.detail || '' })]
      : [sectionItem('none', 'None')],
    next_actions: report.success
      ? [sectionItem('review', 'Review generated PPTX, render-meta, and preview images before external delivery.')]
      : [sectionItem('fix', 'Fix failing delivery verification step and rerun verify:delivery.')]
  });
}

module.exports = {
  verificationReport
};

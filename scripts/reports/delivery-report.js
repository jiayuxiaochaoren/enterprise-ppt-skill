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

function validationReport(summary = {}) {
  const checks = summary.checks || {};
  const preview = summary.preview || {};
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
    )
  ];
  return buildReportSchema('validation', summary.success ? 'pass' : 'fail', {
    file: summary.file || '',
    slideCount: summary.slide_count || 0,
    qualityMode: summary.quality_mode || '',
    previewProvider: preview.provider || 'none',
    previewStatus: preview.status || 'unknown',
    previewCount: preview.count || 0,
    renderMetaPresent: Boolean(summary.render_meta_present),
    visualQaStatus: summary.visual_qa ? (summary.visual_qa.success ? 'pass' : 'fail') : 'not_run'
  }, {
    evidence,
    pass,
    risk,
    not_applicable: notApplicable,
    unavailable: unavailable.length ? unavailable : [sectionItem('none', 'None')],
    next_actions: (summary.next_actions || []).map((item, index) => sectionItem(`next-${index + 1}`, item))
  });
}

function parseStepJson(step = {}) {
  if (!step || !step.stdout) return null;
  return parseJsonFromOutput(step.stdout);
}

function deliveryReport(report = {}) {
  const steps = report.steps || [];
  const failed = steps.filter(step => step.status === 'fail');
  const validationStep = [...steps].reverse().find(step => /validation/i.test(step.label || ''));
  const validation = parseStepJson(validationStep);
  const validationSummary = validation && (validation.summary || validation);
  const preview = validationSummary && validationSummary.preview || report.preview || {};
  const assetGate = report.assetGate || {};
  const ocr = report.ocr || {};
  const criticBlockers = Array.isArray(report.criticBlockingFindings) ? report.criticBlockingFindings : [];
  const riskItems = [
    ...failed.map(step => `Step failed: ${step.label}`),
    ...(report.risks || []),
    ...((report.nextActions || []).filter(item => /risk|授权|OCR|clarification|asset|critic|review|补齐|确认/i.test(item))),
    ...((ocr.possibleMissingCount || 0) > 0 ? [`OCR recommended for ${ocr.possibleMissingCount} source(s).`] : []),
    ...((ocr.needsConfirmationCount || 0) > 0 ? [`Low-confidence OCR needs confirmation for ${ocr.needsConfirmationCount} source(s).`] : []),
    ...(assetGate.status && assetGate.status !== 'ready' && assetGate.status !== 'pass' ? [`Asset gate status: ${assetGate.status}.`] : [])
  ];
  const unavailable = [
    ...((report.unavailable || []).map(item => String(item))),
    ...(preview.error ? [`Preview: ${preview.error}`] : []),
    ...(preview.status === 'metadata_fallback' ? ['Screenshot preview unavailable; metadata fallback used.'] : [])
  ];
  const ocrProvided = safeCount(ocr.providedCount);
  const ocrMissing = safeCount(ocr.possibleMissingCount);
  const ocrNeedsConfirmation = safeCount(ocr.needsConfirmationCount);
  const evidence = [
    previewEvidence(preview),
    sectionItem(
      'asset_gate',
      `Asset gate: ${assetGate.status || 'not_run'}`,
      {
        status: assetGate.status || 'not_run',
        questionCount: safeCount(assetGate.questionCount)
      }
    ),
    sectionItem(
      'ocr',
      `OCR: ${ocrProvided} provided, ${ocrMissing} recommended, ${ocrNeedsConfirmation} need confirmation`,
      {
        providedCount: ocrProvided,
        possibleMissingCount: ocrMissing,
        needsConfirmationCount: ocrNeedsConfirmation
      }
    ),
    sectionItem(
      'model_critic',
      criticBlockers.length
        ? `Model critic: blocked by ${criticBlockers.length} ${plural(criticBlockers.length, 'finding')}`
        : `Model critic: ${report.outputs && report.outputs.modelCritic ? 'checked' : 'not_run'}`,
      {
        status: criticBlockers.length ? 'blocked' : (report.outputs && report.outputs.modelCritic ? 'checked' : 'not_run'),
        blockerCount: criticBlockers.length
      }
    )
  ];
  return buildReportSchema('delivery', report.status || 'unknown', {
    qualityMode: report.qualityMode || 'draft',
    inputs: report.inputs || [],
    outputKeys: Object.keys(report.outputs || {}).filter(key => key !== 'markdownSummary'),
    previewProvider: preview.provider || 'none',
    previewStatus: preview.status || 'unknown',
    assetGateStatus: assetGate.status || '',
    ocrProvidedCount: ocr.providedCount || 0,
    ocrPossibleMissingCount: ocr.possibleMissingCount || 0,
    ocrNeedsConfirmationCount: ocr.needsConfirmationCount || 0
  }, {
    evidence,
    pass: steps.filter(step => step.status === 'pass').map(step => sectionItem(step.label, step.label)),
    risk: riskItems.length ? riskItems.map((item, index) => sectionItem(`risk-${index + 1}`, item)) : [sectionItem('none', 'None')],
    not_applicable: report.notApplicable && report.notApplicable.length
      ? report.notApplicable.map((item, index) => sectionItem(`not-applicable-${index + 1}`, item))
      : [sectionItem('none', 'None')],
    unavailable: unavailable.length ? unavailable.map((item, index) => sectionItem(`unavailable-${index + 1}`, item)) : [sectionItem('none', 'None')],
    next_actions: (report.nextActions || []).map((item, index) => sectionItem(`next-${index + 1}`, item))
  });
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

function validationMarkdown(summary = {}) {
  return markdownFromReport(summary.report || validationReport(summary));
}

function deliveryMarkdown(report = {}) {
  return markdownFromReport(report.report || deliveryReport(report));
}

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
  deliveryReport,
  deliveryMarkdown,
  parseJsonFromOutput,
  verificationReport,
  validationReport,
  validationMarkdown
};

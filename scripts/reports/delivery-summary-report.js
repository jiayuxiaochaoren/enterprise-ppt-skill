const {
  buildReportSchema,
  evidenceStrengthLabel,
  markdownFromReport,
  parseJsonFromOutput,
  plural,
  previewEvidence,
  safeCount,
  sectionItem,
  severityPolicyEvidence
} = require('./report-utils');

function parseStepJson(step = {}) {
  if (!step || !step.stdout) return null;
  return parseJsonFromOutput(step.stdout);
}

function countMapsEqual(left = {}, right = {}) {
  const keys = new Set([
    ...Object.keys(left || {}),
    ...Object.keys(right || {})
  ]);
  for (const key of keys) {
    if (safeCount(left && left[key]) !== safeCount(right && right[key])) return false;
  }
  return true;
}

function hasCounts(value = {}) {
  return Object.values(value || {}).some(count => safeCount(count) > 0);
}

function assetDecisionLabel(assetSummary = null) {
  if (!assetSummary) return 'Asset decisions: not_reported';
  const segments = [
    `Asset decisions: ${assetSummary.boundAssetCount} bound assets`,
    `actions ${evidenceStrengthLabel(assetSummary.byAction)}`,
    `provenance ${evidenceStrengthLabel(assetSummary.byProvenanceClass)}`
  ];
  if (
    hasCounts(assetSummary.byProvenanceClassDetail) &&
    !countMapsEqual(assetSummary.byProvenanceClass, assetSummary.byProvenanceClassDetail)
  ) {
    segments.push(`provenance detail ${evidenceStrengthLabel(assetSummary.byProvenanceClassDetail)}`);
  }
  segments.push(`proof ${evidenceStrengthLabel(assetSummary.byProofEligibility)}`);
  if (
    hasCounts(assetSummary.byProofEligibilityDetail) &&
    !countMapsEqual(assetSummary.byProofEligibility, assetSummary.byProofEligibilityDetail)
  ) {
    segments.push(`proof detail ${evidenceStrengthLabel(assetSummary.byProofEligibilityDetail)}`);
  }
  segments.push(`authorization ${evidenceStrengthLabel(assetSummary.byAuthorizationStatus)}`);
  return segments.join('; ');
}

function deliveryReport(report = {}) {
  const steps = report.steps || [];
  const failed = steps.filter(step => step.status === 'fail');
  const validationStep = [...steps].reverse().find(step => /validation/i.test(step.label || ''));
  const validation = parseStepJson(validationStep);
  const validationSummary = validation && (validation.summary || validation);
  const preview = validationSummary && validationSummary.preview || report.preview || {};
  const visualQa = validationSummary && validationSummary.visual_qa || {};
  const severityPolicy = visualQa.severity_policy || {};
  const severitySummary = visualQa.severity_summary || severityPolicy.summary || null;
  const assetGate = report.assetGate || {};
  const assetSummary = report.assetDecisionSummary || null;
  const ocr = report.ocr || {};
  const criticBlockers = Array.isArray(report.criticBlockingFindings) ? report.criticBlockingFindings : [];
  const riskItems = [
    ...failed.map(step => `Step failed: ${step.label}`),
    ...(report.risks || []),
    ...((report.nextActions || []).filter(item => /risk|授权|OCR|clarification|asset|critic|review|补齐|确认/i.test(item))),
    ...((ocr.possibleMissingCount || 0) > 0 ? [`OCR recommended for ${ocr.possibleMissingCount} source(s).`] : []),
    ...((ocr.needsConfirmationCount || 0) > 0 ? [`Low-confidence OCR needs confirmation for ${ocr.needsConfirmationCount} source(s).`] : []),
    ...(assetGate.status && assetGate.status !== 'ready' && assetGate.status !== 'pass' ? [`Asset gate status: ${assetGate.status}.`] : []),
    ...((assetSummary && assetSummary.skippedCriticalVisuals && assetSummary.skippedCriticalVisuals.length)
      ? [`${assetSummary.skippedCriticalVisuals.length} critical visual asset decision(s) skipped images.`]
      : [])
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
      'asset_decisions',
      assetDecisionLabel(assetSummary),
      {
        status: assetSummary ? 'reported' : 'not_reported',
        summary: assetSummary || null
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
    ),
    severityPolicyEvidence(severityPolicy, severitySummary)
  ];
  return buildReportSchema('delivery', report.status || 'unknown', {
    qualityMode: report.qualityMode || 'draft',
    inputs: report.inputs || [],
    outputKeys: Object.keys(report.outputs || {}).filter(key => key !== 'markdownSummary'),
    previewProvider: preview.provider || 'none',
    previewStatus: preview.status || 'unknown',
    assetGateStatus: assetGate.status || '',
    assetDecisionSummary: assetSummary || null,
    severityPolicyVersion: severityPolicy.version || '',
    severityMatrixVersion: severityPolicy.matrixVersion || '',
    severityPromotedTypes: Array.isArray(severityPolicy.promotedTypes) ? severityPolicy.promotedTypes : [],
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

function deliveryMarkdown(report = {}) {
  return markdownFromReport(report.report || deliveryReport(report));
}

module.exports = {
  deliveryMarkdown,
  deliveryReport
};

const {
  VISUAL_SYSTEM
} = require('../design-system');
const {
  applyQualitySeverityPolicy
} = require('./quality-severity-policy');
const {
  buildPreviewReports
} = require('./visual-preview-audit');
const {
  buildSlideReports
} = require('./visual-slide-audit');
const {
  baselineVisualAudit
} = require('./screenshot-baseline-audit');
const {
  runPlanAudits
} = require('./visual-plan-audit');
const {
  contentCoverageAuditFromRender,
  overlayContractAuditFromRender,
  renderMetaSchemaAuditFromRender,
  routeMetadataAuditFromRender
} = require('./render-meta-audits');
const {
  pptxInput,
  readRenderMeta
} = require('./visual-qa-cli');
const {
  acceptanceReadinessForFindings
} = require('./acceptance-readiness');

function sortedSlideEntries(entries = []) {
  return entries.filter(x => /^ppt\/slides\/slide\d+\.xml$/.test(x))
    .sort((a,b)=>Number(a.match(/slide(\d+)/)[1])-Number(b.match(/slide(\d+)/)[1]));
}

function appendFindings(target = [], qaResult = {}) {
  (qaResult.findings || []).forEach(f => target.push(f));
}

function readinessForFindings(findings = [], commercialReadiness = null) {
  const readiness = acceptanceReadinessForFindings(findings);
  return Object.assign({}, readiness, {
    compatibilityVersion: 'qa-readiness/v1',
    failTypes: readiness.blockingTypes,
    commercialReadinessLevel: commercialReadiness && commercialReadiness.level || '',
    commercialAllowedUse: commercialReadiness && commercialReadiness.allowedUse || ''
  });
}

function runVisualQa(options = {}) {
  const {
    baselinePath = '',
    file = '',
    planPath = '',
    previewDir = '',
    qualityMode = 'draft'
  } = options;
  const input = pptxInput(file);
  if (!input.ok) return { success:false, error:input.error, file };
  const { entries, unzipText } = input;

  const qa = VISUAL_SYSTEM.visualQA || {};
  const slideEntries = sortedSlideEntries(entries);
  const findings = [];

  const slideAudit = buildSlideReports(slideEntries, unzipText, qa);
  const slideReports = slideAudit.slideReports;
  appendFindings(findings, slideAudit);

  const previewAudit = buildPreviewReports(previewDir, slideEntries.length, qa);
  const previewReports = previewAudit.previewReports;
  appendFindings(findings, previewAudit);

  const baselineQA = baselineVisualAudit(baselinePath, previewReports);
  appendFindings(findings, baselineQA);

  const renderMetaResult = readRenderMeta(file);
  const renderMetaSchemaQA = renderMetaSchemaAuditFromRender(renderMetaResult, slideEntries.length);
  const routeMetadataQA = routeMetadataAuditFromRender(renderMetaResult);
  const contentCoverageQA = contentCoverageAuditFromRender(renderMetaResult, slideReports);
  const overlayContractQA = overlayContractAuditFromRender(renderMetaResult);
  appendFindings(findings, renderMetaSchemaQA);
  appendFindings(findings, routeMetadataQA);
  appendFindings(findings, contentCoverageQA);
  appendFindings(findings, overlayContractQA);

  const planQA = runPlanAudits({
    baseFindings: findings,
    planPath,
    previewReports,
    renderMetaResult,
    requireContactSheet: Boolean(previewDir)
  });
  appendFindings(findings, planQA);

  const severity = applyQualitySeverityPolicy(findings, qualityMode);
  const effectiveFindings = severity.findings;
  const failCount = effectiveFindings.filter(f => f.level === 'fail').length;
  const reviewCount = effectiveFindings.filter(f => f.level !== 'fail').length;
  const readiness = readinessForFindings(effectiveFindings, planQA.planCommercialReadiness);
  return {
    success: failCount === 0,
    file,
    slide_count: slideEntries.length,
    fail_count: failCount,
    review_count: reviewCount,
    quality_mode: qualityMode,
    severity_policy: severity.policy,
    severity_summary: severity.policy.summary,
    readiness,
    findings: effectiveFindings,
    slides: slideReports,
    previews: previewReports,
    screenshot_baseline_qa: baselineQA,
    plan_asset_checks: planQA.planAssetChecks,
    render_meta: renderMetaResult.file || null,
    render_meta_schema_qa: renderMetaSchemaQA,
    route_metadata_qa: routeMetadataQA,
    content_coverage_qa: contentCoverageQA,
    aesthetic_model: planQA.planAesthetic,
    industry_knowledge: planQA.planIndustryKnowledge,
    composition_model: planQA.planComposition,
    report_depth_qa: planQA.planReportDepth,
    evidence_qa: planQA.planEvidence,
    source_trace_qa: planQA.planSourceTrace,
    page_count_qa: planQA.planPageCount,
    component_plan_qa: planQA.planComponentPlan,
    component_consumption_qa: planQA.planComponentConsumption,
    industry_evidence_chain_qa: planQA.planIndustryEvidenceChain,
    industry_evidence_chain_summary: planQA.planIndustryEvidenceChain
      ? planQA.planIndustryEvidenceChain.industry_evidence_chain_summary || null
      : null,
    overlay_contract_qa: overlayContractQA,
    industry_fit_qa: planQA.planIndustryFit,
    typography_qa: planQA.planTypography,
    chart_semantic_qa: planQA.planChartSemantic,
    chart_visual_qa: planQA.planChartVisual,
    chart_evidence_qa: planQA.planChartEvidence,
    layout_preflight_qa: planQA.planLayoutPreflight,
    page_chart_scores: planQA.planChartScores,
    chart_acceptance_gate: planQA.planChartAcceptanceGate,
    secondary_visual_review: planQA.secondaryAestheticReview,
    commercial_readiness_qa: planQA.planCommercialReadiness,
    acceptance_qa: planQA.planAcceptance
  };
}

module.exports = {
  readinessForFindings,
  runVisualQa,
  sortedSlideEntries
};

#!/usr/bin/env node
/* Structural visual QA for generated PPTX files.
   This complements Keynote preview review by catching tiny text, text-heavy slides,
   missing previews, placeholder copy, and weak image-role fit signals. */
const {
  VISUAL_SYSTEM
} = require('./design-system');
const {
  applyQualitySeverityPolicy
} = require('./qa/quality-severity-policy');
const {
  buildPreviewReports
} = require('./qa/visual-preview-audit');
const {
  buildSlideReports
} = require('./qa/visual-slide-audit');
const {
  baselineVisualAudit
} = require('./qa/screenshot-baseline-audit');
const {
  runPlanAudits
} = require('./qa/visual-plan-audit');
const {
  contentCoverageAuditFromRender,
  overlayContractAuditFromRender,
  renderMetaSchemaAuditFromRender,
  routeMetadataAuditFromRender
} = require('./qa/render-meta-audits');
const {
  failResult,
  parseVisualQaArgs,
  pptxInput,
  readRenderMeta,
  usage
} = require('./qa/visual-qa-cli');

const options = parseVisualQaArgs(process.argv.slice(2));
if (options.usage) usage();
const {
  baselinePath,
  file,
  jsonOnly,
  planPath,
  previewDir,
  qualityMode
} = options;
const input = pptxInput(file);
if (!input.ok) failResult(file, input.error);
const { entries, unzipText } = input;

const qa = VISUAL_SYSTEM.visualQA || {};
const slideEntries = entries.filter(x => /^ppt\/slides\/slide\d+\.xml$/.test(x))
  .sort((a,b)=>Number(a.match(/slide(\d+)/)[1])-Number(b.match(/slide(\d+)/)[1]));
const findings = [];

const slideAudit = buildSlideReports(slideEntries, unzipText, qa);
const slideReports = slideAudit.slideReports;
slideAudit.findings.forEach(f => findings.push(f));

const previewAudit = buildPreviewReports(previewDir, slideEntries.length, qa);
const previewReports = previewAudit.previewReports;
previewAudit.findings.forEach(f => findings.push(f));

const baselineQA = baselineVisualAudit(baselinePath, previewReports);
baselineQA.findings.forEach(f => findings.push(f));

const renderMetaResult = readRenderMeta(file);
const renderMetaSchemaQA = renderMetaSchemaAuditFromRender(renderMetaResult, slideEntries.length);
const routeMetadataQA = routeMetadataAuditFromRender(renderMetaResult);
const contentCoverageQA = contentCoverageAuditFromRender(renderMetaResult, slideReports);
const overlayContractQA = overlayContractAuditFromRender(renderMetaResult);
renderMetaSchemaQA.findings.forEach(f => findings.push(f));
routeMetadataQA.findings.forEach(f => findings.push(f));
contentCoverageQA.findings.forEach(f => findings.push(f));
overlayContractQA.findings.forEach(f => findings.push(f));

const planQA = runPlanAudits({
  baseFindings: findings,
  planPath,
  previewReports,
  renderMetaResult,
  requireContactSheet: Boolean(previewDir)
});
planQA.findings.forEach(f => findings.push(f));

const severity = applyQualitySeverityPolicy(findings, qualityMode);
const effectiveFindings = severity.findings;
const failCount = effectiveFindings.filter(f => f.level === 'fail').length;
const reviewCount = effectiveFindings.filter(f => f.level !== 'fail').length;
const result = {
  success: failCount === 0,
  file,
  slide_count: slideEntries.length,
  fail_count: failCount,
  review_count: reviewCount,
  quality_mode: qualityMode,
  severity_policy: severity.policy,
  severity_summary: severity.policy.summary,
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
  overlay_contract_qa: overlayContractQA,
  industry_fit_qa: planQA.planIndustryFit,
  typography_qa: planQA.planTypography,
  chart_semantic_qa: planQA.planChartSemantic,
  chart_visual_qa: planQA.planChartVisual,
  chart_evidence_qa: planQA.planChartEvidence,
  page_chart_scores: planQA.planChartScores,
  chart_acceptance_gate: planQA.planChartAcceptanceGate,
  secondary_visual_review: planQA.secondaryAestheticReview,
  commercial_readiness_qa: planQA.planCommercialReadiness,
  acceptance_qa: planQA.planAcceptance
};

const output = JSON.stringify(result, null, 2);
if (jsonOnly || !result.success) console.log(output);
else console.log(output);
if (!result.success) process.exit(1);

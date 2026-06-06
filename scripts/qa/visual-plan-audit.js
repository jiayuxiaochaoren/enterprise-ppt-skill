const fs = require('fs');
const path = require('path');
const {
  acceptanceAudit,
  auditDeckPlan,
  commercialReadinessAudit,
  componentPlanAudit,
  compositionAudit,
  evidenceAudit,
  industryFitAudit,
  industryKnowledgeAudit,
  normalizeDeckPlan,
  pageCountAudit,
  reportDepthAudit,
  resolveAssetPath,
  scoreImageAsset,
  sourceTraceAudit,
  typographyAudit,
  visualAestheticModel
} = require('../design-system');
const {
  chartAcceptanceGate,
  chartEvidenceQA,
  chartSemanticQA,
  chartVisualQA,
  pageLevelChartScores
} = require('../chart-spec');
const {
  componentConsumptionAuditFromRender,
  secondaryVisualReview
} = require('./render-meta-audits');
const {
  auditIndustryEvidenceChain
} = require('./industry-evidence-chain-audit');

function defaultPlanAuditResult() {
  return {
    findings: [],
    planAssetChecks: [],
    planAesthetic: null,
    planIndustryKnowledge: null,
    planComposition: null,
    planAcceptance: null,
    planReportDepth: null,
    planEvidence: null,
    planPageCount: null,
    planComponentPlan: null,
    planIndustryFit: null,
    planIndustryEvidenceChain: null,
    planComponentConsumption: null,
    planSourceTrace: null,
    planCommercialReadiness: null,
    planTypography: null,
    planChartSemantic: null,
    planChartVisual: null,
    planChartEvidence: null,
    planChartScores: null,
    planChartAcceptanceGate: null,
    secondaryAestheticReview: null
  };
}

function resolvePlanAssetPath(value, baseDir) {
  if (!value) return '';
  if (path.isAbsolute(value)) return value;
  const fromPlan = path.resolve(baseDir, value);
  if (fs.existsSync(fromPlan)) return fromPlan;
  return resolveAssetPath(value);
}

function runPlanAudits(options = {}) {
  const {
    baseFindings = [],
    planPath = '',
    previewReports = [],
    renderMetaResult = {},
    requireContactSheet = false
  } = options;
  const result = defaultPlanAuditResult();
  const findings = result.findings;
  if (!planPath) return result;
  if (!fs.existsSync(planPath)) {
    findings.push({ level:'fail', type:'planMissing', message:`plan not found: ${planPath}` });
    return result;
  }
  try {
    const rawPlan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    const normalized = normalizeDeckPlan(rawPlan);
    result.planAesthetic = visualAestheticModel(rawPlan, normalized);
    result.planIndustryKnowledge = industryKnowledgeAudit(rawPlan, normalized);
    result.planComposition = { findings: compositionAudit(rawPlan, normalized) };
    result.planReportDepth = reportDepthAudit(rawPlan, normalized);
    result.planEvidence = evidenceAudit(rawPlan, normalized);
    result.planPageCount = pageCountAudit(rawPlan, normalized);
    result.planComponentPlan = componentPlanAudit(rawPlan, normalized);
    result.planIndustryFit = industryFitAudit(rawPlan, normalized);
    result.planComponentConsumption = componentConsumptionAuditFromRender(normalized, renderMetaResult);
    result.planIndustryEvidenceChain = auditIndustryEvidenceChain(rawPlan, normalized, {
      renderMeta: renderMetaResult.meta || (renderMetaResult.error ? { __readError:renderMetaResult.error } : null)
    });
    result.planSourceTrace = sourceTraceAudit(rawPlan, normalized);
    result.planTypography = typographyAudit(rawPlan, normalized, renderMetaResult.meta);
    result.planChartSemantic = chartSemanticQA(rawPlan, normalized);
    result.planChartVisual = chartVisualQA(rawPlan, normalized, renderMetaResult.meta);
    result.planChartEvidence = chartEvidenceQA(rawPlan, normalized);
    result.planChartScores = pageLevelChartScores(rawPlan, normalized, renderMetaResult.meta);
    result.planChartAcceptanceGate = chartAcceptanceGate(rawPlan, normalized, renderMetaResult.meta, {
      previewReports,
      requireContactSheet
    });
    result.secondaryAestheticReview = secondaryVisualReview(normalized, result.planAesthetic, previewReports);
    const acceptanceOptions = {
      renderMeta: renderMetaResult.meta,
      previewReports,
      requireContactSheet
    };
    result.planCommercialReadiness = commercialReadinessAudit(rawPlan, normalized, [
      ...baseFindings,
      ...((result.planChartSemantic && result.planChartSemantic.findings) || []),
      ...((result.planChartVisual && result.planChartVisual.findings) || []),
      ...((result.planChartEvidence && result.planChartEvidence.findings) || []),
      ...((result.planChartAcceptanceGate && result.planChartAcceptanceGate.findings) || []),
      ...((result.secondaryAestheticReview && result.secondaryAestheticReview.findings) || [])
    ], acceptanceOptions);
    result.planAcceptance = acceptanceAudit(rawPlan, normalized, acceptanceOptions);
    auditDeckPlan(rawPlan, normalized).forEach(f => findings.push(f));
    [
      result.planReportDepth,
      result.planEvidence,
      result.planPageCount,
      result.planComponentPlan,
      result.planIndustryFit,
      result.planComponentConsumption,
      result.planIndustryEvidenceChain,
      result.planSourceTrace,
      result.planTypography,
      result.planChartSemantic,
      result.planChartVisual,
      result.planChartEvidence,
      result.planChartAcceptanceGate
    ].forEach(audit => (audit.findings || []).forEach(f => findings.push(f)));
    if (result.secondaryAestheticReview) result.secondaryAestheticReview.findings.forEach(f => findings.push(f));
    const baseDir = path.dirname(planPath);
    const industry = String(rawPlan.industry || normalized.industry || '').toLowerCase();
    result.planAssetChecks = (normalized.slides || []).map((slide, i) => {
      const imageValue = (slide.visual && slide.visual.image) || slide.image || '';
      const resolvedImage = resolvePlanAssetPath(imageValue, baseDir);
      const gallery = [
        ...(Array.isArray(slide.images) ? slide.images : []),
        ...((slide.visual && Array.isArray(slide.visual.images)) ? slide.visual.images : [])
      ].map(x => resolvePlanAssetPath(x, baseDir));
      const hasBoundAsset = (resolvedImage && fs.existsSync(resolvedImage)) || gallery.some(x => fs.existsSync(x));
      const assetRefs = [imageValue, ...(Array.isArray(slide.images) ? slide.images : []), ...((slide.visual && Array.isArray(slide.visual.images)) ? slide.visual.images : [])]
        .map(String)
        .filter(Boolean);
      assetRefs.forEach(ref => {
        const resolved = resolvePlanAssetPath(ref, baseDir);
        const quality = scoreImageAsset(resolved, 'evidence');
        if (quality.exists && quality.verdict === 'reject' && !rawPlan.allowDirtyAssets && !slide.allowDirtyAssets) {
          findings.push({
            slide:i+1,
            level:'review',
            type:'weakImageAsset',
            message:`image asset needs review: ${path.basename(resolved)} (${quality.issues.join('; ')})`
          });
        }
      });
      if (industry && !industry.includes('manufacturing') && assetRefs.some(ref => /manufacturing|factory|industrial-line/i.test(ref))) {
        findings.push({
          slide:i+1,
          level:'fail',
          type:'crossIndustryAsset',
          message:'slide references manufacturing/factory media in a non-manufacturing deck plan'
        });
      }
      const prompt = slide.generatedAssetPrompt || '';
      if (prompt && !hasBoundAsset) {
        findings.push({
          slide:i+1,
          level:'fail',
          type:'unboundGeneratedAsset',
          message:'generatedAssetPrompt exists but no generated/real image asset is bound into the deck plan'
        });
      }
      return {
        slide:i+1,
        generatedAssetPrompt: Boolean(prompt),
        boundAsset: Boolean(hasBoundAsset),
        image: imageValue || null
      };
    });
  } catch (e) {
    findings.push({ level:'fail', type:'planUnreadable', message:String(e.message || e) });
  }
  return result;
}

module.exports = {
  defaultPlanAuditResult,
  resolvePlanAssetPath,
  runPlanAudits
};

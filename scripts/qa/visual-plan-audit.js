const fs = require('fs');
const path = require('path');
const {
  acceptanceAudit, auditDeckPlan, commercialReadinessAudit, componentPlanAudit, compositionAudit, evidenceAudit,
  industryFitAudit, industryKnowledgeAudit, normalizeDeckPlan, pageCountAudit, reportDepthAudit, resolveAssetPath,
  scoreImageAsset, sourceTraceAudit, typographyAudit, visualAestheticModel
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
const {
  assetTargetContract,
  generatedPromptAspectConflict
} = require('../design/asset-generation');
const {
  layoutPreflightAudit
} = require('../design/layout-preflight');
const {
  aspectMismatch,
  auditForAssetRef,
  coverImageConsumptionAudit,
  factualSyntheticRisk,
  generatedOrSynthetic
} = require('./visual-plan-asset-audit');

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
    planLayoutPreflight: null,
    planChartAcceptanceGate: null,
    planCoverImageConsumption: null,
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
    requireContactSheet = false,
    slideReports = []
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
    result.planLayoutPreflight = layoutPreflightAudit(rawPlan, normalized);
    result.planCoverImageConsumption = coverImageConsumptionAudit(rawPlan, normalized, {
      renderMeta: renderMetaResult.meta || null,
      slideReports
    });
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
      result.planLayoutPreflight,
      result.planCoverImageConsumption,
      result.planChartAcceptanceGate
    ].forEach(audit => (audit.findings || []).forEach(f => findings.push(f)));
    if (result.secondaryAestheticReview) result.secondaryAestheticReview.findings.forEach(f => findings.push(f));
    const baseDir = path.dirname(planPath);
    const industry = String(rawPlan.industry || normalized.industry || '').toLowerCase();
    const renderSlides = renderMetaResult && renderMetaResult.meta && Array.isArray(renderMetaResult.meta.slides)
      ? renderMetaResult.meta.slides
      : [];
    result.planAssetChecks = (normalized.slides || []).map((slide, i) => {
      const renderedSlide = renderSlides.find(item => Number(item && item.slide) === i + 1) || renderSlides[i] || {};
      const renderedAssetDecision = renderedSlide.assetDecision || {};
      const renderedBoundAssets = Array.isArray(renderedAssetDecision.boundAssets)
        ? renderedAssetDecision.boundAssets
        : [];
      const renderedAssetForRef = ref => {
        const refName = path.basename(String(ref || ''));
        return renderedBoundAssets.find(item => {
          const itemPath = String((item && item.path) || '');
          return itemPath === String(ref || '') || path.basename(itemPath) === refName;
        }) || null;
      };
      const rendererHandledAspect = renderedAssetDecision.fitFallbackContain === true ||
        renderedAssetDecision.aspectMismatchAllowed === true ||
        (Array.isArray(renderedAssetDecision.boundAssets) && renderedAssetDecision.boundAssets.some(item => item && item.aspectMismatchAllowed === true));
      const coverImageValue = slide.coverImage || slide.coverImagePath || slide.cover_image || slide.cover_image_path ||
        (i === 0 ? (rawPlan.coverImage || rawPlan.coverImagePath || rawPlan.cover_image || rawPlan.cover_image_path || '') : '');
      const imageValue = coverImageValue || (slide.visual && slide.visual.image) || slide.image || '';
      const resolvedImage = resolvePlanAssetPath(imageValue, baseDir);
      const gallery = [
        ...(Array.isArray(slide.images) ? slide.images : []),
        ...((slide.visual && Array.isArray(slide.visual.images)) ? slide.visual.images : [])
      ].map(x => resolvePlanAssetPath(x, baseDir));
      const hasBoundAsset = (resolvedImage && fs.existsSync(resolvedImage)) || gallery.some(x => fs.existsSync(x));
      const assetRefs = [...new Set([coverImageValue, imageValue, ...(Array.isArray(slide.images) ? slide.images : []), ...((slide.visual && Array.isArray(slide.visual.images)) ? slide.visual.images : [])]
        .map(String)
        .filter(Boolean))];
      const generation = slide.assetGeneration || {};
      const trace = slide.sourceTrace || {};
      const target = generation.target || assetTargetContract(normalized, slide, generation.originalRole || generation.role || (slide.visual && slide.visual.role) || '');
      const mustBindGenerated = generation.mustBind === true || generation.status === 'required';
      if (mustBindGenerated && (!target || !target.aspectRatio)) {
        findings.push({
          slide:i+1,
          level:'fail',
          type:'generatedTargetMissing',
          message:'required generated asset is missing an auditable target aspect contract'
        });
      } else if (mustBindGenerated && target.reviewRequired) {
        findings.push({
          slide:i+1,
          level:'review',
          type:'generatedTargetMissing',
          message:`required generated asset relies on ${target.targetSource || 'fallback'} instead of an explicit or renderer slot target`
        });
      }
      if (generatedOrSynthetic(slide) && factualSyntheticRisk(slide)) {
        findings.push({
          slide:i+1,
          level:'fail',
          type:'generatedAssetCannotSatisfyFactualProof',
          message:'synthetic generated image is requested for copy that implies real customer/site/product proof'
        });
      }
      assetRefs.forEach(ref => {
        const resolved = resolvePlanAssetPath(ref, baseDir);
        const assetAudit = auditForAssetRef(ref, generation, trace);
        const renderedAssetAudit = renderedAssetForRef(ref);
        const assetTarget = (assetAudit && (assetAudit.assetTarget || assetAudit.target)) || target;
        const qualityRole = (assetTarget && (assetTarget.resolvedRole || assetTarget.role)) ||
          generation.resolvedRole ||
          generation.role ||
          (slide.visual && slide.visual.role) ||
          'evidence';
        const quality = scoreImageAsset(resolved, qualityRole);
        if (quality.exists && quality.verdict === 'reject' && !rawPlan.allowDirtyAssets && !slide.allowDirtyAssets) {
          findings.push({
            slide:i+1,
            level:'review',
            type:'weakImageAsset',
            message:`image asset needs review: ${path.basename(resolved)} (${quality.issues.join('; ')})`
          });
        }
        const imageAspect = renderedAssetAudit && renderedAssetAudit.imageAspectRatio
          ? renderedAssetAudit.imageAspectRatio
          : (assetAudit && assetAudit.imageAspectRatio ? assetAudit.imageAspectRatio : quality.aspectRatio);
        const targetAspect = renderedAssetAudit && renderedAssetAudit.targetAspectRatio
          ? renderedAssetAudit.targetAspectRatio
          : (assetAudit && assetAudit.targetAspectRatio ? assetAudit.targetAspectRatio : (assetTarget && assetTarget.aspectRatio));
        const mismatch = renderedAssetAudit && renderedAssetAudit.aspectMismatch != null
          ? renderedAssetAudit.aspectMismatch
          : (quality.exists && targetAspect
          ? aspectMismatch(imageAspect, targetAspect)
          : null);
        const enforceTarget = Boolean(
          (generation.status === 'bound' && targetAspect) ||
          mustBindGenerated ||
          generatedOrSynthetic(slide)
        );
        if (
          enforceTarget &&
          mismatch != null &&
          mismatch > 0.25 &&
          !rendererHandledAspect &&
          generation.aspectMismatchAllowed !== true &&
          !(renderedAssetAudit && renderedAssetAudit.aspectMismatchAllowed === true) &&
          !(assetAudit && assetAudit.aspectMismatchAllowed === true) &&
          slide.allowAspectMismatch !== true
        ) {
          findings.push({
            slide:i+1,
            level:'fail',
            type:'assetAspectMismatch',
            message:`image asset ${path.basename(resolved)} aspect ${imageAspect} differs from target ${targetAspect} by ${Math.round(mismatch * 100)}%`
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
      if (prompt && generatedPromptAspectConflict(prompt, target)) {
        findings.push({
          slide:i+1,
          level:'fail',
          type:'generatedPromptAspectConflict',
          message:'generated asset prompt contains aspect instructions that conflict with the target asset contract'
        });
      }
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
        image: imageValue || null,
        assetTarget: target || null
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

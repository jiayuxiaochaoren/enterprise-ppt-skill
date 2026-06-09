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
const {
  assetTargetContract,
  generatedPromptAspectConflict
} = require('../design/asset-generation');

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

function aspectMismatch(imageAspectRatio, targetAspectRatio) {
  const image = Number(imageAspectRatio);
  const target = Number(targetAspectRatio);
  if (!Number.isFinite(image) || !Number.isFinite(target) || image <= 0 || target <= 0) return null;
  return Number((Math.abs(image - target) / target).toFixed(3));
}

function refMatchesAudit(ref = '', audit = {}) {
  const a = String(ref || '');
  const candidates = [audit.path, audit.file, audit.sourceId].map(value => String(value || '')).filter(Boolean);
  return candidates.some(candidate => candidate === a || path.basename(candidate) === path.basename(a));
}

function auditForAssetRef(ref = '', generation = {}, trace = {}) {
  const candidates = [
    ...(Array.isArray(generation.boundAssets) ? generation.boundAssets : []),
    ...(Array.isArray(trace.imageProvenance) ? trace.imageProvenance : [])
  ];
  return candidates.find(item => item && refMatchesAudit(ref, item)) || null;
}

function generatedOrSynthetic(slide = {}) {
  const generation = slide.assetGeneration || {};
  const visual = slide.visual || {};
  return generation.syntheticOnly === true ||
    visual.generated === true ||
    /generated|imagegen|model|synthetic/i.test(`${visual.mode || ''} ${generation.reason || ''} ${generation.decisionSource || ''}`);
}

function factualSyntheticRisk(slide = {}) {
  const text = [
    slide.title,
    slide.subtitle,
    slide.claim,
    slide.proofObject,
    slide.assetBrief,
    slide.visual && slide.visual.caption,
    slide.visual && slide.visual.prompt
  ].filter(Boolean).join(' ');
  return /真实客户|客户截图|真实截图|授权截图|证书|条码|门店陈列|现场实拍|真实SKU|真实产品包装|真实门店|真实数据截图/i.test(text);
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
        const imageAspect = assetAudit && assetAudit.imageAspectRatio ? assetAudit.imageAspectRatio : quality.aspectRatio;
        const targetAspect = assetAudit && assetAudit.targetAspectRatio ? assetAudit.targetAspectRatio : (assetTarget && assetTarget.aspectRatio);
        const mismatch = quality.exists && targetAspect
          ? aspectMismatch(imageAspect, targetAspect)
          : null;
        const enforceTarget = Boolean(
          (generation.status === 'bound' && targetAspect) ||
          mustBindGenerated ||
          generatedOrSynthetic(slide)
        );
        if (
          enforceTarget &&
          mismatch != null &&
          mismatch > 0.25 &&
          generation.aspectMismatchAllowed !== true &&
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

const path = require('path');

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

function compactUnique(values = []) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
}

function coverImageRefFor(plan = {}, slide = {}) {
  return slide.coverImage || slide.coverImagePath || slide.cover_image || slide.cover_image_path ||
    plan.coverImage || plan.coverImagePath || plan.cover_image || plan.cover_image_path || '';
}

function renderedAssetRefs(renderedSlide = {}) {
  const decision = renderedSlide.assetDecision || {};
  const refs = [
    ...((decision.boundAssetRefs) || []),
    ...((decision.boundAssets) || []).flatMap(item => [
      item && item.path,
      item && item.file,
      item && item.sourceId,
      item && item.source_id
    ]),
    decision.fitDecision && decision.fitDecision.path
  ];
  return compactUnique(refs);
}

function refMatches(ref = '', candidate = '') {
  const left = String(ref || '');
  const right = String(candidate || '');
  if (!left || !right) return false;
  return left === right || path.basename(left) === path.basename(right);
}

function coverImageConsumptionAudit(rawPlan = {}, normalizedPlan = {}, options = {}) {
  const findings = [];
  const slides = Array.isArray(normalizedPlan.slides) ? normalizedPlan.slides : (Array.isArray(rawPlan.slides) ? rawPlan.slides : []);
  const renderSlides = options.renderMeta && Array.isArray(options.renderMeta.slides) ? options.renderMeta.slides : [];
  const slideReports = Array.isArray(options.slideReports) ? options.slideReports : [];
  slides.forEach((slide, index) => {
    const isCover = index === 0 || /cover/i.test(String(slide && slide.type || ''));
    if (!isCover) return;
    const declaredRef = coverImageRefFor(rawPlan, slide);
    if (!declaredRef) return;
    const slideNo = index + 1;
    const rendered = renderSlides.find(item => Number(item && item.slide) === slideNo) || renderSlides[index] || {};
    const metaRefs = renderedAssetRefs(rendered);
    const metaConsumed = metaRefs.some(ref => refMatches(declaredRef, ref));
    const report = slideReports.find(item => Number(item && item.slide) === slideNo) || slideReports[index] || null;
    const xmlHasImage = report ? Number(report.images || report.imageShapes || 0) > 0 : true;
    if (!metaConsumed || !xmlHasImage) {
      findings.push({
        slide:slideNo,
        level:'fail',
        type:'coverImageNotConsumed',
        message:`declared coverImage was not consumed by slide ${slideNo}: ${path.basename(String(declaredRef))}`,
        coverImage:declaredRef,
        renderMetaRefs:metaRefs,
        xmlHasImage
      });
    }
  });
  return {
    status: findings.length ? 'fail' : 'pass',
    findings
  };
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
  const syntheticBoundary = /示意|原型|概念|抽象|非真实|不伪造真实|非事实|mockup|prototype|concept|illustrative|synthetic|non-factual/i.test(text);
  if (syntheticBoundary) return false;
  return /真实客户|客户截图|真实截图|授权截图|证书|条码|门店陈列|现场实拍|真实SKU|真实产品包装|真实门店|真实数据截图/i.test(text);
}

module.exports = {
  aspectMismatch,
  auditForAssetRef,
  coverImageConsumptionAudit,
  factualSyntheticRisk,
  generatedOrSynthetic
};

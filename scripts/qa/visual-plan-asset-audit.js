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
  factualSyntheticRisk,
  generatedOrSynthetic
};

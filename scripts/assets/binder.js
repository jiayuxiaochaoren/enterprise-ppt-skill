const fs = require('fs');
const path = require('path');

const ASSET_BINDER_DECISION_SOURCE = 'asset-binder/v1';
const { imageDimensions } = require('../design-system');
const {
  assetTargetContract
} = require('../design/asset-generation');
const { preferredAuthorizationStatus } = require('../design/source-evidence');

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(path.resolve(file), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function normalizeAssetSpec(asset, cwd = process.cwd()) {
  const spec = typeof asset === 'string' ? { path: asset } : (asset || {});
  if (!spec.path) return null;
  const absoluteAsset = path.isAbsolute(spec.path) ? spec.path : path.resolve(cwd, spec.path);
  const assetPath = path.isAbsolute(spec.path) ? spec.path : path.relative(cwd, absoluteAsset);
  return Object.assign({}, spec, { assetPath, absoluteAsset });
}

function provenanceClassFor(spec = {}) {
  const text = `${spec.type || ''} ${spec.provenanceClass || ''} ${spec.source || ''}`.toLowerCase();
  if (spec.generated === true || /generated|imagegen|model|synthetic/.test(text)) return 'model-generated-preview';
  if (/user-owned|owned|provided|first-party|用户|自有/.test(text)) return 'user-owned';
  if (/public|licensed|unsplash|wikimedia|pexels|stock/.test(text)) return 'public-licensed';
  return 'synthetic-only';
}

function proofEligibilityFor(spec = {}, provenanceClass = provenanceClassFor(spec)) {
  if (spec.proofEligibility) return spec.proofEligibility;
  if (provenanceClass === 'user-owned') return 'factual-proof';
  if (provenanceClass === 'public-licensed') return 'generic-category';
  return 'synthetic-only';
}

function attributionFor(item = {}, parent = {}) {
  const provenanceClass = provenanceClassFor(Object.assign({}, parent, item));
  const proofEligibility = proofEligibilityFor(Object.assign({}, parent, item), provenanceClass);
  return {
    type: item.type || parent.type || provenanceClass,
    path: item.assetPath,
    source: item.source || parent.source || (provenanceClass.startsWith('model-generated') ? 'Codex imagegen / gpt-image-2 workflow' : 'user-provided or licensed asset'),
    url: item.url || parent.url || undefined,
    license: item.license || parent.license || undefined,
    dimensions: item.dimensions || undefined,
    imageAspectRatio: item.imageAspectRatio || undefined,
    targetAspectRatio: item.targetAspectRatio || undefined,
    aspectMismatch: item.aspectMismatch == null ? undefined : item.aspectMismatch,
    aspectMismatchAllowed: item.aspectMismatchAllowed || undefined,
    assetTarget: item.assetTarget || parent.assetTarget || undefined,
    provenanceClass,
    proofEligibility,
    authorizationStatus: item.authorizationStatus || parent.authorizationStatus || (proofEligibility === 'factual-proof' ? 'cleared' : 'synthetic-only'),
    note: item.note || parent.note || (proofEligibility === 'factual-proof'
      ? 'Asset may be used as factual proof according to the supplied provenance.'
      : 'Asset must not be used as factual proof for named customers, real sites, real employees, real screenshots, or real data.')
  };
}

function ensureSourceTrace(slide = {}) {
  slide.sourceTrace = Object.assign({
    version: 'source-trace/v2',
    sourceIds: [],
    sources: [],
    imageProvenance: []
  }, slide.sourceTrace || {});
  if (!Array.isArray(slide.sourceTrace.imageProvenance)) slide.sourceTrace.imageProvenance = [];
  return slide.sourceTrace;
}

function imageProvenanceFor(attr = {}, slideNo = 0, index = 0) {
  return {
    sourceId: attr.sourceId || `bound-image-slide-${slideNo}-${index + 1}`,
    file: attr.path,
    path: attr.path,
    source: attr.source,
    url: attr.url,
    license: attr.license,
    dimensions: attr.dimensions,
    imageAspectRatio: attr.imageAspectRatio,
    targetAspectRatio: attr.targetAspectRatio,
    aspectMismatch: attr.aspectMismatch,
    aspectMismatchAllowed: attr.aspectMismatchAllowed,
    assetTarget: attr.assetTarget,
    provenanceClass: attr.provenanceClass,
    proofEligibility: attr.proofEligibility,
    authorizationStatus: attr.authorizationStatus,
    note: attr.note
  };
}

function compactUnique(values = []) {
  return [...new Set((values || []).filter(value => value != null && String(value).trim() !== '').map(value => String(value)))];
}

function toArray(value) {
  if (value == null || value === '') return [];
  return Array.isArray(value) ? value : [value];
}

function updateTraceAuthorizationStatus(trace = {}, slide = {}) {
  const proof = slide.proof || {};
  const proofTrace = proof.sourceTrace || {};
  const imageProvenance = Array.isArray(trace.imageProvenance) ? trace.imageProvenance : [];
  const statuses = compactUnique([
    proof.assetAuthorizationStatus,
    proof.asset_authorization_status,
    ...toArray(proof.assetAuthorizationStatuses),
    ...toArray(proof.asset_authorization_statuses),
    proofTrace.assetAuthorizationStatus,
    proofTrace.asset_authorization_status,
    ...toArray(proofTrace.assetAuthorizationStatuses),
    ...toArray(proofTrace.asset_authorization_statuses),
    slide.assetAuthorizationStatus,
    slide.asset_authorization_status,
    ...toArray(slide.assetAuthorizationStatuses),
    ...toArray(slide.asset_authorization_statuses),
    trace.assetAuthorizationStatus,
    trace.asset_authorization_status,
    ...toArray(trace.assetAuthorizationStatuses),
    ...toArray(trace.asset_authorization_statuses),
    ...imageProvenance.map(item => item && (item.authorizationStatus || item.authorization_status))
  ]);
  const preferred = preferredAuthorizationStatus(statuses);
  if (preferred) trace.assetAuthorizationStatus = preferred;
  trace.assetAuthorizationStatuses = statuses;
  return trace.assetAuthorizationStatus || '';
}

function imageAspectRatioFor(asset = {}) {
  const dims = asset.dimensions || {};
  const w = Number(dims.w);
  const h = Number(dims.h);
  return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0
    ? Number((w / h).toFixed(3))
    : null;
}

function targetForBinding(plan = {}, slide = {}, spec = {}, asset = {}) {
  const explicitTarget = asset.target || spec.target || (asset.assetGeneration && asset.assetGeneration.target) || null;
  const targetAspectRatio = asset.targetAspectRatio || spec.targetAspectRatio || (explicitTarget && explicitTarget.aspectRatio);
  const targetSlot = asset.targetSlot || spec.targetSlot || (explicitTarget && explicitTarget.slot);
  const targetSlide = Object.assign({}, slide);
  if (explicitTarget || targetAspectRatio || targetSlot) {
    targetSlide.assetGeneration = Object.assign({}, targetSlide.assetGeneration || {}, {
      target: Object.assign({}, explicitTarget || {}, {
        aspectRatio: targetAspectRatio || (explicitTarget && explicitTarget.aspectRatio),
        slot: targetSlot || (explicitTarget && explicitTarget.slot),
        targetSource: (explicitTarget && explicitTarget.targetSource) || (targetSlot ? 'asset-map.targetSlot' : 'asset-map.targetAspectRatio')
      })
    });
  }
  const generation = targetSlide.assetGeneration || {};
  const role = asset.role || spec.role || generation.originalRole || generation.role || (targetSlide.visual && targetSlide.visual.role) || '';
  return assetTargetContract(plan, targetSlide, role, {
    originalRole: generation.originalRole || role,
    resolvedRole: generation.resolvedRole || generation.role || role
  });
}

function shouldEnforceAspectTarget(slide = {}, spec = {}, asset = {}, target = {}) {
  const generation = slide.assetGeneration || {};
  const generatedText = `${asset.type || ''} ${spec.type || ''} ${asset.source || ''} ${spec.source || ''}`.toLowerCase();
  const generated = asset.generated === true || spec.generated === true || /generated|imagegen|model|synthetic/.test(generatedText);
  const explicitTarget = Boolean(generation.target || spec.target || asset.target || spec.targetAspectRatio || asset.targetAspectRatio || spec.targetSlot || asset.targetSlot);
  if (!target || !target.aspectRatio) return false;
  if (target.reviewRequired && !generation.mustBind && !explicitTarget) return false;
  return Boolean(explicitTarget || generation.mustBind || generation.status === 'required' || generated);
}

function applyAssetTargetValidation(plan = {}, slide = {}, spec = {}, asset = {}, errors = [], slideNo = 0, position = '') {
  const target = targetForBinding(plan, slide, spec, asset);
  const imageAspectRatio = imageAspectRatioFor(asset);
  const targetAspectRatio = Number(target.aspectRatio || 0);
  const aspectMismatch = imageAspectRatio && targetAspectRatio
    ? Number((Math.abs(imageAspectRatio - targetAspectRatio) / targetAspectRatio).toFixed(3))
    : null;
  const allowMismatch = spec.allowAspectMismatch === true || asset.allowAspectMismatch === true;
  const enriched = Object.assign({}, asset, {
    assetTarget: target,
    imageAspectRatio,
    targetAspectRatio: targetAspectRatio || undefined,
    aspectMismatch: aspectMismatch == null ? undefined : aspectMismatch,
    aspectMismatchAllowed: allowMismatch || undefined
  });
  if (
    shouldEnforceAspectTarget(slide, spec, asset, target) &&
    aspectMismatch != null &&
    aspectMismatch > 0.25 &&
    !allowMismatch
  ) {
    errors.push({
      slide: slideNo,
      position,
      type: 'assetAspectMismatch',
      path: asset.assetPath,
      imageAspectRatio,
      targetAspectRatio,
      aspectMismatch,
      message: `asset aspect ratio ${imageAspectRatio} differs from target ${targetAspectRatio} by ${Math.round(aspectMismatch * 100)}%`
    });
  }
  return enriched;
}

function boundAssetAuditFor(item = {}) {
  const target = item.assetTarget || {};
  return {
    path: item.assetPath,
    dimensions: item.dimensions,
    imageAspectRatio: item.imageAspectRatio,
    targetAspectRatio: item.targetAspectRatio,
    aspectMismatch: item.aspectMismatch == null ? undefined : item.aspectMismatch,
    aspectMismatchAllowed: item.aspectMismatchAllowed || undefined,
    targetSlot: target.slot || undefined,
    targetSource: target.targetSource || undefined,
    fitPolicy: target.fitPolicy || undefined,
    assetTarget: target
  };
}

function assetWithWorstMismatch(assets = []) {
  return (assets || []).reduce((best, item) => {
    if (!best) return item;
    return Number(item && item.aspectMismatch || 0) > Number(best && best.aspectMismatch || 0) ? item : best;
  }, null);
}

function boundAssetGenerationFields(assets = []) {
  const primary = assets[0] || {};
  const worst = assetWithWorstMismatch(assets) || primary;
  const boundAssets = assets.map(boundAssetAuditFor);
  return {
    target: primary.assetTarget,
    imageDimensions: primary.dimensions,
    imageAspectRatio: primary.imageAspectRatio,
    targetAspectRatio: primary.targetAspectRatio,
    aspectMismatch: worst && worst.aspectMismatch,
    worstAspectMismatch: worst && worst.aspectMismatch,
    aspectMismatchAllowed: assets.some(item => item.aspectMismatchAllowed === true) || undefined,
    boundAssets
  };
}

function validateAssetSpec(asset, slideNo, position, errors, cwd) {
  const spec = normalizeAssetSpec(asset, cwd);
  if (!spec) {
    errors.push({ slide: slideNo, position, type: 'assetPathMissing', message: 'asset mapping must include a path' });
    return null;
  }
  if (!fs.existsSync(spec.absoluteAsset)) {
    errors.push({ slide: slideNo, position, type: 'assetFileMissing', path: spec.assetPath, message: 'asset file does not exist' });
    return null;
  }
  const dims = imageDimensions(spec.absoluteAsset);
  if (!dims) {
    errors.push({ slide: slideNo, position, type: 'assetDimensionsUnreadable', path: spec.assetPath, message: 'asset must be a readable PNG or JPG image' });
    return null;
  }
  return Object.assign({}, spec, {
    dimensions: { w: dims.w, h: dims.h, type: dims.type }
  });
}

function bindGeneratedAssets(plan = {}, mapping = {}, opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const slides = Array.isArray(plan.slides) ? plan.slides : [];
  const errors = [];
  const entries = Object.entries(mapping || {});
  if (!entries.length) {
    errors.push({ type: 'mappingEmpty', message: 'asset mapping is empty' });
  }

  const prepared = entries.map(([slideNo, asset]) => {
    const idx = Number(slideNo) - 1;
    if (!Number.isInteger(idx) || idx < 0 || idx >= slides.length) {
      errors.push({ slide: slideNo, type: 'slideOutOfRange', message: `slide ${slideNo} is outside deck slide range` });
      return null;
    }
    const spec = typeof asset === 'string' ? { path: asset } : (asset || {});
    if (Array.isArray(spec.images) && spec.images.length) {
      const assets = spec.images.map((item, i) => {
        const validated = validateAssetSpec(item, Number(slideNo), `images[${i}]`, errors, cwd);
        return validated ? applyAssetTargetValidation(plan, slides[idx], spec, validated, errors, Number(slideNo), `images[${i}]`) : null;
      }).filter(Boolean);
      return { slideNo: Number(slideNo), idx, spec, assets };
    }
    const single = validateAssetSpec(spec, Number(slideNo), 'single', errors, cwd);
    return single ? { slideNo: Number(slideNo), idx, spec, assets: [applyAssetTargetValidation(plan, slides[idx], spec, single, errors, Number(slideNo), 'single')] } : null;
  }).filter(Boolean);

  if (errors.length) return { plan, boundSlides: 0, errors };

  let boundSlides = 0;
  prepared.forEach(({ slideNo, idx, spec, assets }) => {
    const slide = slides[idx];
    if (assets.length > 1 || Array.isArray(spec.images)) {
      slide.images = assets.map(item => item.assetPath);
      slide.visual = Object.assign({}, slide.visual || {}, {
        mode: spec.mode || 'hybrid',
        role: spec.role || 'gallery',
        generated: assets.every(item => item.type === 'generated-image' || item.generated === true)
      });
      slide.assetGeneration = Object.assign({}, slide.assetGeneration || {}, {
        decisionSource: ASSET_BINDER_DECISION_SOURCE,
        status: 'bound',
        bound: true,
        boundCount: assets.length,
        role: spec.role || 'gallery'
      }, boundAssetGenerationFields(assets));
      if (!slide.assetAttribution) slide.assetAttribution = [];
      const trace = ensureSourceTrace(slide);
      assets.forEach((item, i) => {
        const attr = attributionFor(item, spec);
        slide.assetAttribution.push(attr);
        trace.imageProvenance.push(imageProvenanceFor(attr, slideNo, i));
      });
      updateTraceAuthorizationStatus(trace, slide);
      boundSlides += 1;
      return;
    }
    const single = assets[0];
    slide.visual = Object.assign({}, slide.visual || {}, {
      image: single.assetPath,
      mode: single.mode || (slide.visual && slide.visual.mode === 'photo' ? 'photo' : 'hybrid'),
      role: single.role || (slide.visual && slide.visual.role),
      generated: single.type === 'generated-image' || single.generated === true
    });
    slide.assetGeneration = Object.assign({}, slide.assetGeneration || {}, {
      decisionSource: ASSET_BINDER_DECISION_SOURCE,
      status: 'bound',
      bound: true,
      boundCount: 1,
      role: single.role || spec.role || (slide.assetGeneration && slide.assetGeneration.role)
    }, boundAssetGenerationFields(assets));
    if (!slide.assetAttribution) slide.assetAttribution = [];
    const attr = attributionFor(single, spec);
    slide.assetAttribution.push(attr);
    const trace = ensureSourceTrace(slide);
    trace.imageProvenance.push(imageProvenanceFor(attr, slideNo, 0));
    updateTraceAuthorizationStatus(trace, slide);
    boundSlides += 1;
  });

  return { plan, boundSlides, errors: [] };
}

function bindGeneratedAssetsFromFiles({ planPath, mapPath, outPath, cwd = process.cwd() }) {
  const plan = readJson(planPath);
  const mapping = readJson(mapPath);
  const result = bindGeneratedAssets(plan, mapping, { cwd });
  if (!result.errors.length && outPath) writeJson(outPath, result.plan);
  return result;
}

module.exports = {
  ASSET_BINDER_DECISION_SOURCE,
  attributionFor,
  bindGeneratedAssets,
  bindGeneratedAssetsFromFiles,
  ensureSourceTrace,
  imageProvenanceFor,
  normalizeAssetSpec,
  proofEligibilityFor,
  provenanceClassFor,
  updateTraceAuthorizationStatus,
  readJson,
  writeJson
};

const fs = require('fs');
const path = require('path');
const { imageDimensions } = require('../design-system');

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
    provenanceClass: attr.provenanceClass,
    proofEligibility: attr.proofEligibility,
    authorizationStatus: attr.authorizationStatus,
    note: attr.note
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
      const assets = spec.images.map((item, i) => validateAssetSpec(item, Number(slideNo), `images[${i}]`, errors, cwd)).filter(Boolean);
      return { slideNo: Number(slideNo), idx, spec, assets };
    }
    const single = validateAssetSpec(spec, Number(slideNo), 'single', errors, cwd);
    return single ? { slideNo: Number(slideNo), idx, spec, assets: [single] } : null;
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
        status: 'bound',
        bound: true,
        boundCount: assets.length
      });
      if (!slide.assetAttribution) slide.assetAttribution = [];
      const trace = ensureSourceTrace(slide);
      assets.forEach((item, i) => {
        const attr = attributionFor(item, spec);
        slide.assetAttribution.push(attr);
        trace.imageProvenance.push(imageProvenanceFor(attr, slideNo, i));
      });
      slide.sourceTrace.assetAuthorizationStatus = trace.imageProvenance.every(item => item.proofEligibility === 'factual-proof') ? 'cleared' : 'synthetic-only';
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
      status: 'bound',
      bound: true,
      boundCount: 1
    });
    if (!slide.assetAttribution) slide.assetAttribution = [];
    const attr = attributionFor(single, spec);
    slide.assetAttribution.push(attr);
    const trace = ensureSourceTrace(slide);
    trace.imageProvenance.push(imageProvenanceFor(attr, slideNo, 0));
    slide.sourceTrace.assetAuthorizationStatus = attr.proofEligibility === 'factual-proof' ? 'cleared' : 'synthetic-only';
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
  attributionFor,
  bindGeneratedAssets,
  bindGeneratedAssetsFromFiles,
  ensureSourceTrace,
  imageProvenanceFor,
  normalizeAssetSpec,
  proofEligibilityFor,
  provenanceClassFor,
  readJson,
  writeJson
};

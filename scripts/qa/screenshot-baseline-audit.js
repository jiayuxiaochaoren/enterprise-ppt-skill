const fs = require('fs');
const path = require('path');
const {
  bboxDelta,
  hamming,
  pngAnalysis,
  pngInfo
} = require('./png-analysis');
const {
  baselineRegionResult,
  defaultBaselineThresholds,
  findingsForBaselineRegion
} = require('./screenshot-baseline-region-rules');
const {
  regionExpectationEntries,
  validateRegionManifest
} = require('./visual-region-contract');

const REQUIRED_BASELINE_AUDIT_FINDING_TYPES = Object.freeze([
  'baselinePreviewMissing'
]);

function baselineEntryFor(manifest = {}, slideNo = 1) {
  if (Array.isArray(manifest.slides)) {
    return manifest.slides.find(item => Number(item.slide || item.index) === slideNo) || null;
  }
  if (manifest.slides && typeof manifest.slides === 'object') return manifest.slides[String(slideNo)] || null;
  return null;
}

function manifestSlideNumbers(manifest = {}) {
  if (Array.isArray(manifest.slides)) {
    return manifest.slides
      .map(item => Number(item.slide || item.index))
      .filter(value => Number.isFinite(value) && value > 0);
  }
  if (manifest.slides && typeof manifest.slides === 'object') {
    return Object.keys(manifest.slides)
      .map(value => Number(value))
      .filter(value => Number.isFinite(value) && value > 0);
  }
  return [];
}

function resolveBaselineFile(manifestPath, entry = {}) {
  const ref = entry.file || entry.preview || entry.baselinePreview || '';
  if (!ref) return '';
  return path.isAbsolute(ref) ? ref : path.resolve(path.dirname(manifestPath), ref);
}

function baselineVisualAudit(manifestPath = '', previewReports = []) {
  const findings = [];
  if (!manifestPath) {
    return { version:'screenshot-baseline-audit/v1', status:'pass', manifest:'', findings, slides:[] };
  }
  if (!fs.existsSync(manifestPath)) {
    findings.push({ level:'fail', type:'baselineManifestMissing', message:`baseline manifest not found: ${manifestPath}` });
    return { version:'screenshot-baseline-audit/v1', status:'fail', manifest:manifestPath, findings, slides:[] };
  }
  let manifest = null;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    findings.push({ level:'fail', type:'baselineManifestUnreadable', message:String(e.message || e) });
    return { version:'screenshot-baseline-audit/v1', status:'fail', manifest:manifestPath, findings, slides:[] };
  }
  findings.push(...validateRegionManifest(manifest));
  const defaults = defaultBaselineThresholds(manifest);
  const reportsBySlide = new Map(previewReports.map(report => [Number(report.slide || 0), report]));
  const expectedSlides = manifestSlideNumbers(manifest);
  expectedSlides.forEach(slideNo => {
    if (!reportsBySlide.has(slideNo)) {
      findings.push({ slide:slideNo, level:'fail', type:'baselinePreviewMissing', message:`baseline comparison requires current preview for slide ${slideNo}` });
    }
  });
  const slides = [];
  previewReports.forEach(report => {
    const slideNo = Number(report.slide || 0);
    const entry = baselineEntryFor(manifest, slideNo);
    if (!entry) return;
    const current = report.info;
    let baseline = entry.metrics || entry.info || null;
    const baselineFile = resolveBaselineFile(manifestPath, entry);
    if (!baseline && baselineFile) baseline = pngAnalysis(baselineFile) || pngInfo(baselineFile);
    if (!current || !baseline) {
      findings.push({ slide:slideNo, level:'fail', type:'baselinePreviewUnreadable', message:'baseline or current preview PNG is unreadable' });
      return;
    }
    const thresholds = Object.assign({}, defaults, entry.thresholds || {});
    const hashDistance = hamming(current.hash, baseline.hash);
    const lumaDistance = Math.abs(Number(current.mean || 0) - Number(baseline.mean || 0));
    const visualBBoxDelta = bboxDelta(current.contentBBox, baseline.contentBBox);
    const slideResult = {
      slide: slideNo,
      hashDistance,
      lumaDistance: Number(lumaDistance.toFixed(2)),
      bboxDelta: visualBBoxDelta,
      regions: []
    };
    if (hashDistance != null && hashDistance > thresholds.maxHashDistance) {
      findings.push({ slide:slideNo, level:'fail', type:'baselineHashDistance', message:`hash distance ${hashDistance}/64 exceeds ${thresholds.maxHashDistance}` });
    }
    if (lumaDistance > thresholds.maxLumaDistance) {
      findings.push({ slide:slideNo, level:'fail', type:'baselineLumaDistance', message:`luminance delta ${lumaDistance.toFixed(2)} exceeds ${thresholds.maxLumaDistance}` });
    }
    if (visualBBoxDelta != null && visualBBoxDelta > thresholds.maxBboxDelta) {
      findings.push({ slide:slideNo, level:'fail', type:'baselineContentBBoxShift', message:`content bbox delta ${visualBBoxDelta} exceeds ${thresholds.maxBboxDelta}` });
    }
    regionExpectationEntries(entry, manifest).forEach(([name, expectation]) => {
      const currentRegion = current.regions && current.regions[name];
      const baselineRegion = baseline.regions && baseline.regions[name];
      if (!currentRegion) return;
      const regionResult = baselineRegionResult(name, expectation, currentRegion, baselineRegion, thresholds);
      slideResult.regions.push(regionResult);
      findings.push(...findingsForBaselineRegion(slideNo, regionResult));
    });
    slides.push(slideResult);
  });
  if (!previewReports.length && !expectedSlides.length) {
    findings.push({ level:'fail', type:'baselinePreviewMissing', message:'baseline comparison requires preview PNGs via --preview-dir' });
  }
  return {
    version:'screenshot-baseline-audit/v1',
    manifest:manifestPath,
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    findings,
    slides
  };
}

module.exports = {
  REQUIRED_BASELINE_AUDIT_FINDING_TYPES,
  baselineEntryFor,
  manifestSlideNumbers,
  baselineVisualAudit,
  resolveBaselineFile
};

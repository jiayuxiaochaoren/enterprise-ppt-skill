const fs = require('fs');
const path = require('path');
const {
  bboxDelta,
  hamming,
  pngAnalysis,
  pngInfo
} = require('./png-analysis');

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
  const defaults = Object.assign({
    maxHashDistance: 18,
    maxLumaDistance: 28,
    maxBboxDelta: 0.38,
    maxRegionHashDistance: null,
    maxRegionBBoxDelta: null,
    minRegionCoverageRatio: 0.45,
    minRegionCoverage: 0.012
  }, manifest.thresholds || {});
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
    const regionExpectations = entry.regions || manifest.regions || {};
    Object.entries(regionExpectations).forEach(([name, expectation]) => {
      const currentRegion = current.regions && current.regions[name];
      const baselineRegion = baseline.regions && baseline.regions[name];
      if (!currentRegion) return;
      const expectedCoverage = Number(
        (expectation && expectation.minCoverage) ||
        (baselineRegion && baselineRegion.coverage * thresholds.minRegionCoverageRatio) ||
        thresholds.minRegionCoverage
      );
      const actualCoverage = Number(currentRegion.coverage || 0);
      const baselineCoverage = baselineRegion ? Number(baselineRegion.coverage || 0) : null;
      const localHashDistance = baselineRegion ? hamming(currentRegion.hash, baselineRegion.hash) : null;
      const localBBoxDelta = baselineRegion ? bboxDelta(currentRegion.contentBBox, baselineRegion.contentBBox) : null;
      const maxRegionHashDistance = Number(
        (expectation && expectation.maxHashDistance != null ? expectation.maxHashDistance : null) ??
        (thresholds.maxRegionHashDistance != null ? thresholds.maxRegionHashDistance : NaN)
      );
      const maxRegionBBoxDelta = Number(
        (expectation && expectation.maxBboxDelta != null ? expectation.maxBboxDelta : null) ??
        (thresholds.maxRegionBBoxDelta != null ? thresholds.maxRegionBBoxDelta : NaN)
      );
      const regionResult = {
        name,
        actualCoverage,
        expectedCoverage:Number(expectedCoverage.toFixed(4)),
        baselineCoverage,
        coverageRatio: baselineCoverage ? Number((actualCoverage / Math.max(0.0001, baselineCoverage)).toFixed(4)) : null,
        localHashDistance,
        localBBoxDelta
      };
      slideResult.regions.push(regionResult);
      if (actualCoverage < expectedCoverage) {
        findings.push({
          slide:slideNo,
          level:'fail',
          type:'baselineRegionMissing',
          regionName:name,
          actualCoverage,
          expectedCoverage:Number(expectedCoverage.toFixed(4)),
          baselineCoverage,
          coverageRatio: regionResult.coverageRatio,
          localHashDistance,
          localBBoxDelta,
          reason:'region_coverage_below_minimum',
          message:`region ${name} coverage ${actualCoverage} below expected ${expectedCoverage.toFixed(4)}`
        });
      }
      if (Number.isFinite(maxRegionHashDistance) && localHashDistance != null && localHashDistance > maxRegionHashDistance) {
        findings.push({
          slide:slideNo,
          level:'fail',
          type:'baselineRegionHashDistance',
          regionName:name,
          localHashDistance,
          maxRegionHashDistance,
          actualCoverage,
          expectedCoverage:Number(expectedCoverage.toFixed(4)),
          baselineCoverage,
          reason:'region_hash_distance_exceeded',
          message:`region ${name} hash distance ${localHashDistance}/16 exceeds ${maxRegionHashDistance}`
        });
      }
      if (Number.isFinite(maxRegionBBoxDelta) && localBBoxDelta != null && localBBoxDelta > maxRegionBBoxDelta) {
        findings.push({
          slide:slideNo,
          level:'fail',
          type:'baselineRegionBBoxShift',
          regionName:name,
          localBBoxDelta,
          maxRegionBBoxDelta,
          actualCoverage,
          expectedCoverage:Number(expectedCoverage.toFixed(4)),
          baselineCoverage,
          reason:'region_bbox_delta_exceeded',
          message:`region ${name} bbox delta ${localBBoxDelta} exceeds ${maxRegionBBoxDelta}`
        });
      }
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
  baselineEntryFor,
  manifestSlideNumbers,
  baselineVisualAudit,
  resolveBaselineFile
};

const {
  bboxDelta,
  hamming
} = require('./png-analysis');
const {
  baselineRegionFinding
} = require('./visual-region-contract');

const REQUIRED_BASELINE_REGION_FINDING_TYPES = Object.freeze([
  'baselineRegionMissing',
  'baselineRegionBBoxShift'
]);

function defaultBaselineThresholds(manifest = {}) {
  return Object.assign({
    maxHashDistance: 18,
    maxLumaDistance: 28,
    maxBboxDelta: 0.38,
    maxRegionHashDistance: null,
    maxRegionBBoxDelta: null,
    minRegionCoverageRatio: 0.45,
    minRegionCoverage: 0.012
  }, manifest.thresholds || {});
}

function regionThreshold(expectation = {}, thresholds = {}, field) {
  const thresholdKey = field === 'hash' ? 'maxHashDistance' : 'maxBboxDelta';
  const globalKey = field === 'hash' ? 'maxRegionHashDistance' : 'maxRegionBBoxDelta';
  return Number(
    (expectation && expectation[thresholdKey] != null ? expectation[thresholdKey] : null) ??
    (thresholds[globalKey] != null ? thresholds[globalKey] : NaN)
  );
}

function baselineRegionResult(name, expectation = {}, currentRegion = {}, baselineRegion = null, thresholds = {}) {
  const expectedCoverage = Number(
    (expectation && expectation.minCoverage) ||
    (baselineRegion && baselineRegion.coverage * thresholds.minRegionCoverageRatio) ||
    thresholds.minRegionCoverage
  );
  const actualCoverage = Number(currentRegion.coverage || 0);
  const baselineCoverage = baselineRegion ? Number(baselineRegion.coverage || 0) : null;
  const localHashDistance = baselineRegion ? hamming(currentRegion.hash, baselineRegion.hash) : null;
  const localBBoxDelta = baselineRegion ? bboxDelta(currentRegion.contentBBox, baselineRegion.contentBBox) : null;
  return {
    name,
    actualCoverage,
    expectedCoverage:Number(expectedCoverage.toFixed(4)),
    baselineCoverage,
    coverageRatio: baselineCoverage ? Number((actualCoverage / Math.max(0.0001, baselineCoverage)).toFixed(4)) : null,
    localHashDistance,
    localBBoxDelta,
    maxRegionHashDistance: regionThreshold(expectation, thresholds, 'hash'),
    maxRegionBBoxDelta: regionThreshold(expectation, thresholds, 'bbox')
  };
}

function findingsForBaselineRegion(slideNo, region = {}) {
  const findings = [];
  if (region.actualCoverage < region.expectedCoverage) {
    findings.push(baselineRegionFinding(Object.assign({}, region, {
      reason:'region_coverage_below_minimum',
      slideNo,
      type:'baselineRegionMissing'
    })));
  }
  if (Number.isFinite(region.maxRegionHashDistance) && region.localHashDistance != null && region.localHashDistance > region.maxRegionHashDistance) {
    findings.push(baselineRegionFinding(Object.assign({}, region, {
      reason:'region_hash_distance_exceeded',
      slideNo,
      type:'baselineRegionHashDistance'
    })));
  }
  if (Number.isFinite(region.maxRegionBBoxDelta) && region.localBBoxDelta != null && region.localBBoxDelta > region.maxRegionBBoxDelta) {
    findings.push(baselineRegionFinding(Object.assign({}, region, {
      reason:'region_bbox_delta_exceeded',
      slideNo,
      type:'baselineRegionBBoxShift'
    })));
  }
  return findings;
}

module.exports = {
  REQUIRED_BASELINE_REGION_FINDING_TYPES,
  baselineRegionResult,
  defaultBaselineThresholds,
  findingsForBaselineRegion
};

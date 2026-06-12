const VISUAL_REGION_PRESETS = {
  mainBody: { x:0.70, y:1.28, w:11.88, h:5.38 },
  rightEvidence: { x:8.00, y:1.18, w:4.34, h:5.58 },
  footer: { x:0.70, y:6.62, w:11.88, h:0.50 }
};

const BASELINE_REGION_CONTRACT_NAMES = Object.freeze([
  'cardGrid',
  'chartBoard',
  'footer',
  'mainBody',
  'rightEvidence'
]);

function visualRegion(name) {
  const region = VISUAL_REGION_PRESETS[name] || null;
  return region ? Object.assign({}, region) : null;
}

function regionExpectationEntries(entry = {}, manifest = {}) {
  return Object.entries(entry.regions || manifest.regions || {});
}

function baselineRegionFinding(input = {}) {
  const {
    actualCoverage,
    baselineCoverage,
    coverageRatio,
    expectedCoverage,
    localBBoxDelta,
    localHashDistance,
    maxRegionBBoxDelta,
    maxRegionHashDistance,
    name,
    reason,
    slideNo,
    type
  } = input;
  const base = {
    slide: slideNo,
    level: 'fail',
    type,
    regionName: name,
    actualCoverage,
    expectedCoverage,
    baselineCoverage,
    reason
  };
  if (coverageRatio != null) base.coverageRatio = coverageRatio;
  if (localHashDistance != null) base.localHashDistance = localHashDistance;
  if (localBBoxDelta != null) base.localBBoxDelta = localBBoxDelta;
  if (maxRegionHashDistance != null) base.maxRegionHashDistance = maxRegionHashDistance;
  if (maxRegionBBoxDelta != null) base.maxRegionBBoxDelta = maxRegionBBoxDelta;
  if (type === 'baselineRegionMissing') {
    base.message = `region ${name} coverage ${actualCoverage} below expected ${Number(expectedCoverage || 0).toFixed(4)}`;
  } else if (type === 'baselineRegionHashDistance') {
    base.message = `region ${name} hash distance ${localHashDistance}/16 exceeds ${maxRegionHashDistance}`;
  } else if (type === 'baselineRegionBBoxShift') {
    base.message = `region ${name} bbox delta ${localBBoxDelta} exceeds ${maxRegionBBoxDelta}`;
  }
  return base;
}

function validateRegionManifest(manifest = {}) {
  const findings = [];
  if (!manifest.regions || typeof manifest.regions !== 'object') return findings;
  Object.entries(manifest.regions).forEach(([name, expectation]) => {
    if (!expectation || typeof expectation !== 'object') {
      findings.push({ level:'fail', type:'baselineRegionManifestInvalid', regionName:name, message:`region ${name} expectation must be an object` });
    }
  });
  return findings;
}

module.exports = {
  BASELINE_REGION_CONTRACT_NAMES,
  VISUAL_REGION_PRESETS,
  baselineRegionFinding,
  regionExpectationEntries,
  validateRegionManifest,
  visualRegion
};

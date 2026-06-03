const BASELINE_AUDIT_PATH = 'scripts/qa/screenshot-baseline-audit.js';
const BASELINE_DOC_PATH = 'references/screenshot-baseline-qa.md';
const BASELINE_EXAMPLE_PATH = 'examples/visual-baseline-region-manifest.example.json';
const BASELINE_TEST_PATH = 'scripts/test_visual_qa_baseline.js';

const REQUIRED_BASELINE_REGIONS = Object.freeze([
  'cardGrid',
  'chartBoard',
  'footer',
  'mainBody',
  'rightEvidence'
]);

const REQUIRED_BASELINE_FINDINGS = Object.freeze([
  'baselinePreviewMissing',
  'baselineRegionBBoxShift',
  'baselineRegionMissing'
]);

function textIncludesAll(text = '', terms = []) {
  return terms.filter(term => !String(text).includes(term));
}

function manifestRegionNames(manifest = {}) {
  const names = new Set(Object.keys(manifest.regions || {}));
  Object.values(manifest.slides || {}).forEach(slide => {
    Object.keys((slide && slide.regions) || {}).forEach(name => names.add(name));
  });
  return [...names].sort();
}

function screenshotBaselineReadiness(opts = {}) {
  const exists = opts.exists || (() => false);
  const readText = opts.readText || (() => '');
  const readJson = opts.readJson || (() => null);
  const auditText = readText(BASELINE_AUDIT_PATH);
  const docText = readText(BASELINE_DOC_PATH);
  const testText = readText(BASELINE_TEST_PATH);
  const manifest = readJson(BASELINE_EXAMPLE_PATH) || {};
  const requiredRegions = Array.isArray(opts.requiredRegions) ? opts.requiredRegions : REQUIRED_BASELINE_REGIONS;
  const requiredFindings = Array.isArray(opts.requiredFindings) ? opts.requiredFindings : REQUIRED_BASELINE_FINDINGS;
  const files = [
    { id: 'audit', path: BASELINE_AUDIT_PATH, exists: exists(BASELINE_AUDIT_PATH) },
    { id: 'doc', path: BASELINE_DOC_PATH, exists: exists(BASELINE_DOC_PATH) },
    { id: 'example', path: BASELINE_EXAMPLE_PATH, exists: exists(BASELINE_EXAMPLE_PATH) },
    { id: 'negativeTest', path: BASELINE_TEST_PATH, exists: exists(BASELINE_TEST_PATH) }
  ];
  const manifestRegions = manifestRegionNames(manifest);
  const missingManifestRegions = requiredRegions.filter(region => !manifestRegions.includes(region));
  const missingDocRegions = textIncludesAll(docText, requiredRegions);
  const missingNegativeRegions = textIncludesAll(testText, requiredRegions.filter(region => region !== 'mainBody'));
  const missingAuditFindings = textIncludesAll(auditText, requiredFindings);
  const missingNegativeFindings = textIncludesAll(testText, requiredFindings);
  const missingDocFindings = textIncludesAll(docText, requiredFindings);
  const missingDocTerms = textIncludesAll(docText, ['--baseline', '--preview-dir', 'Generate Or Update', 'Negative Coverage']);
  const filesReady = files.every(file => file.exists);
  const manifestReady = manifest.version === 'visual-baseline/v1' && missingManifestRegions.length === 0;
  const docsReady = missingDocRegions.length === 0 && missingDocFindings.length === 0 && missingDocTerms.length === 0;
  const auditReady = missingAuditFindings.length === 0;
  const negativeReady = missingNegativeRegions.length === 0 && missingNegativeFindings.length === 0;
  return {
    ready: filesReady && manifestReady && docsReady && auditReady && negativeReady,
    files,
    filesReady,
    manifestReady,
    docsReady,
    auditReady,
    negativeReady,
    manifestVersion: manifest.version || '',
    requiredRegionCount: requiredRegions.length,
    manifestRegionCount: manifestRegions.length,
    requiredFindingCount: requiredFindings.length,
    requiredRegions,
    manifestRegions,
    requiredFindings,
    missingManifestRegions,
    missingDocRegions,
    missingNegativeRegions,
    missingAuditFindings,
    missingNegativeFindings,
    missingDocFindings,
    missingDocTerms
  };
}

module.exports = {
  BASELINE_AUDIT_PATH,
  BASELINE_DOC_PATH,
  BASELINE_EXAMPLE_PATH,
  BASELINE_TEST_PATH,
  REQUIRED_BASELINE_FINDINGS,
  REQUIRED_BASELINE_REGIONS,
  manifestRegionNames,
  screenshotBaselineReadiness
};

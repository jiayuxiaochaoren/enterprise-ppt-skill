const BASELINE_AUDIT_PATH = 'scripts/qa/screenshot-baseline-audit.js';
const BASELINE_REGION_RULES_PATH = 'scripts/qa/screenshot-baseline-region-rules.js';
const VISUAL_REGION_CONTRACT_PATH = 'scripts/qa/visual-region-contract.js';
const BASELINE_DOC_PATH = 'references/screenshot-baseline-qa.md';
const BASELINE_EXAMPLE_PATH = 'examples/visual-baseline-region-manifest.example.json';
const BASELINE_TEST_PATH = 'scripts/test_visual_qa_baseline.js';
const {
  REQUIRED_BASELINE_AUDIT_FINDING_TYPES
} = require('./screenshot-baseline-audit');
const {
  REQUIRED_BASELINE_REGION_FINDING_TYPES
} = require('./screenshot-baseline-region-rules');
const {
  BASELINE_REGION_CONTRACT_NAMES
} = require('./visual-region-contract');

const REQUIRED_BASELINE_REGIONS = BASELINE_REGION_CONTRACT_NAMES;

const REQUIRED_BASELINE_FINDINGS = Object.freeze([
  ...REQUIRED_BASELINE_AUDIT_FINDING_TYPES,
  ...REQUIRED_BASELINE_REGION_FINDING_TYPES
].sort());

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
  const docText = readText(BASELINE_DOC_PATH);
  const testText = readText(BASELINE_TEST_PATH);
  const manifest = readJson(BASELINE_EXAMPLE_PATH) || {};
  const contract = opts.contract || {};
  const exportedRegions = Array.isArray(contract.regionNames) ? contract.regionNames : BASELINE_REGION_CONTRACT_NAMES;
  const exportedFindings = Array.isArray(contract.findingTypes)
    ? contract.findingTypes
    : REQUIRED_BASELINE_FINDINGS;
  const requiredRegions = Array.isArray(opts.requiredRegions) ? opts.requiredRegions : REQUIRED_BASELINE_REGIONS;
  const requiredFindings = Array.isArray(opts.requiredFindings) ? opts.requiredFindings : REQUIRED_BASELINE_FINDINGS;
  const files = [
    { id: 'audit', path: BASELINE_AUDIT_PATH, exists: exists(BASELINE_AUDIT_PATH) },
    { id: 'regionRules', path: BASELINE_REGION_RULES_PATH, exists: exists(BASELINE_REGION_RULES_PATH) },
    { id: 'regionContract', path: VISUAL_REGION_CONTRACT_PATH, exists: exists(VISUAL_REGION_CONTRACT_PATH) },
    { id: 'doc', path: BASELINE_DOC_PATH, exists: exists(BASELINE_DOC_PATH) },
    { id: 'example', path: BASELINE_EXAMPLE_PATH, exists: exists(BASELINE_EXAMPLE_PATH) },
    { id: 'negativeTest', path: BASELINE_TEST_PATH, exists: exists(BASELINE_TEST_PATH) }
  ];
  const manifestRegions = manifestRegionNames(manifest);
  const missingContractRegions = requiredRegions.filter(region => !exportedRegions.includes(region));
  const missingContractFindings = requiredFindings.filter(finding => !exportedFindings.includes(finding));
  const missingManifestRegions = requiredRegions.filter(region => !manifestRegions.includes(region));
  const missingDocRegions = textIncludesAll(docText, requiredRegions);
  const missingNegativeRegions = textIncludesAll(testText, requiredRegions.filter(region => region !== 'mainBody'));
  const missingAuditFindings = missingContractFindings;
  const missingNegativeFindings = textIncludesAll(testText, requiredFindings);
  const missingDocFindings = textIncludesAll(docText, requiredFindings);
  const missingDocTerms = textIncludesAll(docText, ['--baseline', '--preview-dir', 'Generate Or Update', 'Negative Coverage']);
  const filesReady = files.every(file => file.exists);
  const manifestReady = manifest.version === 'visual-baseline/v1' && missingManifestRegions.length === 0;
  const docsReady = missingDocRegions.length === 0 && missingDocFindings.length === 0 && missingDocTerms.length === 0;
  const contractReady = missingContractRegions.length === 0 && missingContractFindings.length === 0;
  const auditReady = contractReady;
  const negativeReady = missingNegativeRegions.length === 0 && missingNegativeFindings.length === 0;
  return {
    ready: filesReady && contractReady && manifestReady && docsReady && auditReady && negativeReady,
    files,
    filesReady,
    manifestReady,
    docsReady,
    auditReady,
    contractReady,
    negativeReady,
    manifestVersion: manifest.version || '',
    requiredRegionCount: requiredRegions.length,
    manifestRegionCount: manifestRegions.length,
    requiredFindingCount: requiredFindings.length,
    requiredRegions,
    manifestRegions,
    requiredFindings,
    missingContractRegions,
    missingContractFindings,
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
  BASELINE_REGION_RULES_PATH,
  BASELINE_TEST_PATH,
  REQUIRED_BASELINE_FINDINGS,
  REQUIRED_BASELINE_REGIONS,
  VISUAL_REGION_CONTRACT_PATH,
  manifestRegionNames,
  screenshotBaselineReadiness
};

const TEXT_META_PATH = 'scripts/render/text-meta.js';
const TEXT_READABILITY_POLICY_PATH = 'scripts/render/text-readability-policy.js';
const TEXT_BOX_META_PATH = 'scripts/render/text-box-meta.js';
const PAGE_FOLIO_POLICY_PATH = 'scripts/render/page-folio-policy.js';
const TYPOGRAPHY_AUDIT_PATH = 'scripts/design/typography.js';
const CONTENT_COVERAGE_AUDIT_PATH = 'scripts/qa/content-coverage-audit.js';
const VISUAL_SLIDE_AUDIT_PATH = 'scripts/qa/visual-slide-audit.js';
const VISUAL_SLIDE_REGIONS_PATH = 'scripts/qa/visual-slide-regions.js';
const VISUAL_REGION_CONTRACT_PATH = 'scripts/qa/visual-region-contract.js';
const CONTENT_COVERAGE_TEST_PATH = 'scripts/test_visual_qa_content_coverage.js';
const TYPOGRAPHY_TEST_PATH = 'scripts/test_typography_system.js';
const {
  TYPOGRAPHY_RENDER_META_FINDING_TYPES
} = require('../design/typography');
const {
  TEXT_META_READINESS_FIELDS
} = require('../render/text-box-meta');
const {
  TEXT_READABILITY_POLICY_FIELDS
} = require('../render/text-readability-policy');
const {
  CONTENT_COVERAGE_FINDING_TYPES
} = require('./content-coverage-audit');
const {
  SLIDE_REGION_METRIC_FIELDS
} = require('./visual-slide-regions');

const REQUIRED_TEXT_BLANK_FINDINGS = Object.freeze([
  ...CONTENT_COVERAGE_FINDING_TYPES,
  ...TYPOGRAPHY_RENDER_META_FINDING_TYPES
].sort());

const REQUIRED_TEXT_META_FIELDS = TEXT_META_READINESS_FIELDS;

const REQUIRED_COVERAGE_FIELDS = SLIDE_REGION_METRIC_FIELDS;

function missingTerms(text = '', terms = []) {
  return terms.filter(term => !String(text).includes(term));
}

function missingItems(actual = [], required = []) {
  return required.filter(item => !actual.includes(item));
}

function textBlankReadiness(opts = {}) {
  const exists = opts.exists || (() => false);
  const readText = opts.readText || (() => '');
  const contentCoverageTest = readText(CONTENT_COVERAGE_TEST_PATH);
  const typographyTest = readText(TYPOGRAPHY_TEST_PATH);
  const contract = opts.contract || {};
  const textMetaFields = Array.isArray(contract.textMetaFields)
    ? contract.textMetaFields
    : TEXT_META_READINESS_FIELDS;
  const readabilityPolicyFields = Array.isArray(contract.readabilityPolicyFields)
    ? contract.readabilityPolicyFields
    : TEXT_READABILITY_POLICY_FIELDS;
  const typographyFindings = Array.isArray(contract.typographyFindings)
    ? contract.typographyFindings
    : TYPOGRAPHY_RENDER_META_FINDING_TYPES;
  const coverageFindings = Array.isArray(contract.coverageFindings)
    ? contract.coverageFindings
    : CONTENT_COVERAGE_FINDING_TYPES;
  const coverageFields = Array.isArray(contract.coverageFields)
    ? contract.coverageFields
    : SLIDE_REGION_METRIC_FIELDS;
  const files = [
    { id: 'textMeta', path: TEXT_META_PATH, exists: exists(TEXT_META_PATH) },
    { id: 'textReadabilityPolicy', path: TEXT_READABILITY_POLICY_PATH, exists: exists(TEXT_READABILITY_POLICY_PATH) },
    { id: 'textBoxMeta', path: TEXT_BOX_META_PATH, exists: exists(TEXT_BOX_META_PATH) },
    { id: 'pageFolioPolicy', path: PAGE_FOLIO_POLICY_PATH, exists: exists(PAGE_FOLIO_POLICY_PATH) },
    { id: 'typographyAudit', path: TYPOGRAPHY_AUDIT_PATH, exists: exists(TYPOGRAPHY_AUDIT_PATH) },
    { id: 'contentCoverageAudit', path: CONTENT_COVERAGE_AUDIT_PATH, exists: exists(CONTENT_COVERAGE_AUDIT_PATH) },
    { id: 'visualSlideAudit', path: VISUAL_SLIDE_AUDIT_PATH, exists: exists(VISUAL_SLIDE_AUDIT_PATH) },
    { id: 'visualSlideRegions', path: VISUAL_SLIDE_REGIONS_PATH, exists: exists(VISUAL_SLIDE_REGIONS_PATH) },
    { id: 'visualRegionContract', path: VISUAL_REGION_CONTRACT_PATH, exists: exists(VISUAL_REGION_CONTRACT_PATH) },
    { id: 'contentCoverageTest', path: CONTENT_COVERAGE_TEST_PATH, exists: exists(CONTENT_COVERAGE_TEST_PATH) },
    { id: 'typographyTest', path: TYPOGRAPHY_TEST_PATH, exists: exists(TYPOGRAPHY_TEST_PATH) }
  ];
  const missingTextMeta = missingItems(textMetaFields, REQUIRED_TEXT_META_FIELDS);
  const missingReadabilityPolicyFields = missingItems(readabilityPolicyFields, TEXT_READABILITY_POLICY_FIELDS);
  const missingTypographyFindings = missingItems(typographyFindings, TYPOGRAPHY_RENDER_META_FINDING_TYPES);
  const missingCoverageFindings = missingItems(coverageFindings, CONTENT_COVERAGE_FINDING_TYPES);
  const missingCoverageFields = missingItems(coverageFields, REQUIRED_COVERAGE_FIELDS);
  const missingContentCoverageTestTerms = missingTerms(contentCoverageTest, [
    'main_body_decorative_only',
    'expected_evidence_region_empty',
    'textShrinkRisk',
    'charsPerInch',
    'areaDensity'
  ]);
  const missingTypographyTestTerms = missingTerms(typographyTest, ['textShrinkRisk', 'fitStrategy', 'areaDensity']);
  const filesReady = files.every(file => file.exists);
  const textMetaReady = missingTextMeta.length === 0 && missingReadabilityPolicyFields.length === 0;
  const shrinkQaReady = missingTypographyFindings.length === 0 && missingTypographyTestTerms.length === 0;
  const blankQaReady = missingCoverageFindings.length === 0 && missingCoverageFields.length === 0 && missingContentCoverageTestTerms.length === 0;
  return {
    ready: filesReady && textMetaReady && shrinkQaReady && blankQaReady,
    files,
    filesReady,
    textMetaReady,
    shrinkQaReady,
    blankQaReady,
    requiredFindingCount: REQUIRED_TEXT_BLANK_FINDINGS.length,
    requiredTextMetaFieldCount: REQUIRED_TEXT_META_FIELDS.length,
    requiredCoverageFieldCount: REQUIRED_COVERAGE_FIELDS.length,
    requiredFindings: REQUIRED_TEXT_BLANK_FINDINGS,
    requiredTextMetaFields: REQUIRED_TEXT_META_FIELDS,
    requiredCoverageFields: REQUIRED_COVERAGE_FIELDS,
    missingTextMetaFields: missingTextMeta,
    missingReadabilityPolicyFields,
    missingTypographyFindings,
    missingCoverageFindings,
    missingCoverageFields,
    missingContentCoverageTestTerms,
    missingTypographyTestTerms
  };
}

module.exports = {
  CONTENT_COVERAGE_AUDIT_PATH,
  CONTENT_COVERAGE_TEST_PATH,
  PAGE_FOLIO_POLICY_PATH,
  REQUIRED_COVERAGE_FIELDS,
  REQUIRED_TEXT_BLANK_FINDINGS,
  REQUIRED_TEXT_META_FIELDS,
  TEXT_BOX_META_PATH,
  TEXT_META_PATH,
  TEXT_READABILITY_POLICY_PATH,
  TYPOGRAPHY_AUDIT_PATH,
  TYPOGRAPHY_TEST_PATH,
  VISUAL_REGION_CONTRACT_PATH,
  VISUAL_SLIDE_AUDIT_PATH,
  VISUAL_SLIDE_REGIONS_PATH,
  missingTerms,
  missingItems,
  textBlankReadiness
};

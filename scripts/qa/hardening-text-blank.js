const TEXT_META_PATH = 'scripts/render/text-meta.js';
const TYPOGRAPHY_AUDIT_PATH = 'scripts/design/typography.js';
const CONTENT_COVERAGE_AUDIT_PATH = 'scripts/qa/content-coverage-audit.js';
const VISUAL_SLIDE_AUDIT_PATH = 'scripts/qa/visual-slide-audit.js';
const CONTENT_COVERAGE_TEST_PATH = 'scripts/test_visual_qa_content_coverage.js';
const TYPOGRAPHY_TEST_PATH = 'scripts/test_typography_system.js';

const REQUIRED_TEXT_BLANK_FINDINGS = Object.freeze([
  'mainBodyMissingContent',
  'rightEvidenceRegionMissing',
  'textShrinkRisk'
]);

const REQUIRED_TEXT_META_FIELDS = Object.freeze([
  'areaDensity',
  'charsPerInch',
  'readabilityRiskLevel',
  'shrinkRisk',
  'textBoxes'
]);

const REQUIRED_COVERAGE_FIELDS = Object.freeze([
  'mainBodyCoverage',
  'mainBodyElements',
  'rightEvidenceCoverage'
]);

function missingTerms(text = '', terms = []) {
  return terms.filter(term => !String(text).includes(term));
}

function missingTextMetaFields(text = '') {
  return REQUIRED_TEXT_META_FIELDS.filter(field => {
    if (field === 'textBoxes') return !String(text).includes('textBoxes') && !String(text).includes('__codexTextBoxes');
    return !String(text).includes(field);
  });
}

function textBlankReadiness(opts = {}) {
  const exists = opts.exists || (() => false);
  const readText = opts.readText || (() => '');
  const textMeta = readText(TEXT_META_PATH);
  const typographyAudit = readText(TYPOGRAPHY_AUDIT_PATH);
  const contentCoverage = readText(CONTENT_COVERAGE_AUDIT_PATH);
  const visualSlideAudit = readText(VISUAL_SLIDE_AUDIT_PATH);
  const contentCoverageTest = readText(CONTENT_COVERAGE_TEST_PATH);
  const typographyTest = readText(TYPOGRAPHY_TEST_PATH);
  const files = [
    { id: 'textMeta', path: TEXT_META_PATH, exists: exists(TEXT_META_PATH) },
    { id: 'typographyAudit', path: TYPOGRAPHY_AUDIT_PATH, exists: exists(TYPOGRAPHY_AUDIT_PATH) },
    { id: 'contentCoverageAudit', path: CONTENT_COVERAGE_AUDIT_PATH, exists: exists(CONTENT_COVERAGE_AUDIT_PATH) },
    { id: 'visualSlideAudit', path: VISUAL_SLIDE_AUDIT_PATH, exists: exists(VISUAL_SLIDE_AUDIT_PATH) },
    { id: 'contentCoverageTest', path: CONTENT_COVERAGE_TEST_PATH, exists: exists(CONTENT_COVERAGE_TEST_PATH) },
    { id: 'typographyTest', path: TYPOGRAPHY_TEST_PATH, exists: exists(TYPOGRAPHY_TEST_PATH) }
  ];
  const missingTextMeta = missingTextMetaFields(textMeta);
  const missingTypographyFindings = missingTerms(typographyAudit, ['textShrinkRisk', 'readabilityRiskLevel']);
  const missingCoverageFindings = missingTerms(contentCoverage, ['mainBodyMissingContent', 'rightEvidenceRegionMissing']);
  const missingCoverageFields = missingTerms(visualSlideAudit, REQUIRED_COVERAGE_FIELDS);
  const missingContentCoverageTestTerms = missingTerms(contentCoverageTest, [
    'main_body_decorative_only',
    'expected_evidence_region_empty',
    'textShrinkRisk',
    'charsPerInch',
    'areaDensity'
  ]);
  const missingTypographyTestTerms = missingTerms(typographyTest, ['textShrinkRisk', 'fitStrategy', 'areaDensity']);
  const filesReady = files.every(file => file.exists);
  const textMetaReady = missingTextMeta.length === 0;
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
  REQUIRED_COVERAGE_FIELDS,
  REQUIRED_TEXT_BLANK_FINDINGS,
  REQUIRED_TEXT_META_FIELDS,
  TEXT_META_PATH,
  TYPOGRAPHY_AUDIT_PATH,
  TYPOGRAPHY_TEST_PATH,
  VISUAL_SLIDE_AUDIT_PATH,
  missingTerms,
  missingTextMetaFields,
  textBlankReadiness
};

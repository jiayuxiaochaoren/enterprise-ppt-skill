const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const pptxgen = require('pptxgenjs');
const {
  MATRIX_VERSION,
  QUALITY_SEVERITY_MATRIX,
  applyQualitySeverityPolicy,
  policyRow,
  policyRows,
  severityPromotionsForMode
} = require('./qa/quality-severity-policy');
const {
  MATRIX_VERSION: MATRIX_SHARD_VERSION,
  QUALITY_SEVERITY_MATRIX: MATRIX_SHARD
} = require('./qa/quality-severity-matrix');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-quality-mode');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const VISUAL_QA_FINDING_POLICY_SOURCE_FILES = [
  'scripts/qa/visual-preview-audit.js',
  'scripts/qa/visual-slide-audit.js',
  'scripts/qa/screenshot-baseline-audit.js',
  'scripts/qa/visual-plan-audit.js',
  'scripts/qa/render-meta-schema-audit.js',
  'scripts/qa/route-metadata-audit.js',
  'scripts/qa/content-coverage-audit.js',
  'scripts/qa/overlay-contract-audit.js',
  'scripts/qa/component-consumption-audit.js',
  'scripts/qa/secondary-visual-review.js',
  'scripts/design/deck-plan-audit.js',
  'scripts/design/aesthetic-model.js',
  'scripts/design/industry-knowledge-audit.js',
  'scripts/design/content-overlap.js',
  'scripts/design/composition-audit.js',
  'scripts/design/deck-structure-audit.js',
  'scripts/design/evidence-audit.js',
  'scripts/design/component-plan-audit.js',
  'scripts/design/industry-fit-audit.js',
  'scripts/design/source-trace-audit.js',
  'scripts/design/typography.js',
  'scripts/design/chart-spec-qa.js',
  'scripts/design/chart-acceptance-gate.js'
];

async function makePptx() {
  const pptxPath = path.join(OUT, 'render-meta-missing.pptx');
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };
  slide.addText('质量模式验证页', {
    x: 0.8,
    y: 0.8,
    w: 5.0,
    h: 0.42,
    fontFace: 'PingFang SC',
    fontSize: 24,
    color: '111827'
  });
  await pptx.writeFile({ fileName: pptxPath });
  return pptxPath;
}

function runVisualQa(pptxPath, mode) {
  const args = ['scripts/visual_qa.js', pptxPath, '--quality-mode', mode, '--json'];
  try {
    const stdout = cp.execFileSync(process.execPath, args, {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024
    });
    return { status: 0, result: JSON.parse(stdout) };
  } catch (error) {
    return { status: error.status || 1, result: JSON.parse(String(error.stdout || '')) };
  }
}

function assertSeverityMatrix() {
  assert.equal(MATRIX_VERSION, MATRIX_SHARD_VERSION);
  assert.equal(QUALITY_SEVERITY_MATRIX, MATRIX_SHARD, 'policy facade should expose the shared matrix shard');
  assert.equal(policyRows().length, Object.keys(MATRIX_SHARD).length);
  const matrixShardFiles = [
    'scripts/qa/quality-severity-matrix.js',
    'scripts/qa/quality-severity-commercial.js'
  ];
  const matrixKeys = matrixShardFiles.flatMap(file => {
    const matrixSource = fs.readFileSync(path.join(ROOT, file), 'utf8');
    return [...matrixSource.matchAll(/^\s{2}([A-Za-z][A-Za-z0-9_]*)\s*:\s*entry\(/gm)].map(match => match[1]);
  });
  const duplicateMatrixKeys = [...new Set(matrixKeys.filter((key, index) => matrixKeys.indexOf(key) !== index))].sort();
  assert.deepEqual(duplicateMatrixKeys, [], 'severity matrix keys must not be duplicated');
  assert.deepEqual(
    Object.keys(MATRIX_SHARD).filter(key => !matrixKeys.includes(key)),
    [],
    'severity matrix exports must be represented in a checked shard source'
  );
  const findingTypesFromSources = VISUAL_QA_FINDING_POLICY_SOURCE_FILES.flatMap(file => {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    return [...source.matchAll(/type\s*:\s*['"]([^'"]+)['"]/g)].map(match => match[1]);
  });
  const visualQaFindingTypes = [...new Set(findingTypesFromSources)].sort();
  assert.deepEqual(
    visualQaFindingTypes.filter(type => !MATRIX_SHARD[type]),
    [],
    'all visual QA finding types must have severity policy rows'
  );
  assert.equal(MATRIX_SHARD.renderMetaMissing.levels.formal, 'fail');
  assert.equal(policyRow('renderMetaBoundAssetMissing').category, 'asset_provenance');
  assert.equal(policyRow('renderMetaDrawnComponentFieldMissing').delivery, 'fail');
  assert.equal(policyRow('chartSourceMissing').category, 'data_contract_gap');
  assert.equal(policyRow('overlaySlotMismatch').category, 'overlay_contract');
  assert.equal(policyRow('visualTemplateFatigue').category, 'commercial_readiness');
  assert.equal(policyRow('fallbackRendererUsed').category, 'fallback');
  assert.equal(policyRow('skippedCriticalAsset').formal, 'fail');
  assert.equal(policyRow('textShrinkRisk').category, 'shrink_risk');
  assert.equal(policyRow('possiblyBlankPreview').delivery, 'fail');
  assert.ok(severityPromotionsForMode('formal').skippedCriticalAsset);
  assert.ok(severityPromotionsForMode('delivery').possiblyBlankPreview);

  const findings = [
    { level:'review', type:'fallbackRendererUsed', message:'fallback' },
    { level:'review', type:'skippedCriticalAsset', message:'skip' },
    { level:'review', type:'textShrinkRisk', message:'shrink' },
    { level:'review', type:'possiblyBlankPreview', message:'blank' },
    { level:'fail', type:'unknownComponentId', message:'unknown' },
    { level:'fail', type:'baselineHashDistance', message:'baseline' }
  ];
  const draft = applyQualitySeverityPolicy(findings, 'draft');
  assert.equal(draft.findings.find(f => f.type === 'fallbackRendererUsed').level, 'review');
  assert.equal(draft.findings.find(f => f.type === 'skippedCriticalAsset').level, 'review');
  assert.equal(draft.findings.find(f => f.type === 'unknownComponentId').level, 'fail');
  assert.equal(draft.policy.summary.byCategory.fallback.review, 1);

  const formal = applyQualitySeverityPolicy(findings, 'formal');
  const formalFallback = formal.findings.find(f => f.type === 'fallbackRendererUsed');
  assert.equal(formalFallback.level, 'fail');
  assert.equal(formalFallback.originalLevel, 'review');
  assert.equal(formalFallback.fatalBecauseOfQualityMode, 'formal');
  assert.equal(formal.findings.find(f => f.type === 'textShrinkRisk').level, 'fail');
  assert.equal(formal.findings.find(f => f.type === 'possiblyBlankPreview').level, 'review');
  assert.ok(formal.policy.promotedTypes.includes('fallbackRendererUsed'));
  assert.ok(formal.policy.categories.includes('stale_metadata'));

  const delivery = applyQualitySeverityPolicy(findings, 'delivery');
  assert.equal(delivery.findings.find(f => f.type === 'possiblyBlankPreview').level, 'fail');
  assert.equal(delivery.findings.find(f => f.type === 'baselineHashDistance').severityCategory, 'baseline_drift');
}

(async () => {
  assertSeverityMatrix();

  const pptxPath = await makePptx();
  const draft = runVisualQa(pptxPath, 'draft');
  assert.equal(draft.status, 0, 'draft visual QA can keep missing render-meta as review');
  assert.equal(draft.result.quality_mode, 'draft');
  assert.equal(draft.result.findings.some(f => f.type === 'renderMetaMissing' && f.level === 'review'), true);

  const formal = runVisualQa(pptxPath, 'formal');
  assert.notEqual(formal.status, 0, 'formal visual QA should promote missing render-meta to fail');
  const finding = formal.result.findings.find(f => f.type === 'renderMetaMissing');
  assert.equal(finding.level, 'fail');
  assert.equal(finding.originalLevel, 'review');
  assert.equal(finding.fatalBecauseOfQualityMode, 'formal');
  assert.ok(formal.result.severity_policy.promotedTypes.includes('renderMetaMissing'));
  assert.equal(formal.result.findings.find(f => f.type === 'renderMetaMissing').severityCategory, 'contract');

  console.log('quality mode severity policy ok');
})().catch(err => {
  console.error(err);
  process.exit(1);
});

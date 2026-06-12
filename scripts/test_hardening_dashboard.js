const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-hardening-dashboard');
const SMOKE_OUT = path.join(ROOT, 'outputs', 'hardening-smoke');
const SMOKE_PPTX = path.join(SMOKE_OUT, 'sample.pptx');
const STALE_PLAN = path.join(SMOKE_OUT, 'finalized-stale-plan.json');
const TEMPLATE_CONTACT_SHEET = path.join(
  ROOT,
  'outputs',
  '019e583b-b589-7043-8c51-700ce5757a00',
  'presentations',
  'template-page-family-fixtures',
  'contact-sheets',
  'template-page-families.contact-sheet.svg'
);
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(SMOKE_OUT, { recursive: true });

function runAudit(args = []) {
  return cp.spawnSync(process.execPath, ['scripts/audit_hardening_readiness.js', ...args], {
    cwd: ROOT,
    encoding: 'utf8'
  });
}

function byId(rows = []) {
  return new Map(rows.map(row => [row.id, row]));
}

function assertIncludesAll(actual = [], expected = [], label = 'list') {
  expected.forEach(item => {
    assert.ok(actual.includes(item), `${label} should include ${item}`);
  });
}

function assertBudgetReady(row, expected = {}) {
  assert.ok(row, `${expected.id || 'budget'} should be present`);
  assert.equal(row.status, 'pass', `${row.id} budget status`);
  assert.equal(row.missingFiles.length, 0, `${row.id} missing files`);
  assert.equal(row.missingDirectories.length, 0, `${row.id} missing directories`);
  assert.equal(row.emptyDirectories.length, 0, `${row.id} empty directories`);
  assert.equal(row.untrackedRequireClosureFiles.length, 0, `${row.id} untracked require closure`);
  assert.ok(row.maxObservedLines <= row.maxLines, `${row.id} line budget`);
  assert.equal(row.lineHeadroom, row.maxLines - row.maxObservedLines);
  assertIncludesAll(row.files.map(file => file.file), expected.requiredFiles || [], `${row.id} files`);
  assertIncludesAll(row.requireClosureRoots, expected.requiredClosureRoots || [], `${row.id} closure roots`);
}

function assertProfileGateReady(row, expected = {}) {
  assert.ok(row, `${expected.id || 'profile gate'} should be present`);
  assert.equal(row.status, 'pass', `${row.id} status`);
  assert.equal(row.ready, true, `${row.id} ready`);
  assert.deepEqual(row.actualRuleIds, expected.rules, `${row.id} rules`);
  assert.deepEqual(row.actualGroups, expected.groups, `${row.id} groups`);
  assert.equal(row.actualFallbackToFull, Boolean(expected.fallback), `${row.id} fallback`);
  assert.deepEqual(row.mismatchReasons, [], `${row.id} mismatch reasons`);
}

function runNodeScript(script) {
  cp.execFileSync(process.execPath, [script], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 180000
  });
}

cp.execFileSync(process.execPath, ['scripts/generate_pptx.js', 'examples/sample-deck-plan.json', SMOKE_PPTX], {
  cwd: ROOT,
  encoding: 'utf8',
  stdio: 'pipe',
  timeout: 120000
});
assert.ok(fs.existsSync(SMOKE_PPTX), 'hardening smoke sample PPTX should be generated for readiness audit');
assert.ok(fs.existsSync(`${SMOKE_PPTX}.render-meta.json`), 'hardening smoke sample render-meta should be generated for readiness audit');
fs.writeFileSync(STALE_PLAN, `${JSON.stringify({
  version: 'hardening-smoke/stale-plan-proof/v1',
  generatedBy: 'scripts/test_hardening_dashboard.js',
  purpose: 'planner output immutability evidence path for clean CI'
}, null, 2)}\n`);
[
  'scripts/test_visual_qa_render_counts.js',
  'scripts/test_visual_qa_baseline.js',
  'scripts/test_visual_qa_content_coverage.js',
  'scripts/test_visual_qa_overlap.js'
].forEach(runNodeScript);
fs.mkdirSync(path.dirname(TEMPLATE_CONTACT_SHEET), { recursive: true });
fs.writeFileSync(TEMPLATE_CONTACT_SHEET, [
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">',
  '<rect width="640" height="360" fill="#f8fafc"/>',
  '<text x="32" y="48" font-family="Avenir Next, PingFang SC, sans-serif" font-size="22" font-weight="700" fill="#0f172a">Template Page Family Fixtures</text>',
  '<text x="32" y="84" font-family="Avenir Next, PingFang SC, sans-serif" font-size="14" fill="#475569">Clean CI dashboard evidence placeholder; fixture quality is covered by template QA tests.</text>',
  '</svg>',
  ''
].join('\n'));

const jsonRun = runAudit(['--json']);
assert.equal(jsonRun.status, 0, jsonRun.stderr || jsonRun.stdout);
const summary = JSON.parse(jsonRun.stdout);
const matrix = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/hardening-readiness-matrix.json'), 'utf8'));

assert.equal(summary.version, 'hardening-readiness-audit/v1');
assert.equal(summary.matrix, 'assets/hardening-readiness-matrix.json');
assert.equal(summary.taskCount, matrix.tasks.length);
assert.equal(summary.blockingCount, 0);
assert.equal(summary.reviewCount, 0);
assert.deepEqual(summary.matrixContractTotals, { total: 0, blocking: 0, review: 0 });
assert.equal(summary.evidenceCompleteness.complete, summary.taskCount);
assert.equal(summary.evidenceCompleteness.incomplete, 0);
assert.deepEqual(summary.issues, []);

const expectedObjectiveIds = matrix.objectiveCoverageContract.requiredObjectiveIds;
assert.deepEqual(summary.objectiveCoverageContract.requiredObjectiveIds, expectedObjectiveIds);
assert.deepEqual(summary.objectiveCoverageContract.missingObjectiveIds, []);
assert.deepEqual(summary.objectiveCoverageContract.unexpectedObjectiveIds, []);
assert.equal(summary.objectiveCoverageContract.ready, true);
assert.deepEqual(summary.objectiveCoverageTotals, { pass: expectedObjectiveIds.length, partial: 0, missing: 0 });
['P0', 'P1', 'P2'].forEach(priority => {
  const row = summary.objectiveCoverageByPriority[priority];
  assert.ok(row, `${priority} objective summary should exist`);
  assert.equal(row.ready, true);
  assert.equal(row.partial, 0);
  assert.equal(row.missing, 0);
  assert.deepEqual(row.failedObjectiveIds, []);
});

const objectives = byId(summary.objectiveCoverage);
assert.deepEqual(objectives.get('P2-03').testProfileGateIds, [
  'renderer-only',
  'render-text-parts',
  'region-qa-parts',
  'component-consumption-parts',
  'chart-qa-parts',
  'asset-only',
  'material-only'
]);
assert.equal(objectives.get('P2-04').status, 'pass');
assert.equal(objectives.get('P2-04').evidenceState.codePath, 'pass');
assert.equal(objectives.get('P2-04').evidenceState.automatedQa, 'pass');

assert.equal(summary.template.ready, true);
assert.equal(summary.template.pageFamilyCount, 20);
assert.deepEqual(summary.template.missing, []);
assert.deepEqual(summary.deliveryGateTotals, { pass: summary.deliveryGates.length, partial: 0, missing: 0 });
assert.ok(summary.deliveryGates.every(gate => gate.ready), 'delivery gates should be ready');

const budgets = byId(summary.moduleBudgets);
assert.deepEqual(summary.moduleBudgetTotals, { pass: summary.moduleBudgets.length, over_limit: 0, missing: 0 });
assert.equal(summary.moduleBudgetDirectoryTotals.missing, 0);
assert.equal(summary.moduleBudgetDirectoryTotals.empty, 0);
assert.equal(summary.moduleBudgetRequireClosureTotals.untracked, 0);
assertBudgetReady(budgets.get('p2-01-hotspot-facades'), {
  requiredFiles: [
    'scripts/design-system.js',
    'scripts/chart-spec.js',
    'scripts/visual_qa.js',
    'scripts/qa/visual-qa-cli.js',
    'scripts/qa/render-meta-audits.js'
  ],
  requiredClosureRoots: [
    'scripts/design-system.js',
    'scripts/chart-spec.js',
    'scripts/visual_qa.js',
    'scripts/qa/render-meta-audits.js'
  ]
});
assertBudgetReady(budgets.get('p2-02-layout-modules'), {
  requiredFiles: [
    'scripts/render/page-families/cover-core.js',
    'scripts/render/page-families/financial-scorecards.js',
    'scripts/render/page-families/primitives.js'
  ]
});
assertBudgetReady(budgets.get('p2-04-hardening-dashboard-modules'), {
  requiredFiles: [
    'scripts/audit_hardening_readiness.js',
    'scripts/qa/hardening-readiness-summary.js',
    'scripts/qa/hardening-readiness-subsystems.js',
    'scripts/qa/contract-registry.js',
    'scripts/reports/hardening-readiness-report.js',
    'scripts/test-profile-mapping.js'
  ],
  requiredClosureRoots: ['scripts/audit_hardening_readiness.js']
});

assert.equal(summary.pageFamilyPrimitives.ready, true);
assert.deepEqual(summary.pageFamilyPrimitives.missingExports, []);
assert.deepEqual(summary.pageFamilyPrimitives.missingTargets, []);
assert.equal(summary.qualitySeverityMatrix.ready, true);
assert.deepEqual(summary.qualitySeverityMatrix.missingCategories, []);
assert.deepEqual(summary.qualitySeverityMatrix.missingTypes, []);
assert.deepEqual(summary.qualitySeverityMatrix.mismatchedTypes, []);

assert.equal(summary.screenshotBaseline.ready, true);
assert.equal(summary.screenshotBaseline.contractReady, true);
assert.deepEqual(summary.screenshotBaseline.requiredRegions, ['cardGrid', 'chartBoard', 'footer', 'mainBody', 'rightEvidence']);
assert.deepEqual(summary.screenshotBaseline.requiredFindings, ['baselinePreviewMissing', 'baselineRegionBBoxShift', 'baselineRegionMissing']);
assert.deepEqual(summary.screenshotBaseline.missingContractRegions, []);
assert.deepEqual(summary.screenshotBaseline.missingContractFindings, []);
assert.deepEqual(summary.screenshotBaseline.missingManifestRegions, []);
assert.deepEqual(summary.screenshotBaseline.missingAuditFindings, []);
assertIncludesAll(summary.screenshotBaseline.files.map(file => file.path), [
  'scripts/qa/screenshot-baseline-audit.js',
  'scripts/qa/screenshot-baseline-region-rules.js',
  'scripts/qa/visual-region-contract.js',
  'references/screenshot-baseline-qa.md',
  'scripts/test_visual_qa_baseline.js'
], 'screenshot baseline evidence files');

assert.equal(summary.textBlank.ready, true);
assert.equal(summary.textBlank.textMetaReady, true);
assert.equal(summary.textBlank.shrinkQaReady, true);
assert.equal(summary.textBlank.blankQaReady, true);
assert.deepEqual(summary.textBlank.requiredFindings, ['mainBodyMissingContent', 'rightEvidenceRegionMissing', 'textShrinkRisk']);
assert.deepEqual(summary.textBlank.requiredTextMetaFields, ['areaDensity', 'charsPerInch', 'readabilityRiskLevel', 'shrinkRisk', 'textBoxes']);
assert.deepEqual(summary.textBlank.requiredCoverageFields, ['mainBodyCoverage', 'mainBodyElements', 'rightEvidenceCoverage']);
assert.deepEqual(summary.textBlank.missingTextMetaFields, []);
assert.deepEqual(summary.textBlank.missingReadabilityPolicyFields, []);
assert.deepEqual(summary.textBlank.missingTypographyFindings, []);
assert.deepEqual(summary.textBlank.missingCoverageFindings, []);
assert.deepEqual(summary.textBlank.missingCoverageFields, []);
assertIncludesAll(summary.textBlank.files.map(file => file.path), [
  'scripts/render/text-meta.js',
  'scripts/render/text-readability-policy.js',
  'scripts/render/text-box-meta.js',
  'scripts/qa/content-coverage-audit.js',
  'scripts/qa/visual-slide-regions.js',
  'scripts/test_typography_system.js'
], 'text blank evidence files');

const gates = byId(summary.testProfileGates);
assert.deepEqual(summary.testProfileGateTotals, { pass: summary.testProfileGates.length, partial: 0, missing: 0 });
assert.equal(summary.testProfileGateCoverage.ready, true);
assert.deepEqual(summary.testProfileGateCoverage.requiredGateIds, ['renderer-only', 'asset-only', 'material-only']);
assertProfileGateReady(gates.get('renderer-only'), { rules: ['renderer'], groups: ['unit', 'render', 'visual'] });
assertProfileGateReady(gates.get('render-text-parts'), { rules: ['render-text'], groups: ['unit', 'visual'] });
assertProfileGateReady(gates.get('region-qa-parts'), { rules: ['visual-region'], groups: ['unit', 'visual'] });
assertProfileGateReady(gates.get('component-consumption-parts'), { rules: ['component-consumption'], groups: ['unit', 'visual'] });
assertProfileGateReady(gates.get('chart-qa-parts'), { rules: ['chart-qa'], groups: ['unit', 'visual'] });
assertProfileGateReady(gates.get('asset-only'), { rules: ['asset'], groups: ['unit', 'pipeline', 'delivery'] });
assertProfileGateReady(gates.get('material-only'), { rules: ['material'], groups: ['pipeline', 'delivery'] });
assertProfileGateReady(gates.get('unknown-path-fallback'), {
  rules: [],
  groups: ['unit', 'pipeline', 'render', 'visual', 'delivery'],
  fallback: true
});
assert.deepEqual(gates.get('unknown-path-fallback').actualCommands, ['npm test']);

const internal = summary.internalSummary || {};
assert.equal(internal.contractEvidenceTotals.total, 6);
assert.equal(internal.contractEvidenceTotals.ready, 6);
assert.equal(internal.contractEvidenceTotals.missing, 0);
const contracts = byId(internal.contractEvidence);
[
  ['asset-facade', 'facade'],
  ['render-route', 'rule module'],
  ['schema-registry', 'registry'],
  ['visual-qa-runner', 'runner'],
  ['text-policy', 'rule module'],
  ['region-contract', 'registry']
].forEach(([id, supportKind]) => {
  const row = contracts.get(id);
  assert.ok(row, `${id} contract evidence should be present`);
  assert.equal(row.supportKind, supportKind);
  assert.equal(row.ready, true);
  assert.deepEqual(row.missingFiles, []);
  assert.ok(row.files.length > 0);
});

assert.equal(summary.modes.delivery.safe, true);
assert.deepEqual(summary.modes.delivery.failedChecks, []);
assert.equal(summary.modes.delivery.checks.p0p1ObjectiveCoverageReady, true);
assert.equal(summary.modes.delivery.checks.screenshotBaselineReady, true);
assert.equal(summary.modes.delivery.checks.textBlankReadinessReady, true);
assert.equal(summary.modes.maintenance.safe, true);
assert.deepEqual(summary.modes.maintenance.failedChecks, []);
assert.equal(summary.modes.maintenance.checks.moduleBudgetsReady, true);
assert.equal(summary.modes.maintenance.checks.testProfileGatesReady, true);

const mdPath = path.join(OUT, 'hardening-dashboard.md');
const mdRun = runAudit(['--summary-md', mdPath, '--json']);
assert.equal(mdRun.status, 0, mdRun.stderr || mdRun.stdout);
const markdown = fs.readFileSync(mdPath, 'utf8');
[
  '# Hardening Readiness Dashboard',
  '- Objective coverage: pass 12, partial 0, missing 0',
  '- Required objective coverage: ready (12/12)',
  '- Module budget require closure:',
  '- Screenshot baseline QA: ready (5/5 regions, 3 findings)',
  '- Text shrink/blank-page QA: ready (3 findings, 5 text-meta fields, 3 coverage fields)',
  '- Internal contract evidence: 6/6 ready',
  '| delivery | safe | none |',
  '| maintenance | safe | none |',
  '## Objective Coverage',
  '## Test Profile Gates',
  '| render-text-parts | pass | none | none | render-text | unit, visual | npm run test:unit && npm run test:visual | no | scripts/render/text-meta.js |',
  '| chart-qa-parts | pass | none | none | chart-qa | unit, visual | npm run test:unit && npm run test:visual | no | scripts/design/chart-semantic-qa.js, scripts/design/chart-spec-normalization.js |',
  '## Internal Contract Evidence',
  '| asset-facade Asset facade | yes | facade |',
  '| visual-qa-runner Visual QA runner | yes | runner |',
  '| region-contract Region contract | yes | registry |'
].forEach(sample => {
  assert.ok(markdown.includes(sample), `markdown should include: ${sample}`);
});

const humanRun = runAudit();
assert.equal(humanRun.status, 0, humanRun.stderr || humanRun.stdout);
[
  'Template readiness: ready - 20 page families, 0 missing fields',
  'Delivery gates: pass',
  'Objective coverage: pass 12  partial 0  missing 0',
  'Module budgets: pass',
  'Screenshot baseline QA: ready',
  'Text shrink/blank-page QA: ready',
  'Test profile gates: pass',
  'maintenance   safe'
].forEach(sample => {
  assert.ok(humanRun.stdout.includes(sample), `human output should include: ${sample}`);
});

console.log('hardening dashboard ok');

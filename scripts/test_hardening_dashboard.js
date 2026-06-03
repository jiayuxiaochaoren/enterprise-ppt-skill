const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-hardening-dashboard');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

function runAudit(args = []) {
  return cp.spawnSync(process.execPath, ['scripts/audit_hardening_readiness.js', ...args], {
    cwd: ROOT,
    encoding: 'utf8'
  });
}

const jsonRun = runAudit(['--json']);
assert.equal(jsonRun.status, 0, jsonRun.stderr || jsonRun.stdout);
const summary = JSON.parse(jsonRun.stdout);
const matrix = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/hardening-readiness-matrix.json'), 'utf8'));

assert.equal(summary.version, 'hardening-readiness-audit/v1');
const expectedObjectiveIds = matrix.objectiveCoverageContract.requiredObjectiveIds;
assert.deepEqual(expectedObjectiveIds, summary.objectiveCoverage.map(row => row.id));
assert.deepEqual(summary.objectiveCoverageContract, {
  ready: true,
  requiredObjectiveIds: expectedObjectiveIds,
  actualObjectiveIds: expectedObjectiveIds,
  missingObjectiveIds: [],
  unexpectedObjectiveIds: [],
  requiredCount: 12,
  actualCount: 12
});
assert.ok(summary.evidenceStateTotals.codePath.pass > 0);
assert.ok(summary.evidenceStateTotals.automatedQa.pass > 0);
assert.ok(summary.evidenceStateTotals.renderedProof.not_applicable > 0);
assert.equal(summary.evidenceCompleteness.complete, summary.taskCount);
assert.equal(summary.evidenceCompleteness.incomplete, 0);

assert.equal(summary.template.ready, true);
assert.equal(summary.template.pageFamilyCount, 20);
assert.deepEqual(summary.template.missing, []);

assert.deepEqual(summary.deliveryGateTotals, { pass: 2, partial: 0, missing: 0 });
assert.equal(summary.deliveryGates.length, 2);
assert.ok(summary.deliveryGates.every(gate => gate.ready), 'delivery gates should be ready');
assert.ok(summary.deliveryGates.some(gate => gate.id === 'formal-validate-with-visual-qa'));

assert.deepEqual(summary.objectiveCoverageTotals, { pass: 12, partial: 0, missing: 0 });
assert.deepEqual(summary.objectiveCoverageByPriority, {
  P0: {
    ready: true,
    total: 4,
    pass: 4,
    partial: 0,
    missing: 0,
    failedObjectiveIds: [],
    failureSignals: {}
  },
  P1: {
    ready: true,
    total: 4,
    pass: 4,
    partial: 0,
    missing: 0,
    failedObjectiveIds: [],
    failureSignals: {}
  },
  P2: {
    ready: true,
    total: 4,
    pass: 4,
    partial: 0,
    missing: 0,
    failedObjectiveIds: [],
    failureSignals: {}
  }
});
assert.equal(summary.objectiveCoverage.length, 12);
assert.ok(summary.objectiveCoverage.every(row => row.ready), 'objective coverage should be ready');
const drawnObjective = summary.objectiveCoverage.find(row => row.id === 'P0-01');
assert.ok(drawnObjective, 'drawn evidence objective should be represented');
assert.equal(drawnObjective.title, 'Component Drawn Evidence full coverage');
assert.deepEqual(drawnObjective.requiredEvidence, ['automatedQa', 'codePath', 'renderMeta', 'renderedProof']);
assert.deepEqual(drawnObjective.evidenceState, {
  codePath: 'pass',
  renderMeta: 'pass',
  automatedQa: 'pass',
  renderedProof: 'pass'
});
assert.deepEqual(drawnObjective.evidenceTaskIds, ['P0-02', 'P1-01', 'P1-04']);
assert.deepEqual(drawnObjective.evidenceMissing, []);
const profileObjective = summary.objectiveCoverage.find(row => row.id === 'P2-03');
assert.ok(profileObjective, 'test profile objective should be represented');
assert.deepEqual(profileObjective.testProfileGateIds, ['renderer-only', 'asset-only', 'material-only']);
assert.deepEqual(profileObjective.notReadyTestProfileGateIds, []);
const dashboardObjective = summary.objectiveCoverage.find(row => row.id === 'P2-04');
assert.ok(dashboardObjective, 'dashboard objective should be represented');
assert.deepEqual(dashboardObjective.deliveryGateIds, ['formal-validate-with-visual-qa', 'hardening-smoke-visual-qa']);
assert.equal(dashboardObjective.moduleBudgetIds.length, 3);
assert.equal(dashboardObjective.testProfileGateIds.length, 8);

assert.deepEqual(summary.moduleBudgetTotals, { pass: 3, over_limit: 0, missing: 0 });
assert.deepEqual(summary.moduleBudgetDirectoryTotals, { tracked: 5, present: 5, missing: 0, empty: 0 });
assert.equal(summary.moduleBudgets.length, 3);
assert.ok(summary.moduleBudgets.every(row => row.status === 'pass'), 'tracked module budgets should pass');
assert.deepEqual(summary.testProfileGateTotals, { pass: 8, partial: 0, missing: 0 });
assert.deepEqual(summary.testProfileGateCoverage.requiredGateIds, ['renderer-only', 'asset-only', 'material-only']);
assert.deepEqual(summary.testProfileGateCoverage.missingGateIds, []);
assert.deepEqual(summary.testProfileGateCoverage.notReadyGateIds, []);
assert.equal(summary.testProfileGateCoverage.ready, true);
assert.equal(summary.testProfileGates.length, 8);
assert.ok(summary.testProfileGates.every(row => row.ready), 'test profile gates should be ready');
const rendererProfileGate = summary.testProfileGates.find(row => row.id === 'renderer-only');
assert.ok(rendererProfileGate, 'renderer-only test profile gate should be present');
assert.deepEqual(rendererProfileGate.actualRuleIds, ['renderer']);
assert.deepEqual(rendererProfileGate.actualGroups, ['unit', 'render', 'visual']);
assert.deepEqual(rendererProfileGate.actualCommands, ['npm run test:unit', 'npm run test:render', 'npm run test:visual']);
assert.equal(rendererProfileGate.actualFallbackToFull, false);
assert.deepEqual(rendererProfileGate.mismatchReasons, []);
assert.deepEqual(rendererProfileGate.mismatchDetails, []);
const deliveryReadinessProfileGate = summary.testProfileGates.find(row => row.id === 'delivery-readiness');
assert.ok(deliveryReadinessProfileGate, 'delivery-readiness test profile gate should be present');
assert.deepEqual(deliveryReadinessProfileGate.changedFiles, [
  'scripts/qa/hardening-module-budgets.js',
  'scripts/qa/hardening-require-closure.js',
  'scripts/qa/hardening-page-family-primitives.js',
  'scripts/qa/hardening-quality-severity.js',
  'scripts/qa/hardening-screenshot-baseline.js',
  'scripts/qa/hardening-task-contract-shapes.js',
  'scripts/qa/hardening-task-summary.js',
  'scripts/qa/hardening-text-blank.js',
  'scripts/qa/hardening-readiness-modes.js',
  'scripts/qa/hardening-readiness-subsystems.js',
  'scripts/qa/hardening-readiness-summary.js',
  'scripts/reports/hardening-readiness-report.js',
  'scripts/reports/hardening-readiness-human.js',
  'scripts/reports/hardening-readiness-format.js'
]);
assert.deepEqual(deliveryReadinessProfileGate.actualRuleIds, ['delivery-readiness']);
assert.deepEqual(deliveryReadinessProfileGate.actualGroups, ['unit', 'delivery']);
assert.deepEqual(deliveryReadinessProfileGate.actualCommands, ['npm run test:unit', 'npm run test:delivery', 'npm run audit:hardening']);
assert.equal(deliveryReadinessProfileGate.actualFallbackToFull, false);
assert.deepEqual(deliveryReadinessProfileGate.mismatchReasons, []);
assert.deepEqual(deliveryReadinessProfileGate.mismatchDetails, []);
const fallbackProfileGate = summary.testProfileGates.find(row => row.id === 'unknown-path-fallback');
assert.ok(fallbackProfileGate, 'unknown fallback test profile gate should be present');
assert.equal(fallbackProfileGate.actualFallbackToFull, true);
assert.deepEqual(fallbackProfileGate.actualCommands, ['npm test']);
assert.deepEqual(fallbackProfileGate.mismatchReasons, []);
assert.deepEqual(fallbackProfileGate.mismatchDetails, []);

const hotspotBudget = summary.moduleBudgets.find(row => row.id === 'p2-01-hotspot-facades');
assert.ok(hotspotBudget, 'hotspot module budget should be present');
assert.ok(hotspotBudget.files.some(row => row.file === 'scripts/visual_qa.js' && row.lines > 0));
const hotspotFacadeFiles = [
  'scripts/design-system.js',
  'scripts/chart-spec.js',
  'scripts/visual_qa.js',
  'scripts/qa/visual-qa-cli.js',
  'scripts/qa/render-meta-audits.js'
];
const hotspotDirectoryFiles = ['scripts/design', 'scripts/components', 'scripts/qa', 'scripts/render'].flatMap(dir =>
  fs.readdirSync(path.join(ROOT, dir))
    .filter(file => file.endsWith('.js'))
    .map(file => `${dir}/${file}`)
);
const expectedHotspotFiles = [...new Set([...hotspotFacadeFiles, ...hotspotDirectoryFiles])].sort();
assert.equal(hotspotBudget.fileCount, expectedHotspotFiles.length);
assert.deepEqual(hotspotBudget.files.map(row => row.file), expectedHotspotFiles);
assert.deepEqual(hotspotBudget.requireClosureRoots, [
  'scripts/design-system.js',
  'scripts/chart-spec.js',
  'scripts/visual_qa.js',
  'scripts/qa/render-meta-audits.js'
]);
assert.ok(hotspotBudget.requireClosureFiles.length > hotspotBudget.requireClosureRoots.length);
assert.deepEqual(hotspotBudget.untrackedRequireClosureFiles, []);
assert.deepEqual(hotspotBudget.directories.map(row => row.path), [
  'scripts/design',
  'scripts/components',
  'scripts/qa',
  'scripts/render'
]);
assert.ok(hotspotBudget.files.some(row => row.file === 'scripts/design/design-system-core-runtime.js' && row.lines > 0));
assert.ok(hotspotBudget.files.some(row => row.file === 'scripts/components/chart-renderer.js' && row.lines > 0));
assert.ok(hotspotBudget.files.some(row => row.file === 'scripts/qa/render-meta-schema-audit.js' && row.lines > 0));
assert.ok(hotspotBudget.files.some(row => row.file === 'scripts/render/component-capability-manifest.js' && row.lines > 0));
assert.ok(hotspotBudget.maxObservedLines <= hotspotBudget.maxLines);
assert.equal(hotspotBudget.lineHeadroom, hotspotBudget.maxLines - hotspotBudget.maxObservedLines);
assert.equal(hotspotBudget.lineUsagePercent, Math.round((hotspotBudget.maxObservedLines / hotspotBudget.maxLines) * 100));

const layoutBudget = summary.moduleBudgets.find(row => row.id === 'p2-02-layout-modules');
assert.ok(layoutBudget, 'page-family layout module budget should be present');
assert.equal(layoutBudget.maxLines, 300);
const expectedPageFamilyFiles = fs.readdirSync(path.join(ROOT, 'scripts/render/page-families'))
  .filter(file => file.endsWith('.js'))
  .map(file => `scripts/render/page-families/${file}`)
  .sort();
assert.deepEqual(layoutBudget.missingDirectories, []);
assert.deepEqual(layoutBudget.emptyDirectories, []);
assert.deepEqual(layoutBudget.directories.map(row => row.path), ['scripts/render/page-families']);
assert.equal(layoutBudget.directories[0].exists, true);
assert.equal(layoutBudget.directories[0].fileCount, expectedPageFamilyFiles.length);
assert.equal(layoutBudget.fileCount, expectedPageFamilyFiles.length);
assert.deepEqual(layoutBudget.files.map(row => row.file), expectedPageFamilyFiles);
assert.ok(layoutBudget.files.some(row => row.file === 'scripts/render/page-families/cover-core.js' && row.lines > 0));
assert.ok(layoutBudget.files.some(row => row.file === 'scripts/render/page-families/financial-scorecards.js' && row.lines > 0));
assert.ok(layoutBudget.maxObservedLines <= layoutBudget.maxLines);
assert.equal(layoutBudget.lineHeadroom, layoutBudget.maxLines - layoutBudget.maxObservedLines);
assert.equal(layoutBudget.lineUsagePercent, Math.round((layoutBudget.maxObservedLines / layoutBudget.maxLines) * 100));

const dashboardBudget = summary.moduleBudgets.find(row => row.id === 'p2-04-hardening-dashboard-modules');
assert.ok(dashboardBudget, 'hardening dashboard module budget should be present');
assert.equal(dashboardBudget.maxLines, 300);
assert.deepEqual(dashboardBudget.missingFiles, []);
assert.deepEqual(dashboardBudget.requireClosureRoots, ['scripts/audit_hardening_readiness.js']);
assert.deepEqual(dashboardBudget.untrackedRequireClosureFiles, []);
[
  'scripts/qa/hardening-delivery-gates.js',
  'scripts/qa/hardening-matrix-contract-shapes.js',
  'scripts/qa/hardening-require-closure.js',
  'scripts/qa/hardening-objective-contract-shapes.js',
  'scripts/qa/hardening-objective-coverage.js',
  'scripts/qa/hardening-page-family-primitives.js',
  'scripts/qa/hardening-quality-severity.js',
  'scripts/qa/hardening-readiness-subsystems.js',
  'scripts/qa/hardening-screenshot-baseline.js',
  'scripts/qa/hardening-task-contract-shapes.js',
  'scripts/qa/hardening-text-blank.js',
  'scripts/qa/hardening-template-summary.js',
  'scripts/qa/hardening-test-profile-gates.js',
  'scripts/qa/quality-severity-commercial.js',
  'scripts/qa/quality-severity-matrix.js',
  'scripts/qa/quality-severity-policy.js',
  'scripts/render/page-families/primitive-contract.js',
  'scripts/render/page-families/primitives.js',
  'scripts/reports/hardening-readiness-format.js',
  'scripts/reports/hardening-readiness-human.js',
  'scripts/test-profile-mapping.js'
].forEach(file => {
  assert.ok(dashboardBudget.files.some(row => row.file === file && row.lines > 0), `${file} should be tracked by dashboard module budget`);
  assert.ok(dashboardBudget.requireClosureFiles.includes(file), `${file} should be in dashboard require closure`);
});
assert.ok(dashboardBudget.files.some(row => row.file === 'scripts/audit_hardening_readiness.js' && row.lines < 50));
assert.ok(dashboardBudget.files.some(row => row.file === 'scripts/qa/hardening-readiness-environment.js' && row.lines > 0));
assert.ok(dashboardBudget.files.some(row => row.file === 'scripts/qa/hardening-require-closure.js' && row.lines > 0));
assert.ok(dashboardBudget.files.some(row => row.file === 'scripts/qa/hardening-readiness-subsystems.js' && row.lines > 0));
assert.ok(dashboardBudget.files.some(row => row.file === 'scripts/qa/hardening-readiness-summary.js' && row.lines > 0));
assert.ok(dashboardBudget.files.some(row => row.file === 'scripts/qa/hardening-evidence-state.js' && row.lines > 0));
assert.ok(dashboardBudget.files.some(row => row.file === 'scripts/reports/hardening-readiness-human.js' && row.lines > 0));
assert.ok(dashboardBudget.files.some(row => row.file === 'scripts/reports/hardening-readiness-report.js' && row.lines < 300));
assert.ok(dashboardBudget.maxObservedLines <= dashboardBudget.maxLines);
assert.equal(dashboardBudget.lineHeadroom, dashboardBudget.maxLines - dashboardBudget.maxObservedLines);
assert.equal(dashboardBudget.lineUsagePercent, Math.round((dashboardBudget.maxObservedLines / dashboardBudget.maxLines) * 100));
assert.deepEqual(summary.moduleBudgetRequireClosureTotals, {
  budgetsWithClosure: 2,
  roots: 5,
  files: hotspotBudget.requireClosureFiles.length + dashboardBudget.requireClosureFiles.length,
  untracked: 0
});
assert.deepEqual(summary.pageFamilyPrimitives, {
  ready: true,
  error: '',
  groupCount: 4,
  expectedExportCount: 15,
  exposedExportCount: 15,
  targetCount: 8,
  exposedTargetCount: 8,
  expectedExports: [
    'drawCaptionStack',
    'drawChromePageNumber',
    'drawDarkPageHeader',
    'drawDarkStageShell',
    'drawEvidenceBoard',
    'drawEvidencePanel',
    'drawFooter',
    'drawImagePanel',
    'drawLightCanvasShell',
    'drawLightPageHeader',
    'drawMetricCard',
    'drawMetricRow',
    'drawNumberPageNumber',
    'drawRiskBoardFooter',
    'drawTextPageNumber'
  ],
  exposedExports: [
    'drawCaptionStack',
    'drawChromePageNumber',
    'drawDarkPageHeader',
    'drawDarkStageShell',
    'drawEvidenceBoard',
    'drawEvidencePanel',
    'drawFooter',
    'drawImagePanel',
    'drawLightCanvasShell',
    'drawLightPageHeader',
    'drawMetricCard',
    'drawMetricRow',
    'drawNumberPageNumber',
    'drawRiskBoardFooter',
    'drawTextPageNumber'
  ],
  extraExports: [],
  missingExports: [],
  missingTargets: [],
  groups: [
    { id: 'header', label: 'Header primitives', exportCount: 3, exposedCount: 3, missingExports: [], ready: true },
    { id: 'footer', label: 'Footer and page-number primitives', exportCount: 6, exposedCount: 6, missingExports: [], ready: true },
    { id: 'metrics', label: 'Metric primitives', exportCount: 2, exposedCount: 2, missingExports: [], ready: true },
    { id: 'evidence', label: 'Caption, image, and evidence primitives', exportCount: 4, exposedCount: 4, missingExports: [], ready: true }
  ]
});
assert.equal(summary.qualitySeverityMatrix.ready, true);
assert.equal(summary.qualitySeverityMatrix.policyVersion, 'quality-severity-policy/v1');
assert.equal(summary.qualitySeverityMatrix.matrixVersion, 'quality-severity-matrix/v1');
assert.equal(summary.qualitySeverityMatrix.categoryCount, 16);
assert.equal(summary.qualitySeverityMatrix.rowCount, 183);
assert.equal(summary.qualitySeverityMatrix.requiredCategoryCount, 8);
assert.equal(summary.qualitySeverityMatrix.requiredTypeCount, 8);
assert.equal(summary.qualitySeverityMatrix.readyRequiredTypeCount, 8);
assert.deepEqual(summary.qualitySeverityMatrix.missingCategories, []);
assert.deepEqual(summary.qualitySeverityMatrix.missingTypes, []);
assert.deepEqual(summary.qualitySeverityMatrix.mismatchedTypes, []);
assert.deepEqual(
  summary.qualitySeverityMatrix.requiredTypes.map(row => row.type),
  [
    'fallbackRendererUsed',
    'skippedCriticalAsset',
    'unknownComponentId',
    'staleRouteMetadataStillActive',
    'textShrinkRisk',
    'possiblyBlankPreview',
    'baselineHashDistance',
    'overlaySlotMismatch'
  ]
);
assert.ok(summary.qualitySeverityMatrix.categories.some(row => row.category === 'fallback' && row.formalFail === 3 && row.deliveryFail === 3));
assert.ok(summary.qualitySeverityMatrix.categories.some(row => row.category === 'unknown_component' && row.rows === 20));
assert.equal(summary.screenshotBaseline.ready, true);
assert.equal(summary.screenshotBaseline.filesReady, true);
assert.equal(summary.screenshotBaseline.manifestReady, true);
assert.equal(summary.screenshotBaseline.docsReady, true);
assert.equal(summary.screenshotBaseline.auditReady, true);
assert.equal(summary.screenshotBaseline.negativeReady, true);
assert.equal(summary.screenshotBaseline.manifestVersion, 'visual-baseline/v1');
assert.equal(summary.screenshotBaseline.requiredRegionCount, 5);
assert.equal(summary.screenshotBaseline.manifestRegionCount, 5);
assert.equal(summary.screenshotBaseline.requiredFindingCount, 3);
assert.deepEqual(summary.screenshotBaseline.requiredRegions, ['cardGrid', 'chartBoard', 'footer', 'mainBody', 'rightEvidence']);
assert.deepEqual(summary.screenshotBaseline.manifestRegions, ['cardGrid', 'chartBoard', 'footer', 'mainBody', 'rightEvidence']);
assert.deepEqual(summary.screenshotBaseline.requiredFindings, ['baselinePreviewMissing', 'baselineRegionBBoxShift', 'baselineRegionMissing']);
assert.deepEqual(summary.screenshotBaseline.missingManifestRegions, []);
assert.deepEqual(summary.screenshotBaseline.missingDocRegions, []);
assert.deepEqual(summary.screenshotBaseline.missingNegativeRegions, []);
assert.deepEqual(summary.screenshotBaseline.missingAuditFindings, []);
assert.deepEqual(summary.screenshotBaseline.missingNegativeFindings, []);
assert.deepEqual(summary.screenshotBaseline.missingDocFindings, []);
assert.deepEqual(summary.screenshotBaseline.missingDocTerms, []);
assert.deepEqual(summary.screenshotBaseline.files.map(file => file.path), [
  'scripts/qa/screenshot-baseline-audit.js',
  'references/screenshot-baseline-qa.md',
  'examples/visual-baseline-region-manifest.example.json',
  'scripts/test_visual_qa_baseline.js'
]);
assert.equal(summary.textBlank.ready, true);
assert.equal(summary.textBlank.filesReady, true);
assert.equal(summary.textBlank.textMetaReady, true);
assert.equal(summary.textBlank.shrinkQaReady, true);
assert.equal(summary.textBlank.blankQaReady, true);
assert.equal(summary.textBlank.requiredFindingCount, 3);
assert.equal(summary.textBlank.requiredTextMetaFieldCount, 5);
assert.equal(summary.textBlank.requiredCoverageFieldCount, 3);
assert.deepEqual(summary.textBlank.requiredFindings, ['mainBodyMissingContent', 'rightEvidenceRegionMissing', 'textShrinkRisk']);
assert.deepEqual(summary.textBlank.requiredTextMetaFields, ['areaDensity', 'charsPerInch', 'readabilityRiskLevel', 'shrinkRisk', 'textBoxes']);
assert.deepEqual(summary.textBlank.requiredCoverageFields, ['mainBodyCoverage', 'mainBodyElements', 'rightEvidenceCoverage']);
assert.deepEqual(summary.textBlank.missingTextMetaFields, []);
assert.deepEqual(summary.textBlank.missingTypographyFindings, []);
assert.deepEqual(summary.textBlank.missingCoverageFindings, []);
assert.deepEqual(summary.textBlank.missingCoverageFields, []);
assert.deepEqual(summary.textBlank.missingContentCoverageTestTerms, []);
assert.deepEqual(summary.textBlank.missingTypographyTestTerms, []);
assert.deepEqual(summary.textBlank.files.map(file => file.path), [
  'scripts/render/text-meta.js',
  'scripts/design/typography.js',
  'scripts/qa/content-coverage-audit.js',
  'scripts/qa/visual-slide-audit.js',
  'scripts/test_visual_qa_content_coverage.js',
  'scripts/test_typography_system.js'
]);

assert.equal(summary.modes.delivery.safe, true);
assert.equal(summary.modes.formal_review.checks.p0ObjectiveCoverageReady, true);
assert.ok(summary.modes.delivery.reason.includes('quality severity matrix'));
assert.ok(summary.modes.delivery.reason.includes('text shrink/blank-page QA'));
assert.deepEqual(summary.modes.delivery.failedChecks, []);
assert.equal(summary.modes.delivery.checks.p0p1ObjectiveCoverageReady, true);
assert.equal(summary.modes.delivery.checks.qualitySeverityMatrixReady, true);
assert.equal(summary.modes.delivery.checks.screenshotBaselineReady, true);
assert.equal(summary.modes.delivery.checks.textBlankReadinessReady, true);
assert.equal(summary.modes.delivery.checks.deliveryGatesReady, true);
assert.equal(summary.modes.delivery.checks.noBlockingIssues, true);
assert.equal(summary.modes.maintenance.safe, true);
assert.deepEqual(summary.modes.maintenance.failedChecks, []);
assert.equal(summary.modes.maintenance.checks.objectiveCoverageReady, true);
assert.equal(summary.modes.maintenance.checks.moduleBudgetsReady, true);
assert.equal(summary.modes.maintenance.checks.pageFamilyPrimitivesReady, true);
assert.equal(summary.modes.maintenance.checks.testProfileGatesReady, true);
assert.equal(summary.modes.maintenance.checks.testProfileGateCoverageReady, true);
assert.equal(summary.modes.maintenance.checks.noBlockingIssues, true);

assert.deepEqual(summary.matrixContractTotals, { total: 0, blocking: 0, review: 0 });
assert.deepEqual(Object.keys(matrix.qualityModes).sort(), Object.keys(summary.modes).sort());
assert.deepEqual(summary.issues.filter(item => item.type === 'matrixTopLevelFieldInvalid'), []);
assert.deepEqual(summary.issues.filter(item => /^matrix(SourceBacklog|StatusScale)/.test(item.type)), []);
assert.deepEqual(summary.issues.filter(item => /^deliveryGate.*Invalid/.test(item.type)), []);
assert.deepEqual(summary.issues.filter(item => item.type === 'deliveryGateIdDuplicate'), []);
assert.deepEqual(summary.issues.filter(item => item.type === 'moduleBudgetIdDuplicate'), []);
assert.deepEqual(summary.issues.filter(item => /^moduleBudget.*(Invalid|Missing)/.test(item.type)), []);
assert.deepEqual(summary.issues.filter(item => /^testProfileGate.*(Invalid|Duplicate|Mismatch)/.test(item.type)), []);
assert.deepEqual(summary.issues.filter(item => /^objective/.test(item.type)), []);
assert.deepEqual(summary.issues.filter(item => /^taskRequiredField/.test(item.type)), []);
assert.deepEqual(summary.issues.filter(item => /^task(Priority|Id)/.test(item.type)), []);
assert.deepEqual(summary.issues.filter(item => /^taskEvidenceField/.test(item.type)), []);
assert.deepEqual(summary.issues.filter(item => /^qualityModeDescription/.test(item.type)), []);

const dashboardTask = summary.tasks.find(task => task.id === 'P2-04');
assert.ok(dashboardTask, 'dashboard task should be represented');
assert.equal(dashboardTask.evidenceState.codePath, 'pass');
assert.equal(dashboardTask.evidenceState.automatedQa, 'pass');
assert.equal(dashboardTask.evidenceComplete, true);
assert.deepEqual(dashboardTask.evidenceGaps, []);
const fixtureTask = summary.tasks.find(task => task.id === 'P2-03');
assert.equal(fixtureTask.evidenceState.renderMeta, 'pass');
assert.equal(fixtureTask.evidenceGaps.includes('renderMeta:missing'), false);
const visualFixtureTask = summary.tasks.find(task => task.id === 'P2-01');
assert.equal(visualFixtureTask.evidenceState.codePath, 'pass');
assert.deepEqual(visualFixtureTask.evidenceGaps, []);

const mdPath = path.join(OUT, 'hardening-dashboard.md');
const mdRun = runAudit(['--summary-md', mdPath, '--json']);
assert.equal(mdRun.status, 0, mdRun.stderr || mdRun.stdout);
const markdown = fs.readFileSync(mdPath, 'utf8');
assert.ok(markdown.includes('# Hardening Readiness Dashboard'));
assert.ok(markdown.includes('| Mode | Status | Failed Checks | Reason |'));
assert.ok(markdown.includes('| delivery | safe | none | P0/P1 hardening, P0/P1 objective coverage, formal validation, quality severity matrix, screenshot baseline QA, text shrink/blank-page QA, template readiness, delivery gates, and blocking audit status are all green |'));
assert.ok(markdown.includes('| maintenance | safe | none | P2 hardening, all objective coverage, module budgets, page-family primitives, required test profile coverage, test profile gates, and blocking audit status are healthy |'));
assert.ok(markdown.includes('| Task | Priority | Status | Strength | Code | Render Meta | QA | Proof | Gaps |'));
assert.ok(markdown.includes('- Evidence complete:'));
assert.ok(markdown.includes('- Module budget minimum headroom:'));
assert.ok(markdown.includes(`- Module budget require closure: 2 budgets, 5 roots, ${hotspotBudget.requireClosureFiles.length + dashboardBudget.requireClosureFiles.length} files, 0 untracked`));
assert.ok(markdown.includes('- Page-family primitives: ready (4 groups, 15/15 exports, 8/8 P2 targets)'));
assert.ok(markdown.includes('- Quality severity matrix: ready (16 categories, 183 rows, 8/8 required types)'));
assert.ok(markdown.includes('- Screenshot baseline QA: ready (5/5 regions, 3 findings)'));
assert.ok(markdown.includes('- Text shrink/blank-page QA: ready (3 findings, 5 text-meta fields, 3 coverage fields)'));
assert.ok(markdown.includes('- Test profile gates: pass 8, partial 0, missing 0'));
assert.ok(markdown.includes('- Required test profile coverage: ready (renderer-only, asset-only, material-only)'));
assert.ok(markdown.includes('- Matrix contract issues: 0 (0 blocking, 0 review)'));
assert.ok(markdown.includes('- Objective coverage: pass 12, partial 0, missing 0'));
assert.ok(markdown.includes('- Objective coverage by priority: P0 ready 4/4; P1 ready 4/4; P2 ready 4/4'));
assert.ok(markdown.includes('- Required objective coverage: ready (12/12)'));
assert.ok(markdown.includes('## Template Readiness'));
assert.ok(markdown.includes('- Status: ready'));
assert.ok(markdown.includes('- Missing fields: 0'));
assert.ok(markdown.includes('## Delivery Gates'));
assert.ok(markdown.includes('| Gate | Required | Status | Command Available | Artifacts | Missing Artifacts |'));
assert.ok(markdown.includes('| formal-validate-with-visual-qa | yes | pass | yes | 2 | none |'));
assert.ok(markdown.includes('## Objective Coverage'));
assert.ok(markdown.includes('- Contract: ready (required 12, actual 12)'));
assert.ok(markdown.includes(`- Required objective IDs: ${expectedObjectiveIds.join(', ')}`));
assert.ok(markdown.includes(`- Actual objective IDs: ${expectedObjectiveIds.join(', ')}`));
assert.ok(markdown.includes('- Missing required objective IDs: none'));
assert.ok(markdown.includes('- Unexpected objective IDs: none'));
assert.ok(markdown.includes('| Priority | Ready | Pass | Partial | Missing | Failed Objectives | Failure Signals |'));
assert.ok(markdown.includes('| P0 | yes | 4 | 0 | 0 | none | none |'));
assert.ok(markdown.includes('| P1 | yes | 4 | 0 | 0 | none | none |'));
assert.ok(markdown.includes('| P2 | yes | 4 | 0 | 0 | none | none |'));
assert.ok(markdown.includes('| Objective | Priority | Status | Evidence Tasks | Required Evidence | Code | Render Meta | QA | Proof | Gates And Budgets | Missing |'));
assert.ok(markdown.includes('| P0-01 Component Drawn Evidence full coverage | P0 | pass | P0-02, P1-01, P1-04 | automatedQa, codePath, renderMeta, renderedProof | pass | pass | pass | pass | none | none |'));
assert.ok(markdown.includes('| P2-03 Test Profile speed-up | P2 | pass | P2-04 | automatedQa, codePath | pass | not_required | pass | not_required | profile:renderer-only, profile:asset-only, profile:material-only | none |'));
assert.ok(markdown.includes('| P2-04 Hardening Dashboard | P2 | pass | P2-04 | automatedQa, codePath | pass | not_required | pass | not_required | budget:p2-01-hotspot-facades, budget:p2-02-layout-modules, budget:p2-04-hardening-dashboard-modules, profile:renderer-only, profile:asset-only, profile:material-only, profile:design-planning, profile:visual-qa, profile:delivery-readiness, profile:runner-and-docs, profile:unknown-path-fallback, gate:formal-validate-with-visual-qa, gate:hardening-smoke-visual-qa | none |'));
assert.ok(markdown.includes('## Module Budgets'));
assert.ok(markdown.includes('| Budget | Status | Max Lines | Max Observed | Headroom | Usage | Files | Directories | Require Roots | Require Closure | Untracked Require Closure | Over Limit | Missing Files | Missing Dirs | Empty Dirs |'));
assert.ok(markdown.includes(`| p2-01-hotspot-facades P2-01 hotspot facades and helper closure stay slim after decomposition | pass | 300 | ${hotspotBudget.maxObservedLines} | ${hotspotBudget.lineHeadroom} | ${hotspotBudget.lineUsagePercent}% | ${hotspotBudget.fileCount} | 4 | scripts/design-system.js, scripts/chart-spec.js, scripts/visual_qa.js, scripts/qa/render-meta-audits.js | ${hotspotBudget.requireClosureFiles.length} | none | none | none | none | none |`));
assert.ok(markdown.includes(`| p2-02-layout-modules P2-02 page-family modules stay within the 300-line budget | pass | 300 | ${layoutBudget.maxObservedLines} | ${layoutBudget.lineHeadroom} | ${layoutBudget.lineUsagePercent}% | ${expectedPageFamilyFiles.length} | 1 | none | 0 | none | none | none | none | none |`));
assert.ok(markdown.includes(`| p2-04-hardening-dashboard-modules P2-04 hardening dashboard modules stay slim and auditable | pass | 300 | ${dashboardBudget.maxObservedLines} | ${dashboardBudget.lineHeadroom} | ${dashboardBudget.lineUsagePercent}% | ${dashboardBudget.fileCount} | 0 | scripts/audit_hardening_readiness.js | ${dashboardBudget.requireClosureFiles.length} | none | none | none | none | none |`));
assert.ok(markdown.includes('## Page-Family Primitives'));
assert.ok(markdown.includes('- Status: ready'));
assert.ok(markdown.includes('- Missing exports: none'));
assert.ok(markdown.includes('- Missing P2 targets: none'));
assert.ok(markdown.includes('| Group | Ready | Exposed | Expected | Missing Exports |'));
assert.ok(markdown.includes('| header Header primitives | yes | 3 | 3 | none |'));
assert.ok(markdown.includes('| footer Footer and page-number primitives | yes | 6 | 6 | none |'));
assert.ok(markdown.includes('| metrics Metric primitives | yes | 2 | 2 | none |'));
assert.ok(markdown.includes('| evidence Caption, image, and evidence primitives | yes | 4 | 4 | none |'));
assert.ok(markdown.includes('## Quality Severity Matrix'));
assert.ok(markdown.includes('- Policy: quality-severity-policy/v1'));
assert.ok(markdown.includes('- Matrix: quality-severity-matrix/v1'));
assert.ok(markdown.includes('- Missing required categories: none'));
assert.ok(markdown.includes('- Missing required types: none'));
assert.ok(markdown.includes('| Category | Rows | Formal Fail | Delivery Fail |'));
assert.ok(markdown.includes('| fallback | 3 | 3 | 3 |'));
assert.ok(markdown.includes('| unknown_component | 20 | 20 | 20 |'));
assert.ok(markdown.includes('| Required Type | Ready | Category | Draft | Formal | Delivery | Mismatches |'));
assert.ok(markdown.includes('| fallbackRendererUsed | yes | fallback | review | fail | fail | none |'));
assert.ok(markdown.includes('| possiblyBlankPreview | yes | blank_page | review | review | fail | none |'));
assert.ok(markdown.includes('## Test Profile Gates'));
assert.ok(markdown.includes('- Required coverage: ready'));
assert.ok(markdown.includes('- Required gates: renderer-only, asset-only, material-only'));
assert.ok(markdown.includes('- Missing required gates: none'));
assert.ok(markdown.includes('- Not-ready required gates: none'));
assert.ok(markdown.includes('| Gate | Status | Mismatches | Mismatch Details | Rules | Groups | Commands | Fallback | Changed Files |'));
assert.ok(markdown.includes('| renderer-only | pass | none | none | renderer | unit, render, visual | npm run test:unit && npm run test:render && npm run test:visual | no | scripts/render/text-meta.js |'));
assert.ok(markdown.includes('| unknown-path-fallback | pass | none | none | none | unit, pipeline, render, visual, delivery | npm test | yes | scripts/new-unknown-area.js |'));
assert.ok(markdown.includes('P2-04'));
assert.ok(markdown.includes('- Evidence complete: 24/24'));
assert.ok(markdown.includes('| P2-01 Visual QA Negative Fixture Suite | P2 | pass | strong | pass | pass | pass | pass | none |'));

const humanRun = runAudit();
assert.equal(humanRun.status, 0, humanRun.stderr || humanRun.stdout);
assert.ok(humanRun.stdout.includes('Template readiness: ready - 20 page families, 0 missing fields'));
assert.ok(humanRun.stdout.includes('Delivery gates: pass 2  partial 0  missing 0'));
assert.ok(humanRun.stdout.includes('Objective coverage: pass 12  partial 0  missing 0'));
assert.ok(humanRun.stdout.includes('Objective coverage by priority: P0 ready 4/4; P1 ready 4/4; P2 ready 4/4'));
assert.ok(humanRun.stdout.includes('Required objective coverage: ready  required 12  actual 12  missing none  unexpected none'));
assert.ok(humanRun.stdout.includes('Matrix contracts: 0 issues  blocking 0  review 0'));
assert.ok(humanRun.stdout.includes('Module budgets: pass 3  over_limit 0  missing 0'));
assert.ok(humanRun.stdout.includes('Module budget headroom: min '));
assert.ok(humanRun.stdout.includes(`Module budget require closure: budgets 2  roots 5  files ${hotspotBudget.requireClosureFiles.length + dashboardBudget.requireClosureFiles.length}  untracked 0`));
assert.ok(humanRun.stdout.includes('Page-family primitives: ready  groups 4  exports 15/15  targets 8/8  missing none'));
assert.ok(humanRun.stdout.includes('Quality severity matrix: ready  categories 16  rows 183  required_types 8/8  missing none'));
assert.ok(humanRun.stdout.includes('Screenshot baseline QA: ready  regions 5/5  findings 3  missing none'));
assert.ok(humanRun.stdout.includes('Text shrink/blank-page QA: ready  findings 3  text_meta 5  coverage 3  missing none'));
assert.ok(humanRun.stdout.includes('Test profile gates: pass 8  partial 0  missing 0'));
assert.ok(humanRun.stdout.includes('Required test profile coverage: ready  missing none  not_ready none'));
assert.ok(humanRun.stdout.includes('Module budget directories: tracked 5  present 5  missing 0  empty 0'));
assert.ok(humanRun.stdout.includes('quality severity matrix, screenshot baseline QA, text shrink/blank-page QA, template readiness'));
assert.ok(humanRun.stdout.includes('maintenance   safe - P2 hardening, all objective coverage, module budgets, page-family primitives, required test profile coverage, test profile gates, and blocking audit status are healthy'));

console.log('hardening dashboard ok');

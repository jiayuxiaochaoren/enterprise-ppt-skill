const assert = require('assert/strict');
const {
  deliveryGateRows,
  deliveryGateTotals
} = require('./qa/hardening-delivery-gates');
const {
  hardeningReadinessModes,
  moduleBudgetsReady,
  objectiveCoverageReady,
  requiredDeliveryGatesReady,
  testProfileGatesReady
} = require('./qa/hardening-readiness-modes');
const {
  MATRIX_PATH,
  commandLooksAvailable,
  commandScript,
  exists,
  rel
} = require('./qa/hardening-readiness-environment');
const {
  formatList: reportFormatList,
  formatMismatchDetail: reportFormatMismatchDetail,
  formatObjectiveFailureSignals: reportFormatObjectiveFailureSignals,
  formatObjectivePrioritySummary: reportFormatObjectivePrioritySummary
} = require('./reports/hardening-readiness-format');
const {
  evidenceGapsForState,
  evidenceStateTotals,
  taskEvidenceState,
  taskEvidenceStrength
} = require('./qa/hardening-evidence-state');
const {
  directoryBudgetRows,
  lineCount,
  localRequireDependencies,
  moduleBudgetDirectoryTotals,
  moduleBudgetIssues,
  moduleBudgetRequireClosureTotals,
  moduleBudgetRows,
  moduleBudgetTotals,
  requireClosureFiles,
  resolveLocalRequire
} = require('./qa/hardening-module-budgets');
const {
  objectiveCoverageContractSummary,
  objectiveCoverageFailureSignals,
  objectiveCoverageIssues,
  objectiveCoveragePrioritySummary,
  objectiveCoverageRows,
  objectiveCoverageTotals
} = require('./qa/hardening-objective-coverage');
const {
  pageFamilyPrimitiveSummary,
  primitiveFacadeExportNames
} = require('./qa/hardening-page-family-primitives');
const {
  qualitySeverityMatrixSummary
} = require('./qa/hardening-quality-severity');
const {
  screenshotBaselineReadiness
} = require('./qa/hardening-screenshot-baseline');
const {
  textBlankReadiness
} = require('./qa/hardening-text-blank');
const {
  summarizeReadinessTasks
} = require('./qa/hardening-task-summary');
const {
  formatMismatchDetail,
  gateMismatchDetails,
  gateMismatchReasons,
  testProfileGateCoverage,
  testProfileGateCoverageIssues,
  testProfileGateIssues,
  testProfileGateRows,
  testProfileGateTotals
} = require('./qa/hardening-test-profile-gates');

function issue(level, type, id, message) {
  return { level, type, id, message };
}

assert.equal(rel(MATRIX_PATH), 'assets/hardening-readiness-matrix.json');
assert.equal(commandScript('node scripts/audit_hardening_readiness.js --json'), 'scripts/audit_hardening_readiness.js');
assert.equal(commandScript('npm run test:unit'), '');
assert.equal(commandLooksAvailable('node scripts/audit_hardening_readiness.js --json'), true);
assert.equal(commandLooksAvailable('npm run test:unit'), true);
assert.equal(exists('assets/hardening-readiness-matrix.json'), true);
assert.equal(reportFormatList(['P0-01', 'P0-02']), 'P0-01, P0-02');
assert.equal(reportFormatList([]), 'none');
assert.equal(
  reportFormatObjectiveFailureSignals({ 'P1-01': ['task:missing:missing', 'evidence:codePath:missing'] }),
  'P1-01: task:missing:missing, evidence:codePath:missing'
);
assert.equal(reportFormatObjectiveFailureSignals({}), 'none');
assert.equal(
  reportFormatObjectivePrioritySummary({
    P0: { ready: true, pass: 4, total: 4, failedObjectiveIds: [] },
    P1: { ready: false, pass: 3, total: 4, failedObjectiveIds: ['P1-04'] }
  }),
  'P0 ready 4/4; P1 not ready 3/4 failed P1-04'
);
assert.equal(
  reportFormatMismatchDetail({ field: 'groups', expected: ['unit', 'delivery'], actual: ['unit'] }),
  'groups expected=unit,delivery actual=unit'
);
const primitiveExports = primitiveFacadeExportNames();
assert.deepEqual(primitiveExports, [
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
]);
assert.deepEqual(pageFamilyPrimitiveSummary(), {
  ready: true,
  error: '',
  groupCount: 4,
  expectedExportCount: 15,
  exposedExportCount: 15,
  targetCount: 8,
  exposedTargetCount: 8,
  expectedExports: primitiveExports,
  exposedExports: primitiveExports,
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
const degradedPrimitiveSummary = pageFamilyPrimitiveSummary({
  facadeExports: primitiveExports.filter(name => name !== 'drawImagePanel')
});
assert.equal(degradedPrimitiveSummary.ready, false);
assert.deepEqual(degradedPrimitiveSummary.missingExports, ['drawImagePanel']);
assert.deepEqual(degradedPrimitiveSummary.missingTargets, ['drawImagePanel']);
assert.deepEqual(degradedPrimitiveSummary.groups.find(group => group.id === 'evidence').missingExports, ['drawImagePanel']);
const severityMatrixSummary = qualitySeverityMatrixSummary();
assert.equal(severityMatrixSummary.ready, true);
assert.equal(severityMatrixSummary.policyVersion, 'quality-severity-policy/v1');
assert.equal(severityMatrixSummary.matrixVersion, 'quality-severity-matrix/v1');
assert.equal(severityMatrixSummary.categoryCount, 16);
assert.equal(severityMatrixSummary.requiredCategoryCount, 8);
assert.equal(severityMatrixSummary.requiredTypeCount, 8);
assert.equal(severityMatrixSummary.readyRequiredTypeCount, 8);
assert.deepEqual(severityMatrixSummary.missingCategories, []);
assert.deepEqual(severityMatrixSummary.missingTypes, []);
assert.deepEqual(severityMatrixSummary.mismatchedTypes, []);
assert.deepEqual(
  severityMatrixSummary.categories
    .filter(row => ['fallback', 'skipped_critical_asset', 'unknown_component', 'stale_metadata', 'shrink_risk', 'blank_page', 'baseline_drift', 'overlay_contract'].includes(row.category))
    .map(row => row.category)
    .sort(),
  ['baseline_drift', 'blank_page', 'fallback', 'overlay_contract', 'shrink_risk', 'skipped_critical_asset', 'stale_metadata', 'unknown_component']
);
const degradedSeveritySummary = qualitySeverityMatrixSummary({
  rows: severityMatrixSummary.requiredTypes
    .filter(row => row.type !== 'fallbackRendererUsed')
    .map(row => ({
      type: row.type,
      category: row.category,
      draft: row.draft,
      formal: row.formal,
      delivery: row.delivery
    })),
  requiredCategories: ['fallback', 'unknown_component'],
  requiredTypes: [
    { type: 'fallbackRendererUsed', category: 'fallback', draft: 'review', formal: 'fail', delivery: 'fail' },
    { type: 'unknownComponentId', category: 'unknown_component', draft: 'fail', formal: 'fail', delivery: 'fail' }
  ]
});
assert.equal(degradedSeveritySummary.ready, false);
assert.deepEqual(degradedSeveritySummary.missingCategories, ['fallback']);
assert.deepEqual(degradedSeveritySummary.missingTypes, ['fallbackRendererUsed']);
const baselineReadiness = screenshotBaselineReadiness({
  exists: () => true,
  readJson() {
    return {
      version: 'visual-baseline/v1',
      regions: { mainBody: {}, footer: {} },
      slides: {
        1: { regions: { cardGrid: {}, rightEvidence: {} } },
        2: { regions: { chartBoard: {} } }
      }
    };
  },
  readText() {
    return [
      '--baseline --preview-dir Generate Or Update Negative Coverage',
      'cardGrid chartBoard footer mainBody rightEvidence',
      'baselinePreviewMissing baselineRegionBBoxShift baselineRegionMissing'
    ].join('\n');
  }
});
assert.equal(baselineReadiness.ready, true);
assert.equal(baselineReadiness.manifestRegionCount, 5);
assert.deepEqual(baselineReadiness.missingManifestRegions, []);
assert.deepEqual(baselineReadiness.missingNegativeFindings, []);
const degradedBaselineReadiness = screenshotBaselineReadiness({
  exists(file) {
    return file !== 'references/screenshot-baseline-qa.md';
  },
  readJson() {
    return {
      version: 'visual-baseline/v1',
      regions: { mainBody: {} },
      slides: {
        1: { regions: { cardGrid: {}, rightEvidence: {} } }
      }
    };
  },
  readText() {
    return 'cardGrid rightEvidence baselineRegionMissing';
  }
});
assert.equal(degradedBaselineReadiness.ready, false);
assert.equal(degradedBaselineReadiness.filesReady, false);
assert.deepEqual(degradedBaselineReadiness.missingManifestRegions, ['chartBoard', 'footer']);
assert.deepEqual(degradedBaselineReadiness.missingAuditFindings, ['baselinePreviewMissing', 'baselineRegionBBoxShift']);
const textBlankSummary = textBlankReadiness({
  exists: () => true,
  readText() {
    return [
      '__codexTextBoxes areaDensity charsPerInch readabilityRiskLevel shrinkRisk',
      'textShrinkRisk mainBodyMissingContent rightEvidenceRegionMissing',
      'mainBodyCoverage mainBodyElements rightEvidenceCoverage',
      'main_body_decorative_only expected_evidence_region_empty',
      'fitStrategy areaDensity charsPerInch'
    ].join('\n');
  }
});
assert.equal(textBlankSummary.ready, true);
assert.equal(textBlankSummary.filesReady, true);
assert.equal(textBlankSummary.textMetaReady, true);
assert.equal(textBlankSummary.shrinkQaReady, true);
assert.equal(textBlankSummary.blankQaReady, true);
assert.deepEqual(textBlankSummary.missingTextMetaFields, []);
assert.deepEqual(textBlankSummary.requiredFindings, ['mainBodyMissingContent', 'rightEvidenceRegionMissing', 'textShrinkRisk']);
const degradedTextBlankSummary = textBlankReadiness({
  exists(file) {
    return file !== 'scripts/qa/content-coverage-audit.js';
  },
  readText() {
    return 'textShrinkRisk areaDensity';
  }
});
assert.equal(degradedTextBlankSummary.ready, false);
assert.equal(degradedTextBlankSummary.filesReady, false);
assert.deepEqual(degradedTextBlankSummary.missingTextMetaFields, ['charsPerInch', 'readabilityRiskLevel', 'shrinkRisk', 'textBoxes']);
assert.deepEqual(degradedTextBlankSummary.missingCoverageFindings, ['mainBodyMissingContent', 'rightEvidenceRegionMissing']);

const readinessTaskSummary = summarizeReadinessTasks({
  tasks: [
    {
      id: 'P0-01',
      priority: 'P0',
      title: 'Task A',
      owner: 'owner',
      status: 'pass',
      affectsVisualOutput: false,
      files: ['assets/hardening-readiness-matrix.json'],
      tests: ['node scripts/test_hardening_readiness_helpers.js'],
      renderedProof: [],
      remainingGaps: []
    },
    {
      id: 'P0-01',
      priority: 'P0',
      title: 'Task B',
      owner: '',
      status: 'partial',
      affectsVisualOutput: false,
      files: [],
      tests: [],
      renderedProof: [],
      remainingGaps: []
    },
    {
      id: 'P9-99',
      priority: 'P9',
      title: 'Extra Task',
      owner: 'owner',
      status: 'unknown',
      affectsVisualOutput: false,
      files: [],
      tests: [],
      renderedProof: [],
      remainingGaps: []
    }
  ]
}, {
  backlogIds: ['P0-01', 'P1-01'],
  issue,
  priorityValues: ['P0', 'P1'],
  statusValues: ['missing', 'partial', 'pass']
});
assert.deepEqual(readinessTaskSummary.duplicates, ['P0-01']);
assert.deepEqual(readinessTaskSummary.missingBacklogIds, ['P1-01']);
assert.deepEqual(readinessTaskSummary.extraIds, ['P9-99']);
assert.equal(readinessTaskSummary.totals.P0.pass, 1);
assert.equal(readinessTaskSummary.totals.P0.partial, 1);
assert.equal(readinessTaskSummary.totals.P9.missing, 1);
assert.equal(readinessTaskSummary.evidenceStrength.strong, 1);
assert.ok(readinessTaskSummary.issues.some(item => item.type === 'duplicateTask' && item.id === 'P0-01'));
assert.ok(readinessTaskSummary.issues.some(item => item.type === 'backlogTaskMissing' && item.id === 'P1-01'));
assert.ok(readinessTaskSummary.issues.some(item => item.type === 'extraTask' && item.id === 'P9-99'));
assert.ok(readinessTaskSummary.issues.some(item => item.type === 'ownerMissing' && item.id === 'P0-01'));
assert.ok(readinessTaskSummary.issues.some(item => item.type === 'invalidStatus' && item.id === 'P9-99'));

function fakeExists(file) {
  return ['scripts/a.js', 'outputs/slide.png'].includes(file);
}

function fakeCommandLooksAvailable(command) {
  return command === 'node scripts/test_a.js';
}

const visualTask = {
  id: 'P0-01',
  title: 'drawnComponents evidence',
  owner: 'qa',
  status: 'pass',
  affectsVisualOutput: true,
  files: ['scripts/a.js'],
  tests: ['node scripts/test_a.js'],
  renderedProof: ['outputs/slide.png']
};
assert.equal(taskEvidenceStrength(visualTask, {
  commandLooksAvailable: fakeCommandLooksAvailable,
  exists: fakeExists
}), 'strong');
assert.deepEqual(taskEvidenceState(visualTask, {
  commandLooksAvailable: fakeCommandLooksAvailable,
  exists: fakeExists
}), {
  codePath: 'pass',
  renderMeta: 'pass',
  automatedQa: 'pass',
  renderedProof: 'pass'
});
assert.equal(
  taskEvidenceState({
    id: 'P2-04',
    title: 'Hardening dashboard',
    owner: 'fixture-readiness',
    status: 'pass',
    affectsVisualOutput: false,
    files: ['scripts/qa/hardening-objective-coverage.js'],
    tests: ['node scripts/audit_hardening_readiness.js'],
    renderedProof: []
  }, {
    commandLooksAvailable(command) {
      return command === 'node scripts/audit_hardening_readiness.js';
    },
    exists(file) {
      return file === 'scripts/qa/hardening-objective-coverage.js';
    }
  }).renderMeta,
  'not_applicable'
);
assert.deepEqual(evidenceGapsForState({
  codePath: 'partial',
  renderMeta: 'missing',
  automatedQa: 'pass',
  renderedProof: 'not_applicable'
}), ['codePath:partial', 'renderMeta:missing']);
assert.deepEqual(evidenceStateTotals([visualTask], {
  commandLooksAvailable: fakeCommandLooksAvailable,
  exists: fakeExists
}), {
  codePath: { pass: 1, partial: 0, missing: 0, not_applicable: 0 },
  renderMeta: { pass: 1, partial: 0, missing: 0, not_applicable: 0 },
  automatedQa: { pass: 1, partial: 0, missing: 0, not_applicable: 0 },
  renderedProof: { pass: 1, partial: 0, missing: 0, not_applicable: 0 }
});

assert.equal(lineCount('a\nb\n'), 2);
assert.deepEqual(
  directoryBudgetRows([{ path: 'dir', extension: '.js' }], {
    directoryExists(dir) {
      return dir === 'dir';
    },
    listFiles() {
      return ['dir/a.js'];
    }
  }),
  [{
    path: 'dir',
    extension: '.js',
    exists: true,
    empty: false,
    fileCount: 1,
    files: ['dir/a.js']
  }]
);

const directoryBudgetResultRows = moduleBudgetRows([{
  id: 'directory-budget',
  maxLines: 3,
  files: ['dir/manual.js'],
  directories: [{ path: 'dir', extension: '.js' }]
}], {
  directoryExists(dir) {
    return dir === 'dir';
  },
  exists(file) {
    return file !== 'dir/missing.js';
  },
  listFiles(dir, config) {
    assert.equal(dir, 'dir');
    assert.equal(config.extension, '.js');
    return ['dir/a.js', 'dir/b.js', 'dir/a.js'];
  },
  readText() {
    return 'a\nb\n';
  }
});
assert.equal(directoryBudgetResultRows[0].status, 'pass');
assert.equal(directoryBudgetResultRows[0].lineHeadroom, 1);
assert.equal(directoryBudgetResultRows[0].lineUsagePercent, 67);
assert.deepEqual(
  directoryBudgetResultRows[0].files.map(row => row.file),
  ['dir/a.js', 'dir/b.js', 'dir/manual.js']
);

const degradedDirectoryRows = moduleBudgetRows([
  {
    id: 'missing-directory',
    maxLines: 2,
    directories: ['missing-dir']
  },
  {
    id: 'empty-directory',
    maxLines: 2,
    directories: [{ path: 'empty-dir', extension: '.js' }]
  }
], {
  directoryExists(dir) {
    return dir === 'empty-dir';
  },
  listFiles() {
    return [];
  }
});
assert.equal(degradedDirectoryRows[0].status, 'missing');
assert.deepEqual(degradedDirectoryRows[0].missingDirectories, ['missing-dir']);
assert.deepEqual(degradedDirectoryRows[1].emptyDirectories, ['empty-dir']);
assert.deepEqual(
  moduleBudgetIssues(degradedDirectoryRows, issue).map(item => item.type),
  ['moduleBudgetDirectoryMissing', 'moduleBudgetDirectoryEmpty']
);
assert.deepEqual(moduleBudgetDirectoryTotals(degradedDirectoryRows), { tracked: 2, present: 1, missing: 1, empty: 1 });
assert.equal(resolveLocalRequire('scripts/qa/root.js', './dep', file => file === 'scripts/qa/dep.js'), 'scripts/qa/dep.js');
assert.deepEqual(localRequireDependencies('scripts/root.js', {
  exists(file) {
    return ['scripts/root.js', 'scripts/dep.js'].includes(file);
  },
  readText(file) {
    return file === 'scripts/root.js' ? "const dep = require('./dep');\nconst fs = require('fs');\n" : '';
  }
}), ['scripts/dep.js']);
assert.deepEqual(requireClosureFiles(['scripts/root.js'], {
  exists(file) {
    return ['scripts/root.js', 'scripts/dep.js', 'scripts/nested.js'].includes(file);
  },
  readText(file) {
    if (file === 'scripts/root.js') return "require('./dep');\n";
    if (file === 'scripts/dep.js') return "require('./nested');\n";
    return '';
  }
}), ['scripts/dep.js', 'scripts/nested.js', 'scripts/root.js']);

const requireClosureBudgetRows = moduleBudgetRows([{
  id: 'closure-budget',
  maxLines: 5,
  files: ['scripts/root.js'],
  requireClosureRoots: ['scripts/root.js']
}], {
  exists(file) {
    return ['scripts/root.js', 'scripts/dep.js'].includes(file);
  },
  readText(file) {
    return file === 'scripts/root.js' ? "require('./dep');\n" : 'module.exports = {};\n';
  }
});
assert.equal(requireClosureBudgetRows[0].status, 'missing');
assert.deepEqual(requireClosureBudgetRows[0].requireClosureRoots, ['scripts/root.js']);
assert.deepEqual(requireClosureBudgetRows[0].requireClosureFiles, ['scripts/dep.js', 'scripts/root.js']);
assert.deepEqual(requireClosureBudgetRows[0].untrackedRequireClosureFiles, ['scripts/dep.js']);
assert.deepEqual(
  moduleBudgetIssues(requireClosureBudgetRows, issue).map(item => item.type),
  ['moduleBudgetRequireClosureUntracked']
);
assert.deepEqual(moduleBudgetRequireClosureTotals(requireClosureBudgetRows), {
  budgetsWithClosure: 1,
  roots: 1,
  files: 2,
  untracked: 1
});
assert.deepEqual(moduleBudgetRequireClosureTotals(directoryBudgetResultRows), {
  budgetsWithClosure: 0,
  roots: 0,
  files: 0,
  untracked: 0
});

const degradedBudgetRows = moduleBudgetRows([{
  id: 'degraded',
  maxLines: 2,
  files: ['small.js', 'large.js', 'missing.js']
}], {
  exists(file) {
    return file !== 'missing.js';
  },
  readText(file) {
    return file === 'large.js' ? 'a\nb\nc\n' : 'a\n';
  }
});
assert.equal(degradedBudgetRows[0].status, 'missing');
assert.equal(degradedBudgetRows[0].lineHeadroom, -1);
assert.equal(degradedBudgetRows[0].lineUsagePercent, 150);
assert.deepEqual(degradedBudgetRows[0].missingFiles, ['missing.js']);
assert.deepEqual(degradedBudgetRows[0].overLimitFiles, ['large.js']);
assert.deepEqual(moduleBudgetTotals(degradedBudgetRows), { pass: 0, over_limit: 0, missing: 1 });
assert.deepEqual(
  moduleBudgetIssues(degradedBudgetRows, issue).map(item => item.type),
  ['moduleBudgetFileMissing', 'moduleBudgetExceeded']
);
assert.equal(moduleBudgetsReady([{ status: 'pass' }]), true);
assert.equal(moduleBudgetsReady([]), false);
assert.equal(moduleBudgetsReady(degradedBudgetRows), false);

const degradedGates = deliveryGateRows([
  { id: 'missing-command-and-artifact', command: 'node scripts/not-real.js', artifacts: ['outputs/not-real.pptx'] },
  { id: 'missing-artifact', command: 'node scripts/visual_qa.js', artifacts: ['outputs/not-real.pptx'] },
  { id: 'partial-artifacts', command: 'node scripts/visual_qa.js', artifacts: ['scripts/visual_qa.js', 'outputs/not-real.pptx'] }
], {
  commandLooksAvailable(command) {
    return /visual_qa\.js/.test(command);
  },
  exists(file) {
    return file === 'scripts/visual_qa.js';
  }
});
assert.equal(degradedGates[0].status, 'missing');
assert.equal(degradedGates[1].status, 'partial');
assert.equal(degradedGates[2].status, 'partial');
assert.deepEqual(deliveryGateTotals(degradedGates), { pass: 0, partial: 2, missing: 1 });
assert.equal(requiredDeliveryGatesReady(degradedGates), false);

const passingProfileGates = testProfileGateRows([{
  id: 'renderer-only',
  changedFiles: ['scripts/render/text-meta.js'],
  expectedRuleIds: ['renderer'],
  expectedGroups: ['unit', 'render', 'visual'],
  expectedCommands: ['npm run test:unit', 'npm run test:render', 'npm run test:visual'],
  expectedFallbackToFull: false
}], {
  profileForChangedFiles() {
    return {
      groups: ['unit', 'render', 'visual'],
      commands: ['npm run test:unit', 'npm run test:render', 'npm run test:visual'],
      matchedRules: [{ id: 'renderer' }],
      fallbackToFull: false
    };
  }
});
assert.equal(passingProfileGates[0].status, 'pass');
assert.equal(passingProfileGates[0].ready, true);
assert.deepEqual(passingProfileGates[0].mismatchReasons, []);
assert.deepEqual(gateMismatchReasons(passingProfileGates[0]), []);
assert.deepEqual(passingProfileGates[0].mismatchDetails, []);
assert.deepEqual(gateMismatchDetails(passingProfileGates[0]), []);
assert.deepEqual(testProfileGateTotals(passingProfileGates), { pass: 1, partial: 0, missing: 0 });
assert.equal(testProfileGatesReady(passingProfileGates), true);
assert.deepEqual(testProfileGateCoverage(passingProfileGates, { requiredGateIds: ['renderer-only'] }), {
  requiredGateIds: ['renderer-only'],
  presentGateIds: ['renderer-only'],
  readyGateIds: ['renderer-only'],
  missingGateIds: [],
  notReadyGateIds: [],
  ready: true
});

const degradedProfileGates = testProfileGateRows([{
  id: 'renderer-only',
  changedFiles: ['scripts/render/text-meta.js'],
  expectedRuleIds: ['renderer'],
  expectedGroups: ['unit', 'render', 'visual'],
  expectedCommands: ['npm run test:unit', 'npm run test:render', 'npm run test:visual'],
  expectedFallbackToFull: false
}], {
  profileForChangedFiles() {
    return {
      groups: ['unit'],
      commands: ['npm run test:unit'],
      matchedRules: [{ id: 'test-profile' }],
      fallbackToFull: false
    };
  }
});
assert.equal(degradedProfileGates[0].status, 'partial');
assert.equal(degradedProfileGates[0].groupsMatch, false);
assert.equal(degradedProfileGates[0].rulesMatch, false);
assert.deepEqual(degradedProfileGates[0].mismatchReasons, ['rules', 'groups', 'commands']);
assert.deepEqual(degradedProfileGates[0].mismatchDetails, [
  { field: 'rules', expected: ['renderer'], actual: ['test-profile'] },
  { field: 'groups', expected: ['unit', 'render', 'visual'], actual: ['unit'] },
  { field: 'commands', expected: ['npm run test:unit', 'npm run test:render', 'npm run test:visual'], actual: ['npm run test:unit'] }
]);
assert.equal(
  formatMismatchDetail(degradedProfileGates[0].mismatchDetails[1]),
  'groups expected=unit,render,visual actual=unit'
);
assert.equal(testProfileGatesReady(degradedProfileGates), false);
assert.deepEqual(testProfileGateIssues(degradedProfileGates, issue).map(item => item.type), ['testProfileGateMismatch']);
assert.match(testProfileGateIssues(degradedProfileGates, issue)[0].message, /rules expected=renderer actual=test-profile/);
assert.match(testProfileGateIssues(degradedProfileGates, issue)[0].message, /commands expected=npm run test:unit,npm run test:render,npm run test:visual actual=npm run test:unit/);
const degradedCoverage = testProfileGateCoverage(degradedProfileGates, { requiredGateIds: ['renderer-only', 'asset-only'] });
assert.deepEqual(degradedCoverage.missingGateIds, ['asset-only']);
assert.deepEqual(degradedCoverage.notReadyGateIds, ['renderer-only']);
assert.equal(degradedCoverage.ready, false);
assert.deepEqual(
  testProfileGateCoverageIssues(degradedCoverage, issue).map(item => item.type),
  ['testProfileGateRequiredMissing', 'testProfileGateRequiredNotReady']
);

const objectiveRows = objectiveCoverageRows([
  {
    id: 'P0-01',
    priority: 'P0',
    title: 'Drawn evidence',
    evidenceTaskIds: ['evidence-task'],
    moduleBudgetIds: ['layout-budget'],
    testProfileGateIds: ['renderer-only'],
    deliveryGateIds: ['formal-gate'],
    requiredEvidence: ['codePath', 'renderMeta', 'automatedQa', 'renderedProof']
  },
  {
    id: 'P1-01',
    priority: 'P1',
    title: 'Missing mapping',
    evidenceTaskIds: ['missing-task'],
    requiredEvidence: ['codePath']
  }
], {
  deliveryGates: [{ id: 'formal-gate', ready: true }],
  moduleBudgets: [{ id: 'layout-budget', status: 'pass' }],
  taskRows: [{
    id: 'evidence-task',
    status: 'pass',
    evidenceState: {
      codePath: 'pass',
      renderMeta: 'pass',
      automatedQa: 'pass',
      renderedProof: 'pass'
    }
  }],
  testProfileGates: [{ id: 'renderer-only', ready: true }]
});
assert.equal(objectiveRows[0].status, 'pass');
assert.equal(objectiveRows[0].ready, true);
assert.deepEqual(objectiveRows[0].evidenceState, {
  codePath: 'pass',
  renderMeta: 'pass',
  automatedQa: 'pass',
  renderedProof: 'pass'
});
assert.equal(objectiveRows[1].status, 'missing');
assert.deepEqual(objectiveRows[1].missingEvidenceTaskIds, ['missing-task']);
assert.deepEqual(objectiveRows[1].evidenceMissing, ['codePath']);
assert.deepEqual(objectiveCoverageTotals(objectiveRows), { pass: 1, partial: 0, missing: 1 });
assert.deepEqual(
  objectiveCoverageIssues(objectiveRows, issue).map(item => item.type),
  ['objectiveEvidenceTaskMissing', 'objectiveEvidenceKindMissing']
);
assert.deepEqual(objectiveCoverageFailureSignals(objectiveRows[0]), []);
assert.deepEqual(objectiveCoverageFailureSignals(objectiveRows[1]), [
  'task:missing-task:missing',
  'evidence:codePath:missing'
]);
assert.deepEqual(objectiveCoveragePrioritySummary(objectiveRows, ['P0', 'P1', 'P2']), {
  P0: {
    ready: true,
    total: 1,
    pass: 1,
    partial: 0,
    missing: 0,
    failedObjectiveIds: [],
    failureSignals: {}
  },
  P1: {
    ready: false,
    total: 1,
    pass: 0,
    partial: 0,
    missing: 1,
    failedObjectiveIds: ['P1-01'],
    failureSignals: {
      'P1-01': ['task:missing-task:missing', 'evidence:codePath:missing']
    }
  },
  P2: {
    ready: false,
    total: 0,
    pass: 0,
    partial: 0,
    missing: 0,
    failedObjectiveIds: [],
    failureSignals: {}
  }
});
assert.deepEqual(
  objectiveCoverageContractSummary(objectiveRows, { requiredObjectiveIds: ['P0-01', 'P1-01'] }),
  {
    ready: true,
    requiredObjectiveIds: ['P0-01', 'P1-01'],
    actualObjectiveIds: ['P0-01', 'P1-01'],
    missingObjectiveIds: [],
    unexpectedObjectiveIds: [],
    requiredCount: 2,
    actualCount: 2
  }
);
assert.deepEqual(
  objectiveCoverageContractSummary([
    { id: 'P0-01' },
    { id: 'P2-99' },
    { id: '' },
    {}
  ], { requiredObjectiveIds: ['P0-01', 'P0-02', ''] }),
  {
    ready: false,
    requiredObjectiveIds: ['P0-01', 'P0-02'],
    actualObjectiveIds: ['P0-01', 'P2-99'],
    missingObjectiveIds: ['P0-02'],
    unexpectedObjectiveIds: ['P2-99'],
    requiredCount: 2,
    actualCount: 2
  }
);
assert.deepEqual(
  objectiveCoverageContractSummary([{ id: 'P0-01' }], {}),
  {
    ready: false,
    requiredObjectiveIds: [],
    actualObjectiveIds: ['P0-01'],
    missingObjectiveIds: [],
    unexpectedObjectiveIds: ['P0-01'],
    requiredCount: 0,
    actualCount: 1
  }
);
const passingObjectiveCoverage = [
  { id: 'P0-01', priority: 'P0', ready: true },
  { id: 'P1-01', priority: 'P1', ready: true },
  { id: 'P2-01', priority: 'P2', ready: true }
];
assert.equal(objectiveCoverageReady(passingObjectiveCoverage, ['P0']), true);
assert.equal(objectiveCoverageReady(passingObjectiveCoverage, ['P0', 'P1']), true);
assert.equal(objectiveCoverageReady(passingObjectiveCoverage), true);
assert.equal(objectiveCoverageReady([{ id: 'P0-01', priority: 'P0', ready: false }], ['P0']), false);

const degradedModes = hardeningReadinessModes({
  deliveryGates: degradedGates,
  formalGateReady: true,
  objectiveCoverage: passingObjectiveCoverage,
  statusRank: { missing: 0, partial: 1, pass: 2 },
  tasks: [
    { priority: 'P0', status: 'pass' },
    { priority: 'P1', status: 'pass' }
  ],
  templateReady: true
});
assert.equal(degradedModes.formal_review.safe, true);
assert.equal(degradedModes.delivery.safe, false);
assert.deepEqual(degradedModes.delivery.failedChecks, ['deliveryGatesReady']);
assert.ok(degradedModes.delivery.reason.includes('delivery verification'));

const degradedSeverityModes = hardeningReadinessModes({
  deliveryGates: [{ required: true, ready: true }],
  formalGateReady: true,
  objectiveCoverage: passingObjectiveCoverage,
  qualitySeverityMatrixReady: false,
  statusRank: { missing: 0, partial: 1, pass: 2 },
  tasks: [
    { priority: 'P0', status: 'pass' },
    { priority: 'P1', status: 'pass' }
  ],
  templateReady: true
});
assert.equal(degradedSeverityModes.delivery.safe, false);
assert.deepEqual(degradedSeverityModes.delivery.failedChecks, ['qualitySeverityMatrixReady']);
assert.ok(degradedSeverityModes.delivery.reason.includes('quality severity matrix'));

const degradedScreenshotBaselineModes = hardeningReadinessModes({
  deliveryGates: [{ required: true, ready: true }],
  formalGateReady: true,
  objectiveCoverage: passingObjectiveCoverage,
  screenshotBaselineReady: false,
  statusRank: { missing: 0, partial: 1, pass: 2 },
  tasks: [
    { priority: 'P0', status: 'pass' },
    { priority: 'P1', status: 'pass' }
  ],
  templateReady: true
});
assert.equal(degradedScreenshotBaselineModes.delivery.safe, false);
assert.deepEqual(degradedScreenshotBaselineModes.delivery.failedChecks, ['screenshotBaselineReady']);
assert.ok(degradedScreenshotBaselineModes.delivery.reason.includes('screenshot baseline QA'));

const degradedTextBlankModes = hardeningReadinessModes({
  deliveryGates: [{ required: true, ready: true }],
  formalGateReady: true,
  objectiveCoverage: passingObjectiveCoverage,
  textBlankReadinessReady: false,
  statusRank: { missing: 0, partial: 1, pass: 2 },
  tasks: [
    { priority: 'P0', status: 'pass' },
    { priority: 'P1', status: 'pass' }
  ],
  templateReady: true
});
assert.equal(degradedTextBlankModes.delivery.safe, false);
assert.deepEqual(degradedTextBlankModes.delivery.failedChecks, ['textBlankReadinessReady']);
assert.ok(degradedTextBlankModes.delivery.reason.includes('text shrink/blank-page QA'));

const degradedBudgetModes = hardeningReadinessModes({
  deliveryGates: [{ required: true, ready: true }],
  formalGateReady: true,
  moduleBudgets: degradedBudgetRows,
  objectiveCoverage: passingObjectiveCoverage,
  statusRank: { missing: 0, partial: 1, pass: 2 },
  tasks: [
    { priority: 'P0', status: 'pass' },
    { priority: 'P1', status: 'pass' },
    { priority: 'P2', status: 'pass' }
  ],
  testProfileGates: passingProfileGates,
  templateReady: true
});
assert.equal(degradedBudgetModes.delivery.safe, true);
assert.equal(degradedBudgetModes.maintenance.safe, false);
assert.deepEqual(degradedBudgetModes.maintenance.failedChecks, ['moduleBudgetsReady']);
assert.ok(degradedBudgetModes.maintenance.reason.includes('module budget'));

const degradedProfileGateModes = hardeningReadinessModes({
  deliveryGates: [{ required: true, ready: true }],
  formalGateReady: true,
  moduleBudgets: [{ status: 'pass' }],
  objectiveCoverage: passingObjectiveCoverage,
  statusRank: { missing: 0, partial: 1, pass: 2 },
  tasks: [
    { priority: 'P0', status: 'pass' },
    { priority: 'P1', status: 'pass' },
    { priority: 'P2', status: 'pass' }
  ],
  testProfileGates: degradedProfileGates,
  testProfileGateCoverage: degradedCoverage,
  templateReady: true
});
assert.equal(degradedProfileGateModes.maintenance.safe, false);
assert.deepEqual(degradedProfileGateModes.maintenance.failedChecks, ['testProfileGatesReady', 'testProfileGateCoverageReady']);
assert.ok(degradedProfileGateModes.maintenance.reason.includes('required test profile coverage'));

const degradedPrimitiveModes = hardeningReadinessModes({
  deliveryGates: [{ required: true, ready: true }],
  formalGateReady: true,
  moduleBudgets: [{ status: 'pass' }],
  objectiveCoverage: passingObjectiveCoverage,
  pageFamilyPrimitivesReady: false,
  statusRank: { missing: 0, partial: 1, pass: 2 },
  tasks: [
    { priority: 'P0', status: 'pass' },
    { priority: 'P1', status: 'pass' },
    { priority: 'P2', status: 'pass' }
  ],
  testProfileGates: passingProfileGates,
  templateReady: true
});
assert.equal(degradedPrimitiveModes.maintenance.safe, false);
assert.deepEqual(degradedPrimitiveModes.maintenance.failedChecks, ['pageFamilyPrimitivesReady']);
assert.ok(degradedPrimitiveModes.maintenance.reason.includes('page-family primitive'));

const blockingModes = hardeningReadinessModes({
  blockingCount: 1,
  deliveryGates: [{ required: true, ready: true }],
  formalGateReady: true,
  objectiveCoverage: passingObjectiveCoverage,
  statusRank: { missing: 0, partial: 1, pass: 2 },
  tasks: [
    { priority: 'P0', status: 'pass' },
    { priority: 'P1', status: 'pass' }
  ],
  templateReady: true
});
assert.equal(blockingModes.formal_review.safe, true);
assert.equal(blockingModes.delivery.safe, false);
assert.deepEqual(blockingModes.delivery.failedChecks, ['noBlockingIssues']);
assert.ok(blockingModes.delivery.reason.includes('blocking audit gaps'));

const blockingMaintenanceModes = hardeningReadinessModes({
  blockingCount: 1,
  deliveryGates: [{ required: true, ready: true }],
  formalGateReady: true,
  moduleBudgets: [{ status: 'pass' }],
  objectiveCoverage: passingObjectiveCoverage,
  statusRank: { missing: 0, partial: 1, pass: 2 },
  tasks: [
    { priority: 'P0', status: 'pass' },
    { priority: 'P1', status: 'pass' },
    { priority: 'P2', status: 'pass' }
  ],
  testProfileGates: passingProfileGates,
  templateReady: true
});
assert.equal(blockingMaintenanceModes.maintenance.safe, false);
assert.deepEqual(blockingMaintenanceModes.maintenance.failedChecks, ['noBlockingIssues']);
assert.ok(blockingMaintenanceModes.maintenance.reason.includes('blocking audit gaps'));

const degradedObjectiveCoverageModes = hardeningReadinessModes({
  deliveryGates: [{ required: true, ready: true }],
  formalGateReady: true,
  moduleBudgets: [{ status: 'pass' }],
  objectiveCoverage: [
    { id: 'P0-01', priority: 'P0', ready: true },
    { id: 'P1-01', priority: 'P1', ready: false },
    { id: 'P2-01', priority: 'P2', ready: false }
  ],
  statusRank: { missing: 0, partial: 1, pass: 2 },
  tasks: [
    { priority: 'P0', status: 'pass' },
    { priority: 'P1', status: 'pass' },
    { priority: 'P2', status: 'pass' }
  ],
  testProfileGates: passingProfileGates,
  templateReady: true
});
assert.equal(degradedObjectiveCoverageModes.formal_review.safe, true);
assert.equal(degradedObjectiveCoverageModes.delivery.safe, false);
assert.deepEqual(degradedObjectiveCoverageModes.delivery.failedChecks, ['p0p1ObjectiveCoverageReady']);
assert.equal(degradedObjectiveCoverageModes.maintenance.safe, false);
assert.deepEqual(degradedObjectiveCoverageModes.maintenance.failedChecks, ['objectiveCoverageReady']);
assert.ok(degradedObjectiveCoverageModes.maintenance.reason.includes('objective coverage'));

console.log('hardening readiness helpers ok');

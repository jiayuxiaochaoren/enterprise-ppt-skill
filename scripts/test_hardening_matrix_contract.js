const assert = require('assert/strict');
const {
  deliveryGateShapeIssues,
  duplicateIdIssues,
  matrixContractIssues,
  matrixContractIssueTotals,
  matrixTopLevelShapeIssues,
  moduleBudgetShapeIssues,
  objectiveCoverageContractShapeIssues,
  objectiveCoverageRequiredIdIssues,
  objectiveCoverageShapeIssues,
  sameStringArray,
  taskEvidenceShapeIssues,
  taskPriorityIssues,
  taskRequiredFieldIssues,
  testProfileGateCoverageShapeIssues,
  testProfileGateShapeIssues
} = require('./qa/hardening-matrix-contract');
const { qualityModeDescriptionIssues } = require('./qa/hardening-quality-modes');

function issue(level, type, id, message) {
  return { level, type, id, message };
}

const validTestProfileGate = {
  id: 'renderer-only',
  changedFiles: ['scripts/render/text-meta.js'],
  expectedRuleIds: ['renderer'],
  expectedGroups: ['unit', 'render', 'visual'],
  expectedCommands: ['npm run test:unit', 'npm run test:render', 'npm run test:visual'],
  expectedFallbackToFull: false
};
const validObjectiveCoverage = {
  id: 'P0-01',
  priority: 'P0',
  title: 'Objective',
  evidenceTaskIds: ['P0-01'],
  requiredEvidence: ['codePath', 'automatedQa']
};
const validObjectiveCoverageContract = {
  requiredObjectiveIds: ['P0-01']
};

assert.equal(sameStringArray(['missing', 'partial', 'pass'], ['missing', 'partial', 'pass']), true);
assert.equal(sameStringArray(['missing', 'partial', 'pass'], ['partial', 'missing', 'pass']), false);

assert.deepEqual(
  matrixContractIssues(
    {
      sourceBacklog: 'references/old.md',
      statusScale: ['missing', 'pass'],
      qualityModes: { draft: { description: 'ok' } },
      deliveryGates: [{ id: 'gate', required: true, command: 'node scripts/a.js', artifacts: ['outputs/a.pptx'] }],
      moduleBudgets: [{ id: 'budget', title: 'Budget', maxLines: 10, files: ['scripts/a.js'] }],
      objectiveCoverage: [validObjectiveCoverage],
      objectiveCoverageContract: validObjectiveCoverageContract,
      testProfileGates: [validTestProfileGate],
      testProfileGateCoverage: { requiredGateIds: ['renderer-only'] },
      tasks: [{
        id: 'P0-01',
        priority: 'P0',
        title: 'Task',
        owner: 'owner',
        status: 'missing',
        affectsVisualOutput: false,
        files: [],
        tests: [],
        renderedProof: [],
        remainingGaps: []
      }]
    },
    {
      expectedSourceBacklog: 'references/pptx-skill-hardening-backlog.md',
      expectedStatusScale: ['missing', 'partial', 'pass']
    },
    issue
  ).map(item => item.type),
  ['matrixSourceBacklogMismatch', 'matrixStatusScaleMismatch']
);

assert.deepEqual(
  matrixTopLevelShapeIssues({
    tasks: {},
    deliveryGates: [],
    moduleBudgets: 'budgets',
    objectiveCoverage: null,
    testProfileGates: undefined,
    qualityModes: []
  }, issue).map(item => item.type),
  [
    'matrixTopLevelFieldInvalid',
    'matrixTopLevelFieldInvalid',
    'matrixTopLevelFieldInvalid',
    'matrixTopLevelFieldInvalid',
    'matrixTopLevelFieldInvalid',
    'matrixTopLevelFieldInvalid',
    'matrixTopLevelFieldInvalid'
  ]
);
assert.deepEqual(
  matrixTopLevelShapeIssues({
    tasks: [],
    deliveryGates: [],
    moduleBudgets: [],
    objectiveCoverage: [],
    testProfileGates: [],
    qualityModes: {}
  }, issue).map(item => item.message),
  [
    'tasks must not be empty',
    'deliveryGates must not be empty',
    'moduleBudgets must not be empty',
    'testProfileGates must not be empty',
    'objectiveCoverage must not be empty',
    'qualityModes must not be empty',
    'objectiveCoverageContract must be an object'
  ]
);

assert.deepEqual(
  duplicateIdIssues([
    { id: 'a' },
    { id: 'a' },
    { id: 'b' },
    { id: 'a' },
    { id: '' },
    {}
  ], {
    collection: 'demo',
    type: 'demoIdDuplicate'
  }, issue),
  [{
    level: 'blocking',
    type: 'demoIdDuplicate',
    id: 'a',
    message: 'demo id appears more than once: a'
  }]
);
assert.deepEqual(
  matrixContractIssueTotals([
    { level: 'blocking', type: 'matrixTopLevelFieldInvalid' },
    { level: 'review', type: 'qualityModeDescriptionMissing' },
    { level: 'blocking', type: 'deliveryGateArtifactMissing' }
  ]),
  { total: 2, blocking: 1, review: 1 }
);

assert.deepEqual(
  matrixContractIssues({
    sourceBacklog: 'references/pptx-skill-hardening-backlog.md',
    statusScale: ['missing', 'partial', 'pass'],
    qualityModes: { draft: { description: 'ok' } },
    deliveryGates: [
      { id: 'gate', required: true, command: 'node scripts/a.js', artifacts: ['outputs/a.pptx'] },
      { id: 'gate', required: true, command: 'node scripts/b.js', artifacts: ['outputs/b.pptx'] }
    ],
    moduleBudgets: [
      { id: 'budget', title: 'Budget A', maxLines: 10, files: ['scripts/a.js'] },
      { id: 'budget', title: 'Budget B', maxLines: 10, files: ['scripts/b.js'] }
    ],
    testProfileGates: [
      Object.assign({}, validTestProfileGate),
      Object.assign({}, validTestProfileGate, { changedFiles: ['scripts/render/other.js'] })
    ],
    objectiveCoverage: [
      Object.assign({}, validObjectiveCoverage),
      Object.assign({}, validObjectiveCoverage, { title: 'Duplicate objective' })
    ],
    objectiveCoverageContract: validObjectiveCoverageContract,
    tasks: [{
      id: 'P0-01',
      priority: 'P0',
      title: 'Task',
      owner: 'owner',
      status: 'missing',
      affectsVisualOutput: false,
      files: [],
      tests: [],
      renderedProof: [],
      remainingGaps: []
    }]
  }, {
    expectedPriorities: ['P0', 'P1', 'P2'],
    expectedSourceBacklog: 'references/pptx-skill-hardening-backlog.md',
    expectedStatusScale: ['missing', 'partial', 'pass']
  }, issue).map(item => item.type),
  ['deliveryGateIdDuplicate', 'moduleBudgetIdDuplicate', 'testProfileGateIdDuplicate', 'objectiveCoverageIdDuplicate']
);

assert.deepEqual(
  taskPriorityIssues([
    { id: 'bad-id', priority: 'P0' },
    { id: 'P0-01', priority: 'PX' },
    { id: 'P0-02', priority: 'P1' }
  ], {
    allowedPriorities: ['P0', 'P1', 'P2']
  }, issue).map(item => item.type),
  ['taskIdInvalid', 'taskPriorityInvalid', 'taskPriorityMismatch']
);
assert.deepEqual(
  taskRequiredFieldIssues([
    {
      id: 'P0-01',
      priority: 'P0',
      title: '',
      owner: 'owner',
      status: 'unknown',
      files: [],
      tests: [],
      renderedProof: []
    }
  ], {
    allowedStatuses: ['missing', 'partial', 'pass']
  }, issue).map(item => item.type),
  ['taskRequiredFieldInvalid', 'invalidStatus', 'taskRequiredFieldInvalid', 'taskRequiredFieldMissing']
);
assert.deepEqual(
  taskEvidenceShapeIssues([
    { id: 'P0-01', files: 'scripts/a.js' },
    { id: 'P0-02', tests: ['node scripts/a.js', 42], renderedProof: [null], remainingGaps: ['ok'] }
  ], issue).map(item => item.type),
  ['taskEvidenceFieldNotArray', 'taskEvidenceFieldItemInvalid', 'taskEvidenceFieldItemInvalid']
);

assert.deepEqual(
  deliveryGateShapeIssues([
    { id: '', required: 'yes', command: '', artifacts: 'outputs/a.pptx' },
    { id: 'empty-artifacts', command: 'node scripts/a.js', artifacts: [] },
    { id: 'bad-artifact', command: 'node scripts/a.js', artifacts: ['outputs/a.pptx', 42] }
  ], issue).map(item => item.type),
  [
    'deliveryGateFieldInvalid',
    'deliveryGateFieldInvalid',
    'deliveryGateFieldInvalid',
    'deliveryGateArtifactsInvalid',
    'deliveryGateArtifactsInvalid',
    'deliveryGateArtifactInvalid'
  ]
);
assert.deepEqual(
  moduleBudgetShapeIssues([
    { id: '', title: '', maxLines: 0 },
    { id: 'empty-files', title: 'Empty files', maxLines: 10, files: [] },
    { id: 'bad-file', title: 'Bad file', maxLines: 10, files: ['ok.js', 42] },
    { id: 'bad-dir', title: 'Bad dir', maxLines: 10, directories: [{ path: '', extension: '' }] },
    { id: 'bad-closure', title: 'Bad closure', maxLines: 10, files: ['ok.js'], requireClosureRoots: ['', 42] }
  ], issue).map(item => item.type),
  [
    'moduleBudgetFieldInvalid',
    'moduleBudgetFieldInvalid',
    'moduleBudgetFieldInvalid',
    'moduleBudgetSourcesMissing',
    'moduleBudgetSourcesMissing',
    'moduleBudgetFileInvalid',
    'moduleBudgetDirectoryInvalid',
    'moduleBudgetDirectoryInvalid',
    'moduleBudgetArrayItemInvalid',
    'moduleBudgetArrayItemInvalid'
  ]
);
assert.deepEqual(
  testProfileGateShapeIssues([
    {
      id: '',
      required: 'yes',
      changedFiles: 'scripts/render/a.js',
      expectedRuleIds: ['renderer', 42],
      expectedGroups: [],
      expectedCommands: [],
      expectedFallbackToFull: 'no'
    },
    {
      id: 'bad-file',
      changedFiles: ['scripts/render/a.js', ''],
      expectedRuleIds: [],
      expectedGroups: ['unit'],
      expectedCommands: ['npm run test:unit'],
      expectedFallbackToFull: false
    }
  ], issue).map(item => item.type),
  [
    'testProfileGateFieldInvalid',
    'testProfileGateFieldInvalid',
    'testProfileGateFieldInvalid',
    'testProfileGateArrayInvalid',
    'testProfileGateArrayItemInvalid',
    'testProfileGateArrayInvalid',
    'testProfileGateArrayInvalid',
    'testProfileGateArrayItemInvalid'
  ]
);
assert.deepEqual(
  testProfileGateCoverageShapeIssues('bad-coverage', issue).map(item => item.type),
  ['testProfileGateCoverageInvalid']
);
assert.deepEqual(
  testProfileGateCoverageShapeIssues({
    requiredGateIds: ['', 42]
  }, issue).map(item => item.type),
  [
    'testProfileGateCoverageItemInvalid',
    'testProfileGateCoverageItemInvalid'
  ]
);
assert.deepEqual(
  objectiveCoverageShapeIssues([
    {
      id: 'bad-id',
      priority: 'P0',
      title: '',
      evidenceTaskIds: 'P0-01',
      moduleBudgetIds: ['budget', 7],
      testProfileGateIds: '',
      deliveryGateIds: ['gate', ''],
      requiredEvidence: ['codePath', 'bad-kind']
    },
    {
      id: 'P0-02',
      priority: 'P1',
      title: 'Mismatch',
      evidenceTaskIds: [],
      requiredEvidence: []
    }
  ], {
    allowedPriorities: ['P0', 'P1', 'P2']
  }, issue).map(item => item.type),
  [
    'objectiveCoverageIdInvalid',
    'objectiveCoverageFieldInvalid',
    'objectiveCoverageArrayInvalid',
    'objectiveCoverageArrayItemInvalid',
    'objectiveCoverageArrayInvalid',
    'objectiveCoverageArrayItemInvalid',
    'objectiveCoverageEvidenceKindInvalid',
    'objectiveCoveragePriorityMismatch',
    'objectiveCoverageArrayInvalid',
    'objectiveCoverageArrayInvalid'
  ]
);
assert.deepEqual(
  objectiveCoverageContractShapeIssues('bad-contract', issue).map(item => item.type),
  ['objectiveCoverageContractInvalid']
);
assert.deepEqual(
  objectiveCoverageContractShapeIssues({
    requiredObjectiveIds: ['', 42]
  }, issue).map(item => item.type),
  [
    'objectiveCoverageContractArrayItemInvalid',
    'objectiveCoverageContractArrayItemInvalid'
  ]
);
assert.deepEqual(
  objectiveCoverageRequiredIdIssues([
    { id: 'P0-01' },
    { id: 'P2-99' }
  ], {
    requiredObjectiveIds: ['P0-01', 'P0-02']
  }, issue).map(item => item.type),
  ['objectiveCoverageRequiredMissing', 'objectiveCoverageUnexpected']
);

assert.deepEqual(
  qualityModeDescriptionIssues(
    { draft: { description: 'ok' }, stale: { description: 'old mode' } },
    { draft: {}, maintenance: {} },
    issue
  ).map(item => item.type),
  ['qualityModeDescriptionMissing', 'qualityModeDescriptionStale']
);

console.log('hardening matrix contract ok');

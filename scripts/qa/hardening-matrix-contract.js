const {
  deliveryGateShapeIssues,
  duplicateIdIssues,
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
} = require('./hardening-matrix-contract-shapes');

const MATRIX_CONTRACT_ISSUE_TYPES = new Set([
  'backlogTaskMissing',
  'deliveryGateArtifactInvalid',
  'deliveryGateArtifactsInvalid',
  'deliveryGateFieldInvalid',
  'deliveryGateIdDuplicate',
  'duplicateTask',
  'extraTask',
  'invalidStatus',
  'matrixSourceBacklogMismatch',
  'matrixStatusScaleMismatch',
  'matrixTopLevelFieldInvalid',
  'matrixVersionInvalid',
  'moduleBudgetDirectoryInvalid',
  'moduleBudgetArrayInvalid',
  'moduleBudgetArrayItemInvalid',
  'moduleBudgetFieldInvalid',
  'moduleBudgetFileInvalid',
  'moduleBudgetIdDuplicate',
  'moduleBudgetRequireClosureUntracked',
  'moduleBudgetSourcesMissing',
  'objectiveCoverageArrayInvalid',
  'objectiveCoverageArrayItemInvalid',
  'objectiveCoverageContractArrayInvalid',
  'objectiveCoverageContractArrayItemInvalid',
  'objectiveCoverageContractInvalid',
  'objectiveCoverageEvidenceKindInvalid',
  'objectiveCoverageFieldInvalid',
  'objectiveCoverageIdDuplicate',
  'objectiveCoverageIdInvalid',
  'objectiveCoveragePriorityInvalid',
  'objectiveCoveragePriorityMismatch',
  'objectiveCoverageRequiredMissing',
  'objectiveCoverageUnexpected',
  'qualityModeDescriptionMissing',
  'qualityModeDescriptionStale',
  'taskEvidenceFieldItemInvalid',
  'taskEvidenceFieldNotArray',
  'taskIdInvalid',
  'taskPriorityInvalid',
  'taskPriorityMismatch',
  'taskRequiredFieldInvalid',
  'taskRequiredFieldMissing',
  'testProfileGateArrayInvalid',
  'testProfileGateArrayItemInvalid',
  'testProfileGateCoverageInvalid',
  'testProfileGateCoverageItemInvalid',
  'testProfileGateFieldInvalid',
  'testProfileGateIdDuplicate',
  'testProfileGateMismatch',
  'testProfileGateRequiredMissing',
  'testProfileGateRequiredNotReady'
]);

function isMatrixContractIssue(issue = {}) {
  return MATRIX_CONTRACT_ISSUE_TYPES.has(issue.type);
}

function matrixContractIssueTotals(issues = []) {
  return (Array.isArray(issues) ? issues : [])
    .filter(isMatrixContractIssue)
    .reduce((totals, item) => {
      totals.total += 1;
      if (item.level === 'blocking') totals.blocking += 1;
      else totals.review += 1;
      return totals;
    }, { total: 0, blocking: 0, review: 0 });
}

function matrixContractIssues(matrix = {}, opts = {}, issue = () => ({})) {
  const issues = [];
  const expectedSourceBacklog = opts.expectedSourceBacklog || '';
  const expectedStatusScale = Array.isArray(opts.expectedStatusScale) ? opts.expectedStatusScale : [];
  const expectedPriorities = Array.isArray(opts.expectedPriorities) ? opts.expectedPriorities : [];
  if (expectedSourceBacklog && matrix.sourceBacklog !== expectedSourceBacklog) {
    issues.push(issue('blocking', 'matrixSourceBacklogMismatch', 'matrix', `sourceBacklog must be ${expectedSourceBacklog}`));
  }
  if (expectedStatusScale.length && !sameStringArray(matrix.statusScale, expectedStatusScale)) {
    issues.push(issue('blocking', 'matrixStatusScaleMismatch', 'matrix', `statusScale must be ${expectedStatusScale.join(',')}`));
  }
  issues.push(...matrixTopLevelShapeIssues(matrix, issue));
  issues.push(...taskRequiredFieldIssues(matrix.tasks || [], { allowedStatuses: expectedStatusScale }, issue));
  issues.push(...taskPriorityIssues(matrix.tasks || [], { allowedPriorities: expectedPriorities }, issue));
  issues.push(...taskEvidenceShapeIssues(matrix.tasks || [], issue));
  issues.push(...deliveryGateShapeIssues(matrix.deliveryGates || [], issue));
  issues.push(...moduleBudgetShapeIssues(matrix.moduleBudgets || [], issue));
  issues.push(...testProfileGateShapeIssues(matrix.testProfileGates || [], issue));
  issues.push(...testProfileGateCoverageShapeIssues(matrix.testProfileGateCoverage, issue));
  issues.push(...objectiveCoverageShapeIssues(matrix.objectiveCoverage || [], {
    allowedPriorities: expectedPriorities
  }, issue));
  issues.push(...objectiveCoverageContractShapeIssues(matrix.objectiveCoverageContract, issue));
  issues.push(...objectiveCoverageRequiredIdIssues(matrix.objectiveCoverage || [], matrix.objectiveCoverageContract || {}, issue));
  issues.push(...duplicateIdIssues(matrix.deliveryGates || [], {
    collection: 'deliveryGates',
    type: 'deliveryGateIdDuplicate'
  }, issue));
  issues.push(...duplicateIdIssues(matrix.moduleBudgets || [], {
    collection: 'moduleBudgets',
    type: 'moduleBudgetIdDuplicate'
  }, issue));
  issues.push(...duplicateIdIssues(matrix.testProfileGates || [], {
    collection: 'testProfileGates',
    type: 'testProfileGateIdDuplicate'
  }, issue));
  issues.push(...duplicateIdIssues(matrix.objectiveCoverage || [], {
    collection: 'objectiveCoverage',
    type: 'objectiveCoverageIdDuplicate'
  }, issue));
  return issues;
}

module.exports = {
  deliveryGateShapeIssues,
  duplicateIdIssues,
  isMatrixContractIssue,
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
};

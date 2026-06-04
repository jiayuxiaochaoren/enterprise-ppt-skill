const {
  BACKLOG_PATH,
  MATRIX_PATH,
  PRIORITY_VALUES,
  STATUS_RANK,
  STATUS_VALUES,
  backlogTaskIds,
  commandLooksAvailable,
  exists,
  rel
} = require('./hardening-readiness-environment');
const {
  HARDENING_CONTRACT_EVIDENCE
} = require('./contract-registry');
const {
  evidenceStateTotals
} = require('./hardening-evidence-state');
const {
  matrixContractIssues,
  matrixContractIssueTotals
} = require('./hardening-matrix-contract');
const {
  objectiveCoverageContractSummary,
  objectiveCoveragePrioritySummary,
  objectiveCoverageIssues,
  objectiveCoverageRows,
  objectiveCoverageTotals
} = require('./hardening-objective-coverage');
const { qualityModeDescriptionIssues } = require('./hardening-quality-modes');
const { hardeningReadinessModes } = require('./hardening-readiness-modes');
const {
  summarizeReadinessSubsystems
} = require('./hardening-readiness-subsystems');
const {
  readinessIssue: issue,
  summarizeReadinessTasks,
  taskRows
} = require('./hardening-task-summary');

function evidenceFilesFor(row = {}) {
  return [
    ...(row.facadeFiles || []),
    ...(row.runnerFiles || []),
    ...(row.ruleModuleFiles || []),
    ...(row.registryFiles || []),
    ...(row.fixtureTests || [])
  ];
}

function contractEvidenceRows(rows = HARDENING_CONTRACT_EVIDENCE, opts = {}) {
  const fileExists = opts.exists || exists;
  return rows.map(row => {
    const files = evidenceFilesFor(row);
    const missingFiles = files.filter(file => !fileExists(file));
    return Object.assign({}, row, {
      files,
      missingFiles,
      ready: missingFiles.length === 0
    });
  });
}

function contractEvidenceTotals(rows = []) {
  return rows.reduce((totals, row) => {
    totals.total += 1;
    if (row.ready) totals.ready += 1;
    else totals.missing += 1;
    return totals;
  }, { total: 0, ready: 0, missing: 0 });
}

function summarizeHardeningReadiness(matrix) {
  const issues = [];
  const backlogIds = backlogTaskIds();
  const taskSummary = summarizeReadinessTasks(matrix, {
    backlogIds,
    issue,
    priorityValues: PRIORITY_VALUES,
    statusValues: STATUS_VALUES
  });
  const tasks = taskSummary.tasks;

  if (matrix.version !== 'hardening-readiness/v1') {
    issues.push(issue('blocking', 'matrixVersionInvalid', 'matrix', 'matrix version must be hardening-readiness/v1'));
  }
  issues.push(...matrixContractIssues(matrix, {
    expectedPriorities: PRIORITY_VALUES,
    expectedSourceBacklog: rel(BACKLOG_PATH),
    expectedStatusScale: STATUS_VALUES
  }, issue));
  issues.push(...taskSummary.issues);

  const subsystems = summarizeReadinessSubsystems(matrix, issue);
  issues.push(...subsystems.issues);

  const rows = taskRows(tasks);
  const objectiveCoverage = objectiveCoverageRows(matrix.objectiveCoverage || [], {
    deliveryGates: subsystems.deliveryGates,
    moduleBudgets: subsystems.moduleBudgets,
    taskRows: rows,
    testProfileGates: subsystems.testProfileGates
  });
  const objectiveCoverageContract = objectiveCoverageContractSummary(
    objectiveCoverage,
    matrix.objectiveCoverageContract || {}
  );
  const objectiveCoverageByPriority = objectiveCoveragePrioritySummary(objectiveCoverage, PRIORITY_VALUES);
  issues.push(...objectiveCoverageIssues(objectiveCoverage, issue));
  const modeShape = hardeningReadinessModes({
    blockingCount: 0,
    deliveryGates: subsystems.deliveryGates,
    formalGateReady: subsystems.formalGateReady,
    moduleBudgets: subsystems.moduleBudgets,
    objectiveCoverage,
    pageFamilyPrimitivesReady: subsystems.pageFamilyPrimitives.ready,
    qualitySeverityMatrixReady: subsystems.qualitySeverityMatrix.ready,
    screenshotBaselineReady: subsystems.screenshotBaseline.ready,
    statusRank: STATUS_RANK,
    tasks,
    textBlankReadinessReady: subsystems.textBlank.ready,
    testProfileGateCoverage: subsystems.testProfileGateCoverage,
    testProfileGates: subsystems.testProfileGates,
    templateReady: subsystems.template.ready
  });
  issues.push(...qualityModeDescriptionIssues(matrix.qualityModes || {}, modeShape, issue));
  const blocking = issues.filter(item => item.level === 'blocking');
  const modes = hardeningReadinessModes({
    blockingCount: blocking.length,
    deliveryGates: subsystems.deliveryGates,
    formalGateReady: subsystems.formalGateReady,
    moduleBudgets: subsystems.moduleBudgets,
    objectiveCoverage,
    pageFamilyPrimitivesReady: subsystems.pageFamilyPrimitives.ready,
    qualitySeverityMatrixReady: subsystems.qualitySeverityMatrix.ready,
    screenshotBaselineReady: subsystems.screenshotBaseline.ready,
    statusRank: STATUS_RANK,
    tasks,
    textBlankReadinessReady: subsystems.textBlank.ready,
    testProfileGateCoverage: subsystems.testProfileGateCoverage,
    testProfileGates: subsystems.testProfileGates,
    templateReady: subsystems.template.ready
  });
  const contractEvidence = contractEvidenceRows(HARDENING_CONTRACT_EVIDENCE, { exists });

  return {
    version: 'hardening-readiness-audit/v1',
    matrix: rel(MATRIX_PATH),
    backlog: rel(BACKLOG_PATH),
    taskCount: tasks.length,
    backlogTaskCount: backlogIds.length,
    totals: taskSummary.totals,
    evidenceStrength: taskSummary.evidenceStrength,
    deliveryGateTotals: subsystems.deliveryGateTotals,
    matrixContractTotals: matrixContractIssueTotals(issues),
    moduleBudgetDirectoryTotals: subsystems.moduleBudgetDirectoryTotals,
    moduleBudgetRequireClosureTotals: subsystems.moduleBudgetRequireClosureTotals,
    moduleBudgetTotals: subsystems.moduleBudgetTotals,
    objectiveCoverageByPriority,
    objectiveCoverageContract,
    objectiveCoverageTotals: objectiveCoverageTotals(objectiveCoverage),
    pageFamilyPrimitives: subsystems.pageFamilyPrimitives,
    qualitySeverityMatrix: subsystems.qualitySeverityMatrix,
    screenshotBaseline: subsystems.screenshotBaseline,
    textBlank: subsystems.textBlank,
    testProfileGateCoverage: subsystems.testProfileGateCoverage,
    testProfileGateTotals: subsystems.testProfileGateTotals,
    internalSummary: {
      contractEvidence,
      contractEvidenceTotals: contractEvidenceTotals(contractEvidence)
    },
    evidenceStateTotals: evidenceStateTotals(tasks, { commandLooksAvailable, exists }),
    evidenceCompleteness: {
      complete: rows.filter(task => task.evidenceComplete).length,
      incomplete: rows.filter(task => !task.evidenceComplete).length
    },
    modes,
    template: subsystems.template,
    deliveryGates: subsystems.deliveryGates,
    moduleBudgets: subsystems.moduleBudgets,
    objectiveCoverage,
    testProfileGates: subsystems.testProfileGates,
    blockingCount: blocking.length,
    reviewCount: issues.length - blocking.length,
    issues,
    tasks: rows
  };
}

module.exports = {
  contractEvidenceRows,
  contractEvidenceTotals,
  summarizeHardeningReadiness
};

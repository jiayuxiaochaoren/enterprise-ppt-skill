function requiredDeliveryGatesReady(deliveryGates = []) {
  return deliveryGates
    .filter(gate => gate.required !== false)
    .every(gate => gate.ready === true);
}

function moduleBudgetsReady(moduleBudgets = []) {
  return moduleBudgets.length > 0 && moduleBudgets.every(row => row.status === 'pass');
}

function testProfileGatesReady(testProfileGates = []) {
  return testProfileGates.length > 0
    && testProfileGates.filter(row => row.required !== false).every(row => row.ready === true);
}

function objectiveCoverageReady(objectiveCoverage = [], priorities = null) {
  const prioritySet = Array.isArray(priorities) ? new Set(priorities) : null;
  const rows = (Array.isArray(objectiveCoverage) ? objectiveCoverage : [])
    .filter(row => !prioritySet || prioritySet.has(row.priority));
  return rows.length > 0 && rows.every(row => row.ready === true);
}

function failedChecks(checks = {}) {
  return Object.entries(checks)
    .filter(([, pass]) => pass !== true)
    .map(([name]) => name);
}

function modeResult(checks = {}, successReason = '', failureReason = '') {
  const failed = failedChecks(checks);
  return {
    safe: failed.length === 0,
    reason: failed.length === 0 ? successReason : failureReason,
    checks,
    failedChecks: failed
  };
}

function hardeningReadinessModes(opts = {}) {
  const {
    blockingCount = 0,
    deliveryGates = [],
    formalGateReady = false,
    moduleBudgets = [],
    objectiveCoverage = [],
    pageFamilyPrimitivesReady = true,
    qualitySeverityMatrixReady = true,
    screenshotBaselineReady = true,
    statusRank = {},
    tasks = [],
    textBlankReadinessReady = true,
    testProfileGateCoverage = null,
    testProfileGates = [],
    templateReady = false
  } = opts;
  const p0Tasks = tasks.filter(task => task.priority === 'P0');
  const p1Tasks = tasks.filter(task => task.priority === 'P1');
  const p0Ready = p0Tasks.every(task => task.status === 'pass');
  const p1Ready = p1Tasks.every(task => task.status === 'pass');
  const p2Ready = tasks.filter(task => task.priority === 'P2').every(task => task.status === 'pass');
  const noP0Missing = p0Tasks.every(task => statusRank[task.status] >= statusRank.partial);
  const gatesReady = requiredDeliveryGatesReady(deliveryGates);
  const budgetsReady = moduleBudgetsReady(moduleBudgets);
  const p0ObjectiveCoverageReady = objectiveCoverageReady(objectiveCoverage, ['P0']);
  const p0p1ObjectiveCoverageReady = objectiveCoverageReady(objectiveCoverage, ['P0', 'P1']);
  const allObjectiveCoverageReady = objectiveCoverageReady(objectiveCoverage);
  const profileGatesReady = testProfileGatesReady(testProfileGates);
  const profileCoverageReady = !testProfileGateCoverage || testProfileGateCoverage.ready === true;
  const noBlockingIssues = Number(blockingCount || 0) === 0;

  return {
    draft: modeResult(
      { noP0Missing },
      'all P0 tasks are at least partial',
      'one or more P0 tasks are missing'
    ),
    formal_review: modeResult(
      { p0Ready, p0ObjectiveCoverageReady, formalGateReady },
      'all P0 tasks, P0 objective coverage, and formal validation are available',
      'P0 readiness, P0 objective coverage, or formal validation is incomplete'
    ),
    delivery: modeResult(
      { p0Ready, p1Ready, p0p1ObjectiveCoverageReady, formalGateReady, qualitySeverityMatrixReady, screenshotBaselineReady, textBlankReadinessReady, templateReady, deliveryGatesReady: gatesReady, noBlockingIssues },
      'P0/P1 hardening, P0/P1 objective coverage, formal validation, quality severity matrix, screenshot baseline QA, text shrink/blank-page QA, template readiness, delivery gates, and blocking audit status are all green',
      'delivery still has P1 hardening, objective coverage, gate, formal validation, quality severity matrix, screenshot baseline QA, text shrink/blank-page QA, template readiness, delivery verification, or blocking audit gaps'
    ),
    maintenance: modeResult(
      { p2Ready, objectiveCoverageReady: allObjectiveCoverageReady, moduleBudgetsReady: budgetsReady, pageFamilyPrimitivesReady, testProfileGatesReady: profileGatesReady, testProfileGateCoverageReady: profileCoverageReady, noBlockingIssues },
      'P2 hardening, all objective coverage, module budgets, page-family primitives, required test profile coverage, test profile gates, and blocking audit status are healthy',
      'maintenance still has P2 hardening, objective coverage, module budget, page-family primitive, required test profile coverage, test profile gate, or blocking audit gaps'
    )
  };
}

module.exports = {
  failedChecks,
  hardeningReadinessModes,
  modeResult,
  moduleBudgetsReady,
  objectiveCoverageReady,
  requiredDeliveryGatesReady,
  testProfileGatesReady
};

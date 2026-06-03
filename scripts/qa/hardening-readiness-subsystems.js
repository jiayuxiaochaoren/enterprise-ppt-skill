const {
  deliveryGateRows,
  deliveryGateTotals
} = require('./hardening-delivery-gates');
const {
  TEMPLATE_MATRIX_PATH,
  absolute,
  commandLooksAvailable,
  exists,
  isDirectory,
  listFiles,
  readJson,
  readText,
  rel
} = require('./hardening-readiness-environment');
const {
  stringArrayField
} = require('./hardening-evidence-state');
const {
  moduleBudgetDirectoryTotals,
  moduleBudgetIssues,
  moduleBudgetRequireClosureTotals,
  moduleBudgetRows,
  moduleBudgetTotals
} = require('./hardening-module-budgets');
const {
  pageFamilyPrimitiveSummary
} = require('./hardening-page-family-primitives');
const {
  qualitySeverityMatrixSummary
} = require('./hardening-quality-severity');
const {
  screenshotBaselineReadiness
} = require('./hardening-screenshot-baseline');
const {
  textBlankReadiness
} = require('./hardening-text-blank');
const { templateReadinessSummary } = require('./hardening-template-summary');
const {
  testProfileGateCoverage,
  testProfileGateCoverageIssues,
  testProfileGateIssues,
  testProfileGateRows,
  testProfileGateTotals
} = require('./hardening-test-profile-gates');

function summarizeReadinessSubsystems(matrix = {}, issue = () => ({})) {
  const issues = [];
  const gates = Array.isArray(matrix.deliveryGates) ? matrix.deliveryGates : [];
  const deliveryGates = deliveryGateRows(gates, { commandLooksAvailable, exists });
  const moduleBudgets = moduleBudgetRows(matrix.moduleBudgets || [], {
    directoryExists: isDirectory,
    exists,
    listFiles,
    readText: file => readText(absolute(file))
  });
  const pageFamilyPrimitives = pageFamilyPrimitiveSummary();
  const qualitySeverityMatrix = qualitySeverityMatrixSummary();
  const screenshotBaseline = screenshotBaselineReadiness({
    exists,
    readJson: file => readJson(absolute(file), null),
    readText: file => readText(absolute(file))
  });
  const textBlank = textBlankReadiness({
    exists,
    readText: file => readText(absolute(file))
  });
  const testProfileGates = testProfileGateRows(matrix.testProfileGates || []);
  const testProfileGateCoverageSummary = testProfileGateCoverage(testProfileGates, matrix.testProfileGateCoverage || {});
  const formalGate = gates.find(gate => /validate_pptx\.js/.test(gate.command || '') && /--formal/.test(gate.command || ''));
  if (!formalGate) {
    issues.push(issue('blocking', 'formalValidationGateMissing', 'deliveryGates', 'delivery-mode validation must include validate_pptx.js --formal'));
  }
  gates.filter(gate => gate.required !== false).forEach(gate => {
    if (!commandLooksAvailable(gate.command || '')) {
      issues.push(issue('blocking', 'deliveryGateCommandUnavailable', gate.id || 'deliveryGate', `delivery gate command is not available: ${gate.command || ''}`));
    }
    stringArrayField(gate, 'artifacts').forEach(file => {
      if (!exists(file)) issues.push(issue('blocking', 'deliveryGateArtifactMissing', gate.id || 'deliveryGate', `delivery gate artifact missing: ${file}`));
    });
  });
  issues.push(...moduleBudgetIssues(moduleBudgets, issue));
  if (!pageFamilyPrimitives.ready) {
    issues.push(issue('review', 'pageFamilyPrimitivesIncomplete', 'P2-02', 'page-family primitive contract is incomplete'));
  }
  if (!qualitySeverityMatrix.ready) {
    issues.push(issue('review', 'qualitySeverityMatrixIncomplete', 'P1-02', 'quality severity matrix is incomplete'));
  }
  if (!screenshotBaseline.ready) {
    issues.push(issue('review', 'screenshotBaselineReadinessIncomplete', 'P1-03', 'screenshot baseline QA readiness is incomplete'));
  }
  if (!textBlank.ready) {
    issues.push(issue('review', 'textBlankReadinessIncomplete', 'P1-04', 'text shrink and blank-page QA readiness is incomplete'));
  }
  issues.push(...testProfileGateIssues(testProfileGates, issue));
  issues.push(...testProfileGateCoverageIssues(testProfileGateCoverageSummary, issue));

  const template = templateReadinessSummary({ readJson, rel, templateMatrixPath: TEMPLATE_MATRIX_PATH });
  if (!template.ready) {
    issues.push(issue('review', 'templateReadinessIncomplete', 'template-readiness', `template readiness has ${template.missing.length} non-pass fields`));
  }

  return {
    deliveryGates,
    deliveryGateTotals: deliveryGateTotals(deliveryGates),
    formalGate,
    formalGateReady: Boolean(formalGate) && commandLooksAvailable(formalGate.command || ''),
    issues,
    moduleBudgets,
    moduleBudgetDirectoryTotals: moduleBudgetDirectoryTotals(moduleBudgets),
    moduleBudgetRequireClosureTotals: moduleBudgetRequireClosureTotals(moduleBudgets),
    moduleBudgetTotals: moduleBudgetTotals(moduleBudgets),
    pageFamilyPrimitives,
    qualitySeverityMatrix,
    screenshotBaseline,
    template,
    testProfileGates,
    testProfileGateCoverage: testProfileGateCoverageSummary,
    testProfileGateTotals: testProfileGateTotals(testProfileGates),
    textBlank
  };
}

module.exports = {
  summarizeReadinessSubsystems
};

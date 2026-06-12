const {
  formatList,
  formatObjectivePrioritySummary
} = require('./hardening-readiness-format');

function printHardeningReadinessHuman(summary = {}) {
  console.log('Hardening readiness audit');
  console.log(`Matrix: ${summary.matrix}`);
  console.log(`Backlog coverage: ${summary.taskCount}/${summary.backlogTaskCount} tasks`);
  Object.entries(summary.totals || {}).forEach(([priority, totals]) => {
    console.log(`${priority.padEnd(3)} pass ${String(totals.pass).padStart(2)}  partial ${String(totals.partial).padStart(2)}  missing ${String(totals.missing).padStart(2)}`);
  });
  const strength = summary.evidenceStrength || {};
  console.log(`Evidence strength: strong ${strength.strong || 0}  moderate ${strength.moderate || 0}  partial ${strength.partial || 0}  weak ${strength.weak || 0}`);
  if (summary.evidenceCompleteness) {
    console.log(`Evidence complete: ${summary.evidenceCompleteness.complete}/${summary.taskCount}`);
  }
  if (summary.template) {
    const templateMissing = summary.template.missing || [];
    console.log(`Template readiness: ${summary.template.ready ? 'ready' : 'not ready'} - ${summary.template.pageFamilyCount || 0} page families, ${templateMissing.length} missing fields`);
  }
  if (summary.deliveryGateTotals) {
    const gates = summary.deliveryGateTotals;
    console.log(`Delivery gates: pass ${gates.pass || 0}  partial ${gates.partial || 0}  missing ${gates.missing || 0}`);
  }
  if (summary.objectiveCoverageTotals) {
    const objectives = summary.objectiveCoverageTotals;
    console.log(`Objective coverage: pass ${objectives.pass || 0}  partial ${objectives.partial || 0}  missing ${objectives.missing || 0}`);
  }
  if (summary.objectiveCoverageByPriority) {
    console.log(`Objective coverage by priority: ${formatObjectivePrioritySummary(summary.objectiveCoverageByPriority)}`);
  }
  if (summary.objectiveCoverageContract) {
    const contract = summary.objectiveCoverageContract;
    console.log(`Required objective coverage: ${contract.ready ? 'ready' : 'not ready'}  required ${contract.requiredCount || 0}  actual ${contract.actualCount || 0}  missing ${formatList(contract.missingObjectiveIds)}  unexpected ${formatList(contract.unexpectedObjectiveIds)}`);
  }
  if (summary.matrixContractTotals) {
    const contracts = summary.matrixContractTotals;
    console.log(`Matrix contracts: ${contracts.total || 0} issues  blocking ${contracts.blocking || 0}  review ${contracts.review || 0}`);
  }
  if (summary.moduleBudgetTotals) {
    const budgets = summary.moduleBudgetTotals;
    console.log(`Module budgets: pass ${budgets.pass || 0}  over_limit ${budgets.over_limit || 0}  missing ${budgets.missing || 0}`);
  }
  if ((summary.moduleBudgets || []).length) {
    const minHeadroom = summary.moduleBudgets.reduce((min, row) => Math.min(min, row.lineHeadroom || 0), Infinity);
    const tightest = summary.moduleBudgets
      .filter(row => row.lineHeadroom === minHeadroom)
      .map(row => row.id)
      .sort()
      .join(', ');
    console.log(`Module budget headroom: min ${Number.isFinite(minHeadroom) ? minHeadroom : 0} lines${tightest ? ` - ${tightest}` : ''}`);
  }
  if (summary.moduleBudgetRequireClosureTotals) {
    const totals = summary.moduleBudgetRequireClosureTotals;
    console.log(`Module budget require closure: budgets ${totals.budgetsWithClosure || 0}  roots ${totals.roots || 0}  files ${totals.files || 0}  untracked ${totals.untracked || 0}`);
  }
  if (summary.pageFamilyPrimitives) {
    const primitives = summary.pageFamilyPrimitives;
    console.log(`Page-family primitives: ${primitives.ready ? 'ready' : 'not ready'}  groups ${primitives.groupCount || 0}  exports ${primitives.exposedExportCount || 0}/${primitives.expectedExportCount || 0}  targets ${primitives.exposedTargetCount || 0}/${primitives.targetCount || 0}  missing ${formatList([...(primitives.missingExports || []), ...(primitives.missingTargets || [])])}`);
  }
  if (summary.qualitySeverityMatrix) {
    const severity = summary.qualitySeverityMatrix;
    console.log(`Quality severity matrix: ${severity.ready ? 'ready' : 'not ready'}  categories ${severity.categoryCount || 0}  rows ${severity.rowCount || 0}  required_types ${severity.readyRequiredTypeCount || 0}/${severity.requiredTypeCount || 0}  missing ${formatList([...(severity.missingCategories || []), ...(severity.missingTypes || []), ...(severity.mismatchedTypes || [])])}`);
  }
  if (summary.screenshotBaseline) {
    const baseline = summary.screenshotBaseline;
    console.log(`Screenshot baseline QA: ${baseline.ready ? 'ready' : 'not ready'}  regions ${baseline.manifestRegionCount || 0}/${baseline.requiredRegionCount || 0}  findings ${baseline.requiredFindingCount || 0}  missing ${formatList([...(baseline.missingManifestRegions || []), ...(baseline.missingNegativeRegions || []), ...(baseline.missingAuditFindings || [])])}`);
  }
  if (summary.textBlank) {
    const textBlank = summary.textBlank;
    console.log(`Text shrink/blank-page QA: ${textBlank.ready ? 'ready' : 'not ready'}  findings ${textBlank.requiredFindingCount || 0}  text_meta ${textBlank.requiredTextMetaFieldCount || 0}  coverage ${textBlank.requiredCoverageFieldCount || 0}  missing ${formatList([...(textBlank.missingTextMetaFields || []), ...(textBlank.missingCoverageFindings || []), ...(textBlank.missingContentCoverageTestTerms || [])])}`);
  }
  if (summary.testProfileGateTotals) {
    const profiles = summary.testProfileGateTotals;
    console.log(`Test profile gates: pass ${profiles.pass || 0}  partial ${profiles.partial || 0}  missing ${profiles.missing || 0}`);
  }
  if (summary.testProfileGateCoverage) {
    const coverage = summary.testProfileGateCoverage;
    console.log(`Required test profile coverage: ${coverage.ready ? 'ready' : 'not ready'}  missing ${(coverage.missingGateIds || []).join(',') || 'none'}  not_ready ${(coverage.notReadyGateIds || []).join(',') || 'none'}`);
  }
  if (summary.moduleBudgetDirectoryTotals) {
    const directories = summary.moduleBudgetDirectoryTotals;
    console.log(`Module budget directories: tracked ${directories.tracked || 0}  present ${directories.present || 0}  missing ${directories.missing || 0}  empty ${directories.empty || 0}`);
  }
  console.log('');
  Object.entries(summary.modes || {}).forEach(([mode, result]) => {
    console.log(`${mode.padEnd(13)} ${result.safe ? 'safe' : 'not safe'} - ${result.reason}`);
  });
  console.log('');
  if ((summary.issues || []).length) {
    console.log('Issues');
    summary.issues.slice(0, 80).forEach(item => {
      console.log(`- [${item.level}] ${item.id}: ${item.message}`);
    });
    if (summary.issues.length > 80) console.log(`- ... ${summary.issues.length - 80} more`);
  } else {
    console.log('No readiness issues found.');
  }
}

module.exports = {
  printHardeningReadinessHuman
};

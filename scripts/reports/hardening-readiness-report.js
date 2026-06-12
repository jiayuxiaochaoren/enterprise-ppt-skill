const {
  formatList,
  formatMismatchDetail,
  formatObjectiveFailureSignals,
  formatObjectivePrioritySummary
} = require('./hardening-readiness-format');
const {
  printHardeningReadinessHuman
} = require('./hardening-readiness-human');

function hardeningReadinessMarkdown(summary = {}) {
  const template = summary.template || {};
  const templateMissing = template.missing || [];
  const deliveryGates = summary.deliveryGates || [];
  const matrixContracts = summary.matrixContractTotals || {};
  const moduleBudgets = summary.moduleBudgets || [];
  const requireClosureTotals = summary.moduleBudgetRequireClosureTotals || {};
  const objectiveCoverage = summary.objectiveCoverage || [];
  const objectiveByPriority = summary.objectiveCoverageByPriority || {};
  const objectiveContract = summary.objectiveCoverageContract || {};
  const objectiveTotals = summary.objectiveCoverageTotals || {};
  const pageFamilyPrimitives = summary.pageFamilyPrimitives || {};
  const qualitySeverityMatrix = summary.qualitySeverityMatrix || {};
  const screenshotBaseline = summary.screenshotBaseline || {};
  const textBlank = summary.textBlank || {};
  const testProfileGates = summary.testProfileGates || [];
  const testProfileCoverage = summary.testProfileGateCoverage || {};
  const testProfileTotals = summary.testProfileGateTotals || {};
  const internalSummary = summary.internalSummary || {};
  const contractEvidence = internalSummary.contractEvidence || [];
  const contractEvidenceTotals = internalSummary.contractEvidenceTotals || {};
  const moduleBudgetHeadroom = moduleBudgets.length
    ? moduleBudgets.reduce((min, row) => Math.min(min, row.lineHeadroom || 0), Infinity)
    : 0;
  const lines = [
    '# Hardening Readiness Dashboard',
    '',
    `- Matrix: ${summary.matrix}`,
    `- Backlog coverage: ${summary.taskCount}/${summary.backlogTaskCount} tasks`,
    `- Blocking issues: ${summary.blockingCount}`,
    `- Review issues: ${summary.reviewCount}`,
    `- Matrix contract issues: ${matrixContracts.total || 0} (${matrixContracts.blocking || 0} blocking, ${matrixContracts.review || 0} review)`,
    `- Objective coverage: pass ${objectiveTotals.pass || 0}, partial ${objectiveTotals.partial || 0}, missing ${objectiveTotals.missing || 0}`,
    `- Objective coverage by priority: ${formatObjectivePrioritySummary(objectiveByPriority)}`,
    `- Required objective coverage: ${objectiveContract.ready ? 'ready' : 'not ready'} (${objectiveContract.actualCount || 0}/${objectiveContract.requiredCount || 0})`,
    `- Module budget minimum headroom: ${Number.isFinite(moduleBudgetHeadroom) ? moduleBudgetHeadroom : 0} lines`,
    `- Module budget require closure: ${requireClosureTotals.budgetsWithClosure || 0} budgets, ${requireClosureTotals.roots || 0} roots, ${requireClosureTotals.files || 0} files, ${requireClosureTotals.untracked || 0} untracked`,
    `- Page-family primitives: ${pageFamilyPrimitives.ready ? 'ready' : 'not ready'} (${pageFamilyPrimitives.groupCount || 0} groups, ${pageFamilyPrimitives.exposedExportCount || 0}/${pageFamilyPrimitives.expectedExportCount || 0} exports, ${pageFamilyPrimitives.exposedTargetCount || 0}/${pageFamilyPrimitives.targetCount || 0} P2 targets)`,
    `- Quality severity matrix: ${qualitySeverityMatrix.ready ? 'ready' : 'not ready'} (${qualitySeverityMatrix.categoryCount || 0} categories, ${qualitySeverityMatrix.rowCount || 0} rows, ${qualitySeverityMatrix.readyRequiredTypeCount || 0}/${qualitySeverityMatrix.requiredTypeCount || 0} required types)`,
    `- Screenshot baseline QA: ${screenshotBaseline.ready ? 'ready' : 'not ready'} (${screenshotBaseline.manifestRegionCount || 0}/${screenshotBaseline.requiredRegionCount || 0} regions, ${screenshotBaseline.requiredFindingCount || 0} findings)`,
    `- Text shrink/blank-page QA: ${textBlank.ready ? 'ready' : 'not ready'} (${textBlank.requiredFindingCount || 0} findings, ${textBlank.requiredTextMetaFieldCount || 0} text-meta fields, ${textBlank.requiredCoverageFieldCount || 0} coverage fields)`,
    `- Test profile gates: pass ${testProfileTotals.pass || 0}, partial ${testProfileTotals.partial || 0}, missing ${testProfileTotals.missing || 0}`,
    `- Required test profile coverage: ${testProfileCoverage.ready ? 'ready' : 'not ready'} (${(testProfileCoverage.requiredGateIds || []).join(', ') || 'none'})`,
    `- Internal contract evidence: ${contractEvidenceTotals.ready || 0}/${contractEvidenceTotals.total || 0} ready`,
    `- Evidence complete: ${summary.evidenceCompleteness ? summary.evidenceCompleteness.complete : 0}/${summary.taskCount}`,
    '',
    '## Modes',
    '',
    '| Mode | Status | Failed Checks | Reason |',
    '| --- | --- | --- | --- |',
    ...Object.entries(summary.modes || {}).map(([mode, result]) =>
      `| ${mode} | ${result.safe ? 'safe' : 'not safe'} | ${(result.failedChecks || []).join(', ') || 'none'} | ${result.reason || ''} |`
    ),
    '',
    '## Evidence Totals',
    '',
    '| Evidence | Pass | Partial | Missing | N/A |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...Object.entries(summary.evidenceStateTotals || {}).map(([kind, totals]) =>
      `| ${kind} | ${totals.pass || 0} | ${totals.partial || 0} | ${totals.missing || 0} | ${totals.not_applicable || 0} |`
    ),
    '',
    '## Template Readiness',
    '',
    `- Matrix: ${template.matrix || ''}`,
    `- Coverage: ${template.pageFamilyCount || 0} page families`,
    `- Status: ${template.ready ? 'ready' : 'not ready'}`,
    `- Missing fields: ${templateMissing.length}`,
    ...(templateMissing.length
      ? ['', ...templateMissing.slice(0, 20).map(item => `- ${item}`)]
      : []),
    '',
    '## Delivery Gates',
    '',
    '| Gate | Required | Status | Command Available | Artifacts | Missing Artifacts |',
    '| --- | --- | --- | --- | ---: | --- |',
    ...deliveryGates.map(gate =>
      `| ${gate.id} | ${gate.required ? 'yes' : 'no'} | ${gate.status || ''} | ${gate.commandAvailable ? 'yes' : 'no'} | ${gate.artifactCount || 0} | ${(gate.missingArtifacts || []).join(', ') || 'none'} |`
    ),
    '',
    '## Objective Coverage',
    '',
    `- Contract: ${objectiveContract.ready ? 'ready' : 'not ready'} (required ${objectiveContract.requiredCount || 0}, actual ${objectiveContract.actualCount || 0})`,
    `- Required objective IDs: ${formatList(objectiveContract.requiredObjectiveIds)}`,
    `- Actual objective IDs: ${formatList(objectiveContract.actualObjectiveIds)}`,
    `- Missing required objective IDs: ${formatList(objectiveContract.missingObjectiveIds)}`,
    `- Unexpected objective IDs: ${formatList(objectiveContract.unexpectedObjectiveIds)}`,
    '',
    '| Priority | Ready | Pass | Partial | Missing | Failed Objectives | Failure Signals |',
    '| --- | --- | ---: | ---: | ---: | --- | --- |',
    ...Object.entries(objectiveByPriority).map(([priority, row]) =>
      `| ${priority} | ${row.ready ? 'yes' : 'no'} | ${row.pass || 0} | ${row.partial || 0} | ${row.missing || 0} | ${formatList(row.failedObjectiveIds)} | ${formatObjectiveFailureSignals(row.failureSignals)} |`
    ),
    '',
    '| Objective | Priority | Status | Evidence Tasks | Required Evidence | Code | Render Meta | QA | Proof | Gates And Budgets | Missing |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...objectiveCoverage.map(row => {
      const state = row.evidenceState || {};
      const linked = [
        ...(row.moduleBudgetIds || []).map(id => `budget:${id}`),
        ...(row.testProfileGateIds || []).map(id => `profile:${id}`),
        ...(row.deliveryGateIds || []).map(id => `gate:${id}`)
      ];
      const missing = [
        ...(row.missingEvidenceTaskIds || []).map(id => `task:${id}`),
        ...(row.missingModuleBudgetIds || []).map(id => `budget:${id}`),
        ...(row.missingTestProfileGateIds || []).map(id => `profile:${id}`),
        ...(row.missingDeliveryGateIds || []).map(id => `gate:${id}`),
        ...(row.notPassTaskIds || []).map(id => `task-not-pass:${id}`),
        ...(row.notReadyModuleBudgetIds || []).map(id => `budget-not-ready:${id}`),
        ...(row.notReadyTestProfileGateIds || []).map(id => `profile-not-ready:${id}`),
        ...(row.notReadyDeliveryGateIds || []).map(id => `gate-not-ready:${id}`),
        ...(row.evidenceMissing || []).map(id => `evidence:${id}`)
      ];
      return `| ${row.id} ${row.title || ''} | ${row.priority || ''} | ${row.status || ''} | ${(row.evidenceTaskIds || []).join(', ') || 'none'} | ${(row.requiredEvidence || []).join(', ') || 'none'} | ${state.codePath || ''} | ${state.renderMeta || ''} | ${state.automatedQa || ''} | ${state.renderedProof || ''} | ${linked.join(', ') || 'none'} | ${missing.join(', ') || 'none'} |`;
    }),
    '',
    '## Module Budgets',
    '',
    '| Budget | Status | Max Lines | Max Observed | Headroom | Usage | Files | Directories | Require Roots | Require Closure | Untracked Require Closure | Over Limit | Missing Files | Missing Dirs | Empty Dirs |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | --- | --- | --- | --- | --- |',
    ...moduleBudgets.map(row =>
      `| ${row.id} ${row.title || ''} | ${row.status || ''} | ${row.maxLines || 0} | ${row.maxObservedLines || 0} | ${row.lineHeadroom || 0} | ${row.lineUsagePercent || 0}% | ${row.fileCount || 0} | ${(row.directories || []).length} | ${formatList(row.requireClosureRoots)} | ${(row.requireClosureFiles || []).length} | ${formatList(row.untrackedRequireClosureFiles)} | ${formatList(row.overLimitFiles)} | ${formatList(row.missingFiles)} | ${formatList(row.missingDirectories)} | ${formatList(row.emptyDirectories)} |`
    ),
    '',
    '## Page-Family Primitives',
    '',
    `- Status: ${pageFamilyPrimitives.ready ? 'ready' : 'not ready'}`,
    `- Missing exports: ${formatList(pageFamilyPrimitives.missingExports)}`,
    `- Missing P2 targets: ${formatList(pageFamilyPrimitives.missingTargets)}`,
    `- Extra facade exports: ${formatList(pageFamilyPrimitives.extraExports)}`,
    ...(pageFamilyPrimitives.error ? [`- Error: ${pageFamilyPrimitives.error}`] : []),
    '',
    '| Group | Ready | Exposed | Expected | Missing Exports |',
    '| --- | --- | ---: | ---: | --- |',
    ...((pageFamilyPrimitives.groups || []).map(group =>
      `| ${group.id} ${group.label || ''} | ${group.ready ? 'yes' : 'no'} | ${group.exposedCount || 0} | ${group.exportCount || 0} | ${formatList(group.missingExports)} |`
    )),
    '',
    '## Quality Severity Matrix',
    '',
    `- Status: ${qualitySeverityMatrix.ready ? 'ready' : 'not ready'}`,
    `- Policy: ${qualitySeverityMatrix.policyVersion || ''}`,
    `- Matrix: ${qualitySeverityMatrix.matrixVersion || ''}`,
    `- Missing required categories: ${formatList(qualitySeverityMatrix.missingCategories)}`,
    `- Missing required types: ${formatList(qualitySeverityMatrix.missingTypes)}`,
    `- Mismatched required types: ${formatList(qualitySeverityMatrix.mismatchedTypes)}`,
    '',
    '| Category | Rows | Formal Fail | Delivery Fail |',
    '| --- | ---: | ---: | ---: |',
    ...((qualitySeverityMatrix.categories || []).map(row =>
      `| ${row.category || ''} | ${row.rows || 0} | ${row.formalFail || 0} | ${row.deliveryFail || 0} |`
    )),
    '',
    '| Required Type | Ready | Category | Draft | Formal | Delivery | Mismatches |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...((qualitySeverityMatrix.requiredTypes || []).map(row =>
      `| ${row.type || ''} | ${row.ready ? 'yes' : 'no'} | ${row.category || ''} | ${row.draft || ''} | ${row.formal || ''} | ${row.delivery || ''} | ${formatList(row.mismatches)} |`
    )),
    '',
    '## Test Profile Gates',
    '',
    `- Required coverage: ${testProfileCoverage.ready ? 'ready' : 'not ready'}`,
    `- Required gates: ${(testProfileCoverage.requiredGateIds || []).join(', ') || 'none'}`,
    `- Missing required gates: ${(testProfileCoverage.missingGateIds || []).join(', ') || 'none'}`,
    `- Not-ready required gates: ${(testProfileCoverage.notReadyGateIds || []).join(', ') || 'none'}`,
    '',
    '| Gate | Status | Mismatches | Mismatch Details | Rules | Groups | Commands | Fallback | Changed Files |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...testProfileGates.map(row =>
      `| ${row.id} | ${row.status || ''} | ${(row.mismatchReasons || []).join(', ') || 'none'} | ${(row.mismatchDetails || []).map(formatMismatchDetail).join('; ') || 'none'} | ${(row.actualRuleIds || []).join(', ') || 'none'} | ${(row.actualGroups || []).join(', ') || 'none'} | ${(row.actualCommands || []).join(' && ') || 'none'} | ${row.actualFallbackToFull ? 'yes' : 'no'} | ${(row.changedFiles || []).join(', ') || 'none'} |`
    ),
    '',
    '## Internal Contract Evidence',
    '',
    '| Contract | Ready | Support | Facade | Runner | Rule Modules | Registry | Fixture Tests | Missing |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...contractEvidence.map(row =>
      `| ${row.id} ${row.label || ''} | ${row.ready ? 'yes' : 'no'} | ${row.supportKind || ''} | ${formatList(row.facadeFiles)} | ${formatList(row.runnerFiles)} | ${formatList(row.ruleModuleFiles)} | ${formatList(row.registryFiles)} | ${formatList(row.fixtureTests)} | ${formatList(row.missingFiles)} |`
    ),
    '',
    '## Tasks',
    '',
    '| Task | Priority | Status | Strength | Code | Render Meta | QA | Proof | Gaps |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...((summary.tasks || []).map(task => {
      const state = task.evidenceState || {};
      const gaps = (task.evidenceGaps || []).join(', ') || 'none';
      return `| ${task.id} ${task.title || ''} | ${task.priority || ''} | ${task.status || ''} | ${task.evidenceStrength || ''} | ${state.codePath || ''} | ${state.renderMeta || ''} | ${state.automatedQa || ''} | ${state.renderedProof || ''} | ${gaps} |`;
    })),
    '',
    '## Issues',
    '',
    ...((summary.issues || []).length
      ? summary.issues.map(item => `- [${item.level}] ${item.id}: ${item.message}`)
      : ['- None'])
  ];
  return `${lines.join('\n')}\n`;
}

module.exports = {
  hardeningReadinessMarkdown,
  printHardeningReadinessHuman
};

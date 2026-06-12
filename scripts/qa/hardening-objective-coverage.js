const EVIDENCE_KINDS = ['codePath', 'renderMeta', 'automatedQa', 'renderedProof'];

function arrayField(object = {}, field = '') {
  return Array.isArray(object[field]) ? object[field] : [];
}

function indexedById(rows = []) {
  return new Map((Array.isArray(rows) ? rows : []).map(row => [row.id, row]));
}

function coverageStatus(ready, hasAnyEvidence) {
  if (ready) return 'pass';
  return hasAnyEvidence ? 'partial' : 'missing';
}

function evidenceKindStatus(tasks = [], kind = '', required = false) {
  if (!required) return 'not_required';
  return tasks.some(task => task.evidenceState && task.evidenceState[kind] === 'pass')
    ? 'pass'
    : 'missing';
}

function linkedRows(ids = [], index = new Map()) {
  return ids.map(id => index.get(id)).filter(Boolean);
}

function rowIdsByStatus(rows = [], predicate = () => false) {
  return rows.filter(predicate).map(row => row.id).sort();
}

function objectiveIds(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .map(row => row && row.id)
    .filter(id => typeof id === 'string' && id.trim());
}

function objectiveCoverageContractSummary(objectives = [], contract = {}) {
  const requiredObjectiveIds = Array.isArray(contract.requiredObjectiveIds)
    ? contract.requiredObjectiveIds.filter(id => typeof id === 'string' && id.trim())
    : [];
  const actualObjectiveIds = objectiveIds(objectives);
  const requiredSet = new Set(requiredObjectiveIds);
  const actualSet = new Set(actualObjectiveIds);
  const missingObjectiveIds = requiredObjectiveIds.filter(id => !actualSet.has(id));
  const unexpectedObjectiveIds = actualObjectiveIds.filter(id => !requiredSet.has(id));
  return {
    ready: requiredObjectiveIds.length > 0
      && missingObjectiveIds.length === 0
      && unexpectedObjectiveIds.length === 0,
    requiredObjectiveIds,
    actualObjectiveIds,
    missingObjectiveIds,
    unexpectedObjectiveIds,
    requiredCount: requiredObjectiveIds.length,
    actualCount: actualObjectiveIds.length
  };
}

function objectiveCoverageFailureSignals(row = {}) {
  return [
    ...(row.missingEvidenceTaskIds || []).map(id => `task:${id}:missing`),
    ...(row.missingModuleBudgetIds || []).map(id => `budget:${id}:missing`),
    ...(row.missingTestProfileGateIds || []).map(id => `profile:${id}:missing`),
    ...(row.missingDeliveryGateIds || []).map(id => `gate:${id}:missing`),
    ...(row.notPassTaskIds || []).map(id => `task:${id}:not_pass`),
    ...(row.notReadyModuleBudgetIds || []).map(id => `budget:${id}:not_ready`),
    ...(row.notReadyTestProfileGateIds || []).map(id => `profile:${id}:not_ready`),
    ...(row.notReadyDeliveryGateIds || []).map(id => `gate:${id}:not_ready`),
    ...(row.evidenceMissing || []).map(kind => `evidence:${kind}:missing`)
  ];
}

function objectiveCoveragePrioritySummary(rows = [], priorities = []) {
  const orderedPriorities = (Array.isArray(priorities) && priorities.length
    ? priorities
    : [...new Set((Array.isArray(rows) ? rows : []).map(row => row.priority).filter(Boolean))].sort());
  return orderedPriorities.reduce((summary, priority) => {
    const priorityRows = (Array.isArray(rows) ? rows : []).filter(row => row.priority === priority);
    const failedRows = priorityRows.filter(row => row.ready !== true);
    summary[priority] = {
      ready: priorityRows.length > 0 && failedRows.length === 0,
      total: priorityRows.length,
      pass: priorityRows.filter(row => row.status === 'pass').length,
      partial: priorityRows.filter(row => row.status === 'partial').length,
      missing: priorityRows.filter(row => row.status === 'missing').length,
      failedObjectiveIds: failedRows.map(row => row.id).sort(),
      failureSignals: failedRows.reduce((signals, row) => {
        signals[row.id] = objectiveCoverageFailureSignals(row);
        return signals;
      }, {})
    };
    return summary;
  }, {});
}

function objectiveCoverageRows(objectives = [], opts = {}) {
  const taskIndex = indexedById(opts.taskRows || []);
  const moduleBudgetIndex = indexedById(opts.moduleBudgets || []);
  const testProfileGateIndex = indexedById(opts.testProfileGates || []);
  const deliveryGateIndex = indexedById(opts.deliveryGates || []);
  return (Array.isArray(objectives) ? objectives : []).map(objective => {
    const evidenceTaskIds = arrayField(objective, 'evidenceTaskIds');
    const moduleBudgetIds = arrayField(objective, 'moduleBudgetIds');
    const testProfileGateIds = arrayField(objective, 'testProfileGateIds');
    const deliveryGateIds = arrayField(objective, 'deliveryGateIds');
    const requiredEvidence = new Set(arrayField(objective, 'requiredEvidence'));
    const evidenceTasks = linkedRows(evidenceTaskIds, taskIndex);
    const moduleBudgets = linkedRows(moduleBudgetIds, moduleBudgetIndex);
    const testProfileGates = linkedRows(testProfileGateIds, testProfileGateIndex);
    const deliveryGates = linkedRows(deliveryGateIds, deliveryGateIndex);
    const missingEvidenceTaskIds = evidenceTaskIds.filter(id => !taskIndex.has(id));
    const missingModuleBudgetIds = moduleBudgetIds.filter(id => !moduleBudgetIndex.has(id));
    const missingTestProfileGateIds = testProfileGateIds.filter(id => !testProfileGateIndex.has(id));
    const missingDeliveryGateIds = deliveryGateIds.filter(id => !deliveryGateIndex.has(id));
    const notPassTaskIds = rowIdsByStatus(evidenceTasks, task => task.status !== 'pass');
    const notReadyModuleBudgetIds = rowIdsByStatus(moduleBudgets, row => row.status !== 'pass');
    const notReadyTestProfileGateIds = rowIdsByStatus(testProfileGates, row => !row.ready);
    const notReadyDeliveryGateIds = rowIdsByStatus(deliveryGates, row => !row.ready);
    const evidenceState = EVIDENCE_KINDS.reduce((state, kind) => {
      state[kind] = evidenceKindStatus(evidenceTasks, kind, requiredEvidence.has(kind));
      return state;
    }, {});
    const evidenceMissing = Object.entries(evidenceState)
      .filter(([, status]) => status === 'missing')
      .map(([kind]) => kind);
    const ready = [
      missingEvidenceTaskIds,
      missingModuleBudgetIds,
      missingTestProfileGateIds,
      missingDeliveryGateIds,
      notPassTaskIds,
      notReadyModuleBudgetIds,
      notReadyTestProfileGateIds,
      notReadyDeliveryGateIds,
      evidenceMissing
    ].every(list => list.length === 0);
    const hasAnyEvidence = evidenceTasks.length > 0
      || moduleBudgets.length > 0
      || testProfileGates.length > 0
      || deliveryGates.length > 0;
    return {
      id: objective.id || '',
      priority: objective.priority || '',
      title: objective.title || '',
      status: coverageStatus(ready, hasAnyEvidence),
      ready,
      evidenceTaskIds,
      moduleBudgetIds,
      testProfileGateIds,
      deliveryGateIds,
      requiredEvidence: [...requiredEvidence].sort(),
      evidenceState,
      missingEvidenceTaskIds,
      missingModuleBudgetIds,
      missingTestProfileGateIds,
      missingDeliveryGateIds,
      notPassTaskIds,
      notReadyModuleBudgetIds,
      notReadyTestProfileGateIds,
      notReadyDeliveryGateIds,
      evidenceMissing
    };
  });
}

function objectiveCoverageTotals(rows = []) {
  return (Array.isArray(rows) ? rows : []).reduce((totals, row) => {
    totals[row.status] = (totals[row.status] || 0) + 1;
    return totals;
  }, { pass: 0, partial: 0, missing: 0 });
}

function objectiveCoverageIssues(rows = [], issue = () => ({})) {
  const issues = [];
  (Array.isArray(rows) ? rows : []).forEach(row => {
    const level = row.priority === 'P0' ? 'blocking' : 'review';
    [
      ['objectiveEvidenceTaskMissing', row.missingEvidenceTaskIds],
      ['objectiveModuleBudgetMissing', row.missingModuleBudgetIds],
      ['objectiveTestProfileGateMissing', row.missingTestProfileGateIds],
      ['objectiveDeliveryGateMissing', row.missingDeliveryGateIds],
      ['objectiveEvidenceTaskNotPass', row.notPassTaskIds],
      ['objectiveModuleBudgetNotReady', row.notReadyModuleBudgetIds],
      ['objectiveTestProfileGateNotReady', row.notReadyTestProfileGateIds],
      ['objectiveDeliveryGateNotReady', row.notReadyDeliveryGateIds],
      ['objectiveEvidenceKindMissing', row.evidenceMissing]
    ].forEach(([type, values]) => {
      if ((values || []).length) {
        issues.push(issue(level, type, row.id, `${row.id} ${row.title} is missing ${type.replace(/^objective/, '')}: ${values.join(', ')}`));
      }
    });
  });
  return issues;
}

module.exports = {
  EVIDENCE_KINDS,
  objectiveCoverageContractSummary,
  objectiveCoverageFailureSignals,
  objectiveCoverageIssues,
  objectiveCoveragePrioritySummary,
  objectiveCoverageRows,
  objectiveCoverageTotals
};

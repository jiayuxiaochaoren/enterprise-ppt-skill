const OBJECTIVE_EVIDENCE_KINDS = ['codePath', 'renderMeta', 'automatedQa', 'renderedProof'];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stringArrayShapeIssues(ownerId = '', target = {}, field = '', opts = {}, issue = () => ({})) {
  const issues = [];
  const value = target[field];
  const allowEmpty = opts.allowEmpty === true;
  if (!Array.isArray(value)) {
    issues.push(issue('blocking', 'testProfileGateArrayInvalid', ownerId, `${field} must be an array`));
    return issues;
  }
  if (!allowEmpty && value.length === 0) {
    issues.push(issue('blocking', 'testProfileGateArrayInvalid', ownerId, `${field} must not be empty`));
  }
  value.forEach((item, index) => {
    if (typeof item !== 'string' || !item.trim()) {
      issues.push(issue('blocking', 'testProfileGateArrayItemInvalid', ownerId, `${field}[${index}] must be a non-empty string`));
    }
  });
  return issues;
}

function objectiveCoverageShapeIssues(objectives = [], opts = {}, issue = () => ({})) {
  const allowedPriorities = Array.isArray(opts.allowedPriorities) ? opts.allowedPriorities : [];
  const allowedEvidenceKinds = Array.isArray(opts.allowedEvidenceKinds) ? opts.allowedEvidenceKinds : OBJECTIVE_EVIDENCE_KINDS;
  const issues = [];
  (Array.isArray(objectives) ? objectives : []).forEach((rawObjective, index) => {
    const objective = isPlainObject(rawObjective) ? rawObjective : {};
    const id = objective.id || `objectiveCoverage[${index}]`;
    const priority = objective.priority || '';
    const idMatch = String(id).match(/^(P\d)-\d{2}$/);
    if (!idMatch) {
      issues.push(issue('blocking', 'objectiveCoverageIdInvalid', id, `objective coverage id must match P#-##: ${id}`));
    }
    ['id', 'priority', 'title'].forEach(field => {
      if (typeof objective[field] !== 'string' || !objective[field].trim()) {
        issues.push(issue('blocking', 'objectiveCoverageFieldInvalid', id, `${field} must be a non-empty string`));
      }
    });
    if (allowedPriorities.length && !allowedPriorities.includes(priority)) {
      issues.push(issue('blocking', 'objectiveCoveragePriorityInvalid', id, `priority must be one of ${allowedPriorities.join(', ')}`));
    }
    if (idMatch && priority && priority !== idMatch[1]) {
      issues.push(issue('blocking', 'objectiveCoveragePriorityMismatch', id, `priority ${priority} must match id prefix ${idMatch[1]}`));
    }
    issues.push(...stringArrayShapeIssues(id, objective, 'evidenceTaskIds', { allowEmpty: false }, issue)
      .map(item => Object.assign({}, item, { type: item.type.replace('testProfileGateArray', 'objectiveCoverageArray') })));
    ['moduleBudgetIds', 'testProfileGateIds', 'deliveryGateIds'].forEach(field => {
      if (objective[field] === undefined) return;
      issues.push(...stringArrayShapeIssues(id, objective, field, { allowEmpty: true }, issue)
        .map(item => Object.assign({}, item, { type: item.type.replace('testProfileGateArray', 'objectiveCoverageArray') })));
    });
    issues.push(...stringArrayShapeIssues(id, objective, 'requiredEvidence', { allowEmpty: false }, issue)
      .map(item => Object.assign({}, item, { type: item.type.replace('testProfileGateArray', 'objectiveCoverageArray') })));
    if (Array.isArray(objective.requiredEvidence)) {
      objective.requiredEvidence.forEach((kind, kindIndex) => {
        if (typeof kind === 'string' && kind.trim() && !allowedEvidenceKinds.includes(kind)) {
          issues.push(issue('blocking', 'objectiveCoverageEvidenceKindInvalid', id, `requiredEvidence[${kindIndex}] must be one of ${allowedEvidenceKinds.join(', ')}`));
        }
      });
    }
  });
  return issues;
}

function objectiveCoverageContractShapeIssues(contract, issue = () => ({})) {
  if (contract === undefined || contract === null) {
    return [issue('blocking', 'objectiveCoverageContractInvalid', 'objectiveCoverageContract', 'objectiveCoverageContract is required')];
  }
  if (!isPlainObject(contract)) {
    return [issue('blocking', 'objectiveCoverageContractInvalid', 'objectiveCoverageContract', 'objectiveCoverageContract must be an object')];
  }
  return stringArrayShapeIssues('objectiveCoverageContract', contract, 'requiredObjectiveIds', { allowEmpty: false }, issue)
    .map(item => Object.assign({}, item, { type: item.type.replace('testProfileGateArray', 'objectiveCoverageContractArray') }));
}

function objectiveCoverageRequiredIdIssues(objectives = [], contract = {}, issue = () => ({})) {
  const objectiveIds = (Array.isArray(objectives) ? objectives : [])
    .map(objective => objective && objective.id)
    .filter(id => typeof id === 'string' && id.trim());
  const requiredIds = Array.isArray(contract.requiredObjectiveIds)
    ? contract.requiredObjectiveIds.filter(id => typeof id === 'string' && id.trim())
    : [];
  const objectiveSet = new Set(objectiveIds);
  const requiredSet = new Set(requiredIds);
  const missing = requiredIds.filter(id => !objectiveSet.has(id));
  const unexpected = objectiveIds.filter(id => !requiredSet.has(id));
  return [
    ...missing.map(id =>
      issue('blocking', 'objectiveCoverageRequiredMissing', id, `objectiveCoverage is missing required objective id: ${id}`)
    ),
    ...unexpected.map(id =>
      issue('blocking', 'objectiveCoverageUnexpected', id, `objectiveCoverage has objective id not listed in requiredObjectiveIds: ${id}`)
    )
  ];
}

module.exports = {
  OBJECTIVE_EVIDENCE_KINDS,
  objectiveCoverageContractShapeIssues,
  objectiveCoverageRequiredIdIssues,
  objectiveCoverageShapeIssues
};

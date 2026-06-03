const {
  objectiveCoverageContractShapeIssues,
  objectiveCoverageRequiredIdIssues,
  objectiveCoverageShapeIssues
} = require('./hardening-objective-contract-shapes');
const {
  taskEvidenceShapeIssues,
  taskPriorityIssues,
  taskRequiredFieldIssues
} = require('./hardening-task-contract-shapes');

function sameStringArray(left = [], right = []) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function matrixTopLevelShapeIssues(matrix = {}, issue = () => ({})) {
  const issues = [];
  ['tasks', 'deliveryGates', 'moduleBudgets', 'testProfileGates', 'objectiveCoverage'].forEach(field => {
    if (!Array.isArray(matrix[field])) {
      issues.push(issue('blocking', 'matrixTopLevelFieldInvalid', 'matrix', `${field} must be an array`));
      return;
    }
    if (matrix[field].length === 0) {
      issues.push(issue('blocking', 'matrixTopLevelFieldInvalid', 'matrix', `${field} must not be empty`));
    }
  });
  if (!isPlainObject(matrix.qualityModes)) {
    issues.push(issue('blocking', 'matrixTopLevelFieldInvalid', 'matrix', 'qualityModes must be an object'));
  } else if (Object.keys(matrix.qualityModes).length === 0) {
    issues.push(issue('blocking', 'matrixTopLevelFieldInvalid', 'matrix', 'qualityModes must not be empty'));
  }
  if (!isPlainObject(matrix.objectiveCoverageContract)) {
    issues.push(issue('blocking', 'matrixTopLevelFieldInvalid', 'matrix', 'objectiveCoverageContract must be an object'));
  } else if (Object.keys(matrix.objectiveCoverageContract).length === 0) {
    issues.push(issue('blocking', 'matrixTopLevelFieldInvalid', 'matrix', 'objectiveCoverageContract must not be empty'));
  }
  return issues;
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

function duplicateIdIssues(items = [], opts = {}, issue = () => ({})) {
  const collection = opts.collection || 'collection';
  const type = opts.type || 'collectionIdDuplicate';
  const seen = new Set();
  const duplicates = new Set();
  (Array.isArray(items) ? items : []).forEach(item => {
    const id = item && item.id;
    if (typeof id !== 'string' || !id.trim()) return;
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  });
  return [...duplicates].sort().map(id =>
    issue('blocking', type, id, `${collection} id appears more than once: ${id}`)
  );
}

function deliveryGateShapeIssues(gates = [], issue = () => ({})) {
  const issues = [];
  (Array.isArray(gates) ? gates : []).forEach((gate, index) => {
    const id = gate.id || `deliveryGate[${index}]`;
    if (typeof gate.id !== 'string' || !gate.id.trim()) {
      issues.push(issue('blocking', 'deliveryGateFieldInvalid', id, 'id must be a non-empty string'));
    }
    if (gate.required !== undefined && typeof gate.required !== 'boolean') {
      issues.push(issue('blocking', 'deliveryGateFieldInvalid', id, 'required must be a boolean when provided'));
    }
    if (typeof gate.command !== 'string' || !gate.command.trim()) {
      issues.push(issue('blocking', 'deliveryGateFieldInvalid', id, 'command must be a non-empty string'));
    }
    if (!Array.isArray(gate.artifacts)) {
      issues.push(issue('blocking', 'deliveryGateArtifactsInvalid', id, 'artifacts must be an array'));
      return;
    }
    if (gate.artifacts.length === 0) {
      issues.push(issue('blocking', 'deliveryGateArtifactsInvalid', id, 'artifacts must not be empty'));
    }
    gate.artifacts.forEach((artifact, artifactIndex) => {
      if (typeof artifact !== 'string' || !artifact.trim()) {
        issues.push(issue('blocking', 'deliveryGateArtifactInvalid', id, `artifacts[${artifactIndex}] must be a non-empty string`));
      }
    });
  });
  return issues;
}

function moduleBudgetShapeIssues(budgets = [], issue = () => ({})) {
  const issues = [];
  (Array.isArray(budgets) ? budgets : []).forEach((budget, index) => {
    const id = budget.id || `moduleBudget[${index}]`;
    if (typeof budget.id !== 'string' || !budget.id.trim()) {
      issues.push(issue('blocking', 'moduleBudgetFieldInvalid', id, 'id must be a non-empty string'));
    }
    if (typeof budget.title !== 'string' || !budget.title.trim()) {
      issues.push(issue('blocking', 'moduleBudgetFieldInvalid', id, 'title must be a non-empty string'));
    }
    if (!Number.isInteger(budget.maxLines) || budget.maxLines <= 0) {
      issues.push(issue('blocking', 'moduleBudgetFieldInvalid', id, 'maxLines must be a positive integer'));
    }
    const hasFiles = Array.isArray(budget.files);
    const hasDirectories = Array.isArray(budget.directories);
    if (!hasFiles && !hasDirectories) {
      issues.push(issue('blocking', 'moduleBudgetSourcesMissing', id, 'files or directories is required'));
    }
    if (hasFiles) {
      if (budget.files.length === 0) {
        issues.push(issue('blocking', 'moduleBudgetSourcesMissing', id, 'files must not be empty when provided'));
      }
      budget.files.forEach((file, fileIndex) => {
        if (typeof file !== 'string' || !file.trim()) {
          issues.push(issue('blocking', 'moduleBudgetFileInvalid', id, `files[${fileIndex}] must be a non-empty string`));
        }
      });
    }
    if (hasDirectories) {
      if (budget.directories.length === 0) {
        issues.push(issue('blocking', 'moduleBudgetSourcesMissing', id, 'directories must not be empty when provided'));
      }
      budget.directories.forEach((directory, directoryIndex) => {
        const config = typeof directory === 'string' ? { path: directory } : (directory || {});
        if (typeof config.path !== 'string' || !config.path.trim()) {
          issues.push(issue('blocking', 'moduleBudgetDirectoryInvalid', id, `directories[${directoryIndex}].path must be a non-empty string`));
        }
        if (config.extension !== undefined && (typeof config.extension !== 'string' || !config.extension.trim())) {
          issues.push(issue('blocking', 'moduleBudgetDirectoryInvalid', id, `directories[${directoryIndex}].extension must be a non-empty string`));
        }
      });
    }
    if (budget.requireClosureRoots !== undefined) {
      issues.push(...stringArrayShapeIssues(id, budget, 'requireClosureRoots', { allowEmpty: false }, issue)
        .map(item => Object.assign({}, item, { type: item.type.replace('testProfileGateArray', 'moduleBudgetArray') })));
    }
  });
  return issues;
}

function testProfileGateShapeIssues(gates = [], issue = () => ({})) {
  const issues = [];
  (Array.isArray(gates) ? gates : []).forEach((gate, index) => {
    const id = gate.id || `testProfileGate[${index}]`;
    if (typeof gate.id !== 'string' || !gate.id.trim()) {
      issues.push(issue('blocking', 'testProfileGateFieldInvalid', id, 'id must be a non-empty string'));
    }
    if (gate.required !== undefined && typeof gate.required !== 'boolean') {
      issues.push(issue('blocking', 'testProfileGateFieldInvalid', id, 'required must be a boolean when provided'));
    }
    if (typeof gate.expectedFallbackToFull !== 'boolean') {
      issues.push(issue('blocking', 'testProfileGateFieldInvalid', id, 'expectedFallbackToFull must be a boolean'));
    }
    issues.push(...stringArrayShapeIssues(id, gate, 'changedFiles', { allowEmpty: false }, issue));
    issues.push(...stringArrayShapeIssues(id, gate, 'expectedRuleIds', { allowEmpty: true }, issue));
    issues.push(...stringArrayShapeIssues(id, gate, 'expectedGroups', { allowEmpty: false }, issue));
    issues.push(...stringArrayShapeIssues(id, gate, 'expectedCommands', { allowEmpty: false }, issue));
  });
  return issues;
}

function testProfileGateCoverageShapeIssues(coverage, issue = () => ({})) {
  if (coverage === undefined || coverage === null) return [];
  if (!isPlainObject(coverage)) {
    return [issue('blocking', 'testProfileGateCoverageInvalid', 'testProfileGateCoverage', 'testProfileGateCoverage must be an object when provided')];
  }
  return stringArrayShapeIssues('testProfileGateCoverage', coverage, 'requiredGateIds', { allowEmpty: false }, issue)
    .map(item => Object.assign({}, item, { type: item.type.replace('testProfileGateArray', 'testProfileGateCoverage') }));
}

module.exports = {
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
};

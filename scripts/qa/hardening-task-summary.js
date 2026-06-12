const {
  PRIORITY_VALUES,
  STATUS_VALUES,
  commandLooksAvailable,
  exists
} = require('./hardening-readiness-environment');
const {
  evidenceGapsForState,
  stringArrayField,
  taskEvidenceState,
  taskEvidenceStrength
} = require('./hardening-evidence-state');

function readinessIssue(level, type, id, message, extra = {}) {
  return { level, type, id, message, ...extra };
}

function summarizeReadinessTasks(matrix = {}, opts = {}) {
  const issue = opts.issue || readinessIssue;
  const priorityValues = Array.isArray(opts.priorityValues) ? opts.priorityValues : PRIORITY_VALUES;
  const statusValues = Array.isArray(opts.statusValues) ? opts.statusValues : STATUS_VALUES;
  const backlogIds = Array.isArray(opts.backlogIds) ? opts.backlogIds : [];
  const tasks = Array.isArray(matrix.tasks) ? matrix.tasks : [];
  const ids = tasks.map(task => task.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  const missingBacklogIds = backlogIds.filter(id => !ids.includes(id));
  const extraIds = ids.filter(id => !backlogIds.includes(id));
  const totals = {};
  const evidenceStrength = { strong: 0, moderate: 0, partial: 0, weak: 0 };
  const issues = [];

  priorityValues.forEach(priority => {
    totals[priority] = { missing: 0, partial: 0, pass: 0 };
  });
  duplicates.forEach(id => issues.push(issue('blocking', 'duplicateTask', id, 'task appears more than once')));
  missingBacklogIds.forEach(id => issues.push(issue('blocking', 'backlogTaskMissing', id, 'task from backlog is not represented in readiness matrix')));
  extraIds.forEach(id => issues.push(issue('review', 'extraTask', id, 'task is not present in source backlog headings')));

  tasks.forEach(task => {
    const result = auditTaskEvidence(task, issues);
    evidenceStrength[result.strength] = (evidenceStrength[result.strength] || 0) + 1;
    if (!totals[result.priority]) totals[result.priority] = { missing: 0, partial: 0, pass: 0 };
    totals[result.priority][result.status] += 1;
    if (!statusValues.includes(task.status)) {
      issues.push(issue('blocking', 'invalidStatus', task.id, `status must be one of ${statusValues.join(', ')}`));
    }
    if (!task.owner) {
      issues.push(issue(result.priority === 'P0' ? 'blocking' : 'review', 'ownerMissing', task.id, 'task owner is required'));
    }
  });

  return {
    tasks,
    ids,
    duplicates,
    backlogIds,
    missingBacklogIds,
    extraIds,
    totals,
    evidenceStrength,
    issues
  };
}

function taskRows(tasks = []) {
  return tasks.map(task => {
    const evidenceStrength = taskEvidenceStrength(task, { commandLooksAvailable, exists });
    const evidenceState = taskEvidenceState(task, { commandLooksAvailable, exists });
    const evidenceGaps = evidenceGapsForState(evidenceState);
    return {
      id: task.id,
      priority: task.priority,
      title: task.title,
      status: task.status,
      evidenceStrength,
      evidenceState,
      evidenceComplete: evidenceGaps.length === 0,
      evidenceGaps,
      owner: task.owner,
      tests: stringArrayField(task, 'tests'),
      renderedProof: stringArrayField(task, 'renderedProof'),
      remainingGaps: stringArrayField(task, 'remainingGaps')
    };
  });
}

function auditTaskEvidence(task = {}, issues = []) {
  const status = STATUS_VALUES.includes(task.status) ? task.status : 'missing';
  const priority = task.priority || String(task.id || '').slice(0, 2);
  const strength = taskEvidenceStrength(task, { commandLooksAvailable, exists });
  const files = stringArrayField(task, 'files');
  const renderedProof = stringArrayField(task, 'renderedProof');
  const remainingGaps = stringArrayField(task, 'remainingGaps');
  const tests = stringArrayField(task, 'tests');
  files.forEach(file => {
    if (!exists(file)) {
      issues.push(readinessIssue(status === 'pass' || priority === 'P0' ? 'blocking' : 'review', 'evidenceFileMissing', task.id, `evidence file missing: ${file}`));
    }
  });
  tests.forEach(command => {
    if (!commandLooksAvailable(command)) {
      issues.push(readinessIssue(status === 'pass' || priority === 'P0' ? 'blocking' : 'review', 'testCommandUnavailable', task.id, `test command is not backed by an existing script: ${command}`));
    }
  });
  renderedProof.forEach(file => {
    if (!exists(file)) {
      issues.push(readinessIssue(status === 'pass' || priority === 'P0' ? 'blocking' : 'review', 'renderedProofMissing', task.id, `rendered proof missing: ${file}`));
    }
  });
  if (priority === 'P0' && status !== 'pass') {
    issues.push(readinessIssue('blocking', 'p0NotPass', task.id, `P0 task is ${status}, not pass`));
  }
  if (priority === 'P0' && !tests.length) {
    issues.push(readinessIssue('blocking', 'p0TestMissing', task.id, 'P0 task must list at least one automated test'));
  }
  if (status === 'pass' && task.affectsVisualOutput && !renderedProof.length) {
    issues.push(readinessIssue(priority === 'P0' ? 'blocking' : 'review', 'visualProofMissing', task.id, 'visual-affecting pass task must list rendered proof'));
  }
  if (status === 'pass' && strength !== 'strong') {
    issues.push(readinessIssue('review', 'evidenceStrengthNotStrong', task.id, `pass task evidence strength is ${strength}`));
  }
  if (status === 'pass' && remainingGaps.length) {
    issues.push(readinessIssue(priority === 'P0' ? 'blocking' : 'review', 'passTaskHasRemainingGaps', task.id, 'pass task should not list remaining gaps'));
  }
  return { priority, status, strength };
}

module.exports = {
  auditTaskEvidence,
  readinessIssue,
  summarizeReadinessTasks,
  taskRows
};

function taskPriorityIssues(tasks = [], opts = {}, issue = () => ({})) {
  const allowedPriorities = Array.isArray(opts.allowedPriorities) ? opts.allowedPriorities : [];
  const issues = [];
  (Array.isArray(tasks) ? tasks : []).forEach((task, index) => {
    const id = task.id || `task[${index}]`;
    const priority = task.priority || '';
    const idMatch = String(id).match(/^(P\d)-\d{2}$/);
    if (!idMatch) {
      issues.push(issue('blocking', 'taskIdInvalid', id, `task id must match P#-##: ${id}`));
      return;
    }
    if (allowedPriorities.length && !allowedPriorities.includes(priority)) {
      issues.push(issue('blocking', 'taskPriorityInvalid', id, `task priority must be one of ${allowedPriorities.join(', ')}`));
      return;
    }
    if (priority !== idMatch[1]) {
      issues.push(issue('blocking', 'taskPriorityMismatch', id, `task priority ${priority} must match id prefix ${idMatch[1]}`));
    }
  });
  return issues;
}

function taskRequiredFieldIssues(tasks = [], opts = {}, issue = () => ({})) {
  const allowedStatuses = Array.isArray(opts.allowedStatuses) ? opts.allowedStatuses : [];
  const issues = [];
  const stringFields = ['id', 'priority', 'title', 'owner', 'status'];
  const arrayFields = ['files', 'tests', 'renderedProof', 'remainingGaps'];
  (Array.isArray(tasks) ? tasks : []).forEach((task, index) => {
    const id = task.id || `task[${index}]`;
    stringFields.forEach(field => {
      if (typeof task[field] !== 'string' || !task[field].trim()) {
        issues.push(issue('blocking', 'taskRequiredFieldInvalid', id, `${field} must be a non-empty string`));
      }
    });
    if (allowedStatuses.length && !allowedStatuses.includes(task.status)) {
      issues.push(issue('blocking', 'invalidStatus', id, `status must be one of ${allowedStatuses.join(', ')}`));
    }
    if (typeof task.affectsVisualOutput !== 'boolean') {
      issues.push(issue('blocking', 'taskRequiredFieldInvalid', id, 'affectsVisualOutput must be a boolean'));
    }
    arrayFields.forEach(field => {
      if (task[field] === undefined) {
        issues.push(issue('blocking', 'taskRequiredFieldMissing', id, `${field} is required`));
      }
    });
  });
  return issues;
}

function taskEvidenceShapeIssues(tasks = [], issue = () => ({})) {
  const issues = [];
  const arrayFields = ['files', 'tests', 'renderedProof', 'remainingGaps'];
  (Array.isArray(tasks) ? tasks : []).forEach((task, index) => {
    const id = task.id || `task[${index}]`;
    arrayFields.forEach(field => {
      if (task[field] === undefined) return;
      if (!Array.isArray(task[field])) {
        issues.push(issue('blocking', 'taskEvidenceFieldNotArray', id, `${field} must be an array`));
        return;
      }
      task[field].forEach((value, valueIndex) => {
        if (typeof value !== 'string') {
          issues.push(issue('blocking', 'taskEvidenceFieldItemInvalid', id, `${field}[${valueIndex}] must be a string`));
        }
      });
    });
  });
  return issues;
}

module.exports = {
  taskEvidenceShapeIssues,
  taskPriorityIssues,
  taskRequiredFieldIssues
};

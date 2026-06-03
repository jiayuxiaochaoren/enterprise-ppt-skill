function evidenceStatus(pass, partial = false) {
  if (pass) return 'pass';
  if (partial) return 'partial';
  return 'missing';
}

function stringArrayField(object = {}, field = '') {
  return Array.isArray(object[field]) ? object[field] : [];
}

function taskEvidenceStrength(task = {}, opts = {}) {
  const tests = stringArrayField(task, 'tests');
  const renderedProof = stringArrayField(task, 'renderedProof');
  const commandLooksAvailable = opts.commandLooksAvailable || (() => false);
  const exists = opts.exists || (() => false);
  const testsAvailable = tests.length > 0 && tests.every(commandLooksAvailable);
  const visualProofRequired = task.affectsVisualOutput === true;
  const renderedProofAvailable = !visualProofRequired || renderedProof.some(exists);
  if (task.status === 'pass' && testsAvailable && renderedProofAvailable) return 'strong';
  if (task.status === 'pass' && testsAvailable) return 'moderate';
  if (task.status === 'partial' && testsAvailable) return 'partial';
  return 'weak';
}

function taskEvidenceState(task = {}, opts = {}) {
  const exists = opts.exists || (() => false);
  const commandLooksAvailable = opts.commandLooksAvailable || (() => false);
  const files = stringArrayField(task, 'files');
  const tests = stringArrayField(task, 'tests');
  const renderedProof = stringArrayField(task, 'renderedProof');
  const codeFiles = files.filter(file => /^scripts\//.test(file) && !/\/?test_/.test(file));
  const fileEvidence = files.filter(exists);
  const codeEvidence = codeFiles.filter(exists);
  const testsAvailable = tests.filter(commandLooksAvailable);
  const renderedProofAvailable = renderedProof.filter(exists);
  const text = [
    task.id,
    task.title,
    task.owner,
    ...files,
    ...tests,
    ...renderedProof
  ].join(' ');
  const renderMetaRelevant = /render[-_ ]?meta|metadata|drawn|component|consumption|asset decision|asset-decision|text shrink|blank|visual qa|content[-_ ]?coverage|content_coverage/i.test(text);
  const renderMetaEvidence = /render[-_ ]?meta|render_meta|render-meta-audits|visual_qa|generate_pptx|assetDecision|drawnComponents|textBoxes|content_coverage|test_asset_decision_gate|test_template_page_family_fixtures|template-readiness-matrix/i.test(text);
  return {
    codePath: evidenceStatus(codeEvidence.length > 0, fileEvidence.length > 0),
    renderMeta: renderMetaRelevant ? evidenceStatus(renderMetaEvidence, /visual_qa|generate_pptx/.test(text)) : 'not_applicable',
    automatedQa: evidenceStatus(tests.length > 0 && testsAvailable.length === tests.length, testsAvailable.length > 0),
    renderedProof: task.affectsVisualOutput
      ? evidenceStatus(renderedProof.length > 0 && renderedProofAvailable.length > 0)
      : 'not_applicable'
  };
}

function evidenceGapsForState(state = {}) {
  return Object.entries(state)
    .filter(([, status]) => status === 'missing' || status === 'partial')
    .map(([kind, status]) => `${kind}:${status}`);
}

function evidenceStateTotals(tasks = [], opts = {}) {
  const totals = {};
  ['codePath', 'renderMeta', 'automatedQa', 'renderedProof'].forEach(kind => {
    totals[kind] = { pass: 0, partial: 0, missing: 0, not_applicable: 0 };
  });
  tasks.forEach(task => {
    const state = taskEvidenceState(task, opts);
    Object.entries(state).forEach(([kind, status]) => {
      totals[kind][status] = (totals[kind][status] || 0) + 1;
    });
  });
  return totals;
}

module.exports = {
  evidenceGapsForState,
  evidenceStateTotals,
  evidenceStatus,
  stringArrayField,
  taskEvidenceState,
  taskEvidenceStrength
};

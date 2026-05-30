function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeModelResults(raw = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { value:null, errors:['model results must be a JSON object'] };
  }
  const value = {
    sourceAudit: raw.sourceAudit || raw.source_audit || raw.audit || null,
    storyPlan: raw.storyPlan || raw.story_plan || raw.storyArchitecture || raw.story_architecture || null,
    extraction: raw.extraction || raw.materialExtraction || raw.material_extraction || null,
    critic: raw.critic || raw.modelCritic || raw.model_critic || null
  };
  const errors = [];
  Object.entries(value).forEach(([key, stage]) => {
    if (stage != null && (typeof stage !== 'object' || Array.isArray(stage))) {
      errors.push(`${key} must be an object when provided`);
    }
  });
  if (!Object.values(value).some(Boolean)) {
    errors.push('model results must include at least one supported stage: sourceAudit, storyPlan, extraction, critic');
  }
  if (value.extraction && value.extraction.version && value.extraction.version !== 'material-extraction/v1') {
    errors.push('extraction.version must be material-extraction/v1');
  }
  return { value, errors };
}

function criticFindings(critic = {}) {
  if (!critic || typeof critic !== 'object') return [];
  return [
    ...asArray(critic.blocking),
    ...asArray(critic.findings),
    ...asArray(critic.issues),
    ...asArray(critic.risks)
  ].filter(Boolean).map((item, i) => {
    if (typeof item === 'string') return { id:`critic-${i + 1}`, severity:'review', message:item };
    return Object.assign({ id:item.id || `critic-${i + 1}` }, item);
  });
}

function criticBlockingFindings(critic = {}) {
  const status = String((critic && (critic.status || critic.verdict || critic.result)) || '').toLowerCase();
  const forcedBlock = /block|fail|reject/.test(status);
  return criticFindings(critic).filter(item => {
    const severity = String(item.severity || item.level || item.priority || '').toLowerCase();
    const type = String(item.type || item.category || '').toLowerCase();
    return forcedBlock ||
      item.blocking === true ||
      /block|fail|critical|high/.test(severity) ||
      /fabricat|unsupported|authorization|source|privacy|legal/.test(type);
  });
}

module.exports = {
  criticBlockingFindings,
  criticFindings,
  normalizeModelResults
};

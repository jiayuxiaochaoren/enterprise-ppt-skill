const {
  imageProofEligibility,
  imageProvenanceClass
} = require('../design/source-evidence');

function compactFirst(values = [], fallback = '') {
  const filtered = values.map(value => String(value || '').trim()).filter(Boolean);
  if (!filtered.length) return fallback;
  const unique = Array.from(new Set(filtered));
  return unique.length === 1 ? unique[0] : 'mixed';
}

function criticalRole(role = '') {
  return /evidence|proof|product|site|screenshot|certificate|showcase|gallery/i.test(String(role || ''));
}

function actionForAssetDecision(input = {}) {
  const { generation = {}, refs = [], status = '', mode = '', slide = {} } = input;
  const explicit = generation.action || generation.decision || generation.assetDecisionAction || generation.asset_decision_action || '';
  if (explicit) return String(explicit);
  if (status === 'blocked') return 'block_asset_generation';
  if (refs.length || status === 'bound' || mode === 'bound') return 'bound_asset';
  if (mode === 'structure-only' && /skip|结构|native structure/i.test(String(generation.reason || ''))) return 'skip_image';
  if (slide.generatedAssetPrompt || mode === 'pending-generation') return 'auto_generate_pending';
  if (status === 'required' || generation.mustBind) return 'auto_generate_required';
  if (status === 'optional') return 'auto_generate_optional';
  return 'structure_only';
}

function riskLevelForAssetDecision(input = {}) {
  const { action = '', generation = {}, role = '', status = '', refs = [] } = input;
  const explicit = generation.riskLevel || generation.risk_level || generation.risk || '';
  if (explicit) return String(explicit);
  if (generation.staleForRoute || generation.previousDecisionStale) return 'high';
  if (status === 'blocked') return 'high';
  if (action === 'skip_image' && criticalRole(role)) return 'high';
  if ((status === 'required' || generation.mustBind) && !refs.length) return 'medium';
  if (generation.syntheticOnly) return criticalRole(role) ? 'medium' : 'low';
  return 'low';
}

function provenanceSummary(input = {}) {
  const { generation = {}, provenance = [], refs = [], slide = {} } = input;
  const provenanceClass = compactFirst(
    provenance.map(imageProvenanceClass),
    refs.length ? 'unknown-bound' : (generation.syntheticOnly || slide.generatedAssetPrompt ? 'model-generated-preview' : 'none')
  );
  const proofEligibility = compactFirst(
    provenance.map(imageProofEligibility),
    generation.syntheticOnly || slide.generatedAssetPrompt ? 'synthetic-only' : (refs.length ? 'unknown' : 'none')
  );
  return { provenanceClass, proofEligibility };
}

function enrichAssetDecision(input = {}) {
  const {
    generation = {},
    provenance = [],
    refs = [],
    role = '',
    slide = {},
    status = '',
    mode = '',
    trace = {}
  } = input;
  const action = actionForAssetDecision({ generation, refs, status, mode, slide });
  const provenanceBase = provenanceSummary({ generation, provenance, refs, slide });
  const provenanceClass = action === 'skip_image' && !refs.length ? 'none' : provenanceBase.provenanceClass;
  const proofEligibility = action === 'skip_image' && !refs.length ? 'none' : provenanceBase.proofEligibility;
  const originalRole = generation.originalRole || generation.original_role ||
    (slide.previousAssetGeneration && slide.previousAssetGeneration.role) ||
    (slide.previousVisualRole || '') ||
    role;
  const resolvedRole = generation.resolvedRole || generation.resolved_role || role;
  const riskLevel = riskLevelForAssetDecision({ action, generation, role: resolvedRole, status, refs });
  return {
    action,
    originalRole: originalRole || '',
    resolvedRole: resolvedRole || '',
    riskLevel,
    source: generation.source || generation.decisionSource || generation.decision_source || trace.assetDecisionSource || 'renderer-inferred',
    provenanceClass,
    proofEligibilitySummary: proofEligibility,
    skippedCriticalVisual: action === 'skip_image' && criticalRole(originalRole || resolvedRole),
    reviewRequired: riskLevel === 'high' || (criticalRole(originalRole || resolvedRole) && ['synthetic-only', 'unknown'].includes(proofEligibility))
  };
}

module.exports = {
  actionForAssetDecision,
  criticalRole,
  enrichAssetDecision,
  provenanceSummary,
  riskLevelForAssetDecision
};

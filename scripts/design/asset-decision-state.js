const ASSET_DECISION_STATE_VERSION = 'asset-decision-state/v1';

const ASSET_DECISION_STATES = Object.freeze([
  'none',
  'optional',
  'required',
  'factual-required',
  'decision-required',
  'bound',
  'blocked',
  'structure-only'
]);

const FACTUAL_ASSET_ACTIONS = Object.freeze(['provide_assets', 'skip_image']);
const SYNTHETIC_ASSET_ACTIONS = Object.freeze(['provide_assets', 'auto_generate', 'skip_image']);

function truthy(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function assetDecisionStateFor(input = {}) {
  const statusHint = String(input.statusHint || input.status || '').toLowerCase();
  const factual = truthy(input.factual) || truthy(input.factualRequired) || truthy(input.factualRisk);
  const structureOnly = truthy(input.structureOnly) || statusHint === 'structure-only';
  const hasBoundAsset = truthy(input.hasBoundAsset) || truthy(input.bound) || statusHint === 'bound';
  const mustBind = truthy(input.mustBind) || statusHint === 'required' || statusHint === 'decision-required';
  let status = statusHint && ASSET_DECISION_STATES.includes(statusHint) ? statusHint : '';
  if (hasBoundAsset) status = 'bound';
  else if (structureOnly) status = 'structure-only';
  else if (truthy(input.blocked) || statusHint === 'blocked') status = 'blocked';
  else if (factual && (mustBind || truthy(input.requested))) status = 'factual-required';
  else if (statusHint === 'required' || mustBind) status = 'required';
  else if (statusHint === 'optional' || truthy(input.optional)) status = 'optional';
  else status = 'none';

  const needsUserDecision = ['required', 'optional', 'factual-required', 'decision-required', 'blocked'].includes(status);
  const allowedActions = needsUserDecision
    ? (factual || status === 'factual-required' || status === 'blocked' ? FACTUAL_ASSET_ACTIONS : SYNTHETIC_ASSET_ACTIONS)
    : [];
  const canAutoGenerate = allowedActions.includes('auto_generate');
  const blocking = ['required', 'factual-required', 'decision-required', 'blocked'].includes(status);
  const recommendedAction = !needsUserDecision
    ? ''
    : (canAutoGenerate && status !== 'blocked' ? 'auto_generate' : 'provide_assets');

  return {
    version: ASSET_DECISION_STATE_VERSION,
    status,
    allowedActions,
    recommendedAction,
    blocking,
    canAutoGenerate,
    needsUserDecision,
    mustBind: blocking,
    structureOnly: status === 'structure-only',
    factual: factual || status === 'factual-required' || status === 'blocked',
    targetSlot: input.targetSlot || (input.target && input.target.slot) || '',
    reason: input.reason || ''
  };
}

function withAssetDecisionState(policy = {}, context = {}) {
  const state = assetDecisionStateFor(Object.assign({}, context, policy, {
    statusHint: policy.status || context.statusHint || context.status
  }));
  return Object.assign({}, policy, {
    assetDecisionState: state,
    assetDecisionStatus: state.status,
    allowedActions: state.allowedActions,
    canAutoGenerate: state.canAutoGenerate,
    needsAssetDecision: state.needsUserDecision
  });
}

module.exports = {
  ASSET_DECISION_STATE_VERSION,
  ASSET_DECISION_STATES,
  FACTUAL_ASSET_ACTIONS,
  SYNTHETIC_ASSET_ACTIONS,
  assetDecisionStateFor,
  withAssetDecisionState
};

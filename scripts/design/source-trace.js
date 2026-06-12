const {
  createSourceTraceAuditHelpers
} = require('./source-trace-audit');
const {
  createSourceTraceCoreHelpers
} = require('./source-trace-core');

function createSourceTraceHelpers(deps = {}) {
  const core = createSourceTraceCoreHelpers(deps);
  const audit = createSourceTraceAuditHelpers(Object.assign({}, deps, core));

  return {
    applyPlanAuthoredSourceTrace: core.applyPlanAuthoredSourceTrace,
    assetAuthorizationGate: audit.assetAuthorizationGate,
    imageRefsForSlide: core.imageRefsForSlide,
    normalizeAuthorizationStatus: audit.normalizeAuthorizationStatus,
    planAuthoredSourceTrace: core.planAuthoredSourceTrace,
    preferredProofObjectIdForTrace: core.preferredProofObjectIdForTrace,
    sourceEntriesForSlide: core.sourceEntriesForSlide,
    sourceTraceAudit: audit.sourceTraceAudit,
    sourceTraceForSlide: core.sourceTraceForSlide,
    sourceTraceIsPlanAuthored: core.sourceTraceIsPlanAuthored,
    sourceTracePolicyForPlan: core.sourceTracePolicyForPlan,
    sourceTracePolicyMode: core.sourceTracePolicyMode
  };
}

module.exports = {
  createSourceTraceHelpers
};

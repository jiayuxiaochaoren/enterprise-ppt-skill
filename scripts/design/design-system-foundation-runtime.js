const {
  createFoundationRuntimeParts
} = require('./design-system-foundation-runtime-assembly');

function createDesignSystemFoundationRuntime({
  normalizeDeckPlan = plan => plan
} = {}) {
  return createFoundationRuntimeParts({ normalizeDeckPlan });
}

module.exports = {
  createDesignSystemFoundationRuntime
};

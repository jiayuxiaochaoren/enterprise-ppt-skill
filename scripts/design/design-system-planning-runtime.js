const {
  createPlanningRuntimeAssembly
} = require('./design-system-planning-runtime-assembly');

function createDesignSystemPlanningRuntime(deps = {}) {
  return createPlanningRuntimeAssembly(deps);
}

module.exports = {
  createDesignSystemPlanningRuntime
};

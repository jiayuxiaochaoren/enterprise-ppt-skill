const family = "risk";

const types = ["table", "risk-table"];

const {
  createRiskBoardRenderers
} = require('./risk-boards');

function createRiskRenderers(ctx = {}) {
  return createRiskBoardRenderers(ctx);
}
function entries(renderers = {}) {
  return [
    { types, render:renderers.riskAdaptive, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createRiskRenderers,
  entries
};

const {
  applyClarificationAnswers,
  buildClarificationGate
} = require('./material/clarification');
const {
  buildModelPrompt,
  bundleForPrompt,
  extractionSchema,
  referenceContextForPrompt
} = require('./material/extraction-schema');
const {
  compileDeckPlan,
  validateExtraction
} = require('./material/deck-plan-compiler');
const {
  detectIndustry,
  ingestMaterials
} = require('./material/ingest');
const {
  readJson,
  writeJson
} = require('./material/common');

module.exports = {
  applyClarificationAnswers,
  buildClarificationGate,
  buildModelPrompt,
  bundleForPrompt,
  compileDeckPlan,
  detectIndustry,
  extractionSchema,
  ingestMaterials,
  readJson,
  referenceContextForPrompt,
  validateExtraction,
  writeJson
};

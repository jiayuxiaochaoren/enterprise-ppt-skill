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
  extractionDepthFindings,
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
  extractionDepthFindings,
  extractionSchema,
  ingestMaterials,
  readJson,
  referenceContextForPrompt,
  validateExtraction,
  writeJson
};

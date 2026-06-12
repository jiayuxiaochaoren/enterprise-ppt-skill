const fs = require('fs');
const path = require('path');
const {
  criticBlockingFindings,
  normalizeModelResults
} = require('./model-results-contract');

function readJsonOrStdin(file, readJson) {
  if (!file) return null;
  if (file === '-') return JSON.parse(fs.readFileSync(0, 'utf8'));
  return readJson(path.resolve(file));
}

function writeModelStage(outDir, name, value, writeJson) {
  if (!value) return '';
  const file = path.join(outDir, `${name}.json`);
  writeJson(file, value);
  return file;
}

function applyStandardModelResults({
  opts = {},
  orchestrationDir = '',
  report = {},
  readJson,
  writeJson,
  rel
} = {}) {
  const raw = readJsonOrStdin(opts.modelResults, readJson);
  if (!raw) return;
  const normalized = normalizeModelResults(raw);
  if (normalized.errors.length) {
    report.status = 'invalid_model_results';
    report.risks = [...(report.risks || []), ...normalized.errors];
    report.nextActions.push('Fix --model-results JSON so it contains supported object stages: sourceAudit, storyPlan, extraction, critic.');
    report.modelResultsInvalid = true;
    return;
  }
  const { sourceAudit, storyPlan, extraction, critic } = normalized.value;
  const sourceAuditPath = !opts.sourceAudit ? writeModelStage(orchestrationDir, 'source-audit', sourceAudit, writeJson) : '';
  const storyPlanPath = !opts.storyPlan ? writeModelStage(orchestrationDir, 'story-architecture', storyPlan, writeJson) : '';
  const extractionPath = !opts.modelJson ? writeModelStage(orchestrationDir, 'material-extraction', extraction, writeJson) : '';
  const criticPath = writeModelStage(orchestrationDir, 'model-critic', critic, writeJson);
  if (sourceAuditPath) opts.sourceAudit = sourceAuditPath;
  if (storyPlanPath) opts.storyPlan = storyPlanPath;
  if (extractionPath) opts.modelJson = extractionPath;
  report.outputs.modelResults = rel(opts.modelResults === '-' ? orchestrationDir : opts.modelResults);
  if (criticPath) report.outputs.modelCritic = rel(criticPath);
  const blockers = criticBlockingFindings(critic);
  if (blockers.length) {
    report.status = 'critic_blocked';
    report.risks = [...(report.risks || []), ...blockers.map(item => item.message || item.title || item.type || item.id)];
    report.criticBlockingFindings = blockers;
    report.nextActions.push('Resolve blocking model critic findings before deck planning or external delivery.');
  }
}

module.exports = {
  applyStandardModelResults,
  readJsonOrStdin,
  writeModelStage
};

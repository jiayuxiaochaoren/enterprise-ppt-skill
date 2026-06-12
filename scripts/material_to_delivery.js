#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {
  compileDeckPlan,
  ingestMaterials,
  readJson,
  validateExtraction,
  writeJson
} = require('./material_pipeline');
const { buildDraftExtraction } = require('./material/draft-extraction');
const {
  applyStandardModelResults,
  readJsonOrStdin
} = require('./material/model-results-io');
const {
  createDeliveryCliRuntime,
  parseArgs,
  usage
} = require('./material/delivery-cli');
const {
  createInitialReport,
  prepareExtractionPath,
  resolveAssetStage
} = require('./material/delivery-stages');
const {
  assetDecisionSummary,
  parseJsonFromOutput
} = require('./reports/delivery-report');

const ROOT = path.resolve(__dirname, '..');
const { rel, runNode, writeReport } = createDeliveryCliRuntime({ root: ROOT, writeJson });

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.inputs.length) {
    usage();
    process.exit(opts.help ? 0 : 2);
  }
  const outDir = path.resolve(ROOT, opts.outDir);
  const orchestrationDir = path.join(outDir, 'model-orchestration');
  const previewDir = path.join(outDir, 'preview');
  fs.mkdirSync(outDir, { recursive: true });

  const report = createInitialReport(opts, rel, ROOT);

  const bundlePath = path.join(outDir, 'material-bundle.json');
  const ocrResults = opts.ocrJson ? readJsonOrStdin(opts.ocrJson, readJson) : null;
  const bundle = ingestMaterials(opts.inputs, { root: process.cwd(), ocrResults, ocrCommand: opts.ocrCommand });
  writeJson(bundlePath, bundle);
  report.outputs.materialBundle = rel(bundlePath);
  report.ocr = {
    providedCount: bundle.ingestReport ? bundle.ingestReport.ocrProvidedCount || 0 : 0,
    possibleMissingCount: bundle.ingestReport ? (bundle.ingestReport.possibleOcrMissing || []).length : 0,
    needsConfirmationCount: bundle.ingestReport && bundle.ingestReport.factReliability
      ? (bundle.ingestReport.factReliability.needsConfirmationFacts || []).length
      : 0
  };
  if (opts.ocrJson) report.outputs.ocrResults = opts.ocrJson === '-' ? 'stdin' : rel(opts.ocrJson);
  if (opts.ocrCommand) report.outputs.ocrCommand = opts.ocrCommand;

  const orchestration = runNode('orchestration prompts', [
    'scripts/material_orchestration_prompt.js',
    '--bundle',
    bundlePath,
    '--out-dir',
    orchestrationDir
  ]);
  report.steps.push(orchestration);
  report.outputs.orchestrationDir = rel(orchestrationDir);
  applyStandardModelResults({
    opts,
    orchestrationDir,
    report,
    readJson,
    writeJson,
    rel
  });
  if (report.modelResultsInvalid) {
    writeReport(outDir, report);
    process.exit(1);
  }
  if (report.status === 'critic_blocked') {
    writeReport(outDir, report);
    return;
  }

  if (opts.sourceAudit && opts.storyPlan) {
    const gatePath = path.join(orchestrationDir, 'clarification-gate.json');
    const gateArgs = [
      'scripts/material_clarification_gate.js',
      '--bundle',
      bundlePath,
      '--source-audit',
      path.resolve(opts.sourceAudit),
      '--story-plan',
      path.resolve(opts.storyPlan),
      '--out',
      gatePath
    ];
    if (opts.clarifications) gateArgs.push('--answers', path.resolve(opts.clarifications));
    const clarification = runNode('clarification gate', gateArgs);
    report.steps.push(clarification);
    report.outputs.clarificationGate = rel(gatePath);
    if (clarification.status === 'pass') {
      const gate = readJson(gatePath);
      if (gate.status === 'needs_user_input') {
        report.status = 'needs_clarification';
        report.nextActions.push('Ask the questions in clarification-gate.json, save answers, and rerun with --clarifications.');
        writeReport(outDir, report);
        return;
      }
    }
  }

  const extractionPath = prepareExtractionPath({
    opts,
    bundle,
    orchestrationDir,
    report,
    buildDraftExtraction,
    validateExtraction,
    writeJson,
    rel
  });
  if (!extractionPath) {
    writeReport(outDir, report);
    return;
  }

  const extraction = readJson(extractionPath);
  const extractionErrors = validateExtraction(extraction);
  if (extractionErrors.length) {
    report.status = 'invalid_extraction';
    report.nextActions.push(`Fix extraction JSON: ${extractionErrors.join('; ')}`);
    writeReport(outDir, report);
    process.exit(1);
  }

  let deckPlanPath = path.join(outDir, 'deck-plan.json');
  const plan = compileDeckPlan(extraction, bundle, { targetSlides: opts.targetSlides });
  writeJson(deckPlanPath, plan);
  report.outputs.deckPlan = rel(deckPlanPath);

  const assetStage = resolveAssetStage({
    deckPlanPath,
    opts,
    outDir,
    report,
    root: ROOT,
    rel
  });
  deckPlanPath = assetStage.deckPlanPath;
  if (assetStage.stop) {
    writeReport(outDir, report);
    return;
  }

  const pptxPath = path.join(outDir, 'deck.pptx');
  const generateStep = runNode('pptx generation', ['scripts/generate_pptx.js', deckPlanPath, pptxPath], { timeout: 180000 });
  report.steps.push(generateStep);
  report.outputs.pptx = rel(pptxPath);
  report.outputs.renderMeta = rel(`${pptxPath}.render-meta.json`);
  if (fs.existsSync(`${pptxPath}.render-meta.json`)) {
    report.assetDecisionSummary = assetDecisionSummary(readJson(`${pptxPath}.render-meta.json`));
  }
  if (generateStep.status === 'fail') {
    report.status = 'generation_failed';
    report.nextActions.push('Inspect PPTX generation stderr in delivery-report.json.');
    writeReport(outDir, report);
    process.exit(1);
  }

  const validateArgs = [
    'scripts/validate_pptx.js',
    pptxPath,
    '--quality-mode',
    opts.qualityMode,
    '--plan',
    deckPlanPath,
    '--summary'
  ];
  const visualQaForDraft = !(opts.autoDraft && opts.qualityMode === 'draft');
  if (visualQaForDraft) validateArgs.push('--run-visual-qa');
  else {
    validateArgs.push('--skip-visual-qa');
    report.nextActions.push('Auto-draft used structure-only validation; run formal visual QA after replacing draft extraction with model-reviewed content.');
  }
  if (!opts.skipPreview) validateArgs.push('--preview-dir', previewDir);
  if (opts.previewOptional || opts.skipPreview || opts.qualityMode !== 'delivery') validateArgs.push('--preview-optional');
  const validationStep = runNode('validation', validateArgs, { timeout: 180000 });
  report.steps.push(validationStep);
  report.outputs.validation = 'inline:steps.validation.stdout';
  try {
    const validationJson = parseJsonFromOutput(validationStep.stdout || '{}') || {};
    const validationSummary = validationJson.summary || validationJson;
    report.preview = validationSummary.preview || {};
    report.validationReport = validationSummary.report || null;
  } catch (_) {
    report.preview = { status:'unknown', provider:'none', error:'validation_stdout_parse_failed' };
  }
  if (validationStep.status === 'fail') {
    report.status = 'validation_failed';
    report.nextActions.push('Fix validation or visual QA findings before delivery.');
    writeReport(outDir, report);
    process.exit(1);
  }

  report.status = 'complete';
  report.nextActions.push('Review delivery-report.json and preview images before sharing externally.');
  writeReport(outDir, report);
}

try {
  main();
} catch (err) {
  console.error(err.stack || err.message || err);
  process.exit(1);
}

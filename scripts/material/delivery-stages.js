const path = require('path');
const { buildGateFromFiles } = require('../assets/decision-gate');
const { resolveVisualAssetsFromFiles } = require('../assets/resolution-facade');

function internalStep(label, command, payload = {}, status = 'pass') {
  return {
    label,
    command,
    status,
    stdout: JSON.stringify(payload),
    stderr: ''
  };
}

function createInitialReport(opts = {}, rel = file => file, root = process.cwd()) {
  const report = {
    version: 'material-to-delivery/v1',
    status: 'started',
    qualityMode: opts.qualityMode,
    inputs: (opts.inputs || []).map(input => rel(input)),
    steps: [],
    outputs: {},
    nextActions: [],
    summaryMarkdownPath: opts.summaryMd ? path.resolve(root, opts.summaryMd) : ''
  };
  if (report.summaryMarkdownPath) report.outputs.markdownSummary = rel(report.summaryMarkdownPath);
  return report;
}

function prepareExtractionPath({
  opts,
  bundle,
  orchestrationDir,
  report,
  buildDraftExtraction,
  validateExtraction,
  writeJson,
  rel
}) {
  let extractionPath = opts.modelJson ? path.resolve(opts.modelJson) : '';
  if (!extractionPath && opts.autoDraft && opts.qualityMode === 'draft') {
    extractionPath = path.join(orchestrationDir, 'material-extraction.draft.json');
    const draft = buildDraftExtraction(bundle, opts);
    const errors = validateExtraction(draft);
    if (errors.length) throw new Error(`auto draft extraction failed validation: ${errors.join('; ')}`);
    writeJson(extractionPath, draft);
    report.outputs.draftExtraction = rel(extractionPath);
    report.nextActions.push('Auto-draft extraction was used; replace it with model-reviewed material-extraction.json before external delivery.');
  } else if (!extractionPath && opts.autoDraft) {
    report.nextActions.push('Auto-draft extraction is draft-only; formal or delivery runs must use model-reviewed material-extraction.json via --model-json or --model-results.');
  }
  if (!extractionPath) {
    report.status = 'awaiting_model_extraction';
    report.outputs.extractionPrompt = rel(path.join(orchestrationDir, '04-extraction.prompt.md'));
    report.nextActions.push('Run the generated extraction prompt with the model, save material-extraction.json, then rerun with --model-json.');
  }
  return extractionPath;
}

function resolveAssetStage({
  deckPlanPath,
  opts,
  outDir,
  report,
  root,
  rel
}) {
  const assetGatePath = path.join(outDir, 'asset-decision-gate.json');
  const assetGateMarkdownPath = path.join(outDir, 'asset-decision-gate.md');
  const assetResolvedPlanPath = path.join(outDir, 'deck-plan.assets-resolved.json');
  const assetGate = buildGateFromFiles({
    planPath: deckPlanPath,
    answersPath: opts.assetAnswers ? path.resolve(opts.assetAnswers) : '',
    outPath: assetGatePath,
    outPlanPath: opts.assetAnswers ? assetResolvedPlanPath : '',
    summaryPath: assetGateMarkdownPath
  });
  report.steps.push(internalStep('asset decision gate', 'buildGateFromFiles', {
    status: assetGate.status,
    questions: assetGate.questionCount,
    canContinueWithoutAnswers: assetGate.canContinueWithoutAnswers
  }));
  report.outputs.assetGate = rel(assetGatePath);
  report.outputs.assetGateMarkdown = rel(assetGateMarkdownPath);
  report.assetGate = {
    status: assetGate.status || '',
    questionCount: (assetGate.questions || []).length
  };

  let nextDeckPlanPath = deckPlanPath;
  if (opts.assetAnswers && assetGate.status === 'ready' && assetGate.resolvedPlan) {
    report.assetGate = {
      status: assetGate.status || 'ready',
      questionCount: (assetGate.questions || []).length,
      resolvedCount: assetGate.resolvedCount || 0,
      originalStatus: 'answered'
    };
    nextDeckPlanPath = assetResolvedPlanPath;
    report.outputs.deckPlan = rel(nextDeckPlanPath);
    report.outputs.assetGateResolved = rel(assetGatePath);
  }

  if (assetGate.status !== 'needs_user_input') {
    return { deckPlanPath: nextDeckPlanPath, stop: false };
  }
  if (!(opts.allowGeneratedAssets || opts.assetMap)) {
    report.status = 'needs_asset_decisions';
    report.nextActions.push('Answer asset-decision-gate.json with provide_assets or skip_image; add --allow-generated-assets only for synthetic preview visuals.');
    return { deckPlanPath: nextDeckPlanPath, stop: true };
  }

  const resolutionPath = path.join(outDir, 'visual-asset-resolution.json');
  const resolvedPlanPath = path.join(outDir, 'deck-plan.assets-resolved.json');
  const imagegenCapability = opts.imagegenCapability || (opts.allowGeneratedAssets ? 'available' : 'unavailable');
  const resolutionResult = resolveVisualAssetsFromFiles({
    planPath: deckPlanPath,
    outDir,
    report: resolutionPath,
    outPlan: resolvedPlanPath,
    imagegenCapability,
    blockedAction: 'require_user_input',
    assetMap: opts.assetMap ? path.resolve(opts.assetMap) : '',
    root
  });
  const resolution = resolutionResult.report || {};
  report.steps.push(internalStep('visual asset resolution bridge', 'resolveVisualAssetsFromFiles', {
    status: resolution.status || '',
    promptCount: resolution.promptCount || 0,
    counts: resolution.counts || {}
  }, resolution.status === 'error' ? 'fail' : 'pass'));
  report.outputs.assetResolution = rel(resolutionPath);
  report.assetResolution = {
    status: resolution.status || '',
    imagegenCapability: resolution.imagegenCapability || imagegenCapability,
    promptCount: resolution.promptCount || 0,
    counts: resolution.counts || {}
  };
  if (resolution.outputs) {
    if (resolution.outputs.assetAnswers) report.outputs.assetAnswers = resolution.outputs.assetAnswers;
    if (resolution.outputs.assetGateResolved) report.outputs.assetGateResolved = resolution.outputs.assetGateResolved;
    if (resolution.outputs.assetPrompts) report.outputs.assetPrompts = resolution.outputs.assetPrompts;
    if (resolution.outputs.assetMap) report.outputs.assetMap = resolution.outputs.assetMap;
  }
  if (resolution.status === 'error') {
    report.status = 'needs_asset_decisions';
    report.nextActions.push('Visual asset resolution failed; inspect visual-asset-resolution.json before rendering.');
    return { deckPlanPath: nextDeckPlanPath, stop: true };
  }
  if (resolution.status === 'needs_image_generation') {
    report.status = 'awaiting_generated_or_provided_assets';
    report.nextActions.push('Generate the assets listed in asset-prompts.json, save them locally, then rerun with --asset-map to bind before rendering.');
    return { deckPlanPath: nextDeckPlanPath, stop: true };
  }
  if (resolution.status === 'ready' && resolution.outputs && resolution.outputs.deckPlan) {
    nextDeckPlanPath = path.resolve(root, resolution.outputs.deckPlan);
    report.outputs.deckPlan = rel(nextDeckPlanPath);
    report.assetGate = {
      status: 'ready',
      questionCount: 0,
      originalStatus: assetGate.status || '',
      resolutionStatus: resolution.status
    };
    return { deckPlanPath: nextDeckPlanPath, stop: false };
  }
  report.status = 'needs_asset_decisions';
  report.nextActions.push('Answer asset-decision-gate.json with provide_assets or skip_image; generated factual-proof pages require user assets.');
  return { deckPlanPath: nextDeckPlanPath, stop: true };
}

module.exports = {
  createInitialReport,
  internalStep,
  prepareExtractionPath,
  resolveAssetStage
};

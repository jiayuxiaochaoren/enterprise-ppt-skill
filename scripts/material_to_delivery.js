#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const {
  compileDeckPlan,
  ingestMaterials,
  readJson,
  validateExtraction,
  writeJson
} = require('./material_pipeline');
const {
  criticBlockingFindings,
  normalizeModelResults
} = require('./material/model-results-contract');
const { deliveryMarkdown, deliveryReport } = require('./reports/delivery-report');

const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const opts = {
    inputs: [],
    outDir: 'out/material-to-delivery',
    qualityMode: 'draft',
    allowGeneratedAssets: false,
    autoDraft: false,
    skipPreview: false,
    previewOptional: false
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--out-dir') opts.outDir = argv[++i];
    else if (arg === '--model-json' || arg === '--extraction') opts.modelJson = argv[++i];
    else if (arg === '--model-results') opts.modelResults = argv[++i];
    else if (arg === '--model-results-stdin') opts.modelResults = '-';
    else if (arg === '--target-slides' || arg === '--requested-slide-count') opts.targetSlides = Number(argv[++i]);
    else if (arg === '--quality-mode') opts.qualityMode = argv[++i];
    else if (arg === '--source-audit') opts.sourceAudit = argv[++i];
    else if (arg === '--story-plan') opts.storyPlan = argv[++i];
    else if (arg === '--clarifications') opts.clarifications = argv[++i];
    else if (arg === '--asset-answers') opts.assetAnswers = argv[++i];
    else if (arg === '--ocr-json') opts.ocrJson = argv[++i];
    else if (arg === '--ocr-command') opts.ocrCommand = argv[++i];
    else if (arg === '--summary-md') opts.summaryMd = argv[++i];
    else if (arg === '--allow-generated-assets') opts.allowGeneratedAssets = true;
    else if (arg === '--auto-draft') opts.autoDraft = true;
    else if (arg === '--skip-preview') opts.skipPreview = true;
    else if (arg === '--preview-optional') opts.previewOptional = true;
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else opts.inputs.push(arg);
  }
  return opts;
}

function usage() {
  console.error([
    'Usage:',
    '  node scripts/material_to_delivery.js <materials...> --out-dir out/run [--model-json extraction.json]',
    '',
    'Options:',
    '  --auto-draft              Create a conservative draft extraction for tiny, low-risk materials.',
    '  --target-slides N         Requested slide count passed to material_to_deck_plan.',
    '  --model-results FILE|-    Read standard model stage results (sourceAudit, storyPlan, extraction, critic).',
    '  --ocr-json FILE           Optional external OCR results for scanned PDFs/images.',
    '  --ocr-command CMD         Optional local image OCR command compatible with: CMD image stdout.',
    '  --summary-md FILE         Write a human-readable delivery summary.',
    '  --quality-mode MODE       draft | formal | delivery. Default: draft.',
    '  --allow-generated-assets  Stop with imagegen prompts when synthetic assets are needed.',
    '  --skip-preview            Do not request Keynote preview export during validation.',
    '',
    'Without --model-json or --auto-draft, this CLI stops at the model-extraction prompt stage.'
  ].join('\n'));
}

function rel(file) {
  return path.relative(ROOT, path.resolve(file)).split(path.sep).join('/');
}

function runNode(label, args, opts = {}) {
  const result = cp.spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: opts.timeout || 120000
  });
  return {
    label,
    command: ['node', ...args].join(' '),
    status: result.status === 0 ? 'pass' : 'fail',
    stdout: String(result.stdout || '').trim(),
    stderr: String(result.stderr || '').trim()
  };
}

function writeReport(outDir, report) {
  const reportPath = path.join(outDir, 'delivery-report.json');
  report.report = deliveryReport(report);
  writeJson(reportPath, report);
  if (report.summaryMarkdownPath) {
    const mdPath = path.resolve(report.summaryMarkdownPath);
    fs.mkdirSync(path.dirname(mdPath), { recursive: true });
    fs.writeFileSync(mdPath, deliveryMarkdown(report), 'utf8');
    report.outputs.markdownSummary = rel(mdPath);
    report.report = deliveryReport(report);
    writeJson(reportPath, report);
  }
  console.log(JSON.stringify({
    success: report.status === 'complete',
    status: report.status,
    report: path.resolve(reportPath),
    nextActions: report.nextActions || [],
    outputs: report.outputs || {}
  }, null, 2));
  return reportPath;
}

function readJsonOrStdin(file) {
  if (!file) return null;
  if (file === '-') return JSON.parse(fs.readFileSync(0, 'utf8'));
  return readJson(path.resolve(file));
}

function writeModelStage(outDir, name, value) {
  if (!value) return '';
  const file = path.join(outDir, `${name}.json`);
  writeJson(file, value);
  return file;
}

function applyStandardModelResults(opts, orchestrationDir, report) {
  const raw = readJsonOrStdin(opts.modelResults);
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
  const sourceAuditPath = !opts.sourceAudit ? writeModelStage(orchestrationDir, 'source-audit', sourceAudit) : '';
  const storyPlanPath = !opts.storyPlan ? writeModelStage(orchestrationDir, 'story-architecture', storyPlan) : '';
  const extractionPath = !opts.modelJson ? writeModelStage(orchestrationDir, 'material-extraction', extraction) : '';
  const criticPath = writeModelStage(orchestrationDir, 'model-critic', critic);
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

function compactLine(text = '', max = 42) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function sourceExcerpt(source = {}) {
  return (source.candidateFacts && source.candidateFacts[0]) || String(source.text || '').slice(0, 140) || source.name || '';
}

function cleanDraftFact(text = '') {
  return String(text || '')
    .replace(/^#+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildDraftExtraction(bundle = {}, opts = {}) {
  const textSources = (bundle.sources || []).filter(source => source.kind !== 'image' && String(source.text || '').trim());
  const primary = textSources[0] || (bundle.sources || [])[0] || { id: 'src-001', name: '材料' };
  const topIndustry = bundle.textSummary && bundle.textSummary.industryCandidates && bundle.textSummary.industryCandidates[0];
  const industry = topIndustry && Number(topIndustry.score || 0) >= 2 ? topIndustry.industry : 'general-operations';
  const facts = (bundle.textSummary && bundle.textSummary.candidateFacts || [])
    .map(cleanDraftFact)
    .filter(Boolean)
    .slice(0, 6)
    .map((line, i) => ({
      id: `fact-${String(i + 1).padStart(3, '0')}`,
      text: line,
      source_ids: [primary.id],
      source_pages: { [primary.id]: 1 },
      source_excerpts: { [primary.id]: line },
      confidence: 0.6
    }));
  while (facts.length < 2) {
    const fallback = sourceExcerpt(primary) || `材料事实 ${facts.length + 1}`;
    facts.push({
      id: `fact-${String(facts.length + 1).padStart(3, '0')}`,
      text: fallback,
      source_ids: [primary.id],
      source_pages: { [primary.id]: 1 },
      source_excerpts: { [primary.id]: fallback },
      confidence: 0.45
    });
  }
  const claimLines = facts.slice(0, 4).map(fact => fact.text);
  const title = compactLine(path.basename(primary.name || '材料自动整理', path.extname(primary.name || '')), 24) || '材料自动整理';
  const sourceIds = [primary.id].filter(Boolean);
  const claims = claimLines.map((line, i) => ({
    id: `claim-${String(i + 1).padStart(3, '0')}`,
    narrative_role: ['diagnosis', 'evidence', 'solution', 'operating-model'][i] || 'evidence',
    claim: compactLine(line, 30),
    support: line,
    proof_object: i === 0 ? 'diagnosis-board' : (i === 1 ? 'value-signal' : 'process-map'),
    source_ids: sourceIds,
    source_pages: { [primary.id]: 1 },
    source_excerpts: { [primary.id]: line },
    confidence: 0.55
  }));
  claims.push({
    id: `claim-${String(claims.length + 1).padStart(3, '0')}`,
    narrative_role: 'decision',
    claim: '下一步确认事实口径与交付边界',
    support: '后续需要确认事实、素材授权和联系人信息。',
    proof_object: 'decision-summary',
    source_ids: sourceIds,
    source_pages: { [primary.id]: 1 },
    source_excerpts: { [primary.id]: sourceExcerpt(primary) },
    bullets: ['确认事实口径', '补齐素材授权', '进入正式设计 QA'],
    confidence: 0.5
  });
  return {
    version: 'material-extraction/v1',
    document: {
      title,
      subtitle: '基于已摄取材料生成的保守草案',
      ppt_type: 'draft',
      industry,
      decision_goal: '确认事实口径、缺失信息和后续交付范围',
      targetSlides: opts.targetSlides
    },
    facts,
    evidence: facts.slice(0, 4).map((fact, i) => ({
      id: `ev-${String(i + 1).padStart(3, '0')}`,
      type: 'text',
      title: compactLine(fact.text, 22),
      summary: fact.text,
      source_ids: fact.source_ids,
      excerpt: fact.text
    })),
    claim_spine: claims,
    missing_info: [
      '该 deck 由 --auto-draft 生成，只能作为内部草案；正式交付需补齐模型抽取、事实复核和素材授权。'
    ],
    commercial_risks: [
      '自动草案未经过人工 source audit / model critic，不建议直接外发。'
    ],
    asset_rights: 'unknown'
  };
}

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

  const report = {
    version: 'material-to-delivery/v1',
    status: 'started',
    qualityMode: opts.qualityMode,
    inputs: opts.inputs.map(input => rel(input)),
    steps: [],
    outputs: {},
    nextActions: [],
    summaryMarkdownPath: opts.summaryMd ? path.resolve(ROOT, opts.summaryMd) : ''
  };
  if (report.summaryMarkdownPath) report.outputs.markdownSummary = rel(report.summaryMarkdownPath);

  const bundlePath = path.join(outDir, 'material-bundle.json');
  const ocrResults = opts.ocrJson ? readJsonOrStdin(opts.ocrJson) : null;
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
  applyStandardModelResults(opts, orchestrationDir, report);
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

  let extractionPath = opts.modelJson ? path.resolve(opts.modelJson) : '';
  if (!extractionPath && opts.autoDraft) {
    extractionPath = path.join(orchestrationDir, 'material-extraction.draft.json');
    const draft = buildDraftExtraction(bundle, opts);
    const errors = validateExtraction(draft);
    if (errors.length) throw new Error(`auto draft extraction failed validation: ${errors.join('; ')}`);
    writeJson(extractionPath, draft);
    report.outputs.draftExtraction = rel(extractionPath);
    report.nextActions.push('Auto-draft extraction was used; replace it with model-reviewed material-extraction.json before external delivery.');
  }

  if (!extractionPath) {
    report.status = 'awaiting_model_extraction';
    report.outputs.extractionPrompt = rel(path.join(orchestrationDir, '04-extraction.prompt.md'));
    report.nextActions.push('Run the generated extraction prompt with the model, save material-extraction.json, then rerun with --model-json.');
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

  const assetGatePath = path.join(outDir, 'asset-decision-gate.json');
  const assetGateArgs = ['scripts/deck_asset_decision_gate.js', deckPlanPath, '--out', assetGatePath];
  if (opts.assetAnswers) {
    assetGateArgs.push('--answers', path.resolve(opts.assetAnswers), '--out-plan', path.join(outDir, 'deck-plan.assets-resolved.json'));
  }
  const assetGateStep = runNode('asset decision gate', assetGateArgs);
  report.steps.push(assetGateStep);
  report.outputs.assetGate = rel(assetGatePath);
  const assetGate = fs.existsSync(assetGatePath) ? readJson(assetGatePath) : null;
  if (assetGate) {
    report.assetGate = {
      status: assetGate.status || '',
      questionCount: (assetGate.questions || []).length
    };
  }
  if (assetGate && assetGate.status === 'needs_user_input') {
    if (opts.autoDraft) {
      const skipAnswersPath = path.join(outDir, 'asset-answers.auto-skip.json');
      const resolvedPlanPath = path.join(outDir, 'deck-plan.assets-resolved.json');
      const decisions = {};
      (assetGate.questions || []).forEach(question => {
        decisions[String(question.slide)] = { action: 'skip_image' };
      });
      writeJson(skipAnswersPath, { decisions });
      const resolvedGatePath = path.join(outDir, 'asset-decision-gate.resolved.json');
      const resolvedGateStep = runNode('asset decision auto-skip for draft', [
        'scripts/deck_asset_decision_gate.js',
        deckPlanPath,
        '--answers',
        skipAnswersPath,
        '--out',
        resolvedGatePath,
        '--out-plan',
        resolvedPlanPath
      ]);
      report.steps.push(resolvedGateStep);
      report.outputs.assetAnswers = rel(skipAnswersPath);
      report.outputs.assetGateResolved = rel(resolvedGatePath);
      if (resolvedGateStep.status === 'pass' && fs.existsSync(resolvedPlanPath)) {
        const resolvedGate = fs.existsSync(resolvedGatePath) ? readJson(resolvedGatePath) : {};
        report.assetGate = {
          status: resolvedGate.status || 'auto_resolved',
          questionCount: (resolvedGate.questions || assetGate.questions || []).length,
          originalStatus: assetGate.status || ''
        };
        deckPlanPath = resolvedPlanPath;
        report.outputs.deckPlan = rel(deckPlanPath);
      } else {
        report.status = 'needs_asset_decisions';
        report.nextActions.push('Auto draft could not resolve asset decisions; answer asset-decision-gate.json manually.');
        writeReport(outDir, report);
        return;
      }
    } else
    if (opts.allowGeneratedAssets) {
      const promptPath = path.join(outDir, 'asset-prompts.json');
      report.steps.push(runNode('asset prompt planning', ['scripts/asset_prompt_planner.js', deckPlanPath, '--out', promptPath]));
      report.outputs.assetPrompts = rel(promptPath);
      report.status = 'awaiting_generated_or_provided_assets';
      report.nextActions.push('Generate or provide the assets listed in asset-prompts.json, bind them, then rerun with --asset-answers or --model-json against the resolved plan.');
      writeReport(outDir, report);
      return;
    } else {
      report.status = 'needs_asset_decisions';
      report.nextActions.push('Answer asset-decision-gate.json with provide_assets or skip_image; add --allow-generated-assets only for synthetic preview visuals.');
      writeReport(outDir, report);
      return;
    }
  }

  const pptxPath = path.join(outDir, 'deck.pptx');
  const generateStep = runNode('pptx generation', ['scripts/generate_pptx.js', deckPlanPath, pptxPath], { timeout: 180000 });
  report.steps.push(generateStep);
  report.outputs.pptx = rel(pptxPath);
  report.outputs.renderMeta = rel(`${pptxPath}.render-meta.json`);
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
    const validationJson = JSON.parse(validationStep.stdout || '{}');
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
  usage();
  console.error(err.stack || err.message || err);
  process.exit(1);
}

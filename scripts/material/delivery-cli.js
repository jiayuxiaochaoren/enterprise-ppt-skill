const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const {
  deliveryMarkdown,
  deliveryReport
} = require('../reports/delivery-report');

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
    else if (arg === '--asset-map') opts.assetMap = argv[++i];
    else if (arg === '--ocr-json') opts.ocrJson = argv[++i];
    else if (arg === '--ocr-command') opts.ocrCommand = argv[++i];
    else if (arg === '--summary-md') opts.summaryMd = argv[++i];
    else if (arg === '--allow-generated-assets') opts.allowGeneratedAssets = true;
    else if (arg === '--imagegen-capability' || arg === '--imagegen') opts.imagegenCapability = argv[++i];
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
    '  --allow-generated-assets  Resolve missing visuals through imagegen prompts before rendering.',
    '  --imagegen-capability MODE available | unavailable. Defaults to available when --allow-generated-assets is set.',
    '  --asset-map FILE           Bind generated/provided image assets before rendering.',
    '  --skip-preview            Do not request Keynote preview export during validation.',
    '',
    'Without --model-json or --auto-draft, this CLI stops at the model-extraction prompt stage.'
  ].join('\n'));
}

function createDeliveryCliRuntime({ root, writeJson }) {
  const ROOT = path.resolve(root || path.join(__dirname, '..', '..'));

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

  return {
    rel,
    runNode,
    writeReport
  };
}

module.exports = {
  createDeliveryCliRuntime,
  parseArgs,
  usage
};

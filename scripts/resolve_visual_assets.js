#!/usr/bin/env node
/* Resolve missing visual assets before PPTX rendering.
   The bridge sits between the asset decision gate and renderer fallback:
   - default: stop and require an explicit user asset decision;
   - auto_generate selected: request synthetic generation and stop before render unless an imagegen bridge command is provided;
   - skip_image selected: explicitly skip image use and keep the audit trail;
   - asset map supplied: bind generated/provided bitmaps and continue. */
const { resolveVisualAssetsFromFiles } = require('./assets/resolution-facade');

function usage(exitCode = 2) {
  console.error([
    'Usage:',
    '  node scripts/resolve_visual_assets.js <deck-plan.json> --out-dir out/run [--imagegen-capability available|unavailable]',
    '',
    'Options:',
    '  --asset-map FILE              Bind generated/provided images after resolving decisions.',
    '  --imagegen-command CMD        Optional shell command bridge for synthetic generation; may use {prompts} {assetMap} {assetsDir} {outDir} {plan}.',
    '  --out-plan FILE               Where to write the resolved or bound deck plan.',
    '  --report FILE                 Where to write the machine-readable resolution report.',
    '  --prompts-out FILE            Where to write imagegen prompt specs.',
    '  --missing-asset-action ACTION require_user_input | auto_generate | skip_image. Default: require_user_input.',
    '  --blocked-action ACTION       skip_image | require_user_input. Default: require_user_input.',
    '',
    'Without --imagegen-command this script never calls an image API. When it returns',
    'needs_image_generation, use the prompts with an imagegen-capable agent, save assets',
    'locally, then bind them.'
  ].join('\n'));
  process.exit(exitCode);
}

function parseArgs(argv) {
  const opts = {
    imagegenCapability: 'unavailable',
    missingAssetAction: 'require_user_input',
    blockedAction: 'require_user_input'
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--out-dir') opts.outDir = argv[++i];
    else if (arg === '--imagegen-capability' || arg === '--imagegen') opts.imagegenCapability = String(argv[++i] || '');
    else if (arg === '--imagegen-command') opts.imagegenCommand = argv[++i];
    else if (arg === '--asset-map') opts.assetMap = argv[++i];
    else if (arg === '--out-plan') opts.outPlan = argv[++i];
    else if (arg === '--report') opts.report = argv[++i];
    else if (arg === '--prompts-out') opts.promptsOut = argv[++i];
    else if (arg === '--missing-asset-action') opts.missingAssetAction = String(argv[++i] || '');
    else if (arg === '--blocked-action') opts.blockedAction = String(argv[++i] || '');
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else if (!opts.plan && !String(arg || '').startsWith('-')) opts.plan = arg;
    else usage();
  }
  return opts;
}

function runCli(argv = process.argv.slice(2)) {
  try {
    const opts = parseArgs(argv);
    if (opts.help) usage(0);
    if (!opts.plan) usage();
    const result = resolveVisualAssetsFromFiles(opts);
    console.log(JSON.stringify(result.summary, null, 2));
    if (result.report.status === 'error') process.exit(1);
  } catch (e) {
    console.error(e.stack || e.message || e);
    process.exit(1);
  }
}

if (require.main === module) {
  runCli();
} else {
  module.exports = require('./assets/resolution-facade');
  module.exports.runCli = runCli;
}

#!/usr/bin/env node
/* Machine-readable asset pause point for deck generation.
   The gate makes missing visual decisions explicit before rendering:
   provide user assets, skip image use, or generate clearly synthetic assets. */
const path = require('path');
const {
  buildGateFromFiles
} = require('./assets/decision-gate');

function usage() {
  console.error([
    'Usage:',
    '  node scripts/deck_asset_decision_gate.js <deck-plan.json> --out out/asset-gate.json [--summary-md out/asset-gate.md]',
    '  node scripts/deck_asset_decision_gate.js <deck-plan.json> --answers out/asset-answers.json --out out/asset-gate-resolved.json --out-plan out/deck-plan.resolved.json',
    '',
    'Answer JSON shape:',
    '  { "decisions": { "3": { "action": "auto_generate" }, "4": { "action": "provide_assets", "assets": ["assets/product.png"] }, "5": { "action": "skip_image" } } }'
  ].join('\n'));
  process.exit(2);
}

function parseArgs(argv) {
  const opts = {};
  opts.plan = argv[0];
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') opts.out = argv[++i];
    else if (a === '--answers') opts.answers = argv[++i];
    else if (a === '--out-plan') opts.outPlan = argv[++i];
    else if (a === '--summary-md') opts.summaryMd = argv[++i];
    else if (a === '--external') opts.external = true;
    else if (a === '--help' || a === '-h') opts.help = true;
  }
  return opts;
}

function runCli(argv = process.argv.slice(2)) {
  try {
    const opts = parseArgs(argv);
    if (opts.help || !opts.plan || !opts.out) usage();
    const gate = buildGateFromFiles({
      planPath: opts.plan,
      answersPath: opts.answers || '',
      outPath: opts.out,
      outPlanPath: opts.outPlan || '',
      summaryPath: opts.summaryMd || ''
    });
    console.log(JSON.stringify({
      success: true,
      out: path.resolve(opts.out),
      outPlan: opts.outPlan ? path.resolve(opts.outPlan) : undefined,
      summaryMd: opts.summaryMd ? path.resolve(opts.summaryMd) : undefined,
      status: gate.status,
      questions: gate.questionCount,
      canContinueWithoutAnswers: gate.canContinueWithoutAnswers
    }, null, 2));
  } catch (e) {
    console.error(e.stack || e.message || e);
    process.exit(1);
  }
}

if (require.main === module) {
  runCli();
} else {
  module.exports = require('./assets/decision-gate');
  module.exports.runCli = runCli;
}

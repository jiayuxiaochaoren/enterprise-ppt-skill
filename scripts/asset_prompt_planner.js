#!/usr/bin/env node
/* Plan imagegen prompts for missing presentation assets.
   This script does not call an image API. It creates prompt specs that Codex can
   pass to the built-in imagegen tool, then saved project-local assets can be
   referenced from the deck plan. */
const path = require('path');
const { planAssetPromptsFromFile } = require('./assets/prompt-planner');

function usage() {
  console.error('Usage: node scripts/asset_prompt_planner.js <deck-plan.json> [--out prompts.json] [--fail-on-blocked]');
  process.exit(2);
}

function parseArgs(argv) {
  const opts = {
    plan: '',
    out: '',
    failOnBlocked: false
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') opts.out = path.resolve(String(argv[++i] || ''));
    else if (argv[i] === '--fail-on-blocked') opts.failOnBlocked = true;
    else if (!opts.plan) opts.plan = argv[i];
    else usage();
  }
  return opts;
}

function runCli(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  if (!opts.plan) usage();
  const result = planAssetPromptsFromFile({
    planPath: opts.plan,
    outPath: opts.out
  });
  console.log(JSON.stringify(result, null, 2));
  if (opts.failOnBlocked && result.blockedCount) process.exit(1);
}

if (require.main === module) {
  runCli();
} else {
  module.exports = require('./assets/prompt-planner');
  module.exports.runCli = runCli;
}

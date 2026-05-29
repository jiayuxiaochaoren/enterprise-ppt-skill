#!/usr/bin/env node
const path = require('path');
const {
  applyClarificationAnswers,
  buildClarificationGate,
  readJson,
  writeJson
} = require('./material_pipeline');

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--bundle') opts.bundle = argv[++i];
    else if (a === '--source-audit') opts.sourceAudit = argv[++i];
    else if (a === '--story-plan') opts.storyPlan = argv[++i];
    else if (a === '--answers') opts.answers = argv[++i];
    else if (a === '--out') opts.out = argv[++i];
    else if (a === '--max-questions') opts.maxQuestions = Number(argv[++i]);
    else if (a === '--external') opts.external = true;
    else if (a === '--help' || a === '-h') opts.help = true;
  }
  return opts;
}

function usage() {
  console.error([
    'Usage:',
    '  node scripts/material_clarification_gate.js --bundle out/material-bundle.json --source-audit out/source-audit.json --story-plan out/story-architecture.json --out out/clarification-gate.json',
    '  node scripts/material_clarification_gate.js --bundle out/material-bundle.json --source-audit out/source-audit.json --story-plan out/story-architecture.json --answers out/clarification-answers.json --out out/clarification-gate-resolved.json',
    '',
    'The output is a machine-readable pause point. Ask the user the listed questions before continuing when status is needs_user_input.'
  ].join('\n'));
}

try {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.bundle || !opts.sourceAudit || !opts.storyPlan || !opts.out) {
    usage();
    process.exit(opts.help ? 0 : 2);
  }
  const bundle = readJson(opts.bundle);
  const sourceAudit = readJson(opts.sourceAudit);
  const storyPlan = readJson(opts.storyPlan);
  let gate = buildClarificationGate(bundle, sourceAudit, storyPlan, {
    maxQuestions: opts.maxQuestions,
    external: opts.external
  });
  if (opts.answers) {
    gate = applyClarificationAnswers(gate, readJson(opts.answers));
  }
  writeJson(opts.out, gate);
  console.log(JSON.stringify({
    success: true,
    out: path.resolve(opts.out),
    status: gate.status,
    questions: (gate.questions || []).length,
    blocking: (gate.questions || []).filter(q => q.priority === 'blocking' && !q.resolved).length,
    canContinueWithoutAnswers: gate.canContinueWithoutAnswers
  }, null, 2));
} catch (e) {
  usage();
  console.error(e.stack || e.message || e);
  process.exit(e.usage ? 2 : 1);
}

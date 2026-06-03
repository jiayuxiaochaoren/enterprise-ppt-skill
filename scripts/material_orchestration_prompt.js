#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {
  readJson
} = require('./material_pipeline');
const {
  STAGES,
  clarificationGateInstructions,
  criticPrompt,
  extractionPrompt,
  orchestrationOverview,
  sourceAuditPrompt,
  stagePrompt,
  storyArchitecturePrompt
} = require('./material/orchestration-prompts');

function parseArgs(argv) {
  const opts = { stage: 'all' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--bundle') opts.bundle = argv[++i];
    else if (a === '--out-dir') opts.outDir = argv[++i];
    else if (a === '--out') opts.out = argv[++i];
    else if (a === '--stage') opts.stage = argv[++i];
    else if (a === '--source-audit') opts.sourceAudit = argv[++i];
    else if (a === '--story-plan') opts.storyPlan = argv[++i];
    else if (a === '--clarifications') opts.clarifications = argv[++i];
    else if (a === '--extraction') opts.extraction = argv[++i];
    else if (a === '--qa') opts.qa = argv[++i];
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (!opts.bundle) opts.bundle = a;
  }
  return opts;
}

function usage() {
  console.error([
    'Usage:',
    '  node scripts/material_orchestration_prompt.js --bundle out/material-bundle.json --out-dir out/model-orchestration',
    '  node scripts/material_orchestration_prompt.js --bundle out/material-bundle.json --stage extraction --source-audit out/source-audit.json --story-plan out/story-plan.json --clarifications out/clarification-gate.json --out out/extraction.prompt.md',
    '',
    `Stages: all, ${STAGES.join(', ')}`
  ].join('\n'));
}

function maybeReadJson(file) {
  if (!file) return null;
  return readJson(file);
}

function writeFile(file, text) {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, `${text.trim()}\n`, 'utf8');
}

function singleStageOptions(opts) {
  return {
    clarifications: maybeReadJson(opts.clarifications),
    extraction: maybeReadJson(opts.extraction),
    qa: maybeReadJson(opts.qa),
    sourceAudit: maybeReadJson(opts.sourceAudit),
    storyPlan: maybeReadJson(opts.storyPlan)
  };
}

function allStageFiles(outDir) {
  return {
    overview: path.join(outDir, '00-orchestration.md'),
    sourceAudit: path.join(outDir, '01-source-audit.prompt.md'),
    storyArchitecture: path.join(outDir, '02-story-architecture.prompt.md'),
    clarificationGate: path.join(outDir, '03-clarification-gate.md'),
    extraction: path.join(outDir, '04-extraction.prompt.md'),
    critic: path.join(outDir, '05-critic.prompt.md')
  };
}

function writeAllStagePrompts(bundle, outDir) {
  const files = allStageFiles(outDir);
  writeFile(files.overview, orchestrationOverview(outDir));
  writeFile(files.sourceAudit, sourceAuditPrompt(bundle));
  writeFile(files.storyArchitecture, storyArchitecturePrompt(bundle));
  writeFile(files.clarificationGate, clarificationGateInstructions(outDir));
  writeFile(files.extraction, extractionPrompt(bundle));
  writeFile(files.critic, criticPrompt(bundle));
  return files;
}

function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  if (opts.help || !opts.bundle || (opts.stage !== 'all' && !STAGES.includes(opts.stage))) {
    usage();
    return opts.help ? 0 : 2;
  }

  const bundle = readJson(opts.bundle);
  if (opts.stage === 'all') {
    if (!opts.outDir) {
      usage();
      return 2;
    }
    const outDir = path.resolve(opts.outDir);
    const files = writeAllStagePrompts(bundle, outDir);
    console.log(JSON.stringify({ success: true, outDir, files }, null, 2));
    return 0;
  }

  const prompt = stagePrompt(opts.stage, bundle, singleStageOptions(opts));
  if (opts.out) {
    writeFile(opts.out, prompt);
    console.log(JSON.stringify({ success: true, stage: opts.stage, out: path.resolve(opts.out), chars: prompt.length }, null, 2));
  } else {
    process.stdout.write(prompt);
  }
  return 0;
}

if (require.main === module) {
  try {
    const exitCode = main(process.argv.slice(2));
    if (exitCode) process.exit(exitCode);
  } catch (e) {
    usage();
    console.error(e.stack || e.message || e);
    process.exit(e.usage ? 2 : 1);
  }
}

module.exports = {
  allStageFiles,
  main,
  parseArgs,
  singleStageOptions,
  usage,
  writeAllStagePrompts
};

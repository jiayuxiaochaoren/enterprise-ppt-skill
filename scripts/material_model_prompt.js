#!/usr/bin/env node
const path = require('path');
const { buildModelPrompt, readJson } = require('./material_pipeline');

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--bundle') opts.bundle = argv[++i];
    else if (a === '--out') opts.out = argv[++i];
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (!opts.bundle) opts.bundle = a;
  }
  return opts;
}

function usage() {
  console.error('Usage: node scripts/material_model_prompt.js --bundle out/material-bundle.json --out out/model-extraction-prompt.md');
}

try {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.bundle) {
    usage();
    process.exit(opts.help ? 0 : 2);
  }
  const bundle = readJson(opts.bundle);
  const prompt = [
    '# Compatibility Single-Pass Prompt',
    '',
    '只在材料极少、低风险、无外发图片/证书/客户案例时使用本提示词。公司介绍、对外交付、来源混杂、含图片证据或需要审稿的材料，默认改用 `scripts/material_orchestration_prompt.js` + `scripts/material_clarification_gate.js` 的分阶段编排。',
    '',
    buildModelPrompt(bundle)
  ].join('\n');
  if (opts.out) {
    require('fs').mkdirSync(path.dirname(path.resolve(opts.out)), { recursive: true });
    require('fs').writeFileSync(opts.out, prompt, 'utf8');
    console.log(JSON.stringify({ success: true, out: path.resolve(opts.out), chars: prompt.length }, null, 2));
  } else {
    process.stdout.write(prompt);
  }
} catch (e) {
  usage();
  console.error(e.message || e);
  process.exit(e.usage ? 2 : 1);
}

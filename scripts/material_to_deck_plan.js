#!/usr/bin/env node
const path = require('path');
const { compileDeckPlan, readJson, writeJson } = require('./material_pipeline');

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--bundle') opts.bundle = argv[++i];
    else if (a === '--model-json' || a === '--extraction') opts.extraction = argv[++i];
    else if (a === '--out') opts.out = argv[++i];
    else if (a === '--style') opts.style = argv[++i];
    else if (a === '--max-slides') opts.maxSlides = Number(argv[++i]);
    else if (a === '--target-slides' || a === '--requested-slide-count') opts.targetSlides = Number(argv[++i]);
    else if (a === '--help' || a === '-h') opts.help = true;
  }
  return opts;
}

function usage() {
  console.error('Usage: node scripts/material_to_deck_plan.js --bundle out/material-bundle.json --model-json out/model-extraction.json --out out/deck-plan.json [--target-slides 12]');
}

try {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.bundle || !opts.extraction || !opts.out) {
    usage();
    process.exit(opts.help ? 0 : 2);
  }
  const bundle = readJson(opts.bundle);
  const extraction = readJson(opts.extraction);
  const plan = compileDeckPlan(extraction, bundle, opts);
  writeJson(opts.out, plan);
  console.log(JSON.stringify({
    success: true,
    out: path.resolve(opts.out),
    industry: plan.industry,
    slides: (plan.slides || []).length,
    title: plan.title,
    missingInfo: (plan.materialIntelligence && plan.materialIntelligence.missingInfo || []).length
  }, null, 2));
} catch (e) {
  usage();
  console.error(e.message || e);
  process.exit(e.usage ? 2 : 1);
}

#!/usr/bin/env node
const path = require('path');
const { ingestMaterials, writeJson } = require('./material_pipeline');

function parseArgs(argv) {
  const inputs = [];
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') opts.out = argv[++i];
    else if (a === '--root') opts.root = argv[++i];
    else if (a === '--max-chars') opts.maxCharsPerSource = Number(argv[++i]);
    else if (a === '--help' || a === '-h') opts.help = true;
    else inputs.push(a);
  }
  return { inputs, opts };
}

function usage() {
  console.error('Usage: node scripts/material_ingest.js <file-or-dir...> --out out/material-bundle.json');
}

try {
  const { inputs, opts } = parseArgs(process.argv.slice(2));
  if (opts.help || !inputs.length || !opts.out) {
    usage();
    process.exit(opts.help ? 0 : 2);
  }
  const bundle = ingestMaterials(inputs, opts);
  writeJson(opts.out, bundle);
  console.log(JSON.stringify({
    success: true,
    out: path.resolve(opts.out),
    sourceCount: bundle.sourceCount,
    images: bundle.images.length,
    industryCandidates: bundle.textSummary.industryCandidates.slice(0, 3)
  }, null, 2));
} catch (e) {
  usage();
  console.error(e.message || e);
  process.exit(e.usage ? 2 : 1);
}

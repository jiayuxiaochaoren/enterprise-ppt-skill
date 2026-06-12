#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {
  normalizeDeckPlan
} = require('./design-system');
const {
  auditIndustryEvidenceChain
} = require('./qa/industry-evidence-chain-audit');

function parseArgs(argv = []) {
  const opts = { json: false, plan: '' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--plan') opts.plan = argv[++i];
    else if (arg === '--render-meta') opts.renderMeta = argv[++i];
    else if (arg === '--json') opts.json = true;
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else if (!opts.plan) opts.plan = arg;
    else throw new Error(`unknown argument: ${arg}`);
  }
  return opts;
}

function usage() {
  console.error([
    'Usage: node scripts/audit_industry_chain.js --plan <deck-plan.json> [--render-meta <pptx.render-meta.json>] [--json]',
    '',
    'Reports industry evidence-chain stage, coverage policy, planned components, consumed components, and blocking gaps.'
  ].join('\n'));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}

function compactSlide(slide = {}) {
  const coverage = slide.coverageStatus || {};
  return {
    slide: slide.slide,
    type: slide.type,
    layoutVariant: slide.layoutVariant,
    proofObject: slide.proofObject,
    chainId: slide.chainId,
    stageId: slide.stageId,
    stageLabel: slide.stageLabel,
    coverageStatus: coverage.status || '',
    minHits: coverage.minHits || 0,
    hitCount: coverage.hitCount || 0,
    requiredAllMissing: coverage.requiredAllMissing || [],
    requiredAnyMissing: coverage.requiredAnyMissing || [],
    optionalMissing: coverage.optionalMissing || [],
    expectedComponents: slide.expectedComponents || [],
    plannedComponents: slide.plannedComponents || [],
    consumedComponents: slide.consumedComponents || [],
    findings: (slide.findings || []).map(finding => ({
      level: finding.level || '',
      type: finding.type || '',
      message: finding.message || ''
    }))
  };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.plan) {
    usage();
    process.exit(opts.help ? 0 : 2);
  }
  const plan = readJson(opts.plan);
  const normalized = normalizeDeckPlan(plan);
  const renderMeta = opts.renderMeta ? readJson(opts.renderMeta) : null;
  const audit = auditIndustryEvidenceChain(plan, normalized, { renderMeta });
  const report = {
    version: 'industry-chain-report/v1',
    plan: path.relative(process.cwd(), path.resolve(opts.plan)),
    renderMeta: opts.renderMeta ? path.relative(process.cwd(), path.resolve(opts.renderMeta)) : '',
    status: audit.status,
    summary: audit.industry_evidence_chain_summary,
    slides: audit.slides.map(compactSlide)
  };
  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(`${report.status.toUpperCase()} ${report.summary.industry || 'unknown'} ${report.summary.status}`);
  report.slides.forEach(slide => {
    console.log([
      `#${slide.slide}`,
      slide.type,
      slide.stageId || 'neutral',
      `coverage=${slide.coverageStatus || 'n/a'}`,
      `hits=${slide.hitCount}/${slide.minHits}`,
      `planned=${slide.plannedComponents.join(',') || '-'}`
    ].join(' | '));
    slide.findings.forEach(finding => console.log(`  ${finding.level} ${finding.type}: ${finding.message}`));
  });
  if (report.summary.blockingGap) {
    console.log(`blockingGap=${report.summary.blockingGap.type}: ${report.summary.blockingGap.message}`);
  }
}

try {
  main();
} catch (error) {
  usage();
  console.error(error.stack || error.message || error);
  process.exit(1);
}

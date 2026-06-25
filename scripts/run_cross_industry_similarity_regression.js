#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const {
  normalizeDeckPlan
} = require('./design-system');
const {
  ROOT,
  industryAcceptanceBriefs
} = require('./industry_acceptance_matrix');
const {
  auditCrossIndustrySimilarity
} = require('./qa/cross-industry-similarity-audit');

function usage() {
  console.error('Usage: node scripts/run_cross_industry_similarity_regression.js [--manifest path] [--reuse-existing] [--max-hash N]');
  process.exit(2);
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, 'utf8');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function parseArgs(argv = []) {
  const out = {
    manifestPath: '',
    reuseExisting: false,
    maxHash: 6
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--manifest') out.manifestPath = path.resolve(String(argv[++i] || ''));
    else if (arg === '--reuse-existing') out.reuseExisting = true;
    else if (arg === '--max-hash') out.maxHash = Number(argv[++i]);
    else usage();
  }
  if (!Number.isFinite(out.maxHash) || out.maxHash < 1) usage();
  return out;
}

function runNode(script, args, opts = {}) {
  return cp.execFileSync(process.execPath, [path.join(ROOT, script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: opts.timeout || 300000
  }).trim();
}

function runAcceptance(manifestPath = '', reuseExisting = false) {
  if (reuseExisting && manifestPath && fs.existsSync(manifestPath)) return manifestPath;
  const raw = runNode('scripts/run_industry_acceptance.js', [], { timeout: 600000 });
  const parsed = JSON.parse(raw);
  if (!parsed || !parsed.success || !parsed.manifest) {
    throw new Error('industry acceptance did not return a manifest path');
  }
  return path.resolve(String(parsed.manifest));
}

function validateDeckFormal(deck = {}, brief = {}) {
  const args = [
    'scripts/validate_pptx.js',
    deck.pptx,
    '--plan',
    deck.plan,
    '--preview-dir',
    deck.previewDir,
    '--quality-mode',
    'formal',
    '--summary'
  ];
  if (Array.isArray(brief.required) && brief.required.length) args.push('--require', brief.required.join(','));
  const raw = runNode(args[0], args.slice(1), { timeout: 300000 });
  return JSON.parse(raw);
}

function markdownReport(report = {}, manifestPath = '') {
  const lines = [
    '# Cross-Industry Similarity Regression',
    '',
    `- Status: ${report.status}`,
    `- Decks: ${report.summary ? report.summary.deckCount : 0}`,
    `- Cover pairs: ${report.summary ? report.summary.coverPairCount : 0}`,
    `- Closing pairs: ${report.summary ? report.summary.closingPairCount : 0}`,
    `- Fails: ${report.failCount || 0}`,
    `- Reviews: ${report.reviewCount || 0}`,
    `- Acceptance manifest: ${manifestPath ? rel(manifestPath) : ''}`,
    '',
    '## Deck Summary',
    '',
    '| Deck | Formal | Cover vs Closing | Max route run | Max composition run |',
    '| --- | --- | --- | ---: | ---: |'
  ];
  (report.decks || []).forEach(deck => {
    const formal = deck.formalValidation && deck.formalValidation.success === true ? 'pass' : 'fail';
    lines.push(
      `| ${deck.slug} | ${formal} | ${deck.withinDeck ? deck.withinDeck.status : 'review'} | ${deck.bodyRhythm ? deck.bodyRhythm.maxRouteFamilyRun : 0} | ${deck.bodyRhythm ? deck.bodyRhythm.maxCompositionRun : 0} |`
    );
  });
  lines.push('');
  lines.push('## Findings');
  lines.push('');
  if (!(report.findings || []).length) {
    lines.push('- No blocking cross-industry similarity findings.');
  } else {
    (report.findings || []).forEach(finding => {
      const scope = finding.deck || (Array.isArray(finding.decks) ? finding.decks.join(' / ') : '');
      lines.push(`- [${finding.level}] ${finding.type} ${scope ? `(${scope})` : ''}: ${finding.message}`);
    });
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const briefBySlug = new Map(industryAcceptanceBriefs().map(brief => [brief.slug, brief]));
  const manifestPath = runAcceptance(opts.manifestPath, opts.reuseExisting);
  const manifest = readJson(manifestPath);
  const qaDir = path.join(path.dirname(manifest.issueLog || manifestPath), 'cross-industry-regression');
  fs.mkdirSync(qaDir, { recursive: true });

  const decks = (manifest.decks || []).map(deck => {
    const brief = briefBySlug.get(deck.slug) || {};
    const validation = validateDeckFormal(deck, brief);
    const validationPath = path.join(qaDir, `${deck.slug}.formal-summary.json`);
    writeJson(validationPath, validation);
    const plan = readJson(deck.plan);
    const normalizedPlan = normalizeDeckPlan(plan);
    return {
      slug: deck.slug,
      label: deck.label,
      industry: deck.industry,
      planPath: deck.plan,
      previewDir: deck.previewDir,
      normalizedPlan,
      formalValidation: Object.assign({}, validation, { file: rel(validationPath) })
    };
  });

  const similarity = auditCrossIndustrySimilarity(decks, { maxHash: opts.maxHash });
  const formalFailures = decks
    .filter(deck => !(deck.formalValidation && deck.formalValidation.success === true))
    .map(deck => deck.slug);
  const report = Object.assign({}, similarity, {
    generatedAt: new Date().toISOString(),
    manifest: rel(manifestPath),
    formalFailures
  });
  const reportPath = path.join(qaDir, 'cross-industry-similarity-report.json');
  const markdownPath = path.join(qaDir, 'cross-industry-similarity-report.md');
  writeJson(reportPath, report);
  writeText(markdownPath, markdownReport(report, manifestPath));

  const success = formalFailures.length === 0 && report.status !== 'fail';
  console.log(JSON.stringify({
    success,
    status: report.status,
    manifest: rel(manifestPath),
    report: rel(reportPath),
    markdown: rel(markdownPath),
    formalFailures,
    failCount: report.failCount,
    reviewCount: report.reviewCount
  }, null, 2));
  if (!success) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(error.stack || error.message || error);
  process.exit(1);
}

#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const opts = {
    samplePlan: 'examples/sample-deck-plan.json',
    sampleOut: 'out/verify-delivery/sample.pptx',
    previewDir: 'out/verify-delivery/preview',
    qualityMode: 'formal',
    skipPreview: false,
    summary: true
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--sample-plan') opts.samplePlan = argv[++i];
    else if (arg === '--sample-out') opts.sampleOut = argv[++i];
    else if (arg === '--preview-dir') opts.previewDir = argv[++i];
    else if (arg === '--quality-mode') opts.qualityMode = argv[++i];
    else if (arg === '--skip-preview') opts.skipPreview = true;
    else if (arg === '--full-json') opts.summary = false;
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  return opts;
}

function usage() {
  console.error([
    'Usage: node scripts/verify_delivery.js [--skip-preview] [--quality-mode formal|delivery]',
    '',
    'Runs skill metadata validation, readiness audits, sample PPTX generation,',
    'and formal visual QA. On machines without Keynote, use --skip-preview or',
    'let validate_pptx report visual_preview_unavailable as a non-delivery fallback.'
  ].join('\n'));
}

function runStep(name, cmd, argv, opts = {}) {
  const started = Date.now();
  const result = cp.spawnSync(cmd, argv, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...opts
  });
  const row = {
    name,
    command: [cmd, ...argv].join(' '),
    status: result.status === 0 ? 'pass' : 'fail',
    elapsedMs: Date.now() - started,
    stdout: String(result.stdout || '').trim(),
    stderr: String(result.stderr || '').trim()
  };
  console.log(`${row.status.toUpperCase()} ${name} ${row.elapsedMs}ms`);
  if (row.status === 'fail') {
    if (row.stdout) console.log(row.stdout.slice(-4000));
    if (row.stderr) console.error(row.stderr.slice(-8000));
  }
  return row;
}

function keynoteAvailable() {
  return fs.existsSync('/Applications/Keynote.app') && process.platform === 'darwin';
}

function parseJson(text = '') {
  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

function stepByName(steps = [], name = '') {
  return steps.find(step => step.name === name) || {};
}

function verificationSummary(report = {}, raw = {}) {
  const hardening = raw.hardening || {};
  const template = raw.template || {};
  const validation = raw.validation || {};
  const validationSummary = validation.summary || validation;
  const preview = validationSummary.preview || {};
  return {
    version: 'delivery-report-summary/v1',
    kind: 'delivery-verification',
    status: report.success ? 'pass' : 'fail',
    meta: {
      qualityMode: report.qualityMode,
      previewProvider: preview.provider || report.previewMode || 'none',
      previewStatus: preview.status || report.previewMode || 'unknown',
      hardeningEvidenceStrength: hardening.evidenceStrength || {},
      templateEvidenceStrength: template.evidenceStrength || {}
    },
    sections: {
      pass: report.steps.filter(step => step.status === 'pass').map(step => ({ id: step.name, label: step.name })),
      risk: report.steps.filter(step => step.status === 'fail').map(step => ({ id: step.name, label: `${step.name} failed` })),
      not_applicable: [],
      unavailable: preview.error ? [{ id: 'preview', label: preview.error, detail: preview.detail || '' }] : [{ id: 'none', label: 'None' }],
      next_actions: report.success ? [{ id: 'review', label: 'Review generated PPTX, render-meta, and preview images before external delivery.' }] : [{ id: 'fix', label: 'Fix failing delivery verification step and rerun verify:delivery.' }]
    }
  };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    usage();
    return;
  }
  const samplePlan = path.resolve(ROOT, opts.samplePlan);
  const sampleOut = path.resolve(ROOT, opts.sampleOut);
  const previewDir = path.resolve(ROOT, opts.previewDir);
  fs.mkdirSync(path.dirname(sampleOut), { recursive: true });
  fs.mkdirSync(previewDir, { recursive: true });

  const steps = [];
  steps.push(runStep('skill metadata', 'npm', ['run', 'validate:skill', '--silent']));
  steps.push(runStep('hardening readiness', process.execPath, ['scripts/audit_hardening_readiness.js', '--json']));
  steps.push(runStep('template readiness', process.execPath, ['scripts/audit_template_readiness.js', '--json']));
  steps.push(runStep('sample generation', process.execPath, ['scripts/generate_pptx.js', samplePlan, sampleOut]));

  if (!steps.some(step => step.status === 'fail')) {
    const validateArgs = [
      'scripts/validate_pptx.js',
      sampleOut,
      '--quality-mode',
      opts.qualityMode,
      '--plan',
      samplePlan,
      '--run-visual-qa'
    ];
    if (!opts.skipPreview) validateArgs.push('--preview-dir', previewDir);
    if (opts.summary) validateArgs.push('--summary');
    if (!keynoteAvailable() || opts.skipPreview) validateArgs.push('--preview-optional');
    steps.push(runStep('formal validation', process.execPath, validateArgs, { timeout: 180000 }));
  }

  const failed = steps.filter(step => step.status === 'fail');
  const raw = {
    hardening: parseJson(stepByName(steps, 'hardening readiness').stdout),
    template: parseJson(stepByName(steps, 'template readiness').stdout),
    validation: parseJson(stepByName(steps, 'formal validation').stdout)
  };
  const report = {
    version: 'delivery-verification/v1',
    success: failed.length === 0,
    qualityMode: opts.qualityMode,
    samplePlan: path.relative(ROOT, samplePlan),
    sampleOut: path.relative(ROOT, sampleOut),
    previewDir: path.relative(ROOT, previewDir),
    previewMode: opts.skipPreview ? 'skipped' : (keynoteAvailable() ? 'keynote' : 'metadata-fallback'),
    steps: steps.map(step => ({
      name: step.name,
      status: step.status,
      elapsedMs: step.elapsedMs,
      command: step.command
    })),
    auditEvidenceStrength: {
      hardening: raw.hardening && raw.hardening.evidenceStrength || {},
      template: raw.template && raw.template.evidenceStrength || {}
    }
  };
  report.summary = verificationSummary(report, raw);
  console.log(JSON.stringify(report, null, 2));
  if (failed.length) process.exit(1);
}

try {
  main();
} catch (err) {
  usage();
  console.error(err.stack || err.message || err);
  process.exit(1);
}

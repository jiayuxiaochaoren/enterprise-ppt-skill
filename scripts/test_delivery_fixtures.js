const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE_DIR = path.join(ROOT, 'examples', 'delivery-fixtures');
const OUT = path.join(ROOT, 'outputs', 'test-delivery-fixtures');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

[
  'finance-report.md',
  'manufacturing-operations.md',
  'case-gallery.md',
  'scanned-pdf-ocr-risk.md',
  'asset-authorization-missing.md'
].forEach(file => {
  assert.ok(fs.existsSync(path.join(FIXTURE_DIR, file)), `${file} fixture should exist`);
});

function runDelivery(name, args) {
  const result = cp.spawnSync(process.execPath, ['scripts/material_to_delivery.js', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 180000
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

const pause = runDelivery('manufacturing-pause', [
  path.join(FIXTURE_DIR, 'manufacturing-operations.md'),
  '--out-dir',
  path.join(OUT, 'manufacturing-pause'),
  '--skip-preview'
]);
assert.equal(pause.status, 'awaiting_model_extraction');

const complete = runDelivery('finance-complete', [
  path.join(FIXTURE_DIR, 'finance-report.md'),
  '--out-dir',
  path.join(OUT, 'finance-complete'),
  '--auto-draft',
  '--skip-preview',
  '--quality-mode',
  'draft',
  '--summary-md',
  path.join(OUT, 'finance-complete', 'summary.md')
]);
assert.equal(complete.status, 'complete');
assert.ok(fs.existsSync(path.join(OUT, 'finance-complete', 'summary.md')));

const riskBundle = cp.spawnSync(process.execPath, [
  'scripts/material_ingest.js',
  path.join(FIXTURE_DIR, 'scanned-pdf-ocr-risk.md'),
  '--out',
  path.join(OUT, 'ocr-risk-bundle.json')
], {
  cwd: ROOT,
  encoding: 'utf8'
});
assert.equal(riskBundle.status, 0, riskBundle.stderr || riskBundle.stdout);
const bundle = JSON.parse(fs.readFileSync(path.join(OUT, 'ocr-risk-bundle.json'), 'utf8'));
assert.equal(bundle.ingestReport.version, 'material-ingest-report/v1');

console.log('delivery fixtures ok');

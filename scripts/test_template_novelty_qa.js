const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const reportPath = path.join(
  ROOT,
  'outputs',
  '019e583b-b589-7043-8c51-700ce5757a00',
  'presentations',
  'template-page-family-fixtures',
  'qa',
  'template-novelty-report.json'
);
const matrixPath = path.join(ROOT, 'assets', 'template-readiness-matrix.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readJsonIfExists(file) {
  return fs.existsSync(file) ? readJson(file) : null;
}

const report = readJsonIfExists(reportPath);

if (report) {
  assert.equal(report.version, 'template-novelty-report/v1');
  assert.equal(report.status, 'pass', 'templateNoveltyQA should pass for every page family');
  assert.equal(report.results.length, 20, 'templateNoveltyQA should cover 20 page families');
  assert.ok(fs.existsSync(path.join(ROOT, report.beforeAfterSheet)), 'before/after contact sheet should exist');

  for (const result of report.results) {
    assert.equal(result.status, 'pass', `${result.id} should differ from its generic baseline`);
    assert.ok(
      result.hashDistance >= report.threshold.hashDistance ||
        result.lumaDistance >= report.threshold.lumaDistance ||
        result.sizeDelta >= report.threshold.sizeDelta,
      `${result.id} should meet at least one novelty threshold`
    );
    assert.ok(fs.existsSync(path.join(ROOT, result.baselinePreview)), `${result.id} baseline preview should exist`);
    assert.ok(fs.existsSync(path.join(ROOT, result.upgradedPreview)), `${result.id} upgraded preview should exist`);
  }
} else {
  const matrix = readJson(matrixPath);
  const rows = matrix.pageFamilies || [];
  assert.equal(rows.length, 20, 'template novelty static contract should cover 20 page families');
  for (const row of rows) {
    assert.equal(row.statuses.qa, 'pass', `${row.id} QA status`);
    assert.ok(row.renderer && row.renderer.approvedDistinctBranch === true, `${row.id} should record a distinct renderer branch`);
    assert.ok(row.qa && row.qa.approvedFamilyGate === true, `${row.id} should record an approved family QA gate`);
    assert.ok(row.fixtures && /\.png$/i.test(row.fixtures.preview || ''), `${row.id} should record a preview artifact path`);
  }
}

console.log('template novelty QA ok');

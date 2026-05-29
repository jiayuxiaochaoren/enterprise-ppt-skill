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
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

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

console.log('template novelty QA ok');

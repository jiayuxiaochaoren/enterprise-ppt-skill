const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const matrix = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'template-readiness-matrix.json'), 'utf8'));
const manifestPath = path.join(ROOT, 'outputs', '019e583b-b589-7043-8c51-700ce5757a00', 'presentations', 'template-page-family-fixtures', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

assert.equal(matrix.pageFamilies.length, 20, 'readiness matrix should cover 20 priority page families');
assert.equal(manifest.results.length, 20, 'fixture manifest should include 20 page family fixtures');

const manifestIds = new Set(manifest.results.map(result => result.id));
for (const row of matrix.pageFamilies) {
  assert.ok(manifestIds.has(row.id), `${row.id} should be present in fixture manifest`);
  assert.notEqual(row.statuses.renderer, 'missing', `${row.id} should not have a missing renderer branch`);
  assert.equal(row.statuses.fixturePptx, 'pass', `${row.id} should have fixture PPTX evidence`);
  assert.equal(row.statuses.previewPng, 'pass', `${row.id} should have fixture preview evidence`);
  assert.ok(row.fixtures && row.fixtures.plan, `${row.id} should record fixture plan path`);
  assert.ok(row.fixtures && row.fixtures.pptx, `${row.id} should record fixture PPTX path`);
  assert.ok(row.fixtures && row.fixtures.preview, `${row.id} should record fixture preview path`);

  const planPath = path.join(ROOT, row.fixtures.plan);
  const pptxPath = path.join(ROOT, row.fixtures.pptx);
  const previewPath = path.join(ROOT, row.fixtures.preview);
  const renderMetaPath = row.fixtures.renderMeta
    ? path.join(ROOT, row.fixtures.renderMeta)
    : `${pptxPath}.render-meta.json`;
  assert.ok(fs.existsSync(planPath), `${row.id} fixture plan should exist`);
  assert.ok(fs.existsSync(pptxPath), `${row.id} fixture PPTX should exist`);
  assert.ok(fs.existsSync(previewPath), `${row.id} fixture preview should exist`);
  assert.ok(fs.existsSync(renderMetaPath), `${row.id} fixture render-meta should exist`);
  assert.ok(fs.statSync(previewPath).size > 10000, `${row.id} preview should not be empty`);

  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  assert.equal(plan.slides.length, 1, `${row.id} fixture should be a one-page vertical slice`);
  assert.equal(plan.slides[0].layoutVariant, row.id, `${row.id} fixture should route to its page family`);

  const renderMeta = JSON.parse(fs.readFileSync(renderMetaPath, 'utf8'));
  assert.equal(renderMeta.version, 'render-meta/v1', `${row.id} render-meta should use v1 schema`);
  assert.equal(renderMeta.slideCount, 1, `${row.id} render-meta should describe exactly one slide`);
  assert.equal(renderMeta.slides.length, 1, `${row.id} render-meta should include one slide record`);
  const slideMeta = renderMeta.slides[0];
  assert.ok(slideMeta.rendererMatch && slideMeta.rendererMatch.rendererId, `${row.id} should record renderer identity`);
  assert.notEqual(slideMeta.rendererMatch.matchKind, 'fallback', `${row.id} must not use fallback renderer`);
  assert.deepEqual(slideMeta.missingRequiredComponents || [], [], `${row.id} should have no missing required components`);
  const removedRouteFields = slideMeta.routeSanitization && Array.isArray(slideMeta.routeSanitization.removed)
    ? slideMeta.routeSanitization.removed
    : [];
  assert.equal(removedRouteFields.length, 0, `${row.id} should not carry stale route fields into fixture rendering`);

  const qa = cp.spawnSync(process.execPath, ['scripts/visual_qa.js', pptxPath, '--plan', planPath, '--quality-mode', 'formal', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 120000
  });
  const qaResult = JSON.parse(qa.stdout);
  assert.notEqual(qaResult.render_meta_schema_qa.status, 'fail', `${row.id} render-meta schema QA should pass`);
  assert.notEqual(qaResult.component_consumption_qa.status, 'fail', `${row.id} component consumption QA should pass`);
  assert.notEqual(qaResult.overlay_contract_qa.status, 'fail', `${row.id} overlay contract QA should pass`);
}

console.log('template page family fixtures ok');

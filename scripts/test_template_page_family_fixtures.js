const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const matrix = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'template-readiness-matrix.json'), 'utf8'));
const manifestPath = path.join(ROOT, 'outputs', '019e583b-b589-7043-8c51-700ce5757a00', 'presentations', 'template-page-family-fixtures', 'manifest.json');
const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  : null;
const OUT = path.join(ROOT, 'outputs', 'test-template-page-family-fixtures-current');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let visualQaRunId = 0;

function assertNativeEvidence(component, label) {
  assert.ok(component, `${label} should exist`);
  assert.ok(component.nativeSlot, `${label} should record nativeSlot`);
  assert.ok(component.rendererMethod, `${label} should record rendererMethod`);
  assert.ok(Number(component.drawnCount || 0) > 0, `${label} should record drawnCount > 0`);
  const bbox = component.bbox || {};
  ['x', 'y', 'w', 'h'].forEach(field => {
    assert.ok(Number.isFinite(Number(bbox[field])), `${label} bbox.${field} should be numeric`);
  });
  assert.ok(Number(bbox.w) > 0, `${label} bbox.w should be positive`);
  assert.ok(Number(bbox.h) > 0, `${label} bbox.h should be positive`);
}

function runVisualQaJson(args) {
  const stdoutPath = path.join(OUT, `visual-qa-${++visualQaRunId}.json`);
  const stdoutFd = fs.openSync(stdoutPath, 'w');
  try {
    const qa = cp.spawnSync(process.execPath, args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', stdoutFd, 'pipe'],
      timeout: 120000
    });
    fs.closeSync(stdoutFd);
    return {
      status: qa.status == null ? 1 : qa.status,
      stdout: fs.readFileSync(stdoutPath, 'utf8'),
      stderr: String(qa.stderr || '')
    };
  } catch (error) {
    fs.closeSync(stdoutFd);
    throw error;
  }
}

assert.equal(matrix.pageFamilies.length, 20, 'readiness matrix should cover 20 priority page families');
if (manifest) {
  assert.equal(manifest.results.length, 20, 'fixture manifest should include 20 page family fixtures');
}

const manifestIds = manifest
  ? new Set(manifest.results.map(result => result.id))
  : new Set(matrix.pageFamilies.map(row => row.id));
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
  assert.ok(row.fixtures.pptx.startsWith('outputs/'), `${row.id} fixture PPTX path should be generated-output evidence`);
  assert.ok(row.fixtures.preview.startsWith('outputs/'), `${row.id} fixture preview path should be generated-output evidence`);
  assert.match(row.fixtures.preview, /\.png$/i, `${row.id} fixture preview should be a PNG path`);
  if (fs.existsSync(pptxPath)) assert.ok(fs.statSync(pptxPath).size > 0, `${row.id} fixture PPTX should not be empty`);
  if (fs.existsSync(previewPath)) assert.ok(fs.statSync(previewPath).size > 10000, `${row.id} preview should not be empty`);
  if (fs.existsSync(renderMetaPath)) assert.ok(fs.statSync(renderMetaPath).size > 0, `${row.id} fixture render-meta should not be empty`);

  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  assert.equal(plan.slides.length, 1, `${row.id} fixture should be a one-page vertical slice`);
  assert.equal(plan.slides[0].layoutVariant, row.id, `${row.id} fixture should route to its page family`);

  const currentPptxPath = path.join(OUT, `${row.id}.pptx`);
  cp.execFileSync(process.execPath, ['scripts/generate_pptx.js', planPath, currentPptxPath], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 120000
  });
  const currentRenderMetaPath = `${currentPptxPath}.render-meta.json`;
  assert.ok(fs.existsSync(currentRenderMetaPath), `${row.id} current render-meta should be generated`);

  const renderMeta = JSON.parse(fs.readFileSync(currentRenderMetaPath, 'utf8'));
  assert.equal(renderMeta.version, 'render-meta/v1', `${row.id} render-meta should use v1 schema`);
  assert.equal(renderMeta.slideCount, 1, `${row.id} render-meta should describe exactly one slide`);
  assert.equal(renderMeta.slides.length, 1, `${row.id} render-meta should include one slide record`);
  const slideMeta = renderMeta.slides[0];
  assert.ok(slideMeta.rendererMatch && slideMeta.rendererMatch.rendererId, `${row.id} should record renderer identity`);
  assert.notEqual(slideMeta.rendererMatch.matchKind, 'fallback', `${row.id} must not use fallback renderer`);
  assert.deepEqual(slideMeta.missingRequiredComponents || [], [], `${row.id} should have no missing required components`);
  const plannedRequired = (slideMeta.plannedComponents || []).filter(component => component.required !== false);
  const consumedRendered = (slideMeta.consumedComponents || []).filter(component => component.rendered === true);
  const consumedById = new Map(consumedRendered.map(component => [component.id, component]));
  const drawnById = new Map((slideMeta.drawnComponents || []).map(component => [component.id, component]));
  plannedRequired.forEach(component => {
    const consumed = consumedById.get(component.id);
    assert.ok(consumed, `${row.id} required planned component ${component.id} should have rendered consumption evidence`);
    if (consumed.mode === 'native-renderer') {
      assertNativeEvidence(consumed, `${row.id} consumedComponents.${component.id}`);
      assertNativeEvidence(drawnById.get(component.id), `${row.id} drawnComponents.${component.id}`);
    }
  });
  consumedRendered
    .filter(component => component.mode === 'native-renderer')
    .forEach(component => {
      assertNativeEvidence(component, `${row.id} consumedComponents.${component.id}`);
      assertNativeEvidence(drawnById.get(component.id), `${row.id} drawnComponents.${component.id}`);
    });
  const removedRouteFields = slideMeta.routeSanitization && Array.isArray(slideMeta.routeSanitization.removed)
    ? slideMeta.routeSanitization.removed
    : [];
  assert.equal(removedRouteFields.length, 0, `${row.id} should not carry stale route fields into fixture rendering`);

  const qa = runVisualQaJson(['scripts/visual_qa.js', currentPptxPath, '--plan', planPath, '--quality-mode', 'formal', '--json']);
  const qaResult = JSON.parse(qa.stdout);
  assert.notEqual(qaResult.render_meta_schema_qa.status, 'fail', `${row.id} render-meta schema QA should pass`);
  assert.notEqual(qaResult.component_consumption_qa.status, 'fail', `${row.id} component consumption QA should pass`);
  assert.notEqual(qaResult.overlay_contract_qa.status, 'fail', `${row.id} overlay contract QA should pass`);
}

console.log('template page family fixtures ok');

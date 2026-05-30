const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const pptxgen = require('pptxgenjs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-validate-preview-fallback');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const pptxPath = path.join(OUT, 'preview-fallback.pptx');
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };
  slide.addText('预览降级验证', {
    x: 0.8,
    y: 0.8,
    w: 6,
    h: 0.5,
    fontFace: 'PingFang SC',
    fontSize: 28,
    color: '111827'
  });
  await pptx.writeFile({ fileName: pptxPath });
  fs.writeFileSync(`${pptxPath}.render-meta.json`, `${JSON.stringify({
    version: 'render-meta/v1',
    slideCount: 1,
    slides: [{
      slide: 1,
      type: 'cover',
      rendererMatch: {
        requestedType: 'cover',
        matchedType: 'cover',
        matchKind: 'exact',
        rendererId: 'cover',
        rendererName: 'testCover',
        source: 'test'
      },
      assetDecision: { version: 'asset-decision/v1', status: 'none', mode: 'structure-only' },
      plannedComponents: [],
      unknownComponents: [],
      drawnComponents: [],
      consumedComponents: [],
      missingRequiredComponents: [],
      textBoxes: []
    }]
  }, null, 2)}\n`, 'utf8');

  const result = cp.spawnSync(process.execPath, [
    'scripts/validate_pptx.js',
    pptxPath,
    '--formal',
    '--preview-dir',
    path.join(OUT, 'preview'),
    '--preview-optional',
    '--summary',
    '--summary-md',
    path.join(OUT, 'validation-summary.md')
  ], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, PPTX_DISABLE_KEYNOTE_PREVIEW: '1' }
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const summary = JSON.parse(result.stdout);
  assert.ok(['metadata_fallback', 'unavailable'].includes(summary.preview.status), `unexpected preview status: ${summary.preview.status}`);
  assert.ok(['metadata_fallback', 'unavailable'].includes(summary.preview.provider), `unexpected preview provider: ${summary.preview.provider}`);
  assert.equal(summary.preview.error, 'visual_preview_unavailable');
  assert.equal(summary.visual_qa.success, true);
  assert.equal(summary.report.version, 'delivery-report-summary/v1');
  assert.equal(summary.report.kind, 'validation');
  assert.ok(summary.report.sections.unavailable.some(item => item.id === 'preview' || item.id === 'screenshot_preview'));
  assert.ok(summary.next_actions.some(item => /Keynote|metadata/.test(item)));
  assert.ok(fs.existsSync(path.join(OUT, 'validation-summary.md')));
  console.log('validate preview fallback ok');
})().catch(err => {
  console.error(err);
  process.exit(1);
});

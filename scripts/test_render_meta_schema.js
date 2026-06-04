const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const pptxgen = require('pptxgenjs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-render-meta-schema');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const pptxPath = path.join(OUT, 'invalid-render-meta.pptx');
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  const slide = pptx.addSlide();
  slide.addText('Render-meta schema gate', {
    x: 0.8,
    y: 0.8,
    w: 5,
    h: 0.4,
    fontFace: 'Avenir Next',
    fontSize: 24,
    color: '111827'
  });
  await pptx.writeFile({ fileName: pptxPath });
  fs.writeFileSync(`${pptxPath}.render-meta.json`, `${JSON.stringify({
    version: 'render-meta/v1',
    slideCount: 1,
    slides: [{
      slide: 1,
      type: 'content',
      rendererMatch: {
        requestedType: 'content',
        matchedType: 'content',
        matchKind: 'exact',
        rendererId: 'content'
      },
      assetDecision: {
        version: 'asset-decision/v1',
        status: 'none',
        mode: 'structure-only',
        action: 'structure_only',
        reason: 'no image required for resolved slide route',
        riskLevel: 'low',
        originalRole: 'none',
        resolvedRole: 'none',
        provenanceClass: 'none',
        proofEligibility: ['none'],
        boundAssetCount: 0
      },
      plannedComponents: [],
      unknownComponents: [],
      drawnComponents: [],
      consumedComponents: [],
      missingRequiredComponents: [],
      textBoxes: []
    }]
  }, null, 2)}\n`, 'utf8');

  const qa = cp.spawnSync(process.execPath, ['scripts/visual_qa.js', pptxPath, '--quality-mode', 'formal', '--json'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  assert.notEqual(qa.status, 0, 'formal visual QA should fail malformed render-meta schema');
  const result = JSON.parse(qa.stdout);
  assert.equal(result.render_meta_schema_qa.status, 'fail');
  assert.equal(result.findings.some(f => f.type === 'renderMetaRendererFieldMissing' && /rendererName/.test(f.message)), true);
  assert.equal(result.findings.some(f => f.type === 'renderMetaRenderRouteMissing'), true);

  console.log('render-meta schema gate ok');
})().catch(err => {
  console.error(err);
  process.exit(1);
});

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const pptxgen = require('pptxgenjs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-visual-qa-content-coverage');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const pptxPath = path.join(OUT, 'blank-body.pptx');
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
const slide = pptx.addSlide();
slide.background = { color: 'FFFFFF' };
slide.addText('只有标题的内容页', { x: 0.8, y: 0.65, w: 7.4, h: 0.36, fontFace: 'PingFang SC', fontSize: 24, bold: true, color: '111827' });
slide.addText('页脚', { x: 0.8, y: 7.05, w: 2.0, h: 0.16, fontFace: 'PingFang SC', fontSize: 8, color: '6B7280' });

pptx.writeFile({ fileName: pptxPath }).then(() => {
  fs.writeFileSync(`${pptxPath}.render-meta.json`, JSON.stringify({
    version: 'render-meta/v1',
    slideCount: 1,
    slides: [{
      slide: 1,
      type: 'content',
      rendererMatch: {
        requestedType: 'content',
        matchedType: 'content',
        matchKind: 'exact',
        rendererId: 'content',
        rendererName: 'testContent',
        source: 'test'
      },
      assetDecision: {
        version: 'asset-decision/v1',
        status: 'none',
        mode: 'structure-only'
      },
      plannedComponents: [],
      unknownComponents: [],
      drawnComponents: [],
      consumedComponents: [],
      missingRequiredComponents: [],
      textBoxes: []
    }]
  }, null, 2));
  const qa = cp.spawnSync(process.execPath, ['scripts/visual_qa.js', pptxPath, '--json'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  assert.notEqual(qa.status, 0, 'blank content body should fail visual QA');
  const result = JSON.parse(qa.stdout);
  assert.equal(result.content_coverage_qa.status, 'fail');
  assert.equal(result.findings.some(f => f.type === 'mainBodyMissingContent'), true);
  console.log('visual QA content coverage ok');
}).catch(err => {
  console.error(err);
  process.exit(1);
});

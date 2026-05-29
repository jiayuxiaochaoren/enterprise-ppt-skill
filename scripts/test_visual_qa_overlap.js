const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const pptxgen = require('pptxgenjs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-visual-qa-overlap');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

async function writeFixture(name, covered) {
  const pptxPath = path.join(OUT, `${name}.pptx`);
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };
  if (!covered) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.92,
      y: 1.16,
      w: 3.35,
      h: 0.58,
      fill: { color: 'E5E7EB', transparency: 0 },
      line: { color: 'E5E7EB', transparency: 100 }
    });
  }
  slide.addText('Visible operating margin signal', {
    x: 1.0,
    y: 1.25,
    w: 3.1,
    h: 0.34,
    fontFace: 'Avenir Next',
    fontSize: 18,
    color: '111827'
  });
  if (covered) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.94,
      y: 1.18,
      w: 3.3,
      h: 0.54,
      fill: { color: '111827', transparency: 0 },
      line: { color: '111827', transparency: 100 }
    });
  }
  await pptx.writeFile({ fileName: pptxPath });
  return pptxPath;
}

function runQa(pptxPath) {
  const qa = cp.spawnSync(process.execPath, ['scripts/visual_qa.js', pptxPath, '--json'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  return { status: qa.status, stdout: qa.stdout, result: JSON.parse(qa.stdout) };
}

(async () => {
  const goodPptx = await writeFixture('background-before-text', false);
  const good = runQa(goodPptx);
  assert.equal(good.status, 0, 'background rectangles drawn before text should not fail visual QA');
  assert.equal(good.result.findings.some(f => f.type === 'textCoveredByShape'), false);

  const badPptx = await writeFixture('text-covered-by-shape', true);
  const bad = runQa(badPptx);
  assert.notEqual(bad.status, 0, 'a later filled rectangle covering text should fail visual QA');
  assert.equal(bad.result.findings.some(f => f.type === 'textCoveredByShape'), true);

  console.log('visual QA overlap ok');
})().catch(err => {
  console.error(err);
  process.exit(1);
});

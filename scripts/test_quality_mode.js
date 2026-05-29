const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const pptxgen = require('pptxgenjs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-quality-mode');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

async function makePptx() {
  const pptxPath = path.join(OUT, 'render-meta-missing.pptx');
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };
  slide.addText('质量模式验证页', {
    x: 0.8,
    y: 0.8,
    w: 5.0,
    h: 0.42,
    fontFace: 'PingFang SC',
    fontSize: 24,
    color: '111827'
  });
  await pptx.writeFile({ fileName: pptxPath });
  return pptxPath;
}

function runVisualQa(pptxPath, mode) {
  const qa = cp.spawnSync(process.execPath, ['scripts/visual_qa.js', pptxPath, '--quality-mode', mode, '--json'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  return { status: qa.status, result: JSON.parse(qa.stdout) };
}

(async () => {
  const pptxPath = await makePptx();
  const draft = runVisualQa(pptxPath, 'draft');
  assert.equal(draft.status, 0, 'draft visual QA can keep missing render-meta as review');
  assert.equal(draft.result.quality_mode, 'draft');
  assert.equal(draft.result.findings.some(f => f.type === 'renderMetaMissing' && f.level === 'review'), true);

  const formal = runVisualQa(pptxPath, 'formal');
  assert.notEqual(formal.status, 0, 'formal visual QA should promote missing render-meta to fail');
  const finding = formal.result.findings.find(f => f.type === 'renderMetaMissing');
  assert.equal(finding.level, 'fail');
  assert.equal(finding.originalLevel, 'review');
  assert.equal(finding.fatalBecauseOfQualityMode, 'formal');
  assert.ok(formal.result.severity_policy.promotedTypes.includes('renderMetaMissing'));

  console.log('quality mode severity policy ok');
})().catch(err => {
  console.error(err);
  process.exit(1);
});

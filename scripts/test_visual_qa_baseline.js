const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const zlib = require('zlib');
const pptxgen = require('pptxgenjs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-visual-qa-baseline');
const PREVIEW = path.join(OUT, 'preview');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(PREVIEW, { recursive: true });

function crc32(buf) {
  const table = crc32.table || (crc32.table = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  }));
  let c = 0xffffffff;
  for (const byte of buf) c = table[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  name.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return out;
}

function writePng(file, width, height, drawRightBlock) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const inBlock = drawRightBlock && x > width * 0.64 && x < width * 0.88 && y > height * 0.25 && y < height * 0.78;
      const v = inBlock ? 32 : 255;
      const i = row + 1 + x * 3;
      raw[i] = v;
      raw[i + 1] = v;
      raw[i + 2] = v;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const png = Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
  fs.writeFileSync(file, png);
}

const pptxPath = path.join(OUT, 'baseline-carrier.pptx');
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
const slide = pptx.addSlide();
slide.addText('截图基线验证', { x: 0.8, y: 0.7, w: 5, h: 0.4, fontFace: 'PingFang SC', fontSize: 24, color: '111827' });

pptx.writeFile({ fileName: pptxPath }).then(() => {
  fs.writeFileSync(`${pptxPath}.render-meta.json`, JSON.stringify({
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
  }, null, 2));
  writePng(path.join(OUT, 'baseline.png'), 320, 180, true);
  writePng(path.join(PREVIEW, 'slide1.png'), 320, 180, false);
  const manifestPath = path.join(OUT, 'baseline-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    version: 'visual-baseline/v1',
    thresholds: { maxHashDistance: 64, maxLumaDistance: 255, maxBboxDelta: 9 },
    slides: {
      '1': {
        file: 'baseline.png',
        regions: {
          rightEvidence: { minCoverage: 0.04 }
        }
      }
    }
  }, null, 2));
  const qa = cp.spawnSync(process.execPath, ['scripts/visual_qa.js', pptxPath, '--preview-dir', PREVIEW, '--baseline', manifestPath, '--json'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  assert.notEqual(qa.status, 0, 'missing baseline region should fail visual QA');
  const result = JSON.parse(qa.stdout);
  assert.equal(result.screenshot_baseline_qa.status, 'fail');
  assert.equal(result.findings.some(f => f.type === 'baselineRegionMissing'), true);
  console.log('visual QA screenshot baseline ok');
}).catch(err => {
  console.error(err);
  process.exit(1);
});

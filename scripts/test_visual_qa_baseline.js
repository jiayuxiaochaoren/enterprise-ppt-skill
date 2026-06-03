const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const zlib = require('zlib');
const pptxgen = require('pptxgenjs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-visual-qa-baseline');
const PREVIEW = path.join(OUT, 'preview');
let visualQaRunId = 0;

function runVisualQa(args) {
  const stdoutPath = path.join(OUT, `visual-qa-${++visualQaRunId}.json`);
  const stdoutFd = fs.openSync(stdoutPath, 'w');
  try {
    const qa = cp.spawnSync(process.execPath, args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', stdoutFd, 'pipe']
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

function writePng(file, width, height, blocks = []) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const inBlock = blocks.some(block =>
        x >= width * block.x &&
        x <= width * (block.x + block.w) &&
        y >= height * block.y &&
        y <= height * (block.y + block.h)
      );
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
['右侧证据区', '卡片区域', '主体区域', '页脚区域'].forEach(title => {
  const slide = pptx.addSlide();
  slide.addText(`截图基线验证：${title}`, { x: 0.8, y: 0.7, w: 6, h: 0.4, fontFace: 'PingFang SC', fontSize: 24, color: '111827' });
});

function renderMetaSlide(slideNo) {
  return {
    slide: slideNo,
    type: 'cover',
    rendererMatch: {
      requestedType: 'cover',
      matchedType: 'cover',
      matchKind: 'exact',
      rendererId: 'cover',
      rendererName: 'testCover',
      source: 'test'
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
  };
}

const rightEvidenceBlocks = [{ x:0.66, y:0.28, w:0.18, h:0.46 }];
const cardBlocks = [
  { x:0.14, y:0.32, w:0.15, h:0.18 },
  { x:0.34, y:0.32, w:0.15, h:0.18 },
  { x:0.54, y:0.32, w:0.15, h:0.18 },
  { x:0.74, y:0.32, w:0.15, h:0.18 }
];
const chartBodyBlocks = [{ x:0.42, y:0.34, w:0.32, h:0.26 }];
const shiftedBodyBlocks = [{ x:0.64, y:0.34, w:0.32, h:0.26 }];
const footerBlocks = [{ x:0.12, y:0.90, w:0.76, h:0.035 }];

pptx.writeFile({ fileName: pptxPath }).then(() => {
  fs.writeFileSync(`${pptxPath}.render-meta.json`, JSON.stringify({
    version: 'render-meta/v1',
    slideCount: 4,
    slides: [1, 2, 3, 4].map(renderMetaSlide)
  }, null, 2));
  writePng(path.join(OUT, 'baseline-right.png'), 320, 180, rightEvidenceBlocks);
  writePng(path.join(OUT, 'baseline-cards.png'), 320, 180, cardBlocks);
  writePng(path.join(OUT, 'baseline-chart.png'), 320, 180, chartBodyBlocks);
  writePng(path.join(OUT, 'baseline-footer.png'), 320, 180, footerBlocks);
  writePng(path.join(PREVIEW, 'slide1.png'), 320, 180, []);
  writePng(path.join(PREVIEW, 'slide2.png'), 320, 180, cardBlocks.slice(0, 3));
  writePng(path.join(PREVIEW, 'slide3.png'), 320, 180, shiftedBodyBlocks);
  writePng(path.join(PREVIEW, 'slide4.png'), 320, 180, []);
  const manifestPath = path.join(OUT, 'baseline-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    version: 'visual-baseline/v1',
    thresholds: { maxHashDistance: 64, maxLumaDistance: 255, maxBboxDelta: 9 },
    slides: {
      '1': {
        file: 'baseline-right.png',
        regions: {
          rightEvidence: { minCoverage: 0.04 }
        }
      },
      '2': {
        file: 'baseline-cards.png',
        regions: {
          cardGrid: { minCoverage: 0.18 }
        }
      },
      '3': {
        file: 'baseline-chart.png',
        thresholds: {
          maxRegionBBoxDelta: 0.12
        },
        regions: {
          chartBoard: { minCoverage: 0.12 }
        }
      },
      '4': {
        file: 'baseline-footer.png',
        regions: {
          footer: { minCoverage: 0.25 }
        }
      }
    }
  }, null, 2));
  const qa = runVisualQa(['scripts/visual_qa.js', pptxPath, '--preview-dir', PREVIEW, '--baseline', manifestPath, '--json']);
  assert.notEqual(qa.status, 0, 'missing baseline region should fail visual QA');
  const result = JSON.parse(qa.stdout);
  assert.equal(result.screenshot_baseline_qa.status, 'fail');
  assert.equal(result.findings.some(f => f.type === 'baselineRegionMissing'), true);
  const missingRegions = result.findings
    .filter(f => f.type === 'baselineRegionMissing')
    .map(f => f.regionName || (String(f.message || '').match(/region ([^ ]+)/) || [])[1])
    .filter(Boolean);
  assert.deepEqual(new Set(missingRegions), new Set(['rightEvidence', 'cardGrid', 'footer']));
  const rightEvidenceFinding = result.findings.find(f => f.type === 'baselineRegionMissing' && f.regionName === 'rightEvidence');
  assert.equal(rightEvidenceFinding.reason, 'region_coverage_below_minimum');
  assert.equal(typeof rightEvidenceFinding.actualCoverage, 'number');
  assert.equal(typeof rightEvidenceFinding.expectedCoverage, 'number');
  assert.equal(typeof rightEvidenceFinding.localHashDistance, 'number');
  const shiftFinding = result.findings.find(f => f.type === 'baselineRegionBBoxShift' && f.regionName === 'chartBoard');
  assert.ok(shiftFinding, 'shifted main visual should fail with a region bbox shift finding');
  assert.equal(shiftFinding.reason, 'region_bbox_delta_exceeded');
  assert.ok(shiftFinding.localBBoxDelta > shiftFinding.maxRegionBBoxDelta);
  const chartRegion = result.screenshot_baseline_qa.slides
    .find(slide => slide.slide === 3)
    .regions.find(region => region.name === 'chartBoard');
  assert.equal(typeof chartRegion.localHashDistance, 'number');
  assert.ok(chartRegion.localBBoxDelta > 0, 'chartBoard region should report local bbox drift');
  fs.unlinkSync(path.join(PREVIEW, 'slide4.png'));
  const missingPreviewQa = runVisualQa(['scripts/visual_qa.js', pptxPath, '--preview-dir', PREVIEW, '--baseline', manifestPath, '--json']);
  assert.notEqual(missingPreviewQa.status, 0, 'manifest slide without current preview should fail baseline QA');
  const missingPreviewResult = JSON.parse(missingPreviewQa.stdout);
  assert.equal(missingPreviewResult.screenshot_baseline_qa.status, 'fail');
  assert.equal(missingPreviewResult.findings.some(f => f.type === 'baselinePreviewMissing' && f.slide === 4), true);
  console.log('visual QA screenshot baseline ok');
}).catch(err => {
  console.error(err);
  process.exit(1);
});

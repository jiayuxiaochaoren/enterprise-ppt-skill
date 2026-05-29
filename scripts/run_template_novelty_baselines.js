#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const zlib = require('zlib');
const { ROOT, fixturePlans } = require('./template_page_family_fixtures');

const WORKSPACE = path.join(ROOT, 'outputs', '019e583b-b589-7043-8c51-700ce5757a00', 'presentations', 'template-page-family-fixtures');
const BASELINE_PLAN_DIR = path.join(WORKSPACE, 'baseline-plans');
const BASELINE_OUTPUT_DIR = path.join(WORKSPACE, 'baseline-output');
const BASELINE_PREVIEW_DIR = path.join(WORKSPACE, 'baseline-preview');
const CONTACT_DIR = path.join(WORKSPACE, 'contact-sheets');
const REPORT_PATH = path.join(WORKSPACE, 'qa', 'template-novelty-report.json');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, value, 'utf8');
}

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function runNode(script, args) {
  return cp.execFileSync(process.execPath, [path.join(ROOT, script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 180000
  }).trim();
}

function escapeXml(text = '') {
  return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

function svgImageHref(file) {
  const absolute = path.isAbsolute(file) ? file : path.join(ROOT, file);
  if (!fs.existsSync(absolute)) return escapeXml(file);
  const ext = path.extname(absolute).toLowerCase();
  const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${fs.readFileSync(absolute).toString('base64')}`;
}

function readFixtureManifest() {
  return JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'manifest.json'), 'utf8'));
}

function baselinePlan(plan) {
  const next = JSON.parse(JSON.stringify(plan));
  next.footer = `${next.footer || 'template'} baseline`;
  next.slides = next.slides.map(slide => {
    const copy = Object.assign({}, slide);
    copy.layoutVariant = 'baseline-generic';
    copy.variant = 'baseline-generic';
    delete copy.referenceRecipe;
    delete copy.referenceRecipeId;
    delete copy.referenceRecipeIds;
    delete copy.componentHints;
    delete copy.proofObject;
    delete copy.proof_object;
    copy.title = copy.title || 'Baseline generic slide';
    return copy;
  });
  return next;
}

function pngAverageHash(file) {
  const b = fs.readFileSync(file);
  if (b.length < 32 || b.toString('ascii', 1, 4) !== 'PNG') return '';
  let off = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  while (off < b.length) {
    const len = b.readUInt32BE(off);
    off += 4;
    const type = b.toString('ascii', off, off + 4);
    off += 4;
    const data = b.subarray(off, off + len);
    off += len + 4;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
  }
  if (!width || !height || bitDepth !== 8 || ![0, 2, 6].includes(colorType)) return '';
  const channels = colorType === 6 ? 4 : (colorType === 2 ? 3 : 1);
  const stride = width * channels;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(width * height * channels);
  let src = 0;
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : (pb <= pc ? b : c);
  };
  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    const row = raw.subarray(src, src + stride);
    src += stride;
    const out = pixels.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? out[x - channels] : 0;
      const up = prev ? prev[x] : 0;
      const upLeft = prev && x >= channels ? prev[x - channels] : 0;
      let val = row[x];
      if (filter === 1) val = (val + left) & 255;
      else if (filter === 2) val = (val + up) & 255;
      else if (filter === 3) val = (val + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) val = (val + paeth(left, up, upLeft)) & 255;
      out[x] = val;
    }
  }
  const vals = [];
  for (let gy = 0; gy < 8; gy++) {
    for (let gx = 0; gx < 8; gx++) {
      let sum = 0, count = 0;
      const y0 = Math.floor(gy * height / 8);
      const y1 = Math.max(y0 + 1, Math.floor((gy + 1) * height / 8));
      const x0 = Math.floor(gx * width / 8);
      const x1 = Math.max(x0 + 1, Math.floor((gx + 1) * width / 8));
      for (let y = y0; y < y1; y += Math.max(1, Math.floor((y1 - y0) / 10))) {
        for (let x = x0; x < x1; x += Math.max(1, Math.floor((x1 - x0) / 10))) {
          const i = y * stride + x * channels;
          sum += channels === 1 ? pixels[i] : (0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]);
          count += 1;
        }
      }
      vals.push(sum / Math.max(1, count));
    }
  }
  const avg = vals.reduce((a, v) => a + v, 0) / vals.length;
  return {
    hash: vals.map(v => v >= avg ? '1' : '0').join(''),
    grid: vals.map(v => Number(v.toFixed(2)))
  };
}

function hamming(a, b) {
  a = typeof a === 'string' ? a : (a && a.hash);
  b = typeof b === 'string' ? b : (b && b.hash);
  if (!a || !b || a.length !== b.length) return 64;
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n += 1;
  return n;
}

function lumaGridDistance(a, b) {
  const ga = a && a.grid;
  const gb = b && b.grid;
  if (!Array.isArray(ga) || !Array.isArray(gb) || ga.length !== gb.length) return 0;
  return Number((ga.reduce((sum, v, i) => sum + Math.abs(v - gb[i]), 0) / ga.length).toFixed(2));
}

function makeBeforeAfterSheet(results) {
  const thumbW = 260;
  const thumbH = 146;
  const labelW = 230;
  const rowH = 204;
  const margin = 34;
  const width = margin * 2 + labelW + thumbW * 2 + 42;
  const height = 96 + results.length * rowH + 38;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<rect width="100%" height="100%" fill="#f8fafc"/>',
    `<text x="${margin}" y="42" font-family="Avenir Next, PingFang SC, sans-serif" font-size="24" font-weight="700" fill="#0f172a">Template Novelty Before / After</text>`,
    `<text x="${margin + labelW}" y="76" font-family="Avenir Next, PingFang SC, sans-serif" font-size="12" fill="#64748b">baseline generic renderer</text>`,
    `<text x="${margin + labelW + thumbW + 42}" y="76" font-family="Avenir Next, PingFang SC, sans-serif" font-size="12" fill="#64748b">upgraded page-family renderer</text>`
  ];
  results.forEach((result, i) => {
    const y = 104 + i * rowH;
    parts.push(`<text x="${margin}" y="${y + 36}" font-family="Avenir Next, PingFang SC, sans-serif" font-size="12" font-weight="700" fill="#0f172a">${escapeXml(result.id)}</text>`);
    parts.push(`<text x="${margin}" y="${y + 58}" font-family="Avenir Next, PingFang SC, sans-serif" font-size="11" fill="#64748b">hash distance ${result.hashDistance}/64</text>`);
    [result.baselinePreview, result.upgradedPreview].forEach((file, j) => {
      const x = margin + labelW + j * (thumbW + 42);
      parts.push(`<rect x="${x - 1}" y="${y - 1}" width="${thumbW + 2}" height="${thumbH + 2}" fill="#fff" stroke="#d7dee8"/>`);
      parts.push(`<image href="${svgImageHref(file)}" x="${x}" y="${y}" width="${thumbW}" height="${thumbH}" preserveAspectRatio="xMidYMid meet"/>`);
    });
  });
  parts.push('</svg>');
  const file = path.join(CONTACT_DIR, 'template-page-families.before-after.svg');
  writeText(file, `${parts.join('\n')}\n`);
  return file;
}

function main() {
  [BASELINE_PLAN_DIR, BASELINE_OUTPUT_DIR, BASELINE_PREVIEW_DIR, CONTACT_DIR, path.dirname(REPORT_PATH)].forEach(ensureDir);
  const upgraded = new Map(readFixtureManifest().results.map(result => [result.id, result]));
  const results = [];
  for (const plan of fixturePlans()) {
    const id = plan.slides[0].layoutVariant;
    const base = baselinePlan(plan);
    const planPath = path.join(BASELINE_PLAN_DIR, `${id}.baseline.json`);
    const pptxPath = path.join(BASELINE_OUTPUT_DIR, `${id}.baseline.pptx`);
    const previewDir = path.join(BASELINE_PREVIEW_DIR, id);
    writeJson(planPath, base);
    runNode('scripts/generate_pptx.js', [rel(planPath), rel(pptxPath)]);
    runNode('scripts/validate_pptx.js', [rel(pptxPath), '--expect-slides', '1', '--preview-dir', rel(previewDir)]);
    const baselinePreview = path.join(previewDir, fs.readdirSync(previewDir).find(name => /\.png$/i.test(name)) || `${id}.001.png`);
    const current = upgraded.get(id);
    const upgradedPreview = path.join(ROOT, current.preview);
    const baselineSig = pngAverageHash(baselinePreview);
    const upgradedSig = pngAverageHash(upgradedPreview);
    const dist = hamming(baselineSig, upgradedSig);
    const lumaDistance = lumaGridDistance(baselineSig, upgradedSig);
    const sizeDelta = Math.abs(fs.statSync(baselinePreview).size - fs.statSync(upgradedPreview).size);
    results.push({
      id,
      baselinePlan: rel(planPath),
      baselinePptx: rel(pptxPath),
      baselinePreview: rel(baselinePreview),
      upgradedPreview: current.preview,
      hashDistance: dist,
      lumaDistance,
      sizeDelta,
      status: (dist >= 4 || lumaDistance >= 2.5 || sizeDelta >= 1000) ? 'pass' : 'review'
    });
  }
  const beforeAfterSheet = makeBeforeAfterSheet(results);
  writeJson(REPORT_PATH, {
    version: 'template-novelty-report/v1',
    status: results.every(result => result.status === 'pass') ? 'pass' : 'review',
    threshold: { hashDistance: 4, lumaDistance: 2.5, sizeDelta: 1000 },
    beforeAfterSheet: rel(beforeAfterSheet),
    results
  });
  console.log(JSON.stringify({ success: true, report: rel(REPORT_PATH), beforeAfterSheet: rel(beforeAfterSheet) }, null, 2));
}

main();

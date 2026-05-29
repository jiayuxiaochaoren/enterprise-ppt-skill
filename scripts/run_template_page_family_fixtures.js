#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const zlib = require('zlib');
const { ROOT, ASSET_ROOT, fixturePlans } = require('./template_page_family_fixtures');

const MATRIX_PATH = path.join(ROOT, 'assets', 'template-readiness-matrix.json');
const WORKSPACE = path.join(ROOT, 'outputs', '019e583b-b589-7043-8c51-700ce5757a00', 'presentations', 'template-page-family-fixtures');
const FIXTURE_DIR = path.join(ROOT, 'examples', 'fixtures');
const OUTPUT_DIR = path.join(WORKSPACE, 'output');
const PREVIEW_DIR = path.join(WORKSPACE, 'preview');
const PREVIEW_EXPORT_DIR = path.join(WORKSPACE, 'preview-export');
const CONTACT_DIR = path.join(WORKSPACE, 'contact-sheets');
const QA_DIR = path.join(WORKSPACE, 'qa');

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

function runNode(script, args, opts = {}) {
  return cp.execFileSync(process.execPath, [path.join(ROOT, script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: opts.timeout || 180000
  }).trim();
}

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function hexToRgb(hex) {
  const clean = String(hex || '#ffffff').replace('#', '');
  return [0, 2, 4].map(i => parseInt(clean.slice(i, i + 2), 16));
}

function pngScene(file, opts = {}) {
  const width = opts.width || 1200;
  const height = opts.height || 800;
  const bg = hexToRgb(opts.bg || '#f8fafc');
  const pixels = Buffer.alloc(width * height * 3);
  for (let i = 0; i < pixels.length; i += 3) {
    pixels[i] = bg[0];
    pixels[i + 1] = bg[1];
    pixels[i + 2] = bg[2];
  }
  const blend = (x, y, color, alpha = 1) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const [r, g, b] = hexToRgb(color);
    const i = (Math.floor(y) * width + Math.floor(x)) * 3;
    pixels[i] = Math.round(pixels[i] * (1 - alpha) + r * alpha);
    pixels[i + 1] = Math.round(pixels[i + 1] * (1 - alpha) + g * alpha);
    pixels[i + 2] = Math.round(pixels[i + 2] * (1 - alpha) + b * alpha);
  };
  const rect = (x, y, w, h, color, alpha = 1) => {
    for (let yy = Math.max(0, Math.floor(y)); yy < Math.min(height, Math.floor(y + h)); yy++) {
      for (let xx = Math.max(0, Math.floor(x)); xx < Math.min(width, Math.floor(x + w)); xx++) blend(xx, yy, color, alpha);
    }
  };
  const circle = (cx, cy, r, color, alpha = 1) => {
    const r2 = r * r;
    for (let yy = Math.max(0, Math.floor(cy - r)); yy < Math.min(height, Math.floor(cy + r)); yy++) {
      for (let xx = Math.max(0, Math.floor(cx - r)); xx < Math.min(width, Math.floor(cx + r)); xx++) {
        const dx = xx - cx;
        const dy = yy - cy;
        if (dx * dx + dy * dy <= r2) blend(xx, yy, color, alpha);
      }
    }
  };
  const line = (x1, y1, x2, y2, color, alpha = 1, thick = 8) => {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let i = 0; i <= steps; i++) {
      const t = i / Math.max(1, steps);
      circle(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, thick / 2, color, alpha);
    }
  };
  const card = (x, y, w, h, color = '#ffffff') => {
    rect(x, y, w, h, color, 0.9);
    rect(x, y, w, 8, opts.accent || '#2563eb', 0.45);
  };

  circle(width * 0.82, height * 0.18, 190, opts.accent || '#2563eb', 0.12);
  circle(width * 0.14, height * 0.82, 170, opts.secondary || '#14b8a6', 0.10);
  if (opts.motif === 'people') {
    card(120, 108, 960, 584);
    [0, 1, 2, 3].forEach(i => {
      const x = 210 + i * 210;
      circle(x, 290, 54, i % 2 ? opts.secondary : opts.accent, 0.34);
      circle(x, 248, 28, i % 2 ? opts.secondary : opts.accent, 0.62);
      rect(x - 62, 376, 124, 88, '#e5edf6', 0.78);
      rect(x - 52, 492, 104, 14, i % 2 ? opts.secondary : opts.accent, 0.55);
    });
  } else if (opts.motif === 'beauty') {
    rect(120, 92, 960, 616, '#fff7f2', 0.94);
    rect(162, 132, 310, 536, opts.dark || '#3b2430', 0.88);
    [0, 1, 2].forEach(i => {
      rect(560 + i * 120, 230, 72, 236, i === 1 ? opts.secondary : opts.accent, 0.30);
      circle(596 + i * 120, 214, 48, '#ffffff', 0.9);
    });
    rect(548, 536, 360, 22, opts.accent, 0.35);
  } else if (opts.motif === 'matrix') {
    card(128, 112, 944, 576);
    line(320, 610, 900, 610, '#0f172a', 0.32, 10);
    line(320, 610, 320, 218, '#0f172a', 0.32, 10);
    [0, 1, 2, 3].forEach(i => {
      rect(388 + (i % 2) * 230, 260 + Math.floor(i / 2) * 150, 150, 86, i === 3 ? '#ef4444' : (i === 1 ? opts.accent : opts.secondary), 0.16);
      circle(462 + (i % 2) * 230, 302 + Math.floor(i / 2) * 150, 20, i === 3 ? '#ef4444' : opts.accent, 0.56);
    });
  } else if (opts.motif === 'flow') {
    card(120, 122, 960, 556);
    [0, 1, 2].forEach(i => {
      const x = 190 + i * 300;
      rect(x, 260, 190, 150, i === 1 ? '#0f172a' : '#ffffff', i === 1 ? 0.92 : 0.9);
      circle(x + 95, 335, 42, i === 0 ? opts.accent : (i === 1 ? opts.secondary : '#7c3aed'), 0.38);
      if (i < 2) line(x + 210, 335, x + 280, 335, opts.accent, 0.42, 12);
    });
  } else {
    card(112, 104, 976, 592);
    rect(166, 184, 262, 354, opts.accent || '#2563eb', 0.16);
    rect(486, 184, 360, 82, opts.secondary || '#14b8a6', 0.22);
    rect(486, 326, 300, 82, opts.accent || '#2563eb', 0.16);
    rect(486, 468, 240, 82, opts.secondary || '#14b8a6', 0.18);
  }

  const rows = [];
  for (let y = 0; y < height; y++) rows.push(Buffer.concat([Buffer.from([0]), pixels.subarray(y * width * 3, (y + 1) * width * 3)]));
  const raw = Buffer.concat(rows);
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  const crc32 = b => {
    let c = 0xffffffff;
    for (const byte of b) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const t = Buffer.from(type);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]));
}

function assetTheme(plan) {
  const id = plan.slides[0].layoutVariant;
  if (/beauty|consumer|product|brand-world/.test(id)) return { motif: 'beauty', bg: '#fff8f4', accent: '#c2415d', secondary: '#b08968', dark: '#3b2430' };
  if (/people|culture|mission|principle/.test(id)) return { motif: 'people', bg: '#f8fafc', accent: '#4f46e5', secondary: '#0f766e' };
  if (/matrix|risk|governance|guidance/.test(id)) return { motif: 'matrix', bg: '#f7f9fc', accent: '#2563eb', secondary: '#0f766e' };
  if (/value-creation|single-object|airy/.test(id)) return { motif: 'flow', bg: '#f8fbff', accent: '#2563eb', secondary: '#14b8a6' };
  return { motif: 'board', bg: '#f8fafc', accent: '#2563eb', secondary: '#14b8a6' };
}

function buildAssets(plans) {
  plans.forEach(plan => {
    const id = plan.slides[0].layoutVariant;
    const theme = assetTheme(plan);
    ['proof-1', 'proof-2', 'proof-3', 'proof-4'].forEach((name, i) => {
      pngScene(path.join(ASSET_ROOT, id, `${name}.png`), Object.assign({}, theme, {
        accent: i % 2 ? theme.secondary : theme.accent,
        secondary: i % 2 ? theme.accent : theme.secondary
      }));
    });
  });
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

function makeContactSheet(results) {
  const cols = 4;
  const thumbW = 300;
  const thumbH = 169;
  const gapX = 26;
  const gapY = 54;
  const margin = 38;
  const header = 86;
  const rows = Math.ceil(results.length / cols);
  const width = margin * 2 + cols * thumbW + (cols - 1) * gapX;
  const height = header + rows * thumbH + Math.max(0, rows - 1) * gapY + 70;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<rect width="100%" height="100%" fill="#f8fafc"/>',
    `<text x="${margin}" y="42" font-family="Avenir Next, PingFang SC, sans-serif" font-size="24" font-weight="700" fill="#0f172a">Template Page Family Fixtures</text>`,
    `<text x="${margin}" y="68" font-family="Avenir Next, PingFang SC, sans-serif" font-size="13" fill="#64748b">${results.length} page families · ${new Date().toISOString()}</text>`
  ];
  results.forEach((result, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = margin + col * (thumbW + gapX);
    const y = header + row * (thumbH + gapY);
    parts.push(`<rect x="${x - 1}" y="${y - 1}" width="${thumbW + 2}" height="${thumbH + 2}" fill="#fff" stroke="#d7dee8" stroke-width="1"/>`);
    parts.push(`<image href="${svgImageHref(result.preview)}" x="${x}" y="${y}" width="${thumbW}" height="${thumbH}" preserveAspectRatio="xMidYMid meet"/>`);
    parts.push(`<text x="${x}" y="${y + thumbH + 20}" font-family="Avenir Next, PingFang SC, sans-serif" font-size="12" font-weight="700" fill="#0f172a">${escapeXml(result.id)}</text>`);
    parts.push(`<text x="${x}" y="${y + thumbH + 38}" font-family="Avenir Next, PingFang SC, sans-serif" font-size="11" fill="#64748b">${escapeXml(result.type)}</text>`);
  });
  parts.push('</svg>');
  const file = path.join(CONTACT_DIR, 'template-page-families.contact-sheet.svg');
  writeText(file, `${parts.join('\n')}\n`);
  return file;
}

function updateMatrix(results) {
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const byId = new Map(results.map(result => [result.id, result]));
  matrix.generatedAt = new Date().toISOString();
  matrix.pageFamilies.forEach(row => {
    const result = byId.get(row.id);
    if (!result) return;
    row.fixtures = {
      plan: rel(result.plan),
      pptx: rel(result.pptx),
      preview: rel(result.preview),
      renderMeta: rel(result.renderMeta)
    };
    row.statuses.fixturePptx = fs.existsSync(result.pptx) ? 'pass' : 'missing';
    row.statuses.previewPng = fs.existsSync(result.preview) ? 'pass' : 'missing';
  });
  writeJson(MATRIX_PATH, matrix);
}

function main() {
  const plans = fixturePlans();
  ensureDir(FIXTURE_DIR);
  ensureDir(OUTPUT_DIR);
  ensureDir(PREVIEW_DIR);
  ensureDir(QA_DIR);
  buildAssets(plans);

  const results = [];
  for (const plan of plans) {
    const slide = plan.slides[0];
    const id = slide.layoutVariant;
    const fixtureFile = path.join(FIXTURE_DIR, `${id}.json`);
    const pptx = path.join(OUTPUT_DIR, `${id}.pptx`);
    const preview = path.join(PREVIEW_DIR, `${id}.001.png`);
    const exportDir = path.join(PREVIEW_EXPORT_DIR, id);
    writeJson(fixtureFile, plan);
    runNode('scripts/generate_pptx.js', [fixtureFile, pptx], { timeout: 180000 });
    const renderMeta = `${pptx}.render-meta.json`;
    fs.rmSync(exportDir, { recursive: true, force: true });
    runNode('scripts/validate_pptx.js', [pptx, '--expect-slides', '1', '--preview-dir', exportDir], { timeout: 180000 });
    const exported = fs.readdirSync(exportDir).filter(file => /\.png$/i.test(file)).sort()[0];
    if (exported) fs.copyFileSync(path.join(exportDir, exported), preview);
    if (!fs.existsSync(preview)) throw new Error(`preview not generated for ${id}: ${preview}`);
    results.push({ id, type: `${slide.type}:${slide.layoutVariant}`, plan: fixtureFile, pptx, preview, renderMeta });
    console.log(`${id}: ${rel(pptx)} / ${rel(preview)}`);
  }

  const contactSheet = makeContactSheet(results);
  const manifest = {
    generatedAt: new Date().toISOString(),
    workspace: WORKSPACE,
    fixtureDir: FIXTURE_DIR,
    outputDir: OUTPUT_DIR,
    previewDir: PREVIEW_DIR,
    contactSheet,
    results: results.map(result => ({
      id: result.id,
      type: result.type,
      plan: rel(result.plan),
      pptx: rel(result.pptx),
      preview: rel(result.preview),
      renderMeta: rel(result.renderMeta)
    }))
  };
  writeJson(path.join(WORKSPACE, 'manifest.json'), manifest);
  updateMatrix(results);
  console.log(JSON.stringify({
    success: true,
    count: results.length,
    manifest: rel(path.join(WORKSPACE, 'manifest.json')),
    contactSheet: rel(contactSheet)
  }, null, 2));
}

main();

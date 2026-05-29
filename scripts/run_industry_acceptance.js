#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const zlib = require('zlib');
const { acceptanceAudit, normalizeDeckPlan } = require('./design-system');
const { ROOT, industryAcceptanceBriefs } = require('./industry_acceptance_matrix');

const THREAD_ID = process.env.CODEX_THREAD_ID || 'manual-20260524-full-industry-acceptance';
const WORKSPACE = path.join(ROOT, 'outputs', THREAD_ID, 'presentations', 'industry-template-system-acceptance');
const PLAN_DIR = path.join(WORKSPACE, 'plans');
const OUTPUT_DIR = path.join(WORKSPACE, 'output');
const PREVIEW_DIR = path.join(WORKSPACE, 'preview');
const QA_DIR = path.join(WORKSPACE, 'qa');
const ASSET_DIR = path.join(WORKSPACE, 'assets');
const CONTACT_DIR = path.join(WORKSPACE, 'contact-sheets');

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
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
  return path.relative(ROOT, file);
}

function hexToRgb(hex) {
  const value = String(hex || '#ffffff').replace('#', '');
  return [0, 2, 4].map(i => parseInt(value.slice(i, i + 2), 16));
}

function pngScene(file, opts = {}) {
  const width = opts.width || 1200;
  const height = opts.height || 800;
  const bg = hexToRgb(opts.bg || '#f8fafc');
  const accent = opts.accent || '#2f6fdb';
  const secondary = opts.secondary || '#14b8a6';
  const dark = opts.dark || '#0f172a';
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
  const card = (x, y, w, h, alpha = 0.88) => {
    rect(x, y, w, h, '#ffffff', alpha);
    rect(x, y, w, 4, accent, 0.45);
    rect(x, y + h - 4, w, 4, '#dbe4ee', 0.7);
  };
  const line = (x1, y1, x2, y2, color, alpha = 1, thick = 8) => {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let i = 0; i <= steps; i++) {
      const t = i / Math.max(1, steps);
      circle(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, thick / 2, color, alpha);
    }
  };

  circle(width * 0.78, height * 0.16, 220, accent, 0.12);
  circle(width * 0.12, height * 0.86, 190, secondary, 0.12);
  if (opts.motif === 'people') {
    rect(95, 92, 1010, 616, '#ffffff', 0.82);
    [0, 1, 2].forEach(i => {
      circle(255 + i * 260, 296, 74, i === 1 ? secondary : accent, 0.22);
      circle(255 + i * 260, 254, 38, i === 1 ? secondary : accent, 0.52);
      rect(178 + i * 260, 382, 154, 92, '#f1f5f9', 0.92);
      rect(194 + i * 260, 420, 118, 14, i === 1 ? secondary : accent, 0.5);
    });
  } else if (opts.motif === 'place') {
    rect(110, 132, 980, 514, '#ffffff', 0.72);
    rect(168, 202, 210, 300, accent, 0.16);
    rect(430, 156, 260, 348, secondary, 0.14);
    rect(742, 224, 210, 278, dark, 0.12);
    line(140, 560, 1020, 560, accent, 0.32, 12);
  } else if (opts.motif === 'service') {
    card(104, 116, 990, 552, 0.86);
    [0, 1, 2, 3].forEach(i => {
      const x = 190 + i * 210;
      circle(x, 286, 36, i % 2 ? secondary : accent, 0.5);
      if (i < 3) line(x + 46, 286, x + 166, 286, accent, 0.32, 8);
      rect(x - 68, 404, 136, 44, '#ffffff', 0.84);
      rect(x - 46, 518, 160, 14, i % 2 ? secondary : accent, 0.4);
    });
  } else if (opts.motif === 'product') {
    card(96, 92, 1008, 616, 0.9);
    rect(96, 92, 232, 616, dark, 0.94);
    [0, 1, 2].forEach(i => card(384 + i * 205, 212, 160, 128, 0.88));
    [0, 1, 2, 3].forEach(i => rect(386, 428 + i * 42, 560, 16, i % 2 ? secondary : accent, i % 2 ? 0.35 : 0.45));
  } else if (opts.motif === 'policy') {
    card(112, 116, 430, 532, 0.9);
    card(652, 148, 386, 468, 0.84);
    rect(160, 178, 192, 22, accent, 0.42);
    [0, 1, 2, 3].forEach(i => rect(160, 258 + i * 72, 300, 14, i === 2 ? secondary : dark, i === 2 ? 0.42 : 0.22));
    circle(820, 326, 88, accent, 0.18);
    circle(820, 326, 46, secondary, 0.3);
  } else {
    card(105, 105, 990, 585, 0.88);
    rect(160, 178, 250, 360, accent, 0.14);
    rect(474, 178, 360, 88, secondary, 0.22);
    rect(474, 314, 300, 88, accent, 0.16);
    rect(474, 450, 240, 88, secondary, 0.18);
  }

  const rows = [];
  for (let y = 0; y < height; y++) rows.push(Buffer.concat([Buffer.from([0]), pixels.subarray(y * width * 3, (y + 1) * width * 3)]));
  const raw = Buffer.concat(rows);
  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();
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
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]));
}

function buildGeneratedAssets() {
  const specs = {
    'saas-ai-platform-growth': { motif: 'product', bg: '#f7faff', accent: '#2563eb', secondary: '#14b8a6' },
    'healthcare-service-quality': { motif: 'service', bg: '#f4faf7', accent: '#2f6f73', secondary: '#8aa06a' },
    'lifestyle-experience-growth': { motif: 'place', bg: '#fbfaf7', accent: '#b45309', secondary: '#0f766e' },
    'government-park-governance': { motif: 'policy', bg: '#f7f9fc', accent: '#1d4ed8', secondary: '#0f766e' },
    'people-culture-company': { motif: 'people', bg: '#f8fafc', accent: '#4f46e5', secondary: '#0f766e' }
  };
  const assets = {};
  Object.entries(specs).forEach(([slug, spec]) => {
    assets[slug] = {};
    ['cover', 'prototype-1', 'prototype-2', 'prototype-3', 'service-1', 'service-2', 'service-3', 'place-1', 'place-2', 'place-3', 'team-1', 'team-2', 'team-3'].forEach((name, i) => {
      const file = path.join(ASSET_DIR, slug, `${name}.png`);
      pngScene(file, Object.assign({}, spec, { accent: i % 2 ? spec.secondary : spec.accent }));
      assets[slug][`${name}.png`] = file;
    });
  });
  return assets;
}

function replaceAcceptanceAssets(value, assets) {
  if (typeof value === 'string') {
    const m = value.match(/^acceptance:\/\/([^/]+)\/(.+)$/);
    if (!m) return value;
    return assets[m[1]] && assets[m[1]][m[2]] ? assets[m[1]][m[2]] : value;
  }
  if (Array.isArray(value)) return value.map(item => replaceAcceptanceAssets(item, assets));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceAcceptanceAssets(v, assets)]));
  }
  return value;
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

function makeContactSheet(slug, title, previewDir) {
  const files = fs.readdirSync(previewDir).filter(f => f.endsWith('.png')).sort().map(f => path.join(previewDir, f));
  const cols = 3;
  const thumbW = 360;
  const thumbH = 203;
  const gapX = 28;
  const gapY = 54;
  const margin = 42;
  const header = 84;
  const rows = Math.ceil(files.length / cols);
  const width = margin * 2 + cols * thumbW + (cols - 1) * gapX + 2;
  const height = header + rows * thumbH + (rows - 1) * gapY + 70;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<rect width="100%" height="100%" fill="#f8fafc"/>',
    `<text x="${margin}" y="42" font-family="Avenir Next, PingFang SC, sans-serif" font-size="24" font-weight="700" fill="#0f172a">${escapeXml(title)}</text>`,
    `<text x="${margin}" y="68" font-family="Avenir Next, PingFang SC, sans-serif" font-size="13" fill="#64748b">${files.length} slides · generated ${new Date().toISOString()}</text>`
  ];
  files.forEach((file, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = margin + col * (thumbW + gapX);
    const y = header + row * (thumbH + gapY);
    parts.push(`<rect x="${x - 1}" y="${y - 1}" width="${thumbW + 2}" height="${thumbH + 2}" fill="#fff" stroke="#d7dee8" stroke-width="1"/>`);
    parts.push(`<image href="${svgImageHref(file)}" x="${x}" y="${y}" width="${thumbW}" height="${thumbH}" preserveAspectRatio="xMidYMid meet"/>`);
    parts.push(`<text x="${x}" y="${y + thumbH + 20}" font-family="Avenir Next, PingFang SC, sans-serif" font-size="15" fill="#475569">${String(i + 1).padStart(2, '0')}</text>`);
  });
  parts.push('</svg>');
  const out = path.join(CONTACT_DIR, `${slug}.contact-sheet.svg`);
  writeText(out, `${parts.join('\n')}\n`);
  return out;
}

function writeContactIndex(sheets) {
  const html = [
    '<!doctype html><meta charset="utf-8"><title>Industry Acceptance Contact Sheets</title>',
    '<body style="font-family:Avenir Next,PingFang SC,sans-serif;background:#f8fafc;color:#0f172a;margin:32px">',
    '<h1>Industry Acceptance Contact Sheets</h1>'
  ];
  sheets.forEach(sheet => {
    html.push(`<h2>${escapeXml(sheet.label)}</h2><img src="${escapeXml(path.basename(sheet.file))}" style="max-width:100%;height:auto;border:1px solid #d7dee8;background:white">`);
  });
  html.push('</body>');
  const file = path.join(CONTACT_DIR, 'index.html');
  writeText(file, `${html.join('\n')}\n`);
  return file;
}

function writeIssueLog(manifest) {
  const lines = [
    '# Full Industry Acceptance QA Log',
    '',
    'Scope: 8 industry briefs, each generated as an 8-12 page PPTX with preview PNGs, contact sheet, visual QA, and acceptance QA.',
    '',
    '| Industry | Slides | Acceptance | Failures | Reviews | Notes |',
    '| --- | ---: | --- | ---: | ---: | --- |'
  ];
  manifest.decks.forEach(deck => {
    const notes = deck.acceptanceStatus === 'pass'
      ? 'No blocking acceptance issue.'
      : (deck.acceptanceFindings || []).map(f => `${f.qa || ''}:${f.type}`).join('; ');
    lines.push(`| ${deck.label} | ${deck.slideCount} | ${deck.acceptanceStatus} | ${deck.failCount} | ${deck.reviewCount} | ${notes || 'See QA JSON.'} |`);
  });
  lines.push('');
  lines.push('回改记录：本轮把阶段 6 验收扩展到 8 个行业 brief，并把生成、预览、contact sheet、visual QA、acceptance QA 串成可重复执行脚本；若某行业出现 acceptance review/fail，优先回改对应 recipe、组件 renderer 或 QA gate 后再重新生成。');
  const file = path.join(QA_DIR, 'industry-acceptance-qa-log.md');
  writeText(file, `${lines.join('\n')}\n`);
  return file;
}

function writeIterationLogEntry(brief, plan, qa, contactSheet) {
  const entry = {
    version: 'contact-sheet-iteration-log/v1',
    generatedAt: new Date().toISOString(),
    slug: brief.slug,
    industry: plan.industry,
    contactSheet,
    visualReview: qa.secondary_visual_review || null,
    commercialReadiness: qa.commercial_readiness_qa || null,
    acceptanceStatus: (qa.acceptance_qa && qa.acceptance_qa.status) || 'unknown',
    failCount: qa.fail_count,
    reviewCount: qa.review_count,
    machineTrace: {
      qaFile: path.join(QA_DIR, `${brief.slug}.visual-qa.json`),
      planFile: path.join(PLAN_DIR, `${brief.slug}.json`)
    }
  };
  const file = path.join(QA_DIR, `${brief.slug}.iteration-log.json`);
  writeJson(file, entry);
  const jsonl = path.join(QA_DIR, 'contact-sheet-iteration-log.jsonl');
  fs.appendFileSync(jsonl, `${JSON.stringify(entry)}\n`, 'utf8');
  return file;
}

function main() {
  fs.rmSync(WORKSPACE, { recursive: true, force: true });
  [PLAN_DIR, OUTPUT_DIR, PREVIEW_DIR, QA_DIR, ASSET_DIR, CONTACT_DIR].forEach(dir => fs.mkdirSync(dir, { recursive: true }));
  const assets = buildGeneratedAssets();
  const manifest = {
    generatedAt: new Date().toISOString(),
    workspace: WORKSPACE,
    outputDir: OUTPUT_DIR,
    previewDir: PREVIEW_DIR,
    contactSheetDir: CONTACT_DIR,
    decks: []
  };
  const sheets = [];
  for (const brief of industryAcceptanceBriefs()) {
    const plan = replaceAcceptanceAssets(brief.plan, assets);
    const normalized = normalizeDeckPlan(plan);
    const audit = acceptanceAudit(plan, normalized);
    const planPath = path.join(PLAN_DIR, `${brief.slug}.json`);
    const pptxPath = path.join(OUTPUT_DIR, `${brief.slug}.pptx`);
    const deckPreviewDir = path.join(PREVIEW_DIR, brief.slug);
    const qaPath = path.join(QA_DIR, `${brief.slug}.visual-qa.json`);
    writeJson(planPath, plan);
    runNode('scripts/generate_pptx.js', [rel(planPath), rel(pptxPath)], { timeout: 180000 });
    runNode('scripts/validate_pptx.js', [
      rel(pptxPath),
      '--expect-slides', String(plan.slides.length),
      '--require', brief.required.join(','),
      '--preview-dir', rel(deckPreviewDir)
    ], { timeout: 180000 });
    const qa = JSON.parse(runNode('scripts/visual_qa.js', [
      rel(pptxPath),
      '--preview-dir', rel(deckPreviewDir),
      '--plan', rel(planPath),
      '--json'
    ], { timeout: 180000 }));
    writeJson(qaPath, qa);
    const sheet = makeContactSheet(brief.slug, brief.label, deckPreviewDir);
    const iterationLog = writeIterationLogEntry(brief, plan, qa, sheet);
    sheets.push({ label: brief.label, file: sheet });
    manifest.decks.push({
      slug: brief.slug,
      label: brief.label,
      industry: plan.industry,
      plan: planPath,
      pptx: pptxPath,
      previewDir: deckPreviewDir,
      contactSheet: sheet,
      iterationLog,
      qa: qaPath,
      slideCount: plan.slides.length,
      normalizedRoutes: normalized.slides.map(slide => slide.layoutVariant ? `${slide.type}:${slide.layoutVariant}` : slide.type),
      acceptanceStatus: (qa.acceptance_qa && qa.acceptance_qa.status) || audit.status,
      acceptanceFindings: (qa.acceptance_qa && qa.acceptance_qa.findings) || audit.findings,
      commercialReadiness: qa.commercial_readiness_qa || null,
      secondaryVisualReview: qa.secondary_visual_review || null,
      failCount: qa.fail_count,
      reviewCount: qa.review_count
    });
  }
  manifest.contactSheetIndex = writeContactIndex(sheets);
  manifest.issueLog = writeIssueLog(manifest);
  const manifestPath = path.join(WORKSPACE, 'manifest.json');
  writeJson(manifestPath, manifest);
  console.log(JSON.stringify({
    success: true,
    manifest: manifestPath,
    decks: manifest.decks.map(deck => ({
      slug: deck.slug,
      industry: deck.industry,
      slideCount: deck.slideCount,
      acceptanceStatus: deck.acceptanceStatus,
      failCount: deck.failCount,
      reviewCount: deck.reviewCount
    }))
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error.stack || error.message || error);
  process.exit(1);
}

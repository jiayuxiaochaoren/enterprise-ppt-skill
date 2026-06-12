#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const zlib = require('zlib');
const {
  detectPreviewProviders,
  exportPreviews
} = require('./preview/provider');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-industry-evidence-chain-smoke');
const CONTACT_DIR = path.join(OUT, 'contact-sheets');
const SMOKE_ASSET_DIR = path.join(OUT, 'smoke-assets');
const FIXTURE = path.join(ROOT, 'examples', 'industry-evidence-chain', 'regression.json');
const P0_SMOKE_SAMPLE_IDS = new Set([
  'manufacturing-oee-evidence-chain',
  'beauty-brand-product-user-evidence-chain',
  'finance-thesis-portfolio-risk-evidence-chain',
  'healthcare-service-handoff-quality-evidence-chain',
  'saas-platform-workflow-adoption-evidence-chain'
]);
const EXTENDED_SMOKE_SAMPLE_IDS = new Set([
  'lifestyle-experience-journey-retention-evidence-chain',
  'public-governance-resource-risk-evidence-chain',
  'people-culture-behavior-growth-evidence-chain'
]);
const SMOKE_ASSET_PROFILES = {
  'counter-hero.png': { kind: 'retail', bg: [238, 214, 199], accent: [171, 80, 82], ink: [74, 42, 52] },
  'cream.png': { kind: 'product', bg: [244, 231, 218], accent: [197, 129, 104], ink: [85, 59, 48] },
  'inspection.png': { kind: 'inspection', bg: [224, 232, 226], accent: [34, 108, 98], ink: [38, 58, 55] },
  'journey-a.png': { kind: 'journey', bg: [226, 237, 232], accent: [54, 133, 114], ink: [42, 76, 68] },
  'place-hero.png': { kind: 'place', bg: [230, 224, 207], accent: [153, 105, 58], ink: [71, 55, 38] },
  'screen-a.png': { kind: 'screen', bg: [231, 238, 247], accent: [56, 117, 238], ink: [29, 45, 74] },
  'screen-b.png': { kind: 'screen-alt', bg: [232, 243, 239], accent: [27, 153, 128], ink: [26, 68, 61] },
  'serum.png': { kind: 'product', bg: [237, 226, 232], accent: [176, 76, 128], ink: [76, 42, 62] },
  'team-a.png': { kind: 'people', bg: [226, 232, 242], accent: [80, 112, 166], ink: [45, 57, 84] },
  'team-b.png': { kind: 'people-alt', bg: [232, 239, 228], accent: [87, 139, 91], ink: [50, 74, 53] }
};

function slug(value = '') {
  return String(value || 'sample').replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function runNode(args = []) {
  try {
    return {
      status: 0,
      stdout: cp.execFileSync(process.execPath, args, {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 24
      }),
      stderr: ''
    };
  } catch (error) {
    return {
      status: Number(error.status || 1),
      stdout: String(error.stdout || ''),
      stderr: String(error.stderr || error.message || error)
    };
  }
}

function runNodeToFile(args = [], outFile = '') {
  const fd = fs.openSync(outFile, 'w');
  let run;
  try {
    run = cp.spawnSync(process.execPath, args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', fd, 'pipe']
    });
  } finally {
    fs.closeSync(fd);
  }
  return {
    status: Number(run && run.status != null ? run.status : 1),
    stdout: fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : '',
    stderr: String((run && run.stderr) || '')
  };
}

function parseJson(stdout = '') {
  const text = String(stdout || '').trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_) {}
  const starts = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') starts.push(i);
  }
  for (const start of starts) {
    try {
      return JSON.parse(text.slice(start));
    } catch (_) {}
  }
  return null;
}

function rel(file = '') {
  return file ? path.relative(ROOT, file) : '';
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return null;
  }
}

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data = Buffer.alloc(0)) {
  const name = Buffer.from(type, 'ascii');
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  name.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return out;
}

function smokePixel(profile = {}, x, y, w, h) {
  const bg = profile.bg || [238, 242, 247];
  const accent = profile.accent || [56, 117, 238];
  const ink = profile.ink || [30, 41, 59];
  const white = [248, 250, 252];
  const muted = bg.map(channel => Math.max(0, channel - 24));
  const band = Math.floor(y / Math.max(1, h / 7));
  let color = bg.map((channel, i) => Math.max(0, Math.min(255, channel - ((band % 2) * 8) + (i === 0 ? 2 : 0))));
  const inRect = (rx, ry, rw, rh) => x >= rx * w && x <= (rx + rw) * w && y >= ry * h && y <= (ry + rh) * h;
  if (/screen/.test(profile.kind)) {
    if (inRect(0.08, 0.10, 0.84, 0.11)) color = ink;
    else if (inRect(0.12, 0.25, 0.34, 0.24) || inRect(0.52, 0.25, 0.34, 0.24) || inRect(0.12, 0.58, 0.74, 0.20)) color = white;
    else if (inRect(0.16, 0.33, 0.22, 0.05) || inRect(0.56, 0.33, 0.22, 0.05) || inRect(0.18, 0.67, 0.44, 0.04)) color = accent;
  } else if (/product|retail/.test(profile.kind)) {
    const cx = x / w - 0.52;
    const cy = y / h - 0.46;
    if ((cx * cx) / 0.030 + (cy * cy) / 0.120 < 1) color = white;
    if ((cx * cx) / 0.020 + (cy * cy) / 0.085 < 1 && y > h * 0.28) color = accent;
    if (inRect(0.08, 0.72, 0.84, 0.08)) color = ink;
  } else if (/journey|place/.test(profile.kind)) {
    if (y > h * 0.62) color = muted;
    const ridge = h * (0.58 - 0.10 * Math.sin(x / 42));
    if (y > ridge && y < ridge + 16) color = accent;
    if (inRect(0.12, 0.18, 0.24, 0.16) || inRect(0.52, 0.34, 0.28, 0.14)) color = white;
  } else if (/inspection/.test(profile.kind)) {
    if (inRect(0.10, 0.16, 0.80, 0.12)) color = ink;
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 3; row++) {
        if (inRect(0.12 + col * 0.20, 0.36 + row * 0.15, 0.15, 0.08)) color = row === 1 ? accent : white;
      }
    }
  } else if (/people/.test(profile.kind)) {
    const centers = [[0.30, 0.38], [0.50, 0.34], [0.68, 0.40]];
    color = centers.some(([cx, cy]) => ((x / w - cx) ** 2) + ((y / h - cy) ** 2) < 0.012) ? accent : color;
    if (inRect(0.16, 0.66, 0.68, 0.10)) color = ink;
  }
  return color;
}

function writeSmokePng(file, profile = {}, width = 800, height = 450) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = smokePixel(profile, x, y, width, height);
      const off = row + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND')
  ]));
}

function generatedSmokeAssetFor(value = '') {
  const name = path.basename(String(value || ''));
  const profile = SMOKE_ASSET_PROFILES[name];
  if (!profile) return '';
  const file = path.join(SMOKE_ASSET_DIR, name);
  if (!fs.existsSync(file)) writeSmokePng(file, profile);
  return file;
}

function existingLocalAsset(value = '') {
  const file = String(value || '').trim();
  if (!file || /^https?:\/\//i.test(file) || /^data:/i.test(file)) return '';
  const candidates = path.isAbsolute(file)
    ? [file]
    : [
        path.join(ROOT, file),
        path.join(path.dirname(FIXTURE), file)
      ];
  return candidates.find(candidate => fs.existsSync(candidate)) || '';
}

function resolveSmokeAsset(value = '') {
  return existingLocalAsset(value) || generatedSmokeAssetFor(value);
}

function resolveSmokeAssets(values = []) {
  return (values || []).map(resolveSmokeAsset).filter(Boolean);
}

function stripMissingSmokeImages(slide = {}) {
  if (Array.isArray(slide.images)) {
    const resolved = resolveSmokeAssets(slide.images);
    if (resolved.length) slide.images = resolved;
    else delete slide.images;
  }
  if (slide.image) {
    const resolved = resolveSmokeAsset(slide.image);
    if (resolved) slide.image = resolved;
    else delete slide.image;
  }
  if (slide.visual && typeof slide.visual === 'object') {
    if (Array.isArray(slide.visual.images)) {
      const resolved = resolveSmokeAssets(slide.visual.images);
      if (resolved.length) slide.visual.images = resolved;
      else delete slide.visual.images;
    }
    if (slide.visual.image) {
      const resolved = resolveSmokeAsset(slide.visual.image);
      if (resolved) {
        slide.visual.image = resolved;
        slide.visual.role = slide.visual.role || 'showcase';
      }
      else delete slide.visual.image;
    }
  }
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function textParts(value) {
  if (value == null) return [];
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(textParts);
  if (typeof value === 'object') return Object.values(value).flatMap(textParts);
  return [];
}

function compactText(value, max = 160) {
  const text = textParts(value).join(' ').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 1).trim() : text;
}

function numericValue(raw) {
  const match = String(raw == null ? '' : raw).replace(/,/g, '').match(/[+-]?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function sourceTraceForSample(sampleId = '', plan = {}, slide = {}, index = 0) {
  const sourceId = `${slug(sampleId)}-plan-src-${String(index + 1).padStart(2, '0')}`;
  const excerpt = compactText([
    slide.title,
    slide.claim,
    slide.servicePromise,
    slide.investmentThesis,
    slide.policySource,
    slide.sourceNote,
    slide.proof && slide.proof.explanation,
    slide.businessLogic
  ], 180) || `${plan.title || sampleId} slide ${index + 1}`;
  return {
    version: 'source-trace/v2',
    claimId: `${slug(sampleId)}-claim-${String(index + 1).padStart(2, '0')}`,
    evidenceIds: [`${slug(sampleId)}-evidence-${String(index + 1).padStart(2, '0')}`],
    sourceIds: [sourceId],
    sources: [{
      id: sourceId,
      kind: 'plan-brief',
      name: `${plan.title || sampleId} smoke acceptance fixture`,
      page: `fixture:${sampleId}:slide-${index + 1}`,
      excerpt,
      provenance: 'plan-authored-brief',
      authorizationStatus: 'cleared'
    }],
    sourceNote: slide.sourceNote || 'Internal smoke fixture with plan-authored evidence boundary; no external customer material supplied.',
    imageProvenance: [],
    assetAuthorizationStatus: 'cleared'
  };
}

function metricItems(slide = {}) {
  return Array.isArray(slide.metrics) ? slide.metrics : [];
}

function metricSeries(metrics = []) {
  return metrics.map((metric, i) => ({
    category: metric.label || metric.title || metric.name || `Metric ${i + 1}`,
    value: numericValue(metric.value || metric.amount || metric.delta),
    rawValue: metric.value || metric.amount || metric.delta || '',
    note: metric.note || metric.body || '',
    unit: metric.unit || ''
  }));
}

function chartSpecForSmokeSlide(sampleId = '', plan = {}, slide = {}, index = 0, trace = {}) {
  const proofObject = (slide.proof && slide.proof.id) || slide.proofObject || slide.proof_object || slide.layoutVariant || '';
  const base = {
    version: 'chartSpec/v1',
    id: `${slug(sampleId)}-chart-${String(index + 1).padStart(2, '0')}`,
    source: 'planner',
    title: slide.chartTitle || slide.title || '',
    insight: slide.insight || slide.claim || slide.subtitle || slide.title || '',
    sourceTrace: trace,
    proofObject,
    annotations: slide.annotations || [],
    dataQuality: {
      sufficient: true,
      sourceClass: 'source-traced',
      evidenceMode: 'plan-authored-brief',
      realSeries: true,
      downgradePolicy: 'formal-smoke-fixture-no-repair'
    }
  };
  if (slide.type === 'finance-bridge' || /return-bridge|waterfall|financial-waterfall/i.test(`${proofObject} ${slide.layoutVariant || ''}`)) {
    const bridgeItems = Array.isArray(slide.bridge) ? slide.bridge : [];
    const values = [
      { category: '基准', value: 1.0, rawValue: '1.0x', note: '模型基准' },
      ...bridgeItems.map(item => ({
        category: item.label || item.title || '驱动项',
        value: numericValue(item.value || item.amount),
        rawValue: item.value || item.amount || '',
        note: item.note || item.body || ''
      })),
      { category: '目标', value: 2.8, rawValue: '2.8x', note: '改善后目标口径' }
    ].filter(item => item.value != null || item.rawValue);
    return Object.assign({}, base, {
      kind: 'waterfall',
      componentId: 'waterfall-chart',
      categories: values.map(item => item.category),
      series: [{ name: 'Return bridge', values }],
      matrix: null,
      table: null,
      unit: 'x',
      period: '2026-05',
      baseline: '1.0x',
      dataQuality: Object.assign({}, base.dataQuality, {
        pointCount: values.length,
        numericPointCount: values.filter(item => item.value != null).length
      })
    });
  }
  if (slide.adoptionFunnel || /adoption-funnel/i.test(`${proofObject} ${slide.layoutVariant || ''}`)) {
    const steps = (slide.adoptionFunnel && Array.isArray(slide.adoptionFunnel.steps))
      ? slide.adoptionFunnel.steps
      : [];
    const values = steps.map((step, i) => ({
      category: step.label || step.title || `Stage ${i + 1}`,
      value: numericValue(step.value),
      rawValue: step.value || '',
      note: step.note || ''
    }));
    return Object.assign({}, base, {
      kind: 'funnel',
      componentId: 'funnel-chart',
      categories: values.map(item => item.category),
      series: [{ name: 'Adoption funnel', values }],
      matrix: null,
      table: null,
      unit: '%',
      period: '2026-05',
      baseline: values[0] && values[0].rawValue || '',
      dataQuality: Object.assign({}, base.dataQuality, {
        pointCount: values.length,
        numericPointCount: values.filter(item => item.value != null).length
      })
    });
  }
  return null;
}

function businessLogicForSmokeSlide(slide = {}) {
  const metric = metricItems(slide)[0] || {};
  const title = slide.title || slide.proofObject || 'industry evidence';
  return Object.assign({
    currentState: compactText(title, 48),
    impact: '把指标变化回连到行业证据链的业务影响。',
    cause: compactText((slide.cards || slide.rows || slide.phases || [])[0] || slide.proof || title, 48),
    action: compactText((slide.cards || slide.rows || slide.permissionGovernance || [])[1] || slide.sourceNote || title, 48),
    metric: [metric.label, metric.value].filter(Boolean).join(' ') || compactText(metricItems(slide), 36) || 'stage KPI'
  }, slide.businessLogic || slide.business_logic || {});
}

function enrichFormalSmokePlan(sample = {}) {
  const plan = deepClone(sample.plan);
  const slides = Array.isArray(plan.slides) ? plan.slides : [];
  slides.forEach((slide, index) => {
    stripMissingSmokeImages(slide);
    if (/saas/i.test(String(plan.industry || '')) && Array.isArray(slide.platformCapabilities)) {
      slide.platformCapabilities = slide.platformCapabilities.map((item, itemIndex) => {
        if (!item || typeof item !== 'object') return item;
        const compactBodies = ['CRM 工单', '身份边界', '状态同步', '审计留痕'];
        return Object.assign({}, item, { body: compactBodies[itemIndex] || item.body || item.title });
      });
    }
    const trace = sourceTraceForSample(sample.id, plan, slide, index);
    slide.sourceTrace = Object.assign({}, trace, slide.sourceTrace || {}, {
      sourceIds: Array.from(new Set([...(trace.sourceIds || []), ...((slide.sourceTrace && slide.sourceTrace.sourceIds) || [])])),
      sources: [...(trace.sources || []), ...(((slide.sourceTrace && slide.sourceTrace.sources) || []))]
    });
    slide.proof = Object.assign({}, slide.proof || {}, {
      version: 'proof-object/v1',
      id: (slide.proof && slide.proof.id) || slide.proofObject || slide.proof_object || slide.layoutVariant || `slide-${index + 1}`,
      factual: false,
      generatedIllustration: false,
      sourceIds: slide.sourceTrace.sourceIds,
      provenance: 'plan-authored-brief',
      evidenceMode: 'plan-authored-claim',
      sourceTrace: slide.sourceTrace
    });
    metricItems(slide).forEach(metric => {
      if (metric && typeof metric === 'object') {
        metric.sourceIds = metric.sourceIds || slide.sourceTrace.sourceIds;
      }
    });
    if (slide.type === 'metric-comparison' || slide.type === 'industry-chart') {
      slide.businessLogic = businessLogicForSmokeSlide(slide);
    }
    const chartSpec = chartSpecForSmokeSlide(sample.id, plan, slide, index, slide.sourceTrace);
    if (chartSpec) slide.chartSpec = chartSpec;
  });
  return plan;
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

function componentRows(chainQa = {}) {
  const byId = new Map();
  (chainQa.slides || []).forEach(slide => {
    (slide.expectedComponents || []).forEach(id => {
      if (!byId.has(id)) byId.set(id, { id, planned: 0, consumed: 0, slides: [] });
      const row = byId.get(id);
      if ((slide.plannedComponents || []).includes(id)) row.planned += 1;
      if ((slide.consumedComponents || []).includes(id)) row.consumed += 1;
      if (!row.slides.includes(slide.slide)) row.slides.push(slide.slide);
    });
  });
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function stageRows(chainQa = {}) {
  return (chainQa.slides || []).map(slide => ({
    slide: slide.slide,
    chainId: slide.chainId,
    stageId: slide.stageId,
    stageLabel: slide.stageLabel,
    plannedComponents: slide.expectedComponents.filter(id => (slide.plannedComponents || []).includes(id)),
    consumedComponents: slide.expectedComponents.filter(id => (slide.consumedComponents || []).includes(id))
  }));
}

function slideVisualTokens(rendered = {}) {
  const grammar = rendered.industryVisualGrammar || {};
  const components = (rendered.consumedComponents || [])
    .filter(component => component && component.rendered && component.industryEvidenceChain)
    .map(component => component.id);
  return {
    rhythm: `${rendered.type || ''}:${rendered.layoutVariant || ''}`,
    evidenceRegion: grammar.evidenceRegion || '',
    captionLabel: grammar.captionLabel || '',
    sourceDensity: grammar.sourceDensity || '',
    compositionBias: grammar.compositionBias || '',
    components
  };
}

function makeDeckContactSheet({ id, industry, previewFiles = [], previewState = {}, renderMeta = {}, chainSummary = {} }) {
  fs.mkdirSync(CONTACT_DIR, { recursive: true });
  const slides = (renderMeta && Array.isArray(renderMeta.slides) ? renderMeta.slides : []).slice(0, 12);
  const count = Math.max(previewFiles.length, slides.length, 1);
  const thumbW = 300;
  const thumbH = 169;
  const gap = 26;
  const margin = 34;
  const header = 96;
  const width = margin * 2 + count * thumbW + Math.max(0, count - 1) * gap;
  const height = header + thumbH + 92;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<rect width="100%" height="100%" fill="#f8fafc"/>',
    `<text x="${margin}" y="38" font-family="Avenir Next, PingFang SC, sans-serif" font-size="22" font-weight="700" fill="#0f172a">${escapeXml(id)}</text>`,
    `<text x="${margin}" y="64" font-family="Avenir Next, PingFang SC, sans-serif" font-size="12" fill="#64748b">${escapeXml(industry)} · chain ${escapeXml(chainSummary.status || 'unknown')} · preview ${escapeXml(previewState.status || 'unknown')} via ${escapeXml(previewState.provider || 'none')}</text>`
  ];
  for (let i = 0; i < count; i++) {
    const x = margin + i * (thumbW + gap);
    const y = header;
    const rendered = slides[i] || {};
    const tokens = slideVisualTokens(rendered);
    parts.push(`<rect x="${x - 1}" y="${y - 1}" width="${thumbW + 2}" height="${thumbH + 2}" fill="#ffffff" stroke="#d7dee8" stroke-width="1"/>`);
    if (previewFiles[i]) {
      parts.push(`<image href="${svgImageHref(previewFiles[i])}" x="${x}" y="${y}" width="${thumbW}" height="${thumbH}" preserveAspectRatio="xMidYMid meet"/>`);
    } else {
      parts.push(`<rect x="${x}" y="${y}" width="${thumbW}" height="${thumbH}" fill="#eef2f7"/>`);
      parts.push(`<text x="${x + 16}" y="${y + 34}" font-family="Avenir Next, PingFang SC, sans-serif" font-size="14" font-weight="700" fill="#334155">PREVIEW FALLBACK</text>`);
      parts.push(`<text x="${x + 16}" y="${y + 58}" font-family="Avenir Next, PingFang SC, sans-serif" font-size="11" fill="#475569">${escapeXml(tokens.evidenceRegion || 'metadata evidence region')}</text>`);
      parts.push(`<text x="${x + 16}" y="${y + 80}" font-family="Avenir Next, PingFang SC, sans-serif" font-size="11" fill="#475569">${escapeXml(tokens.captionLabel || 'caption n/a')} · ${escapeXml(tokens.sourceDensity || 'source n/a')}</text>`);
      parts.push(`<text x="${x + 16}" y="${y + 104}" font-family="Avenir Next, PingFang SC, sans-serif" font-size="11" fill="#475569">${escapeXml(tokens.components.slice(0, 4).join(', ') || 'component evidence n/a')}</text>`);
    }
    parts.push(`<text x="${x}" y="${y + thumbH + 22}" font-family="Avenir Next, PingFang SC, sans-serif" font-size="12" font-weight="700" fill="#0f172a">Slide ${i + 1}</text>`);
    parts.push(`<text x="${x}" y="${y + thumbH + 42}" font-family="Avenir Next, PingFang SC, sans-serif" font-size="11" fill="#64748b">${escapeXml(tokens.rhythm || 'unknown')}</text>`);
    parts.push(`<text x="${x}" y="${y + thumbH + 60}" font-family="Avenir Next, PingFang SC, sans-serif" font-size="11" fill="#64748b">${escapeXml(tokens.compositionBias || tokens.evidenceRegion || '')}</text>`);
  }
  parts.push('</svg>');
  const file = path.join(CONTACT_DIR, `${slug(id)}.contact-sheet.svg`);
  fs.writeFileSync(file, `${parts.join('\n')}\n`, 'utf8');
  return file;
}

function signatureForRow(row = {}, type = 'rhythm') {
  const slides = row.visualSignatures || [];
  if (type === 'rhythm') return slides.map(slide => slide.rhythm).join('|');
  if (type === 'evidence') {
    return slides.map(slide => `${slide.evidenceRegion}:${slide.compositionBias}:${slide.components.join('+')}`).join('|');
  }
  if (type === 'captionSource') {
    return slides.map(slide => `${slide.captionLabel}:${slide.sourceDensity}`).join('|');
  }
  return '';
}

function duplicateSignatures(rows = [], type = '') {
  const seen = new Map();
  rows.forEach(row => {
    const sig = signatureForRow(row, type);
    if (!seen.has(sig)) seen.set(sig, []);
    seen.get(sig).push(row.id);
  });
  return [...seen.entries()].filter(([, ids]) => ids.length > 1).map(([signature, ids]) => ({ signature, ids }));
}

function visualDifferenceQa(rows = []) {
  const checks = ['rhythm', 'evidence', 'captionSource'].map(type => {
    const duplicates = duplicateSignatures(rows, type);
    return {
      type,
      status: duplicates.length ? 'fail' : 'pass',
      uniqueCount: new Set(rows.map(row => signatureForRow(row, type))).size,
      duplicates
    };
  });
  const allPreviewAvailable = rows.every(row => row.preview && row.preview.status === 'available' && row.preview.count > 0);
  const anyPreviewAvailable = rows.some(row => row.preview && row.preview.status === 'available' && row.preview.count > 0);
  const findings = checks.filter(check => check.status === 'fail').map(check => ({
    level: 'fail',
    type: `industryContactSheet${check.type[0].toUpperCase()}${check.type.slice(1)}Duplicate`,
    message: `${check.type} signatures should differ across P0 industries`
  }));
  return {
    version: 'industry-contact-sheet-visual-difference/v1',
    status: findings.length ? 'fail' : 'pass',
    basis: allPreviewAvailable ? 'preview-contact-sheet' : (anyPreviewAvailable ? 'mixed-preview-render-meta-contact-sheet' : 'render-meta-contact-sheet-fallback'),
    checks,
    findings
  };
}

function diagnosticSourceForFinding(finding = {}) {
  const type = String(finding.type || '');
  const message = String(finding.message || '');
  if (/preview|contactSheet/i.test(type)) return 'preview';
  if (/renderMeta|routeMetadata|nativeComponent.*Evidence|industryEvidenceRenderMeta/i.test(type)) return 'render-meta';
  if (/componentNotConsumed|renderedCountMismatch|unsafeOverlayBlocked|nativeComponentClaimed|industryEvidenceComponentNotConsumed|acceptanceComponentNotConsumed/i.test(type)) return 'drawing';
  if (/componentPlan|unknownComponent|missingRequiredComponent/i.test(type)) return 'planning';
  if (/neutral|crossIndustry|industryEvidence.*Missing|industryEvidenceStage|industryEvidenceChain/i.test(type) || /industry evidence-chain/i.test(message)) return 'derivation';
  return 'formal-qa';
}

function diagnosticsForQa(qa = null, preview = {}) {
  const findings = qa && Array.isArray(qa.findings) ? qa.findings : [];
  const blocking = findings.filter(finding => finding.level === 'fail' || finding.level === 'review');
  const bySource = {};
  blocking.forEach(finding => {
    const source = diagnosticSourceForFinding(finding);
    if (!bySource[source]) {
      bySource[source] = { fail: 0, review: 0, firstBlocking: null };
    }
    if (finding.level === 'fail') bySource[source].fail += 1;
    else bySource[source].review += 1;
    if (!bySource[source].firstBlocking) {
      bySource[source].firstBlocking = {
        level: finding.level || '',
        type: finding.type || '',
        slide: finding.slide || null,
        message: finding.message || ''
      };
    }
  });
  const previewStatus = preview && preview.status;
  if (previewStatus && !['available', 'metadata_fallback'].includes(previewStatus)) {
    bySource.preview = bySource.preview || { fail: 0, review: 0, firstBlocking: null };
    bySource.preview.review += 1;
    bySource.preview.firstBlocking = bySource.preview.firstBlocking || {
      level: 'review',
      type: 'previewUnavailable',
      slide: null,
      message: `preview status is ${previewStatus}`
    };
  }
  return {
    version: 'industry-smoke-failure-diagnostics/v1',
    status: Object.values(bySource).some(row => row.fail > 0)
      ? 'fail'
      : (Object.values(bySource).some(row => row.review > 0) ? 'review' : 'pass'),
    bySource
  };
}

function aggregateDiagnostics(rows = []) {
  const sourceCounts = {};
  rows.forEach(row => {
    const bySource = row.failureDiagnostics && row.failureDiagnostics.bySource || {};
    Object.entries(bySource).forEach(([source, counts]) => {
      sourceCounts[source] = sourceCounts[source] || { fail: 0, review: 0, samples: [] };
      sourceCounts[source].fail += Number(counts.fail || 0);
      sourceCounts[source].review += Number(counts.review || 0);
      if (!sourceCounts[source].samples.includes(row.id)) sourceCounts[source].samples.push(row.id);
    });
  });
  return {
    version: 'industry-smoke-failure-diagnostics-summary/v1',
    status: Object.values(sourceCounts).some(row => row.fail > 0)
      ? 'fail'
      : (Object.values(sourceCounts).some(row => row.review > 0) ? 'review' : 'pass'),
    sourceCounts
  };
}

function artifactRows(rows = []) {
  return rows.map(row => ({
    id: row.id,
    industry: row.industry,
    pptx: row.pptx || '',
    renderMeta: row.renderMeta || '',
    visualQa: row.visualQa || '',
    previewStatus: row.preview && row.preview.status || '',
    previewDir: row.preview && row.preview.dir || '',
    previewCount: row.preview && row.preview.count || 0,
    contactSheet: row.contactSheet || ''
  }));
}

function compactRowForExtended(row = {}) {
  return {
    id: row.id,
    industry: row.industry,
    chainStatus: row.industryChainStatus,
    slideCount: row.slideCount,
    previewStatus: row.preview && row.preview.status,
    visualQaStatus: row.visualQaStatus,
    stages: (row.stageTable || []).map(stage => stage.stageId),
    componentHits: row.keyComponentHits || [],
    consumedHits: row.consumedComponentHits || [],
    blockingGap: row.industryEvidenceChainSummary && row.industryEvidenceChainSummary.blockingGap || null,
    contactSheet: row.contactSheet,
    failureDiagnostics: row.failureDiagnostics || null
  };
}

function rowHasBlockingFailure(row = {}) {
  return row.status === 'fail' ||
    row.industryChainStatus === 'fail' ||
    row.visualQaStatus === 'fail' ||
    (row.failureDiagnostics && row.failureDiagnostics.status === 'fail');
}

function rowHasReview(row = {}) {
  return row.status === 'review' ||
    row.industryChainStatus === 'review' ||
    row.visualQaStatus === 'review';
}

function makeContactSheetIndex(rows = [], options = {}) {
  fs.mkdirSync(CONTACT_DIR, { recursive: true });
  const rowH = 112;
  const width = 1180;
  const height = 82 + rows.length * rowH + 36;
  const title = options.title || 'Five Industry Evidence Chain Contact Sheet Index';
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<rect width="100%" height="100%" fill="#f8fafc"/>',
    `<text x="34" y="38" font-family="Avenir Next, PingFang SC, sans-serif" font-size="22" font-weight="700" fill="#0f172a">${escapeXml(title)}</text>`,
    `<text x="34" y="62" font-family="Avenir Next, PingFang SC, sans-serif" font-size="12" fill="#64748b">${new Date().toISOString()}</text>`
  ];
  rows.forEach((row, i) => {
    const y = 82 + i * rowH;
    const components = (row.keyComponentHits || []).slice(0, 8).join(', ');
    const stages = (row.stageTable || []).map(stage => stage.stageId).join(' / ');
    parts.push(`<rect x="34" y="${y}" width="${width - 68}" height="${rowH - 16}" fill="#ffffff" stroke="#d7dee8" stroke-width="1"/>`);
    parts.push(`<text x="54" y="${y + 28}" font-family="Avenir Next, PingFang SC, sans-serif" font-size="15" font-weight="700" fill="#0f172a">${escapeXml(row.industry)} · ${escapeXml(row.id)}</text>`);
    parts.push(`<text x="54" y="${y + 52}" font-family="Avenir Next, PingFang SC, sans-serif" font-size="12" fill="#475569">preview ${escapeXml(row.preview.status)} (${row.preview.count} PNG) · chain ${escapeXml(row.industryChainStatus)} · slides ${row.slideCount}</text>`);
    parts.push(`<text x="54" y="${y + 75}" font-family="Avenir Next, PingFang SC, sans-serif" font-size="11" fill="#64748b">${escapeXml(stages)}</text>`);
    parts.push(`<text x="530" y="${y + 75}" font-family="Avenir Next, PingFang SC, sans-serif" font-size="11" fill="#64748b">${escapeXml(components)}</text>`);
  });
  parts.push('</svg>');
  const file = path.join(CONTACT_DIR, options.fileName || 'five-industries.contact-sheet-index.svg');
  fs.writeFileSync(file, `${parts.join('\n')}\n`, 'utf8');
  return file;
}

function main() {
  const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  const samples = (fixture.samples || []).filter(sample => P0_SMOKE_SAMPLE_IDS.has(sample.id));
  const extendedSamples = (fixture.samples || []).filter(sample => EXTENDED_SMOKE_SAMPLE_IDS.has(sample.id));
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(CONTACT_DIR, { recursive: true });
  const previewCapability = detectPreviewProviders();
  const runSample = sample => {
    const plan = enrichFormalSmokePlan(sample);
    const id = slug(sample.id);
    const planPath = path.join(OUT, `${id}.json`);
    const pptxPath = path.join(OUT, `${id}.pptx`);
    const previewDir = path.join(OUT, 'preview', id);
    const qaPath = path.join(OUT, `${id}.visual-qa.json`);
    writeJson(planPath, plan);
    const render = runNode(['scripts/generate_pptx.js', planPath, pptxPath]);
    if (render.status !== 0) {
      return {
        id: sample.id,
        industry: plan.industry,
        status: 'fail',
        error: render.stderr || render.stdout || 'generate_pptx failed'
      };
    }
    const previewResult = exportPreviews({
      file: pptxPath,
      previewDir,
      qualityMode: 'formal',
      previewOptional: true,
      run: (cmd, argv, opts = {}) => cp.execFileSync(cmd, argv, Object.assign({ encoding: 'utf8' }, opts))
    });
    const qaRun = runNodeToFile(['scripts/visual_qa.js', pptxPath, '--plan', planPath, '--preview-dir', previewDir, '--quality-mode', 'formal', '--json'], qaPath);
    const qa = parseJson(qaRun.stdout);
    if (qa) writeJson(qaPath, qa);
    const chainQa = qa && qa.industry_evidence_chain_qa;
    const chainSummary = (qa && qa.industry_evidence_chain_summary) ||
      (chainQa && chainQa.industry_evidence_chain_summary) ||
      null;
    const renderMetaPath = `${pptxPath}.render-meta.json`;
    const renderMeta = readJson(renderMetaPath) || {};
    const previewFiles = previewResult.files || [];
    const contactSheet = makeDeckContactSheet({
      id: sample.id,
      industry: plan.industry,
      previewFiles,
      previewState: previewResult.state || {},
      renderMeta,
      chainSummary: chainSummary || {}
    });
    const components = componentRows(chainQa || {});
    const stages = stageRows(chainQa || {});
    const visualSignatures = (renderMeta.slides || []).map(slideVisualTokens);
    return {
      id: sample.id,
      industry: plan.industry,
      status: chainQa && chainQa.status ? chainQa.status : 'fail',
      slideCount: chainQa ? chainQa.slideCount : ((renderMeta.slides || []).length || 0),
      pptx: rel(pptxPath),
      renderMeta: rel(renderMetaPath),
      visualQa: rel(qaPath),
      visualQaExitCode: qaRun.status,
      visualQaStatus: qa && qa.success ? 'pass' : 'fail',
      visualQaSummary: qa ? {
        success: Boolean(qa.success),
        failCount: qa.fail_count,
        reviewCount: qa.review_count,
        qualityMode: qa.quality_mode,
        industryEvidenceChainSummary: chainSummary || null
      } : null,
      preview: {
        requested: true,
        status: (previewResult.state && previewResult.state.status) || 'unknown',
        provider: (previewResult.state && previewResult.state.provider) || 'unknown',
        error: (previewResult.state && previewResult.state.error) || null,
        detail: (previewResult.state && previewResult.state.detail) || null,
        count: previewFiles.length,
        dir: rel(previewDir),
        files: previewFiles.slice(0, 5).map(rel)
      },
      contactSheet: rel(contactSheet),
      industryChainStatus: chainQa && chainQa.status ? chainQa.status : 'fail',
      industryEvidenceChainSummary: chainSummary,
      stageTable: stages,
      componentHitTable: components,
      keyComponentHits: components.filter(component => component.planned > 0).map(component => component.id),
      consumedComponentHits: components.filter(component => component.consumed > 0).map(component => component.id),
      visualSignatures,
      failureDiagnostics: diagnosticsForQa(qa, previewResult.state || {}),
      industryMetrics: chainQa ? chainQa.metrics : null,
      gapReasons: chainQa ? chainQa.gapReasons : ['industry_evidence_chain_qa missing']
    };
  };
  const rows = samples.map(runSample);
  const extendedRows = extendedSamples.map(runSample);
  const contactSheetIndex = makeContactSheetIndex(rows);
  const extendedContactSheetIndex = makeContactSheetIndex(extendedRows, {
    title: 'Extended Industry Evidence Chain Contact Sheet Index',
    fileName: 'extended-industries.contact-sheet-index.svg'
  });
  const visualDiff = visualDifferenceQa(rows);
  const allRows = [...rows, ...extendedRows];
  const failureDiagnostics = aggregateDiagnostics(allRows);
  const summary = {
    version: 'industry-evidence-chain-smoke/v1',
    sampleCount: rows.length,
    extendedSampleCount: extendedRows.length,
    outputDir: rel(OUT),
    previewCapability,
    contactSheetIndex: rel(contactSheetIndex),
    extendedContactSheetIndex: rel(extendedContactSheetIndex),
    visualDifferenceQa: visualDiff,
    artifactTable: artifactRows(allRows),
    componentHitTable: allRows.map(row => ({
      id: row.id,
      industry: row.industry,
      components: row.componentHitTable || []
    })),
    industryStageTable: allRows.map(row => ({
      id: row.id,
      industry: row.industry,
      stages: row.stageTable || []
    })),
    failureDiagnostics,
    rows,
    extendedRows,
    extendedIndustrySmoke: {
      status: extendedRows.some(rowHasBlockingFailure) ? 'fail' : (extendedRows.some(rowHasReview) ? 'review' : 'pass'),
      rows: extendedRows.map(compactRowForExtended)
    },
    status: allRows.some(rowHasBlockingFailure) || visualDiff.status === 'fail'
      ? 'fail'
      : (allRows.some(rowHasReview) || visualDiff.status === 'review' ? 'review' : 'pass')
  };
  writeJson(path.join(OUT, 'summary.json'), summary);
  console.log(JSON.stringify(summary, null, 2));
  if (summary.status === 'fail') process.exit(1);
}

main();

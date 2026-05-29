#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { issueCategoryForFinding, routeChartSpec } = require('./chart-spec');
const { normalizeDeckPlan } = require('./design-system');

const ROOT = path.resolve(__dirname, '..');
const THREAD_ID = process.env.CODEX_THREAD_ID || 'manual-20260525-chart-regression-samples';
const WORKSPACE = path.join(ROOT, 'outputs', THREAD_ID, 'presentations', 'chart-regression-samples');
const SNAPSHOT_DIR = path.join(WORKSPACE, 'snapshots');
const CONTACT_DIR = path.join(WORKSPACE, 'contact-sheets');

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, 'utf8');
}

function rel(file) {
  return path.relative(ROOT, file);
}

function escapeXml(text = '') {
  return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

function imageData(file) {
  if (!file || !fs.existsSync(file)) return '';
  const ext = path.extname(file).toLowerCase();
  const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
}

function previewFile(previewDir, slide) {
  if (!previewDir || !fs.existsSync(previewDir)) return '';
  const files = fs.readdirSync(previewDir).filter(file => /\.png$/i.test(file)).sort();
  return files[slide - 1] ? path.join(previewDir, files[slide - 1]) : '';
}

function classifySample(slide, spec, renderSlide, fallback) {
  if (fallback) return fallback;
  if (spec && spec.kind === 'informationGap') return 'data_contract_gap';
  if (!renderSlide || !renderSlide.chartConsumption) return 'component_gap';
  const text = [slide.title, slide.dataComponent, slide.layoutVariant, slide.proofObject].filter(Boolean).join(' ');
  if (/trend|monthly|pulse|waterfall|bridge|funnel/i.test(text) && spec && spec.kind && !new RegExp(spec.kind, 'i').test(text)) return 'routing_error';
  return issueCategoryForFinding({ type: 'visualRegressionCandidate' });
}

const sourceDecks = [
  {
    slug: 'shiseido-ultimune-12p',
    label: 'SHISEIDO ULTIMUNE 12p',
    plan: path.join(ROOT, 'outputs/019e5a66-e92a-7bc1-a47f-ae76b7cc443b/presentations/shiseido-beauty-report/plan/shiseido-ultimune-12p.json'),
    renderMeta: path.join(ROOT, 'outputs/019e5a66-e92a-7bc1-a47f-ae76b7cc443b/presentations/shiseido-beauty-report/output/shiseido-ultimune-brand-operating-report-optimized.pptx.render-meta.json'),
    previewDir: path.join(ROOT, 'outputs/019e5a66-e92a-7bc1-a47f-ae76b7cc443b/presentations/shiseido-beauty-report/preview-optimized'),
    contactSheet: path.join(ROOT, 'outputs/019e5a66-e92a-7bc1-a47f-ae76b7cc443b/presentations/shiseido-beauty-report/contact-sheets/shiseido-ultimune-12p.optimized-contact-sheet.png'),
    slides: [
      { slide: 6, issueCategory: 'routing_error', note: 'member-growth proof was previously treated like a generic KPI board' },
      { slide: 7, issueCategory: 'component_gap', note: 'chart-grid page needs concrete chart components, not mini bars' },
      { slide: 9, issueCategory: 'data_contract_gap', note: 'sustainability proof needs matrix/source units instead of generic ESG readout' },
      { slide: 11, issueCategory: 'renderer_layout_bug', note: 'process/value chart needs label spacing and source discipline' }
    ]
  },
  {
    slug: 'retail-data-components',
    label: 'Retail data components',
    plan: path.join(ROOT, 'examples/fixtures/retail-data-components.json'),
    renderMeta: path.join(ROOT, 'outputs/manual-20260525-retail-data-components/retail-data-components.pptx.render-meta.json'),
    previewDir: path.join(ROOT, 'outputs/manual-20260525-retail-data-components/preview'),
    contactSheet: '',
    slides: [
      { slide: 2, issueCategory: 'data_contract_gap', note: 'trend-line must require a real monthly series' },
      { slide: 3, issueCategory: 'renderer_layout_bug', note: 'channel bubble labels need avoidance and readable axes' },
      { slide: 4, issueCategory: 'routing_error', note: 'target bridge must route to waterfall, not equal bars' }
    ]
  },
  {
    slug: 'industry-acceptance-beauty',
    label: 'Industry acceptance beauty',
    plan: path.join(ROOT, 'outputs/019e583b-b589-7043-8c51-700ce5757a00/presentations/industry-template-system-acceptance/plans/beauty-brand-report.json'),
    renderMeta: path.join(ROOT, 'outputs/019e583b-b589-7043-8c51-700ce5757a00/presentations/industry-template-system-acceptance/output/beauty-brand-report.pptx.render-meta.json'),
    previewDir: path.join(ROOT, 'outputs/019e583b-b589-7043-8c51-700ce5757a00/presentations/industry-template-system-acceptance/preview/beauty-brand-report'),
    contactSheet: path.join(ROOT, 'outputs/019e583b-b589-7043-8c51-700ce5757a00/presentations/industry-template-system-acceptance/contact-sheets/beauty-brand-report.contact-sheet.svg'),
    slides: [
      { slide: 5, issueCategory: 'component_gap', note: 'product evidence needs SKU/texture/efficacy primitives' },
      { slide: 6, issueCategory: 'data_contract_gap', note: 'member repurchase needs cohort/source trace' },
      { slide: 8, issueCategory: 'renderer_layout_bug', note: 'governance/table chart needs readable source and unit area' }
    ]
  }
];

function buildSamples() {
  fs.rmSync(WORKSPACE, { recursive: true, force: true });
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  fs.mkdirSync(CONTACT_DIR, { recursive: true });
  const samples = [];
  sourceDecks.forEach(deck => {
    const plan = readJson(deck.plan);
    if (!plan) return;
    const normalized = normalizeDeckPlan(plan);
    const renderMeta = readJson(deck.renderMeta, { slides: [] });
    const pickedSlides = [];
    deck.slides.forEach(row => {
      const slide = normalized.slides[row.slide - 1];
      if (!slide) return;
      const spec = slide.chartSpec || routeChartSpec(normalized, slide, { index: row.slide, total: normalized.slides.length });
      const renderSlide = (renderMeta.slides || []).find(item => Number(item.slide) === row.slide) || null;
      const issueCategory = classifySample(slide, spec, renderSlide, row.issueCategory);
      const sample = {
        id: `${deck.slug}-p${String(row.slide).padStart(2, '0')}`,
        deck: deck.slug,
        deckLabel: deck.label,
        slide: row.slide,
        title: slide.title || '',
        route: slide.layoutVariant ? `${slide.type}:${slide.layoutVariant}` : slide.type,
        proofObject: (slide.proof && slide.proof.id) || slide.proofObject || '',
        chartSpec: spec || null,
        renderMeta: renderSlide,
        issueCategory,
        note: row.note,
        preview: previewFile(deck.previewDir, row.slide)
      };
      pickedSlides.push(slide);
      samples.push(sample);
    });
    writeJson(path.join(SNAPSHOT_DIR, `${deck.slug}.deck-plan.json`), Object.assign({}, plan, { slides: pickedSlides }));
    writeJson(path.join(SNAPSHOT_DIR, `${deck.slug}.render-meta.json`), {
      version: 'chart-regression-render-meta/v1',
      sourceRenderMeta: fs.existsSync(deck.renderMeta) ? deck.renderMeta : '',
      slides: samples.filter(sample => sample.deck === deck.slug).map(sample => sample.renderMeta).filter(Boolean)
    });
  });

  const contactSheet = makeContactSheet(samples);
  const manifest = {
    version: 'chart-regression-samples/v1',
    generatedAt: new Date().toISOString(),
    workspace: WORKSPACE,
    sampleCount: samples.length,
    issueCategories: ['component_gap', 'data_contract_gap', 'routing_error', 'renderer_layout_bug'],
    contactSheet,
    snapshots: SNAPSHOT_DIR,
    samples: samples.map(sample => Object.assign({}, sample, {
      preview: sample.preview ? rel(sample.preview) : '',
      renderMeta: sample.renderMeta ? { slide: sample.renderMeta.slide, chartConsumption: sample.renderMeta.chartConsumption || null } : null
    }))
  };
  const manifestPath = path.join(WORKSPACE, 'manifest.json');
  writeJson(manifestPath, manifest);
  return manifestPath;
}

function makeContactSheet(samples) {
  const cols = 2;
  const thumbW = 420;
  const thumbH = 236;
  const gap = 34;
  const margin = 42;
  const header = 88;
  const rows = Math.ceil(samples.length / cols);
  const width = margin * 2 + cols * thumbW + (cols - 1) * gap;
  const height = header + rows * (thumbH + 74) + 34;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<rect width="100%" height="100%" fill="#f8fafc"/>',
    `<text x="${margin}" y="42" font-family="Avenir Next, Arial, sans-serif" font-size="24" font-weight="700" fill="#0f172a">Chart Regression Samples</text>`,
    `<text x="${margin}" y="68" font-family="Avenir Next, Arial, sans-serif" font-size="13" fill="#64748b">${samples.length} pages across existing benchmark decks</text>`
  ];
  samples.forEach((sample, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = margin + col * (thumbW + gap);
    const y = header + row * (thumbH + 74);
    parts.push(`<rect x="${x - 1}" y="${y - 1}" width="${thumbW + 2}" height="${thumbH + 2}" fill="#ffffff" stroke="#d7dee8"/>`);
    const href = imageData(sample.preview);
    if (href) {
      parts.push(`<image href="${href}" x="${x}" y="${y}" width="${thumbW}" height="${thumbH}" preserveAspectRatio="xMidYMid meet"/>`);
    } else {
      parts.push(`<rect x="${x}" y="${y}" width="${thumbW}" height="${thumbH}" fill="#eef2f7"/>`);
      parts.push(`<text x="${x + 22}" y="${y + 112}" font-family="Avenir Next, Arial, sans-serif" font-size="16" fill="#64748b">preview unavailable</text>`);
    }
    parts.push(`<text x="${x}" y="${y + thumbH + 24}" font-family="Avenir Next, Arial, sans-serif" font-size="14" font-weight="700" fill="#0f172a">${escapeXml(sample.id)}</text>`);
    parts.push(`<text x="${x}" y="${y + thumbH + 45}" font-family="Avenir Next, Arial, sans-serif" font-size="12" fill="#475569">${escapeXml(sample.issueCategory)} - ${escapeXml(sample.route)}</text>`);
  });
  parts.push('</svg>');
  const file = path.join(CONTACT_DIR, 'chart-regression-samples.contact-sheet.svg');
  writeText(file, `${parts.join('\n')}\n`);
  return file;
}

try {
  const manifest = buildSamples();
  console.log(JSON.stringify({ success: true, manifest }, null, 2));
} catch (error) {
  console.error(error.stack || error.message || error);
  process.exit(1);
}

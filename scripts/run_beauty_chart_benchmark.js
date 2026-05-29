#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { chartAcceptanceGate, issueCategoryForFinding } = require('./chart-spec');
const { normalizeDeckPlan } = require('./design-system');

const ROOT = path.resolve(__dirname, '..');
const THREAD_ID = process.env.CODEX_THREAD_ID || 'manual-20260525-beauty-chart-benchmark';
const WORKSPACE = path.join(ROOT, 'outputs', THREAD_ID, 'presentations', 'beauty-consumer-chart-benchmark');
const PLAN_DIR = path.join(WORKSPACE, 'plan');
const OUTPUT_DIR = path.join(WORKSPACE, 'output');
const PREVIEW_DIR = path.join(WORKSPACE, 'preview');
const QA_DIR = path.join(WORKSPACE, 'qa');
const CONTACT_DIR = path.join(WORKSPACE, 'contact-sheets');

const SOURCE_PLAN = path.join(ROOT, 'outputs/019e5a66-e92a-7bc1-a47f-ae76b7cc443b/presentations/shiseido-beauty-report/plan/shiseido-ultimune-12p.json');
const SOURCE_PREVIEW_DIR = path.join(ROOT, 'outputs/019e5a66-e92a-7bc1-a47f-ae76b7cc443b/presentations/shiseido-beauty-report/preview-optimized');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
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

function runNode(script, args, opts = {}) {
  const result = cp.spawnSync(process.execPath, [path.join(ROOT, script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: Object.assign({}, process.env, opts.env || {}),
    timeout: opts.timeout || 180000,
    maxBuffer: opts.maxBuffer || 20 * 1024 * 1024
  });
  if (result.status !== 0 && !opts.allowFail) {
    const detail = result.stderr || result.stdout || `exit ${result.status}`;
    throw new Error(`${script} failed: ${detail}`);
  }
  return {
    ok: result.status === 0,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status
  };
}

function runNodeToFile(script, args, outFile, opts = {}) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const stdout = fs.openSync(outFile, 'w');
  const result = cp.spawnSync(process.execPath, [path.join(ROOT, script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: Object.assign({}, process.env, opts.env || {}),
    timeout: opts.timeout || 180000,
    stdio: ['ignore', stdout, 'pipe']
  });
  fs.closeSync(stdout);
  if (result.status !== 0 && !opts.allowFail) {
    const detail = result.stderr || `exit ${result.status}`;
    throw new Error(`${script} failed: ${detail}`);
  }
  return {
    ok: result.status === 0,
    stdoutFile: outFile,
    stderr: result.stderr || '',
    status: result.status
  };
}

function escapeXml(text = '') {
  return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

function imageHref(file) {
  if (!file || !fs.existsSync(file)) return '';
  const ext = path.extname(file).toLowerCase();
  const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
}

function copyExistingPreviews() {
  if (!fs.existsSync(SOURCE_PREVIEW_DIR)) return [];
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  return fs.readdirSync(SOURCE_PREVIEW_DIR)
    .filter(file => /\.png$/i.test(file))
    .sort()
    .map((file, i) => {
      const dest = path.join(PREVIEW_DIR, `benchmark.${String(i + 1).padStart(3, '0')}.png`);
      fs.copyFileSync(path.join(SOURCE_PREVIEW_DIR, file), dest);
      return dest;
    });
}

function previewFiles() {
  if (!fs.existsSync(PREVIEW_DIR)) return [];
  return fs.readdirSync(PREVIEW_DIR).filter(file => /\.png$/i.test(file)).sort().map(file => path.join(PREVIEW_DIR, file));
}

function makeContactSheet(plan, files) {
  const cols = 3;
  const thumbW = 360;
  const thumbH = 203;
  const gapX = 28;
  const gapY = 54;
  const margin = 42;
  const header = 84;
  const rows = Math.ceil(files.length / cols);
  const width = margin * 2 + cols * thumbW + (cols - 1) * gapX;
  const height = header + rows * thumbH + (rows - 1) * gapY + 70;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<rect width="100%" height="100%" fill="#f8fafc"/>',
    `<text x="${margin}" y="42" font-family="Avenir Next, Arial, sans-serif" font-size="24" font-weight="700" fill="#0f172a">${escapeXml(plan.title || 'Beauty benchmark')}</text>`,
    `<text x="${margin}" y="68" font-family="Avenir Next, Arial, sans-serif" font-size="13" fill="#64748b">${files.length} slides - chart acceptance benchmark</text>`
  ];
  files.forEach((file, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = margin + col * (thumbW + gapX);
    const y = header + row * (thumbH + gapY);
    parts.push(`<rect x="${x - 1}" y="${y - 1}" width="${thumbW + 2}" height="${thumbH + 2}" fill="#fff" stroke="#d7dee8"/>`);
    const href = imageHref(file);
    if (href) parts.push(`<image href="${href}" x="${x}" y="${y}" width="${thumbW}" height="${thumbH}" preserveAspectRatio="xMidYMid meet"/>`);
    parts.push(`<text x="${x}" y="${y + thumbH + 20}" font-family="Avenir Next, Arial, sans-serif" font-size="14" fill="#475569">${String(i + 1).padStart(2, '0')}</text>`);
  });
  parts.push('</svg>');
  const file = path.join(CONTACT_DIR, 'beauty-consumer-chart-benchmark.contact-sheet.svg');
  writeText(file, `${parts.join('\n')}\n`);
  return file;
}

function parseJsonOutput(output, fallback = {}) {
  const text = String(output || '').trim();
  if (!text) return fallback;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) return fallback;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch (_) {
    return fallback;
  }
}

function issueAnnotations(qa = {}) {
  const findings = [
    ...((qa.chart_semantic_qa && qa.chart_semantic_qa.findings) || []),
    ...((qa.chart_visual_qa && qa.chart_visual_qa.findings) || []),
    ...((qa.chart_evidence_qa && qa.chart_evidence_qa.findings) || []),
    ...((qa.chart_acceptance_gate && qa.chart_acceptance_gate.findings) || [])
  ];
  const bySlide = new Map();
  findings.forEach(finding => {
    const slide = finding.slide || 0;
    if (!slide) return;
    const row = bySlide.get(slide) || [];
    row.push({
      type: finding.type,
      level: finding.level,
      issueCategory: issueCategoryForFinding(finding),
      message: finding.message
    });
    bySlide.set(slide, row);
  });
  return {
    version: 'chart-issue-annotations/v1',
    issueCategories: ['component_gap', 'data_contract_gap', 'routing_error', 'renderer_layout_bug'],
    slides: [...bySlide.entries()].map(([slide, issues]) => ({ slide, issues }))
  };
}

function loadBenchmarkPlan() {
  if (!fs.existsSync(SOURCE_PLAN)) {
    throw new Error(`formal beauty source plan not found: ${SOURCE_PLAN}`);
  }
  const plan = readJson(SOURCE_PLAN);
  return Object.assign({}, plan, {
    formalMaterialGeneration: false,
    outputIntent: 'benchmark',
    allowDraftRender: true,
    benchmark: {
      version: 'beauty-consumer-chart-benchmark/v1',
      sourcePlan: rel(SOURCE_PLAN),
      acceptanceGate: 'chart-acceptance-gate/v1'
    }
  });
}

function main() {
  fs.rmSync(WORKSPACE, { recursive: true, force: true });
  [PLAN_DIR, OUTPUT_DIR, PREVIEW_DIR, QA_DIR, CONTACT_DIR].forEach(dir => fs.mkdirSync(dir, { recursive: true }));
  const plan = loadBenchmarkPlan();
  const normalized = normalizeDeckPlan(plan);
  const planPath = path.join(PLAN_DIR, 'beauty-consumer-chart-benchmark-12p.json');
  const pptxPath = path.join(OUTPUT_DIR, 'beauty-consumer-chart-benchmark-12p.pptx');
  writeJson(planPath, plan);

  runNode('scripts/generate_pptx.js', [rel(planPath), rel(pptxPath)], {
    timeout: 180000,
    env: { PREMIUM_PPT_ALLOW_DRAFT_RENDER: '1' }
  });

  let validate = runNode('scripts/validate_pptx.js', [
    rel(pptxPath),
    '--expect-slides', String(normalized.slides.length),
    '--require', 'ULTIMUNE,SHISEIDO',
    '--preview-dir', rel(PREVIEW_DIR)
  ], { timeout: 180000, allowFail: true });
  if (!validate.ok) {
    copyExistingPreviews();
    validate = runNode('scripts/validate_pptx.js', [
      rel(pptxPath),
      '--expect-slides', String(normalized.slides.length),
      '--require', 'ULTIMUNE,SHISEIDO'
    ], { timeout: 180000, allowFail: true });
  }

  const files = previewFiles();
  const contactSheet = makeContactSheet(plan, files);
  const qaPath = path.join(QA_DIR, 'visual-qa.json');
  const qaRun = runNodeToFile('scripts/visual_qa.js', [
    rel(pptxPath),
    ...(files.length ? ['--preview-dir', rel(PREVIEW_DIR)] : []),
    '--plan', rel(planPath),
    '--json'
  ], qaPath, { timeout: 180000, allowFail: true });
  let qa = {};
  try {
    qa = readJson(qaPath);
  } catch (_) {
    qa = parseJsonOutput(qaRun.stdout, {
      success: false,
      error: qaRun.stderr || 'visual_qa produced no JSON'
    });
  }
  if (!qa || typeof qa !== 'object' || !Object.keys(qa).length) qa = {
    success: false,
    error: qaRun.stderr || 'visual_qa produced no JSON'
  };
  const renderMeta = readJson(`${pptxPath}.render-meta.json`);
  const strictGate = chartAcceptanceGate(plan, normalizeDeckPlan(plan), renderMeta, {
    strict: true,
    previewReports: qa.previews || [],
    requireContactSheet: true
  });
  const annotations = issueAnnotations(Object.assign({}, qa, { chart_acceptance_gate: strictGate }));
  const chartQaPath = path.join(QA_DIR, 'chart-qa.json');
  const gatePath = path.join(QA_DIR, 'acceptance-gate.json');
  const annotationsPath = path.join(QA_DIR, 'issue-annotations.json');
  writeJson(chartQaPath, {
    version: 'beauty-chart-benchmark-qa/v1',
    semantic: qa.chart_semantic_qa || null,
    visual: qa.chart_visual_qa || null,
    evidence: qa.chart_evidence_qa || null,
    pageScores: qa.page_chart_scores || null
  });
  writeJson(gatePath, strictGate);
  writeJson(annotationsPath, annotations);
  const manifest = {
    version: 'beauty-consumer-chart-benchmark/v1',
    generatedAt: new Date().toISOString(),
    workspace: WORKSPACE,
    plan: planPath,
    pptx: pptxPath,
    renderMeta: `${pptxPath}.render-meta.json`,
    qa: qaPath,
    chartQa: chartQaPath,
    acceptanceGate: gatePath,
    issueAnnotations: annotationsPath,
    contactSheet,
    previewDir: files.length ? PREVIEW_DIR : '',
    slideCount: normalized.slides.length,
    acceptanceStatus: strictGate.status,
    validateOk: validate.ok,
    visualQaOk: qaRun.ok
  };
  const manifestPath = path.join(WORKSPACE, 'manifest.json');
  writeJson(manifestPath, manifest);
  console.log(JSON.stringify({
    success: strictGate.status !== 'fail',
    manifest: manifestPath,
    pptx: pptxPath,
    renderMeta: `${pptxPath}.render-meta.json`,
    chartQa: chartQaPath,
    acceptanceGate: gatePath,
    contactSheet,
    acceptanceStatus: strictGate.status
  }, null, 2));
  if (strictGate.status === 'fail') process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(error.stack || error.message || error);
  process.exit(1);
}

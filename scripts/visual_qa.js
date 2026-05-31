#!/usr/bin/env node
/* Structural visual QA for generated PPTX files.
   This complements Keynote preview review by catching tiny text, text-heavy slides,
   missing previews, placeholder copy, and weak image-role fit signals. */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const {
  VISUAL_SYSTEM,
  acceptanceAudit,
  auditDeckPlan,
  componentPlanAudit,
  commercialReadinessAudit,
  compositionAudit,
  evidenceAudit,
  industryFitAudit,
  industryKnowledgeAudit,
  normalizeDeckPlan,
  pageCountAudit,
  reportDepthAudit,
  resolveAssetPath,
  scoreImageAsset,
  sourceTraceAudit,
  typographyAudit,
  visualAestheticModel
} = require('./design-system');
const {
  chartAcceptanceGate,
  chartEvidenceQA,
  chartSemanticQA,
  chartVisualQA,
  pageLevelChartScores
} = require('./chart-spec');
const {
  bboxDelta,
  hamming,
  pngAnalysis,
  pngInfo
} = require('./qa/png-analysis');
const {
  componentConsumptionAuditFromRender,
  contentCoverageAuditFromRender,
  overlayContractAuditFromRender,
  renderMetaSchemaAuditFromRender,
  secondaryVisualReview
} = require('./qa/render-meta-audits');

function usage() {
  console.error('Usage: node scripts/visual_qa.js <file.pptx> [--preview-dir dir] [--baseline manifest.json] [--plan deck-plan.json] [--quality-mode draft|formal|delivery] [--json]');
  process.exit(2);
}

const args = process.argv.slice(2);
if (!args[0]) usage();
let fileArg = '';
let previewDir = '';
let baselinePath = '';
let planPath = '';
let jsonOnly = false;
let qualityMode = 'draft';
function normalizeQualityMode(value = '') {
  const mode = String(value || '').trim().toLowerCase().replace(/_/g, '-');
  if (mode === 'formal-review') return 'formal';
  if (['draft', 'formal', 'delivery'].includes(mode)) return mode;
  return '';
}
for (let i=0; i<args.length; i++) {
  if (args[i] === '--preview-dir') previewDir = path.resolve(String(args[++i] || ''));
  else if (args[i] === '--baseline') baselinePath = path.resolve(String(args[++i] || ''));
  else if (args[i] === '--plan') planPath = path.resolve(String(args[++i] || ''));
  else if (args[i] === '--quality-mode') {
    qualityMode = normalizeQualityMode(args[++i]);
    if (!qualityMode) usage();
  }
  else if (args[i] === '--json') jsonOnly = true;
  else if (!fileArg) fileArg = args[i];
  else usage();
}
if (!fileArg) usage();
const file = path.resolve(fileArg);

const FORMAL_PROMOTIONS = {
  renderMetaMissing: 'formal review requires render-meta so contract QA cannot be skipped',
  textLineCollision: 'formal review treats visible text/rule collisions as blocking layout defects',
  smallChineseText: 'formal review treats dense small Chinese text as a readability defect',
  duplicateOverlayComponent: 'formal review blocks duplicate overlays that may indicate stale fallback rendering',
  weakImageAsset: 'formal review requires weak image assets to be reviewed before delivery review'
};
const DELIVERY_PROMOTIONS = {
  previewMissing: 'delivery validation requires preview evidence for screenshot-level review',
  previewCount: 'delivery validation requires preview count to match slide count',
  previewUnreadable: 'delivery validation cannot use unreadable preview images',
  possiblyBlankPreview: 'delivery validation blocks possibly blank preview images',
  lowVisualVariance: 'delivery validation blocks previews that appear blank or overly plain',
  slideSimilarity: 'delivery validation blocks likely duplicated adjacent slides',
  contactSheetRhythmRepeat: 'delivery validation blocks repeated contact-sheet rhythm',
  textDensity: 'delivery validation treats excessive text density as blocking',
  typographyScaleTooFragmented: 'delivery validation treats fragmented type scale as blocking',
  typographyFontFamilyDrift: 'delivery validation treats font-family drift as blocking'
};
function severityPromotionsForMode(mode) {
  if (mode === 'delivery') return { ...FORMAL_PROMOTIONS, ...DELIVERY_PROMOTIONS };
  if (mode === 'formal') return { ...FORMAL_PROMOTIONS };
  return {};
}
function applyQualitySeverityPolicy(findings = [], mode = 'draft') {
  const promotions = severityPromotionsForMode(mode);
  const applied = findings.map(finding => {
    const reason = promotions[finding.type];
    if (!reason || finding.level === 'fail') return finding;
    return {
      ...finding,
      originalLevel: finding.level || 'review',
      level: 'fail',
      fatalBecauseOfQualityMode: mode,
      severityPolicyReason: reason
    };
  });
  return {
    findings: applied,
    policy: {
      version: 'quality-severity-policy/v1',
      mode,
      promotedTypes: Object.keys(promotions).sort()
    }
  };
}

function run(cmd, argv) {
  return cp.execFileSync(cmd, argv, { encoding:'utf8' });
}

function unzipText(entry) {
  try { return run('unzip', ['-p', file, entry]); } catch (_) { return ''; }
}

function xmlTextValues(xml) {
  return [...xml.matchAll(/<a:t>(.*?)<\/a:t>/g)].map(m => m[1]
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'"));
}
function xmlTextRuns(xml) {
  return [...xml.matchAll(/<a:r>([\s\S]*?)<\/a:r>/g)].map(m => {
    const run = m[1];
    const size = ((run.match(/<a:rPr\b[^>]*\bsz="(\d+)"/) || [])[1]);
    const fonts = [...run.matchAll(/typeface="([^"]+)"/g)].map(match => match[1]);
    const text = xmlTextValues(run).join('');
    return { text, size: size ? Number(size) / 100 : null, fonts };
  }).filter(r => r.text);
}
function xmlTextShapes(xml) {
  const emuPerInch = 914400;
  return [...xml.matchAll(/<p:sp\b[\s\S]*?<\/p:sp>/g)].map(m => {
    const block = m[0];
    const text = xmlTextValues(block).join('');
    if (!text.trim()) return null;
    const off = block.match(/<a:off\b[^>]*\bx="(-?\d+)"[^>]*\by="(-?\d+)"/);
    const ext = block.match(/<a:ext\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/);
    const runs = xmlTextRuns(block);
    const sizes = runs.map(r => r.size).filter(v => v != null);
    return {
      text,
      x: off ? Number(off[1]) / emuPerInch : null,
      y: off ? Number(off[2]) / emuPerInch : null,
      w: ext ? Number(ext[1]) / emuPerInch : null,
      h: ext ? Number(ext[2]) / emuPerInch : null,
      minSize: sizes.length ? Math.min(...sizes) : null,
      order: m.index || 0
    };
  }).filter(Boolean);
}
function xmlLineShapes(xml) {
  const emuPerInch = 914400;
  const blocks = [
    ...String(xml).matchAll(/<p:cxnSp\b[\s\S]*?<\/p:cxnSp>/g),
    ...String(xml).matchAll(/<p:sp\b[\s\S]*?<a:prstGeom\b[^>]*prst="line"[\s\S]*?<\/p:sp>/g)
  ].map(m => ({ block:m[0], order:m.index || 0 }));
  return blocks.map(block => {
    const off = block.block.match(/<a:off\b[^>]*\bx="(-?\d+)"[^>]*\by="(-?\d+)"/);
    const ext = block.block.match(/<a:ext\b[^>]*\bcx="(-?\d+)"[^>]*\bcy="(-?\d+)"/);
    if (!off || !ext) return null;
    const x = Number(off[1]) / emuPerInch;
    const y = Number(off[2]) / emuPerInch;
    const w = Number(ext[1]) / emuPerInch;
    const h = Number(ext[2]) / emuPerInch;
    return {
      x: Math.min(x, x + w),
      y: Math.min(y, y + h),
      w: Math.abs(w),
      h: Math.abs(h),
      order: block.order,
      arrow: /<a:(?:headEnd|tailEnd)\b[^>]*\btype="(?:triangle|stealth|arrow|oval|diamond)"/i.test(block.block)
    };
  }).filter(Boolean);
}
function xmlRectShapes(xml) {
  const emuPerInch = 914400;
  return [...String(xml).matchAll(/<p:sp\b[\s\S]*?<a:prstGeom\b[^>]*prst="rect"[\s\S]*?<\/p:sp>/g)].map(m => {
    const block = m[0];
    const off = block.match(/<a:off\b[^>]*\bx="(-?\d+)"[^>]*\by="(-?\d+)"/);
    const ext = block.match(/<a:ext\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/);
    if (!off || !ext) return null;
    const x = Number(off[1]) / emuPerInch;
    const y = Number(off[2]) / emuPerInch;
    const w = Number(ext[1]) / emuPerInch;
    const h = Number(ext[2]) / emuPerInch;
    const hasText = Boolean(xmlTextValues(block).join('').trim());
    const spPr = (block.match(/<p:spPr\b[\s\S]*?<\/p:spPr>/) || [''])[0];
    const fillRegion = String(spPr || block).split(/<a:ln\b/)[0];
    const noFill = /<a:noFill\b[^>]*\/>/.test(fillRegion);
    const hasSolidFill = /<a:solidFill\b[\s\S]*?<\/a:solidFill>|<a:solidFill\b[^>]*\/>/.test(fillRegion);
    const alphaValues = [...fillRegion.matchAll(/<a:alpha\b[^>]*\bval="(\d+)"/g)]
      .map(match => Number(match[1]))
      .filter(Number.isFinite);
    const fillOpacity = noFill
      ? 0
      : (hasSolidFill ? (alphaValues.length ? Math.min(...alphaValues) / 100000 : 1) : 0);
    return { x, y, w, h, order:m.index || 0, hasText, hasSolidFill, fillOpacity };
  }).filter(Boolean);
}
function xmlImageShapes(xml) {
  const emuPerInch = 914400;
  return [...String(xml).matchAll(/<p:pic\b[\s\S]*?<\/p:pic>/g)].map(m => {
    const block = m[0];
    const off = block.match(/<a:off\b[^>]*\bx="(-?\d+)"[^>]*\by="(-?\d+)"/);
    const ext = block.match(/<a:ext\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/);
    if (!off || !ext) return null;
    const x = Number(off[1]) / emuPerInch;
    const y = Number(off[2]) / emuPerInch;
    const w = Number(ext[1]) / emuPerInch;
    const h = Number(ext[2]) / emuPerInch;
    return { x, y, w, h, order:m.index || 0 };
  }).filter(Boolean);
}
function rectContainsPoint(rect, x, y, pad = 0.02) {
  return x > rect.x + pad && x < rect.x + rect.w - pad && y > rect.y + pad && y < rect.y + rect.h - pad;
}
function intersectionArea(a = {}, b = {}) {
  if ([a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h].some(v => v == null)) return 0;
  const w = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const h = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return w * h;
}
function rectArea(rect = {}) {
  return Math.max(0, Number(rect.w || 0)) * Math.max(0, Number(rect.h || 0));
}
function lineMidpoint(line = {}) {
  return { x:line.x + line.w / 2, y:line.y + line.h / 2 };
}
function lineIntersectsText(line, shape) {
  if (!line || !shape || line.w == null || shape.w == null || shape.h == null) return false;
  if (line.w < 0.22 || line.h > 0.05) return false;
  if (shape.y == null || shape.x == null) return false;
  const text = String(shape.text || '').trim();
  if (text.length < 2) return false;
  if (shape.y >= 6.62) return false;
  const yInside = line.y > shape.y + 0.018 && line.y < shape.y + shape.h - 0.018;
  const xOverlap = Math.max(line.x, shape.x) < Math.min(line.x + line.w, shape.x + shape.w) - 0.04;
  return yInside && xOverlap;
}
function hasCjk(text) {
  return /[\u3400-\u9fff]/.test(String(text || ''));
}
function compactUnique(values = []) {
  const out = [];
  const seen = new Set();
  values.filter(v => v != null && String(v).trim()).forEach(value => {
    const key = String(value).trim();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(value);
    }
  });
  return out;
}

function regionCoverage(shapes = [], region = {}) {
  const area = Number(region.w || 0) * Number(region.h || 0);
  if (!area) return 0;
  const covered = shapes.reduce((sum, shape) => sum + intersectionArea(shape, region), 0);
  return Number(Math.min(1, covered / area).toFixed(4));
}

function textCharsInRegion(textShapes = [], region = {}) {
  return textShapes
    .filter(shape => intersectionArea(shape, region) > 0)
    .reduce((sum, shape) => sum + String(shape.text || '').replace(/\s+/g, '').length, 0);
}

function baselineEntryFor(manifest = {}, slideNo = 1) {
  if (Array.isArray(manifest.slides)) {
    return manifest.slides.find(item => Number(item.slide || item.index) === slideNo) || null;
  }
  if (manifest.slides && typeof manifest.slides === 'object') return manifest.slides[String(slideNo)] || null;
  return null;
}

function resolveBaselineFile(manifestPath, entry = {}) {
  const ref = entry.file || entry.preview || entry.baselinePreview || '';
  if (!ref) return '';
  return path.isAbsolute(ref) ? ref : path.resolve(path.dirname(manifestPath), ref);
}

function baselineVisualAudit(manifestPath = '', previewReports = []) {
  const findings = [];
  if (!manifestPath) {
    return { version:'screenshot-baseline-audit/v1', status:'pass', manifest:'', findings, slides:[] };
  }
  if (!fs.existsSync(manifestPath)) {
    findings.push({ level:'fail', type:'baselineManifestMissing', message:`baseline manifest not found: ${manifestPath}` });
    return { version:'screenshot-baseline-audit/v1', status:'fail', manifest:manifestPath, findings, slides:[] };
  }
  let manifest = null;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    findings.push({ level:'fail', type:'baselineManifestUnreadable', message:String(e.message || e) });
    return { version:'screenshot-baseline-audit/v1', status:'fail', manifest:manifestPath, findings, slides:[] };
  }
  const defaults = Object.assign({
    maxHashDistance: 18,
    maxLumaDistance: 28,
    maxBboxDelta: 0.38,
    minRegionCoverageRatio: 0.45,
    minRegionCoverage: 0.012
  }, manifest.thresholds || {});
  const slides = [];
  previewReports.forEach(report => {
    const slideNo = Number(report.slide || 0);
    const entry = baselineEntryFor(manifest, slideNo);
    if (!entry) return;
    const current = report.info;
    let baseline = entry.metrics || entry.info || null;
    const baselineFile = resolveBaselineFile(manifestPath, entry);
    if (!baseline && baselineFile) baseline = pngAnalysis(baselineFile) || pngInfo(baselineFile);
    if (!current || !baseline) {
      findings.push({ slide:slideNo, level:'fail', type:'baselinePreviewUnreadable', message:'baseline or current preview PNG is unreadable' });
      return;
    }
    const thresholds = Object.assign({}, defaults, entry.thresholds || {});
    const hashDistance = hamming(current.hash, baseline.hash);
    const lumaDistance = Math.abs(Number(current.mean || 0) - Number(baseline.mean || 0));
    const visualBBoxDelta = bboxDelta(current.contentBBox, baseline.contentBBox);
    const slideResult = {
      slide: slideNo,
      hashDistance,
      lumaDistance: Number(lumaDistance.toFixed(2)),
      bboxDelta: visualBBoxDelta,
      regions: []
    };
    if (hashDistance != null && hashDistance > thresholds.maxHashDistance) {
      findings.push({ slide:slideNo, level:'fail', type:'baselineHashDistance', message:`hash distance ${hashDistance}/64 exceeds ${thresholds.maxHashDistance}` });
    }
    if (lumaDistance > thresholds.maxLumaDistance) {
      findings.push({ slide:slideNo, level:'fail', type:'baselineLumaDistance', message:`luminance delta ${lumaDistance.toFixed(2)} exceeds ${thresholds.maxLumaDistance}` });
    }
    if (visualBBoxDelta != null && visualBBoxDelta > thresholds.maxBboxDelta) {
      findings.push({ slide:slideNo, level:'fail', type:'baselineContentBBoxShift', message:`content bbox delta ${visualBBoxDelta} exceeds ${thresholds.maxBboxDelta}` });
    }
    const regionExpectations = entry.regions || manifest.regions || {};
    Object.entries(regionExpectations).forEach(([name, expectation]) => {
      const currentRegion = current.regions && current.regions[name];
      const baselineRegion = baseline.regions && baseline.regions[name];
      if (!currentRegion) return;
      const expectedCoverage = Number(
        (expectation && expectation.minCoverage) ||
        (baselineRegion && baselineRegion.coverage * thresholds.minRegionCoverageRatio) ||
        thresholds.minRegionCoverage
      );
      const actualCoverage = Number(currentRegion.coverage || 0);
      slideResult.regions.push({ name, actualCoverage, expectedCoverage:Number(expectedCoverage.toFixed(4)) });
      if (actualCoverage < expectedCoverage) {
        findings.push({
          slide:slideNo,
          level:'fail',
          type:'baselineRegionMissing',
          message:`region ${name} coverage ${actualCoverage} below expected ${expectedCoverage.toFixed(4)}`
        });
      }
    });
    slides.push(slideResult);
  });
  if (!previewReports.length) {
    findings.push({ level:'fail', type:'baselinePreviewMissing', message:'baseline comparison requires preview PNGs via --preview-dir' });
  }
  return {
    version:'screenshot-baseline-audit/v1',
    manifest:manifestPath,
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    findings,
    slides
  };
}

function failResult(error) {
  console.error(JSON.stringify({ success:false, error, file }, null, 2));
  process.exit(1);
}

function resolvePlanAssetPath(value, baseDir) {
  if (!value) return '';
  if (path.isAbsolute(value)) return value;
  const fromPlan = path.resolve(baseDir, value);
  if (fs.existsSync(fromPlan)) return fromPlan;
  return resolveAssetPath(value);
}

function readRenderMeta(pptxFile) {
  const candidates = [
    `${pptxFile}.render-meta.json`,
    path.join(path.dirname(pptxFile), `${path.basename(pptxFile, '.pptx')}.render-meta.json`)
  ];
  const file = candidates.find(p => fs.existsSync(p));
  if (!file) return { file:'', meta:null };
  try {
    return { file, meta:JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch (e) {
    return { file, meta:null, error:String(e.message || e) };
  }
}

if (!fs.existsSync(file)) failResult('file_not_found');
let entries = [];
try {
  run('unzip', ['-t', file]);
  entries = run('unzip', ['-Z1', file]).split(/\r?\n/).filter(Boolean);
} catch (_) {
  failResult('invalid_pptx_zip');
}

const qa = VISUAL_SYSTEM.visualQA || {};
const minFontSize = Number(qa.minFontSize || 6.2);
const preferredBodyMin = Number(qa.preferredBodyMin || 8.8);
const minReadableCjkWidth = Number(qa.minReadableCjkWidth || 1.15);
const maxReadableCharsPerInch = Number(qa.maxReadableCharsPerInch || 14);
const maxTinyRuns = Number(qa.maxTinyRunsPerSlide || 10);
const maxSmallChineseRuns = Number(qa.maxSmallChineseRunsPerSlide || 2);
const maxRuns = Number(qa.maxTextRunsPerSlide || 80);
const maxFontFamilies = Number(qa.maxFontFamiliesPerDeck || 5);
const maxFontSizesPerSlide = Number(qa.maxFontSizesPerSlide || 14);
const minRenderedCjkSize = Number(qa.minRenderedCjkSize || 7.2);
const banned = [
  'lorem', 'ipsum', 'xxxx', 'TODO',
  '示例', '测试稿', '验收稿', '占位', '待补充', '请批评指正',
  '材料显示', '企业 PDF', '企业PDF', 'PDF 简介口径', '正式交付前',
  '材料中提到', '材料中列出', '原材料未', '原材料没有',
  '图册页优先', '该页用于', '该页只展示', '模型抽取', '用户材料自动整理'
];

const slideEntries = entries.filter(x => /^ppt\/slides\/slide\d+\.xml$/.test(x))
  .sort((a,b)=>Number(a.match(/slide(\d+)/)[1])-Number(b.match(/slide(\d+)/)[1]));
const findings = [];
const slideReports = slideEntries.map((entry, idx) => {
  const xml = unzipText(entry);
  const texts = xmlTextValues(xml);
  const runs = xmlTextRuns(xml);
  const textShapes = xmlTextShapes(xml);
  const lineShapes = xmlLineShapes(xml);
  const rectShapes = xmlRectShapes(xml);
  const imageShapes = xmlImageShapes(xml);
  const allText = texts.join(' ');
  const sizes = [...xml.matchAll(/<a:rPr\b[^>]*\bsz="(\d+)"/g)].map(m => Number(m[1]) / 100);
  const fontFamilies = compactUnique(runs.flatMap(run => run.fonts || []));
  const uniqueSizes = compactUnique(sizes.map(size => Number(size.toFixed(2)))).sort((a,b) => b - a);
  const tiny = sizes.filter(v => v > 0 && v < minFontSize);
  const smallChinese = runs.filter(r => r.size != null && r.size < preferredBodyMin && hasCjk(r.text) && r.text.trim().length >= 2);
  const renderedTinyChinese = runs.filter(r => r.size != null && r.size < minRenderedCjkSize && hasCjk(r.text) && r.text.trim().length >= 2);
  const unreadableNarrow = textShapes.filter(shape => {
    if (!hasCjk(shape.text) || shape.w == null) return false;
    if (shape.y != null && shape.y >= 6.62) return false;
    const compact = shape.text.replace(/\s+/g, '');
    if (compact.length < 9) return false;
    const pressure = compact.length / Math.max(0.01, shape.w);
    const nearBodySize = shape.minSize == null || shape.minSize <= preferredBodyMin + 0.4;
    return (shape.w < minReadableCjkWidth && nearBodySize) || (shape.w < 1.35 && pressure > maxReadableCharsPerInch);
  });
  const images = (xml.match(/<a:blip\b/g) || []).length;
  const mainBodyRegion = { x:0.70, y:1.28, w:11.88, h:5.38 };
  const rightEvidenceRegion = { x:8.00, y:1.18, w:4.34, h:5.58 };
  const significantRects = rectShapes.filter(shape => {
    const area = shape.w * shape.h;
    return area >= 0.025 && area <= 24 && !(shape.w > 12.5 && shape.h > 6.8);
  });
  const contentShapes = [
    ...textShapes.filter(shape => shape.y == null || shape.y < 6.82),
    ...significantRects,
    ...imageShapes
  ];
  const mainBodyCoverage = regionCoverage(contentShapes, mainBodyRegion);
  const rightEvidenceCoverage = regionCoverage(contentShapes, rightEvidenceRegion);
  const mainBodyCharCount = textCharsInRegion(textShapes, mainBodyRegion);
  const mainBodyElements = contentShapes.filter(shape => intersectionArea(shape, mainBodyRegion) > 0).length;
  const badWords = banned.filter(w => allText.toLowerCase().includes(w.toLowerCase()));
  if (tiny.length > maxTinyRuns) findings.push({ slide:idx+1, level:'fail', type:'tinyText', message:`${tiny.length} text runs below ${minFontSize}pt` });
  if (renderedTinyChinese.length) {
    const sample = renderedTinyChinese.slice(0, 3).map(r => `"${r.text.slice(0, 16)}" ${r.size}pt`).join('; ');
    findings.push({ slide:idx+1, level:'fail', type:'renderedTinyChineseText', message:`${renderedTinyChinese.length} rendered Chinese text runs below ${minRenderedCjkSize}pt: ${sample}` });
  }
  if (smallChinese.length > maxSmallChineseRuns) findings.push({ slide:idx+1, level:'review', type:'smallChineseText', message:`${smallChinese.length} Chinese text runs below preferred ${preferredBodyMin}pt` });
  if (unreadableNarrow.length) {
    const sample = unreadableNarrow.slice(0, 3).map(s => `"${s.text.slice(0, 18)}" ${s.w.toFixed(2)}in`).join('; ');
    findings.push({ slide:idx+1, level:'fail', type:'unreadableNarrowText', message:`${unreadableNarrow.length} Chinese text boxes are too narrow for readable captions: ${sample}` });
  }
  const textCoveredByRects = textShapes.flatMap(shape => {
    if ([shape.x, shape.y, shape.w, shape.h].some(v => v == null)) return [];
    if (shape.y >= 6.62) return [];
    if (String(shape.text || '').trim().length < 2) return [];
    const area = rectArea(shape);
    if (area < 0.012) return [];
    return significantRects.filter(rect => {
      if (rect.order <= shape.order) return false;
      if (rect.hasText) return false;
      if (rect.fillOpacity < 0.2) return false;
      if (rect.w < 0.08 || rect.h < 0.08) return false;
      const overlap = intersectionArea(shape, rect);
      const overlapRatio = overlap / Math.max(0.01, area);
      return overlap >= 0.015 && overlapRatio >= 0.35;
    }).map(rect => ({ shape, rect, overlapRatio: intersectionArea(shape, rect) / Math.max(0.01, area) }));
  });
  if (textCoveredByRects.length) {
    const sample = textCoveredByRects.slice(0, 3).map(item =>
      `"${item.shape.text.slice(0, 18)}" ${Math.round(item.overlapRatio * 100)}%`
    ).join('; ');
    findings.push({
      slide:idx+1,
      level:'fail',
      type:'textCoveredByShape',
      message:`${textCoveredByRects.length} text box(es) appear covered by later filled rectangles: ${sample}`
    });
  }
  const lineTextOverlaps = lineShapes.flatMap(line => textShapes.filter(shape => lineIntersectsText(line, shape)).map(shape => ({ line, shape })));
  if (lineTextOverlaps.length) {
    const sample = lineTextOverlaps.slice(0, 3).map(item => `"${item.shape.text.slice(0, 18)}"`).join('; ');
    findings.push({ slide:idx+1, level:'review', type:'textLineCollision', message:`${lineTextOverlaps.length} rule/underline shapes intersect visible text: ${sample}` });
  }
  const arrowBlocked = lineShapes.filter(line => line.arrow && (line.w > 0.18 || line.h > 0.18)).filter(line => {
    const mid = lineMidpoint(line);
    return rectShapes.some(rect => {
      const area = rect.w * rect.h;
      if (area < 0.12 || area > 18) return false;
      if (rect.order <= line.order) return false;
      return rectContainsPoint(rect, mid.x, mid.y, 0.04);
    });
  });
  if (arrowBlocked.length) {
    findings.push({ slide:idx+1, level:'fail', type:'arrowCoveredByRectangle', message:`${arrowBlocked.length} arrow connector(s) appear covered by later rectangle shapes` });
  }
  const bottomFlowConflicts = lineShapes.filter(line => line.w > 0.72 && line.h < 0.06 && line.y >= 6.0)
    .flatMap(line => textShapes.filter(shape => {
      if (shape.x == null || shape.y == null || shape.w == null || shape.h == null || shape.y < 6.0) return false;
      const yInside = line.y > shape.y + 0.01 && line.y < shape.y + shape.h - 0.01;
      const xOverlap = Math.max(line.x, shape.x) < Math.min(line.x + line.w, shape.x + shape.w) - 0.04;
      return yInside && xOverlap;
    }).map(shape => ({ line, shape })));
  if (bottomFlowConflicts.length) {
    const sample = bottomFlowConflicts.slice(0, 3).map(item => `"${item.shape.text.slice(0, 18)}"`).join('; ');
    findings.push({ slide:idx+1, level:'fail', type:'bottomFlowFooterCollision', message:`${bottomFlowConflicts.length} bottom flow/rule shapes collide with footer or caption text: ${sample}` });
  }
  if (texts.length > maxRuns) findings.push({ slide:idx+1, level:'review', type:'textDensity', message:`${texts.length} text runs; likely too dense` });
  if (uniqueSizes.length > maxFontSizesPerSlide) findings.push({ slide:idx+1, level:'review', type:'typographyScaleTooFragmented', message:`${uniqueSizes.length} font sizes on one slide; expected <= ${maxFontSizesPerSlide}` });
  if (badWords.length) findings.push({ slide:idx+1, level:'fail', type:'placeholderText', message:`placeholder words: ${badWords.join(', ')}` });
  return {
    slide: idx + 1,
    textRuns: texts.length,
    charCount: allText.length,
    fontMin: sizes.length ? Math.min(...sizes) : null,
    fontFamilies,
    fontSizes: uniqueSizes,
    tinyRuns: tiny.length,
    smallChineseRuns: smallChinese.length,
    lineShapes: lineShapes.length,
    rectShapes: rectShapes.length,
    images,
    imageShapes: imageShapes.length,
    mainBodyCoverage,
    rightEvidenceCoverage,
    mainBodyCharCount,
    mainBodyElements,
    sample: texts.slice(0, 8)
  };
});
const deckFontFamilies = compactUnique(slideReports.flatMap(slide => slide.fontFamilies || []));
if (deckFontFamilies.length > maxFontFamilies) {
  findings.push({ level:'review', type:'typographyFontFamilyDrift', message:`deck uses ${deckFontFamilies.length} font families: ${deckFontFamilies.join(', ')}` });
}

let previewReports = [];
if (previewDir) {
  const previews = fs.existsSync(previewDir)
    ? fs.readdirSync(previewDir).filter(x => /\.png$/i.test(x)).sort().map(x => path.join(previewDir, x))
    : [];
  if (previews.length && previews.length !== slideEntries.length) {
    findings.push({ level:'review', type:'previewCount', message:`preview count ${previews.length} differs from slide count ${slideEntries.length}` });
  }
  if (!previews.length && qa.requirePreviewForFinal) {
    findings.push({ level:'review', type:'previewMissing', message:'preview PNGs missing; final visual review is incomplete' });
  }
  previewReports = previews.map((p, i) => {
    const info = pngAnalysis(p) || pngInfo(p);
    if (!info) findings.push({ slide:i+1, level:'review', type:'previewUnreadable', message:path.basename(p) });
    else if (info.bytes < 12000) findings.push({ slide:i+1, level:'review', type:'possiblyBlankPreview', message:`small preview file ${info.bytes} bytes` });
    else if (info.stddev != null && info.stddev < 3.2) findings.push({ slide:i+1, level:'review', type:'lowVisualVariance', message:`preview may be blank or overly plain; stddev ${info.stddev}` });
    return { slide:i+1, file:p, info };
  });
  for (let i=1; i<previewReports.length; i++) {
    const prev = previewReports[i-1].info;
    const cur = previewReports[i].info;
    const dist = prev && cur ? hamming(prev.hash, cur.hash) : null;
    if (dist != null && dist <= 6) {
      findings.push({ slide:i+1, level:'review', type:'slideSimilarity', message:`slide ${i} and ${i+1} look too similar by preview hash (${dist}/64)` });
    }
  }
}
const baselineQA = baselineVisualAudit(baselinePath, previewReports);
baselineQA.findings.forEach(f => findings.push(f));

let planAssetChecks = [];
let planAesthetic = null;
let planIndustryKnowledge = null;
let planComposition = null;
let planAcceptance = null;
let planReportDepth = null;
let planEvidence = null;
let planPageCount = null;
let planComponentPlan = null;
let planIndustryFit = null;
let planComponentConsumption = null;
let planSourceTrace = null;
let planCommercialReadiness = null;
let planTypography = null;
let planChartSemantic = null;
let planChartVisual = null;
let planChartEvidence = null;
let planChartScores = null;
let planChartAcceptanceGate = null;
let secondaryAestheticReview = null;
const renderMetaResult = readRenderMeta(file);
const renderMetaSchemaQA = renderMetaSchemaAuditFromRender(renderMetaResult, slideEntries.length);
const contentCoverageQA = contentCoverageAuditFromRender(renderMetaResult, slideReports);
const overlayContractQA = overlayContractAuditFromRender(renderMetaResult);
renderMetaSchemaQA.findings.forEach(f => findings.push(f));
contentCoverageQA.findings.forEach(f => findings.push(f));
overlayContractQA.findings.forEach(f => findings.push(f));
if (planPath) {
  if (!fs.existsSync(planPath)) {
    findings.push({ level:'fail', type:'planMissing', message:`plan not found: ${planPath}` });
  } else {
    try {
      const rawPlan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
      const normalized = normalizeDeckPlan(rawPlan);
      planAesthetic = visualAestheticModel(rawPlan, normalized);
      planIndustryKnowledge = industryKnowledgeAudit(rawPlan, normalized);
      planComposition = { findings: compositionAudit(rawPlan, normalized) };
      planReportDepth = reportDepthAudit(rawPlan, normalized);
      planEvidence = evidenceAudit(rawPlan, normalized);
      planPageCount = pageCountAudit(rawPlan, normalized);
      planComponentPlan = componentPlanAudit(rawPlan, normalized);
      planIndustryFit = industryFitAudit(rawPlan, normalized);
      planComponentConsumption = componentConsumptionAuditFromRender(normalized, renderMetaResult);
      planSourceTrace = sourceTraceAudit(rawPlan, normalized);
      planTypography = typographyAudit(rawPlan, normalized, renderMetaResult.meta);
      planChartSemantic = chartSemanticQA(rawPlan, normalized);
      planChartVisual = chartVisualQA(rawPlan, normalized, renderMetaResult.meta);
      planChartEvidence = chartEvidenceQA(rawPlan, normalized);
      planChartScores = pageLevelChartScores(rawPlan, normalized, renderMetaResult.meta);
      planChartAcceptanceGate = chartAcceptanceGate(rawPlan, normalized, renderMetaResult.meta, {
        previewReports,
        requireContactSheet: Boolean(previewDir)
      });
      secondaryAestheticReview = secondaryVisualReview(normalized, planAesthetic, previewReports);
      const acceptanceOptions = {
        renderMeta: renderMetaResult.meta,
        previewReports,
        requireContactSheet: Boolean(previewDir)
      };
      planCommercialReadiness = commercialReadinessAudit(rawPlan, normalized, [
        ...findings,
        ...((planChartSemantic && planChartSemantic.findings) || []),
        ...((planChartVisual && planChartVisual.findings) || []),
        ...((planChartEvidence && planChartEvidence.findings) || []),
        ...((planChartAcceptanceGate && planChartAcceptanceGate.findings) || []),
        ...((secondaryAestheticReview && secondaryAestheticReview.findings) || [])
      ], acceptanceOptions);
      planAcceptance = acceptanceAudit(rawPlan, normalized, acceptanceOptions);
      auditDeckPlan(rawPlan, normalized).forEach(f => findings.push(f));
      [
        planReportDepth,
        planEvidence,
        planPageCount,
        planComponentPlan,
        planIndustryFit,
        planComponentConsumption,
        planSourceTrace,
        planTypography,
        planChartSemantic,
        planChartVisual,
        planChartEvidence,
        planChartAcceptanceGate
      ].forEach(audit => (audit.findings || []).forEach(f => findings.push(f)));
      if (secondaryAestheticReview) secondaryAestheticReview.findings.forEach(f => findings.push(f));
      const baseDir = path.dirname(planPath);
      const industry = String(rawPlan.industry || normalized.industry || '').toLowerCase();
      planAssetChecks = (normalized.slides || []).map((slide, i) => {
        const imageValue = (slide.visual && slide.visual.image) || slide.image || '';
        const resolvedImage = resolvePlanAssetPath(imageValue, baseDir);
        const gallery = [
          ...(Array.isArray(slide.images) ? slide.images : []),
          ...((slide.visual && Array.isArray(slide.visual.images)) ? slide.visual.images : [])
        ].map(x => resolvePlanAssetPath(x, baseDir));
        const hasBoundAsset = (resolvedImage && fs.existsSync(resolvedImage)) || gallery.some(x => fs.existsSync(x));
        const assetRefs = [imageValue, ...(Array.isArray(slide.images) ? slide.images : []), ...((slide.visual && Array.isArray(slide.visual.images)) ? slide.visual.images : [])]
          .map(String)
          .filter(Boolean);
        assetRefs.forEach(ref => {
          const resolved = resolvePlanAssetPath(ref, baseDir);
          const quality = scoreImageAsset(resolved, 'evidence');
          if (quality.exists && quality.verdict === 'reject' && !rawPlan.allowDirtyAssets && !slide.allowDirtyAssets) {
            findings.push({
              slide:i+1,
              level:'review',
              type:'weakImageAsset',
              message:`image asset needs review: ${path.basename(resolved)} (${quality.issues.join('; ')})`
            });
          }
        });
        if (industry && !industry.includes('manufacturing') && assetRefs.some(ref => /manufacturing|factory|industrial-line/i.test(ref))) {
          findings.push({
            slide:i+1,
            level:'fail',
            type:'crossIndustryAsset',
            message:'slide references manufacturing/factory media in a non-manufacturing deck plan'
          });
        }
        const prompt = slide.generatedAssetPrompt || '';
        if (prompt && !hasBoundAsset) {
          findings.push({
            slide:i+1,
            level:'fail',
            type:'unboundGeneratedAsset',
            message:'generatedAssetPrompt exists but no generated/real image asset is bound into the deck plan'
          });
        }
        return {
          slide:i+1,
          generatedAssetPrompt: Boolean(prompt),
          boundAsset: Boolean(hasBoundAsset),
          image: imageValue || null
        };
      });
    } catch (e) {
      findings.push({ level:'fail', type:'planUnreadable', message:String(e.message || e) });
    }
  }
}

const severity = applyQualitySeverityPolicy(findings, qualityMode);
const effectiveFindings = severity.findings;
const failCount = effectiveFindings.filter(f => f.level === 'fail').length;
const reviewCount = effectiveFindings.filter(f => f.level !== 'fail').length;
const result = {
  success: failCount === 0,
  file,
  slide_count: slideEntries.length,
  fail_count: failCount,
  review_count: reviewCount,
  quality_mode: qualityMode,
  severity_policy: severity.policy,
  findings: effectiveFindings,
  slides: slideReports,
  previews: previewReports,
  screenshot_baseline_qa: baselineQA,
  plan_asset_checks: planAssetChecks,
  render_meta: renderMetaResult.file || null,
  render_meta_schema_qa: renderMetaSchemaQA,
  content_coverage_qa: contentCoverageQA,
  aesthetic_model: planAesthetic,
  industry_knowledge: planIndustryKnowledge,
  composition_model: planComposition,
  report_depth_qa: planReportDepth,
  evidence_qa: planEvidence,
  source_trace_qa: planSourceTrace,
  page_count_qa: planPageCount,
  component_plan_qa: planComponentPlan,
  component_consumption_qa: planComponentConsumption,
  overlay_contract_qa: overlayContractQA,
  industry_fit_qa: planIndustryFit,
  typography_qa: planTypography,
  chart_semantic_qa: planChartSemantic,
  chart_visual_qa: planChartVisual,
  chart_evidence_qa: planChartEvidence,
  page_chart_scores: planChartScores,
  chart_acceptance_gate: planChartAcceptanceGate,
  secondary_visual_review: secondaryAestheticReview,
  commercial_readiness_qa: planCommercialReadiness,
  acceptance_qa: planAcceptance
};

const output = JSON.stringify(result, null, 2);
if (jsonOnly || !result.success) console.log(output);
else console.log(output);
if (!result.success) process.exit(1);

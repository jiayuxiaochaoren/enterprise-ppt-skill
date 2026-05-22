#!/usr/bin/env node
/* Structural visual QA for generated PPTX files.
   This complements Keynote preview review by catching tiny text, text-heavy slides,
   missing previews, placeholder copy, and weak image-role fit signals. */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const zlib = require('zlib');

const {
  VISUAL_SYSTEM,
  auditDeckPlan,
  industryKnowledgeAudit,
  normalizeDeckPlan,
  resolveAssetPath,
  scoreImageAsset,
  visualAestheticModel
} = require('./design-system');

function usage() {
  console.error('Usage: node scripts/visual_qa.js <file.pptx> [--preview-dir dir] [--plan deck-plan.json] [--json]');
  process.exit(2);
}

const args = process.argv.slice(2);
if (!args[0]) usage();
const file = path.resolve(args[0]);
let previewDir = '';
let planPath = '';
let jsonOnly = false;
for (let i=1; i<args.length; i++) {
  if (args[i] === '--preview-dir') previewDir = path.resolve(String(args[++i] || ''));
  else if (args[i] === '--plan') planPath = path.resolve(String(args[++i] || ''));
  else if (args[i] === '--json') jsonOnly = true;
  else usage();
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
    const text = xmlTextValues(run).join('');
    return { text, size: size ? Number(size) / 100 : null };
  }).filter(r => r.text);
}
function hasCjk(text) {
  return /[\u3400-\u9fff]/.test(String(text || ''));
}

function pngInfo(p) {
  try {
    const b = fs.readFileSync(p);
    if (b.length >= 24 && b.toString('ascii', 1, 4) === 'PNG') {
      return { w:b.readUInt32BE(16), h:b.readUInt32BE(20), bytes:b.length };
    }
  } catch (_) {}
  return null;
}

function paeth(a, b, c) {
  const pr = a + b - c;
  const pa = Math.abs(pr - a);
  const pb = Math.abs(pr - b);
  const pc = Math.abs(pr - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function pngAnalysis(p) {
  try {
    const b = fs.readFileSync(p);
    if (b.length < 32 || b.toString('ascii', 1, 4) !== 'PNG') return null;
    let off = 8;
    let width = 0, height = 0, bitDepth = 0, colorType = 0;
    const idat = [];
    while (off < b.length) {
      const len = b.readUInt32BE(off); off += 4;
      const type = b.toString('ascii', off, off + 4); off += 4;
      const data = b.subarray(off, off + len); off += len + 4;
      if (type === 'IHDR') {
        width = data.readUInt32BE(0);
        height = data.readUInt32BE(4);
        bitDepth = data[8];
        colorType = data[9];
      } else if (type === 'IDAT') {
        idat.push(data);
      } else if (type === 'IEND') break;
    }
    if (!width || !height || bitDepth !== 8 || ![0,2,6].includes(colorType)) return null;
    const channels = colorType === 6 ? 4 : (colorType === 2 ? 3 : 1);
    const stride = width * channels;
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const pixels = Buffer.alloc(width * height * channels);
    let src = 0;
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
    const grid = 8;
    const vals = [];
    let sum = 0, sumSq = 0, count = 0;
    for (let gy = 0; gy < grid; gy++) {
      for (let gx = 0; gx < grid; gx++) {
        let block = 0, blockCount = 0;
        const y0 = Math.floor(gy * height / grid);
        const y1 = Math.max(y0 + 1, Math.floor((gy + 1) * height / grid));
        const x0 = Math.floor(gx * width / grid);
        const x1 = Math.max(x0 + 1, Math.floor((gx + 1) * width / grid));
        for (let y = y0; y < y1; y += Math.max(1, Math.floor((y1 - y0) / 12))) {
          for (let x = x0; x < x1; x += Math.max(1, Math.floor((x1 - x0) / 12))) {
            const i = y * stride + x * channels;
            const lum = channels === 1 ? pixels[i] : (0.2126 * pixels[i] + 0.7152 * pixels[i+1] + 0.0722 * pixels[i+2]);
            block += lum;
            blockCount += 1;
            sum += lum;
            sumSq += lum * lum;
            count += 1;
          }
        }
        vals.push(block / Math.max(1, blockCount));
      }
    }
    const avg = vals.reduce((a,v)=>a+v,0) / vals.length;
    const hash = vals.map(v => v >= avg ? '1' : '0').join('');
    const mean = sum / Math.max(1, count);
    const variance = sumSq / Math.max(1, count) - mean * mean;
    return {
      w: width,
      h: height,
      bytes: b.length,
      mean: Number(mean.toFixed(2)),
      stddev: Number(Math.sqrt(Math.max(0, variance)).toFixed(2)),
      hash
    };
  } catch (_) {
    return null;
  }
}

function hamming(a, b) {
  if (!a || !b || a.length !== b.length) return null;
  let n = 0;
  for (let i=0; i<a.length; i++) if (a[i] !== b[i]) n++;
  return n;
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
const maxTinyRuns = Number(qa.maxTinyRunsPerSlide || 10);
const maxSmallChineseRuns = Number(qa.maxSmallChineseRunsPerSlide || 2);
const maxRuns = Number(qa.maxTextRunsPerSlide || 80);
const banned = ['lorem', 'ipsum', 'xxxx', 'TODO', '示例', '测试稿', '验收稿', '占位', '待补充', '请批评指正'];

const slideEntries = entries.filter(x => /^ppt\/slides\/slide\d+\.xml$/.test(x))
  .sort((a,b)=>Number(a.match(/slide(\d+)/)[1])-Number(b.match(/slide(\d+)/)[1]));
const findings = [];
const slideReports = slideEntries.map((entry, idx) => {
  const xml = unzipText(entry);
  const texts = xmlTextValues(xml);
  const runs = xmlTextRuns(xml);
  const allText = texts.join(' ');
  const sizes = [...xml.matchAll(/<a:rPr\b[^>]*\bsz="(\d+)"/g)].map(m => Number(m[1]) / 100);
  const tiny = sizes.filter(v => v > 0 && v < minFontSize);
  const smallChinese = runs.filter(r => r.size != null && r.size < preferredBodyMin && hasCjk(r.text) && r.text.trim().length >= 2);
  const images = (xml.match(/<a:blip\b/g) || []).length;
  const badWords = banned.filter(w => allText.toLowerCase().includes(w.toLowerCase()));
  if (tiny.length > maxTinyRuns) findings.push({ slide:idx+1, level:'fail', type:'tinyText', message:`${tiny.length} text runs below ${minFontSize}pt` });
  if (smallChinese.length > maxSmallChineseRuns) findings.push({ slide:idx+1, level:'review', type:'smallChineseText', message:`${smallChinese.length} Chinese text runs below preferred ${preferredBodyMin}pt` });
  if (texts.length > maxRuns) findings.push({ slide:idx+1, level:'review', type:'textDensity', message:`${texts.length} text runs; likely too dense` });
  if (badWords.length) findings.push({ slide:idx+1, level:'fail', type:'placeholderText', message:`placeholder words: ${badWords.join(', ')}` });
  return {
    slide: idx + 1,
    textRuns: texts.length,
    charCount: allText.length,
    fontMin: sizes.length ? Math.min(...sizes) : null,
    tinyRuns: tiny.length,
    smallChineseRuns: smallChinese.length,
    images,
    sample: texts.slice(0, 8)
  };
});

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

let planAssetChecks = [];
let planAesthetic = null;
let planIndustryKnowledge = null;
if (planPath) {
  if (!fs.existsSync(planPath)) {
    findings.push({ level:'fail', type:'planMissing', message:`plan not found: ${planPath}` });
  } else {
    try {
      const rawPlan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
      const normalized = normalizeDeckPlan(rawPlan);
      planAesthetic = visualAestheticModel(rawPlan, normalized);
      planIndustryKnowledge = industryKnowledgeAudit(rawPlan, normalized);
      auditDeckPlan(rawPlan, normalized).forEach(f => findings.push(f));
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

const failCount = findings.filter(f => f.level === 'fail').length;
const reviewCount = findings.filter(f => f.level !== 'fail').length;
const result = {
  success: failCount === 0,
  file,
  slide_count: slideEntries.length,
  fail_count: failCount,
  review_count: reviewCount,
  findings,
  slides: slideReports,
  previews: previewReports,
  plan_asset_checks: planAssetChecks,
  aesthetic_model: planAesthetic,
  industry_knowledge: planIndustryKnowledge
};

const output = JSON.stringify(result, null, 2);
if (jsonOnly || !result.success) console.log(output);
else console.log(output);
if (!result.success) process.exit(1);

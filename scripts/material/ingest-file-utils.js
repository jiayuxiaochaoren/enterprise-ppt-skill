const fs = require('fs');
const path = require('path');

const {
  INDUSTRY_PACK_LIBRARY,
  imageQualityProfile,
  visualIndustryId
} = require('../design-system');
const {
  INDUSTRY_HINTS,
  compactUnique,
  usageError
} = require('./common');

const TEXT_EXTS = new Set(['.txt', '.md', '.markdown', '.csv', '.tsv', '.json', '.yaml', '.yml']);
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg']);
const OFFICE_EXTS = new Set(['.pptx', '.docx', '.xlsx']);

function collectFiles(inputs = []) {
  const files = [];
  inputs.forEach(input => {
    const p = path.resolve(input);
    if (!fs.existsSync(p)) usageError(`input not found: ${input}`);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      fs.readdirSync(p).sort().forEach(name => {
        if (name.startsWith('.')) return;
        files.push(...collectFiles([path.join(p, name)]));
      });
    } else if (stat.isFile()) {
      files.push(p);
    }
  });
  return files;
}

function fileKind(file) {
  const ext = path.extname(file).toLowerCase();
  if (IMAGE_EXTS.has(ext)) return 'image';
  if (TEXT_EXTS.has(ext)) return 'text';
  if (OFFICE_EXTS.has(ext)) return 'office';
  if (ext === '.pdf') return 'pdf';
  return 'unsupported';
}

function splitChunks(text = '', maxChars = 1200) {
  const clean = String(text || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
  if (!clean) return [];
  const paras = clean.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
  const chunks = [];
  let buf = '';
  paras.forEach(p => {
    if ((buf + '\n\n' + p).length > maxChars && buf) {
      chunks.push(buf);
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  });
  if (buf) chunks.push(buf);
  return chunks.map((chunk, i) => ({ id: `chunk-${String(i + 1).padStart(3, '0')}`, text: chunk }));
}

function classifyImageRole(file, profile = imageQualityProfile(file)) {
  const name = path.basename(file).toLowerCase();
  if (/before|after|对比|改造|升级/.test(name)) return 'comparison';
  if (/screen|截图|ui|dashboard|界面|prototype/.test(name) || profile.category === 'screenshot') return 'evidence';
  if (/product|产品|设备|hero|detail|单品/.test(name)) return 'showcase';
  if (profile.category === 'vertical') return 'evidence';
  return 'gallery';
}

function detectIndustry(text = '') {
  const packHints = (INDUSTRY_PACK_LIBRARY.packs || []).reduce((acc, pack) => {
    acc[pack.id] = compactUnique([
      pack.labelZh,
      pack.labelEn,
      ...(pack.aliases || []),
      ...(pack.proofObjects || []),
      ...(pack.pageFamilies || [])
    ]);
    return acc;
  }, {});
  const hints = Object.assign({}, packHints, INDUSTRY_HINTS);
  const scores = Object.entries(hints).map(([industry, words]) => {
    const lower = String(text || '').toLowerCase();
    const hits = words.filter(w => lower.includes(String(w).toLowerCase()));
    return { industry, score: hits.length, hits };
  }).filter(x => x.score > 0);
  const merged = new Map();
  scores.forEach(item => {
    const canonicalIndustry = visualIndustryId(item.industry) || item.industry;
    const existing = merged.get(canonicalIndustry) || {
      industry: canonicalIndustry,
      score: 0,
      hits: [],
      rawIndustries: []
    };
    existing.score += Number(item.score || 0);
    existing.hits = compactUnique([...(existing.hits || []), ...(item.hits || [])]);
    existing.rawIndustries = compactUnique([...(existing.rawIndustries || []), item.industry]);
    merged.set(canonicalIndustry, existing);
  });
  return Array.from(merged.values()).sort((a, b) => b.score - a.score);
}

module.exports = {
  classifyImageRole,
  collectFiles,
  detectIndustry,
  fileKind,
  splitChunks
};

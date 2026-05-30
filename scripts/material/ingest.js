const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const {
  INDUSTRY_PACK_LIBRARY,
  imageDimensions,
  imageQualityProfile
} = require('../design-system');
const { detectStructuredTables } = require('./tables');
const {
  normalizeOcrResults,
  ocrConfidence,
  ocrMatchFor,
  ocrPages,
  ocrText,
  runImageOcrCommand
} = require('./ocr');
const {
  INDUSTRY_HINTS,
  compactUnique,
  conciseLines,
  extractNumbers,
  sanitizeMaterialText,
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

function decodeXmlEntities(s = '') {
  return String(s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function xmlTextValues(xml = '') {
  return [...String(xml).matchAll(/<[^:>]*:?t\b[^>]*>([\s\S]*?)<\/[^:>]*:?t>/g)]
    .map(m => decodeXmlEntities(m[1].replace(/<[^>]+>/g, '')))
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function unzipList(file) {
  try {
    return cp.execFileSync('unzip', ['-Z1', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch (_) {
    return [];
  }
}

function unzipEntry(file, entry) {
  try {
    return cp.execFileSync('unzip', ['-p', file, entry], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1024 * 1024 * 16 });
  } catch (_) {
    return '';
  }
}

function extractOfficeText(file) {
  const ext = path.extname(file).toLowerCase();
  const entries = unzipList(file);
  if (!entries.length) return {
    text: '',
    method: 'office-unzip-missing',
    diagnostics: {
      format: ext.slice(1),
      selectedEntryCount: 0,
      textEntryCount: 0,
      tableLikeEntryCount: 0,
      imageEntryCount: 0,
      possibleOcrMissing: false
    }
  };
  let selected = [];
  if (ext === '.pptx') selected = entries.filter(e => /^ppt\/slides\/slide\d+\.xml$/.test(e)).sort((a, b) => Number(a.match(/slide(\d+)/)[1]) - Number(b.match(/slide(\d+)/)[1]));
  else if (ext === '.docx') selected = entries.filter(e => e === 'word/document.xml' || /^word\/header\d+\.xml$/.test(e) || /^word\/footer\d+\.xml$/.test(e));
  else if (ext === '.xlsx') selected = entries.filter(e => e === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(e));
  const parts = selected.map(entry => xmlTextValues(unzipEntry(file, entry)).join('\n')).filter(Boolean);
  const imageEntryCount = entries.filter(e => /\/media\/.+\.(png|jpe?g|gif|webp)$/i.test(e)).length;
  const tableLikeEntryCount = entries.filter(e => /(?:tables?|worksheets?)\//i.test(e) || /sheet\d+\.xml$/i.test(e)).length;
  return {
    text: parts.join('\n\n'),
    method: `office-${ext.slice(1)}`,
    diagnostics: {
      format: ext.slice(1),
      selectedEntryCount: selected.length,
      textEntryCount: parts.length,
      tableLikeEntryCount,
      imageEntryCount,
      possibleOcrMissing: false
    }
  };
}

function extractPdfText(file) {
  try {
    const text = cp.execFileSync('pdftotext', [file, '-'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1024 * 1024 * 16 });
    return {
      text,
      method: 'pdftotext',
      diagnostics: {
        format: 'pdf',
        textCharCount: text.length,
        possibleOcrMissing: text.trim().length < 32,
        ocrStatus: text.trim().length < 32 ? 'recommended' : 'not_needed'
      }
    };
  } catch (_) {
    const pythonCandidates = [
      process.env.PYTHON,
      process.env.PYTHON3,
      path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3'),
      'python3',
      'python'
    ].filter(Boolean);
    const code = [
      'import sys',
      'from pypdf import PdfReader',
      'reader = PdfReader(sys.argv[1])',
      'parts = []',
      'for i, page in enumerate(reader.pages):',
      '    text = page.extract_text() or ""',
      '    if text.strip():',
      '        parts.append(f"--- PDF Page {i + 1} ---\\n{text}")',
      'sys.stdout.write("\\n\\n".join(parts))'
    ].join('\n');
    for (const python of pythonCandidates) {
      try {
        const text = cp.execFileSync(python, ['-c', code, file], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
          maxBuffer: 1024 * 1024 * 64
        });
        if (String(text || '').trim()) return {
          text,
          method: 'pypdf',
          diagnostics: {
            format: 'pdf',
            textCharCount: text.length,
            possibleOcrMissing: text.trim().length < 32,
            ocrStatus: text.trim().length < 32 ? 'recommended' : 'not_needed'
          }
        };
      } catch (_) {
        // Try the next Python candidate.
      }
    }
    return {
      text: '',
      method: 'pdf-unsupported',
      diagnostics: {
        format: 'pdf',
        textCharCount: 0,
        possibleOcrMissing: true,
        ocrStatus: 'recommended'
      }
    };
  }
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
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  return scores;
}

function ingestMaterials(inputs = [], options = {}) {
  if (!inputs.length) usageError('no input materials provided');
  const root = options.root ? path.resolve(options.root) : process.cwd();
  const maxCharsPerSource = Number(options.maxCharsPerSource || 9000);
  const ocrMap = normalizeOcrResults(options.ocrResults || {});
  const files = collectFiles(inputs);
  const sources = [];
  const images = [];
  let sourceSeq = 1;

  files.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    const kind = fileKind(file);
    const rel = path.relative(root, file);
    const id = `src-${String(sourceSeq++).padStart(3, '0')}`;
    if (kind === 'image') {
      const profile = imageQualityProfile(file);
      const dims = imageDimensions(file);
      const provisional = { id, path:file, relativePath:rel, name:path.basename(file) };
      const ocr = ocrMatchFor(ocrMap, provisional) || runImageOcrCommand(options.ocrCommand, file);
      const providedOcrText = ocrText(ocr);
      const providedOcrConfidence = ocrConfidence(ocr);
      const providedOcrPages = ocrPages(ocr);
      const image = {
        id,
        kind: 'image',
        path: file,
        relativePath: rel,
        name: path.basename(file),
        extension: ext,
        dimensions: dims,
        qualityProfile: profile,
        suggestedRole: classifyImageRole(file, profile),
        text: providedOcrText,
        candidateFacts: conciseLines(providedOcrText, 8),
        numbers: extractNumbers(providedOcrText),
        ocr: {
          status: providedOcrText ? 'provided' : 'not_configured',
          text: providedOcrText,
          confidence: providedOcrConfidence,
          pages: providedOcrPages,
          provider: ocr && (ocr.provider || ocr.engine || ocr.source) || '',
          page: ocr && (ocr.page || ocr.pageNumber) || null,
          auditStatus: providedOcrText && providedOcrConfidence != null && providedOcrConfidence < 0.8 ? 'needs_confirmation' : (providedOcrText ? 'review_recommended' : 'not_configured'),
          note: providedOcrText
            ? 'OCR text was supplied externally; verify confidence before using it as client-facing fact.'
            : 'OCR is pluggable but not enabled by default; treat image text as unverified unless supplied elsewhere.'
        },
        extractionDiagnostics: {
          format: ext.replace(/^\./, ''),
          contentClass: 'image',
          textCharCount: providedOcrText.length,
          possibleOcrMissing: !providedOcrText,
          ocrStatus: providedOcrText ? 'provided' : 'recommended',
          factSourceTypes: providedOcrText ? ['ocr_text', 'image_context'] : ['image_context'],
          roleBasis: ['filename', 'dimensions', ...(providedOcrText ? ['ocr-text'] : [])]
        }
      };
      images.push(image);
      sources.push(image);
      return;
    }

    let extracted = { text: '', method: kind };
    if (kind === 'text') extracted = { text: fs.readFileSync(file, 'utf8'), method: 'plain-text' };
    else if (kind === 'office') extracted = extractOfficeText(file);
    else if (kind === 'pdf') extracted = extractPdfText(file);

    const provisional = { id, path:file, relativePath:rel, name:path.basename(file) };
    const ocr = ocrMatchFor(ocrMap, provisional);
    const providedOcrText = ocrText(ocr);
    const providedOcrConfidence = ocrConfidence(ocr);
    const providedOcrPages = ocrPages(ocr);
    const combinedText = providedOcrText
      ? [extracted.text || '', `--- OCR Text (${ocr.provider || ocr.engine || 'external'}) ---`, providedOcrText].filter(Boolean).join('\n\n')
      : (extracted.text || '');
    const sanitized = sanitizeMaterialText(combinedText);
    const text = sanitized.cleanText.slice(0, maxCharsPerSource);
    const chunks = splitChunks(text);
    const numbers = extractNumbers(text);
    const sourceStub = { id, name:path.basename(file) };
    const tables = [
      ...detectStructuredTables(text, sourceStub),
      ...((extracted.diagnostics && Array.isArray(extracted.diagnostics.tables)) ? extracted.diagnostics.tables : [])
    ];
    sources.push({
      id,
      kind,
      path: file,
      relativePath: rel,
      name: path.basename(file),
      extension: ext,
      extractionMethod: extracted.method,
      rawCharCount: sanitized.rawText.length,
      charCount: text.length,
      extractionDiagnostics: Object.assign({
        format: ext.replace(/^\./, '') || kind,
        contentClass: kind,
        method: extracted.method,
        rawCharCount: sanitized.rawText.length,
        textCharCount: text.length,
        chunkCount: chunks.length,
        numberCount: numbers.length,
        possibleOcrMissing: kind === 'pdf' && text.trim().length < 32 && !providedOcrText,
        ocrStatus: providedOcrText ? 'provided' : ((kind === 'pdf' && text.trim().length < 32) ? 'recommended' : 'not_needed'),
        ocrProvider: ocr && (ocr.provider || ocr.engine || ocr.source) || '',
        factSourceTypes: compactUnique(['source_text', ...(providedOcrText ? ['ocr_text'] : [])])
      }, extracted.diagnostics || {}, providedOcrText ? {
        possibleOcrMissing: false,
        ocrStatus: 'provided',
        ocrProvider: ocr && (ocr.provider || ocr.engine || ocr.source) || ''
      } : {}),
      ocr: providedOcrText ? {
        status: 'provided',
        confidence: providedOcrConfidence,
        pages: providedOcrPages,
        provider: ocr && (ocr.provider || ocr.engine || ocr.source) || '',
        page: ocr && (ocr.page || ocr.pageNumber) || null,
        auditStatus: providedOcrConfidence != null && providedOcrConfidence < 0.8 ? 'needs_confirmation' : 'review_recommended'
      } : undefined,
      tables,
      materialHygiene: sanitized.hygiene,
      text,
      chunks,
      candidateFacts: conciseLines(text),
      numbers
    });
  });

  const sourceIndex = new Map(sources.map((source, index) => [source.id, index]));
  const textSources = sources.filter(source => source.kind !== 'image' && String(source.text || '').trim());
  images.forEach(image => {
    const imageIdx = sourceIndex.get(image.id) || 0;
    const nearest = textSources
      .map(source => ({
        source,
        distance: Math.abs((sourceIndex.get(source.id) || 0) - imageIdx)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2)
      .map(item => ({
        sourceId: item.source.id,
        sourceName: item.source.name,
        candidateFacts: (item.source.candidateFacts || []).slice(0, 3)
      }));
    image.neighboringText = nearest;
    image.extractionDiagnostics.roleBasis = compactUnique([
      ...(image.extractionDiagnostics.roleBasis || []),
      ...(nearest.length ? ['neighboring-text'] : [])
    ]);
  });

  const allText = sources.map(s => s.text || '').join('\n\n');
  const industryCandidates = detectIndustry(allText);
  const textSourceCount = sources.filter(s => s.kind !== 'image').length;
  const possibleOcrMissing = sources
    .filter(s => s.extractionDiagnostics && s.extractionDiagnostics.possibleOcrMissing)
    .map(s => ({ sourceId: s.id, name: s.name, kind: s.kind, reason: 'little or no extractable text' }));
  const reliableFacts = sources
    .filter(s => s.kind !== 'image' && s.extractionDiagnostics && !s.extractionDiagnostics.possibleOcrMissing)
    .flatMap(s => (s.candidateFacts || []).slice(0, 3).map(text => ({ text, sourceId:s.id, evidenceStrength:'strong' })))
    .slice(0, 12);
  const weakEvidenceFacts = sources
    .filter(s => s.ocr && s.ocr.status === 'provided')
    .flatMap(s => (s.candidateFacts || conciseLines(s.ocr.text || '', 3)).slice(0, 3).map(text => ({
      text,
      sourceId:s.id,
      evidenceStrength:s.ocr.confidence != null && s.ocr.confidence >= 0.8 ? 'moderate' : 'weak',
      needsConfirmation:s.ocr.confidence != null && s.ocr.confidence < 0.8,
      reason:'external OCR text requires review'
    })))
    .slice(0, 12);
  const needsConfirmationFacts = sources
    .filter(s => s.kind === 'image' || (s.ocr && s.ocr.auditStatus === 'needs_confirmation') || (s.extractionDiagnostics && s.extractionDiagnostics.possibleOcrMissing))
    .map(s => ({
      sourceId:s.id,
      name:s.name,
      kind:s.kind,
      reason:s.ocr && s.ocr.auditStatus === 'needs_confirmation'
        ? 'low confidence OCR needs confirmation'
        : (s.kind === 'image' ? 'image role/provenance needs confirmation' : 'OCR recommended before extracting facts')
    }))
    .slice(0, 12);
  return {
    version: 'material-bundle/v1',
    generatedAt: new Date().toISOString(),
    root,
    sourceCount: sources.length,
    sources,
    images,
    ingestReport: {
      version: 'material-ingest-report/v1',
      textSourceCount,
      imageSourceCount: images.length,
      possibleOcrMissing,
      officeSourceCount: sources.filter(s => s.kind === 'office').length,
      pdfSourceCount: sources.filter(s => s.kind === 'pdf').length,
      tableLikeSourceCount: sources.filter(s => (s.tables || []).length || (s.extractionDiagnostics && s.extractionDiagnostics.tableLikeEntryCount > 0)).length,
      structuredTableCount: sources.reduce((sum, s) => sum + ((s.tables || []).length), 0),
      ocrProvidedCount: sources.filter(s => s.ocr && s.ocr.status === 'provided').length,
      factReliability: {
        reliableFacts,
        weakEvidenceFacts,
        needsConfirmationFacts
      }
    },
    textSummary: {
      charCount: allText.length,
      industryCandidates,
      numbers: extractNumbers(allText).slice(0, 40),
      candidateFacts: conciseLines(allText, 30)
    },
    modelContract: {
      expectedExtractionVersion: 'material-extraction/v1',
      materialHygiene: 'source text has been filtered for previous-deck production notes; removed samples are metadata, not source facts',
      nextStep: 'For complex or externally delivered materials, run scripts/material_orchestration_prompt.js for source-audit and story-architecture, run scripts/material_clarification_gate.js before extraction when inputs are missing, then continue extraction and critic stages; scripts/material_model_prompt.js is only a tiny-material compatibility path'
    }
  };
}

module.exports = {
  classifyImageRole,
  collectFiles,
  detectIndustry,
  extractOfficeText,
  extractPdfText,
  fileKind,
  ingestMaterials,
  splitChunks
};

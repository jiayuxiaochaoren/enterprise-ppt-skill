const fs = require('fs');
const path = require('path');

const {
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
  compactUnique,
  conciseLines,
  extractNumbers,
  sanitizeMaterialText,
  usageError
} = require('./common');
const {
  extractOfficeText,
  extractPdfText
} = require('./document-extractors');
const {
  classifyImageRole,
  collectFiles,
  detectIndustry,
  fileKind,
  splitChunks
} = require('./ingest-file-utils');

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

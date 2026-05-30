const path = require('path');
const cp = require('child_process');

function normalizeOcrResults(raw = {}) {
  const values = Array.isArray(raw) ? raw : (raw.results || raw.items || raw.sources || []);
  const map = new Map();
  const add = (key, item) => {
    const clean = String(key || '').trim();
    if (!clean) return;
    map.set(clean, item);
  };
  if (Array.isArray(values)) {
    values.forEach(item => {
      if (!item || typeof item !== 'object') return;
      [item.source_id, item.sourceId, item.path, item.relativePath, item.name, item.file].forEach(key => add(key, item));
    });
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    Object.entries(raw).forEach(([key, value]) => {
      if (key === 'results' || key === 'items' || key === 'sources') return;
      if (value && typeof value === 'object') add(key, value);
    });
  }
  return map;
}

function ocrMatchFor(ocrMap = new Map(), source = {}) {
  const keys = [source.id, source.path, source.relativePath, source.name, path.basename(source.path || '')].filter(Boolean);
  for (const key of keys) {
    if (ocrMap.has(key)) return ocrMap.get(key);
  }
  return null;
}

function ocrPages(item = {}) {
  if (!item || typeof item === 'string') return [];
  if (Array.isArray(item.pages)) {
    return item.pages.map((page, i) => ({
      page: page.page || page.pageNumber || i + 1,
      text: page.text || page.content || '',
      confidence: page.confidence == null ? null : Number(page.confidence),
      bbox: page.bbox || page.region || null
    })).filter(page => page.text);
  }
  return [];
}

function ocrText(item = {}) {
  if (!item) return '';
  if (typeof item === 'string') return item;
  const pages = ocrPages(item);
  if (pages.length) return pages.map(page => page.text).join('\n\n');
  return item.text || item.content || item.ocrText || '';
}

function ocrConfidence(item = {}) {
  if (!item || typeof item === 'string') return null;
  if (item.confidence != null) return Number(item.confidence);
  const pages = ocrPages(item).map(page => page.confidence).filter(v => v != null && Number.isFinite(v));
  if (!pages.length) return null;
  return pages.reduce((sum, v) => sum + v, 0) / pages.length;
}

function runImageOcrCommand(command = '', file = '') {
  if (!command) return null;
  try {
    const text = cp.execFileSync(command, [file, 'stdout'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 45000,
      maxBuffer: 1024 * 1024 * 8
    });
    return String(text || '').trim() ? {
      text,
      provider: path.basename(command),
      confidence: null,
      source: 'local-command'
    } : null;
  } catch (_) {
    return null;
  }
}

module.exports = {
  normalizeOcrResults,
  ocrConfidence,
  ocrMatchFor,
  ocrPages,
  ocrText,
  runImageOcrCommand
};

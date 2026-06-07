const {
  sourceTraceForSlide: canonicalSourceTraceForSlide,
  sourceTraceObjectIsExplainable
} = require('./source-evidence');

function compactUnique(values = []) {
  const out = [];
  const seen = new Set();
  values.filter(v => v != null && String(v).trim()).forEach(value => {
    const key = String(value).trim();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  });
  return out;
}

function flattenText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(flattenText).join(' ');
  if (typeof value === 'object') return Object.values(value).map(flattenText).join(' ');
  return '';
}

function asNumber(value) {
  if (value == null || value === '') return null;
  const raw = String(value).replace(/,/g, '').trim();
  const match = raw.match(/[+-]?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function unitOf(value = '', fallback = '') {
  const text = String(value == null ? '' : value);
  const match = text.match(/(%|％|bps|bp|pt|pts|x|倍|w|万|亿|bn|m|mn|JPY|RMB|USD|CNY|¥|\$|min|分钟|天|月|年)/i);
  return match ? match[1] : fallback;
}

function itemLabel(item = {}, fallback = '') {
  if (typeof item === 'string') return item || fallback;
  return item.label || item.title || item.name || item.stage || item.category || item.metric || fallback;
}

function itemValue(item = {}) {
  if (typeof item === 'number') return item;
  if (typeof item === 'string') return item;
  return item.value != null ? item.value
    : item.amount != null ? item.amount
      : item.score != null ? item.score
        : item.y != null ? item.y
          : item.share != null ? item.share
            : '';
}

function itemNote(item = {}) {
  if (!item || typeof item !== 'object') return '';
  return item.note || item.body || item.description || item.text || item.commentary || '';
}

function coerceItems(value) {
  if (Array.isArray(value)) return value.map(v => typeof v === 'string' ? { title: v } : v).filter(Boolean);
  if (value && Array.isArray(value.items)) return coerceItems(value.items);
  if (value && Array.isArray(value.rows)) {
    return value.rows.map(row => Array.isArray(row)
      ? { title: row[0], value: row[1], body: row.slice(2).join(' / ') }
      : row
    ).filter(Boolean);
  }
  return [];
}

function firstItems(slide = {}, keys = []) {
  for (const key of keys) {
    const items = coerceItems(slide[key]);
    if (items.length) return { key, items };
  }
  return { key: '', items: [] };
}

function matrixFromValue(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const rows = value.map(row => Array.isArray(row) ? row : [itemLabel(row), itemValue(row), itemNote(row)]);
    return {
      rows: rows.map(row => String(row[0] || '')),
      columns: compactUnique(rows.flatMap(row => row.slice(1).map((_, i) => `C${i + 1}`))),
      values: rows.map(row => row.slice(1))
    };
  }
  if (value.rows && value.cols && value.values) {
    return { rows: value.rows, columns: value.cols, values: value.values };
  }
  if (value.rows && value.columns && value.values) {
    return { rows: value.rows, columns: value.columns, values: value.values };
  }
  if (value.items) return matrixFromValue(value.items);
  return null;
}

function metricsFromSlide(slide = {}) {
  const explicit = coerceItems(slide.metrics).map((metric, i) => ({
    label: itemLabel(metric, `Metric ${i + 1}`),
    value: itemValue(metric),
    note: itemNote(metric),
    unit: metric.unit || unitOf(itemValue(metric)),
    sourceTrace: metric.sourceTrace || metric.source_trace || null
  })).filter(metric => metric.value !== '' || metric.note);
  if (explicit.length) return explicit;

  const containers = [slide.cards, slide.items, slide.rows].filter(Array.isArray);
  const found = [];
  containers.flat().forEach((item, i) => {
    const text = flattenText(item);
    const match = text.match(/[+-]?\d[\d,]*(?:\.\d+)?\s*(?:%|％|pt|bps|倍|x|w|万|亿|bn|m|JPY|¥|\$|min|分钟)?/i);
    if (!match) return;
    found.push({
      label: itemLabel(item, `Metric ${i + 1}`),
      value: match[0].replace(/\s+/g, ''),
      note: itemNote(item),
      unit: unitOf(match[0])
    });
  });
  return found.slice(0, 4);
}

function normalizeSeries(items = [], opts = {}) {
  const categories = [];
  const values = items.map((item, i) => {
    const label = itemLabel(item, opts.defaultCategory ? `${opts.defaultCategory} ${i + 1}` : `Item ${i + 1}`);
    const raw = itemValue(item);
    categories.push(label);
    return {
      category: label,
      value: asNumber(raw),
      rawValue: raw,
      note: itemNote(item),
      unit: item.unit || unitOf(raw, opts.unit || ''),
      kind: item.kind || item.type || ''
    };
  });
  return {
    categories,
    series: [{
      name: opts.name || 'Series',
      values
    }]
  };
}

function proofObjectId(slide = {}) {
  return String((slide.proof && slide.proof.id) || slide.proofObject || slide.proof_object || slide.layoutVariant || slide.variant || '').trim();
}

function sourceTraceForSlide(slide = {}) {
  return canonicalSourceTraceForSlide(slide);
}

function sourceClassForTrace(sourceTrace = {}) {
  if (sourceTraceObjectIsExplainable(sourceTrace, { requireSourceId:true })) return 'source-traced';
  if (sourceTrace.sourceIds && sourceTrace.sourceIds.length) return 'source-id-only';
  return 'user-provided-or-untraced';
}

function evidenceModeForSlide(slide = {}, sourceTrace = sourceTraceForSlide(slide)) {
  const proof = slide.proof || {};
  const generation = slide.assetGeneration || {};
  const generationStatus = String(generation.status || '').toLowerCase();
  const generatedAssetText = flattenText([
    slide.generatedAssetPrompt,
    generation.prompt,
    generation.provenance,
    generation.mode,
    generationStatus && generationStatus !== 'none' ? generationStatus : ''
  ]);
  if (proof.generatedIllustration || /generated|synthetic|model|illustration/i.test(generatedAssetText)) {
    return 'model-generated-illustration';
  }
  if (!sourceTraceObjectIsExplainable(sourceTrace, { requireSourceId:true })) return 'untraced';
  if ((sourceTrace.sources || []).some(source => /image|screenshot|png|jpg|jpeg/i.test(`${source.kind || ''} ${source.name || ''} ${source.relativePath || ''}`))) {
    return 'real-screenshot-or-image';
  }
  if ((sourceTrace.sources || []).some(source => /quote|text|html|pdf|filing|report/i.test(`${source.kind || ''} ${source.name || ''}`))) {
    return 'real-quote-or-document';
  }
  if (sourceTrace.sourceIds && sourceTrace.sourceIds.length) return 'real-data';
  return 'untraced';
}

module.exports = {
  asNumber,
  coerceItems,
  compactUnique,
  evidenceModeForSlide,
  firstItems,
  flattenText,
  itemLabel,
  itemNote,
  itemValue,
  matrixFromValue,
  metricsFromSlide,
  normalizeSeries,
  proofObjectId,
  sourceClassForTrace,
  sourceTraceForSlide,
  unitOf
};

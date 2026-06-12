function createOverlayDataHelpers(deps = {}) {
  const {
    sourceTraceNoteText,
    visibleSourceNotesEnabled,
    visibleSourceNoteText
  } = require('../design/source-evidence');
  const compactText = typeof deps.compactText === 'function'
    ? deps.compactText
    : ((text = '', maxChars = 32) => String(text || '').replace(/\s+/g, ' ').trim().slice(0, maxChars));
  const itemTitle = typeof deps.itemTitle === 'function'
    ? deps.itemTitle
    : ((value, fallback = '') => typeof value === 'string' ? value : ((value && (value.title || value.label || value.name || value.value)) || fallback));
  const itemBody = typeof deps.itemBody === 'function'
    ? deps.itemBody
    : ((value, fallback = '') => typeof value === 'string' ? '' : ((value && (value.body || value.note || value.text || value.description)) || fallback));

  function componentSourceNoteText(plan = {}, s = {}) {
    if (!visibleSourceNotesEnabled(plan)) return '';
    return visibleSourceNoteText(s) || sourceTraceNoteText(s);
  }

  function overlayMetricsForSlide(plan = {}, s = {}) {
    const normalize = metric => typeof metric === 'string'
      ? { label:'Metric', value:metric, note:'' }
      : { label:metric.label || metric.title || 'Metric', value:metric.value || metric.amount || metric.delta || '', note:metric.note || metric.body || metric.unit || '' };
    if (Array.isArray(s.metrics) && s.metrics.length) return s.metrics.map(normalize).filter(metric => metric.value || metric.note).slice(0, 4);
    if (['cover', 'cover-dark'].includes(s.type || '') && Array.isArray(plan.coverMetrics) && plan.coverMetrics.length) {
      return plan.coverMetrics.map(normalize).filter(metric => metric.value || metric.note).slice(0, 4);
    }
    return [];
  }

  function overlayPointsForSlide(s = {}) {
    const fields = [s.phases, s.items, s.actions, s.sections, s.cards].find(value => Array.isArray(value) && value.length);
    if (fields) return fields.slice(0, 5);
    const proof = s.proof || {};
    return [s.title, s.claim || s.subtitle, proof.explanation || s.note].filter(Boolean).slice(0, 3).map(text => ({ title:text }));
  }

  function overlayProofItemsForSlide(plan = {}, s = {}) {
    if (Array.isArray(s.proofItems) && s.proofItems.length) return s.proofItems.slice(0, 4);
    if (Array.isArray(s.evidenceItems) && s.evidenceItems.length) return s.evidenceItems.slice(0, 4);
    if (Array.isArray(s.galleryItems) && s.galleryItems.length) return s.galleryItems.slice(0, 4);
    if (Array.isArray(s.cards) && s.cards.length) return s.cards.slice(0, 4);
    if (Array.isArray(s.items) && s.items.length) return s.items.slice(0, 4);
    const proof = s.proof || {};
    const caption = s.caption || (s.visual && s.visual.caption) || proof.caption || proof.sourceNote || proof.source_note || '';
    return caption ? [{ title:'证据说明', body:caption }] : [];
  }

  function productField(item = {}, fields = []) {
    if (typeof item === 'string') return fields.includes('title') ? item : '';
    return fields.map(field => item[field]).find(Boolean) || '';
  }

  function overlayProductItemsForSlide(plan = {}, s = {}) {
    const source = [
      s.products,
      s.productStory,
      s.productItems,
      s.skus
    ].find(value => Array.isArray(value) && value.length);
    if (!source) return [];
    return source.slice(0, 4)
      .map(item => {
        if (typeof item === 'string') {
          return { product:item, scene:'', benefit:'', businessMeaning:'' };
        }
        return {
          product: productField(item, ['product', 'sku', 'name', 'title', 'label']),
          scene: productField(item, ['scene', 'occasion', 'useCase', 'channel', 'context']),
          benefit: productField(item, ['benefit', 'efficacy', 'claim', 'sellingPoint', 'body', 'note', 'description']),
          businessMeaning: productField(item, ['businessMeaning', 'business', 'meaning', 'impact', 'outcome', 'value'])
        };
      })
      .filter(item => item.product || item.scene || item.benefit || item.businessMeaning);
  }

  return {
    componentSourceNoteText,
    overlayMetricsForSlide,
    overlayPointsForSlide,
    overlayProofItemsForSlide,
    overlayProductItemsForSlide
  };
}

module.exports = {
  createOverlayDataHelpers
};

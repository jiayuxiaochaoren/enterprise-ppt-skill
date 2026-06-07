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
    const textItems = [
      s.title,
      s.subtitle,
      s.claim,
      s.note,
      ...(Array.isArray(s.cards) ? s.cards.map(card => `${card.title || ''} ${card.body || card.text || ''}`) : []),
      ...(Array.isArray(s.items) ? s.items.map(value => `${itemTitle(value)} ${itemBody(value)}`) : [])
    ].filter(Boolean);
    const found = [];
    textItems.forEach((text, i) => {
      const matches = String(text).match(/[+-]?\d[\d,]*(?:\.\d+)?\s*(?:%|％|pt|bps|倍|JPY|¥|B|bn|m|年|yrs?|countries|awards)?/gi) || [];
      matches.forEach(match => {
        const value = match.replace(/\s+/g, '');
        if (!value || /^\d{4}$/.test(value) || found.some(metric => metric.value === value)) return;
        found.push({
          label: i === 0 ? 'Claim signal' : compactText(String(text).replace(match, ''), 18),
          value,
          note: compactText(String(text), 24)
        });
      });
    });
    return found.slice(0, 4);
  }

  function overlayPointsForSlide(s = {}) {
    const fields = [s.phases, s.items, s.actions, s.sections, s.cards].find(value => Array.isArray(value) && value.length);
    if (fields) return fields.slice(0, 5);
    const proof = s.proof || {};
    return [s.title, s.claim || s.subtitle, proof.explanation || s.note].filter(Boolean).slice(0, 3).map(text => ({ title:text }));
  }

  function overlayProofItemsForSlide(plan = {}, s = {}) {
    if (Array.isArray(s.cards) && s.cards.length) return s.cards.slice(0, 4);
    if (Array.isArray(s.items) && s.items.length) return s.items.slice(0, 4);
    const metrics = overlayMetricsForSlide(plan, s);
    if (metrics.length) return metrics.map(metric => ({ title:`${metric.label}: ${metric.value}`, body:metric.note }));
    if (Array.isArray(s.rows) && s.rows.length) return s.rows.slice(0, 4).map(row => Array.isArray(row) ? { title:row[0], body:row.slice(1).join(' · ') } : row);
    const proof = s.proof || {};
    return [proof.explanation || s.claim || s.subtitle].filter(Boolean).map(text => ({ title:'Proof', body:text }));
  }

  function productField(item = {}, fields = []) {
    if (typeof item === 'string') return fields.includes('title') ? item : '';
    return fields.map(field => item[field]).find(Boolean) || '';
  }

  function overlayProductItemsForSlide(plan = {}, s = {}) {
    const source = [
      s.products,
      s.productStory,
      s.cards,
      s.items
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

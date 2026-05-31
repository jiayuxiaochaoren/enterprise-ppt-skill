function slideSemanticText(s = {}) {
  const chunks = [
    s.title,
    s.subtitle,
    s.claim,
    s.intro,
    s.note,
    s.footerNote,
    ...(Array.isArray(s.cards) ? s.cards.map(c => `${c.title || ''} ${c.body || c.note || ''}`) : []),
    ...(Array.isArray(s.items) ? s.items.map(v => typeof v === 'string' ? v : `${v.title || v.label || ''} ${v.body || v.note || ''}`) : []),
    ...(Array.isArray(s.phases) ? s.phases.map(v => typeof v === 'string' ? v : `${v.title || ''} ${v.body || v.note || ''}`) : [])
  ];
  return chunks.filter(Boolean).join(' ');
}

function publicSlideNote(note = '') {
  const text = String(note || '').trim();
  if (!text) return '';
  if (/(第[一二三四五六七八九十0-9]+页|后续页面|后续再|该页|本页仅|用于测试|测试\s*closing|示例|占位|材料显示|企业\s*PDF|模型抽取|用户材料自动整理|proof object|页面族|优先呈现|优先表达|阅读顺序|普通目录|普通简介|closing)/i.test(text)) {
    return '';
  }
  return text;
}

function itemTitle(v, fallback = '') {
  if (typeof v === 'string') return v;
  return (v && (v.title || v.label || v.name || v.value)) || fallback;
}

function itemBody(v, fallback = '') {
  if (typeof v === 'string') return '';
  return (v && (v.body || v.note || v.text || v.description)) || fallback;
}

function hasEllipsisText(text = '') {
  return /(?:\.{3,}|…)/.test(String(text || ''));
}

function stripEllipsisText(text = '') {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*(?:\.{3,}|…)\s*$/g, '')
    .trim();
}

function itemBodyNoEllipsis(v, fallback = '') {
  const raw = itemBody(v, '');
  if (!raw || hasEllipsisText(raw)) return fallback;
  return raw;
}

function compactEvidenceCaption(text = '', maxChars = 30) {
  return stripEllipsisText(text);
}

function variantOf(s, fallback = '') {
  return s.layoutVariant || s.variant || fallback;
}

function formatMetricDelta(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  return text
    .replace(/^\+(\d+(?:\.\d+)?)\s*pt$/i, '提升 $1 个百分点')
    .replace(/^\+(\d+(?:\.\d+)?)\s*pts$/i, '提升 $1 个百分点')
    .replace(/^\+(\d+(?:\.\d+)?)%$/i, '提升 $1%');
}

module.exports = {
  compactEvidenceCaption,
  formatMetricDelta,
  hasEllipsisText,
  itemBody,
  itemBodyNoEllipsis,
  itemTitle,
  publicSlideNote,
  slideSemanticText,
  stripEllipsisText,
  variantOf
};

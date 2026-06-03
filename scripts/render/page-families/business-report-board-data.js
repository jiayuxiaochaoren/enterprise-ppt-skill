function reportBoardItems(s) {
  const raw = s.sections || s.cards || s.items || s.rows || [];
  const defaultBody = s.itemBody || s.bodyHint || s.claim || s.subtitle || s.summary || '';
  return (Array.isArray(raw) ? raw : []).map(v => {
    if (Array.isArray(v)) return { title:v[0], body:v[2] || v[1] || '' };
    if (typeof v === 'string') return { title:v, body:defaultBody };
    const item = v || {};
    return Object.assign({}, item, { body:item.body || item.summary || item.note || defaultBody });
  }).filter(Boolean);
}

module.exports = {
  reportBoardItems
};

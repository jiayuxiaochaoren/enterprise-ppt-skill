function chapterItems(s = {}) {
  const raw = s.items || s.agenda || s.sections || [];
  return (Array.isArray(raw) ? raw : [])
    .map(v => typeof v === 'string' ? { title:v } : v)
    .filter(Boolean);
}

module.exports = {
  chapterItems
};

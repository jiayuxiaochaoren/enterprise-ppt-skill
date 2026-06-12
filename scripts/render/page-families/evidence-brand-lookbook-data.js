function lookbookStoryItems(s) {
  return (s.lookbook || s.productStory || s.cards || s.items || [])
    .slice(0, 3)
    .map(v => typeof v === 'string' ? { title:v } : v);
}

module.exports = {
  lookbookStoryItems
};

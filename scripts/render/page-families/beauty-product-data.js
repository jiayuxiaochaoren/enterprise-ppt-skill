function productItems(s = {}) {
  if (Array.isArray(s.products)) return s.products;
  if (Array.isArray(s.cards)) return s.cards;
  if (Array.isArray(s.items)) return s.items.map(v => typeof v === 'string' ? { title:v } : v);
  return [];
}

function productBreakdownItems(s = {}, items = []) {
  const raw = s.features || s.sellingPoints || s.breakdown || s.proofPoints || items;
  return (Array.isArray(raw) ? raw : []).map(v => typeof v === 'string' ? { title:v } : v).filter(Boolean);
}

module.exports = {
  productBreakdownItems,
  productItems
};

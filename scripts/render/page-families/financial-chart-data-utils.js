function coerceChartItems(value, fallback = []) {
  if (Array.isArray(value)) return value.map(v => typeof v === 'string' ? { title:v } : v);
  if (value && Array.isArray(value.items)) return value.items.map(v => typeof v === 'string' ? { title:v } : v);
  if (value && Array.isArray(value.rows)) return value.rows.map(v => Array.isArray(v) ? { title:v[0], value:v[1], body:v[2] } : v);
  return fallback;
}

function chartNumber(value, fallback = 0) {
  const n = Number(String(value == null ? '' : value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

function chartClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function chartBoxesOverlap(a, b, pad = 0) {
  return a.x < b.x + b.w + pad &&
    a.x + a.w + pad > b.x &&
    a.y < b.y + b.h + pad &&
    a.y + a.h + pad > b.y;
}

function firstChartItems(source = {}, keys = [], fallback = []) {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value) || (value && (Array.isArray(value.items) || Array.isArray(value.rows)))) {
      const items = coerceChartItems(value, []);
      if (items.length) return items;
    }
  }
  return coerceChartItems(null, fallback);
}

module.exports = {
  chartBoxesOverlap,
  chartClamp,
  chartNumber,
  coerceChartItems,
  firstChartItems
};

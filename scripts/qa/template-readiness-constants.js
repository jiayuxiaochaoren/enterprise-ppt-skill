const STATUS_VALUES = ['missing', 'partial', 'pass'];
const STATUS_RANK = { missing: 0, partial: 1, pass: 2 };

const REQUIRED_STATUS_FIELDS = [
  'recipe',
  'visualGrammar',
  'renderer',
  'orchestration',
  'qa',
  'fixturePptx',
  'previewPng',
  'acceptanceDeck'
];

const REQUIRED_PAGE_FAMILIES = [
  'financial-kpi-snapshot',
  'chart-grid-with-commentary',
  'quarterly-results-summary',
  'guidance-and-risk-board',
  'value-creation-process-map',
  'materiality-matrix-board',
  'sustainability-proof-spread',
  'governance-table-editorial',
  'culture-cover-with-soft-geometry',
  'mission-statement-stage',
  'people-proof-mosaic',
  'value-principle-cards',
  'beauty-brand-editorial-cover',
  'brand-world-and-business-proof',
  'consumer-proof-photo-grid',
  'product-evidence-story',
  'airy-concept-opening',
  'single-object-concept-map',
  'executive-proof-board',
  'premium-closing-anchor'
];

module.exports = {
  REQUIRED_PAGE_FAMILIES,
  REQUIRED_STATUS_FIELDS,
  STATUS_RANK,
  STATUS_VALUES
};

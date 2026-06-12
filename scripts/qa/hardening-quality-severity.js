const {
  MATRIX_VERSION,
  POLICY_VERSION,
  policyRows
} = require('./quality-severity-policy');

const REQUIRED_SEVERITY_CATEGORIES = Object.freeze([
  'baseline_drift',
  'blank_page',
  'fallback',
  'overlay_contract',
  'shrink_risk',
  'skipped_critical_asset',
  'stale_metadata',
  'unknown_component'
]);

const REQUIRED_SEVERITY_TYPES = Object.freeze([
  Object.freeze({ type: 'fallbackRendererUsed', category: 'fallback', draft: 'review', formal: 'fail', delivery: 'fail' }),
  Object.freeze({ type: 'skippedCriticalAsset', category: 'skipped_critical_asset', draft: 'review', formal: 'fail', delivery: 'fail' }),
  Object.freeze({ type: 'unknownComponentId', category: 'unknown_component', draft: 'fail', formal: 'fail', delivery: 'fail' }),
  Object.freeze({ type: 'staleRouteMetadataStillActive', category: 'stale_metadata', draft: 'fail', formal: 'fail', delivery: 'fail' }),
  Object.freeze({ type: 'textShrinkRisk', category: 'shrink_risk', draft: 'review', formal: 'fail', delivery: 'fail' }),
  Object.freeze({ type: 'possiblyBlankPreview', category: 'blank_page', draft: 'review', formal: 'review', delivery: 'fail' }),
  Object.freeze({ type: 'baselineHashDistance', category: 'baseline_drift', draft: 'fail', formal: 'fail', delivery: 'fail' }),
  Object.freeze({ type: 'overlaySlotMismatch', category: 'overlay_contract', draft: 'fail', formal: 'fail', delivery: 'fail' })
]);

function categoryRows(rows = []) {
  const categories = {};
  rows.forEach(row => {
    const category = row.category || 'uncategorized';
    categories[category] = categories[category] || {
      category,
      deliveryFail: 0,
      formalFail: 0,
      rows: 0
    };
    categories[category].rows += 1;
    if (row.formal === 'fail') categories[category].formalFail += 1;
    if (row.delivery === 'fail') categories[category].deliveryFail += 1;
  });
  return Object.values(categories).sort((a, b) => a.category.localeCompare(b.category));
}

function qualitySeverityMatrixSummary(opts = {}) {
  const rows = Array.isArray(opts.rows) ? opts.rows : policyRows();
  const requiredCategories = Array.isArray(opts.requiredCategories)
    ? opts.requiredCategories
    : REQUIRED_SEVERITY_CATEGORIES;
  const requiredTypes = Array.isArray(opts.requiredTypes)
    ? opts.requiredTypes
    : REQUIRED_SEVERITY_TYPES;
  const categories = categoryRows(rows);
  const categorySet = new Set(categories.map(row => row.category));
  const rowByType = new Map(rows.map(row => [row.type, row]));
  const requiredTypeRows = requiredTypes.map(required => {
    const row = rowByType.get(required.type);
    const mismatches = [];
    if (!row) {
      mismatches.push('missing');
    } else {
      ['category', 'draft', 'formal', 'delivery'].forEach(field => {
        if (row[field] !== required[field]) mismatches.push(field);
      });
    }
    return {
      type: required.type,
      category: row ? row.category : '',
      draft: row ? row.draft : '',
      formal: row ? row.formal : '',
      delivery: row ? row.delivery : '',
      expected: required,
      mismatches,
      ready: mismatches.length === 0
    };
  });
  const missingCategories = requiredCategories.filter(category => !categorySet.has(category));
  const missingTypes = requiredTypeRows.filter(row => row.mismatches.includes('missing')).map(row => row.type);
  const mismatchedTypes = requiredTypeRows
    .filter(row => row.mismatches.length && !row.mismatches.includes('missing'))
    .map(row => row.type);
  return {
    ready: missingCategories.length === 0 && missingTypes.length === 0 && mismatchedTypes.length === 0,
    policyVersion: POLICY_VERSION,
    matrixVersion: MATRIX_VERSION,
    rowCount: rows.length,
    categoryCount: categories.length,
    requiredCategoryCount: requiredCategories.length,
    requiredTypeCount: requiredTypes.length,
    readyRequiredTypeCount: requiredTypeRows.filter(row => row.ready).length,
    categories,
    missingCategories,
    missingTypes,
    mismatchedTypes,
    requiredTypes: requiredTypeRows
  };
}

module.exports = {
  REQUIRED_SEVERITY_CATEGORIES,
  REQUIRED_SEVERITY_TYPES,
  qualitySeverityMatrixSummary
};

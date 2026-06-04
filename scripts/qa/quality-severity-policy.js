const {
  MATRIX_VERSION,
  QUALITY_SEVERITY_MATRIX,
  severityMatrixRows
} = require('./contract-registry');

const POLICY_VERSION = 'quality-severity-policy/v1';
const LEVEL_RANK = { pass:0, review:1, fail:2 };

function normalizeMode(mode = 'draft') {
  const normalized = String(mode || 'draft').trim().toLowerCase().replace(/_/g, '-');
  if (normalized === 'formal-review') return 'formal';
  if (['draft', 'formal', 'delivery'].includes(normalized)) return normalized;
  return 'draft';
}

function normalizeLevel(level = 'review') {
  const normalized = String(level || 'review').trim().toLowerCase();
  return LEVEL_RANK[normalized] == null ? 'review' : normalized;
}

function maxLevel(a = 'review', b = 'review') {
  const left = normalizeLevel(a);
  const right = normalizeLevel(b);
  return LEVEL_RANK[right] > LEVEL_RANK[left] ? right : left;
}

function policyRow(type = '') {
  const entry = QUALITY_SEVERITY_MATRIX[type];
  if (!entry) return null;
  return {
    type,
    category: entry.category,
    draft: entry.levels.draft || 'review',
    formal: entry.levels.formal || entry.levels.draft || 'review',
    delivery: entry.levels.delivery || entry.levels.formal || entry.levels.draft || 'review',
    reason: entry.reason,
    source: entry.source
  };
}

function policyRowsForTypes(types = []) {
  return types.map(policyRow).filter(Boolean);
}

function policyRows() {
  return severityMatrixRows();
}

function severityPromotionsForMode(mode) {
  const qualityMode = normalizeMode(mode);
  const promotions = {};
  policyRows().forEach(row => {
    const target = row[qualityMode] || 'review';
    if (target === 'fail' && row.draft !== 'fail') promotions[row.type] = row.reason;
  });
  return promotions;
}

const FORMAL_PROMOTIONS = severityPromotionsForMode('formal');
const DELIVERY_PROMOTIONS = Object.fromEntries(
  Object.entries(severityPromotionsForMode('delivery')).filter(([type]) => !FORMAL_PROMOTIONS[type])
);

function summarizeFindings(findings = []) {
  const byCategory = {};
  const byLevel = {};
  findings.forEach(finding => {
    const level = normalizeLevel(finding.level || 'review');
    byLevel[level] = (byLevel[level] || 0) + 1;
    const category = finding.severityCategory || 'uncategorized';
    byCategory[category] = byCategory[category] || { fail:0, review:0, pass:0, total:0 };
    byCategory[category][level] = (byCategory[category][level] || 0) + 1;
    byCategory[category].total += 1;
  });
  return { byLevel, byCategory };
}

function applyQualitySeverityPolicy(findings = [], mode = 'draft') {
  const qualityMode = normalizeMode(mode);
  const promotions = severityPromotionsForMode(qualityMode);
  const applied = findings.map(finding => {
    const row = policyRow(finding.type);
    if (!row) return finding;
    const originalLevel = normalizeLevel(finding.level || 'review');
    const targetLevel = row[qualityMode] || originalLevel;
    const level = maxLevel(originalLevel, targetLevel);
    const next = {
      ...finding,
      level,
      severityCategory: row.category,
      severityPolicyReason: row.reason,
      severityPolicyLevel: {
        draft: row.draft,
        formal: row.formal,
        delivery: row.delivery
      }
    };
    if (level !== originalLevel) {
      next.originalLevel = originalLevel;
      if (level === 'fail') next.fatalBecauseOfQualityMode = qualityMode;
    }
    return next;
  });
  const matrixRows = policyRows();
  return {
    findings: applied,
    policy: {
      version: POLICY_VERSION,
      matrixVersion: MATRIX_VERSION,
      mode: qualityMode,
      promotedTypes: Object.keys(promotions).sort(),
      categories: [...new Set(matrixRows.map(row => row.category))].sort(),
      matrix: matrixRows,
      summary: summarizeFindings(applied)
    }
  };
}

module.exports = {
  DELIVERY_PROMOTIONS,
  FORMAL_PROMOTIONS,
  MATRIX_VERSION,
  POLICY_VERSION,
  QUALITY_SEVERITY_MATRIX,
  applyQualitySeverityPolicy,
  normalizeMode,
  policyRow,
  policyRows,
  policyRowsForTypes,
  severityPromotionsForMode
};

const path = require('path');

const REQUIRED_TEMPLATE_FIELDS = ['recipe', 'visualGrammar', 'renderer', 'orchestration', 'qa', 'fixturePptx', 'previewPng', 'acceptanceDeck'];

function templateReadinessSummary(opts = {}) {
  const {
    readJson,
    rel,
    templateMatrixPath
  } = opts;
  const matrix = readJson(templateMatrixPath, { pageFamilies: [] });
  const rows = Array.isArray(matrix.pageFamilies) ? matrix.pageFamilies : [];
  const missing = [];
  rows.forEach(row => {
    const statuses = row.statuses || {};
    REQUIRED_TEMPLATE_FIELDS.forEach(field => {
      if (statuses[field] !== 'pass') missing.push(`${row.id}.${field}:${statuses[field] || 'missing'}`);
    });
  });
  return {
    matrix: rel(path.resolve(templateMatrixPath)),
    pageFamilyCount: rows.length,
    requiredFields: REQUIRED_TEMPLATE_FIELDS,
    ready: rows.length > 0 && missing.length === 0,
    missing
  };
}

module.exports = {
  REQUIRED_TEMPLATE_FIELDS,
  templateReadinessSummary
};

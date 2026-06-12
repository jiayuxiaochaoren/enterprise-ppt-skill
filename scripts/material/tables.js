function splitTableRow(line = '') {
  const trimmed = String(line || '').trim();
  if (!trimmed) return [];
  if (trimmed.includes('\t')) return trimmed.split('\t').map(cell => cell.trim()).filter(Boolean);
  if (trimmed.includes('|')) return trimmed.split('|').map(cell => cell.trim()).filter(Boolean);
  if (/[,，]/.test(trimmed) && (trimmed.match(/[,，]/g) || []).length >= 2) return trimmed.split(/[,，]/).map(cell => cell.trim()).filter(Boolean);
  if (/\s{2,}/.test(trimmed)) return trimmed.split(/\s{2,}/).map(cell => cell.trim()).filter(Boolean);
  return [];
}

function detectStructuredTables(text = '', source = {}) {
  const rows = String(text || '')
    .split(/\r?\n/)
    .map(splitTableRow)
    .filter(cells => cells.length >= 2);
  if (rows.length < 2) return [];
  const width = Math.max(...rows.map(row => row.length));
  return [{
    id: `${source.id || 'source'}-table-001`,
    sourceId: source.id || '',
    sourceName: source.name || '',
    extraction: 'heuristic-delimited-text',
    rowCount: rows.length,
    columnCount: width,
    headers: rows[0],
    rows: rows.slice(1, 25)
  }];
}

module.exports = {
  detectStructuredTables,
  splitTableRow
};

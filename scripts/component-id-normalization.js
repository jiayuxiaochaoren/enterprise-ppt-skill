function normalizeComponentId(value = '') {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_+\s/]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

module.exports = {
  normalizeComponentId
};

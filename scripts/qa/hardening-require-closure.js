const path = require('path');

function normalizedFile(file = '') {
  return String(file || '').replace(/\\/g, '/').replace(/^\.\//, '');
}

function resolveLocalRequire(fromFile = '', spec = '', exists = () => false) {
  if (!/^\.\.?\//.test(spec)) return '';
  const base = normalizedFile(path.posix.normalize(path.posix.join(path.posix.dirname(normalizedFile(fromFile)), spec)));
  const candidates = path.posix.extname(base)
    ? [base]
    : [`${base}.js`, path.posix.join(base, 'index.js')];
  return candidates.find(candidate => exists(candidate)) || candidates[0];
}

function localRequireDependencies(file = '', opts = {}) {
  const {
    exists = () => false,
    readText = () => ''
  } = opts;
  const normalized = normalizedFile(file);
  if (!exists(normalized)) return [];
  const text = readText(normalized);
  const dependencies = [];
  const requirePattern = /require\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g;
  let match = requirePattern.exec(text);
  while (match) {
    const resolved = resolveLocalRequire(normalized, match[1], exists);
    if (resolved && !dependencies.includes(resolved)) dependencies.push(resolved);
    match = requirePattern.exec(text);
  }
  return dependencies.sort();
}

function requireClosureFiles(roots = [], opts = {}) {
  const {
    exists = () => false,
    readText = () => ''
  } = opts;
  const queue = (Array.isArray(roots) ? roots : []).map(normalizedFile).filter(Boolean);
  const seen = new Set();
  while (queue.length) {
    const file = queue.shift();
    if (seen.has(file)) continue;
    seen.add(file);
    localRequireDependencies(file, { exists, readText }).forEach(dependency => {
      if (!seen.has(dependency)) queue.push(dependency);
    });
  }
  return [...seen].sort();
}

module.exports = {
  localRequireDependencies,
  normalizedFile,
  requireClosureFiles,
  resolveLocalRequire
};

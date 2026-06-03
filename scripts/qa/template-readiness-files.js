const fs = require('fs');
const path = require('path');

function createTemplateReadinessFiles(root) {
  function rel(p) {
    return path.relative(root, p).split(path.sep).join('/');
  }

  function absolute(p) {
    if (!p) return '';
    return path.isAbsolute(p) ? p : path.join(root, p);
  }

  function fileExists(file) {
    return Boolean(file) && fs.existsSync(absolute(file));
  }

  function readAbsoluteText(file) {
    try {
      return fs.readFileSync(file, 'utf8');
    } catch (_) {
      return '';
    }
  }

  function readText(relPath) {
    return readAbsoluteText(path.join(root, relPath));
  }

  function readJson(relPath, fallback) {
    try {
      return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8'));
    } catch (_) {
      return fallback;
    }
  }

  function listFiles(dir, predicate = () => true) {
    try {
      return fs.readdirSync(dir)
        .map(name => path.join(dir, name))
        .filter(file => fs.statSync(file).isFile())
        .filter(predicate);
    } catch (_) {
      return [];
    }
  }

  function countPngs(dir) {
    try {
      return fs.readdirSync(dir).filter(name => /\.png$/i.test(name)).length;
    } catch (_) {
      return 0;
    }
  }

  return {
    absolute,
    countPngs,
    fileExists,
    listFiles,
    readAbsoluteText,
    readJson,
    readText,
    rel
  };
}

module.exports = {
  createTemplateReadinessFiles
};

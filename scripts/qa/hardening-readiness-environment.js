const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const MATRIX_PATH = path.join(ROOT, 'assets', 'hardening-readiness-matrix.json');
const TEMPLATE_MATRIX_PATH = path.join(ROOT, 'assets', 'template-readiness-matrix.json');
const BACKLOG_PATH = path.join(ROOT, 'references', 'pptx-skill-hardening-backlog.md');
const STATUS_VALUES = ['missing', 'partial', 'pass'];
const STATUS_RANK = { missing: 0, partial: 1, pass: 2 };
const PRIORITY_VALUES = ['P0', 'P1', 'P2'];

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function absolute(file) {
  if (!file) return '';
  return path.isAbsolute(file) ? file : path.join(ROOT, file);
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (_) {
    return '';
  }
}

function exists(file) {
  return Boolean(file) && fs.existsSync(absolute(file));
}

function isDirectory(file) {
  try {
    return Boolean(file) && fs.statSync(absolute(file)).isDirectory();
  } catch (_) {
    return false;
  }
}

function listFiles(dir, opts = {}) {
  const extension = opts.extension || '';
  try {
    return fs.readdirSync(absolute(dir), { withFileTypes: true })
      .filter(entry => entry.isFile())
      .map(entry => `${dir.replace(/\/$/, '')}/${entry.name}`)
      .filter(file => !extension || file.endsWith(extension))
      .sort();
  } catch (_) {
    return [];
  }
}

function commandScript(command = '') {
  const match = String(command).match(/\bnode\s+(scripts\/[^\s]+\.js)\b/);
  return match ? match[1] : '';
}

function commandLooksAvailable(command = '') {
  const script = commandScript(command);
  if (!script) return /\bnpm\s+run\s+/.test(command);
  return exists(script);
}

function backlogTaskIds() {
  const text = readText(BACKLOG_PATH);
  return [...text.matchAll(/^###\s+(P\d-\d{2})\s+/gm)].map(match => match[1]);
}

module.exports = {
  BACKLOG_PATH,
  MATRIX_PATH,
  PRIORITY_VALUES,
  ROOT,
  STATUS_RANK,
  STATUS_VALUES,
  TEMPLATE_MATRIX_PATH,
  absolute,
  backlogTaskIds,
  commandLooksAvailable,
  commandScript,
  exists,
  isDirectory,
  listFiles,
  readJson,
  readText,
  rel
};

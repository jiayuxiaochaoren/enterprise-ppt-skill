const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MATRIX_PATH = path.join(ROOT, 'assets', 'template-readiness-matrix.json');
const FIXTURE_MANIFEST = path.join(
  ROOT,
  'outputs',
  '019e583b-b589-7043-8c51-700ce5757a00',
  'presentations',
  'template-page-family-fixtures',
  'manifest.json'
);
const ACCEPTANCE_MANIFEST = path.join(
  ROOT,
  'outputs',
  '019e583b-b589-7043-8c51-700ce5757a00',
  'presentations',
  'industry-template-system-acceptance',
  'manifest.json'
);

const PAGE_FAMILY_QA_GATES = {
  'financial-kpi-snapshot': ['hero KPI', 'metric strip', 'period/source'],
  'chart-grid-with-commentary': ['chart grid', 'commentary rail', 'data note'],
  'quarterly-results-summary': ['period label', 'reported metrics', 'management action'],
  'guidance-and-risk-board': ['assumption', 'trigger', 'owner/action'],
  'value-creation-process-map': ['input', 'activity', 'output', 'outcome'],
  'materiality-matrix-board': ['two axes', 'priority zone', 'placed topics'],
  'sustainability-proof-spread': ['evidence image', 'metric', 'source note'],
  'governance-table-editorial': ['responsibility', 'cadence', 'evidence', 'decision'],
  'culture-cover-with-soft-geometry': ['culture signal', 'soft geometry', 'metadata'],
  'mission-statement-stage': ['mission statement', 'behavior proof', 'principles'],
  'people-proof-mosaic': ['role caption', 'scene', 'output proof'],
  'value-principle-cards': ['principle', 'observable behavior', 'proof example'],
  'beauty-brand-editorial-cover': ['product texture', 'brand world', 'premium palette'],
  'brand-world-and-business-proof': ['brand signal', 'business proof', 'product promise'],
  'consumer-proof-photo-grid': ['scene', 'reason', 'repeat signal'],
  'product-evidence-story': ['hero product', 'claim', 'evidence caption'],
  'airy-concept-opening': ['concept object', 'whitespace', 'proof direction'],
  'single-object-concept-map': ['single center', 'surrounding nodes', 'outcome'],
  'executive-proof-board': ['claim', 'evidence set', 'decision implication'],
  'premium-closing-anchor': ['final decision', 'next actions', 'owner/contact']
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readJsonIfExists(file) {
  return fs.existsSync(file) ? readJson(file) : null;
}

function countPngs(dir) {
  return fs.readdirSync(dir).filter(name => /\.png$/i.test(name)).length;
}

function fileExists(relPath) {
  return fs.existsSync(path.isAbsolute(relPath) ? relPath : path.join(ROOT, relPath));
}

function rootPath(relPath) {
  return path.isAbsolute(relPath) ? relPath : path.join(ROOT, relPath);
}

function assertOutputPath(relPath, label) {
  assert.equal(typeof relPath, 'string', `${label} should be recorded`);
  assert.ok(relPath.startsWith('outputs/'), `${label} should be an outputs evidence path`);
}

function assertOptionalNonEmpty(relPath, label, minBytes = 1) {
  const file = rootPath(relPath);
  if (fs.existsSync(file)) {
    assert.ok(fs.statSync(file).size > minBytes, `${label} should be non-empty when generated artifacts are present`);
  }
}

const matrix = readJson(MATRIX_PATH);
const fixtureManifest = readJsonIfExists(FIXTURE_MANIFEST);
const acceptanceManifest = readJsonIfExists(ACCEPTANCE_MANIFEST);
const rows = matrix.pageFamilies || [];
const ids = rows.map(row => row.id);
const requiredIds = Object.keys(PAGE_FAMILY_QA_GATES);

assert.deepEqual(ids.slice().sort(), requiredIds.slice().sort(), 'readiness matrix should match the QA gate family list');
assert.ok(matrix.evidenceRoot && matrix.evidenceRoot.startsWith('outputs/'), 'readiness matrix should record generated fixture evidence under outputs');
assert.ok(matrix.acceptanceRoot && matrix.acceptanceRoot.startsWith('outputs/'), 'readiness matrix should record generated acceptance evidence under outputs');
if (fixtureManifest) {
  assert.equal(fixtureManifest.results.length, requiredIds.length, 'fixture manifest should cover every page family');
}
if (acceptanceManifest) {
  assert.equal(acceptanceManifest.decks.length, 8, 'industry acceptance should cover 8 decks');
  assert.ok(acceptanceManifest.decks.every(deck => deck.acceptanceStatus === 'pass'), 'every industry deck should pass acceptance QA');
  assert.ok(acceptanceManifest.decks.every(deck => deck.slideCount >= 8 && deck.slideCount <= 12), 'every industry deck should be 8-12 slides');
}

const fixtureIds = fixtureManifest
  ? new Set(fixtureManifest.results.map(result => result.id))
  : new Set(rows.filter(row => row.fixtures && fileExists(row.fixtures.plan)).map(row => row.id));
const acceptanceText = acceptanceManifest
  ? [
      ...acceptanceManifest.decks.map(deck => fs.readFileSync(deck.plan, 'utf8')),
      JSON.stringify(acceptanceManifest.decks.map(deck => deck.normalizedRoutes || []))
    ].join('\n')
  : '';

for (const row of rows) {
  assert.ok(PAGE_FAMILY_QA_GATES[row.id], `${row.id} should have an explicit QA gate`);
  assert.equal(row.statuses.recipe, 'pass', `${row.id} recipe status`);
  assert.equal(row.statuses.visualGrammar, 'pass', `${row.id} visual grammar status`);
  assert.equal(row.statuses.renderer, 'pass', `${row.id} renderer status`);
  assert.equal(row.statuses.orchestration, 'pass', `${row.id} orchestration status`);
  assert.equal(row.statuses.qa, 'pass', `${row.id} QA status`);
  assert.equal(row.statuses.fixturePptx, 'pass', `${row.id} fixture PPTX status`);
  assert.equal(row.statuses.previewPng, 'pass', `${row.id} preview PNG status`);
  assert.equal(row.statuses.acceptanceDeck, 'pass', `${row.id} acceptance deck status`);

  assert.ok(row.renderer && row.renderer.approvedDistinctBranch === true, `${row.id} should record an approved distinct renderer branch`);
  assert.ok(row.qa && row.qa.approvedFamilyGate === true, `${row.id} should record an approved family QA gate`);
  assert.ok(fixtureIds.has(row.id), `${row.id} should appear in fixture manifest`);
  if (acceptanceManifest) {
    assert.ok(acceptanceText.includes(row.id), `${row.id} should appear in at least one acceptance plan or route`);
  } else {
    assert.ok(Array.isArray(row.acceptance && row.acceptance.hits) && row.acceptance.hits.length >= 1, `${row.id} should record acceptance deck hits`);
    assert.ok(row.acceptance.hits.every(hit => hit.acceptanceStatus === 'pass'), `${row.id} acceptance hits should record pass status`);
  }
  assert.ok(fileExists(row.fixtures.plan), `${row.id} fixture plan should exist`);
  assertOutputPath(row.fixtures.pptx, `${row.id} fixture PPTX path`);
  assertOutputPath(row.fixtures.preview, `${row.id} fixture preview path`);
  assert.match(row.fixtures.preview, /\.png$/i, `${row.id} fixture preview should be a PNG path`);
  assertOptionalNonEmpty(row.fixtures.pptx, `${row.id} fixture PPTX`);
  assertOptionalNonEmpty(row.fixtures.preview, `${row.id} fixture preview`, 10000);
}

if (acceptanceManifest) {
  for (const deck of acceptanceManifest.decks) {
    assert.ok(fileExists(deck.pptx), `${deck.slug} PPTX should exist`);
    assert.ok(fileExists(deck.contactSheet), `${deck.slug} contact sheet should exist`);
    assert.ok(countPngs(deck.previewDir) === deck.slideCount, `${deck.slug} preview count should match slide count`);
  }
}

console.log('template family QA gates ok');

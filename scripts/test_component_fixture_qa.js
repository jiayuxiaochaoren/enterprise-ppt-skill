const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ACCEPTANCE_MANIFEST = path.join(
  ROOT,
  'outputs',
  '019e583b-b589-7043-8c51-700ce5757a00',
  'presentations',
  'industry-template-system-acceptance',
  'manifest.json'
);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readJsonIfExists(file) {
  return fs.existsSync(file) ? readJson(file) : null;
}

function repoPath(relPath) {
  return path.isAbsolute(relPath) ? relPath : path.join(ROOT, relPath);
}

function assertOptionalPreviewArtifact(relPath, label, evidenceRoot) {
  assert.equal(typeof relPath, 'string', `${label} should record a preview path`);
  assert.match(relPath, /\.png$/i, `${label} should record a PNG preview path`);
  assert.ok(relPath.startsWith(`${evidenceRoot}/preview/`), `${label} should stay under the component evidence root`);
  const preview = repoPath(relPath);
  if (fs.existsSync(preview)) {
    assert.ok(fs.statSync(preview).size > 10000, `${label} should be non-empty when generated artifacts are present`);
  }
}

const componentReadiness = readJson(path.join(ROOT, 'assets', 'template-component-readiness.json'));
const matrix = readJson(path.join(ROOT, 'assets', 'template-readiness-matrix.json'));
const acceptance = readJsonIfExists(ACCEPTANCE_MANIFEST);

const pageFamilies = new Set(matrix.pageFamilies.map(row => row.id));
const expectedComponents = [
  'kpi-primary-metric',
  'chart-commentary',
  'caption-image-evidence',
  'product-case-proof-gallery',
  'value-creation-flow',
  'risk-matrix',
  'governance-table',
  'people-team-evidence-wall',
  'brand-world-hero',
  'chrome-components'
];

assert.equal(componentReadiness.version, 'template-component-readiness/v1');
assert.deepEqual(componentReadiness.components.map(c => c.id).sort(), expectedComponents.slice().sort());
assert.equal(componentReadiness.componentFixtureQA.script, 'scripts/test_component_fixture_qa.js');
if (acceptance) {
  assert.ok(acceptance.decks.every(deck => deck.failCount === 0), 'fixed component slots should have no blocking visual_qa failures in acceptance decks');
} else {
  assert.ok(
    componentReadiness.componentFixtureQA.checks.some(check => /visual_qa fail_count=0|acceptance/i.test(check)),
    'component fixture QA should keep the acceptance visual_qa contract even when generated outputs are absent'
  );
}

for (const component of componentReadiness.components) {
  assert.ok(Array.isArray(component.supports) && component.supports.length >= 2, `${component.id} should declare supported variants`);
  assert.ok(Array.isArray(component.fixtureUses) && component.fixtureUses.length >= 2, `${component.id} should have at least two fixture uses`);
  const uniqueFamilies = new Set(component.fixtureUses.map(use => use.pageFamily));
  assert.ok(uniqueFamilies.size >= 2, `${component.id} should appear in at least two page families`);
  for (const use of component.fixtureUses) {
    assert.ok(pageFamilies.has(use.pageFamily), `${component.id} references unknown page family ${use.pageFamily}`);
    assertOptionalPreviewArtifact(
      use.preview,
      `${component.id} preview for ${use.pageFamily}`,
      componentReadiness.evidenceRoot
    );
  }
}

const captionComponents = componentReadiness.components.filter(component =>
  /caption|gallery|people|brand-world|product/i.test(component.id)
);
captionComponents.forEach(component => {
  const supportText = component.supports.join(' ').toLowerCase();
  assert.ok(/caption|proof|source|business/.test(supportText), `${component.id} should expose caption/proof/source behavior`);
});

const dataComponents = componentReadiness.components.filter(component =>
  /kpi|chart|risk|governance|chrome/i.test(component.id)
);
dataComponents.forEach(component => {
  const supportText = component.supports.join(' ').toLowerCase();
  assert.ok(/source|metric|commentary|risk|owner|page number|period|decision|control/.test(supportText), `${component.id} should expose data/source/control behavior`);
});

console.log('component fixture QA ok');

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const {
  INDUSTRY_PACK_LIBRARY,
  INDUSTRY_BENCHMARKS,
  industryBenchmarksFor
} = require('./design-system');

const ROOT = path.resolve(__dirname, '..');
const packs = INDUSTRY_PACK_LIBRARY.packs || [];
const requiredPackFields = [
  'reportStructures',
  'proofObjectCatalog',
  'componentRules',
  'visualGrammar',
  'missingMaterialQuestions'
];

assert.ok(packs.length >= 8, 'industry pack library should cover the active industry set');
packs.forEach(pack => {
  requiredPackFields.forEach(field => {
    assert.ok(pack[field], `${pack.id} should include ${field}`);
  });
  assert.ok(Object.keys(pack.reportStructures || {}).length >= 3, `${pack.id} should include 8/12/20 report structures`);
  assert.ok((pack.proofObjectCatalog || []).length >= 5, `${pack.id} should include at least five proof object catalog entries`);
  assert.ok((pack.componentRules || []).length >= 4, `${pack.id} should include component rules`);
  assert.ok((pack.missingMaterialQuestions || []).length >= 5, `${pack.id} should include missing-material questions`);
  assert.ok((pack.visualGrammar.layoutRules || []).length >= 4, `${pack.id} should include visual grammar layout rules`);
});

const benchmarks = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'industry-benchmarks.json'), 'utf8'));
assert.equal(benchmarks.version, 'industry-benchmarks/v1');
Object.entries(benchmarks.industries || {}).forEach(([industry, sets]) => {
  assert.ok(sets.length >= 5, `${industry} should have at least five real benchmark material sets`);
  const coverage = new Set(sets.flatMap(set => set.coverage || []));
  (benchmarks.coverageDimensions || ['material-light', 'material-rich', 'missing-images', 'missing-data', 'strong-authorization', 'image-heavy']).forEach(tag => {
    assert.ok(coverage.has(tag), `${industry} benchmarks should cover ${tag}`);
  });
  sets.forEach(set => {
    assert.ok(/^https:\/\//.test(set.sourceUrl), `${set.id} should use an https source URL`);
    assert.ok(set.authorizationStatus, `${set.id} should declare authorization status`);
  });
});

const beauty = industryBenchmarksFor('beauty-consumer');
assert.ok(beauty.length >= 5, 'beauty benchmarks should include more than the SHISEIDO regression');
assert.ok(beauty.filter(set => /shiseido/i.test(set.id)).length === 1, 'SHISEIDO should be one benchmark, not the whole beauty regression set');
assert.ok(beauty.some(set => /loreal|estee|kao|amore/i.test(set.id)), 'beauty regression should include additional real brands');

console.log('industry pack depth ok');

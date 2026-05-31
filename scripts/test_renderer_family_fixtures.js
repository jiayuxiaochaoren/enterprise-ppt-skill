const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FIXTURES = path.join(ROOT, 'examples', 'renderer-family-fixtures');
const OUT = path.join(ROOT, 'outputs', 'test-renderer-family-fixtures');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

function run(args) {
  const result = cp.spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 180000
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function pptxText(file) {
  const list = cp.execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
  return list
    .filter(entry => /^ppt\/slides\/slide\d+\.xml$/.test(entry))
    .map(entry => cp.execFileSync('unzip', ['-p', file, entry], { encoding: 'utf8' }))
    .join('\n')
    .replace(/<[^>]+>/g, ' ');
}

function stableMeta(meta = {}) {
  return {
    slideCount: meta.slideCount,
    slides: (meta.slides || []).map(slide => ({
      slide: slide.slide,
      type: slide.type,
      rendererId: slide.rendererMatch && slide.rendererMatch.rendererId,
      source: slide.rendererMatch && slide.rendererMatch.source,
      planned: (slide.plannedComponents || []).map(component => component.id).sort(),
      consumed: (slide.consumedComponents || []).map(component => component.id || component).sort(),
      missing: (slide.missingRequiredComponents || []).map(component => component.id || component).sort()
    }))
  };
}

[
  ['financial-family.json', 'page-family:financial'],
  ['business-family.json', 'page-family:business'],
  ['chapter-family.json', 'page-family:chapter'],
  ['toc-family.json', 'page-family:toc'],
  ['manifesto-family.json', 'page-family:manifesto'],
  ['beauty-family.json', 'page-family:beauty'],
  ['profile-family.json', 'page-family:profile'],
  ['profile-finance-family.json', 'page-family:profile'],
  ['closing-family.json', 'page-family:closing'],
  ['architecture-family.json', 'page-family:architecture'],
  ['evidence-gallery-family.json', 'page-family:evidence-gallery'],
  ['timeline-family.json', 'page-family:timeline'],
  ['risk-family.json', 'page-family:risk']
].forEach(([fixture, expectedSource]) => {
  const plan = path.join(FIXTURES, fixture);
  const pptxA = path.join(OUT, `${path.basename(fixture, '.json')}.a.pptx`);
  const pptxB = path.join(OUT, `${path.basename(fixture, '.json')}.b.pptx`);
  run(['scripts/generate_pptx.js', plan, pptxA]);
  run(['scripts/generate_pptx.js', plan, pptxB]);
  const metaA = JSON.parse(fs.readFileSync(`${pptxA}.render-meta.json`, 'utf8'));
  const metaB = JSON.parse(fs.readFileSync(`${pptxB}.render-meta.json`, 'utf8'));
  assert.deepEqual(stableMeta(metaA), stableMeta(metaB), `${fixture} render-meta should be stable`);
  assert.ok((metaA.slides || []).every(slide => slide.rendererMatch && slide.rendererMatch.source === expectedSource), `${fixture} should route through ${expectedSource}`);
  const planJson = JSON.parse(fs.readFileSync(plan, 'utf8'));
  const text = pptxText(pptxA);
  (planJson.slides || []).forEach(slide => {
    assert.ok(text.includes(slide.title.slice(0, 8)), `${fixture} should render title text: ${slide.title}`);
  });
});

console.log('renderer family fixtures ok');

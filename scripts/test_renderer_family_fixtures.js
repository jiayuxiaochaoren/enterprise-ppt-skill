const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FIXTURES = path.join(ROOT, 'examples', 'renderer-family-fixtures');
const OUT = path.join(ROOT, 'outputs', 'test-renderer-family-fixtures');
const CASES = [
  ['financial-family.json', 'page-family:financial'],
  ['business-family.json', 'page-family:business'],
  ['chapter-family.json', 'page-family:chapter'],
  ['toc-family.json', 'page-family:toc'],
  ['manifesto-family.json', 'page-family:manifesto'],
  ['beauty-family.json', 'page-family:beauty'],
  ['general-family.json', 'page-family:general'],
  ['profile-family.json', 'page-family:profile'],
  ['profile-finance-family.json', 'page-family:profile'],
  ['closing-family.json', 'page-family:closing'],
  ['cover-family.json', 'page-family:cover'],
  ['cover-energy-family.json', 'page-family:cover'],
  ['architecture-family.json', 'page-family:architecture'],
  ['strategy-family.json', 'page-family:strategy'],
  ['evidence-gallery-family.json', 'page-family:evidence-gallery'],
  ['timeline-family.json', 'page-family:timeline'],
  ['risk-family.json', 'page-family:risk']
];

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--family') opts.family = String(argv[++i] || '').toLowerCase();
    else if (arg === '--fixture') opts.fixture = String(argv[++i] || '');
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  return opts;
}

function usage() {
  const families = [...new Set(CASES.map(([, source]) => source.replace(/^page-family:/, '')))].sort();
  console.error([
    'Usage: node scripts/test_renderer_family_fixtures.js [--family name] [--fixture file.json]',
    '',
    `Families: ${families.join(', ')}`
  ].join('\n'));
}

function selectedCases(opts = {}) {
  return CASES.filter(([fixture, expectedSource]) => {
    if (opts.family && expectedSource !== `page-family:${opts.family}`) return false;
    if (opts.fixture && fixture !== opts.fixture && path.basename(fixture, '.json') !== opts.fixture) return false;
    return true;
  });
}

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

function stableText(text = '') {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function textHash(text = '') {
  return crypto.createHash('sha256').update(stableText(text)).digest('hex').slice(0, 16);
}

function stableMeta(meta = {}) {
  return {
    slideCount: meta.slideCount,
    slides: (meta.slides || []).map(slide => ({
      slide: slide.slide,
      type: slide.type,
      rendererMatch: slide.rendererMatch ? {
        requestedType: slide.rendererMatch.requestedType,
        matchedType: slide.rendererMatch.matchedType,
        matchKind: slide.rendererMatch.matchKind,
        rendererId: slide.rendererMatch.rendererId,
        rendererName: slide.rendererMatch.rendererName,
        source: slide.rendererMatch.source
      } : null,
      planned: (slide.plannedComponents || []).map(component => component.id).sort(),
      consumed: (slide.consumedComponents || []).map(component => component.id || component).sort(),
      missing: (slide.missingRequiredComponents || []).map(component => component.id || component).sort()
    }))
  };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    usage();
    return;
  }
  const cases = selectedCases(opts);
  assert.ok(cases.length, `no renderer family fixtures matched family=${opts.family || '*'} fixture=${opts.fixture || '*'}`);
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  cases.forEach(([fixture, expectedSource]) => {
    const plan = path.join(FIXTURES, fixture);
    const pptxA = path.join(OUT, `${path.basename(fixture, '.json')}.a.pptx`);
    const pptxB = path.join(OUT, `${path.basename(fixture, '.json')}.b.pptx`);
    run(['scripts/generate_pptx.js', plan, pptxA]);
    run(['scripts/generate_pptx.js', plan, pptxB]);
    const metaA = JSON.parse(fs.readFileSync(`${pptxA}.render-meta.json`, 'utf8'));
    const metaB = JSON.parse(fs.readFileSync(`${pptxB}.render-meta.json`, 'utf8'));
    assert.deepEqual(stableMeta(metaA), stableMeta(metaB), `${fixture} render-meta should be stable`);
    assert.ok((metaA.slides || []).every(slide => slide.rendererMatch && slide.rendererMatch.source === expectedSource), `${fixture} should route through ${expectedSource}`);
    if (fixture === 'financial-family.json') {
      const industrySlides = (metaA.slides || []).filter(slide => slide.type === 'industry-chart');
      assert.ok(industrySlides.length >= 5, 'financial-family should cover industry-chart variants');
      assert.ok(industrySlides.every(slide => slide.rendererMatch && slide.rendererMatch.rendererId === 'industry-chart'), 'financial industry-chart fixtures should keep rendererMatch stable');
      const consumedIds = industrySlides.flatMap(slide => (slide.consumedComponents || []).map(component => component.id || component));
      assert.ok(consumedIds.includes('bar-chart'), 'financial industry-chart chartSpec fixture should consume the native bar-chart component');
    }
    const planJson = JSON.parse(fs.readFileSync(plan, 'utf8'));
    const textA = stableText(pptxText(pptxA));
    const textB = stableText(pptxText(pptxB));
    assert.equal(textHash(textA), textHash(textB), `${fixture} extracted text hash should be stable`);
    assert.equal(textA.length, textB.length, `${fixture} extracted text length should be stable`);
    assert.ok(textA.length > 80, `${fixture} should render meaningful extracted text`);
    const compactTextA = textA.replace(/\s+/g, '');
    (planJson.slides || []).forEach(slide => {
      const titlePrefix = String(slide.title || '').replace(/\s+/g, '').slice(0, 8);
      assert.ok(compactTextA.includes(titlePrefix), `${fixture} should render title text: ${slide.title}`);
    });
  });

  console.log(`renderer family fixtures ok (${cases.length}/${CASES.length})`);
}

try {
  main();
} catch (err) {
  usage();
  console.error(err.stack || err.message || err);
  process.exit(1);
}

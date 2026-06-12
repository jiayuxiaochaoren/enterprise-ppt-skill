const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const {
  normalizeDeckPlan
} = require('./design-system');
const {
  auditBrandVisualRichnessFromFiles
} = require('./qa/brand-visual-richness-audit');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'out', 'brand-visual-richness-audit');
const CLEAN_VISUAL_QA = path.join(OUT, 'visual-qa-clean.json');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(CLEAN_VISUAL_QA, `${JSON.stringify({ findings: [] }, null, 2)}\n`, 'utf8');

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function renderedComponent(componentId, slide = {}) {
  const imageCount = Math.max(
    Array.isArray(slide.images) ? slide.images.length : 0,
    Array.isArray(slide.visual && slide.visual.images) ? slide.visual.images.length : 0,
    slide.image || (slide.visual && slide.visual.image) ? 1 : 0
  );
  const itemCount = Math.max(
    imageCount,
    Array.isArray(slide.cards) ? slide.cards.length : 0,
    Array.isArray(slide.items) ? slide.items.length : 0,
    Array.isArray(slide.productStory) ? slide.productStory.length : 0,
    1
  );
  return {
    id: componentId,
    mode: 'native-renderer',
    rendered: true,
    itemCount,
    drawnCount: itemCount,
    reason: 'unit-test render-meta fixture'
  };
}

function writeRenderMetaFixture(testCase) {
  if (testCase.expectedStatus !== 'pass') return null;
  const plan = normalizeDeckPlan(JSON.parse(fs.readFileSync(testCase.plan, 'utf8')));
  const renderMeta = {
    version: 'render-meta/v1',
    slideCount: plan.slides.length,
    slides: plan.slides.map((slide, index) => {
      const componentIds = ((slide.componentPlan || {}).componentIds || []).filter(Boolean);
      return {
        slide: index + 1,
        consumedComponents: componentIds.map(componentId => renderedComponent(componentId, slide))
      };
    })
  };
  const file = path.join(OUT, 'render-meta', `${testCase.id}.render-meta.json`);
  writeJson(file, renderMeta);
  return file;
}

const cases = [
  {
    id: 'product-evidence-story',
    plan: path.join(ROOT, 'examples', 'fixtures', 'product-evidence-story.json'),
    expectedStatus: 'pass',
    expectedComponents: ['proof-gallery', 'product-matrix', 'caption-bar']
  },
  {
    id: 'brand-world-and-business-proof',
    plan: path.join(ROOT, 'examples', 'fixtures', 'brand-world-and-business-proof.json'),
    expectedStatus: 'pass',
    expectedComponents: ['caption-bar', 'value-chain', 'kpi-strip']
  },
  {
    id: 'consumer-proof-photo-grid',
    plan: path.join(ROOT, 'examples', 'fixtures', 'consumer-proof-photo-grid.json'),
    expectedStatus: 'pass',
    expectedComponents: ['proof-gallery', 'caption-bar']
  },
  {
    id: 'acceptance-company-intro-brief',
    plan: path.join(ROOT, 'examples', 'acceptance-company-intro-brief.json'),
    renderMeta: null,
    expectedStatus: 'review',
    expectedComponents: ['proof-gallery', 'caption-bar']
  }
];

const reports = cases.map(testCase => auditBrandVisualRichnessFromFiles({
  sampleId: testCase.id,
  planPath: testCase.plan,
  renderMetaPath: writeRenderMetaFixture(testCase),
  visualQaPath: CLEAN_VISUAL_QA,
  normalizeDeckPlan
}));

reports.forEach((report, index) => {
  const testCase = cases[index];
  assert.equal(report.version, 'brand-visual-richness-audit/v1');
  assert.equal(report.sampleId, testCase.id);
  assert.equal(report.status, testCase.expectedStatus, `${testCase.id} status`);
  assert.ok(Array.isArray(report.gapReasons), `${testCase.id} should expose gap reasons`);
  assert.ok(report.slideCount >= 1, `${testCase.id} should audit at least one slide`);
  testCase.expectedComponents.forEach(componentId => {
    assert.ok(
      report.metrics.brandVisualComponentCoverage.includes(componentId),
      `${testCase.id} should cover ${componentId}`
    );
  });
});

const product = reports.find(report => report.sampleId === 'product-evidence-story');
assert.equal(product.findings.some(finding => finding.type === 'productMatrixWithoutProductData'), false);
assert.ok(product.metrics.imageEvidenceBindings >= 4);
assert.ok(product.metrics.captionEvidenceBindings >= 3);

const brandWorld = reports.find(report => report.sampleId === 'brand-world-and-business-proof');
assert.equal(brandWorld.metrics.brandVisualComponentCoverage.includes('product-matrix'), false);
assert.equal(brandWorld.findings.some(finding => finding.type === 'productMatrixWithoutProductData'), false);

const companyIntro = reports.find(report => report.sampleId === 'acceptance-company-intro-brief');
assert.ok(companyIntro.findings.some(finding => finding.type === 'renderMetaMissing'));
assert.equal(
  companyIntro.slides.some(slide => slide.plannedComponents.includes('product-matrix')),
  false,
  'manufacturing company intro should not plan product-matrix without product data'
);

console.log('brand visual richness audit ok');

const assert = require('assert/strict');
const {
  bodyRhythm,
  pairStatus
} = require('./qa/cross-industry-similarity-audit');

function previewInfo(hash = '1'.repeat(64)) {
  return {
    hash,
    mean: 120,
    stddev: 42,
    contentCoverage: 0.44,
    contentBBox: { x: 0.1, y: 0.1, w: 0.8, h: 0.7 },
    regions: {
      mainBody: {
        hash: '1'.repeat(16),
        contentBBox: { x: 0.1, y: 0.1, w: 0.7, h: 0.6 }
      },
      chartBoard: {
        hash: '1'.repeat(16)
      }
    }
  };
}

const baseSurface = {
  preview: '/tmp/base.png',
  previewInfo: previewInfo(),
  composition: 'hero-surface',
  backgroundTone: 'light',
  themeIntent: 'decision-close',
  accentRole: 'data',
  surfaceArchetype: 'native-industrial-structure-cover',
  coverStyle: 'native-structure',
  textureBackgroundPolicy: 'industrial-structure-light',
  layoutVariant: '',
  renderFamilySelected: 'cover'
};

const withinDeck = pairStatus(
  baseSurface,
  Object.assign({}, baseSurface, { renderFamilySelected: 'closing' }),
  { kind: 'cover-closing', withinDeck: true }
);
assert.equal(withinDeck.status, 'fail', 'similar cover and closing should fail within one deck');
assert.ok(withinDeck.reasons.includes('previewSimilarity'));

const crossIndustryFail = pairStatus(
  baseSurface,
  Object.assign({}, baseSurface, { renderFamilySelected: 'cover' }),
  { kind: 'cover', withinDeck: false }
);
assert.equal(crossIndustryFail.status, 'fail', 'identical cross-industry covers should fail');

const crossIndustryPass = pairStatus(
  baseSurface,
  {
    preview: '/tmp/other.png',
    previewInfo: previewInfo('0'.repeat(64)),
    composition: 'editorial-surface',
    backgroundTone: 'dark',
    themeIntent: 'brand-world',
    accentRole: 'evidence',
    surfaceArchetype: 'editorial-brand-cover',
    coverStyle: 'editorial-dark',
    textureBackgroundPolicy: 'editorial-paper-light',
    layoutVariant: 'beauty-brand-editorial-cover',
    renderFamilySelected: 'cover:beauty-brand-editorial-cover'
  },
  { kind: 'cover', withinDeck: false }
);
assert.equal(crossIndustryPass.status, 'pass', 'visibly and structurally different covers should pass');

const rhythm = bodyRhythm({
  slug: 'manufacturing',
  normalizedPlan: {
    slides: [
      { type: 'cover' },
      { type: 'architecture', renderFamilySelected: 'architecture:system', compositionPlan: { composition: 'system-board' } },
      { type: 'architecture', renderFamilySelected: 'architecture:system', compositionPlan: { composition: 'system-board' } },
      { type: 'architecture', renderFamilySelected: 'architecture:system', compositionPlan: { composition: 'system-board' } },
      { type: 'metric-comparison', renderFamilySelected: 'metric-comparison:kpi', compositionPlan: { composition: 'metric-board' } },
      { type: 'closing' }
    ]
  }
});
assert.equal(rhythm.maxRouteFamilyRun, 3);
assert.equal(rhythm.maxCompositionRun, 3);
assert.ok(rhythm.findings.some(finding => finding.type === 'bodyRouteRunTooLong'));
assert.ok(rhythm.findings.some(finding => finding.type === 'bodyCompositionRunTooLong'));

console.log('cross industry similarity audit ok');

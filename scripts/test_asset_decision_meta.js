const assert = require('assert/strict');

const {
  enrichAssetDecision
} = require('./render/asset-decision-meta');

const nativeManufacturingCover = enrichAssetDecision({
  generation: {
    action: 'skip_image',
    structureOnly: true,
    reason: 'user chose to skip visual asset and use native structure'
  },
  role: 'abstract',
  slide: {
    type: 'cover',
    coverStyle: 'industrial-command-cover',
    compositionPlan: {
      composition: 'industrial-structure-stage',
      industryExpression: {
        coverArchetype: 'native-industrial-structure-cover'
      }
    }
  },
  status: 'none',
  mode: 'structure-only',
  refs: []
});

assert.equal(nativeManufacturingCover.action, 'skip_image');
assert.equal(nativeManufacturingCover.riskLevel, 'low');
assert.equal(nativeManufacturingCover.skippedCriticalVisual, false);
assert.equal(nativeManufacturingCover.reviewRequired, false);

const skippedEvidenceImage = enrichAssetDecision({
  generation: {
    action: 'skip_image',
    structureOnly: true,
    reason: 'user skipped factual evidence image'
  },
  role: 'evidence',
  slide: {
    type: 'industry-chart'
  },
  status: 'none',
  mode: 'structure-only',
  refs: []
});

assert.equal(skippedEvidenceImage.riskLevel, 'high');
assert.equal(skippedEvidenceImage.skippedCriticalVisual, true);
assert.equal(skippedEvidenceImage.reviewRequired, true);

console.log('asset decision meta ok');

const assert = require('assert/strict');
const {
  EVIDENCE_GALLERY_RENDERER_KEYS,
  evidenceGalleryRendererKey
} = require('./render/page-families/evidence-gallery-routing');

assert.equal(evidenceGalleryRendererKey('case-hero'), 'caseEvidenceHero');
assert.equal(evidenceGalleryRendererKey('product-evidence-story'), 'productEvidenceStory');
assert.equal(evidenceGalleryRendererKey('brand-world-and-business-proof'), 'brandWorldBusinessProof');
assert.equal(evidenceGalleryRendererKey('portfolio-evidence'), 'financePortfolioEvidenceGallery');
assert.equal(evidenceGalleryRendererKey('service-touchpoint'), 'healthcareTouchpointEvidenceGallery');
assert.equal(evidenceGalleryRendererKey('site-evidence'), 'energySiteEvidenceGallery');
assert.equal(evidenceGalleryRendererKey('prototype-flow'), 'saasPrototypeFlowGallery');
assert.equal(evidenceGalleryRendererKey('case-comparison', { industry:'energy-utility' }), 'energySiteComparisonSlide');
assert.equal(evidenceGalleryRendererKey('case-comparison', { industry:'manufacturing-operations' }), 'caseComparisonSlide');
assert.equal(evidenceGalleryRendererKey('unknown'), '');

[
  'case-hero',
  'people-proof-mosaic',
  'sustainability-proof-spread',
  'consumer-proof-photo-grid',
  'product-evidence-story',
  'executive-proof-board',
  'brand-world-and-business-proof',
  'evidence-board',
  'lookbook-story',
  'portfolio-evidence',
  'service-touchpoint',
  'site-evidence',
  'prototype-flow'
].forEach(variant => {
  assert.ok(EVIDENCE_GALLERY_RENDERER_KEYS[variant], `${variant} should have a renderer key`);
});

console.log('evidence gallery routing ok');

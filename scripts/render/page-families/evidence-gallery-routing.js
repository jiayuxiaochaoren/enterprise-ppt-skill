const EVIDENCE_GALLERY_RENDERER_KEYS = {
  'case-hero': 'caseEvidenceHero',
  'people-proof-mosaic': 'peopleProofMosaic',
  'sustainability-proof-spread': 'sustainabilityProofSpread',
  'consumer-proof-photo-grid': 'consumerProofPhotoGrid',
  'product-evidence-story': 'productEvidenceStory',
  'executive-proof-board': 'executiveProofBoard',
  'brand-world-and-business-proof': 'brandWorldBusinessProof',
  'evidence-board': 'caseEvidenceBoard',
  'lookbook-story': 'retailLookbookStory',
  'portfolio-evidence': 'financePortfolioEvidenceGallery',
  'service-touchpoint': 'healthcareTouchpointEvidenceGallery',
  'site-evidence': 'energySiteEvidenceGallery',
  'prototype-flow': 'saasPrototypeFlowGallery'
};

function evidenceGalleryRendererKey(variant, plan = {}) {
  if (variant === 'case-comparison') {
    return plan.industry === 'energy-utility'
      ? 'energySiteComparisonSlide'
      : 'caseComparisonSlide';
  }
  return EVIDENCE_GALLERY_RENDERER_KEYS[variant] || '';
}

module.exports = {
  EVIDENCE_GALLERY_RENDERER_KEYS,
  evidenceGalleryRendererKey
};

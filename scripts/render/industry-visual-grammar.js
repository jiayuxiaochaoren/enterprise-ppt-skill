const LABELS_BY_CHAIN = {
  'consumer-beauty': {
    captionLabel: 'PRODUCT PROOF',
    proofLabel: 'PRODUCT',
    productMatrixLabel: 'PRODUCT PROOF MATRIX',
    grammarTone: 'product-scene-proof'
  },
  'industrial-manufacturing': {
    captionLabel: 'FIELD PROOF',
    proofLabel: 'FIELD',
    productMatrixLabel: '',
    grammarTone: 'engineering-inspection-proof'
  },
  'energy-infrastructure': {
    captionLabel: 'SITE PROOF',
    proofLabel: 'SITE',
    productMatrixLabel: '',
    grammarTone: 'safety-dispatch-proof'
  },
  'finance-investment': {
    captionLabel: 'DISCLOSURE',
    proofLabel: 'SOURCE',
    productMatrixLabel: '',
    grammarTone: 'assumption-risk-disclosure'
  },
  'healthcare-operations': {
    captionLabel: 'HANDOFF PROOF',
    proofLabel: 'CARE',
    productMatrixLabel: '',
    grammarTone: 'clinical-handoff-proof'
  },
  'saas-technology': {
    captionLabel: 'WORKFLOW PROOF',
    proofLabel: 'WORKFLOW',
    productMatrixLabel: '',
    grammarTone: 'workflow-adoption-proof'
  },
  'lifestyle-experience': {
    captionLabel: 'EXPERIENCE PROOF',
    proofLabel: 'EXPERIENCE',
    productMatrixLabel: 'EXPERIENCE PROOF MATRIX',
    grammarTone: 'journey-conversion-proof'
  },
  'public-sector': {
    captionLabel: 'PUBLIC SOURCE',
    proofLabel: 'SOURCE',
    productMatrixLabel: '',
    grammarTone: 'governance-source-proof'
  },
  'people-culture': {
    captionLabel: 'TEAM PROOF',
    proofLabel: 'TEAM',
    productMatrixLabel: '',
    grammarTone: 'behavior-culture-proof'
  }
};

const GEOMETRY_BY_CHAIN = {
  'consumer-beauty': {
    evidenceRegion: 'image-led-right-gallery',
    captionDensity: 'high-caption-per-visual',
    sourceDensity: 'light-source-footer',
    compositionBias: 'product-scene-caption',
    componentSlots: {
      'hero-image': 'hero-image-side-pocket',
      'product-matrix': 'product-matrix-lower-right',
      'proof-gallery': 'proof-gallery-lower-right',
      'caption-bar': 'caption-bar-lower-left'
    }
  },
  'industrial-manufacturing': {
    evidenceRegion: 'equipment-right-quality-bottom',
    captionDensity: 'medium-field-caption',
    sourceDensity: 'source-on-metric-slide',
    compositionBias: 'equipment-parameter-quality-card',
    componentSlots: {
      'equipment-nameplate': 'equipment-nameplate-upper-right',
      'inspection-matrix': 'inspection-matrix-lower-right',
      'quality-scorecard': 'quality-scorecard-bottom-band',
      'proof-gallery': 'field-proof-gallery-lower-right'
    }
  },
  'energy-infrastructure': {
    evidenceRegion: 'site-asset-dispatch-band',
    captionDensity: 'medium-site-caption',
    sourceDensity: 'source-on-operations-slide',
    compositionBias: 'site-dispatch-risk-card',
    componentSlots: {
      'site-evidence-frame': 'hero-image-side-pocket',
      'workflow-rail': 'workflow-rail-bottom-left',
      'quality-scorecard': 'quality-scorecard-bottom-band'
    }
  },
  'finance-investment': {
    evidenceRegion: 'disclosure-footer-table-right',
    captionDensity: 'low-caption-high-source',
    sourceDensity: 'required-disclosure-footer',
    compositionBias: 'assumption-risk-disclosure-table',
    componentSlots: {
      'governance-table': 'governance-table-upper-right',
      'risk-register': 'risk-register-lower-right',
      'source-note': 'source-note-footer-right',
      'disclosure-footnote': 'disclosure-footnote-footer-left'
    }
  },
  'healthcare-operations': {
    evidenceRegion: 'journey-bottom-blueprint-middle',
    captionDensity: 'medium-handoff-caption',
    sourceDensity: 'privacy-boundary-note',
    compositionBias: 'journey-handoff-quality-lane',
    componentSlots: {
      'patient-journey-band': 'patient-journey-band-bottom',
      'service-blueprint-lane': 'service-blueprint-lane-mid',
      'quality-scorecard': 'quality-scorecard-bottom-band',
      'risk-register': 'risk-register-lower-right'
    }
  },
  'saas-technology': {
    evidenceRegion: 'prototype-right-workflow-bottom',
    captionDensity: 'per-screen-action-caption',
    sourceDensity: 'screenshot-provenance-required',
    compositionBias: 'workflow-state-adoption-funnel',
    componentSlots: {
      'prototype-frame': 'prototype-frame-side-pocket',
      'workflow-rail': 'workflow-rail-bottom-left',
      'adoption-funnel': 'adoption-funnel-right',
      'permission-audit-tag': 'permission-audit-tag-lower-right'
    }
  },
  'lifestyle-experience': {
    evidenceRegion: 'place-journey-caption-band',
    captionDensity: 'high-experience-caption',
    sourceDensity: 'light-source-footer',
    compositionBias: 'place-journey-conversion',
    componentSlots: {
      'hero-image': 'hero-image-side-pocket',
      'proof-gallery': 'proof-gallery-lower-right',
      'caption-bar': 'caption-bar-lower-left'
    }
  },
  'public-sector': {
    evidenceRegion: 'source-governance-risk-table',
    captionDensity: 'low-caption-official-source',
    sourceDensity: 'required-public-source',
    compositionBias: 'policy-resource-risk-register',
    componentSlots: {
      'source-note': 'source-note-footer-right',
      'governance-table': 'governance-table-upper-right',
      'risk-register': 'risk-register-lower-right'
    }
  },
  'people-culture': {
    evidenceRegion: 'behavior-proof-mosaic-bottom',
    captionDensity: 'team-proof-caption',
    sourceDensity: 'authorization-note',
    compositionBias: 'mission-behavior-growth-proof',
    componentSlots: {
      'proof-gallery': 'proof-gallery-lower-right',
      'caption-bar': 'caption-bar-lower-left',
      'source-note': 'source-note-footer-right'
    }
  }
};
const {
  canonicalIndustryEvidenceChainForSlide
} = require('../design/industry-evidence-chain');

function compactList(values = [], max = 2) {
  return (values || []).filter(Boolean).slice(0, max);
}

function industryVisualGrammarDecisionFor(plan = {}, slide = {}) {
  const chain = canonicalIndustryEvidenceChainForSlide(plan, slide);
  if (!chain || chain.stageId === 'neutral-general') return null;
  const labels = LABELS_BY_CHAIN[chain.chainId] || {};
  const geometry = GEOMETRY_BY_CHAIN[chain.chainId] || {};
  const hasPackGrammar = Boolean(chain.visualGrammar);
  const grammar = chain.visualGrammar || {};
  return {
    version: 'industry-visual-grammar-decision/v1',
    chainId: chain.chainId,
    stageId: chain.stageId,
    captionLabel: labels.captionLabel || 'PROOF',
    proofLabel: labels.proofLabel || 'PROOF',
    productMatrixLabel: labels.productMatrixLabel || 'PRODUCT PROOF MATRIX',
    grammarTone: labels.grammarTone || 'evidence-proof',
    evidenceRegion: geometry.evidenceRegion || 'generic-evidence-region',
    captionDensity: geometry.captionDensity || 'standard-caption-density',
    sourceDensity: geometry.sourceDensity || 'standard-source-density',
    compositionBias: geometry.compositionBias || 'generic-proof-composition',
    componentSlots: geometry.componentSlots || {},
    layoutRules: compactList(grammar.layoutRules),
    imageRoles: compactList(grammar.imageRoles),
    colorRules: compactList(grammar.colorRules),
    source: hasPackGrammar ? 'industry-packs.visualGrammar' : 'industry-evidence-chain'
  };
}

module.exports = {
  industryVisualGrammarDecisionFor
};

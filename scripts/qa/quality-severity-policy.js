const FORMAL_PROMOTIONS = {
  renderMetaMissing: 'formal review requires render-meta so contract QA cannot be skipped',
  textLineCollision: 'formal review treats visible text/rule collisions as blocking layout defects',
  smallChineseText: 'formal review treats dense small Chinese text as a readability defect',
  duplicateOverlayComponent: 'formal review blocks duplicate overlays that may indicate stale fallback rendering',
  weakImageAsset: 'formal review requires weak image assets to be reviewed before delivery review'
};

const DELIVERY_PROMOTIONS = {
  previewMissing: 'delivery validation requires preview evidence for screenshot-level review',
  previewCount: 'delivery validation requires preview count to match slide count',
  previewUnreadable: 'delivery validation cannot use unreadable preview images',
  possiblyBlankPreview: 'delivery validation blocks possibly blank preview images',
  lowVisualVariance: 'delivery validation blocks previews that appear blank or overly plain',
  slideSimilarity: 'delivery validation blocks likely duplicated adjacent slides',
  contactSheetRhythmRepeat: 'delivery validation blocks repeated contact-sheet rhythm',
  textDensity: 'delivery validation treats excessive text density as blocking',
  typographyScaleTooFragmented: 'delivery validation treats fragmented type scale as blocking',
  typographyFontFamilyDrift: 'delivery validation treats font-family drift as blocking'
};

function severityPromotionsForMode(mode) {
  if (mode === 'delivery') return { ...FORMAL_PROMOTIONS, ...DELIVERY_PROMOTIONS };
  if (mode === 'formal') return { ...FORMAL_PROMOTIONS };
  return {};
}

function applyQualitySeverityPolicy(findings = [], mode = 'draft') {
  const promotions = severityPromotionsForMode(mode);
  const applied = findings.map(finding => {
    const reason = promotions[finding.type];
    if (!reason || finding.level === 'fail') return finding;
    return {
      ...finding,
      originalLevel: finding.level || 'review',
      level: 'fail',
      fatalBecauseOfQualityMode: mode,
      severityPolicyReason: reason
    };
  });
  return {
    findings: applied,
    policy: {
      version: 'quality-severity-policy/v1',
      mode,
      promotedTypes: Object.keys(promotions).sort()
    }
  };
}

module.exports = {
  DELIVERY_PROMOTIONS,
  FORMAL_PROMOTIONS,
  applyQualitySeverityPolicy,
  severityPromotionsForMode
};

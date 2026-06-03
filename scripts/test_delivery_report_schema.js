const assert = require('assert/strict');
const {
  assetDecisionSummary,
  deliveryMarkdown,
  deliveryReport,
  parseJsonFromOutput,
  validationMarkdown,
  validationReport,
  verificationReport
} = require('./reports/delivery-report');
const {
  assetDecisionSummary: directAssetDecisionSummary
} = require('./reports/asset-decision-summary');
const {
  deliveryReport: directDeliveryReport
} = require('./reports/delivery-summary-report');
const {
  parseJsonFromOutput: directParseJsonFromOutput
} = require('./reports/report-utils');
const {
  validationReport: directValidationReport
} = require('./reports/validation-report');
const {
  verificationReport: directVerificationReport
} = require('./reports/verification-report');

assert.equal(assetDecisionSummary, directAssetDecisionSummary);
assert.equal(deliveryReport, directDeliveryReport);
assert.equal(parseJsonFromOutput, directParseJsonFromOutput);
assert.equal(validationReport, directValidationReport);
assert.equal(verificationReport, directVerificationReport);

assert.deepEqual(parseJsonFromOutput('noise before\n{"ok":true,"count":2}\nnoise after'), {
  ok: true,
  count: 2
});
assert.equal(parseJsonFromOutput('not json'), null);

const validation = validationReport({
  success: true,
  file: 'deck.pptx',
  slide_count: 3,
  quality_mode: 'formal',
  preview: {
    status: 'metadata_fallback',
    provider: 'metadata_fallback',
    error: 'visual_preview_unavailable',
    detail: 'no provider',
    count: 0
  },
  render_meta_present: true,
  visual_qa: {
    success: true,
    severity_policy: {
      version: 'quality-severity-policy/v1',
      matrixVersion: 'quality-severity-matrix/v1',
      mode: 'formal',
      promotedTypes: ['renderMetaMissing'],
      categories: ['contract'],
      summary: { byLevel: { fail:0, review:0 }, byCategory: {} }
    },
    severity_summary: { byLevel: { fail:0, review:0 }, byCategory: {} }
  },
  checks: {
    exists: true,
    visual_qa_passed: true,
    chart_score: null,
    preview_available: false
  },
  next_actions: ['Install preview provider.']
});
assert.equal(validation.version, 'delivery-report-summary/v1');
assert.equal(validation.kind, 'validation');
assert.equal(validation.meta.previewStatus, 'metadata_fallback');
assert.ok(validation.sections.evidence.some(item => item.id === 'preview' && item.provider === 'metadata_fallback'));
assert.ok(validation.sections.evidence.some(item => item.id === 'render_meta' && item.present === true));
assert.ok(validation.sections.evidence.some(item => item.id === 'quality_severity_policy' && item.matrixVersion === 'quality-severity-matrix/v1'));
assert.ok(validation.sections.not_applicable.some(item => item.id === 'chart_score'));
assert.ok(validation.sections.risk.some(item => item.id === 'preview_available'));
assert.ok(validation.sections.unavailable.some(item => item.id === 'preview'));
assert.ok(validationMarkdown({ report: validation }).includes('## Evidence Snapshot'));

const assetSummary = assetDecisionSummary({
  slides: [{
    slide: 1,
    assetDecision: {
      action: 'skip_image',
      riskLevel: 'high',
      provenanceClass: 'none',
      proofEligibility: ['none'],
      authorizationStatus: 'none',
      boundAssetCount: 0,
      skippedCriticalVisual: true,
      originalRole: 'evidence',
      resolvedRole: 'solid',
      reason: 'user skipped factual evidence image',
      reviewRequired: true
    }
  }, {
    slide: 2,
    assetDecision: {
      action: 'bound_asset',
      riskLevel: 'low',
      provenanceClass: 'user-owned',
      proofEligibility: ['factual-proof'],
      authorizationStatus: 'cleared',
      boundAssetCount: 1
    }
  }, {
    slide: 3,
    assetDecision: {
      action: 'bound_asset',
      riskLevel: 'low',
      provenanceClass: 'public-licensed',
      proofEligibility: ['generic-category'],
      authorizationStatus: 'licensed',
      boundAssetCount: 1
    }
  }, {
    slide: 4,
    assetDecision: {
      action: 'bound_asset',
      riskLevel: 'low',
      provenanceClass: 'client-supplied',
      proofEligibility: ['factual-proof'],
      authorizationStatus: 'cleared',
      boundAssetCount: 1
    }
  }, {
    slide: 5,
    assetDecision: {
      action: 'bound_asset',
      riskLevel: 'medium',
      provenanceClass: 'model-generated-preview',
      proofEligibility: ['synthetic-only'],
      authorizationStatus: 'synthetic-only',
      boundAssetCount: 1,
      reviewRequired: true
    }
  }, {
    slide: 6,
    assetDecision: {
      action: 'bound_asset',
      riskLevel: 'medium',
      provenanceClass: 'synthetic-only',
      proofEligibility: ['synthetic-only'],
      authorizationStatus: 'synthetic-only',
      boundAssetCount: 1,
      reviewRequired: true
    }
  }, {
    slide: 7,
    assetDecision: {
      action: 'bound_asset',
      riskLevel: 'medium',
      provenanceClass: 'mixed',
      provenanceClasses: ['user-owned', 'public-licensed'],
      proofEligibility: ['factual-proof', 'generic-category'],
      authorizationStatus: 'mixed',
      boundAssetCount: 2,
      reviewRequired: true
    }
  }]
});
assert.equal(assetSummary.byAction.skip_image, 1);
assert.equal(assetSummary.byAction.bound_asset, 6);
assert.equal(assetSummary.boundAssetCount, 7);
assert.equal(assetSummary.byProvenanceClass.none, 1);
assert.equal(assetSummary.byProvenanceClass['user-owned'], 1);
assert.equal(assetSummary.byProvenanceClass['public-licensed'], 1);
assert.equal(assetSummary.byProvenanceClass['client-supplied'], 1);
assert.equal(assetSummary.byProvenanceClass['model-generated-preview'], 1);
assert.equal(assetSummary.byProvenanceClass['synthetic-only'], 1);
assert.equal(assetSummary.byProvenanceClass.mixed, 1);
assert.equal(assetSummary.byProvenanceClassDetail.none, 1);
assert.equal(assetSummary.byProvenanceClassDetail['user-owned'], 2);
assert.equal(assetSummary.byProvenanceClassDetail['public-licensed'], 2);
assert.equal(assetSummary.byProvenanceClassDetail['client-supplied'], 1);
assert.equal(assetSummary.byProvenanceClassDetail['model-generated-preview'], 1);
assert.equal(assetSummary.byProvenanceClassDetail['synthetic-only'], 1);
assert.equal(assetSummary.byProofEligibility.none, 1);
assert.equal(assetSummary.byProofEligibility['factual-proof'], 3);
assert.equal(assetSummary.byProofEligibility['generic-category'], 1);
assert.equal(assetSummary.byProofEligibility['synthetic-only'], 2);
assert.equal(assetSummary.byProofEligibilityDetail.none, 1);
assert.equal(assetSummary.byProofEligibilityDetail['factual-proof'], 3);
assert.equal(assetSummary.byProofEligibilityDetail['generic-category'], 2);
assert.equal(assetSummary.byProofEligibilityDetail['synthetic-only'], 2);
assert.equal(assetSummary.byAuthorizationStatus.none, 1);
assert.equal(assetSummary.byAuthorizationStatus.cleared, 2);
assert.equal(assetSummary.byAuthorizationStatus.licensed, 1);
assert.equal(assetSummary.byAuthorizationStatus['synthetic-only'], 2);
assert.equal(assetSummary.byAuthorizationStatus.mixed, 1);
assert.equal(assetSummary.byRiskLevel.low, 3);
assert.equal(assetSummary.byRiskLevel.medium, 3);
assert.equal(assetSummary.byRiskLevel.high, 1);
assert.equal(assetSummary.reviewRequiredCount, 4);
assert.equal(assetSummary.skippedCriticalVisuals.length, 1);
assert.deepEqual(assetSummary.mixedProvenanceSlides, [{
  slide: 7,
  provenanceClass: 'mixed',
  provenanceClasses: ['user-owned', 'public-licensed'],
  authorizationStatus: 'mixed',
  boundAssetCount: 2
}]);
assert.deepEqual(assetSummary.mixedProofEligibilitySlides, [{
  slide: 7,
  proofEligibility: ['factual-proof', 'generic-category'],
  proofEligibilitySummary: ''
}]);

const delivery = deliveryReport({
  status: 'complete',
  qualityMode: 'draft',
  steps: [
    { label: 'ingest', status: 'pass' },
    { label: 'validation', status: 'pass', stdout: '{"preview":{"status":"unavailable","provider":"unavailable","error":"visual_preview_unavailable"},"visual_qa":{"severity_policy":{"version":"quality-severity-policy/v1","matrixVersion":"quality-severity-matrix/v1","mode":"draft","promotedTypes":[],"categories":["contract"],"summary":{"byLevel":{"fail":0,"review":0},"byCategory":{}}},"severity_summary":{"byLevel":{"fail":0,"review":0},"byCategory":{}}}}' }
  ],
  outputs: { pptx: 'deck.pptx' },
  assetGate: { status: 'needs_user_input', questionCount: 2 },
  assetDecisionSummary: assetSummary,
  ocr: { providedCount: 1, possibleMissingCount: 2, needsConfirmationCount: 1 },
  criticBlockingFindings: [{ id: 'claim-risk', severity: 'high' }],
  nextActions: []
});
assert.equal(delivery.kind, 'delivery');
assert.equal(delivery.meta.previewStatus, 'unavailable');
assert.ok(delivery.sections.unavailable.some(item => /Preview/.test(item.label)));
assert.ok(delivery.sections.evidence.some(item => item.id === 'asset_gate' && item.status === 'needs_user_input'));
assert.ok(delivery.sections.evidence.some(item => item.id === 'asset_decisions' && item.summary.byAction.skip_image === 1));
assert.ok(delivery.sections.evidence.some(item => item.id === 'asset_decisions' && /public-licensed:1/.test(item.label)));
assert.ok(delivery.sections.evidence.some(item => item.id === 'asset_decisions' && /model-generated-preview:1/.test(item.label)));
assert.ok(delivery.sections.evidence.some(item => item.id === 'asset_decisions' && /synthetic-only:2/.test(item.label)));
assert.ok(delivery.sections.evidence.some(item => item.id === 'asset_decisions' && /provenance detail none:1, user-owned:2, public-licensed:2/.test(item.label)));
assert.ok(delivery.sections.evidence.some(item => item.id === 'asset_decisions' && /proof detail none:1, factual-proof:3, generic-category:2/.test(item.label)));
assert.ok(delivery.sections.evidence.some(item => item.id === 'asset_decisions' && /authorization none:1, cleared:2, licensed:1, synthetic-only:2, mixed:1/.test(item.label)));
assert.ok(delivery.sections.evidence.some(item => item.id === 'quality_severity_policy' && item.version === 'quality-severity-policy/v1'));
assert.ok(delivery.sections.risk.some(item => /critical visual asset decision/.test(item.label)));
assert.ok(delivery.sections.evidence.some(item => item.id === 'ocr' && item.needsConfirmationCount === 1));
assert.ok(delivery.sections.evidence.some(item => item.id === 'model_critic' && item.status === 'blocked'));
const deliveryMd = deliveryMarkdown({ report: delivery });
assert.ok(deliveryMd.includes('Model critic: blocked by 1 finding'));
assert.ok(deliveryMd.includes('provenance none:1, user-owned:1, public-licensed:1, client-supplied:1, model-generated-preview:1, synthetic-only:1, mixed:1'));
assert.ok(deliveryMd.includes('provenance detail none:1, user-owned:2, public-licensed:2, client-supplied:1, model-generated-preview:1, synthetic-only:1'));
assert.ok(deliveryMd.includes('proof none:1, factual-proof:3, generic-category:1, synthetic-only:2'));
assert.ok(deliveryMd.includes('proof detail none:1, factual-proof:3, generic-category:2, synthetic-only:2'));
assert.ok(deliveryMd.includes('authorization none:1, cleared:2, licensed:1, synthetic-only:2, mixed:1'));

const verification = verificationReport({
  success: true,
  qualityMode: 'formal',
  steps: [
    { name: 'skill metadata', status: 'pass' },
    { name: 'formal validation', status: 'pass' }
  ],
  previewMode: 'unavailable'
}, {
  hardening: { evidenceStrength: { strong: 1 } },
  template: { evidenceStrength: { strong: 2 } },
  validation: {
    preview: {
      status: 'unavailable',
      provider: 'unavailable',
      error: 'visual_preview_unavailable',
      detail: 'PPTX_DISABLE_KEYNOTE_PREVIEW=1'
    }
  }
});
assert.equal(verification.kind, 'delivery-verification');
assert.equal(verification.meta.previewProvider, 'unavailable');
assert.equal(verification.meta.hardeningEvidenceStrength.strong, 1);
assert.ok(verification.sections.evidence.some(item => item.id === 'hardening_evidence_strength' && /strong:1/.test(item.label)));
assert.ok(verification.sections.evidence.some(item => item.id === 'verification_steps' && item.passCount === 2));
assert.ok(verification.sections.pass.some(item => item.id === 'formal validation'));
assert.ok(verification.sections.unavailable.some(item => item.id === 'preview'));

console.log('delivery report schema ok');

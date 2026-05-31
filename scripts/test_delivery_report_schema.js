const assert = require('assert/strict');
const {
  deliveryReport,
  parseJsonFromOutput,
  validationReport,
  verificationReport
} = require('./reports/delivery-report');

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
  visual_qa: { success: true },
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
assert.ok(validation.sections.not_applicable.some(item => item.id === 'chart_score'));
assert.ok(validation.sections.risk.some(item => item.id === 'preview_available'));
assert.ok(validation.sections.unavailable.some(item => item.id === 'preview'));

const delivery = deliveryReport({
  status: 'complete',
  qualityMode: 'draft',
  steps: [
    { label: 'ingest', status: 'pass' },
    { label: 'validation', status: 'pass', stdout: '{"preview":{"status":"unavailable","provider":"unavailable","error":"visual_preview_unavailable"}}' }
  ],
  outputs: { pptx: 'deck.pptx' },
  nextActions: []
});
assert.equal(delivery.kind, 'delivery');
assert.equal(delivery.meta.previewStatus, 'unavailable');
assert.ok(delivery.sections.unavailable.some(item => /Preview/.test(item.label)));

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
assert.ok(verification.sections.pass.some(item => item.id === 'formal validation'));
assert.ok(verification.sections.unavailable.some(item => item.id === 'preview'));

console.log('delivery report schema ok');

const assert = require('assert/strict');
const {
  CLOSING_VARIANT_RENDERER_KEYS,
  closingRendererKey,
  closingTextForSlide
} = require('./render/page-families/closing-routing');

assert.equal(closingTextForSlide({
  title:'谢谢观看',
  subtitle:'期待交流',
  label:'Q&A',
  note:'后续联系'
}), '谢谢观看 期待交流 Q&A 后续联系');

assert.equal(closingRendererKey({ industry:'energy-utility' }, {}, {}), 'closingDark');
assert.equal(closingRendererKey({}, { closingVariant:'energy-stage' }, {}), 'closingDark');
assert.equal(closingRendererKey({}, {}, { variant:'premium-closing-anchor' }), 'premiumClosingAnchor');
assert.equal(closingRendererKey({}, { closingVariant:'simple-end' }, { variant:'simple-end' }), 'closingSimpleEnd');
assert.equal(closingRendererKey({}, { title:'谢谢观看' }, { variant:'' }), 'closingThankYou');
assert.equal(closingRendererKey({}, { closingVariant:'pilot-rollout' }, { variant:'pilot-rollout' }), 'closingManufacturingPilotRollout');
assert.equal(closingRendererKey({}, { closingVariant:'investment-decision' }, { variant:'investment-decision' }), 'closingFinanceInvestmentDecision');
assert.equal(closingRendererKey({}, { closingVariant:'quality-handoff' }, { variant:'quality-handoff' }), 'closingHealthcareQualityHandoff');
assert.equal(closingRendererKey({}, { closingVariant:'adoption-close' }, { variant:'adoption-close' }), 'closingSaasAdoptionClose');
assert.equal(closingRendererKey({}, { closingVariant:'decision-summary' }, { variant:'decision-summary' }), 'closingDecisionSummary');
assert.equal(closingRendererKey({}, { closingVariant:'governance-next-step' }, { variant:'governance-next-step' }), 'closingDecisionBoard');
assert.equal(closingRendererKey({}, { closingVariant:'contact-closing' }, { variant:'contact-closing' }), 'premiumClosingAnchor');
assert.equal(closingRendererKey({}, { closingVariant:'image' }, { variant:'image' }), 'closingImageStatement');
assert.equal(closingRendererKey({}, {}, { variant:'', hasImageStatement:true, coverTone:'light' }), 'closingImageStatement');
assert.equal(closingRendererKey({}, { closingVariant:'editorial-light' }, { variant:'editorial-light' }), 'closingEditorialLight');
assert.equal(closingRendererKey({}, {}, { coverTone:'split' }), 'closingEditorialLight');
assert.equal(closingRendererKey({}, {}, {}), 'closingDecisionBoard');

assert.equal(closingRendererKey({}, { closingVariant:'pilot-rollout', title:'谢谢观看' }, {
  variant:'pilot-rollout',
  isCompanyIntro:true
}), 'closingCompanyThanks');
assert.equal(closingRendererKey({}, { closingVariant:'contact-closing', title:'联系方式' }, {
  variant:'contact-closing',
  isCompanyIntro:true
}), 'closingCompanyThanks');
assert.equal(closingRendererKey({}, { closingVariant:'decision-summary', title:'谢谢观看' }, {
  variant:'decision-summary'
}), 'closingThankYou');

assert.equal(CLOSING_VARIANT_RENDERER_KEYS['premium-closing-anchor'], 'premiumClosingAnchor');

console.log('closing routing ok');

const assert = require('assert/strict');
const {
  camelProofField,
  keywordsForPackProof,
  profileFromIndustryPack,
  routeForPackProof,
  valueTitle
} = require('./design/proof-profile');

assert.equal(camelProofField('adoption-funnel'), 'adoptionFunnel');
assert.equal(camelProofField(''), '');
assert.equal(routeForPackProof('growth-kpi'), 'metric-comparison:growth-kpi');
assert.equal(routeForPackProof('risk-governance'), 'risk-table:risk-governance');
assert.equal(routeForPackProof('service-blueprint'), 'strategy-map:service-blueprint');
assert.equal(routeForPackProof('product-gallery'), 'case-gallery:product-gallery');
assert.equal(routeForPackProof('mission-statement'), 'manifesto:mission-statement');
assert.equal(routeForPackProof('plain-proof'), 'case-gallery:plain-proof');
assert.equal(valueTitle('product_gallery'), 'product gallery');

const keywords = keywordsForPackProof('adoption-funnel', {
  labelEn: 'SaaS platform',
  aliases: ['workflow']
});
assert.ok(keywords.includes('adoption'));
assert.ok(keywords.includes('SaaS'));
assert.ok(keywords.includes('平台'));
assert.ok(keywords.includes('adoption funnel'));

const profile = profileFromIndustryPack({
  id: 'saas-technology',
  labelZh: 'SaaS 科技',
  recommendedOutline: ['adoption', 'retention'],
  proofObjects: ['adoption-funnel', 'platform-capability-map', 'customer-proof-gallery'],
  pageFamilies: ['industry-chart'],
  forbiddenTemplates: ['generic-cards'],
  qaFocus: ['NRR']
});
assert.equal(profile.label, 'SaaS 科技');
assert.equal(profile.narrativeArchetype, 'adoption -> retention');
assert.deepEqual(profile.entities.risk, ['generic-cards']);
assert.ok(profile.entities.asset.includes('industry-chart'));
assert.equal(profile.proofObjects[0].route, 'adoption-funnel');
assert.equal(profile.proofObjects[1].fields[0], 'platformCapabilityMap');
assert.ok(profile.depthGates.requiredDomains.includes('system-map'));

assert.equal(profileFromIndustryPack(null), null);

console.log('design proof profile ok');

const assert = require('assert/strict');
const {
  createCompositionStrategyHelpers
} = require('./design/composition-strategy');

const helpers = createCompositionStrategyHelpers({
  accentRoleFor: () => 'data',
  compactUnique: values => Array.from(new Set(values.filter(Boolean))),
  contentSignals: (plan, slide) => Object.assign({
    imageCount: 0,
    hasMetrics: false,
    isDenseText: false
  }, slide.signals || {}),
  dialectColorCarriersFor: () => ['dialect-carrier'],
  dialectComponentsFor: () => ['dialect-chip', 'blocked-component'],
  explicitArtValue: (plan, slide, index, key) => slide.explicitArt && slide.explicitArt[key],
  flattenText: value => JSON.stringify(value),
  industryDesignDialect: () => ({ avoidComponents:['blocked-component'] }),
  industryPackFor: plan => {
    const map = {
      'finance-investment': { coverArchetype:'boardroom-proof-cover', closingArchetype:'investment-decision-close' },
      'manufacturing-operations': { coverArchetype:'native-industrial-structure-cover', closingArchetype:'decision-rollout-close' },
      'healthcare-operations': { coverArchetype:'clinical-quality-cover', closingArchetype:'quality-handoff-close' },
      'saas-technology': { coverArchetype:'platform-system-cover', closingArchetype:'adoption-rollout-close' },
      'beauty-consumer': { coverArchetype:'editorial-brand-cover', closingArchetype:'premium-editorial-close' },
      'lifestyle-food-tourism-fashion': { coverArchetype:'lifestyle-editorial-cover', closingArchetype:'experience-rollout-close' },
      'government-public-sector': { coverArchetype:'civic-executive-cover', closingArchetype:'governance-next-step-close' },
      'people-culture-company': { coverArchetype:'culture-soft-cover', closingArchetype:'contact-closing-close' }
    };
    return map[plan.industry] || null;
  },
  normalizeAssetRole: role => String(role || '').replace(/-photo$/, ''),
  palettes: {
    light: { presentation:{ coverTone:'light' } },
    dark: { presentation:{ coverTone:'dark' } }
  },
  selectPaletteName: plan => plan.palette || 'dark',
  slideDesign: (plan, slide) => slide.design || {},
  slideRole: slide => slide.role || 'content',
  slideWantsImage: (plan, slide) => slide.wantsImage === true,
  themeIntentFor: (plan, slide) => slide.themeIntent || 'narrative'
});

assert.equal(helpers.isCompanyIntroDeck({ title:'公司介绍' }), true);
assert.equal(helpers.isCompanyIntroDeck({ title:'季度经营复盘' }), false);

assert.equal(
  helpers.compositionNameFor({}, { wantsImage:true }, 'cover'),
  'brand-hero-showcase'
);
assert.equal(
  helpers.compositionNameFor({}, {}, 'cover'),
  'brand-hero-stage'
);
assert.equal(
  helpers.compositionNameFor({ industry:'finance-investment' }, {}, 'cover'),
  'boardroom-proof-stage'
);
assert.equal(
  helpers.compositionNameFor({ industry:'healthcare-operations' }, {}, 'cover'),
  'clinical-quality-brief'
);
assert.equal(
  helpers.compositionNameFor({ industry:'government-public-sector' }, {}, 'cover'),
  'civic-executive-stage'
);
assert.equal(
  helpers.compositionNameFor({ industry:'people-culture-company' }, { layoutVariant:'culture-cover-with-soft-geometry' }, 'cover', 'culture-cover-with-soft-geometry'),
  'culture-soft-hero'
);
assert.equal(
  helpers.compositionNameFor({ industry:'healthcare-operations' }, {}, 'closing', 'quality-handoff'),
  'healthcare-handoff-close'
);
assert.equal(
  helpers.compositionNameFor({ industry:'saas-technology' }, {}, 'closing', 'adoption-close'),
  'saas-adoption-close'
);
assert.equal(
  helpers.compositionNameFor({ industry:'people-culture-company', title:'公司介绍' }, {}, 'closing', 'company-thanks'),
  'company-thanks-stage'
);
assert.equal(
  helpers.compositionNameFor({ industry:'people-culture-company', title:'文化与组织介绍' }, {}, 'closing', 'contact-closing'),
  'contact-closing-board'
);
assert.equal(
  helpers.compositionNameFor({}, { signals:{ imageCount:2 } }, 'case-gallery', 'case-comparison'),
  'before-after-evidence-spread'
);
assert.equal(
  helpers.compositionNameFor({}, { themeIntent:'risk-warning' }, 'risk-table', 'manufacturing-action-loop'),
  'governance-loop-board'
);
assert.equal(
  helpers.compositionNameFor({ industry:'finance-investment' }, {}, 'risk-table', 'guidance-and-risk-board'),
  'finance-boundary-band-board'
);
assert.equal(
  helpers.compositionNameFor({ industry:'healthcare-operations' }, {}, 'industry-chart', 'quality-handoff'),
  'healthcare-handoff-stage-board'
);
assert.equal(
  helpers.compositionNameFor({ industry:'people-culture-company' }, {}, 'metric-comparison', 'company-profile-proof'),
  'people-growth-evidence-board'
);
assert.equal(
  helpers.compositionNameFor({ industry:'people-culture-company' }, {}, 'risk-table', 'governance-table-editorial'),
  'people-governance-banner-board'
);

assert.equal(helpers.rhythmRoleFor({}, { type:'closing' }, 4, 5), 'closer');
assert.equal(helpers.rhythmRoleFor({}, { type:'architecture' }, 1, 5), 'system');
assert.equal(helpers.themeCoverageFor({}, { type:'case-gallery', signals:{ imageCount:2 } }), 'medium');

assert.equal(
  helpers.backgroundToneFor({ palette:'light' }, { type:'cover' }, 0, 3),
  'accent-wash'
);
assert.equal(
  helpers.backgroundToneFor({ palette:'dark' }, { type:'cover' }, 0, 3),
  'dark-stage'
);
assert.equal(
  helpers.backgroundToneFor({}, { type:'closing', layoutVariant:'governance-next-step' }, 2, 3),
  'dark-stage'
);
assert.equal(
  helpers.backgroundToneFor({}, { type:'closing', layoutVariant:'investment-decision' }, 2, 3),
  'accent-wash'
);
assert.equal(
  helpers.backgroundToneFor({}, { explicitArt:{ backgroundTone:'custom-tone' } }, 1, 3),
  'custom-tone'
);

assert.deepEqual(
  helpers.primaryColorUseFor({}, { type:'metric-comparison' }, {}, 'medium', '', 'risk'),
  ['top-rule', 'page-number', 'watermark-circle', 'accent-rail', 'metric-highlight', 'priority-line', 'risk-band', 'dialect-carrier']
);

assert.equal(helpers.imageTreatmentFor({}, {}, {}, { imageCount:0 }), 'none');
assert.equal(
  helpers.imageTreatmentFor({}, { visual:{ role:'gallery-photo' } }, { wantsImage:true }, { imageCount:2 }),
  'hero-plus-supporting-evidence'
);

assert.deepEqual(
  helpers.microComponentsFor(
    { title:'公司介绍' },
    { type:'closing', design:{ wantsImage:true } },
    { imageCount:1, hasMetrics:false },
    { wantsImage:true },
    '',
    'action'
  ),
  ['top-rule', 'page-number', 'watermark-circle', 'source-caption', 'evidence-frame', 'dialect-chip', 'contact-block', 'back-cover-anchor', 'process-rail', 'decision-caption']
);

console.log('composition strategy helpers ok');

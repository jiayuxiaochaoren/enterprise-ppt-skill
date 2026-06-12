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
  helpers.compositionNameFor({}, { signals:{ imageCount:2 } }, 'case-gallery', 'case-comparison'),
  'before-after-evidence-spread'
);
assert.equal(
  helpers.compositionNameFor({}, { themeIntent:'risk-warning' }, 'risk-table', 'responsibility-loop'),
  'governance-loop-board'
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

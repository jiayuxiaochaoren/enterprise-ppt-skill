const assert = require('assert/strict');
const {
  createDeckRhythmHelpers
} = require('./design/deck-rhythm');

const helpers = createDeckRhythmHelpers({
  accentRoleFor: (plan, slide, i, total, intent) => intent === 'risk-warning' ? 'risk' : 'data',
  compactUnique: values => Array.from(new Set(values.filter(Boolean))),
  contentSignals: () => ({}),
  dataGrammarVariant: (plan, slide) => slide.dataComponent === 'waterfall' ? 'waterfall-bridge' : '',
  imageRefsForSlide: slide => slide.images || [],
  layoutEnergyFor: () => 'medium',
  normalizeSlide: (plan, slide) => Object.assign({}, slide, { normalized:true }),
  preferredProofObjectIdForTrace: slide => slide.proofObject || slide.layoutVariant || '',
  proofObjectIdForSlide: slide => slide.proofObject || slide.layoutVariant || '',
  rhythmTransitionFor: () => 'build',
  routeKey: slide => slide.layoutVariant ? `${slide.type}:${slide.layoutVariant}` : String(slide.type || ''),
  semanticColorRolesFor: (plan, role) => ({ activeRole:role }),
  themeIntentFor: (plan, slide) => slide.themeIntent || 'narrative',
  visualDensityFor: () => 'balanced'
});

const spine = helpers.claimSpineForSlides({}, [
  { type:'cover', title:'封面' },
  { type:'metric-comparison', title:'增长', subtitle:'收入提升', proofObject:'financial-kpi-snapshot', sourceTrace:{ sourceIds:['src-1'] }, proof:{ sourceIds:['src-1', 'src-2'] } },
  { type:'closing', title:'结束' }
]);
assert.deepEqual(spine, [{
  slide: 2,
  type: 'metric-comparison',
  title: '增长',
  claim: '收入提升',
  proofObject: 'financial-kpi-snapshot',
  sourceIds: ['src-1', 'src-2']
}]);

const diversified = helpers.applyDataComponentDiversity({}, [
  { type:'metric-comparison', layoutVariant:'readout', title:'A' },
  { type:'metric-comparison', layoutVariant:'readout', title:'B', dataComponent:'waterfall' },
  { type:'case-gallery', layoutVariant:'evidence-board', images:['a.png'], proofObject:'evidence-board', dataComponent:'waterfall' },
  { type:'timeline', layoutVariant:'process-board', phases:[{ title:'启动' }], dataComponent:'waterfall' }
]);
assert.equal(diversified[1].type, 'industry-chart');
assert.equal(diversified[1].layoutVariant, 'waterfall-bridge');
assert.equal(diversified[1].normalized, true);
assert.equal(diversified[2].type, 'case-gallery');
assert.equal(diversified[3].type, 'timeline');

const rhythmic = helpers.applyDeckRhythm({}, [
  { type:'cover', themeIntent:'industry-opening', compositionPlan:{} },
  { type:'metric-comparison', themeIntent:'value-signal', compositionPlan:{ themeCoverage:'low' } },
  { type:'case-gallery', themeIntent:'case-evidence', compositionPlan:{} },
  { type:'content', themeIntent:'narrative', compositionPlan:{} },
  { type:'content', themeIntent:'narrative', compositionPlan:{} },
  { type:'closing', themeIntent:'closing-anchor', compositionPlan:{} }
]);
assert.equal(rhythmic[0].compositionPlan.rhythmRole, 'opener');
assert.equal(rhythmic[0].compositionPlan.backgroundTone, 'accent-wash');
assert.ok(rhythmic[1].compositionPlan.primaryColorUse.includes('metric-highlight'));
assert.ok(rhythmic[1].compositionPlan.microComponents.includes('rhythm-anchor'));
assert.ok(rhythmic[2].compositionPlan.primaryColorUse.includes('caption-bar'));
assert.equal(rhythmic[5].compositionPlan.rhythmRole, 'closer');
assert.ok(rhythmic[5].compositionPlan.microComponents.includes('back-cover-anchor'));

console.log('deck rhythm helpers ok');

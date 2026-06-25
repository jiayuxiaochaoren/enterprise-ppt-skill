const assert = require('assert/strict');
const {
  createSlideNormalizationHelpers
} = require('./design/slide-normalization');
const {
  CHART_ROUTE_TYPES,
  createRouteSanitizationHelpers
} = require('./design/slide-route-sanitization');

const helpers = createSlideNormalizationHelpers({
  applyPlanAuthoredSourceTrace: (plan, slide, index) => Object.assign({}, slide, { sourceTraceApplied:index + 1 }),
  clampText: (text, max) => String(text || '').slice(0, max),
  compactUnique: values => Array.from(new Set(values.filter(Boolean))),
  componentPlanFor: () => ({
    version: 'component-plan/v1',
    components: [{ id:'kpi-strip' }],
    componentIds: ['kpi-strip'],
    rulesApplied: ['stub-component-plan']
  }),
  compositionPlan: () => ({
    version: 'composition-plan/v1',
    themeIntent: 'value-signal',
    accentRole: 'data',
    layoutEnergy: 'steady',
    visualDensity: 'balanced',
    rhythmTransition: 'build',
    microComponents: ['top-rule']
  }),
  contentSignals: (plan, slide) => slide.signals || {},
  flattenText: value => Array.isArray(value)
    ? value.filter(Boolean).map(item => typeof item === 'string' ? item : JSON.stringify(item)).join(' ')
    : JSON.stringify(value),
  generatedAssetPolicy: (plan, slide) => ({ status:slide.assetStatus || 'none' }),
  generatedAssetPrompt: () => 'GENERATED PROMPT',
  highValuePageFamilies: new Set(['bad-proof', 'culture-cover-with-soft-geometry']),
  industryPackFor: plan => ({
    'people-culture-company': { coverArchetype:'culture-soft-cover', dividerArchetype:'culture-sequence-divider' },
    'government-public-sector': { coverArchetype:'civic-executive-cover', dividerArchetype:'governance-briefing-divider' },
    'manufacturing-operations': { coverArchetype:'native-industrial-structure-cover', dividerArchetype:'industrial-structure-divider' }
  }[plan.industry] || null),
  layoutVariantCompatibleWithType: (type, variant) => !['bad-variant', 'bad-proof'].includes(variant),
  palettes: { dark:{ presentation:{ coverTone:'dark' } } },
  pickLayoutVariant: (plan, slide, type) => {
    if (slide.pickedVariant !== undefined) return slide.pickedVariant;
    if ((type === 'cover' || slide.forceType === 'cover') && plan.industry === 'manufacturing-operations') return '';
    return undefined;
  },
  recipeCompatibleWithSlideType: () => true,
  recommendSlideType: (plan, slide) => ({ type:slide.forceType || slide.type || 'executive-blocks', reason:'fixture route' }),
  routeChartSpec: () => ({ version:'chartSpec/v1', kind:'bar' }),
  selectPaletteName: () => 'dark',
  selectReferenceRecipe: (plan, slide) => slide.recipe || null,
  slideDesign: () => ({ wantsImage:false }),
  slideHasChartIntent: slide => slide.chartIntent !== false,
  visualSystem: {
    contentIntelligence: {
      claimSpine: { introMaxChars:12, cardBodyMaxChars:10 }
    }
  }
});

assert.equal(helpers.nativeVariantOwnsChartZone({ layoutVariant:'lookbook-story' }), true);
assert.equal(helpers.nativeVariantOwnsChartZone({
  layoutVariant:'lookbook-story',
  chartSpec:{ version:'chartSpec/v1' }
}), false);

assert.deepEqual(
  helpers.deriveMetricsFromSlide({
    cards:[
      { title:'收入', body:'提升 12%' },
      { title:'交付', body:'减少 3 天' }
    ]
  }),
  [
    { label:'收入', value:'12%', note:'提升 12%' },
    { label:'交付', value:'3 ', note:'减少 3 天' }
  ]
);
assert.equal(CHART_ROUTE_TYPES.has('metric-comparison'), true);
const routeSanitizationHelpers = createRouteSanitizationHelpers({
  highValuePageFamilies: new Set(['bad-proof']),
  layoutVariantCompatibleWithType: (type, variant) => type !== 'report-board' || !['bad-variant', 'bad-proof'].includes(variant)
});
const sanitizedRouteInput = routeSanitizationHelpers.sanitizeRouteInput({ finalized:true }, {
  type:'industry-chart',
  layoutVariant:'bad-variant',
  variant:'bad-variant',
  proofObject:'bad-proof',
  chartSpec:{ version:'chartSpec/v1', kind:'bar' },
  dataComponent:'bar',
  componentPlan:{ version:'component-plan/v1' },
  compositionPlan:{ version:'composition-plan/v1' },
  assetGeneration:{ status:'required' },
  generatedAssetPrompt:'OLD PROMPT'
}, { type:'report-board' });
assert.deepEqual(
  sanitizedRouteInput.routeSanitization.removed.map(item => item.field),
  ['layoutVariant', 'variant', 'proofObject', 'chartSpec', 'dataComponent', 'generatedAssetPrompt']
);
assert.deepEqual(
  sanitizedRouteInput.routeSanitization.suppressed.map(item => item.field),
  ['componentPlan', 'compositionPlan', 'assetGeneration']
);
assert.ok(sanitizedRouteInput.routeSanitization.staleForRoute.some(item => item.field === 'componentPlan' && item.resolution === 'recomputed'));
assert.equal(sanitizedRouteInput.routedInput.previousChartSpec.kind, 'bar');
assert.equal(sanitizedRouteInput.routedInput.componentPlan, undefined);

const sanitizedManufacturingCover = routeSanitizationHelpers.sanitizeRouteInput({
  finalized:true,
  industry:'manufacturing-operations',
  coverArchetype:'native-industrial-structure-cover'
}, {
  type:'cover',
  layoutVariant:'airy-concept-opening',
  variant:'airy-concept-opening'
}, { type:'cover' });
assert.deepEqual(
  sanitizedManufacturingCover.routeSanitization.removed.map(item => item.field),
  ['layoutVariant', 'variant']
);
assert.ok(
  sanitizedManufacturingCover.routeSanitization.removed.every(item => /industry-specific structural archetype/.test(item.reason)),
  'manufacturing cover should strip stale generic opening variants before recompute'
);

const sanitizedManufacturingClosing = routeSanitizationHelpers.sanitizeRouteInput({
  finalized:true,
  industry:'manufacturing-operations',
  closingArchetype:'decision-rollout-close'
}, {
  type:'closing',
  layoutVariant:'premium-closing-anchor',
  variant:'premium-closing-anchor'
}, { type:'closing' });
assert.deepEqual(
  sanitizedManufacturingClosing.routeSanitization.removed.map(item => item.field),
  ['layoutVariant', 'variant']
);

const sanitized = helpers.normalizeSlide({ finalized:true }, {
  forceType:'report-board',
  layoutVariant:'bad-variant',
  variant:'bad-variant',
  proofObject:'bad-proof',
  chartSpec:{ version:'chartSpec/v1', kind:'bar' },
  chartSpecInferred:true,
  dataComponent:'waterfall',
  componentPlan:{ version:'component-plan/v1', components:[{ id:'stale-widget' }], staleMarker:true },
  compositionPlan:{ version:'composition-plan/v1', microComponents:['stale-widget'], staleMarker:true },
  assetGeneration:{ status:'required' },
  generatedAssetPrompt:'OLD PROMPT',
  assetStatus:'required',
  title:'这是一个很长的标题用于截断 claim',
  cards:[{ title:'A', body:'123456789012345' }]
}, 2, 5);

assert.equal(sanitized.type, 'report-board');
assert.equal(sanitized.previousLayoutVariant, 'bad-variant');
assert.equal(sanitized.previousVariant, 'bad-variant');
assert.equal(sanitized.previousProofObject, 'bad-proof');
assert.deepEqual(
  sanitized.routeSanitization.removed.map(item => item.field),
  ['layoutVariant', 'variant', 'proofObject', 'chartSpec', 'dataComponent', 'generatedAssetPrompt']
);
assert.ok(sanitized.routeSanitization.recomputed.some(item => item.field === 'componentPlan'));
assert.ok(sanitized.routeSanitization.recomputed.some(item => item.field === 'compositionPlan'));
assert.ok(sanitized.routeSanitization.recomputed.some(item => item.field === 'assetGeneration'));
assert.deepEqual(
  sanitized.routeSanitization.suppressed.map(item => item.field),
  ['componentPlan', 'compositionPlan', 'assetGeneration']
);
assert.ok(sanitized.routeSanitization.staleForRoute.some(item => item.field === 'componentPlan' && item.resolution === 'recomputed'));
assert.ok(sanitized.routeSanitization.staleForRoute.some(item => item.field === 'generatedAssetPrompt' && item.resolution === 'removed'));
assert.equal(sanitized.routeSanitization.after.type, 'report-board');
assert.equal(sanitized.componentPlan.componentIds[0], 'kpi-strip');
assert.equal(sanitized.componentPlan.staleMarker, undefined);
assert.equal(sanitized.previousComponentPlan.staleMarker, true);
assert.equal(sanitized.previousCompositionPlan.staleMarker, true);
assert.equal(sanitized.compositionPlan.microComponents.includes('kpi-strip'), true);
assert.equal(sanitized.assetGeneration.previousDecisionStale, true);
assert.equal(sanitized.assetGeneration.decisionSource, 'asset-generation-policy/v1');
assert.equal(sanitized.generatedAssetPrompt, 'GENERATED PROMPT');
assert.equal(sanitized.claim, '这是一个很长的标题用于截');
assert.equal(sanitized.cards[0].body, '1234567890');
assert.equal(sanitized.sourceTraceApplied, 3);

const sameRouteStaleMetadata = helpers.normalizeSlide({}, {
  forceType:'industry-chart',
  type:'industry-chart',
  title:'同 route 旧执行元数据也要重算',
  componentPlan:{ version:'component-plan/v1', components:[{ id:'stale-widget' }], staleMarker:true },
  compositionPlan:{ version:'composition-plan/v1', themeIntent:'case-evidence', microComponents:['stale-chip'], staleMarker:true },
  assetGeneration:{ status:'required', role:'background', mustBind:true, staleMarker:true },
  generatedAssetPrompt:'OLD PROMPT',
  assetStatus:'none'
}, 0, 1);

assert.equal(sameRouteStaleMetadata.componentPlan.componentIds[0], 'kpi-strip');
assert.equal(sameRouteStaleMetadata.componentPlan.staleMarker, undefined);
assert.equal(sameRouteStaleMetadata.previousComponentPlan.staleMarker, true);
assert.equal(sameRouteStaleMetadata.previousCompositionPlan.staleMarker, true);
assert.equal(sameRouteStaleMetadata.previousAssetGeneration.staleMarker, true);
assert.equal(sameRouteStaleMetadata.compositionPlan.themeIntent, 'value-signal');
assert.equal(sameRouteStaleMetadata.compositionPlan.microComponents.includes('stale-chip'), false);
assert.equal(sameRouteStaleMetadata.assetGeneration.status, 'none');
assert.equal(sameRouteStaleMetadata.assetGeneration.previousDecisionStale, true);
assert.equal(sameRouteStaleMetadata.assetGeneration.decisionSource, 'asset-generation-policy/v1');
assert.equal(sameRouteStaleMetadata.generatedAssetPrompt, undefined);
assert.ok(sameRouteStaleMetadata.routeSanitization.suppressed.some(item => item.field === 'componentPlan'));
assert.ok(sameRouteStaleMetadata.routeSanitization.recomputed.some(item => item.field === 'assetGeneration'));

const sameRouteGeneratedModeStaleAsset = helpers.normalizeSlide({}, {
  forceType:'industry-chart',
  type:'industry-chart',
  title:'同 route generated mode 旧资产决策也要重算',
  visual:{ mode:'generated', role:'background' },
  assetGeneration:{ status:'required', role:'background', mustBind:true, reason:'old model route' },
  generatedAssetPrompt:'OLD MODEL PROMPT',
  assetStatus:'none'
}, 0, 1);

assert.equal(sameRouteGeneratedModeStaleAsset.previousAssetGeneration.reason, 'old model route');
assert.equal(sameRouteGeneratedModeStaleAsset.assetGeneration.status, 'none');
assert.equal(sameRouteGeneratedModeStaleAsset.assetGeneration.previousDecisionStale, true);
assert.equal(sameRouteGeneratedModeStaleAsset.assetGeneration.decisionSource, 'asset-generation-policy/v1');
assert.equal(sameRouteGeneratedModeStaleAsset.previousVisualMode, 'generated');
assert.equal(sameRouteGeneratedModeStaleAsset.visual.mode, undefined);
assert.equal(sameRouteGeneratedModeStaleAsset.generatedAssetPrompt, undefined);
assert.ok(sameRouteGeneratedModeStaleAsset.routeSanitization.suppressed.some(item => item.field === 'assetGeneration'));
assert.ok(sameRouteGeneratedModeStaleAsset.routeSanitization.removed.some(item => item.field === 'visual.mode'));
assert.ok(sameRouteGeneratedModeStaleAsset.routeSanitization.removed.some(item => item.field === 'generatedAssetPrompt'));

const sameRoutePolicySourceStaleAsset = helpers.normalizeSlide({}, {
  forceType:'industry-chart',
  type:'industry-chart',
  title:'同 route 旧 normalizer 资产决策也要重算',
  assetGeneration:{ decisionSource:'asset-generation-policy/v1', status:'required', role:'background', mustBind:true, reason:'previous normalized decision' },
  generatedAssetPrompt:'OLD NORMALIZED PROMPT',
  assetStatus:'none'
}, 0, 1);

assert.equal(sameRoutePolicySourceStaleAsset.previousAssetGeneration.reason, 'previous normalized decision');
assert.equal(sameRoutePolicySourceStaleAsset.assetGeneration.status, 'none');
assert.equal(sameRoutePolicySourceStaleAsset.assetGeneration.previousDecisionStale, true);
assert.equal(sameRoutePolicySourceStaleAsset.generatedAssetPrompt, undefined);
assert.ok(sameRoutePolicySourceStaleAsset.routeSanitization.suppressed.some(item => item.field === 'assetGeneration'));

const resolvedSkipAssetDecision = helpers.normalizeSlide({}, {
  forceType:'cover',
  type:'cover',
  title:'已解析跳过图片的封面',
  assetStatus:'required',
  assetGeneration:{
    decisionSource:'asset-decision-gate/v1',
    status:'none',
    action:'skip_image',
    mode:'structure-only',
    reason:'user chose to skip visual asset and use native structure'
  }
}, 0, 1);
assert.equal(resolvedSkipAssetDecision.assetGeneration.status, 'none');
assert.equal(resolvedSkipAssetDecision.assetGeneration.decisionSource, 'asset-decision-gate/v1');
assert.equal(resolvedSkipAssetDecision.generatedAssetPrompt, undefined);

const explicitManufacturingCoverStyle = helpers.normalizeSlide({}, {
  forceType:'cover',
  type:'cover',
  title:'制造经营复盘',
  subtitle:'产线交付与渠道效率的增长路径',
  coverStyle:'industrial-command-cover',
  coverStyleSource:'slide',
  compositionPlan:{ version:'composition-plan/v1', themeIntent:'stale-cover', staleMarker:true },
  assetGeneration:{
    decisionSource:'asset-decision-gate/v1',
    status:'required',
    role:'showcase',
    resolvedRole:'showcase',
    mustBind:true,
    reason:'user chose automatic synthetic asset generation'
  },
  generatedAssetPrompt:'SMART MANUFACTURING HERO'
}, 0, 1);
assert.equal(explicitManufacturingCoverStyle.coverStyle, 'industrial-command-cover');
assert.equal(explicitManufacturingCoverStyle.coverStyleSource, 'slide');
assert.equal(explicitManufacturingCoverStyle.previousCompositionPlan.staleMarker, true);
assert.equal(explicitManufacturingCoverStyle.assetGeneration.status, 'required');
assert.equal(explicitManufacturingCoverStyle.generatedAssetPrompt, 'SMART MANUFACTURING HERO');
assert.ok(
  explicitManufacturingCoverStyle.routeSanitization.removed.every(item => item.field !== 'coverStyle'),
  'authoritative coverStyle should survive composition recompute'
);

const metric = helpers.normalizeSlide({}, {
  forceType:'metric-comparison',
  title:'指标页',
  cards:[{ title:'收入', body:'提升 12%' }],
  pickedVariant:'financial-kpi-snapshot'
}, 0, 3);

assert.equal(metric.layoutVariant, 'financial-kpi-snapshot');
assert.deepEqual(metric.metrics, [{ label:'收入', value:'12%', note:'提升 12%' }]);
assert.equal(metric.chartSpec.version, 'chartSpec/v1');
assert.equal(metric.chartSpecInferred, true);
assert.equal(metric.themeIntent, 'value-signal');
assert.equal(metric.accentRole, 'data');

const normalizedGovernmentDivider = helpers.normalizeSlide({ industry:'government-public-sector' }, {
  forceType:'toc-clean',
  type:'toc-clean',
  layoutVariant:'chapter-hero',
  title:'阅读路径',
  items:['政策来源', '资源地图', '推进机制']
}, 1, 3);
assert.equal(normalizedGovernmentDivider.layoutVariant, 'board-briefing');
assert.equal(normalizedGovernmentDivider.previousLayoutVariant, 'chapter-hero');

const normalizedManufacturingCover = helpers.normalizeSlide({ industry:'manufacturing-operations' }, {
  forceType:'cover',
  type:'cover',
  layoutVariant:'airy-concept-opening',
  title:'恒越精工能力介绍'
}, 0, 1);
assert.equal(normalizedManufacturingCover.layoutVariant, '');
assert.equal(normalizedManufacturingCover.variant, '');
assert.equal(normalizedManufacturingCover.previousLayoutVariant, 'airy-concept-opening');

const normalizedPeopleCultureCover = helpers.normalizeSlide({ industry:'people-culture-company' }, {
  forceType:'cover',
  type:'cover',
  layoutVariant:'airy-concept-opening',
  title:'星火数科文化与组织介绍',
  subtitle:'用使命、团队证据和价值观行为说明公司为什么值得加入'
}, 0, 1);
assert.equal(normalizedPeopleCultureCover.layoutVariant, 'culture-cover-with-soft-geometry');
assert.equal(normalizedPeopleCultureCover.variant, 'culture-cover-with-soft-geometry');
assert.equal(normalizedPeopleCultureCover.previousLayoutVariant, 'airy-concept-opening');
assert.equal(normalizedPeopleCultureCover.proofObject, 'culture-cover-with-soft-geometry');
assert.equal(normalizedPeopleCultureCover.renderFamilySelected, 'cover:culture-cover-with-soft-geometry');

console.log('slide normalization helpers ok');

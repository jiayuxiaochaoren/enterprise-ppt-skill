const assert = require('assert/strict');
const designSystem = require('./design-system');
const {
  copyPolicyList,
  copyPolicyText,
  industryBenchmarksFor,
  industryMatchIds,
  visualIndustryId
} = designSystem;
const {
  createIndustryRuntime
} = require('./design/industry-runtime');
const {
  createArtDirectionHelpers
} = require('./design/art-direction');
const {
  BASE_COLORS,
  createStyleProfileHelpers,
  paletteToColors
} = require('./design/style-profile');
const {
  createVisualMediaHelpers
} = require('./design/visual-media');
const {
  createAestheticModelHelpers
} = require('./design/aesthetic-model');
const {
  addComponent,
  componentIdFromHint,
  createComponentPlanHelpers,
  hasContactBlockData,
  isSystemPlannedComponent,
  normalizeComponentEntry,
  normalizeComponentId
} = require('./design/component-planning');
const {
  createComponentPlanAuditHelpers
} = require('./design/component-plan-audit');
const {
  createCompositionPlanningHelpers
} = require('./design/composition-planning');
const {
  createNarrativeHelpers
} = require('./design/narrative');
const {
  INDUSTRY_EXPRESSION_RULES,
  INDUSTRY_KNOWLEDGE_BASE,
  SEMANTIC_RELATION_PATTERNS,
  VISIBLE_PRODUCTION_COPY_BANS
} = require('./design/industry-knowledge');

assert.equal(visualIndustryId('industrial-energy'), 'manufacturing-operations');
assert.ok(industryMatchIds('brand-retail').includes('beauty-consumer'));
assert.equal(designSystem.INDUSTRY_KNOWLEDGE_BASE, INDUSTRY_KNOWLEDGE_BASE);
assert.ok(INDUSTRY_EXPRESSION_RULES['brand-retail'].requiredRoutes.includes('industry-chart:waterfall-bridge'));
assert.ok(INDUSTRY_KNOWLEDGE_BASE['saas-technology'].proofObjects.some(item => item.id === 'adoption-funnel'));
assert.ok(SEMANTIC_RELATION_PATTERNS.cause.test('因为响应慢导致流失'));
assert.ok(VISIBLE_PRODUCTION_COPY_BANS.some(pattern => pattern.test('材料显示增长来自渠道修复')));
assert.equal(designSystem.BASE_COLORS, BASE_COLORS);
const styleHelpers = createStyleProfileHelpers({ fontStack: { zh:'ZH', latin:'LATIN', number:'NUM' } });
assert.equal(styleHelpers.resolveStyleProfile('premium-commercial-keynote').font, 'ZH');
assert.equal(styleHelpers.resolveStyleProfile('premium-consulting-keynote').density, 'consulting');
assert.equal(paletteToColors({ accent:'123456', secondary:'ABCDEF' }).accent, '123456');
assert.equal(designSystem.paletteToColors({ accent:'123456', secondary:'ABCDEF' }).cyan, 'ABCDEF');
const artHelpers = createArtDirectionHelpers({
  compactUnique: values => Array.from(new Set(values.filter(Boolean))),
  contentSignals: () => ({ hasMetrics:false, isNumberHeavy:false, imageCount:0 }),
  flattenText: value => JSON.stringify(value),
  industryDesignDialect: () => ({ defaultPalette:'dialect-palette' }),
  industryVisualPolicy: () => ({ defaultPalette:'policy-palette' }),
  slideRole: () => 'content',
  visualSystem: { semanticColorRoles: { roles: { evidence: { token:'success', carriers:['caption'] } } } }
});
assert.equal(artHelpers.selectPaletteName({}), 'dialect-palette');
assert.equal(artHelpers.themeIntentFor({}, { type:'metric-comparison' }, 1, 3), 'value-signal');
assert.equal(artHelpers.accentRoleFor({}, { type:'metric-comparison' }, 1, 3, 'value-signal'), 'data');
assert.deepEqual(artHelpers.semanticColorRolesFor({}, 'evidence').carrierGuidance, ['caption']);
assert.equal(normalizeComponentId('Hero KPI Strip'), 'hero-kpi-strip');
assert.equal(componentIdFromHint('metric_strip'), 'kpi-strip');
assert.deepEqual(
  normalizeComponentEntry({ name:'source-caption', required:false }, 'fixture'),
  { id:'caption-bar', role:'', required:false, source:'fixture', renderer:'auto', name:'source-caption' }
);
const plannedComponents = [];
addComponent(plannedComponents, 'metric-strip', 'rule');
addComponent(plannedComponents, 'hero-kpis', 'rule');
assert.deepEqual(plannedComponents.map(item => item.id), ['kpi-strip']);
assert.equal(isSystemPlannedComponent({ source:'metric-signal' }), true);
assert.equal(isSystemPlannedComponent({ source:'explicit-plan' }), false);
assert.equal(hasContactBlockData({ contact: { email:'hello@example.com' } }, {}), true);
const componentPlanHelpers = createComponentPlanHelpers({
  chartSpecToComponentId: spec => spec.kind === 'bar' ? 'bar-chart' : '',
  compactUnique: values => Array.from(new Set(values.filter(Boolean))),
  componentCapabilityFor: id => ({ supportedModes:['native'], ownershipPolicy:'native', family:`fixture:${id}`, dataRequirements:[] }),
  contentSignals: () => ({ hasMetrics:true, metricCount:1, imageCount:0 }),
  dialectComponentsFor: () => ['metric-strip'],
  flattenText: value => JSON.stringify(value),
  hasExplicitChartSignal: () => true,
  industryDesignDialect: () => ({ avoidComponents:[] }),
  proofObjectIdForSlide: s => s.layoutVariant || '',
  routeChartSpec: () => ({ kind:'bar' }),
  slideHasChartIntent: () => true,
  themeIntentFor: () => 'value-signal'
});
const componentPlan = componentPlanHelpers.componentPlanFor({}, { type:'metric-comparison', layoutVariant:'growth-kpi', chartSpec:{ kind:'bar' } });
assert.equal(componentPlan.version, 'component-plan/v1');
assert.ok(componentPlan.componentIds.includes('kpi-strip'));
assert.ok(componentPlan.componentIds.includes('kpi-primary-metric'));
assert.ok(componentPlan.componentIds.includes('bar-chart'));
const compositionHelpers = createCompositionPlanningHelpers({
  accentRoleFor: () => 'data',
  backgroundToneFor: () => 'light',
  compactUnique: values => Array.from(new Set(values.filter(Boolean))),
  compositionNameFor: () => 'metric-comparison/value-signal',
  contentSignals: () => ({ isDenseText:false }),
  dialectComponentsFor: () => ['kpi-strip'],
  imageTreatmentFor: () => ({ mode:'fit' }),
  industryDesignDialect: () => ({ name:'test', motif:'rail', principle:'tight', primaryColorLogic:'accent' }),
  layoutEnergyFor: () => 'steady',
  microComponentsFor: () => ['kpi-strip'],
  primaryColorUseFor: () => 'accent',
  rhythmRoleFor: () => 'body',
  rhythmTransitionFor: () => 'build',
  semanticColorRolesFor: () => ({ token:'success' }),
  slideDesign: () => ({ wantsImage:true }),
  slideRole: () => 'content',
  themeCoverageFor: () => 'medium',
  themeIntentFor: () => 'value-signal',
  visualDensityFor: () => 'balanced'
});
assert.deepEqual(
  compositionHelpers.zonePlanFor({}, { type:'case-gallery', layoutVariant:'evidence-board' }, {}, {}),
  { primaryZone:'evidence-grid', secondaryZone:'caption-system', proofZone:'source-note' }
);
const fixtureComposition = compositionHelpers.compositionPlan({}, { type:'metric-comparison' }, 0, 1, { isDenseText:false }, { id:'recipe-1', componentHints:['caption-bar'] }, { wantsImage:true });
assert.equal(fixtureComposition.version, 'composition-plan/v1');
assert.equal(fixtureComposition.layoutPlan.primaryZone, 'metric-readout');
assert.deepEqual(fixtureComposition.microComponents, ['kpi-strip', 'caption-bar']);
assert.equal(fixtureComposition.referenceRecipeId, 'recipe-1');
const visualHelpers = createVisualMediaHelpers({
  assetDir: '/tmp/assets',
  assetRoleNeedsImage: role => /photo/.test(String(role || '')),
  industryVisualPolicy: () => ({ visualMode:'hybrid', defaultImageRoles: { situation:'evidence' }, photoRoles:['cover'] }),
  mediaAssets: { energyStorageCover:'/media/cover.jpg', energyStorageBand:'/media/band.jpg', energyStorageDetail:'/media/detail.jpg' },
  normalizeAssetRole: role => String(role || '').replace(/-photo$/, ''),
  visualRouter: { layoutFamilies: { cover: { showcase:'custom-cover' } } },
  visualSystem: { mediaDefaults: { demo: { cover:'assets/demo-cover.jpg' } } }
});
assert.equal(visualHelpers.slideRole({ type:'case-gallery' }), 'case-gallery');
assert.equal(visualHelpers.visualRole({ industry:'demo' }, { type:'company-profile-spread' }), 'evidence');
assert.equal(visualHelpers.slideWantsImage({ visualMode:'solid' }, { type:'cover' }, 'cover'), false);
assert.equal(visualHelpers.resolveAssetPath('assets/demo.png'), '/tmp/assets/demo.png');
assert.equal(visualHelpers.defaultIndustryMedia({ industry:'energy-utility' }, 'timeline'), '/media/band.jpg');
assert.equal(visualHelpers.pageFamily({}, { type:'cover', visualMode:'photo' }, 'cover'), 'custom-cover');
assert.equal(copyPolicyText('__missing__', '__missing_key__', 'fallback text'), 'fallback text');
assert.deepEqual(copyPolicyList('__missing__', '__missing_list__', ['a', 'b']), ['a', 'b']);
assert.deepEqual(industryBenchmarksFor('__missing__'), []);

const runtime = createIndustryRuntime({
  industryDesignDialects: { target: {} },
  visualRouter: { industries: { routed: {} } },
  industryPackLibrary: {
    packs: [
      { id:'target', aliases:['custom alias'] }
    ]
  },
  copyPolicy: {
    version:'copy-policy/test',
    global: {
      rendererFallbacks: { headline:'global headline' },
      tags: ['global']
    },
    industries: {
      target: {
        rendererFallbacks: { headline:'target headline' },
        tags: ['target']
      },
      aliasOnly: { aliasOf:'target' },
      'general-operations': {
        rendererFallbacks: { headline:'general headline' }
      }
    }
  },
  industryBenchmarks: {
    aliases: { aliasTarget:'target' },
    industries: {
      target: [{ label:'benchmark' }]
    }
  },
  aliases: {
    aliasTarget:'target'
  }
});

assert.equal(runtime.visualIndustryId('aliasTarget'), 'target');
assert.ok(runtime.industryMatchIds('target').includes('aliasTarget'));
assert.equal(runtime.industryPackFor('custom alias').id, 'target');
assert.equal(runtime.copyPolicyText('aliasOnly', 'headline'), 'target headline');
const tags = runtime.copyPolicyList('aliasOnly', 'tags');
tags.push('mutated');
assert.deepEqual(runtime.copyPolicyList('aliasOnly', 'tags'), ['target']);
assert.deepEqual(runtime.industryBenchmarksFor('aliasTarget'), [{ label:'benchmark' }]);

const narrativeHelpers = createNarrativeHelpers({
  contentSignals: () => ({}),
  semanticFrame: (plan, slide) => ({
    primaryIntent: slide.type === 'case-gallery' ? 'caseEvidence' : 'narrative',
    confidence: 0.7,
    proofObject: slide.type === 'case-gallery' ? 'evidence-gallery' : 'narrative-block',
    semanticMeaning: {
      materialPurpose: slide.type === 'case-gallery' ? 'evidence' : 'narrative',
      relations: { evidence: slide.type === 'case-gallery' },
      entities: ['asset'],
      scores: { industryFit: 0.8 },
      proofCandidates: [{ id:'gallery', route:'case-gallery', score:4 }]
    }
  }),
  semanticMeaning: () => ({
    materialPurpose: 'evidence',
    relations: { evidence:true },
    entities: ['asset'],
    scores: { industryFit:0.8 },
    proofCandidates: [{ id:'gallery', route:'case-gallery', score:4 }]
  }),
  highValuePageFamilies: new Set(['case-gallery']),
  layoutVariantCompatibleWithType: () => true
});
assert.equal(narrativeHelpers.routeKey({ type:'case-gallery', layoutVariant:'case-gallery' }), 'case-gallery:case-gallery');
assert.equal(narrativeHelpers.routeMatches('case-gallery:case-gallery', 'case-gallery'), true);
const annotatedNarrative = narrativeHelpers.applyNarrativeMetadata({}, [
  { type:'cover' },
  { type:'case-gallery', layoutVariant:'case-gallery' },
  { type:'closing' }
]);
assert.equal(annotatedNarrative[1].narrativeRole, 'evidence');
assert.equal(annotatedNarrative[1].proofObject, 'case-gallery');
assert.equal(narrativeHelpers.deckNarrativeSummary({}, annotatedNarrative).roleCounts.evidence, 1);

const aestheticHelpers = createAestheticModelHelpers({
  contentSignals: () => ({ isDenseText:true, cardCount:6, itemCount:0, imageCount:3 }),
  flattenText: value => JSON.stringify(value),
  normalizeDeckPlan: plan => plan,
  routeKey: slide => slide.layoutVariant ? `${slide.type}:${slide.layoutVariant}` : slide.type,
  semanticMeaning: () => ({ materialPurpose:'evidence', scores:{ evidenceStrength:0.2, industryFit:0.1 } }),
  slideRole: slide => slide.narrativeRole || slide.type || 'content'
});
assert.equal(aestheticHelpers.hasCommercialLogicChain({
  businessLogic: { currentState:'slow response', action:'routing change' }
}), true);
const aestheticScore = aestheticHelpers.aestheticSlideScore({ industry:'demo' }, {
  type:'executive-blocks',
  layoutRationale:'default commercial split',
  images: ['1', '2', '3']
}, 0, 1);
assert.ok(aestheticScore.flags.includes('denseTextOnLooseLayout'));
assert.ok(aestheticScore.flags.includes('imageEvidenceWithoutLabels'));
const aestheticModel = aestheticHelpers.visualAestheticModel({
  slides: [
    { type:'cover' },
    { type:'executive-blocks', layoutRationale:'default commercial split', images:['1', '2', '3'] }
  ]
});
assert.equal(aestheticModel.routeCounts['executive-blocks'], 1);

const componentAuditHelpers = createComponentPlanAuditHelpers({
  flattenText: value => JSON.stringify(value),
  hasComponentCapability: id => id === 'risk-register',
  normalizeDeckPlan: plan => plan
});
const componentAudit = componentAuditHelpers.componentPlanAudit({}, {
  slides: [{
    type:'executive-blocks',
    componentPlan: {
      version:'component-plan/v1',
      components:[{ id:'risk-register', required:true }]
    }
  }]
});
assert.ok(componentAudit.findings.some(f => f.type === 'riskRegisterWithoutRows'));

console.log('design system modules ok');

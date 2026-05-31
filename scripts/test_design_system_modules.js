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
  addComponent,
  componentIdFromHint,
  hasContactBlockData,
  isSystemPlannedComponent,
  normalizeComponentEntry,
  normalizeComponentId
} = require('./design/component-planning');
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

console.log('design system modules ok');

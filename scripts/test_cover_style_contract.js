#!/usr/bin/env node
const assert = require('assert/strict');
const {
  coverStyleForPlan,
  generatedAssetPrompt,
  normalizeDeckPlan,
  selectPaletteName,
  slideDesign
} = require('./design-system');

assert.equal(
  coverStyleForPlan({ coverStyle:'eastern-void-object' }, { type:'cover' }),
  'eastern-void-object',
  'explicit plan coverStyle should win'
);

assert.equal(
  coverStyleForPlan({ coverStyle:'signal-atlas-command' }, { type:'cover', coverStyle:'cold-luxury-product' }),
  'cold-luxury-product',
  'slide coverStyle should override plan coverStyle'
);

assert.equal(
  coverStyleForPlan({ coverStyle:'auto', industry:'manufacturing-operations' }, { type:'cover', title:'产线重构计划' }),
  'industrial-swiss-line',
  'auto coverStyle should infer from industry and title'
);

assert.equal(
  coverStyleForPlan({ industry:'government-public-sector' }, { type:'cover', title:'产业园区治理与招商汇报' }),
  'signal-atlas-command',
  'government cover should inherit civic cover style from industry pack archetype'
);

assert.equal(
  coverStyleForPlan({ industry:'healthcare-operations' }, { type:'cover', title:'门诊服务质量改善方案' }),
  'editorial-proof-report',
  'healthcare cover should inherit clinical cover style from industry pack archetype'
);

assert.equal(
  coverStyleForPlan({ coverStyle:'auto', industry:'brand-retail' }, { type:'cover', title:'NorthBay Living 跨境电商经营复盘', subtitle:'五个平台收入、SKU 组合和复购承接' }),
  'brand-system-board',
  'commerce platform wording should infer retail brand style instead of architecture blueprint'
);
const brandPrompt = generatedAssetPrompt(
  { coverStyle:'brand-system-board' },
  { type:'cover', title:'NorthBay Living 跨境电商经营复盘', visual:{ role:'showcase' } }
);
assert.match(brandPrompt, /right-side hero panel|continuous edge-to-edge/i);
assert.doesNotMatch(brandPrompt, /text-safe zone|safe zone/i);

assert.equal(
  selectPaletteName({ coverStyle:'eastern-void-object' }),
  'graphite-ivory',
  'coverStyle preset palette should become deck palette when no explicit palette is set'
);

assert.equal(
  selectPaletteName({ industry:'brand-retail', palette:'consumer-commerce-teal-coral' }),
  'consumer-commerce-teal-coral',
  'explicit commerce palette should not fall back to the generic retail redline palette'
);

const design = slideDesign(
  { coverStyle:'eastern-void-object' },
  { type:'cover', title:'长期主义价值判断' },
  'cover'
);
assert.equal(design.coverStyle, 'eastern-void-object');
assert.equal(design.coverStylePreset.rendererFlavor, 'object-still-life-void');
assert.equal(design.imageRole, 'object-still-life');
assert.equal(design.contentTheme.backgroundPolicy, 'warm-paper-void');
assert.equal(design.wantsImage, true);

const normalized = normalizeDeckPlan({
  title: '长期主义价值判断',
  coverStyle: 'eastern-void-object',
  slides: [
    { type:'cover', title:'长期主义价值判断', subtitle:'以真实纸雕器物摄影建立高级感' },
    { type:'metric-comparison', title:'判断标准', metrics:[{ label:'周期', value:'5年' }] },
    { type:'closing', title:'回到长期价值' }
  ]
});
const cover = normalized.slides[0];
assert.equal(cover.coverStyle, 'eastern-void-object');
assert.equal(cover.compositionPlan.coverStyle, 'eastern-void-object');
assert.equal(cover.assetGeneration.coverStyle, 'eastern-void-object');
assert.equal(cover.assetGeneration.status, 'required');
assert.match(cover.generatedAssetPrompt, /paper sculpture|still life|text-safe zone/i);

const content = normalized.slides[1];
assert.equal(content.coverStyle, 'eastern-void-object');
assert.equal(content.contentTheme.backgroundPolicy, 'warm-paper-void');

const closing = normalized.slides[2];
assert.equal(closing.coverStyle || '', '', 'closing should not inherit cover-only style authority');
assert.equal(closing.contentTheme || null, null, 'closing should not persist cover content theme');

const normalizedAuto = normalizeDeckPlan({
  title: '产线重构计划',
  coverStyle: 'auto',
  industry: 'manufacturing-operations',
  slides: [
    { type:'cover', title:'产线重构计划' }
  ]
});
assert.equal(normalizedAuto.slides[0].coverStyleSource, 'auto');
assert.equal(slideDesign(normalizedAuto, normalizedAuto.slides[0], 'cover').coverStyleSource, 'auto');

const factual = normalizeDeckPlan({
  title: '客户现场价值证据',
  coverStyle: 'documentary-evidence-wall',
  slides: [
    { type:'cover', title:'客户现场价值证据', subtitle:'真实客户现场案例复盘' }
  ]
}).slides[0];
assert.equal(factual.assetGeneration.status, 'blocked');
assert.match(factual.assetGeneration.reason, /factual|visible content|generated assets/i);

const prompted = generatedAssetPrompt(
  { coverStyle:'architecture-blueprint-studio' },
  { type:'cover', title:'平台架构能力蓝图' }
);
assert.match(prompted, /architecture blueprint studio|text-safe zone|no readable text/i);

console.log('cover style contract ok');

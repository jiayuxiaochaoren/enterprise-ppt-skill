const assert = require('assert/strict');
const {
  chartAcceptanceGate,
  chartSemanticQA,
  chartSpecToComponentId,
  chartVisualQA,
  pageLevelChartScores,
  routeChartSpec
} = require('./chart-spec');
const { normalizeDeckPlan } = require('./design-system');

function spec(plan, slide) {
  return routeChartSpec(plan, normalizeDeckPlan({ ...plan, slides: [slide] }).slides[0], { index: 1, total: 1 });
}

const beauty = { industry: 'beauty-consumer' };

const trend = spec(beauty, {
  type: 'content',
  title: 'Monthly pulse trend',
  dataComponent: 'trend-line',
  monthlyPulse: [
    { label: 'Jan', value: '456w' },
    { label: 'Feb', value: '402w' },
    { label: 'Mar', value: '618w' }
  ],
  sourceTrace: { sourceIds: ['src-monthly'] }
});
assert.equal(trend.version, 'chartSpec/v1');
assert.equal(trend.kind, 'line');
assert.equal(trend.source, 'repair');
assert.equal(chartSpecToComponentId(trend), 'line-chart');
assert.equal(trend.dataQuality.sufficient, true);

const fakeTrend = spec(beauty, {
  type: 'content',
  title: 'Monthly pulse trend',
  dataComponent: 'trend-line',
  monthlyPulse: [{ label: 'Jan', value: '456w' }]
});
assert.equal(fakeTrend.kind, 'informationGap');
assert.match(fakeTrend.informationGap.reason, /折线图/);

const singleKpi = spec({ industry: 'general-operations' }, {
  type: 'content',
  title: 'One number only',
  metrics: [{ label: 'Revenue', value: '42%' }]
});
assert.equal(singleKpi.kind, 'kpi');

const explicitPlannerSpec = spec({ industry: 'general-operations' }, {
  type: 'metric-comparison',
  title: 'Planner supplied bar chart',
  chartSpec: {
    version: 'chartSpec/v1',
    kind: 'bar',
    title: 'Planner supplied bar chart',
    categories: ['A', 'B'],
    series: [{ name: 'Series', values: [{ category: 'A', value: 1 }, { category: 'B', value: 2 }] }]
  }
});
assert.equal(explicitPlannerSpec.source, 'planner');

const unknownKindAudit = chartSemanticQA({ industry: 'general-operations' }, normalizeDeckPlan({
  industry: 'general-operations',
  slides: [{
    type: 'metric-comparison',
    title: 'Unknown chart kind should fail',
    chartSpec: {
      version: 'chartSpec/v1',
      kind: 'radar',
      title: 'Unsupported radar chart',
      categories: ['A', 'B'],
      series: [{ name: 'Series', values: [{ category: 'A', value: 1 }, { category: 'B', value: 2 }] }]
    }
  }]
}));
assert.equal(unknownKindAudit.status, 'fail');
assert.equal(unknownKindAudit.findings[0].type, 'chartSpecUnknownKind');

const explicitGapAudit = chartSemanticQA({ industry: 'general-operations' }, normalizeDeckPlan({
  industry: 'general-operations',
  slides: [{
    type: 'metric-comparison',
    title: 'Planner requested visible gap',
    allowInformationGap: true,
    chartSpec: {
      version: 'chartSpec/v1',
      kind: 'informationGap',
      requestedKind: 'radar',
      informationGap: { reason: 'Radar chart is intentionally unsupported.', missingFields: ['radar'], policy: 'explicit-gap' }
    }
  }]
}));
assert.equal(explicitGapAudit.status, 'review');
assert.equal(explicitGapAudit.findings[0].type, 'chartInformationGap');

const strictRepairGate = chartAcceptanceGate({ industry: 'general-operations' }, normalizeDeckPlan({
  industry: 'general-operations',
  outputIntent: 'formal',
  requestedSlideCount: 1,
  slides: [{
    type: 'metric-comparison',
    title: 'Renderer inferred chart spec',
    claim: 'This chart is inferred from metrics.',
    metrics: [{ label: 'A', value: '1%' }, { label: 'B', value: '2%' }]
  }]
}), { slides: [{ slide: 1, missingRequiredComponents: [] }] }, { strict: true });
assert.equal(strictRepairGate.status, 'fail');
assert.equal(strictRepairGate.findings.some(f => f.type === 'acceptanceChartSpecRepairInStrictMode'), true);

const waterfall = spec(beauty, {
  type: 'content',
  title: 'Target bridge',
  dataComponent: 'waterfall-bridge',
  bridge: [
    { label: 'Start', value: 100, kind: 'start' },
    { label: 'Driver', value: 20, kind: 'up' },
    { label: 'End', value: 120, kind: 'end' }
  ]
});
assert.equal(waterfall.kind, 'waterfall');
assert.equal(chartSpecToComponentId(waterfall), 'waterfall-chart');

const beautyChannel = spec(beauty, {
  type: 'content',
  title: 'Channel structure',
  channelStructure: [
    { label: 'Tmall', value: '42%' },
    { label: 'Douyin', value: '21%' }
  ]
});
assert.equal(beautyChannel.kind, 'bar');
assert.equal(beautyChannel.industryTemplate, 'channel-structure');
assert.equal(chartSpecToComponentId(beautyChannel), 'beauty-channel-structure');

const nativeGallery = normalizeDeckPlan({
  industry: 'beauty-consumer',
  slides: [{
    type: 'case-gallery',
    layoutVariant: 'consumer-proof-photo-grid',
    proofObject: 'social-proof-gallery',
    title: 'Hero-product science campaign proof',
    dataComponent: 'campaign-proof-gallery',
    cards: [{ title: 'Scene', body: 'Official campaign image.' }]
  }]
}).slides[0];
assert.equal(nativeGallery.chartSpec, undefined);
assert.ok(!nativeGallery.componentPlan.componentIds.includes('information-gap'));

const nativeRiskTable = normalizeDeckPlan({
  industry: 'beauty-consumer',
  slides: [{
    type: 'risk-table',
    layoutVariant: 'governance-table-editorial',
    proofObject: 'governance-table-editorial',
    title: 'Claim discipline and image-rights control',
    dataComponent: 'risk-register',
    headers: ['Risk', 'Level', 'Action'],
    rows: [['Clinical claim overreach', 'High', 'Keep efficacy language tied to source wording.']]
  }]
}).slides[0];
assert.equal(nativeRiskTable.chartSpec, undefined);
assert.ok(!nativeRiskTable.componentPlan.componentIds.includes('beauty-efficacy-table'));

const nativePortfolio = normalizeDeckPlan({
  industry: 'beauty-consumer',
  slides: [{
    type: 'portfolio-table',
    proofObject: 'portfolio-table',
    title: '组合行动表',
    metrics: [{ label: '周期', value: '90天' }],
    portfolio: [{ brand: '椿野', tier: '重点孵化', budget: '40%' }]
  }]
}).slides[0];
assert.equal(nativePortfolio.chartSpec, undefined);
assert.ok(!nativePortfolio.componentPlan.componentIds.includes('information-gap'));
assert.ok(!nativePortfolio.componentPlan.componentIds.includes('kpi-strip'));
assert.ok(!nativePortfolio.componentPlan.componentIds.includes('chart-commentary-panel'));
assert.ok(!nativePortfolio.componentPlan.componentIds.includes('product-matrix'));

const staleProcessRoute = normalizeDeckPlan({
  industry: 'beauty-consumer',
  slides: [{
    type: 'industry-chart',
    layoutVariant: 'channel-efficiency-matrix',
    proofObject: 'timeline',
    title: '90天打法按阶段推进',
    phases: [{ title: '验证样品' }, { title: '锁定脚本' }]
  }]
}).slides[0];
assert.equal(staleProcessRoute.type, 'timeline');
assert.notEqual(staleProcessRoute.layoutVariant, 'channel-efficiency-matrix');
assert.equal(staleProcessRoute.chartSpec, undefined);

const canonicalGalleryVariant = normalizeDeckPlan({
  industry: 'beauty-consumer',
  slides: [{
    type: 'case-gallery',
    layoutVariant: 'product-evidence-story',
    variant: 'channel-efficiency-matrix',
    proofObject: 'product-evidence-story',
    title: '产品证据页',
    images: ['missing-local-image.jpg'],
    cards: [{ title: '包装示意', body: '解释购买理由。' }]
  }]
}).slides[0];
assert.equal(canonicalGalleryVariant.layoutVariant, 'product-evidence-story');
assert.equal(canonicalGalleryVariant.variant, undefined);

const rowTable = spec(beauty, {
  type: 'table',
  title: 'Efficacy evidence table',
  dataComponent: 'table',
  headers: ['Claim', 'Boundary'],
  rows: [['Glow', 'Consumer test'], ['Plump', 'Consumer test']]
});
assert.equal(rowTable.kind, 'table');

const semantic = chartSemanticQA(beauty, normalizeDeckPlan({
  industry: 'beauty-consumer',
  slides: [
    {
      type: 'content',
      title: 'Bad monthly pulse',
      dataComponent: 'trend-line',
      monthlyPulse: [{ label: 'Jan', value: '456w' }]
    }
  ]
}));
assert.equal(semantic.status, 'fail');
assert.equal(semantic.findings[0].type, 'chartInformationGap');

const normalized = normalizeDeckPlan({
  industry: 'beauty-consumer',
  requestedSlideCount: 1,
  slides: [
    {
      type: 'content',
      title: 'Channel structure',
      claim: 'Channel data is structured.',
      proofObject: 'channel-structure',
      dataComponent: 'bar',
      channelStructure: [
        { label: 'Tmall', value: '42%' },
        { label: 'Douyin', value: '21%' }
      ],
      sourceTrace: { sourceIds: ['src-channel'] }
    }
  ]
});
const visual = chartVisualQA(normalized, normalized, {
  slides: [{ slide: 1, chartConsumption: { rendered: true, spec: normalized.slides[0].chartSpec, visualChecks: {} } }]
});
assert.equal(visual.status, 'pass');
const scores = pageLevelChartScores(normalized, normalized, null);
assert.equal(scores.slides[0].chartKind, 'bar');
const gate = chartAcceptanceGate(normalized, normalized, { slides: [{ slide: 1, missingRequiredComponents: [] }] }, { strict: false });
assert.notEqual(gate.status, 'fail');

console.log('chart spec contract ok');

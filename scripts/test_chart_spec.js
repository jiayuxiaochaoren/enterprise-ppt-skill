const assert = require('assert/strict');
const {
  chartAcceptanceGate,
  chartPreflightAudit,
  chartConsumedFields,
  chartEvidenceQA,
  chartSpecHasUnit,
  issueCategoryForFinding,
  chartSemanticQA,
  chartSpecToComponentId,
  chartVisualQA,
  pageLevelChartScores,
  routeChartSpec
} = require('./chart-spec');
const { renderChartSpec } = require('./components/chart-renderer');
const { acceptanceAudit, normalizeDeckPlan } = require('./design-system');
const {
  sourceTraceNoteText,
  sourceTraceObjectIsExplainable
} = require('./design/source-evidence');

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

const healthcareHandoffPlan = normalizeDeckPlan({
  industry:'healthcare-operations',
  slides:[{
    type:'industry-chart',
    layoutVariant:'quality-handoff',
    title:'质量交接图把跨科室责任转成可检查节点',
    qualityHandoff:[
      { from:'导诊', to:'检查', title:'身份与项目确认' },
      { from:'检查', to:'医生', title:'报告节点同步' }
    ]
  }]
});
assert.equal(
  chartPreflightAudit(healthcareHandoffPlan, healthcareHandoffPlan).status,
  'pass',
  'quality-handoff is a native handoff board, not a chartSpec series/categories route'
);

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

const explicitPlannerWithSlideTracePlan = normalizeDeckPlan({
  industry: 'general-operations',
  outputIntent: 'formal',
  requestedSlideCount: 1,
  slides: [{
    type: 'metric-comparison',
    title: 'Planner supplied chart with slide trace',
    claim: 'Planner chart should inherit slide-level sourceTrace.',
    chartSpec: {
      version: 'chartSpec/v1',
      kind: 'bar',
      title: 'Planner supplied chart with slide trace',
      categories: ['A', 'B'],
      series: [{ name: 'Series', values: [{ category: 'A', value: 1 }, { category: 'B', value: 2 }] }]
    },
    sourceTrace: {
      sourceIds: ['src-a'],
      sources: [{ id:'src-a', page:2, excerpt:'Planner chart source excerpt.' }]
    }
  }]
});
const explicitPlannerWithSlideTrace = routeChartSpec(explicitPlannerWithSlideTracePlan, explicitPlannerWithSlideTracePlan.slides[0], { index:1, total:1 });
assert.ok(explicitPlannerWithSlideTrace.sourceTrace, 'explicit chartSpec should inherit canonical sourceTrace');
assert.deepEqual(explicitPlannerWithSlideTrace.sourceTrace.sourceIds, ['src-a']);
assert.equal(explicitPlannerWithSlideTrace.sourceTrace.sources[0].excerpt, 'Planner chart source excerpt.');
assert.equal(explicitPlannerWithSlideTrace.dataQuality.sourceClass, 'source-traced');
assert.equal(chartVisualQA(explicitPlannerWithSlideTracePlan, explicitPlannerWithSlideTracePlan, {
  slides: [{ slide:1, chartConsumption:{ rendered:true, spec:explicitPlannerWithSlideTrace, visualChecks:{} } }]
}).findings.some(finding => finding.type === 'chartSourceMissing'), false);
assert.equal(chartEvidenceQA(explicitPlannerWithSlideTracePlan, explicitPlannerWithSlideTracePlan).findings.some(finding => finding.type === 'chartEvidenceUntraced'), false);
assert.equal(acceptanceAudit(explicitPlannerWithSlideTracePlan, explicitPlannerWithSlideTracePlan, {
  strict:true,
  renderMeta:{ slides:[{ slide:1, missingRequiredComponents:[], chartConsumption:{ rendered:true, spec:explicitPlannerWithSlideTrace } }] }
}).findings.some(finding => finding.type === 'chartSourceMissing' || finding.type === 'acceptanceChartSourceMissing'), false);

const explicitPlannerNoteOnlyPlan = normalizeDeckPlan({
  industry: 'general-operations',
  outputIntent: 'formal',
  requestedSlideCount: 1,
  slides: [{
    type: 'metric-comparison',
    title: 'Planner supplied chart with source note only',
    claim: 'Planner chart source note is display text only.',
    chartSpec: {
      version: 'chartSpec/v1',
      kind: 'bar',
      title: 'Planner supplied chart with source note only',
      categories: ['A', 'B'],
      series: [{ name: 'Series', values: [{ category: 'A', value: 1 }, { category: 'B', value: 2 }] }]
    },
    sourceTrace: { sourceNote:'Display source note only' }
  }]
});
const explicitPlannerNoteOnlySpec = routeChartSpec(explicitPlannerNoteOnlyPlan, explicitPlannerNoteOnlyPlan.slides[0], { index:1, total:1 });
assert.ok(
  chartVisualQA(explicitPlannerNoteOnlyPlan, explicitPlannerNoteOnlyPlan, {
    slides: [{ slide:1, chartConsumption:{ rendered:true, spec:explicitPlannerNoteOnlySpec, visualChecks:{} } }]
  }).findings.some(finding => finding.type === 'chartSourceMissing'),
  'explicit chartSpec should not pass source QA with sourceNote text only'
);
assert.ok(
  chartEvidenceQA(explicitPlannerNoteOnlyPlan, explicitPlannerNoteOnlyPlan).findings.some(finding => finding.type === 'chartEvidenceUntraced'),
  'explicit chartSpec evidence QA should require structured source trace'
);
assert.notEqual(acceptanceAudit(explicitPlannerNoteOnlyPlan, explicitPlannerNoteOnlyPlan, {
  strict:true,
  renderMeta:{ slides:[{ slide:1, missingRequiredComponents:[], chartConsumption:{ rendered:true, spec:explicitPlannerNoteOnlySpec } }] }
}).status, 'pass');

const explicitPlannerRefOnlyPlan = normalizeDeckPlan({
  industry: 'general-operations',
  outputIntent: 'formal',
  requestedSlideCount: 1,
  slides: [{
    type: 'metric-comparison',
    title: 'Planner supplied chart with ref-only source entry',
    claim: 'Planner chart source note may render, but QA still requires sourceIds.',
    chartSpec: {
      version: 'chartSpec/v1',
      kind: 'bar',
      title: 'Planner supplied chart with ref-only source entry',
      categories: ['A', 'B'],
      series: [{ name: 'Series', values: [{ category: 'A', value: 1 }, { category: 'B', value: 2 }] }]
    },
    sourceTrace: {
      sources:[{ ref:'chart-doc', page:7, excerpt:'Chart source excerpt.' }]
    }
  }]
});
const explicitPlannerRefOnlySpec = routeChartSpec(explicitPlannerRefOnlyPlan, explicitPlannerRefOnlyPlan.slides[0], { index:1, total:1 });
assert.ok(
  /^Source chart-doc/.test(sourceTraceNoteText({ sourceTrace:explicitPlannerRefOnlySpec.sourceTrace })),
  'visible chart source note fallback can render ref/page/excerpt when explicitly requested'
);
assert.ok(
  sourceTraceObjectIsExplainable({ sourceIds:'chart-doc', sources:{ ref:'chart-doc', page:7, excerpt:'Chart source excerpt.' } }, { requireSourceId:true }),
  'source trace explainability should accept a single source object with scalar sourceIds'
);
assert.ok(
  /^Source chart-doc/.test(sourceTraceNoteText({ sourceTrace:{ sourceIds:'chart-doc', sources:{ ref:'chart-doc', page:7, excerpt:'Chart source excerpt.' } } })),
  'visible chart source note fallback should accept a single source object'
);
assert.ok(
  chartEvidenceQA(explicitPlannerRefOnlyPlan, explicitPlannerRefOnlyPlan).findings.some(finding => finding.type === 'chartEvidenceUntraced'),
  'chart evidence QA should still require sourceIds that match source entries'
);
const explicitPlannerRefOnlyGate = chartAcceptanceGate(explicitPlannerRefOnlyPlan, explicitPlannerRefOnlyPlan, {
  slides:[{ slide:1, missingRequiredComponents:[], chartConsumption:{ rendered:true, spec:explicitPlannerRefOnlySpec } }]
}, { strict:false });
assert.ok(
  explicitPlannerRefOnlyGate.findings.some(finding => finding.type === 'acceptanceChartSourceMissing'),
  'chart acceptance should stay stricter than visible source note fallback for ref-only source entries'
);

const explicitPlannerSourceIdsOnlyPlan = normalizeDeckPlan({
  industry: 'general-operations',
  outputIntent: 'formal',
  requestedSlideCount: 1,
  slides: [{
    type: 'metric-comparison',
    title: 'Planner supplied chart with source id only',
    chartSpec: {
      version: 'chartSpec/v1',
      kind: 'bar',
      title: 'Planner supplied chart with source id only',
      categories: ['A', 'B'],
      series: [{ name: 'Series', values: [{ category: 'A', value: 1 }, { category: 'B', value: 2 }] }]
    },
    sourceTrace: { sourceIds:['src-only'] }
  }]
});
const explicitPlannerSourceIdsOnlySpec = routeChartSpec(explicitPlannerSourceIdsOnlyPlan, explicitPlannerSourceIdsOnlyPlan.slides[0], { index:1, total:1 });
assert.equal(explicitPlannerSourceIdsOnlySpec.dataQuality.sourceClass, 'source-id-only');
assert.equal(explicitPlannerSourceIdsOnlySpec.dataQuality.evidenceMode, 'untraced');
assert.ok(
  chartEvidenceQA(explicitPlannerSourceIdsOnlyPlan, explicitPlannerSourceIdsOnlyPlan).findings.some(finding => finding.type === 'chartEvidenceUntraced'),
  'chart source ids without page/excerpt should keep chart evidence QA findings'
);

const explicitPlannerNameOnlyPlan = normalizeDeckPlan({
  industry: 'general-operations',
  outputIntent: 'formal',
  requestedSlideCount: 1,
  slides: [{
    type: 'metric-comparison',
    title: 'Planner supplied chart with name-only source',
    chartSpec: {
      version: 'chartSpec/v1',
      kind: 'bar',
      title: 'Planner supplied chart with name-only source',
      categories: ['A', 'B'],
      series: [{ name: 'Series', values: [{ category: 'A', value: 1 }, { category: 'B', value: 2 }] }]
    },
    sourceTrace: { sources:[{ name:'report.pdf', page:2, excerpt:'Report excerpt.' }] }
  }]
});
const explicitPlannerNameOnlySpec = routeChartSpec(explicitPlannerNameOnlyPlan, explicitPlannerNameOnlyPlan.slides[0], { index:1, total:1 });
assert.equal(explicitPlannerNameOnlySpec.dataQuality.sourceClass, 'user-provided-or-untraced');
assert.equal(explicitPlannerNameOnlySpec.dataQuality.evidenceMode, 'untraced');
assert.ok(
  chartEvidenceQA(explicitPlannerNameOnlyPlan, explicitPlannerNameOnlyPlan).findings.some(finding => finding.type === 'chartEvidenceUntraced'),
  'chart name-only source entries should not be treated as structured chart source trace'
);

const explicitPlannerMergedTrace = spec({ industry: 'general-operations' }, {
  type: 'metric-comparison',
  title: 'Planner supplied chart with merged trace',
  chartSpec: {
    version: 'chartSpec/v1',
    kind: 'bar',
    title: 'Planner supplied chart with merged trace',
    categories: ['A', 'B'],
    series: [{ name: 'Series', values: [{ category: 'A', value: 1 }, { category: 'B', value: 2 }] }],
    sourceTrace: {
      source_ids: 'src-chart',
      sources: [{ id:'src-chart', page:3, excerpt:'Chart spec source excerpt.' }],
      imageProvenance: [{ id:'chart-img', authorizationStatus:'blocked', proofEligibility:'factual-proof' }],
      assetAuthorizationStatus: 'blocked'
    }
  },
  sourceTrace: {
    sourceIds: ['src-slide'],
    sources: [{ id:'src-slide', page:4, excerpt:'Slide source excerpt.' }],
    imageProvenance: [{ id:'slide-img', authorizationStatus:'cleared', proofEligibility:'factual-proof' }],
    assetAuthorizationStatuses: ['needs-review']
  }
});
assert.deepEqual([...explicitPlannerMergedTrace.sourceTrace.sourceIds].sort(), ['src-chart', 'src-slide']);
assert.equal(explicitPlannerMergedTrace.sourceTrace.sources.length, 2);
assert.equal(explicitPlannerMergedTrace.sourceTrace.imageProvenance.length, 2);
assert.equal(explicitPlannerMergedTrace.sourceTrace.assetAuthorizationStatus, 'blocked');
assert.ok(chartConsumedFields({
  kind:'bar',
  sourceTrace:{ source_ids:'src-consumed', sources:[{ id:'src-consumed', page:1, excerpt:'Consumed source.' }] }
}).includes('sourceTrace'));
assert.equal(
  chartConsumedFields({
    kind:'bar',
    sourceTrace:{ assetAuthorizationStatus:'none' }
  }).includes('sourceTrace'),
  false,
  'assetAuthorizationStatus none should not count as chart sourceTrace consumption'
);

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

const strictRepairPreflight = chartPreflightAudit({ industry:'general-operations' }, normalizeDeckPlan({
  industry:'general-operations',
  outputIntent:'formal',
  requestedSlideCount:1,
  slides:[{
    type:'metric-comparison',
    title:'Renderer inferred chart spec',
    claim:'This chart is inferred from metrics.',
    metrics:[{ label:'A', value:'1%' }, { label:'B', value:'2%' }]
  }]
}), { strict:true });
assert.equal(strictRepairPreflight.status, 'fail');
assert.equal(strictRepairPreflight.findings.some(f => f.type === 'acceptanceChartSpecRepairInStrictMode'), true);

const insufficientTrendPreflightPlan = normalizeDeckPlan({
  industry:'general-operations',
  slides:[{
    type:'industry-chart',
    title:'Bad monthly pulse',
    dataComponent:'trend-line',
    monthlyPulse:[{ label:'Jan', value:'456w' }]
  }]
});
assert.equal(insufficientTrendPreflightPlan.slides[0].chartSpec.kind, 'informationGap');
assert.equal(chartPreflightAudit(insufficientTrendPreflightPlan, insufficientTrendPreflightPlan).status, 'pass');

assert.equal(issueCategoryForFinding({ type: 'acceptanceComponentNotConsumed' }), 'component_gap');
assert.equal(issueCategoryForFinding({ type: 'monthlySeriesNotLine' }), 'routing_error');

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
assert.equal(waterfall.unit, '指数');
assert.equal(chartSpecHasUnit(waterfall), true);

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

const staleMetricBoardRoute = normalizeDeckPlan({
  industry: 'brand-retail',
  slides: [{
    type: 'industry-chart',
    layoutVariant: 'channel-efficiency-matrix',
    variant: 'channel-efficiency-matrix',
    proofObject: 'metric-board',
    title: '利润质量修复后，费用要绑定现金回款',
    metrics: [
      { label: '2025Q4 利润率', value: '-16.0%' },
      { label: '2026Q1 利润率', value: '17.4%' },
      { label: '2026Q1 回款', value: '5214.48万' },
      { label: '2025Q3 销售费用', value: '1486.08万', note: '费用投放增加' }
    ]
  }]
}).slides[0];
assert.equal(staleMetricBoardRoute.layoutVariant, 'fact-metrics');
assert.equal(staleMetricBoardRoute.variant, 'fact-metrics');
assert.equal(staleMetricBoardRoute.previousLayoutVariant, 'channel-efficiency-matrix');

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
      sourceTrace: {
        sourceIds: ['src-channel'],
        sources: [{ id:'src-channel', page:1, excerpt:'Channel structure source excerpt.' }]
      }
    }
  ]
});
const visual = chartVisualQA(normalized, normalized, {
  slides: [{ slide: 1, chartConsumption: { rendered: true, spec: normalized.slides[0].chartSpec, visualChecks: {} } }]
});
assert.equal(visual.status, 'pass');
const chartEvidencePass = chartEvidenceQA(normalized, normalized);
assert.equal(
  chartEvidencePass.findings.some(finding => finding.type === 'chartEvidenceUntraced'),
  false,
  'chart evidence QA should accept matching sourceIds with page/excerpt sources'
);
const chartSourceMessagePlan = normalizeDeckPlan({
  industry: 'beauty-consumer',
  requestedSlideCount: 1,
  slides: [{
    type: 'content',
    title: 'Channel structure without source',
    claim: 'Channel data is structured.',
    proofObject: 'channel-structure',
    dataComponent: 'bar',
    channelStructure: [
      { label: 'Tmall', value: '42%' },
      { label: 'Douyin', value: '21%' }
    ]
  }]
});
const chartSourceMessageQA = chartVisualQA(chartSourceMessagePlan, chartSourceMessagePlan, {
  slides: [{ slide: 1, chartConsumption: { rendered: true, spec: chartSourceMessagePlan.slides[0].chartSpec, visualChecks: {} } }]
});
const chartSourceMessage = chartSourceMessageQA.findings.find(finding => finding.type === 'chartSourceMissing');
assert.equal(chartSourceMessage.message, 'chart lacks source trace');
assert.equal(/visible/i.test(chartSourceMessage.message), false);
const chartSourceNoteOnlyPlan = normalizeDeckPlan({
  industry: 'beauty-consumer',
  requestedSlideCount: 1,
  slides: [{
    type: 'content',
    title: 'Channel structure with note only',
    claim: 'Channel data is structured.',
    proofObject: 'channel-structure',
    dataComponent: 'bar',
    channelStructure: [
      { label: 'Tmall', value: '42%' },
      { label: 'Douyin', value: '21%' }
    ],
    sourceTrace:{ sourceNote:'Chart source note only' }
  }]
});
const chartSourceNoteOnlyQA = chartVisualQA(chartSourceNoteOnlyPlan, chartSourceNoteOnlyPlan, {
  slides: [{ slide: 1, chartConsumption: { rendered: true, spec: chartSourceNoteOnlyPlan.slides[0].chartSpec, visualChecks: {} } }]
});
assert.ok(
  chartSourceNoteOnlyQA.findings.some(finding => finding.type === 'chartSourceMissing'),
  'chart source QA should require structured source trace, not only sourceNote text'
);
const chartSourceNoteOnlyEvidence = chartEvidenceQA(chartSourceNoteOnlyPlan, chartSourceNoteOnlyPlan);
assert.ok(
  chartSourceNoteOnlyEvidence.findings.some(finding => finding.type === 'chartEvidenceUntraced'),
  'chart evidence QA should require structured source trace, not only sourceNote text'
);
const chartSourceMismatchPlan = normalizeDeckPlan({
  industry: 'beauty-consumer',
  requestedSlideCount: 1,
  slides: [{
    type: 'content',
    title: 'Channel structure with mismatched source',
    claim: 'Channel data is structured.',
    proofObject: 'channel-structure',
    dataComponent: 'bar',
    channelStructure: [
      { label: 'Tmall', value: '42%' },
      { label: 'Douyin', value: '21%' }
    ],
    sourceTrace:{
      sourceIds:['src-a'],
      sources:[{ id:'src-b', page:1, excerpt:'Mismatched source entry.' }]
    }
  }]
});
const chartSourceMismatchQA = chartVisualQA(chartSourceMismatchPlan, chartSourceMismatchPlan, {
  slides: [{ slide: 1, chartConsumption: { rendered: true, spec: chartSourceMismatchPlan.slides[0].chartSpec, visualChecks: {} } }]
});
assert.ok(
  chartSourceMismatchQA.findings.some(finding => finding.type === 'chartSourceMissing'),
  'chart source QA should require sourceIds to match page/excerpt source entries'
);
assert.ok(
  chartEvidenceQA(chartSourceMismatchPlan, chartSourceMismatchPlan).findings.some(finding => finding.type === 'chartEvidenceUntraced'),
  'chart evidence QA should reject mismatched sourceIds and source entries'
);
const scores = pageLevelChartScores(normalized, normalized, null);
assert.equal(scores.slides[0].chartKind, 'bar');
assert.equal(scores.slides[0].evidenceTraceScore, 100);
assert.equal(pageLevelChartScores(chartSourceMismatchPlan, chartSourceMismatchPlan, null).slides[0].evidenceTraceScore, 64);
const noChartScores = pageLevelChartScores(normalizeDeckPlan({
  industry: 'general-operations',
  slides: [{ type: 'content', title: 'Narrative slide', claim: 'No chart intent here.' }]
}), null, null);
assert.equal(noChartScores.slides[0].applicability, 'not_applicable');
assert.equal(noChartScores.slides[0].chartFitScore, null);
const gate = chartAcceptanceGate(normalized, normalized, { slides: [{ slide: 1, missingRequiredComponents: [] }] }, { strict: false });
assert.notEqual(gate.status, 'fail');
const sourceNoteOnlyGate = chartAcceptanceGate(chartSourceNoteOnlyPlan, chartSourceNoteOnlyPlan, {
  slides: [{ slide: 1, missingRequiredComponents: [], chartConsumption: { rendered:true, spec: chartSourceNoteOnlyPlan.slides[0].chartSpec } }]
}, { strict: false });
assert.ok(
  sourceNoteOnlyGate.findings.some(finding => finding.type === 'acceptanceChartSourceMissing'),
  'chart acceptance should not accept sourceTrace.sourceNote without page/excerpt source evidence'
);
const sourceMissingAcceptance = acceptanceAudit(chartSourceMessagePlan, chartSourceMessagePlan, {
  strict:true,
  renderMeta:{ slides:[{ slide:1, missingRequiredComponents:[], chartConsumption:{ rendered:true } }] }
});
assert.notEqual(sourceMissingAcceptance.status, 'pass');
assert.ok(
  sourceMissingAcceptance.findings.some(finding => finding.type === 'chartSourceMissing'),
  'acceptance audit should retain chart source QA findings in aggregate status'
);
assert.ok(
  sourceMissingAcceptance.findings.some(finding => finding.type === 'acceptanceChartSourceMissing'),
  'acceptance audit should retain chart gate source findings in aggregate status'
);

function chartCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    slide:{ addShape:(...args) => record('addShape', args) },
    colors:{
      accent:'2563EB',
      body:'334155',
      cyan:'0891B2',
      line:'CBD5E1',
      muted:'64748B',
      panelAlt:'F1F5F9',
      risk:'DC2626',
      text:'111827',
      violet:'7C3AED',
      warning:'F59E0B'
    },
    addLabel:(...args) => record('addLabel', args),
    addNumber:(...args) => record('addNumber', args),
    addRect:(...args) => record('addRect', args),
    addText:(...args) => record('addText', args),
    panelFill:() => 'F8FAFC'
  };
}

function chartSourceSpec(kind) {
  const values = [
    { category:'A', value:1, rawValue:'1%' },
    { category:'B', value:2, rawValue:'2%' }
  ];
  return {
    kind,
    title:`${kind} source fixture`,
    unit:'%',
    categories:['A', 'B'],
    series:[{ name:'Series', values }],
    table:{ rows:[{ title:'A', value:'1%', body:'Alpha' }, { title:'B', value:'2%', body:'Beta' }] },
    sourceTrace:{
      sourceNote:'Chart Source A',
      sourceIds:['src-chart'],
      sources:[{ id:'src-chart', page:1, excerpt:'Chart source excerpt.' }]
    }
  };
}

['bar', 'line', 'scorecard', 'table', 'kpi'].forEach(kind => {
  const hiddenOps = [];
  const hidden = renderChartSpec(chartCtx(hiddenOps), chartSourceSpec(kind), {});
  assert.equal(hidden.rendered, true, `${kind} chart should render`);
  assert.equal(hidden.visualChecks.sourceVisible, false, `${kind} chart should hide source text by default`);
  assert.equal(
    hiddenOps.some(op => op.name === 'addText' && op.args[1] === 'Chart Source A' && (op.args[2] || {}).typeRole === 'sourceNote'),
    false,
    `${kind} chart should not draw sourceNote text by default`
  );

  const visibleOps = [];
  const visible = renderChartSpec(chartCtx(visibleOps), chartSourceSpec(kind), { showSourceNote:true });
  assert.equal(visible.rendered, true, `${kind} opt-in chart should render`);
  assert.equal(visible.visualChecks.sourceVisible, true, `${kind} chart should report visible source only when opted in`);
  assert.equal(
    visibleOps.some(op => op.name === 'addText' && op.args[1] === 'Chart Source A' && (op.args[2] || {}).typeRole === 'sourceNote'),
    true,
    `${kind} chart should draw sourceNote text when opted in`
  );
});

const sourceAliasOps = [];
const sourceAliasResult = renderChartSpec(chartCtx(sourceAliasOps), Object.assign({}, chartSourceSpec('bar'), {
  sourceTrace:{
    source_note:'Chart Source Alias'
  }
}), { showSourceNote:true });
assert.equal(sourceAliasResult.visualChecks.sourceVisible, true);
assert.ok(
  sourceAliasOps.some(op => op.name === 'addText' && op.args[1] === 'Chart Source Alias' && (op.args[2] || {}).typeRole === 'sourceNote'),
  'opt-in chart source note should support source_note alias'
);

const sourceFallbackOps = [];
const sourceFallbackResult = renderChartSpec(chartCtx(sourceFallbackOps), Object.assign({}, chartSourceSpec('bar'), {
  sourceTrace:{
    sourceIds:['src-structured'],
    sources:[{ id:'src-structured', page:7, excerpt:'Structured fallback excerpt for chart source note.' }]
  }
}), { showSourceNote:true });
assert.equal(sourceFallbackResult.visualChecks.sourceVisible, true);
assert.ok(
  sourceFallbackOps.some(op => op.name === 'addText' && /Source src-structured/.test(op.args[1]) && (op.args[2] || {}).typeRole === 'sourceNote'),
  'opt-in chart source note should fall back to structured source trace text'
);

const sourceRefFallbackOps = [];
const sourceRefFallbackResult = renderChartSpec(chartCtx(sourceRefFallbackOps), Object.assign({}, chartSourceSpec('bar'), {
  sourceTrace:{
    sources:[{ ref:'doc-ref', page:7, excerpt:'Structured ref fallback excerpt for chart source note.' }]
  }
}), { showSourceNote:true });
assert.equal(sourceRefFallbackResult.visualChecks.sourceVisible, true);
assert.ok(
  sourceRefFallbackOps.some(op => op.name === 'addText' && /Source doc-ref/.test(op.args[1]) && (op.args[2] || {}).typeRole === 'sourceNote'),
  'opt-in chart source note should fall back to ref-based structured source trace text'
);

const sourceNameOnlyFallbackOps = [];
const sourceNameOnlyFallbackResult = renderChartSpec(chartCtx(sourceNameOnlyFallbackOps), Object.assign({}, chartSourceSpec('bar'), {
  sourceTrace:{
    sourceIds:['src-name'],
    sources:[{ name:'src-name', page:7, excerpt:'Name-only fallback should not render.' }]
  }
}), { showSourceNote:true });
assert.equal(sourceNameOnlyFallbackResult.visualChecks.sourceVisible, false);
assert.equal(
  sourceNameOnlyFallbackOps.some(op => op.name === 'addText' && /src-name/.test(op.args[1]) && (op.args[2] || {}).typeRole === 'sourceNote'),
  false,
  'opt-in chart source note should not imply sourceIds match name-only source entries'
);

const fourMetricScorecardOps = [];
const fourMetricScorecard = renderChartSpec(chartCtx(fourMetricScorecardOps), {
  kind:'scorecard',
  title:'四项指标卡',
  series:[{ values:[
    { category:'样本量', value:60, rawValue:'60条' },
    { category:'物流顾虑', value:16, rawValue:'16次' },
    { category:'平均 NPS', value:6.1, rawValue:'6.1分' },
    { category:'品质升级', value:15, rawValue:'15次' }
  ] }]
}, { noFrame:true, showTitle:false, compactHeader:true });
assert.equal(fourMetricScorecard.rendered, true);
const scorecardRects = fourMetricScorecardOps.filter(op => op.name === 'addRect' && (op.args[3] || 0) > 2.0 && (op.args[4] || 0) > 0.8);
assert.equal(new Set(scorecardRects.map(op => Number(op.args[1]).toFixed(2))).size, 2, 'four-metric scorecards should use a balanced 2-column grid');
assert.equal(new Set(scorecardRects.map(op => Number(op.args[2]).toFixed(2))).size, 2, 'four-metric scorecards should use a balanced 2-row grid');

const moneyScorecardOps = [];
const moneyScorecard = renderChartSpec(chartCtx(moneyScorecardOps), {
  kind:'scorecard',
  title:'金额指标卡',
  series:[{ values:[
    { category:'2026Q1 回款', value:5214.48, rawValue:'5214.48', unit:'万' },
    { category:'2025Q3 销售费用', value:1486.08, rawValue:'1486.08', unit:'万' }
  ] }]
}, { noFrame:true, showTitle:false, compactHeader:true });
assert.equal(moneyScorecard.rendered, true);
assert.equal(chartSpecHasUnit({
  kind:'scorecard',
  series:[{ values:[
    { category:'2026Q1 回款', value:5214.48, rawValue:'5214.48', unit:'万' },
    { category:'费用率', value:-2.1, rawValue:'-2.1pt', unit:'pt' }
  ] }]
}), true);
['5214.48万', '1486.08万'].forEach(label => {
  const op = moneyScorecardOps.find(candidate => candidate.name === 'addText' && candidate.args[1] === label);
  assert(op, `expected money scorecard value ${label}`);
  assert(
    (op.args[2] || {}).w >= 1.16,
    `money scorecard value ${label} should reserve enough width for value and unit on one line`
  );
});

const genericFunnelOps = [];
const genericFunnel = renderChartSpec(chartCtx(genericFunnelOps), {
  kind:'funnel',
  title:'活动漏斗',
  series:[{ values:[
    { category:'曝光', value:307319, rawValue:'307319万' },
    { category:'点击', value:85809, rawValue:'85809单' },
    { category:'线索', value:7019, rawValue:'7019单' },
    { category:'订单', value:2533, rawValue:'2533单' }
  ] }]
}, { noFrame:true, showTitle:false, compactHeader:true });
assert.equal(genericFunnel.rendered, true);
const funnelFillRects = genericFunnelOps.filter(op => op.name === 'addRect' && op.args[5] === op.args[6] && ['2563EB', '0891B2', '7C3AED', 'F59E0B'].includes(op.args[5]));
assert.equal(new Set(funnelFillRects.map(op => Number(op.args[1]).toFixed(2))).size, 1, 'funnel bars should share one left-aligned track origin');

const beautyFunnelOps = [];
const beautyFunnel = renderChartSpec(chartCtx(beautyFunnelOps), {
  kind:'funnel',
  componentId:'beauty-social-funnel',
  title:'活动转化漏斗',
  unit:'万',
  series:[{ values:[
    { category:'曝光触达', value:2743.9, rawValue:'2743.9万' },
    { category:'点击咨询', value:104.5, rawValue:'104.5万' },
    { category:'线索', value:11.6, rawValue:'11.6万' },
    { category:'成交', value:3.6, rawValue:'3.6万' }
  ] }]
}, { noFrame:true, showTitle:false, compactHeader:true });
assert.equal(beautyFunnel.rendered, true);
assert.equal(beautyFunnel.componentId, 'beauty-social-funnel');
assert.ok(
  beautyFunnelOps.some(op => op.name === 'addLabel' && op.args[1] === '转化漏斗'),
  'beauty social funnel should label the stage rail instead of showing unlabeled color blocks'
);
assert.ok(
  beautyFunnelOps.some(op => op.name === 'addText' && /转化/.test(op.args[1])),
  'beauty social funnel should expose conversion context for downstream stages'
);

const beautyReviewOps = [];
const beautyReview = renderChartSpec(chartCtx(beautyReviewOps), {
  kind:'pareto',
  componentId:'beauty-review-sentiment',
  title:'顾虑频次',
  unit:'次',
  series:[{ values:[
    { category:'肤质匹配困难', value:18, rawValue:'18' },
    { category:'活动价格不稳定', value:11, rawValue:'11' },
    { category:'担心刺激过敏', value:11, rawValue:'11' },
    { category:'包装质感一般', value:11, rawValue:'11' },
    { category:'功效见效慢', value:9, rawValue:'9' }
  ] }]
}, { noFrame:true, showTitle:false, compactHeader:true });
assert.equal(beautyReview.rendered, true);
assert.equal(beautyReview.componentId, 'beauty-review-sentiment');
assert.ok(
  beautyReviewOps.some(op => op.name === 'addLabel' && op.args[1] === '顾虑频次排序'),
  'beauty review sentiment should render as a labeled concern ranking'
);
assert.equal(
  beautyReviewOps.some(op => op.name === 'addShape' && ['line', 'lineInv'].includes(op.args[0])),
  false,
  'beauty review sentiment should not draw an unexplained Pareto cumulative line'
);

console.log('chart spec contract ok');

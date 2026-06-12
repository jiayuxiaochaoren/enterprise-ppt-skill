const assert = require('assert/strict');
const { componentCapabilityFor } = require('./components');
const {
  auditDeckPlan,
  componentPlanAudit,
  compositionAudit,
  industryDesignDialect,
  makeDeckContext,
  normalizeDeckPlan,
  normalizeSlide
} = require('./design-system');

assert.equal(componentCapabilityFor('image-gallery').id, 'proof-gallery');
assert.ok(componentCapabilityFor('proof-gallery').dataRequirements.some(req => /images/.test(req)));
assert.ok(componentCapabilityFor('risk-register').dataRequirements.some(req => /rows/.test(req)));

const healthcare = normalizeDeckPlan({
  industry:'healthcare-operations',
  title:'医疗服务运营质量提升方案',
  slides:[
    { type:'auto', title:'医疗服务运营质量提升方案', subtitle:'让质量、安全与服务体验进入同一套复盘视图' },
    { type:'toc-clean', title:'目录', items:['质量目标','患者旅程','交接治理','复盘闭环'] },
    { type:'content', title:'患者旅程需要从入口进入可追踪闭环', serviceBlueprint:{ stages:['预约','到院','检查','随访'] }, cards:[
      { title:'预约导诊', body:'入口问题可见。' },
      { title:'检查协同', body:'资源等待可追踪。' }
    ] },
    { type:'content', title:'质量交接需要统一责任人与复盘口径', rows:[
      ['导诊交接','护士站','留痕确认'],
      ['检查交接','影像科','超时提醒'],
      ['随访交接','责任医生','问题闭环']
    ] },
    { type:'closing', title:'先让患者旅程进入可追踪闭环', actions:[{ title:'旅程', body:'确认触点' }, { title:'质量', body:'确认指标' }] }
  ]
});

healthcare.slides.forEach((slide, i) => {
  assert.ok(slide.compositionPlan, `slide ${i + 1} should have compositionPlan`);
  assert.equal(slide.compositionPlan.version, 'composition-plan/v1');
  assert.ok(slide.compositionPlan.composition);
  assert.ok(slide.compositionPlan.layoutPlan.primaryZone);
  assert.equal(slide.compositionPlan.primaryZone, slide.compositionPlan.layoutPlan.primaryZone);
  assert.equal(slide.compositionPlan.secondaryZone, slide.compositionPlan.layoutPlan.secondaryZone);
  assert.equal(slide.compositionPlan.proofZone, slide.compositionPlan.layoutPlan.proofZone);
  assert.ok(slide.compositionPlan.primaryColorUse.length >= 3);
});
assert.equal(
  healthcare.slides.some(s => s.compositionPlan.backgroundTone === 'accent-wash' || s.compositionPlan.primaryColorUse.includes('side-color-field')),
  true,
  'deck rhythm planner should add accent anchors to light decks'
);

const brandImageSlide = normalizeSlide(
  { industry:'brand-retail', title:'高端零售增长计划' },
  {
    type:'case-gallery',
    title:'产品图与门店场景形成品牌记忆',
    images:['store.png','product.png','display.png'],
    cards:[
      { title:'门店陈列', body:'空间体验' },
      { title:'产品细节', body:'材质记忆' },
      { title:'会员触点', body:'复购理由' }
    ]
  },
  2,
  8
);
assert.equal(brandImageSlide.compositionPlan.imageTreatment.includes('evidence') || brandImageSlide.compositionPlan.imageTreatment.includes('contact'), true);
assert.ok(brandImageSlide.compositionPlan.microComponents.includes('source-caption'));
assert.ok(brandImageSlide.compositionPlan.primaryColorUse.includes('caption-bar'));
assert.equal(brandImageSlide.compositionPlan.industryExpression.dialect, 'retail-editorial-system');
assert.ok(brandImageSlide.compositionPlan.microComponents.includes('lookbook-frame'));
assert.equal(brandImageSlide.compositionPlan.microComponents.includes('equipment-nameplate'), false);

const singleVisualEvidenceSlide = normalizeSlide(
  { industry:'beauty-consumer', title:'品牌场景证据' },
  {
    type:'content',
    title:'柜台场景证明消费者触点',
    visual:{ mode:'photo', role:'evidence', image:'counter.png', caption:'柜台咨询作为消费者证据' },
    cards:[{ title:'柜台咨询', body:'解释肤质问题与产品匹配。' }]
  },
  2,
  5
);
assert.equal(singleVisualEvidenceSlide.componentPlan.componentIds.includes('proof-gallery'), true);
assert.equal(singleVisualEvidenceSlide.componentPlan.componentIds.includes('caption-bar'), true);

const productStoryMatrixSlide = normalizeSlide(
  { industry:'beauty-consumer', title:'产品证据故事' },
  {
    type:'content',
    title:'明星单品把质地、功效和场景连起来',
    productStory:[
      { title:'修护精华', body:'高频复购入口。' },
      { title:'面霜系列', body:'承接换季修护。' }
    ],
    visual:{ images:['sku-1.png', 'sku-2.png'] }
  },
  3,
  5
);
assert.equal(productStoryMatrixSlide.componentPlan.componentIds.includes('product-matrix'), true);
assert.equal(productStoryMatrixSlide.componentPlan.componentIds.includes('proof-gallery'), true);
assert.equal(productStoryMatrixSlide.componentPlan.componentIds.includes('caption-bar'), true);

const beautyChartEvidenceSlide = normalizeSlide(
  { industry:'beauty-consumer', title:'经营图表证据' },
  {
    type:'metric-comparison',
    layoutVariant:'financial-kpi-snapshot',
    proofObject:'monthly-pulse-trend',
    title:'利润弹性先于放量修复',
    metrics:[{ label:'Q4利润', value:'-7.7%' }, { label:'Q1利润', value:'2.8%' }],
    chartSpec:{
      version:'chartSpec/v1',
      kind:'line',
      componentId:'line-chart',
      series:[{ values:[{ category:'2025Q4', value:-7.7 }, { category:'2026Q1', value:2.8 }] }]
    },
    businessLogic:{ currentState:'Q4 转负', cause:'费用投放', action:'重排预算', metric:'利润率' }
  },
  3,
  5
);
assert.equal(beautyChartEvidenceSlide.componentPlan.componentIds.includes('line-chart'), true);
assert.equal(beautyChartEvidenceSlide.componentPlan.componentIds.includes('kpi-strip'), true);
assert.equal(beautyChartEvidenceSlide.componentPlan.componentIds.includes('proof-gallery'), false);
assert.equal(beautyChartEvidenceSlide.componentPlan.componentIds.includes('caption-bar'), false);

const nativeFactMetricsPlan = normalizeSlide(
  { industry:'brand-retail', title:'指标读数' },
  {
    type:'industry-chart',
    layoutVariant:'fact-metrics',
    variant:'fact-metrics',
    proofObject:'metric-board',
    title:'利润质量修复后，费用要绑定现金回款',
    metrics:[
      { label:'2025Q4 利润率', value:'-16.0%' },
      { label:'2026Q1 利润率', value:'17.4%' }
    ],
    chartSpec:{
      version:'chartSpec/v1',
      kind:'scorecard',
      componentId:'scorecard',
      series:[{ values:[{ category:'2025Q4 利润率', value:-16, rawValue:'-16.0%' }] }]
    }
  },
  4,
  8
);
assert.equal(nativeFactMetricsPlan.componentPlan.componentIds.includes('scorecard'), false);
assert.equal(nativeFactMetricsPlan.componentPlan.componentIds.includes('kpi-strip'), true);

const nativeMemberCohortPlan = normalizeSlide(
  { industry:'brand-retail', title:'会员分层' },
  {
    type:'industry-chart',
    layoutVariant:'member-cohort-ladder',
    variant:'member-cohort-ladder',
    proofObject:'member-cohort-ladder',
    title:'消费者反馈显示复购承接卡在信任、履约和售后',
    metrics:[{ label:'样本量', value:'60条' }],
    memberCohorts:[{ title:'新客', value:'31%' }],
    chartSpec:{
      version:'chartSpec/v1',
      kind:'scorecard',
      componentId:'beauty-member-repurchase',
      series:[{ values:[{ category:'样本量', value:60, rawValue:'60条' }] }]
    }
  },
  5,
  8
);
assert.equal(nativeMemberCohortPlan.componentPlan.componentIds.includes('beauty-member-repurchase'), false);
assert.equal(nativeMemberCohortPlan.componentPlan.componentIds.includes('kpi-strip'), true);

const beautyValueCreationWithStaleProof = normalizeSlide(
  { industry:'beauty-consumer', title:'品牌经营体系' },
  {
    type:'strategy-map',
    layoutVariant:'value-creation-process-map',
    proofObject:'brand-world-and-business-proof',
    title:'价值创造必须从品牌心智走到复购经营',
    valueChain:[
      { title:'投入', body:'预算、产品和会员资产。' },
      { title:'动作', body:'渠道、内容和复购路径。' },
      { title:'产出', body:'毛利、复购和现金回款。' }
    ],
    businessLogic:{ currentState:'增长转向质量', cause:'获客成本上升', action:'复购链路共管', metric:'复购率' }
  },
  6,
  11
);
assert.equal(beautyValueCreationWithStaleProof.componentPlan.componentIds.includes('value-chain'), true);
assert.equal(beautyValueCreationWithStaleProof.componentPlan.componentIds.includes('hero-image'), false);
assert.equal(beautyValueCreationWithStaleProof.componentPlan.componentIds.includes('caption-bar'), false);
assert.equal(beautyValueCreationWithStaleProof.componentPlan.componentIds.includes('proof-gallery'), false);

const genericProductNarrative = normalizeSlide(
  { industry:'general-operations', title:'产品路线' },
  {
    type:'content',
    title:'产品路线说明不等于产品矩阵',
    subtitle:'这是一页无图的管理叙述。',
    cards:[{ title:'路线', body:'说明方向。' }]
  },
  2,
  5
);
assert.equal(genericProductNarrative.componentPlan.componentIds.includes('product-matrix'), false);

const manufacturingTopology = normalizeSlide(
  { industry:'manufacturing-operations', title:'制造能力介绍' },
  {
    type:'architecture',
    layoutVariant:'production-topology',
    title:'产品谱系围绕输送、涂装、控制与现场安调展开',
    layers:[
      { title:'产品与工艺对象', items:['非标输送设备','涂装设备','控制系统'] },
      { title:'制造交付动作', items:['加工制造','控制联调','现场安装'] },
      { title:'证据与交付资料', items:['图纸参数','设备铭牌','调试记录'] }
    ]
  },
  3,
  8
);
assert.equal(industryDesignDialect({ industry:'manufacturing-operations' }).name, 'factory-evidence-system');
assert.equal(makeDeckContext({ industry:'manufacturing-operations' }).paletteName, 'factory-steel-amber');
assert.equal(manufacturingTopology.compositionPlan.industryExpression.dialect, 'factory-evidence-system');
assert.ok(manufacturingTopology.compositionPlan.microComponents.includes('equipment-nameplate'));
assert.ok(manufacturingTopology.compositionPlan.microComponents.includes('process-index-rail'));
assert.ok(manufacturingTopology.compositionPlan.microComponents.includes('technical-ruler'));
assert.equal(manufacturingTopology.compositionPlan.microComponents.includes('patient-journey-band'), false);
assert.equal(manufacturingTopology.compositionPlan.microComponents.includes('lookbook-frame'), false);

const healthcareJourney = normalizeSlide(
  { industry:'healthcare-operations', title:'医疗服务运营质量提升方案' },
  {
    type:'architecture',
    layoutVariant:'service-blueprint',
    title:'患者旅程进入可追踪闭环',
    serviceBlueprint:{ stages:['预约','到院','检查','随访'] }
  },
  3,
  8
);
assert.equal(healthcareJourney.compositionPlan.industryExpression.dialect, 'clinical-quality-system');
assert.ok(healthcareJourney.compositionPlan.microComponents.includes('service-blueprint-lane'));
assert.ok(healthcareJourney.compositionPlan.microComponents.includes('patient-journey-band'));
assert.equal(healthcareJourney.compositionPlan.microComponents.includes('equipment-nameplate'), false);

const rawWeak = {
  industry:'general-operations',
  slides:[
    { type:'cover', title:'运营汇报' },
    ...Array.from({ length:7 }, (_, i) => ({
      type:'content',
      title:`事项 ${i + 1}`,
      compositionPlan:{
        version:'composition-plan/v1',
        composition:'executive-insight-board',
        backgroundTone:'tinted-paper',
        themeCoverage:'low',
        primaryColorUse:['page-number'],
        imageTreatment:'none',
        microComponents:[],
        rhythmRole:'narrative'
      },
      cards:[{ title:'背景', body:'说明。' }, { title:'动作', body:'推进。' }]
    })),
    { type:'closing', title:'下一步' }
  ]
};
assert.ok(
  compositionAudit(rawWeak, rawWeak).some(f => f.type === 'themeCoverageLow' || f.type === 'flatPageRhythm'),
  'composition audit should catch weak theme coverage and flat rhythm'
);
assert.ok(
  compositionAudit(rawWeak, rawWeak).some(f => f.type === 'accentOnlyAsThinLine'),
  'composition audit should catch accent color used only as thin decoration'
);
assert.ok(
  auditDeckPlan(rawWeak, rawWeak).some(f => f.type === 'themeCoverageLow' || f.type === 'compositionTooGeneric'),
  'deck audit should include composition findings'
);

const weakMetricPlan = {
  industry:'general-operations',
  slides:[
    { type:'cover', title:'封面' },
    { type:'metric-comparison', title:'关键指标变化', metrics:[
      { label:'满意度', value:'86%' },
      { label:'等待时长', value:'24min' }
    ] },
    { type:'closing', title:'结束' }
  ]
};
assert.ok(
  auditDeckPlan(weakMetricPlan, weakMetricPlan).some(f => f.type === 'metricBusinessLogic'),
  'metric slides should expose business logic instead of only pretty numbers'
);

const weakClosing = {
  slides:[
    { type:'cover', title:'封面' },
    { type:'content', title:'内容', cards:[{ title:'判断', body:'说明' }] },
    {
      type:'closing',
      title:'谢谢观看',
      compositionPlan:{
        version:'composition-plan/v1',
        composition:'editorial-close-statement',
        backgroundTone:'tinted-paper',
        themeCoverage:'high',
        primaryColorUse:['top-rule', 'page-number'],
        imageTreatment:'none',
        microComponents:['top-rule', 'page-number'],
        rhythmRole:'closer'
      }
    }
  ]
};
assert.ok(
  compositionAudit(weakClosing, weakClosing).some(f => f.type === 'closingLacksWeight'),
  'composition audit should require a real back-cover anchor on closing slides'
);

const plainNarrative = normalizeSlide(
  { industry:'general-operations', title:'运营复盘' },
  {
    type:'content',
    title:'平台系统保障闭环说明',
    subtitle:'从现状到目标的管理叙述，不是流程、架构或风险结构。',
    cards:[
      { title:'管理说明', body:'保障机制由部门日常动作承接。' },
      { title:'复盘说明', body:'闭环作为叙述目标出现。' }
    ]
  },
  2,
  8
);
assert.equal(plainNarrative.componentPlan.componentIds.includes('process-rail'), false);
assert.equal(plainNarrative.componentPlan.componentIds.includes('risk-register'), false);
assert.equal(plainNarrative.componentPlan.componentIds.includes('system-rail'), false);

const explicitProcess = normalizeSlide(
  { industry:'general-operations', title:'实施路径' },
  {
    type:'content',
    title:'实施路径按阶段推进',
    phases:[
      { title:'阶段一', body:'确认范围。' },
      { title:'阶段二', body:'上线试点。' }
    ]
  },
  3,
  8
);
assert.equal(explicitProcess.componentPlan.componentIds.includes('process-rail'), true);

const metricCapabilities = normalizeSlide(
  { industry:'general-operations', title:'指标页' },
  {
    type:'metric-comparison',
    title:'关键指标',
    metrics:[{ label:'完成率', value:'86%' }]
  },
  3,
  8
);
const kpiComponent = metricCapabilities.componentPlan.components.find(c => c.id === 'kpi-strip');
assert.ok(kpiComponent, 'metric slide should plan kpi-strip');
assert.ok(Array.isArray(kpiComponent.supportedModes) && kpiComponent.supportedModes.includes('overlay'));
assert.equal(kpiComponent.ownershipPolicy, 'native-or-overlay');

const numericCardPage = normalizeSlide(
  { industry:'general-operations', title:'数字卡片页' },
  {
    type:'executive-blocks',
    title:'渠道复盘显示 ROAS 与 GMV 已进入改善区间',
    cards:[
      { title:'ROAS', body:'本月 2.4 倍，仍由卡片原生承接。' },
      { title:'GMV', body:'销售额 128 万元，作为卡片正文而非底部 KPI 条。' },
      { title:'花费', body:'预算 42 万元，保留在卡片内。' }
    ]
  },
  3,
  8
);
assert.equal(numericCardPage.componentPlan.componentIds.includes('kpi-strip'), false);

const skuKeywordWithoutProducts = normalizeSlide(
  { industry:'brand-retail', title:'产品叙述页' },
  {
    type:'two-column',
    title:'SKU 梯队说明先聚焦经营判断',
    subtitle:'没有真实产品或 SKU 数据时，不应规划产品矩阵。',
    cards:[{ title:'判断', body:'只说明预算方向。' }]
  },
  3,
  8
);
assert.equal(skuKeywordWithoutProducts.componentPlan.componentIds.includes('product-matrix'), false);

const unsupportedExplicitProductMatrix = normalizeSlide(
  { industry:'brand-retail', title:'显式组件审计' },
  {
    type:'two-column',
    title:'显式产品矩阵缺少产品数据',
    componentHints:[{ id:'product-matrix', required:true }],
    cards:[{ title:'判断', body:'没有 products/productStory。' }]
  },
  3,
  8
);
assert.ok(unsupportedExplicitProductMatrix.componentPlan.componentIds.includes('product-matrix'));
assert.ok(
  componentPlanAudit({ slides:[unsupportedExplicitProductMatrix] }, { slides:[unsupportedExplicitProductMatrix] }).findings.some(f => f.type === 'componentRouteUnsupported'),
  'explicit required components unsupported by the active route should be audited'
);

const unknownComponentPlan = normalizeSlide(
  { industry:'general-operations', title:'未知组件验证' },
  {
    type:'content',
    title:'未知组件不应进入可执行计划',
    componentHints:['alien-widget'],
    cards:[{ title:'判断', body:'说明' }]
  },
  2,
  5
);
assert.equal(unknownComponentPlan.componentPlan.componentIds.includes('alien-widget'), false);
assert.ok(unknownComponentPlan.componentPlan.unknownComponents.some(c => c.id === 'alien-widget'));
assert.ok(
  componentPlanAudit({ slides:[unknownComponentPlan] }, { slides:[unknownComponentPlan] }).findings.some(f => f.type === 'unknownComponentId'),
  'unknown component ids should be surfaced as audit findings'
);
assert.ok(
  componentPlanAudit(
    { slides:[{ type:'content', title:'alias plan' }] },
    { slides:[{ type:'content', title:'alias plan', componentPlan:{ version:'component-plan/v1', components:[{ id:'gallery-grid', required:true }] } }] }
  ).findings.some(f => f.type === 'componentAliasNotCanonical'),
  'component aliases should be normalized before they enter executable plans'
);

const energySample = normalizeDeckPlan(require('../examples/sample-deck-plan.json'));
const energyComponentsBySlide = energySample.slides.map(s => new Set(s.componentPlan.componentIds));
[
  [0, ['site-photo-backdrop', 'asset-status-chip', 'section-kicker']],
  [2, ['site-evidence-frame', 'asset-status-chip']],
  [3, ['governance-table']],
  [4, ['hub-spoke-dispatch-map', 'telemetry-node']],
  [6, ['governance-table', 'dispatch-rail', 'alert-checkpoint']],
  [7, ['asset-readout-strip']],
  [8, ['alert-severity-tag']],
  [9, ['site-photo-backdrop', 'section-kicker', 'contact-block']]
].forEach(([slideIndex, ids]) => {
  ids.forEach(id => {
    assert.equal(
      energyComponentsBySlide[slideIndex].has(id),
      false,
      `auto-planned native-only decorative component ${id} should not enter executable plan on slide ${slideIndex + 1}`
    );
  });
});
assert.equal(energyComponentsBySlide[1].has('navigation-sequence'), true);
assert.equal(energyComponentsBySlide[2].has('content-card-grid'), true);
assert.equal(energyComponentsBySlide[4].has('system-rail'), true);
assert.equal(energyComponentsBySlide[6].has('process-rail'), true);
assert.equal(energyComponentsBySlide[7].has('load-curve-band'), false);
assert.equal(energyComponentsBySlide[8].has('governance-table'), true);

const explicitOptionalNativeComponent = normalizeSlide(
  { industry:'energy-utility', title:'显式组件验证' },
  {
    type:'cover',
    title:'显式保留',
    componentHints:[{ id:'asset-status-chip', required:false }]
  },
  1,
  3
);
assert.equal(
  explicitOptionalNativeComponent.componentPlan.componentIds.includes('asset-status-chip'),
  true,
  'explicit optional native-only component hints should remain auditable instead of being silently dropped'
);

const unsafeComponentPlan = {
  slides:[
    {
      type:'content',
      title:'保障叙述页',
      componentPlan:{ version:'component-plan/v1', components:[{ id:'risk-register', required:true }] }
    }
  ]
};
assert.ok(componentPlanAudit(unsafeComponentPlan, unsafeComponentPlan).findings.some(f => f.type === 'riskRegisterWithoutRows'));

console.log('composition planner ok');

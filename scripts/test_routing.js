const assert = require('assert/strict');
const { normalizeDeckPlan, normalizeSlide } = require('./design-system');
const { createRenderRegistry } = require('./render/registry');
const {
  routeIntentDecisionFor
} = require('./design/route-intent-decision');

function route(plan, slide, options = {}) {
  return normalizeSlide(plan, Object.assign({ type:'content' }, slide), options.index ?? 1, options.total ?? 3);
}

function expectRoute(name, plan, slide, expected, options = {}) {
  const out = route(plan, slide, options);
  assert.equal(out.type, expected.type, `${name}: expected type ${expected.type}, got ${out.type}`);
  if (expected.variant !== undefined) {
    assert.equal(out.layoutVariant, expected.variant, `${name}: expected variant ${expected.variant}, got ${out.layoutVariant}`);
  }
  if (expected.notType) {
    assert.notEqual(out.type, expected.notType, `${name}: should not route to ${expected.notType}`);
  }
  return out;
}

const base = { title:'Routing Acceptance', industry:'general-operations' };

const cases = [
  {
    name:'second slide finance agenda',
    plan:{ industry:'finance-investment' },
    slide:{ type:'chapter-divider', title:'组合质量与资本配置', subtitle:'投委会议题路径' },
    expected:{ type:'chapter-divider', variant:'agenda-board' }
  },
  {
    name:'second slide healthcare pathway',
    plan:{ industry:'healthcare-operations' },
    slide:{ type:'chapter-divider', title:'质量、安全与服务体验', subtitle:'患者旅程路径' },
    expected:{ type:'chapter-divider', variant:'pathway-map' }
  },
  {
    name:'manufacturing chapter is not service path',
    plan:{ industry:'manufacturing-operations' },
    slide:{ type:'chapter-divider', title:'从关键产线开始建立运维经营闭环', subtitle:'本次汇报围绕现状、产品包、架构、闭环、证据和治理展开。' },
    expected:{ type:'chapter-divider', variant:'line-agenda' }
  },
  {
    name:'saas chapter adoption agenda',
    plan:{ industry:'saas-technology' },
    slide:{ type:'chapter-divider', title:'平台增长与客户采用', items:[{ title:'平台能力' }, { title:'客户采用' }, { title:'商业结果' }] },
    expected:{ type:'chapter-divider', variant:'adoption-agenda' }
  },
  {
    name:'energy navigation keeps energy sequence',
    plan:{ industry:'energy-utility' },
    slide:{ type:'toc-clean', title:'运维议题路径', items:['多站资产背景','集中运维升级','告警工单闭环','收益复盘机制'] },
    expected:{ type:'toc-clean', variant:'energy-sequence' }
  },
  {
    name:'executive board briefing chapter',
    plan:{ industry:'general-operations' },
    slide:{ type:'chapter-divider', title:'董事会汇报重点', subtitle:'本次审议围绕增长、风险和下一步投入展开。', items:[{ title:'增长判断' }, { title:'风险约束' }, { title:'资源投入' }] },
    expected:{ type:'chapter-divider', variant:'board-briefing' }
  },
  {
    name:'product single hero',
    plan:base,
    slide:{ title:'移动点检终端单品页', product:{ title:'移动点检终端', body:'现场点检、拍照留痕和工单创建。' } },
    expected:{ type:'product-showcase', variant:'hero-object' }
  },
  {
    name:'product matrix',
    plan:base,
    slide:{ title:'产品矩阵', products:['核心平台','移动终端','备件模块','看板模块'] },
    expected:{ type:'product-showcase', variant:'catalog-grid' }
  },
  {
    name:'platform capability map',
    plan:{ industry:'saas-technology' },
    slide:{ title:'平台能力地图', platformCapabilities:['任务空间','自动化','分析视图','治理日志'] },
    expected:{ type:'architecture', variant:'platform-capability-map' }
  },
  {
    name:'manufacturing production topology',
    plan:{ industry:'manufacturing-operations' },
    slide:{ title:'设备运维能力架构', layers:[{title:'设备与现场层',items:['PLC','传感器']},{title:'业务应用层',items:['设备健康','维修工单']},{title:'数据支撑层',items:['设备库','OEE 指标']}] },
    expected:{ type:'architecture', variant:'production-topology' }
  },
  {
    name:'explicit energy topology stays architecture',
    plan:{ industry:'energy-utility' },
    slide:{ type:'architecture', layoutVariant:'energy-topology', title:'能源拓扑', layers:[{ title:'设备侧', items:['逆变器'] }] },
    expected:{ type:'architecture', variant:'energy-topology' }
  },
  {
    name:'service blueprint',
    plan:{ industry:'healthcare-operations' },
    slide:{ title:'患者旅程服务蓝图', serviceBlueprint:[{ title:'预约', patient:'线上预约', frontstage:'客服确认', backstage:'排班', evidence:'等待时长' }] },
    expected:{ type:'architecture', variant:'service-blueprint' }
  },
  {
    name:'linear process with feedback closes',
    plan:{ industry:'manufacturing-operations' },
    slide:{ title:'维修闭环路径', phases:[{title:'发现'},{title:'派工'},{title:'处置'},{title:'复盘'}], note:'数据反馈到策略。' },
    expected:{ type:'timeline', variant:'closed-loop' }
  },
  {
    name:'flywheel stays flywheel',
    plan:{ industry:'brand-retail' },
    slide:{ title:'会员运营增长飞轮', flywheel:[{title:'触达'},{title:'转化'},{title:'复购'},{title:'传播'}] },
    expected:{ type:'timeline', variant:'flywheel' }
  },
  {
    name:'case comparison',
    plan:base,
    slide:{ title:'改造前后证据对比', before:{ image:'before.png' }, after:{ image:'after.png' } },
    expected:{ type:'case-gallery', variant:'case-comparison' }
  },
  {
    name:'retail lookbook',
    plan:{ industry:'brand-retail' },
    slide:{ title:'产品故事与门店 Lookbook', lookbook:true, images:['look1.png','look2.png','look3.png'] },
    expected:{ type:'case-gallery', variant:'lookbook-story' }
  },
  {
    name:'retail editorial proof without images uses structured board',
    plan:{ industry:'brand-retail' },
    slide:{
      title:'产品角色和消费者反馈先形成视觉证据板',
      depthDomain:'editorial-proof',
      chainStage:'visual-claim',
      proofIntent:'visual claim',
      industryObjects:{
        product_skus:['P01 基础款', 'P04 防晒'],
        platforms_channels:['Amazon', 'TikTok Shop'],
        customer_or_user_signals:['物流顾虑', '品质升级']
      },
      productItems:[{ title:'P04 防晒', body:'承担旺季流量入口。' }],
      informationGap:{ title:'素材待确认', body:'缺少真实产品图。' }
    },
    expected:{ type:'report-board', variant:'editorial-proof-board' }
  },
  {
    name:'energy site evidence gallery',
    plan:{ industry:'energy-utility' },
    slide:{ title:'站端现场证据图册', images:['site1.png','site2.png','site3.png'], cards:[{ title:'储能现场' }, { title:'设备细节' }, { title:'区域视角' }] },
    expected:{ type:'case-gallery', variant:'site-evidence' }
  },
  {
    name:'saas prototype flow gallery',
    plan:{ industry:'saas-technology' },
    slide:{ title:'产品原型图册', images:['screen1.png','screen2.png','screen3.png'], cards:[{ title:'工作台' }, { title:'自动化' }, { title:'分析视图' }] },
    expected:{ type:'case-gallery', variant:'prototype-flow' }
  },
  {
    name:'responsibility governance',
    plan:base,
    slide:{ title:'责任闭环', responsibilities:[{owner:'业务', action:'确认'}, {owner:'财务', action:'复核'}] },
    expected:{ type:'risk-table', variant:'responsibility-loop' }
  },
  {
    name:'risk matrix',
    plan:base,
    slide:{ title:'组合风险矩阵', matrix:true, rows:[['高','流动性风险'], ['中','合规风险']] },
    expected:{ type:'risk-table', variant:'risk-matrix' }
  },
  {
    name:'finance bridge',
    plan:{ industry:'finance-investment' },
    slide:{ title:'组合回报归因桥', bridge:[{ label:'起始 IRR', value:12 }, { label:'退出', value:3 }] },
    expected:{ type:'finance-bridge' }
  },
  {
    name:'portfolio table',
    plan:{ industry:'finance-investment' },
    slide:{ title:'组合分层与行动清单', portfolio:[{ company:'A', irr:'18%', dpi:'0.4x', action:'加速退出' }] },
    expected:{ type:'portfolio-table' }
  },
  {
    name:'OEE board',
    plan:{ industry:'manufacturing-operations' },
    slide:{ title:'OEE 与维修效率进入复盘区间', oeeComponents:[{label:'稼动率', value:'92%'}, {label:'性能率', value:'84%'}, {label:'良率', value:'97%'}] },
    expected:{ type:'metric-comparison', variant:'oee-board' }
  },
  {
    name:'healthcare service scorecard',
    plan:{ industry:'healthcare-operations' },
    slide:{ title:'患者体验与响应效率进入改善区间', metrics:[{ label:'满意度', value:'91%' }, { label:'平均等待', value:'24min' }, { label:'闭环率', value:'86%' }] },
    expected:{ type:'metric-comparison', variant:'patient-service-scorecard' }
  },
  {
    name:'retail member growth board',
    plan:{ industry:'brand-retail' },
    slide:{ title:'会员增长指标进入复盘区间', metrics:[{ label:'复购率', value:'42%' }, { label:'客单价', value:'¥680' }, { label:'门店转化', value:'31%' }] },
    expected:{ type:'metric-comparison', variant:'member-growth-board' }
  },
  {
    name:'retail media efficiency routes to scatter matrix',
    plan:{ industry:'brand-retail' },
    slide:{ title:'投放不是少花钱，而是让高效触点进入复购闭环', dataComponent:'scatter-bubble', channelEfficiency:[
      { label:'私域CRM', value:'8x', x:22, y:82 },
      { label:'天猫搜索', value:'4.1x', x:56, y:44 }
    ] },
    expected:{ type:'industry-chart', variant:'channel-efficiency-matrix' }
  },
  {
    name:'retail monthly pulse routes to trend line',
    plan:{ industry:'brand-retail' },
    slide:{ title:'3月把Q1拉回来了，但2月低谷暴露了节点依赖', dataComponent:'trend-line', monthlyPulse:[
      { label:'1月', value:'456.2w' },
      { label:'2月', value:'402.2w' },
      { label:'3月', value:'618.4w' }
    ] },
    expected:{ type:'industry-chart', variant:'monthly-pulse-trend' }
  },
  {
    name:'retail target bridge routes to waterfall',
    plan:{ industry:'brand-retail' },
    slide:{ title:'Q2目标差额约368w，增长桥必须有明确来源', dataComponent:'waterfall-bridge', bridge:[
      { label:'Q1净销', value:'1482w' },
      { label:'P04防晒', value:'+252w' },
      { label:'Q2目标', value:'1850w' }
    ] },
    expected:{ type:'industry-chart', variant:'waterfall-bridge' }
  },
  {
    name:'saas adoption revenue board',
    plan:{ industry:'saas-technology' },
    slide:{ title:'增长指标进入复盘区间', metrics:[{ label:'NRR', value:'118%' }, { label:'激活率', value:'64%' }, { label:'集成客户', value:'72%' }] },
    expected:{ type:'metric-comparison', variant:'adoption-revenue-board' }
  },
  {
    name:'finance portfolio evidence gallery',
    plan:{ industry:'finance-investment' },
    slide:{ title:'组合案例示意图册', images:['a.png','b.png','c.png'], cards:[{title:'项目示意'}, {title:'治理材料'}] },
    expected:{ type:'case-gallery', variant:'portfolio-evidence' }
  },
  {
    name:'healthcare service touchpoint gallery',
    plan:{ industry:'healthcare-operations' },
    slide:{ title:'服务触点示意图册', images:['a.png','b.png','c.png'], cards:[{title:'预约导诊'}, {title:'检查协同'}] },
    expected:{ type:'case-gallery', variant:'service-touchpoint' }
  },
  {
    name:'text heavy report',
    plan:{ densityProfile:'text-heavy' },
    slide:{ title:'运营现状与升级目标', cards:Array.from({ length:7 }, (_, i) => ({ title:`问题 ${i+1}`, body:'这是一段较长的说明文字，用于验证长文案材料进入报告型信息板。' })) },
    expected:{ type:'report-board', notType:'executive-blocks' }
  },
  {
    name:'diagnostic cards beat loop keywords',
    plan:{ industry:'manufacturing-operations' },
    slide:{ title:'现场运维现状与升级目标', subtitle:'当前问题不只是维修慢，而是状态、工单、备件和停机影响没有进入同一张事实表。', cards:[
      { title:'状态不可见', body:'设备运行、报警、点检和维修数据分散。' },
      { title:'响应不稳定', body:'故障发现、派工和备件协调依赖人工沟通。' },
      { title:'损失难量化', body:'停机时间和产能影响缺少统一口径。' },
      { title:'经验难复用', body:'维修经验没有沉淀成知识库。' },
      { title:'备件不协同', body:'库存和工单没有绑定。' },
      { title:'复盘不闭环', body:'月度汇总无法追踪策略更新。' }
    ] },
    expected:{ type:'report-board' }
  },
  {
    name:'image heavy evidence',
    plan:{ visualIntent:'image-rich' },
    slide:{ title:'现场证据图册', images:['a.png','b.png','c.png'] },
    expected:{ type:'case-gallery', variant:'triptych-gallery' }
  },
  {
    name:'number heavy metrics',
    plan:{ densityProfile:'number-heavy' },
    slide:{ title:'增长指标复盘', subtitle:'激活率 64%，NRR 118%，付费转化 22%，流失率 4%。' },
    expected:{ type:'metric-comparison' }
  },
  {
    name:'decision closing',
    plan:base,
    slide:{ title:'下一步行动', subtitle:'收束本轮决策', decision:'确认试点范围、资源投入和复盘节奏。' },
    expected:{ type:'closing', variant:'decision-summary' },
    options:{ index:2, total:3 }
  },
  {
    name:'finance investment closing',
    plan:{ industry:'finance-investment' },
    slide:{ title:'把资本配置回到同一套决策口径', decision:'确认下一季度资本配置。' },
    expected:{ type:'closing', variant:'investment-decision' },
    options:{ index:2, total:3 }
  },
  {
    name:'manufacturing pilot closing',
    plan:{ industry:'manufacturing-operations' },
    slide:{ title:'先把关键产线跑成可复盘闭环', actions:[{ title:'产线' }, { title:'数据' }, { title:'复盘' }] },
    expected:{ type:'closing', variant:'pilot-rollout' },
    options:{ index:2, total:3 }
  },
  {
    name:'healthcare quality closing',
    plan:{ industry:'healthcare-operations' },
    slide:{ title:'先让患者旅程进入可追踪闭环', actions:[{ title:'旅程' }, { title:'质量' }, { title:'治理' }] },
    expected:{ type:'closing', variant:'quality-handoff' },
    options:{ index:2, total:3 }
  },
  {
    name:'saas adoption closing',
    plan:{ industry:'saas-technology' },
    slide:{ title:'把产品采用转成收入增长', actions:[{ title:'采用' }, { title:'集成' }, { title:'收入' }] },
    expected:{ type:'closing', variant:'adoption-close' },
    options:{ index:2, total:3 }
  },
  {
    name:'energy closing keeps energy stage',
    plan:{ industry:'energy-utility' },
    slide:{ title:'让站端证据进入区域化经营', actions:[{ title:'站端' }, { title:'告警' }, { title:'收益' }] },
    expected:{ type:'closing', variant:'energy-stage' },
    options:{ index:2, total:3 }
  },
  {
    name:'thank you closing',
    plan:base,
    slide:{ title:'谢谢观看', subtitle:'期待交流。' },
    expected:{ type:'closing', variant:'thank-you' },
    options:{ index:2, total:3 }
  },
  {
    name:'company intro thank you closing',
    plan:{ industry:'manufacturing-operations', materialIntelligence:{ pptType:'company-intro' }, title:'恒越精工' },
    slide:{ title:'谢谢观看', subtitle:'恒越精工' },
    expected:{ type:'closing', variant:'company-thanks' },
    options:{ index:2, total:3 }
  },
  {
    name:'explicit simple end beats industry default',
    plan:{ industry:'finance-investment' },
    slide:{ title:'正式结束', subtitle:'谢谢观看。', closingVariant:'simple-end' },
    expected:{ type:'closing', variant:'simple-end' },
    options:{ index:2, total:3 }
  }
];

for (const c of cases) {
  expectRoute(c.name, c.plan, c.slide, c.expected, c.options || {});
}

const diversified = normalizeDeckPlan({
  industry:'beauty-consumer',
  slides:[
    { type:'timeline', layoutVariant:'process-board', title:'雾岛测试路径', phases:[{ title:'验证样品' }, { title:'锁定脚本' }] },
    { type:'timeline', layoutVariant:'process-board', title:'Q3落地按「验证样品、锁定脚本、控制备货、阶段复盘」四步推进', subtitle:'6月底前完成选择、条款、样品、脚本和首批备货方案，Q3按阶段复盘。', phases:[{ title:'验证样品' }, { title:'锁定脚本' }, { title:'控制备货' }, { title:'阶段复盘' }] }
  ]
});
assert.equal(diversified.slides[1].type, 'timeline', 'data diversity must not reroute explicit process pages into chart fallbacks');
assert.equal(diversified.slides[1].layoutVariant, 'process-board');
assert.equal(diversified.slides[1].routeIntentDecision.semanticLock, true);

const lockedRouteIntent = routeIntentDecisionFor({
  typePick:{ type:'timeline', reason:'explicit process phases' },
  recipe:{
    id:'editorial-proof-scene',
    renderType:'case-gallery',
    generatedAsset:'editorial proof cover scene'
  }
});
assert.equal(lockedRouteIntent.semanticLock, true);
assert.equal(lockedRouteIntent.sourcePriority, 'user-explicit-route');
assert.deepEqual(lockedRouteIntent.rejectedRewrites.map(item => item.candidateType), ['case-gallery']);

const sanitized = normalizeDeckPlan({
  industry:'finance-investment',
  slides:[{
    type:'portfolio-table',
    title:'组合行动表',
    layoutVariant:'product-evidence-story',
    proofObject:'product-evidence-story',
    chartSpec:{ version:'chartSpec/v1', kind:'bar' },
    dataComponent:'waterfall-bridge',
    assetGeneration:{ status:'required', role:'showcase' },
    generatedAssetPrompt:'make a product image',
    portfolio:[{ company:'A', action:'退出' }]
  }]
}).slides[0];
assert.equal(sanitized.type, 'portfolio-table');
assert.equal(sanitized.layoutVariant, undefined);
assert.notEqual(sanitized.proofObject, 'product-evidence-story');
assert.equal(sanitized.previousProofObject, 'product-evidence-story');
assert.equal(sanitized.chartSpec, undefined);
assert.equal(sanitized.dataComponent, undefined);
assert.equal(sanitized.generatedAssetPrompt, undefined);
assert.equal(sanitized.previousDataComponent, 'waterfall-bridge');
assert.ok(sanitized.routeSanitization, 'stale route metadata should produce routeSanitization audit');
assert.ok(sanitized.routeSanitization.removed.some(item => item.field === 'chartSpec'));
assert.ok(sanitized.routeSanitization.removed.some(item => item.field === 'dataComponent'));
assert.ok(sanitized.routeSanitization.recomputed.some(item => item.field === 'assetGeneration'));

function knownRenderer() {}
function fallbackRenderer() {}
const registry = createRenderRegistry([
  { id:'known-renderer', types:['known-type'], aliases:['known-alias'], source:'routing-test', render:knownRenderer },
  { id:'fallback-renderer', fallback:true, source:'routing-test', render:fallbackRenderer }
]);
const exactMatch = registry.matchFor('known-type');
assert.equal(exactMatch.matchKind, 'exact');
assert.equal(exactMatch.requestedType, 'known-type');
assert.equal(exactMatch.matchedType, 'known-type');
assert.equal(exactMatch.rendererId, 'known-renderer');
assert.equal(exactMatch.render, knownRenderer);
const aliasMatch = registry.matchFor('known-alias');
assert.equal(aliasMatch.matchKind, 'alias');
assert.equal(aliasMatch.requestedType, 'known-alias');
assert.equal(aliasMatch.matchedType, 'known-type');
assert.equal(aliasMatch.alias, 'known-alias');
const fallbackMatch = registry.matchFor('unknown-type');
assert.equal(fallbackMatch.matchKind, 'fallback');
assert.equal(fallbackMatch.requestedType, 'unknown-type');
assert.equal(fallbackMatch.rendererId, 'fallback-renderer');
assert.equal(registry.renderFor('known-type'), knownRenderer);

console.log(`routing acceptance ok (${cases.length} cases)`);

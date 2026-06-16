const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const {
  inferIndustryEvidenceChain,
  normalizeDeckPlan,
  normalizeSlide
} = require('./design-system');
const {
  auditIndustryEvidenceChain
} = require('./qa/industry-evidence-chain-audit');
const {
  canonicalIndustryEvidenceChainForSlide
} = require('./design/industry-evidence-chain');
const {
  applyQualitySeverityPolicy
} = require('./qa/quality-severity-policy');
const {
  slideFromClaim
} = require('./material/claim-to-slide');

const ROOT = path.resolve(__dirname, '..');
const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'examples', 'industry-evidence-chain', 'regression.json'), 'utf8'));

const claimSlideWithModelHints = slideFromClaim({
  claim:'模型给出组件建议',
  support:'模型 hints 只应进入 previous 审计字段。',
  proof_object:'metric-board',
  componentHints:['kpi-strip'],
  componentSuggestions:['caption-bar'],
  metrics:[{ label:'OEE', value:'82%' }]
});
assert.equal(claimSlideWithModelHints.componentHints, undefined);
assert.deepEqual(claimSlideWithModelHints.previousComponentHints, ['kpi-strip']);
assert.deepEqual(claimSlideWithModelHints.previousComponentSuggestions, ['caption-bar']);

const industrialClaimWithConsumerPlan = slideFromClaim({
  claim:'OEE 和质量得分证明现场效率改善',
  support:'设备效率改善来自现场质量动作。',
  proof_object:'oee-board',
  metrics:[{ label:'OEE', value:'82%' }],
  componentHints:['hero-image', 'caption-bar'],
  componentPlan:{
    version:'component-plan/v1',
    industryEvidenceChain:{ chainId:'consumer-beauty', stageId:'visual-claim', components:['hero-image', 'caption-bar'] },
    components:[{ id:'hero-image', required:true }, { id:'caption-bar', required:true }]
  }
});
assert.deepEqual(industrialClaimWithConsumerPlan.previousComponentHints, ['hero-image', 'caption-bar']);
industrialClaimWithConsumerPlan.type = 'metric-comparison';
industrialClaimWithConsumerPlan.layoutVariant = 'oee-board';
industrialClaimWithConsumerPlan.oee = { quality:'96%' };
const normalizedIndustrialClaim = normalizeSlide({ industry:'manufacturing-operations' }, industrialClaimWithConsumerPlan, 0, 1);
assert.equal(normalizedIndustrialClaim.componentPlan.componentIds.includes('hero-image'), false);
assert.equal(
  normalizedIndustrialClaim.componentPlan.components.some(component => component.id === 'caption-bar' && component.source === 'component-hint'),
  false
);
assert.ok(normalizedIndustrialClaim.previousComponentPlan);
assert.equal(normalizedIndustrialClaim.previousComponentHints.length, 2);

const userDeckHintStillExecutes = normalizeSlide({ industry:'manufacturing-operations' }, {
  type:'metric-comparison',
  layoutVariant:'oee-board',
  proofObject:'oee-board',
  title:'用户 deck plan 显式组件偏好',
  metrics:[{ label:'OEE', value:'82%' }],
  oee:{ quality:'96%' },
  componentHints:['kpi-strip']
}, 0, 1);
assert.ok(
  userDeckHintStillExecutes.componentPlan.components.some(component => component.id === 'kpi-strip' && component.source === 'component-hint'),
  'direct user deck componentHints should remain executable'
);

const structuredEditorialProof = normalizeSlide({ industry:'brand-retail' }, {
  type:'report-board',
  layoutVariant:'editorial-proof-board',
  proofObject:'editorial-proof-board',
  title:'产品角色和消费者反馈先形成视觉证据板',
  depthDomain:'editorial-proof',
  chainStage:'visual-claim',
  proofIntent:'visual claim',
  productItems:[{ title:'P04 防晒', body:'承担旺季流量入口。' }],
  informationGap:{ title:'素材待确认', body:'缺少真实产品图。' }
}, 1, 4);
const structuredEditorialChain = canonicalIndustryEvidenceChainForSlide({ industry:'brand-retail' }, structuredEditorialProof);
assert.equal(structuredEditorialChain.chainId, 'consumer-beauty');
assert.equal(structuredEditorialChain.stageId, 'visual-claim');
assert.ok(structuredEditorialChain.components.includes('product-matrix'));

const nativeEnergyRiskPage = normalizeSlide({ industry:'energy-utility' }, {
  type:'risk-table',
  layoutVariant:'governance-table-editorial',
  proofObject:'governance-table-editorial',
  title:'风险与保障',
  rows:[['设备协议差异', '高', '分批接入核心站点']]
}, 0, 1);
assert.equal(nativeEnergyRiskPage.componentPlan.industryEvidenceChain.stageId, 'native-risk-governance');
assert.ok(nativeEnergyRiskPage.componentPlan.componentIds.includes('governance-table'));
assert.equal(nativeEnergyRiskPage.componentPlan.componentIds.includes('risk-register'), false);
const nativeRiskChain = nativeEnergyRiskPage.componentPlan.industryEvidenceChain;
const nativeRiskConsumed = id => ({
  id,
  rendered:true,
  chainStage:nativeRiskChain.stageId,
  chainStageLabel:nativeRiskChain.stageLabel,
  evidenceReason:'native risk/governance fallback',
  industryEvidenceChain:{ chainId:nativeRiskChain.chainId, stageId:nativeRiskChain.stageId },
  bbox:{ x:1, y:1, w:4, h:2 },
  itemCount:1,
  rendererMethod:`drawIndustryComponent:${id}`,
  rendererModule:'components/industry-native'
});
assert.equal(
  auditIndustryEvidenceChain(
    { industry:'energy-utility', slides:[nativeEnergyRiskPage] },
    null,
    { renderMeta:{ slides:[{ slide:1, consumedComponents:[
      nativeRiskConsumed('governance-table')
    ] }] } }
  ).status,
  'pass',
  'native risk/governance pages without metric evidence should not be forced into metric-only industry evidence stages'
);

const saasStrategyMap = normalizeSlide({ industry:'saas-technology' }, {
  type:'strategy-map',
  layoutVariant:'single-object-concept-map',
  title:'围绕客户工作台组织自动化、治理和收入扩展',
  drivers:['任务入口', '数据事件', '权限边界'],
  actions:['AI 摘要', '审批协同', '集成 API', '审计留痕'],
  outcomes:['激活提升', '续约稳定', '扩展收入改善']
}, 2, 9);
assert.equal(
  saasStrategyMap.componentPlan.componentIds.includes('governance-table'),
  false,
  'SaaS strategy maps with governance words but no rows must not plan a duplicate governance table'
);

const saasPrototypeFlow = normalizeSlide({ industry:'saas-technology' }, {
  type:'case-gallery',
  layoutVariant:'prototype-flow',
  title:'原型证据板展示对象、动作和价值信号',
  subtitle:'界面截图承担产品证明作用，不伪造真实客户界面。',
  images:['screen-1.png', 'screen-2.png', 'screen-3.png'],
  cards:[{ title:'工作台对象' }, { title:'自动化路径' }, { title:'价值读数' }]
}, 4, 9);
assert.equal(saasPrototypeFlow.componentPlan.componentIds.includes('workflow-rail'), true);
assert.equal(saasPrototypeFlow.componentPlan.componentIds.includes('adoption-funnel'), false);
assert.equal(saasPrototypeFlow.componentPlan.industryEvidenceChain.stageId, 'workflow-implementation');

const saasRevenueBoard = normalizeSlide({ industry:'saas-technology' }, {
  type:'metric-comparison',
  layoutVariant:'adoption-revenue-board',
  title:'收入扩展来自激活率、集成深度和席位增长',
  metrics:[{ label:'NRR', value:'118%' }, { label:'激活率', value:'64%' }]
}, 6, 9);
assert.equal(saasRevenueBoard.componentPlan.componentIds.includes('kpi-strip'), true);
assert.equal(saasRevenueBoard.componentPlan.componentIds.includes('adoption-funnel'), false);
assert.equal(
  saasRevenueBoard.componentPlan.components.some(component => component.id === 'adoption-funnel' && component.required !== false),
  false,
  'SaaS adoption revenue KPI pages must not require adoption-funnel without funnel fields'
);

const saasPermissionGovernance = normalizeSlide({ industry:'saas-technology' }, {
  type:'risk-table',
  layoutVariant:'permission-governance',
  title:'企业客户采购前必须看清权限、审计和数据边界',
  rows:[['权限边界不清', '高', 'SSO、角色和数据范围同步定义']]
}, 7, 9);
assert.equal(saasPermissionGovernance.proofObject, 'saas-governance-loop');
assert.equal(saasPermissionGovernance.componentPlan.componentIds.includes('governance-table'), true);
assert.equal(saasPermissionGovernance.componentPlan.industryEvidenceChain.coveragePolicy.requiredAny.includes('governance-table'), true);

const saasAutomationTimeline = normalizeSlide({ industry:'saas-technology' }, {
  type:'timeline',
  layoutVariant:'automation-workflow',
  title:'落地路径从一个核心工作流扩展到多部门平台化',
  phases:[{ title:'首个团队' }, { title:'系统集成' }, { title:'扩展席位' }]
}, 8, 9);
assert.equal(saasAutomationTimeline.proofObject, 'automation-workflow');
assert.equal(saasAutomationTimeline.componentPlan.industryEvidenceChain.stageId, 'workflow-implementation');
assert.equal(saasAutomationTimeline.componentPlan.componentIds.includes('workflow-rail'), true);

const industrialDeckWithUnsupportedHint = normalizeDeckPlan({
  industry:'manufacturing-operations',
  slides:[{
    type:'metric-comparison',
    layoutVariant:'oee-board',
    proofObject:'oee-board',
    title:'工业页带无证据 hero hint',
    metrics:[{ label:'OEE', value:'82%' }],
    oee:{ quality:'96%' },
    componentHints:['hero-image']
  }]
});
const unsupportedHintAudit = auditIndustryEvidenceChain(industrialDeckWithUnsupportedHint);
assert.ok(
  unsupportedHintAudit.findings.some(finding => finding.type === 'componentHintEvidenceMissing' && finding.componentId === 'hero-image'),
  'QA should flag component-hint outside the canonical industry chain without evidence fields'
);

function renderMetaFor(plan = {}) {
  return {
    version: 'render-meta/v1',
    slideCount: (plan.slides || []).length,
    slides: (plan.slides || []).map((slide, index) => {
      const chain = slide.componentPlan && slide.componentPlan.industryEvidenceChain;
      const planned = new Set((slide.componentPlan && slide.componentPlan.componentIds) || []);
      const consumed = ((chain && chain.components) || [])
        .filter(id => planned.has(id))
        .map(id => ({
          id,
          rendered: true,
          mode: 'native-renderer',
          nativeSlot: `${id}-fixture-slot`,
          drawnCount: 1,
          itemCount: 1,
          bbox: { id:`${id}-fixture-slot`, x:0.8, y:1.0, w:2.0, h:0.5, role:'native' },
          rendererModule: 'test/industry-evidence-chain',
          rendererMethod: 'nativeDrawnEvidenceFor',
          evidence: `fixture consumed ${id}`,
          chainStage: chain.stageId,
          chainStageLabel: chain.stageLabel,
          evidenceReason: (chain.evidenceReasons || []).join('; '),
          industryEvidenceChain: {
            chainId: chain.chainId,
            stageId: chain.stageId,
            stageLabel: chain.stageLabel
          }
        }));
      return {
        slide: index + 1,
        type: slide.type,
        layoutVariant: slide.layoutVariant || '',
        plannedComponents: Array.from(planned).map(id => ({ id, required:true })),
        drawnComponents: consumed,
        consumedComponents: consumed,
        missingRequiredComponents: []
      };
    })
  };
}

assert.equal(fixture.version, 'industry-evidence-chain-fixtures/v1');
assert.equal(fixture.samples.length, 8);

const sameSemanticIndustrial = normalizeSlide(
  { industry:'manufacturing-operations', title:'产品能力证据' },
  {
    type:'metric-comparison',
    layoutVariant:'oee-board',
    proofObject:'oee-board',
    title:'产品能力证据落在 OEE、质量和现场交付',
    metrics:[{ label:'OEE', value:'82%' }],
    oee:{ availability:'90%' },
    cards:[{ title:'质量复盘', body:'停机和良率回到设备动作。' }],
    proof:{ explanation:'工业证据链不使用消费 SKU 矩阵。' }
  },
  1,
  3
);
assert.equal(sameSemanticIndustrial.componentPlan.componentIds.includes('quality-scorecard'), true);
assert.equal(sameSemanticIndustrial.componentPlan.componentIds.includes('product-matrix'), false);

const staleConsumerPlanOnIndustrial = normalizeSlide(
  { industry:'manufacturing-operations', title:'旧计划污染治理' },
  {
    type:'metric-comparison',
    layoutVariant:'oee-board',
    proofObject:'oee-board',
    title:'OEE 和质量得分证明现场效率改善',
    metrics:[{ label:'OEE', value:'82%' }],
    oee:{ availability:'90%', quality:'96%' },
    componentPlan:{
      version:'component-plan/v1',
      industryEvidenceChain:{
        chainId:'consumer-beauty',
        chainLabel:'消费/美妆',
        stageId:'visual-claim',
        stageLabel:'视觉主张',
        position:1,
        confidence:'high',
        components:['hero-image', 'caption-bar'],
        matchedFields:['images'],
        matchedProofObjects:['lookbook'],
        matchedKeywords:[]
      },
      componentIds:['hero-image', 'caption-bar'],
      components:[{ id:'hero-image', required:true }, { id:'caption-bar', required:true }]
    }
  },
  1,
  3
);
assert.equal(staleConsumerPlanOnIndustrial.componentPlan.industryEvidenceChain.chainId, 'industrial-manufacturing');
assert.equal(staleConsumerPlanOnIndustrial.componentPlan.industryEvidenceChain.stageId, 'operations-quality-evidence');
assert.equal(staleConsumerPlanOnIndustrial.componentPlan.componentIds.includes('quality-scorecard'), true);
assert.equal(staleConsumerPlanOnIndustrial.componentPlan.componentIds.includes('hero-image'), false);
assert.equal(staleConsumerPlanOnIndustrial.componentPlan.industryEvidenceChain.components.includes('caption-bar'), true);
assert.equal(staleConsumerPlanOnIndustrial.previousIndustryEvidenceChain.chainId, 'consumer-beauty');
assert.equal(staleConsumerPlanOnIndustrial.industryEvidenceChainConflict.currentChainId, 'industrial-manufacturing');
const staleConsumerAudit = auditIndustryEvidenceChain(
  { industry:'manufacturing-operations' },
  { industry:'manufacturing-operations', slides:[staleConsumerPlanOnIndustrial] }
);
assert.ok(
  staleConsumerAudit.findings.some(finding => finding.type === 'industryEvidenceChainStale'),
  'QA should expose suppressed stale chain on normalized slides'
);
assert.equal(staleConsumerAudit.industry_evidence_chain_summary.conflictSummary.suppressedComponentPlanSlides, 1);

const previousSameStageWrongComponents = normalizeSlide(
  { industry:'manufacturing-operations' },
  {
    type:'industry-chart',
    layoutVariant:'oee-board',
    proofObject:'downtime-pareto',
    title:'OEE 停机损失需要按设备和原因拆解',
    metrics:[{ label:'OEE', value:'64%' }],
    componentPlan:{
      version:'component-plan/v1',
      industryEvidenceChain:{
        chainId:'industrial-manufacturing',
        stageId:'operations-quality-evidence',
        components:['hero-image', 'product-matrix'],
        matchedFields:[],
        matchedProofObjects:[],
        matchedKeywords:[],
        matchedRoutes:[],
        evidenceReasons:[]
      }
    }
  },
  1,
  3
);
const previousSameStageAudit = auditIndustryEvidenceChain(
  { industry:'manufacturing-operations' },
  { industry:'manufacturing-operations', slides:[previousSameStageWrongComponents] }
);
assert.ok(
  previousSameStageAudit.findings.some(finding => finding.type === 'previousIndustryEvidenceChainComponentMismatch'),
  'QA should flag same-stage previous chain component mismatches'
);
assert.equal(previousSameStageAudit.industry_evidence_chain_summary.conflictSummary.previousChainComponentMismatchSlides, 1);

const suppressedGeneratedPromptPlan = normalizeDeckPlan({
  industry:'manufacturing-operations',
  slides:[{
    type:'industry-chart',
    proofObject:'downtime-pareto',
    title:'OEE 停机损失',
    claim:'OEE 停机损失需要按设备和原因拆解。',
    metrics:[{ label:'OEE', value:'64%' }],
    assetGeneration:{ status:'required', decisionSource:'asset-generation-policy/v1', reason:'old prompt decision' },
    generatedAssetPrompt:'old consumer lookbook product hero image prompt'
  }]
});
assert.equal(suppressedGeneratedPromptPlan.slides[0].generatedAssetPrompt, undefined);
assert.equal(suppressedGeneratedPromptPlan.slides[0].previousGeneratedAssetPrompt, 'old consumer lookbook product hero image prompt');
assert.equal(
  auditIndustryEvidenceChain(suppressedGeneratedPromptPlan).industry_evidence_chain_summary.conflictSummary.suppressedGeneratedPromptSlides,
  1,
  'compact summary should expose suppressed generated prompt slides'
);

const rawAuditWithSuppressedInputChain = auditIndustryEvidenceChain({
  industry:'manufacturing-operations',
  slides:[{
    type:'content',
    title:'普通说明页',
    claim:'没有足够工业证据字段',
    componentPlan:{
      version:'component-plan/v1',
      industryEvidenceChain:{
        chainId:'consumer-beauty',
        stageId:'consumer-product-scene-proof',
        components:['product-matrix'],
        matchedFields:[],
        matchedProofObjects:[],
        matchedKeywords:[],
        matchedRoutes:[],
        evidenceReasons:[]
      },
      componentIds:['product-matrix'],
      components:[{ id:'product-matrix', source:'component-hint', required:true }]
    }
  }]
});
assert.notEqual(rawAuditWithSuppressedInputChain.slides[0].chainId, 'consumer-beauty');
assert.ok(
  rawAuditWithSuppressedInputChain.findings.some(finding => finding.type === 'industryEvidenceChainInputSuppressed'),
  'raw QA should suppress supplied chains instead of treating them as current chain'
);

const canonicalGrammarProbe = canonicalIndustryEvidenceChainForSlide(
  { industry:'manufacturing-operations' },
  {
    type:'industry-chart',
    proofObject:'downtime-pareto',
    title:'OEE 停机损失',
    metrics:[{ label:'OEE', value:'64%' }],
    componentPlan:{
      industryEvidenceChain:{
        chainId:'industrial-manufacturing',
        stageId:'operations-quality-evidence',
        components:['quality-scorecard'],
        matchedFields:['metrics'],
        matchedProofObjects:['downtime-pareto'],
        visualGrammar:{ source:'stale-consumer-grammar' }
      }
    }
  }
);
assert.equal(canonicalGrammarProbe.visualGrammar, null, 'canonical chain should not inherit supplied visualGrammar');

const sameSemanticConsumer = normalizeSlide(
  { industry:'beauty-consumer', title:'产品能力证据' },
  {
    type:'case-gallery',
    layoutVariant:'product-evidence-story',
    proofObject:'product-evidence-story',
    title:'产品能力证据落在 SKU、质地和体验承诺',
    images:['sku.png'],
    productStory:[{ product:'精华', scene:'修护', benefit:'质地证明', businessMeaning:'复购入口' }],
    proof:{ explanation:'消费证据链使用产品矩阵承接体验承诺。' }
  },
  1,
  3
);
assert.equal(sameSemanticConsumer.componentPlan.componentIds.includes('product-matrix'), true);
assert.equal(sameSemanticConsumer.componentPlan.componentIds.includes('equipment-nameplate'), false);

const peopleMissionStatement = normalizeSlide(
  { industry:'people-culture-company', title:'文化证据' },
  {
    type:'manifesto',
    layoutVariant:'mission-statement-stage',
    proofObject:'mission-statement-stage',
    title:'使命和文化主张需要被具体行为承接',
    values:[
      { title:'客户现场', body:'团队把真实场景带回产品决策。' },
      { title:'共同复盘', body:'跨职能把交付问题转成机制。' }
    ]
  },
  2,
  5
);
assert.equal(peopleMissionStatement.componentPlan.industryEvidenceChain.stageId, 'mission-culture-claim');
assert.equal(peopleMissionStatement.componentPlan.componentIds.includes('content-card-grid'), true);
assert.equal(peopleMissionStatement.componentPlan.componentIds.includes('value-chain'), false);

const peopleCultureCover = normalizeSlide(
  { industry:'people-culture-company', title:'文化证据', media:{ cover:'acceptance://people-culture-company/cover.png' } },
  {
    type:'cover',
    layoutVariant:'airy-concept-opening',
    title:'星火数科文化与组织介绍',
    subtitle:'用使命、团队证据和价值观行为说明公司为什么值得加入'
  },
  0,
  5
);
assert.equal(peopleCultureCover.layoutVariant, 'culture-cover-with-soft-geometry');
assert.equal(peopleCultureCover.proofObject, 'culture-cover-with-soft-geometry');
assert.equal(peopleCultureCover.componentPlan.industryEvidenceChain.stageId, 'culture-opening-claim');
assert.equal(peopleCultureCover.componentPlan.componentIds.includes('hero-image'), true);
assert.equal(peopleCultureCover.componentPlan.componentIds.includes('commentary-panel'), true);

const peopleGrowthTimeline = normalizeSlide(
  { industry:'people-culture-company', title:'成长机制' },
  {
    type:'timeline',
    layoutVariant:'closed-loop',
    title:'新人从入职、跟项目到独立负责有清晰成长路径',
    phases:[{ title:'入职' }, { title:'跟项目' }, { title:'独立负责' }]
  },
  3,
  5
);
assert.equal(peopleGrowthTimeline.componentPlan.industryEvidenceChain.stageId, 'neutral-general');
assert.equal(peopleGrowthTimeline.componentPlan.componentIds.includes('process-rail'), true);

const peopleClosingAnchor = normalizeSlide(
  { industry:'people-culture-company', title:'组织收口' },
  {
    type:'closing',
    proofObject:'premium-closing-anchor',
    title:'下一步行动收口到组织节奏',
    recommendation:'把招聘、培养和交付复盘放进同一套管理节奏。'
  },
  5,
  5
);
assert.equal(peopleClosingAnchor.componentPlan.industryEvidenceChain.stageId, 'organization-growth-evidence');
assert.equal(peopleClosingAnchor.componentPlan.componentIds.includes('decision-panel'), true);
assert.equal(peopleClosingAnchor.componentPlan.componentIds.includes('kpi-strip'), false);

const keywordHeavyFinance = normalizeSlide(
  { industry:'finance-investment', title:'同词不同业' },
  {
    type:'portfolio-table',
    layoutVariant:'portfolio-action-table',
    proofObject:'portfolio-action-table',
    title:'风险 收益 风险 收益 风险 但结构字段是组合配置',
    portfolio:[{ name:'项目A', allocation:'20%' }],
    rows:[['项目A', '增持', '现金流修复']],
    sourceNote:'组合月报，2026-05。'
  },
  2,
  3
);
assert.equal(keywordHeavyFinance.componentPlan.industryEvidenceChain.stageId, 'asset-portfolio-logic');

const sameWords = '质量 效率 风险 产品 流程 证据';
const confusionMatrix = [
  {
    industry: 'manufacturing-operations',
    slide: {
      type:'metric-comparison',
      layoutVariant:'oee-board',
      proofObject:'oee-board',
      title:sameWords,
      metrics:[{ label:'OEE', value:'82%' }],
      oee:{ quality:'96%' }
    },
    stage: 'operations-quality-evidence',
    component: 'quality-scorecard'
  },
  {
    industry: 'beauty-consumer',
    slide: {
      type:'case-gallery',
      layoutVariant:'product-evidence-story',
      proofObject:'product-evidence-story',
      title:sameWords,
      images:['sku.png'],
      productStory:[{ product:'精华', benefit:'体验证明' }]
    },
    stage: 'product-experience-promise',
    component: 'product-matrix'
  },
  {
    industry: 'finance-investment',
    slide: {
      type:'risk-table',
      layoutVariant:'guidance-and-risk-board',
      proofObject:'guidance-and-risk-board',
      title:sameWords,
      metrics:[{ label:'IRR', value:'18%' }],
      risks:[{ title:'集中度', level:'高' }],
      rows:[['集中度', '高', '设置上限']],
      sourceNote:'风控台账，2026-05。'
    },
    stage: 'return-risk-evidence',
    component: 'risk-register'
  },
  {
    industry: 'healthcare-operations',
    slide: {
      type:'architecture',
      layoutVariant:'service-blueprint',
      proofObject:'service-blueprint',
      title:sameWords,
      serviceBlueprint:{ stages:['预约', '检查'], frontstage:['导诊'], backstage:['检验科'] },
      touchpoints:[{ title:'检查交接', owner:'影像科' }],
      handoffs:[{ title:'检查到随访', owner:'护士站' }]
    },
    stage: 'process-touchpoint',
    component: 'service-blueprint-lane'
  },
  {
    industry: 'saas-technology',
    slide: {
      type:'industry-chart',
      layoutVariant:'adoption-funnel',
      proofObject:'adoption-funnel',
      title:sameWords,
      adoptionFunnel:{ steps:[{ label:'注册', value:'100%' }, { label:'激活', value:'64%' }] },
      metrics:[{ label:'NRR', value:'118%' }]
    },
    stage: 'adoption-efficiency-evidence',
    component: 'adoption-funnel'
  }
];
confusionMatrix.forEach(testCase => {
  const normalized = normalizeSlide({ industry:testCase.industry }, testCase.slide, 1, 3);
  assert.equal(normalized.componentPlan.industryEvidenceChain.stageId, testCase.stage, `${testCase.industry} same-word stage`);
  assert.equal(normalized.componentPlan.componentIds.includes(testCase.component), true, `${testCase.industry} same-word component`);
});

const saasPrototypeWithoutScreens = normalizeSlide(
  { industry:'saas-technology' },
  {
    type:'case-gallery',
    layoutVariant:'prototype-flow',
    proofObject:'prototype-flow',
    title:'工作流原型缺少截图时不生成空壳 prototype-frame',
    workflow:[{ title:'审批', body:'状态回写。' }]
  },
  2,
  3
);
assert.equal(saasPrototypeWithoutScreens.componentPlan.componentIds.includes('workflow-rail'), true);
assert.equal(saasPrototypeWithoutScreens.componentPlan.componentIds.includes('prototype-frame'), false);

const neutral = inferIndustryEvidenceChain(
  { industry:'manufacturing-operations' },
  { type:'content', title:'普通管理叙述', cards:[{ title:'背景', body:'说明方向。' }] }
);
assert.equal(neutral.stageId, 'neutral-general');
assert.equal(neutral.confidence, 'neutral');

const badIndustrialBrandized = {
  industry:'manufacturing-operations',
  slides:[{
    type:'metric-comparison',
    title:'工业页被消费品牌化',
    componentPlan:{
      version:'component-plan/v1',
      industryEvidenceChain:{
        chainId:'industrial-manufacturing',
        chainLabel:'工业制造',
        stageId:'operations-quality-evidence',
        stageLabel:'运营/质量证据',
        position:3,
        confidence:'high',
        components:['quality-scorecard'],
        matchedFields:['metrics'],
        matchedProofObjects:['oee-board'],
        matchedKeywords:[]
      },
      componentIds:['product-matrix'],
      components:[{ id:'product-matrix', required:true }]
    },
    metrics:[{ label:'OEE', value:'82%' }]
  }]
};
assert.ok(
  auditIndustryEvidenceChain(badIndustrialBrandized).findings.some(finding => finding.type === 'crossIndustryComponentMismatch'),
  'QA should flag industrial page consumer-brandized as product-matrix'
);

const badConsumerIndustrialized = {
  industry:'beauty-consumer',
  slides:[{
    type:'case-gallery',
    title:'消费页被工业化',
    componentPlan:{
      version:'component-plan/v1',
      industryEvidenceChain:{
        chainId:'consumer-beauty',
        chainLabel:'消费/美妆',
        stageId:'product-experience-promise',
        stageLabel:'产品/体验承诺',
        position:2,
        confidence:'high',
        components:['product-matrix'],
        matchedFields:['productStory'],
        matchedProofObjects:['product-evidence-story'],
        matchedKeywords:[]
      },
      componentIds:['equipment-nameplate'],
      components:[{ id:'equipment-nameplate', required:true }]
    },
    productStory:[{ product:'精华' }]
  }]
};
assert.ok(
  auditIndustryEvidenceChain(badConsumerIndustrialized).findings.some(finding => finding.type === 'crossIndustryComponentMismatch'),
  'QA should flag consumer page industrialized as equipment-nameplate'
);

const malformedStaleChain = {
  industry:'manufacturing-operations',
  slides:[{
    type:'metric-comparison',
    layoutVariant:'oee-board',
    proofObject:'oee-board',
    title:'OEE 质量证据带着坏的旧 chain',
    metrics:[{ label:'OEE', value:'82%' }],
    oee:{ quality:'96%' },
    componentPlan:{
      version:'component-plan/v1',
      industryEvidenceChain:{
        chainId:'consumer-beauty',
        stageId:'visual-claim'
      },
      componentIds:['quality-scorecard'],
      components:[{ id:'quality-scorecard', required:true }]
    }
  }]
};
const malformedReport = auditIndustryEvidenceChain(malformedStaleChain);
assert.ok(
  malformedReport.findings.some(finding => finding.type === 'industryEvidenceChainInvalid'),
  'QA should flag malformed input chain instead of throwing planUnreadable'
);
assert.ok(
  malformedReport.findings.some(finding => finding.type === 'industryEvidenceChainMismatch'),
  'QA should flag stale input chain identity mismatch'
);
assert.equal(
  malformedReport.findings.some(finding => finding.type === 'planUnreadable'),
  false,
  'malformed input chain should not be reported as planUnreadable'
);
assert.equal(
  malformedReport.industry_evidence_chain_summary.conflictSummary.chainMismatchSlides,
  1,
  'compact summary should count unique chain mismatch slides'
);
assert.equal(
  malformedReport.industry_evidence_chain_summary.conflictSummary.chainMismatchFindings,
  2,
  'compact summary should expose chain mismatch finding count separately'
);

const malformedPreviousNormalized = normalizeDeckPlan(malformedStaleChain);
const malformedPreviousReport = auditIndustryEvidenceChain(malformedStaleChain, malformedPreviousNormalized);
assert.ok(
  malformedPreviousReport.findings.some(finding => finding.type === 'previousIndustryEvidenceChainInvalid'),
  'normalized QA should preserve malformed previous chain diagnostics'
);
assert.equal(
  malformedPreviousReport.industry_evidence_chain_summary.conflictSummary.previousChainInvalidSlides,
  1,
  'compact summary should count malformed previous chain slides'
);

const missingSegment = normalizeDeckPlan({
  industry:'finance-investment',
  title:'缺段金融证据链',
  slides:[
    fixture.samples[2].plan.slides[0],
    fixture.samples[2].plan.slides[0],
    fixture.samples[2].plan.slides[2]
  ]
});
assert.ok(
  auditIndustryEvidenceChain(missingSegment).findings.some(finding => finding.type === 'chainSegmentMissing'),
  'QA should flag chain segment missing'
);

const consumerMissingVisualStage = normalizeDeckPlan({
  industry:'brand-retail',
  title:'消费零售缺视觉主张',
  slides:[
    { type:'product-showcase', proofObject:'product-evidence-story', title:'SKU 角色承接产品承诺', products:['P01', 'P04'] },
    { type:'industry-chart', layoutVariant:'member-cohort-ladder', proofObject:'member-cohort-ladder', title:'会员分层进入复购路径', memberCohorts:[{ label:'高频会员', value:42 }] },
    { type:'industry-chart', layoutVariant:'channel-efficiency-matrix', proofObject:'channel-efficiency-matrix', title:'渠道效率按 ROAS 分层', channelEfficiency:[{ label:'Amazon', x:50, y:70, value:'4.2x' }] }
  ]
});
const consumerVisualGap = auditIndustryEvidenceChain(consumerMissingVisualStage).findings.find(finding =>
  finding.type === 'chainSegmentMissing' && finding.chainId === 'consumer-beauty' && finding.stageId === 'visual-claim'
);
assert.ok(consumerVisualGap, 'consumer/retail chain should flag missing visual claim stage');
assert.equal(consumerVisualGap.recommendation.suggestedPage, '产品/品牌/视觉证据页');
assert.ok(consumerVisualGap.recommendation.requiredFields.some(field => /editorialProof/.test(field)));

const consumer = normalizeDeckPlan(fixture.samples[1].plan);
const requiredAnyAlternativeMeta = renderMetaFor(consumer);
requiredAnyAlternativeMeta.slides[1].consumedComponents = requiredAnyAlternativeMeta.slides[1].consumedComponents.filter(component => component.id !== 'product-matrix');
assert.equal(
  auditIndustryEvidenceChain(fixture.samples[1].plan, consumer, { renderMeta: requiredAnyAlternativeMeta }).findings.some(finding => finding.type === 'industryEvidenceComponentNotConsumed'),
  false,
  'QA should not fail an unconsumed requiredAny candidate when another requiredAny component was consumed'
);
const requiredAllDeck = normalizeDeckPlan(fixture.samples[5].plan);
const missingConsumptionMeta = renderMetaFor(requiredAllDeck);
missingConsumptionMeta.slides[2].consumedComponents = missingConsumptionMeta.slides[2].consumedComponents.filter(component => component.id !== 'kpi-strip');
assert.ok(
  auditIndustryEvidenceChain(fixture.samples[5].plan, requiredAllDeck, { renderMeta: missingConsumptionMeta }).findings.some(finding => finding.type === 'industryEvidenceComponentNotConsumed'),
  'QA should flag planned requiredAll industry component not consumed by renderer'
);

const missingRenderMetaFields = renderMetaFor(consumer);
delete missingRenderMetaFields.slides[1].consumedComponents[0].chainStage;
missingRenderMetaFields.slides[1].consumedComponents[0].bbox = null;
assert.ok(
  auditIndustryEvidenceChain(fixture.samples[1].plan, consumer, { renderMeta: missingRenderMetaFields }).findings.some(finding => finding.type === 'industryEvidenceRenderMetaFieldMissing'),
  'QA should flag missing industry render-meta chain fields'
);
assert.ok(
  auditIndustryEvidenceChain(fixture.samples[1].plan, consumer, { renderMeta: missingRenderMetaFields }).findings.some(finding => finding.type === 'industryEvidenceComponentBboxMissing'),
  'QA should flag missing industry component bbox'
);

const formalSeverity = applyQualitySeverityPolicy([
  { level:'review', type:'chainSegmentMissing', message:'missing stage' },
  { level:'review', type:'crossIndustryComponentMismatch', message:'wrong component' },
  { level:'review', type:'prototypeEvidenceMissing', message:'missing prototype screenshot' },
  { level:'review', type:'healthcareHandoffEvidenceMissing', message:'missing handoff fields' },
  { level:'review', type:'sourceCoverageLow', message:'missing source' },
  { level:'review', type:'componentHintEvidenceMissing', message:'unsupported hint' },
  { level:'review', type:'industryEvidenceChainInputSuppressed', message:'input chain suppressed' },
  { level:'review', type:'previousIndustryEvidenceChainInvalid', message:'previous chain invalid' },
  { level:'review', type:'previousIndustryEvidenceChainComponentMismatch', message:'previous chain components mismatch' }
], 'formal');
assert.equal(formalSeverity.findings.every(finding => finding.level === 'fail'), true);

console.log('industry evidence chain ok');

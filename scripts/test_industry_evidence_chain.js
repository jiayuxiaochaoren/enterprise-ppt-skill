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
  applyQualitySeverityPolicy
} = require('./qa/quality-severity-policy');
const {
  slideFromClaim
} = require('./material/claim-to-slide');

const ROOT = path.resolve(__dirname, '..');
const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'examples', 'industry-evidence-chain', 'regression.json'), 'utf8'));

const claimSlideWithModelPlan = slideFromClaim({
  claim:'模型给了旧组件计划',
  support:'组件计划应降级为 previous 审计字段。',
  proof_object:'metric-board',
  componentPlan:{
    components:[
      { id:'hero-image', required:true },
      { id:'kpi-strip', required:true }
    ]
  },
  metrics:[{ label:'OEE', value:'82%' }]
});
assert.equal(claimSlideWithModelPlan.componentPlan, undefined);
assert.ok(claimSlideWithModelPlan.previousComponentPlan);
assert.equal(claimSlideWithModelPlan.componentHints, undefined);

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

const expectedStagesBySample = {
  'manufacturing-oee-evidence-chain': ['capability-claim', 'process-delivery-promise', 'operations-quality-evidence'],
  'beauty-brand-product-user-evidence-chain': ['visual-claim', 'product-experience-promise', 'user-business-evidence'],
  'finance-thesis-portfolio-risk-evidence-chain': ['judgment-framework', 'asset-portfolio-logic', 'return-risk-evidence'],
  'healthcare-service-handoff-quality-evidence-chain': ['service-commitment', 'process-touchpoint', 'quality-efficiency-evidence'],
  'saas-platform-workflow-adoption-evidence-chain': ['platform-capability', 'workflow-implementation', 'adoption-efficiency-evidence'],
  'lifestyle-experience-journey-retention-evidence-chain': ['experience-claim', 'journey-promise', 'conversion-retention-evidence'],
  'public-governance-resource-risk-evidence-chain': ['governance-claim', 'resource-accountability-system', 'public-result-risk-evidence'],
  'people-culture-behavior-growth-evidence-chain': ['mission-culture-claim', 'behavior-team-evidence', 'organization-growth-evidence']
};

const expectedComponentsBySample = {
  'manufacturing-oee-evidence-chain': ['equipment-nameplate', 'inspection-matrix', 'quality-scorecard', 'kpi-strip', 'value-chain'],
  'beauty-brand-product-user-evidence-chain': ['hero-image', 'product-matrix', 'proof-gallery', 'caption-bar', 'kpi-strip'],
  'finance-thesis-portfolio-risk-evidence-chain': ['value-chain', 'governance-table', 'risk-register', 'source-note', 'disclosure-footnote', 'kpi-strip'],
  'healthcare-service-handoff-quality-evidence-chain': ['patient-journey-band', 'service-blueprint-lane', 'quality-scorecard', 'risk-register'],
  'saas-platform-workflow-adoption-evidence-chain': ['workflow-rail', 'prototype-frame', 'adoption-funnel', 'permission-audit-tag', 'kpi-strip'],
  'lifestyle-experience-journey-retention-evidence-chain': ['hero-image', 'value-chain', 'proof-gallery', 'caption-bar', 'kpi-strip'],
  'public-governance-resource-risk-evidence-chain': ['source-note', 'commentary-panel', 'value-chain', 'governance-table', 'kpi-strip', 'risk-register'],
  'people-culture-behavior-growth-evidence-chain': ['value-chain', 'caption-bar', 'proof-gallery', 'kpi-strip', 'source-note']
};

assert.equal(fixture.version, 'industry-evidence-chain-fixtures/v1');
assert.equal(fixture.samples.length, 8);

fixture.samples.forEach(sample => {
  const normalized = normalizeDeckPlan(sample.plan);
  const stages = normalized.slides.map(slide => slide.componentPlan.industryEvidenceChain.stageId);
  assert.deepEqual(stages, expectedStagesBySample[sample.id], `${sample.id} chain stages`);
  const planned = new Set(normalized.slides.flatMap(slide => slide.componentPlan.componentIds));
  expectedComponentsBySample[sample.id].forEach(id => {
    assert.equal(planned.has(id), true, `${sample.id} should plan ${id}`);
  });
  assert.equal(
    normalized.slides.some(slide => slide.componentPlan.componentIds.includes('product-matrix')),
    sample.plan.industry === 'beauty-consumer',
    `${sample.id} should only use product-matrix for consumer product evidence`
  );
  assert.ok(
    normalized.slides.some(slide => slide.compositionPlan && slide.compositionPlan.industryExpression && slide.compositionPlan.industryExpression.visualGrammar),
    `${sample.id} should carry industry visualGrammar into composition decisions`
  );
  const report = auditIndustryEvidenceChain(sample.plan, normalized, {
    sampleId: sample.id,
    renderMeta: renderMetaFor(normalized)
  });
  assert.equal(report.version, 'industry-evidence-chain-audit/v1');
  assert.equal(report.status, 'pass', `${sample.id} audit status: ${report.gapReasons.join('; ')}`);
  assert.ok(report.industry_evidence_chain_summary, `${sample.id} should expose compact chain summary`);
  assert.equal(report.industry_evidence_chain_summary.status, 'pass', `${sample.id} compact summary status`);
  assert.equal(report.industry_evidence_chain_summary.blockingGap, null, `${sample.id} compact summary should not carry a blocking gap`);
  assert.equal(report.metrics.recognizedSlides, 3);
  assert.ok(report.metrics.componentHits >= 3, `${sample.id} should hit evidence components`);
  assert.ok(report.metrics.consumedHits >= 3, `${sample.id} should consume evidence components`);
});

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

const consumer = normalizeDeckPlan(fixture.samples[1].plan);
const missingConsumptionMeta = renderMetaFor(consumer);
missingConsumptionMeta.slides[1].consumedComponents = missingConsumptionMeta.slides[1].consumedComponents.filter(component => component.id !== 'product-matrix');
assert.ok(
  auditIndustryEvidenceChain(fixture.samples[1].plan, consumer, { renderMeta: missingConsumptionMeta }).findings.some(finding => finding.type === 'industryEvidenceComponentNotConsumed'),
  'QA should flag planned industry component not consumed by renderer'
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

const badFinanceSourceNote = {
  industry:'finance-investment',
  slides:[{
    type:'finance-bridge',
    title:'金融页缺 source 却声明 source-note',
    componentPlan:{
      version:'component-plan/v1',
      industryEvidenceChain:{
        chainId:'finance-investment',
        chainLabel:'金融投资',
        stageId:'judgment-framework',
        stageLabel:'判断框架',
        position:1,
        confidence:'high',
        components:['value-chain', 'source-note'],
        matchedFields:['investmentThesis'],
        matchedProofObjects:['return-bridge'],
        matchedKeywords:[]
      },
      componentIds:['source-note'],
      components:[{ id:'source-note', required:true }]
    },
    investmentThesis:'估值修复判断。'
  }]
};
assert.ok(
  auditIndustryEvidenceChain(badFinanceSourceNote).findings.some(finding => finding.type === 'sourceCoverageLow'),
  'QA should flag finance source-note without source fields'
);

const badSaasPrototypeClaim = {
  industry:'saas-technology',
  slides:[{
    type:'case-gallery',
    title:'SaaS 声明 prototype 但没有截图',
    componentPlan:{
      version:'component-plan/v1',
      industryEvidenceChain:{
        chainId:'saas-technology',
        chainLabel:'SaaS/科技',
        stageId:'workflow-implementation',
        stageLabel:'工作流落地',
        position:2,
        confidence:'high',
        components:['prototype-frame', 'workflow-rail'],
        matchedFields:['prototype', 'workflow'],
        matchedProofObjects:['prototype-flow'],
        matchedKeywords:[]
      },
      componentIds:['prototype-frame', 'workflow-rail'],
      components:[{ id:'prototype-frame', required:true }, { id:'workflow-rail', required:true }]
    },
    prototype:{ state:'审批流原型' },
    workflow:[{ title:'审批', body:'状态回写' }]
  }]
};
assert.ok(
  auditIndustryEvidenceChain(badSaasPrototypeClaim).findings.some(finding => finding.type === 'prototypeEvidenceMissing'),
  'QA should flag SaaS prototype-frame without screenshot/image evidence'
);

const badHealthcareHandoffClaim = {
  industry:'healthcare-operations',
  slides:[{
    type:'architecture',
    title:'医疗声明交接但缺少交接字段',
    componentPlan:{
      version:'component-plan/v1',
      industryEvidenceChain:{
        chainId:'healthcare-operations',
        chainLabel:'医疗健康',
        stageId:'process-touchpoint',
        stageLabel:'流程/触点',
        position:2,
        confidence:'high',
        components:['service-blueprint-lane'],
        matchedFields:[],
        matchedProofObjects:['service-blueprint'],
        matchedKeywords:['交接']
      },
      componentIds:['service-blueprint-lane'],
      components:[{ id:'service-blueprint-lane', required:true }]
    },
    claim:'交接流程已建立。'
  }]
};
assert.ok(
  auditIndustryEvidenceChain(badHealthcareHandoffClaim).findings.some(finding => finding.type === 'healthcareHandoffEvidenceMissing'),
  'QA should flag healthcare service-blueprint-lane without handoff fields'
);

const formalSeverity = applyQualitySeverityPolicy([
  { level:'review', type:'chainSegmentMissing', message:'missing stage' },
  { level:'review', type:'crossIndustryComponentMismatch', message:'wrong component' },
  { level:'review', type:'prototypeEvidenceMissing', message:'missing prototype screenshot' },
  { level:'review', type:'healthcareHandoffEvidenceMissing', message:'missing handoff fields' },
  { level:'review', type:'sourceCoverageLow', message:'missing source' },
  { level:'review', type:'componentHintEvidenceMissing', message:'unsupported hint' }
], 'formal');
assert.equal(formalSeverity.findings.every(finding => finding.level === 'fail'), true);

console.log('industry evidence chain ok');

const assert = require('assert/strict');
const {
  auditDeckPlan,
  contentOverlapAudit,
  industryKnowledgeAudit,
  industryProofCandidates,
  normalizeDeckPlan,
  normalizeSlide,
  languagePolicyFor,
  localizeMicrocopy,
  mediaForRole,
  semanticFrame,
  semanticMeaning,
  visualAestheticModel
} = require('./design-system');
const {
  MICROCOPY_TRANSLATIONS_ZH
} = require('./design/language-microcopy-translations');
const {
  MICROCOPY_CORE_TRANSLATIONS_ZH
} = require('./design/language-microcopy-translations-core');
const {
  MICROCOPY_DOMAIN_TRANSLATIONS_ZH
} = require('./design/language-microcopy-translations-domain');
const {
  MICROCOPY_ACRONYMS,
  MICROCOPY_TOKEN_TRANSLATIONS_ZH
} = require('./design/language-microcopy-tokens');

const manufacturingPlan = { industry:'manufacturing-operations', title:'设备运维升级方案' };
const rootCauseSlide = {
  title:'停机根因与节拍损失排序',
  subtitle:'由于备件等待和重复故障导致 MTTR 拉长，前两类问题贡献 71% 的 OEE 损失。',
  cards:[
    { title:'备件等待', body:'跨班组领用链路长。' },
    { title:'重复故障', body:'处置记录未回流。' },
    { title:'节拍损失', body:'瓶颈工位缺少复盘。' }
  ]
};

const meaning = semanticMeaning(manufacturingPlan, rootCauseSlide);
assert.equal(meaning.relations.cause, true, 'semantic meaning should detect cause/root-cause language');
assert.ok((meaning.entities.asset || []).includes('备件'), 'semantic meaning should extract industry entities');
assert.ok(
  industryProofCandidates(manufacturingPlan, rootCauseSlide).some(p => p.id === 'loss-pareto'),
  'industry proof candidates should infer manufacturing loss ranking from real wording'
);
assert.equal(semanticFrame(manufacturingPlan, rootCauseSlide).primaryIntent, 'industryChart');
assert.equal(normalizeSlide(manufacturingPlan, rootCauseSlide, 2, 9).layoutVariant, 'loss-pareto');
const metadataDeck = normalizeDeckPlan({
  industry:'manufacturing-operations',
  slides:[
    { type:'auto', title:'设备运维方案' },
    rootCauseSlide,
    { type:'closing', title:'下一步行动', actions:[{ title:'试点' }] }
  ]
});
assert.ok(
  metadataDeck.slides[1].semanticRelations.includes('cause') &&
    metadataDeck.slides[1].candidateProofObjects.some(p => p.id === 'loss-pareto'),
  'normalized slides should expose semantic relations and candidate proof objects'
);

const fatigueDeck = normalizeDeckPlan({
  industry:'brand-retail',
  slides:[
    { type:'auto', title:'会员增长汇报' },
    ...Array.from({ length:7 }, (_, i) => ({
      type:'content',
      title:`执行事项 ${i + 1}`,
      cards:Array.from({ length:6 }, (_, j) => ({ title:`模块 ${j + 1}`, body:'说明动作与责任。' }))
    })),
    { type:'closing', title:'下一步行动', actions:[{ title:'确认节奏' }] }
  ]
});
assert.ok(
  visualAestheticModel(fatigueDeck, fatigueDeck).findings.some(f => f.type === 'visualTemplateFatigue'),
  'aesthetic model should catch deck-level generic route fatigue'
);

const weakImageDeck = normalizeDeckPlan({
  industry:'saas-technology',
  slides:[
    { type:'auto', title:'产品证据汇报' },
    { type:'content', title:'原型截图证据', images:['a.png','b.png','c.png','d.png'] },
    { type:'content', title:'客户截图证据', images:['e.png','f.png','g.png','h.png'] },
    { type:'closing', title:'谢谢观看' }
  ]
});
assert.ok(
  auditDeckPlan(weakImageDeck, weakImageDeck).some(f => f.type === 'captionCoverage'),
  'audit should still catch weak image-caption relationships'
);

const weakFinance = normalizeDeckPlan({
  industry:'finance-investment',
  slides:[
    { type:'auto', title:'产业基金汇报' },
    ...Array.from({ length:7 }, (_, i) => ({
      type:'content',
      title:`管理议题 ${i + 1}`,
      cards:[{ title:'背景', body:'市场变化。' }, { title:'动作', body:'推进沟通。' }, { title:'节奏', body:'下月复盘。' }]
    })),
    { type:'closing', title:'下一步行动', decision:'确认会议安排。' }
  ]
});
assert.ok(
  industryKnowledgeAudit(weakFinance, weakFinance).findings.some(f => f.type === 'industryKnowledgeCoverage' || f.type === 'industryDepthMissing'),
  'industry knowledge audit should flag finance decks without finance proof depth'
);

const weakRetailDepth = normalizeDeckPlan({
  industry:'brand-retail',
  slides:[
    { type:'auto', title:'跨境电商复盘' },
    ...Array.from({ length:7 }, (_, i) => ({
      type:'metric-comparison',
      title:`经营指标 ${i + 1}`,
      metrics:[{ label:'GMV', value:`${100 + i}万` }, { label:'ROAS', value:'3.2x' }]
    }))
  ]
});
const weakRetailDepthFinding = industryKnowledgeAudit(weakRetailDepth, weakRetailDepth).findings.find(f => f.type === 'industryDepthMissing');
assert.ok(weakRetailDepthFinding, 'retail deck without editorial/channel/cohort/loop depth should be reviewed');
assert.ok(weakRetailDepthFinding.missingDomains.includes('editorial-proof'));
assert.ok(weakRetailDepthFinding.recommendations.some(item => item.depthDomain === 'editorial-proof' && /editorial-proof-board/.test(item.recommendedRoute)));

const strongRetailDepth = normalizeDeckPlan({
  industry:'brand-retail',
  slides:[
    { type:'cover', layoutVariant:'beauty-brand-editorial-cover', proofObject:'beauty-brand-editorial-cover', title:'品牌经营复盘', subtitle:'产品与渠道进入质量增长。' },
    { type:'report-board', layoutVariant:'editorial-proof-board', proofObject:'editorial-proof-board', title:'SKU 角色和消费者反馈形成视觉证据', productItems:[{ title:'P04 防晒', body:'旺季流量入口。' }] },
    { type:'industry-chart', layoutVariant:'channel-efficiency-matrix', proofObject:'channel-efficiency-matrix', title:'渠道效率矩阵', channelEfficiency:[{ label:'Amazon', x:44, y:72, value:'4.2x' }] },
    { type:'industry-chart', layoutVariant:'member-cohort-ladder', proofObject:'member-cohort-ladder', title:'会员分层', memberCohorts:[{ label:'高频会员', value:42 }] },
    { type:'industry-chart', layoutVariant:'monthly-pulse-trend', proofObject:'monthly-pulse-trend', title:'月度经营趋势', monthlyPulse:[{ label:'1月', value:120 }, { label:'2月', value:136 }] },
    { type:'timeline', layoutVariant:'closed-loop', proofObject:'closed-loop', title:'行动闭环', phases:[{ title:'动作' }, { title:'复盘' }] },
    { type:'metric-comparison', layoutVariant:'member-growth-board', proofObject:'member-growth-board', title:'复购质量', metrics:[{ label:'复购率', value:'42%' }, { label:'客单价', value:'680' }] },
    { type:'closing', title:'下一步行动', actions:[{ title:'复盘' }] }
  ]
});
assert.equal(
  industryKnowledgeAudit(strongRetailDepth, strongRetailDepth).findings.some(f => f.type === 'industryDepthMissing'),
  false,
  'retail deck with editorial/channel/cohort/business/loop depth should satisfy depth contract'
);

const strongFinance = normalizeDeckPlan({
  industry:'finance-investment',
  slides:[
    { type:'auto', title:'产业基金投委会材料' },
    { type:'content', title:'收益归因桥', bridge:[{ label:'基准', value:10 }, { label:'估值提升', value:4 }, { label:'退出折价', value:-2 }] },
    { type:'content', title:'估值敏感性与退出情景', valuationSensitivity:{ rows:['低增长','基准','高增长'], cols:['低倍数','基准','高倍数'], values:[[12,16,19],[15,20,24],[18,23,29]] } },
    { type:'content', title:'组合行动表', portfolio:[{ name:'项目A', action:'继续持有', risk:'低' }, { name:'项目B', action:'择机退出', risk:'中' }] },
    { type:'content', title:'退出风险矩阵', matrix:{ x:'退出可行性', y:'估值波动' }, rows:[{ name:'估值回撤' }, { name:'流动性不足' }, { name:'集中度过高' }] },
    { type:'closing', title:'投委会决策', decision:'确认退出窗口和投后动作。' }
  ]
});
assert.equal(
  industryKnowledgeAudit(strongFinance, strongFinance).findings.length,
  0,
  'strong finance deck should satisfy industry proof-object depth'
);

const generatedCover = normalizeSlide(
  { industry:'brand-retail', title:'新品发布方案' },
  { type:'cover', title:'新品发布方案', subtitle:'建立统一的新品视觉主张。', visual:{ mode:'generated', role:'background' } },
  0,
  3
);
assert.equal(generatedCover.assetGeneration.status, 'required', 'explicit generated background should be planned at architecture layer');
assert.ok(generatedCover.generatedAssetPrompt && /no text/i.test(generatedCover.generatedAssetPrompt), 'generated prompt should enforce no text');

const staleGeneratedPolicySource = normalizeSlide(
  { industry:'saas-technology', title:'采用漏斗' },
  {
    type:'industry-chart',
    layoutVariant:'adoption-funnel',
    proofObject:'adoption-funnel',
    title:'采用漏斗现在按原生漏斗呈现',
    adoptionFunnel:{ steps:[{ label:'注册', value:'100%' }] },
    visual:{ mode:'generated', role:'background' },
    assetGeneration:{ decisionSource:'asset-generation-policy/v1', status:'required', role:'background', mustBind:true, reason:'previous normalized decision' },
    generatedAssetPrompt:'OLD NORMALIZED PROMPT'
  },
  0,
  1
);
assert.equal(staleGeneratedPolicySource.previousAssetGeneration.reason, 'previous normalized decision');
assert.equal(staleGeneratedPolicySource.visual.mode, undefined);
assert.notEqual(staleGeneratedPolicySource.generatedAssetPrompt, 'OLD NORMALIZED PROMPT');

const zhLanguagePlan = { title:'中文方案汇报', slides:[{ title:'平台总体架构' }] };
const microcopyShardEntryCount =
  Object.keys(MICROCOPY_CORE_TRANSLATIONS_ZH).length +
  Object.keys(MICROCOPY_DOMAIN_TRANSLATIONS_ZH).length;
assert.equal(MICROCOPY_TRANSLATIONS_ZH.size, microcopyShardEntryCount, 'microcopy shards should merge without duplicate or missing keys');
assert.equal(MICROCOPY_CORE_TRANSLATIONS_ZH['VALUE SIGNAL'], '价值信号');
assert.equal(MICROCOPY_DOMAIN_TRANSLATIONS_ZH['SITE · DATA · ALARM · DISPATCH · VALUE'], '站点 · 数据 · 告警 · 调度 · 价值');
assert.equal(MICROCOPY_TRANSLATIONS_ZH.get('SOLUTION BLUEPRINT'), '方案蓝图');
assert.equal(MICROCOPY_TRANSLATIONS_ZH.get('VALUE SIGNAL'), MICROCOPY_CORE_TRANSLATIONS_ZH['VALUE SIGNAL']);
assert.equal(MICROCOPY_TRANSLATIONS_ZH.get('CHART'), MICROCOPY_DOMAIN_TRANSLATIONS_ZH.CHART);
assert.equal(MICROCOPY_TOKEN_TRANSLATIONS_ZH.EDGE, '边缘');
assert.equal(MICROCOPY_ACRONYMS.has('OEE'), true);
assert.equal(languagePolicyFor(zhLanguagePlan).localizeNonEssentialMicrocopy, true, 'Chinese decks should localize non-essential visible microcopy');
assert.equal(localizeMicrocopy(zhLanguagePlan, 'SOLUTION BLUEPRINT'), '方案蓝图');
assert.equal(localizeMicrocopy(zhLanguagePlan, 'EDGE  →  DATA  →  DISPATCH  →  MANAGEMENT'), '边缘 → 数据 → 调度 → 管理');
assert.equal(localizeMicrocopy(zhLanguagePlan, 'SITE · DATA · ALARM · DISPATCH · VALUE'), '站点 · 数据 · 告警 · 调度 · 价值');
assert.equal(localizeMicrocopy(zhLanguagePlan, 'SEQUENCE 01 → 02 → 03 → 04 → 01'), '序列 01 → 02 → 03 → 04 → 01');
assert.equal(localizeMicrocopy(zhLanguagePlan, 'OEE'), 'OEE', 'standard acronyms should be preserved');
assert.equal(localizeMicrocopy({ language:'en', title:'English report' }, 'SOLUTION BLUEPRINT'), 'SOLUTION BLUEPRINT');

const imageLedBeauty = normalizeSlide(
  { industry:'beauty-consumer', title:'肌研之光品牌经营报告', visualIntent:'image-rich' },
  {
    type:'content',
    title:'品牌世界观与经营证据',
    proofObject:'brand-world-and-business-proof',
    drivers:[{ title:'肌肤屏障' }],
    actions:[{ title:'成分故事' }],
    outcomes:[{ title:'会员复购' }]
  },
  2,
  8
);
assert.equal(imageLedBeauty.assetGeneration.status, 'required', 'image-led beauty proof pages should not silently fall back to placeholders when assets are missing');
assert.ok(/no text/i.test(imageLedBeauty.generatedAssetPrompt || ''), 'image-led beauty pages should expose an imagegen prompt before rendering');

const slideImageFallback = mediaForRole(
  { industry:'beauty-consumer' },
  { type:'cover', title:'品牌经营报告', images:['assets/media/energy-storage-cover.jpg'] },
  'cover'
);
assert.ok(slideImageFallback.endsWith('assets/media/energy-storage-cover.jpg'), 'single-slide images should be available to cover/showcase renderers');

const defaultMediaOnlyIndustrial = normalizeDeckPlan({
  industry:'manufacturing-operations',
  slides:[
    { type:'cover', title:'封面' },
    { type:'content', title:'普通说明页', claim:'介绍组织协作方式' }
  ]
});
assert.equal(
  defaultMediaOnlyIndustrial.slides[1].assetGeneration.status,
  'none',
  'industry default media should not make structure-only pages look asset-bound'
);

const manufacturingCoverFallback = normalizeDeckPlan({
  industry:'manufacturing-operations',
  slides:[
    { type:'cover', title:'制造经营复盘', subtitle:'从项目交付、渠道效率到复购续费的增长路径' },
    { type:'closing', title:'下一步', actions:[{ title:'确认范围' }] }
  ]
});
assert.equal(manufacturingCoverFallback.slides[0].layoutVariant || '', '', 'manufacturing cover should fall back to native cover skeleton when no asset is bound');
assert.equal(manufacturingCoverFallback.slides[0].coverStyle || '', '', 'manufacturing cover should not preserve an image-led cover style without a bound asset');
assert.equal(manufacturingCoverFallback.slides[0].assetGeneration.mustBind, false, 'manufacturing native cover fallback must not require a bound generated asset');
assert.equal(Boolean(manufacturingCoverFallback.slides[0].generatedAssetPrompt), false, 'manufacturing native cover fallback should clear generated prompts');

const unsafeGeneratedEvidence = normalizeDeckPlan({
  industry:'manufacturing-operations',
  slides:[
    { type:'auto', title:'客户案例材料' },
    { type:'case-gallery', title:'特斯拉客户现场证据', subtitle:'真实客户现场与验收参数。', visual:{ mode:'generated', role:'evidence' } },
    { type:'closing', title:'下一步', actions:[{ title:'补齐授权' }] }
  ]
});
assert.ok(
  auditDeckPlan(unsafeGeneratedEvidence, unsafeGeneratedEvidence).some(f => f.type === 'unsafeGeneratedAssetRequest'),
  'audit should block generated assets from substituting factual customer/site evidence'
);

const repeatedCompanyFacts = normalizeDeckPlan({
  industry:'manufacturing-operations',
  materialIntelligence:{ pptType:'company-intro' },
  title:'承德环宇输送机械制造有限公司',
  slides:[
    { type:'cover', title:'承德环宇输送机械制造有限公司' },
    { type:'company-profile-spread', title:'公司介绍', metrics:[
      { label:'始建年份', value:'1993' },
      { label:'厂区规模', value:'20.5亩' },
      { label:'生产车间', value:'3000余平米' },
      { label:'加工中心', value:'1000余平米' }
    ] },
    { type:'metric-comparison', title:'长期制造基础支撑非标输送项目交付', metrics:[
      { label:'始建年份', value:'1993' },
      { label:'厂区规模', value:'20.5亩' },
      { label:'生产车间', value:'3000余平米' },
      { label:'加工中心', value:'1000余平米' }
    ] },
    { type:'closing', title:'谢谢观看' }
  ]
});
assert.ok(
  contentOverlapAudit(repeatedCompanyFacts, repeatedCompanyFacts).some(f => f.level === 'fail' && f.type === 'contentOverlap'),
  'content overlap audit should fail repeated adjacent company-profile facts'
);

console.log('intelligence layers ok');

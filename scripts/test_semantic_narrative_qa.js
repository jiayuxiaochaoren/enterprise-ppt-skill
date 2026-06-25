const assert = require('assert/strict');
const {
  auditDeckPlan,
  normalizeDeckPlan,
  normalizeSlide,
  semanticFrame
} = require('./design-system');

const financePlan = { industry:'finance-investment', title:'投委会材料' };
const sensitivitySlide = {
  title:'估值敏感性与退出情景',
  valuationSensitivity:{
    rows:['低增长','基准','高增长'],
    cols:['低倍数','基准','高倍数'],
    values:[[12,16,19],[15,20,24],[18,23,29]]
  }
};

const semantic = semanticFrame(financePlan, sensitivitySlide);
assert.equal(semantic.primaryIntent, 'industryChart');
assert.equal(semantic.proofObject, 'valuation-sensitivity');

const routed = normalizeSlide(financePlan, sensitivitySlide, 1, 5);
assert.equal(routed.type, 'industry-chart');
assert.equal(routed.layoutVariant, 'valuation-sensitivity');
assert.equal(routed.layoutRationale, 'industry proof object: valuation-sensitivity');

const restaurantPlan = { industry:'lifestyle-food-tourism-fashion', title:'餐饮连锁经营复盘' };
const restaurantLoop = semanticFrame(restaurantPlan, {
  title:'顾客旅程把触达、下单、履约和复购串成回路',
  phases:[
    { title:'触达', body:'外卖平台、堂食、小程序和社区活动带来高频入口。' },
    { title:'下单', body:'午餐、夜宵、亲子套餐和团餐分别承接不同场景。' },
    { title:'履约', body:'出餐排队、包装漏汤和配送稳定性影响体验。' },
    { title:'复购', body:'会员权益、套餐规则和小程序自提决定复购沉淀。' }
  ]
});
assert.equal(restaurantLoop.proofObject, 'restaurant-operating-loop');
assert.equal(restaurantLoop.semanticMeaning.bestProofRoute, 'timeline:closed-loop');

const sequenced = normalizeDeckPlan({
  industry:'saas-technology',
  autoSequence:true,
  slides:[
    { type:'auto', title:'企业 SaaS 增长方案' },
    { type:'content', title:'平台能力地图', platformCapabilities:['任务空间','自动化','分析视图'] },
    { type:'content', title:'客户采用问题', cards:Array.from({ length:6 }, (_, i) => ({ title:`问题 ${i+1}`, body:'客户采用路径分散。' })) },
    { type:'content', title:'采用漏斗', adoptionFunnel:[{ title:'注册', value:100 }, { title:'激活', value:64 }] },
    { type:'closing', title:'下一步行动', actions:[{ title:'采用' }] }
  ]
});
assert.deepEqual(
  sequenced.slides.map(s => s.narrativeRole),
  ['setup', 'diagnosis', 'proof', 'solution', 'decision'],
  'auto sequence should order diagnosis, proof, solution, decision'
);

const weakFinance = normalizeDeckPlan({
  industry:'finance-investment',
  slides:[
    { type:'auto', title:'产业基金汇报' },
    { type:'content', title:'背景说明', cards:[{ title:'背景', body:'说明' }, { title:'目标', body:'说明' }, { title:'动作', body:'说明' }] },
    { type:'content', title:'执行计划', cards:[{ title:'动作', body:'说明' }, { title:'节奏', body:'说明' }, { title:'责任', body:'说明' }] },
    { type:'content', title:'更多说明', cards:[{ title:'一', body:'说明' }, { title:'二', body:'说明' }, { title:'三', body:'说明' }] },
    { type:'closing', title:'下一步行动', decision:'确认动作。' }
  ]
});
assert.ok(
  auditDeckPlan(weakFinance, weakFinance).some(f => f.type === 'industryWeakExpression'),
  'audit should flag industry decks without dedicated proof objects'
);

const captionWeak = normalizeDeckPlan({
  industry:'manufacturing-operations',
  slides:[
    { type:'auto', title:'现场汇报' },
    { type:'content', title:'现场证据图册', images:['a.png','b.png','c.png','d.png'] },
    { type:'closing', title:'下一步行动', actions:[{ title:'复盘' }] }
  ]
});
assert.ok(
  auditDeckPlan(captionWeak, captionWeak).some(f => f.type === 'captionCoverage'),
  'audit should flag image-heavy slides without evidence captions'
);

console.log('semantic narrative qa ok');

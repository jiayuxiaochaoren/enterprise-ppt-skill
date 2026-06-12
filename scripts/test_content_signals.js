const assert = require('assert/strict');
const {
  createContentSignalHelpers
} = require('./design/content-signals');
const {
  flattenText,
  keywordHit
} = require('./design/text-utils');

const helpers = createContentSignalHelpers({
  flattenText,
  keywordHit,
  overlapText: flattenText,
  visualSystem: {
    contentIntelligence: {
      signals: {
        case: ['案例', 'case'],
        culture: ['价值观'],
        risk: ['风险', '授权'],
        strategy: ['战略']
      }
    }
  }
});

const signals = helpers.contentSignals({ visualIntent:'case-led' }, {
  title:'Q2 收入同比 +12%，目标达成 103%',
  type:'case-gallery',
  images:['a.png', 'b.png', 'c.png'],
  cards:[
    { title:'问题', body:'客户授权风险需要确认。' },
    { title:'动作', body:'补齐外发授权。' },
    { title:'结果', body:'案例可对外使用。' }
  ],
  metrics:[
    { label:'收入', value:'+12%' },
    { label:'转化', value:'103%' },
    { label:'利润', value:'8.2%' }
  ],
  before:{ image:'before.png' },
  after:{ image:'after.png' }
}, 1, 6);

assert.equal(signals.index, 1);
assert.equal(signals.total, 6);
assert.equal(signals.imageCount, 5);
assert.equal(signals.isImageHeavy, true);
assert.equal(signals.isNumberHeavy, true);
assert.equal(signals.hasMetrics, true);
assert.equal(signals.hasCaseComparison, true);
assert.equal(signals.hasRiskLanguage, true);
assert.equal(signals.hasSplitProblem, true);

const negatedRisk = helpers.contentSignals({}, { title:'这不是风险，而是正常说明。' });
assert.equal(negatedRisk.hasRiskLanguage, false);

assert.equal(helpers.hasArrayField({ rows:[1] }, ['rows']), true);
assert.equal(helpers.hasValueField({ chartKind:'bar' }, ['chartKind']), true);
assert.equal(helpers.hasExplicitIndustryChartData({ dataComponent:'channel-efficiency-matrix' }), true);
assert.equal(helpers.hasExplicitIndustryChartData({ dataComponent:'process-milestone' }), false);
assert.equal(helpers.staleIndustryChartRouteShouldYieldToProcess({
  type:'industry-chart',
  layoutVariant:'process-board',
  phases:[{ title:'启动' }, { title:'上线' }]
}), true);
assert.equal(helpers.staleIndustryChartRouteShouldYieldToProcess({
  type:'industry-chart',
  layoutVariant:'process-board',
  chartSpec:{ id:'channel-efficiency' },
  phases:[{ title:'启动' }, { title:'上线' }]
}), false);

console.log('content signals ok');

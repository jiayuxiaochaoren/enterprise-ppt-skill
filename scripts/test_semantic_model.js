const assert = require('assert/strict');
const {
  createContentSignalHelpers
} = require('./design/content-signals');
const {
  createSemanticChartVariantHelpers
} = require('./design/semantic-chart-variants');
const {
  createSemanticModelHelpers
} = require('./design/semantic-model');
const {
  createSemanticProofCandidateHelpers
} = require('./design/semantic-proof-candidates');
const {
  flattenText,
  keywordHit,
  matchKeywordList
} = require('./design/text-utils');

const content = createContentSignalHelpers({
  flattenText,
  keywordHit,
  overlapText: flattenText,
  visualSystem: {
    contentIntelligence: {
      signals: {
        risk: ['风险', 'risk'],
        strategy: ['战略'],
        case: ['案例'],
        culture: ['文化']
      }
    }
  }
});

const profile = {
  label: '制造运营',
  narrativeArchetype: '问题 -> 证据 -> 动作',
  entities: {
    actor: ['班组', '负责人'],
    metric: ['OEE', '停机'],
    asset: ['产线', '设备']
  },
  proofObjects: [
    {
      id: 'downtime-pareto',
      route: 'industry-chart:downtime-pareto',
      fields: ['downtimePareto'],
      keywords: ['停机', 'OEE', '帕累托'],
      depth: 'metric-analysis'
    },
    {
      id: 'production-topology',
      route: 'architecture:production-topology',
      fields: ['layers'],
      keywords: ['产线', '设备'],
      depth: 'system-map'
    }
  ]
};

const semanticDeps = {
  contentSignals: content.contentSignals,
  flattenText,
  hasArrayField: content.hasArrayField,
  hasValueField: content.hasValueField,
  industryKnowledgeProfile: () => profile,
  matchKeywordList,
  semanticRelationPatterns: {
    cause: /因为|导致/,
    decision: /决定|确认/,
    dependency: /依赖/,
    evidence: /证据|数据/,
    ownership: /负责人|责任/
  },
  visualIndustryId: id => id
};

const semantic = createSemanticModelHelpers(semanticDeps);
const chartVariantHelpers = createSemanticChartVariantHelpers(Object.assign({}, semanticDeps, {
  industryProofCandidates: (...args) => semantic.industryProofCandidates(...args)
}));
const proofHelpers = createSemanticProofCandidateHelpers(semanticDeps);

const slide = {
  type: 'industry-chart',
  title: 'OEE 停机 Pareto 复盘',
  claim: '因为换型等待导致 OEE 下降，需要负责人确认改善动作。',
  downtimePareto: [
    { title:'等待备件', value:36 },
    { title:'换型调试', value:22 }
  ],
  metrics: [{ label:'OEE', value:'78%' }],
  actions: [{ title:'责任人确认' }]
};
const signals = content.contentSignals({ industry:'manufacturing-operations' }, slide);

const candidates = semantic.industryProofCandidates({ industry:'manufacturing-operations' }, slide, signals);
assert.equal(candidates[0].id, 'downtime-pareto');
assert.ok(candidates[0].score >= 4);
assert.ok(candidates[0].keywordHits.includes('停机'));

const directCandidates = proofHelpers.industryProofCandidates({ industry:'manufacturing-operations' }, slide, signals);
assert.deepEqual(directCandidates, candidates);
assert.equal(proofHelpers.fieldHitScore(slide, ['downtimePareto', 'missing']), 4);

const relations = semantic.semanticRelationProfile(flattenText(slide));
assert.equal(relations.cause, true);
assert.equal(relations.ownership, true);

assert.deepEqual(proofHelpers.semanticRelationProfile(flattenText(slide)), relations);

const meaning = semantic.semanticMeaning({ industry:'manufacturing-operations' }, slide, signals);
assert.equal(meaning.bestProofObject, 'downtime-pareto');
assert.equal(meaning.bestProofRoute, 'industry-chart:downtime-pareto');
assert.equal(meaning.materialPurpose, 'industry-proof');
assert.ok(meaning.scores.claimStrength > 0.5);
assert.ok(meaning.entities.metric.includes('OEE'));

assert.equal(semantic.dataGrammarVariant({ industry:'brand-retail' }, {
  title:'渠道投放 ROAS 和花费效率',
  items:[]
}), 'channel-efficiency-matrix');
assert.equal(chartVariantHelpers.dataGrammarVariant({ industry:'brand-retail' }, {
  title:'渠道投放 ROAS 和花费效率',
  items:[]
}), semantic.dataGrammarVariant({ industry:'brand-retail' }, {
  title:'渠道投放 ROAS 和花费效率',
  items:[]
}));
assert.equal(semantic.industryChartVariant({ industry:'energy-utility' }, {
  title:'站点储能告警调度',
  siteDispatch:[{ title:'A站' }]
}), 'dispatch-map');
assert.equal(chartVariantHelpers.industryChartVariant({ industry:'energy-utility' }, {
  title:'站点储能告警调度',
  siteDispatch:[{ title:'A站' }]
}), semantic.industryChartVariant({ industry:'energy-utility' }, {
  title:'站点储能告警调度',
  siteDispatch:[{ title:'A站' }]
}));

const frame = semantic.semanticFrame({ industry:'manufacturing-operations' }, slide, signals);
assert.equal(frame.primaryIntent, 'industryChart');
assert.equal(frame.proofObject, 'downtime-pareto');
assert.equal(frame.industryChartVariant, 'downtime-pareto');
assert.ok(frame.confidence > 0.7);

console.log('semantic model ok');

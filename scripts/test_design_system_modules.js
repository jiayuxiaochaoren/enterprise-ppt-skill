const assert = require('assert/strict');
const designSystem = require('./design-system');
const {
  copyPolicyList,
  copyPolicyText,
  industryBenchmarksFor,
  industryMatchIds,
  visualIndustryId
} = designSystem;
const {
  createIndustryRuntime
} = require('./design/industry-runtime');
const {
  INDUSTRY_EXPRESSION_RULES,
  INDUSTRY_KNOWLEDGE_BASE,
  SEMANTIC_RELATION_PATTERNS,
  VISIBLE_PRODUCTION_COPY_BANS
} = require('./design/industry-knowledge');

assert.equal(visualIndustryId('industrial-energy'), 'manufacturing-operations');
assert.ok(industryMatchIds('brand-retail').includes('beauty-consumer'));
assert.equal(designSystem.INDUSTRY_KNOWLEDGE_BASE, INDUSTRY_KNOWLEDGE_BASE);
assert.ok(INDUSTRY_EXPRESSION_RULES['brand-retail'].requiredRoutes.includes('industry-chart:waterfall-bridge'));
assert.ok(INDUSTRY_KNOWLEDGE_BASE['saas-technology'].proofObjects.some(item => item.id === 'adoption-funnel'));
assert.ok(SEMANTIC_RELATION_PATTERNS.cause.test('因为响应慢导致流失'));
assert.ok(VISIBLE_PRODUCTION_COPY_BANS.some(pattern => pattern.test('材料显示增长来自渠道修复')));
assert.equal(copyPolicyText('__missing__', '__missing_key__', 'fallback text'), 'fallback text');
assert.deepEqual(copyPolicyList('__missing__', '__missing_list__', ['a', 'b']), ['a', 'b']);
assert.deepEqual(industryBenchmarksFor('__missing__'), []);

const runtime = createIndustryRuntime({
  industryDesignDialects: { target: {} },
  visualRouter: { industries: { routed: {} } },
  industryPackLibrary: {
    packs: [
      { id:'target', aliases:['custom alias'] }
    ]
  },
  copyPolicy: {
    version:'copy-policy/test',
    global: {
      rendererFallbacks: { headline:'global headline' },
      tags: ['global']
    },
    industries: {
      target: {
        rendererFallbacks: { headline:'target headline' },
        tags: ['target']
      },
      aliasOnly: { aliasOf:'target' },
      'general-operations': {
        rendererFallbacks: { headline:'general headline' }
      }
    }
  },
  industryBenchmarks: {
    aliases: { aliasTarget:'target' },
    industries: {
      target: [{ label:'benchmark' }]
    }
  },
  aliases: {
    aliasTarget:'target'
  }
});

assert.equal(runtime.visualIndustryId('aliasTarget'), 'target');
assert.ok(runtime.industryMatchIds('target').includes('aliasTarget'));
assert.equal(runtime.industryPackFor('custom alias').id, 'target');
assert.equal(runtime.copyPolicyText('aliasOnly', 'headline'), 'target headline');
const tags = runtime.copyPolicyList('aliasOnly', 'tags');
tags.push('mutated');
assert.deepEqual(runtime.copyPolicyList('aliasOnly', 'tags'), ['target']);
assert.deepEqual(runtime.industryBenchmarksFor('aliasTarget'), [{ label:'benchmark' }]);

console.log('design system modules ok');

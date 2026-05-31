const assert = require('assert/strict');
const {
  copyPolicyList,
  copyPolicyText,
  industryBenchmarksFor,
  industryMatchIds,
  visualIndustryId
} = require('./design-system');
const {
  createIndustryRuntime
} = require('./design/industry-runtime');

assert.equal(visualIndustryId('industrial-energy'), 'manufacturing-operations');
assert.ok(industryMatchIds('brand-retail').includes('beauty-consumer'));
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

const assert = require('assert/strict');
const {
  TEXT_METADATA_OMIT_KEYS,
  TEXT_FLATTEN_OMIT_KEYS,
  clampText,
  compactUnique,
  flattenText,
  keywordHit,
  matchKeywordList,
  textKeywords
} = require('./design/text-utils');
const {
  CHAIN_TEXT_OMIT_KEYS
} = require('./design/industry-evidence-chain');

assert.ok(TEXT_FLATTEN_OMIT_KEYS.has('image'));
assert.ok(TEXT_METADATA_OMIT_KEYS.has('componentPlan'));
assert.ok(TEXT_METADATA_OMIT_KEYS.has('previousIndustryEvidenceChain'));
assert.deepEqual([...TEXT_METADATA_OMIT_KEYS].filter(key => !CHAIN_TEXT_OMIT_KEYS.has(key)), []);
assert.deepEqual(compactUnique(['a', '', 'a', null, 'b']), ['a', 'b']);
assert.equal(flattenText(null), '');
assert.equal(flattenText(['业务', 42, { title: '增长' }]), '业务 42 增长');
assert.equal(flattenText({
  title: '可见标题',
  body: '可见正文',
  image: 'hidden-image.jpg',
  sourceTrace: { sourceIds: ['hidden-source'] },
  nested: { note: '嵌套说明' }
}), '可见标题 可见正文 嵌套说明');
assert.equal(keywordHit('Revenue 增长', ['revenue']), true);
assert.equal(keywordHit('Revenue 增长', ['profit']), false);
assert.deepEqual(matchKeywordList('风险治理与审计', ['风险', '审计', '收入']), ['风险', '审计']);
assert.deepEqual(textKeywords('ARR +12% / 风险治理'), ['arr', '+12%', '风险治理']);
assert.equal(clampText('  多余   空格  ', 20), '多余 空格');
assert.equal(clampText('这是一个较长的结论句', 6), '这是一个较…');

console.log('design text utils ok');

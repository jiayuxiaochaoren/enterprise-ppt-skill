const assert = require('assert/strict');
const {
  compactEvidenceCaption,
  formatMetricDelta,
  hasEllipsisText,
  itemBody,
  itemBodyNoEllipsis,
  itemTitle,
  publicSlideNote,
  slideSemanticText,
  stripEllipsisText,
  variantOf
} = require('./render/content-helpers');

assert.equal(itemTitle('直接标题', 'fallback'), '直接标题');
assert.equal(itemTitle({ label: '标签标题' }, 'fallback'), '标签标题');
assert.equal(itemTitle({}, 'fallback'), 'fallback');
assert.equal(itemBody('标题字符串', 'fallback'), '');
assert.equal(itemBody({ note: '说明文本' }, 'fallback'), '说明文本');
assert.equal(itemBody({}, 'fallback'), 'fallback');

assert.equal(hasEllipsisText('需要继续...'), true);
assert.equal(hasEllipsisText('完整说明'), false);
assert.equal(stripEllipsisText('  多余   空格... '), '多余 空格');
assert.equal(itemBodyNoEllipsis({ body: '内容...' }, 'fallback'), 'fallback');
assert.equal(itemBodyNoEllipsis({ body: '完整内容' }, 'fallback'), '完整内容');
assert.equal(compactEvidenceCaption('证据说明…', 4), '证据说明');

assert.equal(variantOf({ layoutVariant: 'readout', variant: 'other' }, 'fallback'), 'readout');
assert.equal(variantOf({ variant: 'other' }, 'fallback'), 'other');
assert.equal(variantOf({}, 'fallback'), 'fallback');

assert.equal(formatMetricDelta('+12pt'), '提升 12 个百分点');
assert.equal(formatMetricDelta('+3.5pts'), '提升 3.5 个百分点');
assert.equal(formatMetricDelta('+8%'), '提升 8%');
assert.equal(formatMetricDelta('flat'), 'flat');

const semantic = slideSemanticText({
  title: '标题',
  cards: [{ title: '卡片', body: '正文' }],
  items: ['字符串项', { label: '标签', note: '说明' }],
  phases: [{ title: '阶段', body: '动作' }]
});
assert.ok(semantic.includes('标题'));
assert.ok(semantic.includes('卡片 正文'));
assert.ok(semantic.includes('字符串项'));
assert.ok(semantic.includes('阶段 动作'));

assert.equal(publicSlideNote('本页仅用于测试'), '');
assert.equal(publicSlideNote('需补充真实客户授权材料'), '需补充真实客户授权材料');

console.log('render content helpers ok');

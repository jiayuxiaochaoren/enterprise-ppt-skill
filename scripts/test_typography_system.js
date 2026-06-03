const assert = require('assert/strict');
const {
  FONT_STACK,
  VISUAL_SYSTEM,
  industryMatchIds,
  normalizeTypographyOptions,
  resolveTypeToken,
  typographyAudit,
  typographyFontSet,
  typographyProfileFor,
  visualIndustryId
} = require('./design-system');
const {
  deepMerge
} = require('./design/design-system-policy');
const {
  createTypographyTokenHelpers
} = require('./design/typography-tokens');

const beauty = { industry: 'beauty-consumer' };
const finance = { industry: 'finance-investment' };

const beautyProfile = typographyProfileFor(beauty);
assert.equal(beautyProfile.fonts.editorial, 'Songti SC');

const beautyCover = resolveTypeToken(beauty, 'coverTitle');
assert.equal(beautyCover.fontFace, 'Songti SC');
assert.ok(beautyCover.size >= 33);

const tokenHelpers = createTypographyTokenHelpers({
  visualSystem: VISUAL_SYSTEM,
  fontStack: FONT_STACK,
  deepMerge,
  compactUnique: values => Array.from(new Set((values || []).filter(Boolean))),
  industryMatchIds,
  visualIndustryId
});
assert.deepEqual(tokenHelpers.resolveTypeToken(beauty, 'coverTitle'), beautyCover);

const beautyBody = resolveTypeToken(beauty, 'body');
assert.ok(beautyBody.size >= 10);
assert.ok(beautyBody.min >= 9);

const financeMetric = resolveTypeToken(finance, 'metricLarge');
assert.ok(financeMetric.size >= 28.5);
assert.ok(financeMetric.min >= 20);

const cjkBody = normalizeTypographyOptions(beauty, '消费者画像必须绑定场景、理由、购买或复购信号。', {
  fontSize: 6.8,
  x: 1,
  y: 2,
  w: 4,
  h: 0.18
});
assert.equal(cjkBody.fontFace, 'PingFang SC');
assert.ok(cjkBody.fontSize >= 9);
assert.deepEqual(
  tokenHelpers.normalizeTypographyOptions(beauty, '消费者画像必须绑定场景、理由、购买或复购信号。', {
    fontSize: 6.8,
    x: 1,
    y: 2,
    w: 4,
    h: 0.18
  }),
  cjkBody
);

const latinLabel = normalizeTypographyOptions(beauty, 'CONSUMER PROOF PHOTO GRID', {
  typeRole: 'kicker',
  fontSize: 5.2,
  x: 1,
  y: 0.6,
  w: 2,
  h: 0.12
});
assert.equal(latinLabel.fontFace, 'Avenir Next');
assert.ok(latinLabel.fontSize >= 6.8);

const numeric = normalizeTypographyOptions(finance, '42%', {
  typeRole: 'number',
  fontSize: 11,
  x: 10,
  y: 2,
  w: 1,
  h: 0.2
});
assert.equal(numeric.fontFace, 'DIN Alternate');

const fonts = typographyFontSet(beauty);
assert.equal(fonts.cjk, 'PingFang SC');
assert.equal(fonts.latin, 'Avenir Next');
assert.equal(fonts.number, 'DIN Alternate');

const audit = typographyAudit(beauty, beauty);
assert.notEqual(audit.status, 'fail');
assert.equal(audit.fonts.editorial, 'Songti SC');

const shrinkAudit = typographyAudit(beauty, beauty, {
  slides: [{
    slide: 2,
    textBoxes: [{
      role: 'body',
      fontSize: 7.2,
      fitStrategy: 'shrink',
      cjkChars: 48,
      box: { x: 1, y: 2, w: 1.2, h: 0.13 },
      charsPerInch: 40,
      areaDensity: 300,
      sample: '这是一段会被压缩到不可读的小字号中文正文'
    }]
  }]
});
assert.equal(shrinkAudit.status, 'fail');
assert.equal(shrinkAudit.findings.some(f => f.type === 'textShrinkRisk'), true);

console.log('typography system contract ok');

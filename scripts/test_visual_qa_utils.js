const assert = require('assert/strict');
const {
  applyQualitySeverityPolicy,
  severityPromotionsForMode
} = require('./qa/quality-severity-policy');
const {
  EMU_PER_INCH,
  intersectionArea,
  lineIntersectsText,
  lineMidpoint,
  rectArea,
  rectContainsPoint,
  xmlImageShapes,
  xmlLineShapes,
  xmlRectShapes,
  xmlTextRuns,
  xmlTextShapes,
  xmlTextValues
} = require('./qa/pptx-xml');

assert.ok(severityPromotionsForMode('formal').smallChineseText);
assert.ok(severityPromotionsForMode('delivery').previewMissing);
assert.deepEqual(severityPromotionsForMode('draft'), {});
const severity = applyQualitySeverityPolicy([
  { level:'review', type:'smallChineseText', message:'small' },
  { level:'review', type:'unknown', message:'unknown' },
  { level:'fail', type:'previewMissing', message:'already fail' }
], 'delivery');
assert.equal(severity.policy.version, 'quality-severity-policy/v1');
assert.equal(severity.findings[0].level, 'fail');
assert.equal(severity.findings[0].originalLevel, 'review');
assert.equal(severity.findings[1].level, 'review');
assert.equal(severity.findings[2].originalLevel, undefined);

const emu = value => String(Math.round(value * EMU_PER_INCH));
const xml = [
  '<p:sp>',
  '<p:spPr><a:xfrm>',
  `<a:off x="${emu(1)}" y="${emu(2)}"/>`,
  `<a:ext cx="${emu(3)}" cy="${emu(0.5)}"/>`,
  '</a:xfrm><a:prstGeom prst="rect"/><a:solidFill><a:alpha val="65000"/></a:solidFill></p:spPr>',
  '<p:txBody><a:p><a:r><a:rPr sz="1200"><a:latin typeface="PingFang SC"/></a:rPr><a:t>业务&amp;增长</a:t></a:r></a:p></p:txBody>',
  '</p:sp>',
  '<p:cxnSp><p:spPr><a:xfrm>',
  `<a:off x="${emu(0.8)}" y="${emu(2.2)}"/>`,
  `<a:ext cx="${emu(4)}" cy="0"/>`,
  '</a:xfrm><a:ln><a:headEnd type="triangle"/></a:ln></p:spPr></p:cxnSp>',
  '<p:pic><p:spPr><a:xfrm>',
  `<a:off x="${emu(5)}" y="${emu(1)}"/>`,
  `<a:ext cx="${emu(2)}" cy="${emu(1.5)}"/>`,
  '</a:xfrm></p:spPr></p:pic>'
].join('');

assert.deepEqual(xmlTextValues(xml), ['业务&增长']);
assert.equal(xmlTextRuns(xml)[0].size, 12);
assert.equal(xmlTextRuns(xml)[0].fonts[0], 'PingFang SC');
const textShape = xmlTextShapes(xml)[0];
assert.equal(textShape.x, 1);
assert.equal(textShape.y, 2);
assert.equal(textShape.w, 3);
assert.equal(textShape.minSize, 12);
const rectShape = xmlRectShapes(xml)[0];
assert.equal(rectShape.fillOpacity, 0.65);
assert.equal(rectShape.hasText, true);
const line = xmlLineShapes(xml)[0];
assert.equal(line.arrow, true);
assert.equal(lineMidpoint(line).x, 2.8);
assert.equal(lineIntersectsText(line, textShape), true);
assert.equal(xmlImageShapes(xml)[0].w, 2);

assert.equal(rectContainsPoint({ x:0, y:0, w:2, h:2 }, 1, 1), true);
assert.equal(rectContainsPoint({ x:0, y:0, w:2, h:2 }, 0.01, 1), false);
assert.equal(intersectionArea({ x:0, y:0, w:2, h:2 }, { x:1, y:1, w:2, h:2 }), 1);
assert.equal(rectArea({ w:3, h:2 }), 6);

console.log('visual QA utils ok');

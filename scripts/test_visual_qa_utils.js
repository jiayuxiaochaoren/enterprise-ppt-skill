const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
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
const slideAuditFacade = require('./qa/visual-slide-audit');
const slideAuditPrimitives = require('./qa/visual-slide-audit-primitives');
const {
  pngInfo
} = require('./qa/png-analysis');
const {
  decodePngPixels
} = require('./qa/png-decode');

function crc32(buf) {
  const table = crc32.table || (crc32.table = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  }));
  let c = 0xffffffff;
  for (const byte of buf) c = table[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type);
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  name.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return out;
}

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
assert.equal(slideAuditFacade.hasCjk('业务增长'), true);
assert.equal(slideAuditPrimitives.hasCjk('growth'), false);
assert.deepEqual(slideAuditFacade.compactUnique(['A', 'A', ' ', null, 'B']), ['A', 'B']);
assert.deepEqual(slideAuditFacade.compactUnique(['A', 'A', ' ', null, 'B']), slideAuditPrimitives.compactUnique(['A', 'A', ' ', null, 'B']));
assert.equal(slideAuditPrimitives.regionCoverage([{ x:0, y:0, w:1, h:1 }], { x:0.5, y:0.5, w:1, h:1 }), 0.25);
assert.equal(slideAuditFacade.regionCoverage([{ x:0, y:0, w:1, h:1 }], { x:0.5, y:0.5, w:1, h:1 }), 0.25);
assert.equal(slideAuditPrimitives.textCharsInRegion([{ x:0, y:0, w:1, h:1, text:'A B' }], { x:0, y:0, w:1, h:1 }), 2);
assert.equal(slideAuditFacade.visualQaSettings({ minFontSize:7 }).minFontSize, 7);
assert.ok(slideAuditPrimitives.BANNED_PLACEHOLDERS.includes('占位'));
const tinyPngPath = path.join(__dirname, '..', 'outputs', 'test-visual-qa-utils-tiny.png');
fs.mkdirSync(path.dirname(tinyPngPath), { recursive: true });
const tinyIhdr = Buffer.alloc(13);
tinyIhdr.writeUInt32BE(1, 0);
tinyIhdr.writeUInt32BE(1, 4);
tinyIhdr[8] = 8;
tinyIhdr[9] = 2;
fs.writeFileSync(tinyPngPath, Buffer.concat([
  Buffer.from('89504e470d0a1a0a', 'hex'),
  pngChunk('IHDR', tinyIhdr),
  pngChunk('IDAT', zlib.deflateSync(Buffer.from([0, 255, 0, 0]))),
  pngChunk('IEND', Buffer.alloc(0))
]));
const tinyInfo = pngInfo(tinyPngPath);
const tinyDecoded = decodePngPixels(tinyPngPath);
assert.equal(tinyInfo.w, 1);
assert.equal(tinyInfo.h, 1);
assert.equal(tinyDecoded.width, tinyInfo.w);
assert.equal(tinyDecoded.height, tinyInfo.h);
assert.equal(tinyDecoded.bytes, tinyInfo.bytes);
assert.equal(tinyDecoded.channels, 3);

console.log('visual QA utils ok');

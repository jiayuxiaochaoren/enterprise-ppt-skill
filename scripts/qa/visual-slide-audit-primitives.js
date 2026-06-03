const {
  intersectionArea
} = require('./pptx-xml');

const BANNED_PLACEHOLDERS = [
  'lorem', 'ipsum', 'xxxx', 'TODO',
  '示例', '测试稿', '验收稿', '占位', '待补充', '请批评指正',
  '材料显示', '企业 PDF', '企业PDF', 'PDF 简介口径', '正式交付前',
  '材料中提到', '材料中列出', '原材料未', '原材料没有',
  '图册页优先', '该页用于', '该页只展示', '模型抽取', '用户材料自动整理'
];

function hasCjk(text) {
  return /[\u3400-\u9fff]/.test(String(text || ''));
}

function compactUnique(values = []) {
  const out = [];
  const seen = new Set();
  values.filter(v => v != null && String(v).trim()).forEach(value => {
    const key = String(value).trim();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(value);
    }
  });
  return out;
}

function regionCoverage(shapes = [], region = {}) {
  const area = Number(region.w || 0) * Number(region.h || 0);
  if (!area) return 0;
  const covered = shapes.reduce((sum, shape) => sum + intersectionArea(shape, region), 0);
  return Number(Math.min(1, covered / area).toFixed(4));
}

function textCharsInRegion(textShapes = [], region = {}) {
  return textShapes
    .filter(shape => intersectionArea(shape, region) > 0)
    .reduce((sum, shape) => sum + String(shape.text || '').replace(/\s+/g, '').length, 0);
}

function visualQaSettings(qa = {}) {
  return {
    minFontSize: Number(qa.minFontSize || 6.2),
    preferredBodyMin: Number(qa.preferredBodyMin || 8.8),
    minReadableCjkWidth: Number(qa.minReadableCjkWidth || 1.15),
    maxReadableCharsPerInch: Number(qa.maxReadableCharsPerInch || 14),
    maxTinyRuns: Number(qa.maxTinyRunsPerSlide || 10),
    maxSmallChineseRuns: Number(qa.maxSmallChineseRunsPerSlide || 2),
    maxRuns: Number(qa.maxTextRunsPerSlide || 80),
    maxFontFamilies: Number(qa.maxFontFamiliesPerDeck || 5),
    maxFontSizesPerSlide: Number(qa.maxFontSizesPerSlide || 14),
    minRenderedCjkSize: Number(qa.minRenderedCjkSize || 7.2)
  };
}

module.exports = {
  BANNED_PLACEHOLDERS,
  compactUnique,
  hasCjk,
  regionCoverage,
  textCharsInRegion,
  visualQaSettings
};

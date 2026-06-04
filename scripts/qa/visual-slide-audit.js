const {
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
} = require('./pptx-xml');
const {
  slideRegionMetrics
} = require('./visual-slide-regions');
const {
  BANNED_PLACEHOLDERS,
  compactUnique,
  hasCjk,
  regionCoverage,
  textCharsInRegion,
  visualQaSettings
} = require('./visual-slide-audit-primitives');

function auditSlideXml(xml = '', slideNo = 1, qa = {}) {
  const settings = visualQaSettings(qa);
  const findings = [];
  const texts = xmlTextValues(xml);
  const runs = xmlTextRuns(xml);
  const textShapes = xmlTextShapes(xml);
  const lineShapes = xmlLineShapes(xml);
  const rectShapes = xmlRectShapes(xml);
  const imageShapes = xmlImageShapes(xml);
  const allText = texts.join(' ');
  const sizes = [...xml.matchAll(/<a:rPr\b[^>]*\bsz="(\d+)"/g)].map(m => Number(m[1]) / 100);
  const fontFamilies = compactUnique(runs.flatMap(run => run.fonts || []));
  const uniqueSizes = compactUnique(sizes.map(size => Number(size.toFixed(2)))).sort((a,b) => b - a);
  const tiny = sizes.filter(v => v > 0 && v < settings.minFontSize);
  const smallChinese = runs.filter(r => r.size != null && r.size < settings.preferredBodyMin && hasCjk(r.text) && r.text.trim().length >= 2);
  const renderedTinyChinese = runs.filter(r => r.size != null && r.size < settings.minRenderedCjkSize && hasCjk(r.text) && r.text.trim().length >= 2);
  const unreadableNarrow = textShapes.filter(shape => {
    if (!hasCjk(shape.text) || shape.w == null) return false;
    if (shape.y != null && shape.y >= 6.62) return false;
    const compact = shape.text.replace(/\s+/g, '');
    if (compact.length < 9) return false;
    const pressure = compact.length / Math.max(0.01, shape.w);
    const nearBodySize = shape.minSize == null || shape.minSize <= settings.preferredBodyMin + 0.4;
    return (shape.w < settings.minReadableCjkWidth && nearBodySize) || (shape.w < 1.35 && pressure > settings.maxReadableCharsPerInch);
  });
  const images = (xml.match(/<a:blip\b/g) || []).length;
  const {
    mainBodyCoverage,
    mainBodyRegion,
    rightEvidenceCoverage,
    mainBodyCharCount,
    mainBodyElements,
    significantRects
  } = slideRegionMetrics(textShapes, rectShapes, imageShapes);
  const badWords = BANNED_PLACEHOLDERS.filter(w => allText.toLowerCase().includes(w.toLowerCase()));

  if (tiny.length > settings.maxTinyRuns) findings.push({ slide:slideNo, level:'fail', type:'tinyText', message:`${tiny.length} text runs below ${settings.minFontSize}pt` });
  if (renderedTinyChinese.length) {
    const sample = renderedTinyChinese.slice(0, 3).map(r => `"${r.text.slice(0, 16)}" ${r.size}pt`).join('; ');
    findings.push({ slide:slideNo, level:'fail', type:'renderedTinyChineseText', message:`${renderedTinyChinese.length} rendered Chinese text runs below ${settings.minRenderedCjkSize}pt: ${sample}` });
  }
  if (smallChinese.length > settings.maxSmallChineseRuns) findings.push({ slide:slideNo, level:'review', type:'smallChineseText', message:`${smallChinese.length} Chinese text runs below preferred ${settings.preferredBodyMin}pt` });
  if (unreadableNarrow.length) {
    const sample = unreadableNarrow.slice(0, 3).map(s => `"${s.text.slice(0, 18)}" ${s.w.toFixed(2)}in`).join('; ');
    findings.push({ slide:slideNo, level:'fail', type:'unreadableNarrowText', message:`${unreadableNarrow.length} Chinese text boxes are too narrow for readable captions: ${sample}` });
  }

  const textCoveredByRects = textShapes.flatMap(shape => {
    if ([shape.x, shape.y, shape.w, shape.h].some(v => v == null)) return [];
    if (shape.y >= 6.62) return [];
    if (String(shape.text || '').trim().length < 2) return [];
    const area = rectArea(shape);
    if (area < 0.012) return [];
    return significantRects.filter(rect => {
      if (rect.order <= shape.order) return false;
      if (rect.hasText) return false;
      if (rect.fillOpacity < 0.2) return false;
      if (rect.w < 0.08 || rect.h < 0.08) return false;
      const overlap = intersectionArea(shape, rect);
      const overlapRatio = overlap / Math.max(0.01, area);
      return overlap >= 0.015 && overlapRatio >= 0.35;
    }).map(rect => ({ shape, rect, overlapRatio: intersectionArea(shape, rect) / Math.max(0.01, area) }));
  });
  if (textCoveredByRects.length) {
    const sample = textCoveredByRects.slice(0, 3).map(item =>
      `"${item.shape.text.slice(0, 18)}" ${Math.round(item.overlapRatio * 100)}%`
    ).join('; ');
    findings.push({
      slide:slideNo,
      level:'fail',
      type:'textCoveredByShape',
      message:`${textCoveredByRects.length} text box(es) appear covered by later filled rectangles: ${sample}`
    });
  }

  const lineTextOverlaps = lineShapes.flatMap(line => textShapes.filter(shape => lineIntersectsText(line, shape)).map(shape => ({ line, shape })));
  if (lineTextOverlaps.length) {
    const sample = lineTextOverlaps.slice(0, 3).map(item => `"${item.shape.text.slice(0, 18)}"`).join('; ');
    findings.push({ slide:slideNo, level:'review', type:'textLineCollision', message:`${lineTextOverlaps.length} rule/underline shapes intersect visible text: ${sample}` });
  }

  const arrowBlocked = lineShapes.filter(line => line.arrow && (line.w > 0.18 || line.h > 0.18)).filter(line => {
    const mid = lineMidpoint(line);
    return rectShapes.some(rect => {
      const area = rect.w * rect.h;
      if (area < 0.12 || area > 18) return false;
      if (rect.order <= line.order) return false;
      return rectContainsPoint(rect, mid.x, mid.y, 0.04);
    });
  });
  if (arrowBlocked.length) {
    findings.push({ slide:slideNo, level:'fail', type:'arrowCoveredByRectangle', message:`${arrowBlocked.length} arrow connector(s) appear covered by later rectangle shapes` });
  }

  const bottomFlowConflicts = lineShapes.filter(line => line.w > 0.72 && line.h < 0.06 && line.y >= 6.0)
    .flatMap(line => textShapes.filter(shape => {
      if (shape.x == null || shape.y == null || shape.w == null || shape.h == null || shape.y < 6.0) return false;
      const yInside = line.y > shape.y + 0.01 && line.y < shape.y + shape.h - 0.01;
      const xOverlap = Math.max(line.x, shape.x) < Math.min(line.x + line.w, shape.x + shape.w) - 0.04;
      return yInside && xOverlap;
    }).map(shape => ({ line, shape })));
  if (bottomFlowConflicts.length) {
    const sample = bottomFlowConflicts.slice(0, 3).map(item => `"${item.shape.text.slice(0, 18)}"`).join('; ');
    findings.push({ slide:slideNo, level:'fail', type:'bottomFlowFooterCollision', message:`${bottomFlowConflicts.length} bottom flow/rule shapes collide with footer or caption text: ${sample}` });
  }

  if (texts.length > settings.maxRuns) findings.push({ slide:slideNo, level:'review', type:'textDensity', message:`${texts.length} text runs; likely too dense` });
  if (uniqueSizes.length > settings.maxFontSizesPerSlide) findings.push({ slide:slideNo, level:'review', type:'typographyScaleTooFragmented', message:`${uniqueSizes.length} font sizes on one slide; expected <= ${settings.maxFontSizesPerSlide}` });
  if (badWords.length) findings.push({ slide:slideNo, level:'fail', type:'placeholderText', message:`placeholder words: ${badWords.join(', ')}` });

  return {
    findings,
    report: {
      slide: slideNo,
      textRuns: texts.length,
      charCount: allText.length,
      fontMin: sizes.length ? Math.min(...sizes) : null,
      fontFamilies,
      fontSizes: uniqueSizes,
      tinyRuns: tiny.length,
      smallChineseRuns: smallChinese.length,
      lineShapes: lineShapes.length,
      rectShapes: rectShapes.length,
      images,
      imageShapes: imageShapes.length,
      mainBodyCoverage,
      rightEvidenceCoverage,
      mainBodyCharCount,
      mainBodyElements,
      sample: texts.slice(0, 8)
    }
  };
}

function buildSlideReports(slideEntries = [], readSlideXml = () => '', qa = {}) {
  const findings = [];
  const slideReports = slideEntries.map((entry, idx) => {
    const result = auditSlideXml(readSlideXml(entry), idx + 1, qa);
    result.findings.forEach(f => findings.push(f));
    return result.report;
  });
  const settings = visualQaSettings(qa);
  const deckFontFamilies = compactUnique(slideReports.flatMap(slide => slide.fontFamilies || []));
  if (deckFontFamilies.length > settings.maxFontFamilies) {
    findings.push({ level:'review', type:'typographyFontFamilyDrift', message:`deck uses ${deckFontFamilies.length} font families: ${deckFontFamilies.join(', ')}` });
  }
  return {
    findings,
    slideReports,
    deckFontFamilies
  };
}

module.exports = {
  auditSlideXml,
  buildSlideReports,
  compactUnique,
  hasCjk,
  regionCoverage,
  textCharsInRegion,
  visualQaSettings
};

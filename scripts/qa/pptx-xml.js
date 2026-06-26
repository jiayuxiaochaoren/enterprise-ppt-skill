const EMU_PER_INCH = 914400;

function xmlTextValues(xml) {
  return [...String(xml || '').matchAll(/<a:t>(.*?)<\/a:t>/g)].map(match => match[1]
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'"));
}

function xmlTextRuns(xml) {
  return [...String(xml || '').matchAll(/<a:r>([\s\S]*?)<\/a:r>/g)].map(match => {
    const run = match[1];
    const size = ((run.match(/<a:rPr\b[^>]*\bsz="(\d+)"/) || [])[1]);
    const fonts = [...run.matchAll(/typeface="([^"]+)"/g)].map(fontMatch => fontMatch[1]);
    const text = xmlTextValues(run).join('');
    return { text, size: size ? Number(size) / 100 : null, fonts };
  }).filter(run => run.text);
}

function xmlTextShapes(xml) {
  return [...String(xml || '').matchAll(/<p:sp\b[\s\S]*?<\/p:sp>/g)].map(match => {
    const block = match[0];
    const text = xmlTextValues(block).join('');
    if (!text.trim()) return null;
    const off = block.match(/<a:off\b[^>]*\bx="(-?\d+)"[^>]*\by="(-?\d+)"/);
    const ext = block.match(/<a:ext\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/);
    const runs = xmlTextRuns(block);
    const sizes = runs.map(run => run.size).filter(value => value != null);
    const bodyPr = (block.match(/<a:bodyPr\b[^>]*>/) || [''])[0];
    const pPr = (block.match(/<a:pPr\b[^>]*>/) || [''])[0];
    const align = ((pPr.match(/\balgn="([^"]+)"/) || [])[1]) || 'l';
    const anchor = ((bodyPr.match(/\banchor="([^"]+)"/) || [])[1]) || 't';
    return {
      text,
      x: off ? Number(off[1]) / EMU_PER_INCH : null,
      y: off ? Number(off[2]) / EMU_PER_INCH : null,
      w: ext ? Number(ext[1]) / EMU_PER_INCH : null,
      h: ext ? Number(ext[2]) / EMU_PER_INCH : null,
      minSize: sizes.length ? Math.min(...sizes) : null,
      align,
      anchor,
      order: match.index || 0
    };
  }).filter(Boolean);
}

function xmlLineShapes(xml) {
  const source = String(xml || '');
  const connectorBlocks = [...source.matchAll(/<p:cxnSp\b[\s\S]*?<\/p:cxnSp>/g)]
    .map(match => ({ block:match[0], order:match.index || 0 }));
  const shapeLineBlocks = [...source.matchAll(/<p:sp\b[\s\S]*?<\/p:sp>/g)]
    .filter(match => /<a:prstGeom\b[^>]*prst="line"/.test(match[0]))
    .map(match => ({ block:match[0], order:match.index || 0 }));
  const blocks = [...connectorBlocks, ...shapeLineBlocks];
  return blocks.map(item => {
    const off = item.block.match(/<a:off\b[^>]*\bx="(-?\d+)"[^>]*\by="(-?\d+)"/);
    const ext = item.block.match(/<a:ext\b[^>]*\bcx="(-?\d+)"[^>]*\bcy="(-?\d+)"/);
    if (!off || !ext) return null;
    const x = Number(off[1]) / EMU_PER_INCH;
    const y = Number(off[2]) / EMU_PER_INCH;
    const w = Number(ext[1]) / EMU_PER_INCH;
    const h = Number(ext[2]) / EMU_PER_INCH;
    return {
      x: Math.min(x, x + w),
      y: Math.min(y, y + h),
      w: Math.abs(w),
      h: Math.abs(h),
      order: item.order,
      arrow: /<a:(?:headEnd|tailEnd)\b[^>]*\btype="(?:triangle|stealth|arrow|oval|diamond)"/i.test(item.block)
    };
  }).filter(Boolean);
}

function xmlRectShapes(xml) {
  return [...String(xml || '').matchAll(/<p:sp\b[\s\S]*?<a:prstGeom\b[^>]*prst="rect"[\s\S]*?<\/p:sp>/g)].map(match => {
    const block = match[0];
    const off = block.match(/<a:off\b[^>]*\bx="(-?\d+)"[^>]*\by="(-?\d+)"/);
    const ext = block.match(/<a:ext\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/);
    if (!off || !ext) return null;
    const x = Number(off[1]) / EMU_PER_INCH;
    const y = Number(off[2]) / EMU_PER_INCH;
    const w = Number(ext[1]) / EMU_PER_INCH;
    const h = Number(ext[2]) / EMU_PER_INCH;
    const hasText = Boolean(xmlTextValues(block).join('').trim());
    const spPr = (block.match(/<p:spPr\b[\s\S]*?<\/p:spPr>/) || [''])[0];
    const fillRegion = String(spPr || block).split(/<a:ln\b/)[0];
    const noFill = /<a:noFill\b[^>]*\/>/.test(fillRegion);
    const hasSolidFill = /<a:solidFill\b[\s\S]*?<\/a:solidFill>|<a:solidFill\b[^>]*\/>/.test(fillRegion);
    const alphaValues = [...fillRegion.matchAll(/<a:alpha\b[^>]*\bval="(\d+)"/g)]
      .map(alphaMatch => Number(alphaMatch[1]))
      .filter(Number.isFinite);
    const fillOpacity = noFill
      ? 0
      : (hasSolidFill ? (alphaValues.length ? Math.min(...alphaValues) / 100000 : 1) : 0);
    return { x, y, w, h, order:match.index || 0, hasText, hasSolidFill, fillOpacity };
  }).filter(Boolean);
}

function xmlImageShapes(xml) {
  return [...String(xml || '').matchAll(/<p:pic\b[\s\S]*?<\/p:pic>/g)].map(match => {
    const block = match[0];
    const off = block.match(/<a:off\b[^>]*\bx="(-?\d+)"[^>]*\by="(-?\d+)"/);
    const ext = block.match(/<a:ext\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/);
    if (!off || !ext) return null;
    const x = Number(off[1]) / EMU_PER_INCH;
    const y = Number(off[2]) / EMU_PER_INCH;
    const w = Number(ext[1]) / EMU_PER_INCH;
    const h = Number(ext[2]) / EMU_PER_INCH;
    return { x, y, w, h, order:match.index || 0 };
  }).filter(Boolean);
}

function rectContainsPoint(rect, x, y, pad = 0.02) {
  return x > rect.x + pad && x < rect.x + rect.w - pad && y > rect.y + pad && y < rect.y + rect.h - pad;
}

function intersectionArea(a = {}, b = {}) {
  if ([a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h].some(value => value == null)) return 0;
  const w = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const h = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return w * h;
}

function rectArea(rect = {}) {
  return Math.max(0, Number(rect.w || 0)) * Math.max(0, Number(rect.h || 0));
}

function lineMidpoint(line = {}) {
  return { x:line.x + line.w / 2, y:line.y + line.h / 2 };
}

function estimatedTextInkBounds(shape = {}) {
  if ([shape.x, shape.y, shape.w, shape.h].some(value => value == null)) return null;
  const raw = String(shape.text || '').replace(/\s+/g, '');
  if (!raw) return null;
  const fontSize = Number(shape.minSize || 9);
  const fontIn = Math.max(5, fontSize) / 72;
  const glyphWidth = [...raw].reduce((sum, ch) => {
    if (/[\u3400-\u9fff]/.test(ch)) return sum + fontIn * 0.92;
    if (/[A-Z0-9]/.test(ch)) return sum + fontIn * 0.62;
    return sum + fontIn * 0.48;
  }, 0);
  const lineWidthLimit = Math.max(0.05, shape.w - 0.06);
  const lineCount = Math.max(1, Math.ceil(glyphWidth / lineWidthLimit));
  const lineHeight = Math.max(0.10, fontIn * 1.34);
  const inkW = Math.min(shape.w, lineCount > 1 ? lineWidthLimit : Math.max(0.04, glyphWidth));
  const inkH = Math.min(shape.h, Math.max(lineHeight, lineCount * lineHeight));
  let x = shape.x;
  if (/ctr|center/.test(shape.align || '')) x = shape.x + Math.max(0, (shape.w - inkW) / 2);
  else if (/r|right/.test(shape.align || '')) x = shape.x + Math.max(0, shape.w - inkW);
  let y = shape.y;
  if (/ctr|mid/.test(shape.anchor || '')) y = shape.y + Math.max(0, (shape.h - inkH) / 2);
  else if (/b|bottom/.test(shape.anchor || '')) y = shape.y + Math.max(0, shape.h - inkH);
  return { x, y, w:inkW, h:inkH };
}

function lineIntersectsText(line, shape) {
  if (!line || !shape || line.w == null || shape.w == null || shape.h == null) return false;
  if (line.w < 0.22 || line.h > 0.05) return false;
  if (shape.y == null || shape.x == null) return false;
  const text = String(shape.text || '').trim();
  if (text.length < 2) return false;
  if (shape.y >= 6.62) return false;
  const ink = estimatedTextInkBounds(shape) || shape;
  const yInside = line.y > ink.y + 0.018 && line.y < ink.y + ink.h - 0.018;
  const xOverlap = Math.max(line.x, ink.x) < Math.min(line.x + line.w, ink.x + ink.w) - 0.04;
  return yInside && xOverlap;
}

module.exports = {
  EMU_PER_INCH,
  estimatedTextInkBounds,
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
};

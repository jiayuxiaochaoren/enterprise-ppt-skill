const { asNumber, valuesForSpec } = require('../chart-spec');
const { sourceTraceNoteText } = require('../design/source-evidence');

function cleanColor(color = '') {
  return String(color || '').replace('#', '') || '64748B';
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function text(ctx, value, opts) {
  ctx.addText(ctx.slide, value == null ? '' : String(value), opts);
}

function label(ctx, value, opts) {
  ctx.addLabel(ctx.slide, value == null ? '' : String(value), opts);
}

function number(ctx, value, opts) {
  ctx.addNumber(ctx.slide, value == null ? '' : String(value), opts);
}

function rect(ctx, x, y, w, h, fill, line, opts = {}) {
  ctx.addRect(ctx.slide, x, y, w, h, cleanColor(fill), cleanColor(line || fill), opts);
}

function line(ctx, x, y, w, h, color, opts = {}) {
  const shape = h < 0 ? 'lineInv' : 'line';
  ctx.slide.addShape(shape, {
    x,
    y: h < 0 ? y + h : y,
    w,
    h: Math.abs(h),
    line: Object.assign({ color: cleanColor(color), transparency: 18, width: 0.36 }, opts)
  });
}

function seriesValues(spec = {}) {
  return valuesForSpec(spec);
}

function numericValues(spec = {}) {
  return seriesValues(spec).map(v => Object.assign({}, v, { number: asNumber(v.value != null ? v.value : v.rawValue) }))
    .filter(v => v.number != null);
}

function rawValueLabel(value = {}, spec = {}) {
  const raw = value.rawValue != null && value.rawValue !== '' ? value.rawValue : value.value;
  const unit = value.unit || spec.unit || '';
  if (raw == null || raw === '') return '';
  const rawText = String(raw);
  return unit && !rawText.includes(unit) ? `${rawText}${unit}` : rawText;
}

function sourceText(spec = {}, opts = {}) {
  if (!(opts.showSourceNote || opts.visibleSourceNotes)) return '';
  return sourceTraceNoteText(spec);
}

function chartColors(ctx) {
  const C = ctx.colors;
  return [C.accent, C.cyan, C.violet, C.warning || 'F59E0B', C.risk || 'EF4444', C.muted || '64748B'].map(cleanColor);
}

function renderChartFrame(ctx, spec = {}, opts = {}) {
  const C = ctx.colors;
  const x = opts.x == null ? 3.92 : opts.x;
  const y = opts.y == null ? 2.10 : opts.y;
  const w = opts.w == null ? 7.76 : opts.w;
  const h = opts.h == null ? 3.96 : opts.h;
  const fill = opts.fill || ctx.panelFill();
  if (!opts.noFrame) {
    rect(ctx, x, y, w, h, fill, C.line, {
      fill: { color: cleanColor(fill), transparency: 0 },
      line: { color: cleanColor(C.line), transparency: 14, width: 0.52 }
    });
  }
  if (spec.title && opts.showTitle !== false) {
    label(ctx, String(spec.kind || 'chart').toUpperCase(), {
      x: x + 0.30,
      y: y + 0.25,
      w: 1.50,
      h: 0.10,
      typeRole: 'kicker',
      fontSize: 6.4,
      color: C.accent,
      charSpace: 0.7
    });
    text(ctx, spec.title, {
      x: x + 0.30,
      y: y + 0.48,
      w: Math.min(4.2, w - 0.60),
      h: 0.18,
      typeRole: 'chartTitle',
      fontSize: 8.6,
      bold: true,
      color: C.text,
      fit: 'shrink'
    });
  }
  const source = sourceText(spec, opts);
  if (source) {
    text(ctx, source, {
      x: x + 0.30,
      y: y + h - 0.24,
      w: w - 0.60,
      h: 0.11,
      typeRole: 'sourceNote',
      fontSize: 6.3,
      color: C.muted,
      fit: 'shrink'
    });
  }
  return {
    x,
    y,
    w,
    h,
    sourceVisible: Boolean(source),
    plot: {
      x: x + 0.46,
      y: y + (opts.compactHeader ? 0.54 : 0.82),
      w: w - 0.92,
      h: h - (source ? 1.14 : 0.90)
    }
  };
}

function renderInformationGap(ctx, spec = {}, opts = {}) {
  const C = ctx.colors;
  const frame = renderChartFrame(ctx, Object.assign({}, spec, { title: spec.title || '数据口径说明' }), opts);
  const gap = spec.informationGap || {};
  rect(ctx, frame.plot.x, frame.plot.y, frame.plot.w, frame.plot.h, C.panelAlt || 'F1F5F9', C.line, {
    fill: { color: cleanColor(C.panelAlt || 'F1F5F9'), transparency: 0 },
    line: { color: cleanColor(C.line), transparency: 18, width: 0.42 }
  });
  label(ctx, '数据口径说明', {
    x: frame.plot.x + 0.26,
    y: frame.plot.y + 0.34,
    w: 1.20,
    h: 0.10,
    typeRole: 'kicker',
    fontSize: 6.4,
    color: C.risk || C.accent,
    charSpace: 0.6
  });
  text(ctx, gap.reason || '当前数据不足以生成可信图表。', {
    x: frame.plot.x + 0.26,
    y: frame.plot.y + 0.72,
    w: frame.plot.w - 0.52,
    h: 0.36,
    typeRole: 'body',
    fontSize: 9.2,
    bold: true,
    color: C.text,
    fit: 'shrink',
    breakLine: true
  });
  const fields = (gap.missingFields || []).join(' / ');
  if (fields) {
    text(ctx, `缺少字段：${fields}`, {
      x: frame.plot.x + 0.26,
      y: frame.plot.y + 1.36,
      w: frame.plot.w - 0.52,
      h: 0.16,
      typeRole: 'caption',
      fontSize: 7.0,
      color: C.body,
      fit: 'shrink'
    });
  }
  return {
    rendered: true,
    rendererModule: 'components/information-gap',
    componentId: 'information-gap',
    bbox: { x: frame.x, y: frame.y, w: frame.w, h: frame.h },
    visualChecks: { sourceVisible: frame.sourceVisible, unitVisible: Boolean(spec.unit) }
  };
}

module.exports = {
  chartColors,
  clamp,
  cleanColor,
  label,
  line,
  number,
  numericValues,
  rawValueLabel,
  rect,
  renderChartFrame,
  renderInformationGap,
  seriesValues,
  sourceText,
  text
};

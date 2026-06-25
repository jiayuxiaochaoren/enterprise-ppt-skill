const {
  chartNumber
} = require('./financial-chart-utils');

function metricLabelForChannelMatrix(metric = {}) {
  const label = String(metric.label || metric.title || '').trim();
  const note = String(metric.note || metric.body || '').trim();
  if (/^[A-Z]\d{2,}$/i.test(label) && note) return `${note}${label}`;
  return label || note || '渠道';
}

function metricValueText(metric = {}) {
  const value = String(metric.value == null ? '' : metric.value).trim();
  const unit = String(metric.unit || '').trim();
  if (!unit) return value;
  const compactValue = value.replace(/\s+/g, '');
  const compactUnit = unit.replace(/\s+/g, '');
  if (compactUnit && compactValue.toLowerCase().endsWith(compactUnit.toLowerCase())) return value;
  if ((unit === '万' || unit === '万元') && /万(?:元)?$/.test(compactValue)) return value;
  if ((unit === '%' || unit === '％') && /[%％]$/.test(compactValue)) return value;
  if (/^(ROI|ROAS)$/i.test(unit) && new RegExp(`${unit}$`, 'i').test(compactValue)) return value;
  if (['%', '％', '万元', 'pp'].includes(unit)) return `${value}${unit}`;
  return `${value} ${unit}`;
}

function metricItemsForChannelMatrix(metrics = []) {
  const source = metrics.slice(0, 6);
  if (!source.length) return [];
  const values = source.map(metric => chartNumber(metric.value, 0));
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);
  return source.map((metric, i) => {
    const value = values[i];
    const noteScore = chartNumber(metric.note, NaN);
    const x = source.length > 1 ? 16 + (i / (source.length - 1)) * 70 : 52;
    const normalized = (value - min) / span;
    return {
      label:metricLabelForChannelMatrix(metric),
      value:metricValueText(metric),
      x,
      y:Number.isFinite(noteScore) ? noteScore : 42 + normalized * 42,
      size:36 + Math.max(0.12, value / max) * 42,
      body:metric.note || ''
    };
  });
}

function rankItemsForChannelMatrix(items = [], limit = 7) {
  return items.slice(0, limit).map(item => ({
    label:item.label || item.title || item.name || '渠道',
    value:metricValueText(item),
    body:item.body || item.note || item.description || ''
  })).filter(item => item.label || item.value || item.body);
}

function rankTitleForChannelMatrix(s = {}, items = []) {
  if (s.chartTitle || s.chart_title) return s.chartTitle || s.chart_title;
  const text = [
    s.title,
    s.subtitle,
    s.claim,
    s.layoutVariant,
    s.proofObject,
    ...items.flatMap(item => [item.label, item.title, item.body, item.note])
  ].filter(Boolean).join(' ');
  if (/活动|投放|ROI|ROAS|campaign|event/i.test(text)) return '活动ROI排行';
  if (/平台|外卖|美团|饿了么|堂食|自提|团餐|门店|业务线/i.test(text)) return '平台效率排行';
  if (/媒体|渠道|触达|获客|搜索|信息流|小红书|抖音|KOL|KOC/i.test(text)) return '渠道效率排行';
  return '效率排行';
}

function clampPlotValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function channelNumericField(item = {}, fields = [], fallback = NaN) {
  for (const field of fields) {
    if (item[field] == null) continue;
    const value = chartNumber(item[field], NaN);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

function normalizeDenseChannelPercent(value, min, max, rank, total) {
  const count = Math.max(1, total);
  const fallback = count > 1 ? rank / (count - 1) : 0.50;
  const span = max - min;
  const t = Number.isFinite(value) && span > 0.0001 ? (value - min) / span : fallback;
  return 12 + clampPlotValue(t, 0, 1) * 76;
}

function normalizeDenseChannelItems(items = []) {
  const rows = items.map((item, i) => ({
    item,
    index:i,
    x:channelNumericField(item, ['x', 'spend', 'cost', 'share'], NaN),
    y:channelNumericField(item, ['y', 'roas', 'efficiency', 'score', 'value'], NaN)
  }));
  const xValues = rows.map(row => row.x).filter(Number.isFinite);
  const yValues = rows.map(row => row.y).filter(Number.isFinite);
  const xMin = xValues.length ? Math.min(...xValues) : 0;
  const xMax = xValues.length ? Math.max(...xValues) : 1;
  const yMin = yValues.length ? Math.min(...yValues) : 0;
  const yMax = yValues.length ? Math.max(...yValues) : 1;
  return rows.map(row => Object.assign({}, row.item, {
    x:normalizeDenseChannelPercent(row.x, xMin, xMax, row.index, rows.length),
    y:normalizeDenseChannelPercent(row.y, yMin, yMax, rows.length - 1 - row.index, rows.length),
    size:42
  }));
}

function packDenseBubbles(bubbles = [], plot = {}) {
  const packed = bubbles.map(point => Object.assign({}, point, {
    r:0.125,
    x:clampPlotValue(point.x, plot.x + 0.165, plot.x + plot.w - 0.165),
    y:clampPlotValue(point.y, plot.y + 0.165, plot.y + plot.h - 0.165)
  }));
  const minDist = 0.34;
  for (let pass = 0; pass < 12; pass += 1) {
    for (let i = 0; i < packed.length; i += 1) {
      for (let j = i + 1; j < packed.length; j += 1) {
        const a = packed[i];
        const b = packed[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
        if (dist >= minDist) continue;
        const push = (minDist - dist) / 2;
        const ux = dx / dist;
        const uy = dy / dist;
        a.x = clampPlotValue(a.x - ux * push, plot.x + a.r + 0.04, plot.x + plot.w - a.r - 0.04);
        a.y = clampPlotValue(a.y - uy * push, plot.y + a.r + 0.04, plot.y + plot.h - a.r - 0.04);
        b.x = clampPlotValue(b.x + ux * push, plot.x + b.r + 0.04, plot.x + plot.w - b.r - 0.04);
        b.y = clampPlotValue(b.y + uy * push, plot.y + b.r + 0.04, plot.y + plot.h - b.r - 0.04);
      }
    }
  }
  return packed;
}

module.exports = {
  metricItemsForChannelMatrix,
  packDenseBubbles,
  rankItemsForChannelMatrix,
  rankTitleForChannelMatrix,
  normalizeDenseChannelItems
};

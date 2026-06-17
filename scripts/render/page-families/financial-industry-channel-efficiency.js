const {
  chartNumber,
  chooseChannelLabelBox,
  computeChannelMatrixBubbles,
  firstChartItems
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
  if (unit === '%' || unit === '％' || unit === '万元' || unit === 'pp') return `${value}${unit}`;
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
  const packed = bubbles.map((point, i) => {
    const r = 0.125;
    return Object.assign({}, point, {
      r,
      x:clampPlotValue(point.x, plot.x + r + 0.04, plot.x + plot.w - r - 0.04),
      y:clampPlotValue(point.y, plot.y + r + 0.04, plot.y + plot.h - r - 0.04)
    });
  });
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

function createChannelEfficiencyMatrixDrawer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText
  } = ctx;

  function drawMetricRankBoard(slide, board, items, s = {}) {
    const rows = items.slice(0, 5);
    const chart = { x:board.x+0.46, y:board.y+0.78, w:board.w-0.92, h:Math.max(2.70, board.h - 1.22) };
    const values = rows.map(item => chartNumber(item.value, 0));
    const max = Math.max(...values, 1);
    addLabel(slide, rankTitleForChannelMatrix(s, items), { x:board.x+0.30, y:board.y+0.30, w:1.58, h:0.10, fontSize:6.6, color:C.accent, charSpace:0 });
    addHairline(slide, chart.x, chart.y-0.12, chart.w, C.line, 18, 0.42);
    const rowStep = Math.min(0.62, Math.max(0.54, (chart.h - 0.18) / Math.max(1, rows.length)));
    rows.forEach((item, i) => {
      const rowH = 0.52;
      const y = chart.y + i * rowStep;
      const color = [C.accent, C.cyan, C.violet, C.risk, C.muted][i] || C.accent;
      const value = values[i];
      const barW = Math.max(0.22, (value / max) * (chart.w - 2.60));
      const barY = y + (rowH - 0.14) / 2;
      addText(slide, item.label, { x:chart.x, y:y, w:1.26, h:rowH, fontSize:7.5, bold:true, color:C.text, fit:'shrink', valign:'mid' });
      addRect(slide, chart.x+1.42, barY, chart.w-2.42, 0.14, C.panelAlt || 'F1F5F9', C.line, {
        fill:{color:C.panelAlt || 'F1F5F9', transparency:0},
        line:{color:C.line, transparency:80, width:0.18}
      });
      addRect(slide, chart.x+1.42, barY, barW, 0.14, color, color, {
        fill:{color, transparency:6},
        line:{color, transparency:100}
      });
      addText(slide, item.value, { x:chart.x+chart.w-0.90, y:y, w:0.86, h:rowH, fontSize:7.0, bold:true, color, align:'right', fit:'shrink', valign:'mid' });
      if (item.body) {
        addText(slide, item.body, { x:chart.x+1.42, y:y+0.41, w:chart.w-2.54, h:0.11, fontSize:5.9, color:C.body, fit:'shrink', valign:'mid' });
      }
    });
    addHairline(slide, chart.x, chart.y + rows.length * rowStep + 0.04, chart.w, C.line, 16, 0.42);
  }

  function drawDenseCoordinateBoard(slide, board, items, s = {}) {
    const rows = rankItemsForChannelMatrix(items, 7);
    const plot = { x:board.x+0.48, y:board.y+0.70, w:Math.min(3.26, board.w * 0.44), h:2.18 };
    const list = { x:plot.x+plot.w+0.54, y:plot.y+0.04, w:board.x+board.w-(plot.x+plot.w+0.68), h:2.34 };
    const noteBand = { x:board.x+0.46, y:board.y+board.h-0.48, w:board.w-0.92, h:0.24 };
    const xAxisLabelY = Math.min(noteBand.y - 0.14, plot.y + plot.h + 0.04);
    addLabel(slide, rankTitleForChannelMatrix(s, items), { x:board.x+0.30, y:board.y+0.30, w:1.70, h:0.10, fontSize:6.6, color:C.accent, charSpace:0 });
    addHairline(slide, plot.x, plot.y+plot.h, plot.w, C.line, 8, 0.46);
    slide.addShape('line', { x:plot.x, y:plot.y, w:0, h:plot.h, line:{color:C.line, transparency:10, width:0.46} });
    slide.addShape('line', { x:plot.x + plot.w * 0.50, y:plot.y, w:0, h:plot.h, line:{color:C.line, transparency:62, width:0.24} });
    addText(slide, '效率', { x:plot.x-0.02, y:plot.y-0.20, w:0.46, h:0.11, fontSize:6.4, bold:true, color:C.muted, fit:'shrink' });
    const bubbles = packDenseBubbles(
      computeChannelMatrixBubbles(normalizeDenseChannelItems(items.slice(0, 7)), plot, [C.accent, C.cyan, C.violet, C.risk, '94A3B8', C.muted, C.accent]),
      plot
    );
    bubbles.forEach(p => {
      slide.addShape('ellipse', { x:p.x-p.r, y:p.y-p.r, w:p.r*2, h:p.r*2, fill:{color:p.color, transparency:10}, line:{color:p.color, transparency:100} });
      addText(slide, String(p.i+1).padStart(2, '0'), { x:p.x-p.r, y:p.y-0.05, w:p.r*2, h:0.10, fontSize:4.8, bold:true, color:C.onAccent || C.white, align:'center', fit:'shrink', allowTiny:true });
    });
    const rowStep = Math.min(0.42, Math.max(0.36, list.h / Math.max(1, rows.length)));
    rows.forEach((item, i) => {
      const y = list.y + i * rowStep;
      const color = [C.accent, C.cyan, C.violet, C.risk, C.muted][i] || C.accent;
      addText(slide, String(i+1).padStart(2, '0'), { x:list.x, y:y+0.03, w:0.30, h:0.10, fontSize:5.6, bold:true, color, fit:'shrink' });
      addText(slide, item.label, { x:list.x+0.40, y:y-0.01, w:Math.max(0.96, list.w-1.30), h:0.12, fontSize:6.2, bold:true, color:C.text, fit:'shrink' });
      addText(slide, item.value, { x:list.x+list.w-0.78, y:y, w:0.76, h:0.14, fontSize:5.8, bold:true, color, align:'right', fit:'shrink' });
      if (item.body) addText(slide, item.body, { x:list.x+0.40, y:y+0.22, w:Math.max(0.96, list.w-0.48), h:0.10, fontSize:4.95, color:C.body, fit:'shrink', breakLine:true });
    });
    addRect(slide, noteBand.x, noteBand.y, noteBand.w, noteBand.h, C.panelAlt || 'F1F5F9', C.line, {
      fill:{ color:C.panelAlt || 'F1F5F9', transparency:6 },
      line:{ color:C.line, transparency:74, width:0.22 }
    });
    addText(slide, '投入', {
      x:plot.x+plot.w-0.42,
      y:xAxisLabelY,
      w:0.42,
      h:0.10,
      fontSize:6.3,
      bold:true,
      color:C.muted,
      fit:'shrink',
      align:'right'
    });
    addText(slide, s.note || '先看高效率触点，再看高投入触点的转化承接和复购贡献。', {
      x:noteBand.x+0.16, y:noteBand.y+0.10, w:noteBand.w-0.32, h:0.11, fontSize:6.2, color:C.muted, fit:'shrink'
    });
  }

  return function drawChannelEfficiencyMatrix(slide, board, s) {
    const metricItems = metricItemsForChannelMatrix(s.metrics || []);
    const explicitItems = firstChartItems(s, ['channelEfficiency', 'mediaEfficiency', 'scatter', 'channels'], []);
    const hasCoordinateMatrix = explicitItems.some(item => item &&
      ['x', 'y', 'spend', 'cost', 'share', 'roas', 'efficiency', 'score', 'size', 'budget', 'weight']
        .some(field => item[field] != null));
    const rankItems = explicitItems.length ? rankItemsForChannelMatrix(explicitItems, 7) : metricItems;
    if (rankItems.length && !hasCoordinateMatrix) {
      drawMetricRankBoard(slide, board, rankItems, s);
      return;
    }
    const sourceItems = explicitItems.length ? explicitItems : (metricItems.length ? metricItems : [
      { label:'渠道A', title:'渠道A', value:'8x', x:22, y:82, size:64, body:'高效率、低投入' },
      { label:'渠道B', title:'渠道B', value:'4.1x', x:56, y:44, size:48, body:'承接主力需求' },
      { label:'渠道C', title:'渠道C', value:'4.1x', x:84, y:44, size:46, body:'规模触达' },
      { label:'渠道D', title:'渠道D', value:'3.3x', x:66, y:34, size:42, body:'需要优化' },
      { label:'渠道E', title:'渠道E', value:'3.2x', x:30, y:33, size:40, body:'资源位' }
    ]);
    if (sourceItems.length > 5) {
      drawDenseCoordinateBoard(slide, board, sourceItems, s);
      return;
    }
    const items = sourceItems.slice(0, 5);
    const chart = { x:board.x+0.54, y:board.y+0.62, w:board.w-1.06, h:2.84 };
    addHairline(slide, chart.x, chart.y+chart.h, chart.w, C.line, 8, 0.52);
    slide.addShape('line', { x:chart.x, y:chart.y, w:0, h:chart.h, line:{color:C.line, transparency:8, width:0.52} });
    slide.addShape('line', { x:chart.x + chart.w * 0.50, y:chart.y, w:0, h:chart.h, line:{color:C.line, transparency:58, width:0.28} });
    addText(slide, 'ROAS', { x:chart.x-0.06, y:chart.y-0.28, w:0.56, h:0.11, fontSize:6.8, bold:true, color:C.muted, fit:'shrink' });
    addText(slide, '花费', { x:chart.x+chart.w-0.40, y:chart.y+chart.h+0.16, w:0.40, h:0.11, fontSize:6.8, bold:true, color:C.muted, fit:'shrink', align:'right' });
    addText(slide, '高效触点', { x:chart.x+0.18, y:chart.y+0.12, w:0.78, h:0.11, fontSize:6.4, color:C.accent, fit:'shrink' });
    addText(slide, '规模触点', { x:chart.x+chart.w-0.88, y:chart.y+0.12, w:0.76, h:0.11, fontSize:6.4, color:C.muted, fit:'shrink', align:'right' });
    const bubbles = computeChannelMatrixBubbles(items, chart, [C.accent, C.cyan, C.violet, C.risk, '94A3B8', C.muted]);
    bubbles.forEach(p => {
      slide.addShape('ellipse', { x:p.x-p.r, y:p.y-p.r, w:p.r*2, h:p.r*2, fill:{color:p.color, transparency:8}, line:{color:p.color, transparency:100} });
      addText(slide, p.item.value || p.item.roas || '', { x:p.x-p.r, y:p.y-0.06, w:p.r*2, h:0.12, fontSize:6.8, bold:true, color:C.onAccent || C.white, align:'center', fit:'shrink', allowTiny:true });
    });
    const occupiedLabels = [];
    bubbles.forEach(p => {
      const labelBox = chooseChannelLabelBox(p, { chart, bubbles, occupiedLabels });
      occupiedLabels.push(labelBox);
      const labelMidY = labelBox.y + labelBox.h / 2;
      if (labelBox.x > p.x + p.r && Math.abs(labelMidY - p.y) < 0.18) {
        const w = labelBox.x - (p.x + p.r + 0.05);
        if (w > 0.08) addHairline(slide, p.x+p.r+0.03, p.y, w, C.line, 44, 0.22);
      } else if (labelBox.x + labelBox.w < p.x - p.r && Math.abs(labelMidY - p.y) < 0.18) {
        const w = p.x - p.r - (labelBox.x + labelBox.w + 0.05);
        if (w > 0.08) addHairline(slide, labelBox.x+labelBox.w+0.03, p.y, w, C.line, 44, 0.22);
      }
      addText(slide, labelBox.label, { x:labelBox.x, y:labelBox.y+0.02, w:labelBox.w, h:labelBox.h, fontSize:7.0, bold:true, color:C.text, fit:'shrink' });
    });
    const legendY = board.y + 3.56;
    ['低花费/高效率', '高花费/高效率', '需优化'].forEach((label, i) => {
      const color = [C.accent, C.cyan, C.risk][i];
      slide.addShape('ellipse', { x:board.x+0.56+i*1.70, y:legendY+0.03, w:0.09, h:0.09, fill:{color}, line:{color, transparency:100} });
      addText(slide, label, { x:board.x+0.72+i*1.70, y:legendY, w:1.10, h:0.12, fontSize:6.8, color:C.body, fit:'shrink' });
    });
  };
}

module.exports = {
  createChannelEfficiencyMatrixDrawer
};

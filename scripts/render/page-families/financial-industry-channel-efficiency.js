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

function rankItemsForChannelMatrix(items = []) {
  return items.slice(0, 6).map(item => ({
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

  return function drawChannelEfficiencyMatrix(slide, board, s) {
    const metricItems = metricItemsForChannelMatrix(s.metrics || []);
    const explicitItems = firstChartItems(s, ['channelEfficiency', 'mediaEfficiency', 'scatter', 'channels'], []);
    const hasCoordinateMatrix = explicitItems.some(item => item &&
      ['x', 'y', 'spend', 'cost', 'share', 'roas', 'efficiency', 'score', 'size', 'budget', 'weight']
        .some(field => item[field] != null));
    const rankItems = explicitItems.length ? rankItemsForChannelMatrix(explicitItems) : metricItems;
    if (rankItems.length && !hasCoordinateMatrix) {
      drawMetricRankBoard(slide, board, rankItems, s);
      return;
    }
    const items = explicitItems.length ? explicitItems : (metricItems.length ? metricItems : [
      { label:'渠道A', title:'渠道A', value:'8x', x:22, y:82, size:64, body:'高效率、低投入' },
      { label:'渠道B', title:'渠道B', value:'4.1x', x:56, y:44, size:48, body:'承接主力需求' },
      { label:'渠道C', title:'渠道C', value:'4.1x', x:84, y:44, size:46, body:'规模触达' },
      { label:'渠道D', title:'渠道D', value:'3.3x', x:66, y:34, size:42, body:'需要优化' },
      { label:'渠道E', title:'渠道E', value:'3.2x', x:30, y:33, size:40, body:'资源位' }
    ]).slice(0, 6);
    const chart = { x:board.x+0.54, y:board.y+0.62, w:board.w-1.06, h:2.84 };
    addLabel(slide, '渠道效率矩阵', { x:board.x+0.30, y:board.y+0.30, w:1.58, h:0.10, fontSize:6.6, color:C.accent, charSpace:0 });
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

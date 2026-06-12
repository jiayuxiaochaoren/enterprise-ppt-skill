const { renderBarChart } = require('./bar-chart');
const { renderLineChart } = require('./line-chart');
const { renderMatrixChart } = require('./matrix-chart');
const { renderScorecard } = require('./scorecard');
const { renderTableWithCommentary } = require('./table-with-commentary');
const {
  chartColors,
  clamp,
  label,
  numericValues,
  rawValueLabel,
  rect,
  renderChartFrame,
  text
} = require('./chart-layout');

function withBeauty(result, componentId, template) {
  return Object.assign({}, result, {
    rendererModule: result.rendered ? `components/beauty-charts/${template}` : result.rendererModule,
    componentId,
    industryTemplate: template
  });
}

function renderBeautySkuMatrix(ctx, spec, opts) {
  return withBeauty(renderMatrixChart(ctx, spec, opts), 'beauty-sku-matrix', 'sku-matrix');
}

function renderBeautyPriceBandMatrix(ctx, spec, opts) {
  return withBeauty(renderMatrixChart(ctx, spec, opts), 'beauty-price-band-matrix', 'price-band-matrix');
}

function renderBeautyEfficacyTable(ctx, spec, opts) {
  return withBeauty(renderTableWithCommentary(ctx, spec, opts), 'beauty-efficacy-table', 'efficacy-evidence-table');
}

function renderBeautyProofGallery(ctx, spec, opts) {
  return withBeauty(renderTableWithCommentary(ctx, spec, opts), 'beauty-proof-gallery', 'texture-ingredient-proof-gallery');
}

function renderBeautyChannelStructure(ctx, spec, opts) {
  const result = spec.kind === 'matrix'
    ? renderMatrixChart(ctx, spec, opts)
    : renderBarChart(ctx, spec, opts);
  return withBeauty(result, 'beauty-channel-structure', 'channel-structure');
}

function renderBeautyMemberRepurchase(ctx, spec, opts) {
  const result = spec.kind === 'line'
    ? renderLineChart(ctx, spec, opts)
    : renderScorecard(ctx, spec, opts);
  return withBeauty(result, 'beauty-member-repurchase', 'member-repurchase');
}

function renderBeautySocialFunnel(ctx, spec, opts) {
  const C = ctx.colors;
  const values = numericValues(spec).slice(0, opts.max || 5);
  if (spec.kind === 'informationGap' || values.length < 3) return { rendered:false, reason:'beauty social funnel requires at least three values' };
  const frame = renderChartFrame(ctx, spec, opts);
  const plot = frame.plot;
  const colors = chartColors(ctx);
  const max = Math.max(...values.map(v => Math.abs(v.number)), 1);
  const rowH = Math.min(0.42, (plot.h - 0.20) / values.length);
  const gap = Math.max(0.08, (plot.h - 0.18 - values.length * rowH) / Math.max(1, values.length - 1));
  label(ctx, '转化漏斗', { x:frame.x + 0.30, y:frame.y + 0.26, w:1.20, h:0.10, fontSize:6.6, color:C.accent, charSpace:0 });
  values.forEach((value, i) => {
    const y = plot.y + 0.10 + i * (rowH + gap);
    const color = colors[i % colors.length];
    const trackX = plot.x + 1.42;
    const trackW = plot.w - 3.02;
    const fillW = clamp(trackW * Math.abs(value.number) / max, 0.06, trackW);
    rect(ctx, plot.x, y, plot.w, rowH, i === 0 ? (C.panelAlt || 'F1F5F9') : 'FFFFFF', C.line, {
      fill:{ color:i === 0 ? (C.panelAlt || 'F1F5F9') : 'FFFFFF', transparency:i === 0 ? 0 : 3 },
      line:{ color:C.line, transparency:34, width:0.28 }
    });
    rect(ctx, plot.x, y, 0.045, rowH, color, color, {
      fill:{ color, transparency:i === 0 ? 0 : 16 },
      line:{ color, transparency:100 }
    });
    text(ctx, value.category || `阶段 ${i + 1}`, {
      x:plot.x + 0.16, y:y + 0.12, w:1.04, h:0.12,
      fontSize:6.8, bold:true, color:C.text, fit:'shrink'
    });
    rect(ctx, trackX, y + rowH * 0.40, trackW, 0.055, C.panelAlt || 'F1F5F9', C.line, {
      fill:{ color:C.panelAlt || 'F1F5F9', transparency:0 },
      line:{ color:C.line, transparency:100 }
    });
    rect(ctx, trackX, y + rowH * 0.40, fillW, 0.055, color, color, {
      fill:{ color, transparency:i === 0 ? 0 : 10 },
      line:{ color, transparency:100 }
    });
    text(ctx, rawValueLabel(value, spec), {
      x:plot.x + plot.w - 1.26, y:y + 0.08, w:0.64, h:0.13,
      fontSize:7.2, bold:true, color, align:'right', fit:'shrink'
    });
    const previous = values[i - 1] && Math.abs(values[i - 1].number);
    const ratio = previous ? `${Math.round(Math.abs(value.number) / previous * 1000) / 10}%` : '起点';
    text(ctx, i === 0 ? '起点' : `转化 ${ratio}`, {
      x:plot.x + plot.w - 0.56, y:y + 0.09, w:0.48, h:0.12,
      fontSize:5.8, color:C.body, align:'right', fit:'shrink'
    });
  });
  return withBeauty({
    rendered:true,
    rendererModule:'components/beauty-charts/social-funnel',
    componentId:'beauty-social-funnel',
    bbox:{ x:frame.x, y:frame.y, w:frame.w, h:frame.h },
    itemCount:values.length,
    visualChecks:{
      axisLabels:true,
      unitVisible:Boolean(spec.unit),
      sourceVisible:frame.sourceVisible,
      labelCollision:values.length > 5,
      valueOverflow:false
    }
  }, 'beauty-social-funnel', 'social-funnel');
}

function renderBeautyReviewSentiment(ctx, spec, opts) {
  const C = ctx.colors;
  const values = numericValues(spec)
    .sort((a, b) => Math.abs(b.number) - Math.abs(a.number))
    .slice(0, opts.max || 6);
  if (spec.kind === 'informationGap' || values.length < 3) return { rendered:false, reason:'beauty review sentiment requires at least three values' };
  const frame = renderChartFrame(ctx, spec, opts);
  const plot = frame.plot;
  const colors = chartColors(ctx);
  const max = Math.max(...values.map(v => Math.abs(v.number)), 1);
  const rowH = Math.min(0.34, (plot.h - 0.18) / values.length);
  const gap = Math.max(0.08, (plot.h - 0.14 - values.length * rowH) / Math.max(1, values.length - 1));
  label(ctx, '顾虑频次排序', { x:frame.x + 0.30, y:frame.y + 0.26, w:1.40, h:0.10, fontSize:6.6, color:C.accent, charSpace:0 });
  values.forEach((value, i) => {
    const y = plot.y + 0.10 + i * (rowH + gap);
    const color = i === 0 ? (C.risk || colors[0]) : colors[i % colors.length];
    const barX = plot.x + 1.44;
    const barW = plot.w - 2.36;
    const fillW = clamp(barW * Math.abs(value.number) / max, 0.24, barW);
    text(ctx, value.category || `顾虑 ${i + 1}`, {
      x:plot.x, y:y + 0.08, w:1.22, h:0.12,
      fontSize:6.4, bold:i === 0, color:C.text, fit:'shrink'
    });
    rect(ctx, barX, y + 0.11, barW, 0.11, C.panelAlt || 'F1F5F9', C.line, {
      fill:{ color:C.panelAlt || 'F1F5F9', transparency:0 },
      line:{ color:C.line, transparency:100 }
    });
    rect(ctx, barX, y + 0.11, fillW, 0.11, color, color, {
      fill:{ color, transparency:i === 0 ? 0 : 12 },
      line:{ color, transparency:100 }
    });
    text(ctx, rawValueLabel(value, spec), {
      x:plot.x + plot.w - 0.54, y:y + 0.05, w:0.44, h:0.12,
      fontSize:6.8, bold:true, color, align:'right', fit:'shrink'
    });
  });
  return withBeauty({
    rendered:true,
    rendererModule:'components/beauty-charts/review-sentiment',
    componentId:'beauty-review-sentiment',
    bbox:{ x:frame.x, y:frame.y, w:frame.w, h:frame.h },
    itemCount:values.length,
    visualChecks:{
      axisLabels:true,
      unitVisible:Boolean(spec.unit),
      sourceVisible:frame.sourceVisible,
      labelCollision:values.length > 6,
      valueOverflow:false
    }
  }, 'beauty-review-sentiment', 'review-sentiment');
}

function renderBeautySustainabilityMatrix(ctx, spec, opts) {
  return withBeauty(renderMatrixChart(ctx, spec, opts), 'beauty-sustainability-matrix', 'packaging-sustainability-matrix');
}

module.exports = {
  renderBeautyChannelStructure,
  renderBeautyEfficacyTable,
  renderBeautyMemberRepurchase,
  renderBeautyPriceBandMatrix,
  renderBeautyProofGallery,
  renderBeautyReviewSentiment,
  renderBeautySkuMatrix,
  renderBeautySocialFunnel,
  renderBeautySustainabilityMatrix
};

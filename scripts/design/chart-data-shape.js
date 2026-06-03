const {
  CHART_FIELD_KEYS
} = require('./chart-spec-constants');
const {
  asNumber,
  coerceItems,
  compactUnique,
  firstItems,
  itemNote,
  itemValue,
  matrixFromValue,
  metricsFromSlide,
  normalizeSeries,
  unitOf
} = require('./chart-data-utils');

function dataForKind(kind, slide = {}) {
  if (kind === 'waterfall') return normalizeSeries(firstItems(slide, CHART_FIELD_KEYS.waterfall).items, { name: 'Waterfall' });
  if (kind === 'line') return normalizeSeries(firstItems(slide, CHART_FIELD_KEYS.line).items, { name: 'Trend', defaultCategory: 'Period' });
  if (kind === 'funnel') return normalizeSeries(firstItems(slide, CHART_FIELD_KEYS.funnel).items, { name: 'Funnel', defaultCategory: 'Stage' });
  if (kind === 'pareto') return normalizeSeries(firstItems(slide, CHART_FIELD_KEYS.pareto).items, { name: 'Pareto' });
  if (kind === 'bar') return normalizeSeries(firstItems(slide, CHART_FIELD_KEYS.bar).items.concat(metricsFromSlide(slide)), { name: 'Bars' });
  if (kind === 'scorecard' || kind === 'kpi') {
    const metrics = metricsFromSlide(slide);
    return {
      categories: metrics.map(m => m.label),
      series: [{ name: 'Metrics', values: metrics.map(m => ({
        category: m.label,
        value: asNumber(m.value),
        rawValue: m.value,
        note: m.note,
        unit: m.unit || unitOf(m.value),
        sourceTrace: m.sourceTrace || null
      })) }]
    };
  }
  if (kind === 'matrix' || kind === 'heatmap') {
    const matrixKey = CHART_FIELD_KEYS[kind].find(key => matrixFromValue(slide[key]) || coerceItems(slide[key]).length);
    const matrix = matrixFromValue(slide[matrixKey]) || matrixFromValue(coerceItems(slide[matrixKey]));
    if (matrix) {
      return {
        categories: matrix.columns || [],
        matrix,
        series: [{ name: matrixKey || kind, values: [] }]
      };
    }
    const items = coerceItems(slide.channelEfficiency || slide.mediaEfficiency || slide.scatter || slide.channels || slide.priceBands || slide.products);
    return normalizeSeries(items, { name: 'Matrix' });
  }
  if (kind === 'table') {
    const found = firstItems(slide, CHART_FIELD_KEYS.table);
    const rows = found.items.length ? found.items : coerceItems(slide.cards || slide.items);
    return {
      categories: [],
      table: {
        headers: slide.headers || slide.columns || [],
        rows
      },
      series: []
    };
  }
  return { categories: [], series: [] };
}

function primaryUnit(data = {}, slide = {}) {
  const explicit = slide.unit || slide.metricUnit || slide.unitLabel || '';
  if (explicit) return explicit;
  const values = (data.series || []).flatMap(series => series.values || []);
  return compactUnique(values.map(v => v.unit || unitOf(v.rawValue))).filter(unit => unit !== 'x')[0] || compactUnique(values.map(v => v.unit || unitOf(v.rawValue)))[0] || '';
}

function valuesForSpec(spec = {}) {
  return (spec.series || []).flatMap(series => series.values || []);
}

function dataSufficiency(spec = {}) {
  const values = valuesForSpec(spec);
  const numeric = values.filter(v => v.value != null);
  const categories = spec.categories || [];
  const matrix = spec.matrix || {};
  const tableRows = (spec.table && spec.table.rows) || [];
  const reasons = [];
  const missingFields = [];
  const uniqueCategories = compactUnique(categories);
  const kind = spec.kind;

  if (kind === 'line') {
    if (numeric.length < 2) {
      reasons.push('折线图至少需要两个真实数值点');
      missingFields.push('series[0].values[1]');
    }
    if (uniqueCategories.length < 2) {
      reasons.push('折线图需要对应的时间或分类标签');
      missingFields.push('categories');
    }
  } else if (kind === 'bar') {
    if (numeric.length < 2 || uniqueCategories.length < 2) {
      reasons.push('柱状图至少需要两组可比较数值');
      missingFields.push('categories', 'series');
    }
  } else if (kind === 'waterfall') {
    if (numeric.length < 3) {
      reasons.push('瀑布图需要起点、至少一个驱动项和终点');
      missingFields.push('bridge');
    }
  } else if (kind === 'funnel') {
    if (numeric.length < 3 || uniqueCategories.length < 3) {
      reasons.push('漏斗图至少需要三个有顺序的阶段');
      missingFields.push('funnel');
    }
  } else if (kind === 'matrix' || kind === 'heatmap') {
    const rowCount = Array.isArray(matrix.rows) ? matrix.rows.length : 0;
    const colCount = Array.isArray(matrix.columns) ? matrix.columns.length : 0;
    if (rowCount && colCount) {
      if (rowCount < 2 || colCount < 2) {
        reasons.push('矩阵图至少需要 2 x 2 的行列结构');
        missingFields.push('matrix.rows', 'matrix.columns');
      }
    } else if (numeric.length < 3 && uniqueCategories.length < 2) {
      reasons.push('矩阵图需要可定位或可分组的数据，而不是单一数值');
      missingFields.push('matrix or scatter items');
    }
  } else if (kind === 'pareto') {
    if (numeric.length < 3) {
      reasons.push('帕累托图至少需要三个可排序贡献项');
      missingFields.push('pareto');
    }
  } else if (kind === 'table') {
    if (!tableRows.length) {
      reasons.push('表格需要至少一行数据');
      missingFields.push('rows');
    }
  } else if (kind === 'scorecard') {
    if (numeric.length + tableRows.length < 2) {
      reasons.push('评分卡至少需要两个指标或数据行');
      missingFields.push('metrics');
    }
  } else if (kind === 'kpi') {
    if (!numeric.length && !values.length) {
      reasons.push('KPI 至少需要一个真实指标');
      missingFields.push('metrics[0]');
    }
  }

  return {
    ok: reasons.length === 0,
    reasons,
    missingFields: compactUnique(missingFields)
  };
}

module.exports = {
  dataForKind,
  dataSufficiency,
  primaryUnit,
  valuesForSpec
};

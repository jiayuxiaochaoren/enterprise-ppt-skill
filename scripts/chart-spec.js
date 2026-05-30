const CHART_SPEC_VERSION = 'chartSpec/v1';

const GENERIC_KINDS = [
  'kpi',
  'bar',
  'line',
  'waterfall',
  'funnel',
  'matrix',
  'heatmap',
  'pareto',
  'table',
  'scorecard',
  'informationGap'
];

const CHART_COMPONENTS = {
  kpi: 'kpi-strip',
  bar: 'bar-chart',
  line: 'line-chart',
  waterfall: 'waterfall-chart',
  funnel: 'funnel-chart',
  matrix: 'matrix-chart',
  heatmap: 'heatmap-chart',
  pareto: 'pareto-chart',
  table: 'table-with-commentary',
  scorecard: 'scorecard',
  informationGap: 'information-gap'
};
const KNOWN_CHART_KINDS = new Set(GENERIC_KINDS);

const BEAUTY_TEMPLATE_COMPONENTS = {
  'sku-matrix': 'beauty-sku-matrix',
  'price-band-matrix': 'beauty-price-band-matrix',
  'efficacy-evidence-table': 'beauty-efficacy-table',
  'texture-ingredient-proof-gallery': 'beauty-proof-gallery',
  'channel-structure': 'beauty-channel-structure',
  'member-repurchase': 'beauty-member-repurchase',
  'social-funnel': 'beauty-social-funnel',
  'review-sentiment': 'beauty-review-sentiment',
  'packaging-sustainability-matrix': 'beauty-sustainability-matrix'
};

const CHART_FIELD_KEYS = {
  waterfall: ['waterfallBridge', 'targetBridge', 'bridge'],
  line: ['monthlyPulse', 'monthlyTrend', 'trend', 'seriesTrend', 'repurchaseTrend'],
  funnel: ['funnel', 'adoptionFunnel', 'activationFunnel', 'cohortFunnel', 'socialFunnel'],
  pareto: ['pareto', 'downtimePareto', 'lossPareto', 'oeeLosses', 'reviewSentiment'],
  matrix: ['matrix', 'skuMatrix', 'priceBandMatrix', 'priceBands', 'channelEfficiency', 'mediaEfficiency', 'scatter', 'channels', 'packagingMatrix', 'sustainabilityMatrix'],
  heatmap: ['heatmap', 'valuationSensitivity', 'sensitivity', 'exitScenarios', 'irrSensitivity'],
  bar: ['bars', 'barData', 'channelStructure', 'channelMix', 'segments'],
  scorecard: ['scorecard', 'memberCohorts', 'cohorts', 'rfmLadder', 'metrics'],
  table: ['rows', 'tableRows', 'efficacyTable', 'proofTable'],
  kpi: ['metrics']
};

const BODY_EXEMPT_TYPES = new Set(['cover', 'cover-dark', 'toc', 'toc-clean', 'chapter-divider', 'closing', 'closing-dark']);
const NON_CHART_DATA_COMPONENT_RE = /proof-gallery|evidence-gallery|campaign-proof-gallery|risk-register|value-chain|product-matrix|proof-photo|gallery|caption|governance-table|process|story|hero|image/i;
const CHART_DATA_COMPONENT_RE = /chart|kpi|metric|scorecard|trend|line|bar|waterfall|bridge|funnel|matrix|heatmap|pareto|table|scatter|bubble|score|cohort|channel|regional-scorecard|monthly|pulse|repurchase|sentiment/i;
const NON_CHART_VARIANT_RE = /brand-world|product-evidence|consumer-proof|sustainability-proof|proof-photo|gallery|lookbook|story|governance-table|value-creation-process|beauty-brand-editorial|premium-closing|cover|closing/i;
const CHART_VARIANT_RE = /chart|kpi|scorecard|member-growth|regional-scorecard|financial-kpi|quarterly-results|waterfall|funnel|matrix|pareto|trend|bridge|channel-mix|channel-structure/i;

function compactUnique(values = []) {
  const out = [];
  const seen = new Set();
  values.filter(v => v != null && String(v).trim()).forEach(value => {
    const key = String(value).trim();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  });
  return out;
}

function isChartDataComponent(value = '') {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return false;
  if (NON_CHART_DATA_COMPONENT_RE.test(text)) return false;
  return CHART_DATA_COMPONENT_RE.test(text);
}

function hasChartFieldData(slide = {}) {
  const type = String(slide.type || '');
  return Object.entries(CHART_FIELD_KEYS).some(([kind, keys]) => keys.some(key => {
    if (type === 'risk-table') return false;
    if (kind === 'table' && key === 'rows' && /risk|governance|责任|治理/i.test(`${slide.layoutVariant || ''} ${slide.variant || ''} ${proofObjectId(slide)}`)) return false;
    return coerceItems(slide[key]).length || matrixFromValue(slide[key]);
  }));
}

function slideHasChartIntent(slide = {}) {
  if (slide.chartSpec || slide.chartKind || slide.chart_kind) return true;
  if (slide.type === 'risk-table') return false;
  if (isChartDataComponent(slide.dataComponent || slide.data_component || slide.previousDataComponent || slide.previous_data_component)) return true;
  if (hasChartFieldData(slide)) return true;
  const type = String(slide.type || '');
  const variant = String(slide.layoutVariant || slide.variant || slide.proofObject || slide.proof_object || '').toLowerCase();
  if (['industry-chart', 'finance-bridge'].includes(type)) return true;
  if (type === 'metric-comparison') {
    if (variant && NON_CHART_VARIANT_RE.test(variant) && !CHART_VARIANT_RE.test(variant)) return false;
    return !variant || CHART_VARIANT_RE.test(variant) || coerceItems(slide.metrics).length >= 2;
  }
  return CHART_VARIANT_RE.test(variant) && !NON_CHART_VARIANT_RE.test(variant);
}

function flattenText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(flattenText).join(' ');
  if (typeof value === 'object') return Object.values(value).map(flattenText).join(' ');
  return '';
}

function asNumber(value) {
  if (value == null || value === '') return null;
  const raw = String(value).replace(/,/g, '').trim();
  const match = raw.match(/[+-]?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function unitOf(value = '', fallback = '') {
  const text = String(value == null ? '' : value);
  const match = text.match(/(%|％|bps|bp|pt|pts|x|倍|w|万|亿|bn|m|mn|JPY|RMB|USD|CNY|¥|\$|min|分钟|天|月|年)/i);
  return match ? match[1] : fallback;
}

function itemLabel(item = {}, fallback = '') {
  if (typeof item === 'string') return item || fallback;
  return item.label || item.title || item.name || item.stage || item.category || item.metric || fallback;
}

function itemValue(item = {}) {
  if (typeof item === 'number') return item;
  if (typeof item === 'string') return item;
  return item.value != null ? item.value
    : item.amount != null ? item.amount
      : item.score != null ? item.score
        : item.y != null ? item.y
          : item.share != null ? item.share
            : '';
}

function itemNote(item = {}) {
  if (!item || typeof item !== 'object') return '';
  return item.note || item.body || item.description || item.text || item.commentary || '';
}

function coerceItems(value) {
  if (Array.isArray(value)) return value.map(v => typeof v === 'string' ? { title: v } : v).filter(Boolean);
  if (value && Array.isArray(value.items)) return coerceItems(value.items);
  if (value && Array.isArray(value.rows)) {
    return value.rows.map(row => Array.isArray(row)
      ? { title: row[0], value: row[1], body: row.slice(2).join(' / ') }
      : row
    ).filter(Boolean);
  }
  return [];
}

function firstItems(slide = {}, keys = []) {
  for (const key of keys) {
    const items = coerceItems(slide[key]);
    if (items.length) return { key, items };
  }
  return { key: '', items: [] };
}

function matrixFromValue(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const rows = value.map(row => Array.isArray(row) ? row : [itemLabel(row), itemValue(row), itemNote(row)]);
    return {
      rows: rows.map(row => String(row[0] || '')),
      columns: compactUnique(rows.flatMap(row => row.slice(1).map((_, i) => `C${i + 1}`))),
      values: rows.map(row => row.slice(1))
    };
  }
  if (value.rows && value.cols && value.values) {
    return { rows: value.rows, columns: value.cols, values: value.values };
  }
  if (value.rows && value.columns && value.values) {
    return { rows: value.rows, columns: value.columns, values: value.values };
  }
  if (value.items) return matrixFromValue(value.items);
  return null;
}

function metricsFromSlide(slide = {}) {
  const explicit = coerceItems(slide.metrics).map((metric, i) => ({
    label: itemLabel(metric, `Metric ${i + 1}`),
    value: itemValue(metric),
    note: itemNote(metric),
    unit: metric.unit || unitOf(itemValue(metric)),
    sourceTrace: metric.sourceTrace || metric.source_trace || null
  })).filter(metric => metric.value !== '' || metric.note);
  if (explicit.length) return explicit;

  const containers = [slide.cards, slide.items, slide.rows].filter(Array.isArray);
  const found = [];
  containers.flat().forEach((item, i) => {
    const text = flattenText(item);
    const match = text.match(/[+-]?\d[\d,]*(?:\.\d+)?\s*(?:%|％|pt|bps|倍|x|w|万|亿|bn|m|JPY|¥|\$|min|分钟)?/i);
    if (!match) return;
    found.push({
      label: itemLabel(item, `Metric ${i + 1}`),
      value: match[0].replace(/\s+/g, ''),
      note: itemNote(item),
      unit: unitOf(match[0])
    });
  });
  return found.slice(0, 4);
}

function normalizeSeries(items = [], opts = {}) {
  const categories = [];
  const values = items.map((item, i) => {
    const label = itemLabel(item, opts.defaultCategory ? `${opts.defaultCategory} ${i + 1}` : `Item ${i + 1}`);
    const raw = itemValue(item);
    categories.push(label);
    return {
      category: label,
      value: asNumber(raw),
      rawValue: raw,
      note: itemNote(item),
      unit: item.unit || unitOf(raw, opts.unit || ''),
      kind: item.kind || item.type || ''
    };
  });
  return {
    categories,
    series: [{
      name: opts.name || 'Series',
      values
    }]
  };
}

function proofObjectId(slide = {}) {
  return String((slide.proof && slide.proof.id) || slide.proofObject || slide.proof_object || slide.layoutVariant || slide.variant || '').trim();
}

function sourceTraceForSlide(slide = {}) {
  const proof = slide.proof || {};
  const proofTrace = proof.sourceTrace || {};
  const slideTrace = slide.sourceTrace || {};
  const sourceIds = compactUnique([
    ...(proof.sourceIds || []),
    ...((proofTrace.sourceIds) || []),
    ...((slideTrace.sourceIds) || []),
    ...(slide.sourceIds || []),
    ...(slide.source_ids || [])
  ]);
  const sources = [];
  [...((proof.sources) || []), ...((proofTrace.sources) || []), ...((slideTrace.sources) || [])].forEach(source => {
    if (!source) return;
    const id = source.id || source.name || JSON.stringify(source);
    if (!sources.some(item => (item.id || item.name) === id)) sources.push(source);
  });
  sourceIds.forEach(id => {
    if (!sources.some(source => source && source.id === id)) sources.push({ id });
  });
  return {
    sourceIds,
    sources,
    imageProvenance: [
      ...((proofTrace.imageProvenance) || []),
      ...((slideTrace.imageProvenance) || [])
    ],
    sourceNote: slide.sourceNote || slide.source_note || proof.sourceNote || ''
  };
}

function evidenceModeForSlide(slide = {}, sourceTrace = sourceTraceForSlide(slide)) {
  const proof = slide.proof || {};
  if (proof.generatedIllustration || /generated|synthetic|model|illustration/i.test(flattenText(slide.assetGeneration || slide.generatedAssetPrompt))) {
    return 'model-generated-illustration';
  }
  if ((sourceTrace.sources || []).some(source => /image|screenshot|png|jpg|jpeg/i.test(`${source.kind || ''} ${source.name || ''} ${source.relativePath || ''}`))) {
    return 'real-screenshot-or-image';
  }
  if ((sourceTrace.sources || []).some(source => /quote|text|html|pdf|filing|report/i.test(`${source.kind || ''} ${source.name || ''}`))) {
    return 'real-quote-or-document';
  }
  if (sourceTrace.sourceIds && sourceTrace.sourceIds.length) return 'real-data';
  return 'untraced';
}

function chartSignalText(slide = {}) {
  return [
    slide.chartKind,
    slide.chart_kind,
    slide.dataComponent,
    slide.data_component,
    proofObjectId(slide),
    slide.title,
    slide.subtitle,
    slide.claim
  ].filter(Boolean).join(' ').toLowerCase();
}

function explicitKindFromText(text = '') {
  if (/waterfall|bridge|target-?bridge|瀑布|增长桥|目标桥|缺口/.test(text)) return 'waterfall';
  if (/funnel|漏斗|stage|转化/.test(text)) return 'funnel';
  if (/trend|line|monthly|pulse|月度|趋势|环比|同比/.test(text)) return 'line';
  if (/pareto|帕累托|top|排行|sentiment|情绪|review/.test(text)) return 'pareto';
  if (/heatmap|sensitivity|scenario|敏感性|热力/.test(text)) return 'heatmap';
  if (/matrix|scatter|bubble|roas|roi|efficiency|sku|price|channel|矩阵|散点|渠道|价格带/.test(text)) return 'matrix';
  if (/bar|柱|结构|占比|mix/.test(text)) return 'bar';
  if (/scorecard|cohort|rfm|复购|会员|评分/.test(text)) return 'scorecard';
  if (/table|list|清单|表/.test(text)) return 'table';
  if (/kpi|metric|指标|数字/.test(text)) return 'kpi';
  return '';
}

function beautyTemplateRoute(plan = {}, slide = {}) {
  const industry = String(plan.industry || '').toLowerCase();
  const isBeauty = /beauty|brand-retail|consumer|美妆|消费/.test(industry);
  if (!isBeauty) return null;
  const text = [
    slide.chartKind,
    slide.chart_kind,
    slide.dataComponent,
    slide.data_component,
    proofObjectId(slide)
  ].filter(Boolean).join(' ').toLowerCase();
  const has = keys => keys.some(key => coerceItems(slide[key]).length || matrixFromValue(slide[key]));
  const proof = proofObjectId(slide).toLowerCase();
  const scan = `${text} ${proof}`;
  if (has(['skuMatrix', 'products']) || /sku-matrix|sku|明星单品|核心单品|单品矩阵/.test(scan)) {
    return { kind: 'matrix', industryTemplate: 'sku-matrix' };
  }
  if (has(['priceBandMatrix', 'priceBands']) || /price|价格带|客单|pricing/.test(scan)) {
    return { kind: 'matrix', industryTemplate: 'price-band-matrix' };
  }
  if (has(['efficacyTable', 'proofTable']) || /efficacy|clinical|claim|功效|宣称|检测|证据/.test(scan)) {
    return { kind: 'table', industryTemplate: 'efficacy-evidence-table' };
  }
  if (has(['textureProof', 'ingredients', 'ingredientProof']) || /texture|ingredient|质地|成分|配方/.test(scan)) {
    return { kind: 'table', industryTemplate: 'texture-ingredient-proof-gallery' };
  }
  if (has(['channelStructure', 'channelMix']) || /channel|渠道|天猫|京东|抖音|小红书|私域/.test(scan)) {
    return { kind: coerceItems(slide.channelEfficiency || slide.mediaEfficiency || slide.scatter || slide.channels).length ? 'matrix' : 'bar', industryTemplate: 'channel-structure' };
  }
  if (has(['memberCohorts', 'cohorts', 'repurchaseTrend', 'rfmLadder']) || /repurchase|member|cohort|rfm|复购|会员/.test(scan)) {
    return { kind: coerceItems(slide.repurchaseTrend).length >= 2 ? 'line' : 'scorecard', industryTemplate: 'member-repurchase' };
  }
  if (has(['socialFunnel']) || /social|kol|koc|内容|种草|转化漏斗|社媒/.test(scan)) {
    return { kind: 'funnel', industryTemplate: 'social-funnel' };
  }
  if (has(['reviewSentiment']) || /review|sentiment|评价|口碑|情绪/.test(scan)) {
    return { kind: 'pareto', industryTemplate: 'review-sentiment' };
  }
  if (has(['packagingMatrix', 'sustainabilityMatrix']) || /pack|sustain|包装|包材|可持续|esg/.test(scan)) {
    return { kind: 'matrix', industryTemplate: 'packaging-sustainability-matrix' };
  }
  return null;
}

function routeRequestedKind(plan = {}, slide = {}) {
  const beauty = beautyTemplateRoute(plan, slide);
  if (beauty) return Object.assign({ source: 'beauty-template-rule' }, beauty);

  const text = chartSignalText(slide);
  for (const [kind, keys] of Object.entries(CHART_FIELD_KEYS)) {
    if (keys.some(key => coerceItems(slide[key]).length || matrixFromValue(slide[key]))) {
      return { kind, source: `field:${keys.find(key => coerceItems(slide[key]).length || matrixFromValue(slide[key]))}` };
    }
  }
  const explicit = explicitKindFromText(text);
  if (explicit) return { kind: explicit, source: 'chart-signal-text' };
  if (metricsFromSlide(slide).length === 1) return { kind: 'kpi', source: 'single-metric' };
  if (metricsFromSlide(slide).length > 1) return { kind: 'scorecard', source: 'metrics' };
  if (Array.isArray(slide.rows) && slide.rows.length) return { kind: 'table', source: 'rows' };
  return { kind: '', source: 'none' };
}

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

function canDowngradeToKpi(requestedKind, data = {}, plan = {}, slide = {}) {
  const values = (data.series || []).flatMap(series => series.values || []);
  const numeric = values.filter(v => v.value != null || v.rawValue);
  const explicit = Boolean(
    slide.dataComponent ||
    slide.data_component ||
    slide.previousDataComponent ||
    slide.previous_data_component ||
    slide.chartKind ||
    slide.chart_kind ||
    slide.previousChartKind ||
    slide.previous_chart_kind
  );
  const industry = String(plan.industry || '').toLowerCase();
  const beautyNoGeneric = /beauty|brand-retail|consumer/.test(industry);
  if (beautyNoGeneric && beautyTemplateRoute(plan, slide)) return false;
  if (explicit && ['line', 'waterfall', 'funnel', 'matrix', 'heatmap', 'pareto'].includes(requestedKind)) return false;
  return numeric.length === 1 && requestedKind !== 'kpi';
}

function informationGapSpec(base = {}, sufficiency = {}) {
  return Object.assign({}, base, {
    kind: 'informationGap',
    requestedKind: base.kind,
    componentId: CHART_COMPONENTS.informationGap,
    source: base.source || base.chartSpecSource || 'repair',
    informationGap: {
      reason: (sufficiency.reasons || []).join('；') || '当前数据不足以生成可信图表',
      missingFields: sufficiency.missingFields || [],
      policy: 'do-not-render-fake-chart'
    },
    dataQuality: Object.assign({}, base.dataQuality || {}, {
      sufficient: false,
      downgraded: false
    })
  });
}

function normalizeChartSpec(plan = {}, slide = {}, options = {}) {
  if (slide.chartSpec && slide.chartSpec.version === CHART_SPEC_VERSION) {
    const spec = Object.assign({}, slide.chartSpec);
    if (!spec.source) spec.source = spec.kind === 'informationGap' ? 'explicit-gap' : 'planner';
    if (spec.kind === 'informationGap') {
      return Object.assign({}, spec, {
        source: spec.source || 'explicit-gap',
        requestedKind: spec.requestedKind || spec.requested_kind || '',
        componentId: spec.componentId || CHART_COMPONENTS.informationGap,
        informationGap: spec.informationGap || {
          reason: spec.reason || 'Planner explicitly requested a visible chart information gap.',
          missingFields: spec.missingFields || [],
          policy: 'explicit-gap'
        }
      });
    }
    if (!KNOWN_CHART_KINDS.has(spec.kind)) {
      return Object.assign({}, spec, {
        componentId: spec.componentId || '',
        chartContractError: {
          type: 'unknownChartKind',
          kind: spec.kind || '',
          policy: 'planner-must-use-chartSpec-v1-known-kind-or-explicit-informationGap'
        }
      });
    }
    const sufficiency = dataSufficiency(spec);
    return sufficiency.ok ? spec : informationGapSpec(spec, sufficiency);
  }

  if (!slideHasChartIntent(slide)) return null;
  const route = routeRequestedKind(plan, slide);
  if (!route.kind) return null;
  const data = dataForKind(route.kind, slide);
  const sourceTrace = sourceTraceForSlide(slide);
  const proofId = proofObjectId(slide);
  const values = (data.series || []).flatMap(series => series.values || []);
  const spec = {
    version: CHART_SPEC_VERSION,
    id: slide.chartId || slide.chart_id || `${proofId || 'chart'}-${options.index || ''}`.replace(/^-|-$/g, ''),
    kind: route.kind,
    source: 'repair',
    componentId: route.industryTemplate ? (BEAUTY_TEMPLATE_COMPONENTS[route.industryTemplate] || CHART_COMPONENTS[route.kind]) : CHART_COMPONENTS[route.kind],
    industryTemplate: route.industryTemplate || '',
    routeSource: route.source,
    title: slide.chartTitle || slide.title || '',
    insight: slide.insight || slide.claim || slide.subtitle || slide.note || '',
    series: data.series || [],
    categories: data.categories || [],
    matrix: data.matrix || null,
    table: data.table || null,
    unit: primaryUnit(data, slide),
    period: slide.period || slide.timePeriod || slide.time_period || '',
    baseline: slide.baseline || slide.base || '',
    sourceTrace,
    proofObject: proofId,
    annotations: slide.annotations || slide.callouts || [],
    dataQuality: {
      sufficient: true,
      sourceClass: sourceTrace.sourceIds.length ? 'source-traced' : 'user-provided-or-untraced',
      evidenceMode: evidenceModeForSlide(slide, sourceTrace),
      realSeries: values.filter(v => v.value != null).length >= 2,
      pointCount: values.length,
      numericPointCount: values.filter(v => v.value != null).length,
      downgradePolicy: route.industryTemplate ? 'industry-template-no-generic-downgrade' : 'allow-safe-kpi-downgrade'
    }
  };

  const sufficiency = dataSufficiency(spec);
  if (sufficiency.ok) return spec;
  if (canDowngradeToKpi(route.kind, data, plan, slide)) {
    const kpiData = dataForKind('kpi', Object.assign({}, slide, { metrics: values.map(v => ({ label: v.category, value: v.rawValue, note: v.note, unit: v.unit })) }));
    const downgraded = Object.assign({}, spec, {
      kind: 'kpi',
      requestedKind: route.kind,
      componentId: CHART_COMPONENTS.kpi,
      series: kpiData.series,
      categories: kpiData.categories,
      unit: primaryUnit(kpiData, slide),
      dataQuality: Object.assign({}, spec.dataQuality, {
        sufficient: true,
        downgraded: true,
        downgradeReason: sufficiency.reasons.join('; ')
      })
    });
    return downgraded;
  }
  return informationGapSpec(spec, sufficiency);
}

function routeChartSpec(plan = {}, slide = {}, options = {}) {
  return normalizeChartSpec(plan, slide, options);
}

function chartSpecToComponentId(spec = {}) {
  if (!spec) return '';
  return spec.componentId || CHART_COMPONENTS[spec.kind] || '';
}

function chartConsumedFields(spec = {}) {
  const fields = ['kind', 'title', 'insight'];
  if (spec.series && spec.series.length) fields.push('series');
  if (spec.categories && spec.categories.length) fields.push('categories');
  if (spec.unit) fields.push('unit');
  if (spec.period) fields.push('period');
  if (spec.baseline) fields.push('baseline');
  if (spec.sourceTrace && ((spec.sourceTrace.sourceIds || []).length || (spec.sourceTrace.sources || []).length)) fields.push('sourceTrace');
  if (spec.annotations && spec.annotations.length) fields.push('annotations');
  if (spec.matrix) fields.push('matrix');
  if (spec.table) fields.push('table');
  if (spec.informationGap) fields.push('informationGap');
  return fields;
}

function hasExplicitChartSignal(slide = {}) {
  return Boolean(slide.chartSpec || slide.chartKind || slide.chart_kind) ||
    isChartDataComponent(slide.dataComponent || slide.data_component) ||
    hasChartFieldData(slide);
}

function chartSemanticQA(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || plan;
  const slides = normalized.slides || [];
  const findings = [];
  slides.forEach((slide, i) => {
    const chartEligible = slideHasChartIntent(slide);
    if (!chartEligible || (BODY_EXEMPT_TYPES.has(slide.type || '') && !hasExplicitChartSignal(slide))) return;
    const spec = routeChartSpec(normalized, slide, { index: i + 1, total: slides.length });
    if (!spec) return;
    if (spec.chartContractError) {
      findings.push({
        slide: i + 1,
        level: 'fail',
        type: 'chartSpecUnknownKind',
        issueCategory: 'data_contract_gap',
        message: `unknown chartSpec kind: ${spec.chartContractError.kind || spec.kind || 'unknown'}`
      });
      return;
    }
    const text = chartSignalText(slide);
    const sufficiency = dataSufficiency(spec);
    const requested = spec.requestedKind || spec.kind;
    if (spec.kind === 'informationGap') {
      const allowVisibleGap = slide.allowInformationGap === true || slide.allow_information_gap === true;
      findings.push({
        slide: i + 1,
        level: allowVisibleGap ? 'review' : 'fail',
        type: 'chartInformationGap',
        issueCategory: 'data_contract_gap',
        message: spec.informationGap && spec.informationGap.reason || '当前数据不足以生成可信图表'
      });
      return;
    }
    if (/monthly|trend|pulse|月度|趋势/.test(text) && spec.kind !== 'line' && requested !== 'line') {
      findings.push({ slide: i + 1, level: 'fail', type: 'monthlySeriesNotLine', issueCategory: 'routing_error', message: 'monthly sequence data must route to a line chart' });
    }
    if (/funnel|漏斗/.test(text) && spec.kind !== 'funnel' && requested !== 'funnel') {
      findings.push({ slide: i + 1, level: 'fail', type: 'funnelNotFunnel', issueCategory: 'routing_error', message: 'funnel stage data must route to a funnel chart' });
    }
    if (/waterfall|bridge|瀑布|目标桥|增长桥/.test(text) && spec.kind !== 'waterfall' && requested !== 'waterfall') {
      findings.push({ slide: i + 1, level: 'fail', type: 'waterfallNotWaterfall', issueCategory: 'routing_error', message: 'bridge data must route to a waterfall chart' });
    }
    if (spec.kind === 'line' && !sufficiency.ok) {
      findings.push({ slide: i + 1, level: 'fail', type: 'fakeTrendLine', issueCategory: 'data_contract_gap', message: sufficiency.reasons.join('; ') });
    }
    if (spec.kind === 'funnel') {
      const numeric = valuesForSpec(spec).map(v => v.value).filter(v => v != null);
      if (numeric.length >= 3 && new Set(numeric.map(v => Number(v).toFixed(4))).size === 1) {
        findings.push({ slide: i + 1, level: 'review', type: 'equalLengthFunnel', issueCategory: 'renderer_layout_bug', message: 'funnel values are all equal; verify this is real data, not equal bars' });
      }
    }
  });
  return {
    version: 'chart-semantic-qa/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    findings
  };
}

function chartVisualQA(plan = {}, normalizedPlan = null, renderMeta = null) {
  const normalized = normalizedPlan || plan;
  const slides = normalized.slides || [];
  const findings = [];
  const rendered = new Map(((renderMeta && renderMeta.slides) || []).map(slide => [Number(slide.slide), slide]));
  slides.forEach((slide, i) => {
    const chartEligible = slideHasChartIntent(slide);
    if (!chartEligible) return;
    const spec = routeChartSpec(normalized, slide, { index: i + 1, total: slides.length });
    if (!spec || spec.kind === 'informationGap') return;
    const needsAxis = ['bar', 'line', 'waterfall', 'pareto', 'matrix', 'heatmap'].includes(spec.kind);
    const needsUnit = ['bar', 'line', 'waterfall', 'funnel', 'pareto', 'scorecard', 'kpi'].includes(spec.kind);
    const meta = rendered.get(i + 1);
    const visual = meta && meta.chartConsumption ? meta.chartConsumption.visualChecks || {} : {};
    if (needsAxis && !(spec.categories || []).length && !(spec.matrix && spec.matrix.rows && spec.matrix.columns)) {
      findings.push({ slide: i + 1, level: 'fail', type: 'chartAxisLabelsMissing', issueCategory: 'renderer_layout_bug', message: `${spec.kind} chart lacks category/axis labels` });
    }
    if (needsUnit && !spec.unit) {
      findings.push({ slide: i + 1, level: 'review', type: 'chartUnitMissing', issueCategory: 'data_contract_gap', message: `${spec.kind} chart lacks unit` });
    }
    const sourceIds = (spec.sourceTrace && spec.sourceTrace.sourceIds) || [];
    if (!sourceIds.length && !((spec.sourceTrace && spec.sourceTrace.sourceNote) || '').trim()) {
      findings.push({ slide: i + 1, level: 'review', type: 'chartSourceMissing', issueCategory: 'data_contract_gap', message: 'chart lacks visible source trace' });
    }
    if (visual.labelCollision) {
      findings.push({ slide: i + 1, level: 'review', type: 'chartLabelOverlap', issueCategory: 'renderer_layout_bug', message: 'renderer reported possible chart label overlap' });
    }
    if (visual.valueOverflow) {
      findings.push({ slide: i + 1, level: 'review', type: 'chartValueOverflow', issueCategory: 'renderer_layout_bug', message: 'renderer reported possible value overflow' });
    }
    if (meta && meta.chartConsumption && !meta.chartConsumption.rendered) {
      findings.push({ slide: i + 1, level: 'fail', type: 'chartNotRendered', issueCategory: 'component_gap', message: `planned chart component was not rendered: ${spec.componentId}` });
    }
  });
  return {
    version: 'chart-visual-qa/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    findings
  };
}

function chartEvidenceQA(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || plan;
  const slides = normalized.slides || [];
  const findings = [];
  slides.forEach((slide, i) => {
    const chartEligible = slideHasChartIntent(slide);
    if (!chartEligible) return;
    const spec = routeChartSpec(normalized, slide, { index: i + 1, total: slides.length });
    if (!spec || spec.kind === 'informationGap') return;
    const trace = spec.sourceTrace || {};
    const evidenceMode = (spec.dataQuality && spec.dataQuality.evidenceMode) || 'untraced';
    if (!spec.proofObject || spec.proofObject === 'unknown') {
      findings.push({ slide: i + 1, level: 'review', type: 'chartProofObjectMissing', issueCategory: 'data_contract_gap', message: 'chart cannot be traced to a proof object' });
    }
    if (!(trace.sourceIds || []).length && evidenceMode === 'untraced') {
      findings.push({ slide: i + 1, level: 'review', type: 'chartEvidenceUntraced', issueCategory: 'data_contract_gap', message: 'chart evidence mode is untraced' });
    }
  });
  return {
    version: 'chart-evidence-qa/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    findings
  };
}

function pageLevelChartScores(plan = {}, normalizedPlan = null, renderMeta = null) {
  const normalized = normalizedPlan || plan;
  const semantic = chartSemanticQA(plan, normalized);
  const visual = chartVisualQA(plan, normalized, renderMeta);
  const evidence = chartEvidenceQA(plan, normalized);
  const bySlide = new Map();
  [semantic, visual, evidence].forEach(audit => {
    (audit.findings || []).forEach(finding => {
      if (!finding.slide) return;
      const row = bySlide.get(finding.slide) || [];
      row.push(finding);
      bySlide.set(finding.slide, row);
    });
  });
  return {
    version: 'page-level-chart-score/v1',
    slides: (normalized.slides || []).map((slide, i) => {
      const chartEligible = slideHasChartIntent(slide);
      const spec = chartEligible ? routeChartSpec(normalized, slide, { index: i + 1, total: (normalized.slides || []).length }) : null;
      const findings = bySlide.get(i + 1) || [];
      if (!spec) {
        return {
          slide: i + 1,
          applicability: 'not_applicable',
          chartKind: '',
          componentId: '',
          chartFitScore: null,
          dataSufficiencyScore: null,
          visualLegibilityScore: null,
          evidenceTraceScore: null,
          findings
        };
      }
      const fail = findings.filter(f => f.level === 'fail').length;
      const review = findings.filter(f => f.level !== 'fail' && f.level !== 'info').length;
      const sufficiency = dataSufficiency(spec);
      const sourceIds = spec.sourceTrace ? spec.sourceTrace.sourceIds || [] : [];
      return {
        slide: i + 1,
        applicability: 'applicable',
        chartKind: spec.kind,
        componentId: spec.componentId,
        chartFitScore: Math.max(0, 100 - fail * 45 - review * 14),
        dataSufficiencyScore: sufficiency.ok ? 100 : 40,
        visualLegibilityScore: Math.max(0, 100 - findings.filter(f => f.issueCategory === 'renderer_layout_bug').length * 22),
        evidenceTraceScore: sourceIds.length ? 100 : 64,
        findings
      };
    })
  };
}

function issueCategoryForFinding(finding = {}) {
  if (finding.issueCategory) return finding.issueCategory;
  if (/component|rendered|consumed/i.test(finding.type || '')) return 'component_gap';
  if (/contract|source|unit|sufficien|information|evidence|fake/i.test(finding.type || '')) return 'data_contract_gap';
  if (/route|notline|notfunnel|notwaterfall/i.test(finding.type || '')) return 'routing_error';
  return 'renderer_layout_bug';
}

function chartAcceptanceGate(plan = {}, normalizedPlan = null, renderMeta = null, options = {}) {
  const normalized = normalizedPlan || plan;
  const slides = normalized.slides || [];
  const findings = [];
  const strict = options.strict === true || plan.formalMaterialGeneration === true || plan.outputIntent === 'formal';
  const blockingLevel = strict ? 'fail' : 'review';
  const target = Number((normalized.targetSlides && (normalized.targetSlides.resolved || normalized.targetSlides.targetSlides || normalized.targetSlides.requested)) || normalized.requestedSlideCount || plan.requestedSlideCount || 0);
  if (target && slides.length !== target) {
    findings.push({ level: 'fail', type: 'acceptancePageCountMismatch', issueCategory: 'data_contract_gap', message: `page count ${slides.length} does not match target ${target}` });
  }
  const claimSpine = normalized.claimSpine || plan.claimSpine || [];
  const bodySlides = slides
    .map((slide, index) => ({ slide, index }))
    .filter(entry => !BODY_EXEMPT_TYPES.has(entry.slide.type || ''));
  if (slides.length >= 8 && claimSpine.length < bodySlides.length) {
    findings.push({ level: blockingLevel, type: 'acceptanceClaimSpineMissing', issueCategory: 'data_contract_gap', message: 'claim spine does not cover body pages' });
  }
  const claimSpineClaimFor = (slide = {}, index = 0) => {
    const bySlide = claimSpine.find(entry => Number(entry.slide || entry.slideNumber || entry.slide_number || 0) === index + 1);
    if (bySlide && bySlide.claim) return bySlide.claim;
    const byId = claimSpine.find(entry => entry && (entry.slideId || entry.slide_id || entry.id || entry.title) &&
      [slide.id, slide.slideId, slide.slide_id, slide.title].filter(Boolean).includes(entry.slideId || entry.slide_id || entry.id || entry.title));
    if (byId && byId.claim) return byId.claim;
    return '';
  };
  slides.forEach((slide, i) => {
    if (BODY_EXEMPT_TYPES.has(slide.type || '')) return;
    if (!slide.claim && !claimSpineClaimFor(slide, i) && !slide.title) {
      findings.push({ slide: i + 1, level: blockingLevel, type: 'acceptanceClaimMissing', issueCategory: 'data_contract_gap', message: 'body page lacks claim spine text' });
    }
    if (!proofObjectId(slide)) {
      findings.push({ slide: i + 1, level: blockingLevel, type: 'acceptanceProofObjectMissing', issueCategory: 'data_contract_gap', message: 'body page lacks proof object' });
    }
    if (strict && slideHasChartIntent(slide)) {
      const spec = routeChartSpec(normalized, slide, { index: i + 1, total: slides.length });
      if (spec && spec.chartContractError) {
        findings.push({ slide: i + 1, level: 'fail', type: 'acceptanceChartSpecContractError', issueCategory: 'data_contract_gap', message: spec.chartContractError.type || 'chartSpec contract error' });
      } else if (spec && (spec.source === 'repair' || slide.chartSpecInferred === true)) {
        findings.push({ slide: i + 1, level: 'fail', type: 'acceptanceChartSpecRepairInStrictMode', issueCategory: 'data_contract_gap', message: 'strict mode requires planner-provided chartSpec/v1, not renderer/planner repair inference' });
      }
    }
  });
  if (renderMeta && Array.isArray(renderMeta.slides)) {
    renderMeta.slides.forEach(slide => {
      (slide.missingRequiredComponents || []).forEach(id => {
        findings.push({ slide: slide.slide, level: 'fail', type: 'acceptanceComponentNotConsumed', issueCategory: 'component_gap', message: `required component not consumed: ${id}` });
      });
      const chart = slide.chartConsumption;
      if (chart && chart.spec && chart.spec.kind !== 'informationGap') {
        if (!chart.spec.unit && ['bar', 'line', 'waterfall', 'funnel', 'pareto', 'kpi', 'scorecard'].includes(chart.spec.kind)) {
          findings.push({ slide: slide.slide, level: 'review', type: 'acceptanceChartUnitMissing', issueCategory: 'data_contract_gap', message: 'chart lacks unit' });
        }
        const trace = chart.spec.sourceTrace || {};
        if (!((trace.sourceIds || []).length || trace.sourceNote)) {
          findings.push({ slide: slide.slide, level: 'review', type: 'acceptanceChartSourceMissing', issueCategory: 'data_contract_gap', message: 'chart lacks source' });
        }
      }
    });
  } else {
    findings.push({ level: blockingLevel, type: 'acceptanceRenderMetaMissing', issueCategory: 'component_gap', message: 'render meta is required for component consumption gate' });
  }
  const semantic = chartSemanticQA(plan, normalized);
  semantic.findings.filter(f => f.type === 'fakeTrendLine').forEach(f => findings.push(Object.assign({}, f, { level: 'fail' })));
  const previews = options.previewReports || [];
  if (options.requireContactSheet && !previews.length) {
    findings.push({ level: 'review', type: 'acceptanceContactSheetMissing', issueCategory: 'renderer_layout_bug', message: 'contact sheet / preview evidence is missing' });
  }
  const blank = previews.filter(p => p.info && p.info.bytes < 12000).length;
  if (blank) findings.push({ level: 'review', type: 'acceptanceContactSheetUnreadable', issueCategory: 'renderer_layout_bug', message: `${blank} preview thumbnails may be unreadable` });
  const annotated = findings.map(f => Object.assign({}, f, { issueCategory: issueCategoryForFinding(f) }));
  return {
    version: 'chart-acceptance-gate/v1',
    status: annotated.some(f => f.level === 'fail') ? 'fail' : (annotated.length ? 'review' : 'pass'),
    findings: annotated,
    conditions: {
      pageCountMatchesTarget: !annotated.some(f => f.type === 'acceptancePageCountMismatch'),
      everyPageHasClaimSpine: !annotated.some(f => /Claim/.test(f.type || '')),
      everyBodyPageHasProofObject: !annotated.some(f => f.type === 'acceptanceProofObjectMissing'),
      componentsConsumed: !annotated.some(f => f.type === 'acceptanceComponentNotConsumed'),
      chartsHaveUnitsAndSources: !annotated.some(f => /Chart(Unit|Source)Missing/.test(f.type || '')),
      noFakeTrends: !annotated.some(f => f.type === 'fakeTrendLine'),
      contactSheetReadable: !annotated.some(f => /ContactSheet/.test(f.type || '') && f.level === 'fail')
    }
  };
}

module.exports = {
  BEAUTY_TEMPLATE_COMPONENTS,
  BODY_EXEMPT_TYPES,
  CHART_COMPONENTS,
  CHART_FIELD_KEYS,
  CHART_SPEC_VERSION,
  GENERIC_KINDS,
  asNumber,
  chartAcceptanceGate,
  chartConsumedFields,
  chartEvidenceQA,
  chartSemanticQA,
  chartSpecToComponentId,
  chartVisualQA,
  coerceItems,
  dataSufficiency,
  hasExplicitChartSignal,
  issueCategoryForFinding,
  pageLevelChartScores,
  proofObjectId,
  routeChartSpec,
  slideHasChartIntent,
  sourceTraceForSlide,
  valuesForSpec
};

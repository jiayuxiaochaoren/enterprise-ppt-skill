const {
  CHART_DATA_COMPONENT_RE,
  CHART_FIELD_KEYS,
  CHART_VARIANT_RE,
  NON_CHART_DATA_COMPONENT_RE,
  NON_CHART_VARIANT_RE
} = require('./chart-spec-constants');
const {
  coerceItems,
  matrixFromValue,
  metricsFromSlide,
  proofObjectId
} = require('./chart-data-utils');

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

module.exports = {
  beautyTemplateRoute,
  chartSignalText,
  explicitKindFromText,
  hasChartFieldData,
  isChartDataComponent,
  routeRequestedKind,
  slideHasChartIntent
};

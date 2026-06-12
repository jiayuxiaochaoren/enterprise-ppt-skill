const CHART_SPEC_SUPPRESSED_NATIVE_VARIANTS = new Set([
  'brand-world-and-business-proof',
  'consumer-proof-photo-grid',
  'control-stack',
  'lookbook-story',
  'process-board',
  'product-evidence-story',
  'value-creation-process-map'
]);
const {
  ASSET_GENERATION_DECISION_SOURCE
} = require('./asset-generation');

function createSlideNormalizationUtilityHelpers(deps = {}) {
  const {
    flattenText
  } = deps;

  function nativeVariantOwnsChartZone(s = {}) {
    const variant = String(s.layoutVariant || s.variant || '');
    return CHART_SPEC_SUPPRESSED_NATIVE_VARIANTS.has(variant) && !(s.chartSpec && s.chartSpec.version === 'chartSpec/v1');
  }

  function deriveMetricsFromSlide(s = {}) {
    if (Array.isArray(s.metrics)) return s.metrics;
    const cards = Array.isArray(s.cards) ? s.cards : [];
    const fromCards = cards.map(c => {
      const text = `${c.title || ''} ${c.body || ''}`;
      const num = (text.match(/[+-]?\d[\d,]*(?:\.\d+)?\s*(?:%|％|pt|倍|亿元|万元|件|台)?/) || [''])[0];
      return num ? { label: c.title || '核心指标', value: num, note: c.body || '' } : null;
    }).filter(Boolean);
    if (fromCards.length) return fromCards;
    const text = flattenText(s);
    const nums = text.match(/[+-]?\d[\d,]*(?:\.\d+)?\s*(?:%|％|pt|倍|亿元|万元|件|台)?/g) || [];
    return nums.slice(0, 3).map((value, i) => ({ label: ['核心指标', '变化幅度', '目标进度'][i] || '指标', value, note: s.claim || s.subtitle || '' }));
  }

  function hasStructuredChannelEvidence(s = {}) {
    return ['channelEfficiency', 'mediaEfficiency', 'scatter', 'channels'].some(field => {
      const value = s[field];
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(value && typeof value === 'object');
    });
  }

  function channelEfficiencyVariantNeedsDowngrade(s = {}) {
    const variant = String(s.layoutVariant || s.variant || '').toLowerCase();
    if (variant !== 'channel-efficiency-matrix') return false;
    if (hasStructuredChannelEvidence(s)) return false;
    const proofObject = String(s.proofObject || s.proof_object || '').toLowerCase();
    if (proofObject && !/metric-board|business-metric|scorecard|kpi|metrics?/.test(proofObject)) return false;
    const text = flattenText([
      s.title,
      s.subtitle,
      s.claim,
      s.dataComponent,
      s.data_component,
      s.proofObject,
      s.proof_object,
      s.metrics
    ]);
    const channelSignal = /渠道|平台|业务线|市场|媒体|媒介|广告|搜索|信息流|直播|小红书|抖音|TikTok|Amazon|Shopify|Walmart|Marketplace|ROAS|ROI|CPC|CPM|CAC|获客|流量|campaign|media|channel|platform/i.test(text) ||
      (/投放|预算/i.test(text) && /广告|媒体|媒介|渠道|ROAS|ROI|获客|搜索|信息流|直播|小红书|抖音|TikTok|KOL|KOC|campaign|media|channel/i.test(text));
    if (channelSignal) return false;
    return /metric-board|business-metric|scorecard|kpi|指标|利润|毛利|回款|现金|费用|收入|GMV|NPS|样本|SKU|库存|复购/i.test(text);
  }

  function currentAssetGenerationDecision(decision = {}) {
    return Object.assign({
      decisionSource: ASSET_GENERATION_DECISION_SOURCE
    }, decision || {});
  }

  return {
    channelEfficiencyVariantNeedsDowngrade,
    currentAssetGenerationDecision,
    deriveMetricsFromSlide,
    nativeVariantOwnsChartZone
  };
}

module.exports = {
  CHART_SPEC_SUPPRESSED_NATIVE_VARIANTS,
  createSlideNormalizationUtilityHelpers
};

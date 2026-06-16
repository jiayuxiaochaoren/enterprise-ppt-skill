const DEFAULT_COVER_STYLE_ID = '';
const AUTO_COVER_STYLE_VALUES = new Set(['', 'auto', 'default', 'inherit']);

function normalizeText(value = '') {
  return String(value || '').toLowerCase();
}

function coverStylePresets(visualSystem = {}) {
  return visualSystem.coverStylePresets || {};
}

function explicitCoverStyle(plan = {}, s = {}) {
  const slideValue = s.coverStyle || s.cover_style || (s.visual && (s.visual.coverStyle || s.visual.cover_style));
  if (slideValue != null && String(slideValue).trim()) return String(slideValue).trim();
  const art = plan.deckArtDirection || plan.deck_art_direction || plan.artDirection || plan.art_direction || {};
  const planValue = plan.coverStyle || plan.cover_style || art.coverStyle || art.cover_style;
  return planValue != null ? String(planValue).trim() : '';
}

function explicitCoverStyleSource(plan = {}, s = {}) {
  const slideValue = s.coverStyle || s.cover_style || (s.visual && (s.visual.coverStyle || s.visual.cover_style));
  if (slideValue != null && String(slideValue).trim()) return s.coverStyleSource || s.cover_style_source || 'slide';
  const art = plan.deckArtDirection || plan.deck_art_direction || plan.artDirection || plan.art_direction || {};
  const planValue = plan.coverStyle || plan.cover_style || art.coverStyle || art.cover_style;
  if (planValue != null && String(planValue).trim()) return 'plan';
  return '';
}

function knownStyleOrEmpty(id = '', presets = {}) {
  const key = String(id || '').trim();
  return key && presets[key] ? key : '';
}

function coverArchetypeFor(plan = {}, s = {}) {
  const genericIndustry = new Set(['brand-retail', 'general-operations']);
  const pack = typeof plan.__industryPackFor === 'function' && !genericIndustry.has(String(plan.industry || '').trim())
    ? (plan.__industryPackFor(plan) || {})
    : {};
  return String(
    s.coverArchetype ||
    s.cover_archetype ||
    plan.coverArchetype ||
    plan.cover_archetype ||
    pack.coverArchetype ||
    ''
  ).trim().toLowerCase();
}

function inferCoverStyleId(plan = {}, s = {}) {
  if (String(plan.industry || '') === 'energy-utility') return DEFAULT_COVER_STYLE_ID;
  const coverArchetype = coverArchetypeFor(plan, s);
  const text = normalizeText([
    plan.industry,
    plan.visualIntent,
    plan.assetMode,
    plan.pptType,
    plan.ppt_type,
    plan.title,
    plan.subtitle,
    plan.coverInsight,
    plan.materialIntelligence && plan.materialIntelligence.pptType,
    s.type,
    s.layoutVariant,
    s.variant,
    s.title,
    s.subtitle,
    s.coverInsight,
    s.proofObject,
    s.proof_object
  ].filter(Boolean).join(' '));

  if (coverArchetype === 'native-industrial-structure-cover') {
    return /rebuild|reconstruct|manual|swiss|重构|手册|产线/.test(text)
      ? 'industrial-swiss-line'
      : DEFAULT_COVER_STYLE_ID;
  }
  if (coverArchetype === 'boardroom-proof-cover') return 'editorial-proof-report';
  if (coverArchetype === 'platform-system-cover') return 'architecture-blueprint-studio';
  if (coverArchetype === 'editorial-brand-cover') return 'cold-luxury-product';
  if (coverArchetype === 'clinical-quality-cover') return 'editorial-proof-report';
  if (coverArchetype === 'lifestyle-editorial-cover') return 'documentary-evidence-wall';
  if (coverArchetype === 'civic-executive-cover') return 'signal-atlas-command';
  if (coverArchetype === 'culture-soft-cover') return 'eastern-void-object';

  const commerceContext = /cross[-\s]?border|e-?commerce|shopify|amazon|tiktok shop|walmart|marketplace|gmv|acos|roas|sku|跨境|电商|独立站|亚马逊|平台营收|渠道|店铺|商品|单品|复购|会员|零售|消费|品牌|产品/.test(text);
  const technicalPlatformContext = /architecture|capability|system architecture|reference architecture|topology|api|sdk|saas|ai platform|data platform|infra|infrastructure|workflow engine|架构|能力图|系统架构|拓扑|接口|中台|数据平台|技术平台|服务蓝图/.test(text);
  const manufacturingContext = /manufactur|factory|industrial|operation|production|oee|产线|制造|工厂|工业|运营|工程/.test(text);
  if (manufacturingContext) {
    return /rebuild|reconstruct|manual|swiss|重构|手册|产线/.test(text)
      ? 'industrial-swiss-line'
      : DEFAULT_COVER_STYLE_ID;
  }

  if (/risk|security|cyber|governance|compliance|风控|风险|安全|治理|合规|投后/.test(text)) {
    return 'tactical-telemetry-risk';
  }
  if (commerceContext) {
    return /luxury|premium|上市|高端|奢侈|美妆|美容/.test(text)
      ? 'cold-luxury-product'
      : 'brand-system-board';
  }
  if (technicalPlatformContext || (/platform|平台/.test(text) && !commerceContext)) {
    return 'architecture-blueprint-studio';
  }
  if (/brand|consumer|beauty|retail|launch|品牌|消费|美妆|零售|商业证明/.test(text)) {
    return /product|hardware|luxury|premium|上市|高端|产品|硬件|奢侈/.test(text)
      ? 'cold-luxury-product'
      : 'brand-system-board';
  }
  if (/culture|founder|value|memo|long[-\s]?term|长期主义|价值观|创始人|文化|判断/.test(text)) {
    return 'eastern-void-object';
  }
  if (/new business|market entry|venture|招商|新业务|启动|发布|增长启动/.test(text)) {
    return 'kinetic-field-launch';
  }
  if (/case|client|customer|field|site|evidence|现场|客户|案例|投标|证据|交付/.test(text)) {
    return 'documentary-evidence-wall';
  }
  if (/annual|board|review|investor|finance|report|复盘|年报|董事会|投资人|财务|报告/.test(text)) {
    return 'editorial-proof-report';
  }
  return DEFAULT_COVER_STYLE_ID;
}

function coverStyleDecision(plan = {}, s = {}, opts = {}) {
  const presets = coverStylePresets(opts.visualSystem || {});
  const planWithPack = Object.assign({}, plan, {
    __industryPackFor: typeof opts.industryPackFor === 'function' ? opts.industryPackFor : null
  });
  const explicit = explicitCoverStyle(plan, s);
  const explicitNormalized = normalizeText(explicit);
  const requestedAuto = explicit && AUTO_COVER_STYLE_VALUES.has(explicitNormalized);
  const explicitKnown = !requestedAuto ? knownStyleOrEmpty(explicit, presets) : '';
  const inferred = explicitKnown ? explicitKnown : knownStyleOrEmpty(inferCoverStyleId(planWithPack, s), presets);
  const id = explicitKnown || (requestedAuto || !explicit ? inferred : '');
  const preset = id ? presets[id] : null;
  return {
    id: id || DEFAULT_COVER_STYLE_ID,
    preset,
    source: explicitKnown ? explicitCoverStyleSource(plan, s) : (id ? 'auto' : 'fallback'),
    requested: explicit || '',
    requestedAuto: Boolean(requestedAuto)
  };
}

function coverStyleForPlan(plan = {}, s = {}, opts = {}) {
  return coverStyleDecision(plan, s, opts).id;
}

function coverStylePresetFor(visualSystem = {}, id = '') {
  return coverStylePresets(visualSystem)[id] || null;
}

function contentThemeForCoverStyle(preset = null) {
  if (!preset) return null;
  return Object.assign({
    version: 'cover-style-content-theme/v1',
    backgroundPolicy: preset.backgroundPolicy || '',
    contentDensity: preset.contentDensity || '',
    imageTreatment: preset.imageTreatment || '',
    chartPalette: preset.chartPalette || []
  }, preset.contentPageTokens || {});
}

module.exports = {
  coverStyleDecision,
  coverStyleForPlan,
  coverStylePresetFor,
  contentThemeForCoverStyle,
  inferCoverStyleId
};

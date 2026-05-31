const fs = require('fs');
const path = require('path');
const {
  ASSET_DIR,
  loadCopyPolicy,
  loadIndustryBenchmarks,
  loadIndustryPackLibrary,
  loadReferenceLibrary,
  loadVisualSystem
} = require('./design/config');
const {
  loadReferenceRecipeLibrary
} = require('./design/reference-recipes');
const {
  createImageAssetHelpers
} = require('./design/image-assets');
const {
  createIndustryRuntime
} = require('./design/industry-runtime');
const {
  createContentOverlapHelpers
} = require('./design/content-overlap');
const {
  createTypographyHelpers
} = require('./design/typography');
const {
  createSourceTraceHelpers
} = require('./design/source-trace');
const {
  createStyleProfileHelpers
} = require('./design/style-profile');
const {
  containsCjkText,
  inferDeckLanguage,
  languagePolicyFor,
  localizeMicrocopy
} = require('./design/language-policy');
const {
  chartAcceptanceGate,
  chartEvidenceQA,
  hasExplicitChartSignal,
  chartSemanticQA,
  chartSpecToComponentId,
  chartVisualQA,
  pageLevelChartScores,
  routeChartSpec,
  slideHasChartIntent
} = require('./chart-spec');
const {
  componentCapabilityFor,
  hasComponentCapability
} = require('./components');

const VISUAL_SYSTEM = loadVisualSystem();
const {
  chooseEvidenceImageLayout,
  chooseFourImageLayout,
  imageAspectRatio,
  imageDimensions,
  imageQualityProfile,
  scoreImageAsset
} = createImageAssetHelpers(VISUAL_SYSTEM);
const {
  applyPlanAuthoredSourceTrace,
  assetAuthorizationGate,
  imageRefsForSlide,
  preferredProofObjectIdForTrace,
  sourceTraceAudit,
  sourceTraceForSlide
} = createSourceTraceHelpers({
  clampText,
  compactUnique,
  flattenText,
  normalizeDeckPlan,
  proofObjectIdForSlide,
  slideProofObject
});
const {
  contentOverlapAudit,
  overlapText,
  slideContentOverlap
} = createContentOverlapHelpers({
  normalizeDeckPlan,
  textKeywords
});
const REFERENCE_LAYOUT_LIBRARY = loadReferenceLibrary();
const REFERENCE_RECIPE_LIBRARY = loadReferenceRecipeLibrary();
const INDUSTRY_PACK_LIBRARY = loadIndustryPackLibrary();
const COPY_POLICY = loadCopyPolicy();
const INDUSTRY_BENCHMARKS = loadIndustryBenchmarks();
const PALETTES = VISUAL_SYSTEM.palettes || {};
const VISUAL_ROUTER = VISUAL_SYSTEM.visualRouter || {};
const INDUSTRY_DESIGN_DIALECTS = VISUAL_SYSTEM.industryDesignDialects || {};
const {
  normalizeIndustryId,
  visualIndustryId,
  industryMatchIds,
  industryPackFor,
  copyPolicyFor,
  copyPolicyText,
  copyPolicyList,
  industryBenchmarksFor
} = createIndustryRuntime({
  industryDesignDialects: INDUSTRY_DESIGN_DIALECTS,
  visualRouter: VISUAL_ROUTER,
  industryPackLibrary: INDUSTRY_PACK_LIBRARY,
  copyPolicy: COPY_POLICY,
  industryBenchmarks: INDUSTRY_BENCHMARKS
});
const FONT_STACK = Object.assign(
  { zh: 'PingFang SC', latin: 'Avenir Next', number: 'DIN Alternate' },
  VISUAL_SYSTEM.fonts || {}
);
const {
  BASE_COLORS,
  STYLE_PROFILES,
  paletteToColors,
  resolveStyleProfile
} = createStyleProfileHelpers({ fontStack: FONT_STACK });
const {
  normalizeTypographyOptions,
  resolveTypeToken,
  typographyAudit,
  typographyFontSet,
  typographyProfileFor
} = createTypographyHelpers({
  visualSystem: VISUAL_SYSTEM,
  fontStack: FONT_STACK,
  deepMerge,
  compactUnique,
  industryMatchIds,
  visualIndustryId
});

const {
  HIGH_VALUE_PAGE_FAMILIES,
  PRIORITY_PAGE_FAMILY_RECIPES,
  layoutVariantCompatibleWithType
} = require('./design/page-family-routing');

const MEDIA_ASSETS = {
  energyStorageCover: path.join(ASSET_DIR, 'media', 'energy-storage-cover.jpg'),
  energyStorageDetail: path.join(ASSET_DIR, 'media', 'energy-storage-detail.jpg'),
  energyStorageBand: path.join(ASSET_DIR, 'media', 'energy-storage-band.jpg'),
  energyStorageLoop: path.join(ASSET_DIR, 'media', 'energy-storage-cover-loop.mp4')
};

const {
  FACTUAL_GENERATED_ASSET_RISK,
  INDUSTRY_EXPRESSION_RULES,
  INDUSTRY_KNOWLEDGE_BASE,
  SEMANTIC_RELATION_PATTERNS,
  VISIBLE_PRODUCTION_COPY_BANS
} = require('./design/industry-knowledge');

function industryVisualPolicy(plan = {}) {
  const industries = VISUAL_ROUTER.industries || {};
  const base = VISUAL_ROUTER.default || {};
  const industryId = visualIndustryId(plan.industry);
  const industry = industries[plan.industry] || industries[industryId] || {};
  return Object.assign({}, base, industry, {
    defaultImageRoles: Object.assign({}, base.defaultImageRoles || {}, industry.defaultImageRoles || {})
  });
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(...objects) {
  const out = {};
  objects.filter(Boolean).forEach(obj => {
    Object.entries(obj).forEach(([key, value]) => {
      if (isPlainObject(value) && isPlainObject(out[key])) out[key] = deepMerge(out[key], value);
      else if (isPlainObject(value)) out[key] = deepMerge(value);
      else if (Array.isArray(value)) out[key] = value.slice();
      else if (value !== undefined) out[key] = value;
    });
  });
  return out;
}

function industryDesignDialect(plan = {}) {
  const industryId = visualIndustryId(plan.industry);
  return INDUSTRY_DESIGN_DIALECTS[plan.industry] ||
    INDUSTRY_DESIGN_DIALECTS[industryId] ||
    INDUSTRY_DESIGN_DIALECTS['general-operations'] ||
    {
      name: 'executive-operations-system',
      defaultPalette: 'japan-editorial-navy',
      principle: 'Use restrained commercial structure with clear claim, proof object, and decision action.',
      motif: 'executive-rule-grid',
      primaryColorLogic: 'Use primary color for structure and decision emphasis.',
      components: { common: ['page-number', 'section-kicker', 'source-note'] },
      colorCarriers: { common: ['page-number', 'accent-rail'] },
      avoidComponents: []
    };
}

function dialectBucketsFor(plan = {}, s = {}, field = 'components') {
  const dialect = industryDesignDialect(plan);
  const buckets = dialect[field] || {};
  const role = slideRole(s);
  const keys = compactUnique(['common', role, s.type, s.layoutVariant]);
  return compactUnique(keys.flatMap(key => Array.isArray(buckets[key]) ? buckets[key] : []));
}

function dialectComponentsFor(plan = {}, s = {}) {
  const components = dialectBucketsFor(plan, s, 'components');
  if (plan.industry !== 'energy-utility') return components;
  const text = flattenText(s);
  const explicitCurve = s.loadCurve || s.loadCurveBand || s.curve || s.trend || s.monthlyTrend || s.monthlyPulse ||
    /曲线|趋势|负荷|SOC|load|curve|trend|pulse/i.test(text);
  return explicitCurve ? components : components.filter(component => component !== 'load-curve-band');
}

function dialectColorCarriersFor(plan = {}, s = {}) {
  return dialectBucketsFor(plan, s, 'colorCarriers');
}

function selectPaletteName(plan = {}) {
  const dialect = industryDesignDialect(plan);
  const policy = industryVisualPolicy(plan);
  const art = deckArtDirection(plan);
  return plan.palette || art.palette || art.paletteName || dialect.defaultPalette || policy.defaultPalette || 'boardroom-ink';
}

function deckArtDirection(plan = {}) {
  return plan.deckArtDirection || plan.deck_art_direction || plan.artDirection || plan.art_direction || {};
}

function normalizedArtMap(plan = {}) {
  const art = deckArtDirection(plan);
  const raw = art.rhythmMap || art.rhythm_map || art.slideIntents || art.slides || [];
  return Array.isArray(raw) ? raw : [];
}

function artDirectionEntry(plan = {}, s = {}, index = 0) {
  const candidates = compactUnique([
    s.id,
    s.slideId,
    s.claimId,
    s.claim_id,
    s.sourceTrace && s.sourceTrace.claimId,
    s.title,
    s.claim,
    String(index + 1),
    String(index + 1).padStart(2, '0')
  ].map(v => v == null ? '' : String(v)));
  const map = normalizedArtMap(plan);
  const explicit = map.find(entry => {
    if (!entry || typeof entry !== 'object') return false;
    const keys = [
      entry.slideId,
      entry.slide_id,
      entry.claimId,
      entry.claim_id,
      entry.id,
      entry.title,
      entry.slide,
      entry.index != null ? Number(entry.index) + 1 : ''
    ].map(v => v == null ? '' : String(v));
    return keys.some(key => key && candidates.includes(key));
  });
  if (explicit) return explicit;
  const positional = map[index];
  return positional && typeof positional === 'object' && !(positional.slideId || positional.claimId || positional.id || positional.title)
    ? positional
    : {};
}

function explicitArtValue(plan = {}, s = {}, index = 0, ...keys) {
  const entry = artDirectionEntry(plan, s, index);
  for (const key of keys) {
    if (s[key] != null && s[key] !== '') return s[key];
    const snake = key.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
    if (s[snake] != null && s[snake] !== '') return s[snake];
    if (entry[key] != null && entry[key] !== '') return entry[key];
    if (entry[snake] != null && entry[snake] !== '') return entry[snake];
  }
  return '';
}

function themeIntentFor(plan = {}, s = {}, index = 0, total = 1, signals = contentSignals(plan, s, index, total)) {
  const explicit = explicitArtValue(plan, s, index, 'themeIntent');
  if (explicit) return String(explicit);
  const type = s.type || '';
  const role = s.narrativeRole || s.narrative_role || slideRole(s);
  const text = flattenText(s);
  if (index === 0 || type === 'cover') return 'industry-opening';
  if (index === total - 1 || type === 'closing') return 'closing-anchor';
  if (type === 'toc' || type === 'toc-clean' || type === 'chapter-divider') return 'navigation-map';
  if (type === 'company-profile-spread' || type === 'profile-proof') return 'company-proof';
  if (type === 'architecture' || type === 'architecture-dark' || type === 'strategy-map' || signals.hasArchitecture) return 'system-architecture';
  if (type === 'case-gallery' || signals.imageCount >= 2 || /案例|截图|lookbook|gallery/i.test(text) || (/现场|证据/i.test(text) && (signals.imageCount > 0 || signals.hasGallery))) return 'case-evidence';
  if (type === 'risk-table' || type === 'table' || signals.hasRisk) return 'risk-warning';
  if (type === 'metric-comparison' || type === 'industry-chart' || type === 'finance-bridge' || type === 'value-tiles') return 'value-signal';
  if (type === 'timeline' || type === 'timeline-dark' || signals.hasTimeline || signals.hasLoop) return 'operating-path';
  if (signals.hasMetrics || signals.isNumberHeavy) return 'value-signal';
  if (role === 'diagnosis' || /问题|痛点|现状|差距|瓶颈|断点/i.test(text)) return 'diagnosis';
  if (role === 'solution' || role === 'operating-model') return 'solution-build';
  return 'executive-narrative';
}

function accentRoleFor(plan = {}, s = {}, index = 0, total = 1, themeIntent = themeIntentFor(plan, s, index, total), signals = contentSignals(plan, s, index, total)) {
  const explicit = explicitArtValue(plan, s, index, 'accentRole');
  if (explicit) return String(explicit);
  if (/risk|warning|diagnosis/i.test(themeIntent) || s.type === 'risk-table') return 'risk';
  if (/case|evidence|company-proof/i.test(themeIntent) || signals.imageCount) return 'evidence';
  if (/operating|path|closing|action|solution/i.test(themeIntent) || s.type === 'timeline') return 'action';
  if (/value|metric|proof/i.test(themeIntent) || signals.hasMetrics || signals.isNumberHeavy) return 'data';
  if (/opening|navigation|architecture|system/i.test(themeIntent)) return 'brand';
  return 'neutral';
}

function layoutEnergyFor(plan = {}, s = {}, index = 0, total = 1, themeIntent = themeIntentFor(plan, s, index, total), signals = contentSignals(plan, s, index, total)) {
  const explicit = explicitArtValue(plan, s, index, 'layoutEnergy');
  if (explicit) return String(explicit);
  if (/opening|closing/i.test(themeIntent)) return 'hero';
  if (/risk|diagnosis/i.test(themeIntent)) return 'high-contrast';
  if (/case|evidence|architecture|system/i.test(themeIntent)) return 'structured';
  if (signals.isDenseText) return 'editorial-dense';
  return 'calm';
}

function visualDensityFor(plan = {}, s = {}, index = 0, total = 1, signals = contentSignals(plan, s, index, total)) {
  const explicit = explicitArtValue(plan, s, index, 'visualDensity');
  if (explicit) return String(explicit);
  if (signals.isImageHeavy) return 'image-led';
  if (signals.isNumberHeavy || signals.hasMetrics) return 'metric-led';
  if (signals.isDenseText || signals.isTextHeavy) return 'dense';
  return 'balanced';
}

function rhythmTransitionFor(plan = {}, s = {}, index = 0, total = 1, themeIntent = themeIntentFor(plan, s, index, total)) {
  const explicit = explicitArtValue(plan, s, index, 'rhythmTransition');
  if (explicit) return String(explicit);
  if (index === 0) return 'start';
  if (index === total - 1) return 'return-to-anchor';
  if (/risk|diagnosis/i.test(themeIntent)) return 'turning-point';
  if (/case|evidence|value/i.test(themeIntent)) return 'proof-anchor';
  if (/architecture|system|operating/i.test(themeIntent)) return 'structure-shift';
  return 'continue';
}

function semanticColorRolesFor(plan = {}, accentRole = 'brand') {
  const art = deckArtDirection(plan);
  const configured = Object.assign({}, art.semanticColorRoles || art.semantic_color_roles || {});
  const defaults = (VISUAL_SYSTEM.semanticColorRoles || {});
  const roleDefaults = defaults.roles || defaults;
  const role = Object.assign({}, roleDefaults[accentRole] || {}, configured[accentRole] || {});
  return {
    activeRole: accentRole,
    brand: (configured.brand && (configured.brand.token || configured.brand)) || ((roleDefaults.brand || {}).token) || 'accent',
    evidence: (configured.evidence && (configured.evidence.token || configured.evidence)) || ((roleDefaults.evidence || {}).token) || 'success',
    risk: (configured.risk && (configured.risk.token || configured.risk)) || ((roleDefaults.risk || {}).token) || 'risk',
    action: (configured.action && (configured.action.token || configured.action)) || ((roleDefaults.action || {}).token) || 'warning',
    data: (configured.data && (configured.data.token || configured.data)) || ((roleDefaults.data || {}).token) || 'dataHighlight',
    neutral: (configured.neutral && (configured.neutral.token || configured.neutral)) || ((roleDefaults.neutral || {}).token) || 'muted',
    activeToken: role.token || configured[accentRole] || accentRole,
    carrierGuidance: role.carriers || []
  };
}

function slideRole(s = {}) {
  const type = s.type || 'content';
  if (type === 'cover' || type === 'cover-dark') return 'cover';
  if (type === 'closing' || type === 'closing-dark') return 'closing';
  if (type === 'chapter-divider') return 'navigation';
  if (type === 'company-profile-spread') return 'situation';
  if (type === 'profile-proof') return 'situation';
  if (type === 'comparison') return 'value';
  if (type === 'quote-proof') return 'split';
  if (type === 'toc' || type === 'toc-clean') return 'navigation';
  if (type === 'two-column' || type === 'two-column-clean') return 'situation';
  if (type === 'cards' || type === 'executive-blocks') return 'split';
  if (type === 'metric-comparison') return 'value';
  if (type === 'finance-bridge' || type === 'portfolio-table') return 'value';
  if (type === 'manifesto') return 'split';
  if (type === 'product-showcase') return 'product';
  if (type === 'strategy-map') return 'architecture';
  if (type === 'module-matrix') return 'capability';
  if (type === 'architecture' || type === 'architecture-dark') return 'architecture';
  if (type === 'timeline' || type === 'timeline-dark') return 'timeline';
  if (type === 'value-tiles') return 'value';
  if (type === 'table' || type === 'risk-table') return 'risk';
  if (type === 'case-gallery' || type === 'gallery' || type === 'portfolio') return 'case-gallery';
  return 'content';
}

function resolveVisualMode(plan = {}, s = {}, role = slideRole(s)) {
  const explicit = s.visual && s.visual.mode ? s.visual.mode : s.visualMode;
  if (explicit) return explicit;
  if (plan.visualMode && plan.visualMode !== 'auto') return plan.visualMode;
  const policy = industryVisualPolicy(plan);
  if ((policy.caseRoles || []).includes(role) || role === 'case-gallery') return 'case-gallery';
  return policy.visualMode || 'solid';
}

function visualRole(plan = {}, s = {}, role = slideRole(s)) {
  const visual = s.visual || {};
  if (visual.role) return visual.role;
  const recipeRole = s.referenceRecipe && s.referenceRecipe.assetRole;
  if (assetRoleNeedsImage(recipeRole)) return normalizeAssetRole(recipeRole);
  const policy = industryVisualPolicy(plan);
  const roles = Object.assign({}, policy.defaultImageRoles || {});
  if (roles[role]) return roles[role];
  if (role === 'case-gallery') return 'gallery';
  if (role === 'product') return 'showcase';
  if (role === 'situation') return 'evidence';
  if (role === 'cover') return 'showcase';
  return 'structure';
}

function slideWantsImage(plan = {}, s = {}, role = slideRole(s)) {
  const explicitMode = s.visual && s.visual.mode ? s.visual.mode : s.visualMode;
  if (explicitMode === 'solid') return false;
  if (explicitMode && explicitMode !== 'solid') return true;
  if ((s.visual && s.visual.image) || s.image || (Array.isArray(s.images) && s.images.length)) return true;
  if (role === 'case-gallery' && plan.media && plan.media.gallery) return true;
  if (plan.visualMode === 'solid') return false;
  if (plan.visualMode === 'photo' || plan.visualMode === 'case-gallery') return true;
  const policy = industryVisualPolicy(plan);
  const recipeRole = s.referenceRecipe && s.referenceRecipe.assetRole;
  const imageLedRecipe = assetRoleNeedsImage(recipeRole) &&
    /captioned-real-asset|showcase|gallery|proof|product|beauty/i.test(String(
      (s.referenceRecipe && (s.referenceRecipe.mainVisualMethod || s.referenceRecipe.layout || s.referenceRecipe.proofObject || s.referenceRecipe.id)) ||
      s.layoutVariant ||
      s.proofObject ||
      ''
    ));
  if (imageLedRecipe && (policy.visualMode === 'case-gallery' || policy.visualMode === 'hybrid' || ['image-rich', 'case-led', 'asset-led', 'luxury'].includes(plan.visualIntent || plan.assetMode || ''))) {
    return true;
  }
  if ((policy.photoRoles || []).includes(role)) return true;
  const rich = ['image-rich', 'case-led', 'asset-led', 'portfolio'].includes(plan.visualIntent || plan.assetMode || '');
  return rich && (policy.optionalPhotoRoles || []).includes(role);
}

function resolveAssetPath(assetPath) {
  if (!assetPath || typeof assetPath !== 'string') return '';
  if (path.isAbsolute(assetPath)) return assetPath;
  const cwdPath = path.resolve(process.cwd(), assetPath);
  if (fs.existsSync(cwdPath)) return cwdPath;
  return path.resolve(ASSET_DIR, assetPath.replace(/^assets\//, ''));
}

function mediaKeyForRole(role) {
  if (role === 'cover' || role === 'closing') return 'cover';
  if (role === 'navigation' || role === 'timeline') return 'band';
  if (role === 'case-gallery') return 'gallery';
  return 'detail';
}

function configuredIndustryMedia(plan = {}, role = 'cover') {
  const defaults = VISUAL_SYSTEM.mediaDefaults || {};
  const industryDefaults = defaults[plan.industry] || {};
  const value = industryDefaults[mediaKeyForRole(role)] || industryDefaults[role];
  if (Array.isArray(value)) return resolveAssetPath(value[0]);
  return value ? resolveAssetPath(value) : '';
}

function defaultIndustryMedia(plan = {}, role = 'cover') {
  const configured = configuredIndustryMedia(plan, role);
  if (configured) return configured;
  if (plan.industry !== 'energy-utility') return '';
  if (role === 'cover' || role === 'closing') return MEDIA_ASSETS.energyStorageCover;
  if (role === 'navigation' || role === 'timeline') return MEDIA_ASSETS.energyStorageBand;
  if (role === 'situation' || role === 'split' || role === 'value' || role === 'case-gallery') return MEDIA_ASSETS.energyStorageDetail;
  return '';
}

function mediaForRole(plan = {}, s = {}, role = slideRole(s)) {
  const visual = s.visual || {};
  const direct = visual.image || s.image;
  if (direct) return resolveAssetPath(direct);
  const slideImages = [
    ...(Array.isArray(visual.images) ? visual.images : []),
    ...(Array.isArray(s.images) ? s.images : [])
  ];
  if (slideImages.length && ['cover', 'product', 'situation', 'case-gallery', 'value'].includes(role)) {
    return resolveAssetPath(slideImages[0]);
  }
  const media = plan.media || {};
  const key = mediaKeyForRole(role);
  const val = media[key];
  if (Array.isArray(val)) return resolveAssetPath(val[0]);
  if (val) return resolveAssetPath(val);
  return defaultIndustryMedia(plan, role);
}

function galleryImages(plan = {}, s = {}) {
  const raw = s.images || (s.visual && s.visual.images) || (plan.media && plan.media.gallery) || [];
  return (Array.isArray(raw) ? raw : [raw]).map(resolveAssetPath).filter(p => p && fs.existsSync(p));
}

function pageFamily(plan = {}, s = {}, roleOverride) {
  const role = roleOverride || slideRole(s);
  const mode = resolveVisualMode(plan, s, role);
  const imageRole = visualRole(plan, s, role);
  const wantsImage = slideWantsImage(plan, s, role);
  const familyKey = wantsImage ? imageRole : mode;
  const families = (((VISUAL_ROUTER.layoutFamilies || {})[role] || {})[familyKey]) ||
    (((VISUAL_ROUTER.layoutFamilies || {})[role] || {})[mode]);
  if (families) return families;
  return {
    cover: 'stage-cover',
    closing: 'stage-closing',
    navigation: 'spatial-navigation',
    situation: imageRole === 'evidence' ? 'evidence-split' : 'light-narrative',
    split: 'split-insight',
    architecture: 'system-architecture',
    capability: 'capability-map',
    product: 'product-showcase',
    timeline: 'pathway-timeline',
    value: 'value-signal',
    risk: 'risk-matrix',
    'case-gallery': 'case-gallery'
  }[role] || 'light-narrative';
}

function slideDesign(plan = {}, s = {}, roleOverride) {
  const role = roleOverride || slideRole(s);
  const mode = resolveVisualMode(plan, s, role);
  const imageRole = visualRole(plan, s, role);
  const wantsImage = slideWantsImage(plan, s, role);
  const imagePath = wantsImage ? mediaForRole(plan, s, role) : '';
  return {
    role,
    mode,
    imageRole,
    wantsImage,
    imagePath,
    mediaKey: mediaKeyForRole(role),
    pageFamily: pageFamily(plan, s, role)
  };
}

function compactUnique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function isCompanyIntroDeck(plan = {}) {
  return /company-intro|公司介绍|能力介绍|企业介绍|企业简介|宣传册/i.test(String(
    (plan.materialIntelligence && plan.materialIntelligence.pptType) ||
    plan.ppt_type ||
    plan.pptType ||
    plan.title ||
    ''
  ));
}

function inferredThemeIntent(plan = {}, s = {}, signals = contentSignals(plan, s)) {
  return s.themeIntent ||
    s.theme_intent ||
    (s.compositionPlan && s.compositionPlan.themeIntent) ||
    themeIntentFor(plan, s, 1, 3, signals);
}

function inferredAccentRole(plan = {}, s = {}, signals = contentSignals(plan, s), intent = inferredThemeIntent(plan, s, signals)) {
  return s.accentRole ||
    s.accent_role ||
    (s.compositionPlan && s.compositionPlan.accentRole) ||
    accentRoleFor(plan, s, 1, 3, intent, signals);
}

function compositionNameFor(plan = {}, s = {}, type = s.type, variant = s.layoutVariant, signals = contentSignals(plan, s), themeIntent = '') {
  const intent = themeIntent || inferredThemeIntent(plan, s, signals);
  if (type === 'cover') return slideWantsImage(plan, s, 'cover') ? 'brand-hero-showcase' : 'brand-hero-stage';
  if (type === 'closing') {
    if (variant === 'company-thanks') return 'manufacturing-back-cover';
    return /decision|pilot|investment|handoff|adoption/i.test(String(variant || '')) ? 'decision-close-board' : 'editorial-close-statement';
  }
  if (type === 'finance-bridge') return 'return-bridge-board';
  if (type === 'portfolio-table') return 'portfolio-action-table';
  if (type === 'industry-chart' && variant === 'valuation-sensitivity') return 'scenario-sensitivity-board';
  if (/risk-warning/i.test(intent)) return variant === 'responsibility-loop' ? 'governance-loop-board' : 'risk-control-board';
  if (/case-evidence/i.test(intent) && (signals.imageCount || type === 'case-gallery')) return signals.imageCount >= 3 ? 'triptych-evidence-gallery' : 'hero-image-with-evidence-strip';
  if (/value-signal/i.test(intent) && ['metric-comparison', 'industry-chart', 'finance-bridge', 'value-tiles'].includes(type)) return 'metric-readout-board';
  if (/system-architecture/i.test(intent) && ['architecture', 'architecture-dark', 'strategy-map'].includes(type)) return 'system-map-with-proof-rail';
  if (/operating-path/i.test(intent) && ['timeline', 'timeline-dark'].includes(type)) return 'process-rail-with-control-points';
  if (type === 'toc' || type === 'toc-clean' || type === 'chapter-divider') return 'chapter-pathway-board';
  if (type === 'company-profile-spread') return 'company-profile-evidence-spread';
  if (type === 'profile-proof') return 'identity-proof-sidebar';
  if (type === 'case-gallery') {
    if (variant === 'case-hero') return 'hero-image-with-evidence-strip';
    if (variant === 'case-comparison') return 'before-after-evidence-spread';
    if (variant === 'evidence-board') return 'evidence-contact-board';
    if (variant === 'lookbook-story') return 'lookbook-editorial-story';
    if (variant === 'service-touchpoint') return 'journey-touchpoint-gallery';
    if (variant === 'site-evidence') return 'site-evidence-readout';
    if (variant === 'prototype-flow') return 'prototype-workflow-proof';
    return signals.imageCount >= 3 ? 'triptych-evidence-gallery' : 'hero-image-with-evidence-strip';
  }
  if (type === 'finance-bridge') return 'return-bridge-board';
  if (type === 'portfolio-table') return 'portfolio-action-table';
  if (type === 'industry-chart' && variant === 'valuation-sensitivity') return 'scenario-sensitivity-board';
  if (type === 'metric-comparison' || type === 'industry-chart') return 'metric-readout-board';
  if (type === 'architecture' || type === 'architecture-dark' || type === 'strategy-map') return 'system-map-with-proof-rail';
  if (type === 'timeline' || type === 'timeline-dark') return 'process-rail-with-control-points';
  if (type === 'risk-table' || type === 'table') return variant === 'responsibility-loop' ? 'governance-loop-board' : 'risk-control-board';
  if (type === 'product-showcase') return 'product-showcase-with-callouts';
  if (type === 'report-board') return 'editorial-report-board';
  if (type === 'module-matrix') return 'capability-matrix-board';
  if (type === 'comparison') return 'two-sided-comparison-board';
  return signals.isDenseText ? 'editorial-report-board' : 'executive-insight-board';
}

function rhythmRoleFor(plan = {}, s = {}, index = 0, total = 1) {
  const type = s.type || '';
  if (index === 0 || type === 'cover') return 'opener';
  if (index === total - 1 || type === 'closing') return 'closer';
  if (type === 'toc' || type === 'toc-clean' || type === 'chapter-divider') return 'orientation';
  if (['case-gallery', 'company-profile-spread', 'profile-proof'].includes(type)) return 'evidence';
  if (['metric-comparison', 'industry-chart', 'finance-bridge', 'portfolio-table'].includes(type)) return 'proof';
  if (['architecture', 'architecture-dark', 'strategy-map'].includes(type)) return 'system';
  if (['timeline', 'timeline-dark'].includes(type)) return 'operating-rhythm';
  if (['risk-table', 'table'].includes(type)) return 'governance';
  return 'narrative';
}

function themeCoverageFor(plan = {}, s = {}, signals = contentSignals(plan, s), role = slideRole(s), themeIntent = '') {
  const explicit = s.themeCoverage || s.theme_coverage;
  if (explicit) return explicit;
  const type = s.type || '';
  const intent = themeIntent || inferredThemeIntent(plan, s, signals);
  if (['cover', 'closing', 'chapter-divider', 'toc', 'toc-clean'].includes(type)) return 'high';
  if (s.layoutVariant === 'company-thanks' || type === 'company-profile-spread') return 'high';
  if (/company-proof|case-evidence/i.test(intent)) return 'high';
  if (/value-signal|risk-warning|system-architecture/i.test(intent)) return 'medium';
  if (type === 'case-gallery' || signals.imageCount >= 2 || signals.hasMetrics || type === 'metric-comparison' || type === 'industry-chart') return 'medium';
  if (signals.isDenseText || type === 'report-board' || type === 'risk-table') return 'medium';
  if (role === 'architecture' || role === 'timeline' || role === 'value') return 'medium';
  return 'medium';
}

function backgroundToneFor(plan = {}, s = {}, index = 0, total = 1, coverage = 'medium') {
  const explicit = explicitArtValue(plan, s, index, 'backgroundTone');
  if (explicit) return String(explicit);
  const type = s.type || '';
  const variant = s.layoutVariant || '';
  const intent = themeIntentFor(plan, s, index, total);
  if (type === 'cover' && !/decision-summary|pilot-rollout|quality-handoff|adoption-close/i.test(variant)) {
    const tone = (((PALETTES[selectPaletteName(plan)] || {}).presentation || {}).coverTone) || '';
    return (tone === 'light' || tone === 'split') ? 'accent-wash' : 'dark-stage';
  }
  if (type === 'closing' && !/decision-summary|pilot-rollout|quality-handoff|adoption-close/i.test(variant)) return 'dark-stage';
  if (/closing-anchor|industry-opening/i.test(intent)) return index === 0 && type !== 'cover' ? 'accent-wash' : 'dark-stage';
  if (/risk-warning|value-signal/i.test(intent)) return 'accent-wash';
  if (/case-evidence|company-proof/i.test(intent)) return 'tinted-paper';
  if (type === 'chapter-divider' || (type === 'toc-clean' && /agenda-board|line-agenda|editorial-agenda/i.test(variant))) return 'dark-stage';
  if (type === 'case-gallery' && /hero|lookbook|site|prototype|portfolio/i.test(variant)) return 'tinted-paper';
  if (type === 'company-profile-spread') return 'tinted-paper';
  if (coverage === 'high') return 'accent-wash';
  return 'tinted-paper';
}

function primaryColorUseFor(plan = {}, s = {}, signals = contentSignals(plan, s), coverage = 'medium', themeIntent = '', roleOverride = '') {
  const uses = ['top-rule', 'page-number', 'watermark-circle'];
  const intent = themeIntent || inferredThemeIntent(plan, s, signals);
  const accentRole = roleOverride || inferredAccentRole(plan, s, signals, intent);
  if (coverage !== 'low') uses.push('accent-rail');
  if (['metric-comparison', 'industry-chart', 'finance-bridge'].includes(s.type)) uses.push('metric-highlight');
  if (s.type === 'case-gallery' || signals.imageCount) uses.push('caption-bar');
  if (['architecture', 'architecture-dark', 'timeline', 'timeline-dark', 'strategy-map'].includes(s.type)) uses.push('flow-connector');
  if (['risk-table', 'table'].includes(s.type)) uses.push('priority-line');
  if (['cover', 'closing', 'chapter-divider', 'toc', 'toc-clean'].includes(s.type) || coverage === 'high') uses.push('dark-anchor');
  if (accentRole === 'risk') uses.push('priority-line', 'risk-band');
  if (accentRole === 'evidence') uses.push('caption-bar', 'evidence-frame');
  if (accentRole === 'data') uses.push('metric-highlight', 'data-readout');
  if (accentRole === 'action') uses.push('process-rail', 'action-strip');
  if (accentRole === 'brand' && coverage !== 'low') uses.push('side-color-field');
  return compactUnique([...uses, ...dialectColorCarriersFor(plan, s)]);
}

function imageTreatmentFor(plan = {}, s = {}, design = slideDesign(plan, s), signals = contentSignals(plan, s)) {
  if (!signals.imageCount && !(design && design.wantsImage)) return 'none';
  const role = normalizeAssetRole((s.visual && s.visual.role) || (design && design.imageRole) || 'evidence');
  if (role === 'background') return 'graded-atmosphere';
  if (role === 'showcase') return 'inspectable-showcase-frame';
  if (role === 'gallery') return signals.imageCount >= 4 ? 'captioned-contact-sheet' : 'hero-plus-supporting-evidence';
  if (role === 'evidence') return 'framed-evidence-caption';
  return 'framed-visual-proof';
}

function microComponentsFor(plan = {}, s = {}, signals = contentSignals(plan, s), design = slideDesign(plan, s), themeIntent = '', roleOverride = '') {
  const type = s.type || '';
  const components = ['top-rule', 'page-number', 'watermark-circle'];
  const intent = themeIntent || inferredThemeIntent(plan, s, signals);
  const accentRole = roleOverride || inferredAccentRole(plan, s, signals, intent);
  if (!['cover', 'closing'].includes(type)) components.push('section-kicker');
  if (signals.imageCount || (design && design.wantsImage)) components.push('source-caption', 'evidence-frame');
  if (signals.hasMetrics || type === 'metric-comparison' || type === 'industry-chart') components.push('metric-strip');
  if (['architecture', 'architecture-dark', 'strategy-map'].includes(type)) components.push('system-rail');
  if (['timeline', 'timeline-dark'].includes(type)) components.push('process-rail');
  if (['risk-table', 'table'].includes(type)) components.push('control-tag');
  components.push(...dialectComponentsFor(plan, s));
  if (isCompanyIntroDeck(plan) && type === 'closing') components.push('contact-block', 'back-cover-anchor');
  if (type === 'company-profile-spread') components.push('dark-sidebar', 'metric-strip');
  if (accentRole === 'risk') components.push('control-tag', 'priority-line');
  if (accentRole === 'evidence') components.push('caption-bar', 'source-caption', 'evidence-frame');
  if (accentRole === 'data') components.push('metric-strip', 'source-caption');
  if (accentRole === 'action') components.push('process-rail', 'decision-caption');
  if (/system-architecture/i.test(intent)) components.push('system-rail');
  const avoid = new Set(industryDesignDialect(plan).avoidComponents || []);
  return compactUnique(components).filter(component => !avoid.has(component));
}

function normalizeComponentId(value = '') {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_+\s/]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function componentIdFromHint(value = '') {
  const id = normalizeComponentId(value);
  const aliases = {
    'hero-kpi': 'kpi-strip',
    'hero-kpis': 'kpi-strip',
    'hero-kpi-strip': 'kpi-strip',
    'metric-strip': 'kpi-strip',
    'basket-metric-strip': 'kpi-strip',
    'member-ladder': 'kpi-strip',
    'kpi-primary-metric': 'kpi-primary-metric',
    'primary-kpi': 'kpi-primary-metric',
    'chart-commentary': 'chart-commentary-panel',
    'commentary': 'commentary-panel',
    'commentary-card': 'commentary-panel',
    'source-caption': 'caption-bar',
    'luxury-caption-bar': 'caption-bar',
    'brand-proof-caption': 'caption-bar',
    'product-story-caption': 'caption-bar',
    'proof-gallery-grid': 'proof-gallery',
    'image-gallery': 'proof-gallery',
    'gallery-grid': 'proof-gallery',
    'value-chain-connector': 'value-chain',
    'business-proof-rail': 'value-chain',
    'process-rail': 'process-rail',
    'system-rail': 'system-rail',
    'brand-world-hero': 'hero-image',
    'large-product-frame': 'hero-image',
    'product-proof-callout': 'product-matrix',
    'product-grid': 'product-matrix',
    'risk-board': 'risk-register',
    'control-tag': 'risk-register',
    'governance-table': 'governance-table'
  };
  return aliases[id] || id;
}

function normalizeComponentEntry(component, source = 'explicit') {
  if (!component) return null;
  const rawId = typeof component === 'string'
    ? component
    : (component.id || component.name || component.component || component.type || '');
  const id = componentIdFromHint(rawId);
  if (!id) return null;
  return Object.assign({
    id,
    role: typeof component === 'object' ? (component.role || component.purpose || '') : '',
    required: typeof component === 'object' && component.required != null ? Boolean(component.required) : true,
    source,
    renderer: typeof component === 'object' ? (component.renderer || 'auto') : 'auto'
  }, typeof component === 'object' ? component : {});
}

function addComponent(acc, component, source = 'rule') {
  const entry = normalizeComponentEntry(component, source);
  if (!entry) return;
  if (!acc.some(item => item.id === entry.id)) acc.push(entry);
}

function isSystemPlannedComponent(component = {}) {
  return !['explicit', 'explicit-plan', 'component-hint'].includes(component.source || '');
}

function hasContactBlockData(plan = {}, s = {}) {
  return [
    s.contacts,
    s.contact,
    s.contactBlock,
    s.contact_block,
    plan.contacts,
    plan.contact
  ].some(value => Array.isArray(value) ? value.length > 0 : Boolean(value));
}

function nativeOnlyOptionalComponentAllowed(plan = {}, s = {}, component = {}, signals = contentSignals(plan, s)) {
  const id = component.id;
  const type = String(s.type || '');
  const variant = String(s.layoutVariant || s.variant || '');
  const proofObject = proofObjectIdForSlide(s);
  const hasRows = Array.isArray(s.rows) || Array.isArray(s.risks) || Array.isArray(s.controls);
  const hasMetrics = signals.hasMetrics || Array.isArray(s.metrics);
  const hasArchitecture = signals.hasArchitecture ||
    Boolean(s.layers || s.architecture || s.systemMap || s.topology || s.capabilityMap || s.platformCapabilities || s.valueChain || s.capitals);
  const text = `${variant} ${proofObject} ${s.title || ''} ${s.subtitle || ''}`;
  if (id === 'page-number') return true;
  if (id === 'section-kicker') return !['cover', 'cover-dark', 'closing', 'closing-dark'].includes(type);
  if (id === 'navigation-sequence') return ['toc', 'toc-clean'].includes(type);
  if (id === 'content-card-grid') return ['two-column', 'cards', 'module-matrix', 'value-tiles', 'executive-blocks'].includes(type);
  if (id === 'contact-block') return ['closing', 'closing-dark'].includes(type) && hasContactBlockData(plan, s);
  if (['governance-table', 'control-tag'].includes(id)) return ['risk-table', 'table'].includes(type) || hasRows || signals.hasResponsibilityLoop;
  if (id === 'kpi-primary-metric') return hasMetrics || ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type);
  if (id === 'load-curve-band') return Boolean(s.loadCurve || s.loadCurveBand || s.curve || s.trend || s.monthlyTrend || s.monthlyPulse) ||
    /曲线|趋势|负荷|SOC|load|curve|trend|pulse/i.test(flattenText(s));
  if (id === 'decision-panel') return ['closing', 'closing-dark'].includes(type);
  if (['system-rail', 'capability-layer-stack'].includes(id)) return ['architecture', 'architecture-dark', 'strategy-map'].includes(type) || hasArchitecture;
  if (['process-rail', 'dispatch-rail'].includes(id)) return ['timeline', 'timeline-dark'].includes(type) && id === 'process-rail';
  return !/(backdrop|frame|chip|tag|node|checkpoint|readout|photo|map|severity|status|telemetry|asset-|site-|alert-)/i.test(`${id} ${text}`);
}

function explicitComponentEntries(s = {}) {
  const planComponents = s.componentPlan && Array.isArray(s.componentPlan.components) ? s.componentPlan.components : [];
  const snakeComponents = s.component_plan && Array.isArray(s.component_plan.components) ? s.component_plan.components : [];
  const hints = compactUnique([
    ...(Array.isArray(s.componentHints) ? s.componentHints : []),
    ...(Array.isArray(s.component_hints) ? s.component_hints : []),
    ...(Array.isArray(s.componentSuggestions) ? s.componentSuggestions : []),
    ...(Array.isArray(s.component_suggestions) ? s.component_suggestions : [])
  ]);
  return [
    ...planComponents.map(c => normalizeComponentEntry(c, 'explicit-plan')),
    ...snakeComponents.map(c => normalizeComponentEntry(c, 'explicit-plan')),
    ...hints.map(c => normalizeComponentEntry(c, 'component-hint'))
  ].filter(Boolean);
}

function proofObjectIdForSlide(s = {}) {
  const value = String(
    (s.proof && s.proof.id) ||
    s.proofObject ||
    s.proof_object ||
    s.layoutVariant ||
    s.variant ||
    ''
  );
  if (value && HIGH_VALUE_PAGE_FAMILIES.has(value) && s.type && !layoutVariantCompatibleWithType(s.type, value)) {
    return String(s.layoutVariant || s.variant || '');
  }
  return value;
}

function componentPlanFor(plan = {}, s = {}, index = 0, total = 1, signals = contentSignals(plan, s, index, total), composition = null) {
  const type = s.type || '';
  const variant = String(s.layoutVariant || s.variant || '');
  const proofObject = proofObjectIdForSlide(s);
  const cp = composition || s.compositionPlan || {};
  const themeIntent = cp.themeIntent || s.themeIntent || themeIntentFor(plan, s, index, total, signals);
  const components = [];
  const rulesApplied = [];

  explicitComponentEntries(s).forEach(entry => addComponent(components, entry, entry.source || 'explicit'));

  const addRule = (id, role, rule, required = true) => {
    addComponent(components, { id, role, required }, rule);
    rulesApplied.push(rule);
  };

  if (['cover', 'cover-dark'].includes(type) || signals.imageCount > 0 || /hero|cover|brand-world|product|image/i.test(proofObject)) {
    addRule('hero-image', 'primary visual or brand-world anchor', 'visual-or-cover-signal', !['toc', 'toc-clean'].includes(type));
  }
  if (['toc', 'toc-clean'].includes(type)) {
    addRule('navigation-sequence', 'native navigation path or agenda sequence', 'toc-navigation');
  }
  if (['two-column', 'cards', 'module-matrix', 'value-tiles', 'executive-blocks'].includes(type)) {
    addRule('content-card-grid', 'native card grid or editorial content body', 'native-content-grid');
  }
  const metricEligible = !['cover', 'cover-dark', 'closing', 'chapter-divider', 'toc', 'toc-clean', 'risk-table', 'portfolio-table', 'timeline', 'timeline-dark'].includes(type);
  if ((metricEligible && signals.hasMetrics) || ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type)) {
    addRule('kpi-strip', 'metric evidence readout', 'metric-signal');
    addRule('chart-commentary-panel', 'explain what the data proves', 'metric-signal', false);
  }
  if (['metric-comparison', 'industry-chart'].includes(type) && signals.metricCount >= 1) {
    addRule('kpi-primary-metric', 'one number carries the page claim', 'metric-primary');
  }
  const chartOwningTypes = ['metric-comparison', 'industry-chart', 'finance-bridge'];
  const chartIntent = chartOwningTypes.includes(type) && slideHasChartIntent(s);
  const chartSpec = chartIntent ? (s.chartSpec || routeChartSpec(plan, s, { index: index + 1, total })) : null;
  const chartComponentId = chartSpecToComponentId(chartSpec || {});
  const explicitChartSignal = hasExplicitChartSignal(s) && s.chartSpecInferred !== true;
  const chartEligibleRoute = ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type) ||
    /chart|metric|kpi|scorecard|matrix|funnel|waterfall|pareto/i.test(String(variant || proofObject));
  const inferredInformationGap = chartSpec && chartSpec.kind === 'informationGap' && !explicitChartSignal;
  if (chartIntent && chartComponentId && !inferredInformationGap && (explicitChartSignal || chartEligibleRoute) && !['cover', 'cover-dark', 'closing', 'closing-dark', 'toc', 'toc-clean', 'chapter-divider'].includes(type)) {
    addRule(chartComponentId, chartSpec.kind === 'informationGap' ? 'explicit data gap instead of fake chart' : `chartSpec/v1 ${chartSpec.kind} renderer`, 'chart-spec-router');
  }
  if (signals.imageCount >= 2 || ['case-gallery', 'gallery', 'portfolio'].includes(type) || /gallery|photo|proof|lookbook|mosaic/i.test(proofObject)) {
    addRule('proof-gallery', 'captioned visual evidence set', 'gallery-signal');
    addRule('caption-bar', 'state what each image proves', 'gallery-signal');
  }
  const productProofSignal =
    Boolean(s.product || (Array.isArray(s.products) && s.products.length)) ||
    type === 'product-showcase' ||
    /sku|product-evidence|texture|efficacy|单品|质地|功效/i.test(proofObject) ||
    /SKU|核心单品|明星单品|质地|功效/i.test([s.title, s.subtitle, s.claim].filter(Boolean).join(' '));
  if (productProofSignal && !['cover', 'closing', 'chapter-divider', 'toc', 'toc-clean'].includes(type)) {
    addRule('product-matrix', 'SKU, texture, efficacy, price, or pack proof', 'product-signal');
  }
  const systemValueEligible = !['cover', 'cover-dark', 'closing', 'closing-dark', 'toc', 'toc-clean', 'chapter-divider'].includes(type);
  const hasExplicitSystemValueStructure = ['strategy-map', 'architecture', 'architecture-dark'].includes(type) ||
    Boolean(s.valueChain || s.capitals || s.drivers || s.outcomes || s.inputs || s.outputs || s.layers || s.architecture || s.systemMap || s.topology || s.capabilityMap || s.platformCapabilities) ||
    /value-creation|value-chain|brand-world-and-business/i.test(proofObject);
  if (systemValueEligible && hasExplicitSystemValueStructure) {
    addRule(/architecture/.test(type) ? 'system-rail' : 'value-chain', 'show how inputs/actions/outcomes connect', 'system-or-value-chain-signal');
    addRule('commentary-panel', 'turn structure into a management judgment', 'system-or-value-chain-signal', false);
  }
  const processEligible = !['industry-chart', 'metric-comparison', 'finance-bridge', 'portfolio-table', 'case-gallery', 'gallery', 'cover', 'cover-dark', 'closing'].includes(type);
  if (['timeline', 'timeline-dark'].includes(type) || (processEligible && (signals.hasTimeline || signals.hasLoop))) {
    addRule('process-rail', 'sequence or operating loop', 'process-signal');
  }
  const riskEligible = !['cover', 'cover-dark', 'closing', 'closing-dark', 'chapter-divider', 'toc', 'toc-clean'].includes(type);
  const riskMatrixExplicit = riskEligible && (Boolean(s.matrix) || /risk-matrix|materiality-matrix/i.test(variant) || /risk-matrix|materiality-matrix/i.test(proofObject));
  if (riskMatrixExplicit) {
    addRule('risk-matrix', 'rank risk by impact and likelihood or materiality', 'explicit-risk-matrix');
  } else if (riskEligible && (type === 'risk-table' || signals.hasRisk || signals.hasResponsibilityLoop)) {
    const hasRiskRows = Array.isArray(s.rows) || Array.isArray(s.risks) || Array.isArray(s.controls);
    const required = type === 'risk-table' || signals.hasRisk || signals.hasResponsibilityLoop || hasRiskRows;
    addRule('risk-register', 'owner, level, action, and cadence', 'risk-governance-without-matrix', required);
  }
  if (/governance|control|responsibility/i.test(variant) || signals.hasGovernance || signals.hasResponsibilityLoop) {
    addRule('governance-table', 'governance rows with owner/action logic', 'governance-signal', false);
  }
  if (s.sourceNote || s.source_note || (s.proof && s.proof.sourceNote)) {
    addRule('source-note', 'visible provenance or source boundary', 'source-provenance');
  }
  if (/closing/.test(type) || s.decision || s.nextStep || s.nextSteps || (Array.isArray(s.actions) && s.actions.length && ['closing', 'closing-dark'].includes(type))) {
    addRule('decision-panel', 'next action or closeout decision', 'closing-signal');
  }

  const dialect = industryDesignDialect(plan);
  dialectComponentsFor(plan, s).forEach(id => addComponent(components, { id: componentIdFromHint(id), role: 'industry dialect component', required: false }, 'industry-dialect'));
  const avoid = new Set((dialect.avoidComponents || []).map(componentIdFromHint));
  const hasExplicitVisibleSource = Boolean(s.sourceNote || s.source_note || (s.proof && s.proof.sourceNote));
  const riskRegisterAllowed = riskEligible && (
    type === 'risk-table' ||
    riskMatrixExplicit ||
    Array.isArray(s.rows) ||
    Array.isArray(s.risks) ||
    Array.isArray(s.controls) ||
    Boolean(s.riskRegister || s.riskMatrix || s.controlsMatrix || s.matrix)
  );
  const processRailAllowed = ['timeline', 'timeline-dark'].includes(type) ||
    Array.isArray(s.phases) ||
    Array.isArray(s.actions) ||
    Array.isArray(s.steps) ||
    Array.isArray(s.timeline) ||
    Array.isArray(s.milestones);
  const systemRailAllowed = ['architecture', 'architecture-dark', 'strategy-map'].includes(type) ||
    signals.hasArchitecture ||
    Boolean(s.layers || s.architecture || s.systemMap || s.topology || s.capabilityMap || s.platformCapabilities || s.valueChain || s.capitals);
  const productMatrixAllowed = productProofSignal ||
    ['product-showcase', 'case-gallery', 'gallery', 'portfolio'].includes(type) ||
    Array.isArray(s.products) ||
    Array.isArray(s.productStory);
  const energyCurveAllowed = plan.industry !== 'energy-utility' || s.loadCurve || s.loadCurveBand || s.curve || s.trend || s.monthlyTrend || s.monthlyPulse ||
    /曲线|趋势|负荷|SOC|load|curve|trend|pulse/i.test(flattenText(s));
  const filtered = components
    .filter(component => !avoid.has(component.id))
    .filter(component => type !== 'portfolio-table' || !['kpi-strip', 'metric-strip', 'chart-commentary-panel', 'product-matrix'].includes(component.id))
    .filter(component => !['risk-register', 'risk-matrix'].includes(component.id) || riskRegisterAllowed)
    .filter(component => component.id !== 'process-rail' || processRailAllowed)
    .filter(component => component.id !== 'system-rail' || systemRailAllowed)
    .filter(component => component.id !== 'product-matrix' || productMatrixAllowed)
    .filter(component => component.id !== 'load-curve-band' || energyCurveAllowed)
    .filter(component => component.id !== 'source-note' || hasExplicitVisibleSource)
    .filter(component => {
      const capability = componentCapabilityFor(component.id);
      if (!capability || capability.ownershipPolicy !== 'native-only') return true;
      if (component.required !== false) return true;
      if (!isSystemPlannedComponent(component)) return true;
      return nativeOnlyOptionalComponentAllowed(plan, s, component, signals);
    });
  const unknownComponents = [];
  const knownComponents = filtered
    .map(component => {
      const capability = componentCapabilityFor(component.id);
      if (!capability) {
        unknownComponents.push({
          id: component.id,
          source: component.source || '',
          required: component.required !== false
        });
        return null;
      }
      return Object.assign({}, component, {
        supportedModes: capability.supportedModes,
        allowedModes: component.allowedModes || component.allowed_modes || capability.supportedModes,
        ownershipPolicy: capability.ownershipPolicy,
        componentFamily: capability.family,
        dataRequirements: component.dataRequirements || capability.dataRequirements || [],
        slotPolicy: component.slotPolicy || component.slot_policy || (capability.supportedModes.includes('overlay') ? 'declared-safe-slot-required' : 'native-evidence-required'),
        repairPolicy: component.repairPolicy || component.repair_policy || (component.required === false ? 'optional-drop-allowed' : 'no-unplanned-repair'),
        priority: component.priority || (component.required === false ? 'optional' : 'required')
      });
    })
    .filter(Boolean);

  return {
    version: 'component-plan/v1',
    strategy: 'component-composition',
    proofObject,
    themeIntent,
    components: knownComponents,
    componentIds: knownComponents.map(c => c.id),
    unknownComponents,
    rulesApplied: compactUnique(rulesApplied),
    riskMatrixPolicy: riskMatrixExplicit ? 'render-only-when-explicit' : 'not-default'
  };
}

function zonePlanFor(plan = {}, s = {}, signals = contentSignals(plan, s), design = slideDesign(plan, s)) {
  const type = s.type || '';
  const variant = s.layoutVariant || '';
  if (['cover', 'closing'].includes(type)) {
    return { primaryZone: 'hero-claim', secondaryZone: 'visual-anchor', proofZone: 'meta-or-contact-block' };
  }
  if (type === 'company-profile-spread') {
    return { primaryZone: 'left-company-story', secondaryZone: 'right-real-image', proofZone: 'bottom-metric-strip' };
  }
  if (type === 'case-gallery') {
    if (variant === 'case-hero') return { primaryZone: 'left-hero-image', secondaryZone: 'right-evidence-list', proofZone: 'image-caption-bar' };
    if (variant === 'evidence-board') return { primaryZone: 'evidence-grid', secondaryZone: 'caption-system', proofZone: 'source-note' };
    return { primaryZone: 'image-story', secondaryZone: 'caption-and-context', proofZone: 'evidence-labels' };
  }
  if (['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type)) {
    return { primaryZone: 'metric-readout', secondaryZone: 'explanation-panel', proofZone: 'driver-or-caveat-strip' };
  }
  if (['architecture', 'architecture-dark', 'strategy-map'].includes(type)) {
    return { primaryZone: 'system-map', secondaryZone: 'claim-panel', proofZone: 'connector-rail' };
  }
  if (['timeline', 'timeline-dark'].includes(type)) {
    return { primaryZone: 'process-rail', secondaryZone: 'phase-cards', proofZone: 'control-points' };
  }
  if (['risk-table', 'table'].includes(type)) {
    return { primaryZone: 'risk-or-control-board', secondaryZone: 'owner/action-detail', proofZone: 'priority-signal' };
  }
  if (signals.isDenseText) return { primaryZone: 'editorial-summary', secondaryZone: 'structured-evidence', proofZone: 'source-note' };
  return { primaryZone: 'claim', secondaryZone: 'supporting-points', proofZone: design && design.wantsImage ? 'proof-image' : 'accent-rail' };
}

function compositionPlan(plan = {}, s = {}, index = 0, total = 1, signals = contentSignals(plan, s, index, total), recipe = null, design = slideDesign(plan, s)) {
  const themeIntent = themeIntentFor(plan, s, index, total, signals);
  const accentRole = accentRoleFor(plan, s, index, total, themeIntent, signals);
  const visualDensity = visualDensityFor(plan, s, index, total, signals);
  const intentSlide = Object.assign({}, s, { themeIntent, accentRole });
  const coverage = themeCoverageFor(plan, intentSlide, signals, slideRole(s), themeIntent);
  const composition = compositionNameFor(plan, intentSlide, s.type, s.layoutVariant, signals, themeIntent);
  const layoutPlan = zonePlanFor(plan, s, signals, design);
  const dialect = industryDesignDialect(plan);
  const dialectComponents = dialectComponentsFor(plan, s);
  const recipeComponents = recipe && Array.isArray(recipe.componentHints) ? recipe.componentHints : [];
  return {
    version: 'composition-plan/v1',
    composition,
    layoutPlan,
    themeIntent,
    accentRole,
    layoutEnergy: layoutEnergyFor(plan, s, index, total, themeIntent, signals),
    visualDensity,
    rhythmTransition: rhythmTransitionFor(plan, s, index, total, themeIntent),
    backgroundTone: backgroundToneFor(plan, s, index, total, coverage),
    themeCoverage: coverage,
    primaryZone: layoutPlan.primaryZone,
    secondaryZone: layoutPlan.secondaryZone,
    proofZone: layoutPlan.proofZone,
    primaryColorUse: primaryColorUseFor(plan, intentSlide, signals, coverage, themeIntent, accentRole),
    semanticColorRoles: semanticColorRolesFor(plan, accentRole),
    imageTreatment: imageTreatmentFor(plan, s, design, signals),
    microComponents: compactUnique([
      ...microComponentsFor(plan, intentSlide, signals, design, themeIntent, accentRole),
      ...recipeComponents.slice(0, 8)
    ]),
    rhythmRole: rhythmRoleFor(plan, s, index, total),
    industryExpression: {
      dialect: dialect.name || '',
      motif: dialect.motif || '',
      principle: dialect.principle || '',
      primaryColorLogic: dialect.primaryColorLogic || '',
      components: dialectComponents
    },
    referenceRecipeId: recipe ? recipe.id : '',
    density: visualDensity
  };
}

function flattenText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(flattenText).filter(Boolean).join(' ');
  if (typeof value === 'object') {
    return Object.keys(value)
      .filter(k => ![
        'image',
        'images',
        'visual',
        'media',
        'referenceRecipe',
        'previousLayoutVariant',
        'previousVariant',
        'previousProofObject',
        'previousChartSpec',
        'generatedAssetPrompt',
        'semanticIntent',
        'semanticConfidence',
        'semanticPurpose',
        'semanticRelations',
        'semanticScores',
        'industryEntities',
        'candidateProofObjects',
        'narrativeRole',
        'proofObject',
        'proof',
        'assetGeneration',
        'compositionPlan',
        'componentPlan',
        'layoutPlan',
        'sourceTrace',
        'sourceIds',
        'source_ids',
        'evidenceIds',
        'evidence_ids',
        'sources',
        'materialIntelligence'
      ].includes(k))
      .map(k => flattenText(value[k]))
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

function keywordHit(text, names = []) {
  const lower = String(text || '').toLowerCase();
  return names.some(k => lower.includes(String(k).toLowerCase()));
}

function matchKeywordList(text, names = []) {
  const lower = String(text || '').toLowerCase();
  return names
    .filter(k => lower.includes(String(k).toLowerCase()))
    .map(String);
}

function camelProofField(id = '') {
  const parts = String(id || '').split(/[^a-z0-9]+/i).filter(Boolean);
  if (!parts.length) return '';
  return parts[0] + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}

function routeForPackProof(id = '') {
  const value = String(id || '');
  if (/kpi|scorecard|revenue|growth|conversion|metric/i.test(value)) return `metric-comparison:${value}`;
  if (/matrix|risk|governance|assurance|control|policy/i.test(value)) return `risk-table:${value}`;
  if (/map|process|creation|model|blueprint|topology|capability|workflow|journey|world/i.test(value)) return `strategy-map:${value}`;
  if (/gallery|proof|photo|mosaic|evidence|product|people|place|story|cover|lookbook/i.test(value)) return `case-gallery:${value}`;
  if (/mission|culture|principle|statement|value/i.test(value)) return `manifesto:${value}`;
  return value;
}

function keywordsForPackProof(id = '', pack = {}) {
  const words = String(id || '').split(/[-_]/).filter(Boolean);
  const zh = {
    beauty: ['美妆', '美容', '品牌', '产品', '包装', '门店', '会员'],
    consumer: ['消费', '品牌', '零售', '渠道', '会员', '复购'],
    culture: ['文化', '使命', '愿景', '价值观', '团队', '招聘'],
    government: ['政府', '园区', '政策', '治理', '国企', '招商'],
    public: ['公共', '政策', '治理', '服务'],
    food: ['食品', '餐饮', '产品', '体验'],
    tourism: ['文旅', '旅游', '空间', '路线', '客群'],
    fashion: ['时尚', 'lookbook', '产品', '穿搭'],
    finance: ['财报', '投资', '风险', '收益', '组合'],
    saas: ['SaaS', '平台', '工作流', '采用', '留存'],
    healthcare: ['医疗', '护理', '患者', '质控', '服务']
  };
  const packText = `${pack.labelZh || ''} ${pack.labelEn || ''} ${(pack.aliases || []).join(' ')}`.toLowerCase();
  const expanded = Object.entries(zh).flatMap(([key, values]) => {
    return packText.includes(key) || words.includes(key) ? values : [];
  });
  return compactUnique([...words, ...expanded, valueTitle(id)]);
}

function valueTitle(id = '') {
  return String(id || '').replace(/[-_]/g, ' ').trim();
}

function profileFromIndustryPack(pack = {}) {
  if (!pack || !pack.id) return null;
  const proofObjects = (pack.proofObjects || []).map(id => ({
    id,
    route: routeForPackProof(id),
    fields: [camelProofField(id), id],
    keywords: keywordsForPackProof(id, pack),
    depth: /risk|governance|assurance|policy|control/i.test(id) ? 'risk-governance' :
      (/metric|kpi|scorecard|growth|conversion|revenue/i.test(id) ? 'business-metric' :
        (/gallery|photo|proof|evidence|mosaic|product|people|place|cover/i.test(id) ? 'evidence-proof' : 'system-map'))
  }));
  return {
    label: pack.labelZh || pack.labelEn || pack.id,
    narrativeArchetype: (pack.recommendedOutline || []).join(' -> '),
    entities: {
      asset: compactUnique([...(pack.proofObjects || []), ...(pack.pageFamilies || [])]),
      actor: [],
      risk: pack.forbiddenTemplates || [],
      metric: (pack.qaFocus || []).filter(Boolean)
    },
    proofObjects,
    depthGates: {
      minProofObjects: Math.min(3, Math.max(2, proofObjects.length >= 4 ? 2 : 1)),
      requiredDomains: compactUnique(proofObjects.slice(0, 2).map(p => p.depth))
    },
    pack
  };
}

function industryKnowledgeProfile(plan = {}) {
  const id = normalizeIndustryId(plan.industry);
  const visualId = visualIndustryId(id);
  const packProfile = profileFromIndustryPack(industryPackFor(id));
  return INDUSTRY_KNOWLEDGE_BASE[id] ||
    packProfile ||
    INDUSTRY_KNOWLEDGE_BASE[visualId] ||
    profileFromIndustryPack(industryPackFor(visualId)) ||
    null;
}

function fieldHitScore(s = {}, fields = []) {
  return fields.reduce((score, field) => {
    const value = s[field];
    if (Array.isArray(value)) return score + (value.length ? 4 : 0);
    return score + (value != null && value !== false && value !== '' ? 4 : 0);
  }, 0);
}

function industryProofCandidates(plan = {}, s = {}, signals = contentSignals(plan, s)) {
  const profile = industryKnowledgeProfile(plan);
  if (!profile || !Array.isArray(profile.proofObjects)) return [];
  const text = flattenText(s);
  return profile.proofObjects
    .map(proof => {
      const fieldScore = fieldHitScore(s, proof.fields || []);
      const keywordHits = matchKeywordList(text, proof.keywords || []);
      let score = fieldScore + keywordHits.length * 1.8;
      if (signals.hasMetrics && /metric|scorecard|bridge|analysis|model/i.test(proof.depth || '')) score += 1.2;
      if (signals.hasGallery && /proof|evidence|editorial|product/i.test(proof.depth || '')) score += 1.2;
      if (signals.hasLoop && /loop|control|governance/i.test(proof.depth || '')) score += 1.2;
      if (signals.hasArchitecture && /map|architecture|system/i.test(proof.depth || '')) score += 1.2;
      return Object.assign({}, proof, {
        score: Number(score.toFixed(2)),
        fieldScore,
        keywordHits
      });
    })
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score);
}

function semanticRelationProfile(text = '') {
  return Object.entries(SEMANTIC_RELATION_PATTERNS).reduce((acc, [name, pattern]) => {
    acc[name] = pattern.test(text);
    return acc;
  }, {});
}

function semanticMeaning(plan = {}, s = {}, signals = contentSignals(plan, s)) {
  const profile = industryKnowledgeProfile(plan);
  const text = flattenText(s);
  const entityMatches = {};
  if (profile && profile.entities) {
    Object.entries(profile.entities).forEach(([type, keywords]) => {
      const hits = matchKeywordList(text, keywords).slice(0, 8);
      if (hits.length) entityMatches[type] = hits;
    });
  }
  const relations = semanticRelationProfile(text);
  const proofCandidates = industryProofCandidates(plan, s, signals);
  const bestProof = proofCandidates[0] || null;
  const entityCount = Object.values(entityMatches).reduce((sum, hits) => sum + hits.length, 0);
  const relationCount = Object.values(relations).filter(Boolean).length;
  const claimText = String(s.claim || s.subtitle || s.title || '').trim();
  const evidenceSignals = [
    signals.hasMetrics,
    signals.hasGallery || signals.hasCaseComparison,
    signals.hasRisk || signals.hasResponsibilityLoop,
    Boolean(bestProof && bestProof.score >= 3),
    relations.evidence
  ].filter(Boolean).length;
  const actionSignals = [
    Boolean(s.decision || s.summary),
    Array.isArray(s.actions) && s.actions.length > 0,
    relations.decision,
    relations.ownership
  ].filter(Boolean).length;
  const claimStrength = Math.min(1, (claimText.length >= 10 ? 0.35 : 0) + (claimText.length >= 22 ? 0.2 : 0) + Math.min(0.45, evidenceSignals * 0.15));
  const evidenceStrength = Math.min(1, evidenceSignals * 0.2 + Math.min(0.3, (bestProof ? bestProof.score : 0) / 18));
  const actionability = Math.min(1, actionSignals * 0.25 + (entityMatches.actor ? 0.2 : 0));
  const semanticDensity = Math.min(1, (entityCount * 0.05) + (relationCount * 0.12) + (signals.numbers * 0.025) + (signals.imageCount * 0.04));
  const industryFit = Math.min(1, (entityCount * 0.07) + (bestProof ? Math.min(0.45, bestProof.score / 18) : 0) + (profile ? 0.08 : 0));
  const materialPurpose = bestProof ? 'industry-proof' :
    (relations.decision ? 'decision' :
      (relations.cause || relations.dependency ? 'logic' :
        (relations.evidence || signals.hasGallery ? 'evidence' :
          (signals.hasMetrics ? 'metric' : 'narrative'))));
  return {
    industry: plan.industry || '',
    profileLabel: profile ? profile.label : '',
    narrativeArchetype: profile ? profile.narrativeArchetype : '',
    entities: entityMatches,
    relations,
    proofCandidates,
    bestProofObject: bestProof ? bestProof.id : '',
    bestProofRoute: bestProof ? bestProof.route : '',
    materialPurpose,
    scores: {
      claimStrength: Number(claimStrength.toFixed(2)),
      evidenceStrength: Number(evidenceStrength.toFixed(2)),
      actionability: Number(actionability.toFixed(2)),
      semanticDensity: Number(semanticDensity.toFixed(2)),
      industryFit: Number(industryFit.toFixed(2))
    }
  };
}

function contentSignals(plan = {}, s = {}, index = 0, total = 1) {
  const signalTokens = (VISUAL_SYSTEM.contentIntelligence && VISUAL_SYSTEM.contentIntelligence.signals) || {};
  const text = overlapText(s) || flattenText(s);
  const numbers = text.match(/[+-]?\d[\d,]*(?:\.\d+)?\s*(?:%|％|pt|bps|倍|億円|百万円|万元|亿元|人|件|台|MW|MWh)?/g) || [];
  const metricNumbers = numbers.filter(n => /%|％|pt|bps|倍|億円|百万円|万元|亿元|人|件|台|MW|MWh/i.test(n));
  const strongMetricWords = ['%', '％', 'KPI', 'YoY', 'revenue', 'profit', '收入', '利润', '同比', '环比', '売上', '営業利益'];
  const weakMetricWords = ['达成', '目标'];
  const hasStrongMetricWord = keywordHit(text, strongMetricWords);
  const hasMetricWord = hasStrongMetricWord || keywordHit(text, weakMetricWords);
  const beforeAfterImageCount = (s.before && (typeof s.before === 'string' || s.before.image || s.before.img) ? 1 : 0) +
    (s.after && (typeof s.after === 'string' || s.after.image || s.after.img) ? 1 : 0);
  const imageCount = (Array.isArray(s.images) ? s.images.length : 0) +
    ((s.visual && Array.isArray(s.visual.images)) ? s.visual.images.length : 0) +
    beforeAfterImageCount;
  const cardCount = Array.isArray(s.cards) ? s.cards.length : 0;
  const itemCount = Array.isArray(s.items) ? s.items.length : 0;
  const phaseCount = Array.isArray(s.phases) ? s.phases.length : 0;
  const actionCount = Array.isArray(s.actions) ? s.actions.length : 0;
  const stepCount = Array.isArray(s.steps) ? s.steps.length : 0;
  const flywheelCount = Array.isArray(s.flywheel) ? s.flywheel.length : 0;
  const layerCount = Array.isArray(s.layers) ? s.layers.length : 0;
  const rowCount = Array.isArray(s.rows) ? s.rows.length : 0;
  const riskCount = Array.isArray(s.risks) ? s.risks.length : 0;
  const controlCount = Array.isArray(s.controls) ? s.controls.length : 0;
  const metricCount = Array.isArray(s.metrics) ? s.metrics.length : 0;
  const productCount = Array.isArray(s.products) ? s.products.length : 0;
  const responsibilityCount = (Array.isArray(s.responsibilities) ? s.responsibilities.length : 0) +
    (Array.isArray(s.owners) ? s.owners.length : 0) +
    (Array.isArray(s.raci) ? s.raci.length : 0) +
    (Array.isArray(s.accountabilities) ? s.accountabilities.length : 0);
  const textBlocks = [
    s.title,
    s.subtitle,
    s.claim,
    s.intro,
    s.note,
    ...(Array.isArray(s.cards) ? s.cards.map(c => `${c.title || ''} ${c.body || c.text || ''}`) : []),
    ...(Array.isArray(s.items) ? s.items.map(flattenText) : []),
    ...(Array.isArray(s.rows) ? s.rows.map(flattenText) : [])
  ].filter(Boolean);
  const avgBlockLength = textBlocks.length ? textBlocks.join('').length / textBlocks.length : text.length;
  const hasExplicitShowcase = (s.visual && s.visual.role === 'showcase') || !!s.product || productCount > 0;
  const hasProductWord = /产品|商品|SKU|系列|套件|设备产品|设备接入包|器械|药品|资产包|方案包|界面|屏幕|模块|lineup|catalog|product|showcase|interface/i.test(text);
  const hasOeeWord = /OEE|稼动|稼動|停机|停線|停线|产线|產線|产能|良率|MTTR|MTBF|设备效率|設備效率|维修效率|維修效率|line efficiency/i.test(text);
  const hasServiceBlueprintWord = /服务蓝图|服務藍圖|服务触点|服務觸點|患者旅程|旅程地图|journey map|service blueprint|frontstage|backstage|到院|导诊|導診|护理交接|檢查協同|检查协同/i.test(text) || /service-blueprint/i.test(String(plan.documentType || ''));
  const hasLookbookWord = /lookbook|产品故事|產品故事|商品故事|品牌故事|门店场景|門店場景|陈列|陳列|搭配|穿搭|视觉图册|視覺圖冊|空间体验|空間體驗/i.test(text);
  const hasSaasCapabilityWord = /平台能力|能力地图|能力架构|产品平台|工作流|自动化|自動化|集成|审计日志|審計日誌|SSO|API|web app|admin console|workflow|automation|integration|audit|platform capability/i.test(text);
  const hasLoopWord = /闭环|循环|飞轮|复盘|反馈|loop|cycle|flywheel|feedback/i.test(text);
  const hasFlywheelWord = /飞轮|增长闭环|运营闭环|复利|growth loop|flywheel|compounding/i.test(text);
  const hasGovernanceWord = /治理|责任|审批|权限|风控|内控|合规|审计|控制|control|governance|compliance|audit/i.test(text);
  const hasResponsibilityWord = /责任闭环|责任人|责任矩阵|定责|协同责任|留痕|RACI|owner|accountable|SLA/i.test(text);
  const hasNegatedRiskLanguage = /不是[^。；,，]*风险|非风险|无风险结构|not\s+(?:a\s+)?risk/i.test(text);
  const hasRiskLanguage = !hasNegatedRiskLanguage && (
    keywordHit(text, signalTokens.risk) ||
    /风险|授权|合规|隐私|安全|故障|停机|告警|risk|warning|hazard|exposure/i.test(text)
  );
  const hasCaseComparison = !!s.before || !!s.after || !!s.beforeAfter || (!!s.case && /对比|before|after|升级前|升级后/i.test(text)) || (imageCount >= 2 && /对比|before|after|升级前|升级后|改造前|改造后/i.test(text));
  const densityMode = String(s.density || s.contentDensity || plan.contentDensity || plan.densityProfile || '').toLowerCase();
  const logicChainMatches = text.match(/因果|逻辑链|链路|输入|输出|产出|结果|驱动|依赖|转化|路径|input|output|outcome|driver|causal|chain/gi) || [];
  const hasNamedLogicChain = /因果|逻辑链|链路|价值路径|价值创造|value creation|causal chain/i.test(text);
  const hasLogicChainWord = hasNamedLogicChain || logicChainMatches.length >= 2 ||
    /input|output|outcome|driver|causal|chain/i.test(text);
  const hasStructuredLogic = !!s.valueChain || !!s.capitals ||
    ((s.drivers || s.inputs) && (s.outcomes || s.outputs)) ||
    ((Array.isArray(s.left) && s.left.length) && (Array.isArray(s.right) && s.right.length) && (cardCount || itemCount));
  const isTextHeavy = densityMode.includes('text') || densityMode.includes('report') || text.length > 520 || avgBlockLength > 86 || rowCount >= 6 || cardCount >= 7 || itemCount >= 9;
  const isImageHeavy = densityMode.includes('image') || densityMode.includes('gallery') || plan.visualIntent === 'image-rich' || plan.visualIntent === 'case-led' || imageCount >= 3;
  const isNumberHeavy = densityMode.includes('number') || densityMode.includes('metric') || metricCount >= 3 || metricNumbers.length >= 3 || (numbers.length >= 3 && (hasStrongMetricWord || (hasMetricWord && metricNumbers.length >= 1)));
  const hasExplicitProcessStructure = phaseCount > 0 || actionCount > 0 || stepCount > 0 ||
    Array.isArray(s.timeline) || Array.isArray(s.milestones);
  const hasStructuredLoop = flywheelCount > 0 || Array.isArray(s.loopItems) || (hasLoopWord && hasExplicitProcessStructure);
  const hasExplicitRiskStructure = rowCount > 0 || riskCount > 0 || controlCount > 0 || Boolean(s.riskRegister || s.riskMatrix || s.controlsMatrix || s.matrix);
  const hasExplicitArchitectureStructure = layerCount > 0 || Boolean(s.architecture || s.systemMap || s.topology || s.capabilityMap || s.platformCapabilities);
  const explicitTimelineType = ['timeline', 'timeline-dark'].includes(String(s.type || '')) || /timeline|process|pathway/i.test(String(s.layoutVariant || s.variant || ''));
  const explicitRiskType = ['risk-table'].includes(String(s.type || '')) || /risk|materiality/i.test(String(s.layoutVariant || s.variant || s.proofObject || ''));
  const explicitArchitectureType = ['architecture', 'architecture-dark'].includes(String(s.type || '')) || /architecture|topology|blueprint|capability-map|service-blueprint/i.test(String(s.layoutVariant || s.variant || s.proofObject || ''));
  const hasLogicChain = hasLogicChainWord || hasStructuredLogic || ((s.drivers || s.actions || s.outcomes) && (cardCount || itemCount || phaseCount));
  return {
    index,
    total,
    textLength: text.length,
    numbers: numbers.length,
    imageCount,
    cardCount,
    itemCount,
    phaseCount,
    actionCount,
    stepCount,
    flywheelCount,
    layerCount,
    rowCount,
    riskCount,
    controlCount,
    metricCount,
    productCount,
    responsibilityCount,
    avgBlockLength,
    first: index === 0,
    last: index === total - 1,
    isDenseText: text.length > 380 || avgBlockLength > 72 || rowCount >= 5 || cardCount >= 6 || itemCount >= 8,
    hasMetrics: metricCount > 0 || metricNumbers.length >= 1 || (numbers.length >= 2 && hasStrongMetricWord),
    hasTimeline: explicitTimelineType || hasExplicitProcessStructure,
    hasLoop: hasStructuredLoop,
    hasFlywheel: flywheelCount > 0 || Array.isArray(s.loopItems) || hasFlywheelWord,
    hasStrategyMap: !!s.valueChain || !!s.capitals || !!s.drivers || !!s.actions || !!s.outcomes || keywordHit(text, signalTokens.strategy),
    hasArchitecture: explicitArchitectureType || hasExplicitArchitectureStructure,
    hasProductShowcase: hasExplicitShowcase || (hasProductWord && imageCount <= 1 && !/图册|案例集|gallery|portfolio/i.test(text)),
    hasCaseSignal: keywordHit(text, signalTokens.case),
    hasGallery: imageCount >= 2 || (s.visual && s.visual.role === 'gallery'),
    hasManifesto: !!s.statement || !!s.values || keywordHit(text, signalTokens.culture),
    hasRisk: explicitRiskType || hasExplicitRiskStructure,
    hasRiskLanguage,
    hasGovernance: hasGovernanceWord,
    hasResponsibilityLoop: responsibilityCount > 0 || (hasResponsibilityWord && (rowCount > 0 || hasGovernanceWord)),
    hasComparison: /对比|before|after|升级前|升级后|调整前|调整后|from\s+.+\s+to/i.test(text),
    hasCaseComparison,
    densityMode,
    isTextHeavy,
    isImageHeavy,
    isNumberHeavy,
    hasLogicChain,
    hasNamedLogicChain,
    hasStructuredLogic,
    hasOeeBoard: hasOeeWord,
    hasServiceBlueprint: hasServiceBlueprintWord,
    hasLookbook: hasLookbookWord,
    hasSaasCapability: hasSaasCapabilityWord,
    hasProfile: !!s.company || !!s.description || /公司简介|企业简介|能力证明|company profile|about us|会社概要|成立|资质|客户数量|团队规模|团队能力/i.test(text),
    hasQuote: /引用|客户声音|员工声音|testimonial|quote|interview|message|voice/i.test(text),
    hasChapter: /章节|chapter|section|part\s*\d|agenda/i.test(text),
    hasDenseCards: cardCount >= 5 || itemCount >= 6,
    hasSplitProblem: cardCount >= 3 && /问题|痛点|诉求|挑战|断点|breakpoint/i.test(text)
  };
}

function hasArrayField(s = {}, fields = []) {
  return fields.some(k => Array.isArray(s[k]) && s[k].length);
}

function hasValueField(s = {}, fields = []) {
  return fields.some(k => s[k] != null && s[k] !== false && s[k] !== '');
}

function hasExplicitIndustryChartData(s = {}) {
  const dataComponent = String(s.dataComponent || s.data_component || '').toLowerCase();
  const chartDataComponent = /chart|matrix|scatter|bubble|efficiency|channel|media|roas|roi|monthly|trend|pulse|line|waterfall|bridge|pareto|sensitivity|handoff|funnel|scorecard|table|bar|kpi/.test(dataComponent) &&
    !/milestone|timeline|process|gallery|proof|portfolio|case|product/.test(dataComponent);
  const chartSpecLooksProcessDerived = s.chartSpec && /timeline|process|milestone/.test(`${s.chartSpec.id || ''} ${dataComponent}`);
  return Boolean((s.chartSpec && !chartSpecLooksProcessDerived) || s.chartKind || s.chart_kind || chartDataComponent) ||
    hasValueField(s, [
      'downtimePareto',
      'pareto',
      'lossPareto',
      'oeeLosses',
      'valuationSensitivity',
      'sensitivity',
      'exitScenarios',
      'irrSensitivity',
      'qualityHandoff',
      'handoffs',
      'handoffMap',
      'patientBottlenecks',
      'waitBottlenecks',
      'memberCohorts',
      'cohorts',
      'rfmLadder',
      'channelEfficiency',
      'mediaEfficiency',
      'scatter',
      'channels',
      'monthlyPulse',
      'monthlyTrend',
      'trend',
      'waterfallBridge',
      'targetBridge',
      'dispatchMap',
      'siteDispatch',
      'loadStorageDispatch',
      'adoptionFunnel',
      'activationFunnel',
      'cohortFunnel'
    ]);
}

function staleIndustryChartRouteShouldYieldToProcess(s = {}, signals = contentSignals({}, s)) {
  if (String(s.type || '') !== 'industry-chart' || !signals.hasTimeline) return false;
  if (hasExplicitIndustryChartData(s)) return false;
  const routeText = `${s.layoutVariant || ''} ${s.variant || ''} ${s.proofObject || s.proof_object || ''} ${s.themeIntent || ''}`;
  return /timeline|process|pathway|operating-path|process-board|阶段|路径|落地|推进/i.test(routeText) ||
    (Array.isArray(s.phases) && s.phases.length >= 2);
}

function dataGrammarVariant(plan = {}, s = {}, signals = contentSignals(plan, s)) {
  const industry = plan.industry || '';
  const visualIndustry = visualIndustryId(industry);
  const isRetail = industry === 'brand-retail' || industry === 'beauty-consumer' || visualIndustry === 'brand-retail';
  const text = flattenText(s);
  const dataComponent = String(s.dataComponent || s.data_component || s.proofObject || s.proof_object || '').toLowerCase();
  if (hasValueField(s, ['waterfallBridge', 'targetBridge']) || /waterfall|bridge|target-?bridge|目标桥|目标差额|缺口/.test(dataComponent)) return 'waterfall-bridge';
  if (hasValueField(s, ['monthlyPulse', 'monthlyTrend']) || /monthly|trend|pulse|line|月度|趋势|脉冲/.test(dataComponent)) return 'monthly-pulse-trend';
  if (hasValueField(s, ['channelEfficiency', 'mediaEfficiency', 'scatter', 'channels']) || /scatter|bubble|efficiency|channel|media|roas|roi|渠道|投放/.test(dataComponent)) return 'channel-efficiency-matrix';
  if (isRetail && /投放|花费|ROAS|ROI|渠道|搜索|广告|抖音|小红书|KOC|KOL|通勤防晒|media efficiency/i.test(text)) return 'channel-efficiency-matrix';
  if (isRetail && /月度|月脉冲|低谷|1月|2月|3月|一月|二月|三月|环比|同比|趋势|拉回来|monthly|pulse/i.test(text)) return 'monthly-pulse-trend';
  if (isRetail && /目标差额|目标桥|增长桥|缺口|Q2目标|净销|GMV|退款|实收|导出GMV|财务净销|waterfall|bridge/i.test(text)) return 'waterfall-bridge';
  return '';
}

function industryChartVariant(plan = {}, s = {}, signals = contentSignals(plan, s)) {
  const industry = plan.industry || '';
  const visualIndustry = visualIndustryId(industry);
  const text = flattenText(s);
  const grammarVariant = dataGrammarVariant(plan, s, signals);
  if (grammarVariant) return grammarVariant;
  const chartProof = industryProofCandidates(plan, s, signals)
    .find(p => String(p.route || '').startsWith('industry-chart:') && p.score >= 3);
  if (chartProof) return String(chartProof.route).split(':')[1] || chartProof.id;
  if (hasValueField(s, ['downtimePareto', 'pareto', 'lossPareto', 'oeeLosses']) || /停机.*(Pareto|帕累托|TOP|排行)|故障.*(Pareto|帕累托)|节拍损失|OEE.*损失/i.test(text)) return 'downtime-pareto';
  if (hasValueField(s, ['valuationSensitivity', 'sensitivity', 'exitScenarios', 'irrSensitivity']) || /敏感性|估值矩阵|退出情景|IRR.*DPI|valuation sensitivity|scenario/i.test(text)) return 'valuation-sensitivity';
  if (hasValueField(s, ['qualityHandoff', 'handoffs', 'handoffMap']) || /交接|handoff|护理交接|科室交接|质量交接/i.test(text)) return 'quality-handoff';
  if (hasValueField(s, ['patientBottlenecks', 'waitBottlenecks']) || /等待瓶颈|排队瓶颈|患者等待|候诊|bottleneck/i.test(text)) return 'patient-bottleneck';
  if (hasValueField(s, ['memberCohorts', 'cohorts', 'rfmLadder']) || /会员分层|RFM| cohort|复购阶梯|客群阶梯/i.test(text)) return 'member-cohort-ladder';
  if (hasValueField(s, ['channelEfficiency', 'mediaEfficiency', 'scatter', 'channels'])) return 'channel-efficiency-matrix';
  if (hasValueField(s, ['monthlyPulse', 'monthlyTrend', 'trend'])) return 'monthly-pulse-trend';
  if (hasValueField(s, ['waterfallBridge', 'targetBridge'])) return 'waterfall-bridge';
  if (hasValueField(s, ['dispatchMap', 'siteDispatch', 'loadStorageDispatch']) || /调度地图|站点调度|负荷.*储能|SOC|dispatch/i.test(text)) return 'dispatch-map';
  if (hasValueField(s, ['adoptionFunnel', 'activationFunnel', 'cohortFunnel']) || /采用漏斗|激活漏斗|扩展漏斗|activation funnel|adoption funnel/i.test(text)) return 'adoption-funnel';
  if (industry === 'manufacturing-operations' && signals.hasOeeBoard) return 'downtime-pareto';
  if (industry === 'finance-investment' && signals.isNumberHeavy) return 'valuation-sensitivity';
  if (industry === 'healthcare-operations' && signals.hasServiceBlueprint) return 'quality-handoff';
  if ((industry === 'brand-retail' || industry === 'beauty-consumer' || visualIndustry === 'brand-retail') && /会员|复购|RFM|cohort/i.test(text)) return 'member-cohort-ladder';
  if (industry === 'energy-utility' && /站点|电站|储能|告警/i.test(text)) return 'dispatch-map';
  if (industry === 'saas-technology' && /采用|激活|留存|NRR|ARR/i.test(text)) return 'adoption-funnel';
  return 'evidence-readout';
}

function semanticFrame(plan = {}, s = {}, signals = contentSignals(plan, s)) {
  const text = flattenText(s);
  const lower = text.toLowerCase();
  const meaning = semanticMeaning(plan, s, signals);
  const scores = {
    product: 0,
    caseEvidence: 0,
    governance: 0,
    process: 0,
    architecture: 0,
    decision: 0,
    metric: 0,
    logicChain: 0,
    industryChart: 0
  };
  if (s.product || hasArrayField(s, ['products'])) scores.product += 5;
  if (signals.hasProductShowcase) scores.product += 3;
  if (signals.hasGallery || signals.hasCaseSignal || signals.hasCaseComparison) scores.caseEvidence += 4;
  if (signals.imageCount >= 3) scores.caseEvidence += 2;
  if (signals.hasGovernance || signals.hasRisk || signals.hasResponsibilityLoop) scores.governance += 4;
  if (signals.hasTimeline || signals.hasLoop || signals.hasFlywheel) scores.process += 4;
  if (signals.hasArchitecture || signals.layerCount >= 3) scores.architecture += 4;
  if (signals.last || s.decision || s.summary || hasArrayField(s, ['actions'])) scores.decision += 3;
  if (signals.hasMetrics || signals.isNumberHeavy) scores.metric += 4;
  if (signals.hasLogicChain || signals.hasStructuredLogic || signals.hasNamedLogicChain) scores.logicChain += 4;
  if (hasValueField(s, [
    'downtimePareto',
    'pareto',
    'lossPareto',
    'oeeLosses',
    'valuationSensitivity',
    'sensitivity',
    'exitScenarios',
    'irrSensitivity',
    'qualityHandoff',
    'handoffs',
    'handoffMap',
    'patientBottlenecks',
    'waitBottlenecks',
    'memberCohorts',
    'cohorts',
    'rfmLadder',
    'channelEfficiency',
    'mediaEfficiency',
    'scatter',
    'channels',
    'monthlyPulse',
    'monthlyTrend',
    'trend',
    'waterfallBridge',
    'targetBridge',
    'dispatchMap',
    'siteDispatch',
    'loadStorageDispatch',
    'adoptionFunnel',
    'activationFunnel',
    'cohortFunnel'
  ])) scores.industryChart += 8;
  if (/pareto|帕累托|敏感性|交接|瓶颈|调度|漏斗|cohort|funnel|dispatch|sensitivity|handoff|roas|roi|投放|渠道|月度|低谷|趋势|目标桥|目标差额|waterfall|bridge/i.test(lower)) scores.industryChart += 3;
  if (dataGrammarVariant(plan, s, signals)) scores.industryChart += 4;
  if (meaning.relations.evidence) scores.caseEvidence += 1.5;
  if (meaning.relations.cause || meaning.relations.dependency) scores.logicChain += 1.5;
  if (meaning.relations.ownership) scores.governance += 1.5;
  if (meaning.relations.decision) scores.decision += 1.5;
  if (meaning.scores.evidenceStrength >= 0.45) scores.metric += 0.8;
  if (meaning.bestProofRoute && String(meaning.bestProofRoute).startsWith('industry-chart:')) scores.industryChart += Math.min(6, Math.max(2, (meaning.proofCandidates[0] || {}).score || 0));
  else if (meaning.bestProofObject) {
    const route = String(meaning.bestProofRoute || '');
    if (route.startsWith('architecture:')) scores.architecture += 2;
    if (route.startsWith('timeline:')) scores.process += 2;
    if (route.startsWith('risk-table:')) scores.governance += 2;
    if (route.startsWith('case-gallery:')) scores.caseEvidence += 2;
    if (route.startsWith('metric-comparison:') || route === 'finance-bridge' || route === 'portfolio-table') scores.metric += 2;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [primaryIntent, topScore] = ranked[0] || ['unknown', 0];
  const variant = industryChartVariant(plan, s, signals);
  const proofObject = (() => {
    if (primaryIntent === 'industryChart') return variant;
    if (meaning.bestProofObject && ((meaning.proofCandidates[0] || {}).score >= 3)) return meaning.bestProofObject;
    if (signals.hasOeeBoard) return 'OEE';
    if (signals.hasServiceBlueprint) return 'service-blueprint';
    if (signals.hasSaasCapability) return 'platform-capability-map';
    if (signals.hasLookbook) return 'lookbook';
    if (signals.hasCaseComparison) return 'before-after-evidence';
    if (signals.hasGallery) return 'evidence-gallery';
    if (signals.hasMetrics) return 'metric-board';
    if (signals.hasResponsibilityLoop) return 'responsibility-loop';
    if (signals.hasLogicChain) return 'logic-chain';
    return primaryIntent === 'unknown' ? 'narrative-block' : primaryIntent;
  })();
  return {
    primaryIntent: topScore > 0 ? primaryIntent : 'narrative',
    secondaryIntents: ranked.filter(([, score]) => score > 0).slice(1, 4).map(([name]) => name),
    confidence: Math.min(1, Number((topScore / 8).toFixed(2))),
    proofObject,
    industryChartVariant: variant,
    semanticMeaning: meaning,
    scores
  };
}

function inferNarrativeRole(plan = {}, s = {}, index = 0, total = 1, semantic = semanticFrame(plan, s, contentSignals(plan, s, index, total))) {
  const type = s.type || '';
  const variant = s.layoutVariant || '';
  if (index === 0 || type === 'cover') return 'setup';
  if (index === total - 1 || type === 'closing') return 'decision';
  if (type === 'chapter-divider' || type === 'toc' || type === 'toc-clean') return 'orientation';
  if (['profile-proof', 'report-board', 'comparison'].includes(type)) return 'diagnosis';
  if (semantic.primaryIntent === 'caseEvidence' || type === 'case-gallery' || type === 'quote-proof') return 'evidence';
  if (semantic.primaryIntent === 'product' || type === 'product-showcase' || type === 'architecture') return 'solution';
  if (type === 'timeline' || variant.includes('loop')) return 'operating-model';
  if (type === 'risk-table') return 'governance';
  if (type === 'metric-comparison' || type === 'finance-bridge' || type === 'portfolio-table' || type === 'industry-chart') return 'proof';
  return semantic.primaryIntent || 'narrative';
}

const NARRATIVE_ORDER = {
  setup: 0,
  orientation: 1,
  diagnosis: 2,
  evidence: 3,
  proof: 4,
  solution: 5,
  'operating-model': 6,
  governance: 7,
  decision: 8
};

function routeKey(s = {}) {
  return s.layoutVariant ? `${s.type}:${s.layoutVariant}` : String(s.type || '');
}

function routeMatches(key = '', expected = '') {
  if (!key || !expected) return false;
  if (key === expected) return true;
  return !expected.includes(':') && key.startsWith(`${expected}:`);
}

function applyNarrativeMetadata(plan = {}, slides = []) {
  return slides.map((slide, i) => {
    const signals = contentSignals(plan, slide, i, slides.length);
    const semantic = semanticFrame(plan, slide, signals);
    const meaning = semantic.semanticMeaning || semanticMeaning(plan, slide, signals);
    const explicitProofObject = slide.proofObject || slide.proof_object;
    const variantProofObject = !explicitProofObject &&
      slide.layoutVariant &&
      HIGH_VALUE_PAGE_FAMILIES.has(slide.layoutVariant) &&
      layoutVariantCompatibleWithType(slide.type, slide.layoutVariant)
      ? slide.layoutVariant
      : '';
    const proofObject = explicitProofObject || variantProofObject || semantic.proofObject;
    const next = Object.assign({}, slide, {
      semanticIntent: slide.semanticIntent || semantic.primaryIntent,
      semanticConfidence: slide.semanticConfidence || semantic.confidence,
      proofObject,
      narrativeRole: slide.narrativeRole || inferNarrativeRole(plan, slide, i, slides.length, semantic),
      semanticPurpose: slide.semanticPurpose || meaning.materialPurpose,
      semanticRelations: slide.semanticRelations || Object.entries(meaning.relations || {}).filter(([, v]) => v).map(([k]) => k),
      industryEntities: slide.industryEntities || meaning.entities,
      semanticScores: slide.semanticScores || meaning.scores,
      candidateProofObjects: slide.candidateProofObjects || (meaning.proofCandidates || []).slice(0, 3).map(p => ({
        id: p.id,
        route: p.route,
        score: p.score
      }))
    });
    if (next.proof && next.proof.version === 'proof-object/v1' && /^slide-\d+$/i.test(String(next.proof.id || '')) && proofObject) {
      next.proof = Object.assign({}, next.proof, { id: proofObject });
    }
    return next;
  });
}

function sequenceSlidesByNarrative(plan = {}, slides = []) {
  if (slides.length <= 3) return slides;
  const first = slides[0];
  const last = slides[slides.length - 1];
  const middle = slides.slice(1, -1).map((slide, index) => ({ slide, index }));
  middle.sort((a, b) => {
    const ao = NARRATIVE_ORDER[a.slide.narrativeRole] ?? 4;
    const bo = NARRATIVE_ORDER[b.slide.narrativeRole] ?? 4;
    return ao === bo ? a.index - b.index : ao - bo;
  });
  return [first, ...middle.map(x => x.slide), last];
}

function deckNarrativeSummary(plan = {}, slides = []) {
  const roleCounts = slides.reduce((acc, slide) => {
    const role = slide.narrativeRole || 'narrative';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});
  const themeIntentCounts = slides.reduce((acc, slide) => {
    const intent = slide.themeIntent || (slide.compositionPlan && slide.compositionPlan.themeIntent) || 'unset';
    acc[intent] = (acc[intent] || 0) + 1;
    return acc;
  }, {});
  const routeCounts = slides.reduce((acc, slide) => {
    const key = routeKey(slide);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return {
    industry: plan.industry || '',
    documentType: plan.documentType || '',
    roleCounts,
    themeIntentCounts,
    routeCounts,
    proofObjects: slides.map(s => s.proofObject).filter(Boolean)
  };
}

function slideCaptionCount(slide = {}) {
  return (Array.isArray(slide.cards) ? slide.cards.length : 0) +
    (Array.isArray(slide.items) ? slide.items.length : 0) +
    (Array.isArray(slide.lookbook) ? slide.lookbook.length : 0) +
    (Array.isArray(slide.productStory) ? slide.productStory.length : 0) +
    ((slide.visual && slide.visual.caption) ? 1 : 0) +
    (slide.caption ? 1 : 0);
}

function hasCommercialLogicChain(slide = {}) {
  const logic = slide.businessLogic || slide.business_logic || slide.diagnosticChain || slide.diagnostic_chain || {};
  const logicHits = ['currentState', 'current_state', 'impact', 'cause', 'root_cause', 'action', 'metric', 'measure', 'kpi']
    .filter(key => logic && logic[key]);
  if (logicHits.length >= 2) return true;
  if ((slide.drivers || slide.inputs) && (slide.actions || slide.outcomes || slide.outputs)) return true;
  if (slide.before && slide.after) return true;
  const text = flattenText(slide);
  const signals = [
    /现状|当前|baseline|current/i,
    /影响|损失|差距|gap|impact/i,
    /原因|根因|驱动|cause|driver/i,
    /动作|措施|方案|action|response/i,
    /指标|衡量|结果|KPI|metric|result/i
  ].filter(re => re.test(text)).length;
  return signals >= 3;
}

function aestheticSlideScore(plan = {}, slide = {}, index = 0, total = 1) {
  const signals = contentSignals(plan, slide, index, total);
  const route = routeKey(slide);
  const meaning = semanticMeaning(plan, slide, signals);
  const flags = [];
  const dimensions = {
    hierarchy: 100,
    rhythm: 100,
    densityControl: 100,
    evidenceRelationship: 100,
    industryFit: 100
  };
  if (signals.isDenseText && !['report-board', 'strategy-map', 'risk-table', 'portfolio-table'].includes(slide.type)) {
    dimensions.densityControl -= 24;
    flags.push('denseTextOnLooseLayout');
  }
  if ((signals.cardCount >= 6 || signals.itemCount >= 8) && !['report-board', 'module-matrix', 'risk-table'].includes(slide.type)) {
    dimensions.densityControl -= 16;
    flags.push('cardOverload');
  }
  if (signals.imageCount >= 3 && slideCaptionCount(slide) < Math.min(3, signals.imageCount)) {
    dimensions.evidenceRelationship -= 30;
    flags.push('imageEvidenceWithoutLabels');
  }
  if (signals.imageCount >= 2 && !/case-gallery|product-showcase|portfolio/.test(slide.type || '')) {
    dimensions.evidenceRelationship -= 14;
    flags.push('imageMaterialOnNonEvidenceRoute');
  }
  if (slide.layoutRationale === 'default commercial split') {
    dimensions.rhythm -= 18;
    flags.push('defaultSplitFallback');
  }
  if (/executive-blocks|module-matrix/.test(route) && signals.cardCount >= 5 && meaning.scores.evidenceStrength < 0.35) {
    dimensions.hierarchy -= 18;
    dimensions.industryFit -= 16;
    flags.push('genericCardGrid');
  }
  if (meaning.scores.industryFit < 0.2 && plan.industry && !['cover', 'closing', 'chapter-divider', 'toc', 'toc-clean'].includes(slide.type)) {
    dimensions.industryFit -= 14;
    flags.push('weakIndustrySignal');
  }
  if ((String(slide.title || '').length > 28 || String(slide.claim || '').length > 92) && !signals.isDenseText) {
    dimensions.hierarchy -= 10;
    flags.push('longHeadline');
  }
  if ((slide.type === 'metric-comparison' || slide.type === 'industry-chart') && !hasCommercialLogicChain(slide)) {
    dimensions.evidenceRelationship -= 14;
    dimensions.industryFit -= 10;
    flags.push('metricWithoutBusinessLogic');
  }
  const score = Math.max(0, Math.round(Object.values(dimensions).reduce((a, v) => a + Math.max(0, v), 0) / Object.keys(dimensions).length));
  return {
    slide: index + 1,
    route,
    score,
    dimensions,
    flags,
    semanticPurpose: meaning.materialPurpose,
    industryFit: meaning.scores.industryFit
  };
}

function visualAestheticModel(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || normalizeDeckPlan(plan);
  const slides = normalized.slides || [];
  const slideScores = slides.map((slide, i) => aestheticSlideScore(normalized, slide, i, slides.length));
  const routeCounts = slideScores.reduce((acc, s) => {
    acc[s.route] = (acc[s.route] || 0) + 1;
    return acc;
  }, {});
  const roleCounts = slides.reduce((acc, slide) => {
    const role = slide.narrativeRole || slideRole(slide);
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});
  const themeIntentCounts = slides.reduce((acc, slide) => {
    const intent = slide.themeIntent || (slide.compositionPlan && slide.compositionPlan.themeIntent) || 'unset';
    acc[intent] = (acc[intent] || 0) + 1;
    return acc;
  }, {});
  const findings = [];
  slideScores.forEach(s => {
    if (s.score < 62) {
      findings.push({
        slide: s.slide,
        level: 'review',
        type: 'aestheticScore',
        message: `visual aesthetic score ${s.score}; flags: ${s.flags.join(', ') || 'low composition score'}`
      });
    }
  });
  const genericRoutes = ['executive-blocks', 'module-matrix', 'two-column', 'toc-clean'];
  const genericCount = Object.entries(routeCounts)
    .filter(([route]) => genericRoutes.some(g => route === g || route.startsWith(`${g}:`)))
    .reduce((sum, [, count]) => sum + count, 0);
  if (slides.length >= 8 && genericCount / slides.length > 0.42) {
    findings.push({
      level: 'review',
      type: 'visualTemplateFatigue',
      message: `${genericCount}/${slides.length} slides use generic information-board routes; deck needs stronger proof-object rhythm`
    });
  }
  const bodyRouteCounts = slideScores
    .filter(s => !/^cover|^closing|^toc|^chapter-divider/.test(s.route))
    .reduce((acc, s) => {
      acc[s.route] = (acc[s.route] || 0) + 1;
      return acc;
    }, {});
  const maxRepeatedRoute = Math.max(0, ...Object.values(bodyRouteCounts));
  const bodyRouteTotal = Object.values(bodyRouteCounts).reduce((sum, n) => sum + n, 0);
  if (bodyRouteTotal >= 6 && maxRepeatedRoute / bodyRouteTotal > 0.55) {
    const route = Object.entries(bodyRouteCounts).sort((a, b) => b[1] - a[1])[0][0];
    findings.push({
      level: 'review',
      type: 'visualTemplateFatigue',
      message: `${maxRepeatedRoute}/${bodyRouteTotal} body slides repeat ${route}; deck needs more varied page-family rhythm`
    });
  }
  Object.entries(bodyRouteCounts)
    .filter(([route, count]) => count >= 2 && /^industry-chart:/.test(route))
    .forEach(([route, count]) => {
      findings.push({
        level: 'review',
        type: 'repeatedDataComponent',
        message: `${count} body slides reuse ${route}; choose a different chart grammar unless the data structure is truly the same`
      });
    });
  if (slides.length >= 8 && Object.keys(themeIntentCounts).filter(k => k !== 'unset').length < 4) {
    findings.push({
      level: 'review',
      type: 'themeIntentVarietyLow',
      message: `deck only exposes ${Object.keys(themeIntentCounts).filter(k => k !== 'unset').length} theme intents; add clearer opening, diagnosis, proof, system, value, risk, and closing roles`
    });
  }
  const evidenceWeak = slideScores.filter(s => s.flags.includes('imageEvidenceWithoutLabels')).length;
  if (evidenceWeak >= 2) {
    findings.push({
      level: 'review',
      type: 'evidenceRelationshipWeak',
      message: `${evidenceWeak} image-heavy slides lack evidence labels or captions`
    });
  }
  const businessSlides = slides.filter(slide => !['cover', 'closing', 'chapter-divider', 'toc', 'toc-clean'].includes(slide.type || ''));
  const logicCount = businessSlides.filter(hasCommercialLogicChain).length;
  const isCompanyIntro = /company-intro|公司介绍|能力介绍|企业介绍|企业简介|宣传册/i.test(String(
    (normalized.materialIntelligence && normalized.materialIntelligence.pptType) ||
    normalized.ppt_type ||
    normalized.pptType ||
    normalized.title ||
    ''
  ));
  if (!isCompanyIntro && businessSlides.length >= 6 && logicCount < Math.min(3, Math.ceil(businessSlides.length * 0.35))) {
    findings.push({
      level: 'review',
      type: 'commercialLogicThin',
      message: `${logicCount}/${businessSlides.length} body slides expose a diagnosis-action-metric chain; deck may feel like a polished template instead of a custom commercial solution`
    });
  }
  const deckScore = slideScores.length
    ? Math.round(slideScores.reduce((sum, s) => sum + s.score, 0) / slideScores.length)
    : 0;
  return {
    deckScore,
    slides: slideScores,
    routeCounts,
    roleCounts,
    themeIntentCounts,
    findings
  };
}

function industryKnowledgeAudit(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || normalizeDeckPlan(plan);
  const profile = industryKnowledgeProfile(normalized);
  const slides = normalized.slides || [];
  if (!profile || !slides.length) return { industry: normalized.industry || '', covered: [], missingDomains: [], findings: [] };
  const covered = new Map();
  slides.forEach((slide, i) => {
    const signals = contentSignals(normalized, slide, i, slides.length);
    const meaning = semanticMeaning(normalized, slide, signals);
    const route = routeKey(slide);
    (meaning.proofCandidates || []).forEach(candidate => {
      if (candidate.score >= 3 || routeMatches(route, candidate.route) || slide.proofObject === candidate.id) {
        const prev = covered.get(candidate.id);
        if (!prev || prev.score < candidate.score) {
          covered.set(candidate.id, {
            id: candidate.id,
            route: candidate.route,
            depth: candidate.depth,
            slide: i + 1,
            score: candidate.score
          });
        }
      }
    });
    if (slide.proofObject) {
      const proof = (profile.proofObjects || []).find(p => p.id === slide.proofObject || String(p.route || '').endsWith(`:${slide.proofObject}`));
      if (proof && !covered.has(proof.id)) {
        covered.set(proof.id, { id: proof.id, route: proof.route, depth: proof.depth, slide: i + 1, score: 3 });
      }
    }
  });
  const coveredList = [...covered.values()];
  const domains = new Set(coveredList.map(p => p.depth).filter(Boolean));
  const pptTypeText = String((normalized.materialIntelligence && normalized.materialIntelligence.pptType) || normalized.ppt_type || normalized.pptType || normalized.title || '');
  const isCompanyIntro = /company-intro|公司介绍|能力介绍|企业介绍|企业简介|宣传册/i.test(pptTypeText);
  const gate = isCompanyIntro && normalized.industry === 'manufacturing-operations'
    ? { minProofObjects: 2, requiredDomains: ['system-map', 'operating-loop'] }
    : (profile.depthGates || { minProofObjects: 2, requiredDomains: [] });
  const minProofObjects = slides.length >= 10 ? Math.max(gate.minProofObjects || 2, 3) : (gate.minProofObjects || 2);
  const missingDomains = (gate.requiredDomains || []).filter(d => !domains.has(d));
  const findings = [];
  if (slides.length >= 7 && coveredList.length < minProofObjects) {
    findings.push({
      level: 'review',
      type: 'industryKnowledgeCoverage',
      message: `${profile.label} deck covers ${coveredList.length}/${minProofObjects} expected industry proof objects`
    });
  }
  if (slides.length >= 8 && missingDomains.length >= 1) {
    findings.push({
      level: 'review',
      type: 'industryDepthMissing',
      message: `${profile.label} deck misses depth domains: ${missingDomains.join(', ')}`
    });
  }
  return {
    industry: normalized.industry || '',
    label: profile.label,
    narrativeArchetype: profile.narrativeArchetype,
    covered: coveredList,
    missingDomains,
    minProofObjects,
    findings
  };
}

function pageCountAudit(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || normalizeDeckPlan(plan);
  const slides = normalized.slides || [];
  const contract = normalized.targetSlides || plan.targetSlides || {};
  const requested = Number(contract.requested || normalized.requestedSlideCount || plan.requestedSlideCount || 0);
  const resolved = Number(contract.resolved || contract.targetSlides || requested || 0);
  const findings = [];
  if (requested && slides.length !== requested) {
    findings.push({
      level: 'fail',
      type: 'pageCountMismatch',
      message: `requested ${requested} slides but generated ${slides.length}`
    });
  } else if (resolved && slides.length !== resolved) {
    findings.push({
      level: 'review',
      type: 'pageCountResolvedMismatch',
      message: `target contract resolved ${resolved} slides but generated ${slides.length}`
    });
  }
  if (contract.enoughMaterial === false) {
    findings.push({
      level: 'review',
      type: 'pageCountMaterialShortage',
      message: contract.adjustmentReason || 'target slide count exceeds available claim/proof material'
    });
  }
  return {
    version: 'page-count-audit/v1',
    requested: requested || null,
    resolved: resolved || null,
    actual: slides.length,
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    findings
  };
}

function slideProofObject(slide = {}) {
  if (slide.proof && slide.proof.version === 'proof-object/v1') return slide.proof;
  const sourceIds = compactUnique([
    ...((slide.sourceTrace && slide.sourceTrace.sourceIds) || []),
    ...(slide.sourceIds || []),
    ...(slide.source_ids || [])
  ]);
  const generation = slide.assetGeneration || {};
  const generationStatus = String(generation.status || '').toLowerCase();
  const generatedAssetText = flattenText([
    slide.generatedAssetPrompt,
    generation.prompt,
    generation.provenance,
    generation.mode,
    generationStatus && generationStatus !== 'none' ? generationStatus : ''
  ]);
  const generatedIllustration = generationStatus !== 'none' && /generated|synthetic|model|示意|生成|required/i.test(generatedAssetText);
  return {
    version: 'proof-object/v1',
    id: proofObjectIdForSlide(slide) || 'unknown',
    sourceIds,
    provenance: sourceIds.length ? 'source-derived-evidence' : 'unproven',
    factual: sourceIds.length > 0,
    generatedIllustration,
    evidenceMode: generatedIllustration ? 'synthetic-illustration' : 'real-evidence'
  };
}

function evidenceAudit(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || normalizeDeckPlan(plan);
  const slides = normalized.slides || [];
  const findings = [];
  const bodySlides = slides.filter(s => !['cover', 'closing', 'toc', 'toc-clean', 'chapter-divider'].includes(s.type || ''));
  bodySlides.forEach((slide, i) => {
    const absoluteIndex = slides.indexOf(slide) + 1;
    const proof = slideProofObject(slide);
    if (!proof.id || proof.id === 'unknown' || proof.id === 'narrative-block') {
      findings.push({
        slide: absoluteIndex,
        level: 'review',
        type: 'proofObjectMissing',
        message: 'body slide should expose a concrete proof object, not only a title/body block'
      });
    }
    if (!proof.factual && !proof.generatedIllustration && !['toc-clean', 'chapter-divider'].includes(slide.type || '')) {
      const trace = sourceTraceForSlide(slide);
      const explicitBoundary = /plan-authored|brief|source-derived|structure-only|synthetic|generated/i.test(String(proof.provenance || proof.evidenceMode || proof.evidence_mode || trace.sourceNote || trace.source_note || ''));
      if (!explicitBoundary) {
        findings.push({
          slide: absoluteIndex,
          level: 'review',
          type: 'evidenceProvenanceWeak',
          message: 'proof object lacks source ids or explicit generated-illustration provenance'
        });
      }
    }
    if (proof.generatedIllustration && proof.factual) {
      findings.push({
        slide: absoluteIndex,
        level: 'fail',
        type: 'generatedEvidenceMisclassified',
        message: 'model-generated illustration is marked as factual evidence'
      });
    }
  });
  sourceTraceAudit(plan, normalized).findings.forEach(f => findings.push(f));
  return {
    version: 'evidence-audit/v1',
    checkedSlides: bodySlides.length,
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    findings
  };
}

function reportDepthAudit(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || normalizeDeckPlan(plan);
  const slides = normalized.slides || [];
  const findings = [];
  const bodySlides = slides.filter(s => !['cover', 'closing', 'toc', 'toc-clean', 'chapter-divider'].includes(s.type || ''));
  const proofCount = bodySlides.filter(s => proofObjectIdForSlide(s)).length;
  const logicCount = bodySlides.filter(hasCommercialLogicChain).length;
  const componentPlanCount = bodySlides.filter(s => s.componentPlan && s.componentPlan.version === 'component-plan/v1').length;
  const routeKinds = new Set(bodySlides.map(s => String(s.type || '')));
  if (slides.length >= 8 && proofCount < Math.ceil(bodySlides.length * 0.75)) {
    findings.push({
      level: 'review',
      type: 'reportProofDepthThin',
      message: `${proofCount}/${bodySlides.length} body slides expose proof objects; report may feel like a template showcase`
    });
  }
  if (slides.length >= 8 && logicCount < Math.max(2, Math.ceil(bodySlides.length * 0.30))) {
    findings.push({
      level: 'review',
      type: 'reportLogicThin',
      message: `${logicCount}/${bodySlides.length} body slides expose business logic chains`
    });
  }
  if (slides.length >= 8 && routeKinds.size < 4) {
    findings.push({
      level: 'review',
      type: 'reportRhythmTooFlat',
      message: `report uses only ${routeKinds.size} body route families`
    });
  }
  if (slides.length >= 8 && componentPlanCount < bodySlides.length) {
    findings.push({
      level: 'fail',
      type: 'componentPlanMissing',
      message: `${bodySlides.length - componentPlanCount} body slides lack component plans`
    });
  }
  return {
    version: 'report-depth-audit/v1',
    checkedSlides: bodySlides.length,
    routeFamilyCount: routeKinds.size,
    proofObjectCoverage: bodySlides.length ? Number((proofCount / bodySlides.length).toFixed(2)) : 0,
    logicCoverage: bodySlides.length ? Number((logicCount / bodySlides.length).toFixed(2)) : 0,
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    findings
  };
}

function componentPlanAudit(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || normalizeDeckPlan(plan);
  const slides = normalized.slides || [];
  const findings = [];
  slides.forEach((slide, i) => {
    if (['cover', 'closing'].includes(slide.type || '')) return;
    const componentPlan = slide.componentPlan || {};
    const components = Array.isArray(componentPlan.components) ? componentPlan.components : [];
    const unknownComponents = Array.isArray(componentPlan.unknownComponents) ? componentPlan.unknownComponents : [];
    unknownComponents.forEach(component => {
      findings.push({
        slide: i + 1,
        level: 'fail',
        type: 'unknownComponentId',
        message: `unknown component id in plan: ${component.id}`
      });
    });
    if (componentPlan.version !== 'component-plan/v1' || !components.length) {
      findings.push({
        slide: i + 1,
        level: 'fail',
        type: 'componentPlanMissing',
        message: 'slide has no executable componentPlan'
      });
      return;
    }
    components.forEach(component => {
      if (!hasComponentCapability(component.id)) {
        findings.push({
          slide: i + 1,
          level: 'fail',
          type: 'unknownComponentId',
          message: `component has no capability registry entry: ${component.id}`
        });
      }
    });
    const required = components.filter(c => c.required !== false).map(c => c.id);
    if (!required.length) {
      findings.push({
        slide: i + 1,
        level: 'review',
        type: 'componentRequiredMissing',
        message: 'componentPlan has no required components, so renderer consumption cannot be meaningfully checked'
      });
    }
    if (required.includes('risk-matrix') && componentPlan.riskMatrixPolicy !== 'render-only-when-explicit') {
      findings.push({
        slide: i + 1,
        level: 'fail',
        type: 'riskMatrixDefaulted',
        message: 'risk-matrix component must be explicitly triggered, not defaulted'
      });
    }
    const ids = components.map(c => c.id);
    const hasProcessStructure = ['timeline', 'timeline-dark'].includes(slide.type || '') ||
      Array.isArray(slide.phases) ||
      Array.isArray(slide.actions) ||
      Array.isArray(slide.steps) ||
      Array.isArray(slide.timeline) ||
      Array.isArray(slide.milestones);
    if (ids.includes('process-rail') && !hasProcessStructure) {
      findings.push({
        slide: i + 1,
        level: 'fail',
        type: 'processRailWithoutStructure',
        message: 'process-rail requires phases/actions/steps or an explicit timeline route'
      });
    }
    const hasRiskStructure = ['risk-table'].includes(slide.type || '') ||
      Array.isArray(slide.rows) ||
      Array.isArray(slide.risks) ||
      Array.isArray(slide.controls) ||
      Boolean(slide.riskRegister || slide.riskMatrix || slide.controlsMatrix || slide.matrix);
    if (ids.includes('risk-register') && !hasRiskStructure) {
      findings.push({
        slide: i + 1,
        level: 'fail',
        type: 'riskRegisterWithoutRows',
        message: 'risk-register requires rows/risks/controls or explicit risk structure'
      });
    }
    const hasArchitectureStructure = ['architecture', 'architecture-dark', 'strategy-map'].includes(slide.type || '') ||
      Array.isArray(slide.layers) ||
      Boolean(slide.architecture || slide.systemMap || slide.topology || slide.capabilityMap || slide.platformCapabilities || slide.valueChain || slide.capitals);
    if (ids.includes('system-rail') && !hasArchitectureStructure) {
      findings.push({
        slide: i + 1,
        level: 'fail',
        type: 'systemRailWithoutArchitecture',
        message: 'system-rail requires architecture/strategy route or explicit layers/topology/capability data'
      });
    }
    const text = flattenText(slide);
    const hasCurveStructure = slide.loadCurve || slide.loadCurveBand || slide.curve || slide.trend || slide.monthlyTrend || slide.monthlyPulse ||
      /曲线|趋势|负荷|SOC|load|curve|trend|pulse/i.test(text);
    if (ids.includes('load-curve-band') && !hasCurveStructure) {
      findings.push({
        slide: i + 1,
        level: 'fail',
        type: 'loadCurveWithoutSemantics',
        message: 'load-curve-band requires explicit curve/trend/load semantics'
      });
    }
  });
  return {
    version: 'component-plan-audit/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    findings
  };
}

function industryFitAudit(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || normalizeDeckPlan(plan);
  const industry = normalized.industry || plan.industry || '';
  const pack = industryPackFor(industry);
  const findings = [];
  if (!pack) return { version: 'industry-fit-audit/v1', industry, status: 'review', findings: [{ level: 'review', type: 'industryPackMissing', message: `no industry pack for ${industry || 'unknown industry'}` }] };
  const text = flattenText(normalized.slides || []);
  (pack.forbiddenTemplates || []).forEach(item => {
    const normalizedItem = String(item || '').toLowerCase();
    if (/generic|decorative|risk page as plain table|beautiful photo without proof/i.test(normalizedItem)) return;
    if (normalizedItem && text.toLowerCase().includes(normalizedItem)) {
      findings.push({
        level: 'review',
        type: 'industryForbiddenPattern',
        message: `deck visible text appears to use forbidden industry pattern: ${item}`
      });
    }
  });
  const expressionRules = INDUSTRY_EXPRESSION_RULES[industry] || INDUSTRY_EXPRESSION_RULES[visualIndustryId(industry)] || {};
  const expectedProof = new Set([...(pack.proofObjects || []), ...((expressionRules.proofObjects) || [])].map(String));
  const presentProof = new Set((normalized.slides || []).map(proofObjectIdForSlide).filter(Boolean));
  const matched = [...presentProof].filter(id => expectedProof.has(id));
  if ((normalized.slides || []).length >= 8 && expectedProof.size && matched.length < Math.min(2, expectedProof.size)) {
    findings.push({
      level: 'review',
      type: 'industryFitProofObjectsThin',
      message: `${pack.labelZh || industry} report only uses ${matched.length} expected proof objects`
    });
  }
  return {
    version: 'industry-fit-audit/v1',
    industry,
    packId: pack.id,
    matchedProofObjects: matched,
    expectedProofObjects: [...expectedProof],
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    findings
  };
}

function visibleProductionCopyIssues(text = '') {
  return VISIBLE_PRODUCTION_COPY_BANS
    .filter(re => re.test(String(text || '')))
    .map(re => String(re).replace(/^\/|\/[a-z]*$/g, ''));
}

function auditDeckPlan(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || normalizeDeckPlan(plan);
  const slides = normalized.slides || [];
  const findings = [];
  const industry = normalized.industry || plan.industry || '';
  if (!slides.length) {
    findings.push({ level: 'fail', type: 'emptyPlan', message: 'deck plan has no slides' });
    return findings;
  }
  const keys = slides.map(routeKey);
  const rules = INDUSTRY_EXPRESSION_RULES[industry] || INDUSTRY_EXPRESSION_RULES[visualIndustryId(industry)];
  if (rules && slides.length >= 5 && !rules.requiredRoutes.some(route => keys.some(key => routeMatches(key, route)))) {
    findings.push({
      level: 'review',
      type: 'industryWeakExpression',
      message: `${industry} deck lacks a dedicated proof object route (${rules.proofObjects.join(', ')})`
    });
  }
  let streak = 1;
  for (let i = 1; i < keys.length; i++) {
    streak = keys[i] === keys[i - 1] ? streak + 1 : 1;
    if (streak >= 3 && !['case-gallery:evidence-board', 'metric-comparison'].includes(keys[i])) {
      findings.push({ slide: i + 1, level: 'review', type: 'templateRhythm', message: `three consecutive slides use ${keys[i]}` });
      break;
    }
  }
  const genericDefaults = slides.filter(s => s.layoutRationale === 'default commercial split');
  if (slides.length >= 6 && genericDefaults.length >= 2) {
    findings.push({ level: 'review', type: 'genericRoute', message: `${genericDefaults.length} slides fell back to the default commercial split` });
  }
  slides.forEach((slide, i) => {
    const visibleText = flattenText(slide);
    const copyIssues = visibleProductionCopyIssues(visibleText);
    if (copyIssues.length) {
      findings.push({
        slide: i + 1,
        level: 'fail',
        type: 'productionNoteLeak',
        message: `visible slide copy contains production-note wording: ${copyIssues.join(', ')}`
      });
    }
    const generation = slide.assetGeneration || {};
    if (generation.status === 'blocked' && ((slide.visual && slide.visual.mode === 'generated') || slide.assetMode === 'generated')) {
      findings.push({
        slide: i + 1,
        level: 'fail',
        type: 'unsafeGeneratedAssetRequest',
        message: generation.reason || 'generated asset request is not safe for this factual proof object'
      });
    }
    const signals = contentSignals(normalized, slide, i, slides.length);
    const captions = (Array.isArray(slide.cards) ? slide.cards.length : 0) +
      (Array.isArray(slide.items) ? slide.items.length : 0) +
      (Array.isArray(slide.lookbook) ? slide.lookbook.length : 0) +
      (Array.isArray(slide.productStory) ? slide.productStory.length : 0);
    if (signals.imageCount >= 3 && captions < Math.min(3, signals.imageCount)) {
      findings.push({ slide: i + 1, level: 'review', type: 'captionCoverage', message: 'image-heavy slide lacks enough captions or evidence labels' });
    }
    if ((slide.type === 'metric-comparison' || slide.type === 'industry-chart') && !hasCommercialLogicChain(slide)) {
      findings.push({
        slide: i + 1,
        level: 'review',
        type: 'metricBusinessLogic',
        message: 'metric/data slide needs a visible business chain: current state, gap/impact, cause, action, and success metric'
      });
    }
    if (
      slide.type === 'case-gallery' &&
      (slide.layoutVariant === 'evidence-board' || slide.variant === 'evidence-board') &&
      signals.imageCount >= 4
    ) {
      const evidenceItems = [
        ...(Array.isArray(slide.cards) ? slide.cards : []),
        ...(Array.isArray(slide.items) ? slide.items : [])
      ].filter(Boolean);
      const overBudget = evidenceItems.filter(item => {
        const title = typeof item === 'string' ? item : (item.title || item.label || item.name || '');
        const body = typeof item === 'string' ? '' : (item.body || item.note || item.text || item.description || '');
        return String(title).trim().length > 18 || String(body).trim().length > 30;
      });
      if (overBudget.length) {
        findings.push({
          slide: i + 1,
          level: 'review',
          type: 'evidenceCaptionBudget',
          message: `${overBudget.length} evidence captions exceed the evidence-board readability budget; use concise titles, short captions, or move detail into a source note`
        });
      }
    }
    const loopText = [slide.title, slide.centerTitle, slide.loopTitle].filter(Boolean).join(' ');
    const closedLoopOk = slide.type === 'timeline' || slide.layoutVariant === 'responsibility-loop' || slide.layoutVariant === 'flywheel' || slide.layoutVariant === 'closed-loop';
    const energyLoopOk = plan.industry === 'energy-utility' && ['module-matrix', 'metric-comparison'].includes(slide.type);
    if (/闭环|循环|能力环|loop|cycle/i.test(loopText) && !closedLoopOk && !energyLoopOk && !slide.centerTitle && !['cover', 'closing', 'chapter-divider', 'toc', 'toc-clean'].includes(slide.type)) {
      findings.push({ slide: i + 1, level: 'review', type: 'loopSemantics', message: 'loop language is present but the slide is not routed to a loop or responsibility grammar' });
    }
    if (slide.layoutVariant === 'risk-matrix' && !slide.matrix && (!Array.isArray(slide.rows) || slide.rows.length < 3)) {
      findings.push({ slide: i + 1, level: 'review', type: 'matrixCoordinates', message: 'risk matrix route needs matrix data or at least three positioned risks' });
    }
  });
  const last = slides[slides.length - 1] || {};
  const allVisibleText = flattenText({ title: plan.title, organization: plan.organization, contacts: plan.contacts, slides });
  const isCompanyIntro = /company-intro|公司介绍|能力介绍|企业介绍/i.test(String((plan.materialIntelligence && plan.materialIntelligence.pptType) || plan.ppt_type || plan.title || ''));
  const hasContactOrAction = Boolean(
    flattenText(plan.contacts || plan.contact || '').trim() ||
    flattenText(last.contacts || last.contact || last.actions || last.items || '').trim() ||
    /电话|邮箱|官网|地址|二维码|联系人|contact|www\.|@/i.test(allVisibleText)
  );
  if (isCompanyIntro && routeKey(last).startsWith('closing') && !hasContactOrAction) {
    findings.push({
      slide: slides.length,
      level: 'review',
      type: 'closingContactMissing',
      message: 'company-introduction closing needs contact details, website/QR code, address, or explicit next-step actions for external commercial use'
    });
  }
  const visibleSlideText = flattenText(slides);
  if (/第二页先|后续页面|后续再|本页仅|证明页优先|对比页优先|测试\s*closing|正式结束页用于/i.test(visibleSlideText)) {
    findings.push({
      level: 'fail',
      type: 'visibleProductionNote',
      message: 'visible slide copy contains production-note or test wording'
    });
  }
  if (isCompanyIntro && /潜在客户|采购与项目|产业合作伙伴|客户高层|内部评审对象|受众|audience/i.test(visibleSlideText)) {
    findings.push({
      level: 'review',
      type: 'externalMetaLeak',
      message: 'company-introduction deck exposes internal audience or review-positioning metadata; use company name/contact only for external delivery'
    });
  }
  const sensitiveCaseSignal = /特斯拉|中航|军工|中车|中船|客户名单|客户项目|logo|LOGO/i.test(allVisibleText);
  const review = plan.commercialReview || {};
  if (sensitiveCaseSignal && !review.customerCaseAuthorization && !review.customerNamesAuthorized && !review.publicAuthorizationConfirmed) {
    findings.push({
      level: 'review',
      type: 'customerCaseAuthorization',
      message: 'deck mentions customer/sensitive case evidence; confirm public-use authorization or desensitize before external delivery'
    });
  }
  visualAestheticModel(plan, normalized).findings.forEach(f => findings.push(f));
  industryKnowledgeAudit(plan, normalized).findings.forEach(f => findings.push(f));
  contentOverlapAudit(plan, normalized).forEach(f => findings.push(f));
  compositionAudit(plan, normalized).forEach(f => findings.push(f));
  return findings;
}

function acceptanceAudit(plan = {}, normalizedPlan = null, options = {}) {
  const normalized = normalizedPlan || normalizeDeckPlan(plan);
  const slides = normalized.slides || [];
  const renderMeta = options.renderMeta || null;
  const previewReports = Array.isArray(options.previewReports) ? options.previewReports : [];
  const deckFindings = auditDeckPlan(plan, normalized);
  const compositionFindings = compositionAudit(plan, normalized);
  const knowledge = industryKnowledgeAudit(plan, normalized);
  const aesthetic = visualAestheticModel(plan, normalized);
  const reportDepth = reportDepthAudit(plan, normalized);
  const evidence = evidenceAudit(plan, normalized);
  const pageCount = pageCountAudit(plan, normalized);
  const componentPlan = componentPlanAudit(plan, normalized);
  const industryFit = industryFitAudit(plan, normalized);
  const chartSemantic = chartSemanticQA(plan, normalized);
  const chartVisual = chartVisualQA(plan, normalized, renderMeta);
  const chartEvidence = chartEvidenceQA(plan, normalized);
  const pageChartScores = pageLevelChartScores(plan, normalized, renderMeta);
  const chartGate = chartAcceptanceGate(plan, normalized, renderMeta, {
    previewReports,
    requireContactSheet: options.requireContactSheet === true,
    strict: options.strict === true
  });
  const checks = [
    {
      id: 'report-depth',
      label: '报告深度 QA',
      description: '是否像一份报告，而不是模板页面展示。',
      findings: reportDepth.findings
    },
    {
      id: 'evidence',
      label: 'Evidence QA',
      description: '每页 proof object 是否真实、可解释，并区分生成示意图。',
      findings: evidence.findings
    },
    {
      id: 'page-count',
      label: '页数 QA',
      description: '是否符合用户指定页数或 targetSlides contract。',
      findings: pageCount.findings
    },
    {
      id: 'component-plan',
      label: '组件计划 QA',
      description: '每页是否输出可执行组件组合，而不是只选择页面类型。',
      findings: componentPlan.findings
    },
    {
      id: 'chart-semantic',
      label: 'Chart Semantic QA',
      description: '图表类型是否匹配数据结构，避免假趋势、假瀑布和假漏斗。',
      findings: chartSemantic.findings
    },
    {
      id: 'chart-visual',
      label: 'Chart Visual QA',
      description: '图表是否有轴标签、单位、来源和可读标签。',
      findings: chartVisual.findings.filter(f => f.level === 'fail')
    },
    {
      id: 'chart-evidence',
      label: 'Chart Evidence QA',
      description: '图表是否可追溯到 proof object 和真实/生成证据模式。',
      findings: chartEvidence.findings
    },
    {
      id: 'industry-customization',
      label: '行业定制 QA',
      description: '是否像这个行业，而不是通用模板换字。',
      findings: [
        ...deckFindings.filter(f => ['industryWeakExpression'].includes(f.type)),
        ...(knowledge.findings || []),
        ...(industryFit.findings || []),
        ...aesthetic.findings.filter(f => ['visualTemplateFatigue', 'commercialLogicThin'].includes(f.type))
      ]
    },
    {
      id: 'layout-repetition',
      label: '布局重复 QA',
      description: '连续页面是否重复同一种卡片/结构。',
      findings: [
        ...deckFindings.filter(f => ['templateRhythm', 'genericRoute'].includes(f.type)),
        ...compositionFindings.filter(f => ['adjacentLayoutSimilarity', 'compositionTooGeneric', 'flatPageRhythm'].includes(f.type)),
        ...aesthetic.findings.filter(f => f.type === 'visualTemplateFatigue')
      ]
    },
    {
      id: 'semantic-color',
      label: '色彩语义 QA',
      description: '主色是否承担 brand/evidence/risk/action/data，而不是乱点缀。',
      findings: compositionFindings.filter(f => ['semanticColorMismatch', 'accentOnlyAsThinLine'].includes(f.type))
    },
    {
      id: 'image-evidence',
      label: '图片证据 QA',
      description: '图片是否有证明作用，还是只是好看。',
      findings: [
        ...deckFindings.filter(f => ['captionCoverage', 'weakImageTreatment', 'unsafeGeneratedAssetRequest'].includes(f.type)),
        ...aesthetic.findings.filter(f => ['evidenceRelationshipWeak'].includes(f.type))
      ]
    }
  ].map(check => Object.assign({}, check, {
    status: check.findings.some(f => f.level === 'fail') ? 'fail' : (check.findings.length ? 'review' : 'pass')
  }));
  return {
    version: 'acceptance-audit/v1',
    industry: normalized.industry || plan.industry || '',
    slideCount: slides.length,
    status: checks.some(c => c.status === 'fail') ? 'fail' : (checks.some(c => c.status === 'review') ? 'review' : 'pass'),
    checks,
    reportDepth,
    evidence,
    pageCount,
    componentPlan,
    industryFit,
    chartSemantic,
    chartVisual,
    chartEvidence,
    chartGate,
    pageChartScores,
    findings: checks.flatMap(check => check.findings.map(f => Object.assign({ qa: check.id }, f)))
  };
}

function commercialReadinessAudit(plan = {}, normalizedPlan = null, extraFindings = [], options = {}) {
  const normalized = normalizedPlan || normalizeDeckPlan(plan);
  const acceptance = acceptanceAudit(plan, normalized, options);
  const sourceTrace = sourceTraceAudit(plan, normalized);
  const assetGate = assetAuthorizationGate(plan, normalized);
  const findings = [
    ...(acceptance.findings || []),
    ...(sourceTrace.findings || []).map(f => Object.assign({ qa: 'source-trace' }, f)),
    ...(assetGate.findings || []).map(f => Object.assign({ qa: 'asset-authorization' }, f)),
    ...extraFindings
  ];
  const failTypes = new Set(findings.filter(f => f.level === 'fail').map(f => f.type));
  const reviewTypes = new Set(findings.filter(f => f.level !== 'fail').map(f => f.type));
  let level = 'client-review';
  let canExternalShare = true;
  const reasons = [];
  if (
    failTypes.size ||
    assetGate.status === 'needs_authorization' ||
    failTypes.has('sourceTraceMissing') ||
    failTypes.has('sourceTraceNotExplainable') ||
    failTypes.has('assetAuthorizationBlocked') ||
    failTypes.has('assetAuthorizationUnresolved') ||
    failTypes.has('productionNoteLeak') ||
    failTypes.has('placeholderText') ||
    failTypes.has('generatedEvidenceMisclassified')
  ) {
    level = 'client-final-blocked';
    canExternalShare = false;
    reasons.push('blocking QA finding, unresolved authorization, or unexplained source trace');
  } else if (
    reviewTypes.has('assetAuthorizationUnknown') ||
    reviewTypes.has('customerCaseAuthorization') ||
    reviewTypes.has('externalMetaLeak') ||
    (plan.commercialReview && Array.isArray(plan.commercialReview.openRisks) && plan.commercialReview.openRisks.length)
  ) {
    level = 'internal-ready';
    canExternalShare = false;
    reasons.push('usable internally, but external sharing still needs risk or authorization clearance');
  } else if (
    reviewTypes.has('visualTemplateFatigue') ||
    reviewTypes.has('aestheticScore') ||
    reviewTypes.has('themeIntentVarietyLow') ||
    reviewTypes.has('industryKnowledgeCoverage')
  ) {
    level = 'draft';
    canExternalShare = false;
    reasons.push('content is structurally valid but visual/story craft needs another iteration');
  } else {
    reasons.push('no blocking QA, source trace is explainable, and asset authorization gate is clear');
  }
  return {
    version: 'commercial-readiness/v1',
    level,
    canExternalShare,
    allowedUse: level === 'client-review'
      ? 'client-review'
      : (level === 'internal-ready' ? 'internal-only' : (level === 'draft' ? 'draft-only' : 'blocked')),
    scale: ['draft', 'internal-ready', 'client-review', 'client-final-blocked'],
    reasons,
    failTypes: [...failTypes],
    reviewTypes: [...reviewTypes],
    acceptanceStatus: acceptance.status,
    sourceTraceStatus: sourceTrace.status,
    assetAuthorizationStatus: assetGate.status,
    findings
  };
}

function recipeAutoRouteAllowed(recipe = null, s = {}, signals = contentSignals({}, s)) {
  const renderType = String((recipe && (recipe.renderType || recipe.slideType)) || '');
  const hasProcessStructure = Array.isArray(s.phases) ||
    Array.isArray(s.actions) ||
    Array.isArray(s.steps) ||
    Array.isArray(s.timeline) ||
    Array.isArray(s.milestones) ||
    signals.hasTimeline;
  const hasRiskStructure = Array.isArray(s.rows) ||
    Array.isArray(s.risks) ||
    Array.isArray(s.controls) ||
    Boolean(s.riskRegister || s.riskMatrix || s.controlsMatrix || s.matrix) ||
    signals.hasRisk ||
    signals.hasResponsibilityLoop;
  const hasArchitectureStructure = Array.isArray(s.layers) ||
    Boolean(s.architecture || s.systemMap || s.topology || s.capabilityMap || s.platformCapabilities) ||
    signals.hasArchitecture;
  const hasValueStructure = Boolean(s.valueChain || s.capitals || s.drivers || s.outcomes || s.inputs || s.outputs) ||
    signals.hasStructuredLogic ||
    signals.hasNamedLogicChain ||
    signals.hasStrategyMap;
  if (['timeline', 'timeline-dark'].includes(renderType)) return hasProcessStructure;
  if (renderType === 'risk-table') return hasRiskStructure;
  if (['architecture', 'architecture-dark'].includes(renderType)) return hasArchitectureStructure;
  if (renderType === 'strategy-map') return hasValueStructure;
  return true;
}

function recommendSlideType(plan = {}, s = {}, index = 0, total = 1) {
  const signals = contentSignals(plan, s, index, total);
  if (s.type && s.type !== 'auto' && s.type !== 'content') {
    if (staleIndustryChartRouteShouldYieldToProcess(s, signals)) {
      return { type: 'timeline', reason: 'process fields override stale industry-chart route' };
    }
    return { type: s.type, locked: true, reason: 'explicit type' };
  }
  const semantic = semanticFrame(plan, s, signals);
  const themeIntent = themeIntentFor(plan, s, index, total, signals);
  if (signals.first) return { type: 'cover', reason: 'first slide' };
  if (signals.last && /结束|收束|下一步|closing|thank|thanks|谢谢|感谢|观看|答疑|Q&A|alignment/i.test(flattenText(s))) {
    return { type: 'closing', reason: 'closing signal' };
  }
  if (signals.last && (s.decision || s.summary || (Array.isArray(s.actions) && s.actions.length))) {
    return { type: 'closing', reason: 'last slide decision/action fields' };
  }
  if (s.company || s.description) return { type: 'profile-proof', reason: 'explicit profile proof fields' };
  if (s.quote || s.statement) return { type: 'quote-proof', reason: 'explicit quote/statement field' };
  if (s.serviceBlueprint || s.touchpoints || s.journeyMap) return { type: 'architecture', reason: 'explicit service blueprint fields' };
  if (s.productionLine) return { type: 'architecture', reason: 'explicit production topology field' };
  if (s.downtimePareto || s.valuationSensitivity || s.qualityHandoff || s.memberCohorts || s.channelEfficiency || s.mediaEfficiency || s.monthlyPulse || s.monthlyTrend || s.waterfallBridge || s.targetBridge || s.dispatchMap || s.adoptionFunnel) {
    return { type: 'industry-chart', reason: `industry proof object: ${semantic.proofObject || 'explicit-chart'}` };
  }
  if (s.oee || s.oeeComponents) return { type: 'metric-comparison', reason: 'explicit OEE metrics fields' };
  if (s.lookbook || s.productStory) return { type: 'case-gallery', reason: 'explicit lookbook/product story fields' };
  if (s.platformCapabilities || s.capabilityMap) return { type: 'architecture', reason: 'explicit platform capability fields' };
  if (s.product || (Array.isArray(s.products) && s.products.length)) return { type: 'product-showcase', reason: 'explicit product/showcase fields' };
  if (s.before || s.after || s.beforeAfter) return { type: 'case-gallery', reason: 'explicit before/after case comparison fields' };
  if ((Array.isArray(s.flywheel) && s.flywheel.length) || (Array.isArray(s.loopItems) && s.loopItems.length)) return { type: 'timeline', reason: 'explicit flywheel/loop fields' };
  if (Array.isArray(s.bridge) && s.bridge.length) {
    return plan.industry === 'finance-investment'
      ? { type: 'finance-bridge', reason: 'explicit finance bridge field' }
      : { type: 'industry-chart', reason: 'explicit business bridge field' };
  }
  if (Array.isArray(s.portfolio) && s.portfolio.length) return { type: 'portfolio-table', reason: 'explicit portfolio table field' };
  if (semantic.primaryIntent === 'industryChart') return { type: 'industry-chart', reason: `industry proof object: ${semantic.proofObject}` };
  if (Array.isArray(s.metrics) && s.metrics.length) return { type: 'metric-comparison', reason: 'explicit metrics field' };
  const hasExplicitGovernanceTable = Array.isArray(s.rows) ||
    (Array.isArray(s.responsibilities) && s.responsibilities.length) ||
    (Array.isArray(s.owners) && s.owners.length) ||
    (Array.isArray(s.raci) && s.raci.length) ||
    (Array.isArray(s.accountabilities) && s.accountabilities.length);
  if (signals.isNumberHeavy && !hasExplicitGovernanceTable && !signals.hasGovernance && !signals.hasResponsibilityLoop && !signals.isTextHeavy && !signals.isDenseText) {
    return { type: 'metric-comparison', reason: 'number-heavy material signals' };
  }
  if (/risk-warning/i.test(themeIntent) && (Array.isArray(s.rows) || Array.isArray(s.risks) || Array.isArray(s.controls) || signals.hasRisk || signals.hasRiskLanguage)) return { type: 'risk-table', reason: 'theme intent: risk warning' };
  if (/case-evidence/i.test(themeIntent) && ((Array.isArray(s.images) && s.images.length) || signals.hasCaseSignal || signals.hasGallery)) return { type: 'case-gallery', reason: 'theme intent: case evidence' };
  if (/system-architecture/i.test(themeIntent) && (Array.isArray(s.layers) || signals.hasArchitecture)) return { type: 'architecture', reason: 'theme intent: system architecture' };
  if (/operating-path/i.test(themeIntent) && (Array.isArray(s.phases) || Array.isArray(s.actions) || Array.isArray(s.steps) || Array.isArray(s.timeline) || Array.isArray(s.milestones) || signals.hasTimeline) && !signals.hasSplitProblem && signals.cardCount < 5) return { type: 'timeline', reason: 'theme intent: operating path' };
  if (/value-signal/i.test(themeIntent) && (Array.isArray(s.metrics) || signals.hasMetrics || signals.isNumberHeavy) && !signals.isTextHeavy && !signals.isDenseText) return { type: 'metric-comparison', reason: 'theme intent: value signal' };
  if ((Array.isArray(s.responsibilities) && s.responsibilities.length) ||
      (Array.isArray(s.owners) && s.owners.length) ||
      (Array.isArray(s.raci) && s.raci.length) ||
      (Array.isArray(s.accountabilities) && s.accountabilities.length)) {
    return { type: 'risk-table', reason: 'explicit responsibility governance fields' };
  }
  if (semantic.primaryIntent === 'industryChart') return { type: 'industry-chart', reason: `industry proof object: ${semantic.proofObject}` };
  if (Array.isArray(s.rows) && s.rows.length) return { type: 'risk-table', reason: 'explicit risk/governance rows' };
  if (s.drivers || s.actions || s.outcomes || s.valueChain || s.capitals) return { type: 'strategy-map', reason: 'explicit value-chain fields' };
  if (Array.isArray(s.layers) && s.layers.length) return { type: 'architecture', reason: 'explicit architecture layers' };
  if (Array.isArray(s.phases) && s.phases.length) return { type: 'timeline', reason: 'explicit process phases' };
  if ((Array.isArray(s.images) && s.images.length) || (s.visual && Array.isArray(s.visual.images) && s.visual.images.length)) {
    return { type: 'case-gallery', reason: 'explicit gallery images' };
  }
  if (Array.isArray(s.columns) && s.columns.length >= 2) return { type: 'comparison', reason: 'explicit comparison columns' };
  if (signals.isNumberHeavy) return { type: 'metric-comparison', reason: 'number-heavy material signals' };
  if (signals.hasStructuredLogic || signals.hasNamedLogicChain) return { type: signals.phaseCount > 0 ? 'timeline' : 'strategy-map', reason: 'logic-chain material signals' };
  if (signals.isDenseText && signals.hasSplitProblem && !signals.phaseCount && !signals.flywheelCount) {
    return { type: 'report-board', reason: 'dense diagnostic/problem material signals' };
  }
  if (signals.isTextHeavy) return { type: 'report-board', reason: 'text-heavy report material signals' };
  if (Array.isArray(s.cards) && s.cards.length >= 3) {
    return { type: s.cards.length >= 5 ? 'module-matrix' : 'executive-blocks', reason: 'explicit card group' };
  }
  const recipe = selectReferenceRecipe(plan, s, signals);
  if (recipe && recipe.score >= 8 && recipe.renderType && recipeAutoRouteAllowed(recipe, s, signals)) {
    return { type: recipe.renderType, reason: `reference recipe: ${recipe.id}` };
  }
  if (signals.hasProfile) return { type: 'profile-proof', reason: 'company/profile proof signals' };
  if (signals.hasQuote) return { type: 'quote-proof', reason: 'quote/voice proof signals' };
  if (signals.hasCaseComparison) return { type: 'case-gallery', reason: 'before/after case comparison signals' };
  if (signals.hasComparison) return { type: 'comparison', reason: 'before/after comparison signals' };
  if (signals.hasChapter) return { type: 'chapter-divider', reason: 'chapter divider signals' };
  if (signals.hasProductShowcase) return { type: 'product-showcase', reason: 'product/showcase signals' };
  if (signals.hasFlywheel) return { type: 'timeline', reason: 'flywheel/operating loop signals' };
  if (signals.hasResponsibilityLoop) return { type: 'risk-table', reason: 'responsibility governance signals' };
  if (signals.hasRisk || signals.hasRiskLanguage) return { type: 'risk-table', reason: 'risk/governance signals' };
  if (signals.isImageHeavy && signals.hasCaseSignal) return { type: 'case-gallery', reason: 'image-heavy case/evidence signals' };
  if (signals.isNumberHeavy) return { type: 'metric-comparison', reason: 'number-heavy material signals' };
  if (semantic.primaryIntent === 'industryChart') return { type: 'industry-chart', reason: `industry proof object: ${semantic.proofObject}` };
  if (signals.hasMetrics) return { type: 'metric-comparison', reason: 'metric/KPI signals' };
  if (signals.isTextHeavy) return { type: 'report-board', reason: 'text-heavy report material signals' };
  if (signals.hasLogicChain) return { type: signals.phaseCount > 0 ? 'timeline' : 'strategy-map', reason: 'logic-chain material signals' };
  if (signals.hasStrategyMap) return { type: 'strategy-map', reason: 'value-chain/strategy signals' };
  if (signals.hasManifesto) return { type: 'manifesto', reason: 'culture/values signal' };
  if (signals.hasGallery) return { type: 'case-gallery', reason: 'multiple visual/case signals' };
  if (signals.hasArchitecture) return { type: 'architecture', reason: 'architecture/module signals' };
  if (signals.hasTimeline) return { type: 'timeline', reason: 'process/timeline signals' };
  if (signals.hasDenseCards) return { type: 'module-matrix', reason: 'dense card set' };
  if (signals.hasSplitProblem) return { type: 'executive-blocks', reason: 'problem split card set' };
  if (s.left || s.right || s.leftTitle || s.rightTitle) return { type: 'two-column', reason: 'two-sided narrative' };
  if (recipe && recipe.score >= 6 && recipe.renderType && recipeAutoRouteAllowed(recipe, s, signals)) {
    return { type: recipe.renderType, reason: `reference recipe: ${recipe.id}` };
  }
  return { type: 'executive-blocks', reason: 'default commercial split' };
}

function pickLayoutVariant(plan = {}, s = {}, type = s.type, signals = contentSignals(plan, s)) {
  if (s.layoutVariant || s.variant) return s.layoutVariant || s.variant;
  const industry = plan.industry || '';
  const visualIndustry = visualIndustryId(industry);
  const text = flattenText(s);
  const proofVariant = String(s.proofObject || s.proof_object || '').trim();
  if (proofVariant && HIGH_VALUE_PAGE_FAMILIES.has(proofVariant) && layoutVariantCompatibleWithType(type, proofVariant)) return proofVariant;
  const imageCount = signals.imageCount;
  const cardCount = signals.cardCount;
  const rowCount = signals.rowCount;
  const phaseCount = signals.phaseCount;
  const layerCount = signals.layerCount;
  const productCount = signals.productCount;
  if (type === 'cover' || type === 'cover-dark') {
    if (industry === 'beauty-consumer' || /美妆|美容|护肤|彩妆|香氛|beauty|cosmetic/i.test(text)) return 'beauty-brand-editorial-cover';
    if (industry === 'people-culture' || /文化|使命|招聘|团队|culture|hiring/i.test(text)) return 'culture-cover-with-soft-geometry';
    if (/概念|opening|开场|愿景|minimal|airy/i.test(text)) return 'airy-concept-opening';
    return s.layoutVariant;
  }
  if (type === 'industry-chart') {
    return industryChartVariant(plan, s, signals);
  }
  if (type === 'chapter-divider' || type === 'toc' || type === 'toc-clean') {
    if (industry === 'energy-utility') return 'energy-sequence';
    if (/董事会|管理层|高管|决策摘要|汇报重点|审议|board|briefing|executive/i.test(text) && industry !== 'finance-investment') return 'board-briefing';
    if (visualIndustry === 'brand-retail' || signals.hasGallery || /画册|品牌|门店|产品故事|lookbook|editorial|美妆|美容|消费/i.test(text)) return 'editorial-agenda';
    if (industry === 'finance-investment' || /投委会|议题|决策|配置|agenda|committee/i.test(text)) return 'agenda-board';
    if (industry === 'healthcare-operations' || /患者|就诊|护理|服务蓝图|旅程地图|journey|service blueprint/i.test(text) || (industry !== 'manufacturing-operations' && /客户旅程|用户旅程|服务路径|服务流程/i.test(text))) return 'pathway-map';
    if (industry === 'manufacturing-operations') return 'line-agenda';
    if (industry === 'saas-technology') return 'adoption-agenda';
    return 'chapter-hero';
  }
  if (type === 'metric-comparison') {
    if (industry === 'manufacturing-operations' && (s.oee || s.oeeComponents || signals.hasOeeBoard)) return 'oee-board';
    if (industry === 'healthcare-operations') return 'patient-service-scorecard';
    if (visualIndustry === 'brand-retail') return 'member-growth-board';
    if (industry === 'saas-technology') return 'adoption-revenue-board';
    if (/quarter|季度|Q[1-4]|业绩|results/i.test(text)) return 'quarterly-results-summary';
    if (/KPI|关键指标|主指标|highlight|numerical/i.test(text)) return 'financial-kpi-snapshot';
    if (/chart|图表|评论|commentary|趋势|同比|环比/i.test(text)) return 'chart-grid-with-commentary';
    return s.layoutVariant;
  }
  if (type === 'product-showcase') {
    if (productCount >= 4 || cardCount >= 4) return 'catalog-grid';
    if (productCount >= 2 || cardCount >= 3) return 'feature-strip';
    return 'hero-object';
  }
  if (type === 'architecture' || type === 'architecture-dark') {
    if (industry === 'saas-technology' && (s.platformCapabilities || s.capabilityMap || signals.hasSaasCapability)) return 'platform-capability-map';
    if (s.serviceBlueprint || s.touchpoints || s.journeyMap || (industry === 'healthcare-operations' && signals.hasServiceBlueprint)) return 'service-blueprint';
    if (s.nodes || s.hubs || /生态|网络|节点|拓扑|hub|spoke/i.test(text)) return 'hub-spoke';
    if (industry === 'manufacturing-operations' && (/产线|產線|设备|設備|PLC|传感器|点检|备件|OEE|line|equipment/i.test(text) || signals.hasOeeBoard)) return 'production-topology';
    if (signals.isDenseText || layerCount >= 4 || ['finance-investment', 'healthcare-operations'].includes(industry)) return 'blueprint-stack';
    return 'layer-stack';
  }
  if (type === 'strategy-map') {
    if (/价值创造|value creation|capital|资本|投入|产出/i.test(text)) return 'value-creation-process-map';
    if (industry === 'beauty-consumer' && /品牌世界|brand world|业务证明|经营证明/i.test(text)) return 'brand-world-and-business-proof';
    if (/单一概念|single object|concept map|核心对象|主对象/i.test(text)) return 'single-object-concept-map';
    return s.layoutVariant;
  }
  if (type === 'manifesto') {
    if (/使命|愿景|mission|vision|statement/i.test(text)) return 'mission-statement-stage';
    if (/价值观|原则|principle|values?/i.test(text)) return 'value-principle-cards';
    if (/文化|招聘|团队|culture|hiring/i.test(text)) return 'culture-cover-with-soft-geometry';
    return s.layoutVariant;
  }
  if (type === 'timeline' || type === 'timeline-dark') {
    if (s.flywheel || s.loopItems || signals.hasFlywheel) return 'flywheel';
    if (s.loop || signals.hasLoop) return 'closed-loop';
    if (signals.isDenseText || phaseCount >= 5) return 'process-board';
    return 'pathway-rail';
  }
  if (type === 'case-gallery' || type === 'gallery' || type === 'portfolio') {
    if (visualIndustry === 'brand-retail' && (s.lookbook || s.productStory || signals.hasLookbook) && imageCount >= 2) return 'lookbook-story';
    if (industry === 'beauty-consumer' && /品牌世界|brand world|世界观|业务证明|经营证明/i.test(text)) return 'brand-world-and-business-proof';
    if (industry === 'beauty-consumer' && /产品证据|product evidence|产品故事|系列|单品/i.test(text)) return 'product-evidence-story';
    if (industry === 'beauty-consumer' && (imageCount >= 2 || /消费者|用户|门店|场景|photo grid/i.test(text))) return 'consumer-proof-photo-grid';
    if ((industry === 'people-culture' || industry === 'people-culture-company') && /团队|员工|人物|people|member|mosaic/i.test(text)) return 'people-proof-mosaic';
    if (signals.hasCaseComparison) return 'case-comparison';
    if (industry === 'finance-investment' && imageCount >= 2 && /组合|项目|投委会|投资|案例|证据|portfolio|investment|deal|case/i.test(text)) return 'portfolio-evidence';
    if (industry === 'healthcare-operations' && imageCount >= 2 && /患者|服务|触点|导诊|检查|随访|体验|service|patient|journey|touchpoint/i.test(text)) return 'service-touchpoint';
    if (industry === 'energy-utility' && imageCount >= 2 && /站端|现场|电站|储能|资产|告警|证据|site|asset|evidence/i.test(text)) return 'site-evidence';
    if (industry === 'saas-technology' && imageCount >= 2 && /原型|界面|工作流|产品图册|产品体验|prototype|workflow|screen|interface/i.test(text)) return 'prototype-flow';
    if (imageCount >= 4 || cardCount >= 5) return 'evidence-board';
    if (imageCount === 1 || s.case || s.client || signals.isDenseText) return 'case-hero';
    return 'triptych-gallery';
  }
  if (type === 'risk-table' || type === 'table') {
    if (s.responsibilities || s.owners || s.raci || s.accountabilities || (/责任闭环|责任矩阵|RACI/i.test(flattenText(s)))) return 'responsibility-loop';
    if (/materiality|重要性|双重重要性|议题矩阵/i.test(text)) return 'materiality-matrix-board';
    if (/guidance|指引|业绩指引|风险看板|risk board/i.test(text)) return 'guidance-and-risk-board';
    if (s.matrix || /矩阵|matrix|概率|可能性|影响等级|影响程度|impact|likelihood/i.test(flattenText(s))) return 'risk-matrix';
    if (/governance|治理|董事会|委员会|合规/i.test(text)) return 'governance-table-editorial';
    if (signals.hasResponsibilityLoop && !s.matrix) return 'responsibility-loop';
    if (rowCount >= 5 || signals.hasGovernance) return 'control-stack';
    return 'governance-board';
  }
  if (type === 'closing' || type === 'closing-dark') {
    const text = flattenText(s);
    const isCompanyIntro = /company-intro|公司介绍|能力介绍|企业介绍|企业简介|宣传册/i.test(String((plan.materialIntelligence && plan.materialIntelligence.pptType) || plan.ppt_type || plan.pptType || plan.title || ''));
    if (s.closingVariant) return s.closingVariant;
    if (isCompanyIntro && /谢谢|感谢|观看|联系|交流|答疑|Q&A/i.test(text)) return 'company-thanks';
    if (s.contact || s.contacts || /谢谢|感谢|观看|thank|thanks|答疑|Q&A/i.test(text)) return 'thank-you';
    if (industry === 'energy-utility') return 'energy-stage';
    if (industry === 'finance-investment') return 'investment-decision';
    if (industry === 'manufacturing-operations') return 'pilot-rollout';
    if (industry === 'healthcare-operations') return 'quality-handoff';
    if (industry === 'saas-technology') return 'adoption-close';
    if (visualIndustry === 'brand-retail') return 'premium-closing-anchor';
    if (s.decision || s.summary || signals.isDenseText) return 'decision-summary';
    if (s.image || (s.visual && s.visual.image)) return 'image-statement';
    if (!s.actions && !s.decision && !s.summary && /结束|收尾|closing|end/i.test(text)) return 'simple-end';
    return s.closingVariant || 'auto';
  }
  return s.layoutVariant;
}

function textKeywords(text) {
  return String(text || '').toLowerCase().split(/[^a-z0-9\u4e00-\u9fff%％+-]+/).filter(Boolean);
}

function compositionAudit(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || normalizeDeckPlan(plan);
  const slides = normalized.slides || [];
  const findings = [];
  if (!slides.length) return findings;
  const bodySlides = slides.filter(s => !['cover', 'closing'].includes(s.type || ''));
  const missing = bodySlides.filter(s => !s.compositionPlan || s.compositionPlan.version !== 'composition-plan/v1');
  if (missing.length) {
    findings.push({
      level: 'fail',
      type: 'compositionPlanMissing',
      message: `${missing.length} body slides lack executable compositionPlan`
    });
  }
  let paleRun = 0;
  let longestPaleRun = 0;
  let darkAnchors = 0;
  let generic = 0;
  let lowCoverage = 0;
  let thinAccentOnly = 0;
  let roleMismatch = 0;
  slides.forEach((slide, i) => {
    const cp = slide.compositionPlan || {};
    const tone = String(cp.backgroundTone || '');
    const coverage = String(cp.themeCoverage || '');
    const intent = String(cp.themeIntent || slide.themeIntent || '');
    const accentRole = String(cp.accentRole || slide.accentRole || '');
    const colorUse = Array.isArray(cp.primaryColorUse) ? cp.primaryColorUse : [];
    const micro = Array.isArray(cp.microComponents) ? cp.microComponents : [];
    const composition = String(cp.composition || '');
    const signals = contentSignals(normalized, slide, i, slides.length);
    const type = slide.type || '';
    const isAccentAnchor = /accent-wash/i.test(tone) ||
      colorUse.includes('side-color-field') ||
      colorUse.includes('dark-anchor') ||
      micro.includes('rhythm-anchor');
    const isPale = !/dark|stage/i.test(tone) && !isAccentAnchor;
    paleRun = isPale ? paleRun + 1 : 0;
    longestPaleRun = Math.max(longestPaleRun, paleRun);
    if (/dark|stage|anchor/i.test(tone) || colorUse.includes('dark-anchor') || micro.includes('rhythm-anchor')) darkAnchors += 1;
    if (/executive-insight-board|editorial-report-board|capability-matrix-board/.test(composition)) generic += 1;
    if (coverage === 'low' || colorUse.length < 2) lowCoverage += 1;
    const substantialColorUse = colorUse.filter(x =>
      /caption|side-color-field|dark-anchor|metric|sidebar|connector|priority|highlight/i.test(x) ||
      (/rail/i.test(x) && !/accent-rail/i.test(x))
    );
    const substantialMicro = micro.filter(x => /caption|sidebar|metric|process|system|equipment|ruler|tag|contact|anchor/i.test(x));
    if (!['cover', 'closing'].includes(type) && colorUse.length > 0 && substantialColorUse.length === 0 && substantialMicro.length === 0) {
      thinAccentOnly += 1;
      findings.push({
        slide: i + 1,
        level: 'review',
        type: 'accentOnlyAsThinLine',
        message: 'primary color appears only as thin decoration; add a caption bar, metric highlight, side field, dark block, or evidence frame'
      });
    }
    if (!['cover', 'closing'].includes(type) && (coverage === 'low' || colorUse.length < 3)) {
      findings.push({
        slide: i + 1,
        level: 'review',
        type: 'themeCoverageLow',
        message: 'slide has too little primary color budget for a finished commercial deck'
      });
    }
    if (!['cover', 'closing'].includes(type) && !micro.some(x => /top-rule|page-number|watermark|caption|rail|sidebar|metric|tag/i.test(x))) {
      findings.push({
        slide: i + 1,
        level: 'review',
        type: 'missingBrandMotif',
        message: 'slide lacks reusable brand motifs such as rule, folio, watermark, caption bar, or rail'
      });
    }
    if (signals.imageCount > 0 && !/caption|frame|showcase|contact|evidence/i.test(String(cp.imageTreatment || ''))) {
      findings.push({
        slide: i + 1,
        level: 'review',
        type: 'weakImageTreatment',
        message: 'image material is present but compositionPlan does not turn it into proof/showcase treatment'
      });
    }
    if (/risk-warning/i.test(intent) && accentRole !== 'risk') {
      roleMismatch += 1;
      findings.push({
        slide: i + 1,
        level: 'review',
        type: 'semanticColorMismatch',
        message: 'risk-warning slide should use risk accentRole'
      });
    }
    if (/case-evidence/i.test(intent) && accentRole !== 'evidence') {
      roleMismatch += 1;
      findings.push({
        slide: i + 1,
        level: 'review',
        type: 'semanticColorMismatch',
        message: 'case-evidence slide should use evidence accentRole'
      });
    }
    if (/value-signal/i.test(intent) && accentRole !== 'data') {
      roleMismatch += 1;
      findings.push({
        slide: i + 1,
        level: 'review',
        type: 'semanticColorMismatch',
        message: 'value-signal slide should use data accentRole'
      });
    }
    if (i > 0) {
      const prev = slides[i - 1] || {};
      const prevCp = prev.compositionPlan || {};
      const prevMicro = Array.isArray(prevCp.microComponents) ? prevCp.microComponents : [];
      const sharedMicro = micro.filter(component => prevMicro.includes(component));
      const sameComposition = String(prevCp.composition || '') === composition;
      const sameTone = String(prevCp.backgroundTone || '') === tone;
      const sameIntent = String(prevCp.themeIntent || prev.themeIntent || '') === intent;
      const sameAccent = String(prevCp.accentRole || prev.accentRole || '') === accentRole;
      if (!['cover', 'closing', 'toc', 'toc-clean', 'chapter-divider'].includes(type) &&
          sameComposition && sameTone && sameIntent && sameAccent && sharedMicro.length >= Math.min(3, micro.length)) {
        findings.push({
          slide: i + 1,
          level: 'review',
          type: 'adjacentLayoutSimilarity',
          message: `slide ${i} and ${i + 1} share composition, tone, theme intent, accent role, and micro-components`
        });
      }
    }
  });
  if (slides.length >= 7 && longestPaleRun >= 4) {
    findings.push({
      level: 'review',
      type: 'tooManyWhitePages',
      message: `deck has ${longestPaleRun} consecutive pale pages; add dark/accent rhythm anchors`
    });
  }
  if (slides.length >= 8 && darkAnchors < 2) {
    findings.push({
      level: 'review',
      type: 'flatPageRhythm',
      message: `deck only has ${darkAnchors} dark/accent rhythm anchors; contact sheet will feel flat`
    });
  }
  if (bodySlides.length >= 6 && generic / bodySlides.length > 0.45) {
    findings.push({
      level: 'review',
      type: 'compositionTooGeneric',
      message: `${generic}/${bodySlides.length} body slides use generic compositions instead of proof-object grammar`
    });
  }
  if (bodySlides.length >= 5 && thinAccentOnly / bodySlides.length > 0.35) {
    findings.push({
      level: 'review',
      type: 'accentOnlyAsThinLine',
      message: `${thinAccentOnly}/${bodySlides.length} body slides use accent only as hairlines or folios; theme coverage needs stronger carriers`
    });
  }
  if (bodySlides.length >= 5 && roleMismatch / bodySlides.length > 0.2) {
    findings.push({
      level: 'review',
      type: 'semanticColorMismatch',
      message: `${roleMismatch}/${bodySlides.length} body slides use a semantic accent role that does not match their theme intent`
    });
  }
  const last = slides[slides.length - 1] || {};
  const lastCp = last.compositionPlan || {};
  const lastColorUse = Array.isArray(lastCp.primaryColorUse) ? lastCp.primaryColorUse : [];
  const lastMicro = Array.isArray(lastCp.microComponents) ? lastCp.microComponents : [];
  const hasClosingAnchor = lastColorUse.includes('dark-anchor') ||
    lastMicro.some(x => /contact-block|back-cover-anchor|dark-sidebar|rhythm-anchor/i.test(x)) ||
    /dark|stage/i.test(String(lastCp.backgroundTone || ''));
  if ((last.type || '') === 'closing' && (String(lastCp.themeCoverage || '') !== 'high' || !hasClosingAnchor)) {
    findings.push({
      slide: slides.length,
      level: 'review',
      type: 'closingLacksWeight',
      message: 'closing slide should carry high theme coverage and a visible back-cover anchor'
    });
  }
  return findings;
}

function referenceRecipeCandidates(plan = {}, s = {}, opts = {}) {
  const signals = opts.signals || contentSignals(plan, s);
  const recipes = [
    ...(REFERENCE_LAYOUT_LIBRARY.recipes || []),
    ...(REFERENCE_RECIPE_LIBRARY.recipes || []),
    ...PRIORITY_PAGE_FAMILY_RECIPES
  ];
  if (!recipes.length) return [];
  const text = flattenText(s);
  const words = new Set(textKeywords(text));
  const industry = plan.industry || 'general-operations';
  const industryIds = new Set(industryMatchIds(industry));
  const documentType = plan.documentType ||
    (plan.materialIntelligence && plan.materialIntelligence.pptType) ||
    plan.ppt_type ||
    plan.pptType ||
    '';
  const role = slideRole(s);
  const themeIntent = s.themeIntent || (s.compositionPlan && s.compositionPlan.themeIntent) || themeIntentFor(plan, s, signals.index || 0, signals.total || 1, signals);
  const requestedVariant = String(s.layoutVariant || s.variant || s.proofObject || s.proof_object || '').trim();
  const requestedVariantIsPriority = HIGH_VALUE_PAGE_FAMILIES.has(requestedVariant);
  const explicitReferenceCategories = compactUnique([
    ...(Array.isArray(plan.referenceCategoryIds) ? plan.referenceCategoryIds : []),
    ...(Array.isArray(s.referenceCategoryIds) ? s.referenceCategoryIds : []),
    s.referenceCategoryId,
    s.categoryId
  ]);
  const scores = recipes.map(recipe => {
    let score = 0;
    const recipeFamilies = new Set([
      recipe.renderType,
      recipe.slideType,
      ...(recipe.pageFamilies || []),
      ...((recipe.designSyntax && recipe.designSyntax.suitablePageFamilies) || [])
    ].filter(Boolean));
    const exactVariantMatch = Boolean(requestedVariant && (
      recipe.layoutVariant === requestedVariant ||
      recipe.proofObject === requestedVariant ||
      (recipe.designSyntax && recipe.designSyntax.proofObject === requestedVariant)
    ));
    if (exactVariantMatch) score += requestedVariantIsPriority ? 24 : 10;
    else if (requestedVariantIsPriority) score -= 4;
    if (s.type && s.type !== 'auto') {
      if (recipeFamilies.has(s.type)) score += 3;
      else score -= exactVariantMatch ? 1 : 6;
    }
    const recipeIndustryFit = compactUnique([
      ...(recipe.industryFit || []),
      ...((recipe.designSyntax && recipe.designSyntax.industry) || []),
      ...(recipe.industry || [])
    ]);
    const recipeHasIndustryFit = recipeIndustryFit.length > 0;
    const industryMatches = recipeIndustryFit.some(id => industryIds.has(id));
    if ((recipe.roles || []).includes(role)) score += 3;
    if (industryMatches) score += 5;
    else if (recipeHasIndustryFit && HIGH_VALUE_PAGE_FAMILIES.has(recipe.layoutVariant || recipe.proofObject || '')) score -= 7;
    if (documentType && (recipe.signals || []).includes(documentType)) score += 4;
    if (documentType && recipe.taxonomy && recipe.taxonomy.documentType === documentType) score += 5;
    if (documentType && recipe.designSyntax && recipe.designSyntax.materialType === documentType) score += 5;
    if (plan.pagePurpose && (recipe.signals || []).includes(plan.pagePurpose)) score += 3;
    if (plan.visualIntent && (recipe.signals || []).includes(plan.visualIntent)) score += 2;
    if (recipe.renderType && recipe.renderType === s.type) score += 4;
    if (recipe.slideType === s.type) score += 4;
    if (recipe.layoutVariant && recipe.layoutVariant === (s.layoutVariant || s.variant)) score += 6;
    if (recipe.layoutVariant && recipe.layoutVariant === (s.proofObject || s.proof_object)) score += 5;
    if (recipe.proofObject && recipe.proofObject === (s.proofObject || s.proof_object)) score += 5;
    if (recipe.themeIntent && recipe.themeIntent === themeIntent) score += 2;
    if (recipe.source && explicitReferenceCategories.includes(recipe.source.categoryId)) score += 8;
    if (recipe.taxonomy && recipe.taxonomy.pageRole && String(text).toLowerCase().includes(String(recipe.taxonomy.pageRole).toLowerCase())) score += 2;
    (recipe.signals || []).forEach(sig => {
      const normalized = String(sig).toLowerCase();
      if (words.has(normalized) || String(text).toLowerCase().includes(normalized)) score += 2;
    });
    ((recipe.taxonomy && recipe.taxonomy.labels) || []).forEach(label => {
      const normalized = String(label).toLowerCase();
      if (normalized && String(text).toLowerCase().includes(normalized)) score += 1.4;
    });
    if (recipe.id.includes('kpi') && signals.hasMetrics) score += 5;
    if (recipe.id.includes('value-creation') && signals.hasStrategyMap) score += 5;
    if (recipe.id.includes('gallery') && signals.hasGallery) score += 5;
    if (recipe.id.includes('manifesto') && signals.hasManifesto) score += 5;
    if (recipe.id.includes('risk') && signals.hasRisk) score += 5;
    if (recipe.id.includes('architecture') && signals.hasArchitecture) score += 4;
    if (recipe.id.includes('before-after') && signals.hasComparison) score += 4;
    if (recipe.id.includes('flow') && signals.hasTimeline) score += 4;
    if (recipe.slideType === s.type) score += 4;
    if (recipe.layoutVariant && /beauty|consumer|brand-world|proof-photo|product-evidence/i.test(recipe.layoutVariant) && /美妆|美容|消费|品牌|产品|门店|会员|lookbook|retail|beauty|fashion/i.test(text)) score += 5;
    if (recipe.layoutVariant && /culture|mission|people|principle/i.test(recipe.layoutVariant) && /文化|使命|愿景|价值观|团队|招聘|people|culture|mission/i.test(text)) score += 5;
    if (recipe.layoutVariant && /materiality|governance|guidance|risk/i.test(recipe.layoutVariant) && /重要性|治理|风险|指引|合规|governance|materiality|guidance/i.test(text)) score += 5;
    if (recipe.scores && Number.isFinite(recipe.scores.overall)) score += Math.max(0, Math.min(4, (recipe.scores.overall - 66) / 5));
    return Object.assign({ score }, recipe);
  })
    .filter(recipe => recipe.score > 0)
    .sort((a,b) => b.score - a.score);
  return typeof opts.limit === 'number' ? scores.slice(0, opts.limit) : scores;
}

function selectReferenceRecipe(plan = {}, s = {}, signals = contentSignals(plan, s)) {
  const scores = referenceRecipeCandidates(plan, s, { signals });
  const best = scores[0];
  if (!best) return null;
  return best;
}

function recipeCompatibleWithSlideType(recipe = null, type = '') {
  if (!recipe || !type) return false;
  const families = new Set([
    recipe.renderType,
    recipe.slideType,
    ...(recipe.pageFamilies || []),
    ...((recipe.designSyntax && recipe.designSyntax.suitablePageFamilies) || [])
  ].filter(Boolean));
  return families.has(type);
}

function generatedAssetPrompt(plan = {}, s = {}, recipe = null) {
  const design = slideDesign(plan, s);
  const role = (s.visual && s.visual.role) || design.imageRole || (recipe && recipe.assetRole) || 'abstract';
  const normalizedRole = normalizeAssetRole(role);
  const patterns = REFERENCE_LAYOUT_LIBRARY.generatedAssetPromptPatterns || {};
  const pattern = patterns[normalizedRole] || patterns.abstract;
  if (!pattern) return '';
  const profile = industryVisualPolicy(plan);
  const industryLabel = profile.label || plan.industry || 'business';
  const visualBrief = (s.visual && s.visual.prompt) || s.assetBrief || s.coverInsight || s.claim || s.subtitle || s.title || plan.title || 'premium commercial visual';
  const paletteName = selectPaletteName(plan);
  return pattern
    .replace(/\{industryLabel\}/g, industryLabel)
    .replace(/\{visualBrief\}/g, String(visualBrief).replace(/\s+/g, ' ').trim())
    .replace(/\{paletteName\}/g, paletteName);
}

function assetRoleNeedsImage(role = '') {
  const r = String(role || '').toLowerCase();
  if (!r || ['none', 'diagram', 'structure', 'comparison'].includes(r)) return false;
  if (r.includes('none-or') || r.includes('or-none')) return false;
  return true;
}

function normalizeAssetRole(role = '') {
  const r = String(role || '').toLowerCase();
  if (r.includes('background')) return 'background';
  if (r.includes('showcase') || r.includes('product')) return 'showcase';
  if (r.includes('gallery')) return 'gallery';
  if (r.includes('evidence') || r.includes('screenshot') || r.includes('map') || r.includes('portrait')) return 'evidence';
  return ['background', 'showcase', 'evidence', 'gallery'].includes(r) ? r : 'abstract';
}

function recipeGenerationRule(recipe = {}) {
  const text = String(recipe.generatedAsset || '').toLowerCase();
  if (!text || text === 'none' || text.includes('none;')) return 'none';
  if (text.includes('not allowed') || text.includes('disallow') || text.includes('blocked')) return 'blocked';
  if (text.includes('optional')) return 'optional';
  if (text.includes('allowed') || text.includes('create')) return 'allowed';
  return 'none';
}

function generatedAssetPolicy(plan = {}, s = {}, recipe = null, design = null) {
  const role = normalizeAssetRole((s.visual && s.visual.role) || (design && design.imageRole) || (recipe && recipe.assetRole) || 'abstract');
  const rule = recipeGenerationRule(recipe || {});
  const text = flattenText(s);
  const slideHasImages = (Array.isArray(s.images) && s.images.length > 0) ||
    (s.visual && Array.isArray(s.visual.images) && s.visual.images.length > 0) ||
    Boolean(s.image || (s.visual && s.visual.image));
  const existingAsset = mediaForRole(plan, s, slideRole(s));
  const requested = (s.visual && s.visual.mode === 'generated') || s.assetMode === 'generated';
  const hasBoundAsset = slideHasImages || (Boolean(existingAsset) && !requested);
  const recipeNeedsImage = recipe && assetRoleNeedsImage(recipe.assetRole || role);
  const routeMode = resolveVisualMode(plan, s, slideRole(s));
  const referenceText = String(
    (recipe && [
      recipe.generatedAsset,
      recipe.layoutVariant,
      recipe.proofObject,
      recipe.assetRole,
      recipe.mainVisualMethod,
      recipe.themeIntent,
      recipe.renderType
    ].filter(Boolean).join(' ')) || ''
  );
  const imageLedReference = recipeNeedsImage &&
    /captioned-real-asset|showcase|gallery|proof|cover|product|beauty|people|lookbook/i.test(referenceText);
  const policy = industryVisualPolicy(plan);
  const recipeCanGenerate = ['optional', 'allowed'].includes(rule) || (rule === 'none' && imageLedReference);
  const autoGenerateMissing = ['auto-generate-missing', 'generate-missing', 'luxury', 'image-rich'].includes(String(plan.assetMode || plan.visualIntent || ''));
  const syntheticOnly = /synthetic|abstract|generic|placeholder|mood|atmospheric|concept|mock/i.test(String(recipe && recipe.generatedAsset || '')) ||
    ['background', 'showcase', 'gallery', 'abstract'].includes(role);
  const factualRisk = FACTUAL_GENERATED_ASSET_RISK.test(text) && ['evidence', 'gallery', 'showcase'].includes(role);
  const shouldGenerate = !hasBoundAsset && (
    requested ||
    (autoGenerateMissing && (recipeNeedsImage || (design && design.wantsImage))) ||
    (recipeNeedsImage && recipeCanGenerate && routeMode !== 'solid') ||
    (recipeNeedsImage && recipeCanGenerate && ['case-gallery', 'hybrid'].includes(policy.visualMode || ''))
  );
  if (!shouldGenerate) {
    return {
      status: hasBoundAsset ? 'bound' : 'none',
      role,
      mustBind: false,
      syntheticOnly,
      reason: hasBoundAsset ? 'real or generated asset already bound' : 'layout can render natively without generated image'
    };
  }
  if (rule === 'blocked' || (factualRisk && (requested || recipeCanGenerate))) {
    return {
      status: 'blocked',
      role,
      mustBind: false,
      syntheticOnly: true,
      reason: rule === 'blocked'
        ? 'reference recipe disallows generated assets for this proof object'
        : 'visible content implies factual/customer/site evidence; generated assets cannot substitute for proof'
    };
  }
  return {
    status: requested || autoGenerateMissing ? 'required' : 'optional',
    role,
    mustBind: requested || autoGenerateMissing,
    syntheticOnly,
    reason: requested || autoGenerateMissing
      ? 'slide explicitly requests generated visual asset'
      : 'reference layout can use a generated bitmap when no source image is available'
  };
}

function clampText(text, maxChars) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!maxChars || s.length <= maxChars) return s;
  return `${s.slice(0, Math.max(0, maxChars - 1)).trim()}…`;
}

const CHART_SPEC_SUPPRESSED_NATIVE_VARIANTS = new Set([
  'brand-world-and-business-proof',
  'consumer-proof-photo-grid',
  'control-stack',
  'lookbook-story',
  'process-board',
  'product-evidence-story',
  'value-creation-process-map'
]);

function nativeVariantOwnsChartZone(s = {}) {
  const variant = String(s.layoutVariant || s.variant || '');
  return CHART_SPEC_SUPPRESSED_NATIVE_VARIANTS.has(variant) && !(s.chartSpec && s.chartSpec.version === 'chartSpec/v1');
}

function normalizeSlide(plan = {}, s = {}, index = 0, total = 1) {
  const typePick = recommendSlideType(plan, s, index, total);
  const routedInput = Object.assign({}, s);
  const routeSanitization = {
    version: 'route-sanitization/v1',
    mode: plan.normalizationMode || plan.normalization_mode || (plan.finalized || plan.plannerFinalized ? 'finalized' : 'compat'),
    removed: [],
    recomputed: [],
    active: []
  };
  const recordRemoval = (field, value, reason) => {
    routeSanitization.removed.push({
      field,
      reason,
      previousValueRef: `previous${field.charAt(0).toUpperCase()}${field.slice(1)}`,
      previousKind: value && typeof value === 'object' ? (Array.isArray(value) ? 'array' : 'object') : typeof value
    });
  };
  if (routedInput.layoutVariant && !layoutVariantCompatibleWithType(typePick.type, routedInput.layoutVariant)) {
    recordRemoval('layoutVariant', routedInput.layoutVariant, `layoutVariant incompatible with normalized type ${typePick.type}`);
    routedInput.previousLayoutVariant = routedInput.previousLayoutVariant || routedInput.layoutVariant;
    delete routedInput.layoutVariant;
  }
  if (routedInput.variant && (!routedInput.layoutVariant || routedInput.variant !== routedInput.layoutVariant) && !layoutVariantCompatibleWithType(typePick.type, routedInput.variant)) {
    recordRemoval('variant', routedInput.variant, `variant incompatible with normalized type ${typePick.type}`);
    routedInput.previousVariant = routedInput.previousVariant || routedInput.variant;
    delete routedInput.variant;
  }
  const proofObjectVariant = String(routedInput.proofObject || routedInput.proof_object || '').trim();
  if (proofObjectVariant && HIGH_VALUE_PAGE_FAMILIES.has(proofObjectVariant) && !layoutVariantCompatibleWithType(typePick.type, proofObjectVariant)) {
    recordRemoval('proofObject', proofObjectVariant, `proofObject incompatible with normalized type ${typePick.type}`);
    routedInput.previousProofObject = routedInput.previousProofObject || proofObjectVariant;
    delete routedInput.proofObject;
    delete routedInput.proof_object;
  }
  if (!['metric-comparison', 'industry-chart', 'finance-bridge'].includes(typePick.type) && routedInput.chartSpec) {
    recordRemoval('chartSpec', routedInput.chartSpec, `chartSpec not valid for normalized type ${typePick.type}`);
    routedInput.previousChartSpec = routedInput.previousChartSpec || routedInput.chartSpec;
    delete routedInput.chartSpec;
    delete routedInput.chartSpecInferred;
  }
  if (!['metric-comparison', 'industry-chart', 'finance-bridge'].includes(typePick.type) && (routedInput.dataComponent || routedInput.data_component)) {
    recordRemoval('dataComponent', routedInput.dataComponent || routedInput.data_component, `dataComponent not valid for normalized type ${typePick.type}`);
    routedInput.previousDataComponent = routedInput.previousDataComponent || routedInput.dataComponent || routedInput.data_component;
    delete routedInput.dataComponent;
    delete routedInput.data_component;
  }
  const signals = contentSignals(plan, s, index, total);
  const recipe = selectReferenceRecipe(plan, Object.assign({}, routedInput, { type:typePick.type }), signals);
  const out = Object.assign({}, routedInput, {
    type: typePick.type,
    layoutRationale: routedInput.layoutRationale || typePick.reason,
    referenceRecipe: routedInput.referenceRecipe || (recipe ? {
      id: recipe.id,
      score: recipe.score,
      layout: recipe.layout,
      proofObject: recipe.proofObject,
      assetRole: recipe.assetRole,
      generatedAsset: recipe.generatedAsset,
      mainVisualMethod: recipe.designSyntax && recipe.designSyntax.mainVisualMethod
    } : undefined)
  });
  if (!out.layoutVariant) {
    const pickedVariant = pickLayoutVariant(plan, routedInput, out.type, signals);
    out.layoutVariant = pickedVariant || (recipe && recipe.score >= 8 && recipeCompatibleWithSlideType(recipe, out.type) ? recipe.layoutVariant : undefined);
  }
  const claimRules = (VISUAL_SYSTEM.contentIntelligence && VISUAL_SYSTEM.contentIntelligence.claimSpine) || {};
  if (!out.claim) {
    out.claim = clampText(flattenText([
      out.coverInsight,
      out.subtitle,
      out.intro,
      out.businessLogic && (out.businessLogic.action || out.businessLogic.impact || out.businessLogic.currentState),
      out.note,
      out.title
    ]), claimRules.introMaxChars || 68);
  }
  if (Array.isArray(out.cards)) {
    out.cards = out.cards.map(card => Object.assign({}, card, {
      body: clampText(card.body || card.text || '', claimRules.cardBodyMaxChars || 54)
    }));
  }
  if (out.type === 'metric-comparison' && !Array.isArray(out.metrics)) {
    out.metrics = deriveMetricsFromSlide(out).slice(0, 4);
  }
  const shouldPlanChartSpec = ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(out.type) && !nativeVariantOwnsChartZone(out) && slideHasChartIntent(out);
  if (shouldPlanChartSpec && (!out.chartSpec || out.chartSpec.version !== 'chartSpec/v1')) {
    const chartSpec = routeChartSpec(plan, out, { index:index + 1, total });
    if (chartSpec) {
      out.chartSpec = chartSpec;
      out.chartSpecInferred = true;
    }
  }
  if (out.type === 'manifesto' && !Array.isArray(out.values) && Array.isArray(out.items)) {
    out.values = out.items.slice(0, 4).map(v => ({ title: String(v), body: '' }));
  }
  if (out.type === 'closing' && out.referenceRecipe && out.referenceRecipe.id === 'closing-editorial-statement' && !out.closingVariant) {
    const tone = (((PALETTES[selectPaletteName(plan)] || {}).presentation || {}).coverTone) || '';
    out.closingVariant = (tone === 'light' || tone === 'split') ? 'editorial-light' : 'decision-board';
  }
  const design = slideDesign(plan, out);
  out.compositionPlan = out.compositionPlan || compositionPlan(plan, out, index, total, contentSignals(plan, out, index, total), recipe, design);
  const plannedComponents = componentPlanFor(plan, out, index, total, contentSignals(plan, out, index, total), out.compositionPlan);
  if (routeSanitization.removed.length) {
    routeSanitization.recomputed.push({
      field: 'componentPlan',
      reason: 'component plan recomputed after route-sensitive metadata normalization'
    });
  }
  out.componentPlan = Object.assign({}, plannedComponents, out.componentPlan && out.componentPlan.version ? out.componentPlan : {}, {
    components: plannedComponents.components,
    componentIds: plannedComponents.componentIds,
    rulesApplied: plannedComponents.rulesApplied
  });
  out.compositionPlan = Object.assign({}, out.compositionPlan, {
    microComponents: compactUnique([
      ...((out.compositionPlan && out.compositionPlan.microComponents) || []),
      ...(out.componentPlan.componentIds || [])
    ])
  });
  out.themeIntent = out.themeIntent || out.compositionPlan.themeIntent;
  out.accentRole = out.accentRole || out.compositionPlan.accentRole;
  out.layoutEnergy = out.layoutEnergy || out.compositionPlan.layoutEnergy;
  out.visualDensity = out.visualDensity || out.compositionPlan.visualDensity || out.compositionPlan.density;
  out.rhythmTransition = out.rhythmTransition || out.compositionPlan.rhythmTransition;
  const assetGeneration = generatedAssetPolicy(plan, out, recipe, design);
  if (routeSanitization.removed.length && out.assetGeneration) {
    out.previousAssetGeneration = out.previousAssetGeneration || out.assetGeneration;
    routeSanitization.recomputed.push({
      field: 'assetGeneration',
      reason: 'asset-generation decision recomputed after route-sensitive metadata normalization'
    });
    out.assetGeneration = Object.assign({}, assetGeneration, {
      previousDecisionStale: true,
      staleForRoute: false
    });
  } else {
    out.assetGeneration = out.assetGeneration || assetGeneration;
  }
  if (routeSanitization.removed.length && out.generatedAssetPrompt) {
    out.previousGeneratedAssetPrompt = out.previousGeneratedAssetPrompt || out.generatedAssetPrompt;
    delete out.generatedAssetPrompt;
    routeSanitization.removed.push({
      field: 'generatedAssetPrompt',
      reason: 'generated asset prompt removed because route-sensitive metadata changed',
      previousValueRef: 'previousGeneratedAssetPrompt',
      previousKind: 'string'
    });
  }
  if (assetGeneration.status === 'required' && !(out.image || (out.visual && out.visual.image))) {
    out.generatedAssetPrompt = out.generatedAssetPrompt || generatedAssetPrompt(plan, out, recipe);
  }
  routeSanitization.active = [
    'type',
    out.layoutVariant ? 'layoutVariant' : '',
    out.proofObject || out.proof_object ? 'proofObject' : '',
    out.chartSpec ? 'chartSpec' : '',
    out.assetGeneration ? 'assetGeneration' : '',
    out.componentPlan ? 'componentPlan' : ''
  ].filter(Boolean);
  if (routeSanitization.removed.length || routeSanitization.recomputed.length) {
    out.routeSanitization = routeSanitization;
  }
  return applyPlanAuthoredSourceTrace(plan, out, index);
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

function normalizeDeckPlan(plan = {}) {
  const slides = Array.isArray(plan.slides) ? plan.slides : [];
  const routed = slides.map((s, i) => normalizeSlide(plan, s, i, slides.length));
  const narrated = applyNarrativeMetadata(plan, routed);
  const sequenced = (plan.autoSequence === true || plan.narrativeMode === 'auto-sequence')
    ? sequenceSlidesByNarrative(plan, narrated)
    : narrated;
  const diversified = applyDataComponentDiversity(plan, sequenced);
  const rhythmic = applyDeckRhythm(plan, diversified);
  const claimSpine = claimSpineForSlides(plan, rhythmic);
  return Object.assign({}, plan, {
    deckNarrative: deckNarrativeSummary(plan, rhythmic),
    claimSpine,
    slides: rhythmic
  });
}

function claimSpineForSlides(plan = {}, slides = []) {
  return slides
    .map((slide, i) => Object.assign({}, slide, { __slideIndex: i }))
    .filter(slide => !['cover', 'cover-dark', 'closing', 'closing-dark', 'toc', 'toc-clean', 'chapter-divider'].includes(slide.type || ''))
    .map(slide => ({
      slide: slide.__slideIndex + 1,
      type: slide.type || '',
      title: slide.title || '',
      claim: slide.claim || slide.subtitle || slide.intro || slide.title || '',
      proofObject: preferredProofObjectIdForTrace(slide) || '',
      sourceIds: compactUnique([
        ...(((slide.sourceTrace || {}).sourceIds) || []),
        ...(((slide.proof || {}).sourceIds) || [])
      ])
    }));
}

function applyDataComponentDiversity(plan = {}, slides = []) {
  const seenRoutes = new Map();
  return slides.map((slide, i) => {
    const key = routeKey(slide);
    const body = !['cover', 'closing', 'toc', 'toc-clean', 'chapter-divider'].includes(slide.type || '');
    const imageCaseRoute = ['case-gallery', 'gallery', 'portfolio', 'product-showcase'].includes(slide.type || '') ||
      (imageRefsForSlide(slide).length > 0 && /gallery|proof|photo|mosaic|evidence|product|lookbook/i.test(proofObjectIdForSlide(slide)));
    const processRoute = ['timeline', 'timeline-dark'].includes(slide.type || '') ||
      Array.isArray(slide.phases) ||
      Array.isArray(slide.actions) ||
      Array.isArray(slide.steps) ||
      Array.isArray(slide.timeline) ||
      Array.isArray(slide.milestones) ||
      /process|timeline|pathway|flywheel|loop/i.test(String(slide.layoutVariant || slide.variant || ''));
    const grammarVariant = dataGrammarVariant(plan, slide, contentSignals(plan, slide, i, slides.length));
    let next = slide;
    if (body && !imageCaseRoute && !processRoute && seenRoutes.has(key) && grammarVariant && key !== `industry-chart:${grammarVariant}`) {
      next = Object.assign({}, slide, {
        type: 'industry-chart',
        layoutVariant: grammarVariant,
        variant: grammarVariant,
        layoutRationale: `data component diversity: ${grammarVariant}`
      });
      next.compositionPlan = undefined;
      next.componentPlan = undefined;
      next = normalizeSlide(plan, next, i, slides.length);
    }
    const nextKey = routeKey(next);
    seenRoutes.set(nextKey, (seenRoutes.get(nextKey) || 0) + 1);
    return next;
  });
}

function applyDeckRhythm(plan = {}, slides = []) {
  if (!slides.length) return slides;
  let lightRun = 0;
  let lastIntent = '';
  return slides.map((slide, i) => {
    const cp = Object.assign({}, slide.compositionPlan || {});
    const intent = cp.themeIntent || themeIntentFor(plan, slide, i, slides.length);
    const accentRole = cp.accentRole || accentRoleFor(plan, slide, i, slides.length, intent);
    const tone = cp.backgroundTone || 'tinted-paper';
    const isDark = /dark|stage/i.test(tone);
    lightRun = isDark ? 0 : lightRun + 1;
    const next = Object.assign({}, cp);
    const use = Array.isArray(next.primaryColorUse) ? next.primaryColorUse.slice() : [];
    const micros = Array.isArray(next.microComponents) ? next.microComponents.slice() : [];
    next.themeIntent = intent;
    next.accentRole = accentRole;
    next.layoutEnergy = next.layoutEnergy || layoutEnergyFor(plan, slide, i, slides.length, intent);
    next.visualDensity = next.visualDensity || visualDensityFor(plan, slide, i, slides.length);
    next.rhythmTransition = next.rhythmTransition || rhythmTransitionFor(plan, slide, i, slides.length, intent);
    next.semanticColorRoles = next.semanticColorRoles || semanticColorRolesFor(plan, accentRole);
    if (i === 0) {
      next.rhythmRole = 'opener';
      next.themeCoverage = 'high';
      next.backgroundTone = isDark ? tone : 'accent-wash';
    } else if (i === slides.length - 1) {
      next.rhythmRole = 'closer';
      next.themeCoverage = 'high';
      next.backgroundTone = /dark|stage|accent/i.test(String(next.backgroundTone || '')) ? next.backgroundTone : 'dark-stage';
      use.push('dark-anchor');
      micros.push('rhythm-anchor', 'back-cover-anchor');
    } else if (/risk-warning|value-signal/i.test(intent)) {
      next.backgroundTone = 'accent-wash';
      next.themeCoverage = next.themeCoverage === 'low' ? 'medium' : next.themeCoverage;
      use.push(accentRole === 'risk' ? 'risk-band' : 'metric-highlight', 'side-color-field');
      micros.push('rhythm-anchor');
      lightRun = 1;
    } else if (/case-evidence|company-proof/i.test(intent)) {
      next.themeCoverage = 'high';
      use.push('caption-bar', 'evidence-frame');
      micros.push('caption-bar', 'evidence-frame');
    } else if (lightRun >= 3) {
      next.backgroundTone = 'accent-wash';
      next.themeCoverage = next.themeCoverage === 'high' ? 'high' : 'medium';
      use.push('side-color-field');
      micros.push('rhythm-anchor');
      lightRun = 1;
    }
    if (i > 0 && i % 4 === 0 && !isDark) {
      next.backgroundTone = next.backgroundTone === 'tinted-paper' ? 'accent-wash' : next.backgroundTone;
      use.push('side-color-field');
      micros.push('rhythm-anchor');
    }
    next.primaryColorUse = compactUnique(use);
    next.microComponents = compactUnique(micros);
    const rhythmTransition = lastIntent && lastIntent !== intent ? next.rhythmTransition || 'theme-shift' : next.rhythmTransition;
    lastIntent = intent;
    return Object.assign({}, slide, {
      themeIntent: intent,
      accentRole,
      layoutEnergy: next.layoutEnergy,
      visualDensity: next.visualDensity,
      rhythmTransition,
      compositionPlan: Object.assign({}, next, { rhythmTransition })
    });
  });
}

function makeDeckContext(plan = {}) {
  const profileBase = resolveStyleProfile(plan.style || 'premium-commercial-keynote');
  const paletteName = selectPaletteName(plan);
  const colors = paletteToColors(PALETTES[paletteName], profileBase.C);
  const profile = Object.assign({}, profileBase, { palette: paletteName, C: colors });
  return {
    visualSystem: VISUAL_SYSTEM,
    fontStack: FONT_STACK,
    palettes: PALETTES,
    visualRouter: VISUAL_ROUTER,
    profile,
    colors,
    paletteName,
    policy: industryVisualPolicy(plan),
    copyPolicy: copyPolicyFor(plan),
    copyPolicyText: (key, fallback = '') => copyPolicyText(plan, key, fallback),
    copyPolicyList: (key, fallback = []) => copyPolicyList(plan, key, fallback),
    languagePolicy: languagePolicyFor(plan),
    localizeMicrocopy: (text, opts = {}) => localizeMicrocopy(plan, text, opts),
    industryDialect: industryDesignDialect(plan),
    typographyProfile: typographyProfileFor(plan),
    typographyFonts: typographyFontSet(plan),
    resolveTypeToken: (role, opts = {}) => resolveTypeToken(plan, role, opts),
    normalizeTypographyOptions: (text, opts = {}, role = '') => normalizeTypographyOptions(plan, text, opts, role),
    slideDesign: (s, roleOverride) => slideDesign(plan, s, roleOverride),
    contentSignals: (s, index, total) => contentSignals(plan, s, index, total),
    recommendSlideType: (s, index, total) => recommendSlideType(plan, s, index, total),
    selectReferenceRecipe: (s, index, total) => selectReferenceRecipe(plan, s, contentSignals(plan, s, index, total)),
    generatedAssetPrompt: (s) => generatedAssetPrompt(plan, s),
    generatedAssetPolicy: (s, recipe, design) => generatedAssetPolicy(plan, s, recipe, design),
    normalizeDeckPlan: () => normalizeDeckPlan(plan),
    scoreImageAsset,
    acceptanceAudit: (normalizedPlan) => acceptanceAudit(plan, normalizedPlan),
    auditDeckPlan: (normalizedPlan) => auditDeckPlan(plan, normalizedPlan),
    compositionAudit: (normalizedPlan) => compositionAudit(plan, normalizedPlan),
    contentOverlapAudit: (normalizedPlan) => contentOverlapAudit(plan, normalizedPlan),
    typographyAudit: (normalizedPlan, renderMeta) => typographyAudit(plan, normalizedPlan, renderMeta),
    semanticFrame: (s, index, total) => semanticFrame(plan, s, contentSignals(plan, s, index, total)),
    semanticMeaning: (s, index, total) => semanticMeaning(plan, s, contentSignals(plan, s, index, total)),
    visualAestheticModel: (normalizedPlan) => visualAestheticModel(plan, normalizedPlan),
    industryKnowledgeAudit: (normalizedPlan) => industryKnowledgeAudit(plan, normalizedPlan)
  };
}

module.exports = {
  ASSET_DIR,
  BASE_COLORS,
  FONT_STACK,
  MEDIA_ASSETS,
  INDUSTRY_KNOWLEDGE_BASE,
  INDUSTRY_DESIGN_DIALECTS,
  INDUSTRY_PACK_LIBRARY,
  INDUSTRY_BENCHMARKS,
  COPY_POLICY,
  PALETTES,
  REFERENCE_LAYOUT_LIBRARY,
  REFERENCE_RECIPE_LIBRARY,
  STYLE_PROFILES,
  VISUAL_ROUTER,
  VISUAL_SYSTEM,
  defaultIndustryMedia,
  acceptanceAudit,
  assetAuthorizationGate,
  auditDeckPlan,
  applyNarrativeMetadata,
  applyDeckRhythm,
  accentRoleFor,
  chartAcceptanceGate,
  chartEvidenceQA,
  chartSemanticQA,
  chartVisualQA,
  componentPlanFor,
  componentPlanAudit,
  compositionAudit,
  compositionPlan,
  deckArtDirection,
  deckNarrativeSummary,
  contentOverlapAudit,
  slideContentOverlap,
  commercialReadinessAudit,
  contentSignals,
  copyPolicyFor,
  copyPolicyList,
  copyPolicyText,
  evidenceAudit,
  deriveMetricsFromSlide,
  galleryImages,
  generatedAssetPolicy,
  generatedAssetPrompt,
  chooseFourImageLayout,
  chooseEvidenceImageLayout,
  aestheticSlideScore,
  normalizeTypographyOptions,
  industryKnowledgeAudit,
  industryFitAudit,
  industryBenchmarksFor,
  industryKnowledgeProfile,
  industryDesignDialect,
  industryProofCandidates,
  imageDimensions,
  imageAspectRatio,
  imageQualityProfile,
  industryChartVariant,
  industryMatchIds,
  industryPackFor,
  industryVisualPolicy,
  layoutEnergyFor,
  languagePolicyFor,
  localizeMicrocopy,
  inferDeckLanguage,
  makeDeckContext,
  mediaForRole,
  normalizeDeckPlan,
  normalizeSlide,
  pageCountAudit,
  pageLevelChartScores,
  pageFamily,
  paletteToColors,
  pickLayoutVariant,
  recommendSlideType,
  reportDepthAudit,
  resolveTypeToken,
  referenceRecipeCandidates,
  selectReferenceRecipe,
  resolveAssetPath,
  resolveStyleProfile,
  resolveVisualMode,
  scoreImageAsset,
  selectPaletteName,
  sourceTraceAudit,
  semanticFrame,
  semanticColorRolesFor,
  semanticMeaning,
  sequenceSlidesByNarrative,
  slideDesign,
  slideRole,
  slideWantsImage,
  themeIntentFor,
  typographyAudit,
  typographyFontSet,
  typographyProfileFor,
  visualIndustryId,
  visualAestheticModel,
  visualDensityFor,
  rhythmTransitionFor,
  visualRole
};

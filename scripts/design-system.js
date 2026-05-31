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
  createArtDirectionHelpers
} = require('./design/art-direction');
const {
  createAcceptanceAuditHelpers
} = require('./design/acceptance-audit');
const {
  assetRoleNeedsImage,
  createAssetGenerationHelpers,
  normalizeAssetRole
} = require('./design/asset-generation');
const {
  createReferenceRecipeHelpers,
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
  createContentSignalHelpers
} = require('./design/content-signals');
const {
  createSemanticModelHelpers
} = require('./design/semantic-model');
const {
  createCompositionPlanningHelpers
} = require('./design/composition-planning');
const {
  createCompositionStrategyHelpers
} = require('./design/composition-strategy');
const {
  createCompositionAuditHelpers
} = require('./design/composition-audit');
const {
  createComponentPlanHelpers
} = require('./design/component-planning');
const {
  createComponentPlanAuditHelpers
} = require('./design/component-plan-audit');
const {
  createDeckStructureAuditHelpers
} = require('./design/deck-structure-audit');
const {
  createDeckPlanAuditHelpers
} = require('./design/deck-plan-audit');
const {
  createDeckRhythmHelpers
} = require('./design/deck-rhythm');
const {
  createEvidenceAuditHelpers
} = require('./design/evidence-audit');
const {
  createIndustryFitAuditHelpers
} = require('./design/industry-fit-audit');
const {
  createTypographyHelpers
} = require('./design/typography');
const {
  createSourceTraceHelpers
} = require('./design/source-trace');
const {
  createNarrativeHelpers
} = require('./design/narrative');
const {
  createStyleProfileHelpers
} = require('./design/style-profile');
const {
  createVisualMediaHelpers
} = require('./design/visual-media');
const {
  createAestheticModelHelpers
} = require('./design/aesthetic-model');
const {
  clampText,
  compactUnique,
  flattenText,
  keywordHit,
  matchKeywordList,
  textKeywords
} = require('./design/text-utils');
const {
  profileFromIndustryPack
} = require('./design/proof-profile');
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
const {
  contentSignals,
  hasArrayField,
  hasExplicitIndustryChartData,
  hasValueField,
  staleIndustryChartRouteShouldYieldToProcess
} = createContentSignalHelpers({
  flattenText,
  keywordHit,
  overlapText,
  visualSystem: VISUAL_SYSTEM
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
const {
  createSlideRoutingHelpers
} = require('./design/slide-routing');
const {
  createSlideNormalizationHelpers
} = require('./design/slide-normalization');

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

const {
  defaultIndustryMedia,
  galleryImages,
  mediaForRole,
  mediaKeyForRole,
  pageFamily,
  resolveAssetPath,
  resolveVisualMode,
  slideDesign,
  slideRole,
  slideWantsImage,
  visualRole
} = createVisualMediaHelpers({
  assetDir: ASSET_DIR,
  assetRoleNeedsImage,
  industryVisualPolicy,
  mediaAssets: MEDIA_ASSETS,
  normalizeAssetRole,
  visualRouter: VISUAL_ROUTER,
  visualSystem: VISUAL_SYSTEM
});

const {
  accentRoleFor,
  deckArtDirection,
  explicitArtValue,
  layoutEnergyFor,
  rhythmTransitionFor,
  selectPaletteName,
  semanticColorRolesFor,
  themeIntentFor,
  visualDensityFor
} = createArtDirectionHelpers({
  compactUnique,
  contentSignals,
  flattenText,
  industryDesignDialect,
  industryVisualPolicy,
  slideRole,
  visualSystem: VISUAL_SYSTEM
});

const {
  backgroundToneFor,
  compositionNameFor,
  imageTreatmentFor,
  microComponentsFor,
  primaryColorUseFor,
  rhythmRoleFor,
  themeCoverageFor
} = createCompositionStrategyHelpers({
  accentRoleFor,
  compactUnique,
  contentSignals,
  dialectColorCarriersFor,
  dialectComponentsFor,
  explicitArtValue,
  flattenText,
  industryDesignDialect,
  normalizeAssetRole,
  palettes: PALETTES,
  selectPaletteName,
  slideDesign,
  slideRole,
  slideWantsImage,
  themeIntentFor
});

const {
  compositionPlan,
  zonePlanFor
} = createCompositionPlanningHelpers({
  accentRoleFor,
  backgroundToneFor,
  compactUnique,
  compositionNameFor,
  contentSignals,
  dialectComponentsFor,
  imageTreatmentFor,
  industryDesignDialect,
  layoutEnergyFor,
  microComponentsFor,
  primaryColorUseFor,
  rhythmRoleFor,
  rhythmTransitionFor,
  semanticColorRolesFor,
  slideDesign,
  slideRole,
  themeCoverageFor,
  themeIntentFor,
  visualDensityFor
});

const {
  componentPlanFor
} = createComponentPlanHelpers({
  chartSpecToComponentId,
  compactUnique,
  componentCapabilityFor,
  contentSignals,
  dialectComponentsFor,
  flattenText,
  hasExplicitChartSignal,
  industryDesignDialect,
  proofObjectIdForSlide,
  routeChartSpec,
  slideHasChartIntent,
  themeIntentFor
});

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

const {
  dataGrammarVariant,
  industryChartVariant,
  industryProofCandidates,
  semanticFrame,
  semanticMeaning,
  semanticRelationProfile
} = createSemanticModelHelpers({
  contentSignals,
  flattenText,
  hasArrayField,
  hasValueField,
  industryKnowledgeProfile,
  matchKeywordList,
  semanticRelationPatterns: SEMANTIC_RELATION_PATTERNS,
  visualIndustryId
});

const {
  inferNarrativeRole,
  routeKey,
  routeMatches,
  applyNarrativeMetadata,
  sequenceSlidesByNarrative,
  deckNarrativeSummary
} = createNarrativeHelpers({
  contentSignals,
  semanticFrame,
  semanticMeaning,
  highValuePageFamilies: HIGH_VALUE_PAGE_FAMILIES,
  layoutVariantCompatibleWithType
});

const {
  hasCommercialLogicChain,
  aestheticSlideScore,
  visualAestheticModel
} = createAestheticModelHelpers({
  contentSignals,
  flattenText,
  normalizeDeckPlan,
  routeKey,
  semanticMeaning,
  slideRole
});

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

const {
  evidenceAudit
} = createEvidenceAuditHelpers({
  normalizeDeckPlan,
  slideProofObject,
  sourceTraceAudit,
  sourceTraceForSlide
});

const {
  pageCountAudit,
  reportDepthAudit
} = createDeckStructureAuditHelpers({
  hasCommercialLogicChain,
  normalizeDeckPlan,
  proofObjectIdForSlide
});

const {
  componentPlanAudit
} = createComponentPlanAuditHelpers({
  flattenText,
  hasComponentCapability,
  normalizeDeckPlan
});

const {
  industryFitAudit
} = createIndustryFitAuditHelpers({
  flattenText,
  industryExpressionRules: INDUSTRY_EXPRESSION_RULES,
  industryPackFor,
  normalizeDeckPlan,
  proofObjectIdForSlide,
  visualIndustryId
});

const {
  compositionAudit
} = createCompositionAuditHelpers({
  contentSignals,
  normalizeDeckPlan
});

const {
  visibleProductionCopyIssues,
  auditDeckPlan
} = createDeckPlanAuditHelpers({
  compositionAudit,
  contentOverlapAudit,
  contentSignals,
  flattenText,
  hasCommercialLogicChain,
  industryExpressionRules: INDUSTRY_EXPRESSION_RULES,
  industryKnowledgeAudit,
  normalizeDeckPlan,
  productionCopyBans: VISIBLE_PRODUCTION_COPY_BANS,
  routeKey,
  routeMatches,
  visualAestheticModel,
  visualIndustryId
});

const {
  acceptanceAudit,
  commercialReadinessAudit
} = createAcceptanceAuditHelpers({
  assetAuthorizationGate,
  auditDeckPlan,
  chartAcceptanceGate,
  chartEvidenceQA,
  chartSemanticQA,
  chartVisualQA,
  componentPlanAudit,
  compositionAudit,
  evidenceAudit,
  industryFitAudit,
  industryKnowledgeAudit,
  normalizeDeckPlan,
  pageCountAudit,
  pageLevelChartScores,
  reportDepthAudit,
  sourceTraceAudit,
  visualAestheticModel
});

const {
  recipeCompatibleWithSlideType,
  referenceRecipeCandidates,
  selectReferenceRecipe
} = createReferenceRecipeHelpers({
  compactUnique,
  contentSignals,
  flattenText,
  highValuePageFamilies: HIGH_VALUE_PAGE_FAMILIES,
  industryMatchIds,
  priorityPageFamilyRecipes: PRIORITY_PAGE_FAMILY_RECIPES,
  referenceLayoutLibrary: REFERENCE_LAYOUT_LIBRARY,
  referenceRecipeLibrary: REFERENCE_RECIPE_LIBRARY,
  slideRole,
  textKeywords,
  themeIntentFor
});

const {
  generatedAssetPolicy,
  generatedAssetPrompt
} = createAssetGenerationHelpers({
  factualGeneratedAssetRisk: FACTUAL_GENERATED_ASSET_RISK,
  flattenText,
  industryVisualPolicy,
  mediaForRole,
  referenceLayoutLibrary: REFERENCE_LAYOUT_LIBRARY,
  resolveVisualMode,
  selectPaletteName,
  slideDesign,
  slideRole
});

const {
  pickLayoutVariant,
  recipeAutoRouteAllowed,
  recommendSlideType
} = createSlideRoutingHelpers({
  contentSignals,
  flattenText,
  highValuePageFamilies: HIGH_VALUE_PAGE_FAMILIES,
  industryChartVariant,
  layoutVariantCompatibleWithType,
  selectReferenceRecipe,
  semanticFrame,
  staleIndustryChartRouteShouldYieldToProcess,
  themeIntentFor,
  visualIndustryId
});

const {
  deriveMetricsFromSlide,
  normalizeSlide
} = createSlideNormalizationHelpers({
  applyPlanAuthoredSourceTrace,
  clampText,
  compactUnique,
  componentPlanFor,
  compositionPlan,
  contentSignals,
  flattenText,
  generatedAssetPolicy,
  generatedAssetPrompt,
  highValuePageFamilies: HIGH_VALUE_PAGE_FAMILIES,
  layoutVariantCompatibleWithType,
  palettes: PALETTES,
  pickLayoutVariant,
  recipeCompatibleWithSlideType,
  recommendSlideType,
  routeChartSpec,
  selectPaletteName,
  selectReferenceRecipe,
  slideDesign,
  slideHasChartIntent,
  visualSystem: VISUAL_SYSTEM
});

const {
  applyDataComponentDiversity,
  applyDeckRhythm,
  claimSpineForSlides
} = createDeckRhythmHelpers({
  accentRoleFor,
  compactUnique,
  contentSignals,
  dataGrammarVariant,
  imageRefsForSlide,
  layoutEnergyFor,
  normalizeSlide,
  preferredProofObjectIdForTrace,
  proofObjectIdForSlide,
  rhythmTransitionFor,
  routeKey,
  semanticColorRolesFor,
  themeIntentFor,
  visualDensityFor
});

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

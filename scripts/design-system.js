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

function createDeckContextHelpers(deps = {}) {
  const {
    FONT_STACK,
    PALETTES,
    VISUAL_ROUTER,
    VISUAL_SYSTEM,
    acceptanceAudit,
    auditDeckPlan,
    compositionAudit,
    contentOverlapAudit,
    copyPolicyFor,
    copyPolicyList,
    copyPolicyText,
    generatedAssetPolicy,
    generatedAssetPrompt,
    industryDesignDialect,
    industryKnowledgeAudit,
    languagePolicyFor,
    localizeMicrocopy,
    normalizeDeckPlan,
    normalizeTypographyOptions,
    paletteToColors,
    recommendSlideType,
    resolveStyleProfile,
    resolveTypeToken,
    scoreImageAsset,
    selectPaletteName,
    selectReferenceRecipe,
    semanticFrame,
    semanticMeaning,
    slideDesign,
    typographyAudit,
    typographyFontSet,
    typographyProfileFor,
    visualAestheticModel
  } = deps;

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
      policy: deps.industryVisualPolicy(plan),
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
      contentSignals: (s, index, total) => deps.contentSignals(plan, s, index, total),
      recommendSlideType: (s, index, total) => recommendSlideType(plan, s, index, total),
      selectReferenceRecipe: (s, index, total) => selectReferenceRecipe(plan, s, deps.contentSignals(plan, s, index, total)),
      generatedAssetPrompt: (s) => generatedAssetPrompt(plan, s),
      generatedAssetPolicy: (s, recipe, design) => generatedAssetPolicy(plan, s, recipe, design),
      normalizeDeckPlan: () => normalizeDeckPlan(plan),
      scoreImageAsset,
      acceptanceAudit: (normalizedPlan) => acceptanceAudit(plan, normalizedPlan),
      auditDeckPlan: (normalizedPlan) => auditDeckPlan(plan, normalizedPlan),
      compositionAudit: (normalizedPlan) => compositionAudit(plan, normalizedPlan),
      contentOverlapAudit: (normalizedPlan) => contentOverlapAudit(plan, normalizedPlan),
      typographyAudit: (normalizedPlan, renderMeta) => typographyAudit(plan, normalizedPlan, renderMeta),
      semanticFrame: (s, index, total) => semanticFrame(plan, s, deps.contentSignals(plan, s, index, total)),
      semanticMeaning: (s, index, total) => semanticMeaning(plan, s, deps.contentSignals(plan, s, index, total)),
      visualAestheticModel: (normalizedPlan) => visualAestheticModel(plan, normalizedPlan),
      industryKnowledgeAudit: (normalizedPlan) => industryKnowledgeAudit(plan, normalizedPlan)
    };
  }

  return {
    makeDeckContext
  };
}

module.exports = {
  createDeckContextHelpers
};

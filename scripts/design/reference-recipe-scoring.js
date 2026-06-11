function recipeFamilySet(recipe = {}) {
  return new Set([
    recipe.renderType,
    recipe.slideType,
    ...(recipe.pageFamilies || []),
    ...((recipe.designSyntax && recipe.designSyntax.suitablePageFamilies) || [])
  ].filter(Boolean));
}

function requestedVariantForSlide(s = '') {
  return String(s.layoutVariant || s.variant || s.proofObject || s.proof_object || '').trim();
}

function documentTypeForPlan(plan = {}) {
  return plan.documentType ||
    (plan.materialIntelligence && plan.materialIntelligence.pptType) ||
    plan.ppt_type ||
    plan.pptType ||
    '';
}

function explicitReferenceCategories(plan = {}, s = {}, compactUnique = values => values) {
  return compactUnique([
    ...(Array.isArray(plan.referenceCategoryIds) ? plan.referenceCategoryIds : []),
    ...(Array.isArray(s.referenceCategoryIds) ? s.referenceCategoryIds : []),
    s.referenceCategoryId,
    s.categoryId
  ]);
}

function createRecipeScoreContext(plan = {}, s = {}, opts = {}, deps = {}) {
  const {
    compactUnique = values => Array.from(new Set((values || []).filter(Boolean))),
    contentSignals = () => ({}),
    flattenText = value => String(value || ''),
    highValuePageFamilies = new Set(),
    industryMatchIds = value => [value].filter(Boolean),
    slideRole = () => '',
    textKeywords = text => String(text || '').toLowerCase().split(/[^a-z0-9\u4e00-\u9fff%％+-]+/).filter(Boolean),
    themeIntentFor = () => ''
  } = deps;
  const signals = opts.signals || contentSignals(plan, s);
  const text = flattenText(s);
  const industry = plan.industry || 'general-operations';
  return {
    compactUnique,
    documentType: documentTypeForPlan(plan),
    explicitReferenceCategories: explicitReferenceCategories(plan, s, compactUnique),
    highValuePageFamilies,
    industryIds: new Set(industryMatchIds(industry)),
    plan,
    requestedVariant: requestedVariantForSlide(s),
    role: slideRole(s),
    s,
    signals,
    text,
    themeIntent: s.themeIntent || (s.compositionPlan && s.compositionPlan.themeIntent) || themeIntentFor(plan, s, signals.index || 0, signals.total || 1, signals),
    words: new Set(textKeywords(text))
  };
}

function addExplicitRouteScore(recipe = {}, context = {}) {
  let score = 0;
  const { requestedVariant, highValuePageFamilies, s } = context;
  const recipeFamilies = recipeFamilySet(recipe);
  const exactVariantMatch = Boolean(requestedVariant && (
    recipe.layoutVariant === requestedVariant ||
    recipe.proofObject === requestedVariant ||
    (recipe.designSyntax && recipe.designSyntax.proofObject === requestedVariant)
  ));
  const requestedVariantIsPriority = highValuePageFamilies.has(requestedVariant);
  if (exactVariantMatch) score += requestedVariantIsPriority ? 24 : 10;
  else if (requestedVariantIsPriority) score -= 4;
  if (s.type && s.type !== 'auto') {
    if (recipeFamilies.has(s.type)) score += 3;
    else score -= exactVariantMatch ? 1 : 6;
  }
  return score;
}

function addIndustryAndRoleScore(recipe = {}, context = {}) {
  let score = 0;
  const { compactUnique, highValuePageFamilies, industryIds, role } = context;
  const recipeIndustryFit = compactUnique([
    ...(recipe.industryFit || []),
    ...((recipe.designSyntax && recipe.designSyntax.industry) || []),
    ...(recipe.industry || [])
  ]);
  const recipeHasIndustryFit = recipeIndustryFit.length > 0;
  const industryMatches = recipeIndustryFit.some(id => industryIds.has(id));
  if ((recipe.roles || []).includes(role)) score += 3;
  if (industryMatches) score += 5;
  else if (recipeHasIndustryFit && highValuePageFamilies.has(recipe.layoutVariant || recipe.proofObject || '')) score -= 7;
  return score;
}

function addSignalAndTaxonomyScore(recipe = {}, context = {}) {
  let score = 0;
  const { documentType, explicitReferenceCategories, plan, s, text, themeIntent, words } = context;
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
  return score;
}

function addSemanticSignalScore(recipe = {}, context = {}) {
  let score = 0;
  const { signals, text, s } = context;
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
  return score;
}

function addEnergyChargingServiceScore(recipe = {}, context = {}) {
  const plan = context.plan || {};
  if (plan.industry !== 'energy-utility') return 0;
  const deckText = [
    plan.title,
    plan.subtitle,
    plan.organization,
    context.text
  ].filter(Boolean).join(' ');
  if (!/新能源汽车|充电服务|充电枪|快充站|车队|补能|站点|ROI/i.test(deckText)) return 0;
  const recipeText = [
    recipe.id,
    recipe.renderType,
    recipe.layoutVariant,
    recipe.proofObject,
    recipe.themeIntent,
    ...(recipe.signals || []),
    ...((recipe.taxonomy && recipe.taxonomy.labels) || []),
    recipe.taxonomy && recipe.taxonomy.documentType,
    recipe.source && recipe.source.categoryId
  ].filter(Boolean).join(' ').toLowerCase();
  let score = 0;
  if (/energy|utility|operations|service|运营|站点|site|charging|charge/.test(recipeText)) score += 8;
  if (/financial|finance|investment|horiba|金融|投资|财务策略|financial-strategy/.test(recipeText)) score -= 30;
  if (/beauty|consumer|fashion|cosmetic|美妆|美容|时尚/.test(recipeText)) score -= 10;
  if (/culture|people|healthcare|government|saas/.test(recipeText)) score -= 6;
  return score;
}

function scoreReferenceRecipe(recipe = {}, context = {}) {
  return addExplicitRouteScore(recipe, context) +
    addIndustryAndRoleScore(recipe, context) +
    addSignalAndTaxonomyScore(recipe, context) +
    addSemanticSignalScore(recipe, context) +
    addEnergyChargingServiceScore(recipe, context);
}

function createReferenceRecipeScoringHelpers(deps = {}) {
  function referenceRecipeCandidates(plan = {}, s = {}, opts = {}) {
    const recipes = [
      ...(deps.referenceLayoutLibrary && deps.referenceLayoutLibrary.recipes || []),
      ...(deps.referenceRecipeLibrary && deps.referenceRecipeLibrary.recipes || []),
      ...(deps.priorityPageFamilyRecipes || [])
    ];
    if (!recipes.length) return [];
    const context = createRecipeScoreContext(plan, s, opts, deps);
    const scores = recipes.map(recipe => Object.assign({ score: scoreReferenceRecipe(recipe, context) }, recipe))
      .filter(recipe => recipe.score > 0)
      .sort((a,b) => b.score - a.score);
    return typeof opts.limit === 'number' ? scores.slice(0, opts.limit) : scores;
  }

  function recipeCompatibleWithSlideType(recipe = null, type = '') {
    if (!recipe || !type) return false;
    return recipeFamilySet(recipe).has(type);
  }

  return {
    recipeCompatibleWithSlideType,
    referenceRecipeCandidates
  };
}

module.exports = {
  createReferenceRecipeScoringHelpers,
  recipeFamilySet,
  scoreReferenceRecipe
};

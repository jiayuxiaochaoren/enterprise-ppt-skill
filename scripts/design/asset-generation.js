const ASSET_GENERATION_DECISION_SOURCE = 'asset-generation-policy/v1';
const {
  ASSET_TARGET_CONTRACT_VERSION,
  assetRoleNeedsImage,
  assetTargetContract,
  generatedAssetTargetSpec,
  generatedPromptAspectConflict,
  normalizeAssetRole,
  recipeGenerationRule,
  stripPromptAspectConflicts
} = require('./asset-target-contract');
const {
  withAssetDecisionState
} = require('./asset-decision-state');
const { createGeneratedAssetPrompt } = require('./asset-generation-prompt');

function withDecisionSource(policy = {}) {
  return withAssetDecisionState(Object.assign({
    decisionSource: ASSET_GENERATION_DECISION_SOURCE
  }, policy || {}));
}

function createAssetGenerationHelpers({
  factualGeneratedAssetRisk = /$a/,
  flattenText = value => String(value || ''),
  industryVisualPolicy = () => ({}),
  mediaForRole = () => '',
  referenceLayoutLibrary = {},
  resolveVisualMode = () => '',
  selectPaletteName = () => '',
  slideDesign = () => ({}),
  slideRole = () => ''
} = {}) {
  function isCoverSlide(plan = {}, s = {}, design = {}) {
    return s.type === 'cover' || design.role === 'cover' || slideRole(s) === 'cover';
  }

  function coverArchetype(plan = {}, s = {}) {
    return String(
      s.coverArchetype ||
      s.cover_archetype ||
      (s.compositionPlan && s.compositionPlan.industryExpression && s.compositionPlan.industryExpression.coverArchetype) ||
      plan.coverArchetype ||
      plan.cover_archetype ||
      ''
    ).trim().toLowerCase();
  }

  function explicitFactualVisualRequest(s = {}, recipe = null, design = null, role = '') {
    const visual = s.visual || {};
    const text = flattenText([
      visual.role,
	      visual.prompt,
	      visual.caption,
	      visual.source,
	      s.title,
	      s.subtitle,
	      s.claim,
	      s.support,
	      s.display_copy && Object.values(s.display_copy).join(' '),
	      s.assetBrief,
	      s.proofObject,
	      s.proof_object,
      s.layoutVariant,
      s.variant,
      s.mainVisualMethod,
      s.coverInsight,
      recipe && recipe.assetRole,
      recipe && recipe.proofObject,
      recipe && recipe.mainVisualMethod,
      recipe && recipe.generatedAsset,
      design && design.imageRole,
      role
    ].filter(Boolean).join(' '));
    const factualCue = /真实|实拍|授权|客户|案例|现场|截图|截屏|证书|认证|门店|工厂|平台页面|产品图|SKU图|商品图|actual|real|customer|case|site|field|screenshot|certificate|credential|store|factory|product photo/i.test(text);
    const syntheticCue = /示意|抽象|概念|氛围|背景|类别|通用|原型|非真实|不伪造真实|非事实|generic|abstract|concept|mood|atmospheric|illustrative|synthetic|prototype|mockup|non-factual/i.test(text);
    return factualCue && !syntheticCue;
  }

  const generatedAssetPrompt = createGeneratedAssetPrompt({
    assetTargetContract,
    industryVisualPolicy,
    normalizeAssetRole,
    referenceLayoutLibrary,
    selectPaletteName,
    slideDesign,
    stripPromptAspectConflicts
  });

  function generatedAssetPolicy(plan = {}, s = {}, recipe = null, design = null) {
    const originalRole = (s.visual && s.visual.role) || (design && design.imageRole) || (recipe && recipe.assetRole) || 'abstract';
    const role = normalizeAssetRole(originalRole);
    const recipeExplicitNoAsset = Boolean(recipe && String(recipe.assetRole || '').toLowerCase() === 'none');
    const target = assetTargetContract(plan, s, originalRole, { normalizedRole: role });
    const rule = recipeGenerationRule(recipe || {});
    const text = flattenText(s);
    const slideHasImages = (Array.isArray(s.images) && s.images.length > 0) ||
      (s.visual && Array.isArray(s.visual.images) && s.visual.images.length > 0) ||
      Boolean(s.image || (s.visual && s.visual.image));
    const existingAsset = mediaForRole(plan, s, slideRole(s), { includeDefault:false });
    const requested = (s.visual && s.visual.mode === 'generated') || s.assetMode === 'generated';
    const hasBoundAsset = slideHasImages || (Boolean(existingAsset) && !requested);
    const componentIds = [
      ...((s.componentPlan && Array.isArray(s.componentPlan.componentIds)) ? s.componentPlan.componentIds : []),
      ...((s.componentPlan && Array.isArray(s.componentPlan.components)) ? s.componentPlan.components.map(component => component && component.id) : [])
    ].filter(Boolean);
    const hasVisualProofComponent = componentIds.some(id => /hero-image|proof-gallery|proof-gallery-grid|caption-bar|brand-proof-caption|luxury-caption-bar|source-caption|evidence-frame/i.test(id));
    const nativeStructureRoutes = new Set([
      'architecture',
      'architecture-dark',
      'cards',
      'executive-blocks',
      'finance-bridge',
      'industry-chart',
      'metric-comparison',
      'module-matrix',
      'portfolio-table',
      'report-board',
      'risk-table',
      'strategy-map',
      'timeline',
      'timeline-dark',
      'two-column',
      'two-column-clean',
      'value-tiles'
    ]);
    const structuralProductEvidenceOnly = componentIds.includes('product-matrix') &&
      !hasVisualProofComponent &&
      !slideHasImages &&
      !hasBoundAsset &&
      ['report-board', 'metric-comparison', 'industry-chart', 'cards', 'two-column', 'two-column-clean', 'module-matrix', 'value-tiles'].includes(String(s.type || ''));
    const policy = industryVisualPolicy(plan);
    const recipeNeedsImage = recipe && assetRoleNeedsImage(recipe.assetRole || role);
    const routeMode = resolveVisualMode(plan, s, slideRole(s));
    const referenceText = String((recipe && [
      recipe.generatedAsset, recipe.layoutVariant, recipe.proofObject, recipe.assetRole, recipe.mainVisualMethod, recipe.themeIntent, recipe.renderType
    ].filter(Boolean).join(' ')) || '');
    const imageLedReference = recipeNeedsImage &&
      /captioned-real-asset|showcase|gallery|proof|cover|product|beauty|people|lookbook/i.test(referenceText);
    const recipeCanGenerate = ['optional', 'allowed'].includes(rule) || (rule === 'none' && imageLedReference);
    const autoGenerateMissing = ['auto-generate-missing', 'generate-missing', 'luxury', 'image-rich'].includes(String(plan.assetMode || plan.visualIntent || ''));
    const visualIntentText = String(plan.assetMode || plan.visualIntent || plan.visualDensity || s.visualIntent || s.visualDensity || '');
    const imageLedEligibleRoute = !['toc', 'toc-clean', 'agenda', 'chapter-divider'].includes(String(s.type || ''));
    const imageLedSlideRequest = imageLedEligibleRoute &&
      !recipeExplicitNoAsset &&
      ['auto-generate-missing', 'generate-missing', 'luxury', 'image-rich', 'asset-led', 'case-led'].includes(visualIntentText) &&
      (
        hasVisualProofComponent ||
        /image|gallery|lookbook|editorial|brand[- ]?world|visual|cover|showcase|proof|photo|图册|封面|品牌世界|证据/i.test(String([
          s.proofObject, s.proof_object, s.layoutVariant, s.variant, s.title
        ].filter(Boolean).join(' ')))
      );
    const coverPreset = design && design.coverStylePreset ? design.coverStylePreset : null;
    const coverArchetypeId = coverArchetype(plan, s);
    const coverStyleRequestsAsset = isCoverSlide(plan, s, design) &&
      coverPreset &&
      coverPreset.assetPolicy &&
      coverPreset.assetPolicy !== 'none' &&
      design &&
      design.wantsImage;
    const policyCoverRole = (policy.photoRoles || []).includes('cover') ||
      ((policy.optionalPhotoRoles || []).includes('cover') && ['image-rich', 'case-led', 'asset-led', 'luxury'].includes(String(plan.assetMode || plan.visualIntent || '')));
    const coverStyleNeedsAsset = coverStyleRequestsAsset &&
      (hasBoundAsset || requested || policyCoverRole || policy.visualMode === 'case-gallery' || policy.visualMode === 'hybrid');
    const nativeStructureEvidenceOnly = nativeStructureRoutes.has(String(s.type || '')) &&
      !hasVisualProofComponent &&
      !slideHasImages &&
      !hasBoundAsset &&
      !requested &&
      !coverStyleNeedsAsset &&
      !imageLedSlideRequest;
    const nativeIndustrialCoverWithoutAsset = isCoverSlide(plan, s, design) &&
      coverArchetypeId === 'native-industrial-structure-cover' &&
      !slideHasImages &&
      !hasBoundAsset &&
      !requested &&
      !coverStyleRequestsAsset &&
      !coverStyleNeedsAsset &&
      !imageLedSlideRequest;
    const syntheticOnly = /synthetic|abstract|generic|placeholder|mood|atmospheric|concept|mock/i.test(String(recipe && recipe.generatedAsset || '')) ||
      ['background', 'showcase', 'gallery', 'abstract'].includes(role) ||
      Boolean(coverStyleNeedsAsset && !hasBoundAsset);
    const coverSlide = isCoverSlide(plan, s, design);
    const coverExplicitFactualRisk = coverSlide && explicitFactualVisualRequest(s, recipe, design, role);
    const factualRisk = factualGeneratedAssetRisk.test(text) &&
      ['evidence', 'gallery', 'showcase'].includes(role) &&
      (!coverSlide || coverExplicitFactualRisk);
    const shouldGenerate = !hasBoundAsset && (
      requested ||
      imageLedSlideRequest ||
      coverStyleNeedsAsset ||
      (autoGenerateMissing && (recipeNeedsImage || (design && design.wantsImage))) ||
      (recipeNeedsImage && recipeCanGenerate && routeMode !== 'solid') ||
      (recipeNeedsImage && recipeCanGenerate && ['case-gallery', 'hybrid'].includes(policy.visualMode || ''))
    );
    if (structuralProductEvidenceOnly && !requested && !coverStyleNeedsAsset) {
      const structuralTarget = assetTargetContract(plan, s, 'abstract', { normalizedRole: 'abstract' });
      return withDecisionSource({
        status: 'none',
        role: 'abstract',
        originalRole: target.originalRole || originalRole,
        resolvedRole: 'abstract',
        target: structuralTarget,
        mustBind: false,
        structureOnly: true,
        syntheticOnly: true,
        reason: 'structured product evidence renders natively without gallery imagery'
      });
    }
    if (nativeStructureEvidenceOnly) {
      const structuralTarget = assetTargetContract(plan, s, 'abstract', { normalizedRole: 'abstract' });
      return withDecisionSource({
        status: 'none',
        role: 'abstract',
        originalRole: target.originalRole || originalRole,
        resolvedRole: 'abstract',
        target: structuralTarget,
        mustBind: false,
        structureOnly: true,
        syntheticOnly: true,
        reason: 'native structural route renders without generated imagery'
      });
    }
    if (nativeIndustrialCoverWithoutAsset) {
      const structuralTarget = assetTargetContract(plan, s, 'abstract', { normalizedRole: 'abstract' });
      return withDecisionSource({
        status: 'none',
        role: 'abstract',
        originalRole: target.originalRole || originalRole,
        resolvedRole: 'abstract',
        target: structuralTarget,
        mustBind: false,
        structureOnly: true,
        syntheticOnly: true,
        reason: 'native industrial cover archetype renders without generated imagery when no bound asset is available'
      });
    }
    if (!shouldGenerate) {
      return withDecisionSource({
        status: hasBoundAsset ? 'bound' : 'none',
        role,
        originalRole: target.originalRole || originalRole,
        resolvedRole: target.resolvedRole || role,
        target,
        mustBind: false,
        syntheticOnly,
        reason: hasBoundAsset ? 'real or generated asset already bound' : 'layout can render natively without generated image'
      });
    }
    if (rule === 'blocked' || (factualRisk && (requested || recipeCanGenerate || coverStyleNeedsAsset))) {
      return withDecisionSource({
        status: 'blocked',
        role,
        originalRole: target.originalRole || originalRole,
        resolvedRole: target.resolvedRole || role,
        target,
        mustBind: false,
        syntheticOnly: true,
        reason: rule === 'blocked'
          ? 'reference recipe disallows generated assets for this proof object'
          : 'visible content implies factual/customer/site evidence; generated assets cannot substitute for proof'
      });
    }
    return withDecisionSource({
      status: requested || autoGenerateMissing || coverStyleNeedsAsset || imageLedSlideRequest ? 'required' : 'optional',
      role,
      originalRole: target.originalRole || originalRole,
      resolvedRole: target.resolvedRole || role,
      target,
      mustBind: requested || autoGenerateMissing || coverStyleNeedsAsset || imageLedSlideRequest,
      syntheticOnly,
      reason: coverStyleNeedsAsset
        ? 'cover style preset requires a bound hero asset'
        : (imageLedSlideRequest
          ? 'image-led proof page requires a bound or generated visual asset'
        : (requested || autoGenerateMissing
          ? 'slide explicitly requests generated visual asset'
        : 'reference layout can use a generated bitmap when no source image is available'
        ))
    });
  }

  return {
    assetTargetContract,
    assetRoleNeedsImage,
    generatedAssetPolicy,
    generatedAssetPrompt,
    generatedPromptAspectConflict,
    normalizeAssetRole,
    recipeGenerationRule
  };
}

module.exports = { ASSET_GENERATION_DECISION_SOURCE, ASSET_TARGET_CONTRACT_VERSION, assetTargetContract, assetRoleNeedsImage, generatedPromptAspectConflict, generatedAssetTargetSpec, createAssetGenerationHelpers, normalizeAssetRole, recipeGenerationRule };

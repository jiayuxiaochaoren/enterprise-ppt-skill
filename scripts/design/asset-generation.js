function normalizeAssetRole(role = '') {
  const r = String(role || '').toLowerCase();
  if (r.includes('background')) return 'background';
  if (r.includes('showcase') || r.includes('product')) return 'showcase';
  if (r.includes('gallery')) return 'gallery';
  if (r.includes('evidence') || r.includes('screenshot') || r.includes('map') || r.includes('portrait')) return 'evidence';
  return ['background', 'showcase', 'evidence', 'gallery'].includes(r) ? r : 'abstract';
}

function assetRoleNeedsImage(role = '') {
  const r = String(role || '').toLowerCase();
  if (!r || ['none', 'diagram', 'structure', 'comparison'].includes(r)) return false;
  if (r.includes('none-or') || r.includes('or-none')) return false;
  return true;
}

function recipeGenerationRule(recipe = {}) {
  const text = String(recipe.generatedAsset || '').toLowerCase();
  if (!text || text === 'none' || text.includes('none;')) return 'none';
  if (text.includes('not allowed') || text.includes('disallow') || text.includes('blocked')) return 'blocked';
  if (text.includes('optional')) return 'optional';
  if (text.includes('allowed') || text.includes('create')) return 'allowed';
  return 'none';
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
  function generatedAssetPrompt(plan = {}, s = {}, recipe = null) {
    const design = slideDesign(plan, s);
    const role = (s.visual && s.visual.role) || design.imageRole || (recipe && recipe.assetRole) || 'abstract';
    const normalizedRole = normalizeAssetRole(role);
    const patterns = referenceLayoutLibrary.generatedAssetPromptPatterns || {};
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
    const factualRisk = factualGeneratedAssetRisk.test(text) && ['evidence', 'gallery', 'showcase'].includes(role);
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

  return {
    assetRoleNeedsImage,
    generatedAssetPolicy,
    generatedAssetPrompt,
    normalizeAssetRole,
    recipeGenerationRule
  };
}

module.exports = {
  assetRoleNeedsImage,
  createAssetGenerationHelpers,
  normalizeAssetRole,
  recipeGenerationRule
};

function createGeneratedAssetPrompt({
  assetTargetContract,
  industryVisualPolicy = () => ({}),
  normalizeAssetRole,
  referenceLayoutLibrary = {},
  selectPaletteName = () => '',
  slideDesign = () => ({}),
  stripPromptAspectConflicts
} = {}) {
  return function generatedAssetPrompt(plan = {}, s = {}, recipe = null) {
    const design = slideDesign(plan, s);
    const role = (s.visual && s.visual.role) || design.imageRole || (recipe && recipe.assetRole) || 'abstract';
    const normalizedRole = normalizeAssetRole(role);
    const coverPreset = design.coverStylePreset || null;
    if ((s.type === 'cover' || design.role === 'cover') && coverPreset && coverPreset.assetPromptIntent) {
      const target = assetTargetContract(plan, s, role);
      const cleanBase = stripPromptAspectConflicts(coverPreset.assetPromptIntent, target);
      const flavor = String(coverPreset.rendererFlavor || '').toLowerCase();
      const targetGuidance = flavor === 'brand-product-showcase'
        ? [
          'Use case: premium enterprise PPT cover right-side hero panel.',
          'The bitmap occupies only the right visual panel; do not reserve blank copy space inside the image.',
          'Make the whole image continuous edge-to-edge with no vertical mask, split panel, blank safety strip, vignette wall, or faded half-panel.',
          'Keep the main visual as a credible object or scene, not decoration.'
        ]
        : [
          'Use case: premium enterprise PPT cover hero image.',
          'Respect the declared text-safe zone and keep the main visual as a credible object or scene, not decoration.'
        ];
      return [cleanBase, ...targetGuidance, target.instruction || ''].filter(Boolean).join(' ');
    }
    const patterns = referenceLayoutLibrary.generatedAssetPromptPatterns || {};
    const pattern = patterns[normalizedRole] || patterns.abstract;
    if (!pattern) return '';
    const profile = industryVisualPolicy(plan);
    const industryLabel = profile.label || plan.industry || 'business';
    const visualBrief = (s.visual && s.visual.prompt) || s.assetBrief || s.coverInsight || s.claim || s.subtitle || s.title || plan.title || 'premium commercial visual';
    const paletteName = selectPaletteName(plan);
    const target = assetTargetContract(plan, s, role);
    const base = pattern
      .replace(/\{industryLabel\}/g, industryLabel)
      .replace(/\{visualBrief\}/g, String(visualBrief).replace(/\s+/g, ' ').trim())
      .replace(/\{paletteName\}/g, paletteName);
    const cleanBase = stripPromptAspectConflicts(base, target);
    return target.instruction ? `${cleanBase} ${target.instruction}` : cleanBase;
  };
}

module.exports = {
  createGeneratedAssetPrompt
};
